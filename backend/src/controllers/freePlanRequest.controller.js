const { createFreePlanRequest, listFreePlanRequests, approveFreePlanRequest, rejectFreePlanRequest } = require('../services/freePlanRequest.service');

async function createHandler(request, reply) {
  try {
    const userId = request.user?.userId;
    const restaurantId = request.body?.restaurantId || request.user?.restaurant_id || request.user?.restaurantId;
    const result = await createFreePlanRequest(userId, restaurantId);
    return reply.send({ ok: true, data: result });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

async function listHandler(request, reply) {
  try {
    const { status } = request.query || {};
    const requests = await listFreePlanRequests({ status });
    return reply.send({ ok: true, data: requests });
  } catch (err) {
    return reply.status(500).send({ ok: false, error: err.message });
  }
}

async function approveHandler(request, reply) {
  try {
    const { requestId } = request.params;
    const adminId = request.user?.userId;
    const result = await approveFreePlanRequest(requestId, adminId);
    return reply.send({ ok: true, data: result });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

async function rejectHandler(request, reply) {
  try {
    const { requestId } = request.params;
    const adminId = request.user?.userId;
    const { rejectionReason } = request.body || {};
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
