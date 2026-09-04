import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface MarkdownViewProps {
  content: string;
  isUser?: boolean;
  baseTextColor?: string;
  style?: ViewStyle;
}

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'divider' }
  | { type: 'blockquote'; text: string }
  | { type: 'bullet_list'; items: string[] }
  | { type: 'numbered_list'; items: { num: string; text: string }[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'paragraph'; text: string };

/**
 * Tokenize inline Markdown elements:
 * - ***bold-italic***
 * - **bold**
 * - *italic* or _italic_
 * - `code`
 */
function renderInline(text: string, baseStyle: TextStyle, theme: any, isUser: boolean = false) {
  if (!text) return null;

  // Regex to split by inline formatting tokens
  const INLINE_REGEX = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
  const parts = text.split(INLINE_REGEX);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold + Italic: ***text***
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      const inner = part.slice(3, -3);
      return (
        <Text
          key={index}
          style={[
            baseStyle,
            {
              fontWeight: '700',
              fontStyle: 'italic',
              color: isUser ? '#FFFFFF' : theme.text,
            },
          ]}
        >
          {inner}
        </Text>
      );
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <Text
          key={index}
          style={[
            baseStyle,
            {
              fontWeight: '700',
              color: isUser ? '#FFFFFF' : (theme.primaryDark || theme.text),
            },
          ]}
        >
          {inner}
        </Text>
      );
    }

    // Italic: *text* or _text_
    if (
      ((part.startsWith('*') && part.endsWith('*')) ||
        (part.startsWith('_') && part.endsWith('_'))) &&
      part.length >= 2
    ) {
      const inner = part.slice(1, -1);
      return (
        <Text
          key={index}
          style={[
            baseStyle,
            {
              fontStyle: 'italic',
              opacity: isUser ? 0.9 : 0.85,
            },
          ]}
        >
          {inner}
        </Text>
      );
    }

    // Inline code: `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <Text
          key={index}
          style={[
            baseStyle,
            {
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              fontSize: (baseStyle.fontSize || 14) * 0.9,
              backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : theme.inputBg,
              color: isUser ? '#FFFFFF' : theme.primary,
              paddingHorizontal: 4,
            },
          ]}
        >
          {inner}
        </Text>
      );
    }

    // Regular plain text
    return (
      <Text key={index} style={baseStyle}>
        {part}
      </Text>
    );
  });
}

/**
 * Clean markdown table row string into an array of cell values
 */
function parseTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|').map((cell) => cell.trim());
}

/**
 * Check if a line is a markdown table separator: |:---|:---| or |--|--|
 */
function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('-')) return false;
  return /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(trimmed);
}

/**
 * Parse Markdown string into structured blocks
 */
