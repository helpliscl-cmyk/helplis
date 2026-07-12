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

## Resultado despues del rediseño

### Nueva estructura del home

1. Hero comercial con problema, producto, beneficios rapidos y CTA.
2. Problema con escenarios cotidianos.
3. Solucion con QR, NFC, perfil digital y contacto.
4. Como funciona en tres pasos.
5. Para quien sirve, priorizando ninos, adultos mayores y personas.
6. Producto/pulsera con fotografia oficial y estado "muy pronto".
7. Por que HelPlis.
8. Privacidad como confianza.
9. Instituciones y alianzas.
10. Senales legitimas de confianza inicial.
11. Preguntas frecuentes comerciales.
12. Cierre de venta con CTA y acceso discreto a activacion.

### Recorridos validados

#### A. Madre o padre que llega desde Instagram

- Ve: "Si se pierde, ayudale a volver", foto de la pulsera y CTA "Quiero mi HelPlis".
- Entiende: no necesita app ni bateria, y puede dejar interes sin crear cuenta.
- Accion: abre `/quiero-helplis` desde hero o cierre.
- Obstaculo pendiente: falta precio final y disponibilidad comercial.

#### B. Persona que busca pulsera para adulto mayor

- Ve: escenario de adulto mayor, uso prioritario y FAQ de GPS/bateria.
- Entiende: no hay rastreo permanente; la ficha muestra datos autorizados.
- Accion: deja interes seleccionando "Adultos mayores".
- Obstaculo pendiente: explicar futuras opciones de talla/material cuando esten confirmadas.

#### C. Colegio que evalua una alianza

- Ve: seccion Instituciones, tipos de comunidad y CTA "Solicitar alianza institucional".
- Entiende: puede existir codigo/landing institucional y acompanamiento de activacion.
- Accion: llega a `/quiero-helplis?tipo=institucion`.
- Obstaculo pendiente: definir condiciones reales de descuento y proceso de compra por volumen.

#### D. Cliente que ya recibio su pulsera

- Ve: "Activar" en header y acceso discreto en cierre.
- Entiende: activar no desaparecio, pero ya no domina el home.
- Accion: entra a `/activate` o `/activate/[publicCode]`.
- Obstaculo pendiente: crear acceso secundario para abrir ficha por codigo fuera del hero si soporte lo requiere.

## Capturas despues

- Despues escritorio: `docs/audit/screenshots/home-after-desktop.png`
- Despues tablet: `docs/audit/screenshots/home-after-tablet.png`
- Despues movil grande: `docs/audit/screenshots/home-after-mobile-large.png`
- Despues movil pequeno: `docs/audit/screenshots/home-after-mobile-small.png`

## Validacion responsive

- Movil pequeno: header compacto, CTA visible, sin overflow horizontal observado.
- Movil grande: secciones apiladas y cards legibles.
- Tablet: grillas cambian sin solapes.
- Escritorio: hero, producto, instituciones y FAQ mantienen jerarquia visual.

## Post-price commercial review

Fecha: 2026-07-12  
Sitio revisado: `https://helplis.cl`

La revisión publicada previa seguía comunicando interés/preventa: no mostraba precio, mantenía el texto de confianza inicial sobre testimonios no inventados y `/quiero-helplis` todavía decía que no había precio final. La nueva fase corrige esa brecha comercial.

### Decisión comercial aplicada

- Compra única.
- Sin mensualidad obligatoria.
- 1 pulsera: $18.000 CLP.
- Pack 2: $28.000 CLP, $14.000 c/u, ahorro $8.000.
- Pack 3: $35.000 CLP, $11.667 c/u, ahorro $19.000.
- Envío aparte, sin inventar costo, cobertura ni plazo.
- Cada pulsera incluye activación y perfil digital actualizable.

### Ajustes de funnel

1. Hero con precio de entrada: desde $18.000 y compra única, sin mencionar envío.
2. Header con compra como CTA principal y `Activar` secundario.
3. Sección `Elige tu HelPlis` con tres packs comparables.
4. Se reemplazó confianza inicial por `Tecnología simple, ayuda real`.
5. FAQ actualizado con mensualidad, envío, precios, GPS, batería, app, QR/NFC e instituciones.
6. `/quiero-helplis` ahora recibe `?pack=1`, `?pack=2` o `?pack=3`, calcula el precio y guarda la intención.
7. Confirmación ofrece WhatsApp prellenado sin enviar automáticamente.
8. Admin suma vista de leads comerciales con pack, cantidad, precio, envío pendiente, estado y origen.

### Ajuste posterior de ritmo

- El home ya no menciona envío; esa información queda para el resumen final del formulario de compra.
- Se compactó la secuencia del home para reducir lectura en móvil: se agruparon problema, usos y solución; se eliminaron bloques repetidos y se redujo el FAQ visible.

### Riesgos pendientes

- No existe checkout ni medio de pago definido, por lo que las solicitudes no deben marcarse como ventas.
- El costo de envío requiere proceso operativo o cotización posterior.
- Condiciones institucionales deben cotizarse por cantidad; no se publican descuentos fijos.

### Capturas pricing update

- Home escritorio: `docs/audit/screenshots/pricing-update/home-desktop.png`
- Home móvil: `docs/audit/screenshots/pricing-update/home-mobile.png`
- Sección de precios: `docs/audit/screenshots/pricing-update/pricing-section.png`
- Formulario pack 1: `docs/audit/screenshots/pricing-update/form-pack-1.png`
- Formulario pack 2: `docs/audit/screenshots/pricing-update/form-pack-2.png`
- Formulario pack 3: `docs/audit/screenshots/pricing-update/form-pack-3.png`
- Confirmación: `docs/audit/screenshots/pricing-update/confirmation.png`
- FAQ: `docs/audit/screenshots/pricing-update/faq.png`
- Header con Activar secundario: `docs/audit/screenshots/pricing-update/header-activar-secondary.png`
