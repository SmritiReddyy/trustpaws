import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { LogOut, ChevronRight, AlertTriangle, Clock } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../components/ui/StatusBadge';

const ACTIVE_STATUSES = ['CHECKED_IN', 'BATHING', 'GROOMING', 'DRYING', 'READY'];

export default function ParentPortal() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('parent_token');
    if (!token) { navigate('/parent/login'); return; }

    api.get('/parent-auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setData(r.data))
      .catch(() => { navigate('/parent/login'); })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('parent_token');
    localStorage.removeItem('parent_user');
    navigate('/parent/login');
    toast('Signed out', { icon: '👋' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🐾</div>
          <p className="text-gray-500 text-sm">Loading your pets…</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Flatten all appointments across all pets for "active now" section
  const activeAppointments = data.pets
    .flatMap((pet) => pet.appointments.map((a) => ({ ...a, pet })))
    .filter((a) => ACTIVE_STATUSES.includes(a.status))
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

  const recentVisits = data.pets
    .flatMap((pet) => pet.appointments.map((a) => ({ ...a, pet })))
    .filter((a) => a.status === 'COMPLETED')
    .sort((a, b) => new Date(b.completedAt || b.scheduledAt) - new Date(a.completedAt || a.scheduledAt))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐾</span>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">TrustPaws</p>
              <p className="text-xs text-gray-400">Hi, {data.name.split(' ')[0]}!</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-6">

        {/* Active appointments */}
        {activeAppointments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <h2 className="font-semibold text-gray-900">Live Now</h2>
            </div>
            <div className="space-y-2">
              {activeAppointments.map((a) => (
                <Link
                  key={a.id}
                  to={`/track/${a.trackingToken}`}
                  className="block bg-white rounded-xl border-2 border-green-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-2xl">
                        {a.pet.species === 'Cat' ? '🐱' : '🐶'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{a.pet.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={11} /> {format(new Date(a.scheduledAt), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.incidents.length > 0 && (
                        <span className="badge bg-red-100 text-red-600">
                          <AlertTriangle size={10} className="mr-1" />{a.incidents.length}
                        </span>
                      )}
                      <StatusBadge status={a.status} />
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Your pets */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Your Pets</h2>
          <div className="space-y-3">
            {data.pets.map((pet) => {
              const lastVisit = pet.appointments.find((a) => a.status === 'COMPLETED');
              const totalVisits = pet.appointments.filter((a) => a.status === 'COMPLETED').length;
              const totalIncidents = pet.appointments.reduce((n, a) => n + a.incidents.length, 0);
              return (
                <div key={pet.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center text-3xl shrink-0">
                      {pet.species === 'Cat' ? '🐱' : '🐶'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{pet.name}</p>
                      <p className="text-sm text-gray-500">{pet.breed}{pet.age ? ` · ${pet.age} yrs` : ''}</p>
                      {lastVisit && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Last visit: {format(new Date(lastVisit.scheduledAt), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-brand-500">{totalVisits}</p>
                      <p className="text-xs text-gray-400">visits</p>
                    </div>
                  </div>

                  {/* Visit history */}
                  {pet.appointments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      {pet.appointments.slice(0, 3).map((a) => (
                        <Link
                          key={a.id}
                          to={`/track/${a.trackingToken}`}
                          className="flex items-center justify-between py-1 hover:opacity-75 transition-opacity"
                        >
                          <div>
                            <p className="text-sm text-gray-700">{format(new Date(a.scheduledAt), 'MMM d, yyyy · h:mm a')}</p>
                            <p className="text-xs text-gray-400">{a.staff?.name || 'Staff'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {a.incidents.length > 0 && (
                              <span className="badge bg-red-100 text-red-600 text-xs">
                                <AlertTriangle size={9} className="mr-0.5" />{a.incidents.length}
                              </span>
                            )}
                            <StatusBadge status={a.status} />
                            <ChevronRight size={14} className="text-gray-300" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {pet.appointments.length === 0 && (
                    <p className="text-xs text-gray-400 text-center mt-3 pt-3 border-t border-gray-100">No visits yet</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">
          TrustPaws by Heads Up For Tails
        </p>
      </div>
    </div>
  );
}
