const db = require('../models');
const List = db.list;
const { resolve500Error } = require('./validation');

exports.fetchAndSaveListInReq = async (req, res, next) => {
  try {
    const list = await List.findById(req.params.listid);

    req.fetchedList = list || null;

    next();
  } catch (err) {
    resolve500Error(err);
  }
};

exports.isListBelongToUser = async (req, res, next) => {
  try {
    const list = req.fetchedList || await List.findById(req.params.listid);

    if (!list) {
      return res.status(410).send({ message: 'This list doesn\'t exist' });
    } else if (list.userId !== req.userId) {
      return res.status(403).send({ message: 'You are not allowed to change this list' });
    }

    next();
  } catch (err) {
    resolve500Error(err);
  }
};

exports.isListExist = async (req, res, next) => {
  try {
    const listId = req.params.listid || req.params.id;
    const list = req.fetchedList || await List.findById(listId);

    if (!list) {
      return res.status(410).send({ message: 'This list doesn\'t exist' });
    }

    if (list.deletedAt) {
      return res.status(410).send({ message: 'This list is deleted' });
    }

    next();
  } catch (err) {
    resolve500Error(err);
  }
};
