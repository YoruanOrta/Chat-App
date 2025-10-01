import { combineReducers } from 'redux';
import { ADD_MESSAGE, MESSAGE_RECEIVED, ADD_USER, USERS_LIST } from '../actions';

// Reducer para mensajes
const messages = (state = [], action) => {
  switch (action.type) {
    case ADD_MESSAGE:
    case MESSAGE_RECEIVED:
      return [
        ...state,
        {
          id: action.id,
          message: action.message,
          author: action.author
        }
      ];
    default:
      return state;
  }
};

// Reducer para usuarios
const users = (state = [], action) => {
  switch (action.type) {
    case USERS_LIST:
      return action.users;
    default:
      return state;
  }
};

// Combinar reducers
const chatApp = combineReducers({
  messages,
  users
});

export default chatApp;