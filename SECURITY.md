# Security policy

## Reporting a vulnerability

Please report security issues privately through GitHub:
**Security → Report a vulnerability** on this repository
([direct link](https://github.com/nahuelsantos/scamdb/security/advisories/new)). Don't open a public issue.

Useful things to include: the affected endpoint or file, steps to reproduce, and what an attacker could do. We aim to
reply within a week.

## In scope

- The API and Worker at `scamdb.dev` (`/v1/isitascam`, `/v1/reports`, keys, GitHub sign-in)
- The site at `scamdb.dev`
- The code in this repository

Ways to get a scam message past the detector are welcome too, but they are not security issues: send them as a
[private report](https://scamdb.dev/report/) so they can improve detection.

## Out of scope

- Denial of service and load testing
- The free rate limits themselves (they are deliberately simple)
- Third-party sites linked from entries
