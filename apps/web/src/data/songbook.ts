import type { CollectionStatus, CollectionType, SongStatus } from "@monorepo/core";

// Local seed data shaped after the core domain (see CONTEXT.md). The screens
// read from here today; swap for the generated hooks in @monorepo/core/api
// once the auth flow lands.

export type CoverVariant = "warm" | "neutral" | "terracotta" | "sage" | "demos" | "none";

export interface LyricSection {
  label: string; // "verso 1", "refrão", "ponte"…
  lines: string[];
}

export interface LyricVersion {
  id: string;
  label: string; // "v1", "v2"…
  isPrimary: boolean;
  dateLabel: string; // "12 mar"
  sections: LyricSection[];
}

export interface AudioAsset {
  filename: string;
  durationLabel: string;
  durationSeconds: number;
  /** waveform bar heights, 0–100 */
  samples: number[];
}

export interface SeedSong {
  id: string;
  title: string;
  status: SongStatus;
  key: string | null;
  bpm: number | null;
  tags: string[];
  cover: CoverVariant;
  isFavorite: boolean;
  audio: AudioAsset | null;
  versions: LyricVersion[];
  chordChart: string | null;
  tablature: string | null;
  updatedAtRank: number; // lower = more recent, drives "Recentes"
}

export interface SeedTrack {
  songId: string;
  durationLabel: string | null; // null → "só áudio"
}

export interface SeedCollection {
  id: string;
  type: CollectionType;
  title: string;
  typeLabel: string; // small label on the cover: "EP" / "demos" / "single"
  status: CollectionStatus;
  description: string | null;
  cover: CoverVariant;
  totalLabel: string; // "18 min"
  tracks: SeedTrack[];
}

export const statusLabel: Record<SongStatus, string> = {
  draft: "rascunho",
  in_progress: "em progresso",
  finished: "finalizada",
};

export const collectionStatusLabel: Record<CollectionStatus, string> = {
  draft: "rascunho",
  in_progress: "em progresso",
  released: "finalizado",
};

const wave = (...samples: number[]) => samples;

const mareLyrics: LyricSection[] = [
  {
    label: "verso 1",
    lines: [
      "A maré sobe sem pedir licença",
      "leva o que eu não quis guardar",
      "e na areia fica a tua ausência",
      "desenhada pra ninguém pisar",
    ],
  },
  {
    label: "refrão",
    lines: [
      "outubro me devolve o mar",
      "devagar, devagar",
      "o que partiu também é maré",
      "e maré sempre volta a chegar",
    ],
  },
];

const mareLyricsV1: LyricSection[] = [
  {
    label: "verso 1",
    lines: [
      "A maré sobe devagarinho",
      "leva o que eu deixei no cais",
      "e na areia fica o teu caminho",
      "que a água não apaga mais",
    ],
  },
  {
    label: "refrão",
    lines: ["outubro me devolve o mar", "devagar, devagar…"],
  },
];

