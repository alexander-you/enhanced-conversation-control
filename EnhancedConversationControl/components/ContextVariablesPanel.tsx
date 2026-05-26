import * as React from 'react';
import { IContextVariable } from '../types';
import { loadContextVariables } from '../api/dataService';
import { useStrings } from '../i18n/StringsContext';

interface IContextVariablesPanelProps {
    webAPI: ComponentFramework.WebApi;
    conversationId: string;
    variableNames: string[];
}

type PanelState = 'idle' | 'loading' | 'loaded' | 'error';

export const ContextVariablesPanel: React.FC<IContextVariablesPanelProps> = ({
    webAPI, conversationId, variableNames
}) => {
    const strings = useStrings();
    const [state, setState] = React.useState<PanelState>('idle');
    const [variables, setVariables] = React.useState<IContextVariable[]>([]);
    const [expanded, setExpanded] = React.useState(false);
    const [errorMsg, setErrorMsg] = React.useState('');

    const fetchVariables = React.useCallback(async () => {
        setState('loading');
        setErrorMsg('');
        try {
            const result = await loadContextVariables(webAPI, conversationId, variableNames);
            setVariables(result);
            setState('loaded');
        } catch (e) {
            setErrorMsg(String(e));
            setState('error');
        }
    }, [webAPI, conversationId, variableNames]);

    const handleToggle = React.useCallback(() => {
        const next = !expanded;
        setExpanded(next);
        if (next && state === 'idle') {
            void fetchVariables();
        }
    }, [expanded, state, fetchVariables]);

    // Build a map for ordered display: show requested names in config order
    const variableMap = React.useMemo(() => {
        const map = new Map<string, string | null>();
        for (const v of variables) {
            map.set(v.msdyn_name, v.msdyn_value);
        }
        return map;
    }, [variables]);

    return (
        <div className="ctx-panel">
            <button
                type="button"
                className="ctx-toggle"
                onClick={handleToggle}
                aria-expanded={expanded}
                aria-controls="ctx-variables-content"
            >
                <span className="ctx-toggle-icon">{expanded ? '▾' : '▸'}</span>
                <span className="ctx-toggle-label">📋 {strings.labelContextVariables}</span>
                {state === 'loaded' && (
                    <span className="ctx-badge">{variables.length}</span>
                )}
                {expanded && state === 'loaded' && (
                    <button
                        type="button"
                        className="ctx-refresh"
                        onClick={(e) => { e.stopPropagation(); void fetchVariables(); }}
                        aria-label={strings.labelContextRefresh}
                        title={strings.labelContextRefresh}
                    >
                        ↻
                    </button>
                )}
            </button>

            {expanded && (
                <div id="ctx-variables-content" className="ctx-content" role="region" aria-label={strings.labelContextVariables}>
                    {state === 'loading' && (
                        <div className="ctx-loading">
                            <span className="ctx-spinner" />
                            <span>{strings.labelLoading}</span>
                        </div>
                    )}

                    {state === 'error' && (
                        <div className="ctx-error">
                            <span>⚠️ {errorMsg || strings.errorFailed}</span>
                            <button type="button" className="ctx-retry" onClick={() => { void fetchVariables(); }}>
                                {strings.labelContextRetry}
                            </button>
                        </div>
                    )}

                    {state === 'loaded' && variables.length === 0 && (
                        <div className="ctx-empty">{strings.labelContextNoData}</div>
                    )}

                    {state === 'loaded' && variables.length > 0 && (
                        <dl className="ctx-list">
                            {variableNames.map(name => (
                                <div key={name} className="ctx-row">
                                    <dt className="ctx-label">{name}</dt>
                                    <dd className="ctx-value">{variableMap.get(name) ?? '—'}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </div>
            )}
        </div>
    );
};
