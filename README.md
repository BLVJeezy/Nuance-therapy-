# Nuance — homepage

Statische homepage voor Nuance (coaching & psychosociale begeleiding, Bilzen-Hoeselt).
Gebouwd door Solyn Global. Status: **ontwerpversie, nog niet goedgekeurd voor publicatie.**

## Ontwerp

Opgebouwd volgens het door de opdrachtgever gekozen moodboard:

- Kleuren: donker aubergine `#3E2A35`, gedempt mauve `#664B57`, warm taupe `#A58572`, licht zand `#D6C3B2`, ivoor `#EAE3DA`.
- Typografie: Playfair Display (koppen) en Inter (tekst en knoppen), geladen via Google Fonts.

## Structuur

| Pad | Inhoud |
| --- | --- |
| `index.html` | De volledige homepage: HTML, CSS en JavaScript in één bestand. Geen build-stap nodig. |
| `assets/` | Logo (licht, voor de donkere achtergrond), foto's, de hero-video (`hero.mp4`, H.264, zonder geluid) en de beeldreeks die afspeelt als een browser de video weigert (`hero-frames-*.jpg`). |
| `admin.html` | Beheerpagina om teksten en foto's aan te passen (zie hieronder). |
| `content.js` | Wijzigingen uit de beheerpagina. Leeg = de site zoals ontworpen. |
| `design/` | Bronbestanden van het Claude Design-ontwerp (`Main.dc.html`, `canvas.json`). Alleen ter referentie; de site gebruikt ze niet. |

## Lokaal bekijken

Open `index.html` in een browser, of start een lokale server:

```bash
python3 -m http.server 8000
```

## Publiceren

De site is volledig statisch. Op Vercel: importeer de repo, framework "Other", geen build-commando, output-map de root.

## Beheerpagina (`admin.html`) en live publiceren

- Openen: `/admin.html`. De toegangscode staat niet in deze repo; alleen de sha256-hash staat in `api/_lib.js` en `admin.html`. Vraag de code aan Solyn.
- Teksten rechtstreeks in de site typen, opmaakbalk (lettertype, grootte, uitlijning), foto's vervangen en uitsnede kiezen, lijsten (diensten, waarden, Over mij), homepage en FAQ.
- Concepten worden bewaard op het toestel (IndexedDB). **Publiceren** zet ze live:
  - foto's gaan eerst naar `api/upload` (Vercel Blob, `nuance/img/…`),
  - daarna gaat alles naar `api/publish` → `nuance/content.json` + een kopie in `nuance/history/`,
  - `index.html` en `faq.html` laden `api/content` (CDN-cache 20 s), dus binnen ongeveer een halve minuut is het overal zichtbaar, zonder nieuwe deploy.
- **Eerdere versies**: in het tabblad Publiceren kan elke vorige versie teruggezet worden (`api/history`).
- Vereist: een **Vercel Blob store gekoppeld aan dit project** (zet `BLOB_READ_WRITE_TOKEN`), daarna één keer opnieuw deployen. Zonder store meldt het beheer dat publiceren nog niet ingeschakeld is.
- `content.js` blijft het statische vertrekpunt (leeg = het ontwerp); gepubliceerde wijzigingen uit Blob gaan daarboven.

## FAQ-pagina, opmaak en fotobescherming

- `faq.html`: veelgestelde vragen (14 vragen in 4 groepen) met FAQPage-schema voor Google. Gebouwd door `build_faq.py` met dezelfde kop en voet als de homepage; ook aanpasbaar in het beheer (knop Home / FAQ bovenaan).
- Beheer: bij een tekst verschijnt een opmaakbalk (lettertype sierlijk/strak, kleiner/groter, links/midden/rechts, standaard). Bij foto's kies je de uitsnede (midden, boven, onder, links, rechts). Bewaard als `style` en `imgpos` in `content.js`.
- Foto's kunnen niet met rechtsklik of lang indrukken bewaard of versleept worden, en knijpen/dubbeltikken om in te zoomen is uitgeschakeld (`assets/site-extra.js`). Een schermafbeelding blijft altijd mogelijk.

## Nog te bevestigen vóór livegang

- Beroepsbenaming: de site gebruikt "coach & psychosociaal begeleider", niet "psychotherapeut".
- Logo: de site gebruikt een ivoorkleurige versie van het aangeleverde logo (zelfde vorm, andere kleur). Het origineel is `#83184F`.
- Prijzen in de dienstenkaarten (€ 85, € 95, € 125, intake € 75), inclusief btw-vermelding.
- Het e-mailadres `verbinding@nuance-therapie.be` is nog niet actief. Het contactformulier heeft geen server: het opent het e-mailprogramma van de bezoeker met het bericht ingevuld. Voor livegang is een formulierdienst of eigen verwerking nodig.
- De drie foto's in "Over mij" (`assets/over-mij-*.jpg`) wachten op akkoord van de opdrachtgever.
- Quote, kindercoaching, privacyverklaring en voorwaarden: zie de briefing.
- De sfeerfoto's (`dienst-*`, `praktijk-*`, `werkwijze-*`, `contact-*`) zijn uitsneden uit het moodboard, vergroot vanaf ongeveer 380 pixels breed. Voor livegang zijn de originele foto's in hoge resolutie nodig.
