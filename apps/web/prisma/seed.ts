
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean)));
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const TAG = {

  petto: "petto",
  dorso: "dorso",
  spalle: "spalle",
  deltoide_laterale: "deltoide laterale",
  deltoide_posteriore: "deltoide posteriore",
  bicipiti: "bicipiti",
  tricipiti: "tricipiti",
  avambracci: "avambracci",
  addome: "addome",
  core: "core",
  glutei: "glutei",
  quadricipiti: "quadricipiti",
  femorali: "femorali",
  polpacci: "polpacci",
  schiena_bassa: "schiena bassa",
  trapezi: "trapezi",

  spinta: "spinta",
  tirata: "tirata",
  squat: "squat",
  hip_hinge: "hip hinge",
  unilaterale: "unilaterale",
  anti_rotazione: "anti-rotazione",
  stabilita: "stabilità",
  condizionamento: "condizionamento",

  multiarticolare: "multiarticolare",
  isolamento: "isolamento",

  bilanciere: "bilanciere",
  manubri: "manubri",
  cavi: "cavi",
  macchina: "macchina",
  corpo_libero: "corpo libero",
  kettlebell: "kettlebell",
  elastico: "elastico",
  swiss_ball: "fitball",
  landmine: "landmine",

  base: "base",
  intermedio: "intermedio",
  avanzato: "avanzato",

  prehab: "prehab",
  mobilita: "mobilità",
  scapole: "scapole",
  anca: "anca",
  caviglia: "caviglia",
  torace: "torace",
  spalle_mobilita: "spalle mobilità",
  colonna: "colonna",
  elastici: "elastici",
  respirazione: "respirazione",
} as const;

type SeedExercise = {
  name: string;
  description?: string;
  imageUrl?: string | null;
  tags: string[];
};

type Variant = {
  suffix: string;
  tagsAdd: string[];
};

type Base = {
  baseName: string;
  description?: string;
  tags: string[];
  variants?: Variant[];
};

function makeExerciseName(base: string, suffix?: string) {
  return suffix ? `${base} (${suffix})` : base;
}

const V = {
  bilanciere: { suffix: "Bilanciere", tagsAdd: [TAG.bilanciere] },
  manubri: { suffix: "Manubri", tagsAdd: [TAG.manubri] },
  cavi: { suffix: "Cavi", tagsAdd: [TAG.cavi] },
  macchina: { suffix: "Macchina", tagsAdd: [TAG.macchina] },
  corpoLibero: { suffix: "Corpo libero", tagsAdd: [TAG.corpo_libero] },
  kettlebell: { suffix: "Kettlebell", tagsAdd: [TAG.kettlebell] },
  elastico: { suffix: "Elastico", tagsAdd: [TAG.elastico] },
  landmine: { suffix: "Landmine", tagsAdd: [TAG.landmine] },

  seduto: { suffix: "Seduto", tagsAdd: [] },
  in_piedi: { suffix: "In piedi", tagsAdd: [] },
  inclinata: { suffix: "Panca inclinata", tagsAdd: [] },
  declinata: { suffix: "Panca declinata", tagsAdd: [] },
  presa_stretta: { suffix: "Presa stretta", tagsAdd: [] },
  presa_larga: { suffix: "Presa larga", tagsAdd: [] },
  unilaterale: { suffix: "Unilaterale", tagsAdd: [TAG.unilaterale] },

  tempo: { suffix: "Tempo controllato", tagsAdd: [] },
} satisfies Record<string, Variant>;

