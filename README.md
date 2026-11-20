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

## Beheerpagina (`admin.html`)

Een eenvoudige "achterkant" waarin de klant alle teksten en foto's kan aanpassen, zonder server of database.

- Openen: `/admin.html`, toegangscode `nuance`. Dit is geen echte beveiliging: de code houdt alleen toevallige bezoekers weg. De pagina staat niet in Google (`noindex` en `robots.txt`).
- Teksten: rechtstreeks in de website klikken en typen. Diensten, waarden en de foto's bij "Over mij" hebben elk een eigen tabblad met velden.
- Foto's: tabblad Foto's, per foto "Vervang". Foto's worden in de browser verkleind (max. 1800 px, JPEG).
- Werkt op telefoon als app: onderaan een tabbalk (Teksten, Foto's, Lijsten, Versturen), panelen schuiven omhoog. Installeerbaar via Chrome ("App installeren" / "Toevoegen aan startscherm") en op iPhone via Safari ("Zet op beginscherm"), dankzij `admin.webmanifest`, `admin-sw.js` en de iconen `assets/app-*.png`.
- Wijzigingen blijven op het toestel van de klant (localStorage) en gaan **niet** vanzelf online. Met "Versturen" deelt de klant een bestand `nuance-wijzigingen.txt` (via WhatsApp, mail, ...) of downloadt ze `content.js`. De inhoud van beide is dezelfde: hernoem het `.txt`-bestand naar `content.js`.
- Online zetten: het ontvangen `content.js` nakijken en in de root van deze repo vervangen. `index.html` laadt dat bestand en past de wijzigingen toe. Een leeg `content.js` (`window.NUANCE_CONTENT = {};`) is de site zoals ontworpen.
- Let op: teksten zijn gekoppeld aan hun oorspronkelijke tekst. Wordt een tekst later in het ontwerp zelf veranderd, dan geldt een oude aanpassing voor die tekst niet meer.

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
