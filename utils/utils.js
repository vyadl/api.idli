const checkIsSomethingDeletedByIds = (oldObj, newObj) => {
  const oldIds = Object.values(oldObj).map(item => item.id);
  const newIds = Object.values(newObj).map(item => item.id);

  return oldIds.some(oldId => !newIds.includes(oldId));
}

const toClient = function() {
  const obj = this.toObject();
  const isList = typeof obj.itemsUpdatedAt !== undefined;

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

module.exports = {
  checkIsSomethingDeletedByIds,
  toClient,
  listToClientPopulated,
}
