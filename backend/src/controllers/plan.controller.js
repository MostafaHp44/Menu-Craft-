const { getAllPlans, getPlanById, createPlan, updatePlan, deletePlan } = require('../services/plan.service');

async function listHandler(request, reply) {
  const plans = await getAllPlans();
  return reply.send({ ok: true, data: plans });
}

async function getByIdHandler(request, reply) {
  try {
    const plan = await getPlanById(request.params.id);
    return reply.send({ ok: true, data: plan });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

async function createHandler(request, reply) {
  try {
    const plan = await createPlan(request.body);
    return reply.status(201).send({ ok: true, data: plan });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

async function updateHandler(request, reply) {
  try {
    const plan = await updatePlan(request.params.id, request.body);
    return reply.send({ ok: true, data: plan });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

async function deleteHandler(request, reply) {
  try {
    await deletePlan(request.params.id);
    return reply.send({ ok: true, message: 'تم حذف الباقة' });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

module.exports = {
  listHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deleteHandler
};
