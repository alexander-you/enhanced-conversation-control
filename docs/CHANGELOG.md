# Enhanced Conversation Control — Changelog

> **Control:** `alex.EnhancedConversationControl`  
> **Entity:** `msdyn_ocliveworkitem` on `demo-contact-center-en.crm4.dynamics.com`  
> **Update rule:** Append entries on each deployment. Do not modify past entries without approval.

---

## v1.0.3 — 2026-05-12

**Status:** Deployed ✅

### 🆕 New Features

**Clickable Contact & Case in Header**  
The customer name and case/regarding name in the conversation header are now interactive links. Clicking them opens the associated Dynamics 365 record. Two new control settings govern the behavior:

| Setting | Value | Behavior |
|---|---|---|
| `opencontactfullscreen` | `false` *(default)* | Opens the contact as a **modal dialog** over the current page |
| `opencontactfullscreen` | `true` | Navigates to the contact **inline in the same window** |
| `opencasefullscreen` | `false` *(default)* | Opens the case as a **modal dialog** over the current page |
| `opencasefullscreen` | `true` | Navigates to the case **inline in the same window** |

Navigation uses `Xrm.Navigation.navigateTo` (`target: 2` for dialog, `target: 1` for inline).

**Context Variables Panel**  
A new collapsible panel in the sidebar displays Omnichannel context variables for the active conversation. Variable names are configured via the new `contextVariableNames` control property (JSON array, e.g. `["Email","Name","PhoneNumber"]`). Values are fetched on demand when the panel is expanded and can be refreshed manually. Queries the elastic table first, falling back to the standard table automatically.

**Conversation ID Relocated**  
The Conversation ID (GUID) section has been moved to the bottom of the sidebar, below the Context Variables panel, reflecting its primarily operational/diagnostic purpose.

### 🐛 Bug Fixes

- **Header dot misalignment** — The status health dot is now correctly positioned next to the case/regarding name. The case name button was inheriting `width: 100%` from a shared CSS class, pushing the timestamp and dot to the next line.
- **Sidebar empty placeholder** — The Conversation ID section no longer inflates to fill all remaining sidebar space. Fixed by removing the `sidebar-section:last-child { flex: 1 }` conflict.

### ⚙️ New Control Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `opencontactfullscreen` | TwoOptions | `false` | How to open the linked contact record |
| `opencasefullscreen` | TwoOptions | `false` | How to open the linked case record |
| `contextVariableNames` | SingleLine.Text | *(empty)* | JSON array of Omnichannel context variable names to display |

### 🌐 Localization

All new labels are available in English (1033) and Hebrew (1037):  
`Label_ContextVariables`, `Label_ContextRefresh`, `Label_ContextRetry`, `Label_ContextNoData`, `PCF_ContextVarNames_Display`, `PCF_ContextVarNames_Desc`, `PCF_OpenContactFullScreen_Display/Desc`, `PCF_OpenCaseFullScreen_Display/Desc`.

---

## v1.5.0 — 2026-04-28

**Status:** Deployed ✅

**Phase 3: Insights Dashboard**

- Extended `IConversation` with 8 timing/routing fields: `msdyn_transfercount`, `msdyn_escalationcount`, `msdyn_overflowtransfercount`, `msdyn_conversationhandletimeinseconds`, `msdyn_conversationtalktimeinseconds`, `msdyn_conversationholdtimeinseconds`, `msdyn_conversationwrapuptimeinseconds`, `msdyn_conversationfirstwaittimeinseconds`
- Extended `loadConversation()` `$select` to retrieve all new timing/routing fields
- Added 19 new i18n strings for Insights Dashboard to `IStrings`, `DEFAULT_STRINGS`, `createStrings()`, EN RESX, and HE RESX
- Added `onInsightsClick?: () => void` prop to `CallMetrics.tsx`; renders **✦ Insights** ghost button (purple variant) in section title row — visible only for voice conversations
- Added `handleInsightsOpen` / `handleInsightsClose` handlers to `Sidebar.tsx`; sidebar state machine now cycles through all three modes: `default → insights → default`
- Created `InsightsDashboard.tsx` — four-section overlay replacing the sidebar in `insights` mode:
  - **Section A — Timing**: Queue Wait, Talk Time, Hold Time, Wrap-up, Handle Time (all from conversation-level fields; null renders as `—`)
  - **Section B — Routing**: Sessions count, Transfers (amber if >0), Escalations, Declined (ruby if >0 — uses `agentacceptedon === null` signal, NOT `closurereason`)
  - **Section C — AI / Voice Quality**: Sentiment, Agent Talk Ratio, Speaking Pace, Avg Pause, Longest Monologue, Conv. Switches — hidden entirely for chat conversations
  - **Section D — Participants**: Aggregated across all sessions, deduplicated by agent ID, with initials avatar, role labels, talk + hold times — hidden if participant data not yet loaded
- CSS: added `.insights-overlay`, `.insights-header`, `.insights-body`, `.insight-card` (+ `.timing/.routing/.quality/.people` variants), `.ic-grid`, `.ic-metric`, `.ic-metric-value`, `.ic-metric-label`, `.ic-section-label`, `.ic-value--amber`, `.ic-value--ruby`, `.ic-sentiment`, `.participant-list`, `.participant-row`, `.participant-avatar`, `.participant-info`, `.participant-name`, `.participant-role`, `.participant-times`, `.ghost-btn--purple`, forced-colors media query for all new elements

---

## v1.4.0 — 2025-05-26

**Status:** Deployed ✅

**Phase 2: Full Conversation Journey**

- Added `ISessionParticipant` interface to `types/index.ts`
- Added `loadSessionParticipants(webAPI, sessionId)` to `dataService.ts` — lazy loads `msdyn_sessionparticipant` records per session with full participant details
- Added `participantsBySession: Map<string, ISessionParticipant[]>` to `IControlState`
- `CopilotSummary` upgraded from `forceCollapsed` (Phase 1) to fully controlled: `isExpanded: boolean` + `onToggle: () => void` — state is now owned by `Sidebar`
- `Sidebar` state machine extended: saves/restores `summaryExpanded` state across journey expand/collapse; participant data fetched once on first expand and cached (never re-fetched)
- `JourneyPanel` expanded view now shows per-session:
  - **Queue name pill** (from `_msdyn_cdsqueueid_value` formatted value)
  - **Queue wait time pill** (amber) computed from `msdyn_agentacceptedon` − `msdyn_queueassignedon`
  - **Consult block** (purple) listing consulting participants; "→ Transferred" label when `consultmode=2`
  - **Wrap-up milestone** from `msdyn_wrapupinitiatedon`
  - **Bot badge** when `msdyn_botengagementmode` is set
  - **Loading skeleton** (shimmer animation) while participants are being fetched
  - **Declined transfer card** (red border) for sessions where agent never accepted (`msdyn_agentacceptedon === null` and creation reason is Transfer)
- CSS: added `.ghost-btn--active`, `.j-expanded-details`, `.j-pills`, `.j-queue-tag`, `.j-wait-tag`, `.j-consult-block`, `.j-declined-card`, `.j-declined-icon`, `.j-skeleton`, `.skeleton-line`, `@keyframes skeleton-shimmer`, plus `forced-colors` media query rules for all new elements

---

## v1.3.1 — 2025-05-26



**Status:** Built — ready for deployment

**Phase 1: Basic Conversation Journey**

- Extended `ISession` type with 9 new journey enrichment fields: `msdyn_sessioncreationreason`, `msdyn_closurereason`, `msdyn_botengagementmode`, `_msdyn_cdsqueueid_value`, `msdyn_agentacceptedon`, `msdyn_agentassignedon`, `msdyn_queueassignedon`, `msdyn_wrapupinitiatedon`
- Created `types/sessionConstants.ts` with `SESSION_CREATION_REASON`, `SESSION_CLOSURE_REASON`, `PARTICIPANT_MODE` const maps
- Updated `loadSessions()` `$select` to retrieve all new fields
- Added `SidebarMode` type (`'default' | 'journey-expanded' | 'insights'`) in `Sidebar.tsx`
- `Sidebar` state machine: tracks current mode, passes `webAPI` prop, collapses `CopilotSummary` and hides `CallMetrics` when mode is `journey-expanded`
- `CopilotSummary` new `forceCollapsed` prop: overrides internal toggle without losing state
- `JourneyPanel` new props: `mode`, `onExpand`, `onCollapse`. Section title now shows **Total** duration with Expand/Collapse ghost button
- Session type detection upgraded: uses `msdyn_sessioncreationreason` and `msdyn_closurereason` when available (falls back to duration heuristic for older records). Bot sessions now show 🤖 Bot Session label. Declined transfers show ✗ Transfer Declined
- Added 14 new i18n strings to `IStrings`, `DEFAULT_STRINGS`, `createStrings()`, EN RESX, and HE RESX: Expand, Collapse, Total, Bot Session, Transfer Declined, Never Accepted, session state labels, queue/consult labels (Phase 2 pre-wired)
- CSS: added `.ghost-btn`, `.section-title-actions`, `.journey-section--expanded`, updated `.journey-total-duration` to show value with bold emphasis

---

## v1.2.7 — 2026-04-28

**Status:** Deployed (final audio sync iteration — deferred as known bug)

- Reverted message sort-by-offsetMs introduced in v1.2.6 (broke conversation and event order)
- Raised text-match threshold back to 5 (threshold of 3 caused false-positive fragment matches)
- Audio sync (G-3) formally classified as **Known Bug — Unresolved**. See `GAPS.md` for full technical explanation and resolution path.

---

## v1.2.6 — 2026-04-28

**Status:** Deployed (rolled back in v1.2.7)

