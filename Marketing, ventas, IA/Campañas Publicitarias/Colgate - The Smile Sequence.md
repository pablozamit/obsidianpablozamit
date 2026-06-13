# Colgate — "The Smile Sequence"

> **Principio:** [[La Apropiación Estructural del Enemigo]]
> **Etiquetas:** #publicidad #caso-estudio #Colgate #salud

---

## 1. JSON Descriptivo

```json
{
  "canvas": {
    "format": "Publicidad digital vertical (3:4 ratio, ~540x720px aprox)",
    "background": {
      "color": "#E8001E (rojo Colgate corporativo, rojo puro saturado intenso)",
      "texture": "Plano sólido uniforme, sin gradiente ni ruido, mate absoluto"
    }
  },
  "composition_layout": {
    "structure": "Tres bloques tipográficos idénticos en estructura, distribuidos verticalmente en tercios iguales",
    "alignment": "Centrado horizontal absoluto en los tres casos",
    "vertical_thirds": [
      {"zone": "Top third", "y_range": "5%-35%", "content": "Cola"},
      {"zone": "Middle third", "y_range": "38%-65%", "content": "Coffee"},
      {"zone": "Bottom third", "y_range": "68%-95%", "content": "Colgate"}
    ],
    "visual_rhythm": "Repetición estructural exacta (texto + curva) creando patrón reconocible que se 'resuelve' en el tercer elemento"
  },
  "unit_structure": {
    "description": "Cada uno de los tres bloques sigue exactamente la misma arquitectura visual: [wordmark tipográfico] + [curva smile debajo]",
    "template": {
      "text_element": "Palabra centrada en tipografía específica por bloque",
      "curve_element": "Arco/curva sonriente centrado debajo de cada palabra, separación ~8-12px del baseline del texto"
    }
  },
  "block_1_cola": {
    "position": {"x": 0.50, "y": 0.20},
    "text": {
      "content": "Cola",
      "font_style": "Italic/oblique bold (similar a tipografía Coca-Cola o genérica serif cursiva)",
      "font_family": "Serif italic bold, reminiscente de Spencerian script modernizado",
      "color": "#1A0A00 (negro muy oscuro con leve matiz marrón)",
      "size": "~52pt",
      "weight": "Bold italic",
      "case": "Title Case"
    },
    "smile_curve": {
      "shape": "Arco abierto hacia arriba (forma U / smile glyph)",
      "color": "#1A0A00",
      "stroke_width": "3-4px",
      "stroke_style": "Línea curva simple, sin relleno, extremos redondeados",
      "width": "~60-70% del ancho del texto",
      "position": "Centrado bajo el texto, baseline + 10px offset"
    }
  },
  "block_2_coffee": {
    "position": {"x": 0.50, "y": 0.50},
    "text": {
      "content": "Coffee",
      "font_style": "Bold upright sans-serif o slab-serif medium",
      "font_family": "Sans-serif bold, carácter artesanal/café",
      "color": "#6B3A2A (marrón café oscuro)",
      "size": "~52pt",
      "weight": "Bold",
      "case": "Title Case"
    },
    "smile_curve": {
      "shape": "Arco idéntico al de Cola",
      "color": "#8B4513",
      "stroke_width": "3-4px",
      "stroke_style": "Round cap, curva suave",
      "width": "~60-70% del ancho del texto",
      "position": "Misma posición relativa"
    }
  },
  "block_3_colgate": {
    "position": {"x": 0.50, "y": 0.80},
    "text": {
      "content": "Colgate®",
      "font_family": "Tipografía propietaria Colgate (sans-serif bold redondeada, humanista)",
      "color": "#FFFFFF",
      "size": "~56pt (ligeramente mayor)",
      "weight": "Bold",
      "case": "Title Case con ® superscript"
    },
    "smile_curve": {
      "shape": "Arco idéntico en geometría a Cola y Coffee",
      "color": "#FFFFFF (blanco puro)",
      "stroke_width": "3-4px",
      "stroke_style": "Round cap, curva suave",
      "width": "~60-70% del ancho del wordmark"
    }
  },
  "sequential_narrative": {
    "reading_order": "Top → Middle → Bottom",
    "color_progression": [
      {"step": 1, "element": "Cola curve", "color": "Negro oscuro", "meaning": "Mancha de refresco"},
      {"step": 2, "element": "Coffee curve", "color": "Marrón café", "meaning": "Mancha de café"},
      {"step": 3, "element": "Colgate curve", "color": "Blanco brillante", "meaning": "Dientes blancos restaurados"}
    ]
  },
  "color_system": {
    "background": "#E8001E",
    "cola_elements": "#1A0A00",
    "coffee_elements": "#6B3A2A / #8B4513",
    "colgate_elements": "#FFFFFF"
  },
  "watermark": {
    "text": "adprofessor.com",
    "position": {"x": 0.88, "y": 0.97},
    "style": {"font": "Sans-serif light", "color": "#999999", "size": "7pt"}
  }
}
```

