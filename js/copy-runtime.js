/* Public copy only. Loaded after site-texts.js and before other site scripts. */
(() => {
  const entries=(window.ELETROTECH_TEXTS||[]).flatMap(doc=>doc.entries||[]);
  const pairs=new Map(entries.map(entry=>[entry.sourcePt+'\0'+entry.sourceEs,entry]));
  const byKey=new Map(entries.map(entry=>[entry.key,entry]));
  const format=(value,params={})=>String(value).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g,(match,key)=>Object.hasOwn(params,key)?String(params[key]):match);
  window.ELETROTECH_COPY={
    pair(pt,es=pt,lang=document.documentElement.lang==='es'?'es':'pt',params={}){
      return format(pairs.get(pt+'\0'+es)?.[lang]||(lang==='es'?es:pt),params);
    },
    entry:key=>byKey.get(key),
  };
})();
