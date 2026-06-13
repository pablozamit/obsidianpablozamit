# Principios de publicidad creativa

# Casos de Estudio (2026)

Colección de análisis campaña por campaña. Cada entrada incluye: (1) JSON descriptivo para replicación texto-a-imagen, y (2) análisis creativo publicitario con el principio extraído.

---

## BIC Permanent Marker — "Jimi Hendrix"

### 1. JSON Descriptivo (Prompt para texto-a-imagen)

```json
{
  "scene": {
    "type": "Fotografía publicitaria editorial, estilo documental",
    "setting": "Interior doméstico cálido, cortina con estampado ikat desenfocada al fondo",
    "lighting": "Luz natural cálida, suave, temperatura de color anaranjada",
    "camera": {
      "framing": "Plano medio corto, rostro cortado por encima de los labios rojos",
      "focus": "Foco nítido en la piel y el autógrafo, fondo ligeramente desenfocado",
      "lens": "50-85mm, ligera profundidad de campo"
    }
  },
  "subject": {
    "person": "Mujer de aproximadamente 75-80 años, complexión delgada, piel muy arrugada y bronceada por el sol, hombros y escote expuestos",
    "hair": "Cabello teñido rojo-anaranjado, parcialmente visible en el borde superior",
    "lips": "Labios con pintalabios rojo intenso, apenas visibles en el borde superior del encuadre",
    "clothing": "Sujetador de encaje blanco-lavanda con tirantes finos blancos, ajustado",
    "accessories": "Pendientes colgantes de piedra verde esmeralda con engaste dorado",
    "pose": "Mano derecha en la cadera con actitud segura, brazo izquierdo relajado a un lado, postura desenfadada y desafiante"
  },
  "key_visual_element": {
    "autograph": {
      "text": "Jimi Hendrix",
      "style": "Firma autógrafa manuscrita con trazos fluidos de marcador permanente negro",
      "location": "Escrito directamente sobre la piel del pecho izquierdo/escote superior",
      "condition": "Legible y oscura, ligerísimamente envejecida pero perfectamente intacta"
    }
  },
  "product_placement": {
    "product": "Rotulador BIC Permanent Marker",
    "appearance": "Cuerpo negro, capuchón naranja, logo BIC blanco visible",
    "position": "Esquina superior derecha de la imagen, superpuesto como pack-shot flotante",
    "size": "Pequeño respecto al encuadre, discreto pero claramente identificable"
  },
  "art_direction": {
    "palette": "Tonos cálidos: cremas, naranjas, dorados, con contraste del negro de la firma y el marcador",
    "mood": "Irónico, provocador, humorístico, ligeramente transgresor",
    "texture": "Énfasis en la textura de la piel envejecida como evidencia del paso del tiempo"
  },
  "text_overlays": "Ningún copy adicional. El anuncio es puramente visual salvo la firma y el producto."
}
```

### 2. Análisis Creativo

#### ¿Por qué es un gran anuncio?

La campaña comunica **un único beneficio —la permanencia del marcador—** sin necesitar ni una sola palabra de copy. La firma de **Jimi Hendrix** (fallecido en **1970**) sobre el pecho de una mujer que claramente fue joven en los años 60-70 implica que esa tinta lleva **más de 30-40 años** sobre su piel. La arrugada textura del paso del tiempo es la prueba irrefutable.

#### Principio creativo: **"Demostración Hiperbólica del Beneficio"** *(Extreme Product Truth)*

Se toma la promesa central del producto ("permanente") y se lleva a una **consecuencia absurda, narrativa y verificable visualmente**: la tinta ha sobrevivido décadas sobre piel viva. No se exagera con palabras; se **demuestra con una historia condensada en una sola imagen**.

**Elementos que lo potencian:**
- **Storytelling implícito**: el espectador reconstruye mentalmente la escena original (una joven fan pidiendo un autógrafo a Hendrix en un concierto), lo que genera engagement cognitivo.
- **Humor y transgresión**: la provocación controlada (una anciana en sujetador, la connotación de groupie) genera memorabilidad.
- **Sin copy**: la confianza de prescindir de texto amplifica la percepción de marca inteligente.
- **Producto mínimo**: el marcador BIC aparece pequeño y en esquina; no necesita gritar.

