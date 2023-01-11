const { getDifferenceForChangedArray } = require('./../../utils/utils');
const { toObjectId } = require('./../../utils/databaseUtils');
const Item = require('./../../models/item.model');
const List = require('./../../models/list.model');

const deleteRelatedAndReferringRecordsForBatchItemsDeleting = async (itemIds) => {
  await Promise.all(itemIds.map(async id => {
    await deleteRelatedAndReferringRecordsForItem(id);
  }));
}

const deleteReferringItemsforBatchListDeleting = async (listIds) => {
  await Promise.all(listIds.map(async id => {
    await deleteReferringItemsInDeletingList(id);
  }));
}

const deleteRelatedAndReferringRecordsForItem = async (payload) => {
  let item = null;

  if (typeof payload === 'string') {
    item = await Item.findById(payload);
  } else {
    item = payload;
  }

  if (item) {
    await deleteRelatedRecords({
      itemId: item._id,
      relatedItems: item.relatedItems,
      relatedLists: item.relatedLists,
    });

    await deleteReferringItems({
      recordId: item._id,
      relatedEntityName: 'relatedItems',
      referringItemsIds: item.referringItems,
    });
  }
}

const deleteReferringItemsInDeletingList = async (listId) => {
  const list = await List.findById(listId);

  if (list.referringItems?.length) {
    await deleteReferringItems({
      recordId: listId,
      relatedEntityName: 'relatedLists',
      referringItemsIds: list.referringItems,
    });
  } else {
    return Promise.resolve();
  }
}

const deleteRelatedRecords = async ({
  itemId,
  relatedItems,
  relatedLists,
}) => {
  await handleChangingRelatedRecords({
    itemId,
    oldRelatedItems: relatedItems,
    oldRelatedLists: relatedLists,
    relatedItems: [],
    relatedLists: [],
  });
}

const handleChangingRelatedRecords = async ({
  itemId,
  oldRelatedItems = [],
  oldRelatedLists = [],
  relatedItems = [],
  relatedLists = [],
}) => {
  const relatedItemsDifference = getDifferenceForChangedArray(oldRelatedItems || [], relatedItems || []);
  const relatedListsDifference = getDifferenceForChangedArray(oldRelatedLists || [], relatedLists || []);
  const areAnyChanges = relatedItemsDifference.all.size || relatedListsDifference.all.size;

  if (!areAnyChanges) {
    return false;
  }

  const itemsForChange = relatedItemsDifference.all.size
    ? await Item.find({ _id: { $in: toObjectId(Array.from(relatedItemsDifference.all)) } })
    : [];
  const listsForChange = relatedListsDifference.all.size
    ? await List.find({ _id: { $in: toObjectId(Array.from(relatedListsDifference.all)) } })
    : [];
  const bulkUpdateOps = [];

  await Promise.all([
    {
      model: Item,
      collection: itemsForChange,
      differenceObj: relatedItemsDifference,
    },
    {
      model: List,
      collection: listsForChange,
      differenceObj: relatedListsDifference,
    },
  ].map(entity => {
    entity.collection.forEach(record => {
      let finalReferringItems = null;
      let isChanged = false;

      if (entity.differenceObj.deleted.has(String(record._id))) {
        finalReferringItems = record.referringItems?.filter(id => String(id) !== String(itemId));

        if (!finalReferringItems?.length) {
          finalReferringItems = null;
        }

        isChanged = true;
      }

      if (entity.differenceObj.new.has(String(record._id))) {
        finalReferringItems = record.referringItems ? [...record.referringItems] : [];
        finalReferringItems.push(itemId);

        isChanged = true;
      }

      if (isChanged) {
        bulkUpdateOps.push({
          updateOne: {
            filter: { _id: record._id },
            update: {
              $set: {
                referringItems: finalReferringItems,
              },
            },
          },
        });
      }
    });

    if (bulkUpdateOps.length) {
      entity.model.bulkWrite(bulkUpdateOps);
    }
  }));
}

const deleteReferringItems = async ({
  relatedEntityName,
  recordId,
  referringItemsIds,
}) => {
  const referringItems = await Item.find({ _id: { $in: toObjectId(referringItemsIds) } });

  if (!referringItems.length) {
    return Promise.resolve();
  }

  const bulkOptions = [];

  referringItems.forEach(item => {
    const filteredRelatedIds
      = item[relatedEntityName]?.filter(id => String(id) !== String(recordId));

    bulkOptions.push({
      updateOne: {
        filter: { _id: item._id },
        update: {
          $set: {
            [relatedEntityName]: filteredRelatedIds?.length ? filteredRelatedIds : null,
          },
        },
      },
    });
  });

  if (bulkOptions.length) {
    return await Item.bulkWrite(bulkOptions)
  } else {
    return Promise.resolve();
  }
}

const getFilteredPopulatedItemForPublic = async populatedItem => {
  const listsIds = new Set();
  const itemEntityFields = ['relatedItems', 'referringItems'];

  itemEntityFields.forEach(entityName => {
    if (populatedItem[entityName]?.length) {
      populatedItem[entityName].forEach(item => {
        listsIds.add(item.listId);
      });
    }
  });

  const usingLists = await List.find({ _id: { $in: toObjectId([...listsIds]) } });

  const privateListsIds = usingLists.reduce((result, list) => {
    if (list.isPrivate) {
      result.add(String(list._id));
    }

    return result;
  }, new Set());

  const filteredPopulatedItems = itemEntityFields.reduce((result, entityName) => {
    let resultEntityField = [];

    resultEntityField = populatedItem[entityName]
      ?.filter(item => !privateListsIds.has(String(item.listId)));

    result[entityName] = resultEntityField;

    return result;
  }, {});

  const filteredPopulatedLists = populatedItem.relatedLists?.filter(list => !list.isPrivate);
  const resultItem = {
    ...populatedItem,
    _doc: {
      ...populatedItem._doc,
      ...filteredPopulatedItems,
      relatedLists: filteredPopulatedLists,
    }
  };

  Object.setPrototypeOf(resultItem, populatedItem);

  return resultItem;
}

const getPopulatedItemWithRelated = async ({ itemDbRequest, item, isItemBelongsToRequester }) => {
  const entitiesForPopulating = new Set(
    ['relatedItems', 'relatedLists', 'referringItems']
      .filter(entityName => item[entityName]?.length)
  );

  if (!entitiesForPopulating.size) {
    return item;
  }

  const populateOptions = [{
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
    }
  ].filter(populateOption => entitiesForPopulating.has(populateOption.path));

  let populatedItem = await itemDbRequest.populate(populateOptions);

  if (!isItemBelongsToRequester) {
    populatedItem = await getFilteredPopulatedItemForPublic(populatedItem);
  }

  return populatedItem;
}

module.exports = {
  deleteRelatedAndReferringRecordsForItem,
  handleChangingRelatedRecords,
  deleteReferringItemsInDeletingList,
  deleteRelatedAndReferringRecordsForBatchItemsDeleting,
  deleteReferringItemsforBatchListDeleting,
  getFilteredPopulatedItemForPublic,
  getPopulatedItemWithRelated,
}
