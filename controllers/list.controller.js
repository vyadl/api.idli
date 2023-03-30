const mongoose = require('mongoose');
const db = require('../models');
const User = db.user;
const List = require('../models/list.model');
const Item = require('../models/item.model');
const { resolve500Error, handleUserValidation } = require('./../middlewares/validation');
const {
  removeDeletedTagsAndCategoriesFromItems,
  deleteListIdsFromOriginListsForBatchDeleting,
  getFieldsWithIds,
  deleteChildrenLists,
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
    const list = await List
      .findById(listId)
      .populate({
        path: 'items',
        model: Item,
      });
    const deletedItemIds = list.items
      .filter(item => item.deletedAt)
      .map(item => item._id.toString());
    const oldItemIdsSorted = list.items
      .filter(item => !item.deletedAt)
      .map(item => item._id.toString())
      .sort();
    const newItemIdsSorted = [...itemIds]
      .sort();
    const isValidItemIdsArray = oldItemIdsSorted
      .every((itemId, i) => itemId === String(newItemIdsSorted[i]));

    if (!isValidItemIdsArray) {
      return res.status(400).send({ message: 'There are not correct items' });
    }

    list.items = [
      ...itemIds,
      ...deletedItemIds,
    ];
    list.itemsUpdatedAt = now;

    await list.save();

    const populatedList = await List
      .findById(listId)
      .populate([{
        path: 'items',
        model: Item,
      }])
      .select(['items', '_id', 'updatedAt', 'itemsUpdatedAt', '__v']);

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
    }, { items: 0 });

    return res.status(200).send(getArrayToClient(lists));
  } catch (err) {
    resolve500Error(err, res);
  }
}

exports.getPublicListsByUserId = async (req, res) => {
  try {
    const user = await User.findById(req.params.userid);
    
    handleUserValidation(user, res);

    const lists = await List.find({
      userId: req.params.userid,
      isPrivate: false,
      deletedAt: null,
    }, { items: 0 });

    return res.status(200).send(getArrayToClient(lists));
  } catch (err) {
    resolve500Error(err, res);
  }
};

exports.getList = async (req, res) => {
  try {
    const { noItems, noLists, noReferringItems } = req.query;
    const findOptions = {
      ...(noItems ? { items: 0 } : null),
      ...(noLists ? { lists: 0 } : null),
      ...(noReferringItems ? { referringItems: 0 } : null),
    };
    const populationOptions = [
      !req.body.noItems
        ? {
            path: 'items',
            model: Item,
          }
        : null,
      !req.body.noLists
        ? {
            path: 'lists',
            model: List,
            select: ['_id', 'title', 'deletedAt'],
          }
        : null,
      !req.body.noReferringItems
        ? {
            path: 'referringItems',
            model: Item,
          }
        : null,
      ].filter(item => item);
    const list = await List.findById(req.params.id, findOptions).populate(populationOptions);

    const isListBelongToUser = String(list.userId) === req.userId;

    if (list.isPrivate && !isListBelongToUser) {
      return res.status(400).send({ message: 'List is private' });
    }

    const user = await User.findById(list.userId);

    res.status(200).send({
      ...list.listToClientPopulated(),
      username: user?.username,
    });
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
    isPrivate,
    parentListId,
  } = req.body;
  let { title } = req.body;
  const now = new Date();
  const isListWithSameTitleExist = !!(await List.find({
    title,
    userId: req.userId,
    parentListId,
    deletedAt: null,
  })).length;
  const currentScopeTitles = (await List.find({
    userId: req.userId,
    parentListId,
    deletedAt: null,
  })).map(list => list.title);
  const originList = await List.findById(parentListId);
  let tags = [];
  let categories = [];

  if (isListWithSameTitleExist) {
    (function createNewTitle() {
      title = `${title} (copy)`;

      if (currentScopeTitles.includes(title)) {
        createNewTitle();
      }
    })();
  }

  if (reqTags?.length && reqTags[0].id === null) {
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
    parentListId,
    title,
    tags,
    categories,
  });

  try {
    const savedList = await list.save();

    if (parentListId) {
      originList.lists = [...(originList.lists ? originList.lists : []), String(savedList._id)];

      await originList.save();
    }

    return res.status(200).send(savedList.toClient());
  } catch (err) {
    resolve500Error(err, res);
  }
}

exports.updateList = async (req, res) => {
  const isListWithSameTitleExist = !!(await List.find({
    title: req.body.title,
    parentListId: req.body.parentListId,
    userId: req.userId,
    deletedAt: null,
    _id: { $ne: req.params.listid },
  })).length;

  if (isListWithSameTitleExist) {
    return res.status(400).send({ message: 'You already have a list with this title in this scope' });
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

    const resultList = (await List.findById({
      _id: updatedList._id,
    }, {
      items: 0,
      referringItems: 0,
      lists: 0,
    }))[0];

    return res.status(200).send(resultList.toClient());
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
      parentListId: req.parentListId,
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
    }, { items: 0 });

    return res.status(200).send(getArrayToClient(lists));
  } catch (err) {
    resolve500Error(err, res);
  }
};

exports.hardDeleteList = async (req, res) => {
  try {
    const id = req.params.listid;
    const list = await List.findById(id);

    await deleteRelatedAndReferringRecordsForBatchItemsDeleting(list.items.map(id => String(id)));
    await deleteReferringItemsInDeletingList(list._id);
    await Item.deleteMany({ _id: { $in: toObjectId(list.items) }});

    if (list.parentListId) {
      const originList = await List.findById(list.parentListId);

      originList.lists = originList?.lists.filter(item => item !== id);
      await originList.save();
    }

    if (list.lists?.length) {
      deleteChildrenLists(list.lists);
    }

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
    await deleteListIdsFromOriginListsForBatchDeleting(
      lists.filter(item => item.parentListId).map(list => String(list._id))
    );
    await deleteChildrenLists(lists.reduce((result, list) => {
      if (list.lists?.length) {
        result = [...result, ...list.lists];
      }

      return result;
    }, []));
    
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
