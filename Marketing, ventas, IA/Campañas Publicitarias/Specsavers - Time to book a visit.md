# Specsavers — "Time to book a visit"

> **Principio:** [[El Medio como Síntoma]]
> **Etiquetas:** #publicidad #caso-estudio #Specsavers #salud

---

## 1. JSON Descriptivo

```json
{
  "canvas": {
    "format": "Publicidad digital vertical (3:4 ratio, ~530x700px aprox)",
    "background": {
      "color": "#FFFFFF (blanco puro absoluto)",
      "texture": "Liso mate, sin ruido, sin gradiente"
    }
  },
  "hero_typography": {
    "content": "Time to\nbook a\nvisit",
    "position": {"x": 0.10, "y": 0.25, "alignment": "left-aligned"},
    "base_font": {
      "family": "Sans-serif bold redondeada (VAG Rounded Bold o Nunito ExtraBold)",
      "weight": "800-900",
      "size": "~88-96pt",
      "case": "Sentence case"
    },
    "color_treatment": {
      "technique": "Chromatic aberration / RGB split effect simulando visión desenfocada",
      "base_color": "#00A86B (verde Specsavers)",
      "split_components": {
        "cyan_layer": {"color": "#00FFFF", "offset": {"x": "-4px", "y": "-3px"}, "opacity": "85%"},
        "magenta_layer": {"color": "#FF00FF", "offset": {"x": "+4px", "y": "+3px"}, "opacity": "70%"},
        "green_base_layer": {"color": "#00C878", "offset": {"x": "0px", "y": "0px"}, "opacity": "100%"}
      }
    },
    "blur_effect": {
      "type": "Gaussian blur DESPUÉS del color split",
      "radius": "4-6px",
      "direction": "Omnidireccional",
      "purpose": "Simular texto visto por alguien con miopía/astigmatismo sin gafas"
    },
    "line_breaks": ["Time to", "book a", "visit"]
  },
  "lower_half": {
    "content": "Completamente vacío (blanco puro sin elementos)",
    "purpose": "El vacío inferior amplifica la sensación de desorientación visual",
    "y_range": "45%-88%"
  },
  "brand_identity": {
    "logo": {
      "shape": "Pastilla horizontal (rounded rectangle con border-radius = 50% altura)",
      "background_color": "#00A86B",
      "position": {"x": 0.78, "y": 0.88, "alignment": "bottom-right"},
      "dimensions": "~130px width x 44px height",
      "text": {"content": "Specsavers", "color": "#FFFFFF", "size": "~18pt", "weight": "Bold"},
      "critical_contrast": "El logo es el ÚNICO elemento 100% nítido en toda la imagen"
    }
  },
  "color_system": {
    "background": "#FFFFFF",
    "brand_green": "#00A86B",
    "aberration_cyan": "#00FFFF",
    "aberration_magenta": "#FF00FF",
    "logo_text": "#FFFFFF"
  },
  "negative_space_strategy": {
    "percentage_empty": "~55% del canvas es blanco vacío",
    "function": "Espacio vacío como 'silencio incómodo' que el cerebro intenta rellenar"
  },
  "watermark": {
    "text": "adprofessor.com",
    "position": {"x": 0.15, "y": 0.97},
    "style": {"font": "Sans-serif light", "color": "#888888", "size": "8pt"}
  }
}
```

---

## 2. Análisis Creativo

### ¿Por qué es un gran anuncio?

**El anuncio padece el mismo problema que pretende resolver.** Specsavers vende soluciones para la visión deficiente, y el anuncio está literalmente diseñado para ser visto con visión deficiente. El medio se convierte en el mensaje de la manera más literal posible.

Tres mecanismos de impacto:

1. **La Empatía Forzada por Experiencia Directa**: No describe cómo se siente tener mala visión. Te lo hace sentir. El lector experimenta durante 2-3 segundos exactamente lo que experimenta alguien que necesita gafas y no las tiene: frustración, esfuerzo ocular, desorientación.

2. **El Contraste Nítido/Borroso como Argumento Visual**: El único elemento perfectamente enfocado en toda la imagen es el **logo de Specsavers**. El mundo (el texto) está borroso; Specsavers está nítido. No hay copy explicando "te ayudamos a ver mejor"; la composición misma lo demuestra.

3. **La Aberración Cromática como Firma Visual del Problema**: El efecto RGB split (cyan + magenta) replica con precisión el fenómeno óptico real del **astigmatismo y la miopía severa**: cuando el ojo no enfoca bien, los colores se separan perceptualmente.

### Principio creativo: **"El Medio como Síntoma"** *(The Medium as Symptom / Diseased Carrier)*

El principio diseña el soporte publicitario para que **manifieste físicamente el problema** que el producto resuelve, convirtiendo al espectador en paciente momentáneo que experimenta la necesidad del producto en primera persona.

**Características clave:**
- **Autodiagnóstico Pasivo**: El espectador no lee sobre el problema; lo experimenta. Transforma la publicidad de mensaje externo a experiencia interna.
- **Economía total de argumentación**: Zero copy explicativo. El efecto visual hace el 100% del trabajo persuasivo.
- **Contraste Funcional**: El elemento "solucionado" (logo nítido) dentro del entorno "problemático" (texto borroso) funciona como proof of concept visual inmediato.
- **Memorabilidad por Incomodidad**: El ligero malestar de intentar leer texto borroso genera una huella emocional más duradera que cualquier imagen agradable.

### Pregunta axiomática:

> **"¿Cuál es la sensación física, cognitiva o emocional exacta que experimenta mi cliente potencial cuando tiene el problema que mi producto resuelve... y cómo puedo diseñar el soporte publicitario para que reproduzca esa sensación durante los segundos que el espectador está en contacto con el anuncio, haciendo que mi producto sea el único elemento que aparece 'resuelto' o 'normal' dentro de ese entorno distorsionado?"**

**Variación práctica:** *"Si mi cliente tiene dolor de cabeza, ¿puedo hacer el anuncio visualmente ruidoso excepto por mi producto? Si tiene ansiedad financiera, ¿puedo hacer el diseño caótico excepto por mi propuesta de orden?"*

---

Ver también: [[Principios de publicidad creativa]]
