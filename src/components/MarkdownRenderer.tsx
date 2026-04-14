import React from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';

type InlineToken =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'bolditalic'; text: string }
  | { type: 'strikethrough'; text: string }
  | { type: 'code'; text: string }
  | { type: 'math'; text: string }
  | { type: 'link'; text: string; href: string }
  | { type: 'image'; alt: string; src: string };

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
  | { type: 'code'; text: string; lang: string }
  | { type: 'quote'; lines: string[] }
  | { type: 'list'; ordered: boolean; startNumber: number; items: ListItem[] }
  | { type: 'table'; table: TableBlock }
  | { type: 'rule' };

type MarkdownRendererProps = {
  markdown: string;
  styles: Record<string, any>;
  tone?: 'default' | 'chatUser' | 'chatAssistant';
  debug?: boolean;
};

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return false;
  const normalized = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  const cells = normalized.split('|').map((cell) => cell.trim());
  if (!cells.length) return false;
  return cells.every((cell) => /^:?-{1,}:?$/.test(cell));
}

// ── LaTeX → Unicode conversion ───────────────────────────────────────
const GREEK: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', zeta: 'ζ',
  eta: 'η', theta: 'θ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ',
  nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ',
  upsilon: 'υ', phi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π',
  Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
};
const SUP_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵',
  '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻',
  '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ', k: 'ᵏ', x: 'ˣ',
};
const SUB_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅',
  '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋',
  '(': '₍', ')': '₎',
};

function toSuperscript(s: string): string {
  return s.split('').map((c) => SUP_MAP[c] ?? c).join('');
}
function toSubscript(s: string): string {
  return s.split('').map((c) => SUB_MAP[c] ?? c).join('');
}

