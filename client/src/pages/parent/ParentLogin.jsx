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

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-400">Staff member?{' '}
            <Link to="/login" className="text-brand-500 hover:underline">Staff login →</Link>
          </p>
          <p className="text-xs text-gray-300">Heads Up For Tails · TrustPaws</p>
        </div>
      </div>
    </div>
  );
}
