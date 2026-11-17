# Scam sources for Europe (researched 2026-11-16)

This covers public pages only.

**How sure each item is:**
- **[V]** the page, feed or licence was loaded during the research.
- **[S]** it came from search results or press coverage.
- **[U]** it's unverified or from prior knowledge. Check it before relying on it.

**Sites that block automated requests:** several official sites refused them with a 403: politie.nl, safeonweb.be,
watchlist-internet.at, actionfraud, astynomia.gr, dnsc.ro, bportugal.pt, and the Lithuanian and Finnish police.
commissariatodips.it blocks scripts, and Cybermalveillance's Atom feed sits behind a bot wall. An importer needs a
normal client, or a person, to read them.

## Key findings

1. **The matcher deletes much of Europe's text.** `normalize()` keeps only `[a-z0-9$ñ]`, so:
   - Greek and Cyrillic (el, bg, uk, mk, sr-Cyrl) become empty strings;
   - ß, ø, æ, ł, đ, ı and € are dropped.

   Fix this first (see "Matcher changes").
2. **Few sources have an open licence:**
   - FR, Cybermalveillance: **Etalab Licence Ouverte 2.0** [V].
   - NL, NCSC.nl: **CC0** [V].
   - UK, NCSC: **OGL v3** [S]. The FCA's general information is OGL [V].
   - CZ, CSIRT.CZ: **CC BY-SA 3.0** [V].
   - European Commission websites: **CC BY 4.0** [V].
   - EBA, ESMA and ENISA allow reproduction if the source is credited [V/S].
3. **Some are explicitly restrictive:**
   - Polizei-Beratung.de: all rights reserved, and it objects to scraping [V].
   - Swiss federal sites (admin.ch): written consent needed [V].
   - Polizia di Stato: CC BY-NC-ND [V].
   - Europol: private use only [V].
   - SK-CERT: all rights reserved [V].

   For these we cite facts and write our own text, which is how scamdb already works.
4. **gb already uses "Report Fraud (formerly Action Fraud)"**, which replaced Action Fraud on 4 Dec 2025 [S].

## Countries

