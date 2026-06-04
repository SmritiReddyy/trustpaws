import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import api from '../../utils/api';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function Pets() {
  const [pets, setPets] = useState([]);
  const [parents, setParents] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', breed: '', species: 'Dog', age: '', weight: '', notes: '', parentId: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/pets').then((r) => setPets(r.data));

  useEffect(() => {
    load();
    api.get('/parents').then((r) => setParents(r.data));
  }, []);

  const filtered = pets.filter((p) =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.parent.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.breed || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/pets', { ...form, age: form.age ? +form.age : null, weight: form.weight ? +form.weight : null });
      toast.success('Pet added!');
      setModal(false);
      setForm({ name: '', breed: '', species: 'Dog', age: '', weight: '', notes: '', parentId: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add pet');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Pets</h1>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Pet
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search pets…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p) => (
          <Link key={p.id} to={`/pets/${p.id}`} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-2xl shrink-0">
                {p.species === 'Cat' ? '🐱' : '🐶'}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500">{p.breed} · {p.species}</p>
                <p className="text-xs text-gray-400 truncate">👤 {p.parent.name}</p>
              </div>
            </div>
            {(p.age || p.weight) && (
              <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                {p.age && <span>{p.age} years old</span>}
                {p.weight && <span>{p.weight} kg</span>}
              </div>
            )}
          </Link>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add New Pet">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Pet Parent *</label>
            <select className="input" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} required>
              <option value="">Select parent…</option>
              {parents.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.phone}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Pet Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Species</label>
              <select className="input" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}>
                <option>Dog</option>
                <option>Cat</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Breed</label>
            <input className="input" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Age (years)</label>
              <input type="number" className="input" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" step="0.1" className="input" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving…' : 'Add Pet'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
