'use strict';
/* ---------------------------------------------------------------- โหมดผู้พัฒนา
   เปิดใช้ด้วยการต่อ ?dev=1 ท้าย URL เท่านั้น ผู้ใช้ทั่วไปจะไม่เห็นส่วนนี้เลย
   ใช้นำเข้าข้อมูลจากไฟล์ .md เพื่อทดสอบ แทนการนั่งกรอกฟอร์มทีละช่อง */

const DEV_ON = /[?&]dev=1\b/.test(location.search) || location.hash === '#dev';

/* ---------------------------------------------------------------- ตัวแปลไฟล์ */

const MONTH_WORDS = {
  'มกราคม':'jan','กุมภาพันธ์':'feb','มีนาคม':'mar','เมษายน':'apr',
  'พฤษภาคม':'may','มิถุนายน':'jun','กรกฎาคม':'jul','สิงหาคม':'aug',
  'กันยายน':'sep','ตุลาคม':'oct','พฤศจิกายน':'nov','ธันวาคม':'dec',
  'ม.ค.':'jan','ก.พ.':'feb','มี.ค.':'mar','เม.ย.':'apr','พ.ค.':'may','มิ.ย.':'jun',
  'ก.ค.':'jul','ส.ค.':'aug','ก.ย.':'sep','ต.ค.':'oct','พ.ย.':'nov','ธ.ค.':'dec'
};

// ชื่อหัวคอลัมน์ที่รับได้ → ชื่อฟิลด์ในระบบ
const FIELD_ALIASES = [
  [/เดือนที่ปิด|^เดือน/, 'month'],
  [/ช่องทาง/, 'channel'],
  [/^lead|intake|ได้รับ/i, 'intake'],
  [/ไม่ตรงคุณสมบัติ/, 'reject'],
  [/ผ่านคุณสมบัติ/, 'qualify'],
  [/ติดตาม|follow/i, 'follow'],
  [/เสนอราคา|conversion/i, 'quote'],
  [/ปิดการขาย|จำนวนดีล/, 'close'],
  [/คาดขาย|คาดว่าจะขาย/, 'pipeline'],
  [/งบ\s*ads|งบประมาณ\s*ads/i, 'ads'],
  [/พนักงานขาย|^sales?$/i, 'person'],
  [/ทีม/, 'team'],
  [/กลุ่มงาน/, 'group'],
  [/ยอดขาย/, 'revenue'],
  [/ลูกค้า\s*\/\s*โครงการ/, 'customer'],
  [/ชื่อลูกค้า/, 'customer'],
  [/บริษัท|รายละเอียดงาน/, 'company'],
  [/project\s*no/i, 'projectNo'],
  [/ชื่อโครงการ/, 'name'],
  [/ประมาณการมูลค่างาน|^มูลค่า/, 'value'],
  [/งบประมาณ/, 'budget'],
  [/impression|การมองเห็น/i, 'impr'],
  [/reach|เข้าถึง/i, 'reach'],
  [/^cpm/i, 'cpm'],
  [/^cpc/i, 'cpc'],
  [/^ctr/i, 'ctr'],
  [/cost\s*(per\s*message|\/\s*msg)/i, 'cpmsg']
];

const NUM_FIELDS = ['intake','reject','qualify','follow','quote','close','pipeline','ads',
                    'revenue','value','budget','impr','reach','cpm','cpc','ctr','cpmsg'];

