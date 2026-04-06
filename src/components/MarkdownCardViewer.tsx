import React from 'react';
import { Text, View } from 'react-native';
import { MarkdownRenderer } from './MarkdownRenderer';

type MarkdownCardViewerProps = {
  markdown: string;
  styles: Record<string, any>;
};

export function MarkdownCardViewer({ markdown, styles }: MarkdownCardViewerProps) {
  if (!markdown.trim()) {
    return (
      <View style={styles.deviceRowCard}>
        <Text style={styles.cardCopy}>（Markdown 内容为空）</Text>
      </View>
    );
  }

  return (
    <View style={styles.deviceRowCard}>
      <MarkdownRenderer markdown={markdown} styles={styles} tone="default" />
    </View>
  );
}
