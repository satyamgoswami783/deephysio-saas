import React from 'react';
import Badge, { BadgeVariant } from './Badge';
import { AppointmentStatus } from '../../types/appointment.types';
import { InvoiceStatus, PaymentStatus } from '../../types/billing.types';
import { PatientBehaviour } from '../../types/patient.types';

interface StatusBadgeProps {
  status: AppointmentStatus | InvoiceStatus | PaymentStatus | PatientBehaviour | string;
  type?: 'appointment' | 'invoice' | 'payment' | 'behaviour';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'appointment',
  size = 'sm',
}) => {
  let label = String(status || '').replace(/_/g, ' ');
  let variant: BadgeVariant = 'neutral';

  const normalized = String(status || '').toLowerCase();

  if (type === 'appointment') {
    switch (normalized) {
      case 'scheduled':
        label = 'Scheduled';
        variant = 'info';
        break;
      case 'confirmed':
        label = 'Confirmed';
        variant = 'primary';
        break;
      case 'checked_in':
        label = 'Checked In';
        variant = 'success';
        break;
      case 'in_progress':
        label = 'In Progress';
        variant = 'warning';
        break;
      case 'completed':
        label = 'Completed';
        variant = 'success';
        break;
      case 'cancelled':
        label = 'Cancelled';
        variant = 'danger';
        break;
      case 'no_show':
        label = 'No Show';
        variant = 'danger';
        break;
      default:
        variant = 'neutral';
    }
  } else if (type === 'invoice') {
    switch (normalized) {
      case 'paid':
        label = 'Paid';
        variant = 'success';
        break;
      case 'pending':
        label = 'Pending';
        variant = 'warning';
        break;
      case 'overdue':
        label = 'Overdue';
        variant = 'danger';
        break;
      case 'cancelled':
        label = 'Cancelled';
        variant = 'neutral';
        break;
      default:
        variant = 'neutral';
    }
  } else if (type === 'payment') {
    switch (normalized) {
      case 'completed':
        label = 'Completed';
        variant = 'success';
        break;
      case 'pending':
        label = 'Pending';
        variant = 'warning';
        break;
      case 'failed':
        label = 'Failed';
        variant = 'danger';
        break;
      case 'refunded':
        label = 'Refunded';
        variant = 'info';
        break;
      default:
        variant = 'neutral';
    }
  } else if (type === 'behaviour') {
    switch (normalized) {
      case 'green':
        label = 'Green Flag';
        variant = 'success';
        break;
      case 'yellow':
        label = 'Yellow Flag';
        variant = 'warning';
        break;
      case 'red':
        label = 'Red Flag';
        variant = 'danger';
        break;
      default:
        variant = 'neutral';
    }
  }

  return <Badge label={label} variant={variant} size={size} dot />;
};

export default StatusBadge;
