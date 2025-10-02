import React from 'react';

const Sidebar = ({ users }) => (
  <aside className="sidebar">
    <h3>Online Users ({users.length})</h3>
    <ul>
      {users.map((user, index) => {
        // Handle both string usernames (old format) and user objects (new format)
        const username = typeof user === 'string' ? user : user.username;
        const avatar = typeof user === 'object' ? user.avatar : null;
        
        return (
          <li key={index}>
            {avatar ? (
              <img 
                src={`http://localhost:8989/uploads/avatars/${avatar}`} 
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