function latexToUnicode(tex: string): string {
  let s = tex;

  // Strip \left \right \bigl \bigr etc.
  s = s.replace(/\\(?:left|right|bigl?|bigr?|Bigl?|Bigr?)\b\s*/g, '');
  // \text{...} → content
  s = s.replace(/\\text\{([^}]*)}/g, '$1');
  // \mathrm, \mathbf, \mathit → content
  s = s.replace(/\\math(?:rm|bf|it)\{([^}]*)}/g, '$1');
  // \operatorname{...} → content
  s = s.replace(/\\operatorname\{([^}]*)}/g, '$1');

  // \frac{a}{b} → a/b    (handles one level of nesting via non-greedy + balanced tracking)
  s = s.replace(/\\frac\{([^}]*)}\{([^}]*)}/g, '($1)/($2)');
  // \dfrac / \tfrac same treatment
  s = s.replace(/\\[dt]frac\{([^}]*)}\{([^}]*)}/g, '($1)/($2)');
  // \binom{n}{k} → C(n,k)
  s = s.replace(/\\binom\{([^}]*)}\{([^}]*)}/g, 'C($1,$2)');
  // \sqrt[n]{x} → ⁿ√(x)
  s = s.replace(/\\sqrt\[([^\]]*)\]\{([^}]*)}/g, (_m, n, body) => `${toSuperscript(n)}√(${body})`);
  // \sqrt{x} → √(x)
  s = s.replace(/\\sqrt\{([^}]*)}/g, '√($1)');

  // Superscript: ^{...}
  s = s.replace(/\^\{([^}]*)}/g, (_m, inner) => toSuperscript(inner));
  // Single-char superscript: ^x
  s = s.replace(/\^([A-Za-z0-9])/g, (_m, c) => toSuperscript(c));
  // Subscript: _{...}
  s = s.replace(/_\{([^}]*)}/g, (_m, inner) => toSubscript(inner));
  // Single-char subscript: _x (only digits/letters, avoid e.g. _ in identifiers)
  s = s.replace(/_([0-9])/g, (_m, c) => toSubscript(c));

  // Greek letters (longer names first to avoid partial matches)
  const greekNames = Object.keys(GREEK).sort((a, b) => b.length - a.length);
  for (const name of greekNames) {
    // eslint-disable-next-line no-useless-escape
    s = s.replace(new RegExp(`\\\\${name}(?![a-zA-Z])`, 'g'), GREEK[name]);
  }

  // Common symbols
  s = s.replace(/\\infty/g, '∞');
  s = s.replace(/\\pm/g, '±');
  s = s.replace(/\\mp/g, '∓');
  s = s.replace(/\\times/g, '×');
  s = s.replace(/\\cdot/g, '·');
  s = s.replace(/\\div/g, '÷');
  s = s.replace(/\\leq?/g, '≤');
  s = s.replace(/\\geq?/g, '≥');
  s = s.replace(/\\neq?/g, '≠');
  s = s.replace(/\\approx/g, '≈');
  s = s.replace(/\\equiv/g, '≡');
  s = s.replace(/\\sim/g, '∼');
  s = s.replace(/\\to/g, '→');
  s = s.replace(/\\rightarrow/g, '→');
  s = s.replace(/\\leftarrow/g, '←');
  s = s.replace(/\\Rightarrow/g, '⇒');
  s = s.replace(/\\Leftarrow/g, '⇐');
  s = s.replace(/\\subset/g, '⊂');
  s = s.replace(/\\supset/g, '⊃');
  s = s.replace(/\\subseteq/g, '⊆');
  s = s.replace(/\\supseteq/g, '⊇');
  s = s.replace(/\\in\b/g, '∈');
  s = s.replace(/\\notin/g, '∉');
  s = s.replace(/\\cup/g, '∪');
  s = s.replace(/\\cap/g, '∩');
  s = s.replace(/\\emptyset/g, '∅');
  s = s.replace(/\\forall/g, '∀');
  s = s.replace(/\\exists/g, '∃');
  s = s.replace(/\\neg/g, '¬');
  s = s.replace(/\\land/g, '∧');
  s = s.replace(/\\lor/g, '∨');
  s = s.replace(/\\sum/g, '∑');
  s = s.replace(/\\prod/g, '∏');
  s = s.replace(/\\int/g, '∫');
  s = s.replace(/\\partial/g, '∂');
  s = s.replace(/\\nabla/g, '∇');

  // Spacing: \; \, \: \! \quad \qquad → thin space or space
  s = s.replace(/\\[;:,!]\s*/g, ' ');
  s = s.replace(/\\q?quad\s*/g, ' ');

  // Remove remaining backslash commands we don't handle (e.g. \, or unknown)
  // Keep the braces content: \cmd{content} → content
  s = s.replace(/\\[a-zA-Z]+\{([^}]*)}/g, '$1');
  // Remove bare \cmd that are left over
  s = s.replace(/\\[a-zA-Z]+/g, '');

  // Clean up stray braces
  s = s.replace(/[{}]/g, '');

  // Collapse multiple spaces
  s = s.replace(/ {2,}/g, ' ');

  return s.trim();
}

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  // Order: math delimiters first, then code, image, link, bold-italic, bold, italic, strikethrough
  // \(...\) for inline math; $...$ for inline math (non-greedy, avoid $$)
  const matcher =
    /(\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$(?!\$)|\$(?!\$)(?:[^$\\]|\\.)+\$(?!\$)|`[^`]+`|!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*\*[^*]+\*\*\*|___[^_]+___|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|~~[^~]+~~)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('\\(') && token.endsWith('\\)')) {
      tokens.push({ type: 'math', text: latexToUnicode(token.slice(2, -2)) });
    } else if (token.startsWith('$$') && token.endsWith('$$')) {
      tokens.push({ type: 'math', text: latexToUnicode(token.slice(2, -2)) });
    } else if (token.startsWith('$') && token.endsWith('$') && !token.startsWith('$$')) {
      tokens.push({ type: 'math', text: latexToUnicode(token.slice(1, -1)) });
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push({ type: 'code', text: token.slice(1, -1) });
    } else if (token.startsWith('![')) {
      tokens.push({ type: 'image', alt: match[2] || '', src: match[3] || '' });
    } else if (token.startsWith('[')) {
      tokens.push({ type: 'link', text: match[4] || '', href: match[5] || '' });
    } else if (
      (token.startsWith('***') && token.endsWith('***')) ||
      (token.startsWith('___') && token.endsWith('___'))
    ) {
      tokens.push({ type: 'bolditalic', text: token.slice(3, -3) });
    } else if (
      (token.startsWith('**') && token.endsWith('**')) ||
      (token.startsWith('__') && token.endsWith('__'))
    ) {
      tokens.push({ type: 'bold', text: token.slice(2, -2) });
    } else if (token.startsWith('~~') && token.endsWith('~~')) {
      tokens.push({ type: 'strikethrough', text: token.slice(2, -2) });
    } else if (
      (token.startsWith('*') && token.endsWith('*')) ||
      (token.startsWith('_') && token.endsWith('_'))
    ) {
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
  let codeLang = '';
  let codeLines: string[] = [];
  let paragraphLines: string[] = [];
  let listItems: ListItem[] = [];
  let listOrdered = false;
  let listStartNumber = 1;
  let quoteLines: string[] = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ').trim() });
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push({ type: 'list', ordered: listOrdered, startNumber: listStartNumber, items: [...listItems] });
    listItems = [];
  };

  const flushCode = () => {
    blocks.push({ type: 'code', text: codeLines.join('\n'), lang: codeLang });
    codeLines = [];
    codeLang = '';
  };

  const flushQuote = () => {
    if (!quoteLines.length) return;
    blocks.push({ type: 'quote', lines: [...quoteLines] });
    quoteLines = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();

    // Code fences
    if (trimmed.startsWith('```')) {
      flushParagraph();
      flushList();
      flushQuote();
      if (inCode) {
        flushCode();
      } else {
        codeLang = trimmed.slice(3).trim();
      }
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    // Blank line
    if (!trimmed) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }

    // Blockquote — accumulate consecutive lines
    const quoteMatch = /^>\s?(.*)$/.exec(trimmed);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quoteLines.push(quoteMatch[1]);
      continue;
    }
    flushQuote();

    // Table detection
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

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'rule' });
      continue;
    }

    // Heading
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() });
      continue;
    }

    // Ordered list
    const orderedMatch = /^(\d+)\.\s+(.+)$/.exec(trimmed);
    if (orderedMatch) {
      flushParagraph();
      if (!listItems.length) {
        listOrdered = true;
        listStartNumber = parseInt(orderedMatch[1], 10) || 1;
      }
      if (listItems.length && !listOrdered) {
        flushList();
        listOrdered = true;
        listStartNumber = parseInt(orderedMatch[1], 10) || 1;
      }
      const itemText = orderedMatch[2].trim();
      const task = /^\[(x|X| )\]\s+(.+)$/.exec(itemText);
      listItems.push({
        text: task ? task[2].trim() : itemText,
        taskState: task ? (task[1].toLowerCase() === 'x' ? 'checked' : 'unchecked') : null,
      });
      continue;
    }

    // Unordered list
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

  if (inCode) flushCode();
  flushParagraph();
  flushList();
  flushQuote();

  return blocks.filter((block) => {
    if (block.type === 'rule' || block.type === 'table') return true;
    if (block.type === 'list') return block.items.length > 0;
    if (block.type === 'code') return block.text.trim().length > 0;
    if (block.type === 'quote') return block.lines.length > 0;
    if ('text' in block) return block.text.trim().length > 0;
    return true;
  });
}

