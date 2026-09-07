# AEE 301 Radio Navigation Lab

- Bağımsız React/TypeScript/Vite statik uygulama. Ortak model `src/model.ts` içindedir; göstergelerde ikinci bir bağımsız hesap modeli oluşturma.
- Açılar manyetik kuzeyden saat yönünde, x doğu/y kuzey NM; irtifa ft. ILS `approachPosition` ve `ilsGeometry` üzerinden dönüştürülür.
- Eğitim varsayımlarını `docs/MODEL.md` ile eşleştir. Normal modda rastgele iğne hareketi ekleme.
- UI Türkçe; standart aviyonik tanımları İngilizce kalabilir. Sadeleştirme etiketi görünür kalmalı.
- Kontroller klavye, sayı girişi ve sürüklemeyle çalışmalı. Sınav/teşhis yanıtını gönderimden önce açıklama.
- Geometri veya geçerlilik değişikliğinde `npm test`; UI değişikliğinde `npm run typecheck`, `npm run build` ve ilgili Playwright testi.
- Tarayıcı: `npm run preview -- --port 3024`; ardından `LAB_URL=http://127.0.0.1:3024/ npm run test:e2e`.
- Kaynak biçimi: `npm run format:check`. Gizli dosya/anahtar gerekmez. Diğer Okul uygulamalarını değiştirme.