export const songs: SeedSong[] = [
  {
    id: "mare-de-outubro",
    title: "Maré de Outubro",
    status: "finished",
    key: "Lá",
    bpm: 92,
    tags: ["violão", "balada"],
    cover: "warm",
    isFavorite: true,
    audio: {
      filename: "demo_violao_v2.m4a",
      durationLabel: "2:34",
      durationSeconds: 154,
      samples: wave(50, 80, 100, 60, 90, 45, 70, 55, 85, 40, 65, 75, 35, 60),
    },
    versions: [
      { id: "v2", label: "v2", isPrimary: true, dateLabel: "2 abr", sections: mareLyrics },
      { id: "v1", label: "v1", isPrimary: false, dateLabel: "12 mar", sections: mareLyricsV1 },
    ],
    chordChart: [
      "[verso 1]",
      "A            E/G#",
      "A maré sobe sem pedir licença",
      "F#m          D",
      "leva o que eu não quis guardar",
    ].join("\n"),
    tablature: [
      "e|-----0-----0-----------|",
      "B|--------2-----2--------|",
      "G|-----------------2-----|",
      "D|--2--------------------|",
      "A|-----------------------|",
      "E|-----------------------|",
    ].join("\n"),
    updatedAtRank: 0,
  },
  {
    id: "cabo-da-boa-esperanca",
    title: "Cabo da Boa Esperança",
    status: "in_progress",
    key: "Ré",
    bpm: 76,
    tags: ["demo"],
    cover: "neutral",
    isFavorite: false,
    audio: {
      filename: "voz_e_violao.m4a",
      durationLabel: "2:58",
      durationSeconds: 178,
      samples: wave(40, 70, 100, 55, 80, 45, 65, 35, 75, 50, 60, 30),
    },
    versions: [
      {
        id: "v1",
        label: "v1",
        isPrimary: true,
        dateLabel: "28 mai",
        sections: [
          {
            label: "verso 1",
            lines: [
              "Dobrei o cabo sem saber o nome",
              "da esperança que ficou pra trás",
            ],
          },
        ],
      },
    ],
    chordChart: null,
    tablature: null,
    updatedAtRank: 1,
  },
  {
    id: "ideia-sem-nome",
    title: "ideia sem nome",
    status: "draft",
    key: null,
    bpm: null,
    tags: ["captura rápida"],
    cover: "none",
    isFavorite: false,
    audio: {
      filename: "captura_23jun.m4a",
      durationLabel: "0:48",
      durationSeconds: 48,
      samples: wave(30, 60, 90, 100, 70, 45, 80, 55, 35, 65),
    },
    versions: [],
    chordChart: null,
    tablature: null,
    updatedAtRank: 2,
  },
  {
    id: "folha-seca",
    title: "Folha Seca",
    status: "finished",
    key: "Sol",
    bpm: 120,
    tags: ["elétrica"],
    cover: "warm",
    isFavorite: true,
    audio: {
      filename: "folha_seca_master.wav",
      durationLabel: "3:21",
      durationSeconds: 201,
      samples: wave(60, 85, 100, 70, 90, 55, 75, 45, 80, 65, 50, 40),
    },
    versions: [
      {
        id: "v1",
        label: "v1",
        isPrimary: true,
        dateLabel: "9 fev",
        sections: [
          {
            label: "verso 1",
            lines: ["Folha seca no quintal", "gira e não quer pousar"],
          },
        ],
      },
    ],
    chordChart: null,
    tablature: null,
    updatedAtRank: 3,
  },
  {
    id: "por-do-sol-no-retrovisor",
    title: "Pôr-do-sol no Retrovisor",
    status: "in_progress",
    key: "Mi",
    bpm: 88,
    tags: ["estrada"],
    cover: "neutral",
    isFavorite: false,
    audio: {
      filename: "retrovisor_ideia.m4a",
      durationLabel: "3:10",
      durationSeconds: 190,
      samples: wave(45, 75, 95, 60, 85, 50, 70, 40, 80, 55, 65, 35),
    },
    versions: [
      {
        id: "v1",
        label: "v1",
        isPrimary: true,
        dateLabel: "17 jun",
        sections: [
          {
            label: "verso 1",
            lines: ["O sol se despede no espelho", "e a estrada segue sem parar"],
          },
        ],
      },
    ],
    chordChart: null,
    tablature: null,
    updatedAtRank: 4,
  },
  {
    id: "quintal-vazio",
    title: "Quintal Vazio",
    status: "finished",
    key: "Dó",
    bpm: 72,
    tags: ["violão"],
    cover: "warm",
    isFavorite: false,
    audio: {
      filename: "quintal_vazio.m4a",
      durationLabel: "4:05",
      durationSeconds: 245,
      samples: wave(35, 65, 90, 100, 75, 50, 85, 60, 40, 70, 55, 45),
    },
    versions: [
      {
        id: "v1",
        label: "v1",
        isPrimary: true,
        dateLabel: "3 jan",
        sections: [
          {
            label: "verso 1",
            lines: ["O quintal ficou vazio", "desde que você mudou"],
          },
        ],
      },
    ],
    chordChart: null,
    tablature: null,
    updatedAtRank: 5,
  },
  {
    id: "areia-fina",
    title: "Areia Fina",
    status: "draft",
    key: "Sol",
    bpm: 96,
    tags: ["demo"],
    cover: "neutral",
    isFavorite: false,
    audio: null,
    versions: [],
    chordChart: null,
    tablature: null,
    updatedAtRank: 6,
  },
  {
    id: "baiao-de-dois-tempos",
    title: "Baião de Dois Tempos",
    status: "in_progress",
    key: "Mi",
    bpm: 104,
    tags: ["baião"],
    cover: "warm",
    isFavorite: false,
    audio: null,
    versions: [],
    chordChart: null,
    tablature: null,
    updatedAtRank: 7,
  },
  {
    id: "estrada-de-terra",
    title: "Estrada de Terra",
    status: "draft",
    key: null,
    bpm: null,
    tags: ["estrada"],
    cover: "none",
    isFavorite: false,
    audio: null,
    versions: [],
    chordChart: null,
    tablature: null,
    updatedAtRank: 8,
  },
  {
    id: "girassol-de-inverno",
    title: "Girassol de Inverno",
    status: "in_progress",
    key: "Fá",
    bpm: 84,
    tags: ["balada"],
    cover: "neutral",
    isFavorite: true,
    audio: null,
    versions: [],
    chordChart: null,
    tablature: null,
    updatedAtRank: 9,
  },
  {
    id: "noite-de-feira",
    title: "Noite de Feira",
    status: "draft",
    key: "Ré",
    bpm: 110,
    tags: ["forró"],
    cover: "warm",
    isFavorite: false,
    audio: null,
    versions: [],
    chordChart: null,
    tablature: null,
    updatedAtRank: 10,
  },
  {
    id: "vento-sul",
    title: "Vento Sul",
    status: "in_progress",
    key: "Lá",
    bpm: 68,
    tags: ["voz e violão"],
    cover: "neutral",
    isFavorite: false,
    audio: null,
    versions: [],
    chordChart: null,
    tablature: null,
    updatedAtRank: 11,
  },
];

