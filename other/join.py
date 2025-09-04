import json

# File di input
file_quotazioni = "listone.json"
file_statistiche = "listone_stats.json"
file_output = "listone_unito.json"

# Carica file JSON
with open(file_quotazioni, "r", encoding="utf-8") as f:
    quotazioni = json.load(f)

with open(file_statistiche, "r", encoding="utf-8") as f:
    statistiche = json.load(f)

# Crea dizionario per ricerca veloce (nome + squadra)
statistiche_dict = {
    (g["nome"].strip().lower(), g["squadra"].strip().lower()): g
    for g in statistiche
}

# Statistiche di default (tutto a 0)
stat_default = {
    "presenze": 0,
    "media_voto": "0,00",
    "fanta_media": "0,00",
    "gol": 0,
    "gol_subiti": 0,
    "rigori_fatti": "0 / 0",
    "rigori_sbagliati": 0,
    "assist": 0,
    "ammonizioni": 0,
    "espulsioni": 0
}

# Lista unita
giocatori_uniti = []

for g in quotazioni:
    key = (g["nome"].strip().lower(), g["squadra"].strip().lower())
    if key in statistiche_dict:
        dati_stat = statistiche_dict[key]
        merged = {**g, **{k: dati_stat[k] for k in stat_default}}
    else:
        merged = {**g, **stat_default}
    giocatori_uniti.append(merged)

# Salva risultato
with open(file_output, "w", encoding="utf-8") as f:
    json.dump(giocatori_uniti, f, ensure_ascii=False, indent=2)

print(f"Creato {file_output} con {len(giocatori_uniti)} giocatori.")
