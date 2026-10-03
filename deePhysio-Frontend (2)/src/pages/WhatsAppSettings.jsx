import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaMobileAlt, FaQrcode, FaCheckCircle, 
  FaExclamationTriangle, FaSyncAlt, FaSignOutAlt, 
  FaPaperPlane, FaShieldAlt, FaWhatsapp
} from 'react-icons/fa';
import { fetchApi } from '../config/api';
import { useToast } from '../context/ToastContext';
import AnnouncementsHub from '../components/communication/AnnouncementsHub';

const WhatsAppSettings = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [status, setStatus] = useState('DISCONNECTED'); // DISCONNECTED | CONNECTING | QR_READY | CONNECTED | ERROR
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [connectedAt, setConnectedAt] = useState(null);
  const [lastError, setLastError] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // Pairing Code (8-digit code)
  const [pairingCode, setPairingCode] = useState(null);
  const [requestingCode, setRequestingCode] = useState(false);

  const pollTimerRef = useRef(null);

  // 1. Load initial status
  const fetchStatus = async () => {
    try {
      const res = await fetchApi('/settings/whatsapp/status');
      if (!res?.ok) return;
      const data = await res.json();
      if (data?.success && data?.data) {
        const info = data.data;
        setStatus(info.status);
        if (info.status === 'CONNECTED') {
          setPhoneNumber(info.phoneNumber || '');
          setConnectedAt(info.connectedAt || null);
          setQrCode(null);
          setPairingCode(null);
          setLastError(null);
        } else if (info.status === 'QR_READY' || info.status === 'CONNECTING') {
          if (info.phoneNumber) setPhoneNumber(info.phoneNumber);
          if (info.qrCode) setQrCode(info.qrCode);
          if (info.pairingCode) setPairingCode(info.pairingCode);
        } else {
          // DISCONNECTED / initial clean zero-state
          setQrCode(null);
          setPairingCode(null);
          setConnectedAt(null);
          setLastError(null);
          if (info.phoneNumber) {
            setPhoneNumber(info.phoneNumber);
          } else {
            setPhoneNumber('');
          }
        }
      }
    } catch (e) {
      console.error('Error fetching WhatsApp status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Poll status every 3s if connecting or qr ready
    pollTimerRef.current = setInterval(() => {
      fetchStatus();
    }, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Handle Connect / QR Code generation
  const handleConnect = async (e) => {
    if (e) e.preventDefault();
    if (!phoneNumber.trim()) {
      showToast('Please enter your WhatsApp mobile number', 'error');
      return;
    }

    setIsConnecting(true);
    setLastError(null);
    try {
      const res = await fetchApi('/settings/whatsapp/connect', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() })
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setStatus('QR_READY');
        if (data.data?.qrCode) setQrCode(data.data.qrCode);
        showToast('Connection session initialized. Scan QR to link.', 'success');
      } else {
        setLastError(data?.message || 'Failed to initiate connection');
        showToast(data?.message || 'Connection initiation failed', 'error');
      }
    } catch (_) {
      setLastError('Network error while initializing session');
      showToast('Network error while connecting WhatsApp', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  // Request 8-digit Pairing Code
  const handleRequestPairingCode = async () => {
    if (!phoneNumber.trim()) {
      showToast('Please enter your WhatsApp phone number', 'error');
      return;
    }
    setRequestingCode(true);
    try {
      const res = await fetchApi('/settings/whatsapp/pairing-code', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() })
      });
      const data = await res.json();
      if (res.ok && data?.success && data?.data?.pairingCode) {
        setPairingCode(data.data.pairingCode);
        showToast('Pairing code generated! Enter this code in WhatsApp.', 'success');
      } else {
        showToast(data?.message || 'Failed to generate pairing code. Please try QR scan.', 'error');
      }
    } catch (_) {
      showToast('Network error generating pairing code', 'error');
    } finally {
      setRequestingCode(false);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetchApi('/settings/whatsapp/disconnect', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data?.success) {
        setStatus('DISCONNECTED');
        setQrCode(null);
        setPairingCode(null);
        setConnectedAt(null);
        setShowDisconnectModal(false);
        showToast('WhatsApp account disconnected successfully', 'success');
      } else {
        showToast(data?.message || 'Failed to disconnect', 'error');
      }
    } catch (_) {
      showToast('Network error during disconnection', 'error');
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Handle Reconnect
  const handleReconnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetchApi('/settings/whatsapp/reconnect', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data?.success) {
        setStatus('QR_READY');
        showToast('Reconnection requested. Please scan QR code.', 'success');
      } else {
        showToast(data?.message || 'Reconnect failed. Try connecting again.', 'error');
      }
    } catch (_) {
      showToast('Network error while reconnecting', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 text-slate-400">
        <FaSyncAlt size={24} className="animate-spin text-[#ea580c]" />
        <span className="text-xs font-bold text-slate-600">Loading WhatsApp Gateway...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            title="Go Back"
          >
            <FaArrowLeft size={14} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>WhatsApp Connectivity & Announcements</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Manage WhatsApp gateway connection and broadcast notifications to clinic members.
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2">
          {status === 'CONNECTED' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <FaWhatsapp className="text-emerald-600" />
              <span>Gateway Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>Disconnected</span>
            </div>
          )}
        </div>
      </div>

      {/* ── CONNECTION SETUP CARD (If Disconnected or Connecting) ── */}
      {status !== 'CONNECTED' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          
          {/* State A: DISCONNECTED FORM */}
          {status === 'DISCONNECTED' && (
            <div className="max-w-md space-y-4">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <FaMobileAlt className="text-[#ea580c]" />
                  <span>Connect Clinic WhatsApp Account</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Enter your clinic WhatsApp number. A live QR code will be generated for you to scan from your mobile device.
                </p>
              </div>

              <form onSubmit={handleConnect} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Clinic WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FaMobileAlt size={13} />
                    </div>
                    <input
                      type="tel"
                      name="clinic_wa_phone_unique"
                      id="clinic_wa_phone_unique"
                      autoComplete="new-password"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        if (lastError) setLastError(null);
                      }}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full h-11 pl-10 pr-3.5 bg-slate-50 focus:bg-white text-slate-800 text-sm font-semibold rounded-xl border border-slate-200 focus:border-[#ea580c] focus:ring-2 focus:ring-[#ea580c]/15 outline-none transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Include country code (e.g. <strong>+91</strong> for India). 10-digit numbers are auto-formatted.
                  </p>
                </div>

                {lastError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                    <FaExclamationTriangle size={13} className="shrink-0 mt-0.5 text-rose-500" />
                    <span>{lastError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isConnecting || !phoneNumber}
                  className="px-6 py-2.5 bg-[#ea580c] hover:bg-[#c8501e] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  {isConnecting ? (
                    <>
                      <FaSyncAlt size={12} className="animate-spin" />
                      <span>Initiating Session...</span>
                    </>
                  ) : (
                    <>
                      <FaQrcode size={13} />
                      <span>Generate Connection QR</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* State B: QR_READY OR CONNECTING */}
          {(status === 'CONNECTING' || status === 'QR_READY') && (
            <div className="text-center max-w-sm mx-auto space-y-4">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
                  <FaQrcode className="text-[#ea580c]" />
                  <span>Scan QR Code to Link WhatsApp</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Open WhatsApp on your phone &gt; <strong>Linked Devices</strong> &gt; Scan this code.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center shadow-inner">
                {qrCode ? (
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <img
                      src={qrCode}
                      alt="WhatsApp QR Code"
                      className="w-56 h-56 object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <FaSyncAlt size={24} className="animate-spin text-[#ea580c]" />
                    <span className="text-xs font-bold">Waiting for WhatsApp QR...</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mt-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Live connection listener active</span>
                </div>
              </div>

              {/* Pairing code fallback */}
              {pairingCode ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-xs text-amber-800 font-medium">Link with 8-digit Pairing Code:</div>
                  <div className="text-xl font-mono font-black text-amber-950 tracking-widest mt-1">
                    {pairingCode}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestPairingCode}
                  disabled={requestingCode}
                  className="text-xs font-extrabold text-[#ea580c] hover:underline cursor-pointer"
                >
                  {requestingCode ? 'Requesting pairing code...' : 'Or link with 8-digit phone code'}
                </button>
              )}
            </div>
          )}

          {/* State D: ERROR */}
          {(status === 'ERROR' || status === 'QR_EXPIRED') && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FaExclamationTriangle className="text-rose-500 shrink-0" size={18} />
                <div>
                  <div className="text-xs font-bold text-rose-900">Connection Expired / Error</div>
                  <div className="text-[11px] text-rose-700">{lastError || 'Session timed out. Please reconnect.'}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReconnect}
                className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-rose-700"
              >
                Reconnect
              </button>
            </div>
          )}

        </div>
      )}

      {/* ── STATE C: CONNECTED BAR ── */}
      {status === 'CONNECTED' && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shrink-0">
              <FaCheckCircle />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900">WhatsApp is Actively Connected</h2>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-200 text-emerald-800">
                  Live Gateway
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Clinic Number: <strong className="font-mono text-slate-900 font-extrabold">+{phoneNumber}</strong>
                {connectedAt && (
                  <span className="text-slate-400 ml-2">
                    • Active since {new Date(connectedAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDisconnectModal(true)}
            className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <FaSignOutAlt size={11} />
            <span>Disconnect</span>
          </button>
        </div>
      )}

      {/* ── ANNOUNCEMENTS & NOTIFICATIONS HUB (Exact UI from Screenshot) ── */}
      <div className="pt-2">
        <AnnouncementsHub isEmbedded={true} />
      </div>

      {/* ── DISCONNECT CONFIRMATION MODAL ── */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <FaSignOutAlt size={16} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Disconnect WhatsApp?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Automated WhatsApp notifications and announcements will be paused until you link another device.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isDisconnecting && <FaSyncAlt size={11} className="animate-spin" />}
                <span>Yes, Disconnect</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WhatsAppSettings;
