import {
  MOCK_USERS, MOCK_PARENTS, MOCK_PETS, MOCK_APPOINTMENTS,
} from './mockData';

// Deep clone without circular refs
function clone(obj) {
  if (Array.isArray(obj)) return obj.map(clone);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      // Skip back-references that cause cycles (pets inside parents, parent inside pet)
      if (k === 'appointments' || k === 'pets' || k === 'parent') { out[k] = Array.isArray(v) ? [] : null; continue; }
      out[k] = clone(v);
    }
    return out;
  }
  return obj;
}

// Simple in-memory state so mutations persist during the session
let appointments = MOCK_APPOINTMENTS.map((a) => ({
  ...a,
  services:  a.services.map((s) => ({ ...s })),
  incidents: a.incidents.map((i) => ({ ...i })),
  photos:    [...a.photos],
  clips:     [...(a.clips || [])],
  pet: { ...a.pet, parent: { ...a.pet.parent, pets: [], pin: false }, appointments: [] },
}));
let parents = MOCK_PARENTS.map((p) => ({ ...p, pets: p.pets.map((pet) => ({ ...pet, parent: null, appointments: [] })) }));
let pets    = MOCK_PETS.map((p) => ({ ...p, parent: { ...p.parent, pets: [], pin: false }, appointments: [] }));

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

const ok   = (data)    => ({ data });
const fail = (msg, status = 400) => { const e = new Error(msg); e.response = { data: { error: msg }, status }; throw e; };

// ── Auth ──────────────────────────────────────────────────────────────────────
// Session state — avoids any token encoding/decoding issues in mock mode
let _loggedInParentId = null;

