/**
 * BATS-style puzzle data + access API.
 *
 * Components MUST go through `listPuzzles()` / `loadPuzzle(id)` / `getDailyPuzzle()`.
 * Today these read from `localLibrary`. To host remotely, swap the bodies for
 * `fetch('/api/puzzles')` etc. — the call sites do not change.
 *
 * Puzzle shape:
 * {
 *   id: string,
 *   batsFamily: "inflectional" | "derivational" | "lexicographic" | "encyclopedic",
 *   batsCategory: string,
 *   par: number,
 *   chain: [{ prompt, answer }, ...]   // chain[0] is the seed example
 * }
 */

const localLibrary = [
  {
    id: "encyclopedic-male-female-001",
    batsFamily: "encyclopedic",
    batsCategory: "male:female",
    par: 5,
    chain: [
      { prompt: "king",   answer: "queen" },
      { prompt: "actor",  answer: "actress" },
      { prompt: "prince", answer: "princess" },
      { prompt: "waiter", answer: "waitress" },
      { prompt: "duke",   answer: "duchess" },
    ],
  },
  {
    id: "encyclopedic-country-capital-001",
    batsFamily: "encyclopedic",
    batsCategory: "country:capital",
    par: 5,
    chain: [
      { prompt: "France", answer: "Paris" },
      { prompt: "Japan",  answer: "Tokyo" },
      { prompt: "Brazil", answer: "Brasília" },
      { prompt: "Egypt",  answer: "Cairo" },
      { prompt: "Russia", answer: "Moscow" },
    ],
  },
  {
    id: "encyclopedic-animal-young-001",
    batsFamily: "encyclopedic",
    batsCategory: "animal:young",
    par: 5,
    chain: [
      { prompt: "bat",      answer: "pup" },
      { prompt: "elephant", answer: "calf" },
      { prompt: "lion",     answer: "cub" },
      { prompt: "walrus",   answer: "pup" },
      { prompt: "kangaroo", answer: "joey" },
    ],
  },
  {
    id: "encyclopedic-animal-sound-001",
    batsFamily: "encyclopedic",
    batsCategory: "animal:sound",
    par: 5,
    chain: [
      { prompt: "pig",    answer: "oink" },
      { prompt: "monkey", answer: "screech" },
      { prompt: "frog",   answer: "ribbit" },
      { prompt: "donkey", answer: "bray" },
      { prompt: "goat",   answer: "bleat" },
    ],
  },
  {
    id: "encyclopedic-product-company-001",
    batsFamily: "encyclopedic",
    batsCategory: "product:company",
    par: 5,
    chain: [
      { prompt: "iPhone",      answer: "Apple" },
      { prompt: "Windows",     answer: "Microsoft" },
      { prompt: "Kindle",      answer: "Amazon" },
      { prompt: "Pixel",       answer: "Google" },
      { prompt: "PlayStation", answer: "Sony" },
    ],
  },
  {
    id: "inflectional-verb-past-tense-002",
    batsFamily: "inflectional",
    batsCategory: "verb:past_tense",
    par: 5,
    chain: [
      { prompt: "sing",  answer: "sang" },
      { prompt: "dance", answer: "danced" },
      { prompt: "write", answer: "wrote" },
      { prompt: "jump",  answer: "jumped" },
      { prompt: "talk",  answer: "talked" },
    ],
  },
  {
    id: "inflectional-noun-plural-001",
    batsFamily: "inflectional",
    batsCategory: "noun:plural",
    par: 5,
    chain: [
      { prompt: "man",   answer: "men" },
      { prompt: "woman", answer: "women" },
      { prompt: "tooth", answer: "teeth" },
      { prompt: "foot",  answer: "feet" },
      { prompt: "mouse", answer: "mice" },
    ],
  },
  {
    id: "inflectional-adj-comparative-001",
    batsFamily: "inflectional",
    batsCategory: "adj:comparative",
    par: 5,
    chain: [
      { prompt: "happy", answer: "happier" },
      { prompt: "tall",  answer: "taller" },
      { prompt: "quick", answer: "quicker" },
      { prompt: "hot",   answer: "hotter" },
      { prompt: "clean", answer: "cleaner" },
    ],
  },
  {
    id: "inflectional-adj-superlative-001",
    batsFamily: "inflectional",
    batsCategory: "adj:superlative",
    par: 5,
    chain: [
      { prompt: "happy", answer: "happiest" },
      { prompt: "tall",  answer: "tallest" },
      { prompt: "quick", answer: "quickest" },
      { prompt: "sad",   answer: "saddest" },
      { prompt: "clean", answer: "cleanest" },
    ],
  },
  {
    id: "inflectional-verb-present-participle-001",
    batsFamily: "inflectional",
    batsCategory: "verb:present_participle",
    par: 5,
    chain: [
      { prompt: "sing",  answer: "singing" },
      { prompt: "dance", answer: "dancing" },
      { prompt: "jump",  answer: "jumping" },
      { prompt: "laugh", answer: "laughing" },
      { prompt: "read",  answer: "reading" },
    ],
  },
  {
    id: "lexicographic-antonyms-001",
    batsFamily: "lexicographic",
    batsCategory: "antonyms",
    par: 5,
    chain: [
      { prompt: "up",    answer: "down" },
      { prompt: "true",  answer: "false" },
      { prompt: "alive", answer: "dead" },
      { prompt: "full",  answer: "empty" },
      { prompt: "heavy", answer: "light" },
    ],
  },
  {
    id: "lexicographic-synonyms-001",
    batsFamily: "lexicographic",
    batsCategory: "synonyms",
    par: 5,
    chain: [
      { prompt: "graceful",  answer: "elegant" },
      { prompt: "sincere",   answer: "genuine" },
      { prompt: "proud",     answer: "boastful" },
      { prompt: "diligent",  answer: "assiduous" },
      { prompt: "miserable", answer: "wretched" },
    ],
  },
  {
    id: "lexicographic-hypernyms-001",
    batsFamily: "lexicographic",
    batsCategory: "hypernyms",
    par: 5,
    chain: [
      { prompt: "lion",   answer: "carnivore" },
      { prompt: "apple",  answer: "fruit" },
      { prompt: "car",    answer: "vehicle" },
      { prompt: "hammer", answer: "tool" },
      { prompt: "oak",    answer: "tree" },
    ],
  },
  {
    id: "lexicographic-part-whole-001",
    batsFamily: "lexicographic",
    batsCategory: "part:whole",
    par: 5,
    chain: [
      { prompt: "wing",  answer: "bird" },
      { prompt: "eye",   answer: "face" },
      { prompt: "tooth", answer: "mouth" },
      { prompt: "ear",   answer: "head" },
      { prompt: "leg",   answer: "body" },
    ],
  },
  {
    id: "lexicographic-member-collection-001",
    batsFamily: "lexicographic",
    batsCategory: "member:collection",
    par: 5,
    chain: [
      { prompt: "word",     answer: "dictionary" },
      { prompt: "word",     answer: "vocabulary" },
      { prompt: "letter",   answer: "alphabet" },
      { prompt: "sentence", answer: "paragraph" },
      { prompt: "phrase",   answer: "idiom" },
    ],
  },
  {
    id: "derivational-verb-noun-002",
    batsFamily: "derivational",
    batsCategory: "verb:noun",
    par: 5,
    chain: [
      { prompt: "invent",      answer: "inventor" },
      { prompt: "paint",       answer: "painter" },
      { prompt: "compose",     answer: "composer" },
      { prompt: "investigate", answer: "investigator" },
      { prompt: "design",      answer: "designer" },
    ],
  },
  {
    id: "derivational-adj-adverb-001",
    batsFamily: "derivational",
    batsCategory: "adj:adverb",
    par: 5,
    chain: [
      { prompt: "calm",   answer: "calmly" },
      { prompt: "gentle", answer: "gently" },
      { prompt: "loud",   answer: "loudly" },
      { prompt: "quiet",  answer: "quietly" },
      { prompt: "warm",   answer: "warmly" },
    ],
  },
  {
    id: "derivational-noun-adj-001",
    batsFamily: "derivational",
    batsCategory: "noun:adj",
    par: 5,
    chain: [
      { prompt: "sadness", answer: "sad" },
      { prompt: "hope",    answer: "hopeful" },
      { prompt: "peace",   answer: "peaceful" },
      { prompt: "fear",    answer: "fearful" },
      { prompt: "wisdom",  answer: "wise" },
    ],
  },
  {
    id: "derivational-adj-noun-001",
    batsFamily: "derivational",
    batsCategory: "adj:noun",
    par: 5,
    chain: [
      { prompt: "graceful", answer: "gracefulness" },
      { prompt: "bitter",   answer: "bitterness" },
      { prompt: "fragile",  answer: "fragility" },
      { prompt: "silly",    answer: "silliness" },
      { prompt: "serene",   answer: "serenity" },
    ],
  },
];

