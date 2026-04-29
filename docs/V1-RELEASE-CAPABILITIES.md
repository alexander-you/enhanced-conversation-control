# Enhanced Conversation Control — V1 Release Capabilities

> **Version:** 1.5.0  
> **Platform:** Microsoft Dynamics 365 Contact Center  
> **Channels:** Live Chat · Inbound Voice · Voice Callback  
> **Languages:** English (US) · Hebrew (with full RTL layout)

---

## Overview

The **Enhanced Conversation Control** replaces the standard out-of-the-box (OOTB) conversation view in Dynamics 365 Contact Center with a purpose-built experience that gives agents and supervisors a richer, more actionable view of every customer interaction. It consolidates conversation history, AI-generated summaries, routing intelligence, and call analytics into a single, coherent interface — without requiring agents to open multiple tabs or navigate away from the conversation record.

---

## 1. Customer Context at a Glance

Every conversation opens with a consolidated header bar that surfaces the most important customer information immediately, without any clicks.

| What agents see | Business value |
|---|---|
| Customer name, initials avatar, and online status | Instant identification — no need to navigate to the contact record |
| Channel indicator (Live Chat, Voice, Callback) | Agent can immediately understand the nature of the interaction |
| Queue assignment | Supervisor visibility into which queue owns the conversation |
| Customer language | Agents serving multilingual queues know the expected language upfront |
| Status pill (Active / Waiting / Wrap-Up / Resolved / Closed) | At-a-glance conversation lifecycle state, colour-coded for speed |
| Start time (relative: "Today, 11:22 AM") | Immediate sense of how long the interaction has been running |

---

## 2. Transcript — Chat & Voice

A clean, bubble-style transcript view for both chat and voice interactions, matching the conversational feel of modern messaging apps.

### Chat Conversations
- Full conversation rendered as speaker-differentiated chat bubbles — agent on the right, customer on the left
- Rich content supported: **bold/italic text**, bullet lists, headings, inline code, hyperlinks
- Adaptive Card responses (structured bot/agent prompts with date pickers, choice inputs) rendered as formatted cards — not raw JSON
- System events (transfers, holds, escalations) displayed as clearly labelled dividers within the conversation flow

### Voice Conversations
- Call transcripts displayed as the same bubble-style format as chat — speaker-separated, timestamped (call offset format, e.g., "1:23")
- No distinction in the agent experience between reading a chat and reading a call transcript

### Transcript Download
- Agents can download the full conversation as a **formatted HTML file** — styled with agent and customer bubbles, sender names, timestamps, and conversation metadata
- Suitable for attaching to case records, escalation emails, or compliance archives

---

## 3. Full-Text Transcript Search

Agents can search across the entire loaded conversation transcript in real time.

- **Instant keyword highlighting** — matched terms highlighted in yellow across all messages as the agent types
- **Match count** displayed inline in the search bar ("3 of 11") so agents know immediately how many results exist
- "No matches" feedback when the search term is not found
- Search does not interrupt the conversation view — agents can read context around each highlighted result

---

## 4. Conversation Journey — Queue & Workstream Visibility

The **Conversation Journey** panel is the most significant enhancement over the OOTB experience. It provides a complete, chronological timeline of every session the conversation passed through — from the initial bot greeting through every queue, transfer, and agent handoff, to the final close.

### Basic Timeline View (always visible)
- **One milestone per session** — Initial Call, Bot Session, Transfer, Escalation, or Closed
- **Total duration** prominently displayed in the section header
- **Sentiment coloring** per milestone — positive (green), negative (red), neutral (blue) — derived from AI conversation analytics
- **Bot sessions** clearly identified with the Microsoft Copilot icon rather than a generic indicator
- **Declined transfers** flagged with a distinct red-bordered card — showing which sessions were routed to an agent who never accepted

### Expanded Journey View (one click)
Expanding the Journey panel replaces the default sidebar view with a richly detailed timeline. For each session:

| Information | What it tells you |
|---|---|
| **Queue name pill** | Exactly which queue the session was routed to |
| **Queue wait time** (amber) | How long the customer waited before an agent accepted — computed automatically |
| **Agent profile photo + name** | Who handled each leg of the conversation, with their D365 profile picture |
| **Consult participants** | Who was consulted or conferenced in; whether the consultation became a transfer |
| **Wrap-up milestone** | When the agent entered wrap-up for that session |
| **Bot Session badge** | Sessions handled by a Copilot/bot agent are clearly labelled |
| **Session duration** | Time spent in each individual session |

This makes the full routing history of any conversation immediately readable — supervisors can see at a glance whether a call was bounced between queues, how long each wait was, and exactly who touched it.

---

## 5. AI Copilot Summary

The AI-generated conversation summary from Microsoft Copilot is surfaced directly in the sidebar with full Markdown formatting:

