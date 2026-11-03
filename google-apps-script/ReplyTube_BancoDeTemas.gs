/**
 * ReplyTube -> Google Sheets (Banco de Temas, uma aba por canal + aba "Minerações")
 *
 * COMO INSTALAR / ATUALIZAR:
 * 1. Na planilha: Extensões > Apps Script. Apague tudo (Ctrl+A, Delete) e cole ESTE arquivo inteiro.
 * 2. Confira a linha do SECRET (deve ser igual a GOOGLE_SHEETS_SECRET na Vercel).
 * 3. Salve (Ctrl+S).
 * 4. Primeira vez: Implantar > Nova implantação > App da Web (Executar como: Eu / Acesso: Qualquer pessoa).
 *    Atualização: Implantar > Gerenciar implantações > lápis > Versão: "Nova versão" > Implantar
 *    (a URL continua a mesma; nada muda na Vercel).
 *
 * Colunas das abas de canal (as novas ficam DEPOIS de Status para não bagunçar abas antigas):
 * A ID (oculta) | B Data | C Tema | D Inscrito/Fonte | E Comentário / Dor atendida | F Vídeo de Origem
 * G Status (edite à vontade, o app nunca sobrescreve) | H Origem | I Formato | J Potencial | K Gancho | L Link
 */

const SECRET = 'TROQUE-POR-UMA-SENHA-LONGA'; // mantenha a SUA senha aqui (a mesma da Vercel)
const HEADERS = [
  'ID', 'Data', 'Tema Sugerido', 'Inscrito / Fonte', 'Comentário Original / Dor atendida',
  'Vídeo de Origem', 'Status', 'Origem', 'Formato', 'Potencial', 'Gancho (0-15s)', 'Link de Referência',
];
const STATUS_COL = 7;
const MINING_SHEET = 'Minerações';
const MINING_HEADERS = ['ID', 'Data', 'Canal de Destino', 'Conteúdo Analisado', 'Sentimento & Insight', 'Interesse da Audiência (maior → menor)'];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) return json_({ ok: false, error: 'unauthorized' });

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (body.action === 'upsert') {
      (body.topics || []).forEach(function (t) { upsert_(ss, t); });
      return json_({ ok: true, count: (body.topics || []).length });
    }

    if (body.action === 'delete') {
      const found = findRow_(ss, body.id);
      if (found) found.sheet.deleteRow(found.row);
      return json_({ ok: true });
    }

    if (body.action === 'logMining') {
      logMining_(ss, body.mining || {});
      return json_({ ok: true });
    }

    if (body.action === 'list') {
      const all = [];
      ss.getSheets().forEach(function (sh) {
        if (sh.getName() === MINING_SHEET) return;
        const values = sh.getDataRange().getValues();
        if (values.length < 2 || values[0][0] !== 'ID') return;
        for (var i = 1; i < values.length; i++) {
          const r = values[i];
          if (!r[0]) continue;
          const isMina = String(r[7] || '').indexOf('Mina') !== -1;
          all.push({
            id: String(r[0]),
            createdAt: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
            topicTitle: String(r[2]),
            nickname: String(r[3]),
            commentText: String(r[4]),
            sourceVideoTitle: String(r[5]),
            channelName: sh.getName(),
            origin: isMina ? 'mina' : 'comentario',
            format: String(r[8] || ''),
            potential: String(r[9] || ''),
            hook: String(r[10] || ''),
            referenceUrl: String(r[11] || ''),
          });
        }
      });
      return json_({ ok: true, topics: all });
    }

    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function ensureHeaders_(sh, headers) {
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const current = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  if (current.length < headers.length || current[headers.length - 1] !== headers[headers.length - 1]) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#fde68a');
  }
}

function sheetFor_(ss, channelName) {
  const name = String(channelName || 'Geral').replace(/[\[\]\*\?\/\\:]/g, '').slice(0, 90) || 'Geral';
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#fde68a');
    sh.setColumnWidth(3, 380);
    sh.setColumnWidth(5, 420);
    sh.setColumnWidth(11, 320);
    sh.hideColumns(1);
  } else {
    ensureHeaders_(sh, HEADERS);
  }
  return sh;
}

function findRow_(ss, id) {
  const sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    const sh = sheets[s];
    const last = sh.getLastRow();
    if (last < 2) continue;
    const ids = sh.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) return { sheet: sh, row: i + 2 };
    }
  }
  return null;
}

function upsert_(ss, t) {
  const isMina = t.origin === 'mina';
  const first = [
    t.id,
    t.createdAt ? new Date(t.createdAt) : new Date(),
    t.topicTitle || '',
    t.nickname || '',
    t.commentText || '',
    t.sourceVideoTitle || '',
  ];
  const extra = [
    isMina ? '💎 Mina' : '💬 Comentário',
    t.format || '',
    t.potential ? String(t.potential).toUpperCase() : '',
    t.hook || '',
    t.referenceUrl || '',
  ];
  const found = findRow_(ss, t.id);
  if (found) {
    ensureHeaders_(found.sheet, HEADERS);
    // Status (coluna G) é preservado
    found.sheet.getRange(found.row, 1, 1, first.length).setValues([first]);
    found.sheet.getRange(found.row, STATUS_COL + 1, 1, extra.length).setValues([extra]);
  } else {
    const sh = sheetFor_(ss, t.channelName);
    sh.appendRow(first.concat(['Ideia']).concat(extra));
    if (isMina) sh.getRange(sh.getLastRow(), 1, 1, HEADERS.length).setBackground('#f3e8ff');
  }
}

function logMining_(ss, m) {
  let sh = ss.getSheetByName(MINING_SHEET);
  if (!sh) {
    sh = ss.insertSheet(MINING_SHEET);
    sh.appendRow(MINING_HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, MINING_HEADERS.length).setFontWeight('bold').setBackground('#e9d5ff');
    sh.setColumnWidth(4, 320);
    sh.setColumnWidth(5, 380);
    sh.setColumnWidth(6, 460);
    sh.hideColumns(1);
  }
  const row = [
    m.id,
    m.analyzedAt ? new Date(m.analyzedAt) : new Date(),
    m.channelName || '',
    m.analyzedLabel || '',
    m.insight || '',
    m.interestRanking || '',
  ];
  const last = sh.getLastRow();
  if (last >= 2) {
    const ids = sh.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(m.id)) {
        sh.getRange(i + 2, 1, 1, row.length).setValues([row]);
        return;
      }
    }
  }
  sh.appendRow(row);
  const r = sh.getLastRow();
  sh.getRange(r, 1, 1, row.length).setWrap(true).setVerticalAlignment('top');
  if (m.url) {
    sh.getRange(r, 4).setFormula('=HYPERLINK("' + String(m.url).replace(/"/g, '') + '","' + String(m.analyzedLabel || 'Abrir').replace(/"/g, "'") + '")');
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