const BASES: Base[] = [

  {
    baseName: "Panca piana",
    description: "Scapole addotte, piedi saldi, controllo in eccentrica.",
    tags: [TAG.petto, TAG.spinta, TAG.multiarticolare, TAG.intermedio],
    variants: [V.bilanciere, V.manubri, V.macchina, V.presa_stretta],
  },
  {
    baseName: "Panca inclinata",
    description: "Angolo 15–30°, focus parte alta del petto, ROM controllato.",
    tags: [TAG.petto, TAG.spinta, TAG.multiarticolare, TAG.intermedio],
    variants: [V.bilanciere, V.manubri, V.macchina],
  },
  {
    baseName: "Croci",
    description: "Gomiti morbidi, grande controllo e focus sul petto.",
    tags: [TAG.petto, TAG.isolamento, TAG.base],
    variants: [V.manubri, V.cavi, V.macchina, V.inclinata],
  },
  {
    baseName: "Dip alle parallele",
    description: "Tronco leggermente avanti per enfatizzare il petto.",
    tags: [
      TAG.petto,
      TAG.tricipiti,
      TAG.spinta,
      TAG.multiarticolare,
      TAG.avanzato,
    ],
    variants: [V.corpoLibero],
  },
  {
    baseName: "Push-up",
    description: "Corpo in linea, addome attivo, mani sotto le spalle.",
    tags: [TAG.petto, TAG.spinta, TAG.corpo_libero, TAG.base],
    variants: [
      { suffix: "Inclinato (mani su rialzo)", tagsAdd: [TAG.base] },
      { suffix: "Declinato (piedi su rialzo)", tagsAdd: [TAG.avanzato] },
      { suffix: "Presa stretta", tagsAdd: [TAG.tricipiti] },
    ],
  },

  {
    baseName: "Military press",
    description: "Glutei e addome attivi, evita iperestensione lombare.",
    tags: [TAG.spalle, TAG.spinta, TAG.multiarticolare, TAG.intermedio],
    variants: [V.bilanciere, V.manubri, V.macchina, V.seduto, V.in_piedi],
  },
  {
    baseName: "Alzate laterali",
    description:
      "Polsi neutrali, sali fino alla linea delle spalle, controllo.",
    tags: [TAG.spalle, TAG.deltoide_laterale, TAG.isolamento, TAG.base],
    variants: [V.manubri, V.cavi, V.macchina, V.unilaterale],
  },
  {
    baseName: "Face pull",
    description:
      "Gomiti alti, tira al viso con corda, focus deltoidi posteriori.",
    tags: [
      TAG.spalle,
      TAG.deltoide_posteriore,
      TAG.dorso,
      TAG.cavi,
      TAG.isolamento,
    ],
    variants: [V.cavi],
  },
  {
    baseName: "Reverse fly",
    description: "Deltoidi posteriori, controllo e pausa in chiusura.",
    tags: [TAG.spalle, TAG.deltoide_posteriore, TAG.isolamento],
    variants: [V.manubri, V.macchina, V.cavi],
  },
  {
    baseName: "Scrollate",
    description: "Trapezi: su e giù, evita rotazioni spalle.",
    tags: [TAG.trapezi, TAG.isolamento],
    variants: [V.bilanciere, V.manubri, V.macchina],
  },

  {
    baseName: "Pushdown tricipiti",
    description: "Gomiti fissi, estendi senza spostare le spalle.",
    tags: [TAG.tricipiti, TAG.isolamento, TAG.cavi, TAG.base],
    variants: [
      { suffix: "Corda", tagsAdd: [TAG.cavi] },
      { suffix: "Sbarra", tagsAdd: [TAG.cavi] },
      { suffix: "Unilaterale", tagsAdd: [TAG.unilaterale, TAG.cavi] },
    ],
  },
  {
    baseName: "Estensione tricipiti sopra la testa",
    description: "Ottima per capo lungo, ROM controllato.",
    tags: [TAG.tricipiti, TAG.isolamento, TAG.intermedio],
    variants: [V.cavi, V.manubri, V.elastico],
  },
  {
    baseName: "French press",
    description: "Gomiti stretti, scendi controllato vicino alla fronte.",
    tags: [TAG.tricipiti, TAG.isolamento, TAG.intermedio],
    variants: [V.bilanciere, V.manubri],
  },

  {
    baseName: "Trazioni",
    description: "Depressione scapolare prima, tira con gomiti verso il basso.",
    tags: [
      TAG.dorso,
      TAG.tirata,
      TAG.multiarticolare,
      TAG.corpo_libero,
      TAG.avanzato,
    ],
    variants: [
      { suffix: "Presa prona", tagsAdd: [] },
      { suffix: "Presa supina", tagsAdd: [TAG.bicipiti] },
      { suffix: "Presa neutra", tagsAdd: [] },
      { suffix: "Assistite (macchina/elastico)", tagsAdd: [TAG.base] },
    ],
  },
  {
    baseName: "Lat machine",
    description: "Tira verso lo sterno, controlla la risalita.",
    tags: [TAG.dorso, TAG.tirata, TAG.macchina, TAG.intermedio],
    variants: [V.macchina, V.presa_larga, V.presa_stretta],
  },
  {
    baseName: "Rematore",
    description: "Schiena neutra, tira verso l’ombelico senza slanciare.",
    tags: [TAG.dorso, TAG.tirata, TAG.multiarticolare, TAG.intermedio],
    variants: [
      { suffix: "Bilanciere", tagsAdd: [TAG.bilanciere] },
      {
        suffix: "Manubrio a un braccio",
        tagsAdd: [TAG.manubri, TAG.unilaterale],
      },
      { suffix: "T-bar", tagsAdd: [TAG.macchina] },
      { suffix: "Panca inclinata (chest-supported)", tagsAdd: [TAG.manubri] },
      { suffix: "Cavi (seated row)", tagsAdd: [TAG.cavi] },
    ],
  },
  {
    baseName: "Pullover",
    description: "Tensione su dorsali, evita compensi lombari.",
    tags: [TAG.dorso, TAG.isolamento],
    variants: [V.cavi, V.manubri, V.macchina],
  },

  {
    baseName: "Curl",
    description: "Gomiti fermi, controlla l’eccentrica.",
    tags: [TAG.bicipiti, TAG.isolamento, TAG.base],
    variants: [
      { suffix: "Bilanciere", tagsAdd: [TAG.bilanciere] },
      { suffix: "Manubri alternato", tagsAdd: [TAG.manubri] },
      { suffix: "Manubri su panca inclinata", tagsAdd: [TAG.manubri] },
      { suffix: "Cavi", tagsAdd: [TAG.cavi] },
      { suffix: "Panca Scott", tagsAdd: [TAG.bilanciere] },
      { suffix: "Hammer", tagsAdd: [TAG.manubri, TAG.avambracci] },
      { suffix: "Reverse curl", tagsAdd: [TAG.avambracci, TAG.bilanciere] },
    ],
  },

  {
    baseName: "Squat",
    description: "Core attivo, ginocchia seguono la linea dei piedi.",
    tags: [
      TAG.quadricipiti,
      TAG.glutei,
      TAG.squat,
      TAG.multiarticolare,
      TAG.intermedio,
    ],
    variants: [
      { suffix: "Back squat (bilanciere)", tagsAdd: [TAG.bilanciere] },
      { suffix: "Front squat (bilanciere)", tagsAdd: [TAG.bilanciere] },
      { suffix: "Goblet squat (manubrio)", tagsAdd: [TAG.manubri, TAG.base] },
      { suffix: "Hack squat (macchina)", tagsAdd: [TAG.macchina] },
      { suffix: "Smith squat (macchina)", tagsAdd: [TAG.macchina] },
    ],
  },
  {
    baseName: "Affondi",
    description: "Passo controllato, busto stabile, spinta dal tallone.",
    tags: [
      TAG.quadricipiti,
      TAG.glutei,
      TAG.unilaterale,
      TAG.multiarticolare,
      TAG.intermedio,
    ],
    variants: [
      { suffix: "Camminati (manubri)", tagsAdd: [TAG.manubri] },
      { suffix: "Statici (manubri)", tagsAdd: [TAG.manubri] },
      { suffix: "Bulgarian split squat", tagsAdd: [TAG.manubri, TAG.avanzato] },
      { suffix: "Affondo indietro", tagsAdd: [TAG.base] },
    ],
  },
  {
    baseName: "Stacco",
    description: "Barra vicina, schiena neutra, spingi il pavimento.",
    tags: [
      TAG.femorali,
      TAG.glutei,
      TAG.hip_hinge,
      TAG.multiarticolare,
      TAG.avanzato,
    ],
    variants: [
      { suffix: "Conventional (bilanciere)", tagsAdd: [TAG.bilanciere] },
      { suffix: "Sumo (bilanciere)", tagsAdd: [TAG.bilanciere] },
      { suffix: "Rumeno RDL (bilanciere)", tagsAdd: [TAG.bilanciere] },
      { suffix: "Rumeno RDL (manubri)", tagsAdd: [TAG.manubri] },
    ],
  },
  {
    baseName: "Hip thrust",
    description: "Mentone leggermente dentro, chiudi forte i glutei in alto.",
    tags: [TAG.glutei, TAG.hip_hinge, TAG.multiarticolare, TAG.intermedio],
    variants: [
      { suffix: "Bilanciere", tagsAdd: [TAG.bilanciere] },
      { suffix: "Macchina", tagsAdd: [TAG.macchina] },
      { suffix: "Manubrio", tagsAdd: [TAG.manubri] },
    ],
  },
  {
    baseName: "Leg press",
    description: "Controlla profondità, non staccare bacino dal sedile.",
    tags: [
      TAG.quadricipiti,
      TAG.glutei,
      TAG.macchina,
      TAG.multiarticolare,
      TAG.base,
    ],
    variants: [
      { suffix: "Piedi stretti", tagsAdd: [] },
      { suffix: "Piedi larghi", tagsAdd: [] },
      { suffix: "Piedi alti", tagsAdd: [TAG.glutei, TAG.femorali] },
    ],
  },
  {
    baseName: "Leg extension",
    description: "Pausa in massima contrazione, non slanciare.",
    tags: [TAG.quadricipiti, TAG.macchina, TAG.isolamento, TAG.base],
    variants: [V.macchina, V.tempo],
  },
  {
    baseName: "Leg curl",
    description: "ROM pieno, controllo in eccentrica.",
    tags: [TAG.femorali, TAG.macchina, TAG.isolamento, TAG.base],
    variants: [
      { suffix: "Da seduto", tagsAdd: [TAG.macchina] },
      { suffix: "Da sdraiato", tagsAdd: [TAG.macchina] },
      {
        suffix: "In piedi (unilaterale)",
        tagsAdd: [TAG.macchina, TAG.unilaterale],
      },
    ],
  },
  {
    baseName: "Calf raise",
    description: "Pausa in basso e in alto, ROM completo.",
    tags: [TAG.polpacci, TAG.isolamento, TAG.base],
    variants: [
      { suffix: "In piedi (macchina)", tagsAdd: [TAG.macchina] },
      { suffix: "Seduto (macchina)", tagsAdd: [TAG.macchina] },
      { suffix: "Su step (manubri)", tagsAdd: [TAG.manubri] },
    ],
  },

  {
    baseName: "Plank",
    description: "Glutei stretti, addome attivo, schiena neutra.",
    tags: [TAG.core, TAG.stabilita, TAG.corpo_libero, TAG.base],
    variants: [
      { suffix: "Laterale", tagsAdd: [TAG.anti_rotazione] },
      { suffix: "Con sollevamento gamba", tagsAdd: [TAG.avanzato] },
      { suffix: "RKC plank", tagsAdd: [TAG.avanzato] },
    ],
  },
  {
    baseName: "Crunch ai cavi",
    description: "Fletti la colonna, non tirare con le braccia.",
    tags: [TAG.addome, TAG.core, TAG.cavi, TAG.isolamento],
    variants: [V.cavi],
  },
  {
    baseName: "Hanging leg raise",
    description: "Evita swing, retroversione del bacino in alto.",
    tags: [TAG.addome, TAG.core, TAG.corpo_libero, TAG.avanzato],
    variants: [
      { suffix: "Ginocchia al petto", tagsAdd: [TAG.base] },
      { suffix: "Gambe tese", tagsAdd: [TAG.avanzato] },
    ],
  },

  {
    baseName: "Kettlebell swing",
    description: "Hip hinge esplosivo, non è uno squat. Colonna neutra.",
    tags: [TAG.condizionamento, TAG.hip_hinge, TAG.kettlebell, TAG.intermedio],
    variants: [V.kettlebell, V.unilaterale],
  },
  {
    baseName: "Burpee",
    description: "Scala con step-back se serve, mantieni qualità.",
    tags: [TAG.condizionamento, TAG.corpo_libero, TAG.base],
    variants: [
      { suffix: "Con push-up", tagsAdd: [TAG.petto] },
      { suffix: "Con salto alto", tagsAdd: [TAG.avanzato] },
    ],
  },
];

