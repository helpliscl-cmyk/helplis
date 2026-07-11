# Cloudflare and Domain Setup

Fecha: 2026-07-11.

No se cambiaron DNS en esta fase porque Vercel aún no debe configurarse.

## Dominios

- Canónico: `https://helplis.cl`
- Alternativo: `https://www.helplis.cl`
- Redirección futura: `www` debe redirigir al dominio raíz.

## Registros que no se deben romper

Antes de cualquier cambio, respaldar registros actuales:

- MX de correo.
- TXT SPF.
- TXT DKIM.
- TXT DMARC.
- Registros de verificación de proveedores.
- Registros usados por correo transaccional futuro.

## Configuración web futura

Cuando Vercel esté verificado:

1. Agregar `helplis.cl` en Vercel.
2. Agregar `www.helplis.cl` en Vercel.
3. Copiar exactamente los targets DNS entregados por Vercel.
4. Configurar redirección `www -> helplis.cl`.
5. Verificar SSL.
6. Probar:
   - `https://helplis.cl`
   - `https://www.helplis.cl`
   - Open Graph
   - rutas `/p/[publicCode]` y `/activate`

## Riesgos

- Cambiar MX/TXT puede romper correo.
- Activar proxy sin validar SSL puede crear errores de certificado.
- Cambiar DNS antes del deploy puede dejar el dominio sin aplicación.
