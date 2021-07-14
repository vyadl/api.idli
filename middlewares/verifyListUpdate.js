const db = require('../models');
const List = db.list;
const { resolve500Error } = require('./../middlewares/validation');

exports.isListBelongToUser = (req, res, next) => {
  List.findOne({ _id: req.params.listid }).exec((err, list) => {
    resolve500Error(err, req, res);

    if (!list) {
      res.status(410).send({ message: 'This list doesn\'t exist' });
      return;
    } else if (list.userId !== req.userId) {
      res.status(403).send({ message: 'You are not allowed to change this list' });
      return;
    }

    next();
  });
}
