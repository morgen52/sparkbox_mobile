import React from 'react';
import { Text, View } from 'react-native';
import { useT } from '../i18n';
import { MarkdownRenderer } from './MarkdownRenderer';

type MarkdownCardViewerProps = {
  markdown: string;
  styles: Record<string, any>;
};

export function MarkdownCardViewer({ markdown, styles }: MarkdownCardViewerProps) {
  const t = useT();
  if (!markdown.trim()) {
    return (
      <View style={styles.deviceRowCard}>
        <Text style={styles.cardCopy}>{t('markdown.empty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.deviceRowCard}>
      <MarkdownRenderer markdown={markdown} styles={styles} tone="default" />
    </View>
  );
}
