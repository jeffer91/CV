(() => {
  const clone=x=>JSON.parse(JSON.stringify(x));
  const parse=raw=>{try{return raw?JSON.parse(raw):null}catch{return null}};

  function getConfig(){
    const local=parse(localStorage.getItem("cv_supabase_config"))||{};
    const shared=window.CV_SUPABASE_CONFIG||{};
    return shared.url&&shared.anon?shared:local;
  }
  function getClient(){
    const cfg=getConfig();
    if(!cfg.url||!cfg.anon||!window.supabase?.createClient)return null;
    return window.supabase.createClient(cfg.url,cfg.anon);
  }
  async function loadMaster(fallback){
    const base=clone(fallback||window.CV_DATA||{});
    const client=getClient();
    if(!client)return{data:base,client:null,source:"fallback"};
    try{
      const {data,error}=await client.from("cv_master").select("data").eq("id",1).maybeSingle();
      if(error||!data?.data)return{data:base,client,source:"fallback"};
      return{data:data.data,client,source:"supabase"};
    }catch{return{data:base,client,source:"fallback"}}
  }
  async function saveMaster(client,data){
    if(!client)throw new Error("Supabase no está conectado.");
    const payload={id:1,data,published:true,updated_at:new Date().toISOString()};
    const {error}=await client.from("cv_master").upsert(payload,{onConflict:"id"});
    if(error)throw error;
    return true;
  }
  function persistConfig(url,anon){
    if(!url||!anon)throw new Error("Completa URL y anon key.");
    localStorage.setItem("cv_supabase_config",JSON.stringify({url,anon}));
  }
  function getDraft(){return parse(localStorage.getItem("cv_master_draft"))}
  function saveDraft(data){localStorage.setItem("cv_master_draft",JSON.stringify(data));localStorage.setItem("cv_master_draft_at",new Date().toISOString())}
  function clearDraft(){localStorage.removeItem("cv_master_draft");localStorage.removeItem("cv_master_draft_at")}
  function draftAt(){return localStorage.getItem("cv_master_draft_at")||""}

  function matchTags(item,profile){
    const a=item?.tags||[],b=profile?.tags||[];
    return a.filter(t=>b.includes(t)).length;
  }
  function priorityWeight(v){return v==="high"?300:v==="low"?100:200}
  function placement(item,profile){return item?.placements?.[profile?.id]||null}
  function isVisible(item,profile){
    if(item?.visible===false)return false;
    if(item?.assignmentMode==="manual")return placement(item,profile)?.enabled===true;
    const p=placement(item,profile);
    if(p)return p.enabled!==false;
    return matchTags(item,profile)>0;
  }
  function score(item,profile){
    const p=placement(item,profile);
    if(p?.enabled)return 1000+priorityWeight(p.priority)+(100-Math.min(Number(p.order)||99,99));
    return matchTags(item,profile)*100;
  }
  function decorate(item,profile){
    const p=placement(item,profile);
    return {...item,_score:score(item,profile),_order:Number(p?.order)||99,_priority:p?.priority||"medium",_customText:p?.text||""};
  }
  function relevant(items,profile,limit=99){
    return [...(items||[])]
      .filter(item=>isVisible(item,profile))
      .map(item=>decorate(item,profile))
      .sort((a,b)=>b._score-a._score||a._order-b._order)
      .slice(0,limit);
  }
  function rankAll(items,profile,limit=99){
    return [...(items||[])]
      .filter(item=>item?.visible!==false&&!(item?.assignmentMode==="manual"&&!placement(item,profile)?.enabled))
      .map(item=>decorate(item,profile))
      .sort((a,b)=>b._score-a._score||a._order-b._order)
      .slice(0,limit);
  }

  window.CVStore={clone,parse,getConfig,getClient,loadMaster,saveMaster,persistConfig,getDraft,saveDraft,clearDraft,draftAt,matchTags,placement,isVisible,relevant,rankAll};
})();