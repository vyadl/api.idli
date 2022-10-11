const checkIsSomethingDeletedByIds = (oldObj, newObj) => {
  const oldIds = Object.values(oldObj).map(item => item.id);
  const newIds = Object.values(newObj).map(item => item.id);

  return oldIds.some(oldId => !newIds.includes(oldId));
}

const toClient = function() {
  let obj = {}

  if ('toObject' in this) {
    obj =  this.toObject();
  } else {
    obj = JSON.parse(JSON.stringify(this));
  }

  const isList = typeof obj.itemsUpdatedAt !== 'undefined';

  if (isList) {
    obj.updatedAt = obj.updatedAt > obj.itemsUpdatedAt ? obj.updatedAt : obj.itemsUpdatedAt;

    delete obj.itemsUpdatedAt;
  }

  if (!obj.id) {
    obj.id = String(obj._id);
  }

  delete obj._id;
  delete obj.__v;

  return obj;
};

const getArrayToClient = array => {
  return array.map(item => toClient.call(item));
}

const listToClientPopulated = function(isDeletedInclude = false) {
  const obj = toClient.call(this);

  ['items', 'referringItems'].forEach(field => {
    if (obj[field]?.length) {
      obj[field] = this[field].map(item => toClient.call(item));
    }
  });

  if (!isDeletedInclude) {
    obj.items = obj.items.filter(item => !item.deletedAt);
  }

  return obj;
};

const itemToClientPopulated = function() {
  const obj = toClient.call(this);

  ['relatedItems', 'relatedLists', 'referringItems'].forEach(field => {
    if (obj[field]?.length) {
      obj[field] = obj[field].map(item => toClient.call(item));
    }
  })

  return obj;
};

const getFormattedDate = (date) => {
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  };

  return new Intl.DateTimeFormat('en', options).format(date);
};

const getDifferenceForChangedArray = (arrayBefore, arrayAfter) => {
  const [setBefore, setAfter] = [
    new Set(arrayBefore.map(item => String(item))),
    new Set(arrayAfter.map(item => String(item))),
  ];
  const deletedItems = new Set();
  const newItems = new Set();

  for (const value of setBefore) {
    if (!setAfter.has(value)) {
      deletedItems.add(value);
    }
  }

  for (const value of setAfter) {
    if (!setBefore.has(value)) {
      newItems.add(value);
    }
  }

  return {
    deleted: deletedItems,
    new: newItems,
    all: new Set([...deletedItems, ...newItems]),
  }
}


module.exports = {
  checkIsSomethingDeletedByIds,
  toClient,
  getArrayToClient,
  listToClientPopulated,
  itemToClientPopulated,
  getFormattedDate,
  getDifferenceForChangedArray,
};
