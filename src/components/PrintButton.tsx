'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-center gap-2 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition shadow-sm"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Сохранить как PDF
    </button>
  );
}
