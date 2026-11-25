/* Huisstijl voor alle e-mails van Nuance (tabellen + inline stijl, zodat Gmail, Outlook en Apple Mail ze goed tonen). */
const SITE = 'https://www.nuance-therapie.be';
const C = { plum: '#3E2A35', deep: '#2B1622', accent: '#74425C', sand: '#D6C3B2', cream: '#F3EAE2', text: '#3E2A35', body: '#5A4450', mut: '#8A7380' };

function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

/* blocks: [{p:'tekst'}, {rows:[[label, waarde]]}, {quote:'tekst'}, {button:['label', url]}, {small:'tekst'}] */
function layout({ preheader = '', title, blocks = [], footerNote = '' }) {
  const serif = "Georgia,'Times New Roman',serif";
  const sans = "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
  const part = (b) => {
    if (b.p) return `<p style="margin:0 0 16px;font:400 16px/1.65 ${sans};color:${C.body}">${b.p}</p>`;
    if (b.rows) return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;background:${C.cream};border-left:3px solid ${C.accent}">`
      + b.rows.map(([k, v]) => `<tr><td style="padding:10px 16px;font:500 13px/1.4 ${sans};color:${C.mut};width:120px;vertical-align:top">${esc(k)}</td><td style="padding:10px 16px 10px 0;font:500 15px/1.5 ${sans};color:${C.text}">${v}</td></tr>`).join('')
      + `</table>`;
    if (b.quote) return `<p style="margin:0 0 20px;padding:14px 18px;background:${C.cream};font:italic 400 15px/1.7 ${serif};color:${C.text};white-space:pre-wrap">${b.quote}</p>`;
    if (b.button) return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="background:${C.accent}"><a href="${b.button[1]}" style="display:inline-block;padding:14px 26px;font:500 15px/1 ${sans};color:#F6EEE8;text-decoration:none">${esc(b.button[0])} &rarr;</a></td></tr></table>`;
    if (b.small) return `<p style="margin:0 0 12px;font:400 13px/1.6 ${sans};color:${C.mut}">${b.small}</p>`;
    return '';
  };
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${C.sand}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sand}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FBF6F1">
<tr><td style="background:${C.plum};padding:26px 32px" align="left"><img src="${SITE}/assets/logo-licht.png" width="120" alt="Nuance" style="display:block;width:120px;height:auto;border:0"></td></tr>
<tr><td style="padding:36px 32px 12px">
<h1 style="margin:0 0 20px;font:400 28px/1.2 ${serif};color:${C.text}">${title}</h1>
${blocks.map(part).join('\n')}
<p style="margin:24px 0 0;font:400 16px/1.6 ${sans};color:${C.body}">Warme groet,</p>
<p style="margin:4px 0 0;font:italic 400 18px/1.4 ${serif};color:${C.text}">Anne-Sophie Houwaer</p>
<p style="margin:2px 0 28px;font:400 13px/1.5 ${sans};color:${C.mut}">Psychosociaal begeleider &amp; coach · Nuance</p>
</td></tr>
<tr><td style="background:${C.cream};padding:20px 32px;font:400 12.5px/1.7 ${sans};color:${C.mut}">
Nuance · Wagenstraat 6, 3740 Bilzen-Hoeselt<br>
<a href="mailto:verbinding@nuance-therapie.be" style="color:${C.accent}">verbinding@nuance-therapie.be</a> · <a href="${SITE}" style="color:${C.accent}">nuance-therapie.be</a>
${footerNote ? `<br><span style="color:${C.mut}">${footerNote}</span>` : ''}
</td></tr>
</table></td></tr></table></body></html>`;
}

function text({ title, lines }) {
  return title + '\n\n' + lines.join('\n') + '\n\nWarme groet,\nAnne-Sophie Houwaer\nPsychosociaal begeleider & coach · Nuance\nWagenstraat 6, 3740 Bilzen-Hoeselt · verbinding@nuance-therapie.be';
}

module.exports = { layout, text, esc, C, SITE };
