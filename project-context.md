# Contexto del proyecto: Es Por Fé

> Documento vivo. Actualizar cuando se confirme una decisión de negocio, se modifique el alcance o se cierre una fase.

## 1. Resumen

Es Por Fé es una tienda chilena de Biblias y productos cristianos con propósito. El sitio debe ayudar a encontrar una edición adecuada para cada persona, momento o regalo y permitir comprar con la menor fricción posible.

- Mercado principal: Chile.
- Idioma inicial: español de Chile (`es-CL`).
- Moneda: peso chileno (`CLP`), sin decimales en la interfaz.
- Canal de referencia: Instagram `@esporfetienda`.
- Fuente de catálogo: planilla de Google Sheets entregada por el negocio.
- Fuente de imágenes: carpeta de Google Drive entregada por el negocio.
- Pago inicial: Mercado Pago.
- Despacho inicial: tarifa cobrada en checkout, sin integración con un operador logístico.

## 2. Objetivos

### Negocio

1. Vender en línea sin depender de mensajes manuales para completar cada pedido.
2. Presentar con claridad las traducciones, formatos, tamaños de letra y características de cada Biblia.
3. Facilitar la gestión de catálogo, precios, pedidos y estados de pago.
4. Construir confianza con información clara de producción, despacho, cambios y contacto.

### Experiencia

1. Llegar de producto a pago en pocos pasos.
2. Priorizar la compra como invitado; crear una cuenta no será requisito para el MVP.
3. Diseñar primero para móvil, ya que Instagram será un canal de entrada principal.
4. Mantener alto rendimiento, accesibilidad y una interfaz limpia.

### Indicadores sugeridos

- Conversión de sesión a compra.
- Tasa de producto agregado al carro.
- Inicio y abandono de checkout.
- Pagos rechazados o pendientes.
- Tiempo hasta completar una compra en móvil.
- Core Web Vitals y tasa de errores del checkout.

Los objetivos numéricos se fijarán después de contar con una línea base.

## 3. Usuarios principales

- Persona que busca una Biblia o un regalo cristiano con significado.
- Cliente que compra para sí mismo, una familia, comunidad o iglesia.
- Administrador de Es Por Fé que publica productos y procesa pedidos.

## 4. Alcance del MVP

### Descubrimiento y catálogo

- Inicio con propuesta de valor cristiana, categorías, productos destacados, guía de compra y elementos de confianza.
- Catálogo por categoría o colección.
- Búsqueda y filtros básicos si el volumen del catálogo los justifica.
- Página de producto con galería, precio, disponibilidad, variantes y plazos.
- SEO técnico, Open Graph, sitemap, URLs legibles y datos estructurados de producto.

### Información del producto

- Identificar claramente traducción bíblica, tamaño de letra, encuadernación, cierre, índice y público recomendado cuando corresponda.
- Organizar el catálogo por categorías y atributos útiles para elegir una edición.
- Mantener fotografías reales, stock y precio como información central de compra.
- No se ofrecerá personalización en el alcance actual.

### Carro y checkout

- Carro persistente.
- Edición de cantidad y eliminación de productos.
- Checkout como invitado y en flujo corto.
- Datos de contacto, dirección chilena, tarifa de despacho, resumen y pago.
- Formulario preparado para Región y comuna; validar si se requiere RUT y/o teléfono obligatorio.
- Confirmación de pedido y estado de pago.

### Pagos con Mercado Pago

- Integración server-side como proveedor de pago de Medusa.
- Credenciales separadas por ambiente y nunca expuestas en el cliente.
- Idempotencia al crear/intentar pagos.
- Webhook validado criptográficamente.
- El webhook será la fuente de verdad para conciliar pago aprobado, pendiente, rechazado o reembolsado; no se confiará solo en la redirección del navegador.
- Registro de IDs externos para soporte y conciliación.
- Sandbox y casos de error probados antes de producción.

