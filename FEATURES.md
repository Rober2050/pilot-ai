# PILOTAI - Manual Funcional y Características

Este documento detalla las funcionalidades clave de la plataforma PILOTAI, organizadas por módulo. Sirve como referencia para entender el alcance del producto.

## 1. Módulos Principales

### 🧠 Strategy Hub (Módulo de Estrategia)
Generador de planes estratégicos impulsado por IA.
*   **Input:** El usuario define objetivos, industria y recursos.
*   **Output:** Un plan completo que incluye:
    *   Resumen Ejecutivo.
    *   Análisis de Mercado.
    *   Estrategia Operativa y Tecnológica.
    *   KPIs sugeridos.
*   **IA:** Utiliza Gemini para analizar el contexto y proponer estrategias personalizadas.

### 📊 Planning Dashboard (Gestión de Proyectos)
Panel de control para Project Managers.
*   **Gantt Chart Interactivo:** Visualización de cronograma por fases y tareas. Cálculo dinámico de duración.
*   **Matriz de Riesgos:** Gráfico de dispersión (Impacto vs. Probabilidad) para identificar riesgos críticos.
*   **Finanzas:** Cálculo de costos estimados, burn rate y tamaño del equipo.
*   **Metodología:** Visualización de la metodología de cálculo (COCOMO II + PERT).

### 🔄 Process Editor (SmartDiagram)
Herramienta de diagramación inteligente.
*   **Generación Automática:** Crea diagramas de flujo a partir de descripciones de texto usando IA.
*   **Edición Visual:** Interfaz "Drag & Drop" (basada en React Flow) para ajustar nodos y conexiones.
*   **Tipos de Diagramas:** Flujogramas, Swimlanes (carriles por rol), Mapas Mentales.

### 👥 Role Panels (Paneles por Rol)
Vistas personalizadas según el perfil del usuario.
*   **Project Manager:** Acceso total a planificación y riesgos.
*   **Developer:** Vista técnica, stack tecnológico y tareas asignadas.
*   **Stakeholder:** Resúmenes ejecutivos y métricas de alto nivel.

### ⚙️ Admin Console
Panel de administración del sistema.
*   **Gestión de Usuarios:** Invitación por email, asignación de roles.
*   **Configuración:** Ajustes globales de la plataforma.

## 2. Capacidades Transversales

### 🤖 Inteligencia Artificial (Gemini Core)
*   **Análisis Contextual:** La IA "entiende" el proyecto completo para dar respuestas coherentes en todos los módulos.
*   **Generación de Contenido:** Redacción de textos, listas de tareas, riesgos y código.

### 📄 Exportación y Reportes
Capacidad de extraer la información de la plataforma en formatos estándar:
*   **PDF:** Reportes ejecutivos y One-Pagers.
*   **Excel (.xlsx):** Tablas de costos, tareas y cronogramas.
*   **Word (.docx):** Documentos de especificación funcional.
*   **PowerPoint (.pptx):** Presentaciones de estrategia generadas automáticamente.
*   **Imágenes:** Exportación de diagramas y gráficos como PNG.

## 3. Roles de Usuario
*   **Admin:** Control total del sistema.
*   **Project Manager:** Gestión de planes y equipos.
*   **Editor:** Puede modificar diagramas y textos.
*   **Viewer:** Solo lectura (para clientes o stakeholders).

---
*Última actualización: 02/12/2025*
