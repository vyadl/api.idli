const { authJwt } = require('../middlewares');
const controller = require('../controllers/search.controller');

module.exports = function(app) {
  app.get(
    '/api/search/:query',
    [authJwt.verifyToken],
    controller.getItemsAndListsBySearch,
  );
};
