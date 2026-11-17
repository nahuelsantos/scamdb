# Wave 1 research: Portugal, Ireland, Malta (2026-11-17)

This is input for drafting `data/pt|ie|mt/contacts.json`, `data/<cc>/scams/*.json` and `data/brands.json` additions.
Nothing here is a data entry yet. Example messages are **not** included: drafters invent them (see
`.claude/skills/import-scams/SKILL.md`).

**How sure each item is**

- **[V]** I loaded the page (or PDF) myself on 2026-11-17 and the facts and date come from it.
- **[S]** The facts come from search-result snippets or a summary of a page I could not load. Check before citing.
- **[U]** Unverified, or the date is unclear. Don't use it as the only source.

**Status rule** (today is 2026-11-17): `active` if the newest source is on or after 2024-11-17; `fading` if
it falls between 2021-11-17 and 2024-11-16. Every scam below has at least one source from 2025 or 2026, so all are
`active` unless noted.

**Channels** use the schema enum: `whatsapp`, `sms`, `phone`, `online`, `in-person`, `email`, `social`.

**Signals** (from `data/signals.json`): `asks_for_code`, `remote_access`, `urgency`, `money_request`,
`unknown_link`, `new_number`, `impersonation`, `secrecy`, `keep_on_line`, `too_good_to_be_true`.

## Blocked or unreadable hosts

| Host | Result | Workaround used |
|---|---|---|
| policiajudiciaria.pt, psp.pt | timeout / 503 from this environment | News coverage; MP Gabinete Cibercrime alerts |
| cncs.gov.pt | "DiamWall" bot wall (307 redirect loop) | Search snippets only [S] |
| bportugal.pt, clientebancario.bportugal.pt | 403 (already noted in the 2026-11-16 doc) | Search snippets only [S] |
| rr.pt | 403 to WebFetch | The date is in the URL; facts [S] |
| pulizija.gov.mt, mfsa.mt, centralbankmalta.org | 403 | scamalert.mt, Newsbook, TVM; MFSA facts [S] |
| maltatoday.com.mt, letterkennylive.ie, nenaghlive.ie | 403 | Snippets [S] |
| timesofmalta.com | not reachable by the search tool | None |
| revenue.ie (scam page URL guessed) | 404 | Garda and Chartered Accountants Ireland reposts [S] |

**Best machine-readable sources found** (useful for `importer/sources.json`):

- **PT:** Ministério Público, Gabinete Cibercrime: <https://cibercrime.ministeriopublico.pt/> [V]. Each "Alerta
  Cibercrime" page links a dated PDF under `/sites/default/files/editor-files/YYYY.MM.DD-*.pdf` that `pdftotext`
  reads cleanly. The Portal das Finanças "Alerta de segurança" pages are also dated [V].
- **IE:** FraudSMART RSS: <https://www.fraudsmart.ie/feed/> (`?paged=2`, `?paged=3` for older posts) [V]. The WP
  REST API needs authentication. Garda press releases have the date in the URL. Central Bank clone-firm warnings are
  individual pages [V].
- **MT:** Newsbook (`datePublished` in JSON-LD) [V] and TVMnews [V]. scamalert.mt has no dated alerts; its "Scam
  Alerts and News" page only links to the MFSA warnings list and IOSCO I-SCAN [V].

---

## Portugal (pt)

Language: `pt` (European Portuguese). Emergency number: 112.

### Contacts

