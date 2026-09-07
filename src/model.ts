export const FT_NM = 6076.11549;
export const RAD = Math.PI / 180;
export const clamp = (v: number, a: number, b: number): number =>
  Math.max(a, Math.min(b, Number.isFinite(v) ? v : a));
export const norm = (v: number): number =>
  Number.isFinite(v) ? ((v % 360) + 360) % 360 : 0;
export const delta = (a: number, b: number): number => norm(a - b + 180) - 180;
export const fmt = (v: number): string =>
  String(Math.round(norm(v)) % 360).padStart(3, "0");
export interface Point {
  x: number;
  y: number;
}
export const bearing = (from: Point, to: Point): number =>
  norm(Math.atan2(to.x - from.x, to.y - from.y) / RAD);
export const distance = (a: Point, b: Point): number =>
  Math.hypot(a.x - b.x, a.y - b.y);
export const project = (p: Point, angle: number, d: number): Point => ({
  x: p.x + Math.sin(angle * RAD) * d,
  y: p.y + Math.cos(angle * RAD) * d,
});
export type System = "VOR" | "ILS" | "ADF" | "DME";
export type Fault =
  | "loc"
  | "gs"
  | "receiver"
  | "antenna"
  | "unreliable"
  | "unstable"
  | "course"
  | "adfWeak"
  | "adfNoise"
  | "adfFreeze"
  | "adfReceiver"
  | "dme";
export interface State {
  aircraft: Point;
  vor: Point;
  ndb: Point;
  runway: Point;
  runwayCourse: number;
  heading: number;
  altitude: number;
  obs: number;
  frequency: number;
  adfFrequency: number;
  vorOn: boolean;
  ndbOn: boolean;
  ilsOn: boolean;
  strength: number;
  faults: Fault[];
  disabled: string[];
  frozenAdf: number;
  windSpeed: number;
  windDirection: number;
  speed: number;
  verticalSpeed: number;
  running: boolean;
  flightMode: "free" | "approach";
  rate: number;
  time: number;
  elapsed: number;
  approachStatus: string;
}
export const initial = (): State => ({
  aircraft: { x: -0.22, y: -7.2 },
  vor: { x: -6, y: -12 },
  ndb: { x: 5, y: -9 },
  runway: { x: 0, y: 0 },
  runwayCourse: 0,
  heading: 0,
  altitude: 2550,
  obs: 0,
  frequency: 110.3,
  adfFrequency: 365,
  vorOn: true,
  ndbOn: true,
  ilsOn: true,
  strength: 100,
  faults: [],
  disabled: [],
  frozenAdf: 0,
  windSpeed: 0,
  windDirection: 270,
  speed: 140,
  verticalSpeed: -740,
  running: false,
  flightMode: "approach",
  rate: 6,
  time: 0,
  elapsed: 0,
  approachStatus: "MANUAL / HAZIR",
});
export const approachPosition = (s: State, d: number, lateral: number): Point =>
  project(
    project(s.runway, s.runwayCourse + 180, d),
    s.runwayCourse + 90,
    lateral,
  );
