const paymentController = require('../controllers/payment.controller');

function paymentRoutes(fastify, opts, done) {
  paymentController(fastify, opts);
  done();
}

module.exports = paymentRoutes;
