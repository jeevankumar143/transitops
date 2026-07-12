// modules/dashboard/dashboard.controller.js
const { getDb } = require('../../database/db');

const getKPIs = async (req, res, next) => {
  try {
    const db = await getDb();
    const vehicles = await db.all('SELECT status, type, region FROM vehicles');
    const drivers  = await db.all('SELECT status FROM drivers');
    const trips    = await db.all('SELECT status FROM trips');

    const total    = vehicles.length;
    const active   = vehicles.filter(v => v.status === 'On Trip').length;
    const avail    = vehicles.filter(v => v.status === 'Available').length;
    const inShop   = vehicles.filter(v => v.status === 'In Shop').length;
    const retired  = vehicles.filter(v => v.status === 'Retired').length;

    const dOnDuty  = drivers.filter(d => d.status === 'On Trip').length;
    const dAvail   = drivers.filter(d => d.status === 'Available').length;

    const tActive  = trips.filter(t => t.status === 'Dispatched').length;
    const tPending = trips.filter(t => t.status === 'Draft').length;
    const tDone    = trips.filter(t => t.status === 'Completed').length;
    const tCancel  = trips.filter(t => t.status === 'Cancelled').length;

    const fleetUtil = total > 0 ? ((active / total) * 100).toFixed(1) : '0.0';

    const typeBreakdown   = vehicles.reduce((a, v) => { a[v.type]=(a[v.type]||0)+1; return a; }, {});
    const statusBreakdown = vehicles.reduce((a, v) => { a[v.status]=(a[v.status]||0)+1; return a; }, {});

    res.json({ success: true, data: {
      vehicles: { total, active, available: avail, inMaintenance: inShop, retired },
      drivers:  { total: drivers.length, onDuty: dOnDuty, available: dAvail },
      trips:    { active: tActive, pending: tPending, completed: tDone, cancelled: tCancel },
      fleetUtilization: parseFloat(fleetUtil),
      typeBreakdown, statusBreakdown,
    }});
  } catch (err) { next(err); }
};

const getFinancials = async (req, res, next) => {
  try {
    const db       = await getDb();
    const vehicles = await db.all('SELECT * FROM vehicles');

    const result = await Promise.all(vehicles.map(async v => {
      const f = await db.get("SELECT COALESCE(SUM(cost),0) as fc, COALESCE(SUM(liters),0) as fl FROM fuel_logs WHERE vehicle_id=?", v.id);
      const m = await db.get("SELECT COALESCE(SUM(cost),0) as mc FROM maintenance_records WHERE vehicle_id=?", v.id);
      const d = await db.get("SELECT COALESCE(SUM(COALESCE(actual_distance,planned_distance)),0) as td, COALESCE(SUM(revenue),0) as tr FROM trips WHERE vehicle_id=? AND status='Completed'", v.id);
      const opCost = f.fc + m.mc;
      const eff    = f.fl > 0 ? parseFloat((d.td / f.fl).toFixed(2)) : null;
      const roi    = v.acquisition_cost > 0 ? parseFloat(((d.tr - opCost) / v.acquisition_cost * 100).toFixed(2)) : null;
      return {
        vehicle_id: v.id, registration_no: v.registration_no, name: v.name, type: v.type, status: v.status,
        acquisition_cost: v.acquisition_cost, total_fuel_cost: f.fc, total_fuel_liters: f.fl,
        total_maintenance_cost: m.mc, total_op_cost: opCost, total_distance_km: d.td, total_revenue: d.tr,
        fuel_efficiency_km_per_l: eff, roi_percent: roi,
      };
    }));

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const exportTripsCSV = async (req, res, next) => {
  try {
    const db = await getDb();
    const trips = await db.all(`
      SELECT t.id, t.source, t.destination, t.status, t.cargo_weight, t.planned_distance,
             t.actual_distance, t.revenue, t.dispatched_at, t.completed_at, t.cancelled_at,
             t.created_at, v.registration_no, v.name as vehicle_name, d.name as driver_name
      FROM trips t JOIN vehicles v ON v.id=t.vehicle_id JOIN drivers d ON d.id=t.driver_id
      ORDER BY t.created_at DESC`);
    if (!trips.length) { res.setHeader('Content-Type','text/csv'); return res.send('No data'); }
    const header = Object.keys(trips[0]).join(',');
    const rows   = trips.map(r => Object.values(r).map(v => `"${v??''}"`).join(','));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="trips_export.csv"');
    res.send([header, ...rows].join('\n'));
  } catch (err) { next(err); }
};

const exportVehiclesCSV = async (req, res, next) => {
  try {
    const db = await getDb();
    const vehicles = await db.all('SELECT * FROM vehicles ORDER BY created_at DESC');
    if (!vehicles.length) { res.setHeader('Content-Type','text/csv'); return res.send('No data'); }
    const header = Object.keys(vehicles[0]).join(',');
    const rows   = vehicles.map(r => Object.values(r).map(v => `"${v??''}"`).join(','));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="vehicles_export.csv"');
    res.send([header, ...rows].join('\n'));
  } catch (err) { next(err); }
};

const exportFinancialsCSV = async (req, res, next) => {
  try {
    const db       = await getDb();
    const vehicles = await db.all('SELECT * FROM vehicles');
    const rows = await Promise.all(vehicles.map(async v => {
      const f = await db.get("SELECT COALESCE(SUM(cost),0) as fc, COALESCE(SUM(liters),0) as fl FROM fuel_logs WHERE vehicle_id=?", v.id);
      const m = await db.get("SELECT COALESCE(SUM(cost),0) as mc FROM maintenance_records WHERE vehicle_id=?", v.id);
      const d = await db.get("SELECT COALESCE(SUM(COALESCE(actual_distance,planned_distance)),0) as td, COALESCE(SUM(revenue),0) as tr FROM trips WHERE vehicle_id=? AND status='Completed'", v.id);
      const opCost = f.fc + m.mc;
      const eff    = f.fl > 0 ? (d.td / f.fl).toFixed(2) : '';
      const roi    = v.acquisition_cost > 0 ? ((d.tr - opCost) / v.acquisition_cost * 100).toFixed(2) : '';
      return [v.registration_no, v.name, v.type, v.status, v.acquisition_cost, f.fc, f.fl, m.mc, opCost, d.td, d.tr, eff, roi];
    }));
    const header = 'Registration,Name,Type,Status,AcquisitionCost,FuelCost,FuelLiters,MaintCost,TotalOpCost,DistanceKM,Revenue,FuelEfficiency_km_L,ROI_Percent';
    const csv = [header, ...rows.map(r => r.map(c => `"${c??''}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="financials_export.csv"');
    res.send(csv);
  } catch (err) { next(err); }
};

module.exports = { getKPIs, getFinancials, exportTripsCSV, exportVehiclesCSV, exportFinancialsCSV };
