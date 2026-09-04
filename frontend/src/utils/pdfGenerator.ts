import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { ADAPTIVE_ICON_BASE64 } from './adaptiveIconBase64';

async function getLogoUri(): Promise<string> {
  try {
    const [asset] = await Asset.loadAsync(require('../../assets/images/adaptive-icon.png'));
    if (Platform.OS !== 'web' && asset.localUri && FileSystem?.readAsStringAsync) {
      const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (base64) {
        return `data:image/png;base64,${base64}`;
      }
    }
    if (asset.uri) {
      return asset.uri;
    }
  } catch (err) {
    console.log('Using fallback base64 logo for PDF:', err);
  }
  return ADAPTIVE_ICON_BASE64;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseInlineHtml(text: string): string {
  let s = text;
  // Bold + Italic: ***text***
  s = s.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold: **text**
  s = s.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0f172a;">$1</strong>');
  // Italic: *text* or _text_
  s = s.replace(/\*(.*?)\*/g, '<em>$1</em>');
  s = s.replace(/_(.*?)_/g, '<em>$1</em>');
  // Inline code: `text`
  s = s.replace(
    /`(.*?)`/g,
    '<code style="background:#f1f5f9; padding:2px 6px; border-radius:3px; font-family:monospace; font-size:12px; color:#2563eb;">$1</code>'
  );
  return s;
}

function parseTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|').map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('-')) return false;
  return /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(trimmed);
}

function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const htmlParts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Horizontal Rule: ---, ***, ___
    if (/^(---|---|\*\*\*|___)\s*$/.test(line)) {
      htmlParts.push('<hr style="border:0; border-top:1px solid #e2e8f0; margin:22px 0;" />');
      i++;
      continue;
    }

    // Headings: #, ##, ###, ####
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      let title = headingMatch[2].trim();
      // Remove redundant surrounding ** inside heading
      if (title.startsWith('**') && title.endsWith('**') && title.length >= 4) {
        title = title.slice(2, -2).trim();
      }
      const safeTitle = parseInlineHtml(escapeHtml(title));
      if (level === 1) {
        htmlParts.push(
          `<h1 style="color:#0f172a; margin-top:24px; margin-bottom:10px; font-size:20px; font-weight:800; border-bottom:2px solid #e2e8f0; padding-bottom:6px;">${safeTitle}</h1>`
        );
      } else if (level === 2) {
        htmlParts.push(
          `<h2 style="color:#0f172a; margin-top:20px; margin-bottom:8px; font-size:17px; font-weight:700; border-bottom:1px solid #f1f5f9; padding-bottom:4px;">${safeTitle}</h2>`
        );
      } else if (level === 3) {
        htmlParts.push(
          `<h3 style="color:#1e293b; margin-top:18px; margin-bottom:6px; font-size:15px; font-weight:700;">${safeTitle}</h3>`
        );
      } else {
        htmlParts.push(
          `<h4 style="color:#334155; margin-top:14px; margin-bottom:4px; font-size:13.5px; font-weight:700;">${safeTitle}</h4>`
        );
      }
      i++;
      continue;
    }

    // Blockquote: > Quote
    if (line.startsWith('>')) {
      const text = parseInlineHtml(escapeHtml(line.replace(/^>\s*/, '').trim()));
      htmlParts.push(
        `<blockquote style="border-left:4px solid #2563eb; background:#f8fafc; padding:10px 16px; margin:14px 0; color:#475569; font-style:italic; border-radius:0 4px 4px 0;">${text}</blockquote>`
      );
      i++;
      continue;
    }

    // Tables: lines containing | followed by separator line
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
        let tableHtml = '<div style="margin:20px 0; overflow-x:auto;">';
        tableHtml +=
          '<table style="width:100%; border-collapse:collapse; font-size:12px; line-height:1.5; background:#ffffff; border-radius:6px; overflow:hidden; border:1px solid #cbd5e1;">';

        // Table Header
        tableHtml += '<thead><tr style="background:#0f172a; color:#ffffff;">';
        for (const h of headers) {
          tableHtml += `<th style="padding:10px 12px; text-align:left; font-weight:700; font-size:11.5px; letter-spacing:0.3px; border:1px solid #334155; color:#f8fafc;">${parseInlineHtml(
            escapeHtml(h)
          )}</th>`;
        }
        tableHtml += '</tr></thead>';

        // Table Body
        tableHtml += '<tbody>';
        for (let rIdx = 0; rIdx < rows.length; rIdx++) {
          const row = rows[rIdx];
          const bg = rIdx % 2 === 1 ? 'background-color:#f8fafc;' : 'background-color:#ffffff;';
          tableHtml += `<tr style="${bg}">`;
          for (let cIdx = 0; cIdx < headers.length; cIdx++) {
            const cell = row[cIdx] || '';
            tableHtml += `<td style="padding:9px 12px; border:1px solid #e2e8f0; color:#334155; vertical-align:top;">${parseInlineHtml(
              escapeHtml(cell)
            )}</td>`;
          }
          tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table></div>';

        htmlParts.push(tableHtml);
        continue;
      }
    }

    // Bullet list: *, -, +, •
    const bulletMatch = line.match(/^(\*|-|\+|•)\s+(.*)$/);
    if (bulletMatch) {
      let listHtml = '<ul style="padding-left:22px; margin:10px 0;">';
      while (i < lines.length) {
        const curr = lines[i].trim();
        const currMatch = curr.match(/^(\*|-|\+|•)\s+(.*)$/);
        if (currMatch) {
          listHtml += `<li style="margin-bottom:6px; color:#334155; line-height:1.6;">${parseInlineHtml(
            escapeHtml(currMatch[2].trim())
          )}</li>`;
          i++;
        } else if (curr && !curr.startsWith('#') && !curr.includes('|')) {
          listHtml += ` ${parseInlineHtml(escapeHtml(curr))}`;
          i++;
        } else {
          break;
        }
      }
      listHtml += '</ul>';
      htmlParts.push(listHtml);
      continue;
    }

    // Numbered list: 1., 2.
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      let listHtml = '<ol style="padding-left:22px; margin:10px 0;">';
      while (i < lines.length) {
        const curr = lines[i].trim();
        const currMatch = curr.match(/^(\d+)\.\s+(.*)$/);
        if (currMatch) {
          listHtml += `<li style="margin-bottom:6px; color:#334155; line-height:1.6;">${parseInlineHtml(
            escapeHtml(currMatch[2].trim())
          )}</li>`;
          i++;
        } else if (curr && !curr.startsWith('#') && !curr.includes('|')) {
          listHtml += ` ${parseInlineHtml(escapeHtml(curr))}`;
          i++;
        } else {
          break;
        }
      }
      listHtml += '</ol>';
      htmlParts.push(listHtml);
      continue;
    }

    // Paragraph
    let paraText = line;
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().match(/^(#{1,6}\s+|(\*|-|\+|•)\s+|\d+\.\s+|>|---|___|\*\*\*)/) &&
      !lines[i].trim().includes('|')
    ) {
      paraText += ' ' + lines[i].trim();
      i++;
    }
    htmlParts.push(
      `<p style="margin-bottom:12px; line-height:1.6; color:#334155;">${parseInlineHtml(
        escapeHtml(paraText)
      )}</p>`
    );
  }

  return htmlParts.join('\n');
}

