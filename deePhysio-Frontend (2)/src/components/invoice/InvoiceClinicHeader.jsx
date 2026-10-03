import React from 'react';

/**
 * Left column of invoice/receipt: logo or DP mark, clinic name, address + phone from settings.
 */
export default function InvoiceClinicHeader({ profile }) {
  const p = profile || {};
  const clinicName = (p.clinicName || 'DeePhysio').trim();
  const address = (p.address || '').trim();
  const cityLine = [p.city, p.postCode].map((s) => (s || '').trim()).filter(Boolean).join(', ');
  const phone = (p.phone || '').trim();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        {p.logoDataUrl ? (
          <img
            src={p.logoDataUrl}
            alt=""
            className="w-14 h-14 rounded-2xl object-contain border border-slate-100 bg-white shadow-xl shadow-clinicPrimary/10"
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-clinicPrimary text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-clinicPrimary/20">
            DP
          </div>
        )}
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{clinicName}</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 opacity-60">Clinical Protocol 9482</p>
        </div>
      </div>
      {(address || cityLine || phone) && (
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-[280px]">
          {address && (
            <>
              {address}
              <br />
            </>
          )}
          {cityLine && (
            <>
              {cityLine}
              <br />
            </>
          )}
          {phone && <>TEL: {phone}</>}
        </div>
      )}
    </div>
  );
}
