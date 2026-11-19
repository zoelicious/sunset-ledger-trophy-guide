"""Take the 4 entry screenshots of Sunset Ledger (1280x800 JPEG, real renders).
Run while `node serve.ts` serves app/ on http://localhost:8080:
    python3 take-shots.py
Seeds 13 earned trophies through the app's own localStorage key, so the
dashboard ring, the grade bars and the category bars show live progress,
and seeds the Positive Mental Attitude counter at 6/18 for the stepper shot.
Shots: (1) dashboard, (2) Missables tab, (3) Progress & export tab,
(4) detail panel with the counter stepper (Roadmap order on).
"""
import json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8080"
OUT = "screenshots"
KEY = "sunset-ledger-progress-v1"
# 13 earned: the opening story run plus a few early activities and crimes.
EARNED_IDS = [2, 3, 4, 5, 8, 10, 15, 16, 21, 33, 35, 46, 52]

with open("app/data/trophies.json", encoding="utf-8") as f:
    trophies = json.load(f)["trophies"]
earned_names = [t["name"] for t in trophies if t["id"] in EARNED_IDS]

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/home/hatch/.cache/ms-playwright/chromium-1148/chrome-linux/chrome")
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.add_init_script(
        "localStorage.setItem(%s, %s)"
        % (json.dumps(KEY), json.dumps(json.dumps(earned_names)))
    )
    # Seed the PMA counter at 6/18 so shot 4 shows the stepper mid-progress.
    page.add_init_script(
        "localStorage.setItem(%s, %s)"
        % (json.dumps("sunset-ledger-counters-v1"), json.dumps(json.dumps([[28, 6]])))
    )
    page.goto(BASE + "/", wait_until="networkidle")
    page.wait_for_timeout(400)

    # 1. Cover: dashboard ring + missable banner + live checklist cards.
    page.screenshot(path=f"{OUT}/1-dashboard.jpg", type="jpeg", quality=80)

    # 2. Missables tab: the 3 point-of-no-return cards + 2 warning boxes.
    # Scroll the section heading into view so the cards fill the frame.
    page.click("#tab-missables")
    page.wait_for_timeout(300)
    page.evaluate("document.querySelector('#view-missables h2').scrollIntoView()")
    page.wait_for_timeout(200)
    page.screenshot(path=f"{OUT}/2-missables.jpg", type="jpeg", quality=80)

    # 3. Progress & export tab: PSN points, earned-by-grade/kind, stage grid,
    # backup metadata. Scroll the heading in so the PSN box + bars are shown.
    page.click("#tab-progress")
    page.wait_for_timeout(300)
    page.evaluate("document.querySelector('#view-progress h2').scrollIntoView()")
    page.wait_for_timeout(200)
    page.screenshot(path=f"{OUT}/3-progress.jpg", type="jpeg", quality=80)

    # 4. Detail panel with the counter stepper: Roadmap order on, then open
    # Positive Mental Attitude (counter seeded 6/18) so the shot shows both
    # the stage grouping and the stepper.
    page.click("#tab-tracker")
    page.wait_for_timeout(200)
    page.select_option("#order", "roadmap")
    page.wait_for_timeout(300)
    page.evaluate("window.scrollTo(0, 0)")
    page.locator("article.card", has_text="Positive Mental Attitude").first.click()
    page.wait_for_timeout(300)
    # Tap the stepper + then - so the shot shows the save stamp (a real
    # counter write) while the counter ends back at the seeded 6/18.
    page.locator(".stepper button", has_text="+").click()
    page.wait_for_timeout(200)
    page.locator(".stepper button", has_text="−").click()
    page.wait_for_timeout(300)
    page.screenshot(path=f"{OUT}/4-detail-stepper.jpg", type="jpeg", quality=80)
    browser.close()

print("shots done")
