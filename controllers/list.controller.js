const { validationResult } = require('express-validator');
const config = require('../config/auth.config');
const db = require('../models');
const User = db.user;
const Role = db.role;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const List = require('../models/list.model');
const Item = require('../models/item.model');
const { resolve500Error } = require('./../middlewares/validation');
const {
  removeDeletedTagsAndCategoriesFromItems,
  getFinalFieldsForList,
} = require('./listActions/list.actions');

exports.getListsForCurrentUser = (req, res) => {
  List.find({ userId: req.userId })
    .exec((err, lists) => {
      resolve500Error(err, req, res);

      res.status(200).send({ lists });
    });
}

exports.getPublicListsByUserId = (req, res) => {
  User.findById(req.params.userid, (err, user) => {
    if (!user) {
      return res.status(410).send({ message: 'User was not found' });
    }

    if (user.isDeleted) {
      return res.status(410).send({ message: 'User was deleted' });
    }

    List.find({
      userId: req.params.userid,
      isPrivate: false,
    }, (err, lists) => {
      resolve500Error(err, req, res);

      finalLists = lists.map(list => list.toClient());

      res.status(200).send({ lists: finalLists });
    });
  });
}

exports.getList = (req, res) => {
  const listId = req.params.id;

  List.findById(listId)
    .populate('items', '-__v')
    .exec((err, list) => {
      resolve500Error(err, req, res);

      if (!list) {
        return res.status(404).send({ message: 'List doesn\'t exist' });
      }

      if (!list.isPrivate) {
        res.status(200).send({ list: list.toClient() });
      } else {
        if (!req.userId) {
          res.status(400).send({ message: 'List is private' });
        } else if (req.userId !== list.userId) {
          return res.status(400).send({ message: 'List is private 2' });
        } else {
          return res.status(200).send({ list: list.toClient() });
        }
      }
  });
}

exports.addList = (req, res) => {
  let tags = [];
  let categories = [];

  if (req.body.tags?.length) {
    tags = req.body.tags.map((tag, i) => {
      tag.id = String(i);

      return tag;
    });
  }

  if (req.body.categories?.length) {
    categories = req.body.categories.map((category, i) => {
      category.id = i;

      return category;
    });
  }

  const list = new List({
    userId: req.userId,
    name: req.body.name,
    isPrivate: req.body.isPrivate || false,
    items: [],
    tags,
    categories,
  });

  list.save((err, list) => {
    resolve500Error(err, req, res);

    res.status(200).send({ list: list.toClient() });
  });
}

exports.updateList = (req, res) => {
  List.findById(req.params.listid).exec((err, list) => {
    resolve500Error(err, req, res);
  
    const oldList = JSON.parse(JSON.stringify(list));
    const finalFieldsForList = getFinalFieldsForList(req.body);

    Object.keys(finalFieldsForList).forEach((field) => {
      list[field] = finalFieldsForList[field];
    });
    
    list.save((err, updatedList) => {
      resolve500Error(err, req, res);

      removeDeletedTagsAndCategoriesFromItems({ list: oldList, req, res }).then(() => {
        List
            .findById(updatedList._id)
            .populate('items', '-__v')
            .exec((err, populatedList) => {
              resolve500Error(err, req, res);
  
              return res.status(200).send({ list: populatedList.toClient() });
            });
      }).catch(err => {
        resolve500Error(err, req, res);
      });
    });
  });
};

exports.deleteList = (req, res) => {
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
}
