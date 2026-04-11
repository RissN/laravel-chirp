import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Feather } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { login } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/ToastProvider';

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [bannedMsg, setBannedMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const { showToast } = useToast();

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!emailOrUsername.trim()) errors.emailOrUsername = 'Email or username is required';
    if (!password) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    setError('');
    setBannedMsg('');
    setFieldErrors({});

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
      const errorCode = err.response?.data?.error_code;
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      if (errorCode === 'account_banned') {
        setBannedMsg(msg);
      } else {
        setError(msg);
        showToast(msg, 'error');
      }
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

        {bannedMsg && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🚫</span>
              <p className="font-bold text-red-500 text-sm">Account Banned</p>
            </div>
            <p className="text-red-400 text-sm leading-relaxed">{bannedMsg}</p>
            <p className="text-red-400/60 text-xs mt-2">If you believe this is a mistake, please contact support.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm mb-6 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <Input 
            label="Email or Username"
            value={emailOrUsername}
            onChange={(e) => {
              setEmailOrUsername(e.target.value);
              if (fieldErrors.emailOrUsername) setFieldErrors({ ...fieldErrors, emailOrUsername: '' });
            }}
            error={fieldErrors.emailOrUsername}
          />
          <Input 
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
            }}
            error={fieldErrors.password}
          />
          
          <div className="flex justify-center pt-2">
            <Button type="submit" size="lg" isLoading={isLoading} className="btn-gradient px-16 text-white border-0 shadow-md hover:opacity-90 hover:shadow-[var(--color-chirp)]/20">
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
