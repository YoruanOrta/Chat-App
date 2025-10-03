import React from 'react';
import { config } from '../config';

const Sidebar = ({ users }) => (
  <aside className="sidebar">
    <h3>Online Users ({users.length})</h3>
    <ul>
      {users.map((user, index) => {
        const username = typeof user === 'string' ? user : user.username;
        const avatar = typeof user === 'object' ? user.avatar : null;
        
        return (
          <li key={index}>
            {avatar ? (
              <img 
                src={`${config.API_URL}/uploads/avatars/${avatar}`} 
                alt={username}
                className="sidebar-user-avatar"
              />
            ) : (
              <div className="sidebar-user-avatar-placeholder">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
            <span>{username}</span>
          </li>
        );
      })}
    </ul>
  </aside>
);

export default Sidebar;