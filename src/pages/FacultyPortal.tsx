import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  TrendingUp, 
  Save, 
  Plus, 
  Trash2,
  Edit2,
  Search,
  BrainCircuit,
  BarChart3,
  MessageSquare,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  Camera,
  Scan,
  UserCheck,
  X,
  RefreshCw,
  Award
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getAIInstantAnswer, verifyFace } from '../services/geminiService';

const FacultyPortal: React.FC = () => {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [pendingCerts, setPendingCerts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [newMark, setNewMark] = useState({ subject: '', score: 0, maxScore: 100 });
  
  // AI Co-teacher state
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Face Recognition Attendance state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ match: boolean; confidence: number } | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (profile?.role === 'faculty' || profile?.role === 'admin') {
      const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
        setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      const unsubMarks = onSnapshot(collection(db, 'marks'), (snapshot) => {
        setMarks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      const unsubCerts = onSnapshot(query(collection(db, 'certifications'), where('verified', '==', false)), (snapshot) => {
        setPendingCerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => { unsubStudents(); unsubMarks(); unsubCerts(); };
    }
  }, [profile]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleVerifyFace = async () => {
    if (!selectedStudent || !capturedImage) return;
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      // For demo purposes, we'll use a placeholder if the student doesn't have a photoURL
      // In a real app, we'd fetch the actual stored image
      const storedImage = selectedStudent.photoURL || "https://picsum.photos/seed/student/200/200";
      
      // Convert stored image URL to base64 for Gemini
      const response = await fetch(storedImage);
      const blob = await response.blob();
      const storedBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const result = await verifyFace(capturedImage, storedBase64);
      setVerificationResult(result);

      if (result.match && result.confidence > 0.8) {
        // Mark attendance in Firestore
        await addDoc(collection(db, 'attendance'), {
          studentUid: selectedStudent.uid,
          date: new Date().toISOString().split('T')[0],
          status: 'present',
          method: 'face_recognition',
          timestamp: serverTimestamp()
        });
        alert(`Attendance marked for ${selectedStudent.rollNumber}!`);
      }
    } catch (err) {
      console.error("Verification error:", err);
      alert("Face verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddMark = async () => {
    if (!selectedStudent || !newMark.subject) return;
    try {
      await addDoc(collection(db, 'marks'), {
        studentUid: selectedStudent.uid,
        subject: newMark.subject,
        score: Number(newMark.score),
        maxScore: Number(newMark.maxScore),
        semester: selectedStudent.semester,
        createdAt: serverTimestamp()
      });
      setNewMark({ subject: '', score: 0, maxScore: 100 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;
    setIsAiLoading(true);
    try {
      const response = await getAIInstantAnswer(aiQuery, { students, marks, pendingCerts });
      setAiResponse(response || 'No response from AI.');
    } catch (err) {
      console.error(err);
      setAiResponse('Error getting AI response.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApproveCert = async (certId: string) => {
    try {
      await updateDoc(doc(db, 'certifications', certId), {
        verified: true,
        verifiedBy: user?.uid,
        verifiedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredStudents = students.filter(s => 
    s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.uid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const performanceData = [
    { range: '90-100', count: students.filter(s => s.cgpa >= 9).length },
    { range: '80-90', count: students.filter(s => s.cgpa >= 8 && s.cgpa < 9).length },
    { range: '70-80', count: students.filter(s => s.cgpa >= 7 && s.cgpa < 8).length },
    { range: '<70', count: students.filter(s => s.cgpa < 7).length },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Faculty Dashboard</h2>
          <p className="text-slate-500 mt-1">Classroom management & performance analytics.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-64 bg-white shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
            <FileSpreadsheet className="w-5 h-5" />
            Bulk Import
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Student List & Stats */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={Users} label="Total Students" value={students.length} color="text-blue-600" bg="bg-blue-50" />
            <StatCard icon={AlertTriangle} label="At Risk" value={students.filter(s => s.attendance < 75).length} color="text-red-600" bg="bg-red-50" />
            <StatCard icon={CheckCircle} label="Top Performers" value={students.filter(s => s.cgpa >= 9).length} color="text-green-600" bg="bg-green-50" />
          </div>

          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Student Roster</h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredStudents.length} Students</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Roll Number</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">CGPA</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{student.rollNumber}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Sem {student.semester}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-24">
                            <div 
                              className={`h-full rounded-full ${student.attendance < 75 ? 'bg-red-500' : 'bg-green-500'}`}
                              style={{ width: `${student.attendance}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600">{student.attendance}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-black text-indigo-600">{student.cgpa}</span>
                      </td>
                      <td className="px-6 py-4">
                        {student.attendance < 75 ? (
                          <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase">At Risk</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase">Good</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setSelectedStudent(student)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              Class Performance Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Face Recognition Attendance Section */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Scan className="w-6 h-6 text-indigo-600" />
                Face Recognition Attendance
              </h3>
              {isCameraOpen && (
                <button onClick={stopCamera} className="text-slate-400 hover:text-red-500">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="relative aspect-video bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200">
                  {isCameraOpen ? (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                  ) : capturedImage ? (
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <Camera className="w-12 h-12 mb-2" />
                      <p className="text-sm">Camera is off</p>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="flex gap-2">
                  {!isCameraOpen ? (
                    <button 
                      onClick={startCamera}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Open Camera
                    </button>
                  ) : (
                    <button 
                      onClick={captureImage}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Scan className="w-5 h-5" />
                      Capture Photo
                    </button>
                  )}
                  {capturedImage && (
                    <button 
                      onClick={() => setCapturedImage(null)}
                      className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    >
                      Retake
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Verification Status</h4>
                  {selectedStudent ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {selectedStudent.rollNumber[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{selectedStudent.rollNumber}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Target Student</p>
                        </div>
                      </div>

                      {capturedImage && (
                        <button 
                          onClick={handleVerifyFace}
                          disabled={isVerifying}
                          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isVerifying ? <RefreshCw className="w-5 h-5 animate-spin" /> : <UserCheck className="w-5 h-5" />}
                          {isVerifying ? 'Verifying Identity...' : 'Verify & Mark Present'}
                        </button>
                      )}

                      {verificationResult && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-xl border ${
                            verificationResult.match ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {verificationResult.match ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            )}
                            <p className={`text-sm font-bold ${verificationResult.match ? 'text-green-700' : 'text-red-700'}`}>
                              {verificationResult.match ? 'Identity Verified' : 'Verification Failed'}
                            </p>
                          </div>
                          <p className="text-xs text-slate-500">Confidence: {(verificationResult.confidence * 100).toFixed(1)}%</p>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                      <Users className="w-10 h-10 mb-2 opacity-20" />
                      <p className="text-xs">Select a student from the roster to start verification</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <BrainCircuit className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    <strong>AI Note:</strong> Face recognition uses visual comparison with stored profile photos. Ensure good lighting for higher accuracy.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Certification Verification Section */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-600" />
              Certification Verification Requests
            </h3>
            <div className="space-y-4">
              {pendingCerts.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">All certifications are verified.</p>
                </div>
              ) : (
                pendingCerts.map((cert) => {
                  const student = students.find(s => s.uid === cert.studentUid);
                  return (
                    <div key={cert.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {student?.rollNumber?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{cert.title}</p>
                          <p className="text-xs text-slate-500">{cert.issuer} • {student?.rollNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {cert.url && (
                          <a 
                            href={cert.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                          >
                            <Edit2 className="w-3 h-3" /> View Proof
                          </a>
                        )}
                        <button 
                          onClick={() => handleApproveCert(cert.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all flex items-center gap-2"
                        >
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Right Column: AI Co-teacher & Management */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-slate-900 rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-6 bg-slate-800 border-b border-white/5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BrainCircuit className="w-6 h-6 text-indigo-400" />
                AI Co-Teacher
              </h3>
              <p className="text-slate-400 text-xs mt-1">Analyze performance or generate lesson plans.</p>
            </div>
            
            <div className="flex-1 p-6 flex flex-col gap-4">
              <div className="flex-1 bg-white/5 rounded-2xl p-4 overflow-y-auto text-sm text-slate-300 leading-relaxed custom-scrollbar">
                {isAiLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    <p className="text-indigo-400 animate-pulse font-bold">AI Co-teacher is analyzing...</p>
                  </div>
                ) : aiResponse ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p>{aiResponse}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                    <MessageSquare className="w-12 h-12 mb-4" />
                    <p>Ask for a dropout risk analysis or a lesson plan for tomorrow's class.</p>
                  </div>
                )}
              </div>

              <div className="relative">
                <textarea 
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="e.g. Identify students at risk of dropout..."
                  className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  rows={3}
                />
                <button 
                  onClick={handleAiQuery}
                  disabled={isAiLoading}
                  className="absolute bottom-3 right-3 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>

          {selectedStudent && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">Manage Grade</h3>
                <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600"><Trash2 className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-2xl">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Student</p>
                  <p className="text-lg font-black text-indigo-700">{selectedStudent.rollNumber}</p>
                </div>
                <input 
                  type="text" 
                  value={newMark.subject}
                  onChange={(e) => setNewMark({ ...newMark, subject: e.target.value })}
                  placeholder="Subject Name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={newMark.score}
                    onChange={(e) => setNewMark({ ...newMark, score: Number(e.target.value) })}
                    placeholder="Score"
                    className="w-1/2 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <input 
                    type="number" 
                    value={newMark.maxScore}
                    onChange={(e) => setNewMark({ ...newMark, maxScore: Number(e.target.value) })}
                    placeholder="Max"
                    className="w-1/2 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <button 
                  onClick={handleAddMark}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Update Grade
                </button>
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bg }: any) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
    <div className={`p-3 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform ${bg} ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
  </div>
);

export default FacultyPortal;
