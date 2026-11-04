const {
  createPaidSubscriptionRequest,
  listUserPaidSubscriptionRequests,
  approvePaidSubscriptionRequest,
  rejectPaidSubscriptionRequest
} = require('../services/paidSubscriptionRequest.service');

async function createHandler(request, reply) {
  try {
    const { userId, restaurantId, planId, planName, price } = request.body;
    const result = await createPaidSubscriptionRequest(userId, restaurantId, planId, planName, price);
    return reply.send({ ok: true, data: result });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

async function listHandler(request, reply) {
  try {
    const { userId } = request.params;
    const requests = await listUserPaidSubscriptionRequests(userId);
    return reply.send({ ok: true, data: requests });
  } catch (err) {
    return reply.status(500).send({ ok: false, error: err.message });
  }
}

async function approveHandler(request, reply) {
  try {
    const { requestId } = request.params;
    const { adminId } = request.body; // from super_admin session
    const result = await approvePaidSubscriptionRequest(requestId, adminId);
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
    const result = await rejectPaidSubscriptionRequest(requestId, adminId, rejectionReason);
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