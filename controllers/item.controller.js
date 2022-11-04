const db = require('../models');
const User = db.user;
const List = require('./../models/list.model');
const Item = require('./../models/item.model');
const { resolve500Error, handleUserValidation } = require('./../middlewares/validation');
const { getUserId } = require('./../middlewares/authJwt');
const {
  deleteRelatedAndReferringRecordsForItem,
  deleteRelatedAndReferringRecordsForBatchItemsDeleting,
  handleChangingRelatedRecords,
  getPopulatedItemWithRelated,
} = require('./actions/relatedRecords.actions');
const { toObjectId } = require('./../utils/databaseUtils');
const { getArrayToClient } = require('./../utils/utils');

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
    const itemDbRequest = Item.findById(req.params.id);
    const item = await itemDbRequest;
    const GENERAL_ANSWER_OF_ABSENCE = 'The item doesn\'t exist';

    if (!item) {
      return res.status(410).send({ message: GENERAL_ANSWER_OF_ABSENCE });
    }

    const list = await List.findById(item.listId);

    if (!list) {
      return res.status(410).send({ message: 'This list doesn\'t exist' });
    }

    const userId = await getUserId(req);

    const isItemBelongsToRequester = String(list.userId) === userId;

    if (list.isPrivate && !isItemBelongsToRequester) {
      return res.status(410).send({ message: 'The list this item belongs to is private' });
    }

    if (item.deletedAt) {
      return res.status(410).send({
        message: isItemBelongsToRequester
          ? 'The item is in bin'
          : GENERAL_ANSWER_OF_ABSENCE
        });
    }

    if (list.deletedAt) {
      return res.status(410).send({
        message: isItemBelongsToRequester
          ? 'The list this item belongs to is in bin'
          : GENERAL_ANSWER_OF_ABSENCE
        });
    }

    const populatedItem = await getPopulatedItemWithRelated({
      itemDbRequest,
      item,
      isItemBelongsToRequester,
    });

    return res.status(200).send(populatedItem.itemToClientPopulated());
  } catch (err) {
    resolve500Error(err, res);
  }
};

exports.addItem = async (req, res) => {
  const { title, details, tags, category, relatedItems, relatedLists, temporaryId } = req.body;
  const { listid: listId } = req.params;

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
    const list = await List.findById(listId);

    list.items.push(item._id);
    list.itemsUpdatedAt = now;

    const savedItem = await item.save();
    const itemDbRequest = Item.findById(savedItem._id);

    await list.save();

    if (relatedItems || relatedLists) {
      await handleChangingRelatedRecords({
        itemId: item._id,
        relatedItems,
        relatedLists,
      });
    }

    const resultItem = {
      ...(await getPopulatedItemWithRelated({
        itemDbRequest,
        item: savedItem,
        isItemBelongsToRequester: true,
      })).toClient(),
      temporaryId,
    }

    return res.status(200).send(resultItem);
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
    const itemDbRequest = Item.findById(updatedItem._id);

    await handleChangingRelatedRecords(optionsForRelated);

    list.itemsUpdatedAt = now;

    await list.save();

    const resultItem = (await getPopulatedItemWithRelated({
      itemDbRequest,
      item: updatedItem,
      isItemBelongsToRequester: true,
    })).toClient();

    return res.status(200).send(resultItem);
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

exports.restoreItem = async (req, res) => {
  try {
    const list = await List.findById(req.params.listid);
    const item = await Item.findById(req.params.id);

    item.deletedAt = null;

    await item.save();

    return res.status(200).send({
      message: 'The item is successfully restored',
      isListDeleted: !!list.deletedAt,
      listTitle: list.deletedAt ? list.title : null,
    });
  } catch (err) {
    resolve500Error(err, res);
  }
};

exports.getDeletedItems = async (req, res) => {
  try {
    const lists = await List.find({ userId: req.userId })
      .populate([{
        path: 'items',
        model: Item,
        select: '-__v',
      }]);

    const listsFormattedForClient = lists
      .map(list => list.listToClientPopulated(true));
    const allUserItems = listsFormattedForClient.reduce((result, list) => {
        return [...result, ...list.items]
      }, []);
    const deletedItems = allUserItems.filter(item => item.deletedAt);

    return res.status(200).send(getArrayToClient(deletedItems));
  } catch (err) {
    resolve500Error(err, res);
  }
};

exports.hardDeleteItem = async (req, res) => {
  try {
    const itemId = req.params.id;

    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(400).send({ message: 'The item doesn\'t exist' });
    }

    await deleteRelatedAndReferringRecordsForItem(itemId);
    await item.remove();
    
    const list = await List.findById(req.params.listid);

    list.items = list.items.filter(id => String(id) !== req.params.id);

    await list.save();

    return res.status(200).send({ message: 'The item is successfully deleted' });
  } catch (err) {
    resolve500Error(err, res);
  }
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
      const list = await List.findById(listId);

      list.items = list.items.filter(id => !items.includes(String(id)));
  
      await list.save();
    }));

    await Item.deleteMany({
      userId: req.userId,
      deletedAt: { $ne: null },
    });

    return res.status(200).send({ message: 'All items are permanently deleted' });
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

    return res.status(200).send({
      listsTitlesArray,
      message: 'All items are successfully restored',
    })
  } catch(err) {
    resolve500Error(err, res);
  }
};
