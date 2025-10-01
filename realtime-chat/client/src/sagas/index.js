import { takeEvery, all } from 'redux-saga/effects';
import { ADD_MESSAGE, ADD_USER, messageReceived, usersList } from '../actions';

const socket = setupSocket();

function* handleNewMessage(action) {
  socket.emit('message', {
    message: action.message,
    author: action.author
  });
}

function* handleNewUser(action) {
  socket.emit('username', {
    name: action.name
  });
}

export function setupSocket() {
  const socket = new WebSocket('ws://localhost:8989');
  
  return {
    on: (event, callback) => {
      socket.addEventListener('message', (e) => {
        const data = JSON.parse(e.data);
        if (data.type === event) {
          callback(data.payload);
        }
      });
    },
    emit: (event, data) => {
      socket.send(JSON.stringify({ type: event, payload: data }));
    }
  };
}

export function* watchMessages(dispatch) {
  yield takeEvery(ADD_MESSAGE, handleNewMessage);
}

export function* watchUsers(dispatch) {
  yield takeEvery(ADD_USER, handleNewUser);
}

export function* listenForSocketEvents(dispatch) {
  socket.on('message', (data) => {
    dispatch(messageReceived(data.message, data.author));
  });
  
  socket.on('users', (users) => {
    dispatch(usersList(users));
  });
}

export default function* rootSaga(dispatch) {
  yield all([
    watchMessages(dispatch),
    watchUsers(dispatch),
    listenForSocketEvents(dispatch)
  ]);
}