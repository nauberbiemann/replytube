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
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
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

    if (body.action === 'radarUpsert') {
      return json_({ ok: true, count: radarUpsert_(ss, body.items || []) });
    }

    if (body.action === 'radarList') {
      return json_({ ok: true, items: radarList_(ss) });
    }

    if (body.action === 'queueUpsert') {
      queueUpsert_(ss, body.items || []);
      return json_({ ok: true });
    }

    if (body.action === 'queueDelete') {
      queueDelete_(ss, body.id);
      return json_({ ok: true });
    }

    if (body.action === 'queueList') {
      return json_({ ok: true, items: queueList_(ss) });
    }

    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
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

// ======================= RADAR DE TÍTULOS (OUTLIERS) =======================
// Abas "Radar Títulos" (cache dos vídeos outliers) e "Fila de Títulos" (títulos salvos).
// A 1ª coluna NÃO se chama "ID", por isso essas abas nunca entram no Banco de Temas.

const RADAR_SHEET = 'Radar Títulos';
const RADAR_HEADERS = [
  'VideoID', 'Nicho', 'Título Original (EN)', 'Fórmula PT-BR', 'Gatilho', 'Por que funciona',
  'Canal', 'ChannelID', 'Inscritos', 'Views', 'Views/Dia', 'Outlier (x)', 'Publicado em',
  'Duração (s)', 'Thumbnail', 'Sincronizado em',
];
const QUEUE_SHEET = 'Fila de Títulos';
const QUEUE_HEADERS = [
  'QID', 'Salvo em', 'Título', 'Status', 'Assunto', 'Tom', 'Ângulo',
  'Título Original (EN)', 'VideoID', 'Canal',
];

function ensureSheet_(ss, name, headers, widths) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#bae6fd');
    sh.setFrozenRows(1);
    sh.hideColumns(1);
    (widths || []).forEach(function (w) { sh.setColumnWidth(w[0], w[1]); });
  }
  return sh;
}

function toIso_(v) {
  return v instanceof Date ? v.toISOString() : String(v || '');
}

function readRows_(sh, width) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, width).getValues().filter(function (r) { return r[0]; });
}

function writeRows_(sh, width, rows) {
  var last = sh.getLastRow();
  if (last >= 2) sh.getRange(2, 1, last - 1, width).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, width).setValues(rows);
}

function radarUpsert_(ss, items) {
  var W = RADAR_HEADERS.length;
  var sh = ensureSheet_(ss, RADAR_SHEET, RADAR_HEADERS, [[3, 380], [4, 380], [6, 360]]);
  var map = {};
  readRows_(sh, W).forEach(function (r) { map[String(r[0])] = r; });
  items.forEach(function (v) {
    if (!v || !v.id) return;
    var prev = map[String(v.id)] || [];
    map[String(v.id)] = [
      String(v.id), v.niche || prev[1] || '', v.title || prev[2] || '',
      v.skeleton || prev[3] || '', v.trigger || prev[4] || '', v.hook || prev[5] || '',
      v.channelTitle || prev[6] || '', v.channelId || prev[7] || '',
      Number(v.subscribers || prev[8] || 0), Number(v.views || prev[9] || 0),
      Number(v.viewsPerDay || prev[10] || 0), Number(v.outlier || prev[11] || 0),
      v.publishedAt || toIso_(prev[12]), Number(v.durationSec || prev[13] || 0),
      v.thumbnailUrl || prev[14] || '', v.syncedAt || toIso_(prev[15]) || new Date().toISOString(),
    ];
  });
  var cutoff = Date.now() - 45 * 86400000;
  var rows = Object.keys(map).map(function (k) { return map[k]; }).filter(function (r) {
    var t = new Date(r[12]).getTime();
    return !t || t >= cutoff;
  });
  rows.sort(function (a, b) { return new Date(b[15]).getTime() - new Date(a[15]).getTime(); });
  rows = rows.slice(0, 800);
  writeRows_(sh, W, rows);
  return rows.length;
}

function radarList_(ss) {
  var sh = ss.getSheetByName(RADAR_SHEET);
  if (!sh) return [];
  return readRows_(sh, RADAR_HEADERS.length).map(function (r) {
    return {
      id: String(r[0]), niche: String(r[1]), title: String(r[2]), skeleton: String(r[3]),
      trigger: String(r[4]), hook: String(r[5]), channelTitle: String(r[6]), channelId: String(r[7]),
      subscribers: Number(r[8]) || 0, views: Number(r[9]) || 0, viewsPerDay: Number(r[10]) || 0,
      outlier: Number(r[11]) || 0, publishedAt: toIso_(r[12]), durationSec: Number(r[13]) || 0,
      thumbnailUrl: String(r[14]), syncedAt: toIso_(r[15]),
    };
  });
}

function queueUpsert_(ss, items) {
  var W = QUEUE_HEADERS.length;
  var sh = ensureSheet_(ss, QUEUE_SHEET, QUEUE_HEADERS, [[3, 420], [8, 380]]);
  var map = {};
  readRows_(sh, W).forEach(function (r) { map[String(r[0])] = r; });
  items.forEach(function (q) {
    if (!q || !q.id) return;
    map[String(q.id)] = [
      String(q.id), q.createdAt || new Date().toISOString(), q.title || '', q.status || 'Para Gravar',
      q.topic || '', q.tone || '', q.angle || '', q.originalTitle || '', q.videoId || '', q.channelTitle || '',
    ];
  });
  var rows = Object.keys(map).map(function (k) { return map[k]; });
  rows.sort(function (a, b) { return new Date(b[1]).getTime() - new Date(a[1]).getTime(); });
  writeRows_(sh, W, rows);
}

function queueDelete_(ss, id) {
  var sh = ss.getSheetByName(QUEUE_SHEET);
  if (!sh || !id) return;
  var W = QUEUE_HEADERS.length;
  var rows = readRows_(sh, W).filter(function (r) { return String(r[0]) !== String(id); });
  writeRows_(sh, W, rows);
}

function queueList_(ss) {
  var sh = ss.getSheetByName(QUEUE_SHEET);
  if (!sh) return [];
  return readRows_(sh, QUEUE_HEADERS.length).map(function (r) {
    return {
      id: String(r[0]), createdAt: toIso_(r[1]), title: String(r[2]), status: String(r[3] || 'Para Gravar'),
      topic: String(r[4]), tone: String(r[5]), angle: String(r[6]), originalTitle: String(r[7]),
      videoId: String(r[8]), channelTitle: String(r[9]),
    };
  });
}
