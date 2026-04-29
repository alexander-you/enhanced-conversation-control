import * as React from 'react';
import {
    IConversation, IInsight, IInsightsJson, ISession, ISessionParticipant
} from '../types';
import { SESSION_CREATION_REASON, PARTICIPANT_MODE } from '../types/sessionConstants';
import { useStrings } from '../i18n/StringsContext';

interface IInsightsDashboardProps {
    conversation:          IConversation | null;
    sessions:              ISession[];
    insight:               IInsight | null;
    insightsJson:          IInsightsJson | null;
    participantsBySession: Map<string, ISessionParticipant[]>;
    onClose:               () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatSeconds(n: number | null | undefined): string {
    if (n === null || n === undefined) return '—';
    const s = Math.round(n);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatRatio(r: number | null): string {
    if (r === null || r === undefined) return '—';
    return `${Math.round(r * 100)}%`;
}

function formatPauseMs(ms: number | null): string {
    if (ms === null || ms === undefined) return '—';
    return `${(ms / 1000).toFixed(1)}s`;
}

function getInitials(name: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getSentimentColor(zone: string | undefined): string {
    switch (zone?.toLowerCase()) {
        case 'positive': return '#10B981';
        case 'negative': return '#EF4444';
        default: return '#F59E0B';
    }
}

// ── Participant aggregation ───────────────────────────────────────────────────

interface AggregatedParticipant {
    name: string | null;
    roles: number[];
    talktime: number;
    holdtime: number;
    activetime: number;
}

function aggregateParticipants(
    participantsBySession: Map<string, ISessionParticipant[]>
): AggregatedParticipant[] {
    const map = new Map<string, AggregatedParticipant>();
    for (const participants of participantsBySession.values()) {
        for (const p of participants) {
            const id = p._msdyn_agentid_value ?? p.msdyn_name ?? 'unknown';
            const existing = map.get(id) ?? {
                name: p.msdyn_name,
                roles: [],
                talktime: 0,
                holdtime: 0,
                activetime: 0,
            };
            if (p.msdyn_mode !== null && !existing.roles.includes(p.msdyn_mode)) {
                existing.roles.push(p.msdyn_mode);
            }
            existing.talktime   += p.msdyn_talktime   ?? 0;
            existing.holdtime   += p.msdyn_holdtime   ?? 0;
            existing.activetime += p.msdyn_activetime ?? 0;
            map.set(id, existing);
        }
    }
    return Array.from(map.values());
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface IMetricCellProps {
    label: string;
    value: string | number;
    colorClass?: string;
}

const MetricCell: React.FC<IMetricCellProps> = ({ label, value, colorClass }) => (
    <div className="ic-metric">
        <div className={`ic-metric-value${colorClass ? ` ${colorClass}` : ''}`}>{value}</div>
        <div className="ic-metric-label">{label}</div>
    </div>
);

// ── Main component ────────────────────────────────────────────────────────────

export const InsightsDashboard: React.FC<IInsightsDashboardProps> = ({
    conversation, sessions, insight, insightsJson, participantsBySession, onClose
}) => {
    const strings = useStrings();

    // Section B: declined count — use the reliable signal (never accepted, not closurereason)
    const declinedCount = sessions.filter(
        s => s.msdyn_sessioncreationreason === SESSION_CREATION_REASON.TRANSFER &&
             s.msdyn_agentacceptedon === null
    ).length;

    // Section C: only shown when voice insight data is available
    const hasQuality = insight !== null;

    // Section D: only shown when participant data has been loaded
    const aggregated = aggregateParticipants(participantsBySession);
    const hasParticipants = aggregated.length > 0;

    const overallSentiment = insightsJson?.insights?.sentiments;

    return (
        <div className="insights-overlay" role="region" aria-label={strings.labelConversationInsights}>
            {/* Header */}
            <div className="insights-header">
                <span className="insights-title">✦ {strings.labelConversationInsights}</span>
                <button
                    className="insights-close-btn"
                    onClick={onClose}
                    aria-label="Close insights"
                >
                    ✕
                </button>
            </div>

            <div className="insights-body">
                {/* ── Section A: Timing ── */}
                <div className="insight-card timing">
                    <div className="ic-section-label" style={{ color: '#3B82F6' }}>
                        {strings.labelInsightsTiming}
                    </div>
                    <div className="ic-grid">
                        <MetricCell
                            label={strings.labelQueueWaitTime}
                            value={formatSeconds(conversation?.msdyn_conversationfirstwaittimeinseconds)}
                        />
                        <MetricCell
                            label={strings.labelTalkTime}
                            value={formatSeconds(conversation?.msdyn_conversationtalktimeinseconds)}
                        />
                        <MetricCell
                            label={strings.labelHoldTime}
                            value={formatSeconds(conversation?.msdyn_conversationholdtimeinseconds)}
                        />
                        <MetricCell
                            label={strings.labelWrapUpTime}
                            value={formatSeconds(conversation?.msdyn_conversationwrapuptimeinseconds)}
                        />
                        <MetricCell
                            label={strings.labelHandleTime}
                            value={formatSeconds(conversation?.msdyn_conversationhandletimeinseconds)}
                        />
                    </div>
                </div>

                {/* ── Section B: Routing ── */}
                <div className="insight-card routing">
                    <div className="ic-section-label" style={{ color: '#F59E0B' }}>
                        {strings.labelInsightsRouting}
                    </div>
                    <div className="ic-grid">
                        <MetricCell
                            label={strings.labelSessionsCount}
                            value={sessions.length}
                        />
                        <MetricCell
                            label={strings.labelTransfers}
                            value={conversation?.msdyn_transfercount ?? '—'}
                            colorClass={(conversation?.msdyn_transfercount ?? 0) > 0 ? 'ic-value--amber' : undefined}
                        />
                        <MetricCell
                            label={strings.labelEscalationsCount}
                            value={conversation?.msdyn_escalationcount ?? '—'}
                        />
                        <MetricCell
                            label={strings.labelDeclinedCount}
                            value={declinedCount}
                            colorClass={declinedCount > 0 ? 'ic-value--ruby' : undefined}
                        />
                    </div>
                </div>

                {/* ── Section C: AI / Voice Quality ── */}
                {hasQuality && insight && (
                    <div className="insight-card quality">
                        <div className="ic-section-label" style={{ color: '#10B981' }}>
                            {strings.labelInsightsQuality}
                        </div>
                        {overallSentiment && (
                            <div
                                className="ic-sentiment"
                                style={{ color: getSentimentColor(overallSentiment.zone) }}
                            >
                                {overallSentiment.zone} ({Math.round(overallSentiment.pulse)})
                            </div>
                        )}
                        <div className="ic-grid">
                            <MetricCell
                                label={strings.labelAgentTalkRatio}
                                value={formatRatio(insight.msdyn_calltalktolistenratio)}
                            />
                            <MetricCell
                                label={strings.labelSpeakingPace}
                                value={insight.msdyn_calltalkingspeed !== null
                                    ? `${Math.round(insight.msdyn_calltalkingspeed)} w/m`
                                    : '—'}
                            />
                            <MetricCell
                                label={strings.labelAvgPause}
                                value={formatPauseMs(insight.msdyn_callaveragepause)}
                            />
                            <MetricCell
                                label={strings.labelLongestMonologue}
                                value={formatPauseMs(insight.msdyn_calllongestcustomermonologue)}
                            />
                            <MetricCell
                                label={strings.labelConvSwitches}
                                value={insight.msdyn_callswitchesperconversation !== null
                                    ? Math.round(insight.msdyn_callswitchesperconversation)
                                    : '—'}
                            />
                        </div>
                    </div>
                )}

                {/* ── Section D: Participants ── */}
                {hasParticipants && (
                    <div className="insight-card people">
                        <div className="ic-section-label" style={{ color: '#8B5CF6' }}>
                            {strings.labelInsightsParticipants}
                        </div>
                        <div className="participant-list">
                            {aggregated.map((p, i) => {
                                const isPrimary = p.roles.includes(PARTICIPANT_MODE.PRIMARY);
                                const isConsult = p.roles.includes(PARTICIPANT_MODE.CONSULTING);
                                const roleLabel = isPrimary && isConsult
                                    ? 'Primary · Consult'
                                    : isPrimary ? 'Primary'
                                    : isConsult ? 'Consult'
                                    : '';
                                return (
                                    <div key={i} className="participant-row">
                                        <div className="participant-avatar" aria-hidden="true">
                                            {getInitials(p.name)}
                                        </div>
                                        <div className="participant-info">
                                            <div className="participant-name">{p.name ?? '—'}</div>
                                            {roleLabel && (
                                                <div className="participant-role">{roleLabel}</div>
                                            )}
                                        </div>
                                        <div className="participant-times">
                                            <span className="participant-time-item">
                                                🎤 {formatSeconds(p.talktime)}
                                            </span>
                                            {p.holdtime > 0 && (
                                                <span className="participant-time-item participant-time-hold">
                                                    ⏸ {formatSeconds(p.holdtime)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
