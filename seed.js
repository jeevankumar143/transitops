// seed.js — TransitOps demo data seeder v2.0
require('dotenv').config();
const bcrypt  = require('bcryptjs');
const { getDb } = require('./database/db');

async function seed() {
  const db   = await getDb();
  const hash = bcrypt.hashSync('password123', 10);
  console.log('🌱 Seeding TransitOps database v2.0...\n');

  // ── Users ──────────────────────────────────────────────────
  const users = [
    { name: 'Alex Morgan',    email: 'admin@transitops.io',   role: 'fleet_manager',     phone: '+254700001001' },
    { name: 'Sarah Chen',     email: 'safety@transitops.io',  role: 'safety_officer',    phone: '+254700001002' },
    { name: 'James Okafor',   email: 'finance@transitops.io', role: 'financial_analyst', phone: '+254700001003' },
    { name: 'David Mwangi',   email: 'driver@transitops.io',  role: 'driver',            phone: '+254700001004' },
  ];
  for (const u of users) {
    await db.run(
      'INSERT OR IGNORE INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      u.name, u.email, hash, u.role, u.phone
    );
  }
  console.log('✅ Users seeded (password: password123)');

  // ── Vehicles ───────────────────────────────────────────────
  const vehicles = [
    { reg:'KAA 001A', name:'Atlas Prime',    model:'Volvo FH16',      make:'Volvo',    year:2021, type:'Truck',  cap:20000, fuelCap:800, odometer:45200, cost:8500000,  insExp:'2027-06-30', licExp:'2027-03-31', status:'Available', region:'Nairobi', depot:'Nairobi Central', colour:'White' },
    { reg:'KAB 002B', name:'Swift Runner',   model:'Toyota Hiace',    make:'Toyota',   year:2020, type:'Van',    cap:1500,  fuelCap:70,  odometer:8300,  cost:2200000,  insExp:'2026-10-15', licExp:'2026-09-30', status:'Available', region:'Mombasa', depot:'Mombasa Port',    colour:'Silver' },
    { reg:'KAC 003C', name:'Titan Hauler',   model:'Mercedes Actros', make:'Mercedes', year:2019, type:'Truck',  cap:25000, fuelCap:900, odometer:78900, cost:12000000, insExp:'2027-02-28', licExp:'2027-01-31', status:'Available', region:'Kisumu',  depot:'Kisumu Depot',    colour:'Blue' },
    { reg:'KAD 004D', name:'Metro Express',  model:'Isuzu NQR',       make:'Isuzu',    year:2022, type:'Bus',    cap:3000,  fuelCap:180, odometer:32100, cost:4500000,  insExp:'2027-08-20', licExp:'2027-07-31', status:'Available', region:'Nairobi', depot:'Nairobi Central', colour:'Yellow' },
    { reg:'KAE 005E', name:'Cargo King',     model:'MAN TGX',         make:'MAN',      year:2018, type:'Truck',  cap:22000, fuelCap:850, odometer:91500, cost:9800000,  insExp:'2026-11-30', licExp:'2026-10-31', status:'In Shop',   region:'Eldoret', depot:'Eldoret Yard',    colour:'Red' },
    { reg:'KAF 006F', name:'Fuel Carrier',   model:'DAF XF',          make:'DAF',      year:2020, type:'Tanker', cap:18000, fuelCap:950, odometer:55000, cost:11000000, insExp:'2027-04-15', licExp:'2027-03-31', status:'Available', region:'Nakuru',  depot:'Nakuru Station',  colour:'Green' },
    { reg:'KAG 007G', name:'City Link',      model:'Toyota Coaster',  make:'Toyota',   year:2023, type:'Bus',    cap:2000,  fuelCap:100, odometer:28000, cost:3200000,  insExp:'2028-01-31', licExp:'2028-01-31', status:'Available', region:'Nairobi', depot:'Nairobi Central', colour:'Orange' },
    { reg:'KAH 008H', name:'Old Reliable',   model:'Ford Ranger',     make:'Ford',     year:2013, type:'Pickup', cap:1000,  fuelCap:80,  odometer:185000,cost:1800000,  insExp:'2024-12-31', licExp:'2024-12-31', status:'Retired',   region:'Mombasa', depot:'Mombasa Port',    colour:'Grey' },
  ];
  for (const v of vehicles) {
    await db.run(`INSERT OR IGNORE INTO vehicles
      (registration_no, name, model, make, year, type, max_load_capacity, fuel_capacity, odometer,
       acquisition_cost, insurance_expiry, road_license_expiry, status, region, depot, colour)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      v.reg, v.name, v.model, v.make, v.year, v.type, v.cap, v.fuelCap, v.odometer,
      v.cost, v.insExp, v.licExp, v.status, v.region, v.depot, v.colour);
  }
  console.log('✅ 8 Vehicles seeded (with make, year, fuel capacity, insurance/license expiry, depot, colour)');

  // ── Drivers ────────────────────────────────────────────────
  const drivers = [
    { name:'David Mwangi',    lic:'DL-2019-001', cat:'Heavy', exp:'2026-12-31', idNo:'12345678', phone:'+254700111001', altPhone:'+254700222001', dob:'1985-03-15', hired:'2019-01-10', score:94.5, trips:127, km:68000, status:'Available', addr:'Nairobi West', kin:'Mary Mwangi', kinPhone:'+254700333001' },
    { name:'Grace Wanjiku',   lic:'DL-2020-002', cat:'PSV',   exp:'2025-08-15', idNo:'23456789', phone:'+254700111002', altPhone:null,           dob:'1990-07-22', hired:'2020-03-15', score:88.0, trips:89,  km:42000, status:'Available', addr:'Westlands',    kin:'Peter Wanjiku', kinPhone:'+254700333002' },
    { name:'Peter Kamau',     lic:'DL-2018-003', cat:'B',     exp:'2024-11-30', idNo:'34567890', phone:'+254700111003', altPhone:null,           dob:'1982-11-05', hired:'2018-06-01', score:72.0, trips:203, km:95000, status:'Available', addr:'Thika',        kin:'Jane Kamau',   kinPhone:'+254700333003' },
    { name:'Fatuma Hassan',   lic:'DL-2021-004', cat:'Heavy', exp:'2027-03-20', idNo:'45678901', phone:'+254700111004', altPhone:'+254700222004', dob:'1993-02-18', hired:'2021-09-01', score:97.2, trips:54,  km:28000, status:'Available', addr:'Mombasa',      kin:'Ali Hassan',   kinPhone:'+254700333004' },
    { name:'John Njoroge',    lic:'DL-2022-005', cat:'C',     exp:'2028-06-10', idNo:'56789012', phone:'+254700111005', altPhone:null,           dob:'1988-09-30', hired:'2022-01-20', score:85.5, trips:41,  km:21000, status:'Off Duty',  addr:'Ruiru',        kin:'Lucy Njoroge', kinPhone:'+254700333005' },
    { name:'Mary Atieno',     lic:'DL-2020-006', cat:'PSV',   exp:'2026-09-15', idNo:'67890123', phone:'+254700111006', altPhone:'+254700222006', dob:'1991-04-12', hired:'2020-08-10', score:91.0, trips:112, km:55000, status:'Available', addr:'Kisumu',       kin:'Tom Atieno',   kinPhone:'+254700333006' },
    { name:'Samuel Kipchoge', lic:'DL-2019-007', cat:'Heavy', exp:'2026-01-25', idNo:'78901234', phone:'+254700111007', altPhone:null,           dob:'1980-12-01', hired:'2019-04-05', score:78.5, trips:156, km:78000, status:'Suspended', addr:'Eldoret',      kin:'Ruth Kipchoge',kinPhone:'+254700333007' },
    { name:'Amina Odhiambo',  lic:'DL-2023-008', cat:'B',     exp:'2029-04-18', idNo:'89012345', phone:'+254700111008', altPhone:'+254700222008', dob:'1996-06-25', hired:'2023-02-14', score:99.0, trips:22,  km:9500,  status:'Available', addr:'Nairobi',      kin:'Ali Odhiambo', kinPhone:'+254700333008' },
  ];
  for (const d of drivers) {
    await db.run(`INSERT OR IGNORE INTO drivers
      (name, license_no, license_category, license_expiry, id_number, contact_no, alt_contact_no,
       date_of_birth, date_hired, safety_score, total_trips, total_km, status, address, next_of_kin, next_of_kin_contact)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      d.name, d.lic, d.cat, d.exp, d.idNo, d.phone, d.altPhone,
      d.dob, d.hired, d.score, d.trips, d.km, d.status, d.addr, d.kin, d.kinPhone);
  }
  console.log('✅ 8 Drivers seeded (with ID numbers, addresses, NOK, hiring dates, career stats)');

  // ── Resolve IDs ───────────────────────────────────────────
  const vByReg = async (reg) => (await db.get('SELECT id FROM vehicles WHERE registration_no=?', reg))?.id;
  const dByLic = async (lic) => (await db.get('SELECT id FROM drivers  WHERE license_no=?', lic))?.id;
  const adminId = (await db.get("SELECT id FROM users WHERE email='admin@transitops.io'"))?.id;
  const finId   = (await db.get("SELECT id FROM users WHERE email='finance@transitops.io'"))?.id;
  const safetyId= (await db.get("SELECT id FROM users WHERE email='safety@transitops.io'"))?.id;
  const [v1,v2,v3,v4,v5,v6] = await Promise.all(['KAA 001A','KAB 002B','KAC 003C','KAD 004D','KAE 005E','KAF 006F'].map(vByReg));
  const [d1,d2,d3,d4,d6,d8] = await Promise.all(['DL-2019-001','DL-2020-002','DL-2018-003','DL-2021-004','DL-2020-006','DL-2023-008'].map(dByLic));

  // ── Trips ─────────────────────────────────────────────────
  const tripData = [
    // Completed trips
    { vid:v1, did:d1, src:'Nairobi', dst:'Mombasa',   cType:'Dry Goods', cWeight:15000, cDesc:'Bagged flour',        pDist:485, aDist:490, rev:120000, fuel:210, client:'Unga Group Ltd',       clientC:'+254722100001', priority:'High',   status:'Completed', dispAt:'2026-07-01T06:00:00', compAt:'2026-07-01T18:00:00', createdBy:adminId },
    { vid:v2, did:d4, src:'Mombasa', dst:'Malindi',    cType:'Perishables',cWeight:1200, cDesc:'Fresh produce',       pDist:120, aDist:118, rev:35000, fuel:32,  client:'Malindi Fresh Market', clientC:'+254722100002', priority:'Urgent', status:'Completed', dispAt:'2026-07-03T09:00:00', compAt:'2026-07-03T11:30:00', createdBy:adminId },
    { vid:v3, did:d6, src:'Kisumu',  dst:'Kampala',    cType:'Building Mat.',cWeight:20000,cDesc:'Steel rods & cement',pDist:300, aDist:305, rev:95000, fuel:275, client:'Kampala Constructions',clientC:'+254722100003', priority:'Normal', status:'Completed', dispAt:'2026-07-05T08:00:00', compAt:'2026-07-06T10:00:00', createdBy:adminId },
    { vid:v2, did:d2, src:'Nairobi', dst:'Nakuru',     cType:'Electronics', cWeight:800,  cDesc:'Consumer electronics',pDist:160, aDist:163, rev:42000, fuel:28,  client:'TechMart Kenya',       clientC:'+254722100004', priority:'Normal', status:'Completed', dispAt:'2026-07-07T07:00:00', compAt:'2026-07-07T10:30:00', createdBy:adminId },
    { vid:v6, did:d8, src:'Eldoret', dst:'Nairobi',    cType:'Fuel',        cWeight:16000,cDesc:'Diesel fuel tank',   pDist:310, aDist:315, rev:88000, fuel:290, client:'Kenya Pipeline Co.',    clientC:'+254722100005', priority:'High',   status:'Completed', dispAt:'2026-07-09T05:00:00', compAt:'2026-07-09T17:00:00', createdBy:adminId },
  ];
  const tripIds = [];
  for (const t of tripData) {
    const r = await db.run(`INSERT OR IGNORE INTO trips
      (vehicle_id,driver_id,source,destination,cargo_type,cargo_weight,cargo_description,
       planned_distance,actual_distance,revenue,fuel_consumed,client_name,client_contact,
       priority,status,dispatched_at,completed_at,created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      t.vid,t.did,t.src,t.dst,t.cType,t.cWeight,t.cDesc,
      t.pDist,t.aDist,t.rev,t.fuel,t.client,t.clientC,
      t.priority,t.status,t.dispAt,t.compAt,t.createdBy);
    tripIds.push(r.lastID);
  }

  // Active dispatched trip
  const dispR = await db.run(`INSERT OR IGNORE INTO trips
    (vehicle_id,driver_id,source,destination,cargo_type,cargo_weight,cargo_description,
     planned_distance,revenue,client_name,client_contact,priority,status,dispatched_at,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    v4,d1,'Nairobi','Eldoret','Industrial',2500,'Machine parts',320,75000,
    'AEA Engineering','014-ELD-01','High','Dispatched',new Date().toISOString(),adminId);
  if (dispR.changes > 0) {
    await db.run("UPDATE vehicles SET status='On Trip' WHERE id=?", v4);
    await db.run("UPDATE drivers  SET status='On Trip' WHERE id=?", d1);
    tripIds.push(dispR.lastID);
  }

  // Draft trip
  const draftR = await db.run(`INSERT OR IGNORE INTO trips
    (vehicle_id,driver_id,source,destination,cargo_type,cargo_weight,cargo_description,
     planned_distance,revenue,client_name,client_contact,priority,status,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    v6,d8,'Nakuru','Naivasha','Dry Goods',15000,'Packaged cement',90,28000,
    'Naivasha Builders','020-NAI-01','Normal','Draft',adminId);
  tripIds.push(draftR.lastID);

  console.log('✅ 7 Trips seeded (5 Completed, 1 Dispatched, 1 Draft) with cargo type, client, priority');

  // ── Maintenance ────────────────────────────────────────────
  await db.run(`INSERT OR IGNORE INTO maintenance_records
    (vehicle_id,type,description,cost,parts_cost,labour_cost,status,technician,workshop,odometer_at_service,start_date,end_date,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    v5,'Breakdown','Engine overhaul — crankshaft replacement',185000,130000,55000,
    'Active','Eng. Kariuki James','Mwalimu Garage Ltd',91500,'2026-07-08T08:00:00',null,adminId);
  await db.run(`INSERT OR IGNORE INTO maintenance_records
    (vehicle_id,type,description,cost,parts_cost,labour_cost,status,technician,workshop,odometer_at_service,next_service_km,start_date,end_date,invoice_no,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    v1,'Scheduled','Full service — oil change, filter, tyre rotation',8500,4500,4000,
    'Closed','Tech. Omondi','AutoServ Nairobi',45000,50000,'2026-06-20T09:00:00','2026-06-20T12:00:00','INV-2026-0612',adminId);
  await db.run(`INSERT OR IGNORE INTO maintenance_records
    (vehicle_id,type,description,cost,parts_cost,labour_cost,status,technician,workshop,start_date,end_date,invoice_no,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    v3,'Inspection','Annual roadworthiness inspection — NTSA',5000,0,5000,
    'Closed','NTSA Officer','NTSA Inspection Centre','2026-06-15T10:00:00','2026-06-15T14:00:00','NTSA-2026-003',adminId);
  await db.run(`INSERT OR IGNORE INTO maintenance_records
    (vehicle_id,type,description,cost,parts_cost,labour_cost,status,technician,workshop,start_date,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    v2,'Tyres','Replacement of 4 worn tyres — new Bridgestone set',28000,24000,4000,
    'Closed','Peter Tech','AutoServ Nairobi','2026-07-02T10:00:00',adminId);
  console.log('✅ 4 Maintenance records seeded (with parts/labour cost breakdown, workshops, invoice numbers)');

  // ── Fuel Logs ──────────────────────────────────────────────
  const fuelEntries = [
    { vid:v1, did:d1, liters:450, cpl:180, cost:81000,  odo:44800, date:'2026-07-01', station:'Total Energies Nairobi', rcpt:'RCP-001' },
    { vid:v1, did:d1, liters:380, cpl:182, cost:69160,  odo:45200, date:'2026-07-08', station:'Shell Mombasa',          rcpt:'RCP-002' },
    { vid:v2, did:d4, liters:85,  cpl:179, cost:15215,  odo:8150,  date:'2026-07-03', station:'Rubis Mombasa',          rcpt:'RCP-003' },
    { vid:v3, did:d6, liters:520, cpl:180, cost:93600,  odo:78400, date:'2026-07-05', station:'Kenol Kisumu',           rcpt:'RCP-004' },
    { vid:v3, did:d6, liters:480, cpl:181, cost:86880,  odo:78700, date:'2026-07-06', station:'Total Kampala',          rcpt:'RCP-005' },
    { vid:v4, did:d1, liters:120, cpl:180, cost:21600,  odo:31900, date:'2026-07-10', station:'Shell Nairobi',          rcpt:'RCP-006' },
    { vid:v6, did:d8, liters:700, cpl:180, cost:126000, odo:54700, date:'2026-07-09', station:'Kenol Eldoret',          rcpt:'RCP-007' },
    { vid:v2, did:d2, liters:65,  cpl:179, cost:11635,  odo:8100,  date:'2026-07-07', station:'Shell Nakuru',           rcpt:'RCP-008' },
  ];
  for (const f of fuelEntries) {
    await db.run(`INSERT OR IGNORE INTO fuel_logs
      (vehicle_id,driver_id,liters,cost_per_litre,cost,odometer_reading,log_date,station,receipt_no,recorded_by)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      f.vid, f.did, f.liters, f.cpl, f.cost, f.odo, f.date, f.station, f.rcpt, finId);
  }
  console.log('✅ 8 Fuel logs seeded (with driver, cost-per-litre, odometer, receipt numbers)');

  // ── Expenses ───────────────────────────────────────────────
  const expEntries = [
    { vid:v1, did:d1, cat:'Toll',        amt:3500,   desc:'Nairobi-Mombasa highway toll',     date:'2026-07-01', rcpt:'EXP-001', appr:1 },
    { vid:v3, did:d6, cat:'Toll',        amt:8200,   desc:'Kenya-Uganda border crossing fee', date:'2026-07-05', rcpt:'EXP-002', appr:1 },
    { vid:v2, did:null, cat:'Insurance', amt:45000,  desc:'Annual comprehensive insurance',   date:'2026-07-01', rcpt:'EXP-003', appr:1 },
    { vid:v1, did:d1, cat:'Other',       amt:2500,   desc:'Driver per diem — Mombasa trip',   date:'2026-07-01', rcpt:'EXP-004', appr:1 },
    { vid:v5, did:null, cat:'Maintenance',amt:185000, desc:'Engine overhaul payment',         date:'2026-07-08', rcpt:'EXP-005', appr:1 },
    { vid:v6, did:d8, cat:'Permit',      amt:5000,   desc:'Dangerous goods transport permit', date:'2026-07-08', rcpt:'EXP-006', appr:0 },
    { vid:v4, did:d1, cat:'Toll',        amt:1200,   desc:'Nairobi-Eldoret toll gate',        date:'2026-07-10', rcpt:'EXP-007', appr:0 },
  ];
  for (const e of expEntries) {
    await db.run(`INSERT OR IGNORE INTO expenses
      (vehicle_id,driver_id,category,amount,description,expense_date,receipt_no,approved,approved_by,recorded_by)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      e.vid, e.did, e.cat, e.amt, e.desc, e.date, e.rcpt, e.appr, e.appr ? finId : null, finId);
  }
  console.log('✅ 7 Expenses seeded (with receipt numbers, approval status)');

  // ── Safety Incidents ───────────────────────────────────────
  const [triId1] = tripIds;
  await db.run(`INSERT OR IGNORE INTO safety_incidents
    (driver_id,type,severity,description,location,cost,score_deduction,reported_by,incident_date,resolved)
    VALUES (?,?,?,?,?,?,?,?,?,?)`,
    d3,'Traffic Violation','Medium','Speeding fine — 30km/h over limit on Thika Road',
    'Thika Road, KM 24',3000,5.0,safetyId,'2026-06-10',1);
  await db.run(`INSERT OR IGNORE INTO safety_incidents
    (driver_id,type,severity,description,location,cost,score_deduction,reported_by,incident_date,resolved)
    VALUES (?,?,?,?,?,?,?,?,?,?)`,
    (await db.get("SELECT id FROM drivers WHERE license_no='DL-2019-007'"))?.id,
    'Accident','High','Minor rear collision in depot yard — reversing incident',
    'Eldoret Yard, Bay 3',45000,18.0,safetyId,'2026-06-25',0);
  await db.run(`INSERT OR IGNORE INTO safety_incidents
    (driver_id,type,severity,description,location,cost,score_deduction,reported_by,incident_date,resolved)
    VALUES (?,?,?,?,?,?,?,?,?,?)`,
    d1,'Near Miss','Low','Near miss with pedestrian at weighbridge entry',
    'Mombasa Weighbridge',0,1.5,safetyId,'2026-07-02',1);
  console.log('✅ 3 Safety incidents seeded (with severity, deductions, resolution status)');

  // ── Invoices ───────────────────────────────────────────────
  const completedTripIds = await db.all("SELECT id, revenue, client_name FROM trips WHERE status='Completed' LIMIT 5");
  let invIdx = 1;
  for (const t of completedTripIds) {
    const tax = Math.round(t.revenue * 0.16);
    await db.run(`INSERT OR IGNORE INTO invoices
      (trip_id,invoice_no,client_name,amount,tax,total,status,issued_date,due_date,paid_date)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      t.id, `INV-2026-${String(invIdx).padStart(4,'0')}`,
      t.client_name || 'Government Contract',
      t.revenue, tax, t.revenue + tax,
      invIdx <= 4 ? 'Paid' : 'Pending',
      '2026-07-10', '2026-07-25',
      invIdx <= 4 ? '2026-07-15' : null
    );
    invIdx++;
  }
  console.log('✅ Invoices generated for completed trips');

  // ── Budget Items ───────────────────────────────────────────
  const budgetData = [
    { cat:'Fuel',        allocated:500000, spent:413490 },
    { cat:'Maintenance', allocated:300000, spent:218500 },
    { cat:'Insurance',   allocated:200000, spent:45000  },
    { cat:'Salary',      allocated:800000, spent:0      },
    { cat:'Toll',        allocated:50000,  spent:12900  },
    { cat:'Other',       allocated:100000, spent:7500   },
  ];
  for (const b of budgetData) {
    await db.run(`INSERT OR IGNORE INTO budget_items (category,budget_year,budget_month,allocated,spent)
      VALUES (?,?,?,?,?)`, b.cat, 2026, 7, b.allocated, b.spent);
  }
  console.log('✅ Budget items seeded for July 2026');

  // ── Notifications ──────────────────────────────────────────
  const notifs = [
    { uid:adminId,  type:'Warning', title:'License Expiring Soon', msg:'Driver Peter Kamau (DL-2018-003) license expires 2024-11-30 — renewal required.', entity:'drivers' },
    { uid:adminId,  type:'Alert',   title:'Vehicle In Maintenance', msg:'KAE 005E (Cargo King) is currently in workshop for engine overhaul.', entity:'vehicles' },
    { uid:adminId,  type:'Info',    title:'Trip Completed', msg:'Trip #1 Nairobi → Mombasa completed. Revenue: KES 120,000.', entity:'trips' },
    { uid:safetyId, type:'Alert',   title:'Unresolved Incident', msg:'Safety incident for Samuel Kipchoge (Accident - High severity) is still open.', entity:'safety_incidents' },
    { uid:finId,    type:'Warning', title:'Pending Expense Approvals', msg:'2 expenses are awaiting your approval before end of week.', entity:'expenses' },
    { uid:adminId,  type:'Success', title:'Database v2.0 Ready', msg:'TransitOps database has been fully seeded with production-grade demo data.', entity:null },
  ];
  for (const n of notifs) {
    await db.run(`INSERT OR IGNORE INTO notifications (user_id,type,title,message,entity) VALUES (?,?,?,?,?)`,
      n.uid, n.type, n.title, n.msg, n.entity);
  }
  console.log('✅ 6 Notifications seeded');

  // ── Audit Logs ─────────────────────────────────────────────
  await db.run(`INSERT OR IGNORE INTO audit_logs (user_id,action,entity,detail) VALUES (?,?,?,?)`,
    adminId, 'SEED', 'system', JSON.stringify({ version: '2.0', timestamp: new Date().toISOString() }));

  console.log(`
🎉 Database v2.0 seeded successfully!

📊 What was seeded:
   • 4  Users  (Fleet Manager, Safety Officer, Financial Analyst, Driver)
   • 8  Vehicles (Trucks, Vans, Buses, Tanker, Pickup — with full details)
   • 8  Drivers  (with IDs, NOK, career stats, safety scores)
   • 7  Trips    (5 Completed, 1 Dispatched, 1 Draft)
   • 4  Maintenance records (with cost breakdown, workshops)
   • 8  Fuel logs (with per-litre cost, odometer readings)
   • 7  Expenses (with receipts, approval workflow)
   • 3  Safety incidents (with severity, score deductions)
   • Invoices for all completed trips
   • 6  Budget items (July 2026)
   • 6  Notifications
   • 1  Audit log entry

📋 Login credentials (all use password: password123):
   Fleet Manager:     admin@transitops.io
   Safety Officer:    safety@transitops.io
   Financial Analyst: finance@transitops.io
   Driver:            driver@transitops.io

🚀 Run: npm start  →  http://localhost:3000
  `);
}

seed().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });

