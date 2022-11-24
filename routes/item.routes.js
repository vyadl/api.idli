const { body, param, oneOf } = require('express-validator');
const { authJwt, verifyList, validation, verifyPrivacy } = require('./../middlewares');
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
    '/api/item/:id',
    [
      param('id').exists().isString(),
      validation.verifyBasicValidation,
      verifyPrivacy.saveIsItemPrivateInReq,
      authJwt.verifyTokenIfNotPublic,
    ],
    controller.getItem,
  );

  app.post(
    '/api/item/add/:listid',
    [
      authJwt.verifyToken,
      body('title').exists().isString(),
      body('details').if(body('details').exists()).isString(),
      validation.verifyBasicValidation,
      verifyList.isListBelongToUser,
      verifyList.isListExist,
    ],
    controller.addItem,
  );

  app.post(
    '/api/items/add-many/:listid',
    // here "-many" was added for easier recognizing and preventing confusing
    [
      authJwt.verifyToken,
      body('items').exists().isArray({ min: 1 }),
      validation.verifyBasicValidation,
      verifyList.isListBelongToUser,
      verifyList.isListExist,
    ],
    controller.addManyItems,
  );

  app.patch(
    '/api/item/update/:listid/:id',
    [
      authJwt.verifyToken,
      param('listid').isString(),
      body('details').if(body('details').exists()).isString(),
      body('tags').if(body('tags').exists()).isArray(),
      body('relatedItems')
        .if(
            body('relatedItems').exists({checkFalsy: true})
          )
        .isArray()
        .custom((value) => value.every(item => typeof item === 'string')),
      body('relatedLists')
        .if(
            body('relatedLists').exists({checkFalsy: true})
          )
        .isArray()
        .custom((value) => value.every(item => typeof item === 'string')),
      oneOf([
        body('title').exists(),
        body('details').exists(),
        body('category').exists(),
        body('tags').exists(),
        body('relatedItems').exists(),
        body('relatedLists').exists(),
      ], 'At least one field to change is required (title, details, category, tags, related items, related lists)'),
      validation.verifyBasicValidation,
      verifyList.fetchAndSaveListInReq,
      verifyList.isListBelongToUser,
      verifyList.isListExist,
    ],
    controller.updateItem,
  );

  app.delete(
    '/api/item/delete/:listid/:id',
    [
      authJwt.verifyToken,
      verifyList.fetchAndSaveListInReq,
      verifyList.isListBelongToUser,
      verifyList.isListExist,
    ],
    controller.softDeleteItem,
  );

  app.patch(
    '/api/item/restore/:listid/:id',
    [
      authJwt.verifyToken,
      verifyList.isListBelongToUser,
    ],
    controller.restoreItem,
  );

  app.get(
    '/api/items/deleted',
    [authJwt.verifyToken],
    controller.getDeletedItems,
  );

  app.delete(
    '/api/item/hard-delete/:listid/:id',
    [
      authJwt.verifyToken,
      verifyList.isListBelongToUser,
    ],
    controller.hardDeleteItem,
  );

  app.delete(
    '/api/item/hard-delete/:listid/:id',
    [
      authJwt.verifyToken,
      verifyList.isListBelongToUser,
    ],
    controller.hardDeleteItem,
  );

  app.delete(
    '/api/item/hard-delete-all',
    [
      authJwt.verifyToken,
    ],
    controller.hardDeleteAllItems,
  );

  app.patch(
    '/api/item/restore-all',
    [
      authJwt.verifyToken,
    ],
    controller.restoreAllItems,
  );
};
