const { body } = require('express-validator');
const { verifySignUp, validation, authJwt } = require('./../middlewares');
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
    '/api/auth/signup-validate',
    [
      body('email').exists().isString().notEmpty(),
      body('username').exists().isString().notEmpty(),
      validation.verifyBasicValidation,
      verifySignUp.checkDuplicationUsernameOrEmail,
      verifySignUp.checkAsperandInUsername,
    ],
    controller.validateEmailForSignUp,
  );

  app.post(
    '/api/auth/signup',
    [
      body('email').exists().isString().notEmpty(),
      body('username').exists().isString().notEmpty(),
      body('password').exists().isString().notEmpty(),
      body('validationCode').exists().isString().notEmpty(),
      validation.verifyBasicValidation,
      verifySignUp.checkValidationCode,
      verifySignUp.checkDuplicationUsernameOrEmail,
      verifySignUp.checkAsperandInUsername,
      verifySignUp.checkIsEveryRoleExisted,
    ],
    controller.signup,
  );

  app.post(
    '/api/auth/signin',
    [
      body('password').exists().isString().notEmpty(),
      body('fingerprint').exists().isString().notEmpty(),
      validation.verifyBasicValidation,
    ],
    controller.signin,
  );

  app.post(
    '/api/auth/refresh',
    [
      body('accessToken').exists().isString().notEmpty(),
      body('refreshToken').exists().isString().notEmpty(),
      body('fingerprint').exists().isString().notEmpty(),
      validation.verifyBasicValidation,
    ],
    controller.refresh,
  );

  app.post(
    '/api/auth/change-password',
    [
      authJwt.verifyToken,
      body('email').exists().isString().notEmpty(),
      body('currentPassword').exists().isString().notEmpty(),
      body('newPassword').exists().isString().notEmpty(),
      body('accessToken').exists().isString().notEmpty(),
      body('refreshToken').exists().isString().notEmpty(),
      body('fingerprint').exists().isString().notEmpty(),
      body('isLogoutFromAllDevices').exists().isBoolean(),
      validation.verifyBasicValidation,
    ],
    controller.changePassword,
  );

  app.post(
    '/api/auth/request-reset-password',
    [
      body('email').exists().isString().notEmpty(),
      validation.verifyBasicValidation,
    ],
    controller.requestResetPassword,
  );

  app.post(
    '/api/auth/reset-password',
    [
      body('email').exists().isString().notEmpty(),
      body('code').exists().isString().notEmpty(),
      body('password').exists().isString().notEmpty(),
      validation.verifyBasicValidation,
    ],
    controller.resetPassword,
  );

  app.post(
    '/api/auth/logout',
    [
      body('userId').exists().isString().notEmpty(),
      body('accessToken').exists().isString().notEmpty(),
      body('refreshToken').exists().isString().notEmpty(),
      body('fingerprint').exists().isString().notEmpty(),
      body('mode').exists().isString().notEmpty(),
      validation.verifyBasicValidation,
    ],
    controller.logout,
  );
};
