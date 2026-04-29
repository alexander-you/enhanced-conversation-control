import * as React from 'react';
import { IMessage } from '../types';
import { useStrings } from '../i18n/StringsContext';

interface IChatTranscriptProps {
    messages: IMessage[];
    searchTerm?: string;
    onMatchCount?: (count: number, total: number) => void;
    activeTimeSeconds?: number;
}

function formatTime(date: Date): string {
    // Dates in year 1970 are relative call offsets stored as ms-from-epoch — show as M:SS
    if (date.getFullYear() === 1970) {
        const totalSec = Math.floor(date.getTime() / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Strip dangerous HTML but keep structure. */
function sanitizeHtml(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
}

/** Convert plain text to HTML-safe string with highlights applied. */
function textToHtml(text: string, searchTerm?: string): string {
    if (!searchTerm?.trim()) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br/>');
    }
    // Split by search term (case-insensitive) — odd indices are the matched portions
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedTerm})`, 'gi'));
    return parts.map((part, i) => {
        const safe = part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
        return i % 2 === 1 ? `<mark>${safe}</mark>` : safe;
    }).join('');
}

/** Convert markdown to HTML for Copilot/bot messages. Handles bold, lists, headings, links. */
function chatMarkdownToHtml(raw: string): string {
    const lines = raw.split('\n');
    let html = '';
    let listType: 'ul' | 'ol' | null = null;

    const closeList = () => {
        if (listType) { html += `</${listType}>`; listType = null; }
    };

    const inlineFormat = (text: string): string => {
        return text
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    };

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip reference-style link definitions [1]: url
        if (/^\[\d+\]:\s+https?:/.test(trimmed)) continue;

        // Headings
        const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
        if (headingMatch) {
            closeList();
            html += `<strong>${inlineFormat(headingMatch[2])}</strong><br/>`;
            continue;
        }

        // Unordered list
        const ulMatch = /^[-*•]\s+(.+)$/.exec(trimmed);
        if (ulMatch) {
            if (listType !== 'ul') { closeList(); html += '<ul>'; listType = 'ul'; }
            html += `<li>${inlineFormat(ulMatch[1])}</li>`;
            continue;
        }

        // Ordered list
        const olMatch = /^\d+\.\s+(.+)$/.exec(trimmed);
        if (olMatch) {
            if (listType !== 'ol') { closeList(); html += '<ol>'; listType = 'ol'; }
            html += `<li>${inlineFormat(olMatch[1])}</li>`;
            continue;
        }

        // Empty line = paragraph break
        if (trimmed === '') {
            closeList();
            html += '<br/>';
            continue;
        }

        // Normal paragraph line
        closeList();
        html += `${inlineFormat(trimmed)}<br/>`;
    }

    closeList();
    // Clean up trailing <br/> tags
    return html.replace(/(<br\/>)+$/, '');
}

/** Detect whether content is markdown (not HTML). */
function isMarkdown(content: string, contentType: string): boolean {
    if (contentType === 'text/markdown') return true;
    if (contentType === 'text/html') return false;
    // Heuristic: has markdown patterns but doesn't start with an HTML tag
    const trimmed = content.trim();
    if (trimmed.startsWith('<') && trimmed.includes('</')) return false;
    return /\*\*[^*]+\*\*/.test(content) ||
        /^\s*[-*]\s+/m.test(content) ||
        /^\s*\d+\.\s+/m.test(content) ||
        /^\s*#{1,3}\s+/m.test(content);
}

// ──────────────────────────────────────────────────────────────
// Adaptive Card types (minimal — only what we need to render)
// ──────────────────────────────────────────────────────────────
interface IACChoice { title: string; value: string; }
interface IACElement {
    type: string;
    text?: string;
    weight?: string;
    wrap?: boolean;
    choices?: IACChoice[];
    items?: IACElement[];
}
interface IACAction { type: string; title: string; }
interface IAdaptiveCard {
    type: string;
    body?: IACElement[];
    actions?: IACAction[];
}
interface IACAttachment {
    contentType: string;
    content: IAdaptiveCard;
}
interface IACWrapper {
    text?: string;
    attachments?: IACAttachment[];
}

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderACElements(elements: IACElement[]): string {
    let html = '';
    for (const elem of elements) {
        switch (elem.type) {
            case 'TextBlock':
                if (elem.text) {
                    const isBold = elem.weight === 'Bolder' || elem.weight === 'Bold';
                    html += isBold
                        ? `<p><strong>${esc(elem.text)}</strong></p>`
                        : `<p>${esc(elem.text)}</p>`;
                }
                break;
            case 'Input.ChoiceSet':
                if (Array.isArray(elem.choices) && elem.choices.length > 0) {
                    html += '<ul class="adaptive-choices">';
                    for (const c of elem.choices) {
                        html += `<li>${esc(c.title)}</li>`;
                    }
                    html += '</ul>';
                }
                break;
            case 'Container':
            case 'ColumnSet':
                if (Array.isArray(elem.items)) {
                    html += renderACElements(elem.items);
                }
                break;
            default:
                break;
        }
    }
    return html;
}

/**
 * Parse an Adaptive Card attachment JSON wrapper into readable HTML.
 * Format: {"text":"...","attachments":[{"contentType":"application/vnd.microsoft.card.adaptive","content":{...}}]}
 */
function adaptiveCardToHtml(raw: string): string | null {
    try {
        const wrapper = JSON.parse(raw) as IACWrapper;
        if (!Array.isArray(wrapper.attachments)) return null;

        const adaptive = wrapper.attachments.find(
            a => a.contentType === 'application/vnd.microsoft.card.adaptive'
        );
        if (adaptive?.content?.type !== 'AdaptiveCard') return null;

        let html = '';

        if (wrapper.text?.trim()) {
            html += `<p>${esc(wrapper.text.trim())}</p>`;
        }

        if (Array.isArray(adaptive.content.body)) {
            html += renderACElements(adaptive.content.body);
        }

        if (Array.isArray(adaptive.content.actions) && adaptive.content.actions.length > 0) {
            html += '<div class="adaptive-actions">';
            for (const action of adaptive.content.actions) {
                html += `<span class="adaptive-action-btn">${esc(action.title)}</span>`;
            }
            html += '</div>';
        }

        return html || null;
    } catch {
        return null;
    }
}


function htmlContainsTerm(html: string, term: string): boolean {
    const stripped = html.replace(/<[^>]*>/g, ' ');
    return stripped.toLowerCase().includes(term.toLowerCase());
}

export const ChatTranscript: React.FC<IChatTranscriptProps> = ({ messages, searchTerm, onMatchCount, activeTimeSeconds }) => {
    const strings = useStrings();
    const flowRef = React.useRef<HTMLDivElement>(null);
    const term = searchTerm?.trim() ?? '';
    const userScrolledRef = React.useRef(false);

    // Detect manual scroll — pauses auto-scroll until user scrolls near bottom again
    const handleScroll = React.useCallback(() => {
        const el = flowRef.current;
        if (!el) return;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        userScrolledRef.current = !nearBottom;
    }, []);

    // Auto-scroll to bottom when messages load (not during search, not if user scrolled away)
    React.useEffect(() => {
        if (term) return;
        const el = flowRef.current;
        if (el && !userScrolledRef.current) el.scrollTop = el.scrollHeight;
    }, [messages.length, term]);

    if (messages.length === 0) {
        return (
            <div className="transcript-empty" role="status">
                <div>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                    <div>{strings.labelTranscriptNotAvailable}</div>
                </div>
            </div>
        );
    }

    const contentMessages = messages.filter(m => m.sender !== 'system');
    const matchCount = term
        ? contentMessages.filter(m => m.content.toLowerCase().includes(term.toLowerCase())).length
        : 0;

    // Keep a ref to the latest onMatchCount so the effect never depends on its identity
    const onMatchCountRef = React.useRef(onMatchCount);
    onMatchCountRef.current = onMatchCount;

    // Report match count to parent (G-2) — deps are data-only, never the callback reference
    React.useEffect(() => {
        onMatchCountRef.current?.(matchCount, contentMessages.length);
    }, [matchCount, contentMessages.length]);

    // Compute active message index for audio sync (G-3)
    // Tier-1 (offsetMs): messages stay in original annotation order (conversation order).
    //   offsetMs is used only to drive the highlight cursor. Because annotation commit-time
    //   order and ACS recording-start-time order can differ, we do a max-value scan across
    //   ALL messages: find the message (any position) with the largest offsetMs ≤ current time.
    // Tier-2 (1970-epoch): ACS-JSON / plain-text parser produced 1970-epoch dates where
    //   created.getTime() / 1000 = seconds from call start.
    // Tier-3 (fallback): ISO timestamps with no offsetMs — normalize to first message.
    const activeIndex = React.useMemo(() => {
        if (activeTimeSeconds === undefined || activeTimeSeconds < 0) return -1;
        const contentMsgs = messages.filter(m => m.sender !== 'system');
        if (contentMsgs.length === 0) return -1;

        const hasOffsetMs = contentMsgs.some(m => m.offsetMs !== undefined);
        const isOffsetBased = !hasOffsetMs && contentMsgs[0].created.getFullYear() === 1970;
        const refMs = hasOffsetMs || isOffsetBased ? 0 : contentMsgs[0].created.getTime();

        if (hasOffsetMs) {
            // Max-value scan: find the message with the largest offsetMs that hasn't been
            // passed yet. Must not break early — messages are in annotation order, not offsetMs order.
            let best = -1;
            let bestMs = -1;
            for (let i = 0; i < messages.length; i++) {
                const msg = messages[i];
                if (msg.sender === 'system' || msg.offsetMs === undefined) continue;
                if (msg.offsetMs <= activeTimeSeconds * 1000 && msg.offsetMs > bestMs) {
                    bestMs = msg.offsetMs;
                    best = i;
                }
            }
            return best;
        }

        // Tier-2/3: messages are in time order, break early
        let last = -1;
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (msg.sender === 'system') continue;
            const offsetSec = (msg.created.getTime() - refMs) / 1000;
            if (offsetSec <= activeTimeSeconds) last = i;
            else break;
        }
        return last;
    }, [messages, activeTimeSeconds]);

    // Refs for each message row — used to scroll active message into view
    const rowRefs = React.useRef<(HTMLDivElement | null)[]>([]);

    // Auto-scroll to active message during playback (pause if user manually scrolled)
    React.useEffect(() => {
        if (activeIndex < 0 || userScrolledRef.current) return;
        const el = rowRefs.current[activeIndex];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [activeIndex]);

    return (
        <>
            <div
                ref={flowRef}
                className="chat-flow"
                role="log"
                aria-label={strings.ariaConversationTranscript}
                aria-live="polite"
                onScroll={handleScroll}
            >
                {messages.map((msg, i) => {
                    if (msg.sender === 'system') {
                        return (
                            <div key={msg.id || i} className="event-divider" role="separator">
                                {msg.content}
                            </div>
                        );
                    }

                    const isAgent = msg.sender === 'agent' || msg.sender === 'bot';
                    const groupClass = isAgent ? 'agent' : 'customer';
                    const isActive = i === activeIndex;

                    const isHtml = msg.contentType === 'text/html' ||
                        (msg.content.trimStart().startsWith('<') && msg.content.includes('</'));

                    const isACWrapper = !isHtml &&
                        msg.content.trimStart().startsWith('{') &&
                        msg.content.includes('application/vnd.microsoft.card.adaptive');

                    const isMd = !isHtml && !isACWrapper && isMarkdown(msg.content, msg.contentType ?? '');

                    const matchesSearch = term
                        ? msg.content.toLowerCase().includes(term.toLowerCase())
                        : false;

                    let __html: string;
                    if (isACWrapper) {
                        __html = adaptiveCardToHtml(msg.content) ?? textToHtml(msg.content, term || undefined);
                    } else if (isHtml) {
                        __html = sanitizeHtml(msg.content);
                    } else if (isMd) {
                        __html = chatMarkdownToHtml(msg.content);
                    } else {
                        __html = textToHtml(msg.content, term || undefined);
                    }

                    return (
                        <div
                            key={msg.id || i}
                            ref={el => { rowRefs.current[i] = el; }}
                            className={`message-group ${groupClass}`}
                            role="article"
                        >
                            <div className="msg-info">
                                {msg.senderName && <span>{msg.senderName}</span>}
                                <span>{formatTime(msg.created)}</span>
                            </div>
                            {/* dir="auto" lets the browser detect per-bubble text direction */}
                            <div
                                className={`bubble${isHtml && matchesSearch ? ' bubble-match' : ''}${isActive ? ' bubble--active' : ''}`}
                                dir="auto"
                                dangerouslySetInnerHTML={{ __html }}
                                aria-label={`${msg.senderName || msg.sender} ${formatTime(msg.created)}`}
                            />
                        </div>
                    );
                })}
            </div>
        </>
    );
};
