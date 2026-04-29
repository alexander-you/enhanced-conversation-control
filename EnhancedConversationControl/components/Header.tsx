import * as React from 'react';
import { IConversation, RenderMode } from '../types';
import { useStrings } from '../i18n/StringsContext';

interface IHeaderProps {
    conversation: IConversation | null;
    renderMode: RenderMode;
}

function getInitials(displayName: string | null): string {
    if (!displayName) return '?';
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
}

import { IStrings } from '../i18n/strings';

function getChannelLabel(renderMode: RenderMode, strings: IStrings): string {
    switch (renderMode) {
        case 'chat': return strings.labelLiveChat;
        case 'voice': return strings.labelVoice;
        case 'voicecallback': return strings.labelVoiceCallback;
        default: return strings.labelUnknown;
    }
}

function getStatusPill(statuscode: number | undefined, strings: IStrings): { label: string; cls: string } {
    switch (statuscode) {
        case 2: return { label: `● ${strings.labelActive}`, cls: 'pill-light-green' };
        case 3: return { label: `◌ ${strings.labelWaiting}`, cls: 'pill-blue' };
        case 4: return { label: `✕ ${strings.labelClosed}`, cls: 'pill-green' };
        case 5: return { label: `⟳ ${strings.labelWrapUp}`, cls: 'pill-amber' };
        case 6: return { label: `✓ ${strings.labelResolved}`, cls: 'pill-light-green' };
        default: return { label: strings.labelOpen, cls: 'pill-green' };
    }
}

function formatStartTime(isoString: string | null, labelToday: string): string {
    if (!isoString) return '';
    try {
        const d = new Date(isoString);
        const today = new Date();
        const isToday =
            d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
        const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return isToday ? `${labelToday}, ${time}` : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${time}`;
    } catch {
        return '';
    }
}

export const Header: React.FC<IHeaderProps> = ({ conversation, renderMode }) => {
    const strings = useStrings();
    if (!conversation) return null;

    const customerName = conversation['_msdyn_customer_value@OData.Community.Display.V1.FormattedValue'] ?? null;
    const queueName = conversation['_msdyn_cdsqueueid_value@OData.Community.Display.V1.FormattedValue'] ?? null;
    const languageName = conversation['_msdyn_customerlanguageid_value@OData.Community.Display.V1.FormattedValue'] ?? null;
    const regardingName = conversation['_regardingobjectid_value@OData.Community.Display.V1.FormattedValue'] ?? null;

    const initials = getInitials(customerName);
    const isOpen = conversation.statecode === 0;
    const statusPill = getStatusPill(conversation.statuscode ?? undefined, strings);
    const startTimeStr = formatStartTime(conversation.msdyn_startedon, strings.labelToday);

    const subLineParts: string[] = [];
    if (regardingName) subLineParts.push(regardingName);
    if (startTimeStr) subLineParts.push(startTimeStr);

    return (
        <div className="pcf-header">
            <div className="user-profile">
                <div className="avatar-circle" aria-label={`${customerName ?? strings.labelUnknownCustomer}`}>
                    {initials}
                </div>
                <div className="user-details">
                    <h2>{customerName ?? conversation.subject ?? strings.labelUnknownCustomer}</h2>
                    <p>
                        <span className={`health-dot ${isOpen ? 'open' : 'closed'}`} aria-hidden="true" />
                        {subLineParts.join(' · ')}
                    </p>
                </div>
            </div>
            <div className="header-pills" role="list" aria-label={strings.ariaConversationDetails}>
                <div className="pill pill-blue" role="listitem">{getChannelLabel(renderMode, strings)}</div>
                {languageName && <div className="pill pill-blue" role="listitem">{languageName}</div>}
                {queueName && <div className="pill pill-amber" role="listitem">{queueName}</div>}
                <div className={`pill ${statusPill.cls}`} role="listitem">{statusPill.label}</div>
            </div>
        </div>
    );
};
