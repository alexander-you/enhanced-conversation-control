import {
    IConversation, ITranscript, ISession, ISessionParticipant, IInsight, IRecording,
    IInsightsJson, IMessage, ITranscriptMessage, SenderType, IContextVariable
} from '../types';

// ─── ACS Voice Transcript Types ──────────────────────────────────────────────

interface IAcsFragment {
    Text: string;
    ParticipantId: string;
    Start: string; // "HH:MM:SS.fffffff"
}

interface IAcsTranscript {
    Fragments?: IAcsFragment[];
}

/** Convert "M:SS", "MM:SS", or "H:MM:SS" offset string to a Date at epoch (year 1970). */
function parseTimeOffsetToDate(timeStr: string): Date {
    const parts = timeStr.split(':').map(Number);
    let ms = 0;
    if (parts.length === 2) {
        ms = ((parts[0] ?? 0) * 60 + (parts[1] ?? 0)) * 1000;
    } else if (parts.length === 3) {
        ms = ((parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0)) * 1000;
    }
    return new Date(ms);
}

/** Parse ACS time string "H:MM:SS.fffffff" to milliseconds from recording start. */
function parseAcsTimeToMs(t: string): number {
    try {
        const dotIdx = t.indexOf('.');
        const hms = dotIdx >= 0 ? t.slice(0, dotIdx) : t;
        const frac = dotIdx >= 0 ? t.slice(dotIdx + 1) : '0';
        const parts = hms.split(':').map(Number);
        const h = parts[0] ?? 0, m = parts[1] ?? 0, s = parts[2] ?? 0;
        return (h * 3600 + m * 60 + s) * 1000 +
            Math.floor(parseInt(frac.slice(0, 3).padEnd(3, '0')));
    } catch { return 0; }
}

/**
 * Strip HTML/entities and normalize text for fuzzy prefix-matching.
 * Keeps Latin, Hebrew (U+0590-U+05FF), Arabic (U+0600-U+06FF) and digits.
 */
