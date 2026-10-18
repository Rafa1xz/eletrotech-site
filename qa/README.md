# Qualidade e testes

- `scripts/`: verificações e utilitários ativos.
- `scripts/archive/`: scripts históricos de construção; não devem ser executados sobre o site atual.
- `screenshots/`: capturas de desktop e celular.
- `results/`: relatórios JSON.
- `temp/`: perfil temporário criado pelos testes de navegador.

Execute os scripts a partir da raiz do projeto. Exemplo:

```powershell
powershell -ExecutionPolicy Bypass -File .\qa\scripts\static-review.ps1
```
