import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { vibrate } from "../../utils";

type Mode = "work" | "break";

const MIN_MINUTES = 1;
const MAX_MINUTES = 180;
const WORK_COLOR = "#FF6B5B";
const BREAK_COLOR = "#3DD6B0";

export default function HomeScreen() {
  // Скільки хвилин триває кожен режим (можна змінювати на картках знизу)
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  // Який режим зараз активний і скільки секунд лишилось
  const [mode, setMode] = useState<Mode>("work");
  const [timeLeft, setTimeLeft] = useState(workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  const accentColor = mode === "work" ? WORK_COLOR : BREAK_COLOR;
  const fullDuration = (mode === "work" ? workMinutes : breakMinutes) * 60;
  const isPaused = !isRunning && timeLeft > 0 && timeLeft < fullDuration;
  const startButtonLabel = isRunning ? "Пауза" : isPaused ? "Продовжити" : "Старт";

  // Кожну секунду, поки isRunning === true, зменшуємо час на 1.
  // Коли час добігає до 0 — вібруємо і зупиняємо таймер.
  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((secondsLeft) => {
        if (secondsLeft <= 1) {
          clearInterval(intervalId);
          vibrate();
          setIsRunning(false);
          return 0;
        }

        return secondsLeft - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  // Перемикання режиму: ставимо на паузу і завантажуємо повну тривалість нового режиму
  function selectMode(newMode: Mode) {
    if (newMode === mode) {
      return;
    }

    setIsRunning(false);
    setMode(newMode);
    setTimeLeft((newMode === "work" ? workMinutes : breakMinutes) * 60);
  }

  function resetTimer() {
    setIsRunning(false);
    setTimeLeft((mode === "work" ? workMinutes : breakMinutes) * 60);
  }

  // Старт/Пауза. Якщо час уже добіг до нуля — спершу перезаряджаємо повну тривалість.
  function toggleRunning() {
    if (isRunning) {
      setIsRunning(false);
      return;
    }

    if (timeLeft === 0) {
      setTimeLeft((mode === "work" ? workMinutes : breakMinutes) * 60);
    }

    setIsRunning(true);
  }

  function clampMinutes(value: number) {
    return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, value));
  }

  // Зміна тривалості режиму (кнопками +/- або вручну в полі вводу)
  function changeDuration(targetMode: Mode, minutes: number) {
    const clamped = clampMinutes(minutes);

    if (targetMode === "work") {
      setWorkMinutes(clamped);
    } else {
      setBreakMinutes(clamped);
    }

    if (!isRunning && targetMode === mode) {
      setTimeLeft(clamped * 60);
    }
  }

  // Крок +1/-1 хвилина. Використовує функціональне оновлення, тому
  // коректно працює й тоді, коли кнопку тримають і крок повторюється багато разів підряд.
  function stepDuration(targetMode: Mode, delta: number) {
    const setMinutes = targetMode === "work" ? setWorkMinutes : setBreakMinutes;

    setMinutes((current) => {
      const next = clampMinutes(current + delta);

      if (!isRunning && targetMode === mode) {
        setTimeLeft(next * 60);
      }

      return next;
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍅 Pomodoro</Text>

      <View style={[styles.clock, { borderColor: accentColor }]}>
        <Text style={styles.clockText}>{formatTime(timeLeft)}</Text>
      </View>

      <View style={styles.cardsRow}>
        <DurationCard
          label="Робота"
          color={WORK_COLOR}
          minutes={workMinutes}
          isActive={mode === "work"}
          disabled={isRunning}
          onSelect={() => selectMode("work")}
          onStep={(delta) => stepDuration("work", delta)}
          onChange={(minutes) => changeDuration("work", minutes)}
        />

        <DurationCard
          label="Перерва"
          color={BREAK_COLOR}
          minutes={breakMinutes}
          isActive={mode === "break"}
          disabled={isRunning}
          onSelect={() => selectMode("break")}
          onStep={(delta) => stepDuration("break", delta)}
          onChange={(minutes) => changeDuration("break", minutes)}
        />
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.secondaryButton} onPress={resetTimer}>
          <Text style={styles.secondaryButtonText}>Скинути</Text>
        </Pressable>

        <Pressable
          style={[styles.primaryButton, { backgroundColor: accentColor }]}
          onPress={toggleRunning}
        >
          <Text style={styles.primaryButtonText}>{startButtonLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Одна картка режиму: напис, поле з кількістю хвилин і кнопки +/-.
// Тап по картці робить цей режим активним.
function DurationCard({
  label,
  color,
  minutes,
  isActive,
  disabled,
  onSelect,
  onStep,
  onChange,
}: {
  label: string;
  color: string;
  minutes: number;
  isActive: boolean;
  disabled: boolean;
  onSelect: () => void;
  onStep: (delta: number) => void;
  onChange: (minutes: number) => void;
}) {
  // Текст поля зберігаємо окремо від числа, щоб поле можна було
  // тимчасово очистити під час введення нового значення.
  const [text, setText] = useState(String(minutes));
  const [syncedMinutes, setSyncedMinutes] = useState(minutes);

  // Якщо хвилини змінились ззовні (кнопками +/-, скиданням) — підтягуємо текст поля.
  if (minutes !== syncedMinutes) {
    setSyncedMinutes(minutes);
    setText(String(minutes));
  }

  function handleChangeText(raw: string) {
    const digitsOnly = raw.replace(/[^0-9]/g, "");
    setText(digitsOnly);

    if (digitsOnly !== "") {
      onChange(parseInt(digitsOnly, 10));
    }
  }

  // Якщо поле лишили порожнім (пішли геть, не дописавши число) — повертаємо мінімум.
  function handleBlur() {
    if (text === "") {
      onChange(MIN_MINUTES);
    }
  }

  // Поки кнопка затиснута, кожні 150мс повторюємо крок +1/-1.
  const holdIntervalId = useRef<ReturnType<typeof setInterval> | null>(null);

  function startHold(delta: number) {
    onStep(delta);
    holdIntervalId.current = setInterval(() => onStep(delta), 150);
  }

  function stopHold() {
    if (holdIntervalId.current !== null) {
      clearInterval(holdIntervalId.current);
      holdIntervalId.current = null;
    }
  }

  useEffect(() => stopHold, []);

  return (
    <Pressable
      onPress={onSelect}
      style={[
        styles.card,
        { borderColor: isActive ? color : "#2A2E3C" },
      ]}
    >
      <Text style={styles.cardLabel}>{label}, хв</Text>

      <View style={styles.stepperRow}>
        <Pressable
          disabled={disabled}
          onPressIn={() => startHold(-1)}
          onPressOut={stopHold}
          style={[styles.stepperButton, disabled && styles.disabled]}
        >
          <Text style={styles.stepperText}>−</Text>
        </Pressable>

        <TextInput
          editable={!disabled}
          keyboardType="number-pad"
          value={text}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          style={styles.cardInput}
          selectTextOnFocus
        />

        <Pressable
          disabled={disabled}
          onPressIn={() => startHold(1)}
          onPressOut={stopHold}
          style={[styles.stepperButton, disabled && styles.disabled]}
        >
          <Text style={styles.stepperText}>+</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    padding: 24,
    backgroundColor: "#11131A",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F5F6FA",
  },
  clock: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  clockText: {
    fontSize: 52,
    fontWeight: "800",
    color: "#F5F6FA",
  },
  cardsRow: {
    flexDirection: "row",
    gap: 14,
    width: "100%",
  },
  card: {
    flex: 1,
    backgroundColor: "#1C1F2A",
    borderRadius: 16,
    borderWidth: 2,
    padding: 14,
    alignItems: "center",
    gap: 10,
  },
  cardLabel: {
    color: "#C7CAD4",
    fontSize: 13,
    fontWeight: "600",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#2A2E3C",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: {
    color: "#F5F6FA",
    fontSize: 18,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.4,
  },
  cardInput: {
    minWidth: 32,
    textAlign: "center",
    color: "#F5F6FA",
    fontSize: 18,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  primaryButton: {
    flex: 1.4,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#11131A",
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#1C1F2A",
  },
  secondaryButtonText: {
    color: "#F5F6FA",
    fontSize: 15,
    fontWeight: "600",
  },
});
