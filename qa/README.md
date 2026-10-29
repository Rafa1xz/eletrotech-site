# Qualidade e testes

Regressões de navegação, alinhamento do cabeçalho e WhatsApp flutuante (Windows com Node.js 24 e Edge): `node qa/scripts/review-navigation.mjs`. O teste usa cliques reais e cobre também movimento reduzido; não envia mensagens externas.

- `scripts/`: verificações e utilitários ativos.
- `scripts/archive/`: scripts históricos de construção; não devem ser executados sobre o site atual.
- `screenshots/`: capturas de desktop e celular.
- `results/`: relatórios JSON.
- `temp/`: perfil temporário criado pelos testes de navegador.

Execute os scripts a partir da raiz do projeto. Exemplo:

```powershell
powershell -ExecutionPolicy Bypass -File .\qa\scripts\static-review.ps1
```