#### Pregtaaaaaaaaxiomática para cualquier marca:

> **"¿Cuál es la consecuencia más extrema, absurda o inesperada de que mi producto cumpla perfectamente su promesa durante muchísimo tiempo... y cómo puedo mostrarla en una sola imagen sin explicarla?"**

---

## Carlsberg — "Probably the best ad in the world" (Destapador de papel)

### 1. JSON Descriptivo (Prompt para texto-a-imagen)

```json
{
  "format": "Publicación impresa full-page, diseño editorial minimalista",
  "canvas": {
    "background": "Papel blanco mate con textura visible de dobleces y arrugas verticales y horizontales, simulando una hoja de periódico o revista previamente doblada en cuadrícula",
    "border": "Marco sólido de color verde Carlsberg (#00A651 o similar) de aproximadamente 15-20px de grosor en los cuatro lados",
    "texture_details": "Sombras sutiles en los pliegues verticales centrales y horizontales, creando efecto 3D de papel físicamente manipulado"
  },
  "typography_hierarchy": [
    {
      "text": "Probably the best ad in the world.",
      "position": "Tercio superior centrado",
      "style": "Sans-serif bold, color verde Carlsberg, tamaño grande (aprox 48pt), alineación centrada",
      "note": "Reemplaza temporalmente al claim clásico de la marca"
    },
    {
      "text": "Probably the best beer in the world.",
      "position": "Parte inferior izquierda-centro",
      "style": "Sans-serif regular, color verde Carlsberg, tamaño mediano (aprox 24pt)"
    },
    {
      "text": "Or watch the film on www.probablythebestadintheworld.be",
      "position": "Centro de la página, debajo de las instrucciones",
      "style": "Sans-serif light, color gris oscuro o verde atenuado, tamaño pequeño (aprox 12pt)"
    },
    {
      "text": "Beer brewed carefully, to be consumed with care",
      "position": "Esquina inferior izquierda, muy pequeño",
      "style": "Sans-serif light, color gris, tamaño micro (aprox 8pt)"
    }
  ],
  "visual_instructions": {
    "style": "Ilustraciones lineales monocromáticas en verde Carlsberg o gris oscuro, estilo técnico/diagramático, trazos finos y limpios",
    "sequence": "Cinco pasos distribuidos horizontalmente en el centro de la página",
    "steps": [
      {
        "icon": "Silueta de botella de cerveza al lado de un rectángulo vertical representando la página",
        "caption": "tear this page out",
        "position": "Izquierda"
      },
      {
        "icon": "Dos manos estilizadas doblando un rectángulo horizontalmente",
        "caption": "fold horizontally along line",
        "position": "Centro-izquierda"
      },
      {
        "icon": "Dos manos doblando el rectángulo ya doblado por la mitad nuevamente",
        "caption": "fold double",
        "position": "Centro"
      },
      {
        "icon": "Mano usando el papel doblado como palanca bajo la chapa de una botella",
        "caption": "use as lever",
        "position": "Centro-derecha"
      },
      {
        "icon": "Botella de pie junto al papel doblado en forma de V (destapador resultante)",
        "caption": "enjoy your Carlsberg",
        "position": "Derecha"
      }
    ]
  },
  "logo": {
    "brand": "Carlsberg",
    "position": "Esquina inferior derecha",
    "style": "Logo clásico de Carlsberg en verde con la hoja de lúpulo integrada en la tipografía estilo serif tradicional",
    "size": "Mediano, prominente pero no dominante"
  },
  "color_palette": {
    "primary": "Verde Carlsberg (#00A651)",
    "secondary": "Blanco roto/papel (#F5F5F0)",
    "accents": "Gris oscuro para sombras de dobleces (#333333)"
  },
  "interactive_elements": {
    "physical_utility": "El diseño incluye líneas punteadas o guías implícitas de perforación/doblado que permiten físicamente al lector recortar la página y seguir las instrucciones para crear un destapador funcional de papel",
    "call_to_action_dual": "Uso físico del papel vs. visita digital al sitio web"
  }
}
```

