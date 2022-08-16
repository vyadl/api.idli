const db = require('../models');
const User = db.user;
const List = require('./../models/list.model');
const Item = require('./../models/item.model');
const { resolve500Error } = require('./../middlewares/validation');
const {
  deleteRelatedAndReferringRecordsForItem,
  deleteRelatedAndReferringRecordsForBatchItemsDeleting,
  handleChangingRelatedRecords,
} = require('./actions/relatedRecords.actions');
const { toObjectId } = require('./../utils/databaseUtils');

const VALID_KEYS_FOR_UPDATE = [
  'title',
  'details',
  'tags',
  'category',
  'relatedItems',
  'relatedLists',
];

exports.getItem = async (req, res) => {
  try {
    const itemRequest = Item.findById(req.params.id);
    const item = await itemRequest;

    if (!item) {
      return res.status(410).send({ message: 'The item doesn\'t exist' });
    }

    const list = await List.findById(item.listId);

    if (!list) {
      return res.status(410).send({ message: 'This list doen\'t exist' });
    }

    const user = await User.findById(list.userId);

    if (!user) {
      return res.status(410).send({ message: 'User was not found' });
    }

    if (list.isPrivate && String(list.userId) !== String(user._id)) {
      return res.status(410).send({ message: 'The list this item belongs to is private' });
    }

    if (user.deletedAt) {
      return res.status(410).send({ message: 'User with this item was deleted' });
    }

    const populatedItem = await itemRequest.populate([{
      path: 'relatedItems',
      model: Item,
    },
    {
      path: 'relatedLists',
      model: List,
    },
    {
      path: 'referringItems',
      model: Item,
    }]);

    return res.status(200).send(populatedItem.itemToClientPopulated());
  } catch (err) {
    resolve500Error(err, res);
  }
};

exports.addItem = async (req, res) => {
  const { title, details, tags, category, relatedItems, relatedLists } = req.body;
  const { listid: listId } = req.params;

  if (!title) {
    res.status(400).send({ message: 'Title is required' });
  }

  if (!listId) {
    res.status(400).send({ message: 'List ID is required' });
  }

  const now = new Date();
  const item = new Item({
    listId,
    title,
    userId: req.userId,
    details: details || '',
    tags: tags || [],
    category: category || null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    relatedItems: relatedItems || null,
    relatedLists: relatedLists || null,
    referringItems: null,
  });

  try {
    List.findById(listId).exec((err, list) => {
      list.items.push(item);
      list.itemsUpdatedAt = now;

      item.save((err, item) => {
        resolve500Error(err, res);

        list.save(async (err) => {
          resolve500Error(err, res);

          if (relatedItems || relatedLists) {
            await handleChangingRelatedRecords({
              itemId: item._id,
              relatedItems,
              relatedLists,
            });
          }

          res.status(200).send(item.toClient());
        });
      });
    });
  } catch(err) {
    resolve500Error(err, res);
  }
};

exports.addManyItems = async (req, res) => {
  const { listid: listId } = req.params;
  const { items } = req.body;
  const now = new Date();
  const preparedItems = items.map(({
    title,
    details,
    tags,
    category,
    relatedItems,
    relatedLists,
  }) => ({
      listId,
      title,
      userId: req.userId,
      details: details || '',
      tags: tags || [],
      category: category || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      relatedItems: relatedItems || null,
      relatedLists: relatedLists || null,
      referringItems: null,
    })
  );

  try {
    const addedItems = await Item.insertMany(preparedItems);
    const list = await List.findById(listId);

    addedItems.forEach(({ _id }) => {
      list.items.push(_id);
    });

    list.itemsUpdatedAt = now;
    await list.save();

    await Promise.all(addedItems.map(async (item) => {
      if (item.relatedItems || item.relatedRecords) {
        await handleChangingRelatedRecords({
          item: item._id,
          relatedItems,
          relatedLists,
        });
      }
    }));

    res.status(200).send(addedItems.map(item => item.toClient()));
  } catch(err) {
    resolve500Error(err, res);
  }
};

exports.updateItem = async (req, res) => {
  const { tags, category } = req.body;

  try {
    const list = await List.findById(req.params.listid);

    if (tags?.length || category) {
      if (tags?.length) {
        if (tags.some(tag => !list.tags.some(listTag => listTag.id === +tag))) {
          return res.status(400).send({ message: 'There is no such tag in this list' });
        }
      } else if (!list.categories.some(listCategory => listCategory.id === +category)) {
        return res.status(400).send({ message: 'There is no such category in this list' });
      }
    }

    const item = await Item.findById(req.params.id);
    const now = new Date();
    const optionsForRelated = {
      itemId: item._id,
      oldRelatedItems: item.relatedItems,
      oldRelatedLists: item.relatedLists,
      relatedItems: typeof req.body.relatedItems === 'undefined'
        ? item.relatedItems
        : req.body.relatedItems,
      relatedLists: typeof req.body.relatedLists === 'undefined'
        ? item.relatedLists
        : req.body.relatedLists,
    };

    if (!item) {
      return res.status(410).send({ message: 'The item doesn\'t exist' });
    }

    Object.keys(req.body).forEach(field => {
      if (VALID_KEYS_FOR_UPDATE.includes(field)) {
        item[field] = req.body[field];
      }
    });

    item.updatedAt = now;

    const updatedItem = await item.save();

    await handleChangingRelatedRecords(optionsForRelated);

    list.itemsUpdatedAt = now;

    await list.save();

    res.status(200).send(updatedItem.toClient());
  } catch(err) {
    resolve500Error(err, res);
  }
};


