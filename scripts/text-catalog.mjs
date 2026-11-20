export const placeholders=value=>[...String(value).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(m=>m[1]).sort();
export function formatText(value,params={}) {
  return String(value).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g,(_,key)=>{
    if(!Object.hasOwn(params,key))throw Error(`Parâmetro de texto ausente: ${key}`);
    return String(params[key]);
  });
}
export function mergeTextDocuments(defaults,remote=[]) {
  return defaults.map(base=>{
    const doc=remote.find(item=>item._id===base._id);
    const entries=base.entries.map(entry=>{
      const change=doc?.entries?.find(item=>item.key===entry.key);
      const merged={...entry};
      for(const lang of ['pt','es']){
        const value=typeof change?.[lang]==='string'&&change[lang].trim()?change[lang]:entry[lang];
        const source=lang==='pt'?entry.sourcePt:entry.sourceEs;
        if(JSON.stringify(placeholders(value))!==JSON.stringify(placeholders(source)))throw Error(`Placeholders inválidos: ${base.title||base._id} / ${entry.key} / ${lang}`);
        merged[lang]=value;
      }
      return merged;
    });
    return {...base,entries};
  });
}
export function createTextCatalog(documents=[]) {
  const entries=documents.flatMap(doc=>doc.entries||[]);
  const byPair=new Map(entries.map(entry=>[entry.sourcePt+'\0'+entry.sourceEs,entry]));
  const byKey=new Map(entries.map(entry=>[entry.key,entry]));
  return {
    pair(pt,es=pt,lang='pt',params={}){
      const entry=byPair.get(pt+'\0'+es);
      const value=entry?.[lang]||(lang==='es'?es:pt);
      return Object.keys(params).length?formatText(value,params):value;
    },
    entry:key=>byKey.get(key),
  };
}
