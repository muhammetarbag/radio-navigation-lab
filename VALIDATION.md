# Doğrulama — 2026-09-07

Yerel üretim çıktısı `http://127.0.0.1:3024/` üzerinde Chromium ile kontrol edildi. Uygulama ayrı `radio-navigation-lab/` klasöründe oluşturuldu. Diğer Okul uygulamalarında değişiklik yapılmadı.

## Sonuçlar

| Kontrol | Sonuç |
|---|---|
| Saf model / içerik testleri | **64 / 64 geçti** |
| Üretim paketi tarayıcı senaryoları | **17 / 17 geçti** |
| Son gösterge ölçeği kontrolü | **3 / 3 geçti**: ILS, VOR, sürükleme ve iğne yönleri |
| TypeScript | Başarılı; `strict`, kullanılmayan değişken kontrolleri açık |
| Vite üretim derlemesi | Başarılı; JS yaklaşık 298 kB, gzip yaklaşık 95 kB |
| Kaynak biçimi | Prettier kontrolü geçti |
| Mobil | 390 × 844 tüm bölümler, 360 × 800 ILS; yatay sayfa taşması yok |
| Masaüstü | 1512 × 1080; göstergeler ve SVG etkileşimleri doğrulandı |
| Konsol / SVG | Testlerde JS konsol hatası, `NaN` veya `Infinity` SVG değeri yok |
| Yerel HTTP | Ana HTML, JS, CSS ve favicon: HTTP 200 |
| Harici istek | Üretim açılışında yok; yazı tipleri yerel pakette |

Tarayıcı suite'i 17 test yöntemi içinde çok sayıda alt işlem yürütür: **61 slider** için klavyeyle alt/üst sınır ve geri dönüş; genel taramada **150 düğme işlemi**; ayrıca 36 soru, yedi teşhis, dört sistemin beşer zincir bileşeni, görev adımları, menü ve form akışları ayrı doğrulanır. Bu sayılar ürün özelliği sayısı değildir.

## Önemli davranış kanıtları

- 720 radial örneğinde açısal normalizasyon ve reciprocal TO/FROM; 359°/001° geçişi; istasyon üstü belirsizlik.
- VOR heading değişiminde CDI sabit; 090° radial/090° OBS FROM, 270° OBS TO. VOR göstergesinde her yanda beş nokta; nokta aralığı 2°.
- ADF MH + RB = MB; yerinde 90° heading değişiminde MB sabit, RB ters yönde 90° döner. İğne donması captured konumda kalır; alıcı kaybında iğne kaldırılır.
- DME doğrudan 10.000 ft üzerinde 1.65 NM; 3–4–5 geometrisi; irtifa ve mesafeyle farkın değişimi; tahmin gizleme/açma; yanıt kaybı.
- ILS plan ve profil görünümünde gerçek pointer sürükleme; LOC sağ/sol ve GS yukarı/aşağı yönleri; OBS’nin LOC ışınını değiştirmemesi.
- LOC ve GS arızaları ayrı bayrak verir; receiver, anten, unreliable, unstable ve course bias farklı davranır. Sinyal zinciri kesintileri downstream bileşenlere yayılır.
- Entegre görev, yalnız UI kontrolleri ile dokuz aşamanın tamamından geçirildi; son aşamada beş saniye kararlı manuel uçuş sağlandı.
- Tüm 36 soru sırayla doğru cevaplandı: 36/36, %100 ve sekiz tamamlanan konu. Ayrı test yanlış yanıtı, puan güncellemesini, tekrar yüklemede kalıcılığı ve sıfırlamayı kontrol etti.
- Her teşhis vakası cevabı başlangıçta saklar; en az iki inceleme yapılmadan gönderim açılmaz. Yedi vakanın tüm kanıt noktaları ve doğru teşhisleri test edildi.
- Klavye ile sliderlar, anten seçimi, mobil menü ve reduced-motion görünümü kontrol edildi.

## Yeniden üretim ve kayıtlar

```sh
npm test
npm run build
npm run preview -- --port 3024
LAB_URL=http://127.0.0.1:3024/ npm run test:e2e
npm run format:check
```

Test klasöründe: `model-validation.log`, `browser-validation.log`, `final-gauge-check.log`, `final-control-check.log`, `control-coverage.json`, `build.log`, ekran görüntüleri ve `artifact-manifest.json`.

## Sınırlar

Test edilen tarayıcı Chromium’dur. Firefox, Safari ve gerçek mobil donanım bu turda çalıştırılmadı. Modeller [MODEL.md](docs/MODEL.md) içindeki eğitim varsayımlarına dayanır; uçak sertifikasyonu, RF doğrulaması, gerçek yaklaşma veya bakım prosedürü testi değildir. Bu teslim yerel uygulama ve statik üretim paketidir.
