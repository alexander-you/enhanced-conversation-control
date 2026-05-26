/** All localizable strings used by the Enhanced Conversation Control. */
export interface IStrings {
    // Channel labels
    labelLiveChat: string;
    labelVoice: string;
    labelVoiceCallback: string;
    labelUnknown: string;

    // Status labels
    labelActive: string;
    labelWaiting: string;
    labelClosed: string;
    labelWrapUp: string;
    labelResolved: string;
    labelOpen: string;

    // Header
    labelUnknownCustomer: string;
    labelToday: string;
    ariaConversationDetails: string;

    // Transcript
    labelTranscript: string;
    labelVoiceTranscript: string;
    labelTranscriptNotAvailable: string;
    labelVoiceTranscriptNotAvailable: string;
    ariaConversationTranscript: string;

    // Sidebar
    labelCopilotSummary: string;
    labelAI: string;
    labelTagsKeywords: string;
    labelConversationJourney: string;
    labelSession: string;
    labelLessThan1Min: string;

    // Call metrics
    labelCallMetrics: string;
    labelDuration: string;
    labelTalkSpeed: string;
    labelSwitches: string;
    labelAvgPause: string;
    labelTalkListenRatio: string;
    labelOverallSentiment: string;
    labelWordsPerMin: string;

    // Audio player
    labelPlay: string;
    labelPause: string;
    ariaPlay: string;
    ariaPause: string;
    ariaDownloadAudio: string;
    ariaDownloadTranscript: string;
    labelDownloadAudio: string;
    labelDownloadTranscript: string;
    ariaAudioPlayer: string;
    ariaPlaybackSpeed: string;
    ariaSeekAudio: string;

    // Search & AI Insights
    labelAIInsights: string;
    labelSearchPlaceholder: string;
    labelSearchOf: string;
    labelNoInsights: string;
    labelNoMatches: string;

    // Conversation Journey session types & sentiment
    labelInitialCall: string;
    labelEscalation: string;
    labelTransfer: string;
    labelSentimentPositive: string;
    labelSentimentNegative: string;
    labelSentimentNeutral: string;

    // Journey enrichment labels (Phase 1+)
    labelJourneyExpand: string;
    labelJourneyCollapse: string;
    labelTotalDuration: string;
    labelBotSession: string;
    labelTransferDeclined: string;
    labelNeverAccepted: string;
    labelSessionInitial: string;
    labelSessionTransfer: string;
    labelSessionDeclined: string;
    labelSessionClosed: string;
    labelSessionTransferred: string;
    labelWrapUpStarted: string;
    labelQueuedIn: string;
    labelQueueWait: string;
    labelConsultJoined: string;
    labelConsultTransferred: string;

    // Chat bubble — multi-agent & consult labels
    labelPrivateConsult: string;
    labelTransferDivider: string;
    labelConsultDivider: string;

    // Insights Dashboard labels (Phase 3)
    labelInsights: string;
    labelConversationInsights: string;
    labelInsightsTiming: string;
    labelInsightsRouting: string;
    labelInsightsQuality: string;
    labelInsightsParticipants: string;
    labelQueueWaitTime: string;
    labelTalkTime: string;
    labelHoldTime: string;
    labelWrapUpTime: string;
    labelHandleTime: string;
    labelSessionsCount: string;
    labelTransfers: string;
    labelEscalationsCount: string;
    labelDeclinedCount: string;
    labelAgentTalkRatio: string;
    labelSpeakingPace: string;
    labelLongestMonologue: string;
    labelConvSwitches: string;

    // Loading / errors
    labelLoading: string;
    errorNoId: string;
    errorFailed: string;
}

