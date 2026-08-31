/**
 * ระบบหลังบ้านของแดชบอร์ด Online Marketing Performance (mkt Ecom)
 * เก็บข้อมูลไว้ใน Google Sheet ของลูกค้าเอง ไม่มีเซิร์ฟเวอร์ ไม่มีค่าใช้จ่าย และไม่หลับ
 *
 * วิธีติดตั้งอ่านได้ที่ DEPLOY.md
 */

/* ---------------------------------------------------------------- โครงสร้างแท็บ */

const TAB = {
  reports:  { name: 'Reports',  cols: ['id', 'name', 'created'] },
  mkt:      { name: 'MKT',      cols: ['id', 'report_id', 'month', 'channel', 'intake', 'reject', 'qualify', 'follow', 'quote', 'close', 'pipeline', 'ads'] },
  sales:    { name: 'Sales',    cols: ['id', 'report_id', 'month', 'person', 'team', 'group', 'channel', 'customer', 'revenue'] },
  pipeline: { name: 'Pipeline', cols: ['id', 'report_id', 'month', 'team', 'sale', 'customer', 'company', 'channel', 'value'] },
  win:      { name: 'Win',      cols: ['id', 'report_id', 'month', 'sale', 'projectNo', 'value', 'name'] },
  ads:      { name: 'Ads',      cols: ['id', 'report_id', 'month', 'budget', 'impr', 'reach', 'cpm', 'cpc', 'ctr', 'cpmsg'] }
};

const DATA_SETS = ['mkt', 'sales', 'pipeline', 'win', 'ads'];

// คอลัมน์ที่ต้องอ่านกลับเป็นตัวเลข ช่องว่างจะกลายเป็น null ไม่ใช่ 0
const NUM_COLS = {
  mkt:      ['intake', 'reject', 'qualify', 'follow', 'quote', 'close', 'pipeline', 'ads'],
  sales:    ['revenue'],
  pipeline: ['value'],
  win:      ['value'],
  ads:      ['budget', 'impr', 'reach', 'cpm', 'cpc', 'ctr', 'cpmsg']
};

const CACHE_KEY = 'dashboard_payload_v1';
const CACHE_SEC = 20;

/* ---------------------------------------------------------------- ตัวช่วย */

function ss() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function sheetFor(key) {
  const def = TAB[key];
  let sh = ss().getSheetByName(def.name);
  if (!sh) {
    sh = ss().insertSheet(def.name);
    sh.getRange(1, 1, 1, def.cols.length).setValues([def.cols])
      .setFontWeight('bold').setBackground('#e8f0fe');
    sh.setFrozenRows(1);
  }
  return sh;
}

// อ่านทุกแถวของแท็บออกมาเป็น object ตามชื่อคอลัมน์
function readRows(key) {
  const def = TAB[key];
  const sh = sheetFor(key);
  const last = sh.getLastRow();
  if (last < 2) return [];

  const values = sh.getRange(2, 1, last - 1, def.cols.length).getValues();
  const nums = NUM_COLS[key] || [];

  return values
    .filter(row => String(row[0]).trim() !== '')
    .map(row => {
      const obj = {};
      def.cols.forEach((col, i) => {
        let v = row[i];
        if (nums.indexOf(col) >= 0) {
          v = (v === '' || v === null) ? null : Number(v);
        } else if (v instanceof Date) {
          v = v.toISOString();
        } else {
          v = String(v);
        }
        obj[col] = v;
      });
      return obj;
    });
}

// เขียนทับทั้งแท็บด้วยข้อมูลชุดใหม่
function writeRows(key, rows) {
  const def = TAB[key];
  const sh = sheetFor(key);
  const last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, def.cols.length).clearContent();
  if (!rows.length) return;

  const matrix = rows.map(r => def.cols.map(c => (r[c] === undefined || r[c] === null) ? '' : r[c]));
  sh.getRange(2, 1, matrix.length, def.cols.length).setValues(matrix);
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkToken(token) {
  const saved = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  if (!saved) throw new Error('ยังไม่ได้สร้าง Token กรุณาใช้เมนู ระบบแดชบอร์ด > สร้าง Token ใหม่');
  if (String(token) !== saved) throw new Error('Token ไม่ถูกต้อง');
}

/* ---------------------------------------------------------------- อ่านข้อมูล */