export function MarkdownRenderer({ markdown, styles, tone = 'default', debug = false }: MarkdownRendererProps) {
  const blocks = React.useMemo(() => parseMarkdown(markdown), [markdown]);
  const baseColor = tone === 'chatUser' ? '#ffffff' : '#1f2d2a';
  const mutedColor = tone === 'chatUser' ? 'rgba(255,255,255,0.7)' : '#7c8f86';
  const inlineCodeBg = tone === 'chatUser' ? 'rgba(255,255,255,0.2)' : '#eef3f1';
  const codeBg = tone === 'chatUser' ? 'rgba(255,255,255,0.16)' : '#f1f5f3';
  const quoteBorderColor = tone === 'chatUser' ? 'rgba(255,255,255,0.6)' : '#7c8f86';
  const linkColor = tone === 'chatUser' ? '#a0d2ff' : '#0b6e4f';
  const mathColor = tone === 'chatUser' ? '#c8e6ff' : '#2a5a3f';

  const renderBlockInline = (text: string): React.ReactNode[] => {
    return parseInline(text).map((token, i) => {
      if (token.type === 'math') {
        return (
          <Text key={i} style={{ fontStyle: 'italic', color: mathColor }}>
            {token.text}
          </Text>
        );
      }
      if (token.type === 'bolditalic') {
        return <Text key={i} style={{ fontWeight: '700', fontStyle: 'italic' }}>{token.text}</Text>;
      }
      if (token.type === 'bold') {
        return <Text key={i} style={{ fontWeight: '700' }}>{token.text}</Text>;
      }
      if (token.type === 'italic') {
        return <Text key={i} style={{ fontStyle: 'italic' }}>{token.text}</Text>;
      }
      if (token.type === 'strikethrough') {
        return <Text key={i} style={{ textDecorationLine: 'line-through' }}>{token.text}</Text>;
      }
      if (token.type === 'code') {
        return (
          <Text key={i} style={{ fontFamily: 'monospace', backgroundColor: inlineCodeBg, paddingHorizontal: 2 }}>
            {token.text}
          </Text>
        );
      }
      if (token.type === 'link') {
        return (
          <Text
            key={i}
            style={{ color: linkColor, textDecorationLine: 'underline' }}
            onPress={() => {
              if (token.href.startsWith('http://') || token.href.startsWith('https://')) {
                void Linking.openURL(token.href);
              }
            }}
          >
            {token.text}
          </Text>
        );
      }
      if (token.type === 'image') {
        return (
          <Text key={i} style={{ color: mutedColor, fontStyle: 'italic' }}>
            {'[图片: '}{token.alt || token.src}{']'}
          </Text>
        );
      }
      return <Text key={i}>{token.text}</Text>;
    });
  };

  // Check if we have any table blocks that require View-based rendering
  const hasTableBlocks = blocks.some((b) => b.type === 'table');

  const renderBlocksAsText = (blockList: Block[], keyPrefix: string): React.ReactNode[] => {
    const segments: React.ReactNode[] = [];
    blockList.forEach((block, index) => {
      if (index > 0) {
        segments.push(<Text key={`${keyPrefix}sep-${index}`}>{'\n\n'}</Text>);
      }
      if (block.type === 'heading') {
        const fontSize = Math.max(14, 26 - block.level * 2);
        segments.push(
          <Text key={`${keyPrefix}h-${index}`} style={{ fontWeight: '700', fontSize }}>
            {renderBlockInline(block.text)}
          </Text>,
        );
      } else if (block.type === 'paragraph') {
        segments.push(
          <Text key={`${keyPrefix}p-${index}`}>{renderBlockInline(block.text)}</Text>,
        );
      } else if (block.type === 'quote') {
        const quoteText = block.lines.join('\n');
        segments.push(
          <Text key={`${keyPrefix}q-${index}`} style={{ color: quoteBorderColor }}>
            {'▎ '}
            <Text style={{ color: baseColor }}>{renderBlockInline(quoteText)}</Text>
          </Text>,
        );
      } else if (block.type === 'code') {
        segments.push(
          <Text
            key={`${keyPrefix}c-${index}`}
            style={{ fontFamily: 'monospace', backgroundColor: codeBg, paddingHorizontal: 2 }}
          >
            {block.lang ? `[${block.lang}]\n` : ''}{block.text}
          </Text>,
        );
      } else if (block.type === 'list') {
        block.items.forEach((item, itemIndex) => {
          if (itemIndex > 0) {
            segments.push(<Text key={`${keyPrefix}lsep-${index}-${itemIndex}`}>{'\n'}</Text>);
          }
          const prefix =
            item.taskState === 'checked'
              ? '☑ '
              : item.taskState === 'unchecked'
                ? '☐ '
                : block.ordered
                  ? `${block.startNumber + itemIndex}. `
                  : '• ';
          segments.push(
            <Text key={`${keyPrefix}li-${index}-${itemIndex}`}>
              {prefix}{renderBlockInline(item.text)}
            </Text>,
          );
        });
      } else if (block.type === 'rule') {
        segments.push(<Text key={`${keyPrefix}r-${index}`} style={{ color: mutedColor }}>{'————————'}</Text>);
      }
    });
    return segments;
  };

  // For content without tables, render everything in a single <Text> to avoid
  // React Native Yoga layout measurement bugs with multiple View/Text children.
  if (!hasTableBlocks) {
    return (
      <Text style={[styles.cardCopy, { color: baseColor }]} selectable>
        {renderBlocksAsText(blocks, '')}
      </Text>
    );
  }

  // Fallback: content with tables needs View-based layout for horizontal scroll.
  // Render text blocks as a single <Text>, tables as separate <View>.
  const elements: React.ReactNode[] = [];
  let textBlockBatch: Block[] = [];

  const flushText = (keyPrefix: string) => {
    if (textBlockBatch.length > 0) {
      elements.push(
        <Text key={`txt-${keyPrefix}`} style={[styles.cardCopy, { color: baseColor }]} selectable>
          {renderBlocksAsText(textBlockBatch, `${keyPrefix}-`)}
        </Text>,
      );
      textBlockBatch = [];
    }
  };

  const buildColumnWidths = (headers: string[], rows: string[][]): number[] => {
    const columnCount = Math.max(headers.length, ...rows.map((row) => row.length), 1);
    const widths: number[] = [];
    for (let col = 0; col < columnCount; col += 1) {
      const values = [headers[col] || '', ...rows.map((row) => row[col] || '')];
      const longest = values.reduce((max, cell) => Math.max(max, String(cell).length), 0);
      widths.push(Math.min(360, Math.max(80, longest * 8 + 28)));
    }
    return widths;
  };

  blocks.forEach((block, index) => {
    if (block.type === 'table') {
      flushText(`pre-${index}`);
      const headers = block.table.headers;
      const rows = block.table.rows;
      const columnWidths = buildColumnWidths(headers, rows);
      const columnCount = columnWidths.length;
      const tableWidth = columnWidths.reduce((sum, current) => sum + current, 0);
      const normalizedRows = rows.map((row) => {
        const normalized = [...row];
        while (normalized.length < columnCount) normalized.push('');
        return normalized.slice(0, columnCount);
      });
      const normalizedHeaders = [...headers];
      while (normalizedHeaders.length < columnCount) normalizedHeaders.push('');

      elements.push(
        <View key={`table-${index}`} style={{ marginVertical: 8, borderWidth: 1, borderColor: '#d4e0db', borderRadius: 8, overflow: 'hidden' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={{ minWidth: tableWidth }}>
              <View style={{ flexDirection: 'row', backgroundColor: tone === 'chatUser' ? 'rgba(255,255,255,0.14)' : '#f3f7f5' }}>
                {normalizedHeaders.map((header, hi) => (
                  <View key={`th-${index}-${hi}`} style={{ width: columnWidths[hi], paddingVertical: 8, paddingHorizontal: 8, borderRightWidth: hi < columnCount - 1 ? 1 : 0, borderRightColor: '#d4e0db' }}>
                    <Text style={[styles.cardCopy, { color: baseColor, fontWeight: '700' }]}>{renderBlockInline(header)}</Text>
                  </View>
                ))}
              </View>
              {normalizedRows.map((row, ri) => (
                <View key={`tr-${index}-${ri}`} style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#d4e0db' }}>
                  {row.map((cell, ci) => (
                    <View key={`td-${index}-${ri}-${ci}`} style={{ width: columnWidths[ci], paddingVertical: 8, paddingHorizontal: 8, borderRightWidth: ci < columnCount - 1 ? 1 : 0, borderRightColor: '#d4e0db' }}>
                      <Text style={[styles.cardCopy, { color: baseColor }]}>{renderBlockInline(cell)}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>,
      );
    } else {
      textBlockBatch.push(block);
    }
  });
  flushText('final');

  return <>{elements}</>;
}