| Country | Languages | Best official warning source(s) and feeds | Where to report | Licence |
|---|---|---|---|---|
| AT | de | Watchlist Internet (ÖIAT) [S]; BKA RSS [V]; CERT.at feeds [V]; BMF phishing warnings [S] | BKA against-cybercrime@bmi.gv.at [S]; police 133/112 | © ÖIAT [U] |
| BE | nl, fr, de | Safeonweb (CCB) [S]; FSMA warnings, RSS [V] | Forward to suspicious@safeonweb.be (also verdacht@, suspect@) [S]; meldpunt.belgie.be [U] | Unknown |
| BG | bg | CERT Bulgaria govcert.bg /feed/ [V]; ГДБОП [S] | 112; ГДБОП cybercrime [U] | © [V] |
| HR | hr | CERT.hr /feed/ [V]; police [S]; HANFA RSS [V] | 192 | © CARNET [V] |
| CY | el, en | Cyprus Police cybercrime unit [S]; CySEC [U] | Police cybercrime unit; 112 | Unknown |
| CZ | cs | Police "Zastav. Zavěs. Zkontroluj." [S]; NÚKIB; CSIRT.CZ [V]; ČNB RSS [V] | 158 | **CC BY-SA 3.0 (CSIRT.CZ)** |
| DK | da | politi.dk RSS page [V]; sikkerdigital.dk [U] | 114 / politi.dk | Unknown |
| EE | et, ru | RIA RSS [V]; police [S]; Eesti Pank [S] | 112; cert@cert.ee [U] | Unknown |
| FI | fi, sv | NCSC-FI (Traficom) weekly reviews, RSS [V] | Police online report [U] | © Traficom; §9 exemption for authority statements [U] |
| FR | fr | **Cybermalveillance.gouv.fr** Atom feeds [V] (bot wall); AMF and ACPR blacklists [U] | **17Cyber.gouv.fr** [S]; **33700** for spam SMS [S]; Perceval for card fraud [S] | **Licence Ouverte 2.0** |
| DE | de | **Polizei-Beratung.de** (no feed) [V]; **Verbraucherzentrale Phishing-Radar** [V]; BSI RSS [V]; BaFin [U] | State online police stations [S]; 110 | **All rights reserved** (Polizei-Beratung) |
| GR | el | Hellenic Police Cyber Crime Division (403); ELTA and AADE warnings [S] | 11188 [U]; 112 | Unknown |
| HU | hu | police.hu RSS [V]; NKI RSS [V] | 112 | Unknown |
| IS | is | Police news on island.is [S]; CERT-IS [U] | island.is form; 112 | Unknown |
| IE | en, ga | **FraudSMART** (BPFI) [S]; Garda [V]; CCPC; Central Bank [U] | Garda; your bank | © [U] |
| IT | it | **Polizia Postale** (commissariatodips.it) [V]; CONSOB [V]; CERT-AgID [U] | commissariatodips.it reports; formal complaint (denuncia) at Polizia or Carabinieri; 112 | **CC BY-NC-ND** |
| LV | lv, ru | **CERT.LV** RSS/Atom/JSON [V] | 112/110; cert@cert.lv [U] | Unknown |
| LI | de | Landespolizei; FMA [U] | 117 | Unknown |
| LT | lt | NKSC; Bank of Lithuania [S] | **epolicija.lt**, cert@nksc.lt [S] | Unknown |
| LU | lb, fr, de | Police press releases [S]; CIRCL RSS [V]; CSSF RSS [V] | 113; BEE SECURE Stopline [U] | Unknown |
| MT | mt, en | **scamalert.mt** (MFSA, Police, Arbiter; launched Aug 2026) [S] | 112; police; scamalert.mt | Unknown |
| NL | nl | **Fraudehelpdesk alerts RSS** (fraudehelpdesk.nl/feed/?post_type=alert) [V]; NCSC.nl; AFM RSS [V] | **Fraudehelpdesk 088-786 73 72** [S]; politie.nl online report | **CC0 (NCSC.nl)** |
| NO | nb, nn | NSM RSS [V]; politiet.no [S]; Nettvett [U] | 02800 / politiet.no [S]; 112 | NLOD for data [U] |
| PL | pl | CERT Polska [V]; **open scam-domain list hole.cert.pl** [V]; KNF [V] | **Forward SMS to 8080** [S]; incydent.cert.pl [S]; 112 | Official materials exempt [U] |
| PT | pt | PJ and PSP alerts [S]; CNCS [U]; Banco de Portugal (403) | Queixa Eletrónica [S]; PSP / GNR / PJ | Unknown |
| RO | ro | DNSC (403) [S]; ASF RSS [V] | **DNSC 1911** [S]; 112 | Unknown |
| SK | sk | SK-CERT [S]; CSIRT.SK [S] | 158 | **All rights reserved** |
| SI | sl | SI-CERT / Varni na internetu [S] | 113 | Unknown |
| ES | es | (already covered) | | |
| SE | sv | Polisen.se [S]; Konsumentverket RSS [V] | polisen.se / 114 14 | §9 exemption [U] |
| CH | de, fr, it | **NCSC/BACS** weekly reviews [S]; **cybercrimepolice.ch RSS** [V]; FINMA [U] | BACS form [U]; cantonal police; 117 | **admin.ch: consent needed** |
| GB | en | NCSC RSS [V]; FCA ScamSmart and Warning List RSS [V] | Report Fraud, 0300 123 2040 [S]; 7726 for spam texts [U] | OGL v3 |
| AL | sq | State Police; AKCESK [S/U] | 129 / 112 | Unknown |
| BA | bs, hr, sr | FUP; IDDEEA [S] | 122 | Unknown |
| XK | sq, sr | Kosovo Police RSS [V] | 192 | Unknown |
| ME | sr / cnr | CIRT.ME [S] | kontakt@cirt.me [S]; 122 | Unknown |
| MK | mk, sq | MVR news [S] | 192 | Unknown |
| RS | sr | cert.rs [S]; MUP [S] | 192 | Unknown |
| UA | uk, ru | **Cyberpolice** [S]; CERT-UA [S] | ticket.cyberpolice.gov.ua [S]; 102 | Official documents exempt [U] |
| MD | ro, ru | Police [S]; BNM RSS [V] | 112 | Unknown |
| TR | tr | EGM Siberay [S]; USOM [S]; DMM [S] | 112; CİMER [U] | Unknown |

**Pan-European sources:**

| Source | Feed | Licence |
|---|---|---|
| European Commission consumer pages | none | CC BY 4.0 [V] |
| Europol (IOCTA, EC3) | europol.europa.eu/rss.xml [V] | Private use only [V] |
| ENISA Threat Landscape | none | Reproduction with credit [V/S] |
| EBA consumer factsheet on AI-era fraud (24 languages, Jan 2026) | rss.xml [V] | Reproduction with credit [V] |
| ESMA | none | Reproduction with credit [V] |
| ECB | /rss [V] | Unknown |
| BEUC | /rss-channels [V] | Unknown |
| Eurojust | /rss-feeds [V] | Unknown |

## Common scams to write first (examples)

- **DE:**
  - Kleinanzeigen account-verification phishing (VZ, 16 Nov 2026).
  - photoTAN reactivation (VZ, Nov 2026).
  - Cybertrading (ProPK, 30 Oct 2026).
  - Fake shops.
  - Cloned-voice shock calls.
  - Card collectors at the door.
- **FR:**
  - Fake bank adviser (+159%).
  - Transfer fraud (+170%).
  - Phishing (+70%).
  - Caller-ID spoofing.
  - Fake tech support.
  - Source for all: Cybermalveillance annual report, 26 Mar 2026.