Se usará Checkout Pro para el MVP: reduce complejidad, mantiene el manejo sensible del pago en Mercado Pago y permite validar antes el flujo comercial completo.

### Despacho

- Sin cotización ni emisión de etiquetas mediante courier en el MVP.
- Medusa manejará una o más opciones manuales de fulfillment.
- Tarifa configurable: $3.500 CLP para la Región Metropolitana y $7.000 CLP para las otras 15 regiones.
- Mostrar con claridad tarifa, cobertura y plazo estimado antes del pago.
- El administrador coordinará y actualizará manualmente el estado del despacho.

Las tarifas cubren las 16 regiones mediante sus códigos ISO. Siguen pendientes el retiro en punto, un posible umbral de despacho gratis y reglas especiales para zonas extremas.

### Administración

- Panel Medusa para productos, variantes, precios, inventario y pedidos.
- Flujo documentado para importar el catálogo inicial.
- Uso de los estados estándar de preparación, pago y despacho de Medusa.

### Contenido y confianza

- Quiénes somos / historia de Es Por Fé.
- Preguntas frecuentes sobre ediciones, disponibilidad, plazos y despacho.
- Políticas de cambios, privacidad, términos y despacho.
- Contacto e Instagram.
- Reseñas o testimonios solo con contenido real autorizado.

## 5. Fuera del MVP

- Integración automática con couriers.
- Marketplace, multivendedor o venta internacional.
- Múltiples monedas o idiomas.
- Programa de fidelidad, referidos o suscripciones.
- Diseñador visual avanzado con render en tiempo real.
- Aplicación móvil nativa.

## 6. Arquitectura y stack

### Aplicaciones

- `apps/backend`: Medusa 2.21.2, TypeScript y panel admin.
- `apps/storefront`: Astro 7.3.5 y TypeScript estricto.
- PostgreSQL 15+ como base de datos de comercio.
- Redis recomendado para producción y procesos distribuidos; confirmar hosting antes de implementarlo.
- SDK oficial de Medusa en el storefront para productos, carro, regiones, shipping y checkout.
- Integración de Mercado Pago encapsulada en el backend.

### Principios técnicos

- Render estático o server-rendered donde aporte rendimiento; islas de cliente solo para interacciones necesarias.
- Nada de secretos en variables `PUBLIC_*` ni en el bundle del navegador.
- Lógica de negocio en workflows/servicios de Medusa, no en componentes de interfaz.
- Validación de entradas en cliente y servidor.
- Operaciones de pago y webhook idempotentes.
- Imágenes optimizadas en AVIF/WebP, dimensiones explícitas y carga diferida bajo el primer viewport.
- Accesibilidad WCAG 2.2 AA como objetivo.

### Ambientes

- Local: PostgreSQL local, Medusa `:9000`, Astro `:4321`.
- Staging: catálogo y credenciales de prueba; webhooks accesibles públicamente.
- Producción: base administrada, backups, HTTPS, secretos y observabilidad.

El proveedor de hosting se decidirá comparando soporte para Node persistente, PostgreSQL, Redis, regiones cercanas a Chile, costos y despliegues independientes.

## 7. Modelo inicial de datos

Medusa será la fuente de verdad para datos transaccionales.

### Producto

- Título, slug, descripción corta y larga.
- Categoría, colección y etiquetas.
- Estado, destacado y orden editorial.
- Galería de imágenes y texto alternativo.
- Tiempo de preparación.
- Traducción, tipo de letra, encuadernación y otras características editoriales.
- Metadata de origen de la planilla para trazabilidad.

### Variante

- SKU estable y único.
- Combinación de opciones.
- Precio CLP.
- Inventario o disponibilidad bajo pedido.
- Peso y dimensiones si se requieren para operaciones futuras.

## 8. Diseño y voz

### Dirección visual provisional

