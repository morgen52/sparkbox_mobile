import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ShellTab } from '../householdState';

type ShellHeaderProps = {
  styles: Record<string, any>;
  householdName: string;
  backToListLabel?: string;
  onBackToList?: () => void;
  tabs: Array<{
    id: ShellTab;
    label: string;
    active: boolean;
  }>;
  onSelectTab: (tabId: ShellTab) => void;
};

export function ShellHeader({
  styles,
  householdName,
  backToListLabel,
  onBackToList,
  tabs,
  onSelectTab,
}: ShellHeaderProps) {
  return (
    <>
      <View style={styles.heroTopRow}>
        <View style={styles.heroTextWrap}>
          <Text style={styles.eyebrow}>Sparkbox</Text>
          <Text style={styles.title}>{householdName}</Text>
        </View>
        {onBackToList ? (
          <Pressable style={styles.headerBackButton} onPress={onBackToList}>
            <Text style={styles.headerBackButtonText}>{backToListLabel || '返回空间列表'}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.shellTabBar}>
        {tabs.map((tab, index) => (
          <Pressable
            key={tab.id}
            style={[
              styles.shellTab,
              index === tabs.length - 1 ? styles.shellTabLast : null,
              tab.active ? styles.shellTabActive : null,
            ]}
            onPress={() => onSelectTab(tab.id)}
          >
            <Text style={[styles.shellTabLabel, tab.active ? styles.shellTabLabelActive : null]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}
