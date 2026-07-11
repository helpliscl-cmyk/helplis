# Competitor Benchmark: SOSMee

Fecha de revisión: 2026-07-11. Sitio público analizado en Chrome: `https://sosmee.com/es`.

Este benchmark es solo referencial. No se copió código, textos, imágenes, estructura visual exacta, testimonios ni material comercial.

## Observaciones públicas

1. **Propuesta de valor:** identificación de emergencia con dispositivos QR/NFC y perfil digital.
2. **Segmentos:** personas, niños, adultos mayores, deportistas, mascotas, objetos y empresas.
3. **Navegación:** home, cómo funciona, activación, productos, empresas, MercadoLibre, login, registro, FAQ, contacto y legal.
4. **Jerarquía home:** promoción, hero comercial, productos/packs, prueba de uso, casos, activación, CTA final y footer.
5. **Problema:** pérdida, desorientación, accidente o extravío de personas/objetos.
6. **Producto:** pulseras y tags con compra directa.
7. **QR/NFC:** se presentan como doble vía de acceso a perfil.
8. **Batería:** comunica que no requiere batería ni recargas.
9. **Aplicación:** comunica que no requiere aplicación obligatoria.
10. **Activación:** registro de cuenta, código único y completar perfil.
11. **Ubicación:** se menciona en privacidad y ficha; debe tratarse con precisión para no parecer GPS.
12. **Privacidad:** página legal con visibilidad de datos, salud opcional y derechos.
13. **Contactos:** se orienta a llamadas/WhatsApp y contacto familiar.
14. **Casos de uso:** familia, mascotas, deportistas, equipaje/llaves.
15. **Confianza:** usa reseñas, descuentos, garantías y ecommerce.
16. **Productos:** Band 2.0, Band, Tag.
17. **Packs:** dúo, trío y familia.
18. **Precios visibles:** se observaron precios y descuentos públicos en CLP.
19. **Promociones:** fuerte presencia de flash sale y rebajas.
20. **Garantías:** comunicación de garantía en fichas de producto.
21. **Medios de pago:** checkout propio y alternativas como MercadoLibre; señales de pago seguro.
22. **Envíos:** envío a Chile, costo calculado y umbral de envío gratis visible.
23. **FAQ:** batería, agua, compatibilidad, pérdida, suscripción y envío.
24. **Acceso clientes:** login y registro con Google.
25. **Móvil:** no se observó overflow horizontal; navegación compacta con menú.
26. **Accesibilidad:** navegación y formularios presentes; algunos carruseles muestran textos de control genéricos.
27. **Rendimiento:** sitio Next.js con múltiples scripts de analítica/ads; carga funcional.
28. **SEO:** títulos y descripciones por productos, contenido SEO largo y schema de producto.
29. **Tecnologías detectables:** Next.js, scripts de Google, Meta/Facebook Pixel, TikTok Pixel, checkout/ecommerce y almacenamiento CDN.
30. **Fortalezas:** claridad comercial, catálogo, activación explicada, legal visible y ecommerce completo.
31. **Debilidades:** tono promocional intenso, dependencia de descuentos/reseñas, posible mezcla entre emergencia y venta, y riesgo de confundir ubicación con rastreo si no se explica bien.
32. **Oportunidades HelPlis:** posicionar una experiencia más sobria, humana, transparente en privacidad, enfocada en Chile y preparada para organizaciones.

## Matriz comparativa

| Funcionalidad | SOSMee | HelPlis actual | Mejora propuesta | Prioridad | Esfuerzo | Riesgo | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Branding | Marca visible y ecommerce maduro | Logo no integrado inicialmente | Assets oficiales, favicon, OG, tokens | Alta | Medio | Bajo | Aplicado |
| Home | Comercial, productos y promos | MVP provisional | Home propia con foto oficial y privacidad clara | Alta | Medio | Bajo | Aplicado |
| QR + NFC | Mensaje central | Funcional en textos | Explicación breve y técnica | Alta | Bajo | Bajo | Aplicado |
| Sin batería/app | Visible en producto | Mencionado parcialmente | Beneficios explícitos sin exagerar | Alta | Bajo | Bajo | Aplicado |
| GPS/ubicación | Presente como tema legal/comercial | Botón de ubicación con consentimiento | Aclarar que no hay GPS propio ni rastreo | Alta | Bajo | Bajo | Aplicado |
| Activación | Registro + código | Formulario único técnico | Progreso por pasos y privacidad inicial | Alta | Medio | Medio | Aplicado |
| Ficha pública | Perfil de emergencia | Acciones funcionales | Jerarquía urgente y feedback offline | Alta | Medio | Medio | Aplicado |
| Catálogo/precios | Productos y packs | Sin precios definidos | No inventar precios hasta decisión comercial | Media | Bajo | Bajo | Pendiente comercial |
| Instituciones | Página empresas | Modelo admin/org existe | Mensaje público sobrio para colegios/fundaciones/empresas | Media | Bajo | Bajo | Aplicado en home |
| Legal | Privacidad y términos visibles | Docs internas | Preparar páginas públicas legales futuras | Media | Medio | Medio | Pendiente |
| Ecommerce | Checkout, envío, pago | No aplica | Definir si HelPlis venderá directo o por contacto | Media | Alto | Medio | Pendiente |
| Login/registro | Brandeado | Local provisional | Marca integrada y copy menos técnico | Media | Bajo | Bajo | Aplicado |
| SEO | Metadata por producto | Metadata básica | Canonical, OG y descripción precisa | Alta | Bajo | Bajo | Aplicado |
| Rendimiento | Muchos scripts externos | App local liviana | Mantener liviano al desplegar | Media | Bajo | Bajo | Recomendado |
| Supabase | No benchmark privado | SQLite local | Migración con Auth, RLS y Storage | Alta | Alto | Alto | Preparado |
| GitHub/CI | No aplica | CI local existente | Remote configurado, push seguro por rama | Alta | Medio | Medio | Parcial |

## Recomendación de posicionamiento

HelPlis debe diferenciarse por calma, precisión y privacidad. La comunicación debe evitar el lenguaje de vigilancia o promesas absolutas. La frase base recomendada es: QR y NFC para ayudar al reencuentro, sin GPS propio, sin batería y sin aplicación obligatoria.
