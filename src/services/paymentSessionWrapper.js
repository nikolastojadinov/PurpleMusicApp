/**
 * Lightweight wrapper za proveru da li (heuristički) postoji potencijalno
 * nedovršena / pending Pi payment sesija. NE poziva nijednu Pi Payment metodu
 * (nema createPayment / cancel / confirm / request). Samo čitanje dostupnih
 * tragova i logovanje u konzolu.
 *
 * Ograničenja / Napomene:
 * - Pi SDK (window.Pi) ne dokumentuje javno stabilan API za dohvat "pending" plaćanja.
 * - Ova funkcija koristi best‑effort heuristiku (localStorage + eventualna
 *   introspekcija svojstava ako postoje) bez ikakvih network ili SDK mutacija.
 * - Može se proširiti kasnije ako uvedemo eksplicitno čuvanje meta podataka
 *   (npr. kada krene createPayment, u drugom delu koda: localStorage.setItem('pm_pending_payment', JSON.stringify(...))).
 *
 * Povratna vrednost:
 * {
 *   hasPending: boolean,
 *   meta: {
 *     stored?: object | null, // sadržaj eventualnog našeg key‑a
 *     hints?: string[],       // tekstualni tragovi
 *   }
 * }
 */
export function checkPendingPaymentSession({ log = true } = {}) {
  const meta = { stored: null, hints: [] };
  let hasPending = false;

  try {
    // 1) Naš potencijalni ključ (još ga ne postavljamo nigde ovde).
    const raw = typeof window !== 'undefined' ? window.localStorage?.getItem('pm_pending_payment') : null;
    if (raw) {
      try {
        meta.stored = JSON.parse(raw);
        hasPending = true;
        meta.hints.push('localStorage:pm_pending_payment');
      } catch (_) {
        meta.hints.push('localStorage:pm_pending_payment_corrupt');
      }
    }

    // 2) Heuristika za mogući trag koji bi neko drugi kod mogao da postavi.
    //    (Ne oslanjamo se, samo beležimo ako postoji.)
    const alt = typeof window !== 'undefined' ? window.localStorage?.getItem('pi_pending_payment') : null;
    if (!hasPending && alt) {
      hasPending = true;
      meta.hints.push('localStorage:pi_pending_payment');
    }

    // 3) Pasivno čitanje eventualnih svojstava iz SDK-a (bez pozivanja metoda).
    const sdk = typeof window !== 'undefined' ? window.Pi : null;
    if (sdk) {
      // Potpuno pasivno čitanje – nijedna funkcija se ne poziva.
      // Ako SDK u budućnosti izloži nešto poput Pi.paymentInProgress (primer), obradimo ga.
      const possibleFlags = [
        sdk.paymentInProgress,
        sdk?.Payment?.activePayment, // čisto čitanje dubinskog svojstva ako postoji
      ];
      if (!hasPending && possibleFlags.some(v => !!v)) {
        hasPending = true;
        meta.hints.push('sdk:flag_detected');
      }
    }
  } catch (e) {
    meta.hints.push('error:' + (e?.message || 'unknown'));
  }

  if (log && process.env.NODE_ENV === 'development') {
    // Log format neutralan i jasan da se ništa ne izvršava.
    if (hasPending) {
      console.log('[checkPendingPaymentSession] Detektovan mogući pending Pi payment (bez API poziva):', meta);
    } else {
      console.log('[checkPendingPaymentSession] Nema indikacije pending Pi payment sesije.');
    }
  }

  return { hasPending, meta };
}

// Kratki alias ako nekome više odgovara semantički naziv.
export const logPendingPaymentSession = () => checkPendingPaymentSession({ log: true });

// Napomena: OVAJ modul namerno NE eksportuje nikakve funkcije koje bi inicirale
// plaćanje ili menjale stanje; isključivo inspekcija.
