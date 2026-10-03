import React from 'react';
import { FaBuilding, FaUsers, FaShieldAlt, FaBell, FaPuzzlePiece, FaChevronRight, FaDoorOpen, FaDatabase, FaHistory, FaUserShield, FaKey, FaCoins, FaEnvelope, FaWhatsapp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();

  const settingsCards = [
    {
      id: 'general',
      title: 'General Settings',
      description: 'Manage clinic details, contact information, tax configuration, and branding.',
      icon: <FaBuilding className="text-blue-500" size={24} />,
      path: '/settings/clinic',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100'
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Connectivity',
      description: 'Connect clinic WhatsApp session via QR scan to send automated patient & admin notification alerts.',
      icon: <FaWhatsapp className="text-emerald-500" size={24} />,
      path: '/settings/whatsapp',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100'
    },
    {
      id: 'currency',
      title: 'Currency & Regional Format',
      description: 'Configure active clinic currency (₹ INR, $ USD, £ GBP, د.إ AED, € EUR) and regional formatting.',
      icon: <FaCoins className="text-amber-500" size={24} />,
      path: '/settings/currency',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100'
    },
    {
      id: 'smtp',
      title: 'Configure Email SMTP',
      description: 'Setup dedicated clinic SMTP mail server (Gmail, Outlook, SendGrid) for reminders and notices.',
      icon: <FaEnvelope className="text-sky-500" size={24} />,
      path: '/settings/smtp',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-100'
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage staff profiles, system access, and add/edit users.',
      icon: <FaUsers className="text-emerald-500" size={24} />,
      path: '/settings/users',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100'
    },
    {
      id: 'roles',
      title: 'Roles & Permissions',
      description: 'Granular access control matrix (Admin, Therapist, Receptionist, Billing).',
      icon: <FaUserShield className="text-indigo-500" size={24} />,
      path: '/settings/roles',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100'
    },
    {
      id: 'security',
      title: 'Security & Access',
      description: 'Single session login, IP whitelist, 2FA, and remote session termination.',
      icon: <FaShieldAlt className="text-purple-500" size={24} />,
      path: '/settings/security',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure email alerts, SMS settings, and system notifications.',
      icon: <FaBell className="text-orange-500" size={24} />,
      path: '/settings/notifications',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-100'
    },
    {
      id: 'backup',
      title: 'Data Backup & Recovery',
      description: 'Generate real-time database snapshots (JSON & SQL), download backups, and instant restore.',
      icon: <FaDatabase className="text-cyan-500" size={24} />,
      path: '/settings/backup',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-100'
    },
    {
      id: 'audit',
      title: 'Audit & Activity Logs',
      description: 'Review staff login sessions, IP addresses, patient updates, and administrative changes.',
      icon: <FaHistory className="text-rose-500" size={24} />,
      path: '/settings/audit',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100'
    },
    {
      id: 'rooms',
      title: 'Room Settings',
      description: 'Manage room list used in appointment booking.',
      icon: <FaDoorOpen className="text-teal-500" size={24} />,
      path: '/settings/rooms',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-100'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in font-sans">
      <div className="mb-10">
         <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
         <p className="text-slate-500 mt-2 font-medium text-sm">Configure and manage your clinic preferences and operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCards.map((card) => (
          <div 
            key={card.id} 
            onClick={() => navigate(card.path)}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col cursor-pointer hover:shadow-google hover:border-clinicPrimary/30 hover:-translate-y-1 transition-all group"
          >
            <div className={`w-14 h-14 rounded-2xl ${card.bgColor} ${card.borderColor} border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
              {card.icon}
            </div>
            
            <h2 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-clinicPrimary transition-colors tracking-tight">{card.title}</h2>
            <p className="text-sm text-slate-500 leading-relaxed flex-1">{card.description}</p>
            
            <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-clinicPrimary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
               Manage Settings <FaChevronRight size={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