function cleanCell(s){
  return String(s || '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\*เลือก\*/g, '')
    .replace(/^\s*[-–—]\s*เว้นว่าง\s*[-–—]\s*$/, '')
    .trim();
}

function toField(header){
  const h = cleanCell(header);
  for(const [re, key] of FIELD_ALIASES) if(re.test(h)) return key;
  return null;
}

function toNumber(v){
  const s = String(v).replace(/[,\s]/g, '');
  if(s === '' || s === '—' || s === '-') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function toMonth(v){
  const s = cleanCell(v);
  if(!s || /ไม่ระบุ/.test(s)) return '';
  for(const word in MONTH_WORDS) if(s.indexOf(word) >= 0) return MONTH_WORDS[word];
  const hit = MONTHS.find(m => m.k === s.toLowerCase());
  return hit ? hit.k : '';
}

function toChannel(v){
  const s = cleanCell(v).toLowerCase();
  if(s.indexOf('line') >= 0) return 'line';
  if(s.indexOf('face') >= 0 || s === 'fb') return 'fb';
  return 'fb';
}

// เดาว่าตารางนี้เป็นข้อมูลชุดไหน จากฟิลด์ที่มีอยู่
function classify(rec){
  if(rec.projectNo != null) return 'win';
  if(rec.impr != null || rec.cpmsg != null || (rec.budget != null && rec.intake == null)) return 'ads';
  if(rec.revenue != null && rec.person != null) return 'sales';
  if(rec.value != null && rec.customer != null) return 'pipeline';
  if(rec.intake != null) return 'mkt';
  return null;
}

// อ่านตาราง markdown ทุกตารางในไฟล์ รองรับทั้งแบบแนวนอนและแบบทีละช่อง
function parseMarkdown(text){
  const out = {mkt:[], sales:[], pipeline:[], win:[], ads:[]};
  const warn = [];
  const lines = text.split(/\r?\n/);
  const isRow = l => l.trim().startsWith('|');
  const cells = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
  const isSep = l => /^[\s|:\-]+$/.test(l) && l.indexOf('-') >= 0;

  let i = 0;
  while(i < lines.length){
    if(!isRow(lines[i])){ i++; continue; }

    const head = cells(lines[i]).map(cleanCell);
    if(!isRow(lines[i+1] || '') || !isSep(lines[i+1])){ i++; continue; }

    const body = [];
    let j = i + 2;
    while(j < lines.length && isRow(lines[j])){ body.push(cells(lines[j])); j++; }
    i = j;

    // รูปแบบทีละช่องต้องมีหัวตารางครบทั้งสองคอลัมน์ ตารางตรวจผลท้ายไฟล์จะได้ไม่ถูกอ่านเป็นข้อมูล
    const vertical = head.length === 2 && /ช่องบนฟอร์ม/.test(head[0]) && /ค่าที่กรอก/.test(head[1]);

    const rawRecords = [];
    if(vertical){
      const rec = {};
      body.forEach(row => {
        const key = toField(row[0]);
        if(key) rec[key] = cleanCell(row[1]);
      });
      rawRecords.push(rec);
    } else {
      const keys = head.map(toField);
      if(!keys.some(Boolean)) continue;
      body.forEach(row => {
        const rec = {};
        keys.forEach((k, idx) => { if(k) rec[k] = cleanCell(row[idx]); });
        rawRecords.push(rec);
      });
    }

    rawRecords.forEach(raw => {
      const rec = {};
      Object.keys(raw).forEach(k => {
        const v = raw[k];
        if(v === '') return;
        if(k === 'month')        rec.month = toMonth(v);
        else if(k === 'channel') rec.channel = toChannel(v);
        else if(NUM_FIELDS.indexOf(k) >= 0){ const n = toNumber(v); if(n !== null) rec[k] = n; }
        else rec[k] = v;
      });

      const set = classify(rec);
      if(!set){ return; }

      // เติมค่าที่ระบบต้องมีให้ครบ
      if(set === 'mkt'){
        if(!rec.month) return warn.push('ข้ามระเบียน MKT ที่ไม่มีเดือน');
        if(!rec.channel) rec.channel = 'fb';
        ['reject','qualify','follow','quote','close','pipeline'].forEach(k => { if(rec[k] == null) rec[k] = 0; });
        if(rec.ads === undefined) rec.ads = null;
      }
      if(set === 'sales'){
        if(!rec.person || rec.revenue == null) return warn.push('ข้ามรายการยอดขายที่ไม่มีชื่อพนักงานหรือยอด');
        if(!rec.group) rec.group = 'Retail';
        if(!rec.channel) rec.channel = 'fb';
        rec.team = rec.team || '';
        rec.customer = rec.customer || '';
      }
      if(set === 'pipeline'){
        if(!rec.customer || rec.value == null) return warn.push('ข้ามยอดประมาณการที่ไม่มีลูกค้าหรือมูลค่า');
        if(!rec.channel) rec.channel = 'fb';
        rec.team = rec.team || ''; rec.company = rec.company || '';
        rec.sale = rec.sale || rec.person || '';
        delete rec.person;
      }
      if(set === 'win'){
        rec.sale = rec.sale || rec.person || '';
        delete rec.person;
        if(rec.value == null) return warn.push('ข้ามโครงการ WIN ที่ไม่มีมูลค่า');
        rec.name = rec.name || '';
        rec.month = rec.month || '';
      }
      if(set === 'ads'){
        if(!rec.month) return warn.push('ข้ามระเบียน Ads ที่ไม่มีเดือน');
      }

      rec.id = nid();
      out[set].push(rec);
    });
  }

  return {data: out, warn};
}

/* ---------------------------------------------------------------- นำเข้า */

function importMarkdown(text, sourceName){
  const {data, warn} = parseMarkdown(text);
  const total = ['mkt','sales','pipeline','win','ads'].reduce((a,k) => a + data[k].length, 0);

  if(!total){
    devLog('ไม่พบข้อมูลที่อ่านได้ในไฟล์นี้ ตรวจว่าเป็นตาราง markdown ที่มีหัวคอลัมน์ภาษาไทยตามรูปแบบตัวอย่าง', true);
    return;
  }

  const asNew = document.querySelector('input[name="dev-target"]:checked').value === 'new';
  if(asNew){
    const title = (text.match(/^#\s+(.+)$/m) || [])[1] || sourceName || 'นำเข้าจากไฟล์';
    const rep = addReport(title.replace(/—.*$/, '').trim(), data);
    openReport(rep.id);
  } else {
    ['mkt','sales','pipeline','win','ads'].forEach(k => { STATE[k] = STATE[k].concat(data[k]); });
    render();
  }
  markDirty();

  const lines = [
    `นำเข้าสำเร็จ ${total} ระเบียน` + (asNew ? ' เป็นรายงานใหม่' : ' ต่อท้ายรายงานปัจจุบัน'),
    `• สรุป MKT ${data.mkt.length} · ยอดขาย ${data.sales.length} · ยอดประมาณการ ${data.pipeline.length} · WIN ${data.win.length} · Ads ${data.ads.length}`
  ];
  if(warn.length) lines.push('• ข้อสังเกต: ' + [...new Set(warn)].join(' / '));
  devLog(lines.join('\n'));
  toast(`นำเข้า ${total} ระเบียนเรียบร้อย`);
  switchTab('dashboard');
}

/* ---------------------------------------------------------------- ส่งออก */

function reportToMarkdown(rep){
  const L = [];
  const mLab = k => (MONTHS.find(m => m.k === k) || {}).f || '';
  const cLab = c => c === 'line' ? 'Line OA' : 'Facebook';
  const table = (head, rows) => {
    L.push('| ' + head.join(' | ') + ' |');
    L.push('|' + head.map(() => '---').join('|') + '|');
    rows.forEach(r => L.push('| ' + r.join(' | ') + ' |'));
    L.push('');
  };
  const n = v => (v == null ? '' : v);

  L.push('# ' + rep.name, '');
  if(rep.data.mkt.length){
    L.push('## แท็บ 1 — สรุป MKT', '');
    table(['เดือน','ช่องทาง','Lead','ไม่ตรงคุณสมบัติ','ผ่านคุณสมบัติ','ติดตาม','เสนอราคา','ปิดการขาย','มูลค่าคาดขาย','งบ ADS'],
      rep.data.mkt.map(r => [mLab(r.month), cLab(r.channel), n(r.intake), n(r.reject), n(r.qualify), n(r.follow), n(r.quote), n(r.close), n(r.pipeline), n(r.ads)]));
  }
  if(rep.data.sales.length){
    L.push('## แท็บ 2 — ยอดขาย', '');
    table(['เดือน','พนักงานขาย','ทีม','กลุ่มงาน','ช่องทาง','ลูกค้า / โครงการ','ยอดขาย'],
      rep.data.sales.map(r => [mLab(r.month), r.person, r.team, r.group, cLab(r.channel), r.customer, n(r.revenue)]));
  }
  if(rep.data.pipeline.length){
    L.push('## แท็บ 3 — ยอดประมาณการ', '');
    table(['เดือน','ทีม','พนักงานขาย','ช่องทาง','ชื่อลูกค้า','บริษัท / รายละเอียดงาน','มูลค่า'],
      rep.data.pipeline.map(r => [mLab(r.month), r.team, r.sale, cLab(r.channel), r.customer, r.company, n(r.value)]));
  }
  if(rep.data.win.length){
    L.push('## แท็บ 4 — WIN 100%', '');
    table(['เดือนที่ปิด','พนักงานขาย','Project No.','มูลค่า','ชื่อโครงการ'],
      rep.data.win.map(r => [mLab(r.month), r.sale, r.projectNo, n(r.value), r.name]));
  }
  if(rep.data.ads.length){
    L.push('## แท็บ 5 — Ads Metrics', '');
    table(['เดือน','งบประมาณ','Impressions','Reach','CPM','CPC','CTR','Cost/Msg'],
      rep.data.ads.map(r => [mLab(r.month), n(r.budget), n(r.impr), n(r.reach), n(r.cpm), n(r.cpc), n(r.ctr), n(r.cpmsg)]));
  }
  return L.join('\n');
}

function exportCurrentReport(){
  const rep = currentReport();
  if(!rep) return;
  syncReport();
  const blob = new Blob([reportToMarkdown(rep)], {type:'text/markdown;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = rep.name.replace(/[\\/:*?"<>|]/g, '') + '.md';
  a.click();
  URL.revokeObjectURL(a.href);
  devLog('ส่งออกรายงานเป็นไฟล์ .md แล้ว ไฟล์นี้นำเข้ากลับได้ทันที');
}

/* ---------------------------------------------------------------- หน้าจอ */

function devLog(msg, isError){
  const el = $('dev-log');
  el.hidden = false;
  el.className = 'dev-log' + (isError ? ' err' : '');
  el.textContent = msg;
}

function readFileAsText(file){
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error('อ่านไฟล์ไม่สำเร็จ'));
    r.readAsText(file, 'utf-8');
  });
}

async function handleDevFiles(files){
  if(!files || !files.length) return;
  const file = files[0];
  if(!/\.(md|markdown|txt)$/i.test(file.name)){
    devLog('รับเฉพาะไฟล์ .md .markdown หรือ .txt เท่านั้น', true);
    return;
  }
  try {
    importMarkdown(await readFileAsText(file), file.name.replace(/\.[^.]+$/, ''));
  } catch(err){
    devLog(String(err.message || err), true);
  }
}

(function initDevTools(){
  if(!DEV_ON) return;
  $('dev-panel').hidden = false;
  $('dev-badge').hidden = false;

  const drop = $('dev-drop');
  $('dev-file').addEventListener('change', e => handleDevFiles(e.target.files));
  drop.addEventListener('click', () => $('dev-file').click());
  ['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.classList.add('over');
  }));
  ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.classList.remove('over');
  }));
  drop.addEventListener('drop', e => handleDevFiles(e.dataTransfer.files));
  $('dev-export').addEventListener('click', exportCurrentReport);
})();
