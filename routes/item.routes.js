const { body, param, oneOf } = require('express-validator');
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

  app.get(
    '/api/item/:listid/:id',
    [
      param('listid').exists().isString(),
      param('id').exists().isString(),
      validation.verifyBasicValidation,
    ],
    controller.getItem,
  );

  app.post(
    '/api/item/add/:listid',
    body('text').exists().isString(),
    body('details').if(body('details').exists()).isString(),
    validation.verifyBasicValidation,
    [
      authJwt.verifyToken,
      verifyListUpdate.isListBelongToUser,
    ],
    controller.addItem,
  );

  app.patch(
    '/api/item/update/:listid/:id',
    [
      param('listid').isString(),
      body('text').if(body('text').exists()).isString(),
      body('details').if(body('details').exists()).isString(),
      body('tags').if(body('tags').exists()).isArray(),
      oneOf([
        body('text').exists(),
        body('details').exists(),
        body('category').exists(),
        body('tags').exists(),
      ], 'At least one field to change is required (text, details, category, tags)'),
      validation.verifyBasicValidation,
      authJwt.verifyToken,
      verifyListUpdate.isListBelongToUser,
    ],
    controller.updateItem,
  );

  app.delete(
    '/api/item/delete/:listid/:id',
    [
      authJwt.verifyToken,
      verifyListUpdate.isListBelongToUser,
    ],
    controller.deleteItem,
  );
};
