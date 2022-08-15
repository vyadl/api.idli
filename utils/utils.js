const checkIsSomethingDeletedByIds = (oldObj, newObj) => {
  const oldIds = Object.values(oldObj).map(item => item.id);
  const newIds = Object.values(newObj).map(item => item.id);

  return oldIds.some(oldId => !newIds.includes(oldId));
}

const toClient = function() {
  const obj = this.toObject();
  const isList = typeof obj.itemsUpdatedAt !== 'undefined';

  if (isList) {
    obj.updatedAt = obj.updatedAt > obj.itemsUpdatedAt ? obj.updatedAt : obj.itemsUpdatedAt;

    delete obj.itemsUpdatedAt;
  }

  obj.id = obj._id;

  delete obj._id;
  delete obj.__v;

  return obj;
};

const listToClientPopulated = function(isDeletedInclude = false) {
  const obj = toClient.call(this);

  obj.items = this.items.map(item => item.toClient());

  if (!isDeletedInclude) {
    obj.items = obj.items.filter(item => !item.deletedAt);
  }

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
  const deletedItems = [];
  const newItems = [];

  for (const value of setBefore) {
    if (!setAfter.has(value)) {
      deletedItems.push(value);
    }
  }

  for (const value of setAfter) {
    if (!setBefore.has(value)) {
      newItems.push(value);
    }
  }

  return {
    deleted: new Set(deletedItems),
    new: new Set(newItems),
    all: new Set([...deletedItems, ...newItems]),
  }
}

module.exports = {
  checkIsSomethingDeletedByIds,
  toClient,
  listToClientPopulated,
  getFormattedDate,
  getDifferenceForChangedArray,
};
