import { useState, useRef, useEffect } from "react";
import { listPuzzles, loadPuzzle, getDailyPuzzle } from "./puzzleData";

function levenshtein(a, b) {
  const s = a.toLowerCase().trim();
  const t = b.toLowerCase().trim();
  if (s === t) return 0;
  const m = s.length, n = t.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// Wordle-style coloring of the player's guess against the answer.
// Returns same-length array of "hit" | "present" | "miss". Operates on lowercased strings.
function wordleColors(guess, answer) {
  const g = guess.toLowerCase();
  const a = answer.toLowerCase();
  const result = new Array(g.length).fill("miss");
  const remaining = {};
  for (let i = 0; i < a.length; i++) {
    if (g[i] === a[i]) {
      result[i] = "hit";
    } else {
      remaining[a[i]] = (remaining[a[i]] ?? 0) + 1;
    }
  }
  for (let i = 0; i < g.length; i++) {
    if (result[i] === "hit") continue;
    if (remaining[g[i]]) {
      result[i] = "present";
      remaining[g[i]]--;
    }
  }
  return result;
}

// Deterministic morphology check keyed on batsCategory.
// Returns { matched: bool, label: string } or null when the category has no useful pattern.
const IRREGULAR_PLURALS = new Set(["men","women","children","teeth","feet","mice","geese","oxen","people"]);
const FEMALE_SUFFIXES = ["ess","ress","ine","trix","ette"];

function morphologyCheck(category, guess) {
  const g = guess.toLowerCase().trim();
  if (!g) return null;
  switch (category) {
    case "verb:past_tense":
      return { matched: g.endsWith("ed") || g.length >= 3, label: g.endsWith("ed") ? "✓ ends in -ed" : "expected -ed (or strong past form)" };
    case "verb:present_participle":
      return { matched: g.endsWith("ing"), label: g.endsWith("ing") ? "✓ ends in -ing" : "expected -ing" };
    case "adj:comparative":
      return { matched: g.endsWith("er"), label: g.endsWith("er") ? "✓ ends in -er" : "expected -er" };
    case "adj:superlative":
      return { matched: g.endsWith("est"), label: g.endsWith("est") ? "✓ ends in -est" : "expected -est" };
    case "adj:adverb":
      return { matched: g.endsWith("ly"), label: g.endsWith("ly") ? "✓ ends in -ly" : "expected -ly" };
    case "noun:plural": {
      const ok = g.endsWith("s") || g.endsWith("es") || IRREGULAR_PLURALS.has(g);
      return { matched: ok, label: ok ? "✓ plural form" : "expected a plural form" };
    }
    case "male:female": {
      const ok = FEMALE_SUFFIXES.some((s) => g.endsWith(s));
      return { matched: ok, label: ok ? "✓ female-marked" : "expected a female form" };
    }
    default:
      return null;
  }
}

// How many letters of the answer to reveal given wrong-guess count.
// 0 wrongs → nothing. 1 → length only. 3 → +1st letter. 5 → +2nd. 7 → full answer.
function revealCount(wrongCount) {
  if (wrongCount >= 7) return Infinity;
  if (wrongCount >= 5) return 2;
  if (wrongCount >= 3) return 1;
  return 0;
}

const CATEGORY_LABELS = {
  inflectional: "Inflectional Morphology",
  derivational: "Derivational Morphology",
  lexicographic: "Lexicographic Semantics",
  encyclopedic: "Encyclopedic Semantics",
};

function StepRow({ stepIndex, stepGuesses, isActive, isSolved, isExpanded, onToggle }) {
  const top5 = [...stepGuesses]
    .sort((a, b) => b.score - a.score)
    .filter((g, idx, arr) =>
      arr.findIndex((x) => x.guess.toLowerCase() === g.guess.toLowerCase()) === idx
    )
    .slice(0, 5);

  const best = top5[0] ?? null;
  const guessCount = stepGuesses.length;
  const canExpand = (isActive || isSolved) && guessCount > 0;

  return (
    <li
      style={{
        borderRadius: 4,
        border: "1px solid #e5e0d8",
        overflow: "hidden",
        fontSize: 13,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 14px",
          textAlign: "left",
          background: isSolved ? "#f7f4ef" : isActive ? "#fffff8" : "#f7f4ef",
          cursor: canExpand ? "pointer" : "default",
          border: "none",
          transition: "background 0.15s",
        }}
      >
        <span
          style={{
            color: "#a09880",
            fontSize: 11,
            fontFamily: "'Playfair Display', serif",
            fontStyle: "italic",
            width: 44,
            flexShrink: 0,
            letterSpacing: "0.02em",
          }}
        >
          {stepIndex}
        </span>

        {isSolved ? (
          <span
            style={{
              color: "#1a3a5c",
              fontWeight: 700,
              flex: 1,
              fontFamily: "'Playfair Display', serif",
              fontSize: 14,
            }}
          >
            {best?.guess}
          </span>
        ) : best ? (
          <span style={{ color: "#3d3529", fontWeight: 600, flex: 1, fontFamily: "Georgia, serif" }}>
            {best.guess}
          </span>
        ) : (
          <span style={{ color: "#c5bdb0", fontStyle: "italic", flex: 1 }}>not attempted</span>
        )}

        <span style={{ color: "#a09880", fontSize: 11, flexShrink: 0 }}>
          {guessCount} {guessCount !== 1 ? "guesses" : "guess"}
        </span>

        {isSolved && (
          <span
            style={{
              background: "#1a3a5c",
              color: "white",
              borderRadius: "50%",
              width: 18,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              flexShrink: 0,
              fontWeight: 700,
            }}
          >
            ✓
          </span>
        )}

        {canExpand && (
          <span style={{ color: "#a09880", fontSize: 10, marginLeft: 2 }}>
            {isExpanded ? "▲" : "▼"}
          </span>
        )}
      </button>

      {isExpanded && top5.length > 0 && (
        <ul
          style={{
            borderTop: "1px solid #e5e0d8",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {top5.map((g, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 14px",
                background: "white",
                borderBottom: i < top5.length - 1 ? "1px solid #f0ebe3" : "none",
              }}
            >
              <span style={{ color: "#c5bdb0", fontSize: 10, width: 16, textAlign: "right", flexShrink: 0 }}>
                #{i + 1}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  flex: 1,
                  fontFamily: "Georgia, serif",
                  color: g.correct ? "#1a3a5c" : "#3d3529",
                  fontSize: 13,
                }}
              >
                {g.guess}
              </span>
              <span style={{ color: g.correct ? "#1a3a5c" : "#a09880", fontSize: 11, flexShrink: 0 }}>
                {g.correct ? "✓ correct" : `${Math.round(g.score * 100)}% match`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function WordleRow({ guess, colors }) {
  const palette = {
    hit:     { bg: "#1a3a5c", color: "white",   border: "#1a3a5c" },
    present: { bg: "#c9a227", color: "white",   border: "#c9a227" },
    miss:    { bg: "#e5e0d8", color: "#6b6153", border: "#d6cfc1" },
  };
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
      {guess.split("").map((ch, i) => {
        const c = palette[colors[i] ?? "miss"];
        return (
          <span
            key={i}
            style={{
              width: 26, height: 26,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: c.bg, color: c.color,
              border: `1px solid ${c.border}`,
              borderRadius: 3,
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700, fontSize: 14,
              textTransform: "uppercase",
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
}

function FeedbackPanel({ answer, stepGuesses }) {
  const wrongs = stepGuesses.filter((g) => !g.correct);
  if (wrongs.length === 0) return null;
  const latest = wrongs[wrongs.length - 1];
  const reveal = revealCount(wrongs.length);
  const revealedFull = reveal === Infinity;
  const revealedLen = revealedFull ? answer.length : reveal;

  const scaffold = answer
    .split("")
    .map((ch, i) => (i < revealedLen ? ch : "_"))
    .join(" ");

  return (
    <div
      style={{
        marginTop: 4,
        background: "white",
        border: "1px solid #e5e0d8",
        borderRadius: 4,
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        animation: "pulse-in 0.3s ease",
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#a09880",
          fontFamily: "'Playfair Display', serif",
          fontStyle: "italic",
          textAlign: "center",
        }}
      >
        Last guess
      </div>

      <WordleRow guess={latest.guess} colors={latest.colors ?? []} />

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          flexWrap: "wrap",
          fontSize: 11,
          color: "#6b6153",
          fontFamily: "Georgia, serif",
        }}
      >
        <span
          style={{
            padding: "3px 9px",
            background: "#f7f4ef",
            border: "1px solid #e5e0d8",
            borderRadius: 999,
          }}
        >
          {latest.distance} edit{latest.distance !== 1 ? "s" : ""} away
        </span>
        {latest.morphology && (
          <span
            style={{
              padding: "3px 9px",
              background: latest.morphology.matched ? "#eef3f9" : "#fdf2f1",
              border: `1px solid ${latest.morphology.matched ? "#1a3a5c" : "#e2bdb7"}`,
              color: latest.morphology.matched ? "#1a3a5c" : "#8c3a2e",
              borderRadius: 999,
            }}
          >
            {latest.morphology.label}
          </span>
        )}
        <span
          style={{
            padding: "3px 9px",
            background: "#f7f4ef",
            border: "1px solid #e5e0d8",
            borderRadius: 999,
          }}
        >
          answer is {answer.length} letter{answer.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div
        style={{
          textAlign: "center",
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: "0.12em",
          color: revealedFull ? "#1a3a5c" : "#3d3529",
          paddingTop: 4,
          borderTop: "1px solid #f0ebe3",
        }}
      >
        {scaffold}
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: 10,
          color: "#a09880",
          fontFamily: "'Playfair Display', serif",
          fontStyle: "italic",
          letterSpacing: "0.06em",
        }}
      >
        {revealedFull
          ? "answer revealed — type it to advance"
          : reveal === 0
          ? `${3 - wrongs.length} more wrong guess${3 - wrongs.length !== 1 ? "es" : ""} reveals the first letter`
          : `${(reveal === 1 ? 5 : 7) - wrongs.length} more reveals ${reveal === 1 ? "another letter" : "the answer"}`}
      </div>
    </div>
  );
}

function ChainTile({ link, index, isExample, shake, pulse }) {
  if (isExample) {
    return (
      <div style={{ position: "relative", paddingTop: 12 }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 18,
            background: "#e5e0d8",
            color: "#a09880",
            padding: "2px 8px",
            fontSize: 10,
            fontWeight: 700,
            borderRadius: "4px 4px 0 0",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Start
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 14,
            width: "100%",
            background: "white",
            border: "1px solid #e5e0d8",
            borderRadius: 4,
            padding: "12px 18px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: 17,
              color: "#1c1813",
              letterSpacing: "0.01em",
              textAlign: "left",
            }}
          >
            {link.prompt}
          </span>
          <span style={{ color: "#c5bdb0", fontSize: 14, fontStyle: "italic" }}>
            is to
          </span>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: 17,
              color: "#1a3a5c",
              letterSpacing: "0.01em",
              textAlign: "right",
            }}
          >
            {link.answer}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: 14,
        width: "100%",
        background: "white",
        border: "1px solid #e5e0d8",
        borderRadius: 4,
        padding: "12px 18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        animation: shake ? "shake 0.4s ease" : pulse ? "pulse-in 0.3s ease" : "none",
      }}
    >
      <span
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          fontSize: 17,
          color: "#1c1813",
          letterSpacing: "0.01em",
          textAlign: "left",
        }}
      >
        {link.prompt}
      </span>
      <span style={{ color: "#c5bdb0", fontSize: 14, fontStyle: "italic" }}>
        is to
      </span>
      <span
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          fontSize: 17,
          color: "#1a3a5c",
          letterSpacing: "0.01em",
          textAlign: "right",
        }}
      >
        {link.answer}
      </span>
    </div>
  );
}

export default function App() {
  const [puzzleList, setPuzzleList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [guessHistory, setGuessHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [expandedStep, setExpandedStep] = useState(null);
  const [shakingInput, setShakingInput] = useState(false);
  const [newTileIndex, setNewTileIndex] = useState(null);
  const inputRef = useRef(null);

  // Load the puzzle list once, and seed the selection with today's daily.
  useEffect(() => {
    let cancelled = false;
    Promise.all([listPuzzles(), getDailyPuzzle()]).then(([list, daily]) => {
      if (cancelled) return;
      setPuzzleList(list);
      setSelectedId(daily.id);
    });
    return () => { cancelled = true; };
  }, []);

  // Whenever the selected puzzle changes, fetch it and reset all game state.
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    loadPuzzle(selectedId).then((p) => {
      if (cancelled || !p) return;
      setPuzzle(p);
      setCurrentStep(1);
      setInputValue("");
      setTotalGuesses(0);
      setGuessHistory([]);
      setFeedback(null);
      setCompleted(false);
      setExpandedStep(null);
      setShakingInput(false);
      setNewTileIndex(null);
    });
    return () => { cancelled = true; };
  }, [selectedId]);

  if (!puzzle) {
    return (
      <div style={{ minHeight: "100vh", background: "#faf8f4", display: "flex", alignItems: "center", justifyContent: "center", color: "#a09880", fontFamily: "Georgia, serif" }}>
        Loading…
      </div>
    );
  }

  const isFinished = currentStep >= puzzle.chain.length;
  const currentLink = puzzle.chain[currentStep] ?? null;
  const revealedPairs = puzzle.chain.slice(0, currentStep);
  const guessableSteps = puzzle.chain.slice(1);

  function handleGuess() {
    if (!inputValue.trim() || isFinished) return;
    const guess = inputValue.trim();
    const answer = currentLink.answer;
    const isCorrect = guess.toLowerCase() === answer.toLowerCase();
    const distance = levenshtein(guess, answer);
    const longer = Math.max(guess.length, answer.length, 1);
    const score = 1 - distance / longer;
    const colors = wordleColors(guess, answer);
    const morphology = morphologyCheck(puzzle.batsCategory, guess);

    setGuessHistory((prev) => [...prev, { guess, step: currentStep, correct: isCorrect, score, distance, colors, morphology }]);
    setTotalGuesses((n) => n + 1);
    setInputValue("");
    setFeedback(isCorrect ? "correct" : "wrong");
    setExpandedStep(currentStep);

    if (isCorrect) {
      setNewTileIndex(currentStep);
      setTimeout(() => setNewTileIndex(null), 500);
      const nextStep = currentStep + 1;
      setExpandedStep(nextStep < puzzle.chain.length ? nextStep : null);
      if (nextStep >= puzzle.chain.length) {
        setCompleted(true);
        setExpandedStep(null);
      }
      setCurrentStep(nextStep);
    } else {
      setShakingInput(true);
      setTimeout(() => setShakingInput(false), 400);
    }

    setTimeout(() => setFeedback(null), 800);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleGuess();
  }

  function handleStepToggle(stepIdx) {
    const isSolved = stepIdx < currentStep;
    const isActive = stepIdx === currentStep;
    if (!isSolved && !isActive) return;
    setExpandedStep((prev) => (prev === stepIdx ? null : stepIdx));
  }

  const inputBorderColor =
    feedback === "correct" ? "#1a3a5c" :
    feedback === "wrong"   ? "#c0392b" :
    "#1a3a5c";

  const inputBg =
    feedback === "correct" ? "#eef3f9" :
    feedback === "wrong"   ? "#fdf2f1" :
    "white";

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes pulse-in {
          0% { opacity: 0; transform: translateY(-6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: #c5bdb0; }
        input:focus { outline: none; }
        * { box-sizing: border-box; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#faf8f4",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "48px 16px 64px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#1c1813",
        }}
      >
        {/* Puzzle picker */}
        <div
          style={{
            width: "100%",
            maxWidth: 440,
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 28,
            fontFamily: "Georgia, serif",
          }}
        >
          <label
            htmlFor="puzzle-picker"
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#a09880",
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
              flexShrink: 0,
            }}
          >
            Puzzle
          </label>
          <select
            id="puzzle-picker"
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 10px",
              border: "1px solid #e5e0d8",
              borderRadius: 4,
              background: "white",
              fontFamily: "Georgia, serif",
              fontSize: 13,
              color: "#1c1813",
              cursor: "pointer",
            }}
          >
            {puzzleList.map((p) => (
              <option key={p.id} value={p.id}>
                {String(p.number).padStart(2, "0")} · {p.batsFamily} — {p.batsCategory}
              </option>
            ))}
          </select>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", maxWidth: 480, marginBottom: 36, animation: "fade-up 0.5s ease" }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#a09880",
              marginBottom: 10,
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
            }}
          >
            Word Game
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: 0,
              color: "#1c1813",
              lineHeight: 1,
            }}
          >
            Relations
          </h1>

          <div
            style={{
              width: 36,
              height: 2,
              background: "#1a3a5c",
              margin: "14px auto",
              borderRadius: 1,
            }}
          />

          <p
            style={{
              fontSize: 15,
              color: "#6b6153",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Find the word that continues the relationship at each step.
          </p>
        </div>

        {/* Chain */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            width: "100%",
            maxWidth: 440,
            marginBottom: 16,
          }}
        >
          {revealedPairs.map((link, i) => (
            <ChainTile
              key={i}
              link={link}
              index={i}
              isExample={i === 0}
              pulse={i === newTileIndex}
            />
          ))}

          {/* Active input row */}
          {!completed && currentLink && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "center",
                gap: 14,
                width: "100%",
                background: inputBg,
                border: `2px solid ${inputBorderColor}`,
                borderRadius: 4,
                padding: "10px 18px",
                boxShadow: "0 2px 8px rgba(26,58,92,0.10)",
                transition: "background 0.2s, border-color 0.2s",
                animation: shakingInput ? "shake 0.4s ease" : "none",
              }}
            >
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 700,
                  fontSize: 17,
                  color: "#1c1813",
                  letterSpacing: "0.01em",
                  textAlign: "left",
                }}
              >
                {currentLink.prompt}
              </span>
              <span style={{ color: "#c5bdb0", fontSize: 14, fontStyle: "italic" }}>
                is to
              </span>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="your answer"
                autoFocus
                style={{
                  border: "none",
                  background: "transparent",
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 700,
                  fontSize: 17,
                  color: "#1a3a5c",
                  width: "100%",
                  textAlign: "right",
                  letterSpacing: "0.01em",
                }}
              />
            </div>
          )}

          {/* Per-guess feedback for the active step */}
          {!completed && currentLink && (
            <FeedbackPanel
              answer={currentLink.answer}
              stepGuesses={guessHistory.filter((g) => g.step === currentStep)}
            />
          )}

          {/* Completion banner */}
          {completed && (
            <div
              style={{
                background: "#1a3a5c",
                border: "none",
                borderRadius: 4,
                padding: "16px 20px",
                textAlign: "center",
                animation: "pulse-in 0.4s ease",
              }}
            >
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "white",
                  marginBottom: 4,
                }}
              >
                Chain Complete
              </div>
              <div style={{ color: "#dbe8f6", fontSize: 14, marginBottom: 8, fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                {CATEGORY_LABELS[puzzle.batsFamily]}
              </div>
              <div style={{ color: "#a8c4e0", fontSize: 13, letterSpacing: "0.04em" }}>
                {totalGuesses} guess{totalGuesses !== 1 ? "es" : ""} &nbsp;·&nbsp; par {puzzle.par}
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        {!completed && currentLink && (
          <button
            onClick={handleGuess}
            style={{
              background: "#1a3a5c",
              color: "white",
              border: "none",
              borderRadius: 4,
              padding: "11px 32px",
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "0.06em",
              cursor: "pointer",
              marginBottom: 32,
              transition: "background 0.15s, transform 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#243f63")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1a3a5c")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Confirm
          </button>
        )}

        {/* Stats panel */}
        <div
          style={{
            width: "100%",
            maxWidth: 440,
            background: "white",
            border: "1px solid #e5e0d8",
            borderRadius: 4,
            padding: "20px 22px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
              fontSize: 13,
            }}
          >
            <span style={{ color: "#a09880" }}>Par</span>
            <span style={{ fontWeight: 700, color: "#1a3a5c", fontFamily: "'Playfair Display', serif" }}>
              {puzzle.par}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
              fontSize: 13,
              paddingBottom: 16,
              borderBottom: "1px solid #f0ebe3",
            }}
          >
            <span style={{ color: "#a09880" }}>Total Guesses</span>
            <span style={{ fontWeight: 700, color: "#1c1813", fontFamily: "'Playfair Display', serif" }}>
              {totalGuesses}
            </span>
          </div>

          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#a09880",
              marginBottom: 10,
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
            }}
          >
            Guesses Per Step
          </div>

          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            {guessableSteps.map((_, i) => {
              const stepIdx = i + 1;
              const stepGuesses = guessHistory.filter((g) => g.step === stepIdx);
              const isSolved = stepIdx < currentStep;
              const isActive = stepIdx === currentStep;
              return (
                <StepRow
                  key={stepIdx}
                  stepIndex={stepIdx}
                  stepGuesses={stepGuesses}
                  isActive={isActive}
                  isSolved={isSolved}
                  isExpanded={expandedStep === stepIdx}
                  onToggle={() => handleStepToggle(stepIdx)}
                />
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}