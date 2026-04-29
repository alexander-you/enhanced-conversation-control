import * as React from 'react';
import { useStrings } from '../i18n/StringsContext';

interface ICopilotSummaryProps {
    markdown: string | null;
    /** Controlled expanded state — owned by Sidebar so journey-expand can collapse it. */
    isExpanded: boolean;
    onToggle: () => void;
}

/** Convert markdown string → sanitized HTML with bold, paragraphs, and section splits. */
function markdownToHtml(md: string): string {
    // Escape HTML entities first so we don't double-process later bold tags
    let text = md
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Inline markdown: **bold** → <strong>, *italic* → <em>
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');

    // If the text already has explicit newlines, use them as paragraph/line breaks
    if (text.includes('\n')) {
        const blocks = text.split(/\n{2,}/);
        return blocks.map(block => {
            const lines = block.split('\n').filter(l => l.trim());
            if (lines.length === 0) return '';
            return `<p>${lines.join('<br/>')}</p>`;
        }).filter(Boolean).join('');
    }

    // No newlines — split into paragraphs by splitting before each <strong> section header.
    // This handles the common D365 Copilot format: **Label:** content **Label2:** content...
    const parts = text.split(/(?=<strong>)/).filter(Boolean);
    if (parts.length > 1) {
        return parts.map(p => `<p>${p.trim()}</p>`).join('');
    }

    // Plain text fallback
    return `<p>${text}</p>`;
}

export const CopilotSummary: React.FC<ICopilotSummaryProps> = ({ markdown, isExpanded, onToggle }) => {
    const strings = useStrings();

    if (!markdown) return null;

    const html = markdownToHtml(markdown);

    return (
        <div className="sidebar-section summary-section">
            <div className="section-title">
                <div className="section-title-inner">
                    <img
                        src="/WebResources/alex_copilot_logo"
                        className="sidebar-copilot-logo"
                        alt=""
                        aria-hidden="true"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span>{strings.labelCopilotSummary}</span>
                    <span className="ai-badge">{strings.labelAI}</span>
                </div>
                <button
                    type="button"
                    className={`collapse-btn${isExpanded ? ' expanded' : ''}`}
                    onClick={onToggle}
                    aria-label={isExpanded ? 'Collapse summary' : 'Expand summary'}
                    aria-expanded={isExpanded}
                >
                    ›
                </button>
            </div>
            {isExpanded && (
                <div
                    className="summary-body"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            )}
        </div>
    );
};