export function ilsGeometry(s: State) {
  const dx = s.aircraft.x - s.runway.x,
    dy = s.aircraft.y - s.runway.y,
    c = s.runwayCourse * RAD;
  const d = -(dx * Math.sin(c) + dy * Math.cos(c)),
    lateral = dx * Math.cos(c) - dy * Math.sin(c);
  const locAngle = Math.atan2(lateral, Math.max(0.01, d + 1.5)) / RAD;
  const glideAngle =
    Math.atan2(s.altitude / FT_NM, Math.max(0.001, d + 0.157)) / RAD;
  return {
    d,
    lateral,
    locAngle,
    glideAngle,
    gsAngle: glideAngle - 3,
    targetAltitude: Math.max(0, (d + 0.157) * FT_NM * Math.tan(3 * RAD)),
  };
}
export function vorGeometry(aircraft: Point, station: Point, obs: number) {
  const range = distance(aircraft, station),
    radial = bearing(station, aircraft),
    diff = delta(radial, obs);
  const deviation = -Math.asin(Math.sin(diff * RAD)) / RAD;
  const cone = range < 0.05,
    ambiguous = Math.abs(Math.cos(diff * RAD)) < 0.01745;
  return {
    range,
    radial,
    bearingTo: norm(radial + 180),
    deviation,
    cdi: clamp(deviation / 10, -1, 1),
    flag: cone || ambiguous ? "OFF" : Math.cos(diff * RAD) < 0 ? "TO" : "FROM",
    cone,
    ambiguous,
  };
}
export function dmeRange(
  ground: number,
  altitudeFt: number,
  stationFt = 0,
): number {
  return Math.hypot(Math.max(0, ground), (altitudeFt - stationFt) / FT_NM);
}
export function vhf(
  altitudeFt: number,
  stationFt: number,
  range: number,
  terrainFt: number,
) {
  const horizon =
    1.23 *
    (Math.sqrt(Math.max(0, altitudeFt)) + Math.sqrt(Math.max(0, stationFt)));
  // 4/3 effective Earth radius, midpoint bulge; 1 NM = 1852 m.
  const bulgeFt =
    (Math.max(0, range) * 1852) ** 2 / (8 * (4 / 3) * 6371000) / 0.3048;
  const clearance = (altitudeFt + stationFt) / 2 - bulgeFt - terrainFt;
  const quality =
    clearance < 0 || range > horizon
      ? "BLOCKED"
      : range > 0.8 * horizon || clearance < 100
        ? "WEAK"
        : "GOOD";
  return { horizon, clearance, bulgeFt, quality };
}
export function hf(frequency: number, condition: number, range: number) {
  const critical = 3 + condition * 0.1,
    muf = critical * 3,
    skip = 300 + frequency * 35;
  const ground = range < Math.max(30, 250 - frequency * 7),
    sky =
      frequency <= muf &&
      frequency >= critical * 0.55 &&
      range >= skip &&
      range <= 4000;
  return {
    critical,
    muf,
    skip,
    ground,
    sky,
    quality: ground || sky ? "BAĞLANTI" : "ZAYIF / SKIP ZONE",
  };
}
export const chainNames: Record<System, string[]> = {
  VOR: [
    "VOR istasyonu",
    "NAV anteni",
    "NAV receiver",
    "İşleme",
    "CDI / TO-FROM",
  ],
  ILS: ["LOC + GS", "NAV anteni", "ILS receiver", "İşleme", "LOC / GS"],
  ADF: [
    "NDB",
    "ADF anteni",
    "ADF receiver",
    "Bearing işleme",
    "ADF göstergesi",
  ],
  DME: [
    "Interrogator",
    "Transponder",
    "Reply signal",
    "Zaman ölçümü",
    "DME ekranı",
  ],
};
export function chainStatus(s: State, system: System): boolean[] {
  const f = (x: Fault) => s.faults.includes(x);
  const tuned =
    system === "ADF"
      ? s.adfFrequency === 365
      : system === "VOR"
        ? s.frequency === 113.6
        : system === "ILS"
          ? s.frequency === 110.3
          : [113.6, 110.3].includes(s.frequency);
  const on =
    system === "VOR"
      ? s.vorOn
      : system === "ADF"
        ? s.ndbOn
        : system === "ILS"
          ? s.ilsOn
          : s.frequency === 113.6
            ? s.vorOn
            : s.ilsOn;
  let ok = true;
  return chainNames[system].map((_, i) => {
    let fault = s.disabled.includes(`${system}:${i}`);
    if (i === 0)
      fault ||=
        (system !== "DME" && !on) ||
        s.strength < 15 ||
        (system === "ILS" && f("loc") && f("gs"));
    if (i === 1 && system === "DME") fault ||= !on || f("dme");
    if (i === 1 && system !== "DME") fault ||= f("antenna");
    if (i === 2)
      fault ||=
        !tuned ||
        (system === "ADF"
          ? f("adfReceiver")
          : system === "DME"
            ? false
            : f("receiver"));
    ok = ok && !fault;
    return ok;
  });
}
export function calculate(s: State) {
  const f = (x: Fault) => s.faults.includes(x),
    v = vorGeometry(s.aircraft, s.vor, s.obs),
    ils = ilsGeometry(s);
  const vValid = chainStatus(s, "VOR")[4] && !v.cone && v.range < 80;
  const aBearing = bearing(s.aircraft, s.ndb),
    relative = norm(aBearing - s.heading);
  const aValid = chainStatus(s, "ADF")[4] && distance(s.aircraft, s.ndb) > 0.02;
  const perturb =
    (f("adfNoise") ? 12 * Math.sin(s.time * 8) : 0) +
    (f("adfWeak") ? 5 * Math.sin(s.time * 3) : 0);
  const adfNeedle = f("adfFreeze") ? s.frozenAdf : norm(relative + perturb);
  const common = chainStatus(s, "ILS")[4] && ils.d > 0;
  const locValid =
    common &&
    !f("loc") &&
    ((Math.abs(ils.locAngle) <= 10 && ils.d <= 18) ||
      (Math.abs(ils.locAngle) <= 35 && ils.d <= 10));
  const gsValid =
    common &&
    !f("gs") &&
    ils.d <= 10 &&
    Math.abs(ils.locAngle) <= 8 &&
    ils.glideAngle >= 0.5 &&
    ils.glideAngle <= 6;
  const noise = f("unstable") ? 0.55 * Math.sin(s.time * 7) : 0;
  const bias = f("course") ? 0.8 : 0;
  const loc = clamp(-(ils.locAngle + bias) / 2.5 + noise, -1, 1),
    gs = clamp(-ils.gsAngle / 0.7 - noise, -1, 1);
  const dmeStation = s.frequency === 113.6 ? s.vor : s.runway,
    ground = distance(s.aircraft, dmeStation),
    dme = dmeRange(ground, s.altitude);
  const reliable =
    !f("unreliable") && !f("unstable") && !f("course") && s.strength >= 35;
  return {
    vor: { ...v, valid: vValid },
    adf: {
      bearing: aBearing,
      relative,
      needle: adfNeedle,
      valid: aValid,
      disturbed: f("adfWeak") || f("adfNoise") || f("adfFreeze"),
    },
    ils: {
      ...ils,
      loc,
      gs,
      locValid,
      gsValid,
      reliable,
      locStatus: !locValid
        ? "LOC INVALID"
        : Math.abs(loc) < 0.1
          ? "LOC CENTERED"
          : "LOC NOT CAPTURED",
      gsStatus: !gsValid
        ? "GS INVALID"
        : Math.abs(gs) < 0.1
          ? "ON GLIDESLOPE"
          : gs < 0
            ? "GS ABOVE"
            : "GS BELOW",
    },
    dme: {
      ground,
      range: dme,
      valid: chainStatus(s, "DME")[4],
      error: dme - ground,
    },
  };
}
export function tick(s: State, dt: number): State {
  const next = { ...s, time: s.time + dt };
  if (!s.running) return next;
  const t = clamp(dt, 0, 0.25) * s.rate,
    still = project(s.aircraft, s.heading, (s.speed * t) / 3600);
  next.aircraft = project(
    still,
    s.windDirection + 180,
    (s.windSpeed * t) / 3600,
  );
  next.altitude = clamp(s.altitude + (s.verticalSpeed * t) / 60, 0, 40000);
  next.elapsed += t;
  const g = ilsGeometry(next);
  if (
    (s.flightMode === "approach" && g.d <= 0.1) ||
    next.altitude <= 0 ||
    Math.abs(next.aircraft.x) > 45 ||
    Math.abs(next.aircraft.y) > 45
  ) {
    next.running = false;
    next.approachStatus =
      s.flightMode === "approach" && g.d <= 0.1
        ? "EŞİKTE DURDURULDU"
        : next.altitude <= 0
          ? "YER SEVİYESİ — DURDURULDU"
          : "HARİTA SINIRI";
  } else next.approachStatus = "MANUAL / UÇUŞ";
  return next;
}
export const faultInfo: Record<
  Fault,
  { label: string; description: string; remaining: string }
