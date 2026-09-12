'use client';

import { useEffect, useState } from 'react';

// Форма ответа /api/clinic/check-existing не типизирована на бэкенде —
// произвольный набор полей из документа Clinic.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClaimCandidate = Record<string, any>;

/**
 * Ищет уже импортированные (pre_imported) клиники, подходящие под введённые
 * name/phone/city, чтобы пользователь мог claim-нуть существующий профиль
 * вместо создания дубликата. Плюс авто-подгрузка конкретного кандидата,
 * если в URL передан ?claim=<slug> (переход по ссылке "это моя клиника").
 */
export function useClinicClaimSearch(
  // formData — общий Record<string, any> всей формы (см. useAutosaveDraft),
  // здесь читаются только name/phone/city.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: Record<string, any>,
  claimSlug: string | null
) {
  const [claimCandidates, setClaimCandidates] = useState<ClaimCandidate[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);

  // Авто-подгрузка конкретной клиники по claimSlug из URL.
  useEffect(() => {
    if (claimSlug && claimCandidates.length === 0) {
      const fetchClaimed = async () => {
        try {
          const res = await fetch(`/api/clinic/check-existing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: claimSlug, city: formData.city }),
          });
          const data = await res.json();
          const target = data.candidates?.find((c: ClaimCandidate) => c.slug === claimSlug);
          if (target) {
            setClaimCandidates(data.candidates);
            setSelectedClaimId(target._id);
          }
        } catch (err) {
          console.error('Failed to pre-load claimed clinic', err);
        }
      };
      fetchClaimed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimSlug]);

  const checkExistingClinics = async () => {
    if (!formData.name || !formData.city) return;
    setIsCheckingExisting(true);
    try {
      const res = await fetch('/api/clinic/check-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          city: formData.city,
        }),
      });
      const data = await res.json();
      setClaimCandidates(data.candidates || []);
    } catch (error) {
      console.error('Error checking existing clinics:', error);
    } finally {
      setIsCheckingExisting(false);
    }
  };

  return {
    claimCandidates,
    selectedClaimId,
    setSelectedClaimId,
    isCheckingExisting,
    checkExistingClinics,
  };
}
