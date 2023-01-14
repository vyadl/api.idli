const mongoose = require('mongoose');

module.exports = mongoose.model(
  'Session',
  new mongoose.Schema({
    userId: String,
    email: String,
    fingerprint: String,
    accessToken: String,
    refreshToken: String,
    refreshExpiredAt: String,
    createdAt: String,
  }),
);
