const mongoose = require('mongoose');
const db = require('../models');
const User = db.user;
const List = require('../models/list.model');
const Item = require('../models/item.model');
const { resolve500Error } = require('./../middlewares/validation');
const {
  removeDeletedTagsAndCategoriesFromItems,
  getFieldsWithIds,
} = require('./actions/list.actions');
const { list } = require('../models');

exports.setOrderOfItems = async (req, res) => {
  const { listid: listId } = req.params;
  const { itemIds } = req.body;
  const now = new Date();

  try {
    const list = await List.findById(listId);
    const oldItemIdsSorted = [...list.items].sort().map(item => item.toString());
    const newItemIdsSorted = [...itemIds].sort();
    const isValidItemIdsArray = oldItemIdsSorted.every((itemId, i) => itemId === newItemIdsSorted[i]);

    if (!isValidItemIdsArray) {
      return res.status(400).send({ message: 'There are not correct items' });
    }

    list.items = itemIds.map(itemId => (mongoose.Types.ObjectId(itemId)));
    list.itemsUpdatedAt = now;

    await list.save();
    
    const populatedList = await List.findById(listId).populate('items');

    res.status(200).send(populatedList.listToClientPopulated());
  } catch(err) {
    resolve500Error(err, req, res);
  }
};

exports.getListsForCurrentUser = (req, res) => {
  List.find({
    userId: req.userId,
    deletedAt: null,
  }).exec((err, lists) => {
    resolve500Error(err, req, res);

    const finalLists = lists.map(list => list.toClient());

    res.status(200).send(finalLists);
  });
}

exports.getPublicListsByUserId = (req, res) => {
  User.findById(req.params.userid, (err, user) => {
    if (!user) {
      return res.status(410).send({ message: 'User was not found' });
    }

    if (user.deletedAt) {
      return res.status(410).send({ message: 'User was deleted' });
    }

    List.find({
      userId: req.params.userid,
      isPrivate: false,
      deletedAt: null,
    }, (err, lists) => {
      resolve500Error(err, req, res);

      const finalLists = lists.map(list => list.toClient());

      res.status(200).send(finalLists);
    });
  });
};

exports.getList = (req, res) => {
  List.findById(req.params.id)
    .populate('items', '-__v')
    .exec((err, list) => {
      resolve500Error(err, req, res);

      if (!list) {
        return res.status(404).send({ message: 'List doesn\'t exist' });
      }

      if (list.deletedAt) {
        return res.status(410).send({ message: 'The list is deleted' });
      }

      if (!list.isPrivate) {
        res.status(200).send(list.listToClientPopulated());
      } else {
        if (!req.userId || req.userId !== list.userId) {
          res.status(400).send({ message: 'List is private' });
        } else {
          return res.status(200).send(list.listToClientPopulated());
        }
      }
  });
}

exports.addList = async (req, res) => {
  const {
    tags: reqTags,
    categories: reqCategories,
    title,
    isPrivate,
  } = req.body;
  const now = new Date();
  const isListWithSameTitleExist = !!(await List.find({
    title,
    userId: req.userId,
    deletedAt: null,
  })).length;
  let tags = [];
  let categories = [];

  if (isListWithSameTitleExist) {
    return res.status(400).send({ message: 'You already have a list with this title' });
  }

  if (!(reqTags.length && reqTags[0].id === null)) {
  // if ids for tags and categories are predefined (it happens with test-data)
  // we don't go in this condition
    if (reqTags?.length) {
      tags = reqTags.map((tag, i) => {
        tag.id = i;

        return tag;
      });
    }

    if (reqCategories?.length) {
      categories = reqCategories.map((category, i) => {
        category.id = i;

        return category;
      });
    }
  }

  const list = new List({
    userId: req.userId,
    isPrivate: isPrivate || false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    itemsUpdatedAt: now,
    items: [],
    title,
    tags,
    categories,
  });

  try {
    const savedList = await list.save();

    return res.status(200).send(savedList.toClient());
  } catch (err) {
    resolve500Error(err, req, res);
  }
}

exports.updateList = async (req, res) => {
  const isListWithSameTitleExist = !!(await List.find({
    title: req.body.title,
    userId: req.userId,
    deletedAt: null,
    _id: { $ne: req.params.listid },
  })).length;

  if (isListWithSameTitleExist) {
    return res.status(400).send({ message: 'You already have a list with this title' });
  }

  try {
    const list = await List.findById(req.params.listid);

    if (list.deletedAt) {
      return res.status(410).send({ message: 'The list is deleted' });
    }

    if (list.deletedAt) {
      return res.status(410).send({ message: 'The list is deleted' });
    }
  
    const oldList = JSON.parse(JSON.stringify(list));
    const fieldsWithIds = getFieldsWithIds(req.body);

    Object.keys(fieldsWithIds).forEach((field) => {
      list[field] = fieldsWithIds[field];
    });
    list.updatedAt = new Date();

    const updatedList = await list.save();

    await removeDeletedTagsAndCategoriesFromItems({ list: oldList, req, res });

    const populatedList = await List.findById(updatedList._id).populate('items');

    return res.status(200).send(populatedList.listToClientPopulated());
  } catch(err) {
    resolve500Error(err, req, res);
  }
};

exports.softDeleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.listid);

    list.deletedAt = new Date();

    await list.save();
    
    res.status(200).send({ message: 'The list is successfully deleted' });
  } catch(err) {
    resolve500Error(err, req, res);
  }
};

exports.restoreList = (req, res) => {
  List.findById(req.params.listid)
    .exec((err, list) => {
      resolve500Error(err, req, res);

      list.deletedAt = null;

      list.save(err => {
        resolve500Error(err, req, res);

        res.status(200).send({ message: 'The list is successfully restored' });
      })
    });
};

exports.getDeletedLists = (req, res) => {
  List.find({
    userId: req.userId,
    deletedAt: { $ne: null },
  })
    .exec((err, lists) => {
      resolve500Error(err, req, res);

      const finalLists = lists.map(list => list.toClient());

      res.status(200).send(finalLists);
    });
};

exports.hardDeleteList = (req, res) => {
  List.findById(req.params.listid)
    .exec((err, list) => {
      resolve500Error(err, req, res);

      Item.deleteMany({ _id: { $in: list.items }}, (err, result) => {
        list.remove((err, result) => {
          resolve500Error(err, req, res);

          res.status(200).send({ message: 'The list is successfully deleted' });
        })
      });
    });
};
