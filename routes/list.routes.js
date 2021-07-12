const { authJwt, verifyListUpdate } = require('./../middlewares');
const controller = require('./../controllers/list.controller');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, ContentType, Accept',
    );
    next();
  });

  app.get('/api/list/get/:id', controller.getList);

  app.post(
    '/api/list/new',
    [
      authJwt.verifyToken,
    ],
    controller.addList,
  );

  // app.update(
  //   '/api/list/update/:id',
  //   [
  //     authJwt.verifyToken,
  //     verifyListUpdate.isListBelongToUser,
  //   ],
  // controller.updateList,
  // );

  app.delete(
    '/api/list/delete/:id',
    [
      authJwt.verifyToken,
      verifyListUpdate.isListBelongToUser,
    ],
    controller.updateList,
  );
};
