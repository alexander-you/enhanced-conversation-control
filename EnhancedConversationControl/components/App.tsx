import * as React from 'react';
import { IInputs } from '../generated/ManifestTypes';
import { IControlState, IMessage } from '../types';
import {
    loadConversation, loadTranscript, loadChatMessages, loadVoiceTranscriptText,
    loadSessions, loadInsight, loadInsightsJson, loadRecording, detectRenderMode,
    parseVoiceTranscriptToMessages, stampVoiceOffsets
} from '../api/dataService';
import { createStrings } from '../i18n/strings';
import { StringsProvider } from '../i18n/StringsContext';
import { Header } from './Header';
import { ChatTranscript } from './ChatTranscript';
import { VoiceTranscript } from './VoiceTranscript';
import { Sidebar } from './Sidebar';
import { AudioPlayer } from './AudioPlayer';

const RTL_LANGUAGE_IDS = new Set([1025, 1037, 1065, 1056, 9217, 2049, 3073, 4097, 5121, 6145, 7169, 8193, 11265, 12289, 13313, 14337, 15361, 16385]);

interface IAppProps {
    context: ComponentFramework.Context<IInputs>;
    entityId: string | undefined;
}

const initialState: IControlState = {
    loading: true,
    error: null,
    conversation: null,
    renderMode: 'unknown',
    messages: [],
    voiceTranscriptText: null,
    transcriptId: null,
    sessions: [],
    insight: null,
    insightsJson: null,
    recording: null,
};

