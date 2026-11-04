const fastify = require("./src/app");
console.log("App module loaded successfully");
console.log("NODE_ENV was:", process.env.NODE_ENV || "undefined");
console.log("JWT_ACCESS_SECRET was:", process.env.JWT_ACCESS_SECRET || "undefined");
console.log("JWT_REFRESH_SECRET was:", process.env.JWT_REFRESH_SECRET || "undefined");
console.log("CORS_ORIGIN was:", process.env.CORS_ORIGIN || "undefined");