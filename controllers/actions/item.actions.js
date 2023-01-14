const Item = require('../../models/item.model');
const { resolve500Error } = require('../../middlewares/validation');

exports.createItemsManually = async (items) => {
  try {
    const result = await Item.insertMany(items);

    return result;
  } catch (err) {
    resolve500Error(err);
  }
}