- Section headings, bullet points, and bold text rendered cleanly — not as raw Markdown syntax
- Copilot branding logo displayed in the panel header
- Panel is collapsible to maximise transcript reading area when needed
- Hidden automatically when no summary is available (preventing empty panel clutter)

---

## 6. Call Metrics (Voice & Callback)

For voice interactions, a dedicated analytics panel surfaces key call quality metrics derived from the AI insights record:

| Metric | Description |
|---|---|
| **Duration** | Total call length |
| **Talking speed** | Agent's words per minute |
| **Conversation switches** | Number of times the conversation switched between speakers — a proxy for interaction dynamics |
| **Average pause** | Average silence duration between utterances |
| **Talk / Listen ratio** | Visual bar showing the balance between agent speaking time and listening time |
| **Overall sentiment** | AI-scored sentiment zone (Positive / Negative / Neutral) with numeric pulse score |

---

## 7. Insights Dashboard (Voice & Callback)

Accessible via the **✦ Insights** button in the Call Metrics panel, the Insights Dashboard replaces the sidebar with a four-section deep-dive view:

### Section A — Timing Breakdown
Full granular time accounting for the call:
- Queue wait time (how long the customer waited before being connected)
- Talk time, Hold time, Wrap-up time, and Total handle time
- Each drawn directly from Dynamics 365 conversation-level KPI fields

### Section B — Routing Summary
A clear view of how complex the conversation's routing was:
- Number of sessions (legs)
- Transfer count — highlighted in amber when transfers occurred
- Escalation count
- Declined transfers — highlighted in red when a routed agent did not accept (a key quality signal)

### Section C — AI Voice Quality
Deeper AI analytics for voice calls:
- Sentiment zone and pulse score
- Agent talk ratio (percentage of time the agent was speaking)
- Speaking pace and average pause length
- Longest customer monologue (a signal for customer frustration or uninterrupted issue explanation)
- Conversation switch count

### Section D — Participants
A deduplicated roster of every person who participated in the conversation across all sessions:
- Agent profile photo and name
- Role (Primary Agent, Consultant, or both)
- Individual talk time and hold time per participant

---

## 8. Call Recording Playback (Voice & Callback)

A full-featured audio player is embedded directly in the conversation record — no external navigation required:

- **Play / Pause** with real-time position display
- **Playback speed control** — 0.5×, 1×, 1.5×, 2×
- **Waveform visualization** — amplitude bars coloured by sentiment zone, giving a visual "emotional map" of the call at a glance
- **Seek bar** — jump to any point in the recording
- **Download recording** — save the MP3 for compliance, coaching, or escalation purposes

---

## 9. Customer Sentiment Keywords

A keyword panel extracts and displays the customer's key sentiment terms as visual pill chips — the words and phrases the AI identified as most significant in the interaction. Useful for quick post-conversation review and for identifying recurring themes across cases.

---

## 10. Accessibility & Inclusion

The control is built to the **WCAG 2.1 AA** accessibility standard throughout:

- Full keyboard navigation
- Screen reader compatible (semantic HTML, `aria-label` attributes on all interactive elements)
- **High Contrast (Forced Colours) mode** — every panel, button, pill, and icon adapts automatically to Windows High Contrast themes
- All colour-coded indicators (sentiment, queue wait, declined transfers) are also expressed numerically so colour is never the only information channel

---

## 11. Multilingual & RTL Support

The control is fully localised and supports right-to-left languages out of the box:

- **English** and **Hebrew** supported at launch (90 localised strings each)
- RTL layout is **auto-detected** from the agent's Dynamics 365 language setting — no configuration required
- All layout elements (header, transcript, sidebar, journey timeline, audio player) mirror correctly in RTL
- The connector line in the Journey panel uses CSS logical properties to flip position correctly
- Additional languages can be added by providing a new RESX file — no code changes required

---

## 12. Multi-Channel Support

| Channel | Transcript | Audio Player | Journey | Insights |
|---|---|---|---|---|
| Live Chat | ✅ | — | ✅ | — |
| Inbound Voice | ✅ | ✅ | ✅ | ✅ |
| Voice Callback | ✅ | ✅ | ✅ | ✅ |

The control automatically adapts its layout and panel visibility based on the conversation channel — voice-only panels (audio player, call metrics, insights) are hidden for chat conversations and vice versa.

---

## Known Limitations (V1)

| Item | Detail |
|---|---|
| **Audio / transcript sync** | The voice transcript does not reliably highlight the currently playing utterance during audio playback. This is a platform-level data limitation (Microsoft has not exposed a per-utterance recording-start timestamp on the annotation entity). Flagged for resolution in a future release. |

---

*Document prepared for V1 release of `alex.EnhancedConversationControl` — version 1.5.0.*
