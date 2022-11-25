const db = require('../models');
const List = db.list;
const Item = db.item;
const { resolve500Error } = require('./validation');

exports.saveIsListPrivateInReq = async (req, res, next) => {
  try {
    const list = req.fetchedList || await List.findById(req.params.listid);

    if (list) {
      req.isPrivateRequest = list.isPrivate;

      next();
    } else {
      return res.status(410).send({ message: 'This list doesn\'t exist' });
    }
  } catch (err) {
    resolve500Error(err);
  }
};

exports.saveIsItemPrivateInReq = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (item && !item.deletedAt) {
      const list = await List.findById(item.listId);

      req.isPrivateRequest = list.isPrivate;

      next();
    } else {
      return res.status(410).send({ message: 'This item doesn\'t exist' });
    }
  } catch (err) {
    resolve500Error(err);
  }
};
