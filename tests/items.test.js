const test = require('ava');
const request = require('supertest');
const createApp = require('./../server');
const { signIn } = require('./utils');

createApp().then(async app => {
  const user = await signIn(app, 'user12345');
  const anotherUser = await signIn(app, 'user54321');

  test.todo('add item');
  test.todo('update item');
  test.todo('delete item');
  test.todo('try to update another item');
  test.todo('try to delete another item');

});
