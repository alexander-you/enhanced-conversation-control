# Enhanced Conversation Control — Feature Log

> **Control:** `alex.EnhancedConversationControl`  
> **Current Version:** v1.5.0  
> **Target Entity:** `msdyn_ocliveworkitem` on `demo-contact-center-en.crm4.dynamics.com`  
> **Update rule:** Add new entries as features ship; do not remove or modify past entries without approval.

---

## Channel Scope

| Channel | Code | Status |
|---------|------|--------|
| Live Chat | `192360000` | ✅ Fully supported |
| Inbound Voice | `192370000` | ✅ Fully supported |
| Voice Callback | `192440000` | ✅ Fully supported |

---

## Localization

| Language | LCID | RESX File | Status |
|----------|------|-----------|--------|
| English (US) | 1033 | `strings/EnhancedConversationControl.1033.resx` | ✅ 79 keys |
| Hebrew | 1037 | `strings/EnhancedConversationControl.1037.resx` | ✅ 79 keys |
| RTL layout auto-detected from `context.userSettings.languageId` | — | — | ✅ |

---

## Feature Inventory

### F-01 · Conversation Header

**Component:** `Header.tsx`  
**Introduced:** v1.0.0  

Renders a card header at the top of the control with full customer context.

| Element | Data Source | Notes |
|---------|------------|-------|
| Avatar circle with initials | `_msdyn_customer_value` display name | Falls back to `?` for outbound callbacks |
| Online/offline status dot | `statecode` (0 = open → green, else grey) | |
| Customer display name | `_msdyn_customer_value` OData formatted value | Falls back to `subject` |
| Sub-line: regarding object | `_regardingobjectid_value` formatted value | Hidden when null |
| Sub-line: start time | `msdyn_startedon` | Shows "Today, HH:mm" or "MMM D, HH:mm" |
| Channel pill | `msdyn_channel` | Live Chat / Voice / Voice Callback |
| Queue pill | `_msdyn_cdsqueueid_value` formatted value | Hidden when null |
| Status pill | `statuscode` | Active / Waiting / Wrap-Up / Resolved / Closed; color-coded |

**Known gap:** ~~Language pill (`_msdyn_customerlanguageid_value`) is fetched but not yet rendered. See **G-1**.~~ **Resolved v1.1.8** — language pill now rendered.

---

### F-02 · Chat Transcript (Chat Mode)

**Component:** `ChatTranscript.tsx`  
**Introduced:** v1.0.0  

Renders a scrollable, bubble-style conversation transcript for Live Chat conversations.

| Feature | Detail |
|---------|--------|
| Agent bubbles | Right-aligned; identified by `from.user` presence in transcript JSON |
| Customer bubbles | Left-aligned; identified by `tags: "FromCustomer"` or `from.application.displayName === "Customer"` |
| System event dividers | Rendered as thin horizontal dividers for control messages |
| Auto-scroll to bottom | On load and on new messages (suppressed during active search) |
| Timestamps | Formatted as "HH:mm" per bubble |
| Sender name | Displayed above each bubble |
| HTML content rendering | Rendered via `dangerouslySetInnerHTML` with script/event-handler stripping |
| Markdown content rendering | `**bold**`, `*italic*`, `- lists`, `1. ordered`, `# headings`, `` `code` ``, `[link](url)` |
| Adaptive Card rendering | `application/vnd.microsoft.card.adaptive` JSON → structured HTML (TextBlock, Input.ChoiceSet, actions) |
| Search highlight | Matched terms wrapped in `<mark>` tags |
| `dir="auto"` per bubble | Browser detects RTL/LTR text direction per message |
| Empty state | "Transcript not available" with icon when no messages |

**Data source:** `annotation` records with `objecttypecode = 'msdyn_transcript'`, decoded via `atob()` + `TextDecoder('utf-8')`.

---

### F-03 · Voice Transcript (Voice Mode)

**Component:** `ChatTranscript.tsx` (primary) + `VoiceTranscript.tsx` (fallback)  
**Introduced:** v1.0.0; speaker parsing added v1.0.4  