/** Fallback English strings — used when context.resources is not yet available. */
export const DEFAULT_STRINGS: IStrings = {
    labelLiveChat: 'Live Chat',
    labelVoice: 'Voice',
    labelVoiceCallback: 'Voice Callback',
    labelUnknown: 'Unknown',
    labelActive: 'Active',
    labelWaiting: 'Waiting',
    labelClosed: 'Closed',
    labelWrapUp: 'Wrap-up',
    labelResolved: 'Resolved',
    labelOpen: 'Open',
    labelUnknownCustomer: 'Unknown Customer',
    labelToday: 'Today',
    ariaConversationDetails: 'Conversation details',
    labelTranscript: 'Transcript',
    labelVoiceTranscript: 'Voice Transcript',
    labelTranscriptNotAvailable: 'Transcript not available',
    labelVoiceTranscriptNotAvailable: 'Voice transcript not available',
    ariaConversationTranscript: 'Conversation transcript',
    labelCopilotSummary: 'Copilot Summary',
    labelAI: 'AI',
    labelTagsKeywords: 'Tags & Keywords',
    labelConversationJourney: 'Conversation Journey',
    labelSession: 'Session',
    labelLessThan1Min: '< 1 min',
    labelCallMetrics: 'Call Metrics',
    labelDuration: 'Duration',
    labelTalkSpeed: 'Talk Speed',
    labelSwitches: 'Switches',
    labelAvgPause: 'Avg Pause',
    labelTalkListenRatio: 'Talk / Listen Ratio',
    labelOverallSentiment: 'Overall Sentiment',
    labelWordsPerMin: 'w/m',
    labelPlay: 'Play',
    labelPause: 'Pause',
    ariaPlay: 'Play audio',
    ariaPause: 'Pause audio',
    ariaDownloadAudio: 'Download audio recording',
    ariaDownloadTranscript: 'Download voice transcript',
    labelDownloadAudio: 'Download Audio',
    labelDownloadTranscript: 'Download Transcript',
    ariaAudioPlayer: 'Audio player',
    ariaPlaybackSpeed: 'Playback speed',
    ariaSeekAudio: 'Seek audio position',
    labelLoading: 'Loading conversation data',
    errorNoId: 'No conversation ID available in this context.',
    errorFailed: 'Failed to load conversation',
    labelAIInsights: 'AI Insights',
    labelSearchPlaceholder: 'Search transcript...',
    labelSearchOf: 'of',
    labelNoInsights: 'No insights available for this conversation.',
    labelNoMatches: 'No matches',
    labelInitialCall: 'Initial Call',
    labelEscalation: 'Escalation',
    labelTransfer: 'Transfer',
    labelSentimentPositive: '↑ Positive',
    labelSentimentNegative: '↓ Negative',
    labelSentimentNeutral: '– Neutral',
    labelJourneyExpand: 'Expand',
    labelJourneyCollapse: 'Collapse',
    labelTotalDuration: 'Total',
    labelBotSession: 'Bot Session',
    labelTransferDeclined: 'Transfer Declined',
    labelNeverAccepted: 'Never accepted',
    labelSessionInitial: 'Initial',
    labelSessionTransfer: 'Transfer',
    labelSessionDeclined: 'Declined',
    labelSessionClosed: 'Closed',
    labelSessionTransferred: 'Transferred',
    labelWrapUpStarted: 'Wrap-up started',
    labelQueuedIn: 'Routed to:',
    labelQueueWait: 'Queue wait:',
    labelConsultJoined: 'Consult:',
    labelConsultTransferred: '→ Transferred to',

    // Chat bubble — multi-agent & consult labels
    labelPrivateConsult: 'Internal',
    labelTransferDivider: 'Transfer',
    labelConsultDivider: 'Consult',

    // Insights Dashboard labels (Phase 3)
    labelInsights: 'Insights',
    labelConversationInsights: 'Conversation Insights',
    labelInsightsTiming: 'Timing',
    labelInsightsRouting: 'Routing',
    labelInsightsQuality: 'AI / Voice Quality',
    labelInsightsParticipants: 'Participants',
    labelQueueWaitTime: 'Queue Wait',
    labelTalkTime: 'Talk Time',
    labelHoldTime: 'Hold Time',
    labelWrapUpTime: 'Wrap-up',
    labelHandleTime: 'Handle Time',
    labelSessionsCount: 'Sessions',
    labelTransfers: 'Transfers',
    labelEscalationsCount: 'Escalations',
    labelDeclinedCount: 'Declined',
    labelAgentTalkRatio: 'Agent Talk Ratio',
    labelSpeakingPace: 'Speaking Pace',
    labelLongestMonologue: 'Longest Monologue',
    labelConvSwitches: 'Conv. Switches',
};

