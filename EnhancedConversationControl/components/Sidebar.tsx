import * as React from 'react';
import { IConversation, IInsight, ISession, ISessionParticipant, RenderMode, IInsightsJson } from '../types';
import { loadSessionParticipants } from '../api/dataService';
import { CopilotSummary } from './CopilotSummary';
import { TagsPanel } from './TagsPanel';
import { JourneyPanel } from './JourneyPanel';
import { CallMetrics } from './CallMetrics';
import { InsightsDashboard } from './InsightsDashboard';
import { ContextVariablesPanel } from './ContextVariablesPanel';
import { useStrings } from '../i18n/StringsContext';

export type SidebarMode = 'default' | 'journey-expanded' | 'insights';

interface ISidebarProps {
    insight: IInsight | null;
    sessions: ISession[];
    renderMode: RenderMode;
    insightsJson: IInsightsJson | null;
    keywords: string | null;
    conversation: IConversation | null;
    webAPI: ComponentFramework.WebApi;
    contextVariableNames: string[];
}

export const Sidebar: React.FC<ISidebarProps> = ({
    insight, sessions, renderMode, insightsJson, keywords, conversation, webAPI, contextVariableNames
}) => {
    const strings = useStrings();
    const isVoice = renderMode === 'voice' || renderMode === 'voicecallback';
    const conversationId = conversation?.activityid ?? null;

    // ── Copy-to-clipboard state for Conversation ID ─────────────────────────
    const [copyStatus, setCopyStatus] = React.useState<'idle' | 'copied'>('idle');

    const handleCopyConversationId = React.useCallback(async () => {
        if (!conversationId) return;

        const fallbackCopy = (): boolean => {
            try {
                const temp = document.createElement('textarea');
                temp.value = conversationId;
                temp.setAttribute('readonly', 'true');
                temp.style.position = 'fixed';
                temp.style.opacity = '0';
                document.body.appendChild(temp);
                temp.select();
                const ok = document.execCommand('copy');
                document.body.removeChild(temp);
                return ok;
            } catch {
                return false;
            }
        };

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(conversationId);
            } else if (!fallbackCopy()) {
                return;
            }
        } catch {
            if (!fallbackCopy()) return;
        }

        setCopyStatus('copied');
        window.setTimeout(() => setCopyStatus('idle'), 1500);
    }, [conversationId]);

    // ── Sidebar mode state machine ──────────────────────────────────────────
    const [mode, setMode] = React.useState<SidebarMode>('default');

    // ── CopilotSummary: controlled expanded state ───────────────────────────
    const [summaryExpanded, setSummaryExpanded] = React.useState(true);
    // Remember whether summary was expanded before journey-expand so we can restore it
    const summaryExpandedBeforeJourney = React.useRef(true);

    // ── Participant lazy-load cache ─────────────────────────────────────────
    const [participantsBySession, setParticipantsBySession] =
        React.useState<Map<string, ISessionParticipant[]>>(new Map());
    const [participantsLoaded, setParticipantsLoaded] = React.useState(false);
    const [participantsLoading, setParticipantsLoading] = React.useState(false);

    const handleJourneyExpand = React.useCallback(async () => {
        summaryExpandedBeforeJourney.current = summaryExpanded;
        setSummaryExpanded(false);
        setMode('journey-expanded');

        // Fetch participant data once and cache — never re-fetch on subsequent expands
        if (!participantsLoaded && !participantsLoading && sessions.length > 0) {
            setParticipantsLoading(true);
            const results = await Promise.allSettled(
                sessions.map(s => loadSessionParticipants(webAPI, s.activityid))
            );
            const map = new Map<string, ISessionParticipant[]>();
            sessions.forEach((s, i) => {
                const r = results[i];
                map.set(s.activityid, r.status === 'fulfilled' ? r.value : []);
            });
            setParticipantsBySession(map);
            setParticipantsLoaded(true);
            setParticipantsLoading(false);
        }
    }, [summaryExpanded, participantsLoaded, participantsLoading, sessions, webAPI]);

    const handleJourneyCollapse = React.useCallback(() => {
        setSummaryExpanded(summaryExpandedBeforeJourney.current);
        setMode('default');
    }, []);

    const handleInsightsOpen  = React.useCallback(() => setMode('insights'), []);
    const handleInsightsClose = React.useCallback(() => setMode('default'),  []);

    const hasCopilot = !!(insight?.msdyn_copilotsummary);
    const hasMetrics = isVoice && !!(insight);
    const hasTags = !!(keywords);
    const hasJourney = sessions.length > 0;
    const hasContextVars = contextVariableNames.length > 0 && !!conversation?.activityid;

    if (!hasCopilot && !hasMetrics && !hasTags && !hasJourney && !hasContextVars && !conversationId) return null;

    if (mode === 'insights') {
        return (
            <aside className="sidebar sidebar--insights" aria-label="Conversation insights">
                <InsightsDashboard
                    conversation={conversation}
                    sessions={sessions}
                    insight={insight}
                    insightsJson={insightsJson}
                    participantsBySession={participantsBySession}
                    onClose={handleInsightsClose}
                />
            </aside>
        );
    }

    return (
        <aside className={`sidebar sidebar--${mode}`} aria-label="Conversation details sidebar">
            {hasCopilot && (
                <CopilotSummary
                    markdown={insight?.msdyn_copilotsummary ?? null}
                    isExpanded={summaryExpanded}
                    onToggle={() => setSummaryExpanded(v => !v)}
                />
            )}
            {hasMetrics && mode !== 'journey-expanded' && (
                <CallMetrics insight={insight} insightsJson={insightsJson} onInsightsClick={handleInsightsOpen} />
            )}
            {hasTags && <TagsPanel keywords={keywords} />}
            {hasJourney && (
                <JourneyPanel
                    sessions={sessions}
                    insightsJson={insightsJson}
                    conversationClosedon={conversation?.msdyn_closedon ?? null}
                    conversationStatecode={conversation?.statecode ?? 0}
                    isExpanded={mode === 'journey-expanded'}
                    participantsBySession={participantsBySession}
                    participantsLoading={participantsLoading}
                    onExpand={() => { void handleJourneyExpand(); }}
                    onCollapse={handleJourneyCollapse}
                />
            )}
            {hasContextVars && conversation && (
                <ContextVariablesPanel
                    webAPI={webAPI}
                    conversationId={conversation.activityid}
                    variableNames={contextVariableNames}
                />
            )}
            {conversationId && (
                <div className="conv-id-section">
                    <div className="journey-conversation-id__label">{strings.labelConversationId}</div>
                    <div className="journey-conversation-id__row">
                        <code className="journey-conversation-id__value" title={conversationId}>{conversationId}</code>
                        <button
                            type="button"
                            className="journey-copy-btn"
                            onClick={() => { void handleCopyConversationId(); }}
                            aria-label={`${strings.labelCopy} ${strings.labelConversationId}`}
                        >
                            {copyStatus === 'copied' ? strings.labelCopied : strings.labelCopy}
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
};

