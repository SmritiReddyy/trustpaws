import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft, CheckSquare, Square, AlertTriangle, Camera,
  Copy, ChevronRight, ChevronLeft, Trash2, ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { StatusBadge, SeverityBadge } from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { STATUS_FLOW, STATUS_LABELS } from '../../utils/constants';

export default function AppointmentDetail() {
  const { id } = useParams();
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [incidentModal, setIncidentModal] = useState(false);
  const [incident, setIncident] = useState({ title: '', description: '', actionTaken: '', severity: 'LOW' });
  const [saving, setSaving] = useState(false);
  const [completingService, setCompletingService] = useState(null); // service being completed
  const [serviceForm, setServiceForm] = useState({ condition: 'GOOD', notes: '' });
  const fileRef = useRef();

  const load = () => api.get(`/appointments/${id}`).then((r) => setAppt(r.data));

  useEffect(() => { load().finally(() => setLoading(false)); }, [id]);

  const currentIdx = appt ? STATUS_FLOW.indexOf(appt.status) : -1;
  const canAdvance = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1;
  const canReverse = currentIdx > 0;

  const updateStatus = async (status) => {
    const r = await api.patch(`/appointments/${id}/status`, { status });
    setAppt(r.data);
    toast.success(`Status updated to ${STATUS_LABELS[status]}`);
  };

  const toggleService = async (svcId, completed) => {
    if (completed) {
      // Uncompleting — no form needed
      await api.patch(`/appointments/${id}/service/${svcId}`, { completed: false, notes: null });
      load();
    } else {
      // Completing — open the form
      const svc = appt.services.find((s) => s.id === svcId);
      setCompletingService(svc);
      setServiceForm({ condition: 'GOOD', notes: '' });
    }
  };

  const submitServiceCompletion = async () => {
    if (!completingService) return;
    setSaving(true);
    try {
      const notesPayload = JSON.stringify({ condition: serviceForm.condition, notes: serviceForm.notes });
      await api.patch(`/appointments/${id}/service/${completingService.id}`, {
        completed: true,
        notes: notesPayload,
      });
      setCompletingService(null);
      load();
      toast.success('Service marked complete');
    } catch { toast.error('Failed to update service'); }
    finally { setSaving(false); }
  };

  const parseServiceNotes = (raw) => {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return { notes: raw }; }
  };

  const CONDITION_LABELS = { GOOD: '✅ Good', SENSITIVE: '⚠️ Sensitive area noted', ATTENTION: '🔴 Needs attention' };

  const submitIncident = async () => {
    setSaving(true);
    try {
      await api.post('/incidents', { appointmentId: id, ...incident });
      setIncidentModal(false);
      setIncident({ title: '', description: '', actionTaken: '', severity: 'LOW' });
      load();
      toast.success('Incident logged');
    } catch { toast.error('Failed to log incident'); }
    finally { setSaving(false); }
  };

  const deleteIncident = async (incId) => {
    if (!confirm('Delete this incident?')) return;
    await api.delete(`/incidents/${incId}`);
    load();
    toast.success('Incident removed');
  };

  const uploadPhoto = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('photo', file);
    form.append('appointmentId', id);
    form.append('type', type);
    await api.post('/photos', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    load();
    toast.success('Photo uploaded');
  };

  const copyTrackingLink = () => {
    const url = `${window.location.origin}/track/${appt.trackingToken}`;
    navigator.clipboard.writeText(url);
    toast.success('Tracking link copied!');
  };

  if (loading) return <div className="card text-center py-10 text-gray-400">Loading…</div>;
  if (!appt) return <div className="card text-center py-10 text-red-400">Appointment not found</div>;

  const beforePhotos = appt.photos.filter((p) => p.type === 'BEFORE');
  const afterPhotos  = appt.photos.filter((p) => p.type === 'AFTER');

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/appointments" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">{appt.pet.name}'s Appointment</h1>
          <p className="text-sm text-gray-500">{format(new Date(appt.scheduledAt), 'EEEE, MMMM d · h:mm a')}</p>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      {/* Pet + parent info */}
      <div className="card flex items-center gap-4">
        <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center text-3xl shrink-0">
          {appt.pet.species === 'Cat' ? '🐱' : '🐶'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{appt.pet.name}
            <span className="text-gray-400 font-normal text-sm"> · {appt.pet.breed}</span>
          </p>
          <p className="text-sm text-gray-500">{appt.pet.age}y · {appt.pet.weight}kg</p>
          <p className="text-sm text-gray-700 mt-0.5">👤 {appt.pet.parent.name} · {appt.pet.parent.phone}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to={`/appointments/${id}/monitor`} className="btn-secondary flex items-center gap-1.5 text-xs">
            <ShieldAlert size={13} /> Monitor
          </Link>
          <button onClick={copyTrackingLink} className="btn-secondary flex items-center gap-1.5 text-xs">
            <Copy size={13} /> Share
          </button>
        </div>
      </div>

      {/* Status controls */}
      {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
        <div className="card">
          <p className="text-sm font-medium text-gray-700 mb-3">Update Status</p>
          <div className="flex items-center gap-2">
            <button
              disabled={!canReverse}
              onClick={() => updateStatus(STATUS_FLOW[currentIdx - 1])}
              className="btn-secondary flex items-center gap-1 text-sm disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-medium text-gray-600">
                {STATUS_LABELS[appt.status]}
              </span>
            </div>
            <button
              disabled={!canAdvance}
              onClick={() => updateStatus(STATUS_FLOW[currentIdx + 1])}
              className="btn-primary flex items-center gap-1 text-sm disabled:opacity-40"
            >
              {STATUS_FLOW[currentIdx + 1] === 'COMPLETED' ? 'Complete' : `Move to ${STATUS_LABELS[STATUS_FLOW[currentIdx + 1]]}`}
              <ChevronRight size={16} />
            </button>
          </div>
          {/* Progress bar */}
          <div className="mt-4 flex gap-1">
            {STATUS_FLOW.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i <= currentIdx ? 'bg-brand-500' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Services checklist */}
      <div className="card">
        <p className="text-sm font-medium text-gray-700 mb-3">Services</p>
        <div className="space-y-2">
          {appt.services.map((svc) => {
            const parsed = parseServiceNotes(svc.notes);
            return (
              <div key={svc.id}>
                <button
                  onClick={() => toggleService(svc.id, svc.completed)}
                  className="flex items-center gap-3 w-full text-left py-1.5"
                >
                  {svc.completed
                    ? <CheckSquare size={18} className="text-brand-500 shrink-0" />
                    : <Square size={18} className="text-gray-300 shrink-0" />}
                  <span className={`text-sm ${svc.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {svc.name}
                  </span>
                  {svc.completedAt && (
                    <span className="ml-auto text-xs text-gray-400">
                      {format(new Date(svc.completedAt), 'h:mm a')}
                    </span>
                  )}
                </button>
                {svc.completed && parsed && (
                  <div className="ml-9 mb-1 space-y-0.5">
                    {parsed.condition && (
                      <p className="text-xs text-gray-500">{CONDITION_LABELS[parsed.condition] || parsed.condition}</p>
                    )}
                    {parsed.notes && (
                      <p className="text-xs text-gray-400 italic">"{parsed.notes}"</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Photos */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Photos</p>
          <div className="flex gap-2">
            {[
              { type: 'BEFORE', label: 'Before' },
              { type: 'AFTER',  label: 'After' },
              { type: 'DURING', label: 'During' },
            ].map(({ type, label }) => (
              <label key={type} className="btn-secondary text-xs cursor-pointer flex items-center gap-1">
                <Camera size={13} /> {label}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhoto(e, type)} />
              </label>
            ))}
          </div>
        </div>
        {appt.photos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No photos yet</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {appt.photos.map((p) => (
              <div key={p.id} className="relative group">
                <img src={p.url} alt={p.type} className="w-full h-24 object-cover rounded-lg" />
                <span className="absolute bottom-1 left-1 badge bg-black/50 text-white text-xs">{p.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incidents */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" /> Incidents
            {appt.incidents.length > 0 && (
              <span className="badge bg-red-100 text-red-700">{appt.incidents.length}</span>
            )}
          </p>
          <button onClick={() => setIncidentModal(true)} className="btn-danger text-xs">
            Log Incident
          </button>
        </div>
        {appt.incidents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">No incidents — great!</p>
        ) : (
          <div className="space-y-3">
            {appt.incidents.map((inc) => (
              <div key={inc.id} className="border border-red-100 rounded-lg p-3 bg-red-50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={inc.severity} />
                      <span className="text-sm font-medium text-gray-900">{inc.title}</span>
                    </div>
                    <p className="text-xs text-gray-600">{inc.description}</p>
                    {inc.actionTaken && (
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Action taken:</span> {inc.actionTaken}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{format(new Date(inc.reportedAt), 'h:mm a')}</p>
                  </div>
                  <button onClick={() => deleteIncident(inc.id)} className="text-red-400 hover:text-red-600 shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {appt.notes && (
        <div className="card">
          <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
          <p className="text-sm text-gray-600">{appt.notes}</p>
        </div>
      )}

      {/* Service Completion Modal */}
      <Modal open={!!completingService} onClose={() => setCompletingService(null)} title={`Complete: ${completingService?.name}`}>
        <div className="space-y-4">
          <div>
            <label className="label">How did it go?</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[
                { value: 'GOOD', label: '✅ Good' },
                { value: 'SENSITIVE', label: '⚠️ Sensitive' },
                { value: 'ATTENTION', label: '🔴 Needs attention' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setServiceForm((f) => ({ ...f, condition: opt.value }))}
                  className={`text-xs py-2 px-2 rounded-lg border text-center transition-colors ${
                    serviceForm.condition === opt.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Observations <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              className="input"
              rows={3}
              placeholder="e.g. Coat was matted near ears, trimmed gently. Very calm during bath."
              value={serviceForm.notes}
              onChange={(e) => setServiceForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <button
            onClick={submitServiceCompletion}
            disabled={saving}
            className="btn-primary w-full"
          >
            {saving ? 'Saving…' : 'Mark Complete'}
          </button>
        </div>
      </Modal>

      {/* Log Incident Modal */}
      <Modal open={incidentModal} onClose={() => setIncidentModal(false)} title="Log an Incident">
        <div className="space-y-4">
          <div>
            <label className="label">Severity</label>
            <select className="input" value={incident.severity} onChange={(e) => setIncident({ ...incident, severity: e.target.value })}>
              <option value="LOW">Low — minor, no harm</option>
              <option value="MEDIUM">Medium — needs attention</option>
              <option value="HIGH">High — serious incident</option>
            </select>
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input" placeholder="e.g. Small nick during trimming" value={incident.title} onChange={(e) => setIncident({ ...incident, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} placeholder="Describe what happened…" value={incident.description} onChange={(e) => setIncident({ ...incident, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Action Taken</label>
            <textarea className="input" rows={2} placeholder="What was done to address it…" value={incident.actionTaken} onChange={(e) => setIncident({ ...incident, actionTaken: e.target.value })} />
          </div>
          <button
            onClick={submitIncident}
            disabled={!incident.title || !incident.description || saving}
            className="btn-danger w-full"
          >
            {saving ? 'Saving…' : 'Log Incident'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
