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
    '/api/au/su',
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
    '/api/au/si',
    [
      body('username').exists().isString().notEmpty(),
      body('password').exists().isString().notEmpty(),
      validation.verifyBasicValidation,
    ],
    controller.signin,
  );
};
