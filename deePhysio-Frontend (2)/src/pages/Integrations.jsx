import React, { useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaArrowLeft, FaPlus, FaPlug, FaPowerOff, FaKey, FaEye, FaEyeSlash, FaCopy, FaCheck } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../config/api';

const Integrations = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const role = sessionStorage.getItem('deephysio_role');
  const isAdmin = role === 'admin' || role === 'superadmin';
  const [integrations, setIntegrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeConnectId, setActiveConnectId] = useState(null);
  const [connectValues, setConnectValues] = useState({});
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState(null);
  const [revealSecrets, setRevealSecrets] = useState({});
  const [copiedKey, setCopiedKey] = useState('');
  const [newIntegration, setNewIntegration] = useState({
    slug: '',
    displayName: '',
    category: '',
    description: '',
    authType: 'API_KEY'
  });

  const loadIntegrations = async () => {
    setIsLoading(true);
    try {
      const res = await fetchApi('/integrations');
      if (!res) return;
      const data = await res.json();
      if (!res.ok || !data?.success) {
        showToast(data?.message || 'Failed to load integrations.', 'error');
        return;
      }
      setIntegrations(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      showToast('Network error while loading integrations.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadIntegrations();
    else setIsLoading(false);
  }, [isAdmin]);

  const handleShowCredentials = async (integration) => {
    try {
      const res = await fetchApi(`/integrations/${integration.id}/credentials`);
      if (!res) return;
      const data = await res.json();
      if (data?.success) {
        setCredentialsModal({
          name: integration.displayName || integration.display_name,
          slug: integration.slug,
          credentials: data.data || {}
        });
      }
    } catch (err) {
      showToast('Failed to retrieve credentials', 'error');
    }
  };

  const handleCopy = (key, val) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    showToast(`Copied ${key} to clipboard!`);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const activeIntegration = useMemo(
    () => integrations.find((item) => Number(item.id) === Number(activeConnectId)) || null,
    [integrations, activeConnectId]
  );

  const callAction = async (url, body = {}) => {
    setIsActionLoading(true);
    try {
      const res = await fetchApi(url, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      if (!res) return false;
      const data = await res.json();
      if (!res.ok || !data?.success) {
        showToast(data?.message || 'Action failed.', 'error');
        return false;
      }
      if (Array.isArray(data.data)) setIntegrations(data.data);
      showToast(data?.message || 'Updated successfully.');
      return true;
    } catch (error) {
      showToast('Network error while updating integration.', 'error');
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  const submitNewIntegration = async () => {
    if (!newIntegration.slug || !newIntegration.displayName || !newIntegration.category) {
      showToast('Slug, name, and category are required.', 'error');
      return;
    }
    setIsActionLoading(true);
    try {
      const payload = {
        ...newIntegration,
        configSchema: { fields: [] }
      };
      const res = await fetchApi('/integrations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok || !data?.success) {
        showToast(data?.message || 'Failed to add integration.', 'error');
        return;
      }
      showToast('Integration added successfully.');
      setShowAddModal(false);
      setNewIntegration({ slug: '', displayName: '', category: '', description: '', authType: 'API_KEY' });
      await loadIntegrations();
    } catch (error) {
      showToast('Network error while adding integration.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!activeIntegration) return;
    const fields = Array.isArray(activeIntegration?.configSchema?.fields) ? activeIntegration.configSchema.fields : [];
    const credentials = {};
    const config = {};
    fields.forEach((field) => {
      const value = connectValues[field.key];
      if (field.secret) credentials[field.key] = value;
      else config[field.key] = value;
    });
    const ok = await callAction(`/integrations/${activeIntegration.id}/connect`, { credentials, config });
    if (ok) {
      setActiveConnectId(null);
      setConnectValues({});
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-3 px-3 sm:px-4 lg:px-6 py-4 animate-fade-in font-sans">
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate('/settings')}
              className="w-9 h-9 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-500 hover:text-clinicPrimary hover:border-clinicPrimary/30 hover:bg-clinicPrimary/5 transition-all outline-none shrink-0"
              title="Back to Settings"
            >
              <FaArrowLeft size={13} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FaPlug className="text-slate-400" size={12} />
                <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">Integration Management</h1>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                Manage modular integrations with connect, disconnect, enable, and disable actions.
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 bg-clinicPrimary text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-2 hover:bg-clinicPrimaryDark w-full sm:w-auto"
            >
              <FaPlus size={10} /> Add Integration
            </button>
          )}
        </div>
      </div>

      {!isAdmin ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-3 text-xs font-semibold">
          Only Admin can manage integrations.
        </div>
      ) : (
        <div className="space-y-2.5">
          {isLoading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-500">Loading integrations...</div>
          ) : integrations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-500">
              No integrations found. Click `Add Integration` to register one.
            </div>
          ) : integrations.map((integration) => {
            const clinic = integration.clinicIntegration || null;
            const connected = clinic?.connectionStatus === 'CONNECTED';
            const enabled = Boolean(clinic?.isEnabled);
            return (
              <div key={integration.id} className="p-3 sm:p-3.5 border border-slate-200 shadow-sm bg-white rounded-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm sm:text-[15px] font-bold text-slate-800">{integration.displayName || integration.display_name}</h3>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-100 text-slate-600">
                        {integration.category}
                      </span>
                      {connected ? (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-emerald-100 text-emerald-600 inline-flex items-center gap-1">
                          <FaCheckCircle size={9} /> Connected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-amber-100 text-amber-600 inline-flex items-center gap-1">
                          <FaExclamationCircle size={9} /> Disconnected
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${enabled ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                        {enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{integration.description || 'No description provided.'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Auth: {integration.authType || integration.auth_type}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap lg:justify-end">
                    {!connected ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveConnectId(integration.id);
                          setConnectValues({});
                        }}
                        className="px-3 py-1.5 bg-clinicPrimary text-white rounded-md text-[11px] font-bold"
                        disabled={isActionLoading}
                      >
                        Connect
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => callAction(`/integrations/${integration.id}/disconnect`)}
                        className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-md text-[11px] font-bold inline-flex items-center gap-1"
                        disabled={isActionLoading}
                      >
                        <FaPowerOff size={9} /> Disconnect
                      </button>
                    )}

                    {connected && (
                      <button
                        type="button"
                        onClick={() => handleShowCredentials(integration)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                      >
                        <FaKey size={10} className="text-clinicPrimary" /> Show Credentials
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => callAction(`/integrations/${integration.id}/${enabled ? 'disable' : 'enable'}`)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[11px] font-bold"
                      disabled={isActionLoading || !connected}
                    >
                      {enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🔑 Credentials Viewer Modal */}
      {credentialsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FaKey className="text-clinicPrimary" /> {credentialsModal.name} Credentials
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Live API keys & webhook secrets for this integration cluster.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCredentialsModal(null);
                  setRevealSecrets({});
                }}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {Object.keys(credentialsModal.credentials).length === 0 ? (
                <div className="p-4 rounded-xl bg-gray-50 text-center text-xs text-gray-400 font-bold">
                  No encrypted credentials stored for this node yet.
                </div>
              ) : (
                Object.entries(credentialsModal.credentials).map(([k, v]) => {
                  const isVisible = revealSecrets[k];
                  const displayVal = String(v || '');
                  return (
                    <div key={k} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-700 uppercase tracking-wider">{k}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setRevealSecrets(prev => ({ ...prev, [k]: !prev[k] }))}
                            className="text-gray-500 hover:text-clinicPrimary p-1"
                            title={isVisible ? 'Hide value' : 'Show value'}
                          >
                            {isVisible ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(k, displayVal)}
                            className="text-gray-500 hover:text-clinicPrimary p-1"
                            title="Copy to clipboard"
                          >
                            {copiedKey === k ? <FaCheck size={12} className="text-green-600" /> : <FaCopy size={12} />}
                          </button>
                        </div>
                      </div>
                      <p className="font-mono text-xs text-slate-900 break-all bg-white px-3 py-2 rounded-lg border border-gray-200">
                        {isVisible ? displayVal : '••••••••••••••••••••••••••••••••'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setCredentialsModal(null);
                  setRevealSecrets({});
                }}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {activeIntegration && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Connect {activeIntegration.displayName || activeIntegration.display_name}</h3>
                <p className="text-xs text-slate-500 mt-1">Fill required fields and save integration credentials.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveConnectId(null)}
                className="text-slate-500 text-xs font-bold"
              >
                Close
              </button>
            </div>
            <div className="space-y-2">
              {(Array.isArray(activeIntegration?.configSchema?.fields) ? activeIntegration.configSchema.fields : []).map((field) => (
                <div key={field.key}>
                  <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                    {field.label} {field.required ? '*' : ''}
                  </label>
                  <input
                    type={field.secret ? 'password' : 'text'}
                    value={connectValues[field.key] || ''}
                    onChange={(e) => setConnectValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder || ''}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveConnectId(null)}
                className="px-3 py-2 rounded-md border border-slate-200 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConnect}
                disabled={isActionLoading}
                className="px-3 py-2 rounded-md bg-clinicPrimary text-white text-xs font-bold"
              >
                {isActionLoading ? 'Saving...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl p-4 space-y-3">
            <h3 className="text-base font-black text-slate-900">Add Integration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newIntegration.slug}
                onChange={(e) => setNewIntegration((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="slug (e.g. stripe)"
                className="px-3 py-2 rounded-md border border-slate-200 text-sm"
              />
              <input
                type="text"
                value={newIntegration.displayName}
                onChange={(e) => setNewIntegration((prev) => ({ ...prev, displayName: e.target.value }))}
                placeholder="Display name"
                className="px-3 py-2 rounded-md border border-slate-200 text-sm"
              />
              <input
                type="text"
                value={newIntegration.category}
                onChange={(e) => setNewIntegration((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="Category"
                className="px-3 py-2 rounded-md border border-slate-200 text-sm"
              />
              <select
                value={newIntegration.authType}
                onChange={(e) => setNewIntegration((prev) => ({ ...prev, authType: e.target.value }))}
                className="px-3 py-2 rounded-md border border-slate-200 text-sm"
              >
                <option value="API_KEY">API Key</option>
                <option value="TOKEN">Token</option>
                <option value="OAUTH2">OAuth2</option>
                <option value="WEBHOOK">Webhook</option>
                <option value="NONE">None</option>
              </select>
              <textarea
                value={newIntegration.description}
                onChange={(e) => setNewIntegration((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
                className="sm:col-span-2 px-3 py-2 rounded-md border border-slate-200 text-sm min-h-[80px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-2 rounded-md border border-slate-200 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitNewIntegration}
                disabled={isActionLoading}
                className="px-3 py-2 rounded-md bg-clinicPrimary text-white text-xs font-bold"
              >
                {isActionLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
