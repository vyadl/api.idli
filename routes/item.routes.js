const { authJwt, verifyListUpdate, validation } = require('./../middlewares');
const controller = require('./../controllers/item.controller');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, ContentType, Accept',
    );
    next();
  });

  app.post(
    '/api/item/add/:listid',
    [
      authJwt.verifyToken,
      verifyListUpdate.isListBelongToUser,
    ],
    controller.addItem,
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
    '/api/item/delete/:listid/:id',
    [
      authJwt.verifyToken,
      verifyListUpdate.isListBelongToUser,
    ],
    controller.deleteItem,
  );
};
