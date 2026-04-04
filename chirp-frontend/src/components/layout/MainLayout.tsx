import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)]">
      <div className="container mx-auto flex max-w-7xl">
        
        {/* Left Sidebar (Desktop/Tablet) */}
        <header className="hidden sm:flex w-20 xl:w-72 flex-col justify-between border-r border-[var(--border-color)] pb-4 pt-2 px-2 xl:px-6 sticky top-0 h-screen">
          <Sidebar />
        </header>

        {/* Main Feed Container */}
        <main className="flex-1 min-h-screen border-r border-[var(--border-color)] max-w-[600px] w-full pb-16 sm:pb-0">
          <Outlet />
        </main>

        {/* Right Panel (Desktop only) */}
        <aside className="hidden lg:block w-80 xl:w-96 pl-8 py-4 sticky top-0 h-screen overflow-y-auto hide-scrollbar">
          <RightPanel />
        </aside>
        
        {/* Mobile Bottom Nav */}
        <nav className="sm:hidden fixed bottom-0 w-full bg-[var(--bg-color)] border-t border-[var(--border-color)] flex justify-around p-3 z-50">
          Mobile Nav Placeholder
        </nav>
      </div>
    </div>
  );
}
