import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (dateStr?: string | null, formatPattern: string = 'dd MMM yyyy'): string => {
  if (!dateStr) return 'N/A';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    if (!isValid(d)) return String(dateStr);
    return format(d, formatPattern);
  } catch {
    return String(dateStr);
  }
};

export const formatTime = (timeStr?: string | null): string => {
  if (!timeStr) return '';
  try {
    if (timeStr.includes('T')) {
      const d = parseISO(timeStr);
      if (isValid(d)) return format(d, 'hh:mm a');
    }
    // If string is already HH:mm
    if (/^\d{1,2}:\d{2}/.test(timeStr)) {
      const [h, m] = timeStr.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
    }
    return timeStr;
  } catch {
    return timeStr;
  }
};

export const formatDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return 'N/A';
  return `${formatDate(dateStr, 'dd MMM yyyy')} at ${formatTime(dateStr)}`;
};
