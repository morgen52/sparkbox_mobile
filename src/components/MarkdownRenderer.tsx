import React from 'react';
import { ScrollView, Text, View } from 'react-native';

type InlineToken =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'code'; text: string };

type ListItem = {
  text: string;
  taskState: 'checked' | 'unchecked' | null;
};

type TableBlock = {
  headers: string[];
  rows: string[][];
};

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; ordered: boolean; items: ListItem[] }
  | { type: 'table'; table: TableBlock }
  | { type: 'rule' };

type MarkdownRendererProps = {
  markdown: string;
  styles: Record<string, any>;
  tone?: 'default' | 'chatUser' | 'chatAssistant';
};

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) {
    return false;
  }
  const normalized = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  const cells = normalized.split('|').map((cell) => cell.trim());
  if (!cells.length) {
    return false;
  }
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const matcher = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push({ type: 'code', text: token.slice(1, -1) });
    } else if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
      tokens.push({ type: 'bold', text: token.slice(2, -2) });
    } else if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
      tokens.push({ type: 'italic', text: token.slice(1, -1) });
    } else {
      tokens.push({ type: 'text', text: token });
    }
    lastIndex = matcher.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', text: text.slice(lastIndex) });
  }

  return tokens;
}

function parseMarkdown(input: string): Block[] {
  const lines = (input || '').replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];

  let inCode = false;
  let codeLines: string[] = [];
  let paragraphLines: string[] = [];
  let listItems: ListItem[] = [];
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
    blocks.push({ type: 'code', text: codeLines.join('\n') });
    codeLines = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
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

    const nextLine = lines[i + 1] ?? '';
    if (trimmed.includes('|') && isTableSeparator(nextLine)) {
      flushParagraph();
      flushList();
      const headers = splitTableRow(trimmed);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length) {
        const rowLine = lines[i] ?? '';
        const rowTrimmed = rowLine.trim();
        if (!rowTrimmed || !rowTrimmed.includes('|')) {
          i -= 1;
          break;
        }
        rows.push(splitTableRow(rowTrimmed));
        i += 1;
      }
      blocks.push({ type: 'table', table: { headers, rows } });
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
      const itemText = orderedMatch[1].trim();
      const task = /^\[(x|X| )\]\s+(.+)$/.exec(itemText);
      listItems.push({
        text: task ? task[2].trim() : itemText,
        taskState: task ? (task[1].toLowerCase() === 'x' ? 'checked' : 'unchecked') : null,
      });
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
      const itemText = unorderedMatch[1].trim();
      const task = /^\[(x|X| )\]\s+(.+)$/.exec(itemText);
      listItems.push({
        text: task ? task[2].trim() : itemText,
        taskState: task ? (task[1].toLowerCase() === 'x' ? 'checked' : 'unchecked') : null,
      });
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

function renderInline(tokens: InlineToken[], styles: Record<string, any>, tone: 'default' | 'chatUser' | 'chatAssistant') {
  const baseColor = tone === 'chatUser' ? '#ffffff' : '#1f2d2a';
  const inlineCodeBg = tone === 'chatUser' ? 'rgba(255,255,255,0.2)' : '#eef3f1';

  return tokens.map((token, index) => {
    if (token.type === 'bold') {
      return (
        <Text key={`inline-${index}`} style={{ color: baseColor, fontWeight: '700' }}>
          {token.text}
        </Text>
      );
    }
    if (token.type === 'italic') {
      return (
        <Text key={`inline-${index}`} style={{ color: baseColor, fontStyle: 'italic' }}>
          {token.text}
        </Text>
      );
    }
    if (token.type === 'code') {
      return (
        <Text
          key={`inline-${index}`}
          style={{
            color: baseColor,
            fontFamily: 'monospace',
            backgroundColor: inlineCodeBg,
            paddingHorizontal: 4,
            borderRadius: 4,
          }}
        >
          {token.text}
        </Text>
      );
    }
    return (
      <Text key={`inline-${index}`} style={{ color: baseColor }}>
        {token.text}
      </Text>
    );
  });
}

