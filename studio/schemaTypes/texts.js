import { defineField, defineType } from 'sanity';
const tokens = (value) =>
  [...String(value || '').matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(',');
const translation = (name, title, source) =>
  defineField({
    name,
    title,
    type: 'text',
    rows: 3,
    description:
      'Texto simples. Se houver marcadores entre chaves, mantenha-os para inserir os dados automaticamente. Vazio usa o texto padrão.',
    validation: (rule) =>
      rule.custom(
        (value, context) =>
          !value?.trim() ||
          tokens(value) === tokens(context.parent?.[source]) ||
          'Mantenha todos os marcadores do texto padrão, por exemplo {name} ou {count}.',
      ),
  });
export const siteTextEntry = defineType({
  name: 'siteTextEntry',
  title: 'Texto do site',
  type: 'object',
  fields: [
    defineField({
      name: 'key',
      title: 'Identificador',
      type: 'string',
      hidden: true,
      readOnly: true,
    }),
    defineField({ name: 'label', title: 'Texto / identificação', type: 'string', readOnly: true }),
    defineField({ name: 'context', title: 'Onde aparece', type: 'string', readOnly: true }),
    translation('pt', 'Português', 'sourcePt'),
    translation('es', 'Espanhol', 'sourceEs'),
    defineField({
      name: 'sourcePt',
      title: 'Texto padrão em português',
      type: 'text',
      readOnly: true,
      rows: 2,
    }),
    defineField({
      name: 'sourceEs',
      title: 'Texto padrão em espanhol',
      type: 'text',
      readOnly: true,
      rows: 2,
    }),
  ],
  preview: { select: { title: 'label', subtitle: 'pt' } },
});
export const siteTexts = defineType({
  name: 'siteTexts',
  title: 'Textos do site',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Grupo de textos', type: 'string', readOnly: true }),
    defineField({ name: 'group', title: 'Grupo', type: 'string', hidden: true, readOnly: true }),
    defineField({
      name: 'entries',
      title: 'Textos — abra um item para editar',
      type: 'array',
      of: [{ type: 'siteTextEntry' }],
      options: { disableActions: ['add', 'remove', 'duplicate'] },
      description:
        'Publique para atualizar todas as páginas que usam este texto. Rascunhos não aparecem no site.',
    }),
  ],
  preview: { select: { title: 'title' } },
});
