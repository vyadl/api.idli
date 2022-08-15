const { getDifferenceForChangedArray } = require('./../../utils/utils');
const Item = require('../../models/item.model');
const List = require('../../models/list.model');

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

    await removeReferringItems({
      recordId: item._id,
      relatedEntityName: 'relatedItems',
      referringItemsIds: item.referringItems,
    });
  }
}

const deleteReferringItemsInDeletingList = async (listId) => {
  const list = await List.findById(listId);

  if (list.referringItems?.length) {
    await removeReferringItems({
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

  const itemsForChange = relatedItemsDifference.all.size
    ? await Item.find({ _id: { $in: Array.from(relatedItemsDifference.all) } })
    : [];
  const listsForChange = relatedListsDifference.all.size
    ? await List.find({ _id: { $in: Array.from(relatedListsDifference.all) } })
    : [];

  const bulkUpdateOps = [];

  await Promise.all([
    {
      name: 'item',
      model: Item,
      collection: itemsForChange,
      differenceObj: relatedItemsDifference,
    },
    {
      name: 'list',
      model: List,
      collection: listsForChange,
      differenceObj: relatedListsDifference,
    },
  ].map(entity => {
    entity.collection.forEach(record => {
      let finalReferringItems = null;
      let isChanged = false;

      if (entity.differenceObj.deleted.has(String(record._id))) {
        
        finalReferringItems = record.referringItems.filter(id => String(id) !== String(itemId));

        if (!finalReferringItems.length) {
          finalReferringItems = null;
        }

        isChanged = true;
      }

      if (entity.differenceObj.new.has(String(record._id))) {
        finalReferringItems = record.referringItems ? [...record.referringItems] : [];
        finalReferringItems.push(itemId);

        isChanged = true
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

const removeReferringItems = async ({
  relatedEntityName,
  recordId,
  referringItemsIds,
}) => {
  const referringItems = Item.find({ _id: { $in: referringItemsIds } });

  if (!referringItems.length) {
    return Promise.resolve();
  }

  const bulkOptions = [];

  referringItems.forEach(item => {
    const filteredRelatedIds
      = item[relatedEntityName].filter(id => String(id) !== String(recordId));

    bulkOptions.push({
      updateOne: {
        filter: { _id: item._id },
        update: {
          $set: {
            [relatedEntityName]: filteredRelatedIds,
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

module.exports = {
  deleteRelatedAndReferringRecordsForItem,
  handleChangingRelatedRecords,
  deleteReferringItemsInDeletingList,
  deleteRelatedAndReferringRecordsForBatchItemsDeleting,
  deleteReferringItemsforBatchListDeleting,
}
