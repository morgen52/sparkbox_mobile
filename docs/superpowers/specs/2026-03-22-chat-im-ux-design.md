# Chat IM UX Design

**Date:** 2026-03-22
**Product area:** Sparkbox Mobile v6 chat experience
**Primary repo:** `/Users/morgen/Desktop/projects/jetson/sparkbox_mobile`

## Goal

Make Sparkbox chats feel like a real messaging product instead of an admin shell with chat controls attached. The target is not pixel-cloning Telegram or WeChat, but reaching the same baseline of clarity:

- conversation list first, not management first
- group chats and private chats are visually obvious
- message history is easy to scan
- chat details behave like a messaging app before they behave like a settings screen

## Recommended approach

Use a hybrid of Telegram-style conversation list structure and WeChat-style reading comfort:

- Telegram-style list cells for information density
- WeChat-style message detail flow for readability and relationship cues
- keep existing Sparkbox space model and permissions intact
- avoid a broad architecture rewrite or server-side unread system in this iteration

This is the best balance because it produces a large perceived UX improvement without requiring a full messaging platform rebuild.

## Non-goals for this iteration

- global chat search
- pinning and archiving
- read receipts / double-check states
- true unread counts backed by server state
- attachments, voice notes, stickers, or rich media
- changing the existing space / session data model

## Current problems

### List-level problems

- `Chats` still reads like a space management surface before it reads like a message inbox.
- current space headers and control copy take too much attention.
- several rows still look like “topic entries” instead of conversations.
- group chat, private side chat, and extra shared chats are not visually distinct enough.
- some rows still fall back to descriptive copy instead of behaving like last-message driven chat rows.

### Detail-level problems

- chat detail mixes conversation and management semantics in the same visual hierarchy.
- messages do not yet group strongly enough by sender or by time.
- the top bar still behaves more like a contextual state panel than a messaging header.
- system notices, pending states, and failures are too close to regular messages.

### Mental-model problems

- users should immediately understand:
  - `qwer's Household · Group chat` is the main family group
  - `You + Sparkbox` is private
  - `webgroup · Today and this week` is another shared chat, not the main group
- the UI should make those differences visible without explanation text carrying the whole burden

## Design principles

1. **Conversation first**
   The first thing users should see is who the chat is with, what was said last, and when.

2. **Relationship before mechanism**
   Show people, group identity, and Sparkbox role before internal concepts like scopes, topics, or thread semantics.

3. **One primary action per screen**
   On list pages the primary action is opening or creating a chat. Management actions stay secondary.

4. **Readable message rhythm**
   Message history should be scannable in under a second: sender grouping, consistent spacing, lighter metadata, clearer bubbles.

5. **Progressive disclosure**
   Settings such as edit/delete/manage should stay accessible, but should not dominate the primary chat layout.

## Information architecture

### Chats tab

The `Chats` tab remains space-scoped, but the visual structure changes:

- top: compact active-space header
- body: true conversation list
- bottom: create/open actions tied to the currently selected scope

The active-space header should become a compact filter/status bar, not a hero section. It should answer:

- which space am I viewing?
- is it shared or private?
- can I create a new chat here?

It should not compete visually with the conversation list.

### Navigation boundary

This iteration keeps the current single-screen shell architecture inside `App.tsx`.

- `Chats` remains one shell tab, not a new nested navigator
- the conversation list remains the default body of the tab
- opening a conversation still swaps the tab body into the active conversation detail view
- the top of the detail view should feel like a messenger header, but implementation stays within the existing shell state machine

This is intentional. It avoids introducing a new React Navigation layer while still making the surface feel like a real messaging app.

### Return behavior

- chat detail gets an explicit back affordance in the header
- using that control returns to the conversation list for the same space
- Android back should mirror the same transition:
  - if a conversation detail is open, back returns to the list
  - if the list is already visible, back follows the app’s existing shell behavior

