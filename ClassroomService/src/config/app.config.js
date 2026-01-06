require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  userServiceUrl: process.env.USER_SERVICE_URL || "https://localhost:8080",
  nodeEnv: process.env.NODE_ENV || 'development'
};
