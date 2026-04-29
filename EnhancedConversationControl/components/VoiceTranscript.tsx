import * as React from 'react';
import { useStrings } from '../i18n/StringsContext';

interface IVoiceTranscriptProps {
    text: string | null;
}

export const VoiceTranscript: React.FC<IVoiceTranscriptProps> = ({ text }) => {
    const strings = useStrings();

    if (!text) {
        return (
            <div className="transcript-empty" role="status">
                <div>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
                    <div>{strings.labelVoiceTranscriptNotAvailable}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="voice-transcript" role="log" aria-label={strings.ariaConversationTranscript} dir="auto">
            {text}
        </div>
    );
};
