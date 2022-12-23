const List = require('../models/list.model');
const Item = require('../models/item.model');
const { resolve500Error } = require('./../middlewares/validation');
const { getArrayToClient } = require('./../utils/utils');

exports.getItemsAndListsBySearch = async (req, res) => {
  try {
    const searchString = req.params.query;
    const isDeleted = req.query.deleted;
    const deletedListsIdsRequest = List.find({
      userId: req.userId,
      deletedAt:{ $ne: null }
    });
    const itemsDbRequest = Item.find({
      userId: req.userId,
      $text: { $search: `\"${searchString}\"` },
    });
    const listsDbRequest = List.find({
      userId: req.userId,
      $text: { $search: `\"${searchString}\"` },
    });

    const [foundItems, foundLists, deletedLists] =
      await Promise.all([itemsDbRequest, listsDbRequest, deletedListsIdsRequest]);

    const deletedListsIds = new Set(deletedLists.map(list => String(list._id)));

    const filteredItems = foundItems.filter(item => {
      return isDeleted
        ? item.deletedAt || deletedListsIds.has(item.listId)
        : !item.deletedAt && !deletedListsIds.has(item.listId);
    });
    const filteredLists = foundLists.filter(list => list.deletedAt);

    return res.status(200).send({
      items: getArrayToClient(filteredItems),
      lists: getArrayToClient(filteredLists),
    });
  } catch (err) {
    resolve500Error(err, res);
  }
}
