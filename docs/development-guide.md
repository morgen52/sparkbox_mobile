# Sparkbox Mobile Development Guide

This guide is for engineers picking up [`sparkbox_mobile`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile) without prior context.

## What This App Owns

`sparkbox_mobile` is a single React Native client that covers both setup and daily household use:

- auth: sign in, create household, join by invite
- onboarding: claim a Sparkbox, join `Sparkbox-Setup`, choose home Wi-Fi, verify cloud activation
- daily shell: chats, library, settings, owner tools, household management

The app is no longer split into a separate setup app and daily-use app. That is the main reason the root state graph is still non-trivial.

## Current Architecture

There are two real layers:

1. `App.tsx`
   This is still the orchestration layer. It owns:
   - global state
   - async effects
   - API calls
   - permission gating
   - reset logic across setup/shell/space changes

2. `src/components/*`
   These are mostly presentational or page-composition components. They render UI from props and push actions back up.

The important consequence is:

- if you are changing layout, copy, or a single page interaction, start in `src/components`
- if you are changing cross-surface behavior, auth/setup flow, space selection, or permission rules, you will still need to touch `App.tsx`

## File Map

### Root orchestrator

- [`App.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/App.tsx)
  Main state machine and data-loading coordinator.

### Page-level panes

- [`src/components/ChatsPane.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/ChatsPane.tsx)
  Composes the chat inbox/tools/recommendations/detail split.
- [`src/components/LibraryPane.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/LibraryPane.tsx)
  Library sections and actions.
- [`src/components/SettingsSummaryPane.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/SettingsSummaryPane.tsx)
  Household overview, viewed space card, account summary.
- [`src/components/SettingsDevicesPane.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/SettingsDevicesPane.tsx)
  Device and family-app install surfaces.
- [`src/components/OwnerSettingsPane.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/OwnerSettingsPane.tsx)
  Owner-only tooling, diagnostics, AI defaults, service control.
- [`src/components/HouseholdPeoplePane.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/HouseholdPeoplePane.tsx)
  Members, invites, recent activity.
- [`src/components/SetupFlowPane.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/SetupFlowPane.tsx)
  Setup/onboarding UI.

### Chat-specific UI pieces

- [`src/components/ChatInboxPane.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/ChatInboxPane.tsx)
- [`src/components/ChatSpaceToolsPane.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/ChatSpaceToolsPane.tsx)
- [`src/components/ChatInspirationPane.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/ChatInspirationPane.tsx)
- [`src/components/ChatDetailPane.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/ChatDetailPane.tsx)

### Modal and utility UI

- [`src/components/TaskEditorModal.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/TaskEditorModal.tsx)
- [`src/components/TaskHistoryModal.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/TaskHistoryModal.tsx)
- [`src/components/ChatSessionEditorModal.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/ChatSessionEditorModal.tsx)
- [`src/components/MemoryEditorModal.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/MemoryEditorModal.tsx)
- [`src/components/RelayComposerModal.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/RelayComposerModal.tsx)
- [`src/components/ScannerOverlay.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/ScannerOverlay.tsx)
- [`src/components/SetupUtilityModals.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/SetupUtilityModals.tsx)

### Shared business helpers

- [`src/householdApi.ts`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/householdApi.ts)
  HTTP requests and response types.
- [`src/householdState.ts`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/householdState.ts)
  Role/device state helpers.
- [`src/spaceShell.ts`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/spaceShell.ts)
  Space/chat/library copy and permission helpers.
- [`src/appShell.ts`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/appShell.ts)
  Cross-surface copy/formatting helpers.
- [`src/spaceMembers.ts`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/spaceMembers.ts)
  Shared-space member editing helpers.
- [`src/invitePreview.ts`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/invitePreview.ts)
  Invite preview strings and targeting helpers.

## How State Flows

The high-level order is:

1. restore session from storage
2. derive `shellSurface` from auth/setup/device state
3. load household summary and spaces
4. derive active space from storage and fetched spaces
5. load space detail
6. load tab-specific detail:
   - chats
   - library
   - tasks
   - settings owner tools

The most important thing to remember is that `activeSpaceId` is the pivot for most shell resets. Changing the active space intentionally clears chat/library/task transient state so data from one space never leaks into another.

## Where To Change Things

### Change chat UI

Start with:

- [`src/components/ChatsPane.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/ChatsPane.tsx)
- then one of the chat child panes

Only go to [`App.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/App.tsx) if you need:

- new fetch logic
- new permissions
- new cross-space resets
- new send/open behavior

### Change setup behavior

Start with:

- [`src/components/SetupFlowPane.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/SetupFlowPane.tsx)
- [`src/components/SetupUtilityModals.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/components/SetupUtilityModals.tsx)

Then move into [`App.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/App.tsx) for:

- hotspot stage changes
- claim/reprovision sequencing
- portal/open-settings behavior

### Change owner/member permissions

Start with:

- [`src/householdState.ts`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/householdState.ts)
- [`src/spaceShell.ts`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/spaceShell.ts)

Then update the relevant pane and `App.tsx` action gate together.

### Change copy

Prefer helper files first:

- [`src/appShell.ts`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/appShell.ts)
- [`src/spaceShell.ts`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/spaceShell.ts)
- [`src/invitePreview.ts`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/invitePreview.ts)

That keeps wording centralized and easier to regression-test.

## Tests You Should Care About

### Fast safety net

```bash
cd /Users/morgen/Desktop/projects/jetson/sparkbox_mobile
npx vitest run src/appStructure.test.ts src/spaceMembers.test.ts src/invitePreview.test.ts
npm run typecheck
```

Use this when you mainly changed UI structure or copy boundaries.

### Full local safety net

```bash
cd /Users/morgen/Desktop/projects/jetson/sparkbox_mobile
npx vitest run src/authFlow.test.ts src/householdApi.test.ts src/householdState.test.ts src/spaceShell.test.ts src/appShell.test.ts src/appStructure.test.ts src/releaseConfig.test.ts src/spaceMembers.test.ts src/invitePreview.test.ts
npm run typecheck
```

## Current Pain Points

These are the parts still worth refactoring further:

- [`App.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/App.tsx) is still the async/state coordinator for almost everything
- many pane props are still long because the state has not been pushed into feature hooks yet
- chat/library/settings share a lot of cross-cutting state that is correct, but still centralized

If you are doing larger cleanup next, the highest-value move is:

1. extract feature hooks from `App.tsx`
2. keep pane components presentational
3. keep copy/permission helpers centralized in `src/*Shell.ts`

## Recommended Next Refactor

If the goal is long-term maintainability instead of new product features, do this next:

- create `src/hooks/useSetupFlow.ts`
- create `src/hooks/useHouseholdShell.ts`
- move data fetching and reset logic out of [`App.tsx`](/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/App.tsx)
- keep `App.tsx` as the shell entrypoint that wires hooks to panes

That would move the file from “large orchestrator” toward “thin composition root”.
