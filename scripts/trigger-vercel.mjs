const hook = process.env.VERCEL_DEPLOY_HOOK;
if (!hook) {
  console.log('Atualização Vercel não configurada neste workflow.');
} else {
  const url = new URL(hook);
  if (
    url.origin !== 'https://api.vercel.com' ||
    !url.pathname.startsWith('/v1/integrations/deploy/') ||
    url.username ||
    url.password
  )
    throw Error('Deploy Hook Vercel inválido.');
  const response = await fetch(url, {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw Error(`Falha ao solicitar atualização Vercel: HTTP ${response.status}.`);
  console.log('Atualização do conteúdo solicitada à Vercel.');
}
