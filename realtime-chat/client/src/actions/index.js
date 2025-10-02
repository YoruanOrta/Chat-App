export const ADD_MESSAGE = 'ADD_MESSAGE';
export const MESSAGE_RECEIVED = 'MESSAGE_RECEIVED';
export const USERS_LIST = 'USERS_LIST';

let messageId = 0;

export const addMessage = (message, author) => ({
  type: ADD_MESSAGE,
  id: messageId++,
  message,
  author
});

export const messageReceived = (message, author, authorAvatar, file) => ({
  type: MESSAGE_RECEIVED,
  id: messageId++,
  message,
  author,
  authorAvatar,
  file  // ADD THIS!!!
});

export const usersList = (users) => ({
  type: USERS_LIST,
  users
});