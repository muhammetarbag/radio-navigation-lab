import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  Play,
  Search,
  Target,
} from "lucide-react";
import { cases, grade, questions, type Tab } from "./content";
import {
  AdfGauge,
  Frequency,
  Gauge,
  Metric,
  NavMap,
  Panel,
  SignalChain,
  Slider,
  Toggle,
  Why,
  type Update,
} from "./components";
import { Faults, IlsLab, PositionControls } from "./labs";
import {
  calculate,
  delta,
  fmt,
  initial,
  norm,
  type State,
  type System,
} from "./model";
function savedAnswers(): Record<number, string> {
  try {
    const value = JSON.parse(
      localStorage.getItem("aee301-quiz-v1") ?? "{}",
    ) as unknown;
    if (value && typeof value === "object" && !Array.isArray(value))
      return Object.fromEntries(
        Object.entries(value).filter(
          ([k, v]) =>
            /^\d+$/.test(k) &&
            Number(k) < questions.length &&
            typeof v === "string",
        ),
      );
  } catch {
    /* Storage may be unavailable. */
  }
  return {};
}
export function Quiz({ navigate }: { navigate: (tab: Tab) => void }) {
  const [answers, setAnswers] = useState(savedAnswers),
    [index, setIndex] = useState(0),
    [value, setValue] = useState(() => savedAnswers()[0] ?? "");
  const q = questions[index],
    submitted = Object.hasOwn(answers, index),
    correct = Object.entries(answers).filter(([i, v]) =>
      grade(questions[Number(i)], v),
    ).length,
    done = Object.keys(answers).length,
    completedTopics = [...new Set(questions.map((x) => x.topic))].filter(
      (topic) =>
        questions.every(
          (x, i) => x.topic !== topic || Object.hasOwn(answers, i),
        ),
    );
  useEffect(() => {
    try {
      localStorage.setItem("aee301-quiz-v1", JSON.stringify(answers));
    } catch {
      /* Score still works in memory. */
    }
  }, [answers]);
  const change = (i: number) => {
    setIndex(i);
    setValue(answers[i] ?? "");
  };
  return (
    <>
      <div className="metrics four quiz-metrics">
        <Metric label="DOĞRU" value={correct} />
        <Metric label="YANLIŞ" value={done - correct} />
        <Metric
          label="BAŞARI"
          value={done ? Math.round((correct / done) * 100) : 0}
          unit="%"
        />
        <Metric label="TAMAMLANAN" value={`${done} / ${questions.length}`} />
      </div>
      <div className="quiz-layout">
        <Panel
          title={q.prompt}
          kicker={`${q.topic.toUpperCase()} / SORU ${index + 1}`}
        >
          <div className="quiz-progress">
            <span style={{ width: `${(done / questions.length) * 100}%` }} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!submitted && value.trim())
                setAnswers({ ...answers, [index]: value });
            }}
          >
            {q.options ? (
              <div className="quiz-options">
                {q.options.map((option, i) => (
                  <label
                    key={option}
                    className={`${value === option ? "selected" : ""} ${submitted && q.answer === option ? "correct" : ""}`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      aria-label={option}
                      disabled={submitted}
                      checked={value === option}
                      onChange={() => setValue(option)}
                    />
                    <span>{String.fromCharCode(65 + i)}</span>
                    {option}
                  </label>
                ))}
              </div>
            ) : (
              <label className="numeric-answer">
                Hesapladığın değer
                <input
                  aria-label="Sayısal cevap"
                  type="number"
                  step="any"
                  disabled={submitted}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Cevabını yaz"
                />
              </label>
            )}
            {!submitted ? (
              <button
                className="button primary"
                type="submit"
                disabled={!value.trim()}
              >
                Cevabı gönder <ChevronRight size={16} />
              </button>
            ) : (
              <div
                className={`answer-feedback ${grade(q, answers[index]) ? "correct" : "incorrect"}`}
                role="status"
              >
                <b>
                  {grade(q, answers[index]) ? "Doğru cevap!" : "Bu kez olmadı."}
                </b>
                <p>{q.explanation}</p>
                <small>
                  Cevabın: {answers[index]} · Doğru değer: {q.answer}
                </small>
                {q.lab && (
                  <button
                    className="button"
                    type="button"
                    onClick={() => navigate(q.lab!)}
                  >
                    <Eye size={15} /> Laboratuvarda incele
                  </button>
                )}
              </div>
            )}
          </form>
          <div className="quiz-pagination">
            <button
              className="button"
              disabled={index === 0}
              onClick={() => change(index - 1)}
            >
              <ChevronLeft size={16} /> Önceki
            </button>
            <span>
              {index + 1} / {questions.length}
            </span>
            <button
              className="button"
              disabled={index === questions.length - 1}
              onClick={() => change(index + 1)}
            >
              Sonraki <ChevronRight size={16} />
            </button>
          </div>
        </Panel>
        <Panel title="Soru haritası" kicker="YOUR PROGRESS">
          <div className="question-map">
            {questions.map((x, i) => (
              <button
                aria-label={`Soru ${i + 1}`}
                key={i}
                className={`${index === i ? "active" : ""} ${Object.hasOwn(answers, i) ? (grade(x, answers[i]) ? "correct" : "incorrect") : ""}`}
                onClick={() => change(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p className="fine">Yeşil: doğru · Amber: yanlış · Çerçeve: seçili</p>
          <h3>Tamamlanan konular</h3>
          <p>
            {completedTopics.length
              ? completedTopics.join(" · ")
              : "Bir konudaki tüm soruları cevapladığında burada görünür."}
          </p>
          <button
            className="button ghost"
            onClick={() => {
              setAnswers({});
              setIndex(0);
              setValue("");
            }}
          >
            Sınavı sıfırla
          </button>
          <p className="fine">İlerleme bu tarayıcıda yerel olarak saklanır.</p>
        </Panel>
      </div>
    </>
  );
}
export function Troubleshooting() {
  const [index, setIndex] = useState(0),
    [inspections, setInspections] = useState<string[]>([]),
    [choice, setChoice] = useState(""),
    [submitted, setSubmitted] = useState(false),
    c = cases[index];
  return (
    <>
      <Panel
        title="Önce belirtiyi oku. Sonra kanıt topla."
        kicker="TROUBLESHOOTING / 7 CASES"
      >
        <div className="case-nav">
          {cases.map((x, i) => (
            <button
              key={x.title}
              className={index === i ? "active" : ""}
              onClick={() => {
                setIndex(i);
                setInspections([]);
                setChoice("");
                setSubmitted(false);
              }}
            >
              <span>{i + 1}</span>
              {x.title}
            </button>
          ))}
        </div>
      </Panel>
      <div className="equal-grid">
        <Panel
          title={c.title}
          kicker={`CASE ${String(index + 1).padStart(2, "0")} / SYMPTOMS`}
        >
          <div className="symptom">
            <Search size={23} />
            <p>{c.symptom}</p>
          </div>
          <h3>İnceleme noktaları</h3>
          <div className="inspection-grid">
            {Object.keys(c.checks).map((key) => (
              <button
                key={key}
                className={inspections.includes(key) ? "checked" : ""}
                onClick={() =>
                  setInspections([...new Set([...inspections, key])])
                }
              >
                {inspections.includes(key) ? (
                  <Check size={16} />
                ) : (
                  <Eye size={16} />
                )}{" "}
                {key}
              </button>
            ))}
          </div>
          <div className="inspection-results">
            {inspections.map((key) => (
              <div key={key}>
                <b>{key}</b>
                <p>{c.checks[key]}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Arızanın kaynağı nerede?" kicker="DIAGNOSE">
          <p>Kanıtları inceleyip en olası teşhisi seç.</p>
          <div className="quiz-options">
            {c.options.map((option) => (
              <label
                key={option}
                className={choice === option ? "selected" : ""}
              >
                <input
                  type="radio"
                  name="diagnosis"
                  checked={choice === option}
                  disabled={submitted}
                  onChange={() => setChoice(option)}
                />
                {option}
              </label>
            ))}
          </div>
          <button
            className="button primary"
            disabled={!choice || submitted || inspections.length < 2}
            onClick={() => setSubmitted(true)}
          >
            Teşhisi gönder
          </button>
          {inspections.length < 2 && (
            <p className="fine">Teşhisten önce en az iki inceleme yap.</p>
          )}
          {submitted && (
            <div className="answer-feedback" role="status">
              <b
                className={
                  choice === c.diagnosis ? "success-text" : "amber-text"
                }
              >
                {choice === c.diagnosis
                  ? "Teşhis doğru."
                  : `Doğru teşhis: ${c.diagnosis}`}
              </b>
              <p>{c.why}</p>
              <ol className="steps">
                {c.tree.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
const missionSteps = [
  "VOR’u 113.60 MHz’e ayarla",
  "Mevcut radial’i belirle",
  "000° inbound course’u yakala",
  "DME mesafesini oku",
  "ILS başlangıç bölgesine geç",
  "ILS 110.30 MHz ve course 000° ayarla",
  "Localizer’ı yakala",
  "Glideslope’u yakala",
  "Manuel uçuşta 5 saniye stabilize kal",
];
const hints = [
  "NAV 1 listesinden ANK VOR’u seç.",
  "Radial, ANK istasyonundan uçağa bakan manyetik açıdır.",
  "000° inbound için istasyonun güneyinde ol; OBS 000°, TO ve CDI merkez.",
  "DME ekranındaki eğik mesafeyi NM olarak gir.",
  "Pistten 6–9 NM önce ve merkez hattına 0.6 NM içinde ol; harita veya konum sliderlarını kullan.",
  "NAV 1: I-LAB ILS 110.30 MHz. Course referansı: 000°.",
  "Plan görünümünde yanal uzaklığı azalt; LOC ±0.25° içinde olmalı.",
  "İrtifayı 3° yoluna getir; GS sapması ±0.07° içinde olmalı.",
  "Heading pist yönünden ±5° içinde; iki iğne merkezde, sinyal güvenilir. Uçuşu başlat ve dikey hızı yaklaşık −743 ft/min civarında ayarla.",
];
export interface MissionProgress {
  started: boolean;
  step: number;
  hint: boolean;
  radial: string;
  dme: string;
  feedback: string;
  hold: number;
}
export const newMission = (): MissionProgress => ({
  started: false,
  step: 0,
  hint: false,
  radial: "",
  dme: "",
  feedback: "",
  hold: 0,
});
export function Mission({
  s,
  update,
  progress,
  setProgress,
}: {
  s: State;
  update: Update;
  progress: MissionProgress;
  setProgress: React.Dispatch<React.SetStateAction<MissionProgress>>;
}) {
  const p = progress,
    m = calculate(s);
  const stable =
    s.running &&
    m.ils.locValid &&
    m.ils.gsValid &&
    m.ils.reliable &&
    Math.abs(m.ils.locAngle) < 0.25 &&
    Math.abs(m.ils.gsAngle) < 0.07 &&
    Math.abs(delta(s.heading, s.runwayCourse)) < 5;
  useEffect(() => {
    if (p.started && p.step === 8)
      setProgress((old) => ({ ...old, hold: stable ? old.hold + 0.1 : 0 }));
  }, [s.time, p.started, p.step, stable, setProgress]);
  const conditions = [
    m.vor.valid && s.frequency === 113.6,
    p.radial.trim() !== "" &&
      Math.abs(delta(Number(p.radial), m.vor.radial)) < 1,
    m.vor.valid &&
      m.vor.flag === "TO" &&
      Math.abs(m.vor.deviation) < 1 &&
      Math.abs(delta(s.obs, 0)) < 1,
    p.dme.trim() !== "" &&
      m.dme.valid &&
      Math.abs(Number(p.dme) - m.dme.range) < 0.1,
    m.ils.d >= 6 && m.ils.d <= 9 && Math.abs(m.ils.lateral) < 0.6,
    s.frequency === 110.3 && Math.abs(delta(s.obs, 0)) < 1,
    m.ils.locValid && Math.abs(m.ils.locAngle) < 0.25,
    m.ils.gsValid && Math.abs(m.ils.gsAngle) < 0.07,
    stable && p.hold >= 5,
  ];
  return (
    <>
      <Panel
        title="ANK VOR’dan I-LAB yaklaşmasına"
        kicker="INTEGRATED NAVIGATION MISSION"
        action={
          <button
            className="button primary"
            onClick={() => {
              update({
                ...initial(),
                aircraft: { x: -9, y: -18 },
                frequency: 114,
                obs: 90,
                altitude: 2800,
              });
              setProgress({ ...newMission(), started: true });
            }}
          >
            <Flag size={15} />{" "}
            {p.started ? "Görevi yeniden başlat" : "Görevi başlat"}
          </button>
        }
      >
        <p>
          Kontroller sende. Her aşamayı kanıtla; sistem konumunu veya course’unu
          senin yerine ayarlamaz. Görev başlangıcı bir eğitim konumu yükler.
        </p>
        <div className="mission-checklist">
          {missionSteps.map((x, i) => (
            <div
              key={x}
              className={`${i < p.step ? "complete" : ""} ${i === p.step && p.started ? "current" : ""}`}
            >
              <span>{i < p.step ? <Check size={14} /> : i + 1}</span>
              {x}
            </div>
          ))}
        </div>
        {p.started && p.step < 9 && (
          <div className="mission-action">
            <h3>{missionSteps[p.step]}</h3>
            {(p.step === 1 || p.step === 3) && (
              <label className="select-label">
                {p.step === 1 ? "Radial (°)" : "DME (NM)"}
                <input
                  aria-label={
                    p.step === 1 ? "Görev radial cevabı" : "Görev DME cevabı"
                  }
                  type="number"
                  step="any"
                  value={p.step === 1 ? p.radial : p.dme}
                  onChange={(e) =>
                    setProgress({
                      ...p,
                      [p.step === 1 ? "radial" : "dme"]: e.target.value,
                    })
                  }
                />
              </label>
            )}
            {p.step === 8 && (
              <p>Stabil kalma: {Math.min(5, p.hold).toFixed(1)} / 5.0 s</p>
            )}
            <div className="button-row">
              <button
                className="button primary"
                onClick={() => {
                  if (conditions[p.step])
                    setProgress({
                      ...p,
                      step: p.step + 1,
                      hint: false,
                      feedback: "Aşama tamamlandı.",
                      hold: 0,
                    });
                  else
                    setProgress({
                      ...p,
                      feedback:
                        "Hedef henüz sağlanmadı. Geometriyi ve sinyal geçerliliğini kontrol et.",
                    });
                }}
              >
                Aşamayı doğrula <Check size={15} />
              </button>
              <button
                className="button ghost"
                onClick={() => setProgress({ ...p, hint: !p.hint })}
              >
                İpucu {p.hint ? "gizle" : "göster"}
              </button>
            </div>
            {p.hint && <div className="note">{hints[p.step]}</div>}
            <p role="status">{p.feedback}</p>
          </div>
        )}
        {p.step === 9 && (
          <div className="mission-success">
            <Target size={36} />
            <h3>Görev tamamlandı.</h3>
            <p>VOR, DME ve ILS aşamalarını kendi kontrollerinle doğruladın.</p>
          </div>
        )}
      </Panel>
      {p.started && (
        <>
          <div className="lab-grid">
            <Panel
              title="Görev haritası"
              kicker="SAME AIRCRAFT / ALL SYSTEMS"
              className="map-panel"
            >
              <NavMap
                s={s}
                update={update}
                mode="ALL"
                overlays={["radial", "course", "from", "line"]}
              />
              <PositionControls s={s} update={update} />
            </Panel>
            <Panel title="Enroute instruments" kicker="NAV / ADF / DME">
              <Frequency s={s} update={update} />
              <Gauge s={s} mode={s.frequency === 110.3 ? "ILS" : "VOR"} />
              <div className="metrics two">
                <Metric
                  label="RADIAL"
                  value={m.vor.valid ? fmt(m.vor.radial) : "—"}
                  unit="°"
                />
                <Metric
                  label="DME"
                  value={m.dme.valid ? m.dme.range.toFixed(2) : "—"}
                  unit="NM"
                />
              </div>
            </Panel>
          </div>
          <IlsLab s={s} update={update} compact />
        </>
      )}
    </>
  );
}
export function Sandbox({ s, update }: { s: State; update: Update }) {
  const [system, setSystem] = useState<System>("VOR"),
    m = calculate(s);
  return (
    <>
      <Panel
        title="Tek uçak, bağlantılı tüm göstergeler"
        kicker="FREE EXPERIMENT"
      >
        <p>
          Haritada uçağı ve istasyon işaretlerini sürükle. Tüm uzaklıklar yerel
          NM koordinatlarında, yükseklikler ortak 0 ft yer referansındadır.
        </p>
        <NavMap
          s={s}
          update={update}
          mode="ALL"
          overlays={["radial", "course", "from", "line"]}
          stations
        />
        <PositionControls s={s} update={update} />
      </Panel>
      <div className="sandbox-instruments">
        <Panel title="NAV / CDI">
          <Frequency s={s} update={update} />
          <Gauge s={s} mode={s.frequency === 110.3 ? "ILS" : "VOR"} />
        </Panel>
        <Panel title="ADF / Heading">
          <AdfGauge s={s} />
          <div className="metrics two">
            <Metric label="MH" value={fmt(s.heading)} unit="°" />
            <Metric
              label="RB"
              value={m.adf.valid ? fmt(m.adf.relative) : "—"}
              unit="°"
            />
          </div>
        </Panel>
        <Panel title="Veri izleme">
          <div className="data-list">
            {[
              ["Radial", `${fmt(m.vor.radial)}°`],
              ["Bearing TO", `${fmt(m.vor.bearingTo)}°`],
              ["Course", `${fmt(s.obs)}°`],
              ["VOR CDI", `${m.vor.deviation.toFixed(2)}°`],
              ["TO/FROM", m.vor.valid ? m.vor.flag : "OFF"],
              ["ADF MB", `${fmt(m.adf.bearing)}°`],
              [
                "DME",
                m.dme.valid ? `${m.dme.range.toFixed(2)} NM` : "NO REPLY",
              ],
              ["LOC", `${m.ils.locAngle.toFixed(2)}°`],
              ["GS", `${m.ils.gsAngle.toFixed(2)}°`],
              [
                "NAV valid",
                s.frequency === 113.6
                  ? String(m.vor.valid)
                  : String(m.ils.locValid),
              ],
              ["GS valid", String(m.ils.gsValid)],
            ].map(([k, v]) => (
              <div key={k}>
                <span>{k}</span>
                <b>{v}</b>
              </div>
            ))}
          </div>
          <p className="fine">
            Geometrik değerler sinyal kaybında da eğitim referansı olarak
            görünür; geçerlilik satırlarını kontrol et.
          </p>
        </Panel>
      </div>
      <Panel title="Yer tesisi ve çevre ayarları" kicker="FULL CONTROL">
        <div className="controls-grid">
          {(["vor", "ndb", "runway"] as const).flatMap((key) =>
            (["x", "y"] as const).map((axis) => (
              <Slider
                key={`${key}-${axis}`}
                label={`${key.toUpperCase()} ${axis === "x" ? "doğu / batı" : "kuzey / güney"}`}
                value={s[key][axis]}
                min={-20}
                max={20}
                step={0.1}
                unit="NM"
                onChange={(n) => update({ [key]: { ...s[key], [axis]: n } })}
              />
            )),
          )}
          <Slider
            label="Pist course"
            value={s.runwayCourse}
            min={0}
            max={359}
            unit="°"
            onChange={(runwayCourse) => update({ runwayCourse })}
          />
          <Slider
            label="Rüzgâr sürati"
            value={s.windSpeed}
            min={0}
            max={50}
            unit="kt"
            onChange={(windSpeed) => update({ windSpeed })}
          />
          <Slider
            label="Rüzgâr yönü FROM"
            value={s.windDirection}
            min={0}
            max={359}
            unit="°"
            onChange={(windDirection) => update({ windDirection })}
          />
          <Slider
            label="Uçak sürati"
            value={s.speed}
            min={60}
            max={300}
            unit="kt"
            onChange={(speed) => update({ speed })}
          />
          <Slider
            label="Dikey hız sandbox"
            value={s.verticalSpeed}
            min={-1800}
            max={1800}
            step={10}
            unit="ft/min"
            onChange={(verticalSpeed) => update({ verticalSpeed })}
          />
          <Slider
            label="ADF alıcı frekansı"
            value={s.adfFrequency}
            min={365}
            max={400}
            unit="kHz"
            onChange={(adfFrequency) => update({ adfFrequency })}
          />
        </div>
        <div className="button-row">
          {(["vorOn", "ndbOn", "ilsOn"] as const).map((key) => (
            <Toggle
              key={key}
              on={s[key]}
              click={() => update({ [key]: !s[key] })}
            >
              {key.replace("On", "").toUpperCase()} açık
            </Toggle>
          ))}
          <button
            className="button primary"
            onClick={() => update({ running: !s.running, flightMode: "free" })}
          >
            <Play size={14} />
            {s.running ? "Durdur" : "Uçuşu başlat"}
          </button>
          <button
            className="button"
            onClick={() => update({ heading: norm(s.heading + 10) })}
          >
            Heading +10°
          </button>
        </div>
        <Why>
          Seçilen NAV frekansı VOR/ILS ve eşlenmiş DME istasyonunu birlikte
          değiştirir. ADF kendi 365 kHz alıcısını kullanır. Bu eğitim
          mimarisinde DME, NAV receiver arızasından bağımsızdır.
        </Why>
      </Panel>
      <Panel title="Sinyal yolu seç">
        <div className="button-row">
          {(["VOR", "ILS", "ADF", "DME"] as System[]).map((x) => (
            <button
              key={x}
              className={`button ${system === x ? "active" : ""}`}
              onClick={() => setSystem(x)}
            >
              {x}
            </button>
          ))}
        </div>
      </Panel>
      <SignalChain key={system} s={s} update={update} system={system} />
      <Faults s={s} update={update} />
      <Faults s={s} update={update} adf />
    </>
  );
}
