'use strict';
/* ---------------------------------------------------------------- กราฟ */
const CD = {responsive:true, maintainAspectRatio:false,
  layout:{padding:{top:18}},
  plugins:{legend:{position:'bottom', labels:{boxWidth:12, padding:14, font:{size:12, family:"'IBM Plex Sans Thai'"}}}}};

// ปลั๊กอินเขียนตัวเลขกำกับบนแท่งและบนจุด ตามที่ลูกค้าขอ
// จัดตำแหน่งไม่ให้ตัวเลขทับกันเองเมื่ออยู่เดือนเดียวกัน และมีขอบขาวรองไม่ให้จมไปกับเส้น
const valueLabels = {
  id:'valueLabels',
  afterDatasetsDraw(chart, args, opts){
    const ctx = chart.ctx;
    const fmt = (opts && opts.fmt) ? opts.fmt : (v => v);
    const area = chart.chartArea;
    const GAP = 15;   // ระยะห่างขั้นต่ำระหว่างตัวเลขสองตัว
    const LIFT = 11;  // ระยะยกตัวเลขขึ้นเหนือจุด

    // รวบรวมจุดที่ต้องเขียนตัวเลขทั้งหมดก่อน
    const items = [];
    chart.data.datasets.forEach((ds, i) => {
      const meta = chart.getDatasetMeta(i);
      if(meta.hidden) return;
      meta.data.forEach((el, j) => {
        const v = ds.data[j];
        if(v == null || v === 0) return;
        items.push({x: el.x, y: el.y, text: String(fmt(v))});
      });
    });

    // จัดกลุ่มตามตำแหน่งแนวนอน แล้วไล่วางจากบนลงล่างไม่ให้ซ้อนกัน
    const groups = {};
    items.forEach(it => {
      const key = Math.round(it.x / 6);
      (groups[key] = groups[key] || []).push(it);
    });
    Object.keys(groups).forEach(key => {
      const g = groups[key].sort((a, b) => a.y - b.y);
      let lastY = -Infinity;
      g.forEach(it => {
        let ty = it.y - LIFT;
        if(ty - lastY < GAP) ty = lastY + GAP;          // ดันลงมาให้พ้นตัวบน
        if(area && ty < area.top + 10) ty = area.top + 10;  // ไม่ให้ล้นขอบบน
        it.ty = ty;
        lastY = ty;
      });
    });

    ctx.save();
    ctx.font = '600 10px "IBM Plex Sans Thai", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    items.forEach(it => {
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(255,255,255,.95)';
      ctx.strokeText(it.text, it.x, it.ty);   // ขอบขาวรองให้อ่านออกแม้ทับเส้น
      ctx.fillStyle = '#1e293b';
      ctx.fillText(it.text, it.x, it.ty);
    });
    ctx.restore();
  }
};

const chartCompare = new Chart($('chartCompare'), {
  type:'bar', data:{labels:[],datasets:[
    {label:'มูลค่าที่คาดว่าจะขายได้', data:[], backgroundColor:'#3b82f6', borderRadius:6, barPercentage:.65},
    {label:'ยอดขายจริง', data:[], backgroundColor:'#10b981', borderRadius:6, barPercentage:.65}]},
  options:{...CD, plugins:{...CD.plugins, valueLabels:{fmt:v=>v.toFixed(2)}},
    scales:{y:{beginAtZero:true, ticks:{callback:v=>v+' ลบ.', font:{size:11}}, grid:{color:'#f1f5f9'}},
            x:{grid:{display:false}, ticks:{font:{size:12}}}}},
  plugins:[valueLabels]
});

const chartLead = new Chart($('chartLead'), {
  type:'bar', data:{labels:[],datasets:[
    {type:'bar', label:'จำนวน Lead', data:[], backgroundColor:'#93c5fd', borderRadius:6, yAxisID:'y', barPercentage:.55},
    {type:'line', label:'อัตราผ่านคุณสมบัติ (%)', data:[], borderColor:'#f97316', backgroundColor:'#f97316',
     tension:.35, yAxisID:'y1', pointRadius:5, borderWidth:2.5}]},
  options:{...CD, scales:{
    y:{beginAtZero:true, position:'left', grid:{color:'#f1f5f9'}, title:{display:true,text:'จำนวน Lead',font:{size:11}}},
    y1:{beginAtZero:true, position:'right', max:100, ticks:{callback:v=>v+'%'}, grid:{display:false}},
    x:{grid:{display:false}}}}
});

const chartAds = new Chart($('chartAds'), {
  type:'bar', data:{labels:[],datasets:[
    {label:'งบโฆษณา (พันบาท)', data:[], backgroundColor:'#fbbf24', borderRadius:6, yAxisID:'y', barPercentage:.5},
    {type:'line', label:'ต้นทุนต่อ Lead (บาท)', data:[], borderColor:'#8b5cf6', backgroundColor:'#8b5cf6',
     tension:.35, yAxisID:'y1', pointRadius:5, borderWidth:2.5}]},
  options:{...CD, scales:{
    y:{beginAtZero:true, position:'left', grid:{color:'#f1f5f9'}, title:{display:true,text:'งบ (พันบาท)',font:{size:11}}},
    y1:{beginAtZero:true, position:'right', grid:{display:false}, title:{display:true,text:'CPL (บาท)',font:{size:11}}},
    x:{grid:{display:false}}}}
});

const chartRank = new Chart($('chartRank'), {
  type:'line', data:{labels:[],datasets:[]},
  options:{...CD, plugins:{...CD.plugins, valueLabels:{fmt:v=>v.toLocaleString('en-US')}},
    scales:{y:{beginAtZero:true, ticks:{callback:v=>(v/1000).toLocaleString('en-US')+'k'}, grid:{color:'#f1f5f9'},
                title:{display:true,text:'ยอดขาย (บาท)',font:{size:11}}},
            x:{grid:{display:false}}}},
  plugins:[valueLabels]
});
