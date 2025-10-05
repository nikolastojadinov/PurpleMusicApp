// Central helper to open the global Premium modal uniformly.
// Pass an optional source string for light analytics / debugging.
export function openPremiumModal(source = 'unknown') {
  try {
    window.dispatchEvent(new CustomEvent('pm:openPremiumModal', { detail: { source } }));
  } catch (e) {
    // In non-browser environments (SSR/tests) just noop.
  }
}
