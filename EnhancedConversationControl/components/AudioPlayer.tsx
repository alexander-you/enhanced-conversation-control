import * as React from 'react';
import { IMessage, IRecording, IInsightsJson } from '../types';
import { useStrings } from '../i18n/StringsContext';

interface IConversationMeta {
    subject: string | null;
    customerName: string | null;
    startedOn: string | null;
}

interface IAudioPlayerProps {
    recording: IRecording | null;
    insightsJson: IInsightsJson | null;
    recordingId: string | null;
    transcriptId: string | null;
    isRtl?: boolean;
    onTimeUpdate?: (seconds: number) => void;
    messages?: IMessage[];
    conversationMeta?: IConversationMeta;
}

const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const;

function formatTime(seconds: number): string {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── HTML Transcript Generation ────────────────────────────────────────────────

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatOffsetForHtml(offsetMs?: number): string {
    if (offsetMs === undefined) return '';
    const s = Math.floor(offsetMs / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

function generateHtmlTranscript(messages: IMessage[], meta: IConversationMeta): string {
    const title = meta.subject ?? 'Call Transcript';
    const dateStr = meta.startedOn
        ? new Date(meta.startedOn).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
        : '';
    const customerStr = meta.customerName ?? '';

    const rows = messages
        .filter(m => m.sender !== 'system')
        .map(m => {
            const isAgent = m.sender === 'agent';
            const timeStr = formatOffsetForHtml(m.offsetMs);
            const roleClass = isAgent ? 'agent' : 'customer';
            return `
        <div class="msg-row msg-row--${roleClass}">
            <div class="msg-bubble">
                <div class="msg-meta">
                    <span class="msg-sender">${escapeHtml(m.senderName)}</span>
                    ${timeStr ? `<span class="msg-time">${timeStr}</span>` : ''}
                </div>
                <div class="msg-content">${escapeHtml(m.content)}</div>
            </div>
        </div>`;
        }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: #F5F7FA; color: #1E293B; padding: 24px 16px; }
        .header { background: white; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; max-width: 800px; margin-inline: auto; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
        .header h1 { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
        .header .meta { font-size: 12px; color: #64748B; }
        .messages { display: flex; flex-direction: column; gap: 10px; max-width: 800px; margin: 0 auto; }
        .msg-row { display: flex; }
        .msg-row--agent { justify-content: flex-end; }
        .msg-row--customer { justify-content: flex-start; }
        .msg-bubble { max-width: 72%; padding: 10px 14px; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,.06); }
        .msg-row--agent .msg-bubble { background: #6366F1; color: white; border-bottom-right-radius: 4px; }
        .msg-row--customer .msg-bubble { background: white; border-bottom-left-radius: 4px; }
        .msg-meta { font-size: 10px; margin-bottom: 4px; opacity: 0.75; display: flex; gap: 8px; align-items: baseline; }
        .msg-sender { font-weight: 700; }
        .msg-time { font-weight: 400; }
        .msg-content { font-size: 13px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
        @media print { body { background: white; } .msg-bubble { box-shadow: none; border: 1px solid #E2E8F0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>${escapeHtml(title)}</h1>
        <div class="meta">${customerStr ? `Customer: ${escapeHtml(customerStr)}` : ''}${customerStr && dateStr ? ' · ' : ''}${dateStr ? escapeHtml(dateStr) : ''}</div>
    </div>
    <div class="messages">
${rows}
    </div>
</body>
</html>`;
}

// ── Waveform ──────────────────────────────────────────────────────────────────

interface IWaveformBar { height: number; zone: 'positive' | 'negative' | 'neutral'; }

function buildWaveformBars(insightsJson: IInsightsJson | null): IWaveformBar[] {
    if (!insightsJson?.messageInsights?.length) {
        return Array.from({ length: 40 }, (_, i) => ({
            height: 20 + Math.sin(i * 0.8) * 15 + Math.random() * 20,
            zone: 'neutral' as const,
        }));
    }
    return insightsJson.messageInsights.slice(0, 80).map(mi => ({
        height: 15 + ((mi.sentiments?.pulse ?? 50) / 100) * 70,
        zone: ((mi.sentiments?.zone?.toLowerCase() ?? 'neutral') as 'positive' | 'negative' | 'neutral'),
    }));
}

export const AudioPlayer: React.FC<IAudioPlayerProps> = ({ recording, insightsJson, recordingId, transcriptId, isRtl, onTimeUpdate, messages, conversationMeta }) => {
    const strings = useStrings();
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [duration, setDuration] = React.useState(0);
    const [speed, setSpeed] = React.useState<number>(1);
    const [activeBarIndex, setActiveBarIndex] = React.useState<number>(-1);
    const [audioBlobUrl, setAudioBlobUrl] = React.useState<string | null>(null);
    const blobUrlRef = React.useRef<string | null>(null);

    const mediaUri = recording?.msdyn_mediauri ?? null;
    const bars = React.useMemo(() => buildWaveformBars(insightsJson), [insightsJson]);

    // RTL: invert the range value so the thumb starts at the right (time=0 → value=max)
    const rangeValue = isRtl && duration > 0 ? duration - currentTime : currentTime;

    // RTL: display bars in reverse order so the waveform plays right-to-left
    const displayBars = React.useMemo(
        () => isRtl ? [...bars].reverse() : bars,
        [bars, isRtl]
    );
    // RTL: the active bar index is mirrored
    const displayActiveIndex = isRtl ? bars.length - 1 - activeBarIndex : activeBarIndex;

    // Load audio via D365 API as a blob URL (avoids cross-origin ACS auth issues)
    React.useEffect(() => {
        if (!recordingId) return;
        let cancelled = false;

        const load = async () => {
            try {
                const res = await fetch(
                    `/api/data/v9.2/msdyn_ocrecordings(${recordingId})/msdyn_recording/$value`,
                    { credentials: 'same-origin' }
                );
                if (!res.ok || cancelled) return;
                const blob = await res.blob();
                if (cancelled) return;
                const url = URL.createObjectURL(blob);
                blobUrlRef.current = url;
                setAudioBlobUrl(url);
            } catch { /* silently ignore */ }
        };

        void load();
        return () => {
            cancelled = true;
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = null;
            }
        };
    }, [recordingId]);

    // Sync blob URL to audio element
    React.useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioBlobUrl) return;
        audio.src = audioBlobUrl;
        audio.load();
    }, [audioBlobUrl]);

    React.useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            onTimeUpdate?.(audio.currentTime);
            if (audio.duration > 0) {
                const pct = audio.currentTime / audio.duration;
                setActiveBarIndex(Math.floor(pct * bars.length));
            }
        };
        const onLoaded = () => setDuration(audio.duration);
        const onEnded = () => { setIsPlaying(false); setActiveBarIndex(-1); };

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoaded);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoaded);
            audio.removeEventListener('ended', onEnded);
        };
    }, [bars.length, onTimeUpdate]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio || !audioBlobUrl) return;
        if (isPlaying) audio.pause();
        else audio.play().catch((_e: unknown) => { void _e; });
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;
        const val = Number(e.target.value);
        // In RTL, range value is inverted: rangeValue = duration - currentTime
        audio.currentTime = isRtl && duration > 0 ? duration - val : val;
    };

    const handleSpeedChange = (s: number) => {
        setSpeed(s);
        if (audioRef.current) audioRef.current.playbackRate = s;
    };

    const handleDownloadAudio = async () => {
        if (!recordingId) return;
        try {
            const res = await fetch(
                `/api/data/v9.2/msdyn_ocrecordings(${recordingId})/msdyn_recording/$value`,
                { credentials: 'same-origin' }
            );
            if (!res.ok) return;
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'callRecording.mp3';
            a.click();
            URL.revokeObjectURL(url);
        } catch { /* silently ignore */ }
    };

    const handleDownloadTranscript = () => {
        // If we have parsed messages, generate a clean HTML transcript
        if (messages && messages.length > 0) {
            const html = generateHtmlTranscript(
                messages,
                conversationMeta ?? { subject: null, customerName: null, startedOn: null }
            );
            const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transcript.html';
            a.click();
            URL.revokeObjectURL(url);
            return;
        }
        // Fallback: download raw voice transcript text if no messages available
        if (!transcriptId) return;
        void (async () => {
            try {
                const res = await fetch(
                    `/api/data/v9.2/msdyn_transcripts(${transcriptId})/msdyn_voicetranscript_formatted/$value`,
                    { credentials: 'same-origin' }
                );
                if (!res.ok) return;
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'transcript.txt';
                a.click();
                URL.revokeObjectURL(url);
            } catch { /* silently ignore */ }
        })();
    };

    if (!recordingId) return null;

    return (
        <div className="player" aria-label={strings.ariaAudioPlayer}>
            {/* Audio element — src is set imperatively via blob URL after fetch */}
            <audio
                ref={audioRef}
                preload="none"
                style={{ display: 'none' }}
            />

            <div className="player-top">
                <div className="player-controls">
                    <button
                        className="play-btn"
                        onClick={togglePlay}
                        disabled={!audioBlobUrl}
                        aria-label={isPlaying ? strings.ariaPause : strings.ariaPlay}
                    >
                        {!audioBlobUrl ? '⏳' : isPlaying ? '⏸' : '▶'}
                    </button>
                    <span className="time-display" aria-live="off">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    <div className="speed-pills" role="group" aria-label={strings.ariaPlaybackSpeed}>
                        {SPEED_OPTIONS.map(s => (
                            <button
                                key={s}
                                className={`speed-btn${speed === s ? ' active' : ''}`}
                                onClick={() => handleSpeedChange(s)}
                                aria-pressed={speed === s}
                            >
                                {s}×
                            </button>
                        ))}
                    </div>
                </div>
                <div className="export-actions">
                    {recordingId && (
                        <button className="export-btn" onClick={() => { void handleDownloadAudio(); }} aria-label={strings.ariaDownloadAudio}>
                            💾 {strings.labelDownloadAudio}
                        </button>
                    )}
                    {transcriptId && (
                        <button className="export-btn" onClick={handleDownloadTranscript} aria-label={strings.ariaDownloadTranscript}>
                            📄 {strings.labelDownloadTranscript}
                        </button>
                    )}
                </div>
            </div>

            {duration > 0 && (
                <div className="progress-bar-container">
                    <input
                        type="range"
                        className="progress-input"
                        dir="ltr"
                        min={0}
                        max={duration}
                        step={0.1}
                        value={rangeValue}
                        onChange={handleSeek}
                        aria-label={strings.ariaSeekAudio}
                        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                    />
                </div>
            )}

            <div className="waveform" aria-hidden="true">
                {displayBars.map((bar, i) => (
                    <div
                        key={i}
                        className={`w-bar w-bar--${bar.zone}${i === displayActiveIndex ? ' active' : ''}`}
                        style={{ height: `${bar.height}%` }}
                    />
                ))}
            </div>
        </div>
    );
};