### 2. Análisis Creativo

#### ¿Por qué es un gran anuncio?

Este anuncio **transcende la publicidad tradicional para convertirse en un objeto útil**. No pide atención pasiva; exige **acción física** (destruir el anuncio para usarlo). Al hacer que el lector rasgue, doble y transforme el papel en una herramienta funcional (un destapador), Carlsberg logra:

1. **Permanencia física**: La gente conserva el anuncio porque ahora es un utensilio de cocina/bar, no basura publicitaria.
2. **Engagement táctil**: La interacción crea un recuerdo motor y emocional más fuerte que cualquier impresión visual.
3. **Coherencia brand-centric**: El destapador es el ritual previo indispensable para consumir la cerveza, posicionando a Carlsberg como facilitador de la experiencia completa.

#### Principio creativo: **"La Funcionalización del Medio"** *(The Medium as a Tool)*

Basado en la máxima de McLuhan pero llevado a la utilidad pragmática: **el soporte publicitario no es un mensaje, es una herramienta**. El papel deja de ser un lienzo pasivo para convertirse en el producto mismo. El anuncio juega ironía con su propia grandiosidad ("Probably the best ad") mientras humildemente se ofrece como objeto desechable-transformable.

**Elementos que lo potencian:**
- **Simplicidad ingenieril**: No requiere tecnología, solo origami básico.
- **Shareability analógica**: La gente muestra el destapador físico a amigos mientras abren cervezas juntos.
- **Transgresión controlada**: Destruir una publicidad de lujo va contra el instinto, creando una "transgresión permitida" placentera.

#### Pregtaaaaaaaaxiomática para cualquier marca:

> **"¿Cómo puedo convertir el soporte físico o digital donde aparece mi publicidad en una herramienta, experiencia o objeto que mi cliente necesite realmente usar en el momento preciso de consumir mi producto, de tal manera que sin mi anuncio, no pueda acceder fácilmente a lo que vendo?"**

---

## Metáfora

### Mezcla de 'enemigo' + víctima:

![[Pasted image 20240928085604.png]]
### Producto mezclado otro concepto con connotaciones positivas / relevancia temporal o cercanía psicológica:

![[Pasted image 20240208091022.png]]
![[Pasted image 20240214073253.png]]
### Representa la cualidad del producto, exagérala:

![[Pasted image 20240208091338.png]]

### Representa visualmente una idea con tu producto

![[Pasted image 20240214072333.png]]

![[Pasted image 20240914132217.png]]
# El peor escenario

Este principio muestra el peor escenario posible por no usar el producto o servicio, a menudo con un toque de humor o exageración:

![[Pasted image 20240208083735.png]]

En este ejemplo, vemos que se está vendiendo una caja de juguetes para gatos... ¿qué ocurre si no la tienes? Que los gatos tienden a jugar con lo que tienen alrededor. Y una de las cosas más molestas es que te desordenen la [[ropa]] (sutilmente, vemos que el anuncio está dirigido a mujeres).

Extra: el desastre se ha convertido en el mensaje.
Extra: el mensaje es un juego de palabras, una expresión común sobre los gatos; aporta familiaridad, algo reconocible pero en un contexto distinto donde adquiere un sentido nuevo.



# El mejor escenario


## Asocia tu producto al mejor escenario:

![[Pasted image 20240214073617.png]]
# Transparencia

Este principio hay muchas formas de usarlo: puede consistir en admitir un error real (estar de acuerdo con las críticas), o partir de una crítica y desprestigiarla (como hace tan bien Luis Monge Malo).

Una forma original de usarla es usar una falsa crítica:

![[Pasted image 20240208084135.png]]