Renders voice conversations as speaker-differentiated chat bubbles, with plain-text fallback.

| Feature | Detail |
|---------|--------|
| Structured bubble rendering | Same bubble UI as chat; speakers identified from ACS JSON `Fragments[].ParticipantId` |
| ACS JSON parser | Parses `{ Fragments: [{ Text, ParticipantId, Start }] }` format |
| Plain-text fallback parser | Parses `Agent0:01 / Customer1:23` formatted transcript lines |
| Speaker identification | First `ParticipantId` → Agent; others → Customer. (Overrides previous "Bot" misidentification — fixed v1.1.1) |
| Timestamp display | Call-offset format "M:SS" for 1970-epoch dates (relative to call start) |
| Plain-text last resort | If no structured data, renders raw text in `VoiceTranscript.tsx` |

**Data source:** Annotation JSON (same as chat) attempted first; falls back to `msdyn_transcripts({id})/msdyn_voicetranscript_formatted/$value`.

**Known gap:** ~~No audio-timeline synchronization (auto-scroll/highlight to current utterance). See **G-3**.~~ **Resolved v1.1.8** — see F-13.

---

### F-04 · Transcript Search

**Component:** `App.tsx` (search state) + `ChatTranscript.tsx` (matching + highlighting)  
**Introduced:** v1.0.9  

Client-side full-text search across the loaded transcript.

| Feature | Detail |
|---------|--------|
| Search input | Debounce-free; updates on every keystroke |
| Clear button | Appears when search term is non-empty |
| Match highlighting | Matched substrings wrapped in `<mark>` tags (plain-text messages); HTML messages get `bubble-match` CSS class |
| **Inline match count** | `"X of Y"` displayed inside the search box row while search term is active; shows "No matches" when count is zero. Localized (EN + HE). |
| Auto-scroll suppressed | While search term is active, auto-scroll to bottom is disabled |
| Localized placeholder | Via `labelSearchPlaceholder` RESX key |

**Resolved v1.1.8:** Count is now inline in the search box header row (previously displayed in a bar inside the transcript panel — G-2).

---

### F-05 · Copilot AI Summary Sidebar

**Component:** `CopilotSummary.tsx`  
**Introduced:** v1.0.8; redesigned v1.1.0  

Displays the AI-generated Copilot summary in a collapsible sidebar panel.

| Feature | Detail |
|---------|--------|
| Markdown rendering | `**bold**`, `*italic*`, section headings, bullet lists via `markdownToHtml()` |
| Collapse / expand | Toggle button in section header; default: expanded |
| Copilot logo | `/WebResources/alex_copilot_logo` branding image, 22px scaled |
| "AI COPILOT" header | Purple badge + label |
| Null/empty handling | Section hidden when `msdyn_copilotsummary` is null or empty |

**Data source:** `msdyn_conversationinsight.msdyn_copilotsummary` (Markdown string).

---

### F-06 · Tags & Keywords Panel

**Component:** `TagsPanel.tsx`  
**Introduced:** v1.0.8  

Displays customer sentiment keywords as pill chips in the sidebar.

| Feature | Detail |
|---------|--------|
| Keyword parsing | `msdyn_urcustomersentimentkeywords` split on `,` and `;` |
| Tag rendering | Individual pill chips; every 5th chip uses `tag-purple` |
| Null/empty handling | Section hidden when no keywords available |
| Localized header | Via `labelTagsKeywords` RESX key |

**Known gaps:** Tags not color-coded by sentiment zone (G-7); not supplemented from `insights.json` (G-8).

---

### F-07 · Conversation Journey Panel

**Component:** `JourneyPanel.tsx`  
**Introduced:** v1.0.8; enhanced v1.1.1–v1.1.4; RTL connector fixed v1.1.7; enriched expand view v1.3.0–v1.4.0

Renders a vertical timeline of the conversation's session lifecycle in the sidebar.

