import { useState } from "react";
import { Antenna, Radio, Waves } from "lucide-react";
import {
  Metric,
  Panel,
  Plane,
  SignalChain,
  Slider,
  Toggle,
  Why,
  type Update,
} from "./components";
import { glossary } from "./content";
import { hf, RAD, vhf, type State, type System } from "./model";
export function Fundamentals({ s, update }: { s: State; update: Update }) {
  const [term, setTerm] = useState("Radial"),
    [frequency, setFrequency] = useState(100),
    [depth, setDepth] = useState(0.5),
    [system, setSystem] = useState<System>("ILS");
  const wave = Array.from(
    { length: 701 },
    (_, i) =>
      `${50 + i},${120 + (1 + depth * Math.sin(i * 0.018)) * 35 * Math.sin(i * frequency * 0.005)}`,
  ).join(" ");
  return (
    <>
      <Panel
        title="Görünmeyen sinyali görünür kıl"
        kicker="LEARN / RADIO BASICS"
      >
        <p className="intro">
          Bir yer istasyonunun yayını, kokpitteki iğneye nasıl dönüşür? Önce
          taşıyıcı dalgayı değiştir; sonra sinyal zincirindeki bir bileşeni
          kapat ve sonucu gözle.
        </p>
        <svg
          className="wave-view"
          viewBox="0 0 800 250"
          aria-label="Genlik modülasyonlu kavramsal taşıyıcı sinyal"
        >
          <path d="M50 120H750" stroke="#50667d" strokeDasharray="4 5" />
          <polyline
            points={wave}
            stroke="var(--mint)"
            fill="none"
            strokeWidth="1.7"
          />
          <text x="50" y="30" className="map-label">
            AM / AMPLITUDE MODULATION
          </text>
          <text x="550" y="223" className="map-label">
            ZAMAN EKSENİ ŞEMATİKTİR →
          </text>
        </svg>
        <div className="metrics two">
          <Metric label="TAŞIYICI FREKANSI" value={frequency} unit="MHz" />
          <Metric
            label="DALGA BOYU / λ = c / f"
            value={(299.792458 / frequency).toFixed(2)}
            unit="m"
          />
        </div>
        <div className="controls-grid">
          <Slider
            label="Taşıyıcı frekansı"
            value={frequency}
            min={2}
            max={150}
            unit="MHz"
            onChange={setFrequency}
          />
          <Slider
            label="Modülasyon derinliği"
            value={depth}
            min={0}
            max={1}
            step={0.05}
            onChange={setDepth}
          />
        </div>
        <Why>
          Frekans arttıkça dalga boyu azalır. Modülasyon derinliği, taşıyıcının
          zarfının ne kadar değiştiğini gösterir. Bu çizim bir AM kavram
          gösterimidir; NAV sistemlerinin bütün kodlama ayrıntılarını temsil
          etmez.
        </Why>
      </Panel>
      <Panel title="Sinyal zincirini seç" kicker="EXPERIMENT">
        <div className="button-row">
          {(["VOR", "ILS", "ADF", "DME"] as System[]).map((x) => (
            <button
              className={`button ${system === x ? "active" : ""}`}
              key={x}
              onClick={() => {
                setSystem(x);
                if (x === "VOR") update({ frequency: 113.6 });
                if (x === "ILS") update({ frequency: 110.3 });
              }}
            >
              {x}
            </button>
          ))}
        </div>
      </Panel>
      <SignalChain key={system} s={s} update={update} system={system} />
      <Panel title="Kavram kartları" kicker="EXPLORE">
        <div className="glossary">
          {Object.keys(glossary).map((t) => (
            <button
              key={t}
              title={glossary[t]}
              className={t === term ? "active" : ""}
              onClick={() => setTerm(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="concept-card">
          <Radio size={28} />
          <div>
            <h3>{term}</h3>
            <p>{glossary[term]}</p>
          </div>
        </div>
      </Panel>
    </>
  );
}
const communicationScenarios = [
  {
    name: "Terminal sahası",
    context: "Havalimanına 20 NM, 3.000 ft; görüş hattı açık.",
    answer: "VHF",
    why: "Bu senaryoda kısa mesafe ve açık görüş hattı VHF için uygundur.",
  },
  {
    name: "Yüksek irtifa enroute",
    context: "Yer istasyonuna 140 NM, 35.000 ft; arazi engeli yok.",
    answer: "VHF",
    why: "Yüksek irtifa radyo ufkunu genişletir; bu modelde 140 NM görüş hattı içindedir.",
  },
  {
    name: "Uzak okyanus",
    context: "Yer istasyonuna 1.800 NM; iyonosfer koşulları uygun.",
    answer: "HF",
    why: "Uygun HF skywave, VHF görüş hattının çok ötesine ulaşabilir.",
  },
  {
    name: "Dağın arkasında alçak uçuş",
    context:
      "800 ft; doğrudan VHF yolu kapalı. HF için frekans/iyonosfer bilgisi yok.",
    answer: "Bağlantı garanti değil",
    why: "VHF arazi gölgesinde. HF sonucu da frekans, mesafe ve iyonosfere bağlıdır; otomatik çözüm değildir.",
  },
];
export function Propagation() {
  const [alt, setAlt] = useState(8000),
    [height, setHeight] = useState(100),
    [range, setRange] = useState(85),
    [terrain, setTerrain] = useState(0),
    [freq, setFreq] = useState(12),
    [condition, setCondition] = useState(60),
    [hfDistance, setHfDistance] = useState(1800),
    [scenario, setScenario] = useState(0),
    [answer, setAnswer] = useState("");
  const v = vhf(alt, height, range, terrain),
    h = hf(freq, condition, hfDistance),
    c = communicationScenarios[scenario];
  return (
    <>
      <div className="equal-grid">
        <Panel
          title="VHF · Görüş hattı"
          kicker="EXPERIMENT / RADIO HORIZON"
          action={
            <span className={`status ${v.quality === "GOOD" ? "" : "warning"}`}>
              {v.quality}
            </span>
          }
        >
          <svg
            viewBox="0 0 700 320"
            className="propagation-view"
            aria-label="VHF radyo ufku ve arazi engeli"
          >
            <path
              d="M-50 330Q350 190 750 330"
              stroke="#758997"
              fill="#1a303a"
              strokeWidth="2"
            />
            <path
              d={`M270 270L350 ${270 - Math.min(terrain / 22, 150)} 430 270Z`}
              fill="#4a5053"
              stroke="#7a8181"
            />
            <path
              d={`M90 288V${275 - height / 10}`}
              stroke="var(--amber)"
              strokeWidth="4"
            />
            <circle cx="90" cy={275 - height / 10} r="6" fill="var(--amber)" />
            <line
              x1="90"
              y1={275 - height / 10}
              x2="610"
              y2={230 - alt / 190}
              stroke={v.quality === "BLOCKED" ? "var(--red)" : "var(--mint)"}
              strokeWidth="2"
              strokeDasharray="8 6"
            />
            <Plane x={610} y={230 - alt / 190} heading={90} />
            <text x="38" y="40" className="map-label">
              4/3 EARTH MODEL / ŞEMATİK ÖLÇEK
            </text>
            <text x="240" y="308" className="map-data">
              {range} NM
            </text>
            <text x="420" y="76" className="map-label">
              RADIO HORIZON {v.horizon.toFixed(1)} NM
            </text>
          </svg>
          <div className="metrics two">
            <Metric
              label="YAKLAŞIK RADYO UFKU"
              value={v.horizon.toFixed(1)}
              unit="NM"
              id="vhf-horizon"
            />
            <Metric
              label="ORTA NOKTA AÇIKLIĞI"
              value={Math.round(v.clearance)}
              unit="ft"
            />
          </div>
          <Slider
            label="VHF uçak irtifası"
            value={alt}
            min={100}
            max={40000}
            step={100}
            unit="ft"
            onChange={setAlt}
          />
          <Slider
            label="İstasyon anten yüksekliği"
            value={height}
            min={10}
            max={1000}
            step={10}
            unit="ft"
            onChange={setHeight}
          />
          <Slider
            label="VHF bağlantı mesafesi"
            value={range}
            min={1}
            max={300}
            unit="NM"
            onChange={setRange}
          />
          <Slider
            label="Orta noktadaki arazi engeli"
            value={terrain}
            min={0}
            max={10000}
            step={100}
            unit="ft"
            onChange={setTerrain}
          />
          <Why>
            Yaklaşık ufuk: 1.23 × (√h uçak + √h anten), yükseklikler ft, sonuç
            NM. Dünya eğriliği ve orta noktadaki tek arazi engeli hesaplanır.
            Yükseklik artışı genellikle menzili artırır; bu bir kapsama
            garantisi değildir.
          </Why>
        </Panel>
        <Panel
          title="HF · Ufkun ötesi"
          kicker="EXPERIMENT / SKYWAVE"
          action={
            <span className={`status ${h.sky || h.ground ? "" : "warning"}`}>
              {h.quality}
            </span>
          }
        >
          <svg
            viewBox="0 0 700 320"
            className="propagation-view"
            aria-label="HF iyonosfer skywave gösterimi"
          >
            <path
              d="M-50 330Q350 220 750 330"
              fill="#1b303b"
              stroke="#78909e"
            />
            <path
              d="M-50 115Q350-20 750 115"
              stroke="#b18be3"
              strokeWidth="35"
              opacity={0.15 + condition / 300}
              fill="none"
            />
            <text x="252" y="32" className="map-label">
              IONOSPHERE
            </text>
            <path
              d={freq > h.muf ? "M85 282L330 0" : "M85 282Q290-110 620 282"}
              fill="none"
              stroke={h.sky ? "var(--mint)" : "var(--red)"}
              strokeWidth="2"
              strokeDasharray="8 5"
            />
            <path
              d="M85 282Q170 230 250 263"
              fill="none"
              stroke="var(--amber)"
              strokeWidth="3"
            />
            <text x="107" y="240" className="map-label">
              GROUND WAVE
            </text>
            <text x="345" y="130" className="map-data">
              {freq > h.muf ? "İYONOSFERİ GEÇER" : "KAVRAMSAL SKYWAVE"}
            </text>
            <path
              d="M85 282v-38m-12 13 12-13 12 13"
              fill="none"
              stroke="var(--amber)"
              strokeWidth="3"
            />
            <Plane x={620} y={257} heading={90} />
            <text x="315" y="308" className="map-label">
              {hfDistance} NM
            </text>
          </svg>
          <div className="metrics two">
            <Metric label="KAVRAMSAL MUF" value={h.muf.toFixed(1)} unit="MHz" />
            <Metric label="YAKLAŞIK SKIP SINIRI" value={h.skip} unit="NM" />
          </div>
          <Slider
            label="HF frekansı"
            value={freq}
            min={2}
            max={30}
            step={0.5}
            unit="MHz"
            onChange={setFreq}
          />
          <Slider
            label="İyonosfer koşulu"
            value={condition}
            min={0}
            max={100}
            unit="%"
            onChange={setCondition}
          />
          <Slider
            label="HF bağlantı mesafesi"
            value={hfDistance}
            min={50}
            max={5000}
            step={50}
            unit="NM"
            onChange={setHfDistance}
          />
          <div className="note">
            Simplified conceptual HF propagation model.
          </div>
          <Why>
            Skywave, iyonosferde kademeli kırılmayla yere dönebilir. Çizimdeki
            yay bunu temsil eder. Çok yüksek frekans katmanı geçebilir; daha
            yakın mesafede skip zone oluşabilir. MUF ve skip sınırları yalnız bu
            deneyin açıkça basitleştirilmiş eşikleridir.
          </Why>
        </Panel>
      </div>
      <Panel title="Bu uçuşta hangi iletişim?" kicker="VHF VS HF">
        <div className="button-row">
          {communicationScenarios.map((x, i) => (
            <button
              className={`button ${scenario === i ? "active" : ""}`}
              key={x.name}
              onClick={() => {
                setScenario(i);
                setAnswer("");
              }}
            >
              {x.name}
            </button>
          ))}
        </div>
        <p className="intro">{c.context}</p>
        <div className="choice-grid">
          {["VHF", "HF", "Bağlantı garanti değil"].map((a) => (
            <button
              key={a}
              className={answer === a ? "selected" : ""}
              onClick={() => setAnswer(a)}
            >
              {a === "HF" ? <Waves size={20} /> : <Radio size={20} />} {a}
            </button>
          ))}
        </div>
        {answer && (
          <p
            className={answer === c.answer ? "success-text" : "amber-text"}
            role="status"
          >
            {answer === c.answer
              ? "Doğru."
              : "Bu koşulları tekrar değerlendir."}{" "}
            {c.why}
          </p>
        )}
        <div className="compare">
          <div>
            <h3>VHF</h3>
            <p>
              Ağırlıklı olarak line-of-sight · açık görüşte daha tutarlı ses
              bağlantısı · normal ATC kullanımı.
            </p>
          </div>
          <div>
            <h3>HF</h3>
            <p>
              Uzak / okyanus bölgelerinde uzun menzil · iyonosferik yayılım ·
              koşullara bağlı değişen kalite.
            </p>
          </div>
        </div>
      </Panel>
    </>
  );
}
const antennas = [
  {
    name: "VHF COM",
    x: 395,
    y: 175,
    detail:
      "Temsili üst gövde blade anteni. Gövde tarafından gölgelenme ve dikey polarizasyon kavramları için seç.",
  },
  {
    name: "VOR / LOC",
    x: 395,
    y: 400,
    detail:
      "Temsili kuyruk NAV anteni. VOR/LOC alımı ve yatay polarizasyon kavramını incele.",
  },
  {
    name: "ADF",
    x: 395,
    y: 285,
    detail:
      "Temsili loop/sense anten bölgesi. Yön bilgisi ve anten çevresindeki kurulum etkileri önemlidir.",
  },
  {
    name: "DME",
    x: 367,
    y: 225,
    detail:
      "Temsili alt gövde anteni. Yerdeki transponder ile sorgu/yanıt hattını sağlar.",
  },
  {
    name: "HF",
    x: 411,
    y: 358,
    detail:
      "Temsili kuyruk/uzun anten bölgesi. Uçak tipi, anten kuplörü ve gövde yapısı kurulumu değiştirir.",
  },
];
export function Antennas() {
  const [selected, setSelected] = useState(0),
    [polarization, setPolarization] = useState(0),
    [direction, setDirection] = useState(40),
    [shield, setShield] = useState(false),
    a = antennas[selected],
    shadow = shield && direction > 110 && direction < 250,
    power = Math.round(
      Math.cos(polarization * RAD) ** 2 * (shadow ? 0.15 : 1) * 100,
    );
  return (
    <>
      <div className="lab-grid">
        <Panel
          title="Uçağın görünmeyen bağlantıları"
          kicker="EXPLORE / ANTENNA LOCATIONS"
        >
          <svg
            className="antenna-view"
            viewBox="0 0 800 500"
            aria-label="Tıklanabilir temsili uçak anten yerleşimi"
          >
            <defs>
              <pattern
                id="ant-grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path d="M40 0H0V40" fill="none" stroke="#20374a" />
              </pattern>
            </defs>
            <rect width="800" height="500" fill="url(#ant-grid)" />
            <ellipse
              cx="395"
              cy="250"
              rx="120"
              ry="180"
              fill="none"
              stroke="var(--mint)"
              strokeDasharray="4 7"
              opacity=".4"
            />
            {shield && (
              <path
                d="M395 250L280 460Q400 520 520 460Z"
                fill="var(--red)"
                opacity=".13"
              />
            )}
            <path
              d="M395 55C414 60 418 115 417 180L620 295 620 326 416 265 411 377 480 423 480 440 395 418 310 440 310 423 379 377 374 265 170 326 170 295 373 180C372 115 376 60 395 55Z"
              fill="#233c50"
              stroke="#608295"
              strokeWidth="2"
            />
            <path
              d="M395 90V405M374 150h43M378 129h35"
              stroke="#86a4b4"
              strokeOpacity=".6"
              fill="none"
            />
            <line
              x1={a.x}
              y1={a.y}
              x2={a.x + Math.sin(direction * RAD) * 180}
              y2={a.y - Math.cos(direction * RAD) * 180}
              stroke={shadow ? "var(--red)" : "var(--mint)"}
              strokeWidth="2"
              strokeDasharray="5 5"
            />
            {antennas.map((ant, i) => (
              <g
                key={ant.name}
                role="button"
                tabIndex={0}
                aria-label={`${ant.name} antenini seç`}
                onClick={() => setSelected(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(i);
                  }
                }}
                className="antenna-marker"
              >
                <circle
                  cx={ant.x}
                  cy={ant.y}
                  r={selected === i ? 16 : 10}
                  fill={selected === i ? "var(--mint)" : "#182939"}
                  stroke="var(--mint)"
                />
                <line
                  x1={ant.x + 20}
                  y1={ant.y}
                  x2={530 + i * 16}
                  y2={ant.y}
                  stroke="#5b7d90"
                />
                <text x={537 + i * 16} y={ant.y + 5} className="map-data">
                  {ant.name}
                </text>
              </g>
            ))}
            <text x="25" y="30" className="map-label">
              ANTEN BÖLGELERİNE TIKLA
            </text>
          </svg>
          <p className="fine inset">
            Actual antenna locations vary by aircraft type. Temsili üstten
            görünüm; alt gövde bileşenleri açıklama için görünür çizilmiştir.
          </p>
        </Panel>
        <Panel title={a.name} kicker="LEARN / INSTALLATION">
          <Antenna size={36} className="mint-icon" />
          <p>{a.detail}</p>
          <Metric
            label="BAĞIL POLARİZASYON / GÖLGE KAZANCI"
            value={power}
            unit="%"
          />
          <Slider
            label="Polarizasyon uyumsuzluğu"
            value={polarization}
            min={0}
            max={90}
            unit="°"
            onChange={setPolarization}
          />
          <Slider
            label="Sinyalin göreli yönü"
            value={direction}
            min={0}
            max={359}
            unit="°"
            onChange={setDirection}
          />
          <Toggle on={shield} click={() => setShield(!shield)}>
            Gövde gölgesini göster
          </Toggle>
          <Why>
            İdeal doğrusal anten eşleşmesinde cos²(θ) polarizasyon kaybını
            temsil eder. Burada 110–250° arka sektör, gövde gölgesi deneyi için
            seçilmiştir. Bu bağıl grafik gerçek anten kazanç deseni veya RF
            kalibrasyonu değildir.
          </Why>
          <div className="button-row">
            {antennas.map((ant, i) => (
              <button
                className={`button ${selected === i ? "active" : ""}`}
                key={ant.name}
                onClick={() => setSelected(i)}
              >
                {ant.name}
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
