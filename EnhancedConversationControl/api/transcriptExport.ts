import { IMessage } from '../types';

export interface ITranscriptMeta {
    subject: string | null;
    customerName: string | null;
    startedOn: string | null;
}

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

function formatTimestamp(date: Date): string {
    if (date.getFullYear() === 1970) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function generateHtmlTranscript(messages: IMessage[], meta: ITranscriptMeta): string {
    const title = meta.subject ?? 'Conversation Transcript';
    const dateStr = meta.startedOn
        ? new Date(meta.startedOn).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
        : '';
    const customerStr = meta.customerName ?? '';

    const rows = messages
        .filter(m => m.sender !== 'system')
        .map(m => {
            const isAgent = m.sender === 'agent' || m.sender === 'bot';
            const timeStr = formatOffsetForHtml(m.offsetMs) || formatTimestamp(m.created);
            const roleClass = isAgent ? 'agent' : 'customer';
            const privateLabel = m.isPrivate ? ' <span class="msg-private">Internal</span>' : '';
            return `
        <div class="msg-row msg-row--${roleClass}${m.isPrivate ? ' msg-row--private' : ''}">
            <div class="msg-bubble">
                <div class="msg-meta">
                    <span class="msg-sender">${escapeHtml(m.senderName)}</span>
                    ${privateLabel}
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
        .msg-row--private { opacity: 0.85; }
        .msg-bubble { max-width: 72%; padding: 10px 14px; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,.06); }
        .msg-row--agent .msg-bubble { background: #6366F1; color: white; border-bottom-right-radius: 4px; }
        .msg-row--private .msg-bubble { background: #EDE9FE; color: #1E293B; border: 1.5px dashed #8B5CF6; }
        .msg-row--customer .msg-bubble { background: white; border-bottom-left-radius: 4px; }
        .msg-meta { font-size: 10px; margin-bottom: 4px; opacity: 0.75; display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
        .msg-sender { font-weight: 700; }
        .msg-private { font-size: 9px; font-weight: 600; text-transform: uppercase; background: #DDD6FE; color: #5B21B6; padding: 1px 5px; border-radius: 3px; opacity: 1 !important; }
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

export function downloadTranscriptAsHtml(messages: IMessage[], meta: ITranscriptMeta): void {
    const html = generateHtmlTranscript(messages, meta);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.html';
    a.click();
    URL.revokeObjectURL(url);
}
