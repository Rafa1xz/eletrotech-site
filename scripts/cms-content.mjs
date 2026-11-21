export const contentQuery = `
  "pages": *[_type == "sitePage"]{..., images[]{...,"uploadedUrl":image.asset->url}, videos[]{...,"uploadedUrl":file.asset->url,"posterUrl":posterImage.asset->url}},
  "services": *[_type == "service"]{...,"uploadedUrl":image.asset->url},
  "texts": *[_type == "siteTexts"]`;
export function cmsMediaFile(url, project, dataset, kind = 'image') {
  const u = new URL(url),
    folder = kind === 'video' ? 'files' : 'images',
    prefix = `/${folder}/${project}/${dataset}/`;
  const file = u.pathname.slice(prefix.length),
    allowed =
      kind === 'video' ? /^[a-zA-Z0-9-]+\.(mp4|webm)$/ : /^[a-zA-Z0-9-]+\.(png|jpe?g|webp|svg)$/;
  if (
    u.origin !== 'https://cdn.sanity.io' ||
    !u.pathname.startsWith(prefix) ||
    !allowed.test(file) ||
    u.search ||
    u.hash
  )
    throw Error('Mídia fora do armazenamento Sanity autorizado.');
  return `${kind === 'video' ? 'videos' : 'images'}/sanity-${file}`;
}
// Fixed template fields gain defaults without discarding merchant edits or uploads.
export function mergePage(base, remote = {}) {
  const page = { ...base, ...remote, pageId: base.pageId, file: base.file };
  for (const field of ['texts', 'images', 'videos', 'links', 'sections']) {
    const changes = remote[field] || [];
    page[field] = changes.map((item) => {
      const merged = { ...item };
      for (const [key, value] of Object.entries(
        base[field]?.find((entry) => entry.key === item.key) || {},
      ))
        if (!(key in merged)) merged[key] = value;
      return merged;
    });
    for (const item of base[field] || [])
      if (!changes.some((entry) => entry.key === item.key)) page[field].push({ ...item });
  }
  return page;
}
export async function mapPage(document, download) {
  const page = structuredClone(document);
  for (const key of ['_rev', '_createdAt', '_updatedAt', '_system']) delete page[key];
  for (const image of page.images || []) {
    if (image.uploadedUrl) image.src = await download(image.uploadedUrl, 'image');
    delete image.image;
    delete image.uploadedUrl;
  }
  for (const video of page.videos || []) {
    if (video.uploadedUrl) video.src = await download(video.uploadedUrl, 'video');
    if (video.posterUrl) video.poster = await download(video.posterUrl, 'image');
    delete video.file;
    delete video.posterImage;
    delete video.uploadedUrl;
    delete video.posterUrl;
  }
  return page;
}
export async function mapService(document, download) {
  const service = { ...document };
  for (const key of ['_rev', '_createdAt', '_updatedAt', '_system']) delete service[key];
  if (service.uploadedUrl) service.src = await download(service.uploadedUrl, 'image');
  delete service.image;
  delete service.uploadedUrl;
  return service;
}
