// Silences verbose debug logs in production builds while leaving dev experience intact.
// Any module that used console.debug will become a no-op in production.
// Can be extended later for selective channel filtering.

if (process.env.NODE_ENV === 'production') {
  try {
    // Preserve references if needed in future.
    // eslint-disable-next-line no-console
    console.debug = () => {}; // no-op
  } catch(_) {}
}
