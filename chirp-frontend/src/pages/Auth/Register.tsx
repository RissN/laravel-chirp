import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Feather, Shield, Zap, Globe, Lock, Sparkles } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { register } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/ToastProvider';

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
  const { showToast } = useToast();

  const validate = () => {
    const fieldErrors: any = {};
    if (!formData.name.trim()) fieldErrors.name = ['Name is required'];
    if (!formData.username.trim()) fieldErrors.username = ['Username is required'];
    if (!formData.email.trim()) fieldErrors.email = ['Email is required'];
    else if (!/\S+@\S+\.\S+/.test(formData.email)) fieldErrors.email = ['Email is invalid'];
    
    if (!formData.password) fieldErrors.password = ['Password is required'];
    else if (formData.password.length < 8) fieldErrors.password = ['Password must be at least 8 characters'];
    
    if (formData.password !== formData.password_confirmation) {
      fieldErrors.password_confirmation = ['Passwords do not match'];
    }

    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // clear error for specific field when typing
    if (errors[e.target.name]) {
      const newErrors = { ...errors };
      delete newErrors[e.target.name];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
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
        const msg = 'Registration failed. Please try again.';
        setErrors({ general: msg });
        showToast(msg, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const highlights = [
    { icon: Zap, title: 'Real-time feeds', desc: 'Stay updated with live tweets from people you follow.' },
    { icon: Globe, title: 'Global community', desc: 'Connect with people from around the world.' },
    { icon: Shield, title: 'Safe & secure', desc: 'Your data is protected with enterprise-grade security.' },
    { icon: Lock, title: 'Your space', desc: 'Control who sees your content with privacy settings.' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--bg-color)]">
      {/* Left Side - Branding Hero */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden items-center justify-center bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#1da1f2]">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 150, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%]"
            style={{
              background: 'radial-gradient(circle at 60% 30%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(circle at 40% 70%, rgba(255,255,255,0.04) 0%, transparent 40%)'
            }}
          />
          {/* Floating orbs */}
          <motion.div
            animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[20%] left-[25%] w-40 h-40 rounded-full bg-white/[0.05] blur-2xl"
          />
          <motion.div
            animate={{ y: [-15, 15, -15], x: [-8, 8, -8] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-[20%] right-[20%] w-56 h-56 rounded-full bg-white/[0.04] blur-3xl"
          />
          <motion.div
            animate={{ y: [10, -25, 10] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[55%] left-[10%] w-28 h-28 rounded-full bg-white/[0.06] blur-xl"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-white/15 backdrop-blur-sm rounded-2xl">
                <Feather size={42} className="text-white" />
              </div>
              <span className="text-white text-4xl font-black tracking-tight">Chirp</span>
            </div>

            <h1 className="text-white text-[3rem] font-black leading-[1.1] tracking-tight mb-4">
              Join Chirp today
            </h1>
            <p className="text-white/70 text-lg font-medium mb-10">
              Create your account and start sharing with the world.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="grid grid-cols-2 gap-4"
          >
            {highlights.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1, ease: 'easeOut' }}
                className="bg-white/[0.08] backdrop-blur-sm rounded-2xl p-4 border border-white/[0.08] hover:bg-white/[0.12] transition-all duration-300 group"
              >
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center mb-3 group-hover:bg-white/25 transition-colors">
                  <item.icon size={18} className="text-white" />
                </div>
                <h3 className="text-white font-bold text-sm mb-1">{item.title}</h3>
                <p className="text-white/60 text-xs leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Decorative bottom text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1 }}
            className="mt-10 flex items-center gap-2 text-white/40 text-sm"
          >
            <Sparkles size={14} />
            <span>Your voice matters — make it heard.</span>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile Logo */}
          <div className="flex lg:hidden justify-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[var(--color-chirp)]/10 rounded-xl">
                <Feather size={32} className="text-[var(--color-chirp)]" />
              </div>
              <span className="text-[var(--text-color)] text-2xl font-black">Chirp</span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-[28px] sm:text-[32px] font-black text-[var(--text-color)] tracking-tight leading-tight">
              Create your account
            </h2>
            <p className="text-[var(--text-muted)] mt-2 text-[15px]">
              It's quick and easy. Let's get you started.
            </p>
          </div>

          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm mb-5 border border-red-500/20 font-medium"
            >
              {errors.general}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input 
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name?.[0]}
              />
              <Input 
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={errors.username?.[0]}
              />
            </div>
            <Input 
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email?.[0]}
            />
            <Input 
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password?.[0]}
            />
            <Input 
              label="Confirm Password"
              name="password_confirmation"
              type="password"
              value={formData.password_confirmation}
              onChange={handleChange}
              error={errors.password_confirmation?.[0]}
            />
            
            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                fullWidth
                className="btn-gradient w-full text-white border-0 shadow-lg hover:shadow-xl transition-all text-[15px] py-3.5"
              >
                Create account
              </Button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 py-1">
              <div className="flex-1 h-px bg-[var(--border-color)]" />
              <span className="text-[var(--text-muted)] text-sm font-medium">or</span>
              <div className="flex-1 h-px bg-[var(--border-color)]" />
            </div>

            <div className="text-center">
              <p className="text-[var(--text-muted)] text-[15px]">
                Already have an account?{' '}
                <Link to="/login" className="text-[var(--color-chirp)] font-bold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[var(--text-muted)] text-xs leading-relaxed">
              By signing up, you agree to the{' '}
              <span className="text-[var(--color-chirp)] hover:underline cursor-pointer">Terms of Service</span>
              {' '}and{' '}
              <span className="text-[var(--color-chirp)] hover:underline cursor-pointer">Privacy Policy</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