function parseMarkdown(md: string): Block[] {
  const lines = md.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // 1. Skip completely empty lines
    if (!line) {
      i++;
      continue;
    }

    // 2. Horizontal divider: ---, ***, ___
    if (/^(---|---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push({ type: 'divider' });
      i++;
      continue;
    }

    // 3. Headings: #, ##, ###, ####
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      let text = headingMatch[2].trim();
      // Remove enclosing ** inside heading if present (e.g. ### **Heading**)
      if (text.startsWith('**') && text.endsWith('**') && text.length >= 4) {
        text = text.slice(2, -2).trim();
      }
      blocks.push({ type: 'heading', level, text });
      i++;
      continue;
    }

    // 4. Blockquotes: > Quote
    if (line.startsWith('>')) {
      const text = line.replace(/^>\s*/, '').trim();
      blocks.push({ type: 'blockquote', text });
      i++;
      continue;
    }

    // 5. Tables: lines containing | that have a separator line next
    if (line.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = parseTableRow(line);
      i += 2; // skip header and separator
      const rows: string[][] = [];

      while (i < lines.length && lines[i].trim().includes('|') && !isTableSeparator(lines[i])) {
        const rowCells = parseTableRow(lines[i]);
        if (rowCells.some((c) => c.length > 0)) {
          rows.push(rowCells);
        }
        i++;
      }

      if (headers.length > 0) {
        blocks.push({ type: 'table', headers, rows });
        continue;
      }
    }

    // 6. Bullet lists: lines starting with *, -, +, or •
    const bulletMatch = line.match(/^(\*|-|\+|•)\s+(.*)$/);
    if (bulletMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const currLine = lines[i].trim();
        const currMatch = currLine.match(/^(\*|-|\+|•)\s+(.*)$/);
        if (currMatch) {
          items.push(currMatch[2].trim());
          i++;
        } else if (currLine && !currLine.startsWith('#') && !currLine.includes('|')) {
          // Continuation line of previous bullet item
          if (items.length > 0) {
            items[items.length - 1] += ' ' + currLine;
          }
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: 'bullet_list', items });
      continue;
    }

    // 7. Numbered lists: lines starting with 1., 2., etc.
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const items: { num: string; text: string }[] = [];
      while (i < lines.length) {
        const currLine = lines[i].trim();
        const currNumMatch = currLine.match(/^(\d+)\.\s+(.*)$/);
        if (currNumMatch) {
          items.push({ num: currNumMatch[1], text: currNumMatch[2].trim() });
          i++;
        } else if (currLine && !currLine.startsWith('#') && !currLine.includes('|')) {
          // Continuation line
          if (items.length > 0) {
            items[items.length - 1].text += ' ' + currLine;
          }
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: 'numbered_list', items });
      continue;
    }

    // 8. Regular paragraph
    let paraText = line;
    i++;
    // Gather multi-line paragraph text until next special block or empty line
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().match(/^(#{1,6}\s+|(\*|-|\+|•)\s+|\d+\.\s+|>|---|___|\*\*\*)/) &&
      !lines[i].trim().includes('|')
    ) {
      paraText += ' ' + lines[i].trim();
      i++;
    }
    blocks.push({ type: 'paragraph', text: paraText });
  }

  return blocks;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({
  content,
  isUser = false,
  baseTextColor,
  style,
}) => {
  const { theme, isDark } = useTheme();
  const textColor = baseTextColor || (isUser ? '#FFFFFF' : theme.text);

  const baseTextStyle: TextStyle = {
    fontSize: 14.5,
    lineHeight: 22,
    color: textColor,
  };

  const blocks = React.useMemo(() => parseMarkdown(content), [content]);

  return (
    <View style={[styles.container, style]}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading': {
            let headingFontSize = 16;
            let marginTop = 12;
            let marginBottom = 6;

            if (block.level === 1) {
              headingFontSize = 20;
              marginTop = 16;
              marginBottom = 8;
            } else if (block.level === 2) {
              headingFontSize = 18;
              marginTop = 14;
              marginBottom = 6;
            } else if (block.level === 3) {
              headingFontSize = 16;
              marginTop = 12;
              marginBottom = 6;
            } else {
              headingFontSize = 15;
              marginTop = 10;
              marginBottom = 4;
            }

            const headingStyle: TextStyle = {
              fontSize: headingFontSize,
              fontWeight: '700',
              lineHeight: headingFontSize * 1.35,
              color: isUser ? '#FFFFFF' : theme.text,
              marginTop: index === 0 ? 0 : marginTop,
              marginBottom,
            };

            return (
              <View key={index} style={styles.headingWrapper}>
                <Text style={headingStyle}>
                  {renderInline(block.text, headingStyle, theme, isUser)}
                </Text>
              </View>
            );
          }

          case 'divider': {
            return (
              <View
                key={index}
                style={[
                  styles.divider,
                  { backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : theme.border },
                ]}
              />
            );
          }

          case 'blockquote': {
            return (
              <View
                key={index}
                style={[
                  styles.blockquote,
                  {
                    borderLeftColor: theme.primary,
                    backgroundColor: isUser ? 'rgba(255,255,255,0.1)' : theme.inputBg,
                  },
                ]}
              >
                <Text style={[baseTextStyle, { fontStyle: 'italic' }]}>
                  {renderInline(block.text, baseTextStyle, theme, isUser)}
                </Text>
              </View>
            );
          }

          case 'bullet_list': {
            return (
              <View key={index} style={styles.listContainer}>
                {block.items.map((item, itemIdx) => (
                  <View key={itemIdx} style={styles.listItemRow}>
                    <View
                      style={[
                        styles.bulletDot,
                        { backgroundColor: isUser ? '#FFFFFF' : theme.primary },
                      ]}
                    />
                    <View style={styles.listItemContent}>
                      <Text style={baseTextStyle}>
                        {renderInline(item, baseTextStyle, theme, isUser)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          }

          case 'numbered_list': {
            return (
              <View key={index} style={styles.listContainer}>
                {block.items.map((item, itemIdx) => (
                  <View key={itemIdx} style={styles.listItemRow}>
                    <Text
                      style={[
                        styles.numberLabel,
                        { color: isUser ? '#FFFFFF' : theme.primary },
                      ]}
                    >
                      {item.num}.
                    </Text>
                    <View style={styles.listItemContent}>
                      <Text style={baseTextStyle}>
                        {renderInline(item.text, baseTextStyle, theme, isUser)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          }

          case 'table': {
            // Calculate column widths based on maximum characters
            const colWidths = block.headers.map((_, colIdx) => {
              const maxLen = Math.max(
                block.headers[colIdx]?.length || 0,
                ...block.rows.map((r) => (r[colIdx] || '').length)
              );
              if (maxLen <= 10) return 95;
              if (maxLen <= 20) return 130;
              if (maxLen <= 40) return 180;
              return 240;
            });

            const headerBg = isUser
              ? 'rgba(255,255,255,0.2)'
              : (isDark ? '#262626' : '#F1F5F9');
            const evenRowBg = isUser
              ? 'rgba(255,255,255,0.08)'
              : (isDark ? '#1C1C1C' : '#F8FAFC');
            const borderColor = isUser ? 'rgba(255,255,255,0.25)' : theme.border;

            return (
              <View key={index} style={styles.tableBlock}>
                {/* Horizontal scroll helper indicator for mobile */}
                <View style={styles.tableHeaderInfo}>
                  <Text style={[styles.tableHelperText, { color: isUser ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
                    ↔ Swipe table horizontally
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  contentContainerStyle={styles.tableScrollContent}
                >
                  <View
                    style={[
                      styles.tableCard,
                      {
                        borderColor,
                        backgroundColor: isUser ? 'transparent' : theme.card,
                      },
                    ]}
                  >
                    {/* Header Row */}
                    <View
                      style={[
                        styles.tableRow,
                        styles.tableHeaderRow,
                        {
                          backgroundColor: headerBg,
                          borderBottomColor: borderColor,
                        },
                      ]}
                    >
                      {block.headers.map((header, hIdx) => (
                        <View
                          key={hIdx}
                          style={[
                            styles.tableCell,
                            {
                              width: colWidths[hIdx],
                              borderRightColor:
                                hIdx === block.headers.length - 1 ? 'transparent' : borderColor,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.tableHeaderText,
                              { color: isUser ? '#FFFFFF' : theme.text },
                            ]}
                          >
                            {renderInline(
                              header,
                              {
                                fontSize: 12.5,
                                fontWeight: '700',
                                color: isUser ? '#FFFFFF' : theme.text,
                              },
                              theme,
                              isUser
                            )}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Body Rows */}
                    {block.rows.map((row, rIdx) => {
                      const isLastRow = rIdx === block.rows.length - 1;
                      const rowBg = rIdx % 2 === 1 ? evenRowBg : 'transparent';

                      return (
                        <View
                          key={rIdx}
                          style={[
                            styles.tableRow,
                            {
                              backgroundColor: rowBg,
                              borderBottomWidth: isLastRow ? 0 : StyleSheet.hairlineWidth,
                              borderBottomColor: borderColor,
                            },
                          ]}
                        >
                          {block.headers.map((_, cIdx) => {
                            const cellValue = row[cIdx] || '';
                            const isLastCell = cIdx === block.headers.length - 1;

                            return (
                              <View
                                key={cIdx}
                                style={[
                                  styles.tableCell,
                                  {
                                    width: colWidths[cIdx],
                                    borderRightColor: isLastCell ? 'transparent' : borderColor,
                                  },
                                ]}
                              >
                                <Text style={styles.tableCellText}>
                                  {renderInline(
                                    cellValue,
                                    {
                                      fontSize: 13,
                                      lineHeight: 18,
                                      color: isUser ? '#FFFFFF' : theme.text,
                                    },
                                    theme,
                                    isUser
                                  )}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            );
          }

          case 'paragraph': {
            return (
              <View key={index} style={styles.paragraphWrapper}>
                <Text style={baseTextStyle}>
                  {renderInline(block.text, baseTextStyle, theme, isUser)}
                </Text>
              </View>
            );
          }

          default:
            return null;
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headingWrapper: {
    width: '100%',
  },
  paragraphWrapper: {
    marginBottom: 8,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  listContainer: {
    marginVertical: 4,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 10,
  },
  numberLabel: {
    fontWeight: '700',
    fontSize: 14,
    marginRight: 8,
    lineHeight: 22,
  },
  listItemContent: {
    flex: 1,
  },
  tableBlock: {
    marginVertical: 10,
    width: '100%',
  },
  tableHeaderInfo: {
    marginBottom: 4,
  },
  tableHelperText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  tableScrollContent: {
    paddingBottom: 4,
  },
  tableCard: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeaderRow: {
    borderBottomWidth: 1.5,
  },
  tableCell: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRightWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  tableHeaderText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tableCellText: {
    fontSize: 13,
  },
});