async function staffLogin({ email, password }) {
  await delay();
  const user = MOCK_USERS.find((u) => u.email === email && u.password === password);
  if (!user) fail('Invalid email or password', 401);
  return ok({ token: `STAFF_${user.id}`, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

async function parentLogin({ phone, pin }) {
  await delay();
  const parent = parents.find((p) => p.phone === phone);
  if (!parent) fail('Invalid phone number or PIN not set.', 401);
  if (String(parent.pin) !== String(pin)) fail('Incorrect PIN', 401);
  _loggedInParentId = parent.id;
  return ok({ token: `PARENT_${parent.id}`, parent: { id: parent.id, name: parent.name, phone: parent.phone, email: parent.email } });
}

async function parentMe(token) {
  await delay();
  // Resolve parent id from token string or fallback to session variable
  let id = _loggedInParentId;
  if (!id && token?.startsWith('PARENT_')) id = token.replace('PARENT_', '');
  if (!id) fail('Not logged in', 401);
  const parent = parents.find((p) => p.id === id);
  if (!parent) fail('Not found', 404);
  const parentPets = pets
    .filter((p) => p.parentId === parent.id)
    .map((pet) => ({
      ...pet,
      appointments: appointments.filter((a) => a.petId === pet.id),
    }));
  return ok({ ...parent, pets: parentPets });
}

// ── Appointments ──────────────────────────────────────────────────────────────
async function getAppointments({ date, status } = {}) {
  await delay();
  let result = [...appointments];
  if (status) result = result.filter((a) => a.status === status);
  if (date) {
    result = result.filter((a) => {
      const d = new Date(a.scheduledAt);
      return d.toISOString().startsWith(date);
    });
  }
  return ok(result);
}

async function getAppointment(id) {
  await delay();
  const a = appointments.find((a) => a.id === id);
  if (!a) fail('Not found', 404);
  return ok(a);
}

async function createAppointment(body) {
  await delay();
  const pet    = pets.find((p) => p.id === body.petId);
  const staff  = MOCK_USERS.find((u) => u.id === body.staffId) || MOCK_USERS[0];
  const newAppt = {
    id: `appt-${Date.now()}`,
    petId: body.petId,
    pet: { ...pet, parent: parents.find((p) => p.id === pet?.parentId) },
    staffId: staff.id,
    staff: { id: staff.id, name: staff.name },
    status: 'SCHEDULED',
    notes: body.notes || '',
    scheduledAt: new Date(body.scheduledAt).toISOString(),
    completedAt: null,
    trackingToken: `token-${Date.now()}`,
    createdAt: new Date().toISOString(),
    services: (body.services || []).map((name, i) => ({
      id: `svc-new-${i}`, name, completed: false, completedAt: null, notes: '',
    })),
    incidents: [],
    photos: [],
    clips: [],
  };
  appointments.push(newAppt);
  return ok(newAppt);
}

async function updateStatus(id, status) {
  await delay();
  const appt = appointments.find((a) => a.id === id);
  if (!appt) fail('Not found', 404);
  appt.status = status;
  if (status === 'COMPLETED') appt.completedAt = new Date().toISOString();
  return ok(appt);
}

async function updateService(apptId, svcId, { completed, notes }) {
  await delay();
  const appt = appointments.find((a) => a.id === apptId);
  const svc  = appt?.services.find((s) => s.id === svcId);
  if (!svc) fail('Not found', 404);
  svc.completed   = completed;
  svc.completedAt = completed ? new Date().toISOString() : null;
  if (notes !== undefined) svc.notes = notes;
  return ok(svc);
}

// ── Incidents ─────────────────────────────────────────────────────────────────
async function createIncident(body) {
  await delay();
  const appt = appointments.find((a) => a.id === body.appointmentId);
  if (!appt) fail('Not found', 404);
  const incident = {
    id: `inc-${Date.now()}`,
    appointmentId: body.appointmentId,
    severity: body.severity || 'LOW',
    title: body.title,
    description: body.description,
    actionTaken: body.actionTaken || '',
    reportedAt: new Date().toISOString(),
  };
  appt.incidents.push(incident);
  return ok(incident);
}

async function deleteIncident(id) {
  await delay();
  appointments.forEach((a) => { a.incidents = a.incidents.filter((i) => i.id !== id); });
  return ok({ success: true });
}

// ── Parents ───────────────────────────────────────────────────────────────────
async function getParents() {
  await delay();
  return ok(parents.map(({ pin, ...p }) => ({ ...p, pin: !!pin })));
}

async function createParent(body) {
  await delay();
  const existing = parents.find((p) => p.phone === body.phone);
  if (existing) fail('Phone number already exists');
  const newParent = { id: `parent-${Date.now()}`, ...body, pin: null, pets: [] };
  parents.push(newParent);
  return ok(newParent);
}

async function setPin({ parentId, pin }) {
  await delay();
  const parent = parents.find((p) => p.id === parentId);
  if (!parent) fail('Not found', 404);
  parent.pin = String(pin);
  return ok({ success: true, parent: { id: parent.id, name: parent.name, phone: parent.phone } });
}

// ── Pets ──────────────────────────────────────────────────────────────────────
async function getPets() {
  await delay();
  return ok(pets.map((p) => ({ ...p, parent: parents.find((pr) => pr.id === p.parentId) })));
}

async function getPet(id) {
  await delay();
  const pet = pets.find((p) => p.id === id);
  if (!pet) fail('Not found', 404);
  return ok({
    ...pet,
    parent: parents.find((p) => p.id === pet.parentId),
    appointments: appointments.filter((a) => a.petId === id),
  });
}

async function createPet(body) {
  await delay();
  const parent = parents.find((p) => p.id === body.parentId);
  const newPet = { id: `pet-${Date.now()}`, ...body, parent, appointments: [] };
  pets.push(newPet);
  if (parent) parent.pets = [...(parent.pets || []), newPet];
  return ok(newPet);
}

// ── Tracking (public) ─────────────────────────────────────────────────────────
async function getTracking(token) {
  await delay();
  const appt = appointments.find((a) => a.trackingToken === token);
  if (!appt) fail('Not found', 404);
  return ok(appt);
}

// ── Clips (mock — no actual video in mock mode) ───────────────────────────────
async function getClips(apptId) {
  await delay();
  const appt = appointments.find((a) => a.id === apptId);
  return ok(appt?.clips || []);
}

// ── Router — maps method+url to handler ───────────────────────────────────────
export async function mockRequest(method, url, data) {
  const m = method.toUpperCase();
  const path = url.replace(/^\/api/, '');

  // Auth
  if (m === 'POST' && path === '/auth/login')            return staffLogin(data);
  if (m === 'POST' && path === '/parent-auth/login')     return parentLogin(data);
  if (m === 'GET'  && path === '/parent-auth/me')        {
    // Try __token (passed via handler), then localStorage parent_token
    const token = data?.__token || (typeof localStorage !== 'undefined' ? localStorage.getItem('parent_token') : null);
    return parentMe(token);
  }
  if (m === 'POST' && path === '/parent-auth/set-pin')   return setPin(data);

  // Appointments
  if (m === 'GET'  && path.startsWith('/appointments') && !path.split('/')[2]) {
    const params = data || {};
    return getAppointments(params);
  }
  if (m === 'GET'  && /^\/appointments\/[^/]+$/.test(path)) return getAppointment(path.split('/')[2]);
  if (m === 'POST' && path === '/appointments')          return createAppointment(data);
  if (m === 'PATCH'&& /\/appointments\/[^/]+\/status/.test(path)) return updateStatus(path.split('/')[2], data.status);
  if (m === 'PATCH'&& /\/appointments\/[^/]+\/service\//.test(path)) {
    const parts = path.split('/');
    return updateService(parts[2], parts[4], data);
  }

  // Incidents
  if (m === 'POST'   && path === '/incidents')                     return createIncident(data);
  if (m === 'DELETE' && /^\/incidents\//.test(path))               return deleteIncident(path.split('/')[2]);

  // Parents
  if (m === 'GET'  && path === '/parents')               return getParents();
  if (m === 'POST' && path === '/parents')               return createParent(data);

  // Pets
  if (m === 'GET'  && path === '/pets')                  return getPets();
  if (m === 'GET'  && /^\/pets\/[^/]+$/.test(path))     return getPet(path.split('/')[2]);
  if (m === 'POST' && path === '/pets')                  return createPet(data);

  // Tracking
  if (m === 'GET'  && path.startsWith('/track/'))        return getTracking(path.split('/track/')[1]);

  // Clips
  if (m === 'GET'  && path.startsWith('/clips/appointment/')) return getClips(path.split('/').pop());
  if (m === 'POST' && path === '/clips')                 return ok({ id: `clip-${Date.now()}`, triggerType: 'MANUAL', reviewed: false, createdAt: new Date().toISOString() });

  // Fallback
  console.warn('[mockApi] unhandled:', m, path);
  return ok([]);
}