export const App: React.FC<IAppProps> = ({ context, entityId }) => {
    const [state, setState] = React.useState<IControlState>(initialState);
    const webAPIRef = React.useRef(context.webAPI);
    webAPIRef.current = context.webAPI;

    React.useEffect(() => {
        if (!entityId) {
            setState(s => ({ ...s, loading: false, error: 'No conversation ID available in this context.' }));
            return;
        }

        const abortControllers: AbortController[] = [];
        const makeAC = (): AbortController => {
            const ac = new AbortController();
            abortControllers.push(ac);
            return ac;
        };

        let cancelled = false;
        const patch = (partial: Partial<IControlState>) => {
            if (!cancelled) setState(s => ({ ...s, ...partial }));
        };

        async function loadAll() {
            try {
                const conv = await loadConversation(webAPIRef.current, entityId!);
                if (cancelled) return;
                const renderMode = detectRenderMode(conv.msdyn_channel);
                patch({ conversation: conv, renderMode });

                const isVoice = renderMode === 'voice' || renderMode === 'voicecallback';

                const [transcriptResult, sessionsResult, insightResult] = await Promise.allSettled([
                    loadTranscript(webAPIRef.current, entityId!),
                    loadSessions(webAPIRef.current, entityId!),
                    loadInsight(webAPIRef.current, entityId!),
                ]);
                if (cancelled) return;

                const transcriptData = transcriptResult.status === 'fulfilled' ? transcriptResult.value : null;
                const sessionsData = sessionsResult.status === 'fulfilled' ? (sessionsResult.value ?? []) : [];
                const insightData = insightResult.status === 'fulfilled' ? insightResult.value : null;

                patch({
                    sessions: sessionsData,
                    insight: insightData,
                    transcriptId: transcriptData?.msdyn_transcriptid ?? null,
                });

                const secondary: Promise<void>[] = [];

                if (transcriptData) {
                    if (!isVoice) {
                        secondary.push(
                            loadChatMessages(webAPIRef.current, transcriptData.msdyn_transcriptid)
                                .then(msgs => patch({ messages: msgs }))
                                .catch(() => patch({ messages: [] }))
                        );
                    } else {
                        // Voice loading strategy:
                        //  - Annotation JSON (primary): well-structured bubbles with real ISO timestamps
                        //  - ACS JSON formatted transcript (parallel): loaded ONLY for its timing offsets
                        //    so we can derive the exact recording start wall-clock time.
                        //
                        // Sync anchor derivation:
                        //   recording_start = first_annotation_msg.created - first_ACS_fragment.Start
                        //   This is far more accurate than msdyn_startedon (queue entry, not call start).
                        const voiceTid = transcriptData.msdyn_transcriptid;
                        const loadVoiceMessages = async (): Promise<void> => {
                            const ac = makeAC();
                            // Fetch both in parallel — annotation for rendering, ACS for timing
                            const [annotationMsgs, formattedText] = await Promise.all([
                                loadChatMessages(webAPIRef.current, voiceTid, true).catch(() => [] as IMessage[]),
                                loadVoiceTranscriptText(voiceTid, ac.signal).catch(() => null),
                            ]);

                            if (annotationMsgs.length > 0) {
                                // Stamp each annotation message with the exact ACS fragment start time
                                // via text-prefix matching. offsetMs drives the highlight cursor only —
                                // the original annotation order is the correct visual/conversation order.
                                const stamped = stampVoiceOffsets(annotationMsgs, formattedText);
                                patch({ messages: stamped });
                                return;
                            }

                            // Fallback: use formatted transcript for rendering (ACS JSON or plain-text)
                            if (formattedText) {
                                const formattedMsgs = parseVoiceTranscriptToMessages(formattedText);
                                if (formattedMsgs && formattedMsgs.length > 0) {
                                    patch({ messages: formattedMsgs }); // 1970-epoch, Tier-1 sync
                                    return;
                                }
                                patch({ voiceTranscriptText: formattedText });
                            }
                        };
                        secondary.push(loadVoiceMessages().catch(() => patch({ messages: [] })));
                    }
                }

                if (isVoice) {
                    secondary.push(
                        loadRecording(webAPIRef.current, entityId!)
                            .then(rec => patch({ recording: rec }))
                    );
                }

                if (insightData) {
                    const ac = makeAC();
                    secondary.push(
                        loadInsightsJson(insightData.msdyn_conversationinsightid, ac.signal)
                            .then(json => patch({ insightsJson: json }))
                    );
                }

                await Promise.allSettled(secondary);
                if (!cancelled) patch({ loading: false });
            } catch (err) {
                if (!cancelled) patch({ loading: false, error: `Failed to load conversation: ${String(err)}` });
            }
        }

        void loadAll();
        return () => {
            cancelled = true;
            abortControllers.forEach(ac => ac.abort());
        };
    }, [entityId]);

    // --- Dynamic height via ResizeObserver ---
    // model-driven allocatedHeight is always -1; we measure our own top offset instead.
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [measuredHeight, setMeasuredHeight] = React.useState<number | null>(null);

    React.useEffect(() => {
        const measure = () => {
            if (!containerRef.current) return;
            const top = containerRef.current.getBoundingClientRect().top;
            const available = window.innerHeight - top - 16; // 16px bottom breathing room
            if (available > 200) setMeasuredHeight(available);
        };

        measure();
        window.addEventListener('resize', measure);

        // Re-measure when the PCF host element resizes (e.g. panel expand/collapse)
        const ro = new ResizeObserver(measure);
        const parent = containerRef.current?.parentElement;
        if (parent) ro.observe(parent);

        return () => {
            window.removeEventListener('resize', measure);
            ro.disconnect();
        };
    }, []);

    const isRtl = RTL_LANGUAGE_IDS.has((context.userSettings as unknown as { languageId: number }).languageId ?? 0);
    const isVoice = state.renderMode === 'voice' || state.renderMode === 'voicecallback';
    const strings = React.useMemo(() => createStrings(context.resources), [context.resources]);

    // Search state
    const [searchTerm, setSearchTerm] = React.useState('');
    const [searchMatchCount, setSearchMatchCount] = React.useState<{ count: number; total: number } | null>(null);

    // Voice audio sync state (G-3)
    const [voiceCurrentTime, setVoiceCurrentTime] = React.useState<number>(-1);
    const handleTimeUpdate = React.useCallback((sec: number) => setVoiceCurrentTime(sec), []);

    // Search match count — stable callback prevents infinite-loop: timeupdate → re-render → new arrow → effect → setState → re-render → …
    const handleMatchCount = React.useCallback((c: number, t: number) => setSearchMatchCount({ count: c, total: t }), []);

    // Width: use allocatedWidth from PCF (set after trackContainerResize(true) in init).
    const modeCtx = context.mode as unknown as { allocatedWidth?: number };
    const allocatedWidth = modeCtx.allocatedWidth ?? -1;

    const containerStyle: React.CSSProperties = {
        width: allocatedWidth > 0 ? allocatedWidth : '100%',
        // Use measured height (ResizeObserver); fall back to calc() until first measurement fires.
        height: measuredHeight ?? 'calc(100vh - 220px)',
        minHeight: 400,
        overflow: 'hidden',
    };

    // Single root div for all render states — keeps the ref stable for ResizeObserver.
    const rootClass = [
        'alex-ecc pcf-container',
        state.loading ? 'loading' : '',
        state.error ? 'error' : '',
        isRtl ? 'rtl-layout' : '',
    ].filter(Boolean).join(' ');

    return (
        <StringsProvider value={strings}>
            <div
                ref={containerRef}
                className={rootClass}
                dir={isRtl ? 'rtl' : 'ltr'}
                style={containerStyle}
                data-version="1.5.0"
                role={state.error ? 'alert' : undefined}
            >
                {state.loading ? (
                    <div className="spinner" aria-label={strings.labelLoading} />
                ) : state.error ? (
                    <p>⚠️ {state.error}</p>
                ) : (
                    <>
                        <Header conversation={state.conversation} renderMode={state.renderMode} />
                        <div className="content-grid">
                            <div className="transcript">
                                <div className="transcript-header">
                                    <h3>{isVoice ? strings.labelVoiceTranscript : strings.labelTranscript}</h3>
                                    <div className="search-box">
                                        <span className="search-icon" aria-hidden="true">🔍</span>
                                        <input
                                            type="search"
                                            placeholder={strings.labelSearchPlaceholder}
                                            value={searchTerm}
                                            onChange={e => { setSearchTerm(e.target.value); setSearchMatchCount(null); }}
                                            aria-label={strings.labelSearchPlaceholder}
                                        />
                                        {searchTerm && searchMatchCount !== null && (
                                            <span className="search-count" aria-live="polite">
                                                {searchMatchCount.count === 0
                                                    ? strings.labelNoMatches
                                                    : `${searchMatchCount.count} ${strings.labelSearchOf} ${searchMatchCount.total}`}
                                            </span>
                                        )}
                                        {searchTerm && (
                                            <button
                                                type="button"
                                                className="search-clear"
                                                onClick={() => { setSearchTerm(''); setSearchMatchCount(null); }}
                                                aria-label="Clear search"
                                            >×</button>
                                        )}
                                    </div>
                                </div>
                                {isVoice
                                    ? (state.messages.length > 0
                                        ? <ChatTranscript
                                            messages={state.messages}
                                            searchTerm={searchTerm}
                                            onMatchCount={handleMatchCount}
                                            activeTimeSeconds={voiceCurrentTime}
                                          />
                                        : <VoiceTranscript text={state.voiceTranscriptText} />)
                                    : <ChatTranscript
                                        messages={state.messages}
                                        searchTerm={searchTerm}
                                        onMatchCount={handleMatchCount}
                                      />
                                }
                            </div>
                            <Sidebar
                                insight={state.insight}
                                sessions={state.sessions}
                                renderMode={state.renderMode}
                                insightsJson={state.insightsJson}
                                keywords={state.conversation?.msdyn_urcustomersentimentkeywords ?? null}
                                conversation={state.conversation}
                                webAPI={context.webAPI}
                            />
                        </div>
                        {isVoice && (
                            <AudioPlayer
                                recording={state.recording}
                                insightsJson={state.insightsJson}
                                recordingId={state.recording?.msdyn_ocrecordingid ?? null}
                                transcriptId={state.transcriptId}
                                isRtl={isRtl}
                                onTimeUpdate={handleTimeUpdate}
                                messages={state.messages}
                                conversationMeta={{
                                    subject: state.conversation?.subject ?? null,
                                    customerName: state.conversation?.['_msdyn_customer_value@OData.Community.Display.V1.FormattedValue'] ?? null,
                                    startedOn: state.conversation?.msdyn_startedon ?? null,
                                }}
                            />
                        )}
                    </>
                )}
            </div>
        </StringsProvider>
    );
};
