import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ParentLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: '', pin: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/parent-auth/login', form);
      localStorage.setItem('parent_token', data.token);
      localStorage.setItem('parent_user', JSON.stringify(data.parent));
      navigate('/my-pets');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
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
          <p className="text-gray-500 text-sm mt-1">Pet Parent Portal</p>
        </div>

        {/* Demo credentials */}
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Demo credentials</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs px-1 pb-0.5">
            <span className="font-semibold text-amber-700">Phone</span>
            <span className="font-semibold text-amber-700">PIN</span>
          </div>
          {[
            { label: 'Rahul Verma', phone: '9999999999', pin: '1234' },
            { label: 'Meera Nair', phone: '8888888888', pin: '1234' },
            { label: 'Arjun Kapoor', phone: '7777777777', pin: '1234' },
          ].map(({ label, phone, pin }) => (
            <button
              key={phone}
              type="button"
              onClick={() => setForm({ phone, pin })}
              className="w-full text-left bg-white rounded-lg px-3 py-2 border border-amber-100 hover:border-amber-300 transition-colors group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-amber-800">{label}</span>
                <span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">tap to fill</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 font-mono mt-0.5">
                <span>{phone}</span>
                <span>{pin}</span>
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Mobile Number</label>
            <input
              type="tel"
              className="input"
              placeholder="9999999999"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              className="input tracking-widest text-center text-xl"
              placeholder="••••"
              value={form.pin}
              onChange={(e) => setForm({ ...form, pin: e.target.value })}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Your PIN was set by the spa. Ask the front desk if you don't have one.</p>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <Link
          to="/login"
          className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-brand-200 text-brand-600 font-medium text-sm hover:bg-brand-50 transition-colors"
        >
          ✂️ Staff member? Sign in here →
        </Link>
        <p className="text-center text-xs text-gray-300 mt-4">Heads Up For Tails · TrustPaws</p>
      </div>
    </div>
  );
}
