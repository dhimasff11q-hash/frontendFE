import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/apiService';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Email atau password salah!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-bgBlue p-5">
      <div className="bg-lightGray rounded-[15px] px-[30px] py-10 w-full max-w-[400px] shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
        <div className="bg-primary rounded-[10px] p-5 mb-[25px] text-center">
          <h1 className="text-white text-[32px] font-bold m-0">SIF Creative.</h1>
        </div>

        <h2 className="text-2xl text-secondary text-center mb-[25px] font-bold">LOGIN</h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg text-xs font-semibold mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-secondary font-semibold uppercase">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="p-3 rounded-lg border-none bg-primary text-white text-sm outline-none"
              placeholder="e.g. admin@sifcreative.com"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
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

          <button type="submit" disabled={isLoading} className="bg-primary text-white border-none p-3 rounded-lg text-base font-bold cursor-pointer mt-2.5 hover:opacity-90 transition-opacity disabled:opacity-50">
            {isLoading ? 'LOADING...' : 'LOGIN'}
          </button>
        </form>

        <p className="text-center mt-5 text-xs text-secondary uppercase">
          IF YOU DON'T HAVE AN ACCOUNT?{' '}
          <span
            className="text-primary font-bold cursor-pointer underline"
            onClick={() => navigate('/register')}
          >
            REGISTER
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;