- **IT:**
  - Bank SMS followed by a fake operator call.
  - Fake Polizia Postale caller.
  - Fake PagoPA payment.
  - Poste smishing.
- **NL** (Fraudehelpdesk, Oct–Nov 2026):
  - Fake Google helpdesk.
  - Fake pharmacy SMS.
  - Fake Fraudehelpdesk caller.
  - WhatsApp takeover via "vote for the ballerina".
  - Booking.com phishing.
- **PL:**
  - Traffic-fine SMS.
  - e-Urząd Skarbowy refund.
  - gov.pl grants.
  - Poczta Polska fees.
  - Investment ads.
- **PT:**
  - MB WAY "money sent by mistake" (PSP, Apr 2026).
  - Fake MB WAY / PJ card update.
- **BE:**
  - Holiday-pay payout phishing.
  - FOD Financiën QR refund.
  - Fake booking WhatsApp messages.
  - My e-Box.
- **AT:**
  - Fake booking portals.
  - MediaMarkt fake shops.
  - Finanzamt / FinanzOnline phishing.
- **CH:**
  - Double parcel phishing.
  - Vishing.
  - Microsoft 365 phishing.
  - QR crypto letters.
  - Fake Lidl survey.
- **IE:**
  - AI "state-backed" investment ads.
  - Pension scams.
  - Celebrity ads.
- **SE / DK / NO:**
  - "Text from your child".
  - BankID / MitID misuse.
  - Fake police calls.
  - Card collectors.
- **Baltics:** Smart-ID PIN fraud with a second "real" call.
- **CZ / HU:** fake police plus fake banker, with "safe account" and cash couriers.
- **UA:** fake pension top-ups and fake IDP payments.
- **MD:** fake bank security calls (515 cases, Jan–May 2026).

## Rollout order

**Prerequisite:** fix the normaliser before wave 4 (ł) and wave 5 (Greek and Cyrillic).

| Wave | Countries | Why |
|---|---|---|
| 1 | **PT, IE, MT** | Reuses the existing pt and en rules; only local terms needed (MB WAY, Multibanco). Clean sources. |
| 2 | **FR, BE, LU, NL** | One French ruleset covers FR, BE-fr, LU and CH-fr. One Dutch ruleset covers NL and BE-nl. Best licences and feeds (Etalab, CC0, Fraudehelpdesk RSS, Cybermalveillance Atom). |
| 3 | **DE, AT, CH, LI** | One German ruleset. Largest population. Excellent sources, but restrictive reuse: write original text. |
| 4 | **IT, PL, RO, MD** | Italian completes CH. Poland has CERT Polska and SMS 8080. RO and MD share Romanian. |
| 5 | **UA, TR, GR, CY, BG** | Needs the Cyrillic, Greek and Turkish normaliser fix. |
| 6 | **SE, DK, NO, FI, IS** | The Nordic languages share terms: BankID, MitID, kode. |
| 7 | **CZ, SK, HU, SI, HR** | |
| 8 | **EE, LV, LT** | Smart-ID PIN fraud. Russian is a second language in EE and LV. |
| 9 | **RS, BA, ME, MK, AL, XK** | Thinnest sources. |

## Matcher changes

1. **Normaliser:**
   - Fold ß→ss, ø→o, æ→ae, œ→oe, ł→l, đ/ð→d, þ→th, ı/İ→i.
   - Keep `\p{L}` letters (Greek and Cyrillic) and the € and £ signs.
   - Optionally map Serbian Cyrillic to Latin.
2. **Stop words** per language (fr, de, it, nl, pl…), so "der", "les", "het" don't inflate phrase scores.
3. **Sign rules per language**, in the existing shared ids. Examples:
   - FR: `virement`, `code de confirmation`, `ne raccrochez pas`.
   - DE: `TAN`, `Überweisung`, `Sicherheitskonto`, `legen Sie nicht auf`.
   - NL: `overmaken`, `tikkie`, `veilige rekening`.
   - IT: `bonifico`, `codice OTP`, `non riattaccare`.
   - PL: `przelew`, `kod BLIK`.
   - Nordic: `BankID`, `MitID`.
   - Baltic: `Smart-ID`, `PIN1/PIN2`.
4. **Context rules per language**, such as "never share this code": FR `ne le communiquez jamais`, DE `geben Sie
   niemals weiter`, NL `deel deze code nooit`, IT `non condividere`, PL `nie udostępniaj`. Otherwise every genuine
   one-time-code text will trip `asks_for_code`.
5. **Local brands** go in `data/brands.json`: ameli, ANTAI, Finanzamt, Sparkasse, Belastingdienst, itsme, CTT,
   InPost, PostNord, Smart-ID, Ghișeul.ro…
6. **Labelled messages per language**, including real one-time codes and delivery texts as negatives, before a
   country goes live.