| Proposed id | Name (pt / en) | When to use | How to reach | Hours | Source | Checked | Sure |
|---|---|---|---|---|---|---|---|
| `pt/emergency` | Número Europeu de Emergência 112 / Emergency 112 | Crime happening now, a "courier" or fake inspector at your door, you are in danger | phone `112`. GNR SMS Segurança `961 010 200` (for deaf or hard-of-hearing people, or when a voice call isn't suitable) | 24h | https://www.gnr.pt/ | 2026-11-17 | [V] |
| `pt/queixa-eletronica` | Queixa Eletrónica (MAI) / Online police report (MAI) | File a complaint (queixa) for burla and other listed crimes. It goes to the GNR or PSP. You must be identified and be in Portugal or live there. Not for emergencies. | web `https://queixaselectronicas.mai.gov.pt/` | online | https://queixaselectronicas.mai.gov.pt/ | 2026-11-17 | [V] |
| `pt/psp-gnr` | PSP ou GNR (esquadra ou posto) / Police station (PSP or GNR) | To report in person if the online form doesn't fit or fails; bring messages, numbers, receipts | in person at any PSP esquadra or GNR posto | varies | https://queixaselectronicas.mai.gov.pt/ (lists the traditional routes) | 2026-11-17 | [V] |
| `pt/pj` | Polícia Judiciária (UNC3T, cibercrime) / Judicial Police, cybercrime unit | The PJ investigates cybercrime. Most cases reach it through the PSP, GNR or MP; you can also report at its premises. | in person at the PJ. Email `unc3t@pj.pt` [U: old CNCS PDF]. Switchboard `211 967 000` [U] | ? | https://www.policiajudiciaria.pt/ (blocked) | 2026-11-17 | **[U]** |
| `pt/mp-cibercrime` | Ministério Público, Gabinete Cibercrime / Public Prosecutor's cybercrime office | Report a cybercrime by email. Include your name and signature (art. 246(2) CPP). It forwards criminal reports to the relevant MP office. It also publishes scam alerts. | email `cibercrime@pgr.pt`; phone `213 847 000`; post: Rua Gomes Freire 213, 1150-178 Lisboa | ? | https://cibercrime.ministeriopublico.pt/pagina/denuncia-0 | 2026-11-17 | [V] |
| `pt/your-bank` | O seu banco / Your bank | Call straight away if you paid, shared codes or card data, or got money "by mistake" on MB WAY. Use the number on the card or the bank's app or website. | phone (on card) | usually 24h | DECO (2026-04-09) and MP alerts | 2026-11-17 | [V] |
| `pt/linha-internet-segura` | Linha Internet Segura (APAV) / Safe Internet Helpline | Free, confidential support for online scam victims. It doesn't replace a police complaint. | phone `800 21 90 90`; email `linhainternetsegura@apav.pt`; online form | working days, 8h–23h (sources differ: 8–22, 9–21) | https://eco.sapo.pt/2026/02/10/linha-internet-segura-recebe-949-casos-de-cibercrime-e-violencia-em-2025-uma-subida-de-39/ | 2026-11-17 | [S] (internetsegura.pt redirect loop) |
| `pt/cncs` | CNCS / CERT.PT | Report a cyber incident (phishing site, malware) | email `cert@cert.pt`; phone `210 497 399`; form `https://www.cncs.gov.pt/pt/notificacao-incidentes/` | ? | CERT.PT presentation 2025 (search) | 2026-11-17 | [S] |
| `pt/banco-de-portugal` | Banco de Portugal (Portal do Cliente Bancário) / Bank of Portugal | Check whether a lender or payment firm is authorised; read its warnings on unauthorised entities | web `https://clientebancario.bportugal.pt/`; email `info@bportugal.pt` [S] | ? | site blocked (403) | 2026-11-17 | [S] |
| `pt/cmvm` | CMVM, Linha de Apoio ao Investidor / Securities regulator investor line | Investment offers, fake brokers, ads with public figures. The CMVM never contacts investors on WhatsApp. | phone `800 205 339`; email `investidor@cmvm.pt` | ? | https://24noticias.sapo.pt/atualidade/artigos/cmvm-alerta-para-aumento-de-fraudes-associadas-a-falsos-investimentos (2026-09-01) | 2026-11-17 | [V] (via news) |

Other numbers to mention in `whatToDo`, not as contacts: SNS 24 `808 24 24 24` [S]; Segurança Social `300 502 502` /
`210 545 400` [S, seg-social.pt alert Nov 2024]. DECO PROteste is a consumer association, not an official body: cite
it as a source only.

### Scams (17)

**pt-1. MB WAY: "transferência por engano" / MB WAY "money sent by mistake"**
- **How it works:** You get an unexpected MB WAY transfer, often €150–200. Minutes later a WhatsApp message from a
  *different* number says it was a mistake and asks you to send it back. The money comes from other scams, so
  returning it can make you a money mule.
- **Channels:** whatsapp, sms (the MB WAY notification is genuine).
- **Sender:** a stranger who says they sent it by mistake.
- **Signals:** money_request, urgency, new_number.
- **Red flags:** the refund request comes from a different number from the sender's; pressure to return it quickly
  to a phone number.
- **What to do:** don't send it back yourself; call your bank so it can reverse the transfer; keep screenshots;
  report to the PSP, GNR or PJ. MB WAY never asks for a PIN to receive money.
- **Sources:**
  - "MB Way: cuidado com nova burla", DECO PROteste, https://www.deco.proteste.pt/tecnologia/ciberseguranca/noticias/mb-way-cuidado-nova-burla, 2026-04-09 [V]
  - "Recebeu dinheiro no MB Way? Pode ser burla, avisa a polícia", Renascença (citing the PSP), https://rr.pt/noticia/pais/2026/04/22/recebeu-dinheiro-no-mb-way-pode-ser-burla-avisa-a-policia/467923/, 2026-04-22 [S]

**pt-2. Falso comprador no OLX/Vinted com MB WAY / Fake buyer on OLX or Vinted using MB WAY**
- **How it works:** You sell something online. A "buyer" insists on MB WAY and guides you, sometimes at a Multibanco
  ATM, to "receive" the money. In fact you generate a code, link their phone number or confirm an operation, and
  your own money goes to them.
- **Channels:** online, whatsapp, sms.
- **Sender:** a buyer on OLX or Vinted.
- **Signals:** asks_for_code, urgency, impersonation.
- **Red flags:** you are told to go to an ATM, generate a code or add a phone number in order to *receive* money.
  You never need to do anything to receive an MB WAY payment.
- **What to do:** stop; don't type another person's number at the ATM; if you did, call the bank to block MB WAY;
  report it.
- **Sources:**
  - "Burlas no OLX com recurso ao MBWAY continuam! Conheçam o esquema", Pplware, https://pplware.sapo.pt/?p=1103975, 2026-02-16 [V]
  - postal.pt reports PSP and GNR got 4,467 MB WAY scam complaints in 2024 (article undated) [S/U]

**pt-3. Falso funcionário do banco (SMS + chamada) / Fake bank employee (text, then a call)**
- **How it works:** An SMS or email from "your bank" says a transfer or payment was just made from your account, with
  a link to fix it "imediatamente". The fake page takes your login and phone number. Then someone from the bank's
  "cybersecurity team" calls, knows details of your account, and asks you to confirm the cancellation with the code
  you are sent. That code actually authorises their transfer. A variant gives a "24-hour" number to call, or tells
  you to move money to a "conta de segurança". Calls are spoofed to show the bank's number.
- **Channels:** sms, email, phone.
- **Sender:** your bank (any Portuguese bank).
- **Signals:** unknown_link, asks_for_code, urgency, impersonation, keep_on_line, money_request.
- **Red flags:** an alert about a payment you didn't make plus a link; a caller asking for an SMS code or app
  confirmation "to cancel"; a request to move money to a safe account.
- **What to do:** hang up and call the bank on the number in its app or on your card; never give codes; report to
  the PSP, GNR or PJ, or to cibercrime@pgr.pt.
- **Sources:**
  - "Alerta Cibercrime: 'Phishing' e burla por falsos agentes bancários", Ministério Público, Gabinete Cibercrime, https://cibercrime.ministeriopublico.pt/sites/default/files/editor-files/2026.06.15-alerta-phishing-e-burla-falsos-bancarios.pdf, 2026-06-15 [V]
  - "PSP regista aumento 'exponencial' de burlas com falsos funcionários bancários", Diário de Notícias, https://www.dn.pt/sociedade/psp-regista-aumento-exponencial-de-burlas-com-falsos-funcionrios-bancrios, 2026-07-10 [V]

**pt-4. Phishing "atualização de dados" (Banco CTT e outros) / Bank email: "update your details or be blocked"**
- **How it works:** An email with the bank's logo says that, "for security reasons", you must update your details
  immediately or lose access to your account, and gives a link. The fake page steals your access codes and card data.
- **Channels:** email (sms in other campaigns).
- **Sender:** Banco CTT (named in the alert); other banks in other campaigns.
- **Signals:** unknown_link, urgency, impersonation.
- **Red flags:** a threat that your account will be blocked; a link to "update details".
- **What to do:** don't click; open the bank's app yourself; call the bank if you entered data.
- **Sources:**
  - "Alerta Cibercrime: 'Phishing' – Banco CTT", Ministério Público, Gabinete Cibercrime, https://cibercrime.ministeriopublico.pt/sites/default/files/editor-files/2026.10.08-alerta-phishing-banco-ctt.pdf, 2026-10-08 [V]

**pt-5. Falsa dívida às Finanças (AT) / Fake tax debt from Finanças (AT)**
- **How it works:** A WhatsApp message or email says you owe tax to the Autoridade Tributária and must pay "para
  evitar penhora", with a link to "see the details". Prepaid or hidden-number SIMs are used. Other AT-themed messages
  offer an IRS refund or ask you to confirm your details.
- **Channels:** whatsapp, sms, email.
- **Sender:** Autoridade Tributária e Aduaneira / "Finanças".
- **Signals:** unknown_link, urgency, money_request, impersonation.
- **Red flags:** a threat of seizure (penhora); a link to pay. The AT never asks for payment or data by a link, and
  its emails only come from `@at.gov.pt`.
- **What to do:** don't click; check under "Comunicações" in the Portal das Finanças; report it to the MP or police.
- **Sources:**
  - "Alerta Cibercrime: Burla – Falsas Dívidas à Autoridade Tributária", Ministério Público, Gabinete Cibercrime, https://cibercrime.ministeriopublico.pt/sites/default/files/editor-files/2026.04.06-burlas-supostas-dividas-a-at.pdf, 2026-04-06 [V]
  - "Alerta de segurança", Autoridade Tributária e Aduaneira (Portal das Finanças), https://info.portaldasfinancas.gov.pt/pt/destaques/Paginas/Alerta-seguranca-02-11-2026.aspx, 2026-11-02 [V]
  - "Alerta de segurança", AT, https://info.portaldasfinancas.gov.pt/pt/destaques/Paginas/Alerta-de-seguranca-20260803.aspx, 2026-08-03 [V]

**pt-6. Falsa dívida ou prestações suspensas na Segurança Social / Fake Social Security debt or "benefits suspended"**
- **How it works:** A message from "Seg-Social" says you have an overdue debt, sometimes with seizure already
  pending, or that your access and benefits were deactivated. The link opens a fake "Segurança Social Direta" page
  showing "pagamento em atraso" and a "PAGAR AGORA" button that produces a real Multibanco reference. In the
  "deactivated" variant, you are passed to a fake operator on WhatsApp who asks for bank details.
- **Channels:** whatsapp, sms, email.
- **Sender:** "Seg-Social" / Segurança Social.
- **Signals:** unknown_link, urgency, money_request, impersonation.
- **Red flags:** a Multibanco reference sent by message; a threat of penhora or loss of benefits; a move to a
  WhatsApp "operator". Segurança Social doesn't send links by SMS.
- **What to do:** don't pay; check in Segurança Social Direta; report to the GNR, PSP or MP.
- **Sources:**
  - "Alerta Cibercrime: Burla – Falsas Dívidas à Segurança Social", Ministério Público, Gabinete Cibercrime, https://cibercrime.ministeriopublico.pt/sites/default/files/editor-files/2026.01.29-burlas-supostas-dividas-seguranca-social.pdf, 2026-01-29 [V]
  - "Burlas da internet: o esquema da falsa mensagem da Segurança Social", Pplware, https://pplware.sapo.pt/informacao/burlas-da-internet-o-esquema-da-falsa-mensagem-da-seguranca-social/, 2026-06-04 [V]

**pt-7. SMS falso do SNS / Ministério da Saúde com referência Multibanco / Fake health-service debt SMS**
- **How it works:** An SMS appearing as "MIN.SAUDE", spoofed into the same thread as real messages, or as SNS 24,
  says an amount is overdue ("valor em incumprimento"), for example an A&E visit, and must be paid within 5 days by
  Multibanco reference. The reference often uses entity 21800, which doesn't belong to the Ministry. A WhatsApp
  variant exists.
- **Channels:** sms, whatsapp.
- **Sender:** SNS, SNS 24, Ministério da Saúde.
- **Signals:** urgency, money_request, impersonation, unknown_link.
- **Red flags:** a payment reference by SMS; a 5-day deadline; no case number. The SNS doesn't charge debts by SMS.
- **What to do:** don't pay; call SNS 24 on 808 24 24 24 if unsure; delete the message.
- **Sources:**
  - "SMS fraudulentos: burla em nome do Ministério da Saúde exige pagamento indevido", DECO PROteste, https://www.deco.proteste.pt/tecnologia/ciberseguranca/noticias/sms-fraudulentos-burla-nome-ministerio-saude-exige-pagamento-indevido, 2026-03-30 [V]
  - "PGR alerta para mensagens fraudulentas via Whatsapp sobre alegadas dívidas ao SNS", Renascença, https://rr.pt/noticia/pais/2025/08/19/pgr-alerta-para-mensagens-fraudulentas-via-whatsapp-sobre-alegadas-dividas-ao-sns/436747/, 2025-08-19 [S]

**pt-8. Multa de estacionamento em nome do autenticação.gov / Fake parking fine "from autenticação.gov"**
- **How it works:** An email with the Autenticação.gov logo says a €150 parking fine is unpaid and will rise to €420,
  and that you will lose 3 licence points, unless you pay within days through a "Pagar online" button. The page
  steals your card details.
- **Channels:** email.
- **Sender:** Autenticação.gov (AMA).
- **Signals:** unknown_link, urgency, money_request, impersonation.
- **Red flags:** a fine that grows within days; a payment button in an email.
- **What to do:** don't pay; call the bank if you entered card data.
- **Sources:**
  - "Alerta Cibercrime: 'Phishing' abusando da plataforma autenticação.gov", Ministério Público, Gabinete Cibercrime, https://cibercrime.ministeriopublico.pt/sites/default/files/editor-files/2026.01.20-alerta-phishing-autenticacao.pdf, 2026-01-20 [V]

**pt-9. Encomenda CTT retida / taxa alfandegária / CTT parcel held: pay a customs or delivery fee**
- **How it works:** An SMS, email or WhatsApp message "from CTT" says a parcel is held (customs, wrong address,
  delivery suspended) and asks for a small fee or your details through a link. The page steals your card details.
- **Channels:** sms, email, whatsapp.
- **Sender:** CTT.
- **Signals:** unknown_link, urgency, money_request, impersonation.
- **Red flags:** a small fee by link; a short deadline. Real customs clearance goes through the CTT Portal de
  Desalfandegamento.
- **What to do:** check the tracking on ctt.pt or in the app; call the bank if you entered card data.
- **Sources:**
  - "SMS das Finanças, dos CTT ou do banco: 7 cuidados para não cair numa burla", RFM, https://rfm.pt/atualidade/24211/sms-das-financas-dos-ctt-ou-do-banco-7-cuidados-para-nao-cair-numa-burla, 2026-11-09 [V]
  - MP Gabinete Cibercrime "phishing CTT/Visa" alert, https://cibercrime.ministeriopublico.pt/sites/default/files/documentos/pdf/2023.07.05_alerta_phishing_ctt_visa_4.pdf, 2023-07-05 [S] (older, an extra source only)
- **Note:** I found no official CTT alert from 2025–26. The RFM article is the only recent source.

**pt-10. Falso reembolso da TAP por atraso de voo / Fake TAP refund for a delayed flight**
- **How it works:** An email "from TAP Air Portugal" says your last flight from Lisbon was significantly delayed and
  you are owed compensation; the link "is valid for 24 hours". The page collects your card data.
- **Channels:** email.
- **Sender:** TAP Air Portugal.
- **Signals:** too_good_to_be_true, unknown_link, urgency, impersonation.
- **Red flags:** a refund you didn't ask for; a 24-hour link.
- **What to do:** don't click; check on flytap.com; call the bank if you entered card data.
- **Sources:**
  - "Alerta Cibercrime: 'Phishing' – falsos reembolsos da TAP", Ministério Público, Gabinete Cibercrime, https://cibercrime.ministeriopublico.pt/sites/default/files/editor-files/2026.04.20-alerta-phishing-tap.pdf, 2026-04-20 [V]

**pt-11. Falsos telefonemas do apoio PayPal / Fake PayPal support call (remote access)**
- **How it works:** A recorded call in English says a purchase (often crypto, to Russia or China) was made with your
  PayPal and to press a key to cancel it. A fake agent then emails you a link to install TeamViewer, AnyDesk or
  UltraViewer, takes control of your computer and uses your PayPal.
- **Channels:** phone, email.
- **Sender:** PayPal "support".
- **Signals:** remote_access, urgency, impersonation, keep_on_line.
- **Red flags:** a robocall about a purchase you didn't make; a request to install remote-access software.
- **What to do:** hang up; never install apps at a caller's request; check in the PayPal app; report it.
- **Sources:**
  - "Alerta Cibercrime: Falsos telefonemas da Paypal", Ministério Público, Gabinete Cibercrime, https://cibercrime.ministeriopublico.pt/sites/default/files/editor-files/2026.06.22-falsos-telefonemas-paypal.pdf, 2026-06-22 [V]

**pt-12. Falsos polícias ou inspetores (PJ, PSP, GNR, ASAE) / Fake police or inspectors**
- **How it works:** A caller, with the real number of a GNR post, PSP station or PJ department spoofed on screen,
  poses as an inspector. They claim an investigation, an infraction or the theft of your Cartão de Cidadão data and
  demand an immediate payment by entidade/referência or bank details. Sometimes they send fake warrants or ID cards
  on WhatsApp, or turn up in person at shops or homes.
- **Channels:** phone, whatsapp, email, in-person.
- **Sender:** Polícia Judiciária, PSP, GNR, ASAE.
- **Signals:** impersonation, urgency, money_request, secrecy.
- **Red flags:** police asking for money or bank details by phone. There are no discounts for paying a fine on the
  phone.
- **What to do:** hang up; call the force back on its official number; ask for formal ID in person; report it.
- **Sources:**
  - "GNR regista mais de 190 burlas por falsos polícias e inspetores desde 2024", Diário de Notícias, https://www.dn.pt/sociedade/gnr-regista-mais-de-190-burlas-por-falsos-polcias-e-inspetores-desde-2024, 2026-10-10 [V]
  - "PJ alerta para burla com falsos inspetores da Judiciária", Renascença, https://rr.pt/noticia/pais/2026/05/15/pj-alerta-para-burla-com-falsos-inspetores-da-judiciaria/470973/, 2026-05-15 [S]
  - "PJ usada em campanha de burla massiva e com recurso a inteligência artificial", DN/Lusa, https://www.dn.pt/sociedade/pj-usada-em-campanha-de-burla-massiva-e-com-recurso-a-inteligencia-artificial, 2024-09-03 [V] (recorded message, then a "PJ inspector" asks you to move money to safe accounts)

**pt-13. "Olá pai, olá mãe" / "Hi Dad, hi Mum" (including cloned voices)**
- **How it works:** A WhatsApp message from a new number: "Olá mãe!". Their phone broke, save this number. Then they
  ask for money for an urgent payment, often by Multibanco transfer (around €2,500 in DECO's example). Variants pose
  as other relatives, or use an AI-cloned voice.
- **Channels:** whatsapp, sms, phone.
- **Sender:** a son or daughter, or another relative.
- **Signals:** new_number, impersonation, money_request, urgency.
- **Red flags:** a new number; they can't talk; an urgent payment to someone else's IBAN.
- **What to do:** call the old number; ask something only they know; agree a family code word; report to the PSP,
  GNR, PJ or MP.
- **Sources:**
  - "'Olá mãe, olá pai': como se defender deste tipo de burlas?", DECO PROteste, https://www.deco.proteste.pt/tecnologia/telemoveis/noticias/ola-mae-ola-pai-defender-burlas, 2025-04-09 [V]
  - Renascença "Direito à Justiça" (GNR on voice cloning), https://rr.pt/especial/direito-a-justica/2026/04/15/pj-apela-a-maturidade-e-proatividade-das-operadoras-para-denunciar-picos-de-comunicacoes-suspeitas/466807/, 2026-04-15 [S]

**pt-14. Falso investimento com figuras públicas / Fake investment ads with public figures (deepfakes)**
- **How it works:** Ads, videos and fake news stories use the faces of public figures, or even the CMVM's own name,
  to promote high or guaranteed returns. "Advisers" then call or message on WhatsApp, use pressure and isolation, ask
  for remote access, and later charge "fees" to recover the money.
- **Channels:** social, online, phone, whatsapp, sms, email.
- **Sender:** a broker or adviser; public figures; the CMVM.
- **Signals:** too_good_to_be_true, urgency, remote_access, secrecy, impersonation.
- **Red flags:** guaranteed returns; an ad with a celebrity; WhatsApp contact "from the CMVM"; paying to recover
  losses.
- **What to do:** check the CMVM's list of authorised intermediaries; call 800 205 339; report to the police.
- **Sources:**
  - "CMVM alerta para aumento de fraudes associadas a falsos investimentos", 24notícias, https://24noticias.sapo.pt/atualidade/artigos/cmvm-alerta-para-aumento-de-fraudes-associadas-a-falsos-investimentos, 2026-09-01 [V]
  - "CMVM alerta para fraudes com imagem de personalidades públicas e entidades supervisionadas", RTP, https://www.rtp.pt/noticias/economia/cmvm-alerta-para-fraudes-com-imagem-de-personalidades-publicas-e-entidades-supervisionadas_n1691575, ~2025-10 [S]

**pt-15. Falsas ofertas de emprego / tarefas online ("job scam") / Fake jobs: paid "tasks" and likes**
- **How it works:** An SMS, WhatsApp or Telegram contact offers easy online work: rating hotels, Booking promotions,
  likes and follows. Small payouts arrive at first, then you must "deposit" to unlock bigger tasks, or your account
  is used to move money (conta-mula).
- **Channels:** sms, whatsapp, social.
- **Sender:** a recruiter or "company".
- **Signals:** too_good_to_be_true, money_request, new_number.
- **Red flags:** no experience needed; paid for likes; asked to pay or receive money for others.
- **What to do:** stop; never pay to work or lend your account; tell your bank; report it.
- **Sources:**
  - "Polícia Judiciária alerta para a burla 'job scam'", DNotícias, https://www.dnoticias.pt/2026/4/11/487944-policia-judiciaria-alerta-para-a-burla-job-scam/, 2026-04-11 [S]
  - "PGR alerta para praga das burlas com oferta de trabalho como isco", Ordem dos Advogados (press review), https://portal.oa.pt/comunicacao/imprensa/2025/8/4/pgr-alerta-para-praga-das-burlas-com-oferta-de-trabalho-como-isco/, 2025-08-04 [S]

**pt-16. Falso arrendamento (casa, quarto, férias) / Fake rental or holiday home**
- **How it works:** A listing well below market price, using photos copied from real houses. The "landlord" is
  abroad, offers no viewing, and asks for a "sinal" (deposit) to hold it, then disappears.
- **Channels:** online, social, whatsapp.
- **Sender:** a private landlord.
- **Signals:** too_good_to_be_true, urgency, money_request.
- **Red flags:** no visit possible; the landlord is abroad; "muitos interessados"; the account holder's name doesn't
  match.
- **What to do:** visit first; reverse-search the photos; never pay a sinal without a contract; report to the PSP
  or GNR.
- **Sources:**
  - "Mais de 4.500 crimes ligados ao arrendamento de casas em três anos", Renascença (PSP data), https://rr.pt/noticia/pais/2026/04/22/mais-de-4500-crimes-ligados-ao-arrendamento-de-casas-em-tres-anos/467902/, 2026-04-22 [S]
  - "GNR alerta para burlas no arrendamento de casas de férias", RTP, https://www.rtp.pt/noticias/pais/gnr-alerta-para-burlas-no-arrendamento-de-casas-de-ferias_n1734248, 2026 (exact day not shown) [V/U-date]

**pt-17. Burla romântica / Romance scam**
- **How it works:** Someone met on a dating app or social media builds trust for weeks, moves the chat to another app,
  then asks for money for an emergency or a trip. It is often run by organised groups.
- **Channels:** social, online, whatsapp.
- **Sender:** an online partner.
- **Signals:** money_request, secrecy, urgency.
- **Red flags:** never meets or video-calls; asks to leave the app; a money emergency.
- **What to do:** never send money to someone you only know online; contact the Linha Internet Segura; report it.
- **Sources:**
  - "'Burlas de amor' disparam antes do Dia dos Namorados", RTP, https://www.rtp.pt/noticias/pais/burlas-de-amor-disparam-antes-do-dia-dos-namorados_n1718837, 2026-02-13 [V]

**Candidates not drafted:** "Cartão Continente" phishing (MP alert 2025-09-11, listed but not read); CITIUS
credential theft (MP 2025-10-28, aimed at lawyers); CEO fraud (PJ, Renascença 2026-02-09 [S], aimed at businesses);
WhatsApp six-digit-code takeover (no PT source from 2025–26 found); Via Verde / Ascendi toll SMS (Pplware article
undated; no 2025–26 source).

### Brands (pt)

| id | name | aliases | Notes |
|---|---|---|---|
| `mb-way` | MB WAY | mb way, mbway | pt-1, pt-2 |
| `multibanco` | Multibanco (SIBS) | multibanco, sibs | references and ATMs |
| `ctt` | CTT | ctt, ctt expresso | pt-9 |
| `banco-ctt` | Banco CTT | banco ctt | pt-4 |
| `autoridade-tributaria` | Autoridade Tributária (Finanças) | autoridade tributaria, financas, portal das financas, at | "at" is too short to match safely; drop it |
| `seguranca-social-pt` | Segurança Social | seguranca social, seg social, seg-social, seguranca social direta | id differs from es `seguridad-social` |
| `sns` | SNS / SNS 24 / Ministério da Saúde | sns, sns 24, sns24, ministerio da saude, min saude | pt-7 |
| `autenticacao-gov` | Autenticação.gov | autenticacao gov, autenticacao.gov | pt-8 |
| `tap` | TAP Air Portugal | tap air portugal, tap | "tap" is ambiguous; prefer the full name |
| `policia-judiciaria` | Polícia Judiciária | policia judiciaria, pj | pt-12 |
| `psp` | PSP | psp, policia de seguranca publica | pt-12 |
| `gnr` | GNR | gnr, guarda nacional republicana | pt-12 |
| `asae` | ASAE | asae | pt-12 |
| `cmvm` | CMVM | cmvm | pt-14 |
| `banco-de-portugal` | Banco de Portugal | banco de portugal, bdp | |
| `cgd` | Caixa Geral de Depósitos | caixa geral de depositos, cgd, caixa | [U] bank names not tied to a specific source |
| `millennium-bcp` | Millennium bcp | millennium, bcp | [U] |
| `novo-banco` | novobanco | novo banco, novobanco | [U] |
| `olx` | OLX | olx | pt-2 |
| `vinted` | Vinted | vinted | pt-2 (also other EU countries) |
| `continente` | Cartão Continente | cartao continente | MP 2025-09-11 |
| existing `paypal`, `whatsapp`, `santander` | | | add `pt` to `countries` |

---

## Ireland (ie)

Language: `en` (Irish is an official language, but scam messages arrive in English, so entries are `en` only).
Emergency number: 999 / 112.

### Contacts

| Proposed id | Name | When to use | How to reach | Hours | Source | Checked | Sure |
|---|---|---|---|---|---|---|---|
| `ie/emergency` | Emergency (Gardaí, ambulance, fire) | Danger, or a crime happening now (for example a "courier" coming for your card) | phone `999` or `112` | 24h | https://www.garda.ie/en/crime/fraud/ | 2026-11-17 | [V] |
| `ie/garda-station` | An Garda Síochána (local Garda station) | To report fraud or attempted fraud. The fraud page says to report incidents to your local Garda station. Online reporting isn't mentioned. | in person at any Garda station; Garda HQ `+353 1 666 0000` | varies | https://www.garda.ie/en/crime/fraud/ | 2026-11-17 | [V] |
| `ie/garda-confidential` | Garda Confidential Line | To give information about fraud confidentially | phone `1800 666 111` | ? | https://www.garda.ie/en/crime/fraud/ | 2026-11-17 | [V] |
| `ie/your-bank` | Your bank | Call straight away if you paid, shared codes, dialled `*21*`, or gave away your card. Ask for a recall. Use the number on your card. | phone (on card) | usually 24/7 | https://www.fraudsmart.ie/2026/10/30/fraud-alert-do-not-dial-21-phone-codes-at-the-request-of-an-unexpected-caller/ | 2026-11-17 | [V] |
| `ie/boi-fraud` (optional) | Bank of Ireland fraud line | Bank of Ireland customers; also text `CHECK <message>` to 50365, or forward screenshots to 365Security@boi.com | phone `1800 946 764` | 24/7 | https://www.bankofireland.com/about-bank-of-ireland/press-releases/2026/bank-of-ireland-warns-about-expected-scams-on-new-customs-charges/ | 2026-11-17 | [V] |
| `ie/ccpc` | Competition and Consumer Protection Commission (CCPC) | Consumer rights; advice on scams and fake shops; report a business | phone `01 402 5555`; email `ask@ccpc.ie`; web `https://www.ccpc.ie/consumers/` | not stated | https://www.ccpc.ie/consumers/ | 2026-11-17 | [V] |
| `ie/central-bank` | Central Bank of Ireland | Check that an investment firm is authorised (registers.centralbank.ie); report an unauthorised or clone firm | phone `01 224 5800`; web form "report an unauthorised firm"; registers `https://registers.centralbank.ie/` | ? | https://www.centralbank.ie/news/article/jp-morgan-asset-management-(clone)---central-bank-of-ireland-issues-warning-on-unauthorised-firm | 2026-11-17 | [V] |
| `ie/mobile-provider` | Your mobile network | If you dialled `*21*` (call forwarding), get it switched off | your operator | | FraudSMART 2026-10-30 | 2026-11-17 | [V] |
| `ie/hotline` (optional) | Hotline.ie (Irish Internet Hotline) | Anonymous report of online financial scam content | web `https://hotline.ie/` | | garda.ie/cybercrime (search) | 2026-11-17 | [S] |

**Not contacts:** FraudSMART (BPFI) is an awareness site, not a reporting channel, but it is good for `sources`.
ComReg has no public scam-reporting line I could verify; its "Likely Scam" SMS tagging and planned voice firewall
are background only.

### Scams (17)

**ie-1. Bank impersonation text, then a "fraud team" call (safe account)**
- **How it works:** A text "from your bank" about a suspicious or declined transaction, sometimes landing in the same
  thread as real bank texts, tells you to call a number. The "fraud team" creates urgency and asks you to share
  codes, make a payment or move your money to a "safe account".
- **Channels:** sms, phone.
- **Sender:** Bank of Ireland, AIB, PTSB or any bank.
- **Signals:** urgency, impersonation, money_request, asks_for_code, keep_on_line.
- **Red flags:** a number to call inside the text; a request to move money; a request for a one-time passcode.
- **What to do:** call the number on your card; forward the text to your bank; report it to Gardaí.
- **Sources:**
  - "Fraud alert: Significant spike in cases of bank impersonation cases", Bank of Ireland, https://www.bankofireland.com/about-bank-of-ireland/press-releases/2026/fraud-alert-significant-spike-in-cases-of-bank-impersonation-cases/, 2026-06-04 [V]
  - "Protect your money from bank impersonators", FraudSMART (BPFI), https://www.fraudsmart.ie/2026/01/22/fraudsmart-alert-protect-your-money-from-bank-impersonators/, 2026-01-22 [V]

**ie-2. "Dial \*21\*" call-forwarding scam**
- **How it works:** A fake bank caller says there is suspicious activity or a problem with your phone and tells you to
  dial `*21*` plus a number "to verify your device". This forwards your calls to the criminal, who can then pass the
  real bank's security calls as you.
- **Channels:** phone, sms, email.
- **Sender:** your bank.
- **Signals:** impersonation, urgency, asks_for_code, keep_on_line.
- **Red flags:** being asked to type a code beginning `*21*` or to change phone settings.
- **What to do:** hang up; if you dialled it, call your bank and your mobile provider to cancel forwarding; report
  it to Gardaí.
- **Sources:**
  - "Fraud Alert: Do not dial \*21\* phone codes at the request of an unexpected caller", FraudSMART, https://www.fraudsmart.ie/2026/10/30/fraud-alert-do-not-dial-21-phone-codes-at-the-request-of-an-unexpected-caller/, 2026-10-30 [V]

**ie-3. Courier card scam (card collected at your door)**
- **How it works:** A text about suspicious activity, then a call from the "bank security team". You are told a
  courier or taxi will collect your card for security, asked for your PIN, and sometimes told to delete your banking
  app.
- **Channels:** sms, phone, in-person.
- **Sender:** your bank.
- **Signals:** impersonation, urgency, asks_for_code, keep_on_line.
- **Red flags:** anyone collecting your card; being asked for your PIN.
- **What to do:** never hand over your card; call your bank from another phone; call 999 if someone is on the way.
- **Sources:**
  - "FraudSMART warning – Beware of courier card scams", FraudSMART, https://www.fraudsmart.ie/2026/02/24/fraudsmart-warning-beware-of-courier-card-scams/, 2026-02-24 [V]

**ie-4. Fake bank "live chat" remote-access scam**
- **How it works:** A "bank fraud department" caller says there is a suspicious payment and sends you to a look-alike
  website with a "start live chat" button. That installs a remote-access app; they take control, and the
  "cancellation" actually moves your money to them.
- **Channels:** phone, online.
- **Sender:** your bank.
- **Signals:** remote_access, impersonation, urgency, keep_on_line.
- **Red flags:** being asked to download an app or share your screen.
- **What to do:** hang up; never install software at a caller's request; call your bank.
- **Sources:**
  - "Increase in phone scams asking for remote access to your laptop", FraudSMART, https://www.fraudsmart.ie/2025/08/26/remote-access-scam/, 2025-08-26 [V]

**ie-5. AI ads for a fake "state-backed" investment scheme**
- **How it works:** AI-generated ads with fake videos of Irish politicians and businesspeople promote a "state-backed"
  savings scheme. They exploit news of a real planned scheme, say places are limited, and promise guaranteed
  returns. Clicking registers you, then "advisers" call.
- **Channels:** social, online, phone.
- **Sender:** politicians, "the Government", celebrities.
- **Signals:** too_good_to_be_true, urgency, impersonation.
- **Red flags:** a famous face in an ad; guaranteed monthly income; "places snapped up".
- **What to do:** check the Central Bank register; don't give your details; report it to Gardaí and your bank.
- **Sources:**
  - "Surge in AI-generated online adverts promoting bogus state-backed investment schemes…", FraudSMART, https://www.fraudsmart.ie/2026/05/28/investment-scams-campaign-2026/, 2026-05-28 [V] (Garda: investment fraud reports up more than 20% in 2025, over €20m lost)
  - "Over 50s warned to be on high alert for investment scams following marked increase in adverts featuring AI-generated celebrity endorsements", FraudSMART, https://www.fraudsmart.ie/2025/11/10/investment-scams-campaign/, 2025-11-10 [S] (title from RSS)

**ie-6. Fake bonds and fixed-term deposits (ads, then an "adviser")**
- **How it works:** Short-lived, professional-looking ads link to well-known European banks and offer "bonds" or
  "deposits". A fake adviser calls or emails, quotes real bond ISINs and fake regulation, asks for ID and has you
  transfer money, often abroad.
- **Channels:** online, social, phone, email.
- **Sender:** European banks and investment firms.
- **Signals:** too_good_to_be_true, impersonation, urgency, money_request.
- **Red flags:** an unsolicited offer; an account outside Ireland; contact details that don't match the firm's.
- **What to do:** check registers.centralbank.ie; get independent advice; report it to Gardaí.
- **Sources:**
  - "GNECB – An Garda Síochána Advises the Public to be Extra Vigilant of Fraud When Investing", An Garda Síochána, https://www.garda.ie/en/about-us/our-departments/office-of-corporate-communications/press-releases/2025/october/gnecb-an-garda-siochana-advises-the-public-to-be-extra-vigilant-of-fraud-when-investing.html, 2025-10-02 [V]

**ie-7. Clone investment firm**
- **How it works:** Scammers copy the name, address and sometimes the registration numbers of an authorised firm (in
  2026: JP Morgan, LGIM, AllianceBernstein and others) and cold-call or email offering deposits and bonds from
  look-alike domains.
- **Channels:** phone, email, online.
- **Sender:** a real authorised firm.
- **Signals:** impersonation, too_good_to_be_true, money_request.
- **Red flags:** an unsolicited call; a domain that differs slightly; a payment account that doesn't match.
- **What to do:** contact the firm through the Central Bank register's details; report to the Central Bank on
  01 224 5800.
- **Sources:**
  - "JP Morgan Asset Management (CLONE) – Central Bank of Ireland Issues Warning on Unauthorised Firm", Central Bank of Ireland, https://www.centralbank.ie/news/article/jp-morgan-asset-management-(clone)---central-bank-of-ireland-issues-warning-on-unauthorised-firm, 2026-08-06 [V]

**ie-8. An Post customs-charge text**
- **How it works:** Since new customs charges began on 1 July 2026 (€3 per item on non-EU parcels of €150 or less),
  texts "from An Post" ask you to pay a small customs fee by link. The page steals your card details.
- **Channels:** sms.
- **Sender:** An Post (sometimes Revenue).
- **Signals:** unknown_link, urgency, money_request, impersonation.
- **Red flags:** a link in a customs text. An Post never texts payment links, and Revenue doesn't ask for customs
  payments by text.
- **What to do:** delete it; check on anpost.com; call your bank if you paid.
- **Sources:**
  - "Bank of Ireland warns about expected scams on new customs charges", Bank of Ireland, https://www.bankofireland.com/about-bank-of-ireland/press-releases/2026/bank-of-ireland-warns-about-expected-scams-on-new-customs-charges/, 2026-06-29 [V]
  - "Watchdog warns of spike in scam text messages as new customs charges take effect on 1 July", TheJournal.ie (CCPC), https://www.thejournal.ie/watchdog-warns-of-spike-in-scam-text-messages-as-new-customs-charges-to-take-effect-on-1-july-7076307-Jun2026/, 2026-06 [S]

**ie-9. eFlow / unpaid motorway toll text**
- **How it works:** A text says you have an unpaid M50 or motorway toll and face prosecution, with a link to a fake
  eFlow site. It hits people who really did drive through a toll.
- **Channels:** sms.
- **Sender:** eFlow / toll operator.
- **Signals:** unknown_link, urgency, money_request, impersonation.
- **Red flags:** a link in the text (eFlow doesn't send links); a threat of prosecution.
- **What to do:** pay only on eflow.ie, typed by hand; delete the text.
- **Sources:**
  - "Gardaí urge public to be vigilant over latest eFlow scam texts", Irish Examiner, https://www.irishexaminer.com/news/arid-41674754.html, 2025-07 [S]
  - Bank of Ireland "Bank of Ireland warns customers to be wary of 'smishing' scams this Christmas" (motorway toll texts), https://www.bankofireland.com/about-bank-of-ireland/press-releases/2025/bank-of-ireland-warns-customers-to-be-wary-of-smishing-scams-this-christmas/, 2025-12 (page undated) [V/U-date]

**ie-10. Revenue tax refund or urgent payment message**
- **How it works:** An email, text or call "from Revenue", even from `noreply@revenue.ie`, says you are due a refund
  or must pay urgently, or are "due an audit", and asks for personal or bank details through a link.
- **Channels:** email, sms, phone.
- **Sender:** Revenue / ROS / myAccount.
- **Signals:** unknown_link, urgency, impersonation, too_good_to_be_true.
- **Red flags:** Revenue doesn't correspond by ordinary email or SMS and won't ask for financial details on the phone.
- **What to do:** log in to myAccount or ROS yourself; reset your password if you entered it; call your bank if you
  gave card details.
- **Sources:**
  - "Revenue provides further warning on fraudulent communications", Chartered Accountants Ireland, https://www.charteredaccountants.ie/News/revenue-provides-further-warning-on-fraudulent-communications, 2026-09-28 [S]
  - "Revenue scam warning", An Garda Síochána, https://www.garda.ie/en/about-us/our-departments/office-of-corporate-communications/news-media/revenue-scam-warning.html, undated [U]
- **Note:** revenue.ie's own scam page wasn't found. Read a Revenue page before citing.

**ie-11. "GOV IE" text: reduced electricity bill or emergency payment**
- **How it works:** A text from "GOV IE" says you qualify for a reduced electricity bill under an "Emergency Benefit
  Scheme" (timed after Storm Chandra) and links to a fake page.
- **Channels:** sms, email.
- **Sender:** GOV IE / Department of Social Protection / MyGovID.
- **Signals:** too_good_to_be_true, unknown_link, impersonation.
- **Red flags:** a benefit offered by text with a link. The Department doesn't ask for bank details by SMS.
- **What to do:** check gov.ie or mywelfare.ie yourself; delete the text.
- **Sources:**
  - "Warning of scam text messages for reduced electricity bill", RTÉ, https://www.rte.ie/news/business/2026/0130/1555948-reduced-electricity-bill-scam-warning, 2026-01-30 [V]

**ie-12. "Hi Mum / Hi Dad" text from a new number**
- **How it works:** A text or WhatsApp message from an unknown number claims to be your child with a new phone, then
  asks for money or a photo of your card.
- **Channels:** sms, whatsapp.
- **Sender:** a son or daughter.
- **Signals:** new_number, impersonation, money_request, urgency.
- **Red flags:** a new number; they can't talk; urgent money.
- **What to do:** ring your child on the old number; don't send card photos; report it to Gardaí and your bank.
- **Sources:**
  - "Warning: spike in family impersonation messages being sent by fraudsters", Nenagh Live (Bank of Ireland advice), https://www.nenaghlive.ie/news/national-news/1258466/warning-spike-in-family-impersonation-messages-being-sent-by-fraudsters.html, 2025-10-23 [S]
  - "Family Impersonation Scams", Bank of Ireland, https://www.bankofireland.com/security-zone/fraudster-tactics/family-impersonation-scams/, undated [S]
- **Note:** weak sourcing. There is no 2026 Garda statement; read a page before citing.

**ie-13. Fake Garda on WhatsApp (Garda crest as profile picture)**
- **How it works:** WhatsApp calls or messages from someone using the Garda crest as their profile photo, asking for
  bank or personal details.
- **Channels:** whatsapp, phone.
- **Sender:** An Garda Síochána.
- **Signals:** impersonation, urgency.
- **Red flags:** Gardaí never contact you unexpectedly for financial or personal details.
- **What to do:** hang up; ring your local station; report it.
- **Sources:**
  - "Irish WhatsApp users warned as scammers use official crest to pose as Gardaí in new fraud", Letterkenny Live, https://www.letterkennylive.ie/news/national-news/1993794/irish-whatsapp-users-warned-as-scammers-use-official-crest-to-pose-as-gardai-in-new-fraud.html, 2026-04-21 [S]

**ie-14. Rental and student accommodation scam**
- **How it works:** A cheap listing; an "absent landlord" abroad, or a fake host showing the place to many people;
  deposits taken by transfer, crypto or gift cards; sometimes fake contracts and keys. Peaks in August–October.
- **Channels:** online, social, whatsapp.
- **Sender:** a landlord or agent.
- **Signals:** too_good_to_be_true, urgency, money_request.
- **Red flags:** no viewing; pressure to pay; contact only on WhatsApp or Messenger; payment by crypto or gift card.
- **What to do:** view the place and test the keys before paying; check the RTB; pay traceably; report it to Gardaí.
- **Sources:**
  - "An Garda Síochána issues student fraud warning ahead of CAO offers", An Garda Síochána, https://www.garda.ie/en/about-us/our-departments/office-of-corporate-communications/press-releases/2026/august/25-08-2026-an-garda-siochana-issues-student-fraud-warning-ahead-of-cao-offers-25th-august-2026.html, 2026-08-25 [V] (over 230 reports and €400k lost, January–July 2026)
  - "Students warned to be on alert for accommodation scams", FraudSMART, https://www.fraudsmart.ie/2025/08/26/student-accommodation-scams/, 2025-08-26 [V]

**ie-15. Money mule recruitment ("easy money for using your account")**
- **How it works:** Someone on social media, a fake job ad or an online "friend" offers cash to receive and pass on
  money through your account. It is money laundering, with up to 14 years in prison.
- **Channels:** social, online, whatsapp.
- **Sender:** a recruiter or friend.
- **Signals:** too_good_to_be_true, money_request, secrecy.
- **Red flags:** being paid to let money pass through your account.
- **What to do:** refuse; tell your bank; report it to Gardaí.
- **Sources:**
  - "Over €7 million laundered through money mule accounts in the 12 months to June 2026", FraudSMART, https://www.fraudsmart.ie/2026/10/21/money-mules-campaign-2026/, 2026-10-21 [V]
  - Garda student fraud warning (above), 2026-08-25 [V]

**ie-16. Paid survey or "test a banking app" offer**
- **How it works:** An online ad (or an AI search result) offers easy cash for a survey or for testing a banking app,
  sometimes using your bank's name. You are moved to a chat, then asked to log in to your banking, share your screen
  or install software, and share codes.
- **Channels:** online, social, whatsapp.
- **Sender:** your bank, or a survey company.
- **Signals:** too_good_to_be_true, remote_access, asks_for_code.
- **Red flags:** being paid to log in to your bank with someone watching.
- **What to do:** stop; never share your screen or codes; call your bank.
- **Sources:**
  - "Beware of paid survey scams that put your bank account at risk", FraudSMART, https://www.fraudsmart.ie/2026/07/13/beware-of-paid-survey-scams-that-put-your-bank-account-at-risk/, 2026-07-13 [V]

**ie-17. Romance scam**
- **How it works:** A fake profile builds a relationship over weeks or months, moves you to private messaging, avoids
  meeting, then needs money for an emergency or because their account is "frozen for legal reasons", and asks you to
  keep it secret.
- **Channels:** social, online, whatsapp.
- **Sender:** an online partner.
- **Signals:** money_request, secrecy, urgency.
- **Red flags:** never meets; their money is "frozen"; asks for secrecy.
- **What to do:** stop paying; talk to someone; report it at a Garda station.
- **Sources:**
  - "Don't Let Romance Scammers Break Your Heart This Valentine's Day", FraudSMART, https://www.fraudsmart.ie/2026/02/13/dont-let-romance-scammers-break-your-heart-this-valentines-day/, 2026-02-13 [V]

**Candidates not drafted:** fake online shops (FraudSMART "Shop safely online this Christmas", 2025-11-28, title
only); invoice redirection and CEO fraud (FraudSMART 2026-03-27, aimed at businesses); bogus tradesmen (Garda
2026-08-12, an arrest, not a warning); travel and holiday scams (FraudSMART 2025-06-18, not read).

### Brands (ie)

| id | name | aliases | Notes |
|---|---|---|---|
| `revenue-ie` | Revenue | revenue, revenue commissioners, ros, myaccount | ie-10 |
| `an-post` | An Post | an post, anpost | ie-8 |
| `eflow` | eFlow | eflow, e flow, m50 toll | ie-9 |
| `bank-of-ireland` | Bank of Ireland | bank of ireland, boi, 365 online | ie-1 |
| `aib` | AIB | aib, allied irish banks | [U] named in the task, not in a source read |
| `ptsb` | PTSB | ptsb, permanent tsb | [U] |
| `revolut` | Revolut | revolut | ie [U]; mt [V] |
| `gov-ie` | gov.ie / MyGovID / MyWelfare | gov ie, gov.ie, mygovid, mywelfare, department of social protection | ie-11 |
| `garda` | An Garda Síochána | garda, gardai, an garda siochana | ie-13 |
| `central-bank-ie` | Central Bank of Ireland | central bank of ireland | |
| existing `whatsapp`, `amazon`, `paypal`, `microsoft`, `dhl`, `ups` | | | add `ie` only if an entry uses them |

---

## Malta (mt)

Languages: `mt`, `en`. Most official warnings and news are in English, and English is widely used for scam
messages. Bank-impersonation calls are in **Maltese** (police: "a woman speaking fluent Maltese"); the Revolut calls
are in English. **Decide per entry:** `lang: "mt"` with `mt` + `en` text for the Maltese-language bank calls;
`lang: "en"` for the rest. Emergency number: 112.

### Contacts

| Proposed id | Name (en / mt) | When to use | How to reach | Hours | Source | Checked | Sure |
|---|---|---|---|---|---|---|---|
| `mt/emergency` | Emergency 112 / Emerġenza 112 | Immediate danger | phone `112`; textphone `7977 0112` | 24h | https://scamalert.mt/how-to-report-a-scam/ | 2026-11-17 | [V] |
| `mt/police` | Malta Police Force / Il-Pulizija ta' Malta | Report online fraud, cybercrime or any criminal complaint | phone `+356 2122 4001`; web form `https://pulizija.gov.mt/en/file-a-report/`; any district police station | ? | https://scamalert.mt/how-to-report-a-scam/ | 2026-11-17 | [V] (police site 403) |
| `mt/cyber-crime-unit` | Police Cyber Crime Unit / Unità tal-Kriminalità Ċibernetika | Phishing, SMS scams, hacked accounts | phone `+356 2294 2231`; email `computer.crime@gov.mt` | ? | https://www.maltapost.com/scamprotection | 2026-11-17 | [V] (also the MCA and ĠEMMA [S]) |
| `mt/crime-stop` | Crime Stop 119 | Check whether a "police" caller is real | phone `119` | ? | https://newsbook.com.mt/en/police-warn-of-spoofed-calls-as-scammers-impersonate-officers/ (2026-04-30) | 2026-11-17 | [V] (via news) |
| `mt/your-bank` | Your bank or payment provider / Il-bank tiegħek | Call now if you clicked, paid or shared codes | number on card or app | | https://scamalert.mt/how-to-report-a-scam/ | 2026-11-17 | [V] |
| `mt/mfsa` | Malta Financial Services Authority (MFSA) | Check the Financial Services Register; report unauthorised firms or suspicious investments | phone `+356 2144 1155`; register `https://www.mfsa.mt/financial-services-register/` | ? | https://scamalert.mt/how-to-report-a-scam/ | 2026-11-17 | [V] |
| `mt/arbiter` | Office of the Arbiter for Financial Services (OAFS) | Complaint about a licensed provider's handling of your case, after first complaining to the provider (for example a bank refusing a refund) | phone `+356 2124 9245`; web `https://www.financialarbiter.org.mt/contact-us/` | ? | https://scamalert.mt/how-to-report-a-scam/ | 2026-11-17 | [V] |
| `mt/victim-support` | Victim Support Agency | Support for victims | phone `116 006`; web `https://victimsupportagency.com/contact-us/` | ? | https://scamalert.mt/how-to-report-a-scam/ | 2026-11-17 | [V] |
| `mt/scamalert` | scamalert.mt | National scam guide run by the MFSA, Police and Arbiter (launched 31 Aug 2026). It doesn't take reports; it tells you whom to contact. | web `https://scamalert.mt/` (mt + en) | | https://scamalert.mt/ | 2026-11-17 | [V] |

Other numbers for `whatToDo`: MTCA Freephone `153` (newsbook 2026-08-13) [V via news]; MCA `+356 2133 6840` [S].
The MCA isn't a scam-reporting channel.

### Scams (17)

**mt-1. Bank impersonation SMS, then a Maltese-speaking "fraud department" call**
- **How it works:** An SMS with a link (which changes often), then a call from a spoofed "local" number (police named
  `+356 99180001` / `+356 991800001`). A woman speaking fluent Maltese ("Sandra", "Cynthia", "Rachel") uses your
  name and asks about a transaction on an iPhone in some town. When you deny it, she sends a link to "cancel" it,
  which is a fake bank site. After the call, money goes to accounts abroad. One 2026 case involved about 200 victims
  and €1m; Bank of Valletta was impersonated.
- **Channels:** sms, phone.
- **Sender:** Bank of Valletta (BOV) or another Maltese bank.
- **Signals:** impersonation, unknown_link, urgency, keep_on_line, asks_for_code.
- **Red flags:** a caller sending a link to stop transactions; a text in the bank's real SMS thread with a link (BOV
  doesn't send links).
- **What to do:** hang up and call the number on your card; report it to the police or Cyber Crime Unit; keep
  screenshots and the number.
- **lang:** `mt` (calls in Maltese).
- **Sources:**
  - "Police issue warning over banking fraud scam", Newsbook, https://newsbook.com.mt/en/police-issue-warning-over-banking-fraud-scam/, 2025-07-07 [V]
  - "Police warn Public of ongoing scam involving fake bank calls and messages", TVMnews, https://tvmnews.mt/en/news/police-warn-public-of-ongoing-scam-involving-fake-bank-calls-and-messages/, 2025-07-07 [V]
  - "Two arrested in Malta over online fraud that defrauded 200 victims of €1m", Newsbook, https://newsbook.com.mt/en/two-arrested-in-malta-over-online-fraud-that-defrauded-200-victims-of-e1m/, 2026-02-03 [V]

**mt-2. AI-cloned Maltese voice "from the bank"**
- **How it works:** A call from a spoofed number of a leading bank, with a convincing AI voice speaking fluent
  Maltese, urging you to send money. Police recorded 33 cases and €150k lost in Q1 2025. This could be a variant
  inside mt-1; decide when drafting.
- **Channels:** phone.
- **Sender:** a Maltese bank.
- **Signals:** impersonation, urgency, money_request.
- **Red flags:** the bank asking you to transfer money.
- **What to do:** verify before acting; call the bank back; report it.
- **lang:** `mt`.
- **Sources:**
  - "AI now being used to target victims of fraud", TVMnews, https://tvmnews.mt/en/news/ai-now-being-used-to-target-victims-of-fraud/, 2025-06-05 [V]

**mt-3. Revolut impersonation call threatening police**
- **How it works:** A recorded English message, often from a Maltese number, says your personal details don't match
  and threatens a police report. A second caller asks for account codes and personal information, and accounts are
  emptied within hours.
- **Channels:** phone.
- **Sender:** Revolut.
- **Signals:** impersonation, urgency, asks_for_code.
- **Red flags:** threats of police; asking for codes. Revolut says it never threatens police action.
- **What to do:** hang up; check in the app; block the number; report it.
- **Sources:**
  - "15 report being victims of Revolut impersonation scams", Newsbook, https://newsbook.com.mt/en/15-report-being-victims-of-revolut-impersonation-scams/, 2026-03-14 [V]

**mt-4. Fake police call from a spoofed local number**
- **How it works:** A caller using a spoofed local mobile number poses as a police officer, asks questions, then wants
  personal details, including your email, to set up a fictitious appointment. Older versions used a recorded message
  saying your eID was flagged or an arrest warrant had been issued.
- **Channels:** phone.
- **Sender:** Malta Police Force.
- **Signals:** impersonation, urgency.
- **Red flags:** the "police" phoning for personal details; talk of an arrest warrant.
- **What to do:** hang up; check by calling Crime Stop on 119.
- **Sources:**
  - "Police warn of 'spoofed' calls as scammers impersonate officers", Newsbook, https://newsbook.com.mt/en/police-warn-of-spoofed-calls-as-scammers-impersonate-officers/, 2026-04-30 [V]
  - Malta Police PR 251/26 "Appeal on misleading telephone calls", https://pulizija.gov.mt/en/appeal-on-misleading-telephone-calls/, 2026 [S] (site 403)

**mt-5. MTCA tax refund SMS and fake tax portal**
- **How it works:** An SMS "from the MTCA" says you are owed a tax refund and links to a copy of the MTCA site that
  asks for card details "to receive" it. Many victims lost money. The MTCA also warned of look-alike portals; its
  only site is mtca.gov.mt. An older variant threatened seizure over a tax debt.
- **Channels:** sms, online.
- **Sender:** Malta Tax and Customs Administration (MTCA), formerly Inland Revenue.
- **Signals:** too_good_to_be_true, unknown_link, impersonation.
- **Red flags:** card details needed to *receive* money; any domain other than mtca.gov.mt.
- **What to do:** don't enter card details; call MTCA on 153; call your bank; report it.
- **Sources:**
  - "Police warn of fraudulent tax refund SMS scam", Newsbook, https://newsbook.com.mt/en/police-warn-of-fraudulent-tax-refund-sms-scam/, 2026-08-19 [V]
  - "Public warned of fraudulent websites impersonating official tax portal", Newsbook, https://newsbook.com.mt/en/public-warned-of-fraudulent-websites-impersonating-official-tax-portal/, 2026-08-13 [V]

**mt-6. LESA traffic fine SMS**
- **How it works:** A text about a traffic contravention or fine links to a site that imitates the LESA portal, so
  you think you are paying a citation. LESA's only site is les.gov.mt.
- **Channels:** sms.
- **Sender:** LESA (Local Enforcement System Agency).
- **Signals:** unknown_link, urgency, money_request, impersonation.
- **Red flags:** a fine paid by link in a text.
- **What to do:** check on les.gov.mt yourself; call your bank if you paid.
- **Sources:**
  - "LESA warns against scam text messages", MaltaToday, https://www.maltatoday.com.mt/news/national/143741/lesa_warns_against_scam_text_messages_, ~2026-08 [S] (date inferred from article ID; Newsbook 2026-08-13 mentions recent LESA alerts [V])

**mt-7. Parcel delivery SMS (MaltaPost, UPS)**
- **How it works:** An SMS says a parcel is waiting and asks you to confirm details or pay a fee by link on
  look-alike domains (myparcel-customer.com, malta-post.com, ma1tapost.com). The page steals your card details.
- **Channels:** sms, email.
- **Sender:** MaltaPost, UPS.
- **Signals:** unknown_link, money_request, impersonation.
- **Red flags:** the wrong domain; a fee by link.
- **What to do:** check tracking on maltapost.com or the courier's site; report it to the Cyber Crime Unit.
- **Sources:**
  - "Police issue warning on text message parcel scam", Newsbook, https://newsbook.com.mt/en/police-issue-warning-on-text-message-parcel-scam/, 2025-01-27 [V]
  - "Delivery scams", MaltaPost, https://www.maltapost.com/scamprotection, undated [V]

**mt-8. WhatsApp "vote for me" link (account takeover)**
- **How it works:** A message from one of your contacts asks you to vote for someone in a competition or for a study
  grant through a link. The link gives scammers your WhatsApp, and they then ask your contacts for money. A variant
  asks you to forward a six-digit code "sent by mistake".
- **Channels:** whatsapp.
- **Sender:** a friend or relative (whose account has been hacked).
- **Signals:** unknown_link, asks_for_code, impersonation, money_request.
- **Red flags:** a vote link from a friend; requests for a code; a friend suddenly asking for money.
- **What to do:** don't click; turn on two-step verification; log out of linked devices; phone the friend before
  paying.
- **Sources:**
  - "Police issue warning regarding WhatsApp scam", The Malta Independent, https://www.independent.com.mt/articles/2026-07-14/local-news/Police-issue-warning-regarding-WhatsApp-scam-6736291346, 2026-07-14 [S] (date from URL; page 403)
  - Newsbook (Maltese) "Il-Pulizija twissi fuq messaġġi scam biex 'persuna tirċievi borża ta' studju'", https://newsbook.com.mt/il-pulizija-twissi-fuq-messaggi-scam-biex-persuna-tircievi-borza-ta-studju/, ~2026-06-16 [S]

**mt-9. Fake broker or investment platform**
- **How it works:** "Brokers" contact you after an ad or cold call, show fake profits on a platform, use remote
  access, and push for more deposits. Fake investments were the largest category in police data: €8.3m of €13m
  investigated in H1 2025.
- **Channels:** phone, social, online, whatsapp.
- **Sender:** a broker or account manager.
- **Signals:** too_good_to_be_true, remote_access, urgency, money_request.
- **Red flags:** guaranteed profits; sending money abroad or in crypto; no MFSA licence.
- **What to do:** check the MFSA register; stop paying; report it to the police.
- **Sources:**
  - "Police investigated €13 million worth of scams in first 6 months this year", Newsbook, https://newsbook.com.mt/en/police-investigated-e13-million-worth-of-scams-in-first-6-months-this-year/, 2025-09-30 [V]
  - "Investment Fraud", scamalert.mt, https://scamalert.mt/scam-type/investment-fraud/, undated [S]

**mt-10. Deepfake video of the Prime Minister or celebrities promoting crypto**
- **How it works:** An AI video of PM Robert Abela (or a celebrity) on social media endorses a crypto scheme. Victims
  pay by transfer and in cash, and are pressed for more. One victim lost €52k.
- **Channels:** social, online, phone.
- **Sender:** the Prime Minister, public figures.
- **Signals:** too_good_to_be_true, impersonation, money_request.
- **Red flags:** a politician endorsing an investment in an ad.
- **What to do:** ignore it; report the ad; report it to the police.
- **Sources:**
  - "Ukrainian woman accused of using deepfake PM video in cryptocurrency scam", Newsbook, https://newsbook.com.mt/en/ukrainian-woman-accused-of-using-deepfake-pm-video-in-cryptocurrency-scam/, 2025-09-25 [V]

**mt-11. Clone or unlicensed financial firm**
- **How it works:** Firms copy a licensed firm's name or falsely claim an MFSA licence or Maltese registration
  (insurance, investments, loans).
- **Channels:** online, phone, email.
- **Sender:** a "Maltese licensed" firm.
- **Signals:** impersonation, too_good_to_be_true.
- **Red flags:** you can't find the firm, or the same contact details, on the MFSA register.
- **What to do:** check the MFSA register and the warnings list; don't pay.
- **Sources:**
  - "Public urged to avoid two unlicensed financial operators", Newsbook (MFSA), https://newsbook.com.mt/en/public-urged-to-avoid-two-unlicensed-financial-operators/, 2026-06-22 [S]
  - "MFSA warns public over 'dubious' insurance schemes", The Malta Independent, https://www.independent.com.mt/articles/2026-08-24/local-news/MFSA-warns-public-over-dubious-insurance-schemes-6736292341, 2026-08-24 [S]
  - "Clone Firms", scamalert.mt, https://scamalert.mt/scam-type/clone-firms/, undated [S]

**mt-12. Calls from people claiming to represent MFSA-licensed firms**
- **How it works:** Unsolicited calls from people falsely claiming to represent a licence holder, offering investment
  advice or other financial services.
- **Channels:** phone, social.
- **Sender:** a licensed bank, investment firm or payment firm.
- **Signals:** impersonation, urgency.
- **Red flags:** an unexpected call offering investments.
- **What to do:** hang up; contact the firm on its official number from the MFSA register.
- **Sources:**
  - "MFSA Warning – Scam Calls Impersonating Licence Holders", MFSA, https://www.mfsa.mt/news-item/mfsa-warning-scam-calls-impersonating-licence-holders/, 2026-06-19 [S] (mfsa.mt 403)

**mt-13. Money recovery scam (fake "MFSA compensation programme" ads)**
- **How it works:** Ads claim the MFSA has launched a compensation programme for Maltese residents who lost money to
  fake brokers, with a "learn more" link to check whether you are eligible. Then you are charged fees to "recover"
  your money.
- **Channels:** social, online, phone, email.
- **Sender:** MFSA; "law firms" (for example "Lexford Legal Group").
- **Signals:** too_good_to_be_true, impersonation, money_request.
- **Red flags:** paying to get back money already lost. The MFSA doesn't run compensation programmes or pursue
  fraudsters; the police do.
- **What to do:** don't pay; report it to the police and the MFSA.
- **Sources:**
  - "MFSA Warning – Money Recovery Scam – Fraudulent Ads", MFSA, https://www.mfsa.mt/news-item/mfsa-warning-money-recovery-scam-fraudulent-ads/, 2026-07-09 [S]
  - "MFSA Warnings – Lexford Legal Group – Compensation Programme Fake Ads", MFSA, https://www.mfsa.mt/news-item/mfsa-warnings-lexford-legal-group-compensation-programme-fake-ads/, 2026-04-30 [S]

**mt-14. Regulator impersonation (fake MFSA "investigation" or crypto transition)**
- **How it works:** Messages or documents "from the MFSA" or another regulator claim an investigation is linked to
  your account, or that crypto must be moved because of MiCA rules, and ask for documents or "verification fees" or
  "taxes", often on WhatsApp.
- **Channels:** email, whatsapp, phone.
- **Sender:** MFSA, EU regulators, crypto-asset providers.
- **Signals:** impersonation, urgency, money_request.
- **Red flags:** a sender address not ending in `@mfsa.mt`; fees to unblock money; an investigation you didn't know
  about.
- **What to do:** contact the MFSA directly; don't send money or documents.
- **Sources:**
  - "MFSA Notice – Crypto-Related Impersonation Scams During MiCA Transition", MFSA, https://www.mfsa.mt/?p=64051, 2026-08-07 [S]
  - "Impersonation Scams", scamalert.mt, https://scamalert.mt/scam-type/impersonation-scams/, undated [V]

**mt-15. Romance scam**
- **How it works:** An online relationship that turns to money requests; it is often combined with crypto
  "investing" (pig-butchering). Police saw 10 cases worth €170k in H1 2025.
- **Channels:** social, online, whatsapp.
- **Sender:** an online partner.
- **Signals:** money_request, secrecy, too_good_to_be_true.
- **Red flags:** never meets; pushes an investment platform; asks for money.
- **What to do:** stop paying; report it to the police; contact Victim Support on 116 006.
- **Sources:**
  - "Police investigated €13 million worth of scams in first 6 months this year", Newsbook, https://newsbook.com.mt/en/police-investigated-e13-million-worth-of-scams-in-first-6-months-this-year/, 2025-09-30 [V]
  - "Romance Scams", scamalert.mt, https://scamalert.mt/scam-type/romance-scams/, undated [S]

**mt-16. Business email compromise (fake CEO or invoice)**
- **How it works:** A scammer impersonates a company's CEO or director, or a supplier, and instructs staff to pay
  fake invoices or change bank details. It accounted for €3.5m in H1 2025.
- **Channels:** email.
- **Sender:** your boss, or a supplier.
- **Signals:** impersonation, urgency, secrecy, money_request.
- **Red flags:** an urgent payment request; new bank details by email.
- **What to do:** confirm by phone on a known number; report it to your bank and the police.
- **Sources:**
  - Newsbook (2025-09-30, above) [V]
  - "Business Email Compromise (BEC)", scamalert.mt, https://scamalert.mt/scam-type/business-email-compromise/, undated [S]
- **Note:** aimed at businesses. Include it only if scamdb covers business scams.

**mt-17. Fake police or Interpol email accusing you of a crime**
- **How it works:** An email using police or Interpol branding accuses you of sexual offences and demands that you
  reply or pay to avoid prosecution.
- **Channels:** email.
- **Sender:** Malta Police Force, Interpol, Europol.
- **Signals:** impersonation, urgency, secrecy, money_request.
- **Red flags:** police don't send accusations by email asking for payment.
- **What to do:** don't reply; report it to the Cyber Crime Unit.
- **Sources:**
  - "Police force alerts public to scam email being circulated", The Malta Independent, https://www.independent.com.mt/articles/2025-10-10/local-news/Police-force-alerts-public-to-scam-email-being-circulated-6736273831, 2025-10-10 [S] (**content unverified**: I only saw the title; the Interpol/sex-crime detail comes from older MaltaToday items [S/U])

**Candidates not drafted:** Identity Malta / eID fee calls (MaltaToday 118161, probably 2022 [U]); rental scams on
Facebook groups (Lovin Malta, undated and old); "Hi Mum" (no Maltese source found); APS Bank and HSBC Malta (no
specific warnings found).

### Brands (mt)

| id | name | aliases | Notes |
|---|---|---|---|
| `bov` | Bank of Valletta | bank of valletta, bov | mt-1 |
| `aps-bank` | APS Bank | aps bank, aps | [U] no specific warning found |
| `hsbc-malta` | HSBC Malta | hsbc | [U] |
| `revolut` | Revolut | revolut | mt-3 (shared with ie) |
| `malta-police` | Malta Police Force | malta police, pulizija, police force | mt-4, mt-17 |
| `mtca` | MTCA (Tax and Customs) | mtca, malta tax and customs, inland revenue, cfr | mt-5 |
| `lesa` | LESA | lesa, local enforcement system agency | mt-6 |
| `maltapost` | MaltaPost | maltapost, malta post | mt-7 |
| `mfsa` | MFSA | mfsa, malta financial services authority | mt-11 to mt-14 |
| `identita` | Identità (Identity Malta) | identita, identity malta, eid | [U] older |
| `interpol` | Interpol / Europol | interpol, europol | mt-17 (also generic) |
| existing `ups`, `whatsapp` | | | add `mt` |

---

## Open questions for the drafter

1. **Malta `lang`:** use `mt` + `en` only for mt-1 and mt-2 (Maltese-language calls). Everything else is `en`.
2. **Duplicates:** the scam types repeat across countries (bank impersonation, Hi Mum, romance, investment). That's
   fine, because entries are per-country, but phrases should use local terms: "MB WAY", "referência Multibanco",
   "penhora", "Seg-Social", "eFlow", "An Post", "BOV", "MTCA".
3. **[S] sources:** read each page before citing it, especially MFSA (403 here), Renascença (403), MaltaToday (403)
   and the Revenue reposts. If a page can't be read, keep it only as an extra source.
4. **Contacts still to confirm:** the PJ email and phone, the CNCS form, Banco de Portugal's contact page, and the
   Linha Internet Segura hours. The Malta Police phone number comes from scamalert.mt; confirm it on pulizija.gov.mt
   from a normal browser.
