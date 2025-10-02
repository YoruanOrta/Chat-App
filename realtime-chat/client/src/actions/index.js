// Action Types
export const ADD_MESSAGE = 'ADD_MESSAGE';
export const MESSAGE_RECEIVED = 'MESSAGE_RECEIVED';
export const ADD_USER = 'ADD_USER';
export const USERS_LIST = 'USERS_LIST';

// Action Creators
let nextMessageId = 0;

export const addMessage = (message, author) => ({
  type: ADD_MESSAGE,
  id: nextMessageId++,
  message,
  author
});

export const messageReceived = (message, author, authorAvatar) => ({
  type: MESSAGE_RECEIVED,
  id: nextMessageId++,
  message,
  author,
  authorAvatar  // AGREGAR ESTO
});

export const addUser = (name) => ({
  type: ADD_USER,
  name
});

export const usersList = (users) => ({
  type: USERS_LIST,
  users
});