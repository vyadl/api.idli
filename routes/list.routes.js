const { body, param, oneOf } = require('express-validator');
const { authJwt, verifyList, validation, verifyPrivacy } = require('./../middlewares');
const controller = require('./../controllers/list.controller');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, ContentType, Accept',
    );
    next();
  });

  app.get('/api/lists', [
      authJwt.verifyToken
    ],
    controller.getListsForCurrentUser,
  );

  app.post('/api/list/public-titles', [
      body('ids').exists().isArray()
    ],
    controller.getPublicTitles,
  );

  app.get('/api/list/:id', [
      verifyList.fetchAndSaveListInReq,
      verifyList.isListExist,
      verifyPrivacy.saveIsListPrivateInReq,
      authJwt.verifyTokenIfNotPublic,
    ],
    controller.getList,
  );

  app.get('/api/user/lists/:userid', [
      param('userid').isString().notEmpty(),
      validation.verifyBasicValidation,
    ],
    controller.getPublicListsByUserId,
  );

  app.post(
    '/api/list/add',
    [
      authJwt.verifyToken,
      body('title').exists().isString().notEmpty(),
      body('isPrivate').if(body('isPrivate').exists()).isBoolean(),
      validation.verifyBasicValidation,
    ],
    controller.addList,
  );

  app.patch(
    '/api/list/update/:listid',
    [
      authJwt.verifyToken,
      param('listid').isString(),
      body('isPrivate').if(body('isPrivate').exists()).isBoolean(),
      body('categories').if(body('categories').exists()).isArray(),
      body('tags').if(body('tags').exists()).isArray(),
      body('title').if(body('title').exists()).isString().notEmpty(),
      oneOf([
        body('isPrivate').exists(),
        body('categories').exists(),
        body('tags').exists(),
        body('title').exists(),
      ], 'At least one field to change is required (title, isPrivate, tags, categories)'),
      validation.verifyBasicValidation,
      verifyList.fetchAndSaveListInReq,
      verifyList.isListBelongToUser,
      verifyList.isListExist,
    ],
    controller.updateList,
  );

  app.delete(
    '/api/list/delete/:listid',
    [
      authJwt.verifyToken,
      verifyList.fetchAndSaveListInReq,
      verifyList.isListBelongToUser,
      verifyList.isListExist,
    ],
    controller.softDeleteList,
  );

  app.delete(
    '/api/list/hard-delete/:listid',
    [
      authJwt.verifyToken,
      verifyList.isListBelongToUser,
    ],
    controller.hardDeleteList,
  );

  app.patch(
    '/api/list/restore/:listid',
    [
      authJwt.verifyToken,
      verifyList.isListBelongToUser,
    ],
    controller.restoreList,
  );

  app.get(
    '/api/lists/deleted',
    [
      authJwt.verifyToken,
    ],
    controller.getDeletedLists,
  );

  app.delete(
    '/api/list/hard-delete/:listid',
    [
      authJwt.verifyToken,
      verifyList.isListBelongToUser,
    ],
    controller.hardDeleteList,
  );

  app.patch(
    '/api/list/set-order/:listid',
    [
      authJwt.verifyToken,
      verifyList.isListBelongToUser,
      param('listid').isString(),
      body('itemIds').exists().isArray(),
      validation.verifyBasicValidation,
    ],
    controller.setItemsOrder,
  );

  app.patch(
    '/api/list/restore-all',
    [
      authJwt.verifyToken,
    ],
    controller.restoreAllLists,
  );

  app.delete(
    '/api/list/hard-delete-all',
    [
      authJwt.verifyToken,
    ],
    controller.hardDeleteAllLists,
  );
};
