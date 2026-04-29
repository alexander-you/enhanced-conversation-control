# Enhanced Conversation Control — Gap Tracking Register

> **Purpose:** Live register of all identified gaps between Phase 1 specifications and the current implementation.  
> **Last reviewed:** v1.1.8  
> **Update rule:** Only update Status column after explicit approval from the project owner.

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| 🔴 Open | Confirmed gap — not yet started |
| 🟡 Partial | Feature exists but does not fully match spec |
| 🟢 Resolved | Fully implemented and verified |
| ⏸ Deferred | Acknowledged, intentionally deferred to Phase 3+ |
| ⚠️ Known Bug | Investigated, cannot be reliably resolved with current available data |

---

## ⚠️ High Priority — Known Bugs (Unresolved)

### G-1 — Language Pill Missing from Header

| Field | Detail |
|---|---|
| **Priority** | High |
| **Status** | 🟢 Resolved — v1.1.8 |
| **Source** | `04-ui-analysis.md` — Header Pills table ("Language \| `pill-blue`") |
| **Component** | `components/Header.tsx` |
| **Description** | `Header.tsx` correctly fetches `languageName` from the OData formatted value of `_msdyn_customerlanguageid_value`, but the variable is **never rendered**. The language pill does not appear in the control header. |
| **Expected** | A `pill-blue` chip displaying the customer's language (e.g., "English", "Hebrew") should appear between the channel pill and the status pill. It should be hidden when the value is null. |
| **Effort** | Trivial — 1-line JSX addition in `Header.tsx` |

---

### G-2 — Search Match Count Not Inline in Search Box

| Field | Detail |
|---|---|
| **Priority** | High |
| **Status** | 🟢 Resolved — v1.1.8 |
| **Source** | `ECC-Project-Report.md §6.1` — "Show match count: '3 of 12'" |
| **Component** | `components/ChatTranscript.tsx`, `components/App.tsx` |
| **Description** | Match count IS computed and displayed, but inside a `search-results-bar` div rendered at the top of the transcript panel. The specification calls for it to appear **inline within the search box** (e.g., "3 / 12" inside the input row). Current implementation works but mismatches the designed UX placement. |
| **Expected** | Count displayed as "X of Y" inline in the transcript-header search box row, visible while a search term is active. |
| **Effort** | Small — move count computation up to `App.tsx`, pass down, render in `search-box` div |

---

### G-3 — Voice Transcript / Audio Timeline Synchronization

| Field | Detail |
|---|---|
| **Priority** | High |
| **Status** | ⚠️ Known Bug — Unresolved (deferred) |
| **Source** | `06-phase2-plan.md Obj 5` — "auto-scrolls to current audio position on playback (timeline sync with player)" |
| **Component** | `components/AudioPlayer.tsx`, `components/ChatTranscript.tsx`, `components/App.tsx`, `api/dataService.ts` |
| **Description** | Synchronization between audio playback and transcript highlight is unreliable. Root cause: annotation messages are stored in D365 **commit-time order**, which diverges from ACS recording-start-time order. A long utterance starting at t=13s commits to D365 after shorter utterances at t=22s and t=24s. ACS fragment `Start` timestamps (recording-start order) cannot be reliably mapped back to the annotation commit sequence. Multiple approaches were attempted (wall-clock anchor, greedy text matching, global best-match) — all produce incorrect highlight positions for a subset of utterances. |
| **Attempted Fixes** | v1.1.9: relative timestamp normalization · v1.2.1–v1.2.3: ACS anchor derivation · v1.2.4–v1.2.7: text-prefix matching (global best-match) |
| **Known Limitation** | The fundamental mismatch between annotation commit order and ACS recording-start order cannot be resolved without a D365/ACS API that exposes the recording-start timestamp per annotation message. |
| **Resolution Path** | Requires either: (a) Microsoft exposing a `recordingStartOffset` field on the annotation entity, or (b) use of Azure Communication Services direct transcript API with per-fragment timing. |
| **Effort** | Cannot be reliably solved with current available data. |

---

## 🟢 High Priority — Resolved

### G-4 — `updateView()` Has No `updatedProperties` Guard