Estas camisetas son tan buenas que el cliente no puede dejar de comprarlas y eso se convierte en algo malo.

En parte, funciona porque las reseñas de 5 estrellas ya no nos llaman la atención, porque asumimos que muchas pueden ser falsas. Algo 'perfecto' siempre suena a 'falso'.

# Comparaciones

## Antes vs después

![[Pasted image 20240208090710.png]]


## Fácil vs difícil o mejor vs peor

La gente compra lo conveniente y lo fácil: prefieren una pastilla que les relaja a aprender a meditar en 8 semanas.

Muestra la comparación:

![[Pasted image 20240208084308.png]]


![[Pasted image 20240208090741.png]]
![[Pasted image 20240208091039.png]]



## Las X diferencias

![[Pasted image 20240208090812.png]]
Especialmente efectivo si es la persona la que deduce el significa sin que se lo digas.


# Somos tan buenos que...

## 200% mejor

Estamos acostumbrados a que las marcas compitan en un sector, por lo que no nos sorprendería que Ford dijese ser mejor que Renault y viceversa.

Una forma de salir de este juego es declararte superior a productos o servicios de distintos nichos:

![[Pasted image 20240208084500.png]]

Mejor que un camión, mejor que un coche deportivo.

## Sirve para todo


Adidas:

![[Pasted image 20240208084738.png]]

Extra: utiliza jerga relacionada con su público objetivo: deportistas.

## Estamos en otra liga

![[Pasted image 20240214074638.png]]



# Acertijo

También llamado 2+2=?:

## Acertijo con historia: ¿qué ha ocurrido?

![[Pasted image 20240208090945.png]]

## Elimina una variable y deja que deduzcan

![[Pasted image 20240214072926.png]]
# Jerga

![[Pasted image 20240208084529.png]]

Al usar jergas, nuestro cliente potencial nos reconocerá en seguida; este anuncio funciona porque permite a ese cliente potencial diferenciarse, compararse con los demás y sentirse mejor. La revista Times basa muchos de sus anuncios precisamente en eso:

# Cruce de medios / formatos

![[Pasted image 20240310111216.png]]

![[Pasted image 20240208084635.png]]

En este caso, imita la estructura de una noticia de última hora.

![[Pasted image 20240208091402.png]]

![[Pasted image 20240208091424.png]]


![[Pasted image 20240216090734.png]]

# El efecto Pratfall

Cuando un pequeño error o defecto te hace ser visto como alguien más perfecto todavía, más humano, mejor:

![[Pasted image 20251106122905.png]]


# Hackeo de interfaz

![[Pasted image 20251106121701.png]]


# Reenmarcar el precio

Especial para productos de precio alto.

Se puede reenmarcar de varias formas, por ejemplo resaltando las características premium:

![[Pasted image 20240208090323.png]]


Otra forma es reenmarcarlo por comparación:

![[Pasted image 20240208090244.png]]

# Resignificar frases comunes

![[Pasted image 20240208090200.png]]

"Lo bueno se hace esperar. Lo mejor se hace esperar 1.000 millones de años"

![[Pasted image 20240914132432.png]]

![[Pasted image 20240914132459.png]]
# Mostrar el resultado

![[Pasted image 20240208090408.png]]


Puede combinarse con metáforas (mostrar el producto + el resultado):

![[Pasted image 20240208090554.png]]

![[Pasted image 20240914132056.png]]


# Eficiencia (mejorar nombre)

Paso 1: Dales algo muy grande. (Todas las canciones que has tenido)

Paso 2: Dales algo muy pequeño. (En tu bolsillo)

![[Pasted image 20240208090526.png]]



# Inversión de la realidad

![[Pasted image 20240208091115.png]]

Normalmente, los perros sacan la cabeza fuera del coche para sentir el aire; este aire acondicionado es tan bueno que ocurre al revés.



# Crea algo que compartir

![[Pasted image 20240214073037.png]]



# Ganchos perfectos

![[Pasted image 20240928083933.png]]
