const adminRevenue = require('../services/adminRevenue.service');

function adminRoutes(fastify, opts, done) {
  fastify.get('/revenue', async (req, reply) => {
    const rid = req.params.restaurantId;
    try {
      const data = await adminRevenue.getRevenueSummary(rid);
      return reply.send({ ok: true, data });
    } catch (e) { return reply.status(500).send({ ok: false, error: e.message }); }
  });
  done();
}

module.exports = adminRoutes;
