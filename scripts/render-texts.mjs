// Applies copy through text/attribute APIs only; CMS values never become HTML.
export function applyTextCatalog($,catalog){
  $('[data-pt]').each((_,el)=>{
    const node=$(el);if(node.attr('data-cms-text')||node.closest('.product-grid').length)return;
    const pt=node.attr('data-pt')||'',es=node.attr('data-es')||pt;
    const entry=catalog.entry(node.attr('data-copy-key'));
    const pair=entry?{pt:entry.pt,es:entry.es}:{pt:catalog.pair(pt,es),es:catalog.pair(pt,es,'es')};
    node.attr('data-pt',pair.pt).attr('data-es',pair.es);
    const attr=node.attr('data-translate-attr');
    if(attr)node.attr(attr,pair.pt);else node.text(pair.pt);
  });
  $('*').each((_,el)=>{
    const node=$(el);
    for(const attr of ['aria-label','title','placeholder']){
      const key=node.attr('data-copy-'+attr),entry=key&&catalog.entry(key);
      if(entry)node.attr(attr,entry.pt);
    }
  });
}
