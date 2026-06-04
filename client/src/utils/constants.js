export const STATUS_LABELS = {
  SCHEDULED:  'Scheduled',
  CHECKED_IN: 'Checked In',
  BATHING:    'Bathing',
  GROOMING:   'Grooming',
  DRYING:     'Drying',
  READY:      'Ready for Pickup',
  COMPLETED:  'Completed',
  CANCELLED:  'Cancelled',
};

export const STATUS_COLORS = {
  SCHEDULED:  'bg-gray-100 text-gray-700',
  CHECKED_IN: 'bg-blue-100 text-blue-700',
  BATHING:    'bg-cyan-100 text-cyan-700',
  GROOMING:   'bg-purple-100 text-purple-700',
  DRYING:     'bg-yellow-100 text-yellow-700',
  READY:      'bg-green-100 text-green-700',
  COMPLETED:  'bg-green-200 text-green-800',
  CANCELLED:  'bg-red-100 text-red-700',
};

export const STATUS_FLOW = [
  'SCHEDULED',
  'CHECKED_IN',
  'BATHING',
  'GROOMING',
  'DRYING',
  'READY',
  'COMPLETED',
];

export const SEVERITY_COLORS = {
  LOW:    'bg-yellow-100 text-yellow-700',
  MEDIUM: 'bg-orange-100 text-orange-700',
  HIGH:   'bg-red-100 text-red-700',
};

export const DEFAULT_SERVICES = [
  'Bath & Blow Dry',
  'Haircut & Styling',
  'Nail Trimming',
  'Ear Cleaning',
  'Teeth Brushing',
  'De-shedding Treatment',
  'Paw Massage',
  'Tick & Flea Treatment',
];
