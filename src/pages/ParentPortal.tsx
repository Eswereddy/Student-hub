import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Heart, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  BrainCircuit, 
  ShieldCheck,
  Clock,
  ArrowRight,
  DollarSign,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const ParentPortal: React.FC = () => {
  const { user, profile } = useAuth();
  const [childData, setChildData] = useState<any>(null);
  const [childMarks, setChildMarks] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'fees' | 'ai'>('overview');

  useEffect(() => {
    if (profile?.role === 'parent' && profile.childRollNumber) {
      // Fetch child profile
      const q = query(collection(db, 'students'), where('rollNumber', '==', profile.childRollNumber));
      const unsubChild = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          setChildData({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        }
      });

      // Fetch child marks
      const unsubMarks = onSnapshot(collection(db, 'marks'), (snapshot) => {
        const studentMarks = snapshot.docs
          .map(doc => doc.data())
          .filter((m: any) => m.studentUid === childData?.uid);
        setChildMarks(studentMarks);
      });

      // Fetch fees
      const unsubFees = onSnapshot(collection(db, 'fees'), (snapshot) => {
        const studentFees = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((f: any) => f.studentUid === childData?.uid);
        setFees(studentFees);
      });

      return () => { unsubChild(); unsubMarks(); unsubFees(); };
    }
  }, [profile, childData?.uid]);

  const handlePayFee = async (feeId: string) => {
    try {
      await updateDoc(doc(db, 'fees', feeId), {
        status: 'paid',
        paidAt: serverTimestamp()
      });
      alert("Payment successful!");
    } catch (err) {
      console.error(err);
    }
  };

  const chartData = childMarks.map((m, i) => ({
    name: m.subject,
    score: m.score,
    max: m.maxScore
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-pink-100 rounded-3xl flex items-center justify-center text-pink-600 shadow-inner">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Parent Portal</h2>
            <p className="text-slate-500 font-medium">Monitoring {childData?.rollNumber || 'Child'}'s academic journey.</p>
          </div>
        </div>
        
        <nav className="flex bg-slate-100 p-1.5 rounded-2xl">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" icon={TrendingUp} />
          <TabButton active={activeTab === 'fees'} onClick={() => setActiveTab('fees')} label="Fees" icon={CreditCard} />
          <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} label="AI Guidance" icon={BrainCircuit} />
        </nav>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={Calendar} label="Attendance" value={`${childData?.attendance || 0}%`} color="text-indigo-600" bg="bg-indigo-50" />
                <StatCard icon={TrendingUp} label="Current CGPA" value={childData?.cgpa || 'N/A'} color="text-green-600" bg="bg-green-50" />
                <StatCard icon={ShieldCheck} label="Behavior" value="Excellent" color="text-blue-600" bg="bg-blue-50" />
              </div>

              <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-8">Academic Performance</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip />
                      <Area type="monotone" dataKey="score" stroke="#6366f1" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-indigo-400" />
                  Recent Activity
                </h3>
                <div className="space-y-6">
                  {childMarks.slice(0, 3).map((m, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{m.subject} Result</p>
                        <p className="text-xs text-slate-400">Scored {m.score}/{m.maxScore}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <ActionButton label="View Detailed Report" />
                  <ActionButton label="Contact Mentor" />
                  <ActionButton label="Apply for Leave" />
                </div>
              </section>
            </div>
          </motion.div>
        )}

        {activeTab === 'fees' && (
          <motion.div 
            key="fees"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-lg shadow-indigo-200">
                <DollarSign className="w-10 h-10 mb-4 opacity-50" />
                <p className="text-indigo-100 font-bold uppercase text-xs tracking-widest">Total Outstanding</p>
                <p className="text-4xl font-black mt-2">₹{fees.filter(f => f.status === 'pending').reduce((acc, f) => acc + f.amount, 0)}</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <CheckCircle2 className="w-10 h-10 mb-4 text-green-500" />
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Total Paid</p>
                <p className="text-4xl font-black mt-2 text-slate-900">₹{fees.filter(f => f.status === 'paid').reduce((acc, f) => acc + f.amount, 0)}</p>
              </div>
            </div>

            <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">Fee Records</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {fees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6 font-bold text-slate-800">{fee.description}</td>
                        <td className="px-8 py-6 font-black text-slate-900">₹{fee.amount}</td>
                        <td className="px-8 py-6 text-slate-500 text-sm">{fee.dueDate}</td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            fee.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {fee.status}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          {fee.status === 'pending' && (
                            <button 
                              onClick={() => handlePayFee(fee.id)}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                            >
                              Pay Now
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'ai' && (
          <motion.div 
            key="ai"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <section className="bg-indigo-600 p-12 rounded-[3rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full -mb-32 -mr-32 blur-3xl" />
              <BrainCircuit className="w-16 h-16 mb-8 text-indigo-200" />
              <h3 className="text-3xl font-black mb-6 leading-tight">AI Parenting Assistant</h3>
              <p className="text-indigo-100 text-lg leading-relaxed mb-8">
                Get personalized insights into your child's learning patterns, behavioral trends, and future career recommendations based on their academic performance.
              </p>
              <div className="space-y-4">
                <AiInsightItem icon={TrendingUp} text="Child's math performance improved by 15% this month." />
                <AiInsightItem icon={AlertCircle} text="Attendance is slightly below average (72%)." />
                <AiInsightItem icon={BrainCircuit} text="Strong aptitude for Logical Reasoning detected." />
              </div>
            </section>

            <section className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">Ask AI about your child</h3>
              <div className="space-y-4">
                <button className="w-full p-6 bg-slate-50 rounded-2xl text-left hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all group">
                  <p className="font-bold text-slate-700 group-hover:text-indigo-700">"How can I help my child improve in Science?"</p>
                  <p className="text-xs text-slate-400 mt-1">Get a personalized study plan.</p>
                </button>
                <button className="w-full p-6 bg-slate-50 rounded-2xl text-left hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all group">
                  <p className="font-bold text-slate-700 group-hover:text-indigo-700">"What are the best career paths for them?"</p>
                  <p className="text-xs text-slate-400 mt-1">Based on current grades and skills.</p>
                </button>
                <button className="w-full p-6 bg-slate-50 rounded-2xl text-left hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all group">
                  <p className="font-bold text-slate-700 group-hover:text-indigo-700">"Is my child participating in extra-curriculars?"</p>
                  <p className="text-xs text-slate-400 mt-1">Check project and certification status.</p>
                </button>
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
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group">
    <div className={`p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform ${bg} ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-3xl font-black text-slate-900 mt-2">{value}</p>
  </div>
);

const ActionButton = ({ label }: any) => (
  <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-all group">
    <span className="font-bold text-slate-700 group-hover:text-indigo-700">{label}</span>
    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
  </button>
);

const AiInsightItem = ({ icon: Icon, text }: any) => (
  <div className="flex items-start gap-4 p-4 bg-white/10 rounded-2xl border border-white/5">
    <div className="p-2 bg-indigo-500/30 rounded-lg text-indigo-200">
      <Icon className="w-4 h-4" />
    </div>
    <p className="text-sm font-medium leading-relaxed">{text}</p>
  </div>
);

export default ParentPortal;
