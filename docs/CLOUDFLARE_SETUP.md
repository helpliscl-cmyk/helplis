# Cloudflare Setup

Configurar:

- DNS raíz `helplis.cl` hacia Vercel.
- `www.helplis.cl` como CNAME hacia Vercel.
- SSL Full/Strict.
- Redirección canónica entre www y raíz.
- Cache estática para assets.
- Bypass cache para `/p/*`, `/activate*`, `/dashboard*`, `/admin*` y `/api/*`.
- Headers de seguridad complementarios.
- Reglas básicas contra abuso y scraping masivo.

No almacenar secrets en Cloudflare salvo que se usen Workers/Pages en una fase posterior.
