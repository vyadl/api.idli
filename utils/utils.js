exports.checkIsSomethingDeletedByIds = (oldObj, newObj) => {
  const oldIds = Object.values(oldObj).map(item => item.id);
  const newIds = Object.values(newObj).map(item => item.id);

  return oldIds.some(oldId => !newIds.includes(oldId));
}

exports.toClient = function() {
  const obj = this.toObject();

  obj.id = obj._id;

  delete obj._id;
  delete obj.__v;

  return obj;
};

exports.listToClientPopulated = function(isDeletedInclude = false) {
  const obj = this.toObject();

  obj.id = obj._id;
  obj.items = this.items.map(item => item.toClient());

  if (isDeletedInclude) {
    obj.items.filter(item => !item.deletedAt);
  }

  delete obj._id;
  delete obj.__v;

  return obj;
};
