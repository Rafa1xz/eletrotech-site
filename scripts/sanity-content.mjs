// Maps the published Content Lake documents to the existing static catalog.
export const productQuery = `*[_type == "product"] | order(order asc, _id asc) {
  id, "slug": slug.current, active, order, featured, name, nameEs, category,
  brand, model, sku, description, descriptionEs, details, detailsEs, src, alt,
  illustration, gallery, "imageUrl": image.asset->url,
  "galleryUrls": galleryImages[].asset->url,
  price, salePrice, stock, lowStock, variations,
  specifications[]{label, value, labelEs, valueEs}, seoTitle, seoDescription
}`;

export function validateConfig(projectId, dataset) {
  if (!/^[a-z0-9-]+$/.test(projectId) || !/^[a-z0-9][a-z0-9_-]*$/.test(dataset)) {
    throw Error('Project ID ou dataset do Sanity inválido.');
  }
}

export function assetFile(url, projectId, dataset) {
  const parsed = new URL(url);
  const prefix = `/images/${projectId}/${dataset}/`;
  const file = parsed.pathname.slice(prefix.length);
  if (parsed.origin !== 'https://cdn.sanity.io' || !parsed.pathname.startsWith(prefix) ||
      !/^[a-zA-Z0-9-]+\.(png|jpe?g|webp|svg)$/.test(file) || parsed.search || parsed.hash) {
    throw Error('Imagem fora do armazenamento Sanity configurado: ' + url);
  }
  return `images/sanity-${file}`;
}

export async function mapProduct(document, download) {
  if (!document.id || !document.slug || typeof document.active !== 'boolean') throw Error('Produto incompleto no Sanity: ' + document.name);
  const {imageUrl, galleryUrls, ...product} = document;
  product.src = imageUrl ? await download(imageUrl) : product.src;
  product.gallery = [...(product.gallery || []), ...await Promise.all((galleryUrls || []).filter(Boolean).map(download))];
  product.specifications ||= [];
  product.variations ||= [];
  product.order ??= 0;
  for (const key of ['price', 'salePrice', 'stock', 'lowStock']) product[key] ??= null;
  return product;
}