export async function exportPlanToPdf(title: string, content: string, subtitle?: string) {
  try {
    const logoUri = await getLogoUri();
    const formattedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(title)}</title>
        <style>
          @page {
            margin: 20mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            margin: 0;
            padding: 24px;
            font-size: 13.5px;
            line-height: 1.6;
          }
          .header {
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 16px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .brand-container {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .brand-logo {
            width: 56px;
            height: 56px;
            border-radius: 12px;
            object-fit: cover;
            border: 1px solid #e2e8f0;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
          }
          .brand-text {
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .brand {
            font-size: 22px;
            font-weight: 800;
            color: #2563eb;
            letter-spacing: -0.5px;
            line-height: 1.2;
          }
          .badge {
            display: inline-block;
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid #bfdbfe;
            margin-top: 4px;
            align-self: flex-start;
          }
          .tagline {
            font-size: 11.5px;
            color: #64748b;
            margin-top: 3px;
          }
          .meta-info {
            font-size: 11px;
            color: #94a3b8;
            text-align: right;
            line-height: 1.5;
          }
          .doc-title {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .doc-subtitle {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 20px;
          }
          .content-card {
            background: #ffffff;
            border-radius: 8px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 14px;
            border-top: 1px solid #e2e8f0;
            font-size: 10.5px;
            color: #94a3b8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand-container">
            <img class="brand-logo" src="${logoUri}" alt="Hercules Gym Logo" />
            <div class="brand-text">
              <div class="brand">HERCULES GYM</div>
              <div class="badge">HG.AI INTELLIGENCE</div>
              <div class="tagline">Personal Fitness, Diet & Wellness Coach</div>
            </div>
          </div>
          <div class="meta-info">
            <div><strong>Document ID:</strong> HG-${Date.now().toString(36).toUpperCase()}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <div><strong>Platform:</strong> Official Member Plan</div>
          </div>
        </div>

        <div class="doc-title">${escapeHtml(title)}</div>
        ${subtitle ? `<div class="doc-subtitle">${escapeHtml(subtitle)}</div>` : ''}

        <div class="content-card">
          ${markdownToHtml(content)}
        </div>

        <div class="footer">
          Generated with HG.AI at Hercules Gym. This plan is designed for informational fitness and nutritional training. Consult your trainer at Hercules Gym for form checks and progression.
        </div>
      </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      await Print.printAsync({ html: formattedHtml });
      return;
    }

    const { uri } = await Print.printToFileAsync({ html: formattedHtml });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `${title.replace(/\s+/g, '_')}.pdf`,
      });
    } else {
      Alert.alert('PDF Ready', `PDF created successfully at: ${uri}`);
    }
  } catch (err: any) {
    console.log('Error generating PDF:', err);
    Alert.alert('PDF Export Error', 'Failed to generate PDF document.');
  }
}
