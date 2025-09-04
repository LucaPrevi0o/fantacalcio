from playwright.sync_api import sync_playwright
import json
import tkinter as tk
from tkinter import ttk

url = "https://www.fantacalcio.it/quotazioni-fantacalcio"
filename = "listone.json"

with sync_playwright() as p:

    # Avvia browser headless
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Vai alla pagina
    page.goto(url)
    page.wait_for_selector("tr.player-row")  # aspetta la tabella

    # Trova tutte le righe giocatore
    rows = page.query_selector_all("tr.player-row")

    giocatori = []

    for idx, row in enumerate(rows, start=1):
        print(f"Elaborando riga {idx}/{len(rows)}")
        try:
            nome = row.query_selector("th.player-name span").inner_text().strip()
            squadra = row.query_selector("td.player-team").inner_text().strip()
            ruolo = row.query_selector("th.player-role.player-role-classic span.role").get_attribute("data-value").strip()
            quot_ini = int(row.query_selector("td.player-classic-initial-price").inner_text().strip())
            quot_att = int(row.query_selector("td.player-classic-current-price").inner_text().strip())
            fvm = int(row.query_selector("td.player-classic-fvm").inner_text().strip())

            giocatori.append({
                "nome": nome,
                "squadra": squadra,
                "ruolo_classic": ruolo,
                "quot_ini": quot_ini,
                "quot_att": quot_att,
                "fvm": fvm
            })
        except AttributeError:
            print(f"Errore nell'elaborazione della riga {idx}.")
            continue

    browser.close()

with open(filename, "w", encoding="utf-8") as f:
    json.dump(giocatori, f, ensure_ascii=False, indent=2)

print(f"Salvati {len(giocatori)} giocatori in {filename}.")
