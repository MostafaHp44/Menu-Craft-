const { createFreePlanRequest, listFreePlanRequests, approveFreePlanRequest, rejectFreePlanRequest } = require('../services/freePlanRequest.service');

async function createHandler(request, reply) {
  try {
    const { userId, restaurantId } = request.body;
    const result = await createFreePlanRequest(userId, restaurantId);
    return reply.send({ ok: true, data: result });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

async function listHandler(request, reply) {
  try {
    const filters = {};
    if (request.query.status) filters.status = request.query.status;
    if (request.query.userId) filters.userId = request.query.userId;
    const requests = await listFreePlanRequests(filters);
    return reply.send({ ok: true, data: requests });
  } catch (err) {
    return reply.status(500).send({ ok: false, error: err.message });
  }
}

async function approveHandler(request, reply) {
  try {
    const { requestId } = request.params;
    const { adminId } = request.body; // from super_admin session
    const result = await approveFreePlanRequest(requestId, adminId);
    return reply.send({ ok: true, data: result });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

async function rejectHandler(request, reply) {
  try {
    const { requestId } = request.params;
    const { adminId } = request.body; // from super_admin session
    const { rejectionReason } = request.body;
    const result = await rejectFreePlanRequest(requestId, adminId, rejectionReason);
    return reply.send({ ok: true, data: result });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

module.exports = {
  createHandler,
  listHandler,
  approveHandler,
  rejectHandler
};