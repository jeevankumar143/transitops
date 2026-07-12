// seed.js — TransitOps demo data seeder (async version)
require('dotenv').config();
const bcrypt  = require('bcryptjs');
const { getDb } = require('./database/db');

async function seed() {
  const db   = await getDb();
  const hash = bcrypt.hashSync('password123', 10);
  console.log('🌱 Seeding TransitOps database...\n');

  // ── Users ──────────────────────────────────────────────────
  const users = [
    { name: 'Alex Morgan',   email: 'admin@transitops.io',     role: 'fleet_manager' },
    { name: 'Sarah Chen',    email: 'safety@transitops.io',    role: 'safety_officer' },
    { name: 'James Okafor',  email: 'finance@transitops.io',   role: 'financial_analyst' },
    { name: 'David Mwangi',  email: 'driver@transitops.io',    role: 'driver' },
  ];
  for (const u of users) {
    await db.run('INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      u.name, u.email, hash, u.role);
  }
  console.log('✅ Users seeded (password: password123)');

  // ── Vehicles ───────────────────────────────────────────────
  const vehicles = [
    ['KAA 001A', 'Atlas Prime',   'Volvo FH16',      'Truck',  20000, 45200, 8500000,  'Available', 'Nairobi'],
    ['KAB 002B', 'Swift Runner',  'Toyota Hiace',    'Van',     1500,  8300, 2200000,  'Available', 'Mombasa'],
    ['KAC 003C', 'Titan Hauler',  'Mercedes Actros', 'Truck',  25000, 78900, 12000000, 'Available', 'Kisumu'],
    ['KAD 004D', 'Metro Express', 'Isuzu NQR',       'Bus',     3000, 32100, 4500000,  'Available', 'Nairobi'],
    ['KAE 005E', 'Cargo King',    'MAN TGX',         'Truck',  22000, 91500, 9800000,  'In Shop',   'Eldoret'],
    ['KAF 006F', 'Fuel Carrier',  'DAF XF',          'Tanker', 18000, 55000, 11000000, 'Available', 'Nakuru'],
    ['KAG 007G', 'City Link',     'Toyota Coaster',  'Bus',     2000, 28000, 3200000,  'Available', 'Nairobi'],
    ['KAH 008H', 'Old Reliable',  'Ford Ranger',     'Pickup',  1000, 185000, 1800000, 'Retired',   'Mombasa'],
  ];
  for (const v of vehicles) {
    await db.run(`INSERT OR IGNORE INTO vehicles
      (registration_no, name, model, type, max_load_capacity, odometer, acquisition_cost, status, region)
      VALUES (?,?,?,?,?,?,?,?,?)`, ...v);
  }
  console.log('✅ 8 Vehicles seeded');

  // ── Drivers ────────────────────────────────────────────────
  const drivers = [
    ['David Mwangi',    'DL-2019-001', 'Heavy', '2026-12-31', '+254700111001', 94.5, 'Available'],
    ['Grace Wanjiku',   'DL-2020-002', 'PSV',   '2025-08-15', '+254700111002', 88.0, 'Available'],
    ['Peter Kamau',     'DL-2018-003', 'B',     '2024-11-30', '+254700111003', 72.0, 'Available'],
    ['Fatuma Hassan',   'DL-2021-004', 'Heavy', '2027-03-20', '+254700111004', 97.2, 'Available'],
    ['John Njoroge',    'DL-2022-005', 'C',     '2028-06-10', '+254700111005', 85.5, 'Off Duty'],
    ['Mary Atieno',     'DL-2020-006', 'PSV',   '2026-09-15', '+254700111006', 91.0, 'Available'],
    ['Samuel Kipchoge', 'DL-2019-007', 'Heavy', '2026-01-25', '+254700111007', 78.5, 'Suspended'],
    ['Amina Odhiambo',  'DL-2023-008', 'B',     '2029-04-18', '+254700111008', 99.0, 'Available'],
  ];
  for (const d of drivers) {
    await db.run(`INSERT OR IGNORE INTO drivers
      (name, license_no, license_category, license_expiry, contact_no, safety_score, status)
      VALUES (?,?,?,?,?,?,?)`, ...d);
  }
  console.log('✅ 8 Drivers seeded (includes expired license, suspended, off-duty)');

  // ── Trips ──────────────────────────────────────────────────
  const v = async (reg)  => (await db.get('SELECT id FROM vehicles WHERE registration_no=?', reg))?.id;
  const d = async (lic)  => (await db.get('SELECT id FROM drivers WHERE license_no=?', lic))?.id;
  const [v1,v2,v3,v4,v6] = await Promise.all([v('KAA 001A'),v('KAB 002B'),v('KAC 003C'),v('KAD 004D'),v('KAF 006F')]);
  const [d1,d2,d3,d8]    = await Promise.all([d('DL-2019-001'),d('DL-2021-004'),d('DL-2020-006'),d('DL-2023-008')]);

  // Completed trips
  await db.run(`INSERT OR IGNORE INTO trips
    (vehicle_id,driver_id,source,destination,cargo_weight,planned_distance,actual_distance,revenue,status,dispatched_at,completed_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    v1,d1,'Nairobi','Mombasa',15000,485,490,120000,'Completed','2026-07-01T06:00:00','2026-07-01T18:00:00');
  await db.run(`INSERT OR IGNORE INTO trips
    (vehicle_id,driver_id,source,destination,cargo_weight,planned_distance,actual_distance,revenue,status,dispatched_at,completed_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    v2,d2,'Mombasa','Malindi',1200,120,118,35000,'Completed','2026-07-03T09:00:00','2026-07-03T11:30:00');
  await db.run(`INSERT OR IGNORE INTO trips
    (vehicle_id,driver_id,source,destination,cargo_weight,planned_distance,actual_distance,revenue,status,dispatched_at,completed_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    v3,d3,'Kisumu','Kampala',20000,300,305,95000,'Completed','2026-07-05T08:00:00','2026-07-06T10:00:00');

  // Active dispatched trip
  const dispatched = await db.run(`INSERT OR IGNORE INTO trips
    (vehicle_id,driver_id,source,destination,cargo_weight,planned_distance,revenue,status,dispatched_at)
    VALUES (?,?,?,?,?,?,?,?,?)`,
    v4,d1,'Nairobi','Eldoret',2500,320,75000,'Dispatched',new Date().toISOString());
  if (dispatched.changes > 0) {
    await db.run("UPDATE vehicles SET status='On Trip' WHERE id=?", v4);
    await db.run("UPDATE drivers  SET status='On Trip' WHERE id=?", d1);
  }

  // Draft trip
  await db.run(`INSERT OR IGNORE INTO trips
    (vehicle_id,driver_id,source,destination,cargo_weight,planned_distance,revenue,status)
    VALUES (?,?,?,?,?,?,?,?)`,
    v6, d8, 'Nakuru', 'Naivasha', 15000, 90, 28000, 'Draft');

  console.log('✅ 5 Trips seeded (3 Completed, 1 Dispatched, 1 Draft)');

  // ── Maintenance ────────────────────────────────────────────
  const v5 = await v('KAE 005E');
  await db.run(`INSERT OR IGNORE INTO maintenance_records
    (vehicle_id,type,description,cost,status,technician,start_date,end_date)
    VALUES (?,?,?,?,?,?,?,?)`,
    v5,'Breakdown','Engine overhaul — crankshaft replacement',185000,'Active','Mwalimu Garage Ltd','2026-07-08T08:00:00',null);
  await db.run(`INSERT OR IGNORE INTO maintenance_records
    (vehicle_id,type,description,cost,status,technician,start_date,end_date)
    VALUES (?,?,?,?,?,?,?,?)`,
    v1,'Scheduled','Oil change and tire rotation',8500,'Closed','AutoServ Nairobi','2026-06-20T09:00:00','2026-06-20T12:00:00');
  await db.run(`INSERT OR IGNORE INTO maintenance_records
    (vehicle_id,type,description,cost,status,technician,start_date,end_date)
    VALUES (?,?,?,?,?,?,?,?)`,
    v3,'Inspection','Annual roadworthiness inspection',5000,'Closed','NTSA Inspection','2026-06-15T10:00:00','2026-06-15T14:00:00');
  console.log('✅ 3 Maintenance records seeded');

  // ── Fuel Logs ──────────────────────────────────────────────
  const fuelEntries = [
    [v1, 450, 81000, '2026-07-01', 'Total Energies Nairobi'],
    [v1, 380, 68400, '2026-07-08', 'Shell Mombasa'],
    [v2, 85,  15300, '2026-07-03', 'Rubis Mombasa'],
    [v3, 520, 93600, '2026-07-05', 'Kenol Kisumu'],
    [v3, 480, 86400, '2026-07-06', 'Total Kampala'],
    [v4, 120, 21600, '2026-07-10', 'Shell Nairobi'],
  ];
  for (const f of fuelEntries) {
    await db.run('INSERT OR IGNORE INTO fuel_logs (vehicle_id,liters,cost,log_date,station) VALUES (?,?,?,?,?)', ...f);
  }
  console.log('✅ 6 Fuel logs seeded');

  // ── Expenses ────────────────────────────────────────────────
  const admin = await db.get("SELECT id FROM users WHERE email='finance@transitops.io'");
  const aId   = admin?.id;
  const expEntries = [
    [v1,  'Toll',        3500,   'Nairobi-Mombasa highway toll',     '2026-07-01'],
    [v3,  'Toll',        8200,   'Kenya-Uganda border crossing fee',  '2026-07-05'],
    [v2,  'Insurance',  45000,   'Annual comprehensive insurance',    '2026-07-01'],
    [v1,  'Other',       2500,   'Driver per diem - Mombasa trip',    '2026-07-01'],
    [v5,  'Maintenance',185000,  'Engine overhaul payment',           '2026-07-08'],
  ];
  for (const e of expEntries) {
    await db.run('INSERT OR IGNORE INTO expenses (vehicle_id,category,amount,description,expense_date,recorded_by) VALUES (?,?,?,?,?,?)',
      e[0], e[1], e[2], e[3], e[4], aId);
  }
  console.log('✅ 5 Expenses seeded');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Fleet Manager:     admin@transitops.io   / password123');
  console.log('   Safety Officer:    safety@transitops.io  / password123');
  console.log('   Financial Analyst: finance@transitops.io / password123');
  console.log('   Driver:            driver@transitops.io  / password123');
  console.log('\n🚀 Run: npm start  →  http://localhost:3000\n');
}

seed().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