- Switched `stampVoiceOffsets` from greedy-forward to global best-match (mark-used pattern) to handle annotation commit-order vs ACS recording-start-order divergence
- Added sort of messages by `offsetMs` after stamping — **regression**: broke conversation display order and misplaced Hold/Mute/Transfer events; reverted in v1.2.7

---

## v1.2.5 — 2026-04-28

**Status:** Deployed (superseded by v1.2.6)

- Added `[ECC-sync]` diagnostic console logging to `stampVoiceOffsets`
- Switched from time-guided window search to global best-match with `used` flag
- Lowered match threshold to 3; added 30 % match-rate gate (falls back to Tier-3 if too few match)
- Added linear interpolation in `ChatTranscript.activeIndex` between matched anchor messages

---

## v1.2.4 — 2026-04-28

**Status:** Deployed (superseded by v1.2.5)

- Introduced `stampVoiceOffsets()` in `dataService.ts`: text-prefix matching of annotation messages to ACS JSON fragments to derive per-message `offsetMs`
- Added `offsetMs?: number` to `IMessage` interface
- Removed `voiceCallStartMs` from `IControlState` (wall-clock anchor approach abandoned)
- `ChatTranscript.activeIndex` updated to use `offsetMs` (Tier-1) with interpolation for gaps

---

## v1.2.3 — 2026-04-28

**Status:** Deployed (superseded by v1.2.4)

- Parallel fetch of annotation (rendering) + ACS JSON (timing)
- Derived `voiceCallStartMs` from `firstAnnotationMsg.created - firstAcsFragment.Start`
- **Known flaw:** `created` = utterance commit time (end), ACS `Start` = utterance begin time — anchor error equal to utterance duration per message

---

## v1.2.2 — 2026-04-28

**Status:** Deployed (superseded by v1.2.3)

- Reverted ACS-first voice loading from v1.2.1 (caused single-block regression)
- Kept `callStartTime` prop passing `msdyn_startedon` as sync anchor
- **Known flaw:** `msdyn_startedon` = customer queue entry time, not recording start (60–120s offset)

---

## v1.2.1 — 2026-04-28

**Status:** Deployed — **REGRESSION** (superseded by v1.2.2)

- Attempted ACS-first voice loading (ACS JSON for both rendering and timing)
- **Regression:** AudioCodes LiveHub calls share a single `ParticipantId` across all ACS fragments; turn-merging produced one mega-bubble for the entire transcript

---

## v1.2.0 — 2026-04-28

**Status:** Deployed ✅ (page freeze fix — stable)

- Fixed infinite React render loop (G-2 root cause: inline arrow function in `onMatchCount` prop)
- Added stable `handleMatchCount` with `React.useCallback` in `App.tsx`
- Added `onMatchCountRef` pattern in `ChatTranscript` to exclude callback from effect deps
- Version bump to 1.2.0

---

## v1.1.9 — 2026-04-28

**Status:** Deployed ✅

- Fixed `activeIndex` year-1970 gate in `ChatTranscript` that blocked annotation-path messages (real ISO timestamps, year 2026) from ever being highlighted
- Replaced with relative normalization: `offsetSec = (msg.created - firstContentMsg.created) / 1000`

---

## v1.1.8 — 2026-04-28

**Status:** Deployed ✅

- **G-1 resolved:** Language pill rendered in `Header.tsx`
- **G-2 resolved:** Search match count lifted to `App.tsx`, displayed inline in search box
- **G-3 partial:** `voiceCurrentTime` lifted to `App`; `ChatTranscript` wired to audio position; highlighting implemented (sync accuracy later found to be unreliable — see Known Bugs)
- RESX localization: English (1033) + Hebrew (1037), 46 keys each
- RTL layout: full support via CSS logical properties and `dir` attribute

---

## Known Bugs

### KB-001 — Audio / Transcript Synchronization (G-3)

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Status** | ⚠️ Unresolved — deferred |
| **Introduced** | v1.1.8 (partial implementation) |
| **Last investigated** | v1.2.7 |
| **Symptom** | Transcript highlight cursor does not reliably track audio playback. Sync is correct for the first 1–2 utterances then drifts or stalls. |
| **Root cause** | Annotation messages are stored in D365 in **utterance commit-time order**. ACS JSON fragments are in **recording-start-time order**. A long utterance (e.g., 30 words, starting at t=13s) does not commit until it ends — potentially after shorter utterances that started at t=22s and t=24s have already committed. No available API field exposes the recording-start timestamp per annotation message. Text-matching of annotation content to ACS fragments produces the correct `Start` offset per fragment, but the commit-order mismatch means the matched offsets are not in message-list order, and reordering the display breaks the conversation and event sequence. |
| **Resolution path** | Requires one of: (a) Microsoft exposing a `recordingStartOffset` field on the D365 annotation entity, or (b) direct access to the Azure Communication Services recording/transcript stream with per-utterance start times. |

---

*This document is updated only after explicit approval from the project owner.*
