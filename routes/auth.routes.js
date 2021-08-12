const { body } = require('express-validator');
const { verifySignUp, validation } = require('./../middlewares');
const controller = require('../controllers/auth.controller');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, ContentType, Accept',
    );
    next();
  });

  app.post(
    '/api/auth/signup',
    [
      body('email').exists().isString(),
      body('username').exists().isString(),
      body('password').exists().isString(),
      validation.verifyBasicValidation,
      verifySignUp.checkDuplicationUsernameOrEmail,
      verifySignUp.checkIsEveryRoleExisted,
    ],
    controller.signup,
  )

  app.post(
    '/api/auth/signin',
    controller.signin,
  );
};
