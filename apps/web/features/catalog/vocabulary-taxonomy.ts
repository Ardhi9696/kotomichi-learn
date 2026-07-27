import type {
  VocabularyAdjectiveType,
  VocabularyPartOfSpeech,
  VocabularyTheme,
  VocabularyTransitivity,
  VocabularyVerbGroup,
} from '@/features/catalog/types';

export const partOfSpeechLabels: Record<VocabularyPartOfSpeech, string> = {
  noun: 'Kata benda',
  verb: 'Kata kerja',
  adjective: 'Kata sifat',
  other: 'Lainnya',
};

export const verbGroupLabels: Record<VocabularyVerbGroup, string> = {
  godan: 'Godan',
  ichidan: 'Ichidan',
  irregular: 'Tidak beraturan',
};

export const transitivityLabels: Record<VocabularyTransitivity, string> = {
  transitive: 'Transitif',
  intransitive: 'Intransitif',
};

export const adjectiveTypeLabels: Record<VocabularyAdjectiveType, string> = {
  i: 'Kata sifat い',
  na: 'Kata sifat な',
};

export const themeLabels: Record<VocabularyTheme, string> = {
  numbers_units: 'Angka & satuan',
  self_family: 'Diri & keluarga',
  time_weather: 'Waktu & cuaca',
  daily_life: 'Kehidupan sehari-hari',
  food_drink: 'Makanan & minuman',
  school_work: 'Sekolah & pekerjaan',
  travel_places: 'Perjalanan & tempat',
  nature_health: 'Alam & kesehatan',
  communication_feelings: 'Komunikasi & perasaan',
};
