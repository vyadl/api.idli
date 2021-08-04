const List = require('../../models/list.model');
const Item = require('../../models/item.model');
const { resolve500Error } = require('../../middlewares/validation');
const { checkIsSomethingDeletedByIds } = require('../../utils/utils');

exports.removeDeletedTagsAndCategoriesFromItems = ({ req, res, list }) => {
  const body = req.body;
  const isAnyTagDeleted = body.tags
    ? checkIsSomethingDeletedByIds(list.tags, body.tags)
    : false;
  const isAnyCategoryDeleted = body.categories
    ? checkIsSomethingDeletedByIds(list.categories, body.categories)
    : false;

  if (isAnyTagDeleted || isAnyCategoryDeleted) {
    return Item.find({ listId: list._id }, (err, items) => {
      resolve500Error(err, req, res);

      const tagIds = body.tags.map(tag => tag.id);
      const categoryIds = body.categories.map(category => category.id);
      const bulkUpdateOps = [];

      items.forEach(item => {
        if (item.tags.some(tag => !tagIds.includes(tag))) {
          bulkUpdateOps.push({
            updateOne: {
                filter: { _id: item._id },
                update: { 
                  $set: { 
                    tags: item.tags.filter(tagItem => tagIds.includes(tagItem)),
                  },
                },
              },
          });
        }

        if (!categoryIds.includes(item.category)) {
          bulkUpdateOps.push({ 
            updateOne: {
                filter: { _id: item._id },
                update: {
                  $set: {
                    category: 0,
                  },
                },
              },
          });
        }
      });

      if (bulkUpdateOps.length > 0) {
        return Item.bulkWrite(bulkUpdateOps)
      } else {
        return Promise.resolve();
      }
    });
  } else {
    return Promise.resolve();
  }
};

exports.getFinalFieldsForList = fields => {
  const finalFields = {};

  Object.keys(fields).forEach(field => {
    let resultField = JSON.parse(JSON.stringify(fields[field]));

    if (['tags', 'categories'].includes(field)) {
      resultField = resultField.map(item => {
        if (!item.id) {
          const fieldMaxId = resultField.reduce((result, item) => {
            result = result > +item.id ? result : +item.id;

            return result;
          }, 1) + 1;

          item.id = fieldMaxId;
        }

        return item;
      });
    }

    finalFields[field] = resultField;
  });

  return finalFields;
}