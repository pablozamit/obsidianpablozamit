# Ryanair — "Pizza vs Pisa"

> **Principio:** [[El Ancla de Precio por Categoría Sustitutiva]]  
> **Etiquetas:** #publicidad #caso-estudio #Ryanair #turismo

---

## 1. JSON Descriptivo

```json
{
  "canvas": {
    "format": "Publicidad digital vertical (3:4 ratio, ~900x1200px)",
    "background": {
      "color": "#1B3D9F (azul cobalto corporativo Ryanair, profundo y saturado)",
      "texture": "Plano sólido, sin ruido ni gradiente, mate absoluto"
    }
  },
  "composition_layout": {
    "grid": "Dos columnas simétricas en el tercio superior-medio, elemento central 'vs', copy inferior, logo base",
    "vertical_distribution": [
      {"zone": "Top label + price", "y_range": "15%-32%"},
      {"zone": "Pizza boxes hero", "y_range": "30%-68%"},
      {"zone": "vs. separator", "y_range": "48%-55%"},
      {"zone": "Tagline copy", "y_range": "72%-82%"},
      {"zone": "Ryanair logo", "y_range": "85%-95%"}
    ]
  },
  "left_column": {
    "label": {
      "text": "PIZZA",
      "position": {"x": 0.28, "y": 0.18},
      "style": {
        "font": "Sans-serif condensed bold (tipo Futura Bold o DIN Condensed)",
        "color": "#FFFFFF",
        "size": "~22pt",
        "case": "ALL_CAPS",
        "tracking": "wide (+80)"
      }
    },
    "price": {
      "text": "$19.99",
      "position": {"x": 0.28, "y": 0.23},
      "style": {
        "font": "Sans-serif extra-bold/black",
        "color": "#FFFFFF",
        "size": "~42pt",
        "weight": "900"
      }
    },
    "visual_element": {
      "object": "Caja de pizza abierta tipo delivery, vista desde ángulo oblicuo superior (45° tilt, 3/4 view)",
      "position": {"x": 0.25, "y": 0.50},
      "box_details": {
        "exterior_base": "Cartón corrugado color kraft beige (#C4956A), con esquinas hexagonales características caja pizza americana",
        "exterior_sides": "Blanco mate liso con bordes kraft visibles en los pliegues",
        "interior_lid": "Kraft marrón uniforme, visible porque la tapa está abierta hacia atrás (hinged open 120-140 degrees)",
        "lid_interior_texture": "Cartón liso sin impresión (detalle realista: manchas sutiles de vapor/grasa opcional)",
        "box_shadow": "Sombra suave difusa bajo la caja (#0D2878 40% opacity) sobre fondo azul"
      },
      "pizza_content": {
        "type": "Pizza redonda estilo delivery, generosa, apetecible",
        "diameter": "~75% del ancho interior de la caja",
        "position": "Ligeramente off-center hacia el frente de la caja",
        "crust": "Corteza dorada gruesa tipo New York, color dorado-tostado (#C8892A) con marcas de horno",
        "sauce": "Salsa de tomate visible en los espacios entre toppings, rojo intenso (#CC2200)",
        "toppings": [
          "Queso mozzarella fundido con manchas doradas de gratinado (#F0D060)",
          "Champiñones laminados marrón claro dispersos",
          "Jamón o proteína rosada visible bajo el queso"
        ],
        "surface_lighting": "Highlight especular blanco-cálido en parte superior izquierda de la pizza"
      }
    }
  },
  "center_element": {
    "text": "vs.",
    "position": {"x": 0.50, "y": 0.51},
    "style": {
      "font": "Serif clásica o sans-serif bold (contraste elegante)",
      "color": "#FFFFFF",
      "size": "~32pt",
      "weight": "700"
    }
  },
  "right_column": {
    "flight_indicator": {
      "airplane_icon": {
        "type": "Silueta simplificada de avión comercial (Boeing 737 estilo Ryanair)",
        "position": {"x": 0.68, "y": 0.15},
        "orientation": "Viajando de izquierda a derecha, inclinado ~15° ascendente",
        "color": "#FFFFFF (blanco sólido, estilo pictograma flat)"
      },
      "route_labels": {
        "origin": {
          "text": "LONDON",
          "position": {"x": 0.64, "y": 0.19},
          "style": {
            "font": "Sans-serif condensed bold",
            "color": "#FFD700 (amarillo Ryanair)",
            "size": "~18pt",
            "case": "ALL_CAPS"
          }
        },
        "destination": {
          "text": "PISA",
          "position": {"x": 0.78, "y": 0.19},
          "style": "Idéntico a LONDON"
        }
      }
    },
    "price": {
      "text": "$19.99",
      "position": {"x": 0.73, "y": 0.23},
      "style": {
        "font": "Sans-serif extra-bold/black",
        "color": "#FFD700 (amarillo Ryanair, diferenciador clave vs precio pizza en blanco)",
        "size": "~42pt",
        "weight": "900"
      }
    },
    "visual_element": {
      "object": "Caja de pizza vacía abierta, misma forma y ángulo que la izquierda",
      "position": {"x": 0.75, "y": 0.50},
      "box_details": {
        "exterior":lop: "Idéntico al box izquierdo (kraft + blanco) para crear simetría de contenedor",
        "content": "VACÍA de pizza",
        "interior_illustration": {
          "what": "Torre de Pisa dibujada/ilustrada/grabada directamente sobre el cartón kraft interior como si fuera un sello o ilustración en el propio cartón",
          "style": "Ilustración lineal tipo grabado antiguo/engraving, líneas finas y detalladas en tinta sepia oscura (#5C3A1E) sobre fondo kraft",
          "tower_details": {
            "structure": "Torre de Pisa con su característica inclinación (~5.5° visible) claramente exagerada para reconocimiento instantáneo",
            "architectural_details": "Columnas marmóreas, galerías circulares superpuestas, decoración románica visible en las líneas del grabado",
            "height_fill": "La torre ocupa verticalmente desde el fondo de la caja hasta el interior de la tapa abierta"
          }
        }
      }
    }
  },
  "tagline_section": {
    "text": "The world's most affordable airline.",
    "position": {"x": 0.50, "y": 0.77},
    "alignment": "center",
    "styling": {
      "base_font": "Sans-serif light/regular, color #FFFFFF",
      "size": "~26pt",
      "emphasized_word": {
        "word": "most affordable",
        "color": "#FFD700 (amarillo Ryanair)",
        "weight": "700 (bold vs rest regular)"
      }
    }
  },
  "brand_identity": {
    "logo_container": {
      "position": {"x": 0.50, "y": 0.91},
      "alignment": "center",
      "components": [
        {
          "element": "Harp icon (arpa celta estilizada)",
          "color": "#FFD700",
          "size": "~40px altura",
          "position": "Izquierda del wordmark, baseline-aligned"
        },
        {
          "element": "RYANAIR wordmark",
          "font": "Custom sans-serif bold condensada corporativa",
          "color": "#FFD700 (amarillo)",
          "size": "~52pt",
          "weight": "900 Black"
        }
      ]
    }
  },
  "color_system": {
    "primary": "#1B3D9F (azul Ryanair)",
    "secondary": "#FFD700 (amarillo Ryanair)",
    "neutral_light": "#FFFFFF",
    "kraft_box": "#C4956A",
    "illustration_ink": "#5C3A1E"
  }
}
```