> = {
  loc: {
    label: "LOCALIZER SIGNAL LOST",
    description:
      "Localizer vericisi kayıp: yatay rehberlik ve LOC iğnesi geçersiz.",
    remaining:
      "GS, ADF ve DME bağımsız olarak çalışabilir. Tek başına GS tam ILS rehberliği sağlamaz.",
  },
  gs: {
    label: "GLIDESLOPE SIGNAL LOST",
    description:
      "GS vericisi kayıp: dikey iğne kaldırılır, GS bayrağı görünür.",
    remaining:
      "LOC yatay rehberliği sürer. Bu gösterim yaklaşma prosedürü yetkisi vermez.",
  },
  receiver: {
    label: "RECEIVER FAILURE",
    description: "Ortak NAV receiver VOR/ILS verisini işleyemez.",
    remaining: "Ayrı ADF ve DME alıcıları çalışır.",
  },
  antenna: {
    label: "ANTENNA FAILURE",
    description: "Bu deneyde NAV/ADF anten girişleri kesilir.",
    remaining: "Bağımsız DME anteni ve interrogator çalışır.",
  },
  unreliable: {
    label: "SIGNAL UNRELIABLE",
    description:
      "Geometrik iğneler görünür, ancak veri güvenilirlik uyarısı taşır.",
    remaining: "Ham veri vardır; güvenilir konum rehberliği kabul edilmez.",
  },
  unstable: {
    label: "FALSE / UNSTABLE INDICATION",
    description:
      "Kontrollü periyodik girişim LOC/GS iğnelerini sallar. Yalnızca arıza gösterimi.",
    remaining:
      "Geometrik referans çizgileri doğru kalır; iğne ile karşılaştır.",
  },
  course: {
    label: "COURSE SIGNAL ERROR",
    description:
      "Localizer ölçümüne +0.8° sabit ölçüm hatası eklenir; merkezde bile iğne sapar.",
    remaining: "GS ve gerçek merkez hattı değişmez.",
  },
  adfWeak: {
    label: "WEAK ADF SIGNAL",
    description: "Zayıf alımda ±5° periyodik bearing hatası gösterilir.",
    remaining: "Geometrik bearing değeri referans olarak korunur.",
  },
  adfNoise: {
    label: "ELECTRICAL INTERFERENCE",
    description: "ADF iğnesine ±12° periyodik parazit eklenir.",
    remaining: "İstasyon çalışır; gösterge doğruluğu azalır.",
  },
  adfFreeze: {
    label: "NEEDLE FROZEN",
    description: "ADF iğnesi arızanın açıldığı konumda donar.",
    remaining:
      "Gerçek bearing değişebilir; sabit iğne güvenilirlik kanıtı değildir.",
  },
  adfReceiver: {
    label: "ADF RECEIVER FAILURE",
    description: "ADF alıcısı bearing üretmez; iğne gizlenir.",
    remaining: "NAV ve DME bağımsız çalışır.",
  },
  dme: {
    label: "DME REPLY LOST",
    description: "Transponder yanıtı alınamaz; mesafe ekranı çizgilere döner.",
    remaining: "VOR/ILS açı bilgisi devam eder.",
  },
};