export const collections: SeedCollection[] = [
  {
    id: "mare-ep",
    type: "album",
    title: "Maré",
    typeLabel: "EP",
    status: "in_progress",
    description: "Coletânea de outono. Gravações de violão e voz, ainda cruas.",
    cover: "terracotta",
    totalLabel: "18 min",
    tracks: [
      { songId: "mare-de-outubro", durationLabel: "3:42" },
      { songId: "cabo-da-boa-esperanca", durationLabel: "2:58" },
      { songId: "por-do-sol-no-retrovisor", durationLabel: "3:10" },
      { songId: "ideia-sem-nome", durationLabel: null },
      { songId: "quintal-vazio", durationLabel: "4:05" },
    ],
  },
  {
    id: "demos-2025",
    type: "album",
    title: "Demos 2025",
    typeLabel: "demos",
    status: "draft",
    description: "Ideias do ano — tudo que ainda procura forma.",
    cover: "demos",
    totalLabel: "26 min",
    tracks: [
      { songId: "areia-fina", durationLabel: "2:44" },
      { songId: "baiao-de-dois-tempos", durationLabel: "3:02" },
      { songId: "estrada-de-terra", durationLabel: null },
      { songId: "girassol-de-inverno", durationLabel: "3:36" },
      { songId: "noite-de-feira", durationLabel: "2:51" },
      { songId: "vento-sul", durationLabel: "4:12" },
      { songId: "cabo-da-boa-esperanca", durationLabel: "2:58" },
      { songId: "ideia-sem-nome", durationLabel: null },
    ],
  },
  {
    id: "folha-seca-single",
    type: "single",
    title: "Folha Seca",
    typeLabel: "single",
    status: "released",
    description: null,
    cover: "sage",
    totalLabel: "3 min",
    tracks: [{ songId: "folha-seca", durationLabel: "3:21" }],
  },
];

export const userName = "Téo";
export const todayLabel = "terça · 23 jun";

export function getSong(id: string | undefined): SeedSong | undefined {
  return songs.find((s) => s.id === id);
}

export function getCollection(id: string | undefined): SeedCollection | undefined {
  return collections.find((c) => c.id === id);
}

export function recentSongs(count: number): SeedSong[] {
  return [...songs].sort((a, b) => a.updatedAtRank - b.updatedAtRank).slice(0, count);
}

export function songMeta(song: SeedSong): string {
  if (song.status === "draft" && !song.key) {
    return song.audio ? "rascunho · só áudio" : "rascunho";
  }
  return `${song.key} · ${song.bpm} BPM`;
}

export function primaryVersion(song: SeedSong): LyricVersion | undefined {
  return song.versions.find((v) => v.isPrimary) ?? song.versions[0];
}
