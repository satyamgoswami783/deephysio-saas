import { useState, useEffect } from 'react';
import { fetchApi } from '../config/api';

const DEFAULT_PROFILE = {
  clinicName: 'Healthcare Clinic',
  phone: '',
  email: '',
  address: '',
  city: '',
  postCode: '',
  logoDataUrl: '',
  taxRate: 20
};

/**
 * Clinic branding + contact from Settings → Clinic (API key clinicProfile).
 * Used by invoice/receipt previews so PDFs match saved clinic details.
 */
export function useClinicProfile() {
  const [clinicProfile, setClinicProfile] = useState(DEFAULT_PROFILE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchApi('/settings?keys=clinicProfile');
        if (!res?.ok || cancelled) return;
        const json = await res.json();
        if (!json?.success || cancelled) return;
        const profile = json?.data?.clinicProfile;
        if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
          setClinicProfile({
            clinicName: profile.clinicName || DEFAULT_PROFILE.clinicName,
            phone: profile.phone ?? '',
            email: profile.email ?? '',
            address: profile.address ?? '',
            city: profile.city ?? '',
            postCode: profile.postCode ?? '',
            logoDataUrl: profile.logoDataUrl || '',
            taxRate: profile.taxRate !== undefined ? profile.taxRate : DEFAULT_PROFILE.taxRate
          });
        }
      } catch {
        // keep defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return clinicProfile;
}
