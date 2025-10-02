import { combineReducers } from 'redux';
import { MESSAGE_RECEIVED, USERS_LIST } from '../actions';

const messages = (state = [], action) => {
  if (action.type === MESSAGE_RECEIVED) {
    return [...state, { 
      id: action.id, 
      message: action.message, 
      author: action.author,
      authorAvatar: action.authorAvatar  // AGREGAR ESTO
    }];
  }
  if (action.type === 'CLEAR_ALL_MESSAGES') {
    return [];
  }
  return state;
};

const users = (state = [], action) => {
  if (action.type === USERS_LIST) {
    return action.users;
  }
  return state;
};

const isAdmin = (state = false, action) => {
  if (action.type === 'SET_ADMIN_STATUS') {
    return action.payload;
  }
  return state;
};

const authResponse = (state = null, action) => {
  if (action.type === 'REGISTER_RESPONSE') {
    return { type: 'register', ...action.payload };
  }
  if (action.type === 'LOGIN_RESPONSE') {
    return { type: 'login', ...action.payload };
  }
  if (action.type === 'CLEAR_AUTH_RESPONSE') {
    return null;
  }
  return state;
};

export default combineReducers({ messages, users, isAdmin, authResponse });