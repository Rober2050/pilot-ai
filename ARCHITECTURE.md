# PILOTAI - Documentación Técnica y Arquitectura

Este documento describe la arquitectura técnica, el stack tecnológico y las decisiones de diseño de la plataforma PILOTAI. Sirve como guía para desarrolladores y arquitectos.

## 1. Stack Tecnológico

### Core
*   **Framework:** React 18
*   **Lenguaje:** TypeScript 5.x
*   **Build Tool:** Vite 5.x
*   **Estilos:** Tailwind CSS 3.x (con `clsx` y `tailwind-merge` para utilidades dinámicas)

### Servicios e Infraestructura
*   **Backend / Base de Datos:** Supabase (Postgres + Auth + Edge Functions)
*   **Inteligencia Artificial:**
    *   Claude Haiku 4.5 (Anthropic), siempre a través de la Edge Function `anthropic-proxy`
    *   Arquitectura de proveedores (`AIProvider` pattern) con un único proveedor activo: `AnthropicProvider`

### Librerías Clave
*   **Navegación:** `react-router-dom`
*   **Visualización de Datos:** `recharts` (Gráficos), `reactflow` (Diagramas de flujo interactivos), `mermaid` (Diagramas generados por código)
*   **Iconografía:** `lucide-react`
*   **Internacionalización:** `i18next`, `react-i18next`
*   **Exportación:** `jspdf` (PDF), `docx` (Word), `xlsx` (Excel), `pptxgenjs` (PowerPoint), `html-to-image`

## 2. Estructura del Proyecto

```
src/
├── ai/                     # Lógica específica de IA (Prompts, Protocolos)
│   ├── promptEngine.ts     # Generador de prompts estructurados
│   └── protocols.ts        # Definiciones de protocolos de agentes
├── components/             # Componentes de UI reutilizables
│   ├── dashboard/          # Componentes específicos de vistas de dashboard (Gantt, Riesgos)
│   ├── diagram/            # Componentes para diagramación (SmartDiagram, Nodos)
│   └── ui/                 # Componentes base (Botones, Cards, Inputs)
├── contexts/               # React Contexts (AuthContext, ThemeContext)
├── i18n/                   # Configuración de idiomas (locales JSON)
├── pages/                  # Vistas principales (Rutas)
│   ├── AdminConsole.tsx    # Panel de administración
│   ├── StrategyHub.tsx     # Módulo de Estrategia
│   └── ...
├── services/               # Lógica de negocio y comunicación con APIs
│   ├── ai/                 # Servicios de IA (AnthropicProvider, aiService, SynthesisAgent)
│   ├── export/             # Generadores de documentos (PDF, Excel, PPT)
│   └── firebase/           # Servicios de datos (Supabase Auth + Postgres; nombre heredado)
├── types/                  # Definiciones de tipos TypeScript (Interfaces globales)
└── utils/                  # Funciones de utilidad (Helpers, Formateadores)
```

## 3. Patrones de Arquitectura

### Capa de Servicios (Service Layer Pattern)
Toda la lógica de negocio y llamadas a APIs externas se encapsula en la carpeta `services/`. Los componentes de React (`components/` y `pages/`) **nunca** deben llamar directamente a la API de un proveedor de IA o a Supabase, sino invocar a los métodos de los servicios.
*   *Ejemplo:* `IntelligenceService.generateStrategy()` maneja la complejidad del prompt y la respuesta, el componente solo recibe los datos.

### Proveedores de IA (AI Provider Pattern)
La integración con IA está abstraída detrás de la interfaz `AIProvider`. Hoy la implementa solo `AnthropicProvider`, que nunca llama a Anthropic directamente: envía cada pedido (texto e imágenes/PDF adjuntos) al proxy `anthropic-proxy`, que guarda la API key como secreto y aplica cuotas. Sumar otro proveedor implica sumarlo también del lado del proxy, nunca con una key en el navegador.

### Componentes de Presentación vs. Contenedores
*   **Pages:** Actúan como contenedores. Gestionan el estado global de la vista y llaman a los servicios.
*   **Components:** Enfocados en la presentación. Reciben datos por `props` y emiten eventos. Son reutilizables.

## 4. Flujo de Datos (Data Flow)
1.  **Usuario** interactúa con la UI (ej: clic en "Generar Estrategia").
2.  **Componente** llama a un método del `Service` (ej: `intelligenceService.analyze()`).
3.  **Service** construye el prompt usando `promptEngine` y llama a la API de IA.
4.  **Service** recibe la respuesta (JSON/Texto), la procesa/limpia y la devuelve.
5.  **Componente** actualiza su estado y renderiza el resultado (Gráfico, Texto, Diagrama).

## 5. Guías de Desarrollo (Definition of Done)

Para considerar una nueva funcionalidad como "Terminada" (Done), debe cumplir:
1.  **Funcionalidad:** El código cumple con los requerimientos del usuario y no rompe funcionalidades existentes.
2.  **Código Limpio:** Sin logs innecesarios (`console.log`), tipos definidos (no `any`), y siguiendo el estilo del proyecto.
3.  **Documentación:**
    *   Si es un módulo nuevo, se debe agregar a `FEATURES.md`.
    *   Si cambia la arquitectura, se debe actualizar `ARCHITECTURE.md`.
4.  **Tests (Opcional/Futuro):** Si existen tests unitarios, deben pasar exitosamente.

---
*Última actualización: 02/12/2025*
