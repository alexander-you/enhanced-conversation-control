import * as React from 'react';
import { IConversation, IInsight, ISession, ISessionParticipant, RenderMode, IInsightsJson } from '../types';
import { loadSessionParticipants } from '../api/dataService';
import { CopilotSummary } from './CopilotSummary';
import { TagsPanel } from './TagsPanel';
import { JourneyPanel } from './JourneyPanel';
import { CallMetrics } from './CallMetrics';
import { InsightsDashboard } from './InsightsDashboard';

export type SidebarMode = 'default' | 'journey-expanded' | 'insights';

interface ISidebarProps {
    insight: IInsight | null;
    sessions: ISession[];
    renderMode: RenderMode;
    insightsJson: IInsightsJson | null;
    keywords: string | null;
    conversation: IConversation | null;
    webAPI: ComponentFramework.WebApi;
}

export const Sidebar: React.FC<ISidebarProps> = ({
    insight, sessions, renderMode, insightsJson, keywords, conversation, webAPI
}) => {
    const isVoice = renderMode === 'voice' || renderMode === 'voicecallback';

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

    if (!hasCopilot && !hasMetrics && !hasTags && !hasJourney) return null;

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
                    conversationId={conversation?.activityid ?? null}
                    conversationClosedon={conversation?.msdyn_closedon ?? null}
                    conversationStatecode={conversation?.statecode ?? 0}
                    isExpanded={mode === 'journey-expanded'}
                    participantsBySession={participantsBySession}
                    participantsLoading={participantsLoading}
                    onExpand={() => { void handleJourneyExpand(); }}
                    onCollapse={handleJourneyCollapse}
                />
            )}
        </aside>
    );
};

