import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/mockDb';

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Ambil inisial nama (maksimal 3 huruf)
  const getInitials = (name) => {
    if (!name) return 'SIF';
    return name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase();
  };

  return (
    <nav className="flex justify-between items-center bg-primary fixed top-0 left-0 right-0 z-[1000] shadow-[0_2px_10px_rgba(0,0,0,0.1)] px-[30px] py-[15px] h-[70px] max-[480px]:px-[15px] max-[480px]:py-2.5 max-[480px]:h-[60px]">
      <div className="flex items-center gap-5">
        <button 
          className="bg-transparent border-none text-white text-2xl cursor-pointer p-[5px_10px] hidden max-md:block" 
          onClick={toggleSidebar}
          id="menuToggle"
        >
          ☰
        </button>
        
        <div className="flex items-center">
          <div className="bg-secondary rounded-lg px-[15px] py-2">
            <h1 className="text-white text-xl font-bold m-0 max-[480px]:text-base">SIF Creative.</h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button className="bg-secondary color-white border-none w-10 h-10 rounded-full text-xl cursor-pointer flex items-center justify-center transition-all duration-300 text-white max-[480px]:w-[35px] max-[480px]:h-[35px] max-[480px]:text-[18px] hover:opacity-90">
          ?
        </button>
        
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="bg-secondary rounded-full w-10 h-10 flex items-center justify-center">
            <span className="text-white text-sm font-bold">{getInitials(user?.name)}</span>
          </div>
          <span className="text-white text-sm font-semibold max-md:hidden">{user?.name || 'Creative.'}</span>
        </div>

        <button 
          onClick={handleLogout} 
          className="bg-[#e74c3c] text-white border-none px-5 py-2 rounded-md cursor-pointer text-sm font-semibold transition-all duration-300 hover:opacity-90 max-md:px-3 max-md:py-2 max-md:text-xs"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;