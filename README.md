# AEE 301 — Radio Navigation & ILS Virtual Lab

Türkçe, etkileşimli radyo seyrüsefer laboratuvarı. React + TypeScript + Vite; sunucu hesabı, API anahtarı veya harici harita servisi gerektirmez. Yazı tipleri de uygulama paketindedir.

[Laboratuvarı aç](https://muhammetarbag.github.io/radio-navigation-lab/) · [Tüm laboratuvarlar](https://muhammetarbag.github.io/)

## GitHub Pages

`codex/radio-navigation-lab` dalındaki değişiklikler, model testleri, TypeScript/üretim derlemesi ve 17 Chromium senaryosu geçtikten sonra GitHub Actions üzerinden yayımlanır. Yayınlanan paket `dist/` klasörüdür.

## Çalıştırma

```sh
npm ci
npm run dev
```

Geliştirme adresi: `http://127.0.0.1:3023/`.

```sh
npm run build
npm run preview -- --port 3024
```

Üretim önizlemesi: `http://127.0.0.1:3024/`. Yayına hazır statik çıktı `dist/` içindedir. Vite `base: './'` kullanır; alt dizin barındırmasını destekler. Bölüm navigasyonu hash tabanlıdır. Yerel sunucu açık kaldığı sürece önizlemeye erişilir.

## Laboratuvarlar

| Bölüm | Çalışan etkileşimler |
|---|---|
| Radyo temelleri | Frekans / dalga boyu, AM zarfı, 16 kavram, dört sistem için izlenebilir sinyal zinciri |
| VOR | Sürüklenebilir uçak, radial/OBS/heading, CDI ve TO/FROM, açı yayları, dört deney, rüzgârlı uçuş |
| ADF / NDB | Konum ve heading, taşınabilir NDB, relative/magnetic bearing, polar gösterge, beş görünüm katmanı, arıza örnekleri |
| ILS | Sürüklenebilir plan ve profil görünümleri, LOC/GS, manuel yaklaşma, sinyal bölgeleri, yedi ayrı arıza |
| DME | Eğik mesafe geometrisi, irtifa ve mesafe kontrolleri, dinamik fark grafiği, gizli tahmin, dört deney |
| VHF / HF | Radyo ufku, arazi gölgesi, kavramsal skywave/skip zone, dört iletişim seçimi senaryosu |
| Anten | Beş tıklanabilir anten bölgesi, polarizasyon ve temsili gölge sektörü |
| Entegre görev | VOR’dan ILS’ye dokuz kullanıcı kontrollü aşama; son aşamada beş saniye stabil uçuş |
| Arıza teşhisi | Yedi vaka, her birinde dört inceleme noktası, teşhis seçimi ve sonuçta açılan hata ağacı |
| Sınav | 36 özgün soru, sekiz konu, sayısal / çoktan seçmeli yanıtlar, kalıcı yerel puanlama |
| Serbest deney | Ortak uçak durumu, taşınabilir VOR/NDB/pist, rüzgâr, irtifa, kurs, frekans ve arızalar |

Her bölümde üstteki **Sıfırla**, simülasyonu ve o bölümün yerel deney kontrollerini başlangıca alır. Sınav ilerlemesinin ayrı sıfırlama düğmesi vardır. Bölüm değişimi uçuşu duraklatır; uçak ve sistem durumu korunur. VOR ve ILS bölümüne giriş, ilgili eğitim frekansını seçer. Entegre görev bunu öğrenciye bırakır. Sekme gizlenince uçuş duraklar.

## Model ve mimari

- `src/model.ts`: saf geometri, sinyal geçerliliği, arızalar, sorgu/yanıt ve uçuş adımı.
- `src/components.tsx`: yeniden kullanılan SVG haritalar, göstergeler, sinyal zincirleri, kontroller.
- `src/labs.tsx`: VOR, ADF, ILS ve DME laboratuvarları.
- `src/learning.tsx`: sinyal, yayılım ve anten öğrenme ortamları.
- `src/activities.tsx`: görev, teşhis, sınav ve serbest deney.
- `src/content.ts`: sorular, vaka kanıtları ve sözlük.
- `src/main.tsx`: ortak simülasyon durumu ve erişilebilir bölüm navigasyonu.

Tüm NAV/ADF/DME/ILS göstergeleri tek uçak durumundan hesaplanır. Normal modda rastgele iğne hareketi yoktur. Periyodik hata yalnız açıkça seçilmiş disturbance/failure durumlarında uygulanır.

Model varsayımları ve kaynaklar: [docs/MODEL.md](docs/MODEL.md). Doğrulama: [VALIDATION.md](VALIDATION.md).

## Testler

```sh
npm test
npm run typecheck
npm run build
python3 -m venv .venv
.venv/bin/pip install -r requirements-test.txt
.venv/bin/python -m playwright install chromium
LAB_URL=http://127.0.0.1:3024/ npm run test:e2e
```

Tarayıcı testi için önizleme sunucusu önceden açık olmalıdır. Ekran görüntüleri, kontrol listesi ve test günlükleri `test-results/` altında üretilir. `npm run format:check` kaynak biçimini kontrol eder.

Sınav ilerlemesi yalnız tarayıcının `localStorage` alanında saklanır; veri gönderimi veya analitik yoktur. Depolama kapalıysa oturum içi puanlama çalışır. Görev ilerlemesi açık uygulama oturumunda korunur.

**Simplified educational simulation — not aircraft-specific and not intended for real-world navigation.**

Kalıcı ders notu için önerilen Obsidian başlığı: `[[AEE 301 — Radio Navigation Lab]]`; bağlantılar: `[[VOR]]`, `[[ADF-NDB]]`, `[[ILS]]`, `[[DME]]`, `[[Radyo Yayılımı]]`.
