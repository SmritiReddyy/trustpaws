import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-orange-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐾</div>
          <h1 className="text-2xl font-bold text-gray-900">TrustPaws</h1>
          <p className="text-gray-500 text-sm mt-1">Staff Login</p>
        </div>

        {/* Demo credentials */}
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Demo credentials</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-500 font-mono px-1 pb-0.5">
            <span className="font-semibold text-amber-700 not-italic" style={{fontFamily:'inherit'}}>Email</span>
            <span className="font-semibold text-amber-700 not-italic" style={{fontFamily:'inherit'}}>Password</span>
          </div>
          {[
            { label: 'Admin', email: 'admin@huft.com', password: 'admin123' },
            { label: 'Staff (Groomer)', email: 'groomer@huft.com', password: 'staff123' },
          ].map(({ label, email, password }) => (
            <button
              key={label}
              type="button"
              onClick={() => setForm({ email, password })}
              className="w-full text-left bg-white rounded-lg px-3 py-2 border border-amber-100 hover:border-amber-300 transition-colors group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-amber-800">{label}</span>
                <span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">tap to fill</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 font-mono mt-0.5">
                <span>{email}</span>
                <span>{password}</span>
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="you@huft.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <Link
          to="/parent/login"
          className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-brand-200 text-brand-600 font-medium text-sm hover:bg-brand-50 transition-colors"
        >
          🐾 Pet Parent? Sign in here →
        </Link>
        <p className="text-center text-xs text-gray-300 mt-4">
          Heads Up For Tails · TrustPaws
        </p>
      </div>
    </div>
  );
}
