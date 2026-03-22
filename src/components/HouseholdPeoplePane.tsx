import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  describeActivityEvent,
  describeInviteExpiry,
  describeInviteRole,
  describeUiDateTime,
} from '../appShell';
import type {
  HouseholdActivitySummary,
  HouseholdInviteSummary,
  HouseholdMemberSummary,
} from '../householdApi';
import {
  canChangeMemberRole,
  canRemoveHouseholdMember,
  describeHouseholdRole,
} from '../householdState';

type HouseholdPeoplePaneProps = {
  styles: Record<string, any>;
  canManage: boolean;
  settingsBusy: boolean;
  currentUserId: string;
  householdMembersCopy: string;
  homeMembers: HouseholdMemberSummary[];
  pendingInvites: HouseholdInviteSummary[];
  recentActivity: HouseholdActivitySummary[];
  onChangeMemberRole: (member: HouseholdMemberSummary, nextRole: 'owner' | 'member') => void;
  onRemoveMember: (member: HouseholdMemberSummary) => void;
  onGenerateInvite: (role: 'owner' | 'member') => void;
  onRevokeInvite: (invite: HouseholdInviteSummary) => void;
};

export function HouseholdPeoplePane({
  styles,
  canManage,
  settingsBusy,
  currentUserId,
  householdMembersCopy,
  homeMembers,
  pendingInvites,
  recentActivity,
  onChangeMemberRole,
  onRemoveMember,
  onGenerateInvite,
  onRevokeInvite,
}: HouseholdPeoplePaneProps) {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Household members</Text>
        <Text style={styles.cardCopy}>{householdMembersCopy}</Text>
        {homeMembers.map((member) => {
          const isSelf = member.id === currentUserId;
          const nextRole = member.role === 'owner' ? 'member' : 'owner';
          const canDemoteOrPromote = canChangeMemberRole(homeMembers, member, nextRole);
          const canRemoveMemberEntry = canRemoveHouseholdMember(homeMembers, member);

          return (
            <View key={member.id} style={styles.deviceRowCard}>
              <Text style={styles.networkName}>{member.display_name}</Text>
              <Text style={styles.cardCopy}>{describeHouseholdRole(member.role)}</Text>
              {canManage && !isSelf ? (
                <View style={styles.inlineActions}>
                  <Pressable
                    style={[
                      styles.secondaryButtonSmall,
                      !canDemoteOrPromote ? styles.networkRowDisabled : null,
                    ]}
                    onPress={() => onChangeMemberRole(member, nextRole)}
                    disabled={settingsBusy || !canDemoteOrPromote}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {member.role === 'owner' ? 'Remove owner access' : 'Give owner access'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.secondaryButtonSmall,
                      !canRemoveMemberEntry ? styles.networkRowDisabled : null,
                    ]}
                    onPress={() => onRemoveMember(member)}
                    disabled={settingsBusy || !canRemoveMemberEntry}
                  >
                    <Text style={styles.secondaryButtonText}>Remove</Text>
                  </Pressable>
                </View>
              ) : isSelf ? (
                <Text style={styles.cardCopy}>This is you.</Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {canManage ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Invites</Text>
          <Text style={styles.cardCopy}>
            Create a standard join invite or invite another owner here. Space-specific invites add people to this household and the shared space you picked.
          </Text>
          <View style={styles.inlineActions}>
            <Pressable
              style={styles.secondaryButtonSmall}
              onPress={() => onGenerateInvite('member')}
              disabled={settingsBusy}
            >
              <Text style={styles.secondaryButtonText}>Invite someone</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButtonSmall}
              onPress={() => onGenerateInvite('owner')}
              disabled={settingsBusy}
            >
              <Text style={styles.secondaryButtonText}>Invite co-owner</Text>
            </Pressable>
          </View>
          {pendingInvites.length === 0 ? (
            <Text style={styles.cardCopy}>No active invites right now.</Text>
          ) : (
            pendingInvites.map((invite) => (
              <View key={invite.id} style={styles.deviceRowCard}>
                <Text style={styles.networkName}>{describeInviteRole(invite.role)} invite</Text>
                <Text style={styles.cardCopy}>Join code: {invite.invite_code || 'Waiting for a fresh code'}</Text>
                {invite.space_name ? (
                  <Text style={styles.cardCopy}>Adds them to {invite.space_name}</Text>
                ) : null}
                <Text style={styles.cardCopy}>{describeInviteExpiry(invite.expires_at)}</Text>
                <View style={styles.inlineActions}>
                  <Pressable
                    style={styles.secondaryButtonSmall}
                    onPress={() => onRevokeInvite(invite)}
                    disabled={settingsBusy}
                  >
                    <Text style={styles.secondaryButtonText}>Revoke</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        {recentActivity.length === 0 ? (
          <Text style={styles.cardCopy}>No household activity yet.</Text>
        ) : (
          recentActivity.slice(0, 5).map((event) => (
            <View key={event.id} style={styles.deviceRowCard}>
              <Text style={styles.networkName}>{event.actor_name}</Text>
              <Text style={styles.cardCopy}>
                {describeActivityEvent(event.details || '', event.event_type)}
              </Text>
              {describeUiDateTime(event.created_at) ? (
                <Text style={styles.cardCopy}>{describeUiDateTime(event.created_at)}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </>
  );
}