The implementation should not leave users guessing how to get from a conversation back to the inbox.

### Conversation list rows

Each row should follow this structure:

- leading avatar area
- center text block
  - primary line: conversation title
  - secondary line: last message preview
- trailing meta block
  - time
  - optional small status badge / unread placeholder styling

#### Shared main group chat row

For the main shared group chat:

- leading area uses a group avatar treatment
- title uses the space name and `Group chat`
- preview prefers the last real persisted message
- if there is no message, fallback preview should still read like a group inbox, not a technical explanation

#### Shared non-group chat row

For extra shared chats:

- leading area still shows a shared conversation treatment, but distinct from the main group
- title is the chat title only
- preview behaves like a normal conversation row
- badge language is `shared chat`, not `group chat`

#### Private chat row

For `You + Sparkbox`:

- single-avatar treatment
- title is stable and personal
- preview favors the latest message, prefixed with `You:` or `Sparkbox:` when useful

### Chat detail

The detail screen should be structured like a normal messenger:

- top header
- message timeline
- composer

#### Header behavior

The header should show:

- title
- compact subtitle
- for group chat: participant summary
- Sparkbox availability only if it helps the user act

The header should not read like a settings card.

#### Timeline behavior

The timeline should:

- group adjacent messages from the same sender
- show timestamps with lower emphasis
- visually separate user / family member / Sparkbox messages
- keep pending or failure notices visually outside the normal bubble rhythm
- keep system notices as inline status rows, not full conversational bubbles

#### Composer behavior

The composer should:

- feel like a normal messaging composer first
- use clearer placeholders:
  - group: `Message the group`
  - shared chat: `Ask Sparkbox in this chat`
  - private: `Talk to Sparkbox`
- keep send, timeout, and failure states clear without turning the composer into a status panel

## Group-chat behavior

The product rule stays:

- in the main shared family group, Sparkbox does not reply unless explicitly addressed
- when mentioned explicitly, Sparkbox answers
- in private chat or other shared chats, Sparkbox responds normally

The design implication is:

- main group chat should look like a family conversation where Sparkbox is present but not dominant
- Sparkbox presence should be visible in header/participants, but not visually treated as the central actor on every row

## Preview data rules

The list-preview logic must be explicitly shaped in the app layer.

### Preview source priority

1. latest persisted user or assistant message from the session summary payload
2. if none exists, a conversation-type-specific fallback line
3. never use management copy as a preview

### Preview exclusions

The list preview must not use:

- pending client-only messages
- retry/failure notice rows
- system notices
- delivery-status helper text
- role/permission helper copy

### Sender-prefix rules

- assistant preview: `Sparkbox: ...`
- current user preview: `You: ...`
- other member preview: `<display name>: ...`

### Group-chat no-reply behavior

If a family group message intentionally does not trigger Sparkbox, the list still updates from the user message normally. “No Sparkbox reply” is not an error state and must not degrade the row into fallback copy.

### Data-shaping constraint

The list row should prefer the backend summary payload and not synthesize previews from local transient timeline rows.

- use `last_message_preview`, `last_message_role`, `last_message_sender_display_name`, and `last_message_created_at` as the canonical list source
- treat local pending/failure/system rows as detail-only UI state
- do not let transient local rows overwrite the canonical row preview in the list

If implementation shows that backend summary payload can contain system-style rows that are indistinguishable from normal persisted messages, then a small backend follow-up is allowed. Until that is proven, this design assumes no new backend fields are required.

## Visual system adjustments

### Conversation list

- tighter row rhythm
- more pronounced avatar column
- stronger separation between title and preview
- time consistently aligned to the right
- larger difference between selected vs non-selected row state

### Message detail

- increase bubble spacing consistency
- make self / other / Sparkbox color and surface differences more distinct
- treat timestamps as tertiary metadata
- add clearer sender grouping for non-self messages

### Empty states

Replace “admin-ish” empty states with IM-style empties:

