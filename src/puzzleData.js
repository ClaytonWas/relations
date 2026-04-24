/**
 * BATS-style puzzle data structure.
 *
 * Each puzzle belongs to a BATS family + subcategory.
 * `chain` is a sequence of word pairs sharing the same relation.
 * The player sees pair[0] as the seed example, then must guess
 * the answer for each subsequent link to unlock the next.
 *
 * JSON shape for a single puzzle:
 * {
 *   "id": "string — unique puzzle identifier",
 *   "batsFamily": "inflectional | derivational | lexicographic | encyclopedic",
 *   "batsCategory": "string — e.g. 'male:female', 'country:capital', 'verb:past_tense'",
 *   "par": number — expected number of guesses to complete the chain,
 *   "chain": [
 *     { "prompt": "word A", "answer": "word B" },
 *     ...
 *   ]
 * }
 *
 * chain[0] is always shown as a free example.
 * The player guesses chain[1..N-1] in order.
 */

export const samplePuzzle = {
  id: "enc-male-female-001",
  batsFamily: "encyclopedic",
  batsCategory: "male:female",
  par: 10,
  chain: [
    { prompt: "King",   answer: "Queen"    }, // seed — shown to player
    { prompt: "Jester", answer: "Fool"     }, // step 1
    { prompt: "Knight", answer: "Dame"     }, // step 2
    { prompt: "Duke",   answer: "Duchess"  }, // step 3
    { prompt: "Lord",   answer: "Lady"     }, // step 4
  ],
};

/**
 * Library of multiple puzzles (one per BATS subcategory).
 * Extend this array with real BATS data as needed.
 */
export const puzzleLibrary = [
  samplePuzzle,

  {
    id: "enc-country-capital-001",
    batsFamily: "encyclopedic",
    batsCategory: "country:capital",
    par: 10,
    chain: [
      { prompt: "France",  answer: "Paris"    },
      { prompt: "Japan",   answer: "Tokyo"    },
      { prompt: "Brazil",  answer: "Brasília" },
      { prompt: "Egypt",   answer: "Cairo"    },
      { prompt: "Canada",  answer: "Ottawa"   },
    ],
  },

  {
    id: "infl-verb-past-001",
    batsFamily: "inflectional",
    batsCategory: "verb:past_tense",
    par: 3,
    chain: [
      { prompt: "walk",  answer: "walked" },
      { prompt: "run",   answer: "ran"    },
      { prompt: "swim",  answer: "swam"   },
      { prompt: "fly",   answer: "flew"   },
      { prompt: "drive", answer: "drove"  },
    ],
  },

  {
    id: "lex-antonym-001",
    batsFamily: "lexicographic",
    batsCategory: "antonyms",
    par: 3,
    chain: [
      { prompt: "hot",   answer: "cold"  },
      { prompt: "light", answer: "dark"  },
      { prompt: "fast",  answer: "slow"  },
      { prompt: "loud",  answer: "quiet" },
      { prompt: "hard",  answer: "soft"  },
    ],
  },
];
