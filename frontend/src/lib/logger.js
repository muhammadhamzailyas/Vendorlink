/**
 * Utility to suppress console logs in production environment.
 */
const setupLogger = () => {
  if (import.meta.env.PROD) {
    const noop = () => {};
    console.log = noop;
    console.debug = noop;
    console.info = noop;
    
    // We keep warn and error for critical issues, but they could also be throttled/sent to a service
    // console.warn = noop;
    // console.error = noop;
  }
};

export default setupLogger;
