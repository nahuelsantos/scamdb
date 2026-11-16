# Free sources for discovering new scams worldwide (researched 2026-11-16)

**Markers:** [V] means fetched or checked directly; [U] means unverified (search snippets, third-party blogs, or
unreachable). Only public pages, feeds and robots.txt were read.

**Bottom line:**
- **Use:** GDELT and official agency RSS feeds. Both are free, worldwide and clean to use.
- **Use carefully, links only:** Google News and Bing News RSS.
- **Don't ingest automatically:** Reddit, X, Telegram, YouTube analytics, OpenPhish, Reuters and AP.

| Source | Free? | Terms OK for us? | Coverage | Verdict |
|---|---|---|---|---|
| **GDELT DOC 2.0 API** | Yes (1 request per 5 s) | **Yes:** "unlimited and unrestricted use … commercial … without fee", with citation and link [V] | Global, 65 languages | **USE (backbone)** |
| **Official agency RSS** (below) | Yes | Yes for metadata and links; licences vary | ~20 countries | **USE** |
| BBC RSS | Yes | Yes, credited as "BBC News" [V] | UK and global | USE |
| Google News RSS | Yes | Grey: robots.txt disallows /rss; old terms say personal use [V] | Every locale | Use carefully (1 request per country per day, links only) |
| Bing News RSS | Yes | Unofficial; the API was retired Aug 2025 [V/U] | Many locales | Use carefully |
| Which? RSS | Yes | [U] | UK | Use carefully |
| **Reddit** API / RSS | Approval-only free tier [U] | **No without approval.** The Data API Terms also cover RSS, robots.txt says `Disallow: /`, and AI/ML use is restricted [V] | English-heavy | **Avoid automated use** (or apply for non-commercial access: counts only, delete raw items in 24 h) |
| Reuters / AP direct | No feed | No: robots.txt prohibits automated collection [V] | Global | Avoid (they appear through GDELT) |
| NewsAPI.org free | Dev only | Not for production [U] | Global | Avoid |
| Common Crawl News | Yes | Copyright is the user's problem; no collecting personal data [V] | Global | Avoid (overkill) |
| **PhishTank** | Yes | "free to everyone … commercial … OK" [V] | Global brands | Use carefully: brand counts only, URLs discarded on read |
| OpenPhish community feed | Yes | Personal, non-commercial use only; no disclosure [V] | Global | Avoid |
| URLhaus | With a key | Non-commercial fair use; lists malware URLs, not brands [V] | | Avoid |
| Mastodon tag RSS | Yes | Per instance [U] | Small | Use carefully (counts only, low weight) |
| Bluesky Jetstream | Yes | Must honour deletions [V] | Growing | Phase 2 |
| YouTube Data API | 10k units/day | **No: "Do not aggregate API Data … to gain insights"** [V] | Global | Avoid (channel RSS for human leads only) |
| Wikipedia "List of scams" | Yes | CC BY-SA, not compatible with our CC BY | | Taxonomy checklist only, never copy text |
| Telegram | | Terms ban scraping [V] | Huge in RU, IN, BR, ID | Avoid |
| X API | No | | | Avoid |

## Official agency feeds

| Agency | Feed |
|---|---|
| ACCC Scamwatch (AU) | https://www.scamwatch.gov.au/rss/news-feed.xml [V] (CC BY) |
| FBI IC3 (US) | https://www.ic3.gov/PSA/RSS [V] |
| FTC (US) | https://www.ftc.gov/feeds/press-release-consumer-protection.xml [U: blocks bots] |
| CFPB (US) | https://www.consumerfinance.gov/about-us/blog/feed/ [V] |
| FBI national press (US) | https://www.fbi.gov/feeds/national-press-releases/rss.xml [V] (needs filtering) |
| CFTC (US) | https://www.cftc.gov/RSS/RSSGP/rssgp.xml [V] |
| NCSC (UK) | https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml [V] |
| FCA (UK) | https://www.fca.org.uk/news/rss.xml [V] |
| RCMP (CA) | Government of Canada news API, `dept=royalcanadianmountedpolice`, Atom [V] |
| Competition Bureau (CA) | same API, `dept=competitionbureaucanada` [V] |
| Europol (EU) | https://www.europol.europa.eu/rss.xml [V] |
| Cybermalveillance (FR) | https://www.cybermalveillance.gouv.fr/feed/atom-flux-alertes [V] (Etalab Licence Ouverte 2.0) |
| Safeonweb (BE) | https://safeonweb.be/en/rss.xml [V] |
| Fraudehelpdesk (NL) | https://www.fraudehelpdesk.nl/feed/ [V] (excellent: concrete current waves) |
| CERT Polska (PL) | https://cert.pl/rss.xml [V] |
| CERT.at (AT) | https://www.cert.at/cert-at.de.current.rss_2.0.xml [V] |
| NCSC-FI (FI) | https://www.kyberturvallisuuskeskus.fi/feed/rss/fi [V] |
| NZ Police (NZ) | https://www.police.govt.nz/rss/news [V] (needs filtering) |
| NPA (JP) | https://www.npa.go.jp/newlyarrived/rss20.xml [V] (filter for 詐欺; PDL1.0 with attribution) |
| PIB (IN) | https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3 [V] (filter for cyber fraud) |
| SABRIC (ZA) | https://www.sabric.co.za/feed/ [V] (all rights reserved: links only) |
| CSA (SG) | https://www.csa.gov.sg/alerts-and-advisories/rss.xml [V] (no reproduction: links only) |

**No machine-readable feed found** (manual checks, or GDELT / Google News instead): Action Fraud, CAFC, SPF
ScamShield, PROFECO (MX), Argentina's Defensa del Consumidor, cybercrime.gov.in, Kokusen (JP), Watchlist Internet
(AT).

## Constraints

- **Cloudflare Workers Free:** 10 ms CPU per cron run and 50 subrequests per invocation. That's too small for
  fetching about 60 GDELT queries at one per 5 seconds plus parsing. So the fetching runs in **GitHub Actions**,
  which is free for public repositories [U on current minutes].
- **GDELT rate limit:** "one every 5 seconds" [V, live 429]. Shared egress IPs need backoff.

The pipeline design built on this is in `docs/superpowers/plans/2026-11-16-europe-and-discovery.md`.
