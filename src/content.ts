export const topics = [
  ["fundamentals", "Radyo temelleri", "Sinyalden göstergeye"],
  ["vor", "VOR Lab", "Radial · OBS · CDI"],
  ["adf", "ADF / NDB Lab", "Heading ve bearing"],
  ["ils", "ILS Lab", "Localizer · Glideslope"],
  ["dme", "DME Lab", "Slant range geometrisi"],
  ["propagation", "VHF / HF Yayılım", "Ufkun ötesindeki sinyal"],
  ["antennas", "Anten & Sinyal", "Kapsama ve yerleşim"],
  ["mission", "Entegre görev", "Enroute → yaklaşma"],
  ["troubleshooting", "Arıza teşhisi", "İzle, ölç, teşhis et"],
  ["quiz", "Bilgini sına", "36 soru · 8 konu"],
  ["sandbox", "Serbest deney", "Tüm sistemler, tek panel"],
] as const;
export type Tab = (typeof topics)[number][0];
export const glossary: Record<string, string> = {
  Transmitter: "Bilgiyi taşıyıcı radyo dalgası üzerine koyarak yayan verici.",
  Receiver:
    "Seçilen frekanstaki enerjiyi alır, demodüle eder ve kullanılabilir bilgiye dönüştürür.",
  Frequency: "Bir saniyedeki dalga çevrimi. Birimi Hz; 1 MHz = 1 milyon Hz.",
  Wavelength:
    "Bir çevrimin uzaydaki uzunluğu. λ = c / f; frekans arttıkça dalga boyu kısalır.",
  Modulation:
    "Taşıyıcı dalganın genlik, frekans veya fazını bilgiyle değiştirme.",
  "Line of sight":
    "Verici ile alıcı arasındaki görüş hattı; eğrilik ve arazi bunu sınırlayabilir.",
  Bearing:
    "Bir noktadan diğerine yön açısı; referansı manyetik kuzey veya uçak burnu olabilir.",
  Radial: "VOR istasyonundan uçağa doğru, manyetik kuzeyden ölçülen FROM yönü.",
  Course:
    "İzlenmek istenen yer izi yönü. Heading ile rüzgâr nedeniyle farklı olabilir.",
  "Slant range":
    "Uçak ile yer istasyonu arasındaki üç boyutlu doğrusal mesafe.",
  "Signal strength":
    "Alınan sinyal düzeyi. Bu uygulamada 0–100 bağıl eğitim ölçeği.",
  Interference:
    "İstenmeyen enerjinin sinyal ölçümünü bozması; hata veya veri kaybı oluşturabilir.",
  "Ground station": "Referans veya yanıt sinyali sağlayan yer tesisi.",
  "Airborne antenna":
    "Elektromanyetik enerjiyi alıcı girişine bağlayan uçak anteni.",
  "Signal processing":
    "Alınan işaretten bearing, açısal sapma veya zaman farkı çıkarılması.",
  "Cockpit indication":
    "İşlenen bilginin iğne, bayrak veya sayısal değer olarak sunulması.",
};
export interface Question {
  topic: string;
  prompt: string;
  options?: string[];
  answer: string;
  explanation: string;
  lab?: Tab;
  tolerance?: number;
}
export const questions: Question[] = [
  {
    topic: "VOR",
    prompt: "İstasyonun doğusundaki uçak hangi radial üzerindedir? (derece)",
    answer: "90",
    tolerance: 1,
    explanation:
      "Doğu, istasyondan bakıldığında 090° yönüdür. Radial her zaman FROM tanımlıdır.",
    lab: "vor",
  },
  {
    topic: "VOR",
    prompt:
      "090° radial üzerinde istasyona doğrudan gitmek için OBS kaç olmalı?",
    answer: "270",
    tolerance: 1,
    explanation: "Inbound course, radialin karşılığıdır: 090° + 180° = 270°.",
    lab: "vor",
  },
  {
    topic: "VOR",
    prompt: "090° radial, OBS 090°. Hangi bayrak görünür?",
    options: ["TO", "FROM", "GS", "DME"],
    answer: "FROM",
    explanation:
      "Seçilen course istasyondan dışarı bakar. CDI merkezde, bayrak FROM olur.",
    lab: "vor",
  },
  {
    topic: "VOR",
    prompt: "120° radial, OBS 300°. Hangi bayrak görünür?",
    options: ["FROM", "TO", "NAV OFF", "GS"],
    answer: "TO",
    explanation: "300° istasyona giden reciprocal course değeridir.",
    lab: "vor",
  },
  {
    topic: "VOR",
    prompt:
      "Kuzeye giden 000° course için 005° radial üzerindeki CDI hangi yana sapar?",
    options: ["Sola", "Sağa", "Merkeze", "Heading kadar"],
    answer: "Sola",
    explanation:
      "Uçak istenen kuzey course çizgisinin doğusundadır. Course uçağın solundadır.",
    lab: "vor",
  },
  {
    topic: "VOR",
    prompt:
      "Konum ve OBS sabitken yalnız heading değişirse standart VOR CDI ne yapar?",
    options: [
      "Heading ile döner",
      "Değişmez",
      "Daima TO olur",
      "Sinyal kaybolur",
    ],
    answer: "Değişmez",
    explanation:
      "Standart CDI ve TO/FROM, konum ile OBS geometrisine bağlıdır; uçağın burnuna değil.",
    lab: "vor",
  },
  {
    topic: "VOR",
    prompt: "359° ile 001° arasındaki en kısa açı kaç derecedir?",
    answer: "2",
    tolerance: 0.01,
    explanation: "Açılar daireseldir; kuzey geçişinde fark 358° değil 2° olur.",
    lab: "vor",
  },
  {
    topic: "VOR",
    prompt: "VOR üzerinde tam dikey geçişte radial güvenilir midir?",
    options: [
      "Evet, daima 000°",
      "Hayır, yön belirsizleşir",
      "Her zaman TO",
      "Her zaman FROM",
    ],
    answer: "Hayır, yön belirsizleşir",
    explanation:
      "Yatay uzaklık sıfıra yaklaşınca bearing geometrisi tekil olur. Model NAV bayrağı gösterir.",
    lab: "vor",
  },
  {
    topic: "ADF",
    prompt: "MH = 090°, RB = 045°. NDB manyetik bearing kaç derecedir?",
    answer: "135",
    tolerance: 0.1,
    explanation: "MB = normalize(MH + RB) = 135°.",
    lab: "adf",
  },
  {
    topic: "ADF",
    prompt: "MH = 300°, RB = 100°. Manyetik bearing kaç derecedir?",
    answer: "40",
    tolerance: 0.1,
    explanation: "400° değeri 360° çıkarılarak 040° olur.",
    lab: "adf",
  },
  {
    topic: "ADF",
    prompt: "NDB manyetik bearing 090°, heading 000°. Relative bearing kaçtır?",
    answer: "90",
    tolerance: 0.1,
    explanation: "RB = MB − MH = 090°; istasyon uçağın sağındadır.",
    lab: "adf",
  },
  {
    topic: "ADF",
    prompt:
      "Konum sabit, heading saat yönünde 90° artıyor. ADF relative needle ne yapar?",
    options: [
      "90° saat yönünde döner",
      "90° ters yönde döner",
      "Sabit kalır",
      "Daima kuzeyi gösterir",
    ],
    answer: "90° ters yönde döner",
    explanation:
      "İstasyonun manyetik yönü sabittir; burun referansı döndükçe relative bearing azalır.",
    lab: "adf",
  },
  {
    topic: "ADF",
    prompt: "NDB sağ kanat doğrultusunda. Relative bearing kaçtır?",
    answer: "90",
    tolerance: 0.1,
    explanation:
      "Relative bearing burundan saat yönünde ölçülür; sağ kanat 090° olur.",
    lab: "adf",
  },
  {
    topic: "DME",
    prompt:
      "İstasyonun tam üzerinde 10.000 ft yükseklikte DME yaklaşık kaç NM gösterir?",
    answer: "1.646",
    tolerance: 0.03,
    explanation:
      "Yatay mesafe sıfır olsa da dikey mesafe vardır: 10.000 / 6076 ≈ 1.646 NM.",
    lab: "dme",
  },
  {
    topic: "DME",
    prompt: "Yatay mesafe 3 NM, yükseklik farkı 4 NM. DME kaç NM?",
    answer: "5",
    tolerance: 0.01,
    explanation: "Pisagor: √(3² + 4²) = 5 NM.",
    lab: "dme",
  },
  {
    topic: "DME",
    prompt: "Slant range ile ground distance farkı en çok ne zaman büyür?",
    options: [
      "Alçakta ve uzakta",
      "Yüksekte ve istasyona yakın",
      "Yükseklik farkı sıfırsa",
      "Frekans değişince",
    ],
    answer: "Yüksekte ve istasyona yakın",
    explanation:
      "Dikey bileşen yatay mesafeye göre büyük olduğunda fark belirginleşir.",
    lab: "dme",
  },
  {
    topic: "DME",
    prompt: "DME temelde ne ölçer?",
    options: [
      "Gidiş-dönüş sinyal süresi",
      "Radial açısı",
      "Heading",
      "Glideslope açısı",
    ],
    answer: "Gidiş-dönüş sinyal süresi",
    explanation:
      "Sorgu ve yanıtın uçuş süresi kullanılır; transponder işlem gecikmesi hesaptan çıkarılır.",
    lab: "dme",
  },
  {
    topic: "ILS",
    prompt:
      "Front course inbound yaklaşmada uçak merkez hattının solunda. LOC iğnesi nerededir?",
    options: ["Sağda", "Solda", "Merkezde", "Daima yukarıda"],
    answer: "Sağda",
    explanation:
      "Localizer merkez hattı uçağın sağındadır; dikey iğne sağa gider.",
    lab: "ils",
  },
  {
    topic: "ILS",
    prompt: "Uçak 3° glide path üzerinde kalmış. GS iğnesi nereye gider?",
    options: ["Yukarı", "Aşağı", "Sola", "Sağa"],
    answer: "Aşağı",
    explanation:
      "İstenen glide path uçağın altındadır; yatay iğne aşağı sapar.",
    lab: "ils",
  },
  {
    topic: "ILS",
    prompt: "Uçak 3° glide path altında. GS iğnesi nerededir?",
    options: ["Aşağıda", "Yukarıda", "Solda", "Kayıp"],
    answer: "Yukarıda",
    explanation:
      "Glide path uçaktan yukarıda olduğu için yatay iğne yukarı gider.",
    lab: "ils",
  },
  {
    topic: "ILS",
    prompt: "ILS modunda OBS değiştirmek localizer beam yönünü değiştirir mi?",
    options: ["Evet", "Hayır"],
    answer: "Hayır",
    explanation:
      "Localizer course yer tesisi tarafından belirlenir. OBS, kurs referansı olarak ayarlanır.",
    lab: "ils",
  },
  {
    topic: "ILS",
    prompt: "GS vericisi kayıp; LOC sağlıklı. Hangi rehberlik kalır?",
    options: [
      "Yalnız yatay",
      "Yalnız dikey",
      "Tam ILS",
      "Hiçbir radyo sistemi",
    ],
    answer: "Yalnız yatay",
    explanation:
      "LOC ve GS ayrı sinyallerdir. GS kaybı LOC açısal bilgisini tek başına kesmez.",
    lab: "ils",
  },
  {
    topic: "ILS",
    prompt: "Bu laboratuvarda nominal glide path kaç derecedir?",
    answer: "3",
    tolerance: 0.01,
    explanation:
      "Model 3° nominal açı kullanır; gerçek tesis değerleri değişebilir.",
    lab: "ils",
  },
  {
    topic: "Yayılım",
    prompt: "VHF menzilini genel olarak hangi değişiklik artırır?",
    options: [
      "Uçak yüksekliğini artırmak",
      "Anteni kapatmak",
      "Araziyi yükseltmek",
      "Alıcıyı kapatmak",
    ],
    answer: "Uçak yüksekliğini artırmak",
    explanation:
      "Yükseklik artınca radyo ufku ve doğrudan görüş hattı genişler.",
    lab: "propagation",
  },
  {
    topic: "Yayılım",
    prompt:
      "Uzak okyanus bölgesinde VHF görüş hattı dışında hangi klasik sistem uygundur?",
    options: ["HF", "VOR OBS", "GS", "ADF needle"],
    answer: "HF",
    explanation:
      "Uygun iyonosfer koşullarında HF skywave ufuk ötesine ulaşabilir.",
    lab: "propagation",
  },
  {
    topic: "Yayılım",
    prompt: "Terminal sahasında normal ATC ses iletişimi için tipik seçim?",
    options: ["VHF", "DME", "Localizer", "NDB"],
    answer: "VHF",
    explanation:
      "VHF ses iletişimi terminal ve görüş hattı içindeki birçok ATC uygulamasında kullanılır.",
    lab: "propagation",
  },
  {
    topic: "Yayılım",
    prompt: "HF için tek bir frekans her iyonosfer koşulunda çalışır mı?",
    options: ["Evet", "Hayır"],
    answer: "Hayır",
    explanation:
      "Skywave, frekansa ve iyonosfer koşullarına bağlıdır; bu model de değişken sonuç verir.",
    lab: "propagation",
  },
  {
    topic: "Sinyal",
    prompt: "Frekans iki katına çıkarsa dalga boyu ne olur?",
    options: ["Yarıya iner", "İki katına çıkar", "Değişmez", "Sıfır olur"],
    answer: "Yarıya iner",
    explanation:
      "λ = c/f; aynı yayılma hızında frekans ve dalga boyu ters orantılıdır.",
    lab: "fundamentals",
  },
  {
    topic: "Sinyal",
    prompt: "100 MHz için boşlukta yaklaşık dalga boyu kaç metredir?",
    answer: "3",
    tolerance: 0.02,
    explanation: "300 milyon m/s ÷ 100 milyon Hz ≈ 3 m.",
    lab: "fundamentals",
  },
  {
    topic: "Sinyal",
    prompt: "Doğru VOR sinyal zinciri hangisidir?",
    options: [
      "İstasyon → anten → receiver → işleme → CDI",
      "CDI → istasyon → anten",
      "OBS → GS → NDB",
      "DME → heading → VOR",
    ],
    answer: "İstasyon → anten → receiver → işleme → CDI",
    explanation: "Her basamak bir öncekinin enerjisini veya verisini kullanır.",
    lab: "fundamentals",
  },
  {
    topic: "Anten",
    prompt: "Gövde sinyal yolunu gölgelerse ne olabilir?",
    options: [
      "Alım zayıflayabilir",
      "Frekans otomatik değişir",
      "Radial tanımı değişir",
      "Mesafe sıfırlanır",
    ],
    answer: "Alım zayıflayabilir",
    explanation:
      "İletken yapı görüş ve kapsama üzerinde etkili olabilir; yerleşim ve yön önemlidir.",
    lab: "antennas",
  },
  {
    topic: "Anten",
    prompt: "Tüm uçak tiplerinin anten konumları aynı mıdır?",
    options: ["Evet", "Hayır"],
    answer: "Hayır",
    explanation:
      "Tip, anten tasarımı ve kurulum gereksinimleri konumları değiştirir.",
    lab: "antennas",
  },
  {
    topic: "Teşhis",
    prompt: "NAV frekansı yanlış, verici açık. İlk kontrol ne olmalı?",
    options: [
      "Doğru frekans ve station ID",
      "Glide path eğimi",
      "Uçak boya rengi",
      "OBS ile vericiyi döndürmek",
    ],
    answer: "Doğru frekans ve station ID",
    explanation:
      "Açık bir verici, yanlış kanala ayarlanmış alıcıya geçerli NAV verisi sağlamaz.",
    lab: "troubleshooting",
  },
  {
    topic: "Teşhis",
    prompt:
      "ADF iğnesi uçak dönüşünde sabit, receiver çıkışı değişiyor. Olası arıza?",
    options: [
      "Gösterge mekanizması donmuş",
      "NDB taşınmış",
      "DME doğru",
      "HF frekansı düşük",
    ],
    answer: "Gösterge mekanizması donmuş",
    explanation:
      "Değişen upstream veriye karşı değişmeyen gösterge downstream arızayı düşündürür.",
    lab: "troubleshooting",
  },
  {
    topic: "Teşhis",
    prompt: "LOC iğnesi merkezde ama UNRELIABLE uyarısı var. Ne çıkarılır?",
    options: [
      "Merkezde olmak veri güvenilirliğini kanıtlamaz",
      "Kesin doğru yaklaşma",
      "GS otomatik düzelir",
      "DME sıfırdır",
    ],
    answer: "Merkezde olmak veri güvenilirliğini kanıtlamaz",
    explanation: "Geometrik merkez ve ölçüm geçerliliği ayrı kavramlardır.",
    lab: "ils",
  },
  {
    topic: "Teşhis",
    prompt: "VHF iletişimi yalnız dağın arkasında kayboluyor. En olası neden?",
    options: [
      "Arazi görüş hattını kesiyor",
      "OBS yanlış",
      "DME gecikmesi",
      "VOR radial tanımı",
    ],
    answer: "Arazi görüş hattını kesiyor",
    explanation:
      "Konuma bağlı kayıp ve sağlam donanım, yayılım engelini işaret eder.",
    lab: "propagation",
  },
];
export const grade = (q: Question, value: string): boolean =>
  q.options
    ? value === q.answer
    : value.trim() !== "" &&
      Number.isFinite(Number(value.replace(",", "."))) &&
      Math.abs(Number(value.replace(",", ".")) - Number(q.answer)) <=
        (q.tolerance ?? 0.1);