| Feature | Detail |
|---------|--------|
| Session milestones | One milestone per `msdyn_ocsession` record, ordered by `createdon asc` |
| Session type labels | Initial Call (📞), Escalation (👥), Transfer (⟶) — upgraded v1.3.0 to use `msdyn_sessioncreationreason` picklist when available |
| Closed milestone | Synthetic final milestone from `statecode === 1` on the conversation record |
| Timestamps | `createdon` formatted as "HH:mm" |
| Duration | Per-session duration formatted as "X min" or "Xh Ym" |
| Sentiment coloring | Icon circles colored pastel green (positive), pastel red (negative), blue (neutral) based on `messageInsights` sentiment distribution |
| Sentiment badges | Pill chips with sentiment label next to each milestone |
| **Total duration** | Prominent "Total Xh Ym" in section header; derived from first and last session timestamps |
| Continuous connector line | Single vertical line via `::before` pseudo-element; uses CSS logical properties (`inset-inline-start`) to auto-flip in RTL |
| **Expand / Collapse** | Ghost button in section header toggles the sidebar between `default` and `journey-expanded` modes (v1.3.0) |
| **Bot Session badge** | Shown when `msdyn_botengagementmode` is non-null (v1.3.0) |
| **Declined Transfer card** | Red-bordered card for sessions where `msdyn_sessioncreationreason = Transfer` and `msdyn_agentacceptedon = null` — reliable declined signal (v1.3.1 hotfix) |
| **Queue name pill** | Purple pill showing queue the session was routed to, from `_msdyn_cdsqueueid_value` formatted value (v1.4.0) |
| **Queue wait pill** | Amber pill showing wait time computed from `msdyn_agentacceptedon − msdyn_queueassignedon` (v1.4.0) |
| **Consult block** | Purple sub-card listing consulting participants; shows "→ Transferred to" label when `msdyn_consultmode = 2` (v1.4.0) |
| **Wrap-up milestone** | Displayed when `msdyn_wrapupinitiatedon` is non-null (v1.4.0) |
| **Loading skeleton** | Shimmer animation shown while participant data loads on first expand (v1.4.0) |
| Localized labels | All session type, sentiment, and enrichment labels via RESX keys (EN + HE) |

**Data source:** `msdyn_ocsession` records; sentiment from `insightsJson.messageInsights`; participants lazy-loaded from `msdyn_sessionparticipant` on first expand.

---

### F-08 · Call Metrics Panel (Voice Only)

**Component:** `CallMetrics.tsx`  
**Introduced:** v1.1.1; Insights trigger added v1.5.0  
**Visibility:** Voice and Voice Callback conversations only  

Displays analytics from the conversation insight record.

| Metric | Source | Format |
|--------|--------|--------|
| Duration | `msdyn_callinsightduration` (ms) | "M:SS" |
| Talking speed | `msdyn_calltalkingspeed` | "NNN w/m" |
| Conversation switches | `msdyn_callswitchesperconversation` | Integer |
| Average pause | `msdyn_callaveragepause` (ms) | "X.Xs" |
| Talk/listen ratio | `msdyn_calltalktolistenratio` | Percentage bar + "XX%" |
| Overall sentiment | `insightsJson.insights.sentiments` | Colored label + pulse score |
| **✦ Insights button** | Triggers `InsightsDashboard` overlay | Purple ghost button in section title (v1.5.0) |

**Known gap:** ~~`msdyn_calllongestcustomermonologue` is fetched but not displayed. See **G-9**.~~ **Resolved v1.5.0** — now shown in the Insights Dashboard (Section C).

---

### F-09 · Audio Player (Voice Only)

**Component:** `AudioPlayer.tsx`  
**Introduced:** v1.0.4; RTL support added v1.1.6  
**Visibility:** Voice and Voice Callback conversations only (hidden for chat)  

Provides a full-featured audio player for call recordings.