- list empty: `No chats yet. Start one when this space needs Sparkbox.`
- group without recent messages: participant-aware fallback, not technical explanation
- summaries/chat capture guidance remains role-aware, but should reference open chats naturally

## Management action placement

Owner/member-sensitive actions must stay available but visually secondary.

### Conversation list

- list rows do not expose destructive management actions inline
- row tap opens the conversation
- creation stays as the primary list action for contexts that allow it

### Chat detail

- owner-only actions such as edit/delete/manage stay in the detail header overflow area or in a secondary action block below the main header
- member view must not show owner-only destructive or configuration actions
- private chat detail can keep its limited management affordances, but they must remain below the primary reading/sending hierarchy
- main shared group chat and extra shared chat use the same placement rule; only the available actions differ by permission and conversation type

### Header rule

The header itself remains identity-first:

- title
- subtitle / participants
- compact secondary actions

It must not become a settings card again.

## Data and API impact

Minimal API impact is preferred.

Existing backend fields already support this direction:

- `last_message_preview`
- `last_message_role`
- `last_message_sender_display_name`
- `last_message_created_at`
- per-message `created_at`

No new backend fields are required for the first pass. The UI should primarily improve by better use of current data and clearer visual logic.

## Files likely affected

### Mobile

- `/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/App.tsx`
  - major structural changes in chat list rows, chat detail header, timeline rendering, composer copy, and management action placement
- `/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/appShell.ts`
  - subtitle, timestamp, and list-support display helpers
- `/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/spaceShell.ts`
  - conversation labeling, badge logic, preview copy, placeholder logic, and main-group detection rules
- `/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/householdApi.ts`
  - likely no new API contract needed, but may need small shaping helpers
- `/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/appStructure.test.ts`
- `/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/appShell.test.ts`
- `/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/spaceShell.test.ts`
- `/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/householdApi.test.ts`

### Cloud

No required schema change is expected for this design pass unless implementation reveals missing chat metadata.

## Error handling

- network failures should stay inline and local to the chat surface where they happen
- pending or retryable send failures should render as lightweight delivery notices, not as if they were standard messages
- group-chat no-response behavior should never look like a bug; absence of Sparkbox reply in the family group is correct unless addressed

## Testing strategy

### Unit tests

- conversation badge and label logic
- main group vs shared chat vs private chat differentiation
- preview text shaping and fallback hierarchy
- preview exclusion rules for pending, failed, and system rows
- composer placeholder selection
- header copy helpers and timestamp formatting

### Structure tests

- ensure the top-level `Chats` branch still exists only once
- ensure strings like `topic`, `thread`, and raw internal labels do not leak back in the updated chat surfaces where they should not appear
- ensure owner-only controls remain hidden from member chat detail in shared contexts
- ensure management actions stay out of list rows and remain secondary in detail

### Manual verification

Owner and member should both be checked in the Android emulator for:

- `qwer's Household · Group chat`
- `You + Sparkbox`
- `webgroup · Today and this week`

For each:

- list row identity
- last message preview behavior
- timestamp placement
- header hierarchy
- message timeline readability
- composer clarity
- owner/member permissions not regressing

### State-transition verification

This redesign must also be verified against state sync regressions:

- switching between `qwer's Household`, `You + Sparkbox`, and `webgroup`
- preserving the active conversation when the space stays valid
- resetting the active conversation when switching to a space where it is not valid
- list preview refresh after sending a new message
- detail timeline refresh after sending a new message
- timestamp refresh and sender-prefix correctness after new messages land
- main group no-reply behavior not causing stale or broken list state

## Success criteria

This work is successful when:

- a new user can tell group chat from private chat without explanatory text
- the `Chats` tab reads like a messaging inbox rather than a space control panel
- message history is obviously more readable and familiar
- Sparkbox feels present in the group, but not visually overbearing
- no existing owner/member permission boundaries regress
