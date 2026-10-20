# Regresión y árboles de decisión

Aplicación educativa de Inteligencia Artificial para estimar, clasificar y explicar cuatro modelos con datos propios:

1. Regresión lineal simple, por mínimos cuadrados.
2. Regresión lineal múltiple, por factorización QR de Householder.
3. Regresión logística binaria, por Newton-Raphson.
4. Árboles de decisión, con entropía o índice de Gini.

La interfaz sigue el patrón del proyecto de Investigación de Operaciones del mismo semestre: Vite, React, TypeScript, Tailwind y una pantalla oscura por módulo. Los algoritmos viven en `src/core` y no dependen de una librería de aprendizaje automático.

La referencia académica es el documento *Regresión lineal, regresión múltiple, regresión logística y árboles de decisión* (Rueda, Guevara y Colina, FESC, octubre de 2026). Los doce ejercicios conservan sus datos. Los ejercicios 4.1 y 4.3 evalúan un modelo que el enunciado ya trae escrito; la calculadora, en cambio, entrena por máxima verosimilitud. Esa diferencia queda indicada en el ejercicio.

## Requisitos

- Node.js 20 o superior.

## Instalación y ejecución

```bash
npm install
npm run dev
```

Abre la dirección que muestra Vite, normalmente `http://localhost:5173`.

## Pruebas

```bash
npm test
```

Comprueba los doce ejercicios del documento, los casos que deben rechazarse (una sola clase, columna constante, colinealidad, umbral inválido) y las operaciones de la tabla.

## Compilación

```bash
npm run build
npm run preview
```

## Publicación

La aplicación es un sitio estático. No usa variables de entorno ni claves de API: los cuatro modelos se calculan en el navegador.

`vercel.json` indica a Vercel que el proyecto es Vite, que la salida queda en `dist` y que cualquier ruta de la interfaz vuelva a `index.html`. Así funcionan las direcciones de cada módulo al recargar la página.

## Estructura

- `src/core`: cuentas, validaciones y modelos.
- `src/content`: teoría, ejercicios y preguntas de práctica.
- `src/components`: tablas, gráficas, árbol y paneles.
- `src/pages`: inicio, cuatro módulos, comparación y laboratorio.
- `scripts/verify-modulos.ts`: pruebas numéricas.

## Limitaciones

- La logística es binaria. No hay regresión multinomial.
- El árbol no hace la poda de costo-complejidad después de crecer. La profundidad y los mínimos de observaciones cortan el crecimiento antes.
- Las variables categóricas abren una rama por valor. Las numéricas usan un umbral.
- La semilla solo interviene si dos divisiones empatan. Sin semilla, el desempate es determinista.
- Si las clases quedan perfectamente separadas, Newton-Raphson se detiene y explica el problema en lugar de devolver coeficientes enormes como si hubieran convergido.
- Las pruebas t y F son una lectura clásica del ajuste, no un diagnóstico completo de los supuestos.
