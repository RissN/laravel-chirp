import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Bell, Mail, Bookmark, User, LogOut, Feather, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Explore', path: '/explore', icon: Search },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Messages', path: '/messages', icon: Mail },
    { name: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { name: 'Profile', path: `/${user?.username}`, icon: User },
  ];

  return (
    <>
      <div className="flex w-full items-center justify-center xl:justify-start py-2">
        <Link to="/home" className="p-3 text-[var(--color-chirp)] hover:bg-[var(--hover-bg)] rounded-full transition">
          <Feather size={32} fill="currentColor" />
        </Link>
      </div>
      
      <nav className="mt-2 space-y-2 flex-1 w-full">
        {navLinks.map((link) => {
          const isActive = location.pathname.startsWith(link.path);
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              to={link.path}
              className="flex items-center justify-center xl:justify-start gap-4 p-3 hover:bg-[var(--hover-bg)] rounded-full transition w-max mx-auto xl:mx-0 group"
            >
              <Icon size={28} className={isActive ? 'font-bold' : ''} />
              <span className={`hidden xl:block text-xl ${isActive ? 'font-bold' : ''}`}>
                {link.name}
              </span>
            </Link>
          );
        })}
        
        <button 
          onClick={toggleTheme}
          className="flex items-center justify-center xl:justify-start gap-4 p-3 hover:bg-[var(--hover-bg)] rounded-full transition w-max mx-auto xl:mx-0 group"
        >
          {isDark ? <Sun size={28} /> : <Moon size={28} />}
          <span className="hidden xl:block text-xl">
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        <button className="bg-[var(--color-chirp)] text-white font-bold w-12 h-12 rounded-full xl:w-full xl:h-14 mt-4 hover:bg-[var(--color-chirp-hover)] transition flex items-center justify-center shadow-md">
          <span className="hidden xl:block text-lg">Post</span>
          <span className="xl:hidden">+</span>
        </button>
      </nav>

      {user && (
        <div className="mt-auto flex items-center justify-center xl:justify-between p-3 hover:bg-[var(--hover-bg)] rounded-full cursor-pointer transition w-full">
          <div className="flex items-center gap-3">
            <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} className="w-10 h-10 rounded-full" />
            <div className="hidden xl:block overflow-hidden">
              <p className="font-bold truncate">{user.name}</p>
              <p className="text-[var(--text-muted)] truncate">@{user.username}</p>
            </div>
          </div>
          <button onClick={logout} className="hidden xl:block text-[var(--text-muted)] hover:text-red-500 transition">
            <LogOut size={20} />
          </button>
        </div>
      )}
    </>
  );
}
