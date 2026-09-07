import test from "node:test";
import assert from "node:assert/strict";
import {
  approachPosition,
  bearing,
  calculate,
  chainStatus,
  clamp,
  delta,
  dmeRange,
  fmt,
  FT_NM,
  hf,
  initial,
  ilsGeometry,
  norm,
  project,
  tick,
  vhf,
  vorGeometry,
  type Fault,
  type State,
  type System,
} from "../src/model.ts";
import { cases, grade, questions, topics } from "../src/content.ts";
const close = (a: number, b: number, tolerance = 1e-8) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
const vorState = (): State => ({
  ...initial(),
  frequency: 113.6,
  vor: { x: 0, y: 0 },
  aircraft: { x: 10, y: 0 },
  obs: 90,
});
for (const [a, expected] of [
  [0, 0],
  [360, 0],
  [-1, 359],
  [721, 1],
  [-720, 0],
  [359.9, 359.9],
])
  test(`normalize ${a}`, () => close(norm(a), expected));
test("north wrap is continuous and display never reads 360", () => {
  close(delta(1, 359), 2);
  close(delta(359, 1), -2);
  assert.equal(fmt(359.9), "000");
});
test("finite UI guards", () => {
  assert.equal(norm(NaN), 0);
  assert.equal(norm(Infinity), 0);
  assert.equal(clamp(NaN, 0, 10), 0);
  assert.equal(clamp(Infinity, -1, 1), -1);
});
for (const [x, y, a] of [
  [0, 10, 0],
  [10, 0, 90],
  [0, -10, 180],
  [-10, 0, 270],
])
  test(`cardinal bearing ${a}`, () =>
    close(bearing({ x: 0, y: 0 }, { x, y }), a));
test("090 radial outbound 090 is centered FROM", () => {
  const m = calculate(vorState()).vor;
  assert.equal(m.flag, "FROM");
  close(m.cdi, 0);
  assert.equal(m.valid, true);
});
test("090 radial inbound 270 is centered TO", () => {
  const m = calculate({ ...vorState(), obs: 270 }).vor;
  assert.equal(m.flag, "TO");
  close(m.cdi, 0);
});
test("120 radial inbound 300 is TO", () => {
  const v = vorGeometry(project({ x: 0, y: 0 }, 120, 10), { x: 0, y: 0 }, 300);
  assert.equal(v.flag, "TO");
  close(v.deviation, 0);
});
test("outbound aircraft east of north course has left needle", () => {
  const v = vorGeometry(project({ x: 0, y: 0 }, 5, 10), { x: 0, y: 0 }, 0);
  close(v.deviation, -5);
  close(v.cdi, -0.5);
});
test("inbound reciprocal gives opposite sensing", () => {
  const v = vorGeometry(project({ x: 0, y: 0 }, 5, 10), { x: 0, y: 0 }, 180);
  close(v.deviation, 5);
  close(v.cdi, 0.5);
});
test("VOR CDI does not depend on heading", () => {
  const a = calculate(vorState()).vor,
    b = calculate({ ...vorState(), heading: 221 }).vor;
  assert.deepEqual(a, b);
});
test("VOR cone and perpendicular ambiguity are flagged", () => {
  const s = vorState();
  assert.equal(calculate({ ...s, aircraft: { x: 0, y: 0 } }).vor.valid, false);
  assert.equal(vorGeometry({ x: 10, y: 0 }, { x: 0, y: 0 }, 0).flag, "OFF");
});
test("VOR full-scale saturation", () => {
  close(
    vorGeometry(project({ x: 0, y: 0 }, 30, 10), { x: 0, y: 0 }, 0).cdi,
    -1,
  );
});
test("all radials preserve bearing and reciprocal TO/FROM", () => {
  for (let radial = 0; radial < 360; radial += 0.5) {
    const p = project({ x: -3, y: 7 }, radial, 5),
      v = vorGeometry(p, { x: -3, y: 7 }, radial);
    close(delta(v.radial, radial), 0);
    assert.equal(v.flag, "FROM");
    close(v.deviation, 0);
    assert.equal(vorGeometry(p, { x: -3, y: 7 }, radial + 180).flag, "TO");
  }
});
test("CDI around north has no discontinuity", () => {
  const center = { x: 0, y: 0 };
  const a = vorGeometry(project(center, 359.999, 5), center, 0),
    b = vorGeometry(project(center, 0.001, 5), center, 0);
  assert.ok(Math.abs(a.deviation - b.deviation) < 0.003);
});
test("VOR tuning and station state gate validity", () => {
  assert.equal(calculate({ ...vorState(), frequency: 114 }).vor.valid, false);
  assert.equal(calculate({ ...vorState(), vorOn: false }).vor.valid, false);
});
test("ADF uses magnetic heading + relative bearing", () => {
  const s = {
    ...initial(),
    aircraft: { x: 0, y: 0 },
    ndb: project({ x: 0, y: 0 }, 135, 10),
    heading: 90,
  };
  const a = calculate(s).adf;
  close(a.bearing, 135);
  close(a.relative, 45);
});
test("ADF at same position changes relative bearing opposite heading", () => {
  const s = {
    ...initial(),
    aircraft: { x: 0, y: 0 },
    ndb: { x: 10, y: 0 },
    heading: 0,
  };
  const a = calculate(s).adf,
    b = calculate({ ...s, heading: 90 }).adf;
  close(a.bearing, b.bearing);
  close(delta(b.relative, a.relative), -90);
});
test("ADF sum normalizes at north", () => {
  const a = calculate({
    ...initial(),
    aircraft: { x: 0, y: 0 },
    ndb: project({ x: 0, y: 0 }, 40, 10),
    heading: 300,
  }).adf;
  close(a.relative, 100);
  close(norm(300 + a.relative), 40);
});
test("ADF freeze holds captured instrument value", () => {
  const s = { ...initial(), faults: ["adfFreeze"] as Fault[], frozenAdf: 47 };
  close(calculate(s).adf.needle, 47);
  close(calculate({ ...s, heading: 214 }).adf.needle, 47);
});
test("healthy ADF never has arbitrary temporal motion", () => {
  const s = initial();
  close(calculate(s).adf.needle, calculate({ ...s, time: 523 }).adf.needle);
});
test("ADF disturbances are deterministic and bounded", () => {
  const s = {
    ...initial(),
    faults: ["adfNoise", "adfWeak"] as Fault[],
    time: 0.7,
  };
  const a = calculate(s).adf;
  assert.ok(Math.abs(delta(a.needle, a.relative)) <= 17);
  assert.notEqual(a.needle, a.relative);
});
test("ADF signal loss and mistuning clear validity", () => {
  for (const p of [
    { ndbOn: false },
    { adfFrequency: 400 },
    { faults: ["adfReceiver"] as Fault[] },
  ])
    assert.equal(calculate({ ...initial(), ...p }).adf.valid, false);
});
test("DME directly overhead at 10000 ft reads vertical distance", () =>
  close(dmeRange(0, 10000), 1.645788336, 1e-8));