- Limpia, cálida, cercana y contemporánea.
- El producto y su significado deben dominar la composición.
- Jerarquía fuerte, textos breves y CTA visibles.
- Evitar decoración religiosa genérica que compita con los diseños reales.
- Paleta, tipografías y logo definitivos se extraerán del material autorizado de Instagram o archivos originales.

### Voz

- Español chileno claro, amable y directo.
- Inspirador sin sacrificar información concreta de precio, plazo y despacho.
- Evitar promesas, testimonios o atributos de producto no entregados por el negocio.

## 9. Analítica, privacidad y operación

- Medición mínima: ver producto, agregar al carro, iniciar checkout, seleccionar envío, iniciar pago y compra.
- Analítica condicionada a una decisión de privacidad/cookies.
- Sanitizar logs y nunca registrar credenciales ni datos completos de pago.
- Monitorear errores del storefront, API, webhooks y tareas de backend.
- Backups automáticos de PostgreSQL y procedimiento de restauración probado.
- Políticas legales y tratamiento de datos deben ser revisados por el negocio o asesor correspondiente antes del lanzamiento.

## 10. Fuentes entregadas

- Catálogo: <https://docs.google.com/spreadsheets/d/12WhJDgVLzQvypTE643P_8u1RwlOCoQGK5my5OFL7-XY/edit?gid=0#gid=0>
- Fotografías: <https://drive.google.com/drive/folders/1hC_ylB69TDkgM97xdDC5lk6XtLPmM6PO>
- Instagram: <https://www.instagram.com/esporfetienda/>

Estado al 2026-09-28: se encontró una copia local de la planilla en `data-files/Stock es por fe.xlsx`. Google Drive e Instagram todavía no exponen contenido legible desde el entorno de desarrollo; se requiere acceso público efectivo o archivos exportados para completar el material visual y derivar la identidad de marca sin suposiciones.

### Auditoría inicial de la planilla local

- 19 productos, cada uno con SKU único, título, descripción, precio con IVA, stock, categoría e imagen incrustada.
- Los 19 productos actuales son Biblias.
- Rango de precios: $7.990 a $23.990 CLP.
- Stock total registrado: 116 unidades.
- Grupos normalizados para la tienda: Biblias económicas, Biblias de letra grande y Biblias infantiles.
- Se extrajeron las 19 imágenes incrustadas para construir la primera vista real del storefront.
- La planilla no define slug, estado de publicación, costo, proveedor ni reglas de despacho.
- Antes de importar a Medusa se deben revisar ortografía, consistencia de categorías, formato editorial de las descripciones y calidad/peso de las imágenes.

## 11. Plan paso a paso

### Fase 0 — Descubrimiento y preparación (en curso)

- [x] Registrar objetivos, alcance inicial y arquitectura.
- [x] Crear los proyectos Medusa y Astro con TypeScript.
- [x] Crear una primera superficie visual del storefront.
- [x] Obtener el primer catálogo con sus 19 imágenes incrustadas.
- [ ] Auditar Instagram/logo y solicitar archivos originales de marca.
- [ ] Resolver las decisiones abiertas de pago y envío.

### Fase 1 — Fundaciones

- [ ] Configurar repositorio Git y CI.
- [x] Preparar PostgreSQL 16 local con Docker y variables de ambiente.
- [x] Configurar región Chile, CLP, IVA inclusivo de 19%, canal de ventas y ubicación de stock.
- [ ] Crear usuario administrador.
- [ ] Conectar Astro con Medusa mediante publishable API key.
- [ ] Definir tokens finales de marca y componentes base accesibles.

### Fase 2 — Catálogo

- [x] Auditar la planilla inicial y asociar cada imagen con su SKU.
- [x] Importar 19 productos, precios y 116 unidades de inventario a Medusa.
- [ ] Completar la limpieza editorial de títulos y descripciones.
- [ ] Procesar, renombrar y optimizar fotografías.
- [ ] Crear importador repetible e idempotente.
- [ ] Implementar inicio, colecciones, listado y detalle de producto.
- [ ] Implementar SEO y metadata social.

