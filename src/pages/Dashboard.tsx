import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { 
  GraduationCap, 
  Users, 
  UserCircle,
  ShieldCheck, 
  BrainCircuit, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  Clock,
  BookOpen,
  Award,
  Briefcase,
  Lightbulb
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const [studentData, setStudentData] = useState<any>(null);
  const [marks, setMarks] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    students: 0,
    faculty: 0,
    parents: 0,
    attendance: 0,
    avgCgpa: 0
  });

  useEffect(() => {
    if (profile?.role === 'student' && user) {
      const unsubStudent = onSnapshot(doc(db, 'students', user.uid), (snapshot) => {
        setStudentData(snapshot.exists() ? snapshot.data() : null);
      });
      const unsubMarks = onSnapshot(query(collection(db, 'marks'), where('studentUid', '==', user.uid)), (snapshot) => {
        setMarks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      const unsubAI = onSnapshot(doc(db, 'ai_insights', user.uid), (snapshot) => {
        setAiInsight(snapshot.exists() ? snapshot.data() : null);
      });
      return () => { unsubStudent(); unsubMarks(); unsubAI(); };
    }

    if (profile?.role === 'admin' || profile?.role === 'ai_admin') {
      const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const users = snapshot.docs.map(doc => doc.data());
        setStats({
          students: users.filter(u => u.role === 'student').length,
          faculty: users.filter(u => u.role === 'faculty').length,
          parents: users.filter(u => u.role === 'parent').length,
          attendance: 85, // Mock global avg
          avgCgpa: 7.8 // Mock global avg
        });
      });
      return () => unsubUsers();
    }
  }, [profile, user]);

  const renderStudentDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="CGPA" value={studentData?.cgpa || '0.0'} color="text-blue-600" />
        <StatCard icon={Calendar} label="Attendance" value={`${studentData?.attendance || 0}%`} color="text-green-600" />
        <StatCard icon={BookOpen} label="Semester" value={studentData?.semester || '1'} color="text-purple-600" />
        <StatCard icon={Award} label="Skills" value={studentData?.skills?.length || 0} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Academic Performance
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marks}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg text-white">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5" />
            AI Growth Roadmap
          </h3>
          {aiInsight ? (
            <div className="space-y-4">
              <p className="text-indigo-100 text-sm leading-relaxed">{aiInsight.roadmap}</p>
              <div className="space-y-2">
                <p className="font-semibold text-sm">Key Suggestions:</p>
                {aiInsight.suggestions?.map((s: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-white/10 p-2 rounded-lg">
                    <CheckCircle className="w-3 h-3 text-indigo-300" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Lightbulb className="w-12 h-12 mb-2 text-indigo-300 animate-pulse" />
              <p className="text-indigo-100 text-sm">AI is analyzing your performance...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={stats.students} color="text-blue-600" />
        <StatCard icon={GraduationCap} label="Faculty" value={stats.faculty} color="text-green-600" />
        <StatCard icon={ShieldCheck} label="Parents" value={stats.parents} color="text-orange-600" />
        <StatCard icon={TrendingUp} label="Avg Performance" value={`${stats.avgCgpa} CGPA`} color="text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Portal Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Students', value: stats.students },
                    { name: 'Faculty', value: stats.faculty },
                    { name: 'Parents', value: stats.parents }
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#4f46e5" />
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">System Health</h3>
          <div className="space-y-4">
            <HealthItem label="Database Connectivity" status="Healthy" />
            <HealthItem label="AI Engine" status="Online" />
            <HealthItem label="Authentication Service" status="Active" />
            <HealthItem label="Real-time Sync" status="Operational" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Welcome back, {user?.displayName || 'User'}!</h2>
        <p className="text-slate-500">Here's what's happening in your academic ecosystem today.</p>
      </header>

      {profile?.role === 'student' && renderStudentDashboard()}
      {(profile?.role === 'admin' || profile?.role === 'ai_admin') && renderAdminDashboard()}
      {profile?.role === 'faculty' && (
        <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-slate-100">
          <Users className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-800">Faculty Dashboard</h3>
          <p className="text-slate-500 mt-2">Manage your students, attendance, and mentorships from the Faculty Portal.</p>
        </div>
      )}
      {profile?.role === 'parent' && (
        <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-slate-100">
          <UserCircle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-800">Parent Dashboard</h3>
          <p className="text-slate-500 mt-2">Track your child's progress and manage fees from the Parent Portal.</p>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
    <div className={`p-3 rounded-xl bg-slate-50 w-fit mb-4 ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

const HealthItem = ({ label, status }: any) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <span className="text-xs font-bold text-green-600 uppercase">{status}</span>
    </div>
  </div>
);

export default Dashboard;