| Field | Detail |
|---|---|
| **Priority** | Medium |
| **Status** | 🔴 Open |
| **Source** | `03-pcf-architecture.md §3.3` — "Check `context.updatedProperties` before re-rendering" |
| **Component** | `index.ts` |
| **Description** | `updateView()` unconditionally calls `React.createElement(App, ...)` on every invocation. PCF calls `updateView` on any D365 form property change, causing unnecessary React root re-creation. |
| **Expected** | Guard: only re-render if `context.updatedProperties` contains a property that affects the control's display. |
| **Effort** | Small |

---

### G-5 — `entityTypeName` Not Validated in `init()`

| Field | Detail |
|---|---|
| **Priority** | Medium |
| **Status** | 🔴 Open |
| **Source** | `03-pcf-architecture.md §3.2` — "validate it equals `'msdyn_ocliveworkitem'`" |
| **Component** | `index.ts`, `components/App.tsx` |
| **Description** | The control reads `entityId` with no guard on `entityTypeName`. If placed on a different entity form, it will attempt to call `msdyn_ocliveworkitem`-specific APIs on a foreign record GUID, producing misleading errors. |
| **Expected** | Check `contextInfo.entityTypeName === 'msdyn_ocliveworkitem'` and show a clear error if not. |
| **Effort** | Small |

---

### G-6 — `destroy()` Does Not Cancel In-Flight Fetches

| Field | Detail |
|---|---|
| **Priority** | Medium |
| **Status** | 🔴 Open |
| **Source** | `03-pcf-architecture.md §3.1` — "Cancel pending fetches, cleanup event listeners" |
| **Component** | `index.ts` |
| **Description** | `destroy()` is empty. AbortController cleanup exists inside React's `useEffect` cleanup, but PCF may call `destroy()` without unmounting the React tree first, leaving in-flight `fetch()` calls active after the control is torn down. |
| **Expected** | `destroy()` should hold a reference to the active AbortController registry and call `abort()` on all pending controllers. |
| **Effort** | Small–Medium |

---

## 🟠 Medium Priority — Data / UI Features

### G-7 — Tags Not Color-Coded by Sentiment Zone

| Field | Detail |
|---|---|
| **Priority** | Medium |
| **Status** | 🔴 Open |
| **Source** | `04-ui-analysis.md` — Tags & Keywords: "Color-code by sentiment zone if derivable" |
| **Component** | `components/TagsPanel.tsx` |
| **Description** | Tags are colored by cycling modulo (`i % 5 === 4 → purple`), not by sentiment. `insightsJson` with overall `sentiments.zone` is available in `App.tsx` but is never passed to `TagsPanel`. |
| **Expected** | Overall sentiment zone (from `insightsJson.insights.sentiments.zone`) should color-tint the tag container or individual tags. |
| **Effort** | Small |

---

### G-8 — Tags Not Supplemented from `insights.json`

| Field | Detail |
|---|---|
| **Priority** | Medium |
| **Status** | 🔴 Open |
| **Source** | `04-ui-analysis.md` — Tags & Keywords: "Supplement with any keyword array from `insights.json` if present" |
| **Component** | `components/TagsPanel.tsx`, `components/App.tsx` |
| **Description** | `TagsPanel` accepts only `keywords: string | null` from `msdyn_urcustomersentimentkeywords`. `insightsJson` is never passed to `TagsPanel`, so any keyword data embedded in the insights JSON is ignored. |
| **Expected** | If `insights.json` contains a keyword array, merge it with (or supplement) the CRM field keywords. |
| **Effort** | Small — contingent on whether `insights.json` actually contains keywords in practice (needs validation) |

---

### G-9 — `msdyn_calllongestcustomermonologue` Not Displayed

| Field | Detail |
|---|---|
| **Priority** | Medium |
| **Status** | 🔴 Open |
| **Source** | `02-api-queries.md §6` (field fetched), `DR-12` (`customerLongestMonologueInMs` in insights.json) |
| **Component** | `components/CallMetrics.tsx` |
| **Description** | `loadInsight()` already selects `msdyn_calllongestcustomermonologue` from the API, and the `insights.json` contains `customerLongestMonologueInMs`. Neither value is rendered in `CallMetrics.tsx`. |
| **Expected** | Add a "Longest Customer Monologue" metric row in the call metrics grid, formatted as "X.Xs". |
| **Effort** | Trivial — 1 metric item added to `CallMetrics.tsx` |