function normalizeTextForMatch(s: string): string {
    return s
        .replace(/<[^>]*>/g, ' ')            // strip HTML tags
        .replace(/&[a-z#0-9]+;/gi, ' ')      // strip HTML entities
        .toLowerCase()
        .replace(/[^a-z0-9\u0590-\u05ff\u0600-\u06ff\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80);
}

function commonPrefixLen(a: string, b: string): number {
    let i = 0;
    const len = Math.min(a.length, b.length);
    while (i < len && a[i] === b[i]) i++;
    return i;
}

/**
 * Stamp each annotation-path IMessage with the ACS fragment Start time (offsetMs).
 *
 * Why: annotation `created` timestamps = utterance commit time (end + server delay),
 * NOT utterance start. ACS fragment `Start` = exact moment speech began in the
 * recording. This mismatch causes the sync lag.
 *
 * Method: time-guided text matching.
 *  1. Estimate the expected ACS fragment index for each annotation message by
 *     linearly mapping its commit time (relative to the call) onto the fragment list.
 *  2. Search a ±20-fragment window around that estimate for the best text prefix match.
 *  3. Accept matches with score ≥ 3 (lowered from 5 to handle short phrases like "okay").
 *  4. If fewer than 30 % of messages are stamped, discard all offsetMs so ChatTranscript
 *     falls through to Tier-3 (normalize-to-first-message) instead of freezing on the
 *     last matched bubble.
 *
 * Diagnostic output is logged to the browser console under the [ECC-sync] prefix.
 */
export function stampVoiceOffsets(messages: IMessage[], formattedText: string | null): IMessage[] {
    if (!formattedText?.trim().startsWith('{')) {
        console.log('[ECC-sync] No ACS JSON available — using Tier-3 fallback.');
        return messages;
    }

    // frags has a mutable `used` flag so each fragment can only be claimed once.
    let frags: { startMs: number; norm: string; raw: string; used: boolean }[];
    try {
        const data = JSON.parse(formattedText) as { Fragments?: IAcsFragment[] };
        if (!Array.isArray(data.Fragments) || data.Fragments.length === 0) {
            console.log('[ECC-sync] ACS JSON parsed but Fragments array is empty.');
            return messages;
        }
        frags = data.Fragments
            .filter(f => f.Text?.trim() && f.Start)
            .map(f => ({
                startMs: parseAcsTimeToMs(f.Start),
                norm: normalizeTextForMatch(f.Text),
                raw: f.Text.slice(0, 40),
                used: false,
            }));
    } catch (e) {
        console.log('[ECC-sync] ACS JSON parse error:', e);
        return messages;
    }

    if (frags.length === 0) return messages;

    const contentMsgs = messages.filter(m => m.sender !== 'system' && !!m.content);

    console.log(
        `[ECC-sync] Starting stamp: ${contentMsgs.length} messages, ${frags.length} ACS fragments.`,
        `\n  First msg content preview: "${contentMsgs[0]?.content.slice(0, 60)}"`,
        `\n  First 3 fragments: ${frags.slice(0, 3).map(f => `"${f.raw}"@${f.startMs}ms`).join(', ')}`
    );

    // Global best-match: for each annotation message, find the best available (unused)
    // ACS fragment by text-prefix score. No positional constraint — required because
    // annotation commit-time order and ACS recording-start-time order differ:
    // a long utterance starting at t=13s commits to D365 after shorter utterances at
    // t=22s and t=24s, so greedy-forward matching produces wrong (out-of-order) offsets.
    const result = messages.map(msg => {
        if (msg.sender === 'system' || !msg.content) return msg;
        const msgNorm = normalizeTextForMatch(msg.content);

        let bestFragIdx = -1;
        let bestScore = 0;

        for (let i = 0; i < frags.length; i++) {
            if (frags[i].used) continue;
            const score = commonPrefixLen(msgNorm, frags[i].norm);
            if (score > bestScore) {
                bestScore = score;
                bestFragIdx = i;
            }
        }

        if (bestFragIdx >= 0 && bestScore >= 5) {
            frags[bestFragIdx].used = true;
            return { ...msg, offsetMs: frags[bestFragIdx].startMs };
        }
        return msg;
    });

    const stamped = result.filter(m => m.sender !== 'system' && m.offsetMs !== undefined).length;
    const matchPct = Math.round((stamped / Math.max(contentMsgs.length, 1)) * 100);
    console.log(`[ECC-sync] Stamped ${stamped}/${contentMsgs.length} messages (${matchPct}%).`);

    if (matchPct < 30) {
        console.log('[ECC-sync] Match rate too low — falling back to Tier-3.');
        return messages;
    }

    let logged = 0;
    result.forEach((m, i) => {
        if (m.offsetMs !== undefined && logged < 5) {
            console.log(`[ECC-sync] msg[${i}] "${m.content.slice(0, 30)}" → offsetMs=${m.offsetMs}`);
            logged++;
        }
    });

    return result;
}

/** Parse ACS speech JSON (Fragments[]) into IMessage bubbles. */
function parseAcsJsonTranscript(text: string): IMessage[] | null {
    try {
        const data = JSON.parse(text) as IAcsTranscript;
        if (!Array.isArray(data.Fragments) || data.Fragments.length === 0) return null;

        const fragments = data.Fragments.filter(f => f.Text?.trim() != null);
        if (fragments.length === 0) return null;

        const participantOrder: string[] = [];
        for (const f of fragments) {
            if (f.ParticipantId && !participantOrder.includes(f.ParticipantId)) {
                participantOrder.push(f.ParticipantId);
            }
        }

        const parseMs = parseAcsTimeToMs;

        interface ITurn { pid: string; texts: string[]; startMs: number; }
        const turns: ITurn[] = [];
        for (const f of fragments) {
            const last = turns[turns.length - 1];
            if (last?.pid === f.ParticipantId) {
                last.texts.push(f.Text.trim());
            } else {
                turns.push({ pid: f.ParticipantId, texts: [f.Text.trim()], startMs: parseMs(f.Start) });
            }
        }

        return turns.map((turn, i) => {
            const pidIdx = participantOrder.indexOf(turn.pid);
            const sender: SenderType = pidIdx === 0 ? 'agent' : 'customer';
            return {
                id: `vt-${i}`,
                created: new Date(turn.startMs),
                sender,
                senderName: pidIdx === 0 ? 'Agent' : 'Customer',
                content: turn.texts.join(' '),
                contentType: 'text' as const,
            };
        });
    } catch {
        return null;
    }
}

/**
 * Parse D365 OC plain-text formatted voice transcript.
 * Format: lines matching "Agent{M:SS}" or "Customer{M:SS}" act as speaker headers;
 * subsequent lines until the next header are the turn's text.
 */
function parsePlainTextTranscript(text: string): IMessage[] | null {
    // Matches: "Agent", "Agent0:01", "Agent 0:01", "Customer1:23", etc. (full line)
    const SPEAKER_RE = /^(Agent|Customer)\s*(\d{1,2}(?::\d{2}){1,2})?$/i;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    interface ISegment { sender: SenderType; timeStr: string; textLines: string[]; }
    const segments: ISegment[] = [];

    for (const line of lines) {
        const m = SPEAKER_RE.exec(line);
        if (m) {
            segments.push({
                sender: m[1].toLowerCase().startsWith('a') ? 'agent' : 'customer',
                timeStr: m[2] ?? '0:00',
                textLines: [],
            });
        } else if (segments.length > 0) {
            segments[segments.length - 1].textLines.push(line);
        }
    }

    const messages = segments
        .filter(seg => seg.textLines.length > 0)
        .map((seg, i) => ({
            id: `vtxt-${i}`,
            created: parseTimeOffsetToDate(seg.timeStr),
            sender: seg.sender,
            senderName: seg.sender === 'agent' ? 'Agent' : 'Customer',
            content: seg.textLines.join(' '),
            contentType: 'text' as const,
        }));

    return messages.length > 0 ? messages : null;
}

/**
 * Parse a voice transcript (ACS JSON or D365 plain-text format) into chat bubbles.
 * Returns null if no recognisable structure is found.
 */
export function parseVoiceTranscriptToMessages(text: string): IMessage[] | null {
    if (!text?.trim()) return null;
    if (text.trim().startsWith('{')) return parseAcsJsonTranscript(text);
    return parsePlainTextTranscript(text);
}

// ─── Helper functions ─────────────────────────────────────────────────────────

/** Tags that mark a message as a transfer/consult system event (shown as dividers). */
const SYSTEM_EVENT_TAGS = [
    'transferinitiated', 'transferaccepted',
    'consultinitiated', 'consultaccepted',
    'agentleftconsultconversation', 'agentendedconsultconversation',
] as const;

function hasSystemEventTag(tags: string | undefined): boolean {
    if (!tags) return false;
    return SYSTEM_EVENT_TAGS.some(t => tags.includes(t));
}

function detectSender(msg: ITranscriptMessage, isVoice = false): SenderType {
    if (msg.isControlMessage) return 'system';
    // Transfer / consult system events from the "__customer__" pseudo-user
    if (hasSystemEventTag(msg.tags)) return 'system';
    if (msg.from?.user?.displayName === '__customer__' && msg.tags?.includes('system')) return 'system';
    if (msg.from?.user && msg.from.user.displayName !== '__customer__') return 'agent';
    if (
        msg.from?.application?.displayName === 'Customer' ||
        msg.tags?.includes('FromCustomer')
    ) return 'customer';
    // In voice calls, non-customer participants are agents, not bots
    if (isVoice) return 'agent';
    return 'bot';
}

function getSenderName(msg: ITranscriptMessage, sender: SenderType): string {
    if (sender === 'agent' && msg.from?.user?.displayName) return msg.from.user.displayName;
    if (sender === 'agent' && msg.from?.application?.displayName) return msg.from.application.displayName;
    if (sender === 'customer') return 'Customer';
    if (sender === 'bot') return 'Bot';
    return '';
}

export function detectRenderMode(channel: string | null): 'chat' | 'voice' | 'voicecallback' | 'unknown' {
    if (!channel) return 'unknown';
    if (channel.includes('192360000')) return 'chat';
    if (channel.includes('192370000')) return 'voice';
    if (channel.includes('192440000')) return 'voicecallback';
    return 'unknown';
}

export async function loadConversation(
    webAPI: ComponentFramework.WebApi,
    entityId: string
): Promise<IConversation> {
    const result = await webAPI.retrieveRecord(
        'msdyn_ocliveworkitem',
        entityId,
        '?$select=msdyn_channel,statecode,statuscode,msdyn_startedon,msdyn_closedon,subject,' +
        '_msdyn_customer_value,_msdyn_activeagentid_value,_msdyn_cdsqueueid_value,' +
        '_msdyn_customerlanguageid_value,_regardingobjectid_value,' +
        'msdyn_customersentimentlabel,msdyn_urcustomersentimentscore,' +
        'msdyn_urcustomersentimentkeywords,msdyn_copilotengaged,msdyn_intent,' +
        'msdyn_conversationtype,msdyn_isoutbound,' +
        'msdyn_transfercount,msdyn_escalationcount,msdyn_overflowtransfercount,' +
        'msdyn_conversationhandletimeinseconds,msdyn_conversationtalktimeinseconds,' +
        'msdyn_conversationholdtimeinseconds,msdyn_conversationwrapuptimeinseconds,' +
        'msdyn_conversationfirstwaittimeinseconds'
    );
    return result as unknown as IConversation;
}

export async function loadTranscript(
    webAPI: ComponentFramework.WebApi,
    entityId: string
): Promise<ITranscript | null> {
    const result = await webAPI.retrieveMultipleRecords(
        'msdyn_transcript',
        `?$filter=_msdyn_liveworkitemidid_value eq ${entityId}` +
        `&$select=msdyn_transcriptid,msdyn_voicetranscript_formatted_name,createdon` +
        `&$top=1`
    );
    return result.entities.length > 0 ? (result.entities[0] as unknown as ITranscript) : null;
}

export async function loadChatMessages(
    webAPI: ComponentFramework.WebApi,
    transcriptId: string,
    isVoice = false
): Promise<IMessage[]> {
    const annotationResult = await webAPI.retrieveMultipleRecords(
        'annotation',
        `?$filter=objecttypecode eq 'msdyn_transcript' and _objectid_value eq ${transcriptId}` +
        `&$select=annotationid,documentbody,createdon` +
        `&$orderby=createdon desc` +
        `&$top=1`
    );
    if (annotationResult.entities.length === 0) return [];
    const documentbody = annotationResult.entities[0].documentbody as string | null;
    if (!documentbody) return [];

    try {
        // atob() produces a binary string; use TextDecoder to handle UTF-8 multibyte chars
        const bytes = Uint8Array.from(atob(documentbody), c => c.charCodeAt(0));
        const decoded = new TextDecoder('utf-8').decode(bytes);
        const outer = JSON.parse(decoded) as { Content: string }[];
        if (!outer || outer.length === 0 || !outer[0].Content) return [];
        const rawMessages = JSON.parse(outer[0].Content) as ITranscriptMessage[];
        return rawMessages
            .filter(m => {
                // Keep transfer/consult system events (they become styled dividers)
                if (!m.isControlMessage && hasSystemEventTag(m.tags)) return true;
                // Drop XML control messages (addmember, deletemember, etc.)
                if (m.isControlMessage) return false;
                if (m.deleted) return false;
                // Drop bot/system event payloads (JSON objects with an EventName field)
                const c = m.content.trim();
                if (c.startsWith('{') && c.includes('"EventName"')) return false;
                return true;
            })
            .sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
            .map(m => {
                const sender = detectSender(m, isVoice);
                const tags = m.tags ?? '';
                return {
                    id: m.id,
                    created: new Date(m.created),
                    sender,
                    senderName: getSenderName(m, sender),
                    content: m.content || '',
                    contentType: m.contentType ?? 'text',
                    agentId: m.from?.user?.id && m.from.user.displayName !== '__customer__'
                        ? m.from.user.id : undefined,
                    isPrivate: tags.includes('private') && !hasSystemEventTag(tags),
                };
            });
    } catch {
        return [];
    }
}

export async function loadVoiceTranscriptText(
    transcriptId: string,
    signal: AbortSignal
): Promise<string | null> {
    try {
        const res = await fetch(
            `/api/data/v9.2/msdyn_transcripts(${transcriptId})/msdyn_voicetranscript_formatted/$value`,
            { signal, credentials: 'same-origin' }
        );
        if (!res.ok) return null;
        return await res.text();
    } catch {
        return null;
    }
}

export async function loadSessions(
    webAPI: ComponentFramework.WebApi,
    entityId: string
): Promise<ISession[]> {
    const result = await webAPI.retrieveMultipleRecords(
        'msdyn_ocsession',
        `?$filter=_msdyn_liveworkitemid_value eq ${entityId}` +
        `&$select=activityid,subject,statecode,actualstart,actualend,createdon,_ownerid_value,` +
        `msdyn_sessioncreationreason,msdyn_closurereason,msdyn_botengagementmode,` +
        `_msdyn_cdsqueueid_value,msdyn_agentacceptedon,msdyn_agentassignedon,` +
        `msdyn_queueassignedon,msdyn_wrapupinitiatedon` +
        `&$orderby=createdon asc`
    );
    return result.entities as unknown as ISession[];
}

/** Lazy-loaded — called only on first journey expand, then cached in Sidebar. */
export async function loadSessionParticipants(
    webAPI: ComponentFramework.WebApi,
    sessionId: string
): Promise<ISessionParticipant[]> {
    const result = await webAPI.retrieveMultipleRecords(
        'msdyn_sessionparticipant',
        `?$filter=_msdyn_omnichannelsession_value eq ${sessionId}` +
        `&$select=msdyn_sessionparticipantid,_msdyn_omnichannelsession_value,` +
        `_msdyn_agentid_value,msdyn_name,msdyn_mode,msdyn_consultmode,` +
        `msdyn_assignreason,msdyn_joinedon,msdyn_lefton,msdyn_leftonreason,` +
        `msdyn_talktime,msdyn_holdtime,msdyn_activetime,_msdyn_cdsqueueid_value`
    );
    return result.entities as unknown as ISessionParticipant[];
}

export async function loadInsight(
    webAPI: ComponentFramework.WebApi,
    entityId: string
): Promise<IInsight | null> {
    const result = await webAPI.retrieveMultipleRecords(
        'msdyn_conversationinsight',
        `?$filter=_msdyn_conversationid_value eq ${entityId}` +
        `&$select=msdyn_conversationinsightid,msdyn_copilotsummary,msdyn_summary,` +
        `msdyn_insights_name,msdyn_callaveragepause,msdyn_callinsightduration,` +
        `msdyn_calllongestcustomermonologue,msdyn_callswitchesperconversation,` +
        `msdyn_calltalkingspeed,msdyn_calltalktolistenratio` +
        `&$top=1`
    );
    return result.entities.length > 0 ? (result.entities[0] as unknown as IInsight) : null;
}

export async function loadInsightsJson(
    insightId: string,
    signal: AbortSignal
): Promise<IInsightsJson | null> {
    try {
        const res = await fetch(
            `/api/data/v9.2/msdyn_conversationinsights(${insightId})/msdyn_insights/$value`,
            { signal, credentials: 'same-origin' }
        );
        if (!res.ok) return null;
        return await res.json() as IInsightsJson;
    } catch {
        return null;
    }
}

export async function loadRecording(
    webAPI: ComponentFramework.WebApi,
    entityId: string
): Promise<IRecording | null> {
    const result = await webAPI.retrieveMultipleRecords(
        'msdyn_ocrecording',
        `?$filter=_msdyn_liveworkitemid_value eq ${entityId}` +
        `&$select=msdyn_ocrecordingid,msdyn_mediauri,msdyn_recording_name,statecode` +
        `&$top=1`
    );
    return result.entities.length > 0 ? (result.entities[0] as unknown as IRecording) : null;
}

export async function loadContextVariables(
    webAPI: ComponentFramework.WebApi,
    conversationId: string,
    variableNames: string[]
): Promise<IContextVariable[]> {
    const nameFilters = variableNames
        .map(n => `msdyn_name eq '${n.replace(/'/g, "''")}'`)
        .join(' or ');
    const filter = `_msdyn_ocliveworkitemid_value eq ${conversationId}`
        + (nameFilters ? ` and (${nameFilters})` : '');

    try {
        const result = await webAPI.retrieveMultipleRecords(
            'msdyn_ocliveworkitemcontextitemelastic',
            `?$filter=${filter}&$select=msdyn_name,msdyn_value`
        );
        return result.entities as unknown as IContextVariable[];
    } catch {
        console.log('[ECC] Elastic table query failed — falling back to standard table.');
        const result = await webAPI.retrieveMultipleRecords(
            'msdyn_ocliveworkitemcontextitem',
            `?$filter=${filter}&$select=msdyn_name,msdyn_value`
        );
        return result.entities as unknown as IContextVariable[];
    }
}
