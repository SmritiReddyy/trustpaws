import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckCircle, Circle, AlertTriangle, Clock, CheckSquare, Square } from 'lucide-react';
import api from '../../utils/api';
import { STATUS_LABELS, STATUS_FLOW, SEVERITY_COLORS } from '../../utils/constants';

const STAGE_ICONS = {
  SCHEDULED:  '📅',
  CHECKED_IN: '🏥',
  BATHING:    '🛁',
  GROOMING:   '✂️',
  DRYING:     '💨',
  READY:      '🎉',
  COMPLETED:  '✅',
};

export default function TrackingPage() {
  const { token } = useParams();
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/track/${token}`)
      .then((r) => setAppt(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      api.get(`/track/${token}`).then((r) => setAppt(r.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🐾</div>
          <p className="text-gray-500">Loading your pet's status…</p>
        </div>
      </div>
    );
  }

  if (error || !appt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50 p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link not found</h2>
          <p className="text-gray-500">This tracking link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(appt.status);
  const completedStages = STATUS_FLOW.slice(0, currentIdx + 1);
  const isComplete = appt.status === 'COMPLETED';
  const isReady = appt.status === 'READY';

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <span className="text-2xl">🐾</span>
          <div>
            <p className="font-bold text-gray-900">TrustPaws</p>
            <p className="text-xs text-gray-500">TrustPaws by HUFT</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Pet card */}
        <div className="card mt-2">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-4xl shrink-0">
              {appt.pet.species === 'Cat' ? '🐱' : '🐶'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{appt.pet.name}</h1>
              <p className="text-sm text-gray-500">{appt.pet.breed}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                <Clock size={12} className="inline mr-1" />
                {format(new Date(appt.scheduledAt), 'h:mm a · MMM d')}
              </p>
            </div>
          </div>
        </div>

        {/* Ready for pickup banner */}
        {(isReady || isComplete) && (
          <div className={`rounded-xl p-4 text-center ${isReady ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="text-3xl mb-2">{isReady ? '🎉' : '✅'}</div>
            <p className="font-bold text-lg text-gray-900">
              {isReady ? `${appt.pet.name} is ready for pickup!` : 'Visit completed!'}
            </p>
            {isReady && <p className="text-sm text-gray-500 mt-1">Please head over to collect them 🐾</p>}
          </div>
        )}

        {/* Progress timeline */}
        <div className="card">
          <p className="text-sm font-medium text-gray-700 mb-4">Current Status</p>
          <div className="space-y-3">
            {STATUS_FLOW.filter((s) => s !== 'CANCELLED').map((stage, i) => {
              const done = i < currentIdx;
              const active = i === currentIdx;
              const upcoming = i > currentIdx;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-all ${
                    active   ? 'bg-brand-500 text-white shadow-lg shadow-brand-200' :
                    done     ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-300'
                  }`}>
                    {done ? <CheckCircle size={16} /> : active ? STAGE_ICONS[stage] : <Circle size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${active ? 'text-brand-600' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                      {STATUS_LABELS[stage]}
                    </p>
                  </div>
                  {active && !isComplete && (
                    <span className="text-xs bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full font-medium">
                      In progress
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Services */}
        {appt.services.length > 0 && (
          <div className="card">
            <p className="text-sm font-medium text-gray-700 mb-3">Services</p>
            <div className="space-y-2">
              {appt.services.map((svc) => (
                <div key={svc.id} className="flex items-center gap-2.5">
                  {svc.completed
                    ? <CheckSquare size={16} className="text-green-500 shrink-0" />
                    : <Square size={16} className="text-gray-300 shrink-0" />}
                  <span className={`text-sm ${svc.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {svc.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incidents — shown transparently to parent */}
        {appt.incidents.length > 0 && (
          <div className="card border-l-4 border-red-400">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-red-500" />
              <p className="text-sm font-semibold text-red-700">Incident Report</p>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Our team has flagged the following and will discuss it with you at pickup.
            </p>
            {appt.incidents.map((inc) => (
              <div key={inc.id} className="bg-red-50 rounded-lg p-3 mb-2 last:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge text-xs ${SEVERITY_COLORS[inc.severity]}`}>{inc.severity}</span>
                  <span className="text-sm font-medium text-gray-900">{inc.title}</span>
                </div>
                <p className="text-xs text-gray-600">{inc.description}</p>
                {inc.actionTaken && (
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium text-gray-600">What we did:</span> {inc.actionTaken}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Photos */}
        {appt.photos.length > 0 && (
          <div className="card">
            <p className="text-sm font-medium text-gray-700 mb-3">Photos</p>
            <div className="grid grid-cols-2 gap-2">
              {appt.photos.map((p) => (
                <div key={p.id} className="relative">
                  <img src={p.url} alt={p.type} className="w-full h-36 object-cover rounded-lg" />
                  <span className="absolute bottom-1 left-1 badge bg-black/50 text-white text-xs">{p.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staff */}
        {appt.staff && (
          <div className="card flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-lg">✂️</div>
            <div>
              <p className="text-xs text-gray-500">Your groomer today</p>
              <p className="text-sm font-medium text-gray-900">{appt.staff.name}</p>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-6">
          This page refreshes automatically · TrustPaws by HUFT
        </p>
      </div>
    </div>
  );
}