| Feature | Detail |
|---------|--------|
| Audio loading | Binary download via `/api/data/v9.2/msdyn_ocrecordings({id})/msdyn_recording/$value` → Blob URL (avoids CORS issues with ACS streaming URL) |
| Play / Pause | Standard HTML5 `<audio>` element; loading indicator (⏳) while fetching blob |
| Current time display | "M:SS / M:SS" |
| Progress seek bar | `<input type="range">` overlaid on waveform |
| Playback speed | 0.5×, 1×, 1.5×, 2× speed pills |
| Waveform visualization | Amplitude bars colored by sentiment zone (green/red/blue); derived from `insightsJson.messageInsights[].sentiments` |
| Active bar tracking | Current position highlighted during playback |
| Download audio | Fetches blob → anchor download (`callRecording.mp3`) |
| Download transcript | Fetches `msdyn_voicetranscript_formatted/$value` → anchor download |
| **RTL support** | `rangeValue` inverted (`duration - currentTime`); bars displayed in reverse order; seek calculation inverted; `dir="ltr"` on range input to prevent browser RTL default |

**Known gap:** No synchronization with voice transcript component. See **G-3**.

---

### F-10 · RTL Layout Support

**Component:** All components + `css/EnhancedConversationControl.css`  
**Introduced:** v1.0.0 (basic); completed v1.1.3–v1.1.7  

Full bidirectional layout support for RTL languages (Hebrew, Arabic, etc.).

| Feature | Detail |
|---------|--------|
| Auto-detection | `context.userSettings.languageId` checked against set of 18 RTL language codes |
| Root attributes | `dir="rtl"` + `rtl-layout` CSS class applied to root `div` |
| Layout mirroring | `flex-direction: row-reverse` on header, transcript-header, search-box, section-title, j-item |
| Sidebar position | Moves from right to left in RTL grid layout |
| Journey connector line | CSS logical property `inset-inline-start: 23px` auto-flips to `right: 23px` in RTL (fixed v1.1.7) |
| Audio player | JS-inverted progress bar and waveform (v1.1.6); `dir="ltr"` on range input |
| Search icon | Positioned on right side in RTL |
| Per-bubble direction | `dir="auto"` on each bubble for per-message text detection |

---

### F-11 · Responsive Height

**Component:** `App.tsx`  
**Introduced:** v1.0.6 (CSS calc); replaced v1.0.9 (ResizeObserver)  

The control dynamically sizes to fill available vertical space without overflow.

| Feature | Detail |
|---------|--------|
| ResizeObserver | Watches the PCF parent element; recalculates on form resize / panel collapse |
| Height formula | `window.innerHeight - container.getBoundingClientRect().top - 16px` |
| Fallback | `calc(100vh - 220px)` until first ResizeObserver measurement fires |
| Minimum height | `minHeight: 400px` |
| Width | `allocatedWidth` from PCF (via `trackContainerResize(true)`); falls back to `100%` |

---

### F-13 · Voice Transcript / Audio Timeline Synchronization

**Component:** `AudioPlayer.tsx` + `ChatTranscript.tsx` + `App.tsx`  
**Introduced:** v1.1.8  
**Applies to:** Voice and Voice Callback conversations with structured transcript (parsed bubble format)  

Synchronizes the audio playback position with the voice transcript display so the active utterance is visually highlighted as the recording plays.

| Feature | Detail |
|---------|--------|
| Time broadcast | `AudioPlayer` fires `onTimeUpdate(seconds)` on every native `timeupdate` event |
| Active message detection | `ChatTranscript` computes the last message whose 1970-epoch timestamp offset (call seconds from start) ≤ `activeTimeSeconds` |
| Visual highlight | Active bubble receives `bubble--active` CSS class: azure-soft background tint + azure outline, with a 0.3s CSS transition |
| Auto-scroll | Scrolls the active utterance into view (`scrollIntoView` nearest) during playback |
| Manual scroll pause | A scroll event listener detects when the user has scrolled away (>80px from bottom); auto-scroll pauses until they scroll back near the bottom |
| Scope | Only activates for voice messages with 1970-epoch offset timestamps; no effect on chat or plain-text voice fallback |

---

### F-14 · Language Pill in Header

