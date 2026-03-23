import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ShellTab } from '../householdState';

type ShellHeaderProps = {
  styles: Record<string, any>;
  householdName: string;
  subtitle: string;
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
  subtitle,
  tabs,
  onSelectTab,
}: ShellHeaderProps) {
  return (
    <>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Sparkbox</Text>
        <Text style={styles.title}>{householdName}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.shellTabBar}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.shellTab, tab.active ? styles.shellTabActive : null]}
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
