import { useState, useCallback, useRef } from "react";
import "./styles.css";

const COLORS = [
  { id: 0, label: "Красный", bg: "#c0392b" },
  { id: 1, label: "Синий", bg: "#2980b9" },
  { id: 2, label: "Жёлтый", bg: "#f1c40f" },
  { id: 3, label: "Зелёный", bg: "#27ae60" },
];

const PULSE_MS = 550;
const GAP_MS = 180;
const USER_FLASH_MS = 400;
const NEXT_ROUND_MS = 2000;

const btnBase = {
  minWidth: "7rem",
  minHeight: "7rem",
  border: "3px solid #2c3e50",
  borderRadius: "8px",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

export default function App() {
  const [sequence, setSequence] = useState([]);
  const [userIndex, setUserIndex] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [litId, setLitId] = useState(null);
  const [userLit, setUserLit] = useState(null);
  const [results, setResults] = useState([]);
  const runningRef = useRef(false);

  const endGame = useCallback((score) => {
    setPhase("over");
    setResults((r) => [{ key: Date.now() + Math.random(), score }, ...r]);
  }, []);

  const playSteps = useCallback((seq) => {
    if (!seq.length) return Promise.resolve();
    return new Promise((resolve) => {
      let i = 0;
      const step = () => {
        if (i >= seq.length) {
          setLitId(null);
          resolve();
          return;
        }
        const c = seq[i];
        setLitId(c);
        setTimeout(() => {
          setLitId(null);
          setTimeout(() => {
            i += 1;
            step();
          }, GAP_MS);
        }, PULSE_MS);
      };
      step();
    });
  }, []);

  const addStepAndRun = useCallback(
    (prev) => {
      if (runningRef.current) return;
      const next = [...prev, Math.floor(Math.random() * 4)];
      setSequence(next);
      setUserIndex(0);
      runningRef.current = true;
      setPhase("showing");
      setLitId(null);
      setUserLit(null);
      playSteps(next).then(() => {
        runningRef.current = false;
        setPhase("input");
        setLitId(null);
      });
    },
    [playSteps]
  );

  const startGame = useCallback(() => {
    if (runningRef.current) return;
    setSequence([]);
    setUserIndex(0);
    setLitId(null);
    setUserLit(null);
    setPhase("showing");
    queueMicrotask(() => {
      addStepAndRun([]);
    });
  }, [addStepAndRun]);

  const isPadLit = (id) =>
    (phase === "showing" && litId === id) || userLit === id;

  const handlePadClick = (colorId) => {
    if (phase !== "input" || runningRef.current) return;
    runningRef.current = true;
    const expect = sequence[userIndex];
    if (colorId !== expect) {
      setUserLit(colorId);
      setTimeout(() => {
        setUserLit(null);
        const score = Math.max(0, sequence.length - 1);
        endGame(score);
        runningRef.current = false;
      }, USER_FLASH_MS);
      return;
    }
    setUserLit(colorId);
    setTimeout(() => {
      setUserLit(null);
      const nextIndex = userIndex + 1;
      if (nextIndex === sequence.length) {
        setUserIndex(0);
        setPhase("pause");
        setTimeout(() => {
          setPhase("showing");
          setLitId(null);
          setUserLit(null);
          const extended = [...sequence, Math.floor(Math.random() * 4)];
          setSequence(extended);
          playSteps(extended).then(() => {
            runningRef.current = false;
            setPhase("input");
            setLitId(null);
          });
        }, NEXT_ROUND_MS);
      } else {
        setUserIndex(nextIndex);
        runningRef.current = false;
      }
    }, USER_FLASH_MS);
  };

  return (
    <div className="wrap">
      <h1>Simon Says</h1>
      <p>
        <b>Статус:</b> {phase === "idle" && "Нажми «Начать»."}
        {phase === "showing" && "Смотри на последовательность."}
        {phase === "input" && "Повтори последовательность кликами."}
        {phase === "pause" && "Пауза перед следующим раундом."}
        {phase === "over" && "Игра окончена."}
      </p>
      <p>
        <b>Длина цели (число цветов):</b> {sequence.length || "—"}
      </p>
      <p>
        <button
          type="button"
          onClick={startGame}
          disabled={
            phase === "showing" ||
            phase === "pause" ||
            (phase === "input" && sequence.length > 0)
          }
        >
          Начать
        </button>
        {phase === "over" && (
          <>
            <br />
            <br />
            <button
              type="button"
              onClick={() => {
                setPhase("idle");
                setSequence([]);
                setUserIndex(0);
                setLitId(null);
                setUserLit(null);
              }}
            >
              Снова
            </button>
          </>
        )}
      </p>
      <br />
      <div role="group" aria-label="Игровое поле">
        <table cellPadding="6" style={{ borderCollapse: "separate" }}>
          <tbody>
            <tr>
              <td>
                <button
                  type="button"
                  style={{
                    ...btnBase,
                    background: COLORS[0].bg,
                    opacity: isPadLit(0) ? 1 : 0.5,
                    filter: isPadLit(0) ? "brightness(1.35)" : "none",
                  }}
                  onClick={() => handlePadClick(0)}
                  disabled={phase !== "input"}
                >
                  {COLORS[0].label}
                </button>
              </td>
              <td>
                <button
                  type="button"
                  style={{
                    ...btnBase,
                    background: COLORS[1].bg,
                    opacity: isPadLit(1) ? 1 : 0.5,
                    filter: isPadLit(1) ? "brightness(1.35)" : "none",
                  }}
                  onClick={() => handlePadClick(1)}
                  disabled={phase !== "input"}
                >
                  {COLORS[1].label}
                </button>
              </td>
            </tr>
            <tr>
              <td>
                <button
                  type="button"
                  style={{
                    ...btnBase,
                    background: COLORS[2].bg,
                    opacity: isPadLit(2) ? 1 : 0.5,
                    filter: isPadLit(2) ? "brightness(1.35)" : "none",
                  }}
                  onClick={() => handlePadClick(2)}
                  disabled={phase !== "input"}
                >
                  {COLORS[2].label}
                </button>
              </td>
              <td>
                <button
                  type="button"
                  style={{
                    ...btnBase,
                    background: COLORS[3].bg,
                    opacity: isPadLit(3) ? 1 : 0.5,
                    filter: isPadLit(3) ? "brightness(1.35)" : "none",
                  }}
                  onClick={() => handlePadClick(3)}
                  disabled={phase !== "input"}
                >
                  {COLORS[3].label}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <br />
      <hr />
      <h2>Результаты</h2>
      {results.length === 0 ? (
        <p>
          <i>Пока пусто.</i>
        </p>
      ) : (
        <ol>
          {results.map((row) => (
            <li key={row.key}>
              Счёт: <b>{row.score}</b>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
