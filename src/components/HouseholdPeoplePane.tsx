import React from 'react';
import { Text, View } from 'react-native';
import { AnimatedPressable as Pressable } from './AnimatedPressable';
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
      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>家庭成员</Text>
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
                      {member.role === 'owner' ? '移除管理员权限' : '授予管理员权限'}
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
                    <Text style={styles.secondaryButtonText}>移除</Text>
                  </Pressable>
                </View>
              ) : isSelf ? (
                <Text style={styles.cardCopy}>这是你</Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {canManage ? (
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>邀请</Text>
          <Text style={styles.cardCopy}>
            在这里创建普通加入邀请，或邀请新的管理员。在空间的设置界面内发出的邀请会让对方进入对应的共享空间。
          </Text>
          <View style={styles.inlineActions}>
            <Pressable
              style={styles.secondaryButtonSmall}
              onPress={() => onGenerateInvite('member')}
              disabled={settingsBusy}
            >
              <Text style={styles.secondaryButtonText}>邀请成员</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButtonSmall}
              onPress={() => onGenerateInvite('owner')}
              disabled={settingsBusy}
            >
              <Text style={styles.secondaryButtonText}>邀请管理员</Text>
            </Pressable>
          </View>
          {pendingInvites.length === 0 ? (
            <Text style={styles.cardCopy}>当前没有有效邀请。</Text>
          ) : (
            pendingInvites.map((invite) => (
              <View key={invite.id} style={styles.deviceRowCard}>
                <Text style={styles.networkName}>{describeInviteRole(invite.role)}邀请</Text>
                <Text style={styles.cardCopy}>邀请码：{invite.invite_code || '等待新邀请码'}</Text>
                {invite.space_name ? (
                  <Text style={styles.cardCopy}>将加入到 {invite.space_name}</Text>
                ) : null}
                <Text style={styles.cardCopy}>{describeInviteExpiry(invite.expires_at)}</Text>
                <View style={styles.inlineActions}>
                  <Pressable
                    style={styles.secondaryButtonSmall}
                    onPress={() => onRevokeInvite(invite)}
                    disabled={settingsBusy}
                  >
                    <Text style={styles.secondaryButtonText}>撤销</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      ) : null}

      <View style={styles.settingsCard}>
        <Text style={styles.cardTitle}>最近活动</Text>
        {recentActivity.length === 0 ? (
          <Text style={styles.cardCopy}>暂无家庭活动。</Text>
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
