# Mobile Handoff Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce `App.tsx` coupling by extracting the new invite-preview and shared-space membership editing responsibilities into focused modules without changing behavior.

**Architecture:** Keep `App.tsx` as the shell/composition root, but move pure copy/state helpers and any request-specific data shaping into `src/` modules that can be tested in isolation. Land the refactor in small, behavior-preserving commits.

**Tech Stack:** React Native, TypeScript, Vitest

---

## Chunk 1: Shared Space Membership Module

### Task 1: Extract shared-space membership helper logic

**Files:**
- Create: `/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/spaceMembers.ts`
- Create: `/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/spaceMembers.test.ts`
- Modify: `/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/App.tsx`

- [ ] **Step 1: Write failing tests for member selection and invite copy**
- [ ] **Step 2: Run `npx vitest run src/spaceMembers.test.ts` and confirm fail**
- [ ] **Step 3: Implement pure helpers for initial selected ids, submit ids, and target-space invite copy**
- [ ] **Step 4: Wire `App.tsx` to use the helpers without changing UI strings**
- [ ] **Step 5: Run `npx vitest run src/spaceMembers.test.ts src/appStructure.test.ts src/householdApi.test.ts`**
- [ ] **Step 6: Commit**

## Chunk 2: Join Invite Preview Module

### Task 2: Extract invite preview state shaping

**Files:**
- Create: `/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/invitePreview.ts`
- Create: `/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/src/invitePreview.test.ts`
- Modify: `/Users/morgen/Desktop/projects/jetson/sparkbox_mobile/App.tsx`

- [ ] **Step 1: Write failing tests for preview visibility and copy**
- [ ] **Step 2: Run `npx vitest run src/invitePreview.test.ts` and confirm fail**
- [ ] **Step 3: Implement pure helpers for preview visibility and summary copy**
- [ ] **Step 4: Replace inline App logic with those helpers**
- [ ] **Step 5: Run `npx vitest run src/invitePreview.test.ts src/appStructure.test.ts src/householdApi.test.ts`**
- [ ] **Step 6: Commit**

## Chunk 3: Verification Pass

### Task 3: Re-run the mobile safety net

**Files:**
- Modify: none expected

- [ ] **Step 1: Run `npx vitest run src/authFlow.test.ts src/householdApi.test.ts src/householdState.test.ts src/spaceShell.test.ts src/appShell.test.ts src/appStructure.test.ts src/releaseConfig.test.ts`**
- [ ] **Step 2: Run `npm run typecheck`**
- [ ] **Step 3: Commit verification-only follow-up if any refactor fixes were needed**
