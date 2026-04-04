import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Feather } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { register } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // clear error for specific field when typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const res = await register(formData);
      
      setToken(res.data.token);
      setUser(res.data.user);
      navigate('/home');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#1da1f2]/10 via-[var(--bg-color)] to-[var(--bg-color)] flex items-center justify-center p-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-color)] shadow-2xl rounded-3xl p-8 sm:p-10 z-10 relative"
      >
        <div className="flex justify-center mb-8">
          <Feather size={48} className="text-[var(--color-chirp)]" />
        </div>
        
        <h1 className="text-3xl font-bold text-center text-[var(--text-color)] mb-8">Join Chirp today</h1>

        {errors.general && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm mb-6 border border-red-500/20">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name?.[0]}
            required
          />
          <Input 
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username?.[0]}
            required
          />
          <Input 
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email?.[0]}
            required
          />
          <Input 
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password?.[0]}
            required
          />
          <Input 
            label="Confirm Password"
            name="password_confirmation"
            type="password"
            value={formData.password_confirmation}
            onChange={handleChange}
            required
          />
          
          <div className="flex justify-center pt-4">
            <Button type="submit" size="lg" isLoading={isLoading} className="px-16 shadow-md hover:shadow-lg">
              Create account
            </Button>
          </div>

          <div className="text-center mt-6">
            <span className="text-[var(--text-muted)]">Already have an account? </span>
            <Link to="/login" className="text-[var(--color-chirp)] hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
