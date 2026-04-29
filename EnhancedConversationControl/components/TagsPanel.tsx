import * as React from 'react';
import { useStrings } from '../i18n/StringsContext';

interface ITagsPanelProps {
    keywords: string | null;
}

export const TagsPanel: React.FC<ITagsPanelProps> = ({ keywords }) => {
    const strings = useStrings();
    if (!keywords) return null;

    const tags = keywords
        .split(/[,;]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

    if (tags.length === 0) return null;

    return (
        <div className="sidebar-section">
            <div className="section-title">{strings.labelTagsKeywords}</div>
            <div className="tag-container" role="list" aria-label={strings.labelTagsKeywords}>
                {tags.map((tag, i) => (
                    <span
                        key={i}
                        className={`tag${i % 5 === 4 ? ' tag-purple' : ''}`}
                        role="listitem"
                    >
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
};
