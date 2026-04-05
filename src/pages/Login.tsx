import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, LogIn, ShieldCheck, UserCircle, Users } from 'lucide-react';
import { motion } from 'motion/react';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleLogin = async (role: string) => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create new user profile with selected role
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: role,
          createdAt: serverTimestamp(),
        });

        // Initialize student record if role is student
        if (role === 'student') {
          await setDoc(doc(db, 'students', user.uid), {
            uid: user.uid,
            rollNumber: `STU-${Math.floor(Math.random() * 10000)}`,
            semester: 1,
            year: 1,
            cgpa: 0,
            attendance: 0,
            skills: [],
            certifications: [],
            internships: [],
          });
        }
      } else {
        // User exists, but maybe they want to change role? 
        // For security, we usually don't allow this without admin approval,
        // but for this demo, we'll stick with the existing role.
        console.log("User already exists with role:", userDoc.data().role);
      }

      navigate('/');
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'student', name: 'Student', icon: GraduationCap, color: 'bg-blue-500' },
    { id: 'faculty', name: 'Faculty', icon: Users, color: 'bg-green-500' },
    { id: 'parent', name: 'Parent', icon: UserCircle, color: 'bg-orange-500' },
    { id: 'admin', name: 'Admin', icon: ShieldCheck, color: 'bg-indigo-500' },
    { id: 'ai_admin', name: 'AI Admin', icon: LogIn, color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row"
      >
        <div className="md:w-1/2 bg-indigo-600 p-12 text-white flex flex-col justify-center">
          <GraduationCap className="w-16 h-16 mb-6" />
          <h1 className="text-4xl font-bold mb-4">Welcome to EduSphere AI</h1>
          <p className="text-indigo-100 text-lg">
            The next generation academic ecosystem powered by AI. Connect, learn, and grow with personalized insights.
          </p>
        </div>
        
        <div className="md:w-1/2 p-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Get Started</h2>
          <p className="text-slate-500 mb-8">Select your role to continue with Google</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleGoogleLogin(role.id)}
                disabled={loading}
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left"
              >
                <div className={`${role.color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform`}>
                  <role.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{role.name}</p>
                  <p className="text-xs text-slate-500">Login as {role.name}</p>
                </div>
              </button>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
