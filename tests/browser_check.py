"""Real browser checks for geometry, every exposed slider, workflows, and layouts."""
from __future__ import annotations

import json
import math
import os
from pathlib import Path
import re
import subprocess
import unittest
from typing import ClassVar

from playwright.sync_api import Browser, Page, Playwright, expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "test-results"
URL = os.environ.get("LAB_URL", "http://127.0.0.1:3023/")
TABS = ["fundamentals", "vor", "adf", "ils", "dme", "propagation", "antennas", "mission", "troubleshooting", "quiz", "sandbox"]
FT_NM = 6076.11549


class BrowserChecks(unittest.TestCase):
    runtime: ClassVar[Playwright]
    browser: ClassVar[Browser]
    coverage: ClassVar[dict[str, list[str]]] = {"sliders": [], "buttons": [], "navigation": []}
    page: Page
    errors: list[str]

    @classmethod
    def setUpClass(cls) -> None:
        ARTIFACTS.mkdir(exist_ok=True)
        cls.runtime = sync_playwright().start()
        cls.browser = cls.runtime.chromium.launch(headless=True)

    @classmethod
    def tearDownClass(cls) -> None:
        if any(cls.coverage.values()):
            (ARTIFACTS / "control-coverage.json").write_text(json.dumps(cls.coverage, ensure_ascii=False, indent=2))
        cls.browser.close()
        cls.runtime.stop()

    def setUp(self) -> None:
        self.page = self.browser.new_page(viewport={"width": 1512, "height": 1080})
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.on("console", lambda message: self.errors.append(message.text) if message.type == "error" else None)
        self.page.goto(URL, wait_until="networkidle")

    def tearDown(self) -> None:
        self.assertEqual(self.errors, [], "Browser console errors")
        self.page.close()

    def go(self, tab: str) -> None:
        self.page.locator("nav button").nth(TABS.index(tab)).click()
        expect(self.page.locator("nav button[aria-current='page']")).to_have_count(1)

    def reset(self) -> None:
        self.page.get_by_role("button", name="Sıfırla", exact=True).click()

    def number(self, label: str, value: float) -> None:
        self.page.get_by_role("spinbutton", name=f"{label} değer", exact=True).fill(str(value))

    def read_number(self, label: str) -> float:
        return float(self.page.get_by_role("spinbutton", name=f"{label} değer", exact=True).input_value())

    def no_overflow(self) -> None:
        self.assertFalse(self.page.evaluate("document.documentElement.scrollWidth > innerWidth + 1"))

    def no_invalid_svg(self) -> None:
        invalid = self.page.locator("main svg").evaluate_all("els => els.flatMap(svg => [...svg.querySelectorAll('*')].flatMap(el => [...el.attributes].filter(a => /NaN|Infinity/.test(a.value)).map(a => a.value)))")
        self.assertEqual(invalid, [])

    def drag(self, testid: str, start: tuple[float, float], end: tuple[float, float], width: float, height: float) -> None:
        locator = self.page.get_by_test_id(testid)
        locator.scroll_into_view_if_needed()
        box = locator.bounding_box()
        assert box
        def point(p: tuple[float, float]) -> tuple[float, float]:
            return box["x"] + p[0] / width * box["width"], box["y"] + p[1] / height * box["height"]
        self.page.mouse.move(*point(start))
        self.page.mouse.down()
        self.page.mouse.move(*point(end), steps=12)
        self.page.mouse.up()

    def test_01_initial_desktop_and_help(self) -> None:
        expect(self.page).to_have_title("AEE 301 — Radio Navigation & ILS Virtual Lab")
        expect(self.page.get_by_test_id("cdi-needle")).to_have_count(1)
        expect(self.page.get_by_test_id("gs-needle")).to_have_count(1)
        expect(self.page.get_by_test_id("deviation-dot")).to_have_count(4)
        self.no_overflow()
        self.page.screenshot(path=str(ARTIFACTS / "ils-desktop.png"), full_page=True)
        self.page.get_by_role("button", name="Kullanım ve model bilgisi").click()
        expect(self.page.get_by_text("Laboratuvarı kullanma rehberi")).to_be_visible()
        self.page.get_by_role("button", name="Rehberi kapat").click()
        expect(self.page.get_by_text("Laboratuvarı kullanma rehberi")).to_have_count(0)

    def test_02_ils_drag_and_geometric_needle_sensing(self) -> None:
        self.drag("ils-plan", (354, 166.4), (365, 234), 850, 365)
        self.assertAlmostEqual(self.read_number("Yanal uzaklık"), .3, places=2)
        self.assertAlmostEqual(self.read_number("Yaklaşma mesafesi"), 7, places=1)
        self.assertLess(float(self.page.get_by_test_id("cdi-needle").get_attribute("x1") or 0), 140)
        self.number("Yanal uzaklık", 0)
        self.assertAlmostEqual(float(self.page.get_by_test_id("cdi-needle").get_attribute("x1") or 0), 140, places=2)
        target = (7 + .157) * FT_NM * math.tan(math.radians(3))
        self.number("İrtifa", round(target))
        self.assertAlmostEqual(float(self.page.get_by_test_id("gs-needle").get_attribute("y1") or 0), 140, delta=.2)
        self.drag("ils-profile", (365, 260-target/18), (420, 85), 850, 300)
        self.assertAlmostEqual(self.read_number("İrtifa"), 3150, delta=2)
        self.assertGreater(float(self.page.get_by_test_id("gs-needle").get_attribute("y1") or 0), 140)
        self.number("OBS / selected course", 180)
        self.assertAlmostEqual(float(self.page.get_by_test_id("cdi-needle").get_attribute("x1") or 0), 140, places=2)
        self.no_invalid_svg()

    def test_03_ils_failure_isolation_tuning_and_reset(self) -> None:
        self.page.get_by_role("button", name="GLIDESLOPE SIGNAL LOST", exact=True).click()
        expect(self.page.get_by_test_id("gs-needle")).to_have_count(0)
        expect(self.page.get_by_test_id("cdi-needle")).to_have_count(1)
        expect(self.page.locator(".source-branches .source-lost")).to_have_count(1)
        self.page.get_by_role("button", name="GLIDESLOPE SIGNAL LOST", exact=True).click()
        self.page.get_by_role("button", name="LOCALIZER SIGNAL LOST", exact=True).click()
        expect(self.page.get_by_test_id("cdi-needle")).to_have_count(0)
        expect(self.page.get_by_test_id("gs-needle")).to_have_count(1)
        self.reset()
        self.page.get_by_label("NAV frekansı", exact=True).select_option("114")
        expect(self.page.get_by_test_id("cdi-needle")).to_have_count(0)
        expect(self.page.get_by_test_id("gs-needle")).to_have_count(0)
        self.reset()
        expect(self.page.get_by_test_id("cdi-needle")).to_have_count(1)
        for fault in ["RECEIVER FAILURE", "ANTENNA FAILURE", "SIGNAL UNRELIABLE", "FALSE / UNSTABLE INDICATION", "COURSE SIGNAL ERROR"]:
            self.page.get_by_role("button", name=fault, exact=True).click()
            expect(self.page.locator(".fault-explanation")).to_have_count(1)
            self.page.get_by_role("button", name=fault, exact=True).click()
        self.page.get_by_role("button", name="ILS istasyonu açık", exact=True).click()
        expect(self.page.get_by_test_id("cdi-needle")).to_have_count(0)
        self.reset()
        expect(self.page.get_by_test_id("gs-needle")).to_have_count(1)

    def test_04_manual_approach_controls(self) -> None:
        before = self.read_number("Yaklaşma mesafesi")
        self.page.get_by_role("button", name="Yaklaşmayı başlat", exact=True).click()
        self.page.wait_for_timeout(550)
        self.page.get_by_role("button", name="Duraklat", exact=True).click()
        self.assertLess(self.read_number("Yaklaşma mesafesi"), before)
        self.page.get_by_role("button", name="Heading −2°", exact=True).click()
        self.assertEqual(self.read_number("Heading"), 358)
        self.page.get_by_role("button", name="Heading +2°", exact=True).click()
        self.assertEqual(self.read_number("Heading"), 0)
        self.page.get_by_role("button", name="Tırmanış +100", exact=True).click()
        self.assertEqual(self.read_number("Dikey hız"), -640)
        self.page.get_by_role("button", name="Alçalış −100", exact=True).click()
        self.assertEqual(self.read_number("Dikey hız"), -740)

    def test_05_vor_radial_obs_heading_drag_experiments(self) -> None:
        self.go("vor")
        self.reset()
        expect(self.page.get_by_test_id("radial")).to_have_text("090°")
        expect(self.page.get_by_test_id("vor-flag")).to_have_text("TO")
        expect(self.page.get_by_test_id("deviation-dot")).to_have_count(10)
        self.number("OBS / course", 90)
        expect(self.page.get_by_test_id("vor-flag")).to_have_text("FROM")
        before = self.page.get_by_test_id("cdi-needle").get_attribute("x1")
        self.number("Uçak heading", 232)
        self.assertEqual(before, self.page.get_by_test_id("cdi-needle").get_attribute("x1"))
        self.number("Uçak radial", 270)
        self.page.get_by_role("button", name="Deneyimi kontrol et").click()
        expect(self.page.get_by_role("status")).to_contain_text("Doğru")
        self.page.get_by_role("button", name="Adım adım", exact=True).click()
        expect(self.page.locator(".steps li")).to_have_count(5)
        self.page.get_by_role("button", name="CDI açıkla", exact=True).click()
        self.page.get_by_role("button", name="TO/FROM açıkla", exact=True).click()
        self.drag("nav-map", (256, 235), (400, 145), 800, 470)
        expect(self.page.get_by_test_id("radial")).to_have_text("000°")
        self.number("Uçak radial", 359)
        self.page.get_by_role("slider", name="Uçak radial", exact=True).focus()
        self.page.keyboard.press("Home")
        expect(self.page.get_by_test_id("radial")).to_have_text("000°")
        self.page.get_by_role("button", name="VOR istasyonu açık", exact=True).click()
        expect(self.page.get_by_test_id("vor-flag")).to_have_text("OFF")
        self.page.screenshot(path=str(ARTIFACTS / "vor-desktop.png"), full_page=True)

    def test_06_adf_heading_freeze_loss_and_geometry(self) -> None:
        self.go("adf")
        mb = self.page.get_by_test_id("adf-mb").inner_text()
        rb = int(self.page.get_by_test_id("adf-rb").inner_text().replace("°", ""))
        self.page.get_by_role("button", name="Uçağı yerinde +90° döndür").click()
        expect(self.page.get_by_test_id("adf-mb")).to_have_text(mb)
        rb_after = int(self.page.get_by_test_id("adf-rb").inner_text().replace("°", ""))
        self.assertEqual((rb_after-rb) % 360, 270)
        self.page.get_by_role("button", name="NEEDLE FROZEN", exact=True).click()
        frozen = self.page.get_by_test_id("adf-needle").get_attribute("x2")
        self.number("ADF uçak heading", 310)
        self.assertEqual(frozen, self.page.get_by_test_id("adf-needle").get_attribute("x2"))
        self.page.get_by_role("button", name="NEEDLE FROZEN", exact=True).click()
        self.assertNotEqual(frozen, self.page.get_by_test_id("adf-needle").get_attribute("x2"))
        self.page.get_by_label("ADF frekansı", exact=True).select_option("400")
        expect(self.page.get_by_test_id("adf-needle")).to_have_count(0)
        self.page.get_by_label("ADF frekansı", exact=True).select_option("365")
        for fault in ["WEAK ADF SIGNAL", "ELECTRICAL INTERFERENCE", "ADF RECEIVER FAILURE", "ANTENNA FAILURE"]:
            self.page.get_by_role("button", name=fault, exact=True).click()
            expect(self.page.locator(".fault-explanation")).to_have_count(1)
            self.page.get_by_role("button", name=fault, exact=True).click()
        self.page.get_by_role("button", name="NDB istasyonu açık", exact=True).click()
        expect(self.page.get_by_test_id("adf-needle")).to_have_count(0)

    def test_07_dme_prediction_and_fault(self) -> None:
        self.go("dme")
        self.reset()
        expect(self.page.get_by_test_id("dme-range")).to_have_text("1.65")
        self.page.get_by_role("button", name="Tahmin için ölçümü gizle").click()
        expect(self.page.get_by_test_id("dme-range")).to_have_text("?.??")
        self.page.get_by_label("DME tahmini", exact=True).fill("1.65")
        self.page.get_by_role("button", name="Tahmini kontrol et", exact=True).click()
        expect(self.page.get_by_role("status")).to_contain_text("Doğru")
        self.page.get_by_role("button", name="DME yanıtı açık", exact=True).click()
        expect(self.page.get_by_test_id("dme-range")).to_have_text("—.—")
        self.number("DME irtifa farkı", 30000)
        self.no_invalid_svg()

    def test_08_propagation_and_comparison(self) -> None:
        self.go("propagation")
        original = float(self.page.get_by_test_id("vhf-horizon").inner_text().replace("NM", ""))
        self.number("VHF uçak irtifası", 40000)
        increased = float(self.page.get_by_test_id("vhf-horizon").inner_text().replace("NM", ""))
        self.assertGreater(increased, original)
        self.number("Orta noktadaki arazi engeli", 10000)
        self.number("VHF uçak irtifası", 1000)
        expect(self.page.locator(".status").first).to_have_text("BLOCKED")
        for scenario, answer in [("Terminal sahası", "VHF"), ("Yüksek irtifa enroute", "VHF"), ("Uzak okyanus", "HF"), ("Dağın arkasında alçak uçuş", "Bağlantı garanti değil")]:
            self.page.get_by_role("button", name=scenario, exact=True).click()
            self.page.locator(".choice-grid").get_by_role("button", name=answer, exact=True).click()
            expect(self.page.get_by_role("status")).to_contain_text("Doğru")
        self.page.screenshot(path=str(ARTIFACTS / "propagation-desktop.png"), full_page=True)

    def test_09_all_signal_chain_components(self) -> None:
        self.go("fundamentals")
        for system in ["VOR", "ILS", "ADF", "DME"]:
            self.page.get_by_role("button", name=system, exact=True).click()
            for i in range(5):
                self.page.locator(".chain-node").nth(i).click()
                self.page.get_by_role("button", name="Bileşen açık", exact=True).click()
                expect(self.page.locator(".chain-node.lost")).to_have_count(5-i)
                self.page.get_by_role("button", name="Bileşen açık", exact=True).click()
                expect(self.page.locator(".chain-node.lost")).to_have_count(0)
            self.page.get_by_role("button", name="Trace Signal", exact=True).click()
            expect(self.page.locator(".signal-chain")).to_have_class(re.compile("tracing"))
        for button in self.page.locator(".glossary button").all():
            text = button.inner_text()
            button.click()
            expect(self.page.locator(".concept-card h3")).to_have_text(text)

    def test_10_antennas_click_keyboard_and_polarization(self) -> None:
        self.go("antennas")
        for name in ["VHF COM", "VOR / LOC", "ADF", "DME", "HF"]:
            self.page.get_by_role("button", name=f"{name} antenini seç", exact=True).click()
            expect(self.page.locator(".mint-icon").locator("..").locator("h2")).to_have_text(name)
        self.number("Polarizasyon uyumsuzluğu", 90)
        expect(self.page.locator(".metric strong")).to_have_text("0%")
        self.page.get_by_role("button", name="VHF COM antenini seç", exact=True).focus()
        self.page.keyboard.press("Enter")
        expect(self.page.locator(".mint-icon").locator("..").locator("h2")).to_have_text("VHF COM")

    def test_11_all_diagnosis_cases_require_inspection(self) -> None:
        self.go("troubleshooting")
        answers = ["Yanlış NAV frekansı", "ADF gösterge arızası", "DME yer transponder arızası", "GS verici kaybı", "RF girişimi / çok yollu alım", "Arazi engeli", "Ortak NAV receiver arızası"]
        for i, answer in enumerate(answers):
            self.page.locator(".case-nav button").nth(i).click()
            expect(self.page.locator(".answer-feedback")).to_have_count(0)
            expect(self.page.get_by_role("button", name="Teşhisi gönder")).to_be_disabled()
            for button in self.page.locator(".inspection-grid button").all():
                button.click()
            self.page.get_by_label(answer, exact=True).check()
            self.page.get_by_role("button", name="Teşhisi gönder").click()
            expect(self.page.get_by_role("status")).to_contain_text("Teşhis doğru")
            expect(self.page.locator(".steps li")).to_have_count(3)

    def test_12_quiz_answer_gate_scoring_persistence_reset(self) -> None:
        self.go("quiz")
        expect(self.page.locator(".answer-feedback")).to_have_count(0)
        expect(self.page.get_by_role("button", name="Cevabı gönder")).to_be_disabled()
        self.page.get_by_label("Sayısal cevap").fill("90")
        self.page.get_by_role("button", name="Cevabı gönder").click()
        expect(self.page.get_by_role("status")).to_contain_text("Doğru cevap")
        self.page.get_by_role("button", name="Sonraki", exact=True).click()
        self.page.get_by_label("Sayısal cevap").fill("10")
        self.page.get_by_role("button", name="Cevabı gönder").click()
        expect(self.page.get_by_role("status")).to_contain_text("Bu kez olmadı")
        self.page.get_by_role("button", name="Soru 3", exact=True).click()
        self.page.get_by_label("FROM", exact=True).check()
        self.page.get_by_role("button", name="Cevabı gönder").click()
        expect(self.page.locator(".quiz-metrics .metric strong").nth(0)).to_have_text("2")
        expect(self.page.locator(".quiz-metrics .metric strong").nth(1)).to_have_text("1")
        self.page.reload(wait_until="networkidle")
        expect(self.page.locator(".quiz-metrics .metric strong").nth(3)).to_have_text("3 / 36")
        self.page.get_by_role("button", name="Sınavı sıfırla").click()
        expect(self.page.locator(".quiz-metrics .metric strong").nth(3)).to_have_text("0 / 36")

    def test_13_full_integrated_mission_via_user_controls(self) -> None:
        self.go("mission")
        self.page.get_by_role("button", name="Görevi başlat", exact=True).click()
        verify = self.page.get_by_role("button", name="Aşamayı doğrula", exact=True)
        verify.click()
        expect(self.page.get_by_role("status")).to_contain_text("henüz")
        self.page.get_by_label("NAV frekansı", exact=True).first.select_option("113.6")
        verify.click()
        radial = (math.degrees(math.atan2(-3, -6)) + 360) % 360
        self.page.get_by_label("Görev radial cevabı", exact=True).fill(str(radial))
        verify.click()
        self.number("Uçak doğu / batı", -6)
        self.number("Uçak kuzey / güney", -18)
        self.number("Ortak OBS", 0)
        verify.click()
        self.page.get_by_label("Görev DME cevabı", exact=True).fill(str(math.hypot(6, 2800/FT_NM)))
        verify.click()
        self.number("Uçak doğu / batı", 0)
        self.number("Uçak kuzey / güney", -7)
        verify.click()
        self.page.get_by_label("NAV frekansı", exact=True).first.select_option("110.3")
        verify.click()
        verify.click()
        self.number("Ortak irtifa", round((7+.157)*FT_NM*math.tan(math.radians(3))))
        verify.click()
        self.number("Heading", 0)
        self.number("Dikey hız", -740)
        self.page.get_by_role("button", name="Yaklaşmayı başlat", exact=True).click()
        self.page.wait_for_timeout(5400)
        verify.click()
        expect(self.page.locator(".mission-success")).to_contain_text("Görev tamamlandı")
        expect(self.page.locator(".mission-checklist .complete")).to_have_count(9)

    def test_14_every_slider_keyboard_endpoints_and_every_section(self) -> None:
        for tab in TABS:
            self.go(tab)
            self.reset()
            if tab == "mission":
                self.page.get_by_role("button", name="Görevi başlat", exact=True).click()
            self.coverage["navigation"].append(tab)
            labels = self.page.locator(".lab-content input[type=range]").evaluate_all("els => els.map(e => e.getAttribute('aria-label'))")
            for label in labels:
                slider = self.page.get_by_role("slider", name=label, exact=True)
                initial_value = slider.input_value()
                slider.focus()
                self.page.keyboard.press("Home")
                self.assertAlmostEqual(float(slider.input_value()), float(slider.get_attribute("min") or "0"), places=2)
                self.page.keyboard.press("End")
                self.assertAlmostEqual(float(slider.input_value()), float(slider.get_attribute("max") or "0"), places=2)
                self.number(label, float(initial_value))
                self.no_invalid_svg()
                self.coverage["sliders"].append(f"{tab}: {label}")
            self.no_overflow()

    def test_15_button_audit_and_svg_station_drag(self) -> None:
        for tab in ["fundamentals", "vor", "adf", "ils", "dme", "propagation", "antennas", "sandbox"]:
            self.go(tab)
            self.reset()
            buttons = self.page.locator(".lab-content button").all()
            for button in buttons:
                if not button.is_visible() or not button.is_enabled():
                    continue
                name = button.inner_text().strip()
                if name in {"Tahmini kontrol et"}:
                    continue
                try:
                    button.click(timeout=2500)
                    self.coverage["buttons"].append(f"{tab}: {name}")
                    if button.get_attribute("aria-pressed") is not None:
                        button.click(timeout=2500)
                    if any(text in name.lower() for text in ["başlat", "durdur", "duraklat"]):
                        # Stop the same functional flight button after checking its transition.
                        if button.is_visible():
                            button.click(timeout=2500)
                except Exception as error:
                    self.fail(f"Button {tab}: {name}: {error}")
            self.no_invalid_svg()
        self.go("sandbox")
        self.reset()
        before = self.read_number("VOR doğu / batı")
        self.drag("nav-map", (322, 313), (360, 295), 800, 470)
        self.assertNotEqual(self.read_number("VOR doğu / batı"), before)

    def test_16_mobile_all_pages_reduced_motion_and_menu(self) -> None:
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.page.emulate_media(reduced_motion="reduce")
        for tab in TABS:
            self.page.get_by_role("button", name="Menüyü aç").click()
            self.go(tab)
            self.no_overflow()
            expect(self.page.locator("h1")).to_be_visible()
            expect(self.page.locator(".sidebar")).not_to_have_class(re.compile("open"))
        self.page.get_by_role("button", name="Menüyü aç").click()
        self.go("ils")
        self.reset()
        self.page.screenshot(path=str(ARTIFACTS / "ils-mobile.png"), full_page=True)
        self.drag("ils-plan", (354, 166.4), (400, 215), 850, 365)
        self.assertGreater(self.read_number("Yanal uzaklık"), 0)
        self.page.set_viewport_size({"width": 360, "height": 800})
        self.no_overflow()

    def test_17_complete_all_36_questions_and_topic_tracking(self) -> None:
        fixtures = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", "import {questions} from './src/content.ts'; process.stdout.write(JSON.stringify(questions));"], cwd=ROOT, text=True))
        self.go("quiz")
        for i, question in enumerate(fixtures):
            self.page.get_by_role("button", name=f"Soru {i+1}", exact=True).click()
            expect(self.page.locator(".answer-feedback")).to_have_count(0)
            if "options" in question:
                self.page.get_by_role("radio", name=question["answer"], exact=True).check()
            else:
                self.page.get_by_label("Sayısal cevap").fill(question["answer"])
            self.page.get_by_role("button", name="Cevabı gönder", exact=True).click()
            expect(self.page.get_by_role("status")).to_contain_text("Doğru cevap")
        expect(self.page.locator(".quiz-metrics .metric strong").nth(0)).to_have_text("36")
        expect(self.page.locator(".quiz-metrics .metric strong").nth(2)).to_have_text("100%")
        expect(self.page.locator(".question-map .correct")).to_have_count(36)
        expect(self.page.get_by_text("VOR · ADF · DME · ILS · Yayılım · Sinyal · Anten · Teşhis", exact=True)).to_be_visible()
        self.page.get_by_role("button", name="Önceki", exact=True).click()
        self.page.get_by_role("button", name="Laboratuvarda incele", exact=True).click()
        expect(self.page.locator("h1")).to_contain_text("Yaklaşmayı gör")


if __name__ == "__main__":
    unittest.main(verbosity=2)
