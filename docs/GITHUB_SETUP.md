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
- Remote configurado: `origin https://helpliscl-cmyk@github.com/helpliscl-cmyk/helplis.git`
- `git fetch origin`: OK.
- Push de `feature/supabase-integration`: OK tras completar autenticación GitHub.
- Nota: se fijó el usuario `helpliscl-cmyk` en la URL del remote porque había varias cuentas GitHub guardadas en Git Credential Manager.

## Comparación local/remoto

Los historiales son independientes:

- Local contiene la aplicación completa.
- Remoto `main` contiene solo los PNG subidos manualmente.

No se hizo `force push` ni se sobrescribió `main`.

## Rama subida

Rama remota: `origin/feature/supabase-integration`

Pull request sugerido:

`https://github.com/helpliscl-cmyk/helplis/pull/new/feature/supabase-integration`

Luego crear PR o revisar manualmente cómo reconciliar `main`. Si se desea que `main` contenga la app completa, hacerlo mediante merge/PR consciente, preservando los assets remotos o moviéndolos a `public/brand/source` antes de limpiar la raíz.

## Verificaciones pendientes tras push

- Confirmar que `.env`, SQLite y `node_modules` no aparecen en GitHub.
- `.github/workflows/ci.yml` existe en la rama subida.
- CI no se ejecutó con el push de rama porque el workflow actual corre en `push` a `main` y en `pull_request`.
- Crear PR para disparar Actions/CI.
- Corregir cualquier error de CI antes de merge.
