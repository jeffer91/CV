(() => {
  const clone = x => JSON.parse(JSON.stringify(x));
  const parse = raw => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };

  function getConfig(){
    const local = parse(localStorage.getItem("cv_supabase_config")) || {};
    const shared = window.CV_SUPABASE_CONFIG || {};
    return (shared.url && shared.anon) ? shared : local;
  }

  function getClient(){
    const cfg = getConfig();
    if(!cfg.url || !cfg.anon || !window.supabase?.createClient) return null;
    return window.supabase.createClient(cfg.url, cfg.anon);
  }

  async function loadMaster(fallback){
    const base = clone(fallback || window.CV_DATA || {});
    const client = getClient();
    if(!client) return { data: base, client: null, source: "fallback" };
    try {
      const { data, error } = await client.from("cv_master").select("data").eq("id", 1).maybeSingle();
      if(error || !data?.data) return { data: base, client, source: "fallback" };
      return { data: data.data, client, source: "supabase" };
    } catch {
      return { data: base, client, source: "fallback" };
    }
  }

  async function saveMaster(client, data){
    if(!client) throw new Error("Supabase no está conectado.");
    const payload = { id:1, data, published:true, updated_at:new Date().toISOString() };
    const { error } = await client.from("cv_master").upsert(payload, { onConflict:"id" });
    if(error) throw error;
    return true;
  }

  function persistConfig(url, anon){
    if(!url || !anon) throw new Error("Completa URL y anon key.");
    localStorage.setItem("cv_supabase_config", JSON.stringify({url, anon}));
  }

  function matchTags(item, profile){
    const a = item?.tags || [];
    const b = profile?.tags || [];
    return a.filter(t => b.includes(t)).length;
  }

  function relevant(items, profile, limit=99){
    return [...(items || [])]
      .map(item => ({...item, _score: matchTags(item, profile)}))
      .filter(item => item._score > 0)
      .sort((a,b) => b._score - a._score)
      .slice(0, limit);
  }

  window.CVStore = { clone, getConfig, getClient, loadMaster, saveMaster, persistConfig, matchTags, relevant };
})();