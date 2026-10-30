import {
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Check, ChevronRight, Radio, RotateCcw } from "lucide-react";
import {
  calculate,
  chainNames,
  chainStatus,
  clamp,
  delta,
  fmt,
  project,
  RAD,
  type State,
  type System,
  type Point,
} from "./model";
export type Update = (patch: Partial<State>) => void;
function arc(
  center: Point,
  radius: number,
  start: number,
  sweep: number,
): string {
  const at = (angle: number): Point => ({
    x: center.x + Math.sin(angle * RAD) * radius,
    y: center.y - Math.cos(angle * RAD) * radius,
  });
  const from = at(start),
    to = at(start + sweep);
  return `M${from.x} ${from.y} A${radius} ${radius} 0 ${Math.abs(sweep) > 180 ? 1 : 0} ${sweep >= 0 ? 1 : 0} ${to.x} ${to.y}`;
}
export function Panel({
  title,
  kicker,
  children,
  action,
  className = "",
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-title">
        <div>
          {kicker && <span className="eyebrow">{kicker}</span>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
  id,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  id?: string;
}) {
  return (
    <label className="slider">
      <span>
        {label}
        <b>
          <input
            aria-label={`${label} değer`}
            type="number"
            value={Number(value.toFixed(3))}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              if (
                e.target.value !== "" &&
                Number.isFinite(e.target.valueAsNumber)
              )
                onChange(clamp(e.target.valueAsNumber, min, max));
            }}
          />
          {unit}
        </b>
      </span>
      <input
        aria-label={label}
        data-testid={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamp(value, min, max)}
        style={
          {
            "--range": `${((value - min) / (max - min)) * 100}%`,
          } as React.CSSProperties
        }
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <small>
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </small>
    </label>
  );
}
export function Toggle({
  children,
  on,
  click,
}: {
  children: ReactNode;
  on: boolean;
  click: () => void;
}) {
  return (
    <button
      className={`toggle ${on ? "on" : ""}`}
      aria-pressed={on}
      onClick={click}
    >
      <span className="switch" />
      {children}
    </button>
  );
}
export function Metric({
  label,
  value,
  unit = "",
  tone = "",
  id,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: string;
  id?: string;
}) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong data-testid={id}>
        {value}
        <small>{unit}</small>
      </strong>
    </div>
  );
}
export function Why({ children }: { children: ReactNode }) {
  return (
    <div className="why">
      <span className="why-icon">?</span>
      <div>
        <b>Neden böyle?</b>
        <p>{children}</p>
      </div>
    </div>
  );
}
export function Reset({ onClick }: { onClick: () => void }) {
  return (
    <button className="button ghost" onClick={onClick}>
      <RotateCcw size={14} /> Sıfırla
    </button>
  );
}
export function Plane({
  x,
  y,
  heading = 0,
  color = "var(--mint)",
  label = "Uçak",
  scale = 1,
}: {
  x: number;
  y: number;
  heading?: number;
  color?: string;
  label?: string;
  scale?: number;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${heading}) scale(${scale})`}
      className="plane"
      role="img"
      aria-label={label}
    >
      <circle r="24" fill={color} opacity=".1" />
      <path
        d="M0-20 C3-20 4-16 4-7 L20 4 20 8 4 3 3 14 8 18 8 21 0 18-8 21-8 18-3 14-4 3-20 8-20 4-4-7 C-4-16-3-20 0-20Z"
        fill={color}
      />
    </g>
  );
}
export function svgPoint(e: ReactPointerEvent<SVGSVGElement>): Point {
  const svg = e.currentTarget,
    pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const matrix = svg.getScreenCTM();
  const out = matrix ? pt.matrixTransform(matrix.inverse()) : pt;
  return { x: out.x, y: out.y };
}
export function Gauge({ s, mode = "ILS" }: { s: State; mode?: "ILS" | "VOR" }) {
  const m = calculate(s),
    ils = mode === "ILS",
    valid = ils ? m.ils.locValid : m.vor.valid,
    cdi = ils ? m.ils.loc : m.vor.cdi;
  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 280 280" aria-label={`${mode} CDI göstergesi`}>
        <defs>
          <radialGradient id="dial">
            <stop stopColor="#132238" />
            <stop offset="1" stopColor="#08101b" />
          </radialGradient>
        </defs>
        <circle
          cx="140"
          cy="140"
          r="133"
          fill="#050b12"
          stroke="#2b3a4c"
          strokeWidth="2"
        />
        <circle cx="140" cy="140" r="122" fill="url(#dial)" stroke="#1f3045" />
        <g transform={`rotate(${-s.obs} 140 140)`}>
          {Array.from({ length: 72 }, (_, i) => {
            const a = i * 5 * RAD;
            return (
              <line
                key={i}
                x1={140 + Math.sin(a) * (i % 6 === 0 ? 102 : 111)}
                y1={140 - Math.cos(a) * (i % 6 === 0 ? 102 : 111)}
                x2={140 + Math.sin(a) * 117}
                y2={140 - Math.cos(a) * 117}
                stroke={i % 6 === 0 ? "#acbacb" : "#465368"}
                strokeWidth={i % 6 === 0 ? 2 : 1}
              />
            );
          })}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
            <text
              key={a}
              x={140 + Math.sin(a * RAD) * 92}
              y={144 - Math.cos(a * RAD) * 92}
              className="dial-number"
            >
              {["N", "E", "S", "W"][a / 90] ?? a / 10}
            </text>
          ))}
        </g>
        <path d="M140 19l-5 9h10Z" fill="var(--amber)" />
        <path
          d="M140 93v95m-35-35h70m-50 29h30"
          stroke="#72839b"
          strokeWidth="2"
        />
        {(ils ? [-2, -1, 1, 2] : [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]).map(
          (n) => (
            <g key={n}>
              <circle
                data-testid="deviation-dot"
                cx={140 + n * (ils ? 26.5 : 10.6)}
                cy="140"
                r={ils ? 3.5 : 2.5}
                fill="none"
                stroke="#a8b5c9"
              />
              {ils && (
                <circle
                  cx="140"
                  cy={140 + n * 26.5}
                  r="3.5"
                  fill="none"
                  stroke="#a8b5c9"
                />
              )}
            </g>
          ),
        )}
        {valid ? (
          <line
            data-testid="cdi-needle"
            x1={140 + cdi * 53}
            x2={140 + cdi * 53}
            y1="88"
            y2="192"
            stroke="var(--magenta)"
            strokeWidth="3"
          />
        ) : (
          <text x="140" y="113" className="dial-invalid">
            NAV
          </text>
        )}
        {ils &&
          (m.ils.gsValid ? (
            <line
              data-testid="gs-needle"
              x1="88"
              x2="192"
              y1={140 - m.ils.gs * 53}
              y2={140 - m.ils.gs * 53}
              stroke="var(--mint)"
              strokeWidth="3"
            />
          ) : (
            <text x="206" y="140" className="dial-invalid">
              GS
            </text>
          ))}
        <rect x="106" y="203" width="68" height="24" rx="4" fill="#17263a" />
        <text x="140" y="220" className="dial-course">
          {fmt(s.obs)}°
        </text>
        <text x="140" y="73" className="dial-mode">
          {ils ? "ILS" : m.vor.valid ? m.vor.flag : "OFF"}
        </text>
      </svg>
      <div className="gauge-caption">
        <span>
          <i className="dot magenta" /> {ils ? "LOCALIZER" : "COURSE DEVIATION"}
        </span>
        {ils && (
          <span>
            <i className="dot" /> GLIDESLOPE
          </span>
        )}
      </div>
    </div>
  );
}
export function AdfGauge({ s }: { s: State }) {
  const m = calculate(s);
  return (
    <div className="adf-wrap">
      <svg viewBox="0 0 280 240" aria-label="ADF relative bearing göstergesi">
        <circle
          cx="140"
          cy="120"
          r="106"
          fill="#09111d"
          stroke="#2c3c52"
          strokeWidth="3"
        />
        {Array.from({ length: 36 }, (_, i) => {
          const a = i * 10 * RAD;
          return (
            <line
              key={i}
              x1={140 + Math.sin(a) * 94}
              x2={140 + Math.sin(a) * 101}
              y1={120 - Math.cos(a) * 94}
              y2={120 - Math.cos(a) * 101}
              stroke="#7890a5"
            />
          );
        })}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <text
            key={a}
            className="dial-number"
            x={140 + Math.sin(a * RAD) * 81}
            y={125 - Math.cos(a * RAD) * 81}
          >
            {a}
          </text>
        ))}
        <Plane x={140} y={120} color="#596b83" scale={0.75} />
        {m.adf.valid ? (
          <g>
            <line
              data-testid="adf-needle"
              x1={140 - Math.sin(m.adf.needle * RAD) * 52}
              y1={120 + Math.cos(m.adf.needle * RAD) * 52}
              x2={140 + Math.sin(m.adf.needle * RAD) * 64}
              y2={120 - Math.cos(m.adf.needle * RAD) * 64}
              stroke="var(--amber)"
              strokeWidth="3"
            />
            <path
              transform={`translate(${140 + Math.sin(m.adf.needle * RAD) * 64} ${120 - Math.cos(m.adf.needle * RAD) * 64}) rotate(${m.adf.needle})`}
              d="M0-7l-6 12h12Z"
              fill="var(--amber)"
            />
          </g>
        ) : (
          <text x="140" y="160" className="dial-invalid">
            ADF INVALID
          </text>
        )}
        <text x="140" y="70" className="dial-mode">
          RB
        </text>
      </svg>
    </div>
  );
}
export function Frequency({ s, update }: { s: State; update: Update }) {
  return (
    <div className="frequency">
      <span>
        <Radio size={14} /> NAV 1{" "}
        <b>
          {s.frequency === 113.6
            ? "ANK VOR"
            : s.frequency === 110.3
              ? "I-LAB ILS"
              : "NO STATION"}
        </b>
      </span>
      <label>
        <select
          aria-label="NAV frekansı"
          value={s.frequency}
          onChange={(e) => update({ frequency: Number(e.target.value) })}
        >
          <option value={110.3}>110.30 — I-LAB ILS</option>
          <option value={113.6}>113.60 — ANK VOR</option>
          <option value={114}>114.00 — Boş kanal</option>
        </select>
        <small>MHz</small>
      </label>
    </div>
  );
}
export function SignalChain({
  s,
  update,
  system = "ILS",
}: {
  s: State;
  update: Update;
  system?: System;
}) {
  const [selected, select] = useState(0),
    [trace, setTrace] = useState(false);
  const state = chainStatus(s, system),
    names = chainNames[system];
  const purpose =
    system === "DME"
      ? [
          "Uçak eşleştirilmiş kanal üzerinde sorgu darbeleri gönderir.",
          "Yer tesisi sorguya yanıt üretir.",
          "Yanıt darbeleri uçağa ulaşır.",
          "İşlem gecikmesi çıkarılır; gidiş-dönüş süre mesafeye çevrilir.",
          "Eğik mesafe NM olarak gösterilir.",
        ]
      : [
          "Yer tesisi referans radyo sinyali üretir.",
          "Anten gelen elektromanyetik enerjiyi receiver girişine aktarır.",
          "Receiver seçilen kanalı alır ve demodüle eder.",
          "Sinyal farkı bearing veya sapma bilgisine dönüştürülür.",
          "Bilgi iğne, sayı ve geçerlilik bayrağı ile gösterilir.",
        ];
  return (
    <Panel
      title="Sinyalin yolunu izle"
      kicker={`${system} / SIGNAL FLOW`}
      action={
        <Toggle on={trace} click={() => setTrace(!trace)}>
          Trace Signal
        </Toggle>
      }
    >
      <>
        {system === "ILS" && (
          <div className="source-branches">
            {(["loc", "gs"] as const).map((f) => (
              <button
                key={f}
                className={
                  s.ilsOn && !s.faults.includes(f)
                    ? "source-live"
                    : "source-lost"
                }
                aria-pressed={s.faults.includes(f)}
                onClick={() =>
                  update({
                    faults: s.faults.includes(f)
                      ? s.faults.filter((x) => x !== f)
                      : [...s.faults, f],
                  })
                }
              >
                <span />
                {f.toUpperCase()} vericisi ·{" "}
                {s.ilsOn && !s.faults.includes(f)
                  ? "SIGNAL →"
                  : "SIGNAL LOST ×"}
              </button>
            ))}
          </div>
        )}
        <div className={`signal-chain ${trace ? "tracing" : ""}`}>
          {names.map((name, i) => (
            <div className="chain-item" key={name}>
              <button
                style={{ animationDelay: `${i * 0.3}s` }}
                className={`chain-node ${state[i] ? "live" : "lost"} ${selected === i ? "selected" : ""}`}
                onClick={() => select(i)}
              >
                <span>{i + 1}</span>
                {name}
                <small>{state[i] ? "SIGNAL" : "NO DATA"}</small>
              </button>
              {i < 4 && (
                <ChevronRight
                  className={state[i] ? "live" : "lost"}
                  size={18}
                />
              )}
            </div>
          ))}
        </div>
        <div className="chain-detail">
          <div>
            <b>{names[selected]}</b>
            <p>{purpose[selected]}</p>
            <small>
              Giriş:{" "}
              {selected === 0
                ? system === "DME"
                  ? "Sorgu komutu"
                  : "Referans bilgi"
                : names[selected - 1]}{" "}
              · Çıkış: {selected === 4 ? "Kokpit bilgisi" : names[selected + 1]}
            </small>
            <p className={state[selected] ? "" : "error-text"}>
              {state[selected]
                ? "Sinyal bu aşamada kullanılabilir."
                : "Bu aşama veya önceki bağlantı kesik; sonraki bileşenler geçerli veri alamaz."}
            </p>
          </div>
          <Toggle
            on={!s.disabled.includes(`${system}:${selected}`)}
            click={() =>
              update({
                disabled: s.disabled.includes(`${system}:${selected}`)
                  ? s.disabled.filter((x) => x !== `${system}:${selected}`)
                  : [...s.disabled, `${system}:${selected}`],
              })
            }
          >
            Bileşen açık
          </Toggle>
        </div>
        {system === "ILS" && (
          <p className="fine">
            LOC ve GS kaynakları ayrı arızalanabilir. Yukarıdaki ortak yolun
            açık olması her iki kaynağın geçerli olduğunu tek başına göstermez.
          </p>
        )}
      </>
    </Panel>
  );
}
export function NavMap({
  s,
  update,
  mode,
  overlays,
  stations = false,
}: {
  s: State;
  update: Update;
  mode: "VOR" | "ADF" | "ALL";
  overlays: string[];
  stations?: boolean;
}) {
  const [drag, setDrag] = useState(""),
    m = calculate(s),
    center = mode === "ADF" ? s.ndb : mode === "ALL" ? { x: 0, y: -6 } : s.vor,
    scale = mode === "ALL" ? 13 : 18;
  const map = (p: Point) => ({
    x: 400 + (p.x - center.x) * scale,
    y: 235 - (p.y - center.y) * scale,
  });
  const ac = map(s.aircraft),
    v = map(s.vor),
    n = map(s.ndb),
    r = map(s.runway),
    selected = map(project(s.vor, s.obs, 15)),
    back = map(project(s.vor, s.obs + 180, 15));
  const move = (e: ReactPointerEvent<SVGSVGElement>, target: string) => {
    const p = svgPoint(e),
      position = {
        x: clamp((p.x - 400) / scale + center.x, -40, 40),
        y: clamp(-(p.y - 235) / scale + center.y, -40, 40),
      };
    update(
      target === "vor"
        ? { vor: position }
        : target === "ndb"
          ? { ndb: position }
          : target === "runway"
            ? { runway: position }
            : { aircraft: position },
    );
  };
  return (
    <svg
      className="nav-map interactive-map"
      viewBox="0 0 800 470"
      aria-label={`${mode} sürüklenebilir harita`}
      data-testid="nav-map"
      onPointerDown={(e) => {
        const target = (e.target as Element)
          .closest("[data-station]")
          ?.getAttribute("data-station");
        const t = stations && target ? target : "aircraft";
        setDrag(t);
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e, t);
      }}
      onPointerMove={(e) => {
        if (drag) move(e, drag);
      }}
      onPointerUp={() => setDrag("")}
      onPointerCancel={() => setDrag("")}
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="#26384c" strokeWidth=".6" />
        </pattern>
        <marker
          id="bearing-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10Z" fill="context-stroke" />
        </marker>
      </defs>
      <rect width="800" height="470" fill="#101e2e" />
      <rect width="800" height="470" fill="url(#grid)" />
      <path
        d="M-50 420Q180 200 280 340T570 380T850 210M-30 450Q180 230 270 365T570 405T850 235M-50 20Q100 120 230 30T620 150T850 40"
        className="terrain-line"
      />
      {mode !== "ADF" &&
        [3, 6, 9, 12].map((d) => (
          <circle
            key={d}
            cx={v.x}
            cy={v.y}
            r={d * scale}
            fill="none"
            stroke="#36526a"
            strokeDasharray="3 7"
          />
        ))}
      {mode !== "ADF" &&
        overlays.includes("radial") &&
        Array.from({ length: 12 }, (_, i) => {
          const p = map(project(s.vor, i * 30, 11));
          return (
            <g key={i}>
              <line x1={v.x} y1={v.y} x2={p.x} y2={p.y} stroke="#36526a" />
              <text x={p.x} y={p.y} className="map-label">
                {fmt(i * 30)}°
              </text>
            </g>
          );
        })}
      {mode !== "ADF" && overlays.includes("course") && (
        <g>
          <line
            x1={back.x}
            y1={back.y}
            x2={selected.x}
            y2={selected.y}
            stroke="var(--magenta)"
            strokeWidth="2"
            strokeDasharray="9 6"
            markerEnd="url(#bearing-arrow)"
          />
          <path
            d={arc(
              v,
              64,
              s.obs + (m.vor.flag === "TO" ? 180 : 0),
              delta(m.vor.radial, s.obs + (m.vor.flag === "TO" ? 180 : 0)),
            )}
            stroke="var(--magenta)"
            strokeWidth="3"
            fill="none"
          />
          <text x={v.x - 100} y={v.y - 75} className="map-label">
            Δ {Math.abs(m.vor.deviation).toFixed(1)}°
          </text>
          <Plane
            x={selected.x}
            y={selected.y}
            heading={s.obs}
            scale={0.45}
            color="var(--magenta)"
          />
        </g>
      )}
      {mode !== "ADF" &&
        (overlays.includes("from") || overlays.includes("radial")) && (
          <g>
            <line
              x1={v.x}
              y1={v.y}
              x2={ac.x}
              y2={ac.y}
              stroke="var(--mint)"
              strokeWidth="2"
              markerEnd="url(#bearing-arrow)"
            />
            <text
              x={(ac.x + v.x) / 2 + 12}
              y={(ac.y + v.y) / 2 - 12}
              className="map-data map-halo"
            >
              R {fmt(m.vor.radial)}°
            </text>
          </g>
        )}
      {mode !== "ADF" && overlays.includes("to") && (
        <g>
          <line
            x1={ac.x}
            y1={ac.y}
            x2={v.x}
            y2={v.y}
            stroke="var(--amber)"
            strokeWidth="2"
            strokeDasharray="4 4"
            markerEnd="url(#bearing-arrow)"
          />
          <text
            x={(ac.x + v.x) / 2 + 12}
            y={(ac.y + v.y) / 2 + 16}
            className="map-label"
          >
            TO {fmt(m.vor.bearingTo)}°
          </text>
        </g>
      )}
      {mode !== "VOR" && overlays.includes("line") && (
        <line
          x1={ac.x}
          y1={ac.y}
          x2={n.x}
          y2={n.y}
          stroke="var(--amber)"
          strokeWidth="2"
          strokeDasharray="8 5"
        />
      )}
      {mode !== "VOR" && overlays.includes("nose") && (
        <line
          x1={ac.x}
          y1={ac.y}
          x2={ac.x + Math.sin(s.heading * RAD) * 110}
          y2={ac.y - Math.cos(s.heading * RAD) * 110}
          stroke="var(--mint)"
          strokeDasharray="5 5"
        />
      )}
      {mode !== "VOR" && overlays.includes("magnetic") && (
        <g>
          <line
            x1={ac.x}
            y1={ac.y}
            x2={ac.x}
            y2={ac.y - 100}
            stroke="#9facc0"
          />
          <text x={ac.x + 12} y={ac.y - 85} className="map-label">
            MB {fmt(m.adf.bearing)}°
          </text>
        </g>
      )}
      {mode !== "VOR" && overlays.includes("relative") && (
        <g>
          <path
            d={arc(ac, 52, s.heading, m.adf.relative)}
            fill="none"
            stroke="var(--amber)"
            strokeWidth="3"
            markerEnd="url(#bearing-arrow)"
          />
          <text x={ac.x + 55} y={ac.y + 25} className="map-data map-halo">
            RB {fmt(m.adf.relative)}°
          </text>
        </g>
      )}
      {mode !== "VOR" && overlays.includes("heading") && (
        <text x={ac.x + 35} y={ac.y - 25} className="map-label">
          HDG {fmt(s.heading)}°
        </text>
      )}
      {mode !== "ADF" && (
        <g data-station="vor" className="station-marker">
          <circle
            cx={v.x}
            cy={v.y}
            r="14"
            fill="#123d40"
            stroke="var(--mint)"
          />
          <path
            d={`M${v.x} ${v.y - 8}l7 12h-14Z`}
            fill="none"
            stroke="var(--mint)"
          />
          <text x={v.x + 22} y={v.y + 6} className="map-data map-halo">
            ANK · 113.60
          </text>
        </g>
      )}
      {mode !== "VOR" && (
        <g data-station="ndb" className="station-marker">
          <circle
            cx={n.x}
            cy={n.y}
            r="15"
            fill="#3c3021"
            stroke="var(--amber)"
          />
          <circle cx={n.x} cy={n.y} r="5" fill="var(--amber)" />
          <text x={n.x + 23} y={n.y + 4} className="map-data">
            NDB · 365
          </text>
        </g>
      )}
      {mode === "ALL" && (
        <g
          data-station="runway"
          transform={`translate(${r.x} ${r.y}) rotate(${s.runwayCourse})`}
        >
          <rect x="-8" y="-50" width="16" height="60" fill="#7d8ea4" />
          <path d="M0-45v45" stroke="white" strokeDasharray="6 5" />
        </g>
      )}
      <Plane x={ac.x} y={ac.y} heading={s.heading} />
      <text x="28" y="34" className="map-label">
        MAGNETIC NORTH ↑
      </text>
      <text x="28" y="445" className="map-label">
        {stations
          ? "UÇAK / İSTASYONLARI SÜRÜKLE"
          : "UÇAĞI SÜRÜKLE · SLIDER İLE HASSAS AYARLA"}
      </text>
      <path
        d={`M655 432h${5 * scale}m-${5 * scale} -5v10m${5 * scale} -10v10`}
        stroke="#8b9aac"
      />
      <text x="658" y="420" className="map-label">
        5 NM
      </text>
    </svg>
  );
}
export function Experiment({
  title,
  steps,
  checks,
}: {
  title: string;
  steps: string[];
  checks: boolean[];
}) {
  const [active, setActive] = useState(0),
    [submitted, setSubmitted] = useState<number[]>([]);
  return (
    <Panel title={title} kicker="GUIDED EXPERIMENT">
      <div className="experiment-tabs">
        {steps.map((_, i) => (
          <button
            key={i}
            className={active === i ? "active" : ""}
            onClick={() => setActive(i)}
          >
            {submitted.includes(i) && checks[i] ? (
              <Check size={14} />
            ) : (
              String(i + 1).padStart(2, "0")
            )}
          </button>
        ))}
      </div>
      <p>{steps[active]}</p>
      <button
        className="button"
        onClick={() => setSubmitted([...new Set([...submitted, active])])}
      >
        Deneyimi kontrol et <ChevronRight size={15} />
      </button>
      {submitted.includes(active) && (
        <p
          className={checks[active] ? "success-text" : "amber-text"}
          role="status"
        >
          {checks[active]
            ? "Doğru. Mevcut geometri hedefi sağlıyor."
            : "Henüz değil. Kontrolleri değiştir ve tekrar dene."}
        </p>
      )}
    </Panel>
  );
}
