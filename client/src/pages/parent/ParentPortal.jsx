import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { LogOut, ChevronRight, AlertTriangle, Clock, Radio, ShieldAlert, CheckCircle, History } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { StatusBadge, SeverityBadge } from '../../components/ui/StatusBadge';

const ACTIVE_STATUSES = ['CHECKED_IN', 'BATHING', 'GROOMING', 'DRYING', 'READY'];
const TABS = ['Overview', 'History', 'Noted Issues'];

const parseServiceNotes = (raw) => {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return { notes: raw }; }
};

const CONDITION_LABELS = { GOOD: '✅ Good', SENSITIVE: '⚠️ Sensitive area noted', ATTENTION: '🔴 Needs attention' };

export default function ParentPortal() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overview');

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

  const allAppointments = data.pets.flatMap((pet) =>
    pet.appointments.map((a) => ({ ...a, pet }))
  );

  const activeAppointments = allAppointments
    .filter((a) => ACTIVE_STATUSES.includes(a.status))
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

  // All incidents across all pets, newest first
  const allIncidents = allAppointments
    .flatMap((a) => a.incidents.map((inc) => ({ ...inc, appointment: a, pet: a.pet })))
    .sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));

  const totalIncidents = allIncidents.length;

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

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 flex border-t border-gray-100">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'Noted Issues' && <ShieldAlert size={14} />}
              {t === 'History' && <History size={14} />}
              {t}
              {t === 'Noted Issues' && totalIncidents > 0 && (
                <span className="badge bg-red-100 text-red-600 text-xs">{totalIncidents}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">

        {/* ── OVERVIEW TAB ── */}
        {tab === 'Overview' && (
          <div className="space-y-6">

            {/* Live Now */}
            {activeAppointments.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <h2 className="font-semibold text-gray-900">Live Now</h2>
                </div>
                <div className="space-y-3">
                  {activeAppointments.map((a) => (
                    <div key={a.id} className="bg-white rounded-xl border-2 border-green-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
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
                            <button
                              onClick={() => setTab('Noted Issues')}
                              className="badge bg-red-100 text-red-600 hover:bg-red-200 transition-colors cursor-pointer"
                            >
                              <AlertTriangle size={10} className="mr-1" />{a.incidents.length}
                            </button>
                          )}
                          <StatusBadge status={a.status} />
                        </div>
                      </div>

                      {/* Live feed button */}
                      <Link
                        to={`/track/${a.trackingToken}`}
                        className="flex items-center justify-center gap-2 w-full bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
                      >
                        <Radio size={15} className="animate-pulse" />
                        See Live Status
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Your Pets */}
            <div>
              <h2 className="font-semibold text-gray-900 mb-3">Your Pets</h2>
              <div className="space-y-3">
                {data.pets.map((pet) => {
                  const completedVisits = pet.appointments.filter((a) => a.status === 'COMPLETED');
                  const lastVisit = completedVisits[0];
                  const petIncidents = pet.appointments.reduce((n, a) => n + a.incidents.length, 0);

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
                        <div className="text-right shrink-0 space-y-1">
                          <div>
                            <p className="text-lg font-bold text-brand-500">{completedVisits.length}</p>
                            <p className="text-xs text-gray-400">visits</p>
                          </div>
                          {petIncidents > 0 && (
                            <button
                              onClick={() => setTab('Noted Issues')}
                              className="badge bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer"
                            >
                              <AlertTriangle size={10} className="mr-0.5" />{petIncidents}
                            </button>
                          )}
                        </div>
                      </div>

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

            <p className="text-center text-xs text-gray-300 pb-4">TrustPaws by Heads Up For Tails</p>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'History' && (() => {
          const completedAppts = allAppointments
            .filter((a) => a.status === 'COMPLETED')
            .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

          const totalVisits = completedAppts.length;
          const lastVisit = completedAppts[0];

          // Most common service
          const serviceCounts = {};
          completedAppts.forEach((a) => a.services.forEach((s) => {
            serviceCounts[s.name] = (serviceCounts[s.name] || 0) + 1;
          }));
          const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0];

          return (
            <div className="space-y-5">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                  <p className="text-2xl font-bold text-brand-500">{totalVisits}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Total visits</p>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                  <p className="text-sm font-bold text-gray-800">
                    {lastVisit ? formatDistanceToNow(new Date(lastVisit.scheduledAt), { addSuffix: true }) : '—'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Last visit</p>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                  <p className="text-sm font-bold text-gray-800 truncate">{topService ? topService[0] : '—'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Top service</p>
                </div>
              </div>

              {completedAppts.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                  <div className="text-4xl mb-3">🐾</div>
                  <p className="font-semibold text-gray-900">No visits yet</p>
                  <p className="text-sm text-gray-500 mt-1">Your visit history will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedAppts.map((a) => {
                    const duration = a.completedAt
                      ? differenceInMinutes(new Date(a.completedAt), new Date(a.scheduledAt))
                      : null;
                    const completedServices = a.services.filter((s) => s.completed);

                    return (
                      <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span>{a.pet.species === 'Cat' ? '🐱' : '🐶'}</span>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{a.pet.name}</p>
                              <p className="text-xs text-gray-400">{format(new Date(a.scheduledAt), 'MMMM d, yyyy')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {duration && <p className="text-xs text-gray-400">{duration} min</p>}
                            {a.staff && <p className="text-xs text-gray-500">by {a.staff.name}</p>}
                          </div>
                        </div>

                        {/* Services with notes */}
                        <div className="px-4 py-3 space-y-2">
                          {completedServices.length === 0 && (
                            <p className="text-xs text-gray-400">No services recorded</p>
                          )}
                          {completedServices.map((svc) => {
                            const parsed = parseServiceNotes(svc.notes);
                            return (
                              <div key={svc.id} className="flex items-start gap-2">
                                <CheckCircle size={14} className="text-brand-500 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-700">{svc.name}</p>
                                  {parsed?.condition && parsed.condition !== 'GOOD' && (
                                    <p className="text-xs text-amber-600">{CONDITION_LABELS[parsed.condition]}</p>
                                  )}
                                  {parsed?.notes && (
                                    <p className="text-xs text-gray-400 italic mt-0.5">"{parsed.notes}"</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Incidents if any */}
                        {a.incidents.length > 0 && (
                          <div className="px-4 pb-3 flex items-center gap-1.5">
                            <AlertTriangle size={12} className="text-red-500" />
                            <p className="text-xs text-red-500">{a.incidents.length} incident{a.incidents.length > 1 ? 's' : ''} logged</p>
                            <button onClick={() => setTab('Noted Issues')} className="text-xs text-brand-500 hover:underline ml-1">View →</button>
                          </div>
                        )}

                        {/* Track link */}
                        <div className="px-4 pb-3">
                          <Link
                            to={`/track/${a.trackingToken}`}
                            className="text-xs text-brand-500 hover:underline flex items-center gap-1"
                          >
                            View full report <ChevronRight size={12} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-center text-xs text-gray-300 pb-4">TrustPaws by Heads Up For Tails</p>
            </div>
          );
        })()}

        {/* ── NOTED ISSUES TAB ── */}
        {tab === 'Noted Issues' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-red-500" />
              <h2 className="font-semibold text-gray-900">Noted Issues</h2>
              <span className="text-xs text-gray-400">— all incidents logged by our groomers</span>
            </div>

            {allIncidents.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-semibold text-gray-900">All clear!</p>
                <p className="text-sm text-gray-500 mt-1">No incidents have been logged for your pets.</p>
              </div>
            ) : (
              <>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-700">
                  We believe in full transparency. Every issue — no matter how small — is logged here. Our team will always discuss these with you.
                </div>

                <div className="space-y-3">
                  {allIncidents.map((inc) => (
                    <div key={inc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      {/* Pet + date header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{inc.pet.species === 'Cat' ? '🐱' : '🐶'}</span>
                          <span className="text-sm font-medium text-gray-700">{inc.pet.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={inc.severity} />
                          <span className="text-xs text-gray-400">
                            {format(new Date(inc.reportedAt), 'MMM d · h:mm a')}
                          </span>
                        </div>
                      </div>

                      {/* Incident body */}
                      <div className="px-4 py-3 space-y-2">
                        <p className="font-medium text-gray-900 text-sm">{inc.title}</p>
                        <p className="text-sm text-gray-600">{inc.description}</p>

                        {inc.actionTaken && (
                          <div className="bg-green-50 rounded-lg px-3 py-2 flex items-start gap-2">
                            <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-green-700">Action taken</p>
                              <p className="text-xs text-green-600 mt-0.5">{inc.actionTaken}</p>
                            </div>
                          </div>
                        )}

                        <Link
                          to={`/track/${inc.appointment.trackingToken}`}
                          className="flex items-center gap-1 text-xs text-brand-500 hover:underline mt-1"
                        >
                          View full appointment <ChevronRight size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <p className="text-center text-xs text-gray-300 pb-4">TrustPaws by Heads Up For Tails</p>
          </div>
        )}
      </div>
    </div>
  );
}
