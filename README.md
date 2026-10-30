# Simulador Pitot-Static

Plataforma educativa de diagnóstico de fallas para un proyecto integrador de mantenimiento aeronáutico. HTML, CSS y JavaScript puro. No requiere instalación ni claves de API.

## Empezar en tu computadora

1. Descomprime el ZIP completo (no abras los archivos dentro del ZIP).
2. Abre `index.html` con Chrome, Edge o Firefox.
3. Abre `LEEME.html` para ver la guía de publicación.

## Publicar en GitHub Pages

**Subir el ZIP como un único archivo no publica la página.** Primero descomprímelo y sube su contenido.

1. Inicia sesión en GitHub y crea un repositorio público, por ejemplo `simulador-pitot-static`. En el plan gratuito, el repositorio público permite usar Pages.
2. En el repositorio elige **Add file → Upload files**.
3. Arrastra los archivos y las carpetas del proyecto. `index.html` debe aparecer directamente en la raíz del repositorio, al mismo nivel que `styles.css` y `app.js`. Conserva la carpeta `assets` con sus imágenes dentro.
4. Pulsa **Commit changes** para guardar. Si todavía no había archivos, se creará normalmente la rama `main`.
5. Abre **Settings → Pages**. En **Build and deployment**, elige **Deploy from a branch**.
6. Selecciona la rama **main** y la carpeta **/(root)**. Pulsa **Save**.
7. Espera a que termine la publicación. En esa misma pantalla GitHub mostrará el enlace de tu sitio. La primera publicación puede tardar varios minutos.

Si aparece un 404, comprueba que el archivo se llame exactamente `index.html`, que esté en la raíz y que la rama seleccionada sea la que contiene los archivos. No hace falta usar terminal, instalar Node.js ni contratar un servidor.

Documentación oficial: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Funciones

- Instrumentos analógicos SVG y lecturas numéricas conectados al modelo de presiones.
- Referencia de velocidad: 0–220 kt. Altitud: 0–18000 ft. Velocidad vertical: −2000 a +2000 ft/min.
- Vuelo temporal con inicio, pausa, nivelado y límite de altitud. Al salir del simulador o cambiar de pestaña se pausa automáticamente.
- Sistema normal, entrada Pitot obstruida con drenaje libre, Pitot y drenaje obstruidos, toma estática obstruida, y fuga de línea estática.
- Vista ilustrativa de aeronave con marcadores de falla, orientación de ascenso/descenso e inspección de tomas. Es una imagen 2D, no un modelo 3D manipulable.
- Circuito SVG que cambia con la falla y muestra presiones calculadas. La presión total alimenta solo al anemómetro; la estática, a los tres instrumentos.
- Tres casos guiados con falla oculta hasta responder.
- Comprobación del diagnóstico con explicación. Un intento por caso/activación de falla para evitar duplicados.
- Historial local de hasta 200 intentos, resumen y descarga CSV.
- Diseño adaptable a pantallas pequeñas y navegación con teclado.

## Probar una falla

Selecciona **Sistema normal**, ajusta 110 kt y 3500 ft. Activa **Toma estática obstruida**. Cambia la altitud a 3700 ft: el altímetro seguirá marcando 3500 ft, el VSI indicará cero y el anemómetro mostrará menos de 110 kt. También puedes poner +500 ft/min y pulsar **Iniciar vuelo** para observarlo gradualmente.

Al activar una obstrucción se capturan las presiones de ese instante. Para capturar otra condición, vuelve a **Sistema normal** y reactiva la falla. Reiniciar restablece las condiciones iniciales del escenario y captura de nuevo la presión.

## Modelo y límites

`physics.js` contiene el modelo independiente. `app.js` contiene interacción, instrumentos, prácticas y resultados. `styles.css` controla el diseño. `index.html` contiene la estructura. `assets/aircraft.png` es una ilustración generada a partir del boceto de referencia.

- Atmósfera ISA troposférica: Ps = 101325 × (1 − 2,25577×10⁻⁵ × h_m)^5,25588.
- QNH fijo 1013,25 hPa. La entrada de altitud es una altitud de referencia ISA.
- La entrada de velocidad representa IAS ideal equivalente, no TAS. Se calcula q = ½ρ₀V², con ρ₀ = 1,225 kg/m³, V en m/s y Pt = Ps + q. Se omiten errores de posición, compresibilidad y calibración.
- El ASI se obtiene de sqrt(max(0, 2(Pt−Ps)/ρ₀)). Una diferencia negativa se limita a cero y genera aviso. Si se supera la escala de 220 kt, la aguja se limita, pero la lectura numérica conserva el cálculo.
- Pitot bloqueado y drenaje libre: la presión Pitot se iguala a Ps exterior; ASI = 0.
- Pitot y drenaje bloqueados: Pt queda atrapada al activar la falla. El ASI cambia con Ps exterior y no responde a cambios aislados de velocidad.
- Toma estática bloqueada: Ps queda atrapada. Altitud fija, VSI estabilizado = 0, ASI afectado por la nueva Pt exterior.
- Fuga estática: modelo de línea abierta a una cabina con presión inferior a la exterior, con diferencia ajustable 0–500 Pa. No es un valor medido ni aplicable a una aeronave específica. Se calcula la altitud desde esa presión y el VSI mediante la derivada de esa altitud indicada.
- El VSI es estabilizado, sin retardo mecánico ni transitorio de bloqueo. Cambiar manualmente la altitud establece una condición nueva, no simula un salto físico ni genera por sí solo una velocidad vertical.
- La integración temporal usa la velocidad vertical seleccionada. En pausa se ve la indicación estabilizada correspondiente a la condición configurada, aunque no avance el reloj.
- Una sola falla a la vez. No incluye clima, fuente estática alterna, calentamiento Pitot ni pruebas de mantenimiento con tolerancias certificadas.