const EXTRAS: SeedExercise[] = [

  {
    name: "Iperestensioni",
    tags: [TAG.schiena_bassa, TAG.glutei, TAG.femorali, TAG.isolamento],
    description: "Controlla il movimento, evita iperestensione eccessiva.",
    imageUrl: null,
  },
  {
    name: "Good morning (bilanciere)",
    tags: [
      TAG.femorali,
      TAG.glutei,
      TAG.hip_hinge,
      TAG.bilanciere,
      TAG.avanzato,
    ],
    description: "Hip hinge puro, schiena neutra, carichi moderati.",
    imageUrl: null,
  },

  {
    name: "Pulldown braccia tese (cavi)",
    tags: [TAG.dorso, TAG.isolamento, TAG.cavi],
    description: "Braccia tese, focus dorsali, scapole depresse.",
    imageUrl: null,
  },

  {
    name: "Pallof press (cavi)",
    tags: [TAG.core, TAG.anti_rotazione, TAG.cavi, TAG.base],
    description: "Spingi avanti senza ruotare, bacino stabile.",
    imageUrl: null,
  },
  {
    name: "Pallof press (elastico)",
    tags: [TAG.core, TAG.anti_rotazione, TAG.elastico, TAG.base],
    description: "Stesso concetto: stabilità e controllo.",
    imageUrl: null,
  },

  {
    name: "Abduzioni anca (macchina)",
    tags: [TAG.glutei, TAG.macchina, TAG.isolamento, TAG.base],
    description: "Focus su gluteo medio, controlla ROM.",
    imageUrl: null,
  },

  {
    name: "Extra-rotazioni (cavi)",
    tags: [TAG.spalle, TAG.prehab, TAG.cavi, TAG.isolamento],
    description: "Cuffia rotatori, gomito vicino al corpo.",
    imageUrl: null,
  },
].filter(Boolean);

