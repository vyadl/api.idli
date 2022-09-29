const mongoose = require('mongoose');

const toObjectId = (payload) => {
  if (typeof payload === 'object' && payload !== null && payload.length) {
    return payload.map(id => mongoose.Types.ObjectId(id));
  } else if (typeof payload === 'string') {
    return mongoose.Types.ObjectId(payload);
  }
  
  return payload;
}

module.exports = { toObjectId };
