import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addUser } from './actions';
import { SidebarContainer, MessagesListContainer, AddMessageContainer } from './containers';
import Chance from 'chance';
import './App.css';

const chance = new Chance();
const username = chance.name();

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(addUser(username));
  }, [dispatch]);

  return (
    <div className="app-container">
      <SidebarContainer />
      <MessagesListContainer />
      <AddMessageContainer />
    </div>
  );
}

export default App;