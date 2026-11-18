# Nuance — homepage

Statische homepage voor Nuance (coaching & psychosociale begeleiding, Bilzen-Hoeselt).
Gebouwd door Solyn Global. Status: **ontwerpversie, nog niet goedgekeurd voor publicatie.**

## Structuur

| Pad | Inhoud |
| --- | --- |
| `index.html` | De volledige homepage: HTML, CSS en JavaScript in één bestand. Geen build-stap nodig. |
| `assets/` | Logo, foto's en de hero-video (`hero.mp4`, H.264, 720p, zonder geluid). |
| `design/` | Bronbestanden van het Claude Design-ontwerp (`Main.dc.html`, `canvas.json`). Alleen ter referentie; de site gebruikt ze niet. |

## Lokaal bekijken

Open `index.html` in een browser, of start een lokale server:

```bash
python3 -m http.server 8000
```

## Publiceren

De site is volledig statisch. Op Vercel: importeer de repo, framework "Other", geen build-commando, output-map de root.

## Nog te bevestigen vóór livegang

- Beroepsbenaming: de site gebruikt "coach & psychosociaal begeleider", niet "psychotherapeut".
- Kleur: het aangeleverde logo is `#83184F`, de site-accentkleur is `#68365D`.
- Prijzen in de dienstenkaarten (€ 85, € 95, € 125, intake € 75), inclusief btw-vermelding.
- Het e-mailadres `verbinding@nuance-therapie.be` is nog niet actief; er is nog geen contactformulier.
- De drie foto's in "Over mij" (`assets/over-mij-*.jpg`) wachten op akkoord van de opdrachtgever.
- Quote, kindercoaching, privacyverklaring en voorwaarden: zie de briefing.
- De sfeerfoto's (`sfeer-*`, `dienst-*`) zijn tijdelijke beelden in lage resolutie.
