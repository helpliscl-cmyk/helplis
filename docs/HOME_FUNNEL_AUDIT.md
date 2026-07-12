# HelPlis Home Funnel Audit

Fecha: 2026-07-11  
Sitio auditado: `https://helplis.vercel.app/`  
Referencia metodologica publica: `https://www.sosmee.com/`

## Resumen

El home publicado funcionaba como puerta de activacion y demostracion tecnica. Explicaba QR, NFC, privacidad y flujo, pero no vendia el producto a una persona que llega por primera vez desde una campana o red social.

El objetivo comercial nuevo debe ser:

1. explicar el problema;
2. presentar HelPlis como solucion simple;
3. mostrar la pulsera;
4. generar confianza;
5. resolver objeciones;
6. llevar a interes/preventa sin obligar a crear cuenta.

## Hallazgos del home actual

### Hero

- El titular principal era solo "HelPlis", por lo que no comunicaba beneficio inmediato.
- El CTA dominante era "Activar una pulsera", orientado a quien ya compro.
- El formulario "Abrir ficha por codigo" ocupaba espacio comercial de alto valor.
- La fotografia oficial estaba presente, pero como fondo atenuado y no como producto observable.
- La promesa era correcta, pero sonaba mas funcional que emocional.

### Navegacion

- "Activar" aparecia dentro de la navegacion y tambien como boton principal.
- No habia CTA comercial consistente.
- Faltaban anclas comerciales claras: Pulsera, Para quien sirve, Producto.

### Jerarquia y secciones

- La pagina saltaba rapidamente a beneficios tecnicos y funcionamiento.
- El problema del visitante nuevo no estaba suficientemente nombrado.
- Los casos de uso tenian peso similar; ninos, adultos mayores y personas no quedaban priorizados.
- La seccion institucional mencionaba MVP, lotes, importaciones y Supabase, contenido interno que distrae de la venta.

### Contenido tecnico

- QR, NFC, GPS, bateria, ubicacion y permisos estaban bien explicados, pero demasiado temprano.
- La explicacion de cinco pasos era correcta para producto, pero pesada para un primer visitante.

### Experiencia movil

- El home era usable, pero el primer pantallazo movil no dejaba suficientemente claro que hacer si no se tenia pulsera.
- Los clientes existentes tenian accesos visibles; el visitante nuevo no tenia una ruta de compra/interes.

## Recorridos auditados

### A. Visitante nuevo desde Instagram

- Ve una marca y una explicacion funcional.
- Entiende que hay QR/NFC, pero no encuentra una accion de compra o interes.
- Obstaculo: "Activar" parece pedir una pulsera ya comprada.

### B. Persona buscando pulsera para adulto mayor

- Encuentra privacidad y ubicacion voluntaria.
- No ve una historia o problema concreto de desorientacion.
- Obstaculo: no hay seccion de producto/preventa ni formulario simple.

### C. Colegio o institucion

- Encuentra "Preparado para organizaciones".
- Obstaculo: el copy habla de MVP, lotes y despliegue, no de beneficio para comunidad o alianza.

### D. Cliente que ya recibio la pulsera

- Encuentra "Activar" rapido y puede continuar.
- Este recorrido estaba bien cubierto, pero dominaba el home.

## Aprendizaje del funnel referencial

La referencia publica usa una secuencia comercial clara:

1. problema emocional;
2. producto visible;
3. CTA de compra;
4. beneficios simples;
5. catalogo/precio;
6. confianza;
7. funcionamiento;
8. casos de uso;
9. activacion para clientes;
10. cierre con CTA.

HelPlis debe adaptar la logica, no el diseno ni los textos. Como no existe precio final ni checkout confirmado, el CTA comercial debe ir a interes/preventa.

## Nueva direccion requerida

- CTA principal: "Quiero mi HelPlis".
- Ruta comercial: `/quiero-helplis`.
- Header: navegacion comercial y acciones secundarias "Iniciar sesion" + "Activar".
- Hero: beneficio antes que marca.
- Producto: pulsera como centro visual.
- Instituciones: alianza, comunidad y acompanamiento.
- Privacidad: confianza simple, sin promesas absolutas.
- Prueba social: solo senales legitimas hasta tener testimonios reales.

## Capturas

- Antes escritorio: `docs/audit/screenshots/home-before-desktop.png`
- Antes movil: `docs/audit/screenshots/home-before-mobile.png`

Las capturas despues se agregaran al terminar el rediseno.
