import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Briefcase, Map, BookOpen, Users, LogOut, Shield, Star, Menu, X, Megaphone, Bell, Code2 } from 'lucide-react';

const navItems = [
  { path: '/admin', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
  { path: '/admin/careers', icon: <Briefcase className="h-5 w-5" />, label: 'Manage Careers' },
  { path: '/admin/roadmaps', icon: <Map className="h-5 w-5" />, label: 'Manage Roadmaps' },
  { path: '/admin/skills', icon: <Code2 className="h-5 w-5" />, label: 'Manage Skills' },
  { path: '/admin/skill-roadmaps', icon: <Map className="h-5 w-5" />, label: 'Manage Skill Roadmaps' },
  { path: '/admin/resources', icon: <BookOpen className="h-5 w-5" />, label: 'Roadmap Resources' },
  { path: '/admin/career-resources', icon: <Star className="h-5 w-5" />, label: 'Career Resources' },
  { path: '/admin/users', icon: <Users className="h-5 w-5" />, label: 'Manage Users' },
  { path: '/admin/announcements', icon: <Megaphone className="h-5 w-5" />, label: 'Announcements' },
  { path: '/admin/notifications', icon: <Bell className="h-5 w-5" />, label: 'Push Notifications' },
];

export default function AdminLayout({ children }) {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <Link to="/admin" className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="text-emerald-600 h-6 w-6" />
            <span>Admin Panel</span>
          </Link>
        </div>
        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}>
                {item.icon} {item.label}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-100 space-y-2">
          <Link to="/" className="block px-4 py-2.5 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all text-center border border-slate-100">
            ← Back to Site
          </Link>
          <button onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-medium">
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* Mobile header */}
        <div className="md:hidden mb-6">
          <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 hover:bg-slate-50 rounded-lg text-slate-500 focus:outline-none" aria-label="Toggle Menu">
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <Link to="/admin" className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Shield className="text-emerald-600 h-5 w-5" /> Admin
              </Link>
            </div>
            <button onClick={handleSignOut} className="text-red-600 text-sm font-medium">Log Out</button>
          </div>

          {/* Mobile Dropdown Menu */}
          {menuOpen && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-md space-y-1 animate-fade-in">
              {navItems.map(item => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/admin' && location.pathname.startsWith(item.path));
                return (
                  <Link key={item.path} to={item.path} onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}>
                    {item.icon} {item.label}
                  </Link>
                );
              })}
              <div className="border-t border-slate-100 pt-2 mt-2">
                <Link to="/" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all text-center border border-slate-100">
                  ← Back to Site
                </Link>
              </div>
            </div>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
