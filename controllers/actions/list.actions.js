const Item = require('../../models/item.model');
const List = require('../../models/list.model');
const { resolve500Error } = require('../../middlewares/validation');
const { checkIsSomethingDeletedByIds } = require('../../utils/utils');

exports.removeDeletedTagsAndCategoriesFromItems = ({ req, res, list }) => {
  const { categories, tags } = req.body;
  const isAnyTagDeleted = tags
    ? checkIsSomethingDeletedByIds(list.tags, tags)
    : false;
  const isAnyCategoryDeleted = categories
    ? checkIsSomethingDeletedByIds(list.categories, categories)
    : false;

  if (isAnyTagDeleted || isAnyCategoryDeleted) {
    return Item.find({ listId: list._id }, (err, items) => {
      resolve500Error(err, res);

      const tagIds = tags ? tags.map(tag => tag.id) : [];
      const categoryIds = categories ? categories.map(category => category.id) : [];
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
                    category: null,
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

exports.getFieldsWithIds = fields => {
  const updatedFields = {};

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

    updatedFields[field] = resultField;
  });

  return updatedFields;
};


exports.createListsManually = async (lists) => {
  try {
    const result = await List.insertMany(lists);

    return result;
  } catch (err) {
    resolve500Error(err);
  }
}

exports.deleteListIdsFromOriginListsForBatchDeleting = async (ids) => {
  const lists = await List.find({
    _id: { $in: ids },
  });

  await Promise.all(lists.map(async (list) => {
    list.lists = list.lists.filter(listId => !ids.includes(listId));

    await list.save();
  }));
}

exports.deleteChildrenLists = async function deleteChildrenLists(ids) {
  const lists = await List.find({ _id: { $in: ids } });
  const childrenLists = await List.find({ _id: { $in: lists.reduce((result, list) => {
    if (list.lists?.length) {
      result = [...result, list.lists];
    }

    return result;
  }, []) } });

  await List.deleteMany({ _id: { $in: ids } });

  if (childrenLists.length) {
    await deleteChildrenLists(childrenLists.map(list => String(list._id)));
  }
}
