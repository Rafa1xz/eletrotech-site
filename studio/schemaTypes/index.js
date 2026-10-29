import {defineField, defineType} from 'sanity';

const text = (name, title, required = false, type = 'string') => defineField({
  name, title, type, ...(required ? {validation: rule => rule.required()} : {}),
});
const number = (name, title, integer = false) => defineField({
  name, title, type: 'number', validation: rule => integer ? rule.min(0).integer() : rule.min(0),
});
const pathValidation = rule => rule.regex(/^images\/[a-zA-Z0-9_.-]+\.(png|jpe?g|webp|svg)$/).error('Use um arquivo existente em images/.');

const product = defineType({
  name: 'product', title: 'Produto', type: 'document',
  validation: rule => rule.custom(document => document?.src || document?.image?.asset ? true : 'Informe uma imagem existente ou envie a imagem principal.'),
  initialValue: {active: true, featured: false, illustration: false, order: 0, gallery: [], specifications: [], variations: []},
  fields: [
    defineField({name: 'id', title: 'Identificador estável', type: 'string', description: 'Único. Depois de publicado, não alterar.', validation: rule => rule.required().regex(/^[a-z0-9-]+$/)}),
    defineField({name: 'slug', title: 'Endereço do produto', type: 'slug', options: {source: 'name'}, description: 'Depois de publicado, não alterar. O gerador bloqueia mudanças nas URLs registradas.', validation: rule => rule.required()}),
    text('name', 'Nome em português', true), text('nameEs', 'Nome em espanhol'),
    defineField({name: 'category', title: 'Categoria', type: 'string', options: {list: [
      {title: 'Motores', value: 'motores'}, {title: 'Materiais elétricos', value: 'materiais'},
      {title: 'Zagonel', value: 'zagonel'}, {title: 'OxiLife Fish', value: 'oxilife'},
    ]}, validation: rule => rule.required()}),
    defineField({name: 'active', title: 'Disponível no catálogo', type: 'boolean', validation: rule => rule.required()}),
    defineField({name: 'featured', title: 'Destaque', type: 'boolean'}), number('order', 'Ordem', true),
    text('brand', 'Marca'), text('model', 'Modelo'), text('sku', 'SKU'),
    text('description', 'Descrição em português', true, 'text'), text('descriptionEs', 'Descrição em espanhol', false, 'text'),
    text('details', 'Detalhes em português', false, 'text'), text('detailsEs', 'Detalhes em espanhol', false, 'text'),
    defineField({name: 'src', title: 'Imagem principal existente', type: 'string', description: 'Caminho local. Um upload abaixo substitui este caminho.', validation: pathValidation}),
    defineField({name: 'image', title: 'Enviar imagem principal', type: 'image'}), text('alt', 'Descrição da imagem'),
    defineField({name: 'illustration', title: 'Imagem ilustrativa', type: 'boolean'}),
    defineField({name: 'gallery', title: 'Galeria existente', type: 'array', of: [{type: 'string', validation: pathValidation}]}),
    defineField({name: 'galleryImages', title: 'Enviar imagens da galeria', type: 'array', of: [{type: 'image'}]}),
    number('price', 'Preço (R$)'),
    defineField({name: 'salePrice', title: 'Preço promocional (R$)', type: 'number', validation: rule => rule.min(0).custom((value, context) => value == null || (context.document?.price != null && value <= context.document.price) || 'Informe um preço promocional menor ou igual ao preço normal.')}),
    number('stock', 'Estoque', true), number('lowStock', 'Alerta de estoque', true),
    defineField({name: 'variations', title: 'Variações', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'specifications', title: 'Especificações', type: 'array', of: [{type: 'object', name: 'specification', fields: [text('label', 'Nome', true), text('value', 'Valor', true), text('labelEs', 'Nome em espanhol'), text('valueEs', 'Valor em espanhol')]}]}),
    text('seoTitle', 'Título para buscadores'), text('seoDescription', 'Descrição para buscadores', false, 'text'),
  ],
  preview: {select: {title: 'name', subtitle: 'category', media: 'image'}},
});

const siteSettings = defineType({
  name: 'siteSettings', title: 'Configurações do site', type: 'document',
  fields: [text('name', 'Nome da empresa', true),
    defineField({name: 'url', title: 'URL pública com barra final', type: 'url', validation: rule => rule.required().uri({scheme: ['https']})}),
    defineField({name: 'whatsapp', title: 'WhatsApp com DDI e DDD', type: 'string', validation: rule => rule.required().regex(/^\d{10,15}$/)}),
    defineField({name: 'email', title: 'E-mail', type: 'string', validation: rule => rule.required().email()}),
  ],
});

export const schemaTypes = [product, siteSettings];
