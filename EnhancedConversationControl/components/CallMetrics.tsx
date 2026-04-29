import * as React from 'react';
import { IInsight, IInsightsJson } from '../types';
import { useStrings } from '../i18n/StringsContext';

interface ICallMetricsProps {
    insight: IInsight | null;
    insightsJson: IInsightsJson | null;
    onInsightsClick?: () => void;
}

function formatDurationMs(ms: number | null): string {
    if (ms === null || ms === undefined) return '—';
    const totalSec = Math.round(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatPause(ms: number | null): string {
    if (ms === null || ms === undefined) return '—';
    return `${(ms / 1000).toFixed(1)}s`;
}

function formatRatio(ratio: number | null): string {
    if (ratio === null || ratio === undefined) return '—';
    return `${Math.round(ratio * 100)}%`;
}

function getSentimentColor(zone: string): string {
    switch (zone?.toLowerCase()) {
        case 'positive': return '#10B981';
        case 'negative': return '#EF4444';
        default: return '#F59E0B';
    }
}

export const CallMetrics: React.FC<ICallMetricsProps> = ({ insight, insightsJson, onInsightsClick }) => {
    const strings = useStrings();
    if (!insight || !(
        insight.msdyn_calltalktolistenratio !== null ||
        insight.msdyn_calltalkingspeed !== null ||
        insight.msdyn_callinsightduration !== null
    )) return null;

    const ratio = insight.msdyn_calltalktolistenratio;
    const ratioPercent = ratio !== null ? Math.min(100, Math.round(ratio * 100)) : null;
    const overallSentiment = insightsJson?.insights?.sentiments;

    return (
        <div className="sidebar-section">
            <div className="section-title">
                <span>{strings.labelCallMetrics}</span>
                {onInsightsClick && (
                    <button
                        className="ghost-btn ghost-btn--purple"
                        onClick={onInsightsClick}
                        aria-label={strings.labelInsights}
                    >
                        ✦ {strings.labelInsights}
                    </button>
                )}
            </div>
            <div className="metrics-grid">
                {insight.msdyn_callinsightduration !== null && (
                    <div className="metric-item">
                        <div className="metric-label">{strings.labelDuration}</div>
                        <div className="metric-value">{formatDurationMs(insight.msdyn_callinsightduration)}</div>
                    </div>
                )}
                {insight.msdyn_calltalkingspeed !== null && (
                    <div className="metric-item">
                        <div className="metric-label">{strings.labelTalkSpeed}</div>
                        <div className="metric-value">{Math.round(insight.msdyn_calltalkingspeed)} <span style={{ fontSize: 10 }}>w/m</span></div>
                    </div>
                )}
                {insight.msdyn_callswitchesperconversation !== null && (
                    <div className="metric-item">
                        <div className="metric-label">{strings.labelSwitches}</div>
                        <div className="metric-value">{Math.round(insight.msdyn_callswitchesperconversation)}</div>
                    </div>
                )}
                {insight.msdyn_callaveragepause !== null && (
                    <div className="metric-item">
                        <div className="metric-label">{strings.labelAvgPause}</div>
                        <div className="metric-value">{formatPause(insight.msdyn_callaveragepause)}</div>
                    </div>
                )}
            </div>

            {ratioPercent !== null && (
                <div className="metric-item" style={{ marginTop: 12 }}>
                    <div className="metric-label">{strings.labelTalkListenRatio} — {formatRatio(ratio)}</div>
                    <div className="ratio-bar" role="meter" aria-valuenow={ratioPercent} aria-valuemin={0} aria-valuemax={100} aria-label={strings.labelTalkListenRatio}>
                        <div className="ratio-fill" style={{ width: `${ratioPercent}%` }} />
                    </div>
                </div>
            )}

            {overallSentiment && (
                <div className="metric-item" style={{ marginTop: 8 }}>
                    <div className="metric-label">{strings.labelOverallSentiment}</div>
                    <div
                        className="metric-value"
                        style={{ color: getSentimentColor(overallSentiment.zone), fontSize: 14 }}
                    >
                        {overallSentiment.zone} ({Math.round(overallSentiment.pulse)})
                    </div>
                </div>
            )}
        </div>
    );
};
