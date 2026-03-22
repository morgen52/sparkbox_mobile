import { describe, expect, it } from 'vitest';

import {
  buildManagedSpaceMemberIds,
  buildSpaceInviteAlertMessage,
  buildSpaceInviteNotice,
  toggleManagedSpaceMember,
} from './spaceMembers';

describe('buildManagedSpaceMemberIds', () => {
  it('starts from space members other than the current user', () => {
    expect(
      buildManagedSpaceMemberIds(
        [
          { id: 'owner-1', displayName: 'Owner' },
          { id: 'member-1', displayName: 'Member One' },
          { id: 'member-2', displayName: 'Member Two' },
        ],
        'owner-1',
      ),
    ).toEqual(['member-1', 'member-2']);
  });
});

describe('toggleManagedSpaceMember', () => {
  it('adds and removes a selected member id', () => {
    expect(toggleManagedSpaceMember(['member-1'], 'member-2')).toEqual(['member-1', 'member-2']);
    expect(toggleManagedSpaceMember(['member-1', 'member-2'], 'member-1')).toEqual(['member-2']);
  });
});

describe('space-targeted invite copy', () => {
  it('builds a notice for a target shared space', () => {
    expect(buildSpaceInviteNotice('Member', 'ABCD1234', 'Parents')).toBe('Member invite for Parents: ABCD1234');
  });

  it('builds an alert message that explains the target shared space', () => {
    expect(buildSpaceInviteAlertMessage('ABCD1234', 'Parents')).toContain('They will join this household and be added to Parents.');
  });
});
