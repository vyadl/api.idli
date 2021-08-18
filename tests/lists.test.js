const test = require('ava');
const request = require('supertest');
const createApp = require('./../server');
const { signIn } = require('./utils');

createApp().then(async app => {
  const user = await signIn(app, 'user');
  const anotherUser = await signIn(app, 'anotherUser');

  test.todo('add list');
  test.todo('update list');
  test.todo('delete list');
  test.todo('try to update another list');
  test.todo('try to delete another list');
});
