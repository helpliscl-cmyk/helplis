# Validacion real MIME Rancagua

Fecha: 2026-07-13T22:22:29.377Z
Job: cmrjs8kfr0000r9ls3cfufdpr
Fuente RBD: Cormun Rancagua, documentos Mineduc/infoescuelas, fichas MIME indexadas y sitios institucionales con reconocimiento Mineduc. Cada RBD fue consultado contra la ficha publica MIME.

## Resumen

- RBD consultados: 2112, 2123, 2133, 15503, 15769, 11256, 2166, 15707, 2150, 2194
- Total fichas reales solicitadas a MIME: 10
- Con correo: 0/10 (0%)
- Con telefono: 0/10 (0%)
- Con sitio web: 0/10 (0%)
- Estado job: COMPLETED_WITH_ERRORS; exitos 0; fallos 10; omitidos 0
- Prueba de lock: ok: segundo worker bloqueado en corrida original

## Validacion por establecimiento

| RBD | Nombre guardado | Resultado scraping | Campos encontrados | Campos ausentes | Campos incorrectos | Observaciones | Estado final |
| --- | --- | --- | --- | --- | --- | --- | --- |
2112 | Colegio Moises Mussa | FAILED HTTP 200 | 0:  | rbd, name, status, address, commune, region, dependency, holderName, directorName, phone, contactEmail, website, educationLevels, totalEnrollment, mimeUrl, sourceCheckedAt | ninguno | Fuente seleccion: Cormun Rancagua + documento institucional indexado con RBD 2112. URL: https://mi.mineduc.cl/mvc/mime/ficha?rbd=2112. MIME_ERROR_PAGE MIME devolvio una pagina de error generico con HTTP 200. | incorrecto
2123 | Escuela Bernardo O'Higgins | FAILED HTTP 200 | 0:  | rbd, name, status, address, commune, region, dependency, holderName, directorName, phone, contactEmail, website, educationLevels, totalEnrollment, mimeUrl, sourceCheckedAt | ninguno | Fuente seleccion: MIME indexado y listado público docente con RBD 2123. URL: https://mi.mineduc.cl/mvc/mime/ficha?rbd=2123. MIME_ERROR_PAGE MIME devolvio una pagina de error generico con HTTP 200. | incorrecto
2133 | Colegio Ricardo Olea | FAILED HTTP 200 | 0:  | rbd, name, status, address, commune, region, dependency, holderName, directorName, phone, contactEmail, website, educationLevels, totalEnrollment, mimeUrl, sourceCheckedAt | ninguno | Fuente seleccion: Cormun Rancagua + ficha MIME indexada con RBD 2133. URL: https://mi.mineduc.cl/mvc/mime/ficha?rbd=2133. MIME_ERROR_PAGE MIME devolvio una pagina de error generico con HTTP 200. | incorrecto
15503 | Escuela de Parvulos Duende Melodia | FAILED HTTP 200 | 0:  | rbd, name, status, address, commune, region, dependency, holderName, directorName, phone, contactEmail, website, educationLevels, totalEnrollment, mimeUrl, sourceCheckedAt | ninguno | Fuente seleccion: Cormun Rancagua + ficha MIME indexada con RBD 15503. URL: https://mi.mineduc.cl/mvc/mime/ficha?rbd=15503. MIME_ERROR_PAGE MIME devolvio una pagina de error generico con HTTP 200. | incorrecto
15769 | Liceo Tecnico Santa Cruz de Triana | FAILED HTTP 200 | 0:  | rbd, name, status, address, commune, region, dependency, holderName, directorName, phone, contactEmail, website, educationLevels, totalEnrollment, mimeUrl, sourceCheckedAt | ninguno | Fuente seleccion: Mineduc/documentos infoescuelas y Cormun Rancagua. URL: https://mi.mineduc.cl/mvc/mime/ficha?rbd=15769. MIME_ERROR_PAGE MIME devolvio una pagina de error generico con HTTP 200. | incorrecto
11256 | Colegio Don Bosco | FAILED HTTP 200 | 0:  | rbd, name, status, address, commune, region, dependency, holderName, directorName, phone, contactEmail, website, educationLevels, totalEnrollment, mimeUrl, sourceCheckedAt | ninguno | Fuente seleccion: Sitio del establecimiento con RBD y reconocimiento Mineduc. URL: https://mi.mineduc.cl/mvc/mime/ficha?rbd=11256. MIME_ERROR_PAGE MIME devolvio una pagina de error generico con HTTP 200. | incorrecto
2166 | Instituto Regional de Educacion | FAILED HTTP 200 | 0:  | rbd, name, status, address, commune, region, dependency, holderName, directorName, phone, contactEmail, website, educationLevels, totalEnrollment, mimeUrl, sourceCheckedAt | ninguno | Fuente seleccion: Sitio del establecimiento y documentos Mineduc con RBD 2166. URL: https://mi.mineduc.cl/mvc/mime/ficha?rbd=2166. MIME_ERROR_PAGE MIME devolvio una pagina de error generico con HTTP 200. | incorrecto
15707 | Colegio Rancagua | FAILED HTTP 200 | 0:  | rbd, name, status, address, commune, region, dependency, holderName, directorName, phone, contactEmail, website, educationLevels, totalEnrollment, mimeUrl, sourceCheckedAt | ninguno | Fuente seleccion: Superintendencia de Educacion con RBD 15707. URL: https://mi.mineduc.cl/mvc/mime/ficha?rbd=15707. MIME_ERROR_PAGE MIME devolvio una pagina de error generico con HTTP 200. | incorrecto
2150 | Instituto Sagrado Corazon | FAILED HTTP 200 | 0:  | rbd, name, status, address, commune, region, dependency, holderName, directorName, phone, contactEmail, website, educationLevels, totalEnrollment, mimeUrl, sourceCheckedAt | ninguno | Fuente seleccion: Listado RBD público indexado para Rancagua. URL: https://mi.mineduc.cl/mvc/mime/ficha?rbd=2150. MIME_ERROR_PAGE MIME devolvio una pagina de error generico con HTTP 200. | incorrecto
2194 | Instituto Ingles Rancagua | FAILED HTTP 200 | 0:  | rbd, name, status, address, commune, region, dependency, holderName, directorName, phone, contactEmail, website, educationLevels, totalEnrollment, mimeUrl, sourceCheckedAt | ninguno | Fuente seleccion: Listado RBD público indexado para Rancagua. URL: https://mi.mineduc.cl/mvc/mime/ficha?rbd=2194. MIME_ERROR_PAGE MIME devolvio una pagina de error generico con HTTP 200. | incorrecto

