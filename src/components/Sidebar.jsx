import React from 'react';

const Sidebar = ({ isOpen, toggleSidebar, activeMenu, setActiveMenu }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'payment', label: 'Payment' },
    { id: 'feedback', label: 'Feedback' },
  ];

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-sidebarBlue text-white transition-[width] duration-300 overflow-hidden z-[1000] ${
        isOpen ? 'w-[250px]' : 'w-0'
      }`}
    >
      <div className="p-5">
        <h2 className="text-[1.25rem] font-bold">SIF Creative.</h2>
        <p className="text-[0.75rem] opacity-80">client project</p>
      </div>

      <nav className="mt-[30px]">
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveMenu(item.id)}
            className={`px-5 py-3 cursor-pointer transition-all duration-300 mb-1 border-l-4 ${
              activeMenu === item.id 
                ? 'bg-activeBlue border-borderBlue' 
                : 'bg-transparent border-transparent hover:bg-[rgba(59,130,246,0.5)]'
            }`}
          >
            {item.label}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;