import { addMessage, messageReceived, addUser, usersList } from '../actions';
import { ADD_MESSAGE, MESSAGE_RECEIVED, ADD_USER, USERS_LIST } from '../actions';

describe('Actions', () => {
  it('should create an action to add a message', () => {
    const message = 'Hello World';
    const author = 'John';
    const expectedAction = {
      type: ADD_MESSAGE,
      id: expect.any(Number),
      message,
      author
    };
    expect(addMessage(message, author)).toEqual(expectedAction);
  });

  it('should create an action for received message', () => {
    const message = 'Hi there';
    const author = 'Jane';
    const expectedAction = {
      type: MESSAGE_RECEIVED,
      id: expect.any(Number),
      message,
      author
    };
    expect(messageReceived(message, author)).toEqual(expectedAction);
  });

  it('should create an action to add a user', () => {
    const name = 'Alice';
    const expectedAction = {
      type: ADD_USER,
      name
    };
    expect(addUser(name)).toEqual(expectedAction);
  });

  it('should create an action for users list', () => {
    const users = ['Alice', 'Bob', 'Charlie'];
    const expectedAction = {
      type: USERS_LIST,
      users
    };
    expect(usersList(users)).toEqual(expectedAction);
  });
});