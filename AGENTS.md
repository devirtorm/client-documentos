# Project Instructions: Client Documentos (Angular)

## Objetivo
Mantener la consistencia arquitectónica del cliente frontend de documentos, respetando sus particularidades, su pila tecnológica (Angular 22) y convenciones propias establecidas.

## 🛠 Convenciones Estrictas del Proyecto (NO VIOLAR)

### 1. Nomenclatura de Archivos (Fundamental)
- **NO DEBES** usar las extensiones tradicionales de Angular como `.component.ts` o `.service.ts`.
- Los componentes, directivas, pipes y servicios en este proyecto se nombran utilizando **exclusivamente la extensión `.ts`**.
- Ejemplos correctos: `lista-articulos.ts` (Componente), `articulos.ts` (Servicio), `carrito-db.ts` (Servicio).

### 2. Base de Datos Local y Offline
- Para persistencia de datos local compleja o funcionalidad offline en el navegador (como el carrito de compras), se utiliza **IndexedDB** a través de la librería **Dexie** (`carrito-db.ts`).

## 🧠 Arquitectura Base y Skills Globales a utilizar
Para cualquier cambio estructural o de componentes, aplica las reglas descritas en las siguientes Skills globales (disponibles en `.agents/skills/`):
- `angular-architecture` (Standalone components, Lazy Loading, `inject()`).
- `angular-signals-rxjs` (Signals para estado, RxJS para eventos).
- `spartan-ui-tailwind` (Componentes base, clases utilitarias).

## Antes de modificar código
1. Inspecciona la estructura existente bajo `src/app`.
2. Identifica si el feature actual requiere persistencia con Dexie o solo consultas a la API.
3. Busca componentes ya creados en `shared` o de Spartan UI antes de crear uno nuevo desde cero.

## Git y Calidad
- Ejecutar tests relacionados (si existen) después de cada cambio lógico importante.
- Revisar el diff. No borrar configuraciones o imports existentes necesarios.