## Base de datos

- No se pudo ejecutar replay local de duplicidad.
- Sostenedores vinculados en muestra: 

## Jobs

- Se creo job COMMUNE acotado a la muestra.
- Se ejecuto una primera corrida de 2 fichas y se corto con maxAttemptsPerRun para simular interrupcion.
- Se pauso y reanudo el mismo job.
- Se probo lock de worker con estado RUNNING y fue rechazado.
- Se finalizo el job sin dejar procesos ejecutandose.
- Retry de registros fallidos: no se reintento MIME_ERROR_PAGE porque es una respuesta de error generico HTTP 200, no un fallo transitorio ni 429/403.

## Campos no consistentes

- No evaluable en esta corrida: MIME no entrego fichas, solo paginas de error generico HTTP 200.

## Fixtures HTML

- tests/fixtures/mime/real-rancagua-2112.html
- tests/fixtures/mime/real-rancagua-2123.html
- tests/fixtures/mime/real-rancagua-2133.html
- tests/fixtures/mime/real-rancagua-15503.html
- tests/fixtures/mime/real-rancagua-15769.html
- tests/fixtures/mime/real-rancagua-11256.html
- tests/fixtures/mime/real-rancagua-2166.html
- tests/fixtures/mime/real-rancagua-15707.html
- tests/fixtures/mime/real-rancagua-2150.html
- tests/fixtures/mime/real-rancagua-2194.html
