(function initSupabaseRuntimeClient() {
  let clientPromise = null;
  window.__supabaseInitError = '';

  function getRuntimeConfig() {
    const supabaseUrl = window.__SUPABASE_URL__ || '';
    const supabaseAnonKey = window.__SUPABASE_ANON_KEY__ || '';
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Brak window.__SUPABASE_URL__ lub window.__SUPABASE_ANON_KEY__');
    }
    return { supabaseUrl, supabaseAnonKey };
  }

  async function createRuntimeClient() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Biblioteka @supabase/supabase-js nie została załadowana');
    }
    const cfg = getRuntimeConfig();
    return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  }

  window.getSupabaseClient = async function getSupabaseClient() {
    if (!clientPromise) {
      clientPromise = createRuntimeClient().catch((err) => {
        window.__supabaseInitError = err && err.message ? String(err.message) : 'unknown';
        clientPromise = null;
        throw err;
      });
    }
    return clientPromise;
  };
})();
