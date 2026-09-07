import { useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Pause,
  Play,
  Target,
} from "lucide-react";
import {
  AdfGauge,
  Experiment,
  Frequency,
  Gauge,
  Metric,
  NavMap,
  Panel,
  Plane,
  SignalChain,
  Slider,
  Toggle,
  Why,
  svgPoint,
  type Update,
} from "./components";
import {
  approachPosition,
  calculate,
  clamp,
  delta,
  dmeRange,
  faultInfo,
  fmt,
  FT_NM,
  norm,
  project,
  RAD,
  type Fault,
  type State,
} from "./model";
export function Faults({
  s,
  update,
  adf = false,
}: {
  s: State;
  update: Update;
  adf?: boolean;
}) {
  const faults: Fault[] = adf
    ? ["adfWeak", "adfNoise", "adfFreeze", "adfReceiver", "antenna"]
    : ["loc", "gs", "receiver", "antenna", "unreliable", "unstable", "course"];
  return (
    <Panel title="Sistemi sınırlarında dene" kicker="FAILURE INJECTION">
      <div className="fault-buttons">
        {faults.map((f) => (
          <button
            key={f}
            aria-pressed={s.faults.includes(f)}
            className={`fault-button ${s.faults.includes(f) ? "active" : ""}`}
            onClick={() =>
              update({
                faults: s.faults.includes(f)
                  ? s.faults.filter((x) => x !== f)
                  : [...s.faults, f],
                ...(f === "adfFreeze" && !s.faults.includes(f)
                  ? { frozenAdf: calculate(s).adf.needle }
                  : {}),
              })
            }
          >
            <span /> {faultInfo[f].label}
          </button>
        ))}
      </div>
      {faults
        .filter((f) => s.faults.includes(f))
        .map((f) => (
          <div className="fault-explanation" key={f}>
            <b>{faultInfo[f].label}</b>
            <p>{faultInfo[f].description}</p>
            <small>Kalan işlev: {faultInfo[f].remaining}</small>
          </div>
        ))}
      <p className="fine">
        Arızalar sadeleştirilmiş eğitim gösterimleridir. Salınım yalnız seçilen
        arıza sırasında uygulanır.
      </p>
    </Panel>
  );
}
export function IlsViews({
  s,
  update,
  signals,
}: {
  s: State;
  update: Update;
  signals: boolean;
}) {
  const [drag, setDrag] = useState(""),
    m = calculate(s).ils,
    x = 750 - m.d * 55,
    y = 195 + m.lateral * 130,
    sy = 260 - s.altitude / 18;
  const move = (e: ReactPointerEvent<SVGSVGElement>, view: string) => {
    const p = svgPoint(e),
      d = clamp((750 - p.x) / 55, 0.2, 12);
    if (view === "plan")
      update({
        aircraft: approachPosition(s, d, clamp((p.y - 195) / 130, -1.3, 1.3)),
      });
    else
      update({
        aircraft: approachPosition(s, d, m.lateral),
        altitude: clamp((260 - p.y) * 18, 0, 4200),
      });
  };
  const event = (view: string) => ({
    onPointerDown: (e: ReactPointerEvent<SVGSVGElement>) => {
      setDrag(view);
      e.currentTarget.setPointerCapture(e.pointerId);
      move(e, view);
    },
    onPointerMove: (e: ReactPointerEvent<SVGSVGElement>) => {
      if (drag === view) move(e, view);
    },
    onPointerUp: () => setDrag(""),
    onPointerCancel: () => setDrag(""),
  });
  return (
    <div className="ils-views">
      <div className="view-label">
        <span>
          <i className="dot magenta" /> LOCALIZER
        </span>
        <small>PLAN VIEW / ÜSTTEN GÖRÜNÜM</small>
      </div>
      <svg
        className="interactive-map ils-plan"
        data-testid="ils-plan"
        viewBox="0 0 850 365"
        aria-label="Localizer plan görünümü; uçağı sürükle"
        {...event("plan")}
      >
        <defs>
          <pattern
            id="ils-grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M40 0H0V40"
              fill="none"
              stroke="#2a3f52"
              strokeWidth=".6"
            />
          </pattern>
          <linearGradient id="beam">
            <stop stopColor="#c67ef3" stopOpacity=".02" />
            <stop offset="1" stopColor="#c67ef3" stopOpacity=".17" />
          </linearGradient>
        </defs>
        <rect width="850" height="365" fill="#101f30" />
        <rect width="850" height="365" fill="url(#ils-grid)" />
        <path
          d="M-50 340Q100 250 230 310T460 300T690 350M-50 315Q100 225 230 285T460 275T690 325M-20 20Q190 110 300 40T670 70T890 15M-20 43Q190 133 300 63T670 93T890 38"
          className="terrain-line"
        />
        <path
          d="M40 135L820 195 40 255Z"
          fill="url(#beam)"
          stroke="#bd82de"
          strokeOpacity=".22"
        />
        {signals && (
          <>
            <path d="M35 75L820 195 35 210Z" fill="#bd82de" opacity=".14" />
            <path d="M35 180L820 195 35 310Z" fill="#56decb" opacity=".1" />
            <text x="60" y="105" className="map-label">
              90 Hz BASKIN / SOL SEKTÖR
            </text>
            <text x="60" y="298" className="map-label">
              150 Hz BASKIN / SAĞ SEKTÖR
            </text>
          </>
        )}
        <path
          d="M30 195H823"
          stroke="var(--magenta)"
          strokeWidth="1.5"
          strokeDasharray="10 7"
        />
        {[2, 4, 6, 8, 10, 12].map((d) => (
          <g key={d}>
            <path d={`M${750 - d * 55} 183v24`} stroke="#577087" />
            <text
              x={750 - d * 55}
              y="337"
              className="map-label"
              textAnchor="middle"
            >
              {d} NM
            </text>
          </g>
        ))}
        <rect
          x="749"
          y="179"
          width="87"
          height="32"
          rx="2"
          fill="#4c5e72"
          stroke="#96a4b8"
        />
        <path
          d="M755 181v28m4-28v28m4-28v28m4-28v28M776 195h54"
          stroke="#e2e8ee"
          strokeWidth="2"
          strokeDasharray="7 5"
        />
        <text
          x="791"
          y="202"
          fill="#e4ebf3"
          fontSize="12"
          textAnchor="middle"
          transform="rotate(90 791 195)"
        >
          {Math.round(norm(s.runwayCourse) / 10) || 36}
        </text>
        <text x="737" y="155" className="map-data">
          RWY {fmt(s.runwayCourse)}°
        </text>
        <circle cx="829" cy="195" r="4" fill="var(--magenta)" />
        <line
          x1={x}
          y1={y}
          x2={x}
          y2="195"
          stroke="var(--mint)"
          strokeDasharray="3 4"
        />
        <Plane
          x={x}
          y={y}
          heading={90 + delta(s.heading, s.runwayCourse)}
          color="var(--mint)"
        />
        <text
          x={clamp(x + 33, 60, 720)}
          y={clamp(y - 30, 45, 300)}
          className="map-data"
        >
          AEE 301
        </text>
        <text
          x={clamp(x + 33, 60, 720)}
          y={clamp(y - 11, 60, 320)}
          className="map-label"
        >
          {m.lateral >= 0 ? "+" : ""}
          {m.lateral.toFixed(2)} NM · HDG {fmt(s.heading)}°
        </text>
        <text x="27" y="31" className="map-label">
          {s.running ? "SIMULATION RUNNING" : "UÇAĞI SÜRÜKLEYEREK DENE"}
        </text>
        <text x="810" y="32" className="map-label" textAnchor="end">
          FRONT COURSE →
        </text>
      </svg>
      <div className="view-label side">
        <span>
          <i className="dot" /> GLIDESLOPE
        </span>
        <small>PROFILE VIEW / YANDAN GÖRÜNÜM</small>
      </div>
      <svg
        className="interactive-map ils-profile"
        data-testid="ils-profile"
        viewBox="0 0 850 300"
        aria-label="Glideslope yan görünümü; uçağı sürükle"
        {...event("profile")}
      >
        <rect width="850" height="300" fill="#0c1928" />
        {[1000, 2000, 3000, 4000].map((a) => (
          <g key={a}>
            <line
              x1="55"
              y1={260 - a / 18}
              x2="800"
              y2={260 - a / 18}
              stroke="#22364b"
              strokeDasharray="4 5"
            />
            <text x="15" y={264 - a / 18} className="map-label">
              {a / 1000}k
            </text>
          </g>
        ))}
        <path d="M50 45L759 260 50 260Z" fill="#56decb" opacity=".025" />
        {signals && (
          <>
            <path d="M45 20L759 260 45 70Z" fill="#56decb" opacity=".13" />
            <path d="M45 65L759 260 45 120Z" fill="#bd82de" opacity=".13" />
            <text x="285" y="47" className="map-label">
              150 Hz ÜST / 90 Hz ALT
            </text>
          </>
        )}
        <path
          d={`M45 ${260 - (((750 - 45) / 55 + 0.157) * FT_NM * Math.tan(3 * RAD)) / 18}L759 260`}
          stroke="var(--mint)"
          strokeWidth="2"
          strokeDasharray="7 5"
        />
        <path d="M0 264H850V300H0Z" fill="#1b2b3a" />
        <path d="M750 261h87" stroke="#93a7b7" strokeWidth="5" />
        <text x="737" y="289" className="map-label">
          THRESHOLD
        </text>
        <text x="55" y="285" className="map-label">
          DİKEY ÖLÇEK BÜYÜTÜLMÜŞTÜR
        </text>
        <text x="636" y="214" className="map-data">
          3° GLIDE PATH
        </text>
        <line
          x1={x}
          y1={sy}
          x2={x}
          y2="261"
          stroke="#7189a1"
          strokeDasharray="4 5"
        />
        <Plane x={x} y={sy} heading={90} scale={0.85} />
        <text
          x={clamp(x + 33, 60, 710)}
          y={clamp(sy - 15, 23, 235)}
          className="map-data"
        >
          {Math.round(s.altitude).toLocaleString("tr-TR")} ft
        </text>
        <text
          x={clamp(x + 33, 60, 710)}
          y={clamp(sy + 3, 40, 253)}
          className="map-label"
        >
          ACTUAL {m.glideAngle.toFixed(2)}°
        </text>
      </svg>
    </div>
  );
}
export function IlsLab({
  s,
  update,
  compact = false,
}: {
  s: State;
  update: Update;
  compact?: boolean;
}) {
  const [signals, setSignals] = useState(true),
    m = calculate(s).ils;
  return (
    <>
      <div className="lab-grid">
        <Panel
          title="İki sinyal. Tek yaklaşma hattı."
          kicker="EXPERIMENT / RWY 36"
          className="map-panel"
          action={
            <Toggle on={signals} click={() => setSignals(!signals)}>
              Sinyal yapısı
            </Toggle>
          }
        >
          <IlsViews s={s} update={update} signals={signals} />
          <div className="map-legend">
            <span>
              <i className="dot magenta" /> Localizer course
            </span>
            <span>
              <i className="dot" /> Nominal 3° glide path
            </span>
            <span>↔ Uçağı iki görünümde sürükle</span>
          </div>
          <p className="fine inset">
            Simplified educational representation — not a detailed RF field
            simulation. GS referans noktası eşikten 0.157 NM ileridedir; eşik
            yüksekliği yaklaşık 50 ft.
          </p>
        </Panel>
        <Panel
          title="Navigation display"
          kicker="OBSERVE / NAV 1"
          className="instrument-panel"
          action={
            <span
              className={`status ${m.locValid && m.gsValid && m.reliable ? "" : "warning"}`}
            >
              {m.locValid && m.gsValid
                ? m.reliable
                  ? "LIVE"
                  : "CAUTION"
                : "FLAG"}
            </span>
          }
        >
          <Frequency s={s} update={update} />
          <Gauge s={s} />
          <div className="status-row">
            <span
              className={
                Math.abs(m.loc) < 0.1 && m.locValid
                  ? "success-text"
                  : "amber-text"
              }
            >
              {m.locStatus}
            </span>
            <span
              className={
                Math.abs(m.gs) < 0.1 && m.gsValid
                  ? "success-text"
                  : "amber-text"
              }
            >
              {m.gsStatus}
            </span>
          </div>
          <div className="metrics two">
            <Metric
              label="LOC DEVIATION"
              value={m.locValid ? m.locAngle.toFixed(2) : "—"}
              unit="°"
              tone="magenta"
              id="loc-value"
            />
            <Metric
              label="GS DEVIATION"
              value={m.gsValid ? m.gsAngle.toFixed(2) : "—"}
              unit="°"
              tone="mint"
              id="gs-value"
            />
          </div>
          <Slider
            label="OBS / selected course"
            value={s.obs}
            min={0}
            max={359}
            unit="°"
            onChange={(obs) => update({ obs })}
          />
          <Toggle on={s.ilsOn} click={() => update({ ilsOn: !s.ilsOn })}>
            ILS istasyonu açık
          </Toggle>
          <p className="fine">
            OBS kurs referansıdır; ILS ışınını döndürmez. Manyetik kuzey,
            modelde ortak yön referansıdır.
          </p>
        </Panel>
      </div>
      <Panel
        title="Yaklaşmayı sen yönet"
        kicker="MANUAL FLIGHT CONTROLS"
        action={
          <button
            className="button primary"
            onClick={() =>
              update({
                running: !s.running,
                flightMode: "approach",
                approachStatus: s.running ? "PAUSED" : "MANUAL / UÇUŞ",
              })
            }
          >
            {s.running ? <Pause size={15} /> : <Play size={15} />}{" "}
            {s.running ? "Duraklat" : "Yaklaşmayı başlat"}
          </button>
        }
      >
        <div className="metrics four">
          <Metric
            label="THRESHOLD DISTANCE"
            value={m.d.toFixed(2)}
            unit="NM"
            id="approach-distance"
          />
          <Metric
            label="ALTITUDE / AGL"
            value={Math.round(s.altitude).toLocaleString("tr-TR")}
            unit="ft"
          />
          <Metric label="AIRCRAFT HEADING" value={fmt(s.heading)} unit="°" />
          <Metric
            label="APPROACH STATUS"
            value={s.approachStatus}
            tone="small-value"
          />
        </div>
        <div className="controls-grid">
          <Slider
            label="Yaklaşma mesafesi"
            value={m.d}
            min={0.2}
            max={12}
            step={0.05}
            unit="NM"
            onChange={(d) =>
              update({ aircraft: approachPosition(s, d, m.lateral) })
            }
          />
          <Slider
            label="Yanal uzaklık"
            value={m.lateral}
            min={-1.3}
            max={1.3}
            step={0.01}
            unit="NM"
            onChange={(l) => update({ aircraft: approachPosition(s, m.d, l) })}
          />
          <Slider
            label="İrtifa"
            value={s.altitude}
            min={0}
            max={4200}
            step={10}
            unit="ft"
            onChange={(altitude) => update({ altitude })}
          />
          <Slider
            label="Heading"
            value={s.heading}
            min={0}
            max={359}
            unit="°"
            onChange={(heading) => update({ heading })}
          />
          <Slider
            label="Dikey hız"
            value={s.verticalSpeed}
            min={-1800}
            max={1800}
            step={20}
            unit="ft/min"
            onChange={(verticalSpeed) => update({ verticalSpeed })}
          />
          <Slider
            label="Simülasyon hızı"
            value={s.rate}
            min={1}
            max={12}
            unit="×"
            onChange={(rate) => update({ rate })}
          />
        </div>
        <div className="flight-buttons">
          <button onClick={() => update({ heading: norm(s.heading - 2) })}>
            <ArrowLeft size={16} /> Heading −2°
          </button>
          <button onClick={() => update({ heading: norm(s.heading + 2) })}>
            Heading +2° <ArrowRight size={16} />
          </button>
          <button
            onClick={() =>
              update({
                verticalSpeed: clamp(s.verticalSpeed + 100, -1800, 1800),
              })
            }
          >
            <ArrowUp size={16} /> Tırmanış +100
          </button>
          <button
            onClick={() =>
              update({
                verticalSpeed: clamp(s.verticalSpeed - 100, -1800, 1800),
              })
            }
          >
            <ArrowDown size={16} /> Alçalış −100
          </button>
        </div>
        <Why>
          Uçak merkez hattının {m.lateral < 0 ? "solunda" : "sağında"}: course
          uçağın {m.lateral < 0 ? "sağında" : "solunda"} kaldığı için LOC iğnesi{" "}
          {m.lateral < 0 ? "sağa" : "sola"} gider. İrtifa{" "}
          {Math.round(m.targetAltitude)} ft olan hedefin{" "}
          {s.altitude > m.targetAltitude
            ? "üzerinde; GS iğnesi aşağıda"
            : "altında; GS iğnesi yukarıda"}
          . İğne konumu, istenen hattın uçağa göre yerini gösterir. Tam merkezde
          iki iğne kesişir. Bu panelde uçuş manueldir.
        </Why>
      </Panel>
      {!compact && (
        <>
          <Experiment
            title="Localizer ve glideslope’u yakala"
            steps={[
              "Localizer sapmasını ±0.25° içine getir.",
              "GS sapmasını ±0.07° içine getir.",
              "İki ekseni aynı anda merkezle, heading’i pist doğrultusuna ±5° yaklaştır.",
            ]}
            checks={[
              m.locValid && Math.abs(m.locAngle) < 0.25,
              m.gsValid && Math.abs(m.gsAngle) < 0.07,
              m.locValid &&
                m.gsValid &&
                m.reliable &&
                Math.abs(m.locAngle) < 0.25 &&
                Math.abs(m.gsAngle) < 0.07 &&
                Math.abs(delta(s.heading, s.runwayCourse)) < 5,
            ]}
          />
          <SignalChain s={s} update={update} />
          <Faults s={s} update={update} />
        </>
      )}
    </>
  );
}
export function VorLab({ s, update }: { s: State; update: Update }) {
  const [overlays, setOverlays] = useState(["radial", "course", "from"]),
    [steps, setSteps] = useState(false),
    [why, setWhy] = useState("flag"),
    m = calculate(s).vor;
  const toggle = (key: string) =>
    setOverlays(
      overlays.includes(key)
        ? overlays.filter((x) => x !== key)
        : [...overlays, key],
    );
  return (
    <>
      <div className="lab-grid">
        <Panel
          title="Radial her zaman istasyondan dışarıdır"
          kicker="EXPERIMENT / ANK VOR"
          className="map-panel"
        >
          <NavMap s={s} update={update} mode="VOR" overlays={overlays} />
          <div className="overlay-controls">
            {[
              ["radial", "Radialleri göster"],
              ["course", "Selected course"],
              ["to", "Bearing TO"],
              ["from", "Bearing FROM"],
            ].map(([key, label]) => (
              <Toggle
                key={key}
                on={overlays.includes(key)}
                click={() => toggle(key)}
              >
                {label}
              </Toggle>
            ))}
          </div>
        </Panel>
        <Panel title="VOR / OBS" kicker="OBSERVE">
          <Frequency s={s} update={update} />
          <Gauge s={s} mode="VOR" />
          <div className="metrics two">
            <Metric
              label="CURRENT RADIAL"
              value={fmt(m.radial)}
              unit="°"
              id="radial"
            />
            <Metric
              label="TO / FROM"
              value={m.valid ? m.flag : "OFF"}
              id="vor-flag"
            />
          </div>
          <Slider
            label="OBS / course"
            value={s.obs}
            min={0}
            max={359}
            unit="°"
            onChange={(obs) => update({ obs })}
          />
          <Slider
            label="Uçak heading"
            value={s.heading}
            min={0}
            max={359}
            unit="°"
            onChange={(heading) => update({ heading })}
          />
          <Toggle on={s.vorOn} click={() => update({ vorOn: !s.vorOn })}>
            VOR istasyonu açık
          </Toggle>
        </Panel>
      </div>
      <Panel
        title="Geometriyi değiştir, iğneyi takip et"
        kicker="LEARN / VISUALIZE"
      >
        <div className="controls-grid">
          <Slider
            label="Uçak radial"
            value={m.radial}
            min={0}
            max={359}
            unit="°"
            onChange={(a) =>
              update({ aircraft: project(s.vor, a, Math.max(0.1, m.range)) })
            }
          />
          <Slider
            label="İstasyona yatay mesafe"
            value={m.range}
            min={0}
            max={12}
            step={0.1}
            unit="NM"
            onChange={(d) => update({ aircraft: project(s.vor, m.radial, d) })}
          />
          <Slider
            label="Rüzgâr hızı"
            value={s.windSpeed}
            min={0}
            max={50}
            unit="kt"
            onChange={(windSpeed) => update({ windSpeed })}
          />
          <Slider
            label="Rüzgârın geldiği yön"
            value={s.windDirection}
            min={0}
            max={359}
            unit="°"
            onChange={(windDirection) => update({ windDirection })}
          />
        </div>
        <div className="button-row">
          <button
            className="button"
            onClick={() =>
              update({
                running: !s.running,
                flightMode: "free",
                verticalSpeed: 0,
              })
            }
          >
            {s.running ? <Pause size={14} /> : <Play size={14} />} Rüzgârlı uçuş{" "}
            {s.running ? "durdur" : "başlat"}
          </button>
          <button
            className={`button ${why === "flag" ? "active" : ""}`}
            onClick={() => setWhy("flag")}
          >
            TO/FROM açıkla
          </button>
          <button
            className={`button ${why === "cdi" ? "active" : ""}`}
            onClick={() => setWhy("cdi")}
          >
            CDI açıkla
          </button>
          <Toggle on={steps} click={() => setSteps(!steps)}>
            Adım adım
          </Toggle>
        </div>
        <Why>
          {why === "flag"
            ? `Uçak ${fmt(m.radial)}° radial üzerinde. OBS ${fmt(s.obs)}°. Bu course istasyona göre ${m.flag === "TO" ? "içeri" : "dışarı"} yöneldiğinden bayrak ${m.valid ? m.flag : "OFF"} olur. TO/FROM gerçek uçuş yönünü veya heading’i ölçmez.`
            : `Seçilen course’a açısal sapma ${m.deviation.toFixed(2)}°. İğne ${m.deviation < 0 ? "sola" : "sağa"} sapar; tam ölçek ±10° (nokta başına 2°). Heading ters yönde ise normal course takibi için iğneyi yorumlamak gerekir. ${m.ambiguous ? "Course istasyona yaklaşık 90°; TO/FROM belirsizlik bölgesinde." : ""}`}
        </Why>
        {steps && (
          <ol className="steps">
            <li>İstasyondan uçağa yön: {fmt(m.radial)}° FROM.</li>
            <li>Uçaktan istasyona bearing: {fmt(m.bearingTo)}° TO.</li>
            <li>
              OBS: {fmt(s.obs)}°; reciprocal: {fmt(s.obs + 180)}°.
            </li>
            <li>
              Course yön ilişkisi: {m.flag}. Sinyal:{" "}
              {m.valid ? "geçerli" : "geçersiz"}.
            </li>
            <li>
              Geometrik CDI sapması: {m.deviation.toFixed(2)}°; heading{" "}
              {fmt(s.heading)}° bu hesabı değiştirmez.
            </li>
          </ol>
        )}
      </Panel>
      <Experiment
        title="Dört VOR deneyi"
        steps={[
          "Uçağı 270° radial üzerine getir.",
          "OBS’yi istasyona doğrudan gidecek şekilde ayarla (TO, CDI merkez).",
          "045° outbound radialini yakala: konum ve OBS 045° olmalı.",
          "Mevcut radial ile aynı OBS’yi seçerek FROM ve merkez CDI üret.",
        ]}
        checks={[
          m.valid && Math.abs(delta(m.radial, 270)) < 2,
          m.valid && m.flag === "TO" && Math.abs(m.deviation) < 1,
          m.valid &&
            Math.abs(delta(m.radial, 45)) < 2 &&
            Math.abs(delta(s.obs, 45)) < 2,
          m.valid && m.flag === "FROM" && Math.abs(m.deviation) < 1,
        ]}
      />
      <SignalChain s={s} update={update} system="VOR" />
    </>
  );
}
export function AdfLab({ s, update }: { s: State; update: Update }) {
  const [overlays, setOverlays] = useState([
      "nose",
      "relative",
      "magnetic",
      "line",
      "heading",
    ]),
    m = calculate(s).adf;
  return (
    <>
      <div className="lab-grid">
        <Panel
          title="Burun döner, istasyon yerinde kalır"
          kicker="EXPERIMENT / NDB 365"
          className="map-panel"
        >
          <NavMap s={s} update={update} mode="ADF" overlays={overlays} />
          <div className="overlay-controls">
            {[
              ["nose", "Burun referansı"],
              ["relative", "Relative bearing"],
              ["magnetic", "Magnetic bearing"],
              ["line", "İstasyon çizgisi"],
              ["heading", "Heading"],
            ].map(([key, label]) => (
              <Toggle
                key={key}
                on={overlays.includes(key)}
                click={() =>
                  setOverlays(
                    overlays.includes(key)
                      ? overlays.filter((x) => x !== key)
                      : [...overlays, key],
                  )
                }
              >
                {label}
              </Toggle>
            ))}
          </div>
        </Panel>
        <Panel title="Automatic direction finder" kicker="OBSERVE / FIXED CARD">
          <AdfGauge s={s} />
          <div className="metrics two">
            <Metric
              label="RELATIVE BEARING"
              value={m.valid ? fmt(m.relative) : "—"}
              unit="°"
              id="adf-rb"
            />
            <Metric
              label="MAGNETIC BEARING"
              value={m.valid ? fmt(m.bearing) : "—"}
              unit="°"
              id="adf-mb"
            />
          </div>
          <Slider
            label="ADF uçak heading"
            value={s.heading}
            min={0}
            max={359}
            unit="°"
            onChange={(heading) => update({ heading })}
          />
          <label className="select-label">
            ADF frekansı
            <select
              aria-label="ADF frekansı"
              value={s.adfFrequency}
              onChange={(e) => update({ adfFrequency: Number(e.target.value) })}
            >
              <option value={365}>365 kHz — NDB</option>
              <option value={400}>400 kHz — Boş kanal</option>
            </select>
          </label>
          <Toggle on={s.ndbOn} click={() => update({ ndbOn: !s.ndbOn })}>
            NDB istasyonu açık
          </Toggle>
        </Panel>
      </div>
      <Panel title="Üç açı, tek ilişki" kicker="LEARN / OBSERVE">
        <div className="equation">
          {fmt(s.heading)}° <small>MH</small> + {fmt(m.relative)}°{" "}
          <small>RB</small> = {fmt(m.bearing)}° <small>MB (mod 360)</small>
        </div>
        <div className="controls-grid">
          <Slider
            label="NDB doğu / batı"
            value={s.ndb.x}
            min={-15}
            max={15}
            step={0.2}
            unit="NM"
            onChange={(x) => update({ ndb: { ...s.ndb, x } })}
          />
          <Slider
            label="NDB kuzey / güney"
            value={s.ndb.y}
            min={-15}
            max={15}
            step={0.2}
            unit="NM"
            onChange={(y) => update({ ndb: { ...s.ndb, y } })}
          />
          <Slider
            label="ADF rüzgâr hızı"
            value={s.windSpeed}
            min={0}
            max={50}
            unit="kt"
            onChange={(windSpeed) => update({ windSpeed })}
          />
        </div>
        <div className="button-row">
          <button
            className="button"
            onClick={() => update({ heading: norm(s.heading + 90) })}
          >
            Uçağı yerinde +90° döndür
          </button>
          <button
            className="button"
            onClick={() =>
              update({
                running: !s.running,
                flightMode: "free",
                verticalSpeed: 0,
              })
            }
          >
            {s.running ? "Uçuşu durdur" : "Rüzgârlı uçuşu başlat"}
          </button>
        </div>
        <Why>
          MH uçağın manyetik heading’idir. RB burundan saat yönünde ölçülür.
          Konum sabitken yalnız heading’i değiştir: MB sabit kalır, RB ters
          yönde değişir.{" "}
          {m.disturbed
            ? "Seçili arıza nedeniyle gösterge iğnesi geometrik RB’den farklı olabilir."
            : ""}
        </Why>
      </Panel>
      <SignalChain s={s} update={update} system="ADF" />
      <Faults s={s} update={update} adf />
    </>
  );
}
export function DmeLab({ s, update }: { s: State; update: Update }) {
  const [prediction, setPrediction] = useState(""),
    [hide, setHide] = useState(false),
    [result, setResult] = useState(false),
    m = calculate(s).dme,
    station = s.frequency === 113.6 ? s.vor : s.runway;
  const maxError = Math.max(0.25, Math.ceil(dmeRange(0, s.altitude) * 2) / 2);
  const points = Array.from(
    { length: 101 },
    (_, i) =>
      `${65 + i * 6.8},${230 - ((dmeRange(i, s.altitude) - i) / maxError) * 190}`,
  ).join(" ");
  return (
    <>
      <div className="lab-grid">
        <Panel
          title="Yatay mesafe, ölçülen mesafe değildir"
          kicker="EXPERIMENT / DME"
        >
          <svg
            viewBox="0 0 800 340"
            className="dme-view"
            aria-label="DME eğik mesafe üçgeni"
          >
            <defs>
              <pattern
                id="dme-grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path d="M40 0H0V40" stroke="#24374b" fill="none" />
              </pattern>
            </defs>
            <rect width="800" height="340" fill="url(#dme-grid)" />
            <path d="M65 265H745" stroke="#6c8395" />
            <path
              d={`M90 260H${90 + Math.min(100, m.ground) * 6.2}V${260 - s.altitude / 150}`}
              fill="none"
              stroke="#8199af"
              strokeDasharray="7 6"
            />
            <line
              x1="90"
              y1="260"
              x2={90 + Math.min(100, m.ground) * 6.2}
              y2={260 - s.altitude / 150}
              stroke="var(--mint)"
              strokeWidth="2"
            />
            <circle cx="90" cy="260" r="9" fill="var(--amber)" />
            <Plane
              x={90 + Math.min(100, m.ground) * 6.2}
              y={260 - s.altitude / 150}
              heading={90}
            />
            <text x="90" y="294" className="map-label">
              DME STATION
            </text>
            <text x="295" y="250" className="map-data">
              GROUND {m.ground.toFixed(2)} NM
            </text>
            <text x="225" y="110" className="map-data">
              SLANT {hide ? "?" : m.valid ? m.range.toFixed(2) : "—"} NM
            </text>
            <text x="29" y="30" className="map-label">
              DİKEY VE YATAY ÖLÇEKLER FARKLIDIR
            </text>
          </svg>
          <div className="controls-grid">
            <Slider
              label="DME yatay mesafe"
              value={m.ground}
              min={0}
              max={100}
              step={0.1}
              unit="NM"
              onChange={(d) => {
                setResult(false);
                update({ aircraft: project(station, 90, d) });
              }}
            />
            <Slider
              label="DME irtifa farkı"
              value={s.altitude}
              min={0}
              max={30000}
              step={100}
              unit="ft"
              onChange={(altitude) => {
                setResult(false);
                update({ altitude });
              }}
            />
          </div>
          <Why>
            DME, yatay uzaklığı ve irtifa farkını birlikte içerir. İstasyonun
            tam üzerinde 10.000 ft yüksekte yaklaşık 1.65 NM okursun. Burada yer
            tesisi yüksekliği 0 ft referans alınır.
          </Why>
        </Panel>
        <Panel title="Distance measuring equipment" kicker="OBSERVE">
          <Frequency s={s} update={update} />
          <div className="dme-display">
            <span>DME / NM</span>
            <strong data-testid="dme-range">
              {hide ? "?.??" : m.valid ? m.range.toFixed(2) : "—.—"}
            </strong>
            <small>{m.valid ? "PAIRED CHANNEL / VALID" : "NO REPLY"}</small>
          </div>
          <div className="metrics two">
            <Metric
              label="GROUND DISTANCE"
              value={m.ground.toFixed(2)}
              unit="NM"
            />
            <Metric
              label="SLANT FARKI"
              value={hide ? "?" : m.error.toFixed(3)}
              unit="NM"
            />
          </div>
          <Toggle
            on={hide}
            click={() => {
              setHide(!hide);
              setResult(false);
            }}
          >
            Tahmin için ölçümü gizle
          </Toggle>
          <label className="select-label">
            DME tahminin (NM)
            <input
              aria-label="DME tahmini"
              type="number"
              min="0"
              step=".01"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
            />
          </label>
          <button
            className="button primary"
            disabled={prediction.trim() === "" || !m.valid}
            onClick={() => {
              setResult(true);
              setHide(false);
            }}
          >
            Tahmini kontrol et
          </button>
          {result && (
            <p
              role="status"
              className={
                Math.abs(Number(prediction) - m.range) < 0.1
                  ? "success-text"
                  : "amber-text"
              }
            >
              {Math.abs(Number(prediction) - m.range) < 0.1
                ? "Doğru!"
                : "Tekrar düşün:"}{" "}
              DME {m.range.toFixed(2)} NM.
            </p>
          )}
          <Toggle
            on={!s.faults.includes("dme")}
            click={() =>
              update({
                faults: s.faults.includes("dme")
                  ? s.faults.filter((f) => f !== "dme")
                  : [...s.faults, "dme"],
              })
            }
          >
            DME yanıtı açık
          </Toggle>
        </Panel>
      </div>
      <Panel title="İstasyondan uzaklaştıkça farkı izle" kicker="VISUALIZE">
        <div className="equation">
          √( {m.ground.toFixed(2)}² + ({Math.round(s.altitude)} / 6076.12)² ) ={" "}
          {hide ? "?" : m.range.toFixed(2)} NM
        </div>
        <svg
          viewBox="0 0 800 285"
          aria-label="Yatay mesafeye göre DME slant farkı grafiği"
        >
          <path d="M65 25V230H755" fill="none" stroke="#71869b" />
          {[0, 20, 40, 60, 80, 100].map((n) => (
            <g key={n}>
              <text
                x={65 + n * 6.8}
                y="253"
                className="map-label"
                textAnchor="middle"
              >
                {n}
              </text>
              <line
                x1={65 + n * 6.8}
                y1="25"
                x2={65 + n * 6.8}
                y2="230"
                stroke="#26394d"
              />
            </g>
          ))}
          <text x="58" y="44" className="map-label" textAnchor="end">
            {maxError.toFixed(2)}
          </text>
          <text x="58" y="234" className="map-label" textAnchor="end">
            0
          </text>
          <polyline
            points={points}
            fill="none"
            stroke="var(--mint)"
            strokeWidth="3"
          />
          <circle
            cx={65 + Math.min(m.ground, 100) * 6.8}
            cy={230 - (m.error / maxError) * 190}
            r="6"
            fill="var(--amber)"
          />
          <text x="75" y="25" className="map-label">
            SLANT − GROUND / NM (ÜST SINIR {maxError.toFixed(2)})
          </text>
          <text x="330" y="277" className="map-label">
            YATAY MESAFE / NM
          </text>
        </svg>
      </Panel>
      <Experiment
        title="Dört DME deneyi"
        steps={[
          "İstasyonun tam üzerine uç: yatay mesafe < 0.1 NM.",
          "10.000 ft üzerinde ve 1 NM içinde slant farkını gözle.",
          "Yükseklik en az 5.000 ft iken slant farkını 0.02 NM altına indir.",
          "Ölçümü gizle, bir tahmin gir ve ±0.1 NM doğrulukla cevapla.",
        ]}
        checks={[
          m.valid && m.ground < 0.1,
          m.valid && s.altitude >= 10000 && m.ground <= 1,
          m.valid && s.altitude >= 5000 && m.error < 0.02,
          result && Math.abs(Number(prediction) - m.range) < 0.1,
        ]}
      />
      <SignalChain s={s} update={update} system="DME" />
    </>
  );
}
export function PositionControls({ s, update }: { s: State; update: Update }) {
  return (
    <div className="controls-grid">
      <Slider
        label="Uçak doğu / batı"
        value={s.aircraft.x}
        min={-20}
        max={20}
        step={0.05}
        unit="NM"
        onChange={(x) => update({ aircraft: { ...s.aircraft, x } })}
      />
      <Slider
        label="Uçak kuzey / güney"
        value={s.aircraft.y}
        min={-20}
        max={20}
        step={0.05}
        unit="NM"
        onChange={(y) => update({ aircraft: { ...s.aircraft, y } })}
      />
      <Slider
        label="Ortak irtifa"
        value={s.altitude}
        min={0}
        max={30000}
        step={10}
        unit="ft"
        onChange={(altitude) => update({ altitude })}
      />
      <Slider
        label="Ortak heading"
        value={s.heading}
        min={0}
        max={359}
        unit="°"
        onChange={(heading) => update({ heading })}
      />
      <Slider
        label="Ortak OBS"
        value={s.obs}
        min={0}
        max={359}
        unit="°"
        onChange={(obs) => update({ obs })}
      />
      <Slider
        label="Sinyal gücü"
        value={s.strength}
        min={0}
        max={100}
        unit="%"
        onChange={(strength) => update({ strength })}
      />
    </div>
  );
}
export const LabIcon = Target;
