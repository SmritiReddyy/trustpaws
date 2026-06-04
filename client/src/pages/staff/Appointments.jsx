import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { STATUS_FLOW } from '../../utils/constants';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (statusFilter) params.append('status', statusFilter);
    api.get(`/appointments?${params}`).then((r) => setAppointments(r.data)).finally(() => setLoading(false));
  }, [date, statusFilter]);

  const filtered = appointments.filter((a) =>
    !search ||
    a.pet.name.toLowerCase().includes(search.toLowerCase()) ||
    a.pet.parent.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Appointments</h1>
        <Link to="/appointments/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> New
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search pet or parent…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <input type="date" className="input sm:w-40" value={date} onChange={(e) => setDate(e.target.value)} />
        <select className="input sm:w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_FLOW.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="card text-center py-10 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">No appointments found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <Link key={a.id} to={`/appointments/${a.id}`} className="card flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-xl shrink-0">
                  {a.pet.species === 'Cat' ? '🐱' : '🐶'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{a.pet.name}
                    <span className="text-gray-400 font-normal text-sm"> · {a.pet.breed}</span>
                  </p>
                  <p className="text-xs text-gray-500">{a.pet.parent.name} · {format(new Date(a.scheduledAt), 'MMM d, h:mm a')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {a.incidents.length > 0 && (
                  <span className="badge bg-red-100 text-red-700">
                    <AlertTriangle size={10} className="mr-1" />{a.incidents.length}
                  </span>
                )}
                <StatusBadge status={a.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
