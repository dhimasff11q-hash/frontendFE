import React from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center min-h-screen bg-bgBlue p-5">
      <div className="bg-lightGray px-[30px] py-10 rounded-[15px] text-center max-w-[400px] w-full shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
        <div className="bg-primary rounded-[10px] p-5 mb-[30px]">
          <h1 className="text-white text-[32px] font-bold m-0">SIF Creative.</h1>
        </div>
        
        <h2 className="text-[28px] text-secondary mb-2.5 font-bold">WELCOME</h2>
        
        <p className="text-base text-darkGray mb-10">reporting your project</p>
        
        <div className="flex gap-[15px] justify-center items-center flex-wrap">
          <button 
            onClick={() => navigate('/login')}
            className="bg-primary text-white px-[30px] py-3 rounded-lg text-base font-bold cursor-pointer hover:opacity-90 transition-opacity"
          >
            LOGIN
          </button>
          
          <span className="text-darkGray text-sm">or</span>
          
          <button 
            onClick={() => navigate('/register')}
            className="bg-primary text-white px-[30px] py-3 rounded-lg text-base font-bold cursor-pointer hover:opacity-90 transition-opacity"
          >
            REGISTER
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;