import React, { useEffect, useState } from 'react';
import { Search, Plus, Phone, Mail, KeyRound, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function Parents() {
  const [parents, setParents] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [pinModal, setPinModal] = useState(null); // parent object
  const [pin, setPin] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/parents').then((r) => setParents(r.data));
  useEffect(() => { load(); }, []);

  const filtered = parents.filter((p) =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSetPin = async (e) => {
    e.preventDefault();
    if (pin.length < 4) return toast.error('PIN must be at least 4 digits');
    setSaving(true);
    try {
      await api.post('/parent-auth/set-pin', { parentId: pinModal.id, pin });
      toast.success(`PIN set for ${pinModal.name}`);
      setPinModal(null);
      setPin('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to set PIN');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/parents', form);
      toast.success('Parent added!');
      setModal(false);
      setForm({ name: '', phone: '', email: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add parent');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Pet Parents</h1>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Parent
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search parents…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map((p) => (
          <div key={p.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{p.name}</p>
                <div className="flex flex-wrap gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Phone size={12} /> {p.phone}
                  </span>
                  {p.email && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Mail size={12} /> {p.email}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.pin ? (
                  <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                    <CheckCircle size={11} /> PIN set
                  </span>
                ) : (
                  <span className="badge bg-yellow-100 text-yellow-700">No PIN</span>
                )}
                <button
                  onClick={() => { setPinModal(p); setPin(''); }}
                  className="badge bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound size={11} /> {p.pin ? 'Reset PIN' : 'Set PIN'}
                </button>
                <span className="badge bg-brand-100 text-brand-700">
                  {p.pets.length} {p.pets.length === 1 ? 'pet' : 'pets'}
                </span>
              </div>
            </div>
            {p.pets.length > 0 && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                {p.pets.map((pet) => (
                  <span key={pet.id} className="badge bg-gray-100 text-gray-700">
                    {pet.species === 'Cat' ? '🐱' : '🐶'} {pet.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Set PIN modal */}
      <Modal open={!!pinModal} onClose={() => setPinModal(null)} title={`Set PIN — ${pinModal?.name}`}>
        <form onSubmit={handleSetPin} className="space-y-4">
          <p className="text-sm text-gray-500">
            This PIN lets <strong>{pinModal?.name}</strong> log into the parent portal to track their pets.
          </p>
          <div>
            <label className="label">New PIN (4–8 digits)</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              className="input tracking-widest text-center text-xl"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              autoFocus
              required
            />
          </div>
          <button type="submit" disabled={saving || pin.length < 4} className="btn-primary w-full">
            {saving ? 'Saving…' : 'Set PIN'}
          </button>
        </form>
      </Modal>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Pet Parent">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input className="input" type="tel" placeholder="9999999999" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving…' : 'Add Parent'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
