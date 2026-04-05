import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { 
  Users, 
  Shield, 
  Settings, 
  Search, 
  Trash2, 
  UserPlus, 
  Activity, 
  Database, 
  Server,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const AdminPortal: React.FC = () => {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'system' | 'finance'>('users');
  const [fees, setFees] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      const unsubFees = onSnapshot(collection(db, 'fees'), (snapshot) => {
        setFees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => { unsubUsers(); unsubFees(); };
    }
  }, [profile]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteDoc(doc(db, 'users', userId));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const revenueData = [
    { month: 'Jan', amount: 45000 },
    { month: 'Feb', amount: 52000 },
    { month: 'Mar', amount: 48000 },
    { month: 'Apr', amount: 61000 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Admin Control</h2>
          <p className="text-slate-500 font-medium">System-wide management & oversight.</p>
        </div>
        
        <nav className="flex bg-slate-100 p-1.5 rounded-2xl">
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Users" icon={Users} />
          <TabButton active={activeTab === 'system'} onClick={() => setActiveTab('system')} label="System" icon={Activity} />
          <TabButton active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} label="Finance" icon={DollarSign} />
        </nav>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'users' && (
          <motion.div 
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Users" value={users.length} color="text-indigo-600" bg="bg-indigo-50" />
              <StatCard icon={Shield} label="Admins" value={users.filter(u => u.role === 'admin').length} color="text-red-600" bg="bg-red-50" />
              <StatCard icon={CheckCircle} label="Active Now" value={Math.floor(users.length * 0.4)} color="text-green-600" bg="bg-green-50" />
              <StatCard icon={AlertCircle} label="Pending" value={0} color="text-amber-600" bg="bg-amber-50" />
            </div>

            <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-800">User Directory</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-64 bg-slate-50"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                              {u.email?.[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{u.email}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <select 
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                            className="bg-slate-100 border-none rounded-lg px-3 py-1 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="parent">Parent</option>
                            <option value="admin">Admin</option>
                            <option value="ai-admin">AI Admin</option>
                          </select>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase">Active</span>
                        </td>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'system' && (
          <motion.div 
            key="system"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                  <Server className="w-6 h-6 text-indigo-600" />
                  Server Load (Real-time)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { time: '10:00', load: 32 },
                      { time: '10:05', load: 45 },
                      { time: '10:10', load: 38 },
                      { time: '10:15', load: 52 },
                      { time: '10:20', load: 48 },
                      { time: '10:25', load: 42 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="load" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <Database className="w-8 h-8 text-blue-500 mb-4" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Database Health</p>
                  <p className="text-2xl font-black text-slate-900 mt-2">99.9% Uptime</p>
                  <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[99.9%]" />
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <Activity className="w-8 h-8 text-indigo-500 mb-4" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">API Latency</p>
                  <p className="text-2xl font-black text-slate-900 mt-2">124ms</p>
                  <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[40%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <section className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                <h3 className="text-xl font-bold mb-6">System Logs</h3>
                <div className="space-y-4">
                  <LogItem time="10:24" text="New faculty user registered" type="info" />
                  <LogItem time="10:20" text="Database backup completed" type="success" />
                  <LogItem time="10:15" text="High CPU usage detected" type="warning" />
                  <LogItem time="10:02" text="System update applied" type="info" />
                </div>
              </section>
            </div>
          </motion.div>
        )}

        {activeTab === 'finance' && (
          <motion.div 
            key="finance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start">
                  <DollarSign className="w-10 h-10 text-green-500 opacity-50" />
                  <span className="flex items-center text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">
                    <ArrowUpRight className="w-3 h-3 mr-1" /> +12%
                  </span>
                </div>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-4">Total Revenue</p>
                <p className="text-4xl font-black mt-2 text-slate-900">₹2.4M</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start">
                  <TrendingUp className="w-10 h-10 text-indigo-500 opacity-50" />
                  <span className="flex items-center text-indigo-500 text-xs font-bold bg-indigo-50 px-2 py-1 rounded-lg">
                    <ArrowUpRight className="w-3 h-3 mr-1" /> +8%
                  </span>
                </div>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-4">Fee Collection</p>
                <p className="text-4xl font-black mt-2 text-slate-900">84%</p>
              </div>
            </div>

            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-8">Revenue Trends</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#6366f1" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
      active ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const StatCard = ({ icon: Icon, label, value, color, bg }: any) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
    <div className={`p-3 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform ${bg} ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
  </div>
);

const LogItem = ({ time, text, type }: any) => (
  <div className="flex items-center gap-3 text-xs">
    <span className="text-slate-500 font-mono">{time}</span>
    <div className={`w-1.5 h-1.5 rounded-full ${
      type === 'success' ? 'bg-green-500' : 
      type === 'warning' ? 'bg-amber-500' : 
      'bg-blue-500'
    }`} />
    <span className="text-slate-300">{text}</span>
  </div>
);

export default AdminPortal;
