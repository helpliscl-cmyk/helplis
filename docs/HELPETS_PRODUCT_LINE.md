# Helpets Product Line

Helpets usa la infraestructura principal de HelPlis, pero representa una linea separada de productos para mascotas.

## Separacion operacional

- Personas: lote SAMPLE existente `SAMPLE-HELPLIS-001`, `ProductType.WRISTBAND`, referencias `W-001` a `W-005`.
- Helpets: nuevo preview `SAMPLE-HELPETS-001`, `ProductType.PET_TAG`, referencias `P-001` a `P-005`.
- Las URLs fisicas permanentes siguen usando `https://helplis.cl/p/[publicCode]`.
- No se crea dominio, backend ni flujo publico separado.

## Metadatos Helpets

- `productLine`: `HELPETS`
- `profileType`: `PET`
- `deviceType`: `PET_TAG`
- `productionMode`: `SAMPLE`
- estado inicial publico: `UNACTIVATED`
- inventario inicial operativo: `UNASSIGNED` en export/preview; en Prisma se conserva como dispositivo no asignado hasta recepcion y verificacion.

## Reglas de codigos

Los publicCode Helpets son aleatorios, de 8 caracteres y usan un alfabeto no ambiguo. Se excluyen `0`, `O`, `1`, `I` y `L`, y no se reutilizan los codigos de `SAMPLE-HELPLIS-001`.