### Fase 3 — Experiencia de producto y carro

- [ ] Completar atributos editoriales por producto.
- [ ] Implementar filtros por categoría y características cuando el volumen lo justifique.
- [ ] Implementar carro persistente y mini-carro.

### Fase 4 — Checkout, despacho y Mercado Pago

- [ ] Configurar tarifa(s) y cobertura manual de despacho.
- [ ] Implementar checkout invitado para direcciones chilenas.
- [ ] Implementar proveedor Mercado Pago y webhook seguro.
- [ ] Construir estados de éxito, pendiente, rechazo, cancelación y reintento.
- [ ] Probar idempotencia y conciliación en sandbox.

### Fase 5 — Operación y calidad

- [ ] Completar emails transaccionales y flujo interno de producción.
- [ ] Agregar contenido legal, FAQ, contacto y políticas.
- [ ] Configurar analítica consentida y monitoreo.
- [ ] Ejecutar pruebas funcionales, accesibilidad, rendimiento, SEO y seguridad.
- [ ] Capacitar al administrador con pedidos de prueba.

### Fase 6 — Lanzamiento

- [ ] Migrar catálogo final y verificar inventario/precios.
- [ ] Configurar dominio, DNS, HTTPS, credenciales productivas y webhooks.
- [ ] Hacer compra real controlada y comprobar conciliación/reembolso.
- [ ] Activar backups y plan de rollback.
- [ ] Lanzar y monitorear conversión/errores de cerca.

## 12. Criterios de terminado del MVP

- Un cliente puede descubrir, elegir, agregar y pagar un producto desde móvil.
- Precio, inventario, despacho y total coinciden entre storefront, Mercado Pago y Medusa.
- Reintentos y webhooks duplicados no duplican pedidos ni cobros.
- El negocio puede preparar el producto correcto y actualizar el pedido.
- Existen estados claros para pago exitoso, pendiente y fallido.
- No hay errores críticos de accesibilidad, seguridad o rendimiento conocidos.
- Las políticas, datos de contacto y condiciones de despacho están publicados.

## 13. Decisiones y preguntas abiertas

1. ¿Cuál es el nombre legal, RUT comercial, email, WhatsApp y dirección que deben publicarse?
2. ¿La cuenta de Mercado Pago ya está validada y dispone de credenciales de prueba para Checkout Pro?
3. ¿Existirá retiro o despacho gratis desde cierto subtotal?
4. ¿Cuáles son los plazos de producción y despacho?
5. ¿Qué atributos editoriales deben mostrarse para cada Biblia?
6. ¿Se controla stock real por variante?
7. ¿Qué reglas de cambios aplican a los productos?
8. ¿Se requiere boleta/factura, RUT y razón social en checkout?
9. ¿Qué dominio y proveedor de correo transaccional se usarán?
10. ¿El negocio autoriza reutilizar fotos, reseñas y textos de Instagram en el sitio?

## 14. Registro de decisiones

| Fecha | Decisión | Estado |
| --- | --- | --- |
| 2026-09-28 | Medusa para backend/admin y Astro para storefront | Confirmada |
| 2026-09-28 | Idioma `es-CL`, mercado Chile y moneda `CLP` | Confirmada |
| 2026-09-28 | Mercado Pago como medio de pago | Confirmada; modalidad pendiente |
| 2026-09-28 | Sin integración logística; tarifa de despacho cobrada | Confirmada; reglas pendientes |
| 2026-09-28 | Checkout invitado y flujo corto como prioridad | Propuesta para validar |
| 2026-09-28 | Checkout Pro como modalidad inicial de Mercado Pago | Confirmada |
| 2026-09-28 | Despacho RM $3.500; otras regiones $7.000 | Confirmada |
