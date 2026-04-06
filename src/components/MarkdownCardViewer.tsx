import React from 'react';
import { Text, View } from 'react-native';

type MarkdownCardViewerProps = {
  markdown: string;
  styles: Record<string, any>;
};

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'rule' };

function parseMarkdown(input: string): Block[] {
  const lines = (input || '').replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];

  let inCode = false;
  let codeLines: string[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

  const flushParagraph = () => {
    if (!paragraphLines.length) {
      return;
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ').trim() });
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listItems.length) {
      return;
    }
    blocks.push({ type: 'list', ordered: listOrdered, items: [...listItems] });
    listItems = [];
  };

  const flushCode = () => {
    if (!codeLines.length) {
      blocks.push({ type: 'code', text: '' });
      return;
    }
    blocks.push({ type: 'code', text: codeLines.join('\n') });
    codeLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine ?? '';
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flushParagraph();
      flushList();
      if (inCode) {
        flushCode();
      }
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'rule' });
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() });
      continue;
    }

    const quoteMatch = /^>\s+(.+)$/.exec(trimmed);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'quote', text: quoteMatch[1].trim() });
      continue;
    }

    const orderedMatch = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (orderedMatch) {
      flushParagraph();
      if (!listItems.length) {
        listOrdered = true;
      }
      if (listItems.length && !listOrdered) {
        flushList();
        listOrdered = true;
      }
      listItems.push(orderedMatch[1].trim());
      continue;
    }

    const unorderedMatch = /^[-*+]\s+(.+)$/.exec(trimmed);
    if (unorderedMatch) {
      flushParagraph();
      if (!listItems.length) {
        listOrdered = false;
      }
      if (listItems.length && listOrdered) {
        flushList();
        listOrdered = false;
      }
      listItems.push(unorderedMatch[1].trim());
      continue;
    }

    flushList();
    paragraphLines.push(trimmed);
  }

  if (inCode) {
    flushCode();
  }
  flushParagraph();
  flushList();

  return blocks;
}

export function MarkdownCardViewer({ markdown, styles }: MarkdownCardViewerProps) {
  const blocks = React.useMemo(() => parseMarkdown(markdown), [markdown]);

  if (!blocks.length) {
    return (
      <View style={styles.deviceRowCard}>
        <Text style={styles.cardCopy}>（Markdown 内容为空）</Text>
      </View>
    );
  }

  return (
    <View style={styles.deviceRowCard}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <Text
              key={`heading-${index}`}
              style={[
                styles.networkName,
                {
                  fontSize: Math.max(14, 26 - block.level * 2),
                  marginBottom: 8,
                  marginTop: block.level <= 2 ? 10 : 6,
                },
              ]}
            >
              {block.text}
            </Text>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <Text key={`p-${index}`} style={[styles.cardCopy, { marginBottom: 8, lineHeight: 22 }]}>
              {block.text}
            </Text>
          );
        }

        if (block.type === 'quote') {
          return (
            <View
              key={`q-${index}`}
              style={{
                borderLeftWidth: 3,
                borderLeftColor: '#7c8f86',
                paddingLeft: 10,
                marginBottom: 8,
              }}
            >
              <Text style={[styles.cardCopy, { lineHeight: 22 }]}>{block.text}</Text>
            </View>
          );
        }

        if (block.type === 'code') {
          return (
            <View
              key={`code-${index}`}
              style={{
                backgroundColor: '#f1f5f3',
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 8,
                marginBottom: 10,
              }}
            >
              <Text style={[styles.cardCopy, { fontFamily: 'monospace', lineHeight: 20 }]}>{block.text || ' '}</Text>
            </View>
          );
        }

        if (block.type === 'list') {
          return (
            <View key={`list-${index}`} style={{ marginBottom: 8 }}>
              {block.items.map((item, itemIndex) => (
                <Text key={`list-${index}-${itemIndex}`} style={[styles.cardCopy, { marginBottom: 4, lineHeight: 22 }]}>
                  {block.ordered ? `${itemIndex + 1}. ${item}` : `• ${item}`}
                </Text>
              ))}
            </View>
          );
        }

        return <View key={`rule-${index}`} style={{ borderTopWidth: 1, borderTopColor: '#d9e4df', marginVertical: 10 }} />;
      })}
    </View>
  );
}