/** Build the IStrings object from PCF context.resources (live localized values). */
export function createStrings(resources: ComponentFramework.Resources): IStrings {
    const s = (key: string, fallback: string): string => {
        try {
            const v = resources.getString(key);
            return v && v !== key ? v : fallback;
        } catch {
            return fallback;
        }
    };
    const d = DEFAULT_STRINGS;
    return {
        labelLiveChat:                  s('Label_LiveChat', d.labelLiveChat),
        labelVoice:                     s('Label_Voice', d.labelVoice),
        labelVoiceCallback:             s('Label_VoiceCallback', d.labelVoiceCallback),
        labelUnknown:                   s('Label_Unknown', d.labelUnknown),
        labelActive:                    s('Label_Active', d.labelActive),
        labelWaiting:                   s('Label_Waiting', d.labelWaiting),
        labelClosed:                    s('Label_Closed', d.labelClosed),
        labelWrapUp:                    s('Label_WrapUp', d.labelWrapUp),
        labelResolved:                  s('Label_Resolved', d.labelResolved),
        labelOpen:                      s('Label_Open', d.labelOpen),
        labelUnknownCustomer:           s('Label_UnknownCustomer', d.labelUnknownCustomer),
        labelToday:                     s('Label_Today', d.labelToday),
        ariaConversationDetails:        s('Aria_ConversationDetails', d.ariaConversationDetails),
        labelTranscript:                s('Label_Transcript', d.labelTranscript),
        labelVoiceTranscript:           s('Label_VoiceTranscript', d.labelVoiceTranscript),
        labelTranscriptNotAvailable:    s('Label_TranscriptNotAvailable', d.labelTranscriptNotAvailable),
        labelVoiceTranscriptNotAvailable: s('Label_VoiceTranscriptNotAvailable', d.labelVoiceTranscriptNotAvailable),
        ariaConversationTranscript:     s('Aria_ConversationTranscript', d.ariaConversationTranscript),
        labelCopilotSummary:            s('Label_CopilotSummary', d.labelCopilotSummary),
        labelAI:                        s('Label_AI', d.labelAI),
        labelTagsKeywords:              s('Label_TagsKeywords', d.labelTagsKeywords),
        labelConversationJourney:       s('Label_ConversationJourney', d.labelConversationJourney),
        labelSession:                   s('Label_Session', d.labelSession),
        labelLessThan1Min:              s('Label_LessThan1Min', d.labelLessThan1Min),
        labelCallMetrics:               s('Label_CallMetrics', d.labelCallMetrics),
        labelDuration:                  s('Label_Duration', d.labelDuration),
        labelTalkSpeed:                 s('Label_TalkSpeed', d.labelTalkSpeed),
        labelSwitches:                  s('Label_Switches', d.labelSwitches),
        labelAvgPause:                  s('Label_AvgPause', d.labelAvgPause),
        labelTalkListenRatio:           s('Label_TalkListenRatio', d.labelTalkListenRatio),
        labelOverallSentiment:          s('Label_OverallSentiment', d.labelOverallSentiment),
        labelWordsPerMin:               s('Label_WordsPerMin', d.labelWordsPerMin),
        labelPlay:                      s('Label_Play', d.labelPlay),
        labelPause:                     s('Label_Pause', d.labelPause),
        ariaPlay:                       s('Aria_Play', d.ariaPlay),
        ariaPause:                      s('Aria_Pause', d.ariaPause),
        ariaDownloadAudio:              s('Aria_DownloadAudio', d.ariaDownloadAudio),
        ariaDownloadTranscript:         s('Aria_DownloadTranscript', d.ariaDownloadTranscript),
        labelDownloadAudio:             s('Label_DownloadAudio', d.labelDownloadAudio),
        labelDownloadTranscript:        s('Label_DownloadTranscript', d.labelDownloadTranscript),
        ariaAudioPlayer:                s('Aria_AudioPlayer', d.ariaAudioPlayer),
        ariaPlaybackSpeed:              s('Aria_PlaybackSpeed', d.ariaPlaybackSpeed),
        ariaSeekAudio:                  s('Aria_SeekAudio', d.ariaSeekAudio),
        labelLoading:                   s('Label_Loading', d.labelLoading),
        errorNoId:                      s('Error_NoId', d.errorNoId),
        errorFailed:                    s('Error_Failed', d.errorFailed),
        labelAIInsights:                s('Label_AIInsights', d.labelAIInsights),
        labelSearchPlaceholder:         s('Label_SearchPlaceholder', d.labelSearchPlaceholder),
        labelSearchOf:                  s('Label_SearchOf', d.labelSearchOf),
        labelNoInsights:                s('Label_NoInsights', d.labelNoInsights),
        labelNoMatches:                 s('Label_NoMatches', d.labelNoMatches),
        labelInitialCall:               s('Label_InitialCall', d.labelInitialCall),
        labelEscalation:                s('Label_Escalation', d.labelEscalation),
        labelTransfer:                  s('Label_Transfer', d.labelTransfer),
        labelSentimentPositive:         s('Label_SentimentPositive', d.labelSentimentPositive),
        labelSentimentNegative:         s('Label_SentimentNegative', d.labelSentimentNegative),
        labelSentimentNeutral:          s('Label_SentimentNeutral', d.labelSentimentNeutral),
        labelJourneyExpand:             s('Label_JourneyExpand', d.labelJourneyExpand),
        labelJourneyCollapse:           s('Label_JourneyCollapse', d.labelJourneyCollapse),
        labelTotalDuration:             s('Label_TotalDuration', d.labelTotalDuration),
        labelBotSession:                s('Label_BotSession', d.labelBotSession),
        labelTransferDeclined:          s('Label_TransferDeclined', d.labelTransferDeclined),
        labelNeverAccepted:             s('Label_NeverAccepted', d.labelNeverAccepted),
        labelSessionInitial:            s('Label_SessionInitial', d.labelSessionInitial),
        labelSessionTransfer:           s('Label_SessionTransfer', d.labelSessionTransfer),
        labelSessionDeclined:           s('Label_SessionDeclined', d.labelSessionDeclined),
        labelSessionClosed:             s('Label_SessionClosed', d.labelSessionClosed),
        labelSessionTransferred:        s('Label_SessionTransferred', d.labelSessionTransferred),
        labelWrapUpStarted:             s('Label_WrapUpStarted', d.labelWrapUpStarted),
        labelQueuedIn:                  s('Label_QueuedIn', d.labelQueuedIn),
        labelQueueWait:                 s('Label_QueueWait', d.labelQueueWait),
        labelConsultJoined:             s('Label_ConsultJoined', d.labelConsultJoined),
        labelConsultTransferred:        s('Label_ConsultTransferred', d.labelConsultTransferred),
        labelPrivateConsult:            s('Label_PrivateConsult', d.labelPrivateConsult),
        labelTransferDivider:           s('Label_TransferDivider', d.labelTransferDivider),
        labelConsultDivider:            s('Label_ConsultDivider', d.labelConsultDivider),
        labelInsights:                  s('Label_Insights', d.labelInsights),
        labelConversationInsights:      s('Label_ConversationInsights', d.labelConversationInsights),
        labelInsightsTiming:            s('Label_InsightsTiming', d.labelInsightsTiming),
        labelInsightsRouting:           s('Label_InsightsRouting', d.labelInsightsRouting),
        labelInsightsQuality:           s('Label_InsightsQuality', d.labelInsightsQuality),
        labelInsightsParticipants:      s('Label_InsightsParticipants', d.labelInsightsParticipants),
        labelQueueWaitTime:             s('Label_QueueWaitTime', d.labelQueueWaitTime),
        labelTalkTime:                  s('Label_TalkTime', d.labelTalkTime),
        labelHoldTime:                  s('Label_HoldTime', d.labelHoldTime),
        labelWrapUpTime:                s('Label_WrapUpTime', d.labelWrapUpTime),
        labelHandleTime:                s('Label_HandleTime', d.labelHandleTime),
        labelSessionsCount:             s('Label_SessionsCount', d.labelSessionsCount),
        labelTransfers:                 s('Label_Transfers', d.labelTransfers),
        labelEscalationsCount:          s('Label_EscalationsCount', d.labelEscalationsCount),
        labelDeclinedCount:             s('Label_DeclinedCount', d.labelDeclinedCount),
        labelAgentTalkRatio:            s('Label_AgentTalkRatio', d.labelAgentTalkRatio),
        labelSpeakingPace:              s('Label_SpeakingPace', d.labelSpeakingPace),
        labelLongestMonologue:          s('Label_LongestMonologue', d.labelLongestMonologue),
        labelConvSwitches:              s('Label_ConvSwitches', d.labelConvSwitches),
    };
}
