import { describe, expect, it } from 'vitest';

import { buildInvitePreviewSummary, shouldLoadInvitePreview } from './invitePreview';

describe('shouldLoadInvitePreview', () => {
  it('only loads for join mode with a plausibly complete invite code', () => {
    expect(shouldLoadInvitePreview('join', 'ABCD1234')).toBe(true);
    expect(shouldLoadInvitePreview('join', 'ABC')).toBe(false);
    expect(shouldLoadInvitePreview('login', 'ABCD1234')).toBe(false);
  });
});

describe('buildInvitePreviewSummary', () => {
  it('describes the household and target shared space', () => {
    expect(buildInvitePreviewSummary('Owner Household', 'Parents')).toBe(
      'This code joins Owner Household and adds you to Parents.',
    );
  });

  it('still works for household-only invites', () => {
    expect(buildInvitePreviewSummary('Owner Household', null)).toBe('This code joins Owner Household.');
  });
});
