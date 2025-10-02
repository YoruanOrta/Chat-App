import { takeEvery } from 'redux-saga/effects';
import { ADD_MESSAGE, messageReceived, usersList } from '../actions';

let ws = null;
let dispatch = null;
let isConnected = false;
let pendingUser = null;

function connectSocket() {
  ws = new WebSocket('ws://localhost:8989');
  
  window.chatWebSocket = ws;
  
  ws.onopen = () => {
    console.log('Connected');
    isConnected = true;
    
    if (pendingUser) {
      ws.send(JSON.stringify({
        type: 'username',
        payload: { name: pendingUser }
      }));
      pendingUser = null;
    }
  };
  
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    
    if (data.type === 'message') {
      dispatch(messageReceived(
        data.payload.message, 
        data.payload.author, 
        data.payload.authorAvatar
      ));
    }
    if (data.type === 'users') {
      dispatch(usersList(data.payload));
    }
    if (data.type === 'admin_status') {
      dispatch({ type: 'SET_ADMIN_STATUS', payload: data.payload.isAdmin });
    }
    if (data.type === 'clear_messages') {
      dispatch({ type: 'CLEAR_ALL_MESSAGES' });
    }
    if (data.type === 'register_response') {
      dispatch({ type: 'REGISTER_RESPONSE', payload: data.payload });
    }
    if (data.type === 'login_response') {
      dispatch({ type: 'LOGIN_RESPONSE', payload: data.payload });
    }
    if (data.type === 'token_login_response') {
      dispatch({ type: 'TOKEN_LOGIN_RESPONSE', payload: data.payload });
    }
  };
  
  ws.onclose = () => {
    console.log('Disconnected');
    isConnected = false;
  };
}

function sendRegister(username, email, password) {
  if (ws && isConnected) {
    ws.send(JSON.stringify({
      type: 'register',
      payload: { username, email, password }
    }));
  }
}

function sendLogin(email, password) {
  if (ws && isConnected) {
    ws.send(JSON.stringify({
      type: 'login',
      payload: { email, password }
    }));
  } else {
    setTimeout(() => sendLogin(email, password), 500);
  }
}

// NEW: Token-based login for auto-auth
function sendTokenLogin(email, token) {
  if (ws && isConnected) {
    ws.send(JSON.stringify({
      type: 'token_login',
      payload: { email, token }
    }));
  } else {
    setTimeout(() => sendTokenLogin(email, token), 500);
  }
}

function sendAdminLogin(password) {
  if (ws && isConnected) {
    ws.send(JSON.stringify({
      type: 'admin_login',
      payload: { password }
    }));
  }
}

function sendClearHistory() {
  if (ws && isConnected) {
    ws.send(JSON.stringify({
      type: 'clear_history'
    }));
  }
}

function* sendMessage(action) {
  if (ws && isConnected) {
    ws.send(JSON.stringify({
      type: 'message',
      payload: { message: action.message }
    }));
  }
  yield;
}

export default function* rootSaga(d) {
  dispatch = d;
  connectSocket();
  yield takeEvery(ADD_MESSAGE, sendMessage);
}

export { sendRegister, sendLogin, sendTokenLogin, sendAdminLogin, sendClearHistory };