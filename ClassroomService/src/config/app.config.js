require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4000,
  userServiceUrl: process.env.USER_SERVICE_URL || "http://localhost:8080",
  nodeEnv: process.env.NODE_ENV || 'development'
};
