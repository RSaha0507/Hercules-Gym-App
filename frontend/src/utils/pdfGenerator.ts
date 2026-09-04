import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function markdownToHtml(md: string): string {
  let html = escapeHtml(md);

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 style="color:#1e293b; margin-top:18px; margin-bottom:6px; font-size:16px;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="color:#0f172a; margin-top:22px; margin-bottom:8px; font-size:18px; border-bottom:1px solid #f1f5f9; padding-bottom:4px;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="color:#0f172a; margin-top:24px; margin-bottom:10px; font-size:20px;">$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#0f172a;">$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Bullet items
  html = html.replace(/^\s*[-•*]\s+(.*$)/gim, '<li style="margin-bottom:6px; color:#334155;">$1</li>');
  html = html.replace(/(<li.*<\/li>)/gms, '<ul style="padding-left:22px; margin:10px 0;">$1</ul>');

  // Numbered items
  html = html.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li style="margin-bottom:6px; color:#334155;">$2</li>');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote style="border-left:4px solid #2563eb; background:#f8fafc; padding:8px 14px; margin:12px 0; color:#475569;">$1</blockquote>');

  // Paragraphs / line breaks
  html = html.replace(/\n\n/g, '</p><p style="margin-bottom:12px; line-height:1.6; color:#334155;">');
  html = html.replace(/\n/g, '<br/>');

  return `<p style="margin-bottom:12px; line-height:1.6; color:#334155;">${html}</p>`;
}

export async function exportPlanToPdf(title: string, content: string, subtitle?: string) {
  try {
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
            align-items: flex-start;
          }
          .brand {
            font-size: 22px;
            font-weight: 800;
            color: #2563eb;
            letter-spacing: -0.5px;
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
          }
          .tagline {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
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
          <div>
            <div class="brand">HERCULES GYM</div>
            <div class="badge">HG.AI INTELLIGENCE</div>
            <div class="tagline">Personal Fitness, Diet & Wellness Coach</div>
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
