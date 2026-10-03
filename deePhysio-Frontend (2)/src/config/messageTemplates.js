export const MESSAGE_TEMPLATE_SETTINGS_KEY = 'communicationMessageTemplatesV1';

export const DEFAULT_MESSAGE_TEMPLATES = [
  {
    id: 'sys_appt_reminder_sms',
    name: 'Appointment Reminder',
    type: 'SMS',
    category: 'Operational',
    content: 'Hi {firstname}, this is a reminder for your appointment on {date} at {time}. - {clinic}',
    system: true,
    updatedAt: 'system'
  },
  {
    id: 'sys_running_late_sms',
    name: 'Running Late',
    type: 'SMS',
    category: 'Operational',
    content: 'Hi {firstname}, we are running about 15 minutes late today. Sorry for the delay.',
    system: true,
    updatedAt: 'system'
  },
  {
    id: 'sys_general_sms',
    name: 'General Message',
    type: 'SMS',
    category: 'General',
    content: 'Hi {firstname}, we have a quick update regarding your treatment plan. Please contact us when possible.',
    system: true,
    updatedAt: 'system'
  },
  {
    id: 'sys_invoice_reminder_sms',
    name: 'Invoice Reminder',
    type: 'SMS',
    category: 'Billing',
    content: 'Hi {firstname}, this is a reminder for your pending invoice. Please clear it at your earliest convenience.',
    system: true,
    updatedAt: 'system'
  },
  {
    id: 'sys_promo_offer_sms',
    name: 'Promotional Offer',
    type: 'SMS',
    category: 'Marketing',
    content: 'Hi {firstname}, special offer this week at {clinic}. Reply to book your slot.',
    system: true,
    updatedAt: 'system'
  },
  {
    id: 'sys_appt_reminder_email',
    name: 'Appointment Reminder',
    type: 'Email',
    category: 'Operational',
    content: 'Hi {firstname}, this is a reminder for your appointment on {date} at {time}. Regards, {clinic}.',
    system: true,
    updatedAt: 'system'
  },
  {
    id: 'sys_invoice_reminder_email',
    name: 'Invoice Reminder',
    type: 'Email',
    category: 'Billing',
    content: 'Hi {firstname}, your invoice is pending. Please complete payment at your earliest convenience.',
    system: true,
    updatedAt: 'system'
  },
  {
    id: 'sys_promo_offer_email',
    name: 'Promotional Offer',
    type: 'Email',
    category: 'Marketing',
    content: 'Hi {firstname}, we are running a limited-time wellness offer at {clinic}. Contact us to avail.',
    system: true,
    updatedAt: 'system'
  }
];

export const normalizeTemplates = (value) => {
  const list = Array.isArray(value) ? value : [];
  const merged = [...DEFAULT_MESSAGE_TEMPLATES];
  list.forEach((item) => {
    if (!item || !item.id) return;
    const idx = merged.findIndex((t) => t.id === item.id);
    const normalized = {
      id: String(item.id),
      name: String(item.name || 'Template'),
      type: String(item.type || 'SMS').toUpperCase() === 'EMAIL' ? 'Email' : 'SMS',
      category: String(item.category || 'General'),
      content: String(item.content || ''),
      system: Boolean(item.system),
      updatedAt: item.updatedAt || new Date().toISOString()
    };
    if (idx >= 0) merged[idx] = { ...merged[idx], ...normalized };
    else merged.push(normalized);
  });
  return merged;
};

export const renderTemplate = (content = '', context = {}) => {
  const map = {
    firstname: context.firstname || '',
    lastname: context.lastname || '',
    name: context.name || '',
    patient: context.name || '',
    practitioner: context.practitioner || '',
    time: context.time || '',
    date: context.date || '',
    clinic: context.clinic || 'DeePhysio'
  };
  return String(content).replace(/\{(\w+)\}/g, (_, key) => {
    const token = String(key || '').toLowerCase();
    return map[token] ?? '';
  });
};
