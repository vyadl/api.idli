const controller = require('../controllers/mascot.controller');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, ContentType, Accept',
    );
    next();
  });

  app.get(
    '/api/mascot-list-titles',
    controller.getMascotListIdsTitles,
  );
};
