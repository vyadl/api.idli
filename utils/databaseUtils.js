const mongoose = require('mongoose');

const toObjectId = (payload) => {
  if (Array.isArray(payload) && payload.length) {
    return payload.map(id => mongoose.Types.ObjectId(id));
  } else if (typeof payload === 'string') {
    return mongoose.Types.ObjectId(payload);
  }
  
  return payload;
}

module.exports = { toObjectId };
