import { useState, useRef } from "react";
import { samplePuzzle } from "./puzzleData";

// How similar two strings are (0–1). Simple normalised character overlap.
function similarity(a, b) {
  const s = a.toLowerCase().trim();
  const t = b.toLowerCase().trim();
  if (s === t) return 1;
  const longer = Math.max(s.length, t.length);
  if (longer === 0) return 1;
  // Count matching chars at each position
  let matches = 0;
  for (let i = 0; i < Math.min(s.length, t.length); i++) {
    if (s[i] === t[i]) matches++;
  }
  return matches / longer;
}

const CATEGORY_LABELS = {
  "inflectional": "Inflectional Morphology",
  "derivational": "Derivational Morphology",
  "lexicographic": "Lexicographic Semantics",
  "encyclopedic": "Encyclopedic Semantics",
};

// Accordion row for a single step in the stats panel
function StepRow({ stepIndex, stepGuesses, isActive, isSolved, isExpanded, onToggle }) {
  // top 5 by score, then dedup by guess text
  const top5 = [...stepGuesses]
    .sort((a, b) => b.score - a.score)
    .filter((g, idx, arr) => arr.findIndex((x) => x.guess.toLowerCase() === g.guess.toLowerCase()) === idx)
    .slice(0, 5);

  const best = top5[0] ?? null;
  const guessCount = stepGuesses.length;

  const showExpanded = isExpanded && (isActive || isSolved);

  return (
    <li className="rounded-md border border-stone-200 overflow-hidden text-sm">
      {/* Header row — always visible */}
      <button
        onClick={onToggle}
        className={`w-full flex flex-row items-center gap-2 px-3 py-2 text-left transition-colors
          ${isSolved ? "bg-stone-50 hover:bg-stone-100 cursor-pointer" : isActive ? "bg-lime-50 hover:bg-lime-100" : "bg-stone-50 cursor-default"}`}
      >
        <span className="text-stone-400 text-xs w-12 shrink-0">Step {stepIndex}</span>

        {isSolved ? (
          <span className="text-lime-600 font-medium flex-1">✓ {best?.guess}</span>
        ) : best ? (
          <span className="text-stone-600 font-medium flex-1 truncate">{best.guess}</span>
        ) : (
          <span className="text-stone-300 italic flex-1">not attempted</span>
        )}

        <span className="text-stone-400 text-xs shrink-0">
          {guessCount} guess{guessCount !== 1 ? "es" : ""}
        </span>

        {!isSolved && guessCount > 0 && (
          <span className="text-stone-400 text-xs ml-1">{showExpanded ? "▲" : "▼"}</span>
        )}
        {isSolved && (
          <span className="text-stone-400 text-xs ml-1">{showExpanded ? "▲" : "▼"}</span>
        )}
      </button>

      {/* Expanded top-5 list */}
      {showExpanded && top5.length > 0 && (
        <ul className="border-t border-stone-200 divide-y divide-stone-100">
          {top5.map((g, i) => (
            <li key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white">
              <span className="text-stone-300 text-xs w-4 text-right shrink-0">#{i + 1}</span>
              <span className={`font-medium flex-1 ${g.correct ? "text-lime-600" : "text-stone-700"}`}>
                {g.guess}
              </span>
              <span className="text-stone-400 text-xs shrink-0">
                {g.correct ? "✓ correct" : `${Math.round(g.score * 100)}% match`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function App() {
  const puzzle = samplePuzzle; // swap out for puzzle picker later
  // Index of the chain link the player is currently guessing (starts at 1, seed is 0)
  const [currentStep, setCurrentStep] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [guessHistory, setGuessHistory] = useState([]); // [{guess, step, correct, score}]
  const [feedback, setFeedback] = useState(null); // "correct" | "wrong"
  const [completed, setCompleted] = useState(false);
  const [expandedStep, setExpandedStep] = useState(null);
  const inputRef = useRef(null);

  const isFinished = currentStep >= puzzle.chain.length;
  const currentLink = puzzle.chain[currentStep] ?? null;

  // All revealed pairs — the seed plus every step the player has solved
  const revealedPairs = puzzle.chain.slice(0, currentStep);

  // Best guesses per step (highest similarity score per step)
  const bestPerStep = puzzle.chain.slice(1).map((_, i) => {
    const stepGuesses = guessHistory.filter((g) => g.step === i + 1);
    return stepGuesses.reduce((best, g) => (!best || g.score > best.score ? g : best), null);
  });

  // Steps to show in stats = all guessable steps (chain minus seed)
  const guessableSteps = puzzle.chain.slice(1);

  function handleGuess() {
    if (!inputValue.trim() || isFinished) return;
    const guess = inputValue.trim();
    const answer = currentLink.answer;
    const isCorrect = guess.toLowerCase() === answer.toLowerCase();
    const score = similarity(guess, answer);

    setGuessHistory((prev) => [...prev, { guess, step: currentStep, correct: isCorrect, score }]);
    setTotalGuesses((n) => n + 1);
    setInputValue("");
    setFeedback(isCorrect ? "correct" : "wrong");

    // Auto-open the step accordion for the current step while guessing
    setExpandedStep(currentStep);

    if (isCorrect) {
      const nextStep = currentStep + 1;
      // Collapse the solved step, auto-expand the next
      setExpandedStep(nextStep < puzzle.chain.length ? nextStep : null);
      if (nextStep >= puzzle.chain.length) {
        setCompleted(true);
        setExpandedStep(null);
      }
      setCurrentStep(nextStep);
    }

    setTimeout(() => setFeedback(null), 900);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleGuess();
  }

  function handleStepToggle(stepIdx) {
    // Allow expanding active step or any already-solved step
    const isSolved = stepIdx < currentStep;
    const isActive = stepIdx === currentStep;
    if (!isSolved && !isActive) return;
    setExpandedStep((prev) => (prev === stepIdx ? null : stepIdx));
  }

  const feedbackColor =
    feedback === "correct" ? "border-lime-400 bg-lime-100" :
    feedback === "wrong"   ? "border-red-400 bg-red-50"   : "";

  return (
    <div className="min-h-screen bg-stone-300 flex items-center justify-center flex-col gap-6 py-10 px-4">
      {/* Header */}
      <div className="text-center max-w-xl">
        <h1 className="text-4xl font-bold text-lime-600">Relations</h1>
        <p className="text-sm text-stone-500 mt-1">
          {CATEGORY_LABELS[puzzle.batsFamily]} · {puzzle.batsCategory}
        </p>
        <p className="text-lg text-stone-600 mt-2">
          Find the word that continues the relationship. Guess the missing word for each new pair.
        </p>
      </div>

      {/* Revealed chain */}
      <div className="flex flex-col items-center gap-1 w-full max-w-sm">
        {revealedPairs.map((link, i) => (
          <div key={i} className="flex flex-row items-center justify-between w-full bg-white rounded-lg px-4 py-2 shadow-sm border border-stone-200">
            <span className="font-semibold text-stone-700">{link.prompt}</span>
            <span className="text-stone-400 mx-2">→</span>
            <span className="font-semibold text-lime-700">{link.answer}</span>
            {i === 0 && <span className="ml-3 text-xs text-stone-400 italic">example</span>}
          </div>
        ))}

        {/* Current prompt row with input */}
        {!completed && currentLink && (
          <div className={`flex flex-row items-center justify-between w-full rounded-lg px-4 py-2 shadow-sm border-2 transition-colors ${feedbackColor || "bg-white border-lime-300"}`}>
            <span className="font-semibold text-stone-700">{currentLink.prompt}</span>
            <span className="text-stone-400 mx-2">→</span>
            <input
              ref={inputRef}
              className="border border-lime-500 rounded-md w-32 px-2 py-0.5 text-center focus:outline-none focus:ring-2 focus:ring-lime-400"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="your guess"
              autoFocus
            />
          </div>
        )}

        {completed && (
          <div className="w-full bg-lime-100 border border-lime-400 rounded-lg px-4 py-3 text-center text-lime-700 font-semibold shadow-sm">
            🎉 Chain complete! You used {totalGuesses} guess{totalGuesses !== 1 ? "es" : ""} (par: {puzzle.par}).
          </div>
        )}
      </div>

      {/* Submit button */}
      {!completed && currentLink && (
        <button
          onClick={handleGuess}
          className="bg-lime-600 hover:bg-lime-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Guess
        </button>
      )}

      {/* Stats panel */}
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-stone-200 px-5 py-4">
        {/* Always-visible summary */}
        <div className="flex justify-between items-center mb-1">
          <span className="text-stone-500 text-sm">Par</span>
          <span className="font-bold text-lime-600">{puzzle.par}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-stone-500 text-sm">Total Guesses</span>
          <span className="font-bold text-stone-700">{totalGuesses}</span>
        </div>

        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Guesses Per Step</h2>
        <ul className="flex flex-col gap-1">
          {guessableSteps.map((_, i) => {
            const stepIdx = i + 1; // matches guessHistory step values
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
  );
}

export default App;