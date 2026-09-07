import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Antenna,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  FlaskConical,
  GraduationCap,
  HelpCircle,
  Menu,
  Navigation,
  Radio,
  Radar,
  Route,
  Satellite,
  Search,
  Waves,
  X,
} from "lucide-react";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import { initial, tick, type State } from "./model";
import { topics, type Tab } from "./content";
import { Panel, Reset } from "./components";
import { AdfLab, DmeLab, IlsLab, VorLab } from "./labs";
import { Antennas, Fundamentals, Propagation } from "./learning";
import {
  Mission,
  newMission,
  Quiz,
  Sandbox,
  Troubleshooting,
} from "./activities";
import "./styles.css";
const icons = [
  Radio,
  Compass,
  Navigation,
  Radar,
  Satellite,
  Waves,
  Antenna,
  Route,
  Search,
  GraduationCap,
  FlaskConical,
];
const meta: Record<
  Tab,
  { title: string; accent: string; description: string }
> = {
  fundamentals: {
    title: "Sinyali anla.",
    accent: "Göstergeyi çöz.",
    description:
      "Radyo dalgasından kokpit bilgisine. Sinyal zincirini adım adım keşfet.",
  },
  vor: {
    title: "Radial’i gör.",
    accent: "Course’u yakala.",
    description:
      "Uçağı taşı, OBS’yi çevir. Bearing, radial ve CDI arasındaki ilişkiyi keşfet.",
  },
  adf: {
    title: "Burnun nerede?",
    accent: "İstasyon nerede?",
    description:
      "Heading ile relative bearing arasındaki farkı, tek bir dönüşle gör.",
  },
  ils: {
    title: "Yaklaşmayı gör.",
    accent: "Sinyali anla.",
    description:
      "Localizer ve glideslope’u keşfet. Uçağı hareket ettir, iğnelerin neden değiştiğini gör.",
  },
  dme: {
    title: "İki nokta.",
    accent: "Gerçek bir uzaklık.",
    description:
      "İrtifa arttıkça DME neden farklı okur? Eğik mesafeyi geometriyle keşfet.",
  },
  propagation: {
    title: "Sinyalin sınırı",
    accent: "ufuk mu?",
    description:
      "VHF görüş hattını ve HF iyonosferik yayılımını aynı uçuş bağlamında karşılaştır.",
  },
  antennas: {
    title: "Bağlantının",
    accent: "başladığı yer.",
    description:
      "Uçaktaki temsili antenleri keşfet; konum, gölge ve polarizasyonu deneyimle.",
  },
  mission: {
    title: "Enroute’dan",
    accent: "son yaklaşmaya.",
    description: "VOR, DME ve ILS bilgini tek bir uçuş görevinde birleştir.",
  },
  troubleshooting: {
    title: "Belirtiyi izle.",
    accent: "Arızayı bul.",
    description:
      "Yedi teknik vaka. Sinyal yolunu incele, kanıt topla ve teşhisini doğrula.",
  },
  quiz: {
    title: "Ezberleme.",
    accent: "Tahmin et, açıkla.",
    description:
      "Geometri, hesaplama ve teşhis sorularıyla kavramsal bilgini sına.",
  },
  sandbox: {
    title: "Merak ettiğin",
    accent: "her şeyi değiştir.",
    description:
      "Ortak bir uçak durumuyla NAV, ADF, DME ve ILS sistemlerini birlikte dene.",
  },
};
function getTab(): Tab {
  const hash = location.hash.slice(1);
  return topics.some((t) => t[0] === hash) ? (hash as Tab) : "ils";
}
function App() {
  const [tab, setTab] = useState<Tab>(getTab),
    [s, setState] = useState<State>(initial),
    [mobile, setMobile] = useState(false),
    [help, setHelp] = useState(false),
    [revision, setRevision] = useState(0),
    [mission, setMission] = useState(newMission);
  const update = (patch: Partial<State>) =>
    setState((old) => ({ ...old, ...patch }));
  const navigate = (next: Tab) => {
    setTab(next);
    history.replaceState(null, "", `#${next}`);
    setMobile(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    setState((old) => ({
      ...old,
      running: false,
      ...(next === "vor"
        ? { frequency: 113.6 }
        : next === "ils"
          ? { frequency: 110.3 }
          : {}),
    }));
  };
  useEffect(() => {
    const change = () => {
      setTab(getTab());
      setState((old) => ({ ...old, running: false }));
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  const animating =
    s.running ||
    s.faults.some((f) => ["unstable", "adfNoise", "adfWeak"].includes(f));
  useEffect(() => {
    if (!animating) return;
    const interval = window.setInterval(
      () => setState((old) => tick(old, 0.1)),
      100,
    );
    return () => clearInterval(interval);
  }, [animating]);
  useEffect(() => {
    const visibility = () => {
      if (document.hidden)
        setState((old) => ({
          ...old,
          running: false,
          approachStatus: "PAUSED / SEKME GİZLİ",
        }));
    };
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  const reset = () => {
    setState({
      ...initial(),
      ...(tab === "vor"
        ? { frequency: 113.6, aircraft: { x: 2, y: -12 }, obs: 270 }
        : {}),
      ...(tab === "dme"
        ? { frequency: 113.6, aircraft: { x: -6, y: -12 }, altitude: 10000 }
        : {}),
    });
    setRevision((v) => v + 1);
    setMission(newMission());
  };
  const content =
    tab === "ils" ? (
      <IlsLab s={s} update={update} />
    ) : tab === "vor" ? (
      <VorLab s={s} update={update} />
    ) : tab === "adf" ? (
      <AdfLab s={s} update={update} />
    ) : tab === "dme" ? (
      <DmeLab s={s} update={update} />
    ) : tab === "fundamentals" ? (
      <Fundamentals s={s} update={update} />
    ) : tab === "propagation" ? (
      <Propagation />
    ) : tab === "antennas" ? (
      <Antennas />
    ) : tab === "mission" ? (
      <Mission
        s={s}
        update={update}
        progress={mission}
        setProgress={setMission}
      />
    ) : tab === "troubleshooting" ? (
      <Troubleshooting />
    ) : tab === "quiz" ? (
      <Quiz navigate={navigate} />
    ) : (
      <Sandbox s={s} update={update} />
    );
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        İçeriğe geç
      </a>
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Radar size={30} strokeWidth={1.4} />
          </div>
          <div>
            <strong>
              AEE<span>301</span>
            </strong>
            <small>VIRTUAL AVIONICS LAB</small>
          </div>
          <button
            className="mobile-close icon-button"
            aria-label="Menüyü kapat"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>
        <div className="sidebar-rule" />
        <span className="nav-heading">LABORATUVARLAR</span>
        <nav aria-label="Laboratuvar seçimi">
          {topics.slice(0, 7).map(([id, label, desc], i) => {
            const Icon = icons[i];
            return (
              <button
                key={id}
                aria-current={tab === id ? "page" : undefined}
                onClick={() => navigate(id)}
                className={tab === id ? "active" : ""}
              >
                <Icon size={19} />
                <span>
                  {label}
                  <small>{desc}</small>
                </span>
                {tab === id && <ChevronRight size={14} />}
              </button>
            );
          })}
          <span className="nav-heading practice">PRATİK & KEŞİF</span>
          {topics.slice(7).map(([id, label, desc], i) => {
            const Icon = icons[i + 7];
            return (
              <button
                key={id}
                aria-current={tab === id ? "page" : undefined}
                onClick={() => navigate(id)}
                className={tab === id ? "active" : ""}
              >
                <Icon size={19} />
                <span>
                  {label}
                  <small>{desc}</small>
                </span>
                {tab === id && <ChevronRight size={14} />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="course-badge">
            <BookOpen size={18} />
            <div>
              <b>AIRCRAFT ENGINEERING</b>
              <span>Radyo seyrüsefer & aviyonik</span>
            </div>
          </div>
          <span>
            <i className="dot" /> İnteraktif eğitim ortamı
          </span>
        </div>
      </aside>
      {mobile && (
        <button
          className="mobile-backdrop"
          aria-label="Menüyü kapat"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <div>
            <button
              className="mobile-menu icon-button"
              aria-label="Menüyü aç"
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
            <span>AEE 301</span>
            <ChevronRight size={13} />
            <b>{topics.find((t) => t[0] === tab)?.[1]}</b>
          </div>
          <div>
            <span className="live-status">
              <i className="dot" />
              {s.running ? "SİMÜLASYON AKTİF" : "DENEYE HAZIR"}
            </span>
            <button
              className={`icon-button ${help ? "active" : ""}`}
              aria-label="Kullanım ve model bilgisi"
              onClick={() => setHelp(!help)}
            >
              <HelpCircle size={19} />
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <section className="page-heading">
            <div>
              <span className="eyebrow">
                RADIO NAVIGATION & ILS VIRTUAL LAB
              </span>
              <h1>
                {meta[tab].title} <em>{meta[tab].accent}</em>
              </h1>
              <p>{meta[tab].description}</p>
            </div>
            <Reset onClick={reset} />
          </section>
          {help && (
            <Panel
              title="Laboratuvarı kullanma rehberi"
              kicker="QUICK START"
              action={
                <button
                  className="icon-button"
                  aria-label="Rehberi kapat"
                  onClick={() => setHelp(false)}
                >
                  <X size={18} />
                </button>
              }
            >
              <ol className="steps">
                <li>
                  Haritada uçağı sürükle veya aynı değeri slider / sayı
                  alanından değiştir.
                </li>
                <li>
                  NAV frekansını doğru istasyona ayarla; geçerlilik bayraklarını
                  kontrol et.
                </li>
                <li>
                  Deney hedefini uygula; kontrol düğmesiyle geri bildirim al.
                </li>
                <li>
                  Arıza ekle, sinyal yolunu izle ve kalan işlevleri karşılaştır.
                </li>
                <li>
                  Sıfırla, simülasyonu başlangıca alır. Sınavın ayrı sıfırlama
                  düğmesi vardır.
                </li>
              </ol>
              <p>
                Model: düz yerel NM koordinatları, ortak manyetik referans, 0 ft
                yer yüksekliği. VOR tam ölçek ±10°, LOC ±2.5°, GS ±0.7° eğitim
                değerleri. ILS yalnız front course; otomatik pilot, onaylı uçak
                performansı veya gerçek yaklaşma prosedürü modellenmez.
              </p>
              <div className="source-links">
                <a
                  href="https://www.faa.gov/Air_traffic/Publications/atpubs/aim_html/chap1_section_1.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  FAA AIM — Navigation aids <ArrowUpRight size={13} />
                </a>
                <a
                  href="https://www.faa.gov/air_traffic/publications/atpubs/fs_html/chap3_section_3.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  FAA — ADF bearing ilişkisinin referansı{" "}
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </Panel>
          )}
          <div key={`${tab}-${revision}`} className="lab-content">
            {content}
          </div>
          <footer>
            <div>
              <CheckCircle2 size={16} />
              <span>
                Simplified educational simulation — not aircraft-specific and
                not intended for real-world navigation.
              </span>
            </div>
            <b>
              AEE 301 <span>/ VIRTUAL LAB</span>
            </b>
          </footer>
        </main>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
