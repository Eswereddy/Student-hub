import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { auth } from '../firebase';
import { 
  LayoutDashboard, 
  UserCircle, 
  GraduationCap, 
  Users, 
  ShieldCheck, 
  BrainCircuit, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['student', 'faculty', 'parent', 'admin', 'ai_admin'] },
    { name: 'Student Portal', path: '/student', icon: GraduationCap, roles: ['student', 'admin', 'ai_admin'] },
    { name: 'Faculty Portal', path: '/faculty', icon: Users, roles: ['faculty', 'admin', 'ai_admin'] },
    { name: 'Parent Portal', path: '/parent', icon: UserCircle, roles: ['parent', 'admin', 'ai_admin'] },
    { name: 'Admin Portal', path: '/admin', icon: ShieldCheck, roles: ['admin', 'ai_admin'] },
    { name: 'AI Admin', path: '/ai-admin', icon: BrainCircuit, roles: ['ai_admin', 'admin'] },
  ];

  const filteredNavItems = navItems.filter(item => profile && item.roles.includes(profile.role));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            <GraduationCap className="w-8 h-8" />
            EduSphere
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {user?.displayName?.[0] || profile?.role?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.displayName || 'User'}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
          <GraduationCap className="w-6 h-6" />
          EduSphere
        </h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 z-40 bg-white md:hidden pt-20"
          >
            <nav className="p-4 space-y-2">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl ${
                    location.pathname === item.path
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-lg font-medium">{item.name}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-4 text-red-600"
              >
                <LogOut className="w-6 h-6" />
                <span className="text-lg font-medium">Logout</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default Layout;
