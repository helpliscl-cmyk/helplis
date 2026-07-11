# GitHub Setup

Fecha: 2026-07-11.

## Repositorio inspeccionado en Chrome

- URL: `https://github.com/helpliscl-cmyk/helplis`
- Nombre visible: `helpliscl-cmyk/helplis`
- Visibilidad: Public
- Rama remota visible: `main`
- Estado remoto: 2 commits, 3 archivos PNG de branding en la raíz.
- Último commit remoto visible: `658ffa5 Add files via upload`

## Estado local

- Rama base inicial: `master`
- Commits locales antes de esta fase:
  - `cebea0d chore: scaffold helplis next app`
  - `2e5f30b feat: add helplis data model and domain services`
  - `2abb968 feat: build helplis public dashboard and admin flows`
  - `0969976 test: add verification suite and ci`
  - `de8e551 docs: document helplis mvp and deployment plans`
- Rama creada para esta fase: `feature/supabase-integration`
- Remote configurado: `origin https://github.com/helpliscl-cmyk/helplis.git`
- `git fetch origin`: OK.

## Comparación local/remoto

Los historiales son independientes:

- Local contiene la aplicación completa.
- Remoto `main` contiene solo los PNG subidos manualmente.

No se hizo `force push` ni se sobrescribió `main`.

## Recomendación de push

Push seguro recomendado:

```bash
git push -u origin feature/supabase-integration
```

Luego crear PR o revisar manualmente cómo reconciliar `main`. Si se desea que `main` contenga la app completa, hacerlo mediante merge/PR consciente, preservando los assets remotos o moviéndolos a `public/brand/source` antes de limpiar la raíz.

## Verificaciones pendientes tras push

- Confirmar que `.env`, SQLite y `node_modules` no aparecen en GitHub.
- Confirmar que `.github/workflows` existe en la rama subida.
- Revisar resultado de Actions/CI.
- Corregir cualquier error de CI antes de merge.