---

## 2. Análisis Creativo

### ¿Por qué este anuncio es brutal en su eficacia?

**Destruye la percepción del valor con aritmética cotidiana.**

El anuncio opera sobre un único mecanismo cognitivo: **el precio ancla de referencia**. Todo consumidor europeo tiene perfectamente calibrado cuánto cuesta una pizza delivery (~€15-20). Ese precio está profundamente codificado en la memoria como "pequeño placer cotidiano, gasto trivial, no merece reflexión".

Al poner **exactamente el mismo número** ($19.99) debajo de "LONDON → PISA", Ryanair no argumenta que es barato; **transfiere la categoría mental** del gasto de "pizza de Friday night" a "viaje a Italia". La operación psicológica es:

> *"Antes de que tu cerebro racionalice si volar a Pisa es caro o barato, ya lo has categorizado como 'precio de pizza', y nadie piensa demasiado antes de pedir una pizza."*

**Los tres elementos que amplifican la eficacia:**

1. **El Contenedor Compartido (La Caja)**: Usar la misma caja de pizza para ambas "propuestas" hace la comparación ineludible e instantánea. No hay tabla de precios, no hay asteriscos. Son dos productos. Mismo envase. Mismo precio. El contenedor iguala categorialmente objetos que nuestro cerebro jamás pondría en competencia.

2. **La Torre de Pisa dentro de la Caja**: La Torre de Pisa **dibujada sobre el cartón** (no fotografiada, no renderizada en 3D) comunica inconscientemente "esto es tan simple y directo como lo que ves". La elección de Pisa es perfecta porque la Torre es universalmente reconocida en 0.1 segundos.

3. **La Asimetría del Color del Precio**: Pizza en **blanco** (neutral, mundano). Vuelo en **amarillo dorado** (llamativo, premium, deseado). El mismo número en dos colores crea jerarquía de deseo sin cambiar el monto.

### Principio creativo: **"El Ancla de Precio por Categoría Sustitutiva"** *(Cross-Category Price Anchoring)*

El principio toma el precio de algo que tu audiencia compra **sin pensarlo** (pizza, café, taxi, peluquería) y lo equipara aritméticamente con tu producto o servicio, **forzando una recategorización mental** del gasto: de "gasto reflexivo justificable" a "gasto impulsivo aceptable".

**Características clave:**
- **El Objeto Ancla debe ser universalmente conocido** en precio Y en experiencia hedónica (pizza, café, cine, cerveza). El precio no se explica; se asume culturalmente.
- **La Igualdad Numérica exacta** es imprescindible. Si la pizza fuera $18.99 y el vuelo $19.99, el efecto se diluye.
- **El Formato Comparativo "vs."** elimina la necesidad de argumentación. El cerebro completa solo: "si tengo que elegir entre estos dos $19.99..."
- **El Contenedor Compartido** (aquí la caja de pizza看它这次有什么进展... pizza) eleva la comparación de abstracta a física y táctil.

**Sub-principio: "Democratización por Analogía"** — no dices "somos baratos"; demuestras que el coste de acceder a tu categoría ya está en el repertorio de gastos habituales de tu audiencia.

### Pregunta axiomática:

> **"¿Cuál es el precio exacto de algo que mi cliente objetivo compra sin pensar (un placer cotidiano, un gasto automático, un consumible habitual)... y existe algún producto o experiencia de mi marca que tenga ese mismo precio y que, por comparación directa, haga que el cliente sienta que está obteniendo algo absurdamente más valioso por la misma cifra?"**

**Variación práctica:** *"¿Qué objeto cotidiano con precio universalmente conocido (una cerveza, un taxi, un menú de mediodía) puedo poner literalmente 'al lado' de mi oferta con el mismo precio, de modo que el cliente NO pueda evitar preguntarse '¿por qué no lo hago?'"*

---

Ver también: [[Principios de publicidad creativa - ÍNDICE]]