**Component:** `Header.tsx`  
**Introduced:** v1.1.8  

A `pill-blue` chip displaying the customer's language now appears in the header pill row between the channel pill and the queue pill.

| Feature | Detail |
|---------|--------|
| Data source | `_msdyn_customerlanguageid_value@OData.Community.Display.V1.FormattedValue` |
| Null handling | Pill hidden when `languageName` is null |
| Position | Between channel pill and queue pill |

---

### F-15 · Sidebar State Machine

**Component:** `Sidebar.tsx`  
**Introduced:** v1.3.0; extended v1.4.0 (participant cache), v1.5.0 (Insights mode)

The sidebar operates as a three-mode state machine, coordinating all panel visibility and transitions.

| Mode | Description |
|------|-------------|
| `default` | All panels visible: CopilotSummary, CallMetrics, Tags, Journey (basic view) |
| `journey-expanded` | CallMetrics hidden; CopilotSummary force-collapsed; Journey in enriched expanded view |
| `insights` | Full sidebar replaced by InsightsDashboard overlay |

| Feature | Detail |
|---------|--------|
| Summary state preservation | `summaryExpanded` saved before journey expand and restored on collapse — user's preference is never lost |
| Participant lazy-load | `msdyn_sessionparticipant` records fetched once on first expand, cached per session; never re-fetched on subsequent expand/collapse |
| Participant caching gate | `participantsLoaded` flag prevents duplicate API calls |
| `async` expand handler | Participant fetch runs in parallel for all sessions via `Promise.allSettled` |

---

### F-16 · Insights Dashboard

**Component:** `InsightsDashboard.tsx`  
**Introduced:** v1.5.0  
**Visibility:** Voice and Voice Callback conversations (triggered from Call Metrics ✦ Insights button)

Full-screen sidebar overlay presenting four sections of conversation analytics.

#### Section A — Timing

| Metric | Source |
|--------|--------|
| Queue Wait | `msdyn_conversationfirstwaittimeinseconds` |
| Talk Time | `msdyn_conversationtalktimeinseconds` |
| Hold Time | `msdyn_conversationholdtimeinseconds` |
| Wrap-up | `msdyn_conversationwrapuptimeinseconds` |
| Handle Time | `msdyn_conversationhandletimeinseconds` |

Null values render as `—`. Times formatted as "Xs" under 60s, "Xm Ys" otherwise.

#### Section B — Routing

| Metric | Source | Highlight |
|--------|--------|-----------|
| Sessions | `sessions.length` | — |
| Transfers | `msdyn_transfercount` | Amber when > 0 |
| Escalations | `msdyn_escalationcount` | — |
| Declined | Sessions where `msdyn_agentacceptedon = null` and `creationreason = Transfer` | Ruby when > 0 |

#### Section C — AI / Voice Quality

Shown only when voice insight record is present.

| Metric | Source |
|--------|--------|
| Sentiment | `insightsJson.insights.sentiments` (zone + pulse) |
| Agent Talk Ratio | `msdyn_calltalktolistenratio` → percentage |
| Speaking Pace | `msdyn_calltalkingspeed` → "NNN w/m" |
| Avg Pause | `msdyn_callaveragepause` → "X.Xs" |
| Longest Monologue | `msdyn_calllongestcustomermonologue` → "X.Xs" |
| Conv. Switches | `msdyn_callswitchesperconversation` → integer |

#### Section D — Participants

Shown only when participant data has been loaded (requires prior Journey expand).  
Aggregates all `msdyn_sessionparticipant` records across sessions; deduplicates by `_msdyn_agentid_value`.

| Element | Detail |
|---------|--------|
| Initials avatar | Two-letter initials in purple circle |
| Name | `msdyn_name` |
| Role | Primary / Consult / Primary · Consult derived from `msdyn_mode` |
| Talk time | Sum of `msdyn_talktime` across sessions |
| Hold time | Sum of `msdyn_holdtime`; shown only when > 0 |

