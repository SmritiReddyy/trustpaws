import React from 'react';
import { STATUS_LABELS, STATUS_COLORS, SEVERITY_COLORS } from '../../utils/constants';

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  return (
    <span className={`badge ${SEVERITY_COLORS[severity] || 'bg-gray-100 text-gray-700'}`}>
      {severity}
    </span>
  );
}
