import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, setCurrentUser } from '../services/mockDb';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan Konfirmasi Password tidak cocok!');
      return;
    }

    const users = getUsers();
    const emailExists = users.some(u => u.email.toLowerCase() === formData.email.toLowerCase());
    if (emailExists) {
      setError('Email sudah terdaftar!');
      return;
    }

    // Buat user baru
    const newUser = {
      id: Date.now(), // Unique ID
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: 'worker', // Default role worker
      isActive: true
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('sif_users', JSON.stringify(updatedUsers));
    
    // Auto-login
    setCurrentUser(newUser);
    navigate('/dashboard');
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-bgBlue p-5">
      <div className="bg-lightGray rounded-[15px] px-[30px] py-10 w-full max-w-[400px] shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
        <div className="bg-primary rounded-[10px] p-5 mb-[25px] text-center">
          <h1 className="text-white text-[32px] font-bold m-0">SIF Creative.</h1>
        </div>
        
        <h2 className="text-2xl text-secondary text-center mb-[25px] font-bold">CREATE ACCOUNT</h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg text-xs font-semibold mb-4 text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-[15px]">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-secondary font-semibold">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="p-3 rounded-lg border-none bg-primary text-white text-sm outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-secondary font-semibold">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="p-3 rounded-lg border-none bg-primary text-white text-sm outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-secondary font-semibold">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="p-3 rounded-lg border-none bg-primary text-white text-sm outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-secondary font-semibold">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="p-3 rounded-lg border-none bg-primary text-white text-sm outline-none"
              required
            />
          </div>

          <button type="submit" className="bg-primary text-white border-none p-3 rounded-lg text-base font-bold cursor-pointer mt-2.5 hover:opacity-90 transition-opacity">
            REGISTER
          </button>
        </form>

        <p className="text-center mt-5 text-xs text-secondary uppercase">
          IF YOU HAVE AN ACCOUNT?{' '}
          <span 
            className="text-primary font-bold cursor-pointer underline" 
            onClick={() => navigate('/login')}
          >
            LOGIN
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;