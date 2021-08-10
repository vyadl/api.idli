const db = require('../models');
const User = db.user;
const List = require('../models/list.model');
const Item = require('../models/item.model');
const { resolve500Error } = require('./../middlewares/validation');
const {
  removeDeletedTagsAndCategoriesFromItems,
  getFieldsWithIds,
} = require('./listActions/list.actions');
const { now } = require('mongoose');

exports.getListsForCurrentUser = (req, res) => {
  List.find({
    userId: req.userId,
    deletedAd: null,
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
}

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

exports.addList = (req, res) => {
  const {
    tags: reqTags,
    categories: reqCategories,
    name,
    isPrivate,
  } = req.body;
  const now = new Date();
  let tags = [];
  let categories = [];

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

  const list = new List({
    userId: req.userId,
    isPrivate: isPrivate || false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    items: [],
    name,
    tags,
    categories,
  });

  list.save((err, list) => {
    resolve500Error(err, req, res);

    res.status(200).send(list.toClient());
  });
}

exports.updateList = (req, res) => {
  List.findById(req.params.listid).exec((err, list) => {
    resolve500Error(err, req, res);

    if (list.deletedAt) {
      return res.status(410).send({ message: 'The list is deleted' });
    }
  
    const oldList = JSON.parse(JSON.stringify(list));
    const fieldsWithIds = getFieldsWithIds(req.body);

    Object.keys(fieldsWithIds).forEach((field) => {
      list[field] = fieldsWithIds[field];
    });
    list.updatedAt = new Date();
    
    list.save((err, updatedList) => {
      resolve500Error(err, req, res);

      removeDeletedTagsAndCategoriesFromItems({ list: oldList, req, res })
        .then(() => {
          List
              .findById(updatedList._id)
              .populate('items')
              .exec((err, populatedList) => {
                resolve500Error(err, req, res);

                return res.status(200).send(populatedList.listToClientPopulated());
              });
        }).catch(err => {
          resolve500Error(err, req, res);
        });
    });
  });
};

exports.softDeleteList = (req, res) => {
  List.findById(req.params.listid)
    .exec((err, list) => {
      resolve500Error(err, req, res);

      list.deletedAt = new Date();

      list.save(err => {
        resolve500Error(err, req, res);

        res.status(200).send({ message: 'The list is successfully deleted' });
      })
    });
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
