# Fri Dec 4 · Behind scamdb: how the check works (and what it can't do)

- **Pillar:** Behind scamdb
- **Link:** https://scamdb.dev (the paste box is on the home page)
- **Message:** none.
- **Facts from:** `docs/marketing.md` (1,199 scams, 76 countries, check runs in the browser, nothing is sent; can say
  "not recognised"). Verdict words match the site: "scam", "suspicious", "not recognised". **Update the count** before
  posting if `npm run build` prints a new one.
- **Images:** `01-ig.png`, `02-ig.png` (Instagram), `03-x.png` (X)

## Instagram (2 slides)

```ig
How does scamdb’s check work?

You paste a message. scamdb compares it with 1,199 documented scams from 76 countries, and tells you if it follows a known scam script, which one, and what to do. It runs in your browser: the message isn’t sent to us or anyone else.

What it can’t do: it only knows scams that have already been documented. If it says “not recognised”, that isn’t a promise the message is safe. New scams appear every week. When in doubt, contact the company yourself, using a number or website you already trust.

Got one we didn’t recognise? Report it at scamdb.dev/report so we can add it. Reports stay private.

Free, link in bio.

#scamalert #scamawareness #onlinesafety #opendata
```

**Alt text**

1. Hand-drawn message bubble. “Paste a message. See the script.” scamdb compares it with 1,199 documented scams from
   76 countries. The check runs in your browser: the message isn’t sent anywhere.
2. Three possible answers: scam, it matches a known scam script and shows which one and what to do; suspicious, it has
   warning signs but no known script; not recognised, which is not a promise it’s safe, because new scams appear every
   week. Got one we missed? Report it at scamdb.dev/report. Reports stay private.

## X

```x
How scamdb’s check works: paste a message, and it’s compared with 1,199 documented scams from 76 countries, in your browser. Nothing is sent.

“Not recognised” isn’t a promise it’s safe. New scams appear every week.

https://scamdb.dev
```

**Alt text (03-x.png):** Hand-drawn message bubble. “Paste a message. See the script. 1,199 documented scams from 76
countries. The check runs in your browser.”

**Reply (for developers):**

```x
The same check is a free API, and the whole catalogue is open data (CC BY 4.0).

https://scamdb.dev/docs
```
