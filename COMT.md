# COMT (Catechol-O-Methyltransferase)

Enzima citoplasmática y de membrana codificada por el gen *COMT* (cromosoma 22q11.21). Transfiere un grupo metilo desde la [[SAMe (S-Adenosil Metionina)|SAMe]] a un sustrato catecol (sustrato con un anillo de benceno con dos -OH adyacentes), desactivándolo y permitiendo su excreción o reciclaje. Una de las dos principales vías de desactivación de [[Catecolaminas|catecolaminas]] (la otra es la [[Monoamino oxidasas (MAO)|MAO]]).

## Tabla de contenidos

- [Sustratos](#sustratos)
- [Reacción](#reacción)
- [Dos isoformas](#dos-isoformas)
- [El polimorfismo Val158Met (rs4680)](#el-polimorfismo-val158met-rs4680)
- [Otros SNPs relevantes](#otros-snps-relevantes)
- [El autor @Helios_Movement (6 jun 2026)](#el-autor-helios_movement-6-jun-2026)
- [Tips prácticos según el autor (con caveats)](#tips-prácticos-según-el-autor-con-caveats)
- [Caveats transversales](#caveats-transversales)
- [Ver también](#ver-también)

## Sustratos

- **[[Dopamina]]** → 3-metoxitiramina (3-MT)
- **[[Adrenalina]]** (epinefrina) → metanefrina
- **[[Norepinefrina]]** (noradrenalina) → normetanefrina
- **2-hidroxiestradiol / 2-hidroxiestrona** (catecol-estrógenos)
- **[[Quercetina]]**, **[[Luteolina]]** y otros flavonoides catecol
- **[[Vitamina E]]** (forma de tocoferol con anillo catecol, raro)
- Dopamina-L-DOPA y otros fármacos catecol

## Reacción

```
Catecol + SAMe + Mg²⁺ → Catecol-metilado + SAH
```

La COMT requiere **magnesio** como cofactor (Mg²⁺ se une al sitio activo y facilita la transferencia del metilo). El donador es **[[SAMe (S-Adenosil Metionina)|SAMe]]**, que tras ceder el metilo se convierte en **SAH** (S-adenosilhomocisteína). La SAH es un inhibidor competitivo de la metilación — su acumulación frena todas las metiltransferasas celulares.

> "Catecholamine + SAMe + Mg²⁺ → Methylated Catecholamine + SAH."
> _—@Helios_Movement (6 jun 2026)_

## Dos isoformas

- **S-COMT (soluble)**: forma citoplasmática, expresada en todos los tejidos, alta afinidad pero baja Vmax. Responsable del metabolismo general de catecolaminas circulantes y hepáticas.
- **MB-COMT (membrane-bound)**: forma anclada a membrana, **predomina en el [[Corteza prefrontal|córtex prefrontal]]** del cerebro, mayor afinidad por dopamina y norepinefrina. Es la isoforma más relevante para la función cognitiva y la respuesta a estrés.

## El polimorfismo Val158Met (rs4680)

El SNP más estudiado del gen COMT cambia:

- **Val/Val (G/G)**: codifica **valina** en posición 158. Enzima más estable a 37°C, vida media más larga → **COMT rápida**. Las catecolaminas se eliminan 3-4x más rápido.
- **Met/Met (A/A)**: codifica **metionina** en posición 158. Enzima termosensible, vida media más corta, menor actividad a temperatura corporal → **COMT lenta**. Las catecolaminas se acumulan en la sinapsis.
- **Val/Met (G/A)**: heterocigoto, **velocidad intermedia**.

### Efectos del genotipo (con caveats)

- **Val/Val (rápida)**: niveles basales de dopamina más bajos en PFC, mayor respuesta a catecolaminas administradas exógenamente, mejor rendimiento en tareas bajo estrés agudo, peor rendimiento en memoria de trabajo basal. En condiciones de estrés bajo, el Val/Val puede "sobrebarrerse" demasiado rápido.
- **Met/Met (lenta)**: niveles basales de dopamina más altos en PFC, mejor memoria de trabajo basal, peor bajo estrés crónico, mayor vulnerabilidad a ansiedad, peor procesamiento de recompensa sostenida.

> _—Caveat: la simplificación "Met/Met = ansioso, Val/Val = tranquilo" es engañosa. La relación es bidimensional: la COMT rápida favorece el rendimiento en tareas agudas pero a costa de mantener tono basal, y viceversa._

- **Cáncer de mama**: la COMT también metaboliza catecol-estrógenos. Met/Met se ha asociado con **mayor riesgo de cáncer de mama** en algunos meta-análisis (especialmente en combinación con exposición a estrógenos, terapia hormonal sustitutiva, alcohol). El mecanismo es la acumulación de catecol-estrógenos que se oxidan a quinonas dañinas para el ADN.
- **SOP (síndrome de ovario poliquístico)**: relación menos clara, con reportes mixtos.
- **Fibromialgia, migraña, PTSD**: asociaciones con Met/Met en algunos estudios, no replicadas en otros.

## Otros SNPs relevantes

- **rs6269**: G (mayor expresión) vs A (menor expresión)
- **rs4633**: C (mayor expresión) vs T (menor expresión)
- **rs4818**: C (mayor expresión) vs G (menor expresión)

Los haplotipos más estudiados:
- **G-C-C** → alta expresión → COMT rápida
- **A-C-G** → baja expresión → COMT lenta

> _—Caveat: estos SNPs "expresión" interactúan con rs4680 de formas no totalmente esclarecidas. Las recomendaciones del autor del tweet ("tweak the tips for these overlap with rs4680") son simplificaciones._

## El autor @Helios_Movement (6 jun 2026)

> "This is your reminder that some people with slow COMT consume 18000% of the RDA in methylated B vitamins and wonder why they have anxiety."
> _—@Helios_Movement (6 jun 2026)_

El autor George Ferman (@Helios_Movement) es un ex-PT que escribe sobre salud en su Substack "Health Library" (ex-Substack "Helios Movement"). Su tesis es que la metilación de catecolaminas consume SAMe, y que personas con COMT lenta que suplementan con altas dosis de vitaminas B metiladas (B12, folato, etc.) generan un "exceso de metilación" que paradójicamente les causa ansiedad. La cifra "18000% del RDA" es hipérbole retórica.

**Caveats a su framework**:
- La toxicidad de las vitaminas B metiladas (metilcobalamina, 5-MTHF) es prácticamente nula incluso a dosis altas. La vitamina B6 (piridoxina) sí tiene umbral de toxicidad (>200 mg/día prolongados), pero eso es otra forma.
- La **ansiedad** en Met/Met es plausible (vía acumulación de dopamina/noradrenalina en PFC), pero hay estudios mixtos.
- La **lógica de "más metilación = más ansiedad en COMT lenta"** es contraintuitiva: la COMT lenta debería necesitar **más** SAMe para funcionar mejor, no menos. El autor asume que suplementar metil-B con SAMe "sobrecarga" la vía, pero no hay ensayos clínicos que respalden esta tesis.
- El "18000%" implica dosis de ~180 mg de folato para una RDA de 1 mg — común en suplementos pero no establecida como tóxica.

## Tips prácticos según el autor (con caveats)

### Para COMT rápida (Val/Val, G/G)

- No vegano/vegetariano: plausibe. La vitamina B12 es más biodisponible en fuentes animales, y la Met/Val puede tener mayor demanda de B12. Caveat: la dieta vegana con suplementación adecuada de B12 y [[Folato]] cubre el requerimiento.
- Lácteos: plausibe (B12, B2, Ca²⁺).
- HIIT: plausibe. Val/Val responde mejor a estrés agudo y al ejercicio intenso (corto, intermitente). Caveat: no hay RCTs específicos por genotipo.
- TMG baja dosis: plausibe como donador de metilos alternativo.
- [[Glicina]]: plausibe como apoyo a metilación (ver [[Metilación]]).
- [[Mucuna pruriens]] (L-DOPA): plausibe. Si tienes COMT rápida, suplementar L-DOPA puede ser útil. Caveat: la L-DOPA oral tiene baja biodisponibilidad y se descarboxila periféricamente (a menudo se combina con carbidopa).
- P5P (fosfato de piridoxal): plausible. Coenzima de tirosina hidroxilasa, paso limitante en síntesis de dopamina.
- Magnesio taurato: plausibe (magnesio cofactor de COMT, taurina como soporte cardiovascular).
- [[Rhodiola]]: plausible. Adaptógeno con efecto modesto sobre monoaminas; en Val/Val, ligeramente dopaminérgico, podría ser útil.

### Para COMT lenta (Met/Met, A/A)

- [[NAC]] (N-acetilcisteína): plausible. Antioxidante, apoya glutatión, reduce estrés oxidativo. Caveat: la conexión con COMT no es directa.
- [[Litio]] orotate (dosis baja): plausible. Litio a dosis bajas (<5 mg/día) tiene efecto neuroprotector y estabilizador del ánimo. Caveat: el mecanismo en COMT lenta no está establecido.
- **[[DIM]]** (diindolilmetano): plausible. Induce CYP1A1/1A2 que desvía el metabolismo de estrógenos hacia 2-hidroxiestrona (catecol-estrógeno). Caveat: añadir más sustrato a una COMT lenta podría empeorar la acumulación; el balance no está claro.
- Magnesio glycinate: plausible (glicina es calmante, GABA agonista).
- Vitamina E whole food: plausible. Antioxidante que reduce daño oxidativo; el comentario sobre catecol-estrógenos es que reduce la oxidación a quinonas.
- SAMe 100-200 mg o metil-B12/5-MTHF: plausible. Caveat: la idea de "más metilación en COMT lenta" es contraintuitiva (¿no debería ser al revés?).
- **Evitar altas dosis de [[Vitamina B3]] (niacina)**: plausible. Niacina consume grupos metilo en su metabolismo (vía N1-metilnicotinamida). Caveat: solo relevante a dosis altas (>1 g/día).
- Evitar mucuna: plausible. Mucuna (L-DOPA) en Met/Met puede empeorar la acumulación de dopamina.
- Evitar cafeína: plausible. Cafeína aumenta la liberación de catecolaminas; en Met/Met se acumulan.
- Controlar peso: plausible. Adiposidad → mayor aromatización → más estrógenos → más sustrato catecol para COMT lenta.
- Champiñones blancos: plausible. Ergothioneína y glutatión. Caveat: la evidencia específica en COMT lenta es indirecta.
- Evitar **[[Quercetina]]** y **[[Luteolina]]** (inhibidores de COMT): correcto. Ambos son flavonoides catecol que compiten con catecolaminas por el sitio activo de COMT.

## Caveats transversales

- **La genómica del COMT no es destino**: la dieta, el sueño, el estrés, el ejercicio y la microbiota modulan la actividad real de COMT independientemente del genotipo. El genotipo es tendencia, no sentencia.
- **Las recomendaciones de "fast vs slow COMT" son empíricas**: la mayoría no proviene de RCTs que controlen por genotipo.
- **Las pruebas genéticas directas al consumidor** (23andMe, AncestryDNA) pueden subestimar la actividad real de COMT porque no evalúan modificaciones post-traduccionales, estado de SAMe/SAH, ni expresión tisular específica.
- **Las terapias nutricionales por genotipo** (nutrigenómica) tienen evidencia heterogénea y deben personalizarse, no aplicarse como protocolo universal.

## Ver también

- [[Metilación]]
- [[SAMe (S-Adenosil Metionina)]]
- [[Catecolaminas]]
- [[Dopamina]]
- [[Adrenalina]]
- [[Norepinefrina]]
- [[Quercetina]] (inhibidor de COMT)
- [[Luteolina]] (inhibidor de COMT)
- [[Mucuna pruriens]] (L-DOPA, recomendado solo para fast COMT)
- [[Vitamina B12]] (metilcobalamina)
- [[Folato]] (5-MTHF)
- [[Glicina]]
- [[NAC]]
- [[Litio]]
- [[DIM]]
- [[Rhodiola]]
- [[Vitamina E]]
- [[Cafeína]]
- [[Vitamina B3]] (consume metilos)
- [[TMG]]
- [[Champiñones]]
- [[Magnesio]]
- [[Monoamino oxidasas (MAO)]]
