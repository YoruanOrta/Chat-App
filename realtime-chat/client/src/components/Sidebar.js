import React from 'react';

const Sidebar = ({ users }) => (
  <aside className="sidebar">
    <h3>Users</h3>
    <ul>
      {users.map((user, index) => (
        <li key={index}>{user}</li>
      ))}
    </ul>
  </aside>
);

export default Sidebar;