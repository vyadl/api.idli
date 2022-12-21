const List = require('../models/list.model');
const Item = require('../models/item.model');
const { resolve500Error } = require('./../middlewares/validation');
const { getArrayToClient } = require('./../utils/utils');

exports.getItemsAndListsBySearch = async (req, res) => {
  try {
    const searchString = req.params.query;
    const itemsDbRequest = Item.find({ userId: req.userId, $text: { $search: `\"${searchString}\"` }});
    const listsDbRequest = List.find({ userId: req.userId, $text: { $search: `\"${searchString}\"` }});

    const [foundItems, foundLists] = await Promise.all([itemsDbRequest, listsDbRequest]);

    return res.status(200).send({
      items: getArrayToClient(foundItems),
      lists: getArrayToClient(foundLists),
    });
  } catch (err) {
    resolve500Error(err, res);
  }
}