test("DME 3-4-5 triangle and station elevation", () => {
  close(dmeRange(3, 4 * FT_NM), 5);
  close(dmeRange(3, 10000, 10000), 3);
  close(dmeRange(0, 0, FT_NM), 1);
});
test("DME error decreases with ground distance", () => {
  const errors = [0, 1, 10, 100].map((x) => dmeRange(x, 10000) - x);
  assert.ok(errors.every((e, i) => i === 0 || e < errors[i - 1]));
});
test("DME pairing follows selected NAV station", () => {
  const s = initial(),
    a = calculate(s).dme,
    b = calculate({ ...s, frequency: 113.6 }).dme;
  assert.notEqual(a.ground, b.ground);
  assert.equal(calculate({ ...s, frequency: 114 }).dme.valid, false);
});
test("DME no reply leaves NAV bearing available", () => {
  const m = calculate({ ...vorState(), faults: ["dme"] });
  assert.equal(m.dme.valid, false);
  assert.equal(m.vor.valid, true);
  assert.deepEqual(chainStatus({ ...vorState(), faults: ["dme"] }, "DME"), [
    true,
    false,
    false,
    false,
    false,
  ]);
});
test("ILS left aircraft deflects needle right", () => {
  const s = initial(),
    m = calculate(s).ils;
  assert.ok(m.lateral < 0 && m.loc > 0 && m.locValid);
});
test("ILS right aircraft deflects needle left", () => {
  const s = { ...initial(), aircraft: { x: 0.2, y: -7 } };
  assert.ok(calculate(s).ils.loc < 0);
});
test("LOC zero exactly on centerline, independent OBS and heading", () => {
  const s = { ...initial(), aircraft: { x: 0, y: -7 } };
  close(calculate(s).ils.loc, 0);
  close(calculate({ ...s, obs: 170, heading: 210 }).ils.loc, 0);
});
test("GS above path needle down and below path needle up", () => {
  const s = initial(),
    g = ilsGeometry(s);
  const high = calculate({ ...s, altitude: g.targetAltitude + 100 }).ils,
    low = calculate({ ...s, altitude: g.targetAltitude - 100 }).ils;
  assert.ok(high.gs < 0 && low.gs > 0);
});
test("3 degree path centers GS across approach distances", () => {
  for (const d of [0.2, 1, 5, 8, 10]) {
    const s = initial();
    s.aircraft = approachPosition(s, d, 0);
    s.altitude = ilsGeometry(s).targetAltitude;
    close(calculate(s).ils.gs, 0);
    assert.equal(calculate(s).ils.gsValid, true);
  }
});
test("ILS rotation and translation preserve local geometry", () => {
  const a = initial(),
    b = { ...initial(), runway: { x: 9, y: -3 }, runwayCourse: 128 };
  b.aircraft = approachPosition(b, 7.2, -0.22);
  const x = ilsGeometry(a),
    y = ilsGeometry(b);
  close(x.d, y.d);
  close(x.lateral, y.lateral);
  close(x.locAngle, y.locAngle);
  close(x.glideAngle, y.glideAngle);
});
test("ILS transmitter locations are explicit and threshold height near 50 ft", () => {
  const s = initial();
  s.aircraft = approachPosition(s, 0, 0);
  close(ilsGeometry(s).targetAltitude, 50, 1);
});
test("LOC and GS source failures are independent", () => {
  const a = calculate({ ...initial(), faults: ["loc"] }).ils,
    b = calculate({ ...initial(), faults: ["gs"] }).ils;
  assert.equal(a.locValid, false);
  assert.equal(a.gsValid, true);
  assert.equal(b.locValid, true);
  assert.equal(b.gsValid, false);
});
test("common NAV receiver loss preserves independent ADF and DME", () => {
  const m = calculate({ ...initial(), faults: ["receiver"] });
  assert.equal(m.ils.locValid, false);
  assert.equal(m.ils.gsValid, false);
  assert.equal(m.adf.valid, true);
  assert.equal(m.dme.valid, true);
});
test("ILS lost station and wrong channel flag both axes", () => {
  for (const p of [{ ilsOn: false }, { frequency: 114 }]) {
    const m = calculate({ ...initial(), ...p }).ils;
    assert.equal(m.locValid, false);
    assert.equal(m.gsValid, false);
  }
});
test("back course and beyond GS coverage are invalid", () => {
  assert.equal(
    calculate({ ...initial(), aircraft: { x: 0, y: 1 } }).ils.locValid,
    false,
  );
  assert.equal(
    calculate({ ...initial(), aircraft: { x: 0, y: -12 } }).ils.gsValid,
    false,
  );
});
test("healthy ILS is time independent", () => {
  assert.deepEqual(
    calculate(initial()).ils,
    calculate({ ...initial(), time: 999 }).ils,
  );
});
test("unstable, unreliable and course bias have distinct effects", () => {
  const s = initial(),
    base = calculate(s).ils;
  const unstable = calculate({ ...s, faults: ["unstable"], time: 0.3 }).ils,
    unreliable = calculate({ ...s, faults: ["unreliable"] }).ils,
    bias = calculate({ ...s, faults: ["course"] }).ils;
  assert.notEqual(unstable.loc, base.loc);
  close(unreliable.loc, base.loc);
  assert.equal(unreliable.reliable, false);
  assert.notEqual(bias.loc, base.loc);
  close(bias.gs, base.gs);
});
test("weak common signal invalidates or warns at separate thresholds", () => {
  assert.equal(calculate({ ...initial(), strength: 10 }).ils.locValid, false);
  assert.equal(calculate({ ...initial(), strength: 25 }).ils.reliable, false);
});
test("every disabled component propagates only downstream", () => {
  for (const system of ["VOR", "ILS", "ADF", "DME"] as System[])
    for (let i = 0; i < 5; i++) {
      const s = {
        ...initial(),
        frequency: system === "VOR" ? 113.6 : 110.3,
        disabled: [`${system}:${i}`],
      };
      const status = chainStatus(s, system);
      assert.deepEqual(
        status,
        Array.from({ length: 5 }, (_, j) => j < i),
      );
    }
});
test("VHF horizon grows with aircraft and station height", () => {
  const a = vhf(1000, 100, 10, 0),
    b = vhf(10000, 100, 10, 0),
    c = vhf(1000, 1000, 10, 0);
  assert.ok(b.horizon > a.horizon && c.horizon > a.horizon);
});
test("VHF range and terrain block without breaking arithmetic", () => {
  assert.equal(vhf(8000, 100, 50, 0).quality, "GOOD");
  assert.equal(vhf(8000, 100, 300, 0).quality, "BLOCKED");
  assert.equal(vhf(8000, 100, 50, 10000).quality, "BLOCKED");
});
test("HF skywave, penetrating high frequency and skip zone", () => {
  assert.equal(hf(12, 60, 1800).sky, true);
  assert.equal(hf(30, 0, 1800).sky, false);
  assert.equal(hf(12, 60, 300).sky, false);
  assert.equal(hf(3, 50, 50).ground, true);
});
test("paused aircraft is stationary", () => {
  const s = initial(),
    n = tick(s, 0.1);
  assert.deepEqual(n.aircraft, s.aircraft);
  close(n.altitude, s.altitude);
});
test("manual flight responds to heading and vertical speed", () => {
  const s = {
    ...initial(),
    running: true,
    rate: 1,
    heading: 90,
    verticalSpeed: 600,
  };
  const n = tick(s, 0.1);
  assert.ok(n.aircraft.x > s.aircraft.x);
  close(n.aircraft.y, s.aircraft.y);
  close(n.altitude, s.altitude + 1);
});
test("wind FROM west moves aircraft east", () => {
  const s = {
    ...initial(),
    running: true,
    rate: 1,
    speed: 0,
    windDirection: 270,
    windSpeed: 36,
  };
  const n = tick(s, 0.1);
  close(n.aircraft.x - s.aircraft.x, 0.001);
});
test("approach crossing threshold stops without auto landing", () => {
  const s = {
    ...initial(),
    running: true,
    aircraft: { x: 0, y: -0.1001 },
    rate: 12,
  };
  const n = tick(s, 0.1);
  assert.equal(n.running, false);
  assert.equal(n.approachStatus, "EŞİKTE DURDURULDU");
});
test("model remains finite through long controlled flight", () => {
  let s = { ...initial(), running: true, altitude: 2500 };
  for (let i = 0; i < 2000; i++) {
    s = tick(s, 0.1);
    const m = calculate(s);
    for (const v of [
      s.altitude,
      s.aircraft.x,
      s.aircraft.y,
      m.vor.cdi,
      m.adf.needle,
      m.ils.loc,
      m.ils.gs,
      m.dme.range,
    ])
      assert.ok(Number.isFinite(v));
  }
});
test("initial reset isolates arrays and restores stations/faults", () => {
  const a = initial();
  a.faults.push("loc");
  a.disabled.push("VOR:1");
  assert.deepEqual(initial().faults, []);
  assert.deepEqual(initial().disabled, []);
  assert.equal(initial().ilsOn, true);
});
test("36 unique questions span eight topics and all correct answers grade", () => {
  assert.equal(questions.length, 36);
  assert.equal(new Set(questions.map((q) => q.prompt)).size, 36);
  assert.equal(new Set(questions.map((q) => q.topic)).size, 8);
  for (const q of questions) {
    assert.ok(grade(q, q.answer));
    assert.ok(q.explanation.length > 20);
    if (q.options) assert.ok(q.options.includes(q.answer));
  }
});
test("numeric grading rejects empty/nonfinite and accepts decimal comma", () => {
  const q = questions[13];
  assert.equal(grade(q, ""), false);
  assert.equal(grade(q, "abc"), false);
  assert.equal(grade(q, "Infinity"), false);
  assert.equal(grade(q, "1,65"), true);
});
test("all seven diagnosis cases have evidence and fault trees", () => {
  assert.equal(cases.length, 7);
  for (const c of cases) {
    assert.equal(Object.keys(c.checks).length, 4);
    assert.ok(c.options.includes(c.diagnosis));
    assert.ok(c.tree.length >= 3);
  }
});
test("eleven distinct functional sections", () => {
  assert.equal(topics.length, 11);
  assert.equal(new Set(topics.map((t) => t[0])).size, 11);
});

test("free flight can cross runway plane without approach termination", () => {
  const s: State = {
    ...initial(),
    flightMode: "free",
    running: true,
    aircraft: { x: 5, y: 1 },
  };
  assert.equal(tick(s, 0.1).running, true);
});