/**
 * Returns lightweight metadata for every puzzle.
 * Replace body with `fetch('/api/puzzles').then(r => r.json())` when going remote.
 */
export async function listPuzzles() {
  return localLibrary.map((p, i) => ({
    number: i + 1,
    id: p.id,
    batsFamily: p.batsFamily,
    batsCategory: p.batsCategory,
    par: p.par,
  }));
}

/**
 * Loads a single puzzle (with answers).
 * Replace body with `fetch('/api/puzzles/' + id).then(r => r.json())` when going remote.
 * The remote version should strip future-step answers and validate guesses server-side.
 */
export async function loadPuzzle(id) {
  return localLibrary.find((p) => p.id === id) ?? null;
}

/**
 * Picks today's puzzle deterministically by date.
 * Replace body with `fetch('/api/puzzle/today').then(r => r.json())` when going remote.
 */
const LAUNCH_DATE = new Date(2026, 3, 28); // local midnight; month is 0-indexed → April 28
const MS_PER_DAY = 86_400_000;

export async function getDailyPuzzle(today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayNumber = Math.max(0, Math.floor((start - LAUNCH_DATE) / MS_PER_DAY));
  const puzzle = localLibrary[dayNumber % localLibrary.length];
  return { ...puzzle, puzzleNumber: dayNumber + 1, date: start.toISOString().slice(0, 10) };
}
