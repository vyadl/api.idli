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

exports.listToClientPopulated = function() {
  const obj = this.toObject();

  obj.id = obj._id;
  obj.items = this.items.filter(item => !item.isDeleted).map(item => item.toClient());

  delete obj._id;
  delete obj.__v;

  return obj;
};
