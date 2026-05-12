import * as React from 'react';
import { ISession, ISessionParticipant, IInsightsJson } from '../types';
import { SESSION_CREATION_REASON, SESSION_CLOSURE_REASON, PARTICIPANT_MODE } from '../types/sessionConstants';
import { useStrings } from '../i18n/StringsContext';
import { IStrings } from '../i18n/strings';

interface IJourneyPanelProps {
    sessions: ISession[];
    insightsJson: IInsightsJson | null;
    conversationClosedon: string | null;
    conversationStatecode: number;
    isExpanded: boolean;
    participantsBySession: Map<string, ISessionParticipant[]>;
    participantsLoading: boolean;
    onExpand: () => void;
    onCollapse: () => void;
}

type SentimentZone = 'positive' | 'negative' | 'neutral';

function formatTime(isoString: string | null): string {
    if (!isoString) return '';
    try {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

function formatDuration(startMs: number, endMs: number, labelLessThan1Min: string): string {
    const mins = Math.round((endMs - startMs) / 60000);
    if (mins < 1) return labelLessThan1Min;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
}

function computeQueueWait(session: ISession): string | null {
    if (!session.msdyn_agentacceptedon || !session.msdyn_queueassignedon) return null;
    const waitMs = new Date(session.msdyn_agentacceptedon).getTime() -
                   new Date(session.msdyn_queueassignedon).getTime();
    if (waitMs < 0) return null;
    const s = Math.round(waitMs / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

const COPILOT_LOGO_URL = '/WebResources/alex_copilot_logo';

function getSessionInfo(index: number, session: ISession, strings: IStrings): { label: string; icon: string } {
    if (session.msdyn_botengagementmode != null) {
        return { label: strings.labelBotSession, icon: '' }; // icon rendered via CSS background-image on j-icon--bot
    }
    if (session.msdyn_sessioncreationreason != null) {
        if (session.msdyn_sessioncreationreason === SESSION_CREATION_REASON.INITIAL) {
            return { label: strings.labelInitialCall, icon: '📞' };
        }
        if (session.msdyn_sessioncreationreason === SESSION_CREATION_REASON.TRANSFER
            && session.msdyn_agentacceptedon === null) {
            return { label: strings.labelTransferDeclined, icon: '✗' };
        }
        return { label: strings.labelTransfer, icon: '⟶' };
    }
    // Legacy heuristic fallback for records without creation reason
    if (index === 0) return { label: strings.labelInitialCall, icon: '📞' };
    const durationMs = session.actualend
        ? new Date(session.actualend).getTime() - new Date(session.createdon).getTime()
        : null;
    if (durationMs !== null && durationMs < 45000) return { label: strings.labelTransfer, icon: '⟶' };
    return { label: strings.labelEscalation, icon: '👥' };
}

function isDeclinedTransfer(session: ISession): boolean {
    return session.msdyn_sessioncreationreason === SESSION_CREATION_REASON.TRANSFER
        && session.msdyn_agentacceptedon === null;
}

function computeSessionSentiment(
    sessionIndex: number,
    sessions: ISession[],
    insightsJson: IInsightsJson | null
): SentimentZone {
    if (!insightsJson?.messageInsights?.length) return 'neutral';

    const total = insightsJson.messageInsights.length;
    const durations = sessions.map(s => {
        const start = new Date(s.createdon).getTime();
        const end = s.actualend ? new Date(s.actualend).getTime() : start + 60000;
        return Math.max(1000, end - start);
    });
    const totalDuration = durations.reduce((a, b) => a + b, 0);

    let startIdx = 0;
    for (let i = 0; i < sessionIndex; i++) {
        startIdx += Math.round((durations[i] / totalDuration) * total);
    }
    const endIdx = sessionIndex < sessions.length - 1
        ? startIdx + Math.round((durations[sessionIndex] / totalDuration) * total)
        : total;

    const windowSlice = insightsJson.messageInsights.slice(
        Math.min(startIdx, total - 1),
        Math.min(endIdx, total)
    );
    if (!windowSlice.length) return 'neutral';

    let pos = 0, neg = 0;
    for (const mi of windowSlice) {
        const z = mi.sentiments.zone.toLowerCase();
        if (z === 'positive') pos++;
        else if (z === 'negative') neg++;
    }
    const threshold = windowSlice.length * 0.25;
    if (neg > pos && neg >= threshold) return 'negative';
    if (pos > neg && pos >= threshold) return 'positive';
    return 'neutral';
}

function sentimentLabel(zone: SentimentZone, strings: IStrings): string {
    if (zone === 'positive') return strings.labelSentimentPositive;
    if (zone === 'negative') return strings.labelSentimentNegative;
    return strings.labelSentimentNeutral;
}

// ── Agent Avatar with D365 profile photo ─────────────────────────────────────

const AgentAvatar: React.FC<{ ownerId: string | null; name: string | null }> = ({ ownerId, name }) => {
    const [imgFailed, setImgFailed] = React.useState(false);

    const initials = React.useMemo(() => {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }, [name]);

    const showImg = ownerId && !imgFailed;

    return (
        <div className="j-agent-row">
            <div className="j-agent-avatar" aria-hidden="true">
                {showImg ? (
                    <img
                        src={`/api/data/v9.2/systemusers(${ownerId})/entityimage/$value`}
                        alt=""
                        className="j-agent-photo"
                        onError={() => setImgFailed(true)}
                    />
                ) : (
                    <span className="j-agent-initials">{initials}</span>
                )}
            </div>
            {name && <span className="j-agent-name">{name}</span>}
        </div>
    );
};

// ── JourneyPanel ─────────────────────────────────────────────────────────────

export const JourneyPanel: React.FC<IJourneyPanelProps> = ({
    sessions, insightsJson, conversationClosedon, conversationStatecode,
    isExpanded, participantsBySession, participantsLoading, onExpand, onCollapse
}) => {
    const strings = useStrings();
    if (!sessions || sessions.length === 0) return null;

    const firstSession = sessions[0];
    const lastSession = sessions[sessions.length - 1];
    const isClosed = conversationStatecode === 1;

    const totalStartMs = new Date(firstSession.createdon).getTime();
    const totalEndMs = conversationClosedon
        ? new Date(conversationClosedon).getTime()
        : lastSession.actualend
            ? new Date(lastSession.actualend).getTime()
            : null;
    const totalDurationStr = totalEndMs
        ? formatDuration(totalStartMs, totalEndMs, strings.labelLessThan1Min)
        : null;

    return (
        <div className={`sidebar-section journey-section${isExpanded ? ' journey-section--expanded' : ''}`}>
            <div className="section-title">
                <span>{strings.labelConversationJourney}</span>
                <div className="section-title-actions">
                    {totalDurationStr && (
                        <span className="journey-total-duration"
                            aria-label={`${strings.labelTotalDuration} ${totalDurationStr}`}>
                            {strings.labelTotalDuration}: <strong>{totalDurationStr}</strong>
                        </span>
                    )}
                    <button
                        type="button"
                        className={`ghost-btn${isExpanded ? ' ghost-btn--active' : ''}`}
                        onClick={isExpanded ? onCollapse : onExpand}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? strings.labelJourneyCollapse : strings.labelJourneyExpand}
                    >
                        {isExpanded ? `${strings.labelJourneyCollapse} ⌃` : `${strings.labelJourneyExpand} ⌄`}
                    </button>
                </div>
            </div>

            <div className="journey" role="list" aria-label={strings.labelConversationJourney}>
                {sessions.map((session, i) => {
                    const sentiment = computeSessionSentiment(i, sessions, insightsJson);
                    const { label, icon } = getSessionInfo(i, session, strings);
                    const agentName =
                        (session as unknown as Record<string, unknown>)[
                            '_ownerid_value@OData.Community.Display.V1.FormattedValue'
                        ] as string | null ?? null;
                    const queueName =
                        (session as unknown as Record<string, unknown>)[
                            '_msdyn_cdsqueueid_value@OData.Community.Display.V1.FormattedValue'
                        ] as string | null ?? null;
                    const timeStr = formatTime(session.createdon);
                    const sessionStart = new Date(session.createdon).getTime();
                    const sessionEnd = session.actualend ? new Date(session.actualend).getTime() : null;
                    const durationStr = sessionEnd
                        ? formatDuration(sessionStart, sessionEnd, strings.labelLessThan1Min)
                        : '';
                    const isActive = session.statecode === 0;
                    const declined = isDeclinedTransfer(session);

                    // In expanded mode, render declined transfers as a special card
                    if (isExpanded && declined) {
                        return (
                            <div key={session.activityid} className="j-declined-card" role="listitem">
                                <span className="j-declined-icon" aria-hidden="true">⚠️</span>
                                <div className="j-body">
                                    <div className="j-label">{strings.labelTransferDeclined}</div>
                                    <div className="j-meta">
                                        {agentName != null && <AgentAvatar ownerId={session._ownerid_value ?? null} name={agentName} />}
                                        {timeStr && <span>{timeStr}</span>}
                                        <span>{strings.labelNeverAccepted}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={session.activityid}
                            className={`j-item j-item--${sentiment}${isActive ? ' j-active' : ''}`}
                            role="listitem"
                            aria-current={isActive ? 'step' : undefined}
                        >
                            <div className="j-icon-col">
                                <div className={`j-icon j-icon--${sentiment}${session.msdyn_botengagementmode != null ? ' j-icon--bot' : ''}`} aria-hidden="true">
                                    {icon}
                                </div>
                            </div>
                            <div className="j-body">
                                <div className="j-header">
                                    <span className="j-label">{label}</span>
                                    <span className={`j-sentiment j-sentiment--${sentiment}`}>
                                        {sentimentLabel(sentiment, strings)}
                                    </span>
                                </div>
                                {agentName != null && <AgentAvatar ownerId={session._ownerid_value ?? null} name={agentName} />}

                                {/* Expanded-only enriched details */}
                                {isExpanded && (
                                    <div className="j-expanded-details">
                                        {/* Queue pill + wait pill */}
                                        {(queueName != null || computeQueueWait(session) != null) && (
                                            <div className="j-pills">
                                                {queueName && (
                                                    <span className="j-queue-tag">
                                                        {strings.labelQueuedIn} {queueName}
                                                    </span>
                                                )}
                                                {computeQueueWait(session) && (
                                                    <span className="j-wait-tag">
                                                        {strings.labelQueueWait} {computeQueueWait(session)}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Bot badge */}
                                        {session.msdyn_botengagementmode != null && (
                                            <span className="j-queue-tag j-queue-tag--bot">
                                                <img src={COPILOT_LOGO_URL} alt="" width="14" style={{ display: 'inline-block', verticalAlign: 'middle', marginInlineEnd: '3px', flexShrink: 0 }} />
                                                {strings.labelBotSession}
                                            </span>
                                        )}

                                        {/* Consult block or skeleton */}
                                        {participantsLoading ? (
                                            <div className="j-skeleton" aria-busy="true"
                                                aria-label="Loading participant details">
                                                <div className="skeleton-line" style={{ width: '80%' }} />
                                                <div className="skeleton-line" style={{ width: '55%' }} />
                                            </div>
                                        ) : (() => {
                                            const consultants = (participantsBySession.get(session.activityid) ?? [])
                                                .filter(p => p.msdyn_mode === PARTICIPANT_MODE.CONSULTING);
                                            return consultants.length > 0 ? (
                                                <div className="j-consult-block">
                                                    <strong>{strings.labelConsultJoined}</strong>
                                                    {consultants.map(p => (
                                                        <div key={p.msdyn_sessionparticipantid}>
                                                            {p.msdyn_name ?? '—'}
                                                            {p.msdyn_consultmode === 2
                                                                ? ` ${strings.labelConsultTransferred}`
                                                                : ''}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null;
                                        })()}

                                        {/* Wrap-up milestone */}
                                        {session.msdyn_wrapupinitiatedon && (
                                            <div className="j-meta">
                                                <span>⏱ {strings.labelWrapUpStarted}: {formatTime(session.msdyn_wrapupinitiatedon)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(timeStr || durationStr) && (
                                    <div className="j-meta">
                                        {timeStr && <span>{timeStr}</span>}
                                        {durationStr && <span>{durationStr}</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Closed milestone */}
                {isClosed && (
                    <div className="j-item j-item--closed" role="listitem">
                        <div className="j-icon-col">
                            <div className="j-icon j-icon--closed" aria-hidden="true">✓</div>
                        </div>
                        <div className="j-body">
                            <div className="j-header">
                                <span className="j-label">{strings.labelClosed}</span>
                            </div>
                            {conversationClosedon && (
                                <div className="j-meta">
                                    <span>{formatTime(conversationClosedon)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

