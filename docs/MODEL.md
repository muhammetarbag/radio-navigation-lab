# Model varsayımları ve teknik referans

Bu uygulama eğitim geometrisidir. Hava aracı veya yer tesisi sertifikasyonu, RF alan çözümü, gerçek yaklaşma prosedürü, arazi veri tabanı ya da otomatik pilot içermez.

## Ortak koordinatlar

- `x`: doğuya NM; `y`: kuzeye NM. Açılar ortak manyetik kuzeyden saat yönünde ölçülür.
- Manyetik varyasyon ve Dünya üzerindeki küresel seyrüsefer hesapları NAV haritasında modellenmez.
- Uçak irtifası yerel 0 ft referansına göredir. DME yer tesisleri de bu seviyededir.
- `1 NM = 6076.11549 ft`; bütün eğik mesafe işlemlerinde birimler eşitlenir.
- Kontroller sayısal aralıklarla sınırlıdır. İstasyon üzerinde bearing belirsizse gösterge geçersiz sayılır.

## VOR

`radial = normalize(atan2(dx, dy))`

`difference = wrap(radial − OBS, −180…180)`

`CDI deviation = −asin(sin(difference))`

`cos(difference) > 0` ise FROM, `< 0` ise TO. ±90° civarında 1° genişliğinde belirsizlik alanı; istasyona 0.05 NM altında cone uyarısı vardır. CDI tam ölçek ±10°; normal ölçekte nokta başına 2°. Yatay uzaklık 80 NM üzerinde eğitim kapsaması dışında kabul edilir; gerçek VOR service volume yerine geçmez.

Heading doğrudan CDI veya TO/FROM hesabına girmez. Rüzgâr ve uçuş sırasında heading, uçak konumunu değiştirdiği için dolaylı etki oluşturur. 090° radial/OBS 090° merkez FROM, OBS 270° merkez TO verir.

## ADF

`MB = bearing(aircraft, NDB)` ve `RB = normalize(MB − heading)`.

İğne sabit kartta RB gösterir; harita MB ve burun referansını ayrı gösterir. Arıza dışındaki modelde iğne istasyona işaret eder. Donma, arıza açıldığı anki iğne konumunu tutar. Zayıf sinyal ±5°, elektrik girişimi ±12° belirlenebilir periyodik sapma üretir. İstasyon/alıcı kaybında iğne kaldırılır.

## ILS

Sadece front course yaklaşma geometrisi modellenir. Pist kursu serbest deneyde değiştirilebilir; ölçümler pistin yerel koordinatlarına döndürülür.

- LOC vericisi, eşikten pist içinde 1.5 NM ileride kabul edilir: `atan2(lateral, distance + 1.5)`.
- GS referansı eşikten 0.157 NM ileridedir: `atan2(altitude/6076.11549, distance + 0.157)`.
- Nominal path 3°; bu referans eşikte yaklaşık 50 ft üretir.
- LOC tam ölçek ±2.5°, GS ±0.7° eğitim ölçeğidir. Gerçek tesis boyutlandırması sabit bir tam ölçek açı olmak zorunda değildir.
- Sol ofsette LOC iğnesi sağa; nominal yol üzerindeki uçakta GS iğnesi aşağı gider. GS ABOVE/BELOW etiketleri **uçağın nominal yola göre konumunu** belirtir.
- Model LOC açısal/mesafe kapsamasını, GS için ≤10 NM, ±8° yanal sektör ve 0.5–6° düşey açıyı uygular. Bu kurallar gerçek kapsama veya prosedür yetkisi oluşturmaz.
- OBS gösterge kurs referansıdır; vericinin localizer hattını döndürmez.
- LOC ve GS kaybı bağımsızdır. Ortak NAV receiver veya anten giriş kesintisi, ilgili tüm downstream bilgiyi geçersiz yapar.
- UNRELIABLE ham iğneyi koruyup güvenilirlik uyarısı gösterir. UNSTABLE kontrollü salınım ekler. COURSE ERROR LOC ölçümüne +0.8° bias ekler; GS değişmez.
- Yaklaşma eşikten 0.1 NM önce, yerde veya harita sınırında durur. Otomatik iniş yapılmaz. Serbest uçuş pist düzlemini geçebilir.

LOC ve GS modülasyon bölgeleri yalnız kavramsaldır; ayrıntılı RF alanı veya DDM hesaplaması değildir.

## DME ve sinyal zincirleri

`slant = sqrt(ground² + ((aircraftFt − stationFt)/6076.11549)²)`.

110.30 ILS ve 113.60 VOR seçimleri, eğitimde eşlenmiş DME tesisini değiştirir. DME interrogator/alıcı/anteni bağımsız kabul edilir; ortak NAV receiver kaybında DME çalışabilir. Yanıt kaybı zincirin yer transponder basamağında başlar. Süre ölçümü sinyal zincirinde kavramsal olarak açıklanır, darbe seviyesinde bir RF protokolü simüle edilmez.

Signal Flow Explorer'daki beş basamağın her biri tek tek kapatılabilir. Önceki basamaklar korunur, kesintiden sonraki basamaklar geçersiz olur. LOC/GS kaynakları ortak zincirin önünde ayrı gösterilir.

## Yayılım ve anten

- VHF için yaklaşık `horizonNM = 1.23 × (√aircraftFt + √antennaFt)`; 4/3 etkili Dünya yarıçapı ile orta nokta eğrilik kabarması ayrıca hesaplanır. Tek bir orta nokta arazi engeli vardır. Fresnel, kırınım, atmosfer ve ayrıntılı anten kazancı hesaplanmaz.
- HF `critical = 3 + condition × 0.1 MHz`, kavramsal `MUF = 3 × critical`; `skipNM = 300 + 35 × frequencyMHz`. Bunlar öğretim amaçlı tasarlanmış eşiklerdir, iyonosfer tahmini değildir. Skywave 4.000 NM içinde, seçilen frekans aralığı ve skip koşullarında gösterilir. Ground wave ayrı kısa mesafe koşulu kullanır.
- Anten polarizasyonu ideal `cos²(angle)` kazancını gösterir. Gövde gölgesi açıldığında 110–250° temsili sektör %15 çarpanı alır. Beş anten alanı gerçek uçak yerleşim planı değildir.
- Seyrüsefer, yayılım ve anten çizimlerinde ilgili farklı yatay/düşey ölçekler belirtilir.

## Kaynaklar

2026-09-07 tarihinde incelenen temel referanslar:

1. [FAA Aeronautical Information Manual — Air Navigation, Section 1](https://www.faa.gov/Air_traffic/Publications/atpubs/aim_html/chap1_section_1.html): VOR radial tanımı, DME slant range, LOC/GS ayrımı ve ILS yaklaşma geometrisinin kavramsal kontrolü.
2. [FAA Flight Services — Emergency Services, Section 3](https://www.faa.gov/air_traffic/publications/atpubs/fs_html/chap3_section_3.html): relative bearing + magnetic heading = magnetic bearing ilişkisi.

VHF ufuk hesabı geometrik yaklaşık modeldir. HF eşikleri, anten gölgesi, kapsama eşikleri ve enjekte edilen hatalar uygulamanın eğitim varsayımlarıdır; FAA onayı veya uçak bakım talimatı olarak sunulmaz. Sorular ve açıklamalar uygulama için yazılmıştır.