Es un prototipo didáctico para entrenamiento conceptual; no reemplaza documentación de aeronave ni un equipo de prueba real.

## Fuentes técnicas

- FAA, Pilot’s Handbook of Aeronautical Knowledge, capítulo 8: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/phak/10_phak_ch8.pdf
- FAA, AC 91-43, Unreliable Airspeed Indications: https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC_91-43.pdf

Las fuentes sustentan los principios y los efectos de obstrucción. La fuga ajustable y la interfaz son decisiones de este modelo educativo.

## Validación

Pruebas del modelo: `node tests/model.test.cjs` (Node.js es opcional y solo se necesita para ejecutar las pruebas). Incluyen conversión presión/altitud, comportamiento normal, las cuatro fallas, presión atrapada, señales negativas y límites de entradas. La interfaz se comprobó en navegador para cambios numéricos, obstrucción estática, circuito, evaluación y registro de resultados.

## Datos

Los resultados se guardan en `localStorage` del navegador; no hay cuentas, base de datos remota ni envío de datos. En modo privado o con restricciones pueden perderse al cerrar; usa el CSV para conservarlos. Los datos no se comparten entre navegadores o dispositivos.

## Actualización 1.1 · detalles de tomas

Al seleccionar Entrada Pitot obstruida, aparece automáticamente un recuadro lateral con una imagen de acercamiento y un círculo sobre la entrada. La línea llega al extremo abierto del Pitot bajo el ala de la aeronave ilustrada. Para Pitot y drenaje obstruidos, la versión 1.2 utiliza una imagen propia con ambos orificios tapados y señalados por separado.

Al seleccionar Toma estática obstruida, el recuadro cambia al disco de la toma y su orificio central. La línea señala el puerto del lateral delantero del fuselaje, detrás del carenado del motor y antes de la puerta. Los marcadores se ajustan con el tamaño de pantalla y rotan junto a la imagen durante el ascenso/descenso.

Los detalles de falla se ocultan en los casos guiados hasta responder, y en la vista Circuito. Seleccionar de nuevo una falla de obstrucción vuelve automáticamente a la vista Aeronave. El sistema normal no muestra un recuadro de falla. La fuga estática no se representa como una obstrucción de la toma exterior.

Archivos nuevos: `assets/aircraft-v2.png`, `assets/pitot-detail.png` y `assets/static-detail.png`. Son ilustraciones generadas, no fotografías de una aeronave específica. La obstrucción se indica con anotaciones superpuestas. Las posiciones se basan en la distribución de un entrenador de ala alta, con Pitot bajo el ala izquierda y toma estática en el lateral izquierdo delantero; los detalles de instalación varían por aeronave. Referencia de distribución: Cessna 172S POH, sección 7, Pitot-Static System and Instruments: https://www.flygoodyear.com/images/downloads/Cessna%20CE-172SP%20POH.pdf .

## Actualización 1.2 · doble obstrucción y recorrido de fuga

- **Pitot y drenaje obstruidos:** imagen propia `assets/pitot-dual-blocked.png`, con la entrada frontal y el drenaje inferior de humedad obturados. Dos círculos, flechas y rótulos indican 1 (entrada) y 2 (drenaje). El recuadro lateral se une al tubo bajo el ala. La selección utiliza una clave propia para cambiar de imagen incluso al pasar directamente desde Entrada Pitot obstruida.
- **Fuga en línea estática:** en la vista Aeronave se superpone una tubería azul desde la toma exterior hasta el panel en la cabina; un punto ámbar y una flecha señalan la fuga. El recuadro lateral explica la alimentación estática del anemómetro, altímetro y VSI. La toma permanece libre: la falla se sitúa en la línea. El recorrido es una representación didáctica sobre la imagen, no un trazado de instalación certificado de una aeronave específica. La imagen, la tubería y las marcas rotan juntas.
- Los detalles nuevos se ocultan en los casos guiados hasta responder. La vista Circuito conserva su esquema funcional. Seleccionar cualquiera de estas fallas vuelve a la vista Aeronave. El modelo de presiones y los controles de vuelo se mantienen.