function loadPayload() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get(CACHE_KEY);
  if (hit) return JSON.parse(hit);

  const reports = readRows('reports').map(r => ({
    id: r.id,
    name: r.name,
    created: r.created,
    data: { mkt: [], sales: [], pipeline: [], win: [], ads: [] }
  }));
  const byId = {};
  reports.forEach(r => { byId[r.id] = r; });

  DATA_SETS.forEach(set => {
    readRows(set).forEach(row => {
      const rep = byId[row.report_id];
      if (!rep) return;                      // แถวกำพร้า ข้ามไป
      const rec = {};
      Object.keys(row).forEach(k => { if (k !== 'report_id') rec[k] = row[k]; });
      rep.data[set].push(rec);
    });
  });

  const payload = { ok: true, reports: reports };
  cache.put(CACHE_KEY, JSON.stringify(payload), CACHE_SEC);
  return payload;
}

/* ---------------------------------------------------------------- เขียนข้อมูล */

// บันทึกรายงานหนึ่งชุดทั้งก้อน แถวเดิมของรายงานนี้จะถูกแทนที่ทั้งหมด
function saveReport(rep) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const meta = readRows('reports').filter(r => r.id !== rep.id);
    meta.push({ id: rep.id, name: rep.name, created: rep.created || new Date().toISOString() });
    writeRows('reports', meta);

    DATA_SETS.forEach(set => {
      const kept = readRows(set).filter(r => r.report_id !== rep.id);
      const incoming = (rep.data && rep.data[set]) ? rep.data[set] : [];
      incoming.forEach(rec => {
        const row = { report_id: rep.id };
        TAB[set].cols.forEach(c => { if (c !== 'report_id') row[c] = rec[c]; });
        kept.push(row);
      });
      writeRows(set, kept);
    });

    CacheService.getScriptCache().remove(CACHE_KEY);
    return { ok: true, id: rep.id };
  } finally {
    lock.releaseLock();
  }
}

function deleteReport(id) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    writeRows('reports', readRows('reports').filter(r => r.id !== id));
    DATA_SETS.forEach(set => {
      writeRows(set, readRows(set).filter(r => r.report_id !== id));
    });
    CacheService.getScriptCache().remove(CACHE_KEY);
    return { ok: true, id: id };
  } finally {
    lock.releaseLock();
  }
}

/* ---------------------------------------------------------------- ปลายทาง HTTP */

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    checkToken(p.token);
    return jsonOut(loadPayload());
  } catch (err) {
    return jsonOut({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    // ฝั่งเว็บส่งมาเป็น text/plain เพื่อเลี่ยง preflight ของ CORS
    const body = JSON.parse(e.postData.contents);
    checkToken(body.token);

    switch (body.action) {
      case 'saveReport':   return jsonOut(saveReport(body.report));
      case 'deleteReport': return jsonOut(deleteReport(body.id));
      case 'load':         return jsonOut(loadPayload());
      default: throw new Error('ไม่รู้จักคำสั่ง: ' + body.action);
    }
  } catch (err) {
    return jsonOut({ ok: false, error: String(err.message || err) });
  }
}

/* ---------------------------------------------------------------- เมนูติดตั้ง */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('ระบบแดชบอร์ด')
    .addItem('1. สร้างแท็บเก็บข้อมูล', 'setupSheets')
    .addItem('2. สร้าง Token ใหม่', 'generateToken')
    .addSeparator()
    .addItem('ดู Token ปัจจุบัน', 'showToken')
    .addToUi();
}

function setupSheets() {
  Object.keys(TAB).forEach(sheetFor);
  SpreadsheetApp.getUi().alert('สร้างแท็บเก็บข้อมูลครบแล้ว\n\n' +
    Object.keys(TAB).map(k => '• ' + TAB[k].name).join('\n') +
    '\n\nขั้นต่อไป: เมนู ระบบแดชบอร์ด > สร้าง Token ใหม่');
}

function generateToken() {
  const token = Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('API_TOKEN', token);
  SpreadsheetApp.getUi().alert('Token ใหม่ของคุณคือ\n\n' + token +
    '\n\nนำไปใส่ในไฟล์ assets/js/app-config.js ช่อง apiToken\nเก็บเป็นความลับ อย่าเผยแพร่');
}

function showToken() {
  const token = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  SpreadsheetApp.getUi().alert(token ? ('Token ปัจจุบัน\n\n' + token) : 'ยังไม่ได้สร้าง Token');
}