**Accessibility:** All sections pass WCAG 2.1 AA. Color indicators (amber/ruby/green) also expressed numerically. `forced-colors` media query applied. Close button has explicit `aria-label`.

---

**Files:** `strings/EnhancedConversationControl.1033.resx`, `strings/EnhancedConversationControl.1037.resx`, `i18n/strings.ts`  
**Introduced:** v1.0.0; expanded v1.1.4  

All user-facing strings are externalized to RESX resource files.

| Category | Key Count | EN | HE |
|----------|-----------|----|-----|
| Channel / status labels | 10 | ✅ | ✅ |
| Header | 4 | ✅ | ✅ |
| Transcript | 6 | ✅ | ✅ |
| Sidebar / journey / sentiment | 12 | ✅ | ✅ |
| Call metrics | 7 | ✅ | ✅ |
| Audio player | 9 | ✅ | ✅ |
| Search / insights | 4 | ✅ | ✅ |
| Loading / errors | 3 | ✅ | ✅ |
| Journey enrichment (Phase 1+2) | 16 | ✅ | ✅ |
| Insights Dashboard (Phase 3) | 19 | ✅ | ✅ |
| **Total** | **90** | ✅ | ✅ |

---

## Version → Feature Map

| Version | Features Introduced / Changed |
|---------|-------------------------------|
| v1.0.0 | F-01 Header, F-02 Chat Transcript (basic), F-10 RTL (basic), F-12 Localization (basic) |
| v1.0.1 | F-02 EventName filter fix, F-03 Voice parser |
| v1.0.2 | CSS scope fix (critical — all styles were unapplied) |
| v1.0.4 | F-03 Voice via annotation, F-09 Audio blob URL, F-02 HTML rendering, UTF-8 decode |
| v1.0.5 | Flex scroll chain fix (min-height: 0 propagation) |
| v1.0.6 | F-11 ResizeObserver height, trackContainerResize |
| v1.0.9 | F-04 Search, F-05 AI Summary sidebar, F-06 Tags panel |
| v1.1.0 | F-05 Copilot Summary sidebar redesign (collapse/expand), markdownToHtml |
| v1.1.1 | F-07 Journey (sentiment circles, session types), F-08 Call Metrics, F-09 Waveform bars |
| v1.1.2 | F-07 Closed milestone, total duration badge, F-03 Bot→Agent fix |
| v1.1.3 | F-10 Comprehensive RTL CSS, F-02 Adaptive Cards |
| v1.1.4 | F-12 6 new RESX keys, F-07 localized labels |
| v1.1.5 | F-07 Journey connector attempt (partial — later superseded) |
| v1.1.6 | F-09 RTL audio player (JS-inverted), F-07 journey::before connector |
| v1.1.7 | F-10 Journey connector RTL fix (CSS logical properties `inset-inline-start`) |
| v1.1.8 | F-13 Voice/audio transcript sync (active bubble highlight + auto-scroll); F-14 Language pill in header; F-04 Search count inline in search box (G-1, G-2, G-3 resolved) |
| v1.3.0 | F-07 Journey Expand/Collapse button + prominent Total duration; session type detection using `msdyn_sessioncreationreason`; Bot Session badge; F-15 Sidebar state machine (`default`/`journey-expanded`); 16 new RESX keys (EN + HE) |
| v1.3.1 | F-07 Hotfix: Declined Transfer card condition corrected — uses `msdyn_agentacceptedon = null` instead of unreliable `msdyn_closurereason` picklist value |
| v1.4.0 | F-07 Full enriched expanded view: queue name pill, queue wait pill, consult block, wrap-up milestone, loading skeleton; F-15 Participant lazy-load cache (`msdyn_sessionparticipant`); CopilotSummary promoted to fully controlled component with state save/restore |
| v1.5.0 | F-16 Insights Dashboard (4 sections: Timing, Routing, AI/Quality, Participants); F-08 ✦ Insights trigger button; `IConversation` extended with 8 timing/routing fields; 19 new RESX keys (EN + HE) |

---

*This document is updated only after explicit approval from the project owner.*
