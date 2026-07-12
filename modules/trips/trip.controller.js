// modules/trips/trip.controller.js
const tripService = require('./trip.service');

const list = async (req, res, next) => {
  try { res.json({ success: true, data: await tripService.listTrips(req.query) }); }
  catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try { res.json({ success: true, data: await tripService.getTrip(req.params.id) }); }
  catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const trip = await tripService.createTrip(req.body);
    res.status(201).json({ success: true, message: 'Trip created in Draft state.', data: trip });
  } catch (err) { next(err); }
};

const dispatch = async (req, res, next) => {
  try {
    const trip = await tripService.transitionTrip(req.params.id, 'Dispatched');
    res.json({ success: true, message: 'Trip dispatched. Vehicle and driver are now On Trip.', data: trip });
  } catch (err) { next(err); }
};

const complete = async (req, res, next) => {
  try {
    const trip = await tripService.transitionTrip(req.params.id, 'Completed', req.body);
    res.json({ success: true, message: 'Trip completed. Vehicle and driver restored to Available.', data: trip });
  } catch (err) { next(err); }
};

const cancel = async (req, res, next) => {
  try {
    const trip = await tripService.transitionTrip(req.params.id, 'Cancelled');
    res.json({ success: true, message: 'Trip cancelled.', data: trip });
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, dispatch, complete, cancel };
