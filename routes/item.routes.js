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
      body('categories').if(body('categories').exists()).isArray(),
      body('tags').if(body('tags').exists()).isArray(),
      oneOf([
        body('text').exists(),
        body('details').exists(),
        body('categories').exists(),
        body('tags').exists(),
      ], 'At least one field to change is required (text, details, categories, tags)'),
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
