const request = require('supertest');
require('dotenv').config();
const { permanentUserName, permanentAdminName } = require('../config/test.config');
const { user: User } = require('../models');

exports.signIn = async (app, username) => {
  const { body } = await request(app)
    .post('/api/auth/signin')
    .send({
      username,
      email: `${username}@some.some`,
      password: process.env.TEST_USER_PASS,
    });

  return body;
};
