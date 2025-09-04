from playwright.sync_api import sync_playwright
import json

url_stats = "https://www.fantacalcio.it/statistiche-serie-a/2024-25/statistico"
filename = "listone_stats.json"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Vai alla pagina e aspetta che compaiano le righe
    page.goto(url_stats, timeout=60000)
    page.wait_for_selector("tr.player-row")

    giocatori = []

    rows = page.locator("tr.player-row")
    for i in range(rows.count()):
        row = rows.nth(i)
        print(f"Elaborando riga {i + 1}/{rows.count()}...")
        try:
            nome = row.locator("th.player-name span").inner_text().strip()
            squadra = row.locator("td.player-team").inner_text().strip()
            ruolo_classic = row.locator("th.player-role-classic span.role").get_attribute("data-value").strip()

            presenze = int(row.locator("td.player-match-playeds").inner_text().strip() or 0)
            media_voto = row.locator("td.player-grade-avg").inner_text().strip()
            fanta_media = row.locator("td.player-fanta-grade-avg").inner_text().strip()
            gol = int(row.locator("td[data-col-key='gol']").inner_text().strip() or 0)
            gol_subiti = int(row.locator("td[data-col-key='gs']").inner_text().strip() or 0)
            rigori_fatti = row.locator("td[data-col-key='rig']").inner_text().strip()  # es. "4 / 5"
            rigori_sbagliati = int(row.locator("td[data-col-key='rp']").inner_text().strip() or 0)
            assist = int(row.locator("td.player-assists").inner_text().strip() or 0)
            ammonizioni = int(row.locator("td.player-yellows").inner_text().strip() or 0)
            espulsioni = int(row.locator("td.player-reds").inner_text().strip() or 0)

            giocatori.append({
                "nome": nome,
                "squadra": squadra,
                "ruolo_classic": ruolo_classic,
                "presenze": presenze,
                "media_voto": media_voto,
                "fanta_media": fanta_media,
                "gol": gol,
                "gol_subiti": gol_subiti,
                "rigori_fatti": rigori_fatti,
                "rigori_sbagliati": rigori_sbagliati,
                "assist": assist,
                "ammonizioni": ammonizioni,
                "espulsioni": espulsioni
            })
        except Exception as e:
            print(f"Errore riga {i}: {e}")
            continue

    browser.close()

# Salva JSON
with open(filename, "w", encoding="utf-8") as f:
    json.dump(giocatori, f, ensure_ascii=False, indent=2)

print(f"Creato {filename} con {len(giocatori)} giocatori")
