import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Plus, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function PetDetail() {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/pets/${id}`).then((r) => setPet(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="card text-center py-10 text-gray-400">Loading…</div>;
  if (!pet) return <div className="card text-center py-10 text-red-400">Pet not found</div>;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/pets" className="text-gray-500 hover:text-gray-700"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold text-gray-900">{pet.name}'s Profile</h1>
      </div>

      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-4xl shrink-0">
          {pet.species === 'Cat' ? '🐱' : '🐶'}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{pet.name}</h2>
          <p className="text-sm text-gray-500">{pet.breed} · {pet.species}</p>
          {(pet.age || pet.weight) && (
            <p className="text-sm text-gray-500">
              {pet.age && `${pet.age} yrs`}{pet.age && pet.weight && ' · '}{pet.weight && `${pet.weight} kg`}
            </p>
          )}
          <p className="text-sm text-gray-700 mt-1">👤 {pet.parent.name} · {pet.parent.phone}</p>
        </div>
      </div>

      {pet.notes && (
        <div className="card">
          <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
          <p className="text-sm text-gray-600">{pet.notes}</p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Visit History</h3>
          <Link to="/appointments/new" className="btn-primary flex items-center gap-1 text-xs">
            <Plus size={14} /> Book
          </Link>
        </div>
        {pet.appointments.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">No visits yet</div>
        ) : (
          <div className="space-y-2">
            {pet.appointments.map((a) => (
              <Link key={a.id} to={`/appointments/${a.id}`} className="card flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-sm font-medium text-gray-900">{format(new Date(a.scheduledAt), 'MMM d, yyyy · h:mm a')}</p>
                  <p className="text-xs text-gray-500">{a.staff?.name || 'Unassigned'}</p>
                </div>
                <div className="flex items-center gap-2">
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
    </div>
  );
}