function buildCatalog(): SeedExercise[] {
  const out: SeedExercise[] = [];

  for (const b of BASES) {

    if (b.variants?.length) {
      for (const v of b.variants) {
        out.push({
          name: makeExerciseName(b.baseName, v.suffix),
          description: b.description,
          imageUrl: null,
          tags: uniq([...b.tags, ...v.tagsAdd]),
        });
      }
    } else {
      out.push({
        name: b.baseName,
        description: b.description,
        imageUrl: null,
        tags: uniq(b.tags),
      });
    }

    const baseSlug = slugify(b.baseName);
    const alreadyHasExact = out.some((e) => slugify(e.name) === baseSlug);
    if (!alreadyHasExact) {
      out.push({
        name: b.baseName,
        description: b.description,
        imageUrl: null,
        tags: uniq(b.tags),
      });
    }
  }

  out.push(...EXTRAS);

  out.push(
    ...[
      {
        name: "Mobilità caviglia al muro (knee to wall)",
        description:
          "Lavora la dorsiflessione: ginocchio verso il muro senza staccare il tallone.",
        imageUrl: null,
        tags: uniq([TAG.caviglia, TAG.mobilita, TAG.prehab]),
      },
      {
        name: "World’s Greatest Stretch",
        description:
          "Sequenza dinamica: affondo + rotazione toracica + mobilità anca.",
        imageUrl: null,
        tags: uniq([TAG.mobilita, TAG.anca, TAG.torace, TAG.prehab]),
      },
      {
        name: "Rotazioni toraciche (open book)",
        description: "Rotazione toracica controllata, respirazione lenta.",
        imageUrl: null,
        tags: uniq([TAG.torace, TAG.colonna, TAG.mobilita, TAG.prehab]),
      },
      {
        name: "Face Pull (cavi/elastico)",
        description:
          "Tira verso il viso. Focus su deltoide posteriore e controllo scapole.",
        imageUrl: null,
        tags: uniq([TAG.spalle, TAG.scapole, TAG.prehab, TAG.cavi]),
      },
      {
        name: "Extra-rotazioni spalla (elastico)",
        description:
          "Cuffia dei rotatori: gomito vicino al fianco, esecuzione lenta e pulita.",
        imageUrl: null,
        tags: uniq([TAG.spalle, TAG.prehab, TAG.elastici, TAG.isolamento]),
      },
      {
        name: "Scapular Push-Up",
        description:
          "Protrazione/retrazione scapole in plank: stabilità e controllo.",
        imageUrl: null,
        tags: uniq([TAG.petto, TAG.scapole, TAG.prehab]),
      },
      {
        name: "Scapular Pull-Up",
        description:
          "Depressione scapolare senza piegare i gomiti (attivazione).",
        imageUrl: null,
        tags: uniq([TAG.dorso, TAG.scapole, TAG.prehab]),
      },
      {
        name: "Dead Bug",
        description:
          "Core anti-estensione. Schiena neutra, respira e controlla.",
        imageUrl: null,
        tags: uniq([TAG.core, TAG.prehab, TAG.stabilita]),
      },
      {
        name: "Bird Dog",
        description:
          "Stabilità lombare: allunga in diagonale senza ruotare il bacino.",
        imageUrl: null,
        tags: uniq([TAG.core, TAG.colonna, TAG.prehab, TAG.stabilita]),
      },
      {
        name: "Pallof Press (anti-rotazione)",
        description: "Anti-rotazione: bacino fermo, addome attivo.",
        imageUrl: null,
        tags: uniq([TAG.core, TAG.prehab, TAG.stabilita, TAG.cavi]),
      },
      {
        name: "Glute Bridge (attivazione glutei)",
        description:
          "Spingi con i talloni, glutei in lockout. Bacino stabile, controllo.",
        imageUrl: null,
        tags: uniq([TAG.glutei, TAG.anca, TAG.prehab, TAG.isolamento]),
      },
      {
        name: "Clamshell (elastico)",
        description: "Attiva gluteo medio: movimento corto e controllato.",
        imageUrl: null,
        tags: uniq([TAG.glutei, TAG.anca, TAG.prehab, TAG.elastici]),
      },
    ]
  );

  return out
    .map((e) => ({
      ...e,
      name: e.name.trim(),
      description: e.description?.trim() || undefined,
      tags: uniq(e.tags),
      imageUrl: e.imageUrl ?? null,
    }))
    .filter((e) => e.name.length >= 2);
}

async function main() {
  const catalog = buildCatalog();

  const bySlug = new Map<string, SeedExercise>();
  for (const e of catalog) {
    const slug = slugify(e.name);
    bySlug.set(slug, e);
  }

  const entries = Array.from(bySlug.entries());

  let created = 0;
  let updated = 0;

  for (const [slug, e] of entries) {
    const res = await prisma.globalExercise.upsert({
      where: { slug },
      create: {
        slug,
        name: e.name,
        description: e.description ?? null,
        imageUrl: e.imageUrl ?? null,
        tags: e.tags,
      },
      update: {
        name: e.name,
        description: e.description ?? null,
        imageUrl: e.imageUrl ?? null,
        tags: e.tags,
      },
      select: { createdAt: true, updatedAt: true },
    });

    if (+res.createdAt === +res.updatedAt) created++;
    else updated++;
  }

  console.log(
    ` ' GlobalExercise seed completato: ${entries.length} (creati ${created}, aggiornati ${updated})`
  );
  console.log(
    `ℹ️ Tag IT esempio: ${cap(TAG.petto)}, ${cap(TAG.dorso)}, ${cap(
      TAG.quadricipiti
    )}, ${cap(TAG.manubri)}, ${cap(TAG.multiarticolare)}`
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
