const { authJwt, validation } = require('./../middlewares');
const { verifySignUp } = require('./../middlewares');
const controller = require('../controllers/admin.controller');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, ContentType, Accept',
    );
    next();
  });

  app.delete(
    '/api/users/hard-delete/:id',
    [
      authJwt.verifyToken,
      authJwt.isAdmin,
    ],
    controller.hardDeleteUser,
  );

  app.delete(
    '/api/users/delete/:id',
    [
      authJwt.verifyToken,
      authJwt.isAdmin,
    ],
    controller.softDeleteUser,
  );
}