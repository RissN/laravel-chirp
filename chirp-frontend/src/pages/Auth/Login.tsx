import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Feather } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { login } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const isEmail = emailOrUsername.includes('@');
      const credentials = isEmail 
        ? { email: emailOrUsername, password } 
        : { username: emailOrUsername, password };

      const res = await login(credentials);
      
      setToken(res.data.token);
      setUser(res.data.user);
      navigate('/home');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1da1f2]/10 via-[var(--bg-color)] to-[var(--bg-color)] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-color)] shadow-2xl rounded-3xl p-8 sm:p-10 z-10 relative"
      >
        <div className="flex justify-center mb-8">
          <Feather size={48} className="text-[var(--color-chirp)]" />
        </div>
        
        <h1 className="text-3xl font-bold text-center text-[var(--text-color)] mb-8">Sign in to Chirp</h1>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm mb-6 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Email or Username"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            required
          />
          <Input 
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <div className="flex justify-center pt-2">
            <Button type="submit" size="lg" isLoading={isLoading} className="px-16 shadow-md hover:shadow-lg">
              Log In
            </Button>
          </div>

          <div className="text-center mt-6">
            <span className="text-[var(--text-muted)]">Don't have an account? </span>
            <Link to="/register" className="text-[var(--color-chirp)] hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
