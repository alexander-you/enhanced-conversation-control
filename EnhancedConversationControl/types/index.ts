export type RenderMode = 'chat' | 'voice' | 'voicecallback' | 'unknown';

export interface IConversation {
    activityid: string;
    subject: string | null;
    msdyn_channel: string | null;
    statecode: number;
    statuscode: number;
    msdyn_startedon: string | null;
    msdyn_closedon: string | null;
    _msdyn_customer_value: string | null;
    '_msdyn_customer_value@OData.Community.Display.V1.FormattedValue': string | null;
    '_msdyn_customer_value@Microsoft.Dynamics.CRM.lookuplogicalname': string | null;
    _msdyn_activeagentid_value: string | null;
    '_msdyn_activeagentid_value@OData.Community.Display.V1.FormattedValue': string | null;
    _msdyn_cdsqueueid_value: string | null;
    '_msdyn_cdsqueueid_value@OData.Community.Display.V1.FormattedValue': string | null;
    _msdyn_customerlanguageid_value: string | null;
    '_msdyn_customerlanguageid_value@OData.Community.Display.V1.FormattedValue': string | null;
    _regardingobjectid_value: string | null;
    '_regardingobjectid_value@OData.Community.Display.V1.FormattedValue': string | null;
    '_regardingobjectid_value@Microsoft.Dynamics.CRM.lookuplogicalname': string | null;
    msdyn_customersentimentlabel: number | null;
    msdyn_urcustomersentimentscore: number | null;
    msdyn_urcustomersentimentkeywords: string | null;
    msdyn_copilotengaged: boolean | null;
    msdyn_intent: string | null;
    msdyn_conversationtype: number | null;
    msdyn_isoutbound: boolean | null;

    // ── Insights Dashboard timing & routing fields ─────────────────────────
    msdyn_transfercount: number | null;
    msdyn_escalationcount: number | null;
    msdyn_overflowtransfercount: number | null;
    msdyn_conversationhandletimeinseconds: number | null;
    msdyn_conversationtalktimeinseconds: number | null;
    msdyn_conversationholdtimeinseconds: number | null;
    msdyn_conversationwrapuptimeinseconds: number | null;
    msdyn_conversationfirstwaittimeinseconds: number | null;
}

export interface ITranscript {
    msdyn_transcriptid: string;
    msdyn_voicetranscript_formatted_name: string | null;
    createdon: string;
}

export interface ITranscriptMessage {
    id: string;
    created: string;
    createdDateTime?: string;
    isControlMessage: boolean;
    content: string;
    contentType?: string;
    deleted?: boolean;
    from: {
        user?: { displayName: string; id: string };
        application?: { displayName: string };
    };
    tags?: string;
    attachments?: unknown[];
}

export type SenderType = 'agent' | 'customer' | 'system' | 'bot';

export interface IMessage {
    id: string;
    created: Date;
    sender: SenderType;
    senderName: string;
    content: string;
    contentType: string;
    /** ACS fragment start time in ms from recording start — stamped when ACS JSON is available.
     *  When present, use offsetMs/1000 as the sync position instead of wall-clock timestamps. */
    offsetMs?: number;
    /** Stable agent GUID from `from.user.id` — used to assign per-agent visual distinction. */
    agentId?: string;
    /** True when the message is part of an internal consult (tags contain "private"). */
    isPrivate?: boolean;
}

export interface ISession {
    activityid: string;
    subject: string | null;
    statecode: number;
    actualstart: string | null;
    actualend: string | null;
    createdon: string;
    _ownerid_value: string | null;
    '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string | null;

    // ── Journey enrichment fields ──────────────────────────────────────────
    /** 192350000=Initial, 192350001=Transfer */
    msdyn_sessioncreationreason: number | null;
    /** 192350004=Declined, 192350005=Closed, 192350006=Transferred */
    msdyn_closurereason: number | null;
    /** Non-null when a bot was engaged */
    msdyn_botengagementmode: number | null;
    /** Queue GUID this session was routed to */
    _msdyn_cdsqueueid_value: string | null;
    '_msdyn_cdsqueueid_value@OData.Community.Display.V1.FormattedValue'?: string | null;
    /** When the agent accepted the session (null = never accepted / declined) */
    msdyn_agentacceptedon: string | null;
    /** When the session was assigned to an agent */
    msdyn_agentassignedon: string | null;
    /** When the session entered the queue */
    msdyn_queueassignedon: string | null;
    /** When wrap-up was initiated */
    msdyn_wrapupinitiatedon: string | null;
}

export interface IInsight {
    msdyn_conversationinsightid: string;
    msdyn_copilotsummary: string | null;
    msdyn_summary: string | null;
    msdyn_insights_name: string | null;
    msdyn_callaveragepause: number | null;
    msdyn_callinsightduration: number | null;
    msdyn_calllongestcustomermonologue: number | null;
    msdyn_callswitchesperconversation: number | null;
    msdyn_calltalkingspeed: number | null;
    msdyn_calltalktolistenratio: number | null;
}

export interface IRecording {
    msdyn_ocrecordingid: string;
    msdyn_mediauri: string | null;
    msdyn_recording_name: string | null;
    statecode: number;
}

export interface IInsightsJson {
    version: string;
    insights: {
        callDuration: number;
        customerLongestMonologueInMs: number;
        avgPauseBeforeSpeakingInMs: number;
        switchCount: number;
        talkingSpeedWordsPerMin: number;
        talkToListenRatio: number;
        sentiments: { pulse: number; zone: string };
    };
    participants: ({ Id: number; DisplayName: string; Role: number } | null)[];
    messageInsights: {
        messageId: string;
        participantId: number;
        sentiments: { pulse: number; zone: string };
    }[];
}

export interface ISessionParticipant {
    msdyn_sessionparticipantid: string;
    /** FK → msdyn_ocsession.activityid */
    _msdyn_omnichannelsession_value: string;
    /** FK → systemuser */
    _msdyn_agentid_value: string | null;
    /** Display name formatted by OC */
    msdyn_name: string | null;
    /** 192350002=Primary, 192350003=Consulting */
    msdyn_mode: number | null;
    /** 2=Transfer-consult (ended in transfer) */
    msdyn_consultmode: number | null;
    msdyn_assignreason: string | null;
    msdyn_joinedon: string | null;
    msdyn_lefton: string | null;
    msdyn_leftonreason: string | null;
    msdyn_talktime: number | null;
    msdyn_holdtime: number | null;
    msdyn_activetime: number | null;
    _msdyn_cdsqueueid_value: string | null;
}

export interface IContextVariable {
    msdyn_name: string;
    msdyn_value: string | null;
}

export interface IControlState {
    loading: boolean;
    error: string | null;
    conversation: IConversation | null;
    renderMode: RenderMode;
    messages: IMessage[];
    voiceTranscriptText: string | null;
    transcriptId: string | null;
    sessions: ISession[];
    insight: IInsight | null;
    insightsJson: IInsightsJson | null;
    recording: IRecording | null;
}
