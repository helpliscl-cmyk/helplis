# Scan Experience

Fecha: 2026-07-13

La ruta `/p/[publicCode]` registra un scan event y renderiza una proyeccion publica. El scanner ve:

1. Estado del dispositivo.
2. Foto autorizada o inicial.
3. Nombre visible.
4. Tipo de perfil.
5. Mensaje principal.
6. Acciones rapidas: llamar, WhatsApp, compartir ubicacion, reportar encontrado, copiar enlace, emergencia.
7. Informacion critica autorizada.
8. Contactos por prioridad.
9. Informacion adicional segun tipo.
10. Texto de privacidad.

Los telefonos pueden usarse en `tel:` o WhatsApp tras click explicito sin imprimirse como texto plano ni serializarse en el HTML inicial.
