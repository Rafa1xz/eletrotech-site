import { mergeRoutes } from './publication-state.mjs';

export function deploymentUrl(current, env = process.env) {
  const host = env.VERCEL === '1' ? env.VERCEL_PROJECT_PRODUCTION_URL : undefined;
  if (env.VERCEL === '1' && !env.SITE_URL && !host)
    throw Error('Configure SITE_URL ou habilite as variáveis de sistema da Vercel.');
  const url = new URL(env.SITE_URL || (host ? `https://${host}` : current));
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
    throw Error('O endereço público do site deve usar HTTPS, sem credenciais, query ou fragmento.');
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
}

export async function preservePublishedRoutes(routes, bases, { fetchImpl = fetch } = {}) {
  let result = { ...routes };
  for (const base of new Set(bases)) {
    const url = new URL('data/product-routes.json', base);
    url.searchParams.set('publication_check', Date.now().toString());
    const response = await fetchImpl(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    });
    if (response.status === 404) continue; // First deployment on a new domain.
    if (!response.ok)
      throw Error(`Não foi possível preservar as URLs publicadas: HTTP ${response.status}.`);
    result = mergeRoutes(result, await response.json());
  }
  return result;
}
