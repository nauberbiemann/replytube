/**
 * ReplyTube -> Google Sheets (Banco de Temas, uma aba por canal)
 *
 * COMO INSTALAR (5 minutos, uma única vez):
 * 1. Crie uma planilha nova no Google Sheets (ex: "ReplyTube - Banco de Temas").
 * 2. Menu Extensões > Apps Script. Apague o conteúdo e cole ESTE arquivo inteiro.
 * 3. Troque o valor de SECRET abaixo por uma senha longa sua (a mesma vai na Vercel).
 * 4. Clique em Implantar > Nova implantação > tipo "App da Web":
 *      - Executar como: Eu
 *      - Quem pode acessar: Qualquer pessoa
 *    Autorize o acesso e copie a URL que termina em /exec.
 * 5. Na Vercel (Settings > Environment Variables) crie:
 *      GOOGLE_SHEETS_WEBHOOK_URL = URL /exec copiada
 *      GOOGLE_SHEETS_SECRET      = mesmo valor de SECRET
 *    e faça Redeploy.
 *
 * A URL fica só no servidor (nunca no navegador) e toda chamada exige o SECRET.
 */

const SECRET = 'TROQUE-POR-UMA-SENHA-LONGA';
const HEADERS = ['ID', 'Data', 'Tema Sugerido', 'Inscrito', 'Comentário Original', 'Vídeo de Origem', 'Status'];

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

    if (body.action === 'list') {
      const all = [];
      ss.getSheets().forEach(function (sh) {
        const values = sh.getDataRange().getValues();
        if (values.length < 2 || values[0][0] !== 'ID') return;
        for (var i = 1; i < values.length; i++) {
          const r = values[i];
          if (!r[0]) continue;
          all.push({
            id: String(r[0]),
            createdAt: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
            topicTitle: String(r[2]),
            nickname: String(r[3]),
            commentText: String(r[4]),
            sourceVideoTitle: String(r[5]),
            channelName: sh.getName(),
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
    sh.hideColumns(1);
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
  const row = [
    t.id,
    t.createdAt ? new Date(t.createdAt) : new Date(),
    t.topicTitle || '',
    t.nickname || '',
    t.commentText || '',
    t.sourceVideoTitle || '',
    'Ideia',
  ];
  const found = findRow_(ss, t.id);
  if (found) {
    // preserva a coluna Status que você editar manualmente na planilha
    found.sheet.getRange(found.row, 1, 1, HEADERS.length - 1).setValues([row.slice(0, HEADERS.length - 1)]);
  } else {
    sheetFor_(ss, t.channelName).appendRow(row);
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