exports.softDeleteItem = async (req, res) => {
  try {
    const [item, list] = await Promise.all([
      Item.findById(req.params.id),
      List.findById(req.params.listid),
    ]);
    const now = new Date();

    if (item.deletedAt) {
      return res.status(400).send({ message: 'The item is already deleted' });
    }

    item.deletedAt = now;
    list.itemsUpdatedAt = now;

    await item.save();
    await list.save();

    res.status(200).send({ message: 'The item is successfully deleted' });
  } catch(err) {
    resolve500Error(err, res);
  }
};

exports.restoreItem = (req, res) => {
  List.findById(req.params.listid)
    .exec((err, list) => {
      Item.findById(req.params.id)
        .exec((err, item) => {
          resolve500Error(err, res);

          item.deletedAt = null;

          item.save(err => {
            resolve500Error(err, res);

            res.status(200).send({
              message: 'The item is successfully restored',
              isListDeleted: !!list.deletedAt,
              listTitle: list.deletedAt ? list.title : null,
            });
          })
        });
  });
};

exports.getDeletedItems = (req, res) => {
  List.find({ userId: req.userId })
    .populate({
      path: 'items',
      model: Item,
      select: '-__v',
    })
    .exec((err, lists) => {
      resolve500Error(err, res);

      const listsFormattedForClient = lists
        .map(list => list.listToClientPopulated(true));
      const allUserItems = listsFormattedForClient.reduce((result, list) => {
          return [...result, ...list.items]
        }, []);
      const deletedItems = allUserItems.filter(item => item.deletedAt);

      res.status(200).send(deletedItems);
    }
  );
};

exports.hardDeleteItem = async (req, res) => {
  const itemId = req.params.id;

  const item = await Item.findById(itemId);

  if (!item) {
    return res.status(400).send({ message: 'The item doesn\'t exist' });
  }

  await deleteRelatedAndReferringRecordsForItem(itemId);

  item.remove(async err => {
    resolve500Error(err, res);

    List.findById(req.params.listid).exec((err, list) => {
      list.items = list.items.filter(id => String(id) !== req.params.id);

      list.save(err => {
        resolve500Error(err, res);

        res.status(200).send({ message: 'The item is successfully deleted' });
      });
    });
  });
};

exports.hardDeleteAllItems = async (req, res) => {
  try {
    const items = await Item.find({
      userId: req.userId,
      deletedAt: { $ne: null },
    });

    await deleteRelatedAndReferringRecordsForBatchItemsDeleting(items.map(item => String(item._id)));

    const itemsByLists = Object.entries(items.reduce((result, item) => {
      if (result[item.listId]) {
        result[item.listId].push(String(item._id));
      } else {
        result[item.listId] = [String(item._id)];
      }

      return result;
    }, {}));

    await Promise.all(itemsByLists.map(async ([listId, items]) => {
      await List.findById(listId).exec(async (err, list) => {
        list.items = list.items.filter(id => !items.includes(String(id)));
  
        await list.save((err) => {
          resolve500Error(err, res);
        });
      });
    }));

    await Item.deleteMany({
      userId: req.userId,
      deletedAt: { $ne: null },
    });

    res.status(200).send({ message: 'All items are permanently deleted' });
  } catch(err) {
    resolve500Error(err, res);
  }
};

exports.restoreAllItems = async (req, res) => {
  try {
    const items = await Item.find({ userId: req.userId, deletedAt: { $ne: null } });
    const itemsListIds = items.map(item => item.listId);

    await Item.updateMany(
      { 
        userId: req.userId,
        deletedAt: { $ne: null },
      },
      {
        $set: { 'deletedAt': null },
      },
    );

    const deletedListsWithRestoredItems = await List.find({
      userId: req.userId,
      deletedAt: { $ne: null },
      _id: { $in: toObjectId(itemsListIds) },
    });
    const listsTitlesArray = deletedListsWithRestoredItems.map(list => list.title);

    res.status(200).send({
      listsTitlesArray,
      message: 'All items are successfully restored',
    })
  } catch(err) {
    resolve500Error(err, res);
  }
};
