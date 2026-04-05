import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { 
  BrainCircuit, 
  Sparkles, 
  TrendingUp, 
  Award, 
  Briefcase, 
  RefreshCw, 
  CheckCircle,
  MessageSquare,
  Zap,
  Users,
  Target,
  Network,
  Cpu,
  BarChart3,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateStudentRoadmap } from '../services/geminiService';

const AIAdminPortal: React.FC = () => {
  const { profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'intelligence' | 'mentorship' | 'interventions'>('intelligence');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (profile?.role === 'ai_admin' || profile?.role === 'admin') {
      const unsub = onSnapshot(collection(db, 'students'), (snapshot) => {
        setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsub();
    }
  }, [profile]);

  const handleGenerateInsight = async () => {
    if (!selectedStudent) return;
    setIsGenerating(true);
    try {
      const insight = await generateStudentRoadmap(selectedStudent);
      await setDoc(doc(db, 'ai_insights', selectedStudent.uid), {
        ...insight,
        studentUid: selectedStudent.uid,
        updatedAt: serverTimestamp()
      });
      alert("AI Insight generated and saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error generating AI insight.");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <BrainCircuit className="w-10 h-10 text-purple-600" />
            AI Intelligence Hub
          </h2>
          <p className="text-slate-500 font-medium">Performance Intelligence & Automated Interventions.</p>
        </div>
        
        <nav className="flex bg-slate-100 p-1.5 rounded-2xl">
          <TabButton active={activeTab === 'intelligence'} onClick={() => setActiveTab('intelligence')} label="Intelligence" icon={Cpu} />
          <TabButton active={activeTab === 'mentorship'} onClick={() => setActiveTab('mentorship')} label="Mentorship" icon={Network} />
          <TabButton active={activeTab === 'interventions'} onClick={() => setActiveTab('interventions')} label="Interventions" icon={Zap} />
        </nav>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Student Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm bg-slate-50"
              />
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full p-4 rounded-2xl text-left transition-all border-2 ${
                    selectedStudent?.id === student.id 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold text-slate-800 text-sm">{student.rollNumber}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sem {student.semester}</span>
                    <span className="text-[10px] font-black text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">CGPA {student.cgpa}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-3 space-y-8">
          <AnimatePresence mode="wait">
            {selectedStudent ? (
              <motion.div
                key={selectedStudent.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {activeTab === 'intelligence' && (
                  <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900">Performance Intelligence</h3>
                        <p className="text-slate-500 text-sm">Deep analysis for {selectedStudent.rollNumber}</p>
                      </div>
                      <button 
                        onClick={handleGenerateInsight}
                        disabled={isGenerating}
                        className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-200 disabled:opacity-50"
                      >
                        {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        {isGenerating ? 'Analyzing...' : 'Run Intelligence Engine'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <IntelligenceCard 
                        icon={Target} 
                        label="Success Probability" 
                        value="92%" 
                        desc="Based on current trends"
                        color="text-green-600"
                        bg="bg-green-50"
                      />
                      <IntelligenceCard 
                        icon={TrendingUp} 
                        label="Growth Velocity" 
                        value="+0.4" 
                        desc="CGPA improvement rate"
                        color="text-blue-600"
                        bg="bg-blue-50"
                      />
                      <IntelligenceCard 
                        icon={Award} 
                        label="Skill Percentile" 
                        value="Top 5%" 
                        desc="Compared to peers"
                        color="text-purple-600"
                        bg="bg-purple-50"
                      />
                    </div>

                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-purple-400" />
                        <h4 className="font-bold">AI Predictive Analysis</h4>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        The intelligence engine predicts a high likelihood of placement in Tier-1 tech firms. 
                        Recommendation: Focus on advanced system design and distributed systems to bridge the current gap.
                      </p>
                    </div>
                  </section>
                )}

                {activeTab === 'mentorship' && (
                  <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="text-2xl font-black text-slate-900 mb-8">Mentorship Matching</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <MentorMatchCard 
                        name="Dr. Sarah Wilson" 
                        role="AI Research Head" 
                        match="98%" 
                        reason="Shared interest in NLP & Computer Vision"
                      />
                      <MentorMatchCard 
                        name="Prof. James Chen" 
                        role="Cloud Architect" 
                        match="85%" 
                        reason="Alignment with cloud-native project history"
                      />
                    </div>
                  </section>
                )}

                {activeTab === 'interventions' && (
                  <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="text-2xl font-black text-slate-900 mb-8">Real-time Interventions</h3>
                    <div className="space-y-4">
                      <InterventionItem 
                        type="Academic" 
                        text="Low attendance in Data Structures detected. Sending automated resource pack." 
                        status="Sent"
                      />
                      <InterventionItem 
                        type="Career" 
                        text="Resume hasn't been updated in 3 months. Prompting for project additions." 
                        status="Pending"
                      />
                      <InterventionItem 
                        type="Skill" 
                        text="New certification in AWS found. Updating career roadmap." 
                        status="Completed"
                      />
                    </div>
                  </section>
                )}
              </motion.div>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                  <Users className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">No Student Selected</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-2">Select a student from the directory to access AI intelligence tools.</p>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
      active ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'text-slate-500 hover:text-slate-700'
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const IntelligenceCard = ({ icon: Icon, label, value, desc, color, bg }: any) => (
  <div className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50">
    <div className={`p-3 rounded-2xl w-fit mb-4 ${bg} ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
    <p className="text-xs text-slate-500 mt-1">{desc}</p>
  </div>
);

const MentorMatchCard = ({ name, role, match, reason }: any) => (
  <div className="p-6 rounded-[2rem] border border-slate-100 hover:border-purple-200 transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
        {name[0]}
      </div>
      <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase">
        {match} Match
      </span>
    </div>
    <h4 className="font-bold text-slate-800">{name}</h4>
    <p className="text-xs text-slate-500 mb-3">{role}</p>
    <p className="text-xs text-slate-600 leading-relaxed italic">"{reason}"</p>
  </div>
);

const InterventionItem = ({ type, text, status }: any) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
    <div className="flex items-center gap-4">
      <div className={`w-2 h-2 rounded-full ${
        status === 'Sent' ? 'bg-green-500' : 
        status === 'Pending' ? 'bg-amber-500' : 
        'bg-blue-500'
      }`} />
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{type}</p>
        <p className="text-sm text-slate-700 font-medium">{text}</p>
      </div>
    </div>
    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
      status === 'Sent' ? 'bg-green-100 text-green-700' : 
      status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
      'bg-blue-100 text-blue-700'
    }`}>
      {status}
    </span>
  </div>
);

export default AIAdminPortal;