---

## 🟡 Low Priority — Accessibility & Security Hardening

### G-10 — No `aria-live` on Transcript Region

| Field | Detail |
|---|---|
| **Priority** | Low |
| **Status** | 🟡 Partial |
| **Source** | `06-phase2-plan.md Obj 11` — "Add `aria-live` to transcript and dynamic regions" |
| **Component** | `components/ChatTranscript.tsx` |
| **Description** | `chat-flow` div has `aria-live="polite"` (already present as of latest code check). However the `search-results-bar` count uses `aria-live="polite"` appropriately. The voice fallback `VoiceTranscript` component has `role="log"` but no `aria-live`. |
| **Expected** | Ensure all dynamic text regions that update without a page navigation are covered by an appropriate `aria-live` value. |
| **Effort** | Trivial |

---

### G-11 — No `forced-colors` / High Contrast CSS Block

| Field | Detail |
|---|---|
| **Priority** | Low |
| **Status** | 🔴 Open |
| **Source** | `06-phase2-plan.md Obj 11` — "Test in Windows High Contrast mode" |
| **Component** | `css/EnhancedConversationControl.css` |
| **Description** | No `@media (forced-colors: active)` block exists. Custom colored elements (waveform bars, sentiment circles, pill backgrounds, journey connector) may be invisible or unreadable in Windows High Contrast mode. |
| **Expected** | Add a `forced-colors` media query that ensures all interactive and informational elements use system color keywords (`ButtonText`, `Highlight`, etc.) where needed. |
| **Effort** | Small–Medium |

---

### G-12 — Formal WCAG 2.1 AA Audit Not Complete

| Field | Detail |
|---|---|
| **Priority** | Low |
| **Status** | 🔴 Open |
| **Source** | `06-phase2-plan.md Obj 11` — "Control passes WCAG 2.1 AA checklist" |
| **Component** | All |
| **Description** | No documented accessibility audit has been performed. Known potential issues: color contrast on `pill-amber` text, no skip-to-transcript landmark, focus ring visibility on custom speed-pill buttons, and keyboard-only operability of the waveform seek bar. |
| **Expected** | Complete a structured WCAG 2.1 AA review and remediate all AA-level failures. |
| **Effort** | Medium (audit + remediation pass) |

---

### G-13 — HTML Sanitization Uses Regex, Not a Library

| Field | Detail |
|---|---|
| **Priority** | Low |
| **Status** | 🟡 Partial |
| **Source** | `04-ui-analysis.md` — "DOMPurify or equivalent"; `06-phase2-plan.md Obj 11` |
| **Component** | `components/ChatTranscript.tsx` — `sanitizeHtml()` function |
| **Description** | The `sanitizeHtml()` function strips `<script>`, `<style>`, inline `on*` handlers, and `javascript:` hrefs via regex. This provides reasonable protection for current input patterns, but Phase 1 spec explicitly calls for a library-grade sanitizer (DOMPurify). Regex sanitizers are known to have edge-case bypasses. |
| **Expected** | Replace with `DOMPurify.sanitize()`. DOMPurify is widely used in PCF controls and has zero known bypasses for the patterns in use here. |
| **Effort** | Small (add dependency, swap 4 lines) |

---

## Summary

| Priority | Total | Open 🔴 | Partial 🟡 | Resolved 🟢 | Known Bug ⚠️ | Deferred ⏸ |
|----------|-------|---------|-----------|------------|-------------|------------|
| High — Resolved | 2 | 0 | 0 | 2 | 0 | 0 |
| High — Known Bug | 1 | 0 | 0 | 0 | 1 | 0 |
| Medium — Architecture | 3 | 3 | 0 | 0 | 0 | 0 |
| Medium — Data/UI | 3 | 3 | 0 | 0 | 0 | 0 |
| Low — A11y/Security | 4 | 2 | 2 | 0 | 0 | 0 |
| **Total** | **13** | **8** | **2** | **2** | **1** | **0** |

---

*This document is updated only after explicit approval from the project owner.*
