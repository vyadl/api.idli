const { body, param, oneOf } = require('express-validator');
const { authJwt, verifyListUpdate, validation } = require('./../middlewares');
const controller = require('./../controllers/list.controller');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, ContentType, Accept',
    );
    next();
  });

  app.get('/api/lists', [authJwt.verifyToken], controller.getListsForCurrentUser);

  app.get('/api/list/:id', [authJwt.getUserId], controller.getList);

  app.get('/api/user/lists/:userid', [
      param('userid').isString(),
      validation.verifyBasicValidation,
    ],
    controller.getPublicListsByUserId,
  );

  app.post(
    '/api/list/add',
    [
      body('name').exists().isString(),
      body('isPrivate').if(body('isPrivate').exists()).isBoolean(),
      validation.verifyBasicValidation,
      authJwt.verifyToken,
    ],
    controller.addList,
  );

  app.patch(
    '/api/list/update/:listid',
    [
      param('listid').isString(),
      body('isPrivate').if(body('isPrivate').exists()).isBoolean(),
      body('categories').if(body('categories').exists()).isArray(),
      body('tags').if(body('tags').exists()).isArray(),
      body('name').if(body('name').exists()).isString(),
      oneOf([
        body('isPrivate').exists(),
        body('categories').exists(),
        body('tags').exists(),
        body('name').exists(),
      ], 'At least one field to change is required (name, isPrivate, tags, categories, name)'),
      validation.verifyBasicValidation,
      authJwt.verifyToken,
      verifyListUpdate.isListBelongToUser,
    ],
    controller.updateList,
  );

  app.delete(
    '/api/list/delete/:listid',
    [
      authJwt.verifyToken,
      verifyListUpdate.isListBelongToUser,
    ],
    controller.deleteList,
  );
};
