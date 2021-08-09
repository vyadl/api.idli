const db = require('../models');
const User = db.user;
const List = require('./../models/list.model');
const Item = require('./../models/item.model');
const { resolve500Error } = require('./../middlewares/validation');
const VALID_KEYS_FOR_UPDATE = ['text', 'details', 'tags', 'category'];


exports.getItem = (req, res) => {
  List.findById(req.params.listid, (err, list) => {
    resolve500Error(err, req, res);

    User.findById(list.userId, (err, user) => {
      resolve500Error(err, req, res);

      if (!user) {
        return res.status(410).send({ message: 'User was not found' });
      }
  
      if (user.isDeleted) {
        return res.status(410).send({ message: 'User was deleted' });
      }

      if (list.isPrivate) {
        return res.status(410).send({ message: 'This list is private' });
      }

      Item.findById(req.params.id, (err, item) => {
        resolve500Error(err, req, res);

        if (!item) {
          return res.status(410).send({ message: 'The item doesn\'t exist' });
        }

        res.status(200).send(item.toClient());
      });
    });
  });
};

exports.addItem = (req, res) => {
  const { text, details, tags, category } = req.body;
  const { listid: listId } = req.params;

  if (!text) {
    res.status(400).send({ message: 'Text is required' });
  }

  if (!listId) {
    res.status(400).send({ message: 'List ID is required' });
  }

  const item = new Item({
    listId,
    text: text,
    details: details || '',
    tags: tags || [],
    category: category || 0,
  });

  List.findById(listId).exec((err, list) => {
    list.items.push(item);

    item.save(err => {
      resolve500Error(err, req, res);

      list.save((err, list) => {
        resolve500Error(err, req, res);
    
        res.status(200).send(item.toClient());
      });
    });
  });
}

exports.updateItem = (req, res) => {
  const { tags, category } = req.body;

  List.findById(req.params.listid, (err, list) => {
    if (tags?.length || category) {
      if (tags?.length) {
        if (tags.some(tag => !list.tags.some(listTag => listTag.id === +tag))) {
          return res.status(400).send({ message: 'There is no such tag in this list' });
        }
      } else if (!list.categories.some(category => category.id === +category)) {
        return res.status(400).send({ message: 'There is no such category in this list' });
      }
    }

    Item.findById(req.params.id, (err, item) => {
      if (!item) {
        return res.status(410).send({ message: 'The item doesn\'t exist' });
      }

      Object.keys(req.body).forEach(field => {
        if (VALID_KEYS_FOR_UPDATE.includes(field)) {
          item[field] = req.body[field];
        }
      });
  
      item.save((err, updatedItem) => {
        resolve500Error(err, req, res);
  
        res.status(200).send(updatedItem.toClient());
      });
    });
  });
}

exports.deleteItem = (req, res) => {
  Item.findByIdAndDelete(req.params.id).exec((err, result) => {
    resolve500Error(err, req, res);

    if (!result) {
      return res.status(400).send({ message: 'The item doesn\'t exist' });
    }

    List.findById(req.params.listid).exec((err, list) => {
      list.items = list.items.filter(id => String(id) !== req.params.id);


      list.save((err, list) => {
        resolve500Error(err, req, res);

        res.status(200).send({ message: 'The item is successfully deleted' });
      });
    });
  });
}
