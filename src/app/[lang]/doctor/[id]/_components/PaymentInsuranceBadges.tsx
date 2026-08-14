import { Banknote, CreditCard, ShieldCheck, CalendarClock, Wallet, type LucideIcon } from 'lucide-react';

interface Props {
  paymentMethods: string[];
  insuranceProviders: string[];
  labels: {
    paymentTitle: string;
    insuranceTitle: string;
    cash: string;
    card: string;
    insurance: string;
    installment: string;
  };
}

const ICONS: Record<string, LucideIcon> = {
  cash: Banknote,
  card: CreditCard,
  insurance: ShieldCheck,
  installment: CalendarClock,
};

export default function PaymentInsuranceBadges({ paymentMethods, insuranceProviders, labels }: Props) {
  const methods = paymentMethods && paymentMethods.length > 0 ? paymentMethods : ['cash'];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] mb-3">{labels.paymentTitle}</p>
        <div className="flex flex-wrap gap-2">
          {methods.map((m) => {
            const Icon = ICONS[m] || Wallet;
            return (
              <span
                key={m}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600"
              >
                <Icon className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.25} />
                {(labels as any)[m] || m}
              </span>
            );
          })}
        </div>
      </div>
      {insuranceProviders && insuranceProviders.length > 0 && (
        <div className="pt-3 border-t border-slate-50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] mb-3">{labels.insuranceTitle}</p>
          <div className="flex flex-wrap gap-2">
            {insuranceProviders.map((p, i) => (
              <span key={i} className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-700">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
