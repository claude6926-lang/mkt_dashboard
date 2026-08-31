'use strict';
/* ข้อมูลตั้งต้น คัดลอกตรงจากไฟล์ Report MKT online (25/8/2026) ไม่มีการแก้ไขที่ต้นทาง */

// ข้อมูลตั้งต้นของรายงานชุดแรก เรียกใหม่ทุกครั้งที่ต้องการสำเนาสดของข้อมูลชีท
function seedData(){ return {
  // ชีท Facebook / Line — มูลค่าเดือน ส.ค. แยกช่องทางตามรายการจริงในชีทยอดประมาณการ (2.42 ลบ. + 6.25 ลบ. = 8.67 ลบ.)
  mkt: [
    {id:nid(), month:'may', channel:'fb',   intake:94,  reject:56, qualify:38, follow:18, quote:10, close:0, pipeline:6258349, ads:16600},
    {id:nid(), month:'jun', channel:'fb',   intake:32,  reject:11, qualify:21, follow:11, quote:5,  close:1, pipeline:783000,  ads:17000},
    {id:nid(), month:'jul', channel:'fb',   intake:140, reject:85, qualify:55, follow:35, quote:10, close:2, pipeline:1215500, ads:38700},
    {id:nid(), month:'aug', channel:'fb',   intake:119, reject:81, qualify:38, follow:20, quote:9,  close:1, pipeline:2420000, ads:null},
    {id:nid(), month:'aug', channel:'line', intake:5,   reject:0,  qualify:5,  follow:1,  quote:3,  close:0, pipeline:6250000, ads:null}
  ],

  // ชีท ยอดขาย + คอลัมน์ Project/Customer ตามภาพที่ลูกค้าส่งมา
  sales: [
    {id:nid(), month:'jun', person:'RT-Ole',    team:'RT',  group:'Retail',    channel:'fb',   customer:'', revenue:318094},
    {id:nid(), month:'jun', person:'RT-Ole',    team:'RT',  group:'Retail',    channel:'line', customer:'', revenue:142738},
    {id:nid(), month:'jul', person:'RT-Ole',    team:'RT',  group:'Retail',    channel:'fb',   customer:'', revenue:938749},
    {id:nid(), month:'jul', person:'PJ2-Champ', team:'PJ2', group:'Project 1', channel:'fb',   customer:'', revenue:417844},
    {id:nid(), month:'aug', person:'PJ2-Champ', team:'PJ2', group:'Project 1', channel:'fb',   customer:'', revenue:518580}
  ],

  // ชีท ยอดประมาณการ — ครบทุกแถว
  pipeline: [
    {id:nid(), month:'may', team:'PJ.1', sale:'Mind', customer:'Yinchaya Nit',            company:'โต๊ะประชุม แบบ 20 ที่นั่ง',                     channel:'fb', value:300000},
    {id:nid(), month:'may', team:'PJ.1', sale:'Ning', customer:'Nudnisha Promsuk',        company:'บริษัทแคร์ฟองต์ พรีเมี่ยมโฟน จ.นครปฐม',        channel:'fb', value:400000},
    {id:nid(), month:'may', team:'PJ.1', sale:'Mind', customer:'Tawat Ongsara',           company:'นายกเทศมนตรีนครตรัง',                          channel:'fb', value:500000},
    {id:nid(), month:'may', team:'PJ.1', sale:'Ou',   customer:'Panida WL',               company:'Well Link Interfreight Co., Ltd.',            channel:'fb', value:450000},
    {id:nid(), month:'may', team:'PJ.1', sale:'Com',  customer:'Ying Amm',                company:'สหกรณ์ออมทรัพย์ ชะอำ',                          channel:'fb', value:459000},
    {id:nid(), month:'may', team:'PJ.1', sale:'Com',  customer:'มัลลิญา สมบัตินันท์',        company:'บริษัทเอเคไทยลาวร่วมพัฒนากรุ๊ป จำกัด',           channel:'fb', value:2500000},
    {id:nid(), month:'may', team:'PJ.1', sale:'Mind', customer:'NoKnok RatCha',           company:'หจก. นวัตกรรมอุตสาหกรรม',                       channel:'fb', value:500000},
    {id:nid(), month:'may', team:'RT',   sale:'Ole',  customer:"PP's Chotima",            company:'โต๊ะประชุม / เข้าชมสินค้าโชว์รูม',                channel:'fb', value:142000},
    {id:nid(), month:'may', team:'RT',   sale:'Ole',  customer:'Janjira Dara',            company:'เข้าชมสินค้าโชว์รูม',                            channel:'fb', value:60000},
    {id:nid(), month:'may', team:'RT',   sale:'Ole',  customer:'Nitchakan Ouk',           company:'รร.ฝั่งแดงวิทยาสรรค์',                           channel:'fb', value:40000},

    {id:nid(), month:'jun', team:'RT',   sale:'Ole',  customer:'Kanitha Rujeyapanon',     company:'เก้าอี้หนัง CEO MID YEAR',                      channel:'fb', value:20000},
    {id:nid(), month:'jun', team:'RT',   sale:'Ole',  customer:'Ken Sutee',               company:'เก้าอี้ โต๊ะประชุม MID YEAR',                    channel:'fb', value:58000},
    {id:nid(), month:'jun', team:'RT',   sale:'Ole',  customer:'Sasiang Kiatchalermporn', company:'เก้าอี้ พนง. CEO MID YEAR',                     channel:'fb', value:5000},
    {id:nid(), month:'jun', team:'PJ.1', sale:'',     customer:'Fon Pattarawadee',        company:'ชุดโต๊ะเทรนนิ่ง ห้องประชุม สมุทรสาคร',            channel:'fb', value:700000},
    {id:nid(), month:'jun', team:'PJ.1', sale:'',     customer:'Sudawan Nonan',           company:'ออกแบบออฟฟิศ',                                  channel:'fb', value:200000},

    {id:nid(), month:'jul', team:'RT',   sale:'Ole',  customer:'Natthaphon Bumrungratchapakdee', company:'เก้าอี้ พนง. MID YEAR',                 channel:'fb', value:3900},
    {id:nid(), month:'jul', team:'RT',   sale:'Ole',  customer:'New Anothaihirun',        company:'เก้าอี้ โต๊ะ CEO MID YEAR',                     channel:'fb', value:20000},
    {id:nid(), month:'jul', team:'RT',   sale:'Ole',  customer:'Auto-Anapat Thanakitpathompong', company:'โครงการ office',                        channel:'fb', value:200000},
    {id:nid(), month:'jul', team:'RT',   sale:'Ole',  customer:'WG Thailand',             company:'เก้าอี้หนัง CEO MID YEAR',                      channel:'fb', value:8900},
    {id:nid(), month:'jul', team:'RT',   sale:'Ole',  customer:'Chettapun Uchupalanun',   company:'เก้าอี้หนัง CEO MID YEAR',                      channel:'fb', value:8900},
    {id:nid(), month:'jul', team:'RT',   sale:'Ole',  customer:'Chayapaul Nuntasukkasem', company:'เก้าอี้ พนง. MID YEAR',                         channel:'fb', value:3900},
    {id:nid(), month:'jul', team:'RT',   sale:'Ole',  customer:'Narisarpha Pi',           company:'เก้าอี้หนัง CEO MID YEAR',                      channel:'fb', value:9900},
    {id:nid(), month:'jul', team:'PJ.1', sale:'',     customer:"P'Lek Metawan",           company:'โครงการ วีโฮเทลราชเทวี',                        channel:'fb', value:895000},
    {id:nid(), month:'jul', team:'PJ.1', sale:'',     customer:'กาญจนา จันทร์บูรณ์',        company:'เก้าอี้พักคอย',                                  channel:'fb', value:50000},
    {id:nid(), month:'jul', team:'PJ.1', sale:'',     customer:'Kanlaya Chokphisansup',   company:'เก้าอี้ โต๊ะประชุมออฟฟิศ',                        channel:'fb', value:15000},

    {id:nid(), month:'aug', team:'RT',   sale:'',      customer:'Taweesak Yoothavor',     company:'โต๊ะ รุ่น Training Desk FT-001',                channel:'fb',   value:50000},
    {id:nid(), month:'aug', team:'RT',   sale:'',      customer:'Cidapa Cidap',           company:'โต๊ะ Training Desk FT-001 จำนวน 150 ตัว',       channel:'fb',   value:1200000},
    {id:nid(), month:'aug', team:'RT',   sale:'',      customer:'Tuan Na',                company:'โต๊ะ รุ่น Training Desk FT-001',                channel:'fb',   value:50000},
    {id:nid(), month:'aug', team:'PJ1',  sale:'Supoj', customer:'อินธิภรณ์ รถทอง',          company:'โต๊ะ รุ่น Training Desk FT-001',                channel:'fb',   value:100000},
    {id:nid(), month:'aug', team:'PJ1',  sale:'Supoj', customer:'Jirayut Jantava',        company:'ปรับปรุงโชว์รูมรถยนต์',                          channel:'fb',   value:100000},
    {id:nid(), month:'aug', team:'PJ1',  sale:'Supoj', customer:'Ladynueng',              company:'Office Interior โต๊ะทำงาน โต๊ะประชุม',            channel:'line', value:400000},
    {id:nid(), month:'aug', team:'PJ2',  sale:'Cham',  customer:'Mind Wongsrirattanakul', company:'โต๊ะประชุม 12 ที่นั่ง',                          channel:'fb',   value:120000},
    {id:nid(), month:'aug', team:'PJ2',  sale:'Cham',  customer:'Pim Nusasanee',          company:'บริษัท เอสไอทีซี คอนเทนเนอร์ ไลน์',              channel:'fb',   value:400000},
    {id:nid(), month:'aug', team:'PJ2',  sale:'Mind',  customer:'Tanadet Varapho',        company:'โต๊ะทำงาน สั่งผลิต',                             channel:'fb',   value:200000},
    {id:nid(), month:'aug', team:'PJ2',  sale:'Mind',  customer:'Supattarachai Jitchobjai',company:'โต๊ะทำงาน 20 ชุด',                              channel:'fb',   value:200000},
    {id:nid(), month:'aug', team:'PJ2',  sale:'Au',    customer:'Nok Natcha',             company:'งานวิศวกรรมบริการ ชั้น 5 ศูนย์การค้า',            channel:'line', value:500000},
    {id:nid(), month:'aug', team:'PJ2',  sale:'Ning',  customer:'MC จัดซื้อ',              company:'บริษัท เอ็มซี พลัส จำกัด · โต๊ะเทรนนิ่ง 1,000 ตัว', channel:'line', value:5250000},
    {id:nid(), month:'aug', team:'PJ2',  sale:'Ning',  customer:'A.O.Y',                  company:'โต๊ะทำงานนั่งได้ 8-10 คน',                       channel:'line', value:100000}
  ],

  // ชีท WIN 100% — ในชีทไม่มีคอลัมน์เดือน จึงเว้นว่างไว้ให้กรอกเพิ่มได้
  win: [
    {id:nid(), month:'', sale:'Ning', projectNo:'GOP2600029', value:70420,  name:'ปรับปรุงห้องประชุมสำนักงานใหญ่ บ.ไอโออิ กรุงเทพประกันภัย'},
    {id:nid(), month:'', sale:'Ou',   projectNo:'GOP2600021', value:417844, name:'ปรับปรุงห้องประชุม ท่านผู้อำนวยการ ชั้น 8 รพ.พระจอมเกล้า เพชรบุรี'},
    {id:nid(), month:'', sale:'Ou',   projectNo:'GOP2600030', value:398940, name:'ปรับปรุงหอประชุม ชั้น 9 รพ.พระจอมเกล้า เพชรบุรี'},
    {id:nid(), month:'', sale:'Ning', projectNo:'GOP2600005', value:49220,  name:'ตู้ Built-in / บ.ไอโออิ กรุงเทพประกันภัย'}
  ],

  // ชีต2 — ค่าตามตำแหน่งคอลัมน์ในชีท
  // หมายเหตุสำหรับผู้ดูแล: แถว พ.ค. ในชีทต้นทางเรียงคอลัมน์ไม่ตรงกับเดือนอื่น
  // (ช่อง Reach ได้ค่า 28.76 ซึ่งน่าจะเป็น CPM) หากลูกค้ายืนยันหัวคอลัมน์แล้ว ให้แก้ค่าที่นี่
  ads: [
    {id:nid(), month:'may', budget:16674, impr:526013, reach:28.76, cpm:4.24, cpc:0.0068, ctr:74.0,  cpmsg:225.32},
    {id:nid(), month:'jun', budget:17054, impr:87717,  reach:74278, cpm:0.56, cpc:0.0855, ctr:3.32,  cpmsg:473.71}
  ]
};}

// โครงข้อมูลเปล่า ใช้ตอนสร้างแดชบอร์ดใหม่จากศูนย์
function blankData(){ return {mkt:[], sales:[], pipeline:[], win:[], ads:[]}; }

// STATE คือข้อมูลของรายงานที่กำลังเปิดอยู่ ถูกสลับโดย reports.js
const STATE = seedData();
