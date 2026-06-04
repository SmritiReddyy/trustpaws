import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { DEFAULT_SERVICES } from '../../utils/constants';
import { format } from 'date-fns';

export default function NewAppointment() {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({
    petId: '',
    staffId: '',
    scheduledAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: '',
    services: [...DEFAULT_SERVICES],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/pets').then((r) => setPets(r.data));
    api.get('/auth/staff').catch(() => {});
  }, []);

  const toggleService = (svc) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(svc)
        ? f.services.filter((s) => s !== svc)
        : [...f.services, svc],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.petId) return toast.error('Please select a pet');
    setSaving(true);
    try {
      const r = await api.post('/appointments', form);
      toast.success('Appointment created!');
      navigate(`/appointments/${r.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create appointment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/appointments" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Appointment</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card space-y-4">
          <div>
            <label className="label">Pet *</label>
            <select className="input" value={form.petId} onChange={(e) => setForm({ ...form, petId: e.target.value })} required>
              <option value="">Select a pet…</option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.breed}) — {p.parent.name}
                </option>
              ))}
            </select>
            <Link to="/pets" className="text-xs text-brand-500 hover:underline mt-1 inline-block">
              + Add new pet
            </Link>
          </div>

          <div>
            <label className="label">Date & Time *</label>
            <input
              type="datetime-local"
              className="input"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Any special instructions…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="card">
          <p className="label mb-3">Services</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEFAULT_SERVICES.map((svc) => (
              <label key={svc} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.services.includes(svc)}
                  onChange={() => toggleService(svc)}
                  className="accent-brand-500"
                />
                <span className="text-sm text-gray-700">{svc}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Creating…' : 'Create Appointment'}
        </button>
      </form>
    </div>
  );
}
