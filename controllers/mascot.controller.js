const User = require('./../models/user.model');
const Role = require('./../models/role.model');
const { createUserManually } = require('./actions/auth.actions');
const { createItemsManually } = require('./actions/item.actions');
const { createListsManually } = require('./actions/list.actions');
const { user, lists, items } = require('./../data/mascot.data');


exports.createMascot = async () => {
  const isMascotExist = !!await User.findById(user._id);

  if (!isMascotExist) {
    const roleId = (await Role.findOne({ name: user.roles[0] }))._id;

    await createUserManually({
      ...user,
      roles: [roleId],
    });
    await createListsManually(lists);
    await createItemsManually(items);

    return 'Mascot is succesfully created';
  } else {
    return 'Mascot is already existed';
  }
}