import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Coffee } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false); // Mode Login atau Register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isRegister) {
        // --- LOGIKA REGISTER ---
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        
        setSuccessMsg("Akun berhasil dibuat! Silakan login.");
        setIsRegister(false); // Pindah ke mode login otomatis
      } else {
        // --- LOGIKA LOGIN ---
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        // Jika sukses login, masuk ke dashboard
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        
        {/* Header Logo */}
        {/* Header Logo & Brand */}
<div className="flex flex-col items-center mb-8">
  <div className="w-28 h-28 mb-4 flex items-center justify-center">
    <img 
      src="/logo.png" 
      alt="Lamoenan Logo" 
      className="w-full h-full object-contain"
    />
  </div>
  <div className="text-center">
    <h2 className="text-2xl font-black text-gray-900 leading-none">LAMOENAN CAFE</h2>
    <p className="text-xs text-amber-700 font-bold tracking-[0.3em] mt-1 uppercase">
      & Bistro
    </p>
    <p className="text-gray-400 text-sm mt-4 font-medium">Sign in to your account</p>
  </div>
</div>

        {/* Alert Error / Success */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm text-center">
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none transition bg-gray-50 focus:bg-white"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none transition bg-gray-50 focus:bg-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white py-2.5 px-4 rounded-lg font-medium transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        {/* Footer Link (Switch Mode) */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
              setSuccessMsg(null);
            }} 
            className="text-amber-700 font-semibold hover:underline"
          >
            {isRegister ? 'Sign in' : 'Sign up'}
          </button>
        </div>

      </div>
    </div>
  );
}