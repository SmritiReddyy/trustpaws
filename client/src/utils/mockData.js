import { addHours, subDays, subHours } from 'date-fns';

const NOW = new Date();

export const MOCK_USERS = [
  { id: 'staff-1', name: 'Priya Sharma',  email: 'groomer@huft.com', password: 'staff123', role: 'STAFF' },
  { id: 'admin-1', name: 'Admin',          email: 'admin@huft.com',   password: 'admin123', role: 'ADMIN' },
];

export const MOCK_PARENTS = [
  { id: 'parent-1', name: 'Rahul Verma',   phone: '9999999999', email: 'rahul@example.com',  pin: '1234', pets: [] },
  { id: 'parent-2', name: 'Sneha Kapoor',  phone: '9888888888', email: 'sneha@example.com',  pin: '5678', pets: [] },
  { id: 'parent-3', name: 'Arjun Mehta',   phone: '9777777777', email: 'arjun@example.com',  pin: '0000', pets: [] },
];

export const MOCK_PETS = [
  { id: 'pet-1', name: 'Bruno',   breed: 'Labrador',       species: 'Dog', age: 3, weight: 28.5, parentId: 'parent-1', parent: MOCK_PARENTS[0], notes: 'Friendly, loves belly rubs', photoUrl: null },
  { id: 'pet-2', name: 'Coco',    breed: 'Poodle',         species: 'Dog', age: 2, weight: 8.2,  parentId: 'parent-2', parent: MOCK_PARENTS[1], notes: 'Anxious around loud sounds', photoUrl: null },
  { id: 'pet-3', name: 'Whiskers',breed: 'Persian',        species: 'Cat', age: 4, weight: 4.1,  parentId: 'parent-2', parent: MOCK_PARENTS[1], notes: 'Dislikes water — extra careful', photoUrl: null },
  { id: 'pet-4', name: 'Max',     breed: 'German Shepherd',species: 'Dog', age: 5, weight: 32.0, parentId: 'parent-3', parent: MOCK_PARENTS[2], notes: '', photoUrl: null },
];

// Wire pets back to parents
MOCK_PARENTS[0].pets = [MOCK_PETS[0]];
MOCK_PARENTS[1].pets = [MOCK_PETS[1], MOCK_PETS[2]];
MOCK_PARENTS[2].pets = [MOCK_PETS[3]];

const SERVICES_BATH = [
  { id: 'svc-1', name: 'Bath & Blow Dry',    completed: true,  completedAt: subHours(NOW, 1).toISOString(), notes: '' },
  { id: 'svc-2', name: 'Haircut & Styling',  completed: true,  completedAt: subHours(NOW, 0.5).toISOString(), notes: '' },
  { id: 'svc-3', name: 'Nail Trimming',      completed: false, completedAt: null, notes: '' },
  { id: 'svc-4', name: 'Ear Cleaning',       completed: false, completedAt: null, notes: '' },
  { id: 'svc-5', name: 'Teeth Brushing',     completed: false, completedAt: null, notes: '' },
];

const SERVICES_BASIC = [
  { id: 'svc-6', name: 'Bath & Blow Dry',    completed: false, completedAt: null, notes: '' },
  { id: 'svc-7', name: 'Nail Trimming',      completed: false, completedAt: null, notes: '' },
  { id: 'svc-8', name: 'Ear Cleaning',       completed: false, completedAt: null, notes: '' },
];

export const MOCK_APPOINTMENTS = [
  {
    id: 'appt-1',
    petId: 'pet-1',
    pet: { ...MOCK_PETS[0], parent: MOCK_PARENTS[0] },
    staffId: 'staff-1',
    staff: { id: 'staff-1', name: 'Priya Sharma' },
    status: 'GROOMING',
    notes: 'Regular monthly grooming. Prefers gentle handling.',
    scheduledAt: subHours(NOW, 2).toISOString(),
    completedAt: null,
    trackingToken: 'demo-token-bruno',
    createdAt: subHours(NOW, 3).toISOString(),
    services: SERVICES_BATH,
    incidents: [
      {
        id: 'inc-1',
        appointmentId: 'appt-1',
        severity: 'LOW',
        title: 'Minor nick during ear trim',
        description: 'Small superficial nick on left ear tip while trimming. No bleeding, pet remained calm.',
        actionTaken: 'Cleaned with antiseptic. Monitored for 10 mins. All good.',
        reportedAt: subHours(NOW, 0.5).toISOString(),
      },
    ],
    photos: [],
    clips: [],
  },
  {
    id: 'appt-2',
    petId: 'pet-2',
    pet: { ...MOCK_PETS[1], parent: MOCK_PARENTS[1] },
    staffId: 'staff-1',
    staff: { id: 'staff-1', name: 'Priya Sharma' },
    status: 'BATHING',
    notes: 'First visit. Handle gently — tends to get anxious.',
    scheduledAt: subHours(NOW, 1).toISOString(),
    completedAt: null,
    trackingToken: 'demo-token-coco',
    createdAt: subHours(NOW, 2).toISOString(),
    services: SERVICES_BASIC,
    incidents: [],
    photos: [],
    clips: [],
  },
  {
    id: 'appt-3',
    petId: 'pet-3',
    pet: { ...MOCK_PETS[2], parent: MOCK_PARENTS[1] },
    staffId: 'staff-1',
    staff: { id: 'staff-1', name: 'Priya Sharma' },
    status: 'READY',
    notes: 'Dry shampoo only — no wet bath.',
    scheduledAt: subHours(NOW, 3).toISOString(),
    completedAt: null,
    trackingToken: 'demo-token-whiskers',
    createdAt: subHours(NOW, 4).toISOString(),
    services: [
      { id: 'svc-9',  name: 'Dry Shampoo',    completed: true, completedAt: subHours(NOW, 1).toISOString(), notes: '' },
      { id: 'svc-10', name: 'Nail Trimming',  completed: true, completedAt: subHours(NOW, 0.8).toISOString(), notes: '' },
      { id: 'svc-11', name: 'Ear Cleaning',   completed: true, completedAt: subHours(NOW, 0.5).toISOString(), notes: '' },
    ],
    incidents: [],
    photos: [],
    clips: [],
  },
  {
    id: 'appt-4',
    petId: 'pet-4',
    pet: { ...MOCK_PETS[3], parent: MOCK_PARENTS[2] },
    staffId: 'staff-1',
    staff: { id: 'staff-1', name: 'Priya Sharma' },
    status: 'COMPLETED',
    notes: '',
    scheduledAt: subDays(NOW, 1).toISOString(),
    completedAt: subDays(NOW, 1).toISOString(),
    trackingToken: 'demo-token-max',
    createdAt: subDays(NOW, 1).toISOString(),
    services: [
      { id: 'svc-12', name: 'Bath & Blow Dry',   completed: true, completedAt: subDays(NOW, 1).toISOString(), notes: '' },
      { id: 'svc-13', name: 'Haircut & Styling',  completed: true, completedAt: subDays(NOW, 1).toISOString(), notes: '' },
      { id: 'svc-14', name: 'Nail Trimming',      completed: true, completedAt: subDays(NOW, 1).toISOString(), notes: '' },
    ],
    incidents: [],
    photos: [],
    clips: [],
  },
];

// Wire appointment history into pets
MOCK_PETS[0].appointments = [MOCK_APPOINTMENTS[0]];
MOCK_PETS[1].appointments = [MOCK_APPOINTMENTS[1]];
MOCK_PETS[2].appointments = [MOCK_APPOINTMENTS[2]];
MOCK_PETS[3].appointments = [MOCK_APPOINTMENTS[3]];
