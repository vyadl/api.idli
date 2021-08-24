exports.checkIsSomethingDeletedByIds = (oldObj, newObj) => {
  const oldIds = Object.values(oldObj).map(item => item.id);
  const newIds = Object.values(newObj).map(item => item.id);

  return oldIds.some(oldId => !newIds.includes(oldId));
}

exports.toClient = function() {
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

exports.listToClientPopulated = function(isDeletedInclude = false) {
  const obj = this.toObject();

  obj.id = obj._id;
  obj.items = this.items.map(item => item.toClient());

  if (!isDeletedInclude) {
    obj.items = obj.items.filter(item => !item.deletedAt);
  }

  obj.updatedAt = obj.updatedAt > obj.itemsUpdatedAt ? obj.updatedAt : obj.itemsUpdatedAt;

  delete obj.itemsUpdatedAt;
  delete obj._id;
  delete obj.__v;

  return obj;
};
