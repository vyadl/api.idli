const db = require('../models');
const List = db.list;
const { resolve500Error } = require('./validation');

exports.isListBelongToUser = (req, res, next) => {
  List.findById(req.params.listid).exec((err, list) => {
    resolve500Error(err, res);

    if (!list) {
      return res.status(410).send({ message: 'This list doesn\'t exist' });
    } else if (list.userId !== req.userId) {
      return res.status(403).send({ message: 'You are not allowed to change this list' });
    }

    next();
  });
};

exports.isListExist = (req, res, next) => {
  const listId = req.params.listid || req.params.id;

  List.findById(listId).exec((err, list) => {
    resolve500Error(err, res);

    if (!list) {
      return res.status(410).send({ message: 'This list doesn\'t exist' });
    }

    if (list.deletedAt) {
      return res.status(410).send({ message: 'This list is deleted' });
    }

    next();
  });
};
