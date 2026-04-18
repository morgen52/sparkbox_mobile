import React from 'react';
import { Animated, Text, View } from 'react-native';
import { useT } from '../i18n';
import { AnimatedPressable as Pressable } from './AnimatedPressable';
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
  const t = useT();
  const [tabBarWidth, setTabBarWidth] = React.useState(0);
  const shellTabSliderTranslateX = React.useRef(new Animated.Value(0)).current;
  const tabCount = Math.max(tabs.length, 1);
  const activeTabIndex = React.useMemo(() => {
    const found = tabs.findIndex((tab) => tab.active);
    return found >= 0 ? found : 0;
  }, [tabs]);

  React.useEffect(() => {
    if (tabBarWidth <= 0) {
      return;
    }
    const tabWidth = tabBarWidth / tabCount;
    Animated.timing(shellTabSliderTranslateX, {
      toValue: tabWidth * activeTabIndex,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [activeTabIndex, shellTabSliderTranslateX, tabBarWidth, tabCount]);

  return (
    <>
      <View style={styles.heroTopRow}>
        <View style={styles.heroTextWrap}>
          <Text style={styles.eyebrow}>Sparkbox</Text>
          <Text style={styles.title}>{householdName}</Text>
        </View>
        {onBackToList ? (
          <Pressable style={styles.headerBackButton} onPress={onBackToList}>
            <Text style={styles.headerBackButtonText}>{backToListLabel || t('shellHeader.backToList')}</Text>
          </Pressable>
        ) : null}
      </View>

      <View
        style={styles.shellTabBar}
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;
          if (nextWidth > 0 && Math.abs(nextWidth - tabBarWidth) > 0.5) {
            setTabBarWidth(nextWidth);
          }
        }}
      >
        {tabBarWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shellTabSlider,
              {
                width: tabBarWidth / tabCount,
                transform: [{ translateX: shellTabSliderTranslateX }],
              },
            ]}
          />
        ) : null}
        {tabs.map((tab, index) => (
          <Pressable
            key={tab.id}
            style={[
              styles.shellTab,
              index === tabs.length - 1 ? styles.shellTabLast : null,
            ]}
            onPress={() => onSelectTab(tab.id)}
            pressFeedback="none"
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