---

## 2. Análisis Creativo

### ¿Por qué es un gran anuncio?

Resuelve un problema complejo (mostrar antes/después sin mostrar dientes) usando únicamente **color y tipografía**. La pieza opera mediante un mecanismo de **transferencia semiótica de identidad visual**: toma la arquitectura gráfica del propio logo de Colgate (texto + curva smile) y la aplica a sus "enemigos naturales" (los productos que manchan el esmalte dental), convirtiendo ese formato compartido en una acusación silenciosa y una promesa simultánea.

Tres niveles de brillantez:

1. **El Robo de Identidad Positivo**: Cola y Coffee adoptan la estructura exacta del logo Colgate (wordmark + smile curve). Esto coloca a Colgate en el mismo "tier de importancia" que Coca-Cola y el café, y permite que el smile curve actúe como **indicador de estado del esmalte**: oscuro/manchado vs. blanco/limpio.

2. **El Antes/Después Sin Dientes**: El antes/después se comunica exclusivamente a través del **color de una curva abstracta**. Negro → Marrón → Blanco. El espectador proyecta mentalmente esos colores sobre su propio esmalte sin necesidad de fotografía explícita.

3. **La Secuencia como Argumento**: La estructura de tres actos (problema 1, problema 2, solución) es la narrativa más antigua del mundo. El cerebro la completa automáticamente incluso antes de terminar de leerla. La resolución blanca se percibe como inevitable y satisfactoria.

### Principio creativo: **"La Apropiación Estructural del Enemigo"** *(Enemy Structure Hijacking)*

El principio toma el **formato visual o arquitectura gráfica del propio producto** y lo aplica a los **agentes problemáticos** que justifican la existencia del producto, revelando mediante el cambio de un único parámetro (color) la diferencia entre el problema y la solución.

**Características operativas:**
- **Isomorfismo estructural**: Misma forma, distinto contenido/color. El contraste es más poderoso cuando la estructura es idéntica porque el cerebro aísla el único elemento diferente (color) como variable significativa.
- **Compresión narrativa máxima**: Tres actos completos en tres líneas de texto. Cero desperdicio.
- **Autorreferencia del logo**: El logo del anunciante no aparece "al final como firma" sino que su arquitectura gráfica es el vehículo del mensaje desde el principio.
- **Color como dato científico**: El color de las curvas no es decorativo; es información (tono de la mancha → tono del diente). Transforma el diseño en una infografía emocional.

### Pregunta axiomática:

> **"¿Cuál es el elemento visual más reconocible y propio de mi marca (una curva, un icono, una tipografía, una forma)... y cómo puedo aplicar esa misma forma a los 'villanos', 'problemas' o 'estados negativos' que mi producto resuelve, cambiando únicamente el color o textura para mostrar la progresión de problema a solución sin necesitar una sola palabra explicativa?"**

**Variación práctica:** *"Si mi logo tuviera un 'modo sucio', 'modo roto' o 'modo problemático', ¿qué aspecto tendría, y podría poner esa versión degradada junto a la versión original para que el contraste solo contara toda la historia de por qué existo como marca?"*

---

Ver también: [[Principios de publicidad creativa]]
