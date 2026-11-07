# Hola, Milovan Darío

Recorrido para Milovan Darío creado por Hanyer Alegría y Ronald Villamán.
Alessandro Molina figura en Creadores como autor intelectual de la sorpresa.

## Abrirlo

Desde la carpeta del proyecto en **macOS**, con Node.js instalado:

```sh
npx --yes serve ./dist --listen tcp://127.0.0.1:3000
```

Desde **Símbolo del sistema (CMD)**:

```cmd
cd /d "E:\Proyectos\Milovan-Dario"
npx.cmd --yes serve .\dist --listen tcp://127.0.0.1:3000
```

Abre [127.0.0.1:3000](http://127.0.0.1:3000). Si el servidor ya estaba abierto, actualiza con Ctrl+F5. Mantén presionada la Poké Ball durante dos segundos con el ratón, con el dedo o con Espacio o Enter.
Después de la apertura, la página siempre empieza en el saludo.

## Archivos

- `dist/index.html` contiene la apertura, el saludo, las cartas de los creadores, Universidad Católica, League of Legends, TFT, el garaje y la dedicatoria.
- `dist/estilos.css` dibuja la Poké Ball en CSS y compone las capas, el saludo y las polaroids.
- `dist/apertura.js` gestiona la carga de dos segundos, su cancelación y la apertura.
- `dist/recorrido.js` sincroniza el desplazamiento con GSAP, ScrollTrigger y Lenis. La salida de Gastly empieza al cruzar `top bottom` en UCATO y se invierte al retroceder.
- `dist/escena.js` pausa el renderizado de Gastly cuando está oculto, la pestaña está en segundo plano o hay una carta abierta. Lo reactiva al volver, conservando la escena. El adaptador accede a Application mediante `_spline` en Spline Viewer 2.0.151; al actualizar esta versión se debe comprobar esta integración.
- `dist/lol.js` y `dist/lol.css` controlan la transición a League of Legends, la niebla y el final.
- `dist/cartas.js` gestiona los sobres y las cartas personales.
- `dist/garage.js` y `dist/garage.css` componen el garaje posterior al final: repisas 3D, cinco cajas y un visor con cierre mediante botón, Escape o clic fuera. Usa la instancia existente de Lenis y pausa/reinicia todos los videos al cerrar.
- `dist/tft.js` y `dist/tft.css` gestionan el encuentro prismático, el tablero, el chat y los recuerdos. El selector se prepara al cargar y aparece al entrar el capítulo al 75% del viewport; la elección conduce suavemente al tablero. Los pins anteriores se calculan primero mediante `refreshPriority`.
- `dist/imagenes/arena-amistad.svg` es una ilustración vectorial propia de 5.8 KB: plataforma de piedra, vegetación, antorchas y agua, inspirada en las [arenas oficiales de TFT](https://teamfighttactics.leagueoflegends.com/en-gb/news/game-updates/teamfight-tactics-patch-10-19-notes/) y esta [vista de Riot del tablero clásico](https://x.com/TFT/status/1855747270521901177). No requiere una escena WebGL adicional.
- `dist/modelos/gastly.splinecode` contiene los datos de escena incluidos en la [publicación de Gastly en Spline](https://my.spline.design/gastly-RIPW2bTfQrYzVrGwJKNEOVW7/). Se sirven desde la misma carpeta del proyecto para montarlos con Spline Viewer.
- `dist/imagenes/` contiene los retratos de Hanyer, Alessandro y Ronald y el [escudo del CDUC](https://commons.wikimedia.org/wiki/File:Escudo_Club_Deportivo_Universidad_Cat%C3%B3lica.svg). Las fotos originales se encuadran en CSS dentro de recuadros de igual tamaño.

Para publicar, sirve el contenido de `dist/` desde la raíz pública. Los CDN requieren conexión a internet.

## Medios del garaje

Las cajas muestran miniaturas inspiradas en la línea [GT Racing de Motormax](https://www.motormaxtoy.com/gt-racing). Los archivos de las miniaturas están en `dist/imagenes/garage/`.

Las cajas 01 y 03 abren fotos de `dist/imagenes/recuerdos/`. Las cajas 02, 04 y 05 abren clips de `dist/videos/`. Cada `.box-content` en `index.html` contiene el medio y su texto `.garage-caption`. El visor asigna la ruta `data-src` de cada video al abrir la caja y detiene la reproducción al cerrarla.

## Rendimiento del scroll

Los fondos se mezclan mediante la opacidad de capas fijas. La niebla usa texturas WebP con el efecto precalculado y anima únicamente su posición y opacidad. Se pausa fuera de su capítulo y al ocultar la pestaña. El escudo azul también está precalculado.