export function MarkdownRenderer({ markdown, styles, tone = 'default' }: MarkdownRendererProps) {
  const blocks = React.useMemo(() => parseMarkdown(markdown), [markdown]);
  const baseColor = tone === 'chatUser' ? '#ffffff' : '#1f2d2a';

  const buildColumnWidths = (headers: string[], rows: string[][]): number[] => {
    const columnCount = Math.max(headers.length, ...rows.map((row) => row.length), 0);
    const widths: number[] = [];
    for (let col = 0; col < columnCount; col += 1) {
      const values = [headers[col] || '', ...rows.map((row) => row[col] || '')];
      const longest = values.reduce((max, cell) => Math.max(max, String(cell).length), 0);
      widths.push(Math.min(360, Math.max(120, longest * 8 + 28)));
    }
    return widths;
  };

  return (
    <View>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <Text
              key={`heading-${index}`}
              style={[
                styles.networkName,
                {
                  color: baseColor,
                  fontSize: Math.max(14, 26 - block.level * 2),
                  marginBottom: 8,
                  marginTop: block.level <= 2 ? 10 : 6,
                },
              ]}
            >
              {renderInline(parseInline(block.text), styles, tone)}
            </Text>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <Text key={`p-${index}`} style={[styles.cardCopy, { color: baseColor, marginBottom: 8, lineHeight: 22 }]}>
              {renderInline(parseInline(block.text), styles, tone)}
            </Text>
          );
        }

        if (block.type === 'quote') {
          return (
            <View
              key={`q-${index}`}
              style={{
                borderLeftWidth: 3,
                borderLeftColor: tone === 'chatUser' ? 'rgba(255,255,255,0.6)' : '#7c8f86',
                paddingLeft: 10,
                marginBottom: 8,
              }}
            >
              <Text style={[styles.cardCopy, { color: baseColor, lineHeight: 22 }]}>
                {renderInline(parseInline(block.text), styles, tone)}
              </Text>
            </View>
          );
        }

        if (block.type === 'code') {
          return (
            <View
              key={`code-${index}`}
              style={{
                backgroundColor: tone === 'chatUser' ? 'rgba(255,255,255,0.16)' : '#f1f5f3',
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 8,
                marginBottom: 10,
              }}
            >
              <Text style={[styles.cardCopy, { color: baseColor, fontFamily: 'monospace', lineHeight: 20 }]}> 
                {block.text || ' '}
              </Text>
            </View>
          );
        }

        if (block.type === 'list') {
          return (
            <View key={`list-${index}`} style={{ marginBottom: 8 }}>
              {block.items.map((item, itemIndex) => {
                const prefix =
                  item.taskState === 'checked'
                    ? '[x] '
                    : item.taskState === 'unchecked'
                      ? '[ ] '
                      : block.ordered
                        ? `${itemIndex + 1}. `
                        : '• ';
                return (
                  <Text key={`list-${index}-${itemIndex}`} style={[styles.cardCopy, { color: baseColor, marginBottom: 4, lineHeight: 22 }]}>
                    <Text style={{ color: baseColor }}>{prefix}</Text>
                    {renderInline(parseInline(item.text), styles, tone)}
                  </Text>
                );
              })}
            </View>
          );
        }

        if (block.type === 'table') {
          const headers = block.table.headers;
          const rows = block.table.rows;
          const columnWidths = buildColumnWidths(headers, rows);
          const tableWidth = columnWidths.reduce((sum, current) => sum + current, 0);
          const normalizedRows = rows.map((row) => {
            const normalized = [...row];
            while (normalized.length < columnWidths.length) {
              normalized.push('');
            }
            return normalized;
          });

          return (
            <View key={`table-${index}`} style={{ marginBottom: 12, borderWidth: 1, borderColor: '#d4e0db', borderRadius: 8 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: tableWidth }}>
                <View style={{ width: tableWidth }}>
                  <ScrollView
                    style={{ maxHeight: 320 }}
                    stickyHeaderIndices={[0]}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        backgroundColor: tone === 'chatUser' ? 'rgba(255,255,255,0.14)' : '#f3f7f5',
                      }}
                    >
                      {headers.map((header, headerIndex) => (
                        <View
                          key={`th-${index}-${headerIndex}`}
                          style={{
                            width: columnWidths[headerIndex],
                            paddingVertical: 8,
                            paddingHorizontal: 8,
                            borderRightWidth: headerIndex < headers.length - 1 ? 1 : 0,
                            borderRightColor: '#d4e0db',
                          }}
                        >
                          <Text style={[styles.cardCopy, { color: baseColor, fontWeight: '700' }]}>
                            {renderInline(parseInline(header), styles, tone)}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {normalizedRows.map((row, rowIndex) => (
                      <View key={`tr-${index}-${rowIndex}`} style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#d4e0db' }}>
                        {row.map((cell, cellIndex) => (
                          <View
                            key={`td-${index}-${rowIndex}-${cellIndex}`}
                            style={{
                              width: columnWidths[cellIndex],
                              paddingVertical: 8,
                              paddingHorizontal: 8,
                              borderRightWidth: cellIndex < headers.length - 1 ? 1 : 0,
                              borderRightColor: '#d4e0db',
                            }}
                          >
                            <Text style={[styles.cardCopy, { color: baseColor }]}>
                              {renderInline(parseInline(cell), styles, tone)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </ScrollView>
            </View>
          );
        }

        return <View key={`rule-${index}`} style={{ borderTopWidth: 1, borderTopColor: '#d9e4df', marginVertical: 10 }} />;
      })}
    </View>
  );
}
