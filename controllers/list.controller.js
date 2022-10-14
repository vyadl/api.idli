const db = require('../models');
const User = db.user;
const List = require('../models/list.model');
const Item = require('../models/item.model');
const { resolve500Error, handleUserValidation } = require('./../middlewares/validation');
const { getUserId } = require('./../middlewares/authJwt');
const {
  removeDeletedTagsAndCategoriesFromItems,
  getFieldsWithIds,
} = require('./actions/list.actions');
const {
  deleteRelatedAndReferringRecordsForBatchItemsDeleting,
  deleteReferringItemsforBatchListDeleting,
  deleteReferringItemsInDeletingList,
} = require('./actions/relatedRecords.actions');
const { getFormattedDate, getArrayToClient } = require('./../utils/utils');
const { toObjectId } = require('./../utils/databaseUtils');

exports.setItemsOrder = async (req, res) => {
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

    // list.items = itemIds.map(itemId => (mongoose.Types.ObjectId(itemId)));
    list.itemsUpdatedAt = now;

    await list.save();

    const populatedList = await List.findById(listId).populate([{
      path: 'items',
      model: Item,
    },
    {
      path: 'referringItems',
      model: Item,
    }]);

    res.status(200).send(populatedList.listToClientPopulated());
  } catch(err) {
    resolve500Error(err, res);
  }
};

exports.getListsForCurrentUser = async (req, res) => {
  try {
    const lists = await List.find({
      userId: req.userId,
      deletedAt: null,
    });

    return res.status(200).send(getArrayToClient(lists));
  } catch (err) {
    resolve500Error(err, res);
  }
}

exports.getPublicListsByUserId = async (req, res) => {
  try {
    const user = await User.findById(req.params.userid);
    
    handleUserValidation(user, res);

    const lists = List.find({
      userId: req.params.userid,
      isPrivate: false,
      deletedAt: null,
    });

    return res.status(200).send(getArrayToClient(lists));
  } catch (err) {
    resolve500Error(err, res);
  }
};

exports.getList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id).populate([{
      path: 'items',
      model: Item,
    },
    {
      path: 'referringItems',
      model: Item,
    }]);

    const userId = await getUserId(req, res);
    const isListBelongToUser = String(list.userId) === userId;


    if (list.isPrivate && !isListBelongToUser) {
      return res.status(400).send({ message: 'List is private' });
    }

    res.status(200).send(list.listToClientPopulated());
  } catch (err) {
    resolve500Error(err, res);
  }
}

exports.getPublicTitles = async (req, res) => {
  const { ids } = req.body;

  const lists = await List.find({
    _id: { $in: toObjectId(ids) },
    deletedAt: null,
    isPrivate: false,
  });

  if (!lists.length) {
    return res.status(400).send({ message: 'There is no public lists with these ids' });
  }

  const titles = lists.reduce((result, list) => {
    result[list._id] = list.title;

    return result;
  }, {});

  return res.status(200).send({ titles });
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
    resolve500Error(err, res);
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
  
    const oldList = JSON.parse(JSON.stringify(list));
    const fieldsWithIds = getFieldsWithIds(req.body);

    Object.keys(fieldsWithIds).forEach((field) => {
      list[field] = fieldsWithIds[field];
    });
    list.updatedAt = new Date();

    const updatedList = await list.save();

    await removeDeletedTagsAndCategoriesFromItems({ list: oldList, req, res });

    const populatedList = await List.findById(updatedList._id).populate([{
      path: 'items',
      model: Item,
    },
    {
      path: 'referringItems',
      model: Item,
    }]);

    return res.status(200).send(populatedList.listToClientPopulated());
  } catch(err) {
    resolve500Error(err, res);
  }
};

exports.softDeleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.listid);

    list.deletedAt = new Date();

    await list.save();
    
    return res.status(200).send({ message: 'The list is successfully deleted' });
  } catch(err) {
    resolve500Error(err, res);
  }
};

exports.restoreList = async (req, res) => {
  try {
    const listForRestore = await List.findById(req.params.listid);
    const isListWithSameTitleExist = !!(await List.find({
      userId: req.userId,
      title: listForRestore.title,
      deletedAt: null,
    })).length;

    listForRestore.deletedAt = null;

    if (isListWithSameTitleExist) {
      listForRestore.title =
        `${listForRestore.title} (restored at ${getFormattedDate(new Date())})`;
    }

    await listForRestore.save();

    return res.status(200).send({ message: 'The list is successfully restored' });
  } catch(err) {
    resolve500Error(err, res);
  }
};

exports.getDeletedLists = async (req, res) => {
  try {
    const lists = await List.find({
      userId: req.userId,
      deletedAt: { $ne: null },
    });

    return res.status(200).send(getArrayToClient(lists));
  } catch (err) {
    resolve500Error(err, res);
  }
};

exports.hardDeleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.listid);

    await deleteRelatedAndReferringRecordsForBatchItemsDeleting(list.items.map(id => String(id)));
    await deleteReferringItemsInDeletingList(list._id);
    await Item.deleteMany({ _id: { $in: toObjectId(list.items) }});
    await list.remove();

    return res.status(200).send({ message: 'The list is successfully deleted' });
  } catch (err) {
    resolve500Error(err, res);
  }
};

exports.hardDeleteAllLists = async (req, res) => {
  try {
    const lists = await List.find({
      userId: req.userId,
      deletedAt: { $ne: null },
    });

    itemsForDeleting = lists.reduce((result, list) => [...result, ...list.items], []);

    await deleteRelatedAndReferringRecordsForBatchItemsDeleting(itemsForDeleting.map(id => String(id)));
    await deleteReferringItemsforBatchListDeleting(lists.map(list => String(list._id)));
    
    await Item.deleteMany({ _id: { $in: toObjectId(itemsForDeleting) }});
    await List.deleteMany({
      userId: req.userId,
      deletedAt: { $ne: null },
    });

    return res.status(200).send({ message: 'All lists are permanently deleted' })
  } catch(err) {
    resolve500Error(err, res);
  }
};

exports.restoreAllLists = async(req, res) => {
  try {
    await List.updateMany(
      { 
        userId: req.userId,
        deletedAt: { $ne: null },
      },
      {
        $set: { 'deletedAt': null },
      }
    );

    res.status(200).send({ message: 'All lists are successfully restored' })
  } catch(err) {
    resolve500Error(err, res);
  }
};