export interface Case {
  title: string;
  symptom: string;
  checks: Record<string, string>;
  diagnosis: string;
  options: string[];
  why: string;
  tree: string[];
}
export const cases: Case[] = [
  {
    title: "VOR CDI cevap vermiyor",
    symptom: "Konum değişiyor; CDI aynı yerde ve NAV bayrağı görünür.",
    checks: {
      Gösterge: "NAV INVALID; CDI geçerli konum üretmiyor.",
      İstasyon: "VOR 113.60 MHz açık; test sinyali sağlam.",
      "Receiver / anten": "Aktif NAV 114.00 MHz; anten sürekliliği normal.",
      "Sinyali izle":
        "İstasyon → anten sağlam. Receiver kanalında sinyal seçilemiyor.",
    },
    diagnosis: "Yanlış NAV frekansı",
    options: [
      "Yanlış NAV frekansı",
      "VOR vericisi kapalı",
      "OBS düğmesi bozuk",
      "GS kayıp",
    ],
    why: "Receiver yanlış kanalı dinliyor. İstasyon frekansı ve kimliği eşleştirilmeden CDI kullanılamaz.",
    tree: [
      "NAV geçerli mi? Hayır",
      "Verici çalışıyor mu? Evet",
      "Aktif kanal doğru mu? Hayır",
    ],
  },
  {
    title: "ADF iğnesi dondu",
    symptom: "Uçak 90° döndü; relative needle aynı konumda kaldı.",
    checks: {
      Gösterge: "İğne 045° değerinde sabit.",
      İstasyon: "365 kHz NDB sinyali normal.",
      "Receiver / anten":
        "Anten ve receiver çıkışı değişen relative bearing üretiyor.",
      "Sinyali izle":
        "NDB → anten → receiver → işleme sağlam; son göstergede hareket yok.",
    },
    diagnosis: "ADF gösterge arızası",
    options: [
      "NDB kapalı",
      "ADF gösterge arızası",
      "Rüzgâr yok",
      "DME transponder arızası",
    ],
    why: "Sağlam işlemci çıkışına rağmen iğne hareket etmezse son gösterge aşaması araştırılır.",
    tree: [
      "RF var mı? Evet",
      "İşlemci bearing değişiyor mu? Evet",
      "İğne izliyor mu? Hayır",
    ],
  },
  {
    title: "DME mesafe göstermiyor",
    symptom: "VOR radial okunuyor; DME ekranında çizgiler var.",
    checks: {
      Gösterge: "VOR geçerli, DME NO REPLY.",
      İstasyon: "VOR yayın yapıyor; DME transponder yanıt testi başarısız.",
      "Receiver / anten":
        "Uçak interrogator darbe gönderiyor, anten testi normal.",
      "Sinyali izle":
        "Sorgu yere ulaşıyor → ground reply yok → süre ölçülemiyor.",
    },
    diagnosis: "DME yer transponder arızası",
    options: [
      "VOR OBS yanlış",
      "DME yer transponder arızası",
      "Glideslope kaybı",
      "Heading yanlış",
    ],
    why: "VOR açı sinyali ve DME sorgu/yanıt sistemi bağımsız işlevlerdir.",
    tree: [
      "Sorgu üretiliyor mu? Evet",
      "Yer yanıtlıyor mu? Hayır",
      "Mesafe ölçümü geçersiz",
    ],
  },
  {
    title: "LOC var, GS yok",
    symptom: "Yatay iğne konuma tepki veriyor; GS bayrağı görünüyor.",
    checks: {
      Gösterge: "LOC VALID, GS INVALID; uçak normal yaklaşma sektörü içinde.",
      İstasyon: "LOC test normal; GS transmitter çıkışı yok.",
      "Receiver / anten": "ILS receiver ve anten testleri normal.",
      "Sinyali izle": "LOC yolu tamam. GS kaynağında sinyal kesiliyor.",
    },
    diagnosis: "GS verici kaybı",
    options: [
      "Ortak receiver arızası",
      "GS verici kaybı",
      "Yanlış VOR radial",
      "DME ölçüm farkı",
    ],
    why: "Yalnız GS kaynağı kesilince dikey rehberlik gider, LOC bilgisi kalır.",
    tree: [
      "Her iki eksen kayıp mı? Hayır",
      "GS kapsaması içinde mi? Evet",
      "GS verici testi? Başarısız",
    ],
  },
  {
    title: "Kararsız ILS iğneleri",
    symptom: "Uçak sabit, LOC ve GS iğneleri periyodik salınıyor.",
    checks: {
      Gösterge: "Geometri sabitken iki eksende salınım; UNSTABLE uyarısı.",
      İstasyon: "LOC ve GS güç/izleme kontrolleri normal.",
      "Receiver / anten":
        "Receiver self-test normal; girişte istenmeyen RF enerjisi ölçülüyor.",
      "Sinyali izle":
        "Yayın ve işleme sürüyor; sinyal yolunda dış girişim var.",
    },
    diagnosis: "RF girişimi / çok yollu alım",
    options: [
      "RF girişimi / çok yollu alım",
      "DME irtifa farkı",
      "Doğru yaklaşma",
      "Sadece OBS hatası",
    ],
    why: "Bu sadeleştirilmiş vakada RF girişimi ölçümü bozar. Gerçekte saha ve ekipman incelemesi gerekir.",
    tree: [
      "Uçak geometrisi değişiyor mu? Hayır",
      "Verici ve alıcı testleri sağlam mı? Evet",
      "RF ortamında girişim var mı? Evet",
    ],
  },
  {
    title: "Dağın arkasında VHF kaybı",
    symptom: "Alçak irtifada dağın arkasına geçince ses bağlantısı kesildi.",
    checks: {
      Gösterge: "Sinyal seviyesi arazi gölgesinde düşüyor.",
      İstasyon: "Aynı istasyon diğer uçaklarla haberleşiyor.",
      "Receiver / anten": "COM receiver ve anten testleri normal.",
      "Sinyali izle": "Doğrudan ışın araziye çarpıyor; görüş hattı kesik.",
    },
    diagnosis: "Arazi engeli",
    options: [
      "Arazi engeli",
      "OBS 180° ters",
      "GS receiver arızası",
      "ADF iğnesi donuk",
    ],
    why: "VHF ağırlıklı olarak line-of-sight yayılır; engel, donanım sağlam olsa da alımı kesebilir.",
    tree: [
      "Donanım sağlam mı? Evet",
      "Kayıp konuma bağlı mı? Evet",
      "Görüş hattı açık mı? Hayır",
    ],
  },
  {
    title: "NAV station sinyali kayıp",
    symptom: "Frekans doğru; NAV bayrağı aktif. ADF ve DME çalışıyor.",
    checks: {
      Gösterge: "VOR ve ILS geçersiz; ADF ve DME bağımsız olarak normal.",
      İstasyon: "Her iki NAV tesisinin test yayınları sağlam.",
      "Receiver / anten":
        "NAV anteninde sinyal var. Ortak NAV receiver self-test başarısız.",
      "Sinyali izle":
        "Anten çıkışına kadar sinyal var; NAV receiver sonrası veri yok.",
    },
    diagnosis: "Ortak NAV receiver arızası",
    options: [
      "Bütün istasyonlar kapalı",
      "Ortak NAV receiver arızası",
      "DME yüksekliği fazla",
      "Yalnız GS verici kaybı",
    ],
    why: "Bağımsız alıcılar çalışırken iki NAV işlevinin aynı noktada kesilmesi ortak receiver yolunu işaret eder.",
    tree: [
      "Kanal ve kaynak doğru mu? Evet",
      "Anten çıkışı var mı? Evet",
      "Receiver self-test? Başarısız",
    ],
  },
];
