const { body } = require('express-validator');
const { verifySignUp, validation } = require('./../middlewares');
const controller = require('../controllers/auth.controller.js');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, ContentType, Accept',
    );
    next();
  });

  app.post(
    '/ap',
    [
      body('email').exists().isString().notEmpty(),
      body('username').exists().isString().notEmpty(),
      body('password').exists().isString().notEmpty(),
      validation.verifyBasicValidation,
      verifySignUp.checkDuplicationUsernameOrEmail,
      verifySignUp.checkIsEveryRoleExisted,
    ],
    controller.signup,
  );

  app.post(
    '/apasdfasdfasdf',
    controller.signin,
  );
};
