import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { db } from '../firebase';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  collection, 
  query, 
  where, 
  addDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  User, 
  Award, 
  Briefcase, 
  Plus, 
  Save, 
  BrainCircuit, 
  Sparkles,
  MessageSquare,
  Send,
  FileText,
  Code,
  Download,
  Trash2,
  TrendingUp,
  BookOpen,
  Calendar,
  CheckCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getAIInstantAnswer, 
  summarizeAssignment, 
  solveDoubt, 
  debugCode, 
  buildResume,
  verifyCertificationWithAI
} from '../services/geminiService';
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
import Markdown from 'react-markdown';

const StudentPortal: React.FC = () => {
  const { user, profile } = useAuth();
  const [studentData, setStudentData] = useState<any>(null);
  const [marks, setMarks] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  // Form states
  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState({ title: '', issuer: '', date: '', url: '' });
  const [newProject, setNewProject] = useState({ title: '', description: '', role: '', type: 'project' });
  
  // AI Tool states
  const [activeAiTool, setActiveAiTool] = useState<'chat' | 'summarize' | 'doubt' | 'debug' | 'resume'>('chat');
  const [aiInput, setAiInput] = useState('');
  const [aiExtraInput, setAiExtraInput] = useState(''); // For subject or language
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [verifyingCertId, setVerifyingCertId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const unsubStudent = onSnapshot(doc(db, 'students', user.uid), (snapshot) => {
        setStudentData(snapshot.exists() ? snapshot.data() : null);
      });
      const unsubMarks = onSnapshot(query(collection(db, 'marks'), where('studentUid', '==', user.uid)), (snapshot) => {
        setMarks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      const unsubCerts = onSnapshot(query(collection(db, 'certifications'), where('studentUid', '==', user.uid)), (snapshot) => {
        setCerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      const unsubProjects = onSnapshot(query(collection(db, 'projects'), where('studentUid', '==', user.uid)), (snapshot) => {
        setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      
      return () => { unsubStudent(); unsubMarks(); unsubCerts(); unsubProjects(); };
    }
  }, [user]);

  const handleAddSkill = async () => {
    if (!newSkill.trim() || !user) return;
    await updateDoc(doc(db, 'students', user.uid), {
      skills: arrayUnion(newSkill.trim())
    });
    setNewSkill('');
  };

  const handleAddCert = async () => {
    if (!newCert.title || !user) return;
    await addDoc(collection(db, 'certifications'), {
      ...newCert,
      studentUid: user.uid,
      verified: false,
      createdAt: serverTimestamp()
    });
    setNewCert({ title: '', issuer: '', date: '', url: '' });
  };

  const handleAddProject = async () => {
    if (!newProject.title || !user) return;
    await addDoc(collection(db, 'projects'), {
      ...newProject,
      studentUid: user.uid,
      createdAt: serverTimestamp()
    });
    setNewProject({ title: '', description: '', role: '', type: 'project' });
  };

  const handleVerifyCertWithAI = async (cert: any) => {
    if (!cert.url) return;
    setVerifyingCertId(cert.id);
    try {
      const result = await verifyCertificationWithAI(cert.title, cert.issuer, cert.url);
      if (result.isValid && result.confidence > 0.8) {
        await updateDoc(doc(db, 'certifications', cert.id), {
          verified: true,
          aiVerified: true,
          aiConfidence: result.confidence,
          aiReason: result.reason
        });
        alert("Certification verified successfully by AI!");
      } else {
        alert(`AI Verification failed: ${result.reason}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error during AI verification.");
    } finally {
      setVerifyingCertId(null);
    }
  };

  const handleAiAction = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    setAiResponse('');
    try {
      let response = '';
      switch (activeAiTool) {
        case 'chat':
          response = await getAIInstantAnswer(aiInput, { studentData, profile });
          break;
        case 'summarize':
          response = await summarizeAssignment(aiInput);
          break;
        case 'doubt':
          response = await solveDoubt(aiInput, aiExtraInput || 'General');
          break;
        case 'debug':
          response = await debugCode(aiInput, aiExtraInput || 'Auto-detect');
          break;
        case 'resume':
          response = await buildResume(profile, studentData?.skills, projects, certs);
          break;
      }
      setAiResponse(response || 'No response from AI.');
    } catch (err) {
      console.error(err);
      setAiResponse('Error getting AI response.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Student Portal</h2>
          <p className="text-slate-500 mt-1">Your academic command center.</p>
        </div>
        <div className="glass-morphism p-4 rounded-2xl flex items-center gap-4 border border-white/20">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl shadow-inner">
            {user?.displayName?.[0] || 'S'}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-lg">{user?.displayName}</p>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{studentData?.rollNumber}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Stats & Charts */}
        <div className="lg:col-span-8 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={TrendingUp} label="CGPA" value={studentData?.cgpa || '0.0'} color="text-blue-600" bg="bg-blue-50" />
            <StatCard icon={Calendar} label="Attendance" value={`${studentData?.attendance || 0}%`} color="text-green-600" bg="bg-green-50" />
            <StatCard icon={BookOpen} label="Semester" value={studentData?.semester || '1'} color="text-purple-600" bg="bg-purple-50" />
            <StatCard icon={Award} label="Skills" value={studentData?.skills?.length || 0} color="text-orange-600" bg="bg-orange-50" />
          </div>

          {/* Performance Chart */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              Academic Progress
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marks}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="subject" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Skills & Projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-orange-600" />
                Skills Dashboard
              </h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {studentData?.skills?.map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-xl text-sm font-bold flex items-center gap-2">
                    {skill}
                    <button onClick={async () => {
                      const updated = studentData.skills.filter((s: string) => s !== skill);
                      await updateDoc(doc(db, 'students', user!.uid), { skills: updated });
                    }} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="e.g. Python, React..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                />
                <button onClick={handleAddSkill} className="p-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200">
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-blue-600" />
                Projects & Internships
              </h3>
              <div className="space-y-4 mb-6 max-h-48 overflow-y-auto pr-2">
                {projects.map((p) => (
                  <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group relative">
                    <p className="font-bold text-slate-800">{p.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{p.type} • {p.role}</p>
                    <button 
                      onClick={() => deleteDoc(doc(db, 'projects', p.id))}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="Project Title"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <select 
                    value={newProject.type}
                    onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                    className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="project">Project</option>
                    <option value="internship">Internship</option>
                  </select>
                  <button onClick={handleAddProject} className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
                    Add Record
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Certifications Section */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-600" />
              Certifications & Achievements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2">
                  {certs.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Award className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">No certifications added yet.</p>
                    </div>
                  )}
                  {certs.map((cert) => (
                    <div key={cert.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group relative hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800 text-lg">{cert.title}</p>
                          <p className="text-sm text-slate-500 font-medium">{cert.issuer} • {cert.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {cert.verified ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Pending
                              </span>
                              {cert.url && (
                                <button 
                                  onClick={() => handleVerifyCertWithAI(cert)}
                                  disabled={verifyingCertId === cert.id}
                                  className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-all disabled:opacity-50"
                                  title="Verify with AI"
                                >
                                  {verifyingCertId === cert.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <BrainCircuit className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {cert.url && (
                        <a 
                          href={cert.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          <Download className="w-3 h-3" /> View Certificate
                        </a>
                      )}
                      <button 
                        onClick={() => deleteDoc(doc(db, 'certifications', cert.id))}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Add New Certification</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Title</label>
                    <input 
                      type="text" 
                      value={newCert.title}
                      onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                      placeholder="e.g. AWS Certified Solutions Architect"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Issuer</label>
                    <input 
                      type="text" 
                      value={newCert.issuer}
                      onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                      placeholder="e.g. Amazon Web Services"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Date</label>
                      <input 
                        type="date" 
                        value={newCert.date}
                        onChange={(e) => setNewCert({ ...newCert, date: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Verification URL</label>
                      <input 
                        type="url" 
                        value={newCert.url}
                        onChange={(e) => setNewCert({ ...newCert, url: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleAddCert}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Certification
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: AI Tools */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-indigo-600 rounded-3xl shadow-xl overflow-hidden flex flex-col h-full min-h-[600px]">
            <div className="p-6 bg-indigo-700/50 border-b border-white/10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BrainCircuit className="w-6 h-6" />
                AI Study Suite
              </h3>
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                <AiToolTab active={activeAiTool === 'chat'} onClick={() => setActiveAiTool('chat')} icon={MessageSquare} label="Chat" />
                <AiToolTab active={activeAiTool === 'summarize'} onClick={() => setActiveAiTool('summarize')} icon={FileText} label="Summary" />
                <AiToolTab active={activeAiTool === 'doubt'} onClick={() => setActiveAiTool('doubt')} icon={Sparkles} label="Doubt" />
                <AiToolTab active={activeAiTool === 'debug'} onClick={() => setActiveAiTool('debug')} icon={Code} label="Debug" />
                <AiToolTab active={activeAiTool === 'resume'} onClick={() => setActiveAiTool('resume')} icon={Download} label="Resume" />
              </div>
            </div>

            <div className="flex-1 p-6 flex flex-col gap-4">
              <div className="flex-1 bg-white/10 rounded-2xl p-4 overflow-y-auto text-sm text-indigo-50 leading-relaxed custom-scrollbar">
                {isAiLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <p className="animate-pulse">AI is thinking...</p>
                  </div>
                ) : aiResponse ? (
                  <div className="markdown-body prose prose-invert prose-sm max-w-none">
                    <Markdown>{aiResponse}</Markdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                    <BrainCircuit className="w-12 h-12 mb-4" />
                    <p>Select a tool and enter your query to get started.</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {activeAiTool === 'doubt' && (
                  <input 
                    type="text" 
                    value={aiExtraInput}
                    onChange={(e) => setAiExtraInput(e.target.value)}
                    placeholder="Subject (e.g. Physics)"
                    className="w-full px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white placeholder:text-indigo-200 focus:outline-none"
                  />
                )}
                {activeAiTool === 'debug' && (
                  <input 
                    type="text" 
                    value={aiExtraInput}
                    onChange={(e) => setAiExtraInput(e.target.value)}
                    placeholder="Language (e.g. JavaScript)"
                    className="w-full px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white placeholder:text-indigo-200 focus:outline-none"
                  />
                )}
                <div className="relative">
                  <textarea 
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder={
                      activeAiTool === 'chat' ? "Ask a question..." :
                      activeAiTool === 'summarize' ? "Paste assignment content..." :
                      activeAiTool === 'doubt' ? "Describe your doubt..." :
                      activeAiTool === 'debug' ? "Paste your code..." :
                      "Click send to build your resume"
                    }
                    rows={activeAiTool === 'resume' ? 1 : 3}
                    className="w-full px-4 py-3 rounded-2xl bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-400/50 transition-all resize-none"
                  />
                  <button 
                    onClick={handleAiAction}
                    disabled={isAiLoading}
                    className="absolute bottom-3 right-3 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bg }: any) => (
  <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
    <div className={`p-3 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform ${bg} ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
  </div>
);

const AiToolTab = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
      active ? 'bg-white text-indigo-600 shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const InfoItem = ({ label, value }: any) => (
  <div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="text-xl font-bold text-slate-800 mt-1">{value || 'N/A'}</p>
  </div>
);

const SuggestionItem = ({ text }: any) => (
  <li className="flex items-start gap-3 text-sm text-slate-600">
    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
    {text}
  </li>
);

export default StudentPortal;
