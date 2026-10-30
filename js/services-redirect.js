// Preserve old service links, query parameters and anchors.
const destination = new URL('produtos.html', location.href);
destination.search = location.search;
destination.hash = location.hash || '#servicos';
location.replace(destination.href);
