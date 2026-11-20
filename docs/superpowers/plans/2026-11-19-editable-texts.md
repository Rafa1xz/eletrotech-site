# Editable site texts implementation plan

**Goal:** Manage all visitor-facing textual content through Sanity in Portuguese and Spanish.

**Architecture:** Existing page/product/service documents retain their content. Grouped singleton text documents supply shared labels and runtime messages. Stable keys and immutable fallback strings connect templates and scripts to the catalog. No CMS-authored HTML or JavaScript executes in the browser.

**Scope approved by user:** Pages, products, services, navigation, footer, buttons, search, forms, gallery, WhatsApp messages and PT/ES translations; organized Studio navigation. Preserve current content and existing remote edits during migration.

**Tech stack:** Static HTML/CSS/JS, Node 24, Cheerio, Sanity Studio.

- [ ] Inventory existing page bindings; add missing visible text/attribute bindings without changing existing keys.
- [ ] Add grouped text schema, fallback catalog, safe translation/formatting helpers, and tests covering published overrides and placeholders.
- [ ] Connect page rendering, product generation, dynamic messages, sync and publication change detection.
- [ ] Organize Studio into pages, catalog, shared texts and settings; filter out obsolete removed page fields.
- [ ] Seed only missing remote fields, deploy Studio, build/test, validate PT/ES in browser and publish site.

Validation: escaping and placeholder safety, fallback behavior, published edits across pages, dynamic error/results/WhatsApp messages, migration idempotence, Studio build, existing URL and publication tests, browser checks on desktop/mobile.
