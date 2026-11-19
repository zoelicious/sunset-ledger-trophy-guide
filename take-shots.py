"""Take the 4 entry screenshots of Sunset Ledger (1280x800 JPEG, real renders).
Run while `node serve.ts` serves app/ on http://localhost:8080:
    python3 take-shots.py
Seeds 13 earned trophies through the app's own localStorage key, so the
dashboard ring, the grade bars and the category bars show live progress.
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
    page.goto(BASE + "/", wait_until="networkidle")
    page.wait_for_timeout(400)

    # 1. Cover: dashboard ring + missable banner + live checklist cards.
    page.screenshot(path=f"{OUT}/1-dashboard.jpg", type="jpeg", quality=80)

    # 2. Roadmap: the 8-phase vertical timeline.
    page.click("#tab-roadmap")
    page.wait_for_timeout(300)
    page.evaluate("document.querySelector('#view-roadmap h2').scrollIntoView()")
    page.wait_for_timeout(200)
    page.screenshot(path=f"{OUT}/2-roadmap.jpg", type="jpeg", quality=80)

    # 3. Detail panel: open the missable trophy's guide.
    page.click("#tab-tracker")
    page.wait_for_timeout(200)
    page.evaluate("window.scrollTo(0, 0)")
    page.locator("article.card", has_text="Positive Mental Attitude").first.click()
    page.wait_for_timeout(300)
    page.screenshot(path=f"{OUT}/3-detail.jpg", type="jpeg", quality=80)

    # 4. Spoiler mode on: story trophies masked as "Hidden story trophy".
    # Scroll to the Story group so the masked cards are what the shot shows.
    page.check("#spoiler")
    page.wait_for_timeout(300)
    page.evaluate("window.scrollTo(0, 0)")
    page.evaluate("[...document.querySelectorAll('h3.cat-head')].find(h => h.textContent.includes('Story')).scrollIntoView({block: 'start'})")
    page.evaluate("window.scrollBy(0, -10)")
    page.wait_for_timeout(200)
    page.screenshot(path=f"{OUT}/4-spoiler.jpg", type="jpeg", quality=80)
    browser.close()

print("shots done")
