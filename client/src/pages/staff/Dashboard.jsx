import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, PawPrint, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import api from '../../utils/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    api.get(`/appointments?date=${today}`)
      .then((r) => setAppointments(r.data))
      .finally(() => setLoading(false));
  }, [today]);

  const counts = {
    active: appointments.filter((a) => !['COMPLETED', 'CANCELLED', 'SCHEDULED'].includes(a.status)).length,
    ready:  appointments.filter((a) => a.status === 'READY').length,
    done:   appointments.filter((a) => a.status === 'COMPLETED').length,
    incidents: appointments.reduce((n, a) => n + a.incidents.length, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <Link to="/appointments/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> New
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'In Progress',   value: counts.active,    icon: PawPrint,      color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Ready Pickup',  value: counts.ready,     icon: CheckCircle,   color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Completed',     value: counts.done,      icon: Calendar,      color: 'text-gray-600',   bg: 'bg-gray-50' },
          { label: 'Incidents',     value: counts.incidents, icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card flex items-center gap-3">
            <div className={`${bg} ${color} p-2.5 rounded-lg`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's appointments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Today's Appointments</h2>
          <Link to="/appointments" className="text-sm text-brand-500 hover:underline">View all</Link>
        </div>

        {loading ? (
          <div className="card text-center py-8 text-gray-400">Loading…</div>
        ) : appointments.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400">No appointments today</p>
            <Link to="/appointments/new" className="mt-3 inline-block text-sm text-brand-500 hover:underline">
              Schedule one →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((a) => (
              <Link
                key={a.id}
                to={`/appointments/${a.id}`}
                className="card flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-xl">
                    {a.pet.species === 'Cat' ? '🐱' : '🐶'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{a.pet.name}</p>
                    <p className="text-xs text-gray-500">{a.pet.parent.name} · {format(new Date(a.scheduledAt), 'h:mm a')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.incidents.length > 0 && (
                    <span className="badge bg-red-100 text-red-700">
                      <AlertTriangle size={10} className="mr-1" /> {a.incidents.length}
                    </span>
                  )}
                  <StatusBadge status={a.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
