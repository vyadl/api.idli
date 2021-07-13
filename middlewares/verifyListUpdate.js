const db = require('../models');
const List = db.list;

exports.isListBelongToUser = (req, res, next) => {
  List.findOne({ _id: req.params.listid }).exec((err, list) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

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
