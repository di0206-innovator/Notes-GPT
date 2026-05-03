'use client';

import React from 'react';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: '🏠' },
    { name: 'Campus Maps', icon: '📍' },
    { name: 'Schedule', icon: '📅' },
    { name: 'Study Groups', icon: '👥' },
  ];

  const recentChats = [
    'Physics 101 Help',
    'Library Hours Today',
    'Best Ramen on Campus',
  ];

  return (
    <aside className="sidebar">
      <div style={{ padding: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>CampusGPT</h2>
      </div>

      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className="nav-btn-active" style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: 'none',
            color: 'var(--primary)',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            textAlign: 'left',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
            💬 New Chat
          </button>
          {menuItems.map((item) => (
            <button key={item.name} style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              {item.icon} <span style={{ marginLeft: '0.5rem' }}>{item.name}</span>
            </button>
          ))}
        </nav>

        <div>
          <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem', paddingLeft: '1rem' }}>Recent</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {recentChats.map((chat) => (
              <button key={chat} style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {chat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>DS</div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Divyanshu</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Pro Plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
