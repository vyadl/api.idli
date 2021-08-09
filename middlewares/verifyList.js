const db = require('../models');
const List = db.list;
const { resolve500Error } = require('./validation');

exports.isListBelongToUser = (req, res, next) => {
  List.findById(req.params.listid).exec((err, list) => {
    resolve500Error(err, req, res);

    if (!list) {
      return res.status(410).send({ message: 'This list doesn\'t exist' });
    } else if (list.userId !== req.userId) {
      return res.status(403).send({ message: 'You are not allowed to change this list' });
    }

    next();
  });
};

exports.isListExist = (req, res, next) => {
  List.findById(req.params.listid).exec((err, list) => {
    resolve500Error(err, req, res);

    if (!list || list.isDeleted) {
      return res.status(410).send({ message: 'This list doesn\'t exist' });
    }

    next();
  });
};
