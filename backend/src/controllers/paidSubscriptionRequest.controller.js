const {
  createPaidSubscriptionRequest,
  listUserPaidSubscriptionRequests,
  listAllPaidSubscriptionRequests,
  approvePaidSubscriptionRequest,
  rejectPaidSubscriptionRequest
} = require('../services/paidSubscriptionRequest.service');

async function createHandler(request, reply) {
  try {
    // userId/restaurantId come from the authenticated session — never from the body
    const userId = request.user?.userId;
    const restaurantId = request.body?.restaurantId || request.user?.restaurant_id || request.user?.restaurantId;
    const { planId, planName, price } = request.body || {};
    const result = await createPaidSubscriptionRequest({ userId, restaurantId, planId, planName, price });
    return reply.send({ ok: true, data: result });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

async function listHandler(request, reply) {
  try {
    const userId = request.user?.userId;
    const { restaurantId } = request.query || {};
    const requests = await listUserPaidSubscriptionRequests(userId, { restaurantId });
    return reply.send({ ok: true, data: requests });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

/** Super admin: list every request (optionally filtered by status) */
async function listAllHandler(request, reply) {
  try {
    const { status } = request.query || {};
    const requests = await listAllPaidSubscriptionRequests({ status });
    return reply.send({ ok: true, data: requests });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

async function approveHandler(request, reply) {
  try {
    const { requestId } = request.params;
    const adminId = request.user?.userId;
    const result = await approvePaidSubscriptionRequest(requestId, adminId);
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
    const result = await rejectPaidSubscriptionRequest(requestId, adminId, rejectionReason);
    return reply.send({ ok: true, data: result });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

module.exports = { createHandler, listHandler, listAllHandler, approveHandler, rejectHandler };
