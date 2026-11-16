# scamdb engine report

198 labelled messages (108 scams, 90 safe).

## Keyword matcher

| | scams caught | called "scam" | right match first | right match in top 3 | wrong matches | safe called "scam" | safe flagged | safe with a match |
|---|---|---|---|---|---|---|---|---|
| **all** | 96.3% (104/108) | 41.7% | 61.1% | 72.2% | 102 | 4.4% (4/90) | 82.2% | 57.8% |
| ar | 100% (12/12) | 58.3% | 66.7% | 66.7% | 8 | 20% (2/10) | 90% | 60% |
| au | 100% (12/12) | 50% | 50% | 75% | 15 | 0% (0/10) | 90% | 70% |
| br | 100% (12/12) | 41.7% | 25% | 33.3% | 20 | 0% (0/10) | 80% | 60% |
| ca | 91.7% (11/12) | 33.3% | 66.7% | 75% | 13 | 10% (1/10) | 70% | 30% |
| es | 100% (12/12) | 58.3% | 66.7% | 83.3% | 10 | 0% (0/10) | 80% | 70% |
| gb | 100% (12/12) | 25% | 66.7% | 83.3% | 15 | 0% (0/10) | 90% | 70% |
| mx | 91.7% (11/12) | 50% | 41.7% | 58.3% | 4 | 10% (1/10) | 70% | 40% |
| nz | 83.3% (10/12) | 41.7% | 75% | 83.3% | 9 | 0% (0/10) | 80% | 40% |
| us | 100% (12/12) | 16.7% | 91.7% | 91.7% | 8 | 0% (0/10) | 90% | 80% |

<details><summary>116 messages to look at</summary>

- `ar-07` (scam, expected ar/transferencia-por-error): scam
- `ar-08` (scam, expected ar/comprobante-trucho): suspicious, matched ar/falso-banco, ar/falso-mercado-pago, ar/transferencia-por-error
- `ar-09` (scam, expected ar/fuera-de-mercado-libre): scam, matched ar/falso-correo
- `ar-10` (scam, expected ar/prestamos-falsos): suspicious, matched ar/falso-banco, ar/falso-mercado-pago, ar/falso-anses-pami
- `ar-13` (safe): suspicious, matched ar/whatsapp-codigo
- `ar-14` (safe): suspicious, matched ar/falso-mercado-pago, ar/falso-correo, ar/fuera-de-mercado-libre
- `ar-15` (safe): suspicious
- `ar-16` (safe): scam, matched ar/falsa-arca
- `ar-17` (safe): suspicious
- `ar-18` (safe): suspicious
- `ar-19` (safe): scam, matched ar/falso-mercado-pago, ar/whatsapp-codigo
- `ar-21` (safe): suspicious, matched ar/whatsapp-codigo
- `ar-22` (safe): suspicious, matched ar/cuento-del-tio
- `au-01` (scam, expected au/family-in-trouble): scam, matched au/bank-safe-account
- `au-03` (scam, expected au/parcel-delivery-text): scam, matched au/family-in-trouble, au/marketplace-seller-verify, au/parcel-delivery-text
- `au-05` (scam, expected au/task-job-scam): suspicious, matched au/bank-safe-account, au/airline-booking-update, au/family-in-trouble
- `au-06` (scam, expected au/remote-access-support): suspicious, matched au/parcel-delivery-text, au/remote-access-support, au/romance-scam
- `au-07` (scam, expected au/romance-scam): suspicious, matched au/remote-access-support, au/romance-scam
- `au-09` (scam, expected au/marketplace-seller-verify): scam, matched au/ato-mygov, au/sextortion-email, au/mobile-number-takeover
- `au-13` (safe): suspicious, matched au/bank-safe-account, au/romance-scam, au/mobile-number-takeover
- `au-14` (safe): suspicious, matched au/parcel-delivery-text, au/bank-safe-account
- `au-15` (safe): suspicious, matched au/family-in-trouble, au/personal-loan-fee, au/romance-scam
- `au-16` (safe): suspicious, matched au/ato-mygov, au/romance-scam, au/marketplace-seller-verify
- `au-17` (safe): suspicious
- `au-18` (safe): suspicious
- `au-19` (safe): suspicious, matched au/fake-police-crypto
- `au-21` (safe): suspicious, matched au/bank-safe-account, au/family-in-trouble
- `au-22` (safe): suspicious, matched au/card-collection-courier, au/family-in-trouble
- `br-02` (scam, expected br/correios-parcel-fee): scam
- `br-03` (scam, expected br/fake-bank-call-center): suspicious, matched br/whatsapp-code-clone, br/receita-cpf-charge
- `br-04` (scam, expected br/whatsapp-code-clone): suspicious, matched br/fake-online-store, br/fake-lawyer, br/receita-cpf-charge
- `br-05` (scam, expected br/wrong-pix-refund): scam, matched br/fake-bank-call-center, br/loan-refund-request, br/wrong-pix-refund
- `br-07` (scam, expected br/inss-proof-of-life): scam, matched br/fake-online-store, br/receita-cpf-charge, br/whatsapp-code-clone
- `br-08` (scam, expected br/fake-online-store): scam
- `br-09` (scam, expected br/fake-job-offer): suspicious, matched br/fake-lawyer, br/fake-online-store
- `br-10` (scam, expected br/loan-upfront-fee): suspicious, matched br/loan-refund-request
- `br-11` (scam, expected br/traffic-fine-cnh-text): scam, matched br/fake-boleto, br/fake-online-store, br/fake-lawyer
- `br-13` (safe): suspicious, matched br/family-new-number, br/fake-lawyer, br/fake-online-store
- `br-14` (safe): suspicious, matched br/correios-parcel-fee
- `br-15` (safe): suspicious, matched br/family-new-number, br/loan-upfront-fee
- `br-16` (safe): suspicious, matched br/remote-access-app, br/card-machine-broken-screen, br/correios-parcel-fee
- `br-17` (safe): suspicious, matched br/traffic-fine-cnh-text
- `br-18` (safe): suspicious
- `br-19` (safe): suspicious
- `br-21` (safe): suspicious, matched br/family-new-number, br/fake-lawyer
- `ca-04` (scam, expected ca/one-time-code-takeover): suspicious, matched ca/crypto-romance-investment, ca/bank-investigator-courier
- `ca-07` (scam, expected ca/task-job-crypto): suspicious, matched ca/fake-online-store, ca/marketplace-overpayment
- `ca-08` (scam, expected ca/crypto-romance-investment): not_recognised
- `ca-10` (scam, expected ca/government-arrest-bitcoin-atm): scam, matched ca/task-job-crypto, ca/government-arrest-bitcoin-atm, ca/rental-deposit
- `ca-13` (safe): scam, matched ca/bank-investigator-courier, ca/crypto-romance-investment, ca/government-arrest-bitcoin-atm
- `ca-15` (safe): suspicious
- `ca-16` (safe): suspicious, matched ca/cra-refund-text
- `ca-17` (safe): suspicious
- `ca-18` (safe): suspicious
- `ca-19` (safe): suspicious
- `ca-21` (safe): suspicious, matched ca/crypto-romance-investment
- `es-02` (scam, expected es/whatsapp-friend-asks-money): scam, matched es/bank-sms-safe-account, es/whatsapp-friend-asks-money
- `es-04` (scam, expected es/dgt-fake-fine): scam, matched es/parcel-missing-house-number, es/dgt-fake-fine, es/tax-agency-refund
- `es-07` (scam, expected es/government-payment-pending): scam
- `es-09` (scam, expected es/whatsapp-code-takeover): scam
- `es-13` (safe): suspicious, matched es/hi-mum-new-number, es/whatsapp-code-takeover
- `es-15` (safe): suspicious, matched es/marketplace-seller-fake-payment
- `es-16` (safe): suspicious, matched es/tax-agency-refund, es/hi-mum-new-number
- `es-17` (safe): suspicious
- `es-18` (safe): suspicious, matched es/government-payment-pending, es/parcel-missing-house-number
- `es-19` (safe): suspicious, matched es/sextortion-email
- `es-20` (safe): suspicious, matched es/hi-mum-new-number
- `es-21` (safe): suspicious, matched es/hi-mum-new-number
- `gb-07` (scam, expected gb/whatsapp-group-code): suspicious, matched gb/task-job-text
- `gb-09` (scam, expected gb/marketplace-purchase): suspicious, matched gb/money-mule-job, gb/marketplace-purchase, gb/romance-scam
- `gb-10` (scam, expected gb/hmrc-threat-call): scam, matched gb/dvla-text, gb/hmrc-tax-refund, gb/hmrc-threat-call
- `gb-11` (scam, expected gb/student-finance-phishing): scam, matched gb/parcel-delivery-text, gb/dvla-text, gb/hmrc-tax-refund
- `gb-13` (safe): suspicious, matched gb/hi-mum-text, gb/whatsapp-group-code
- `gb-14` (safe): suspicious, matched gb/parcel-delivery-text
- `gb-15` (safe): suspicious, matched gb/hi-mum-text, gb/fake-fca-recovery, gb/money-mule-job
- `gb-16` (safe): suspicious, matched gb/hmrc-tax-refund, gb/dvla-text, gb/student-finance-phishing
- `gb-17` (safe): suspicious
- `gb-18` (safe): suspicious
- `gb-19` (safe): suspicious, matched gb/marketplace-purchase, gb/money-mule-job, gb/student-finance-phishing
- `gb-21` (safe): suspicious, matched gb/hi-mum-text
- `gb-22` (safe): suspicious, matched gb/money-mule-job
- `mx-03` (scam, expected mx/fake-bank-call): scam, matched mx/whatsapp-code-theft
- `mx-05` (scam, expected mx/whatsapp-code-theft): not_recognised
- `mx-06` (scam, expected mx/virtual-kidnapping): suspicious
- `mx-09` (scam, expected mx/loan-shark-apps): scam, matched mx/fake-bank-app-link, mx/loan-shark-apps
- `mx-10` (scam, expected mx/likes-task-job): suspicious, matched mx/whatsapp-code-theft
- `mx-11` (scam, expected mx/fake-rental-listing): suspicious
- `mx-12` (scam, expected mx/streaming-account-phishing): scam, matched mx/fake-bank-app-link, mx/streaming-account-phishing
- `mx-13` (safe): suspicious, matched mx/fake-bank-call
- `mx-14` (safe): suspicious, matched mx/advance-fee-loan, mx/fake-travel-package, mx/traffic-fine-sms
- `mx-15` (safe): suspicious
- `mx-16` (safe): scam, matched mx/sat-phishing, mx/sat-deposit-call
- `mx-17` (safe): suspicious
- `mx-19` (safe): suspicious, matched mx/streaming-account-phishing
- `mx-21` (safe): suspicious
- `nz-08` (scam, expected nz/romance-scam): not_recognised
- `nz-09` (scam, expected nz/fake-police-crypto): scam, matched nz/bank-fraud-team-call, nz/fake-police-crypto
- `nz-11` (scam, expected nz/job-ad-malicious-app): not_recognised
- `nz-13` (safe): suspicious, matched nz/bank-fraud-team-call, nz/marketplace-buyer-courier-link, nz/whatsapp-ghost-pairing
- `nz-14` (safe): suspicious, matched nz/bank-fraud-team-call
- `nz-15` (safe): suspicious
- `nz-16` (safe): suspicious, matched nz/ird-tax-refund
- `nz-17` (safe): suspicious
- `nz-18` (safe): suspicious
- `nz-19` (safe): suspicious
- `nz-21` (safe): suspicious, matched nz/hi-mum
- `us-03` (scam, expected us/fake-irs-ssa-message): suspicious
- `us-13` (safe): suspicious, matched us/prize-sweepstakes, us/tech-support-popup, us/bank-fraud-alert-zelle
- `us-14` (safe): suspicious, matched us/usps-delivery-text
- `us-15` (safe): suspicious, matched us/tech-support-popup, us/utility-shutoff
- `us-16` (safe): suspicious, matched us/fake-irs-ssa-message, us/prize-sweepstakes
- `us-17` (safe): suspicious, matched us/toll-text, us/election-scam, us/fake-ic3-recovery
- `us-19` (safe): suspicious
- `us-20` (safe): suspicious, matched us/family-emergency-call, us/hospice-medicare
- `us-21` (safe): suspicious, matched us/fake-police-government
- `us-22` (safe): suspicious, matched us/crypto-courier

</details>

## Matcher + Workers AI (as the API answers keyed checks)

| | scams caught | called "scam" | right match first | right match in top 3 | wrong matches | safe called "scam" | safe flagged | safe with a match |
|---|---|---|---|---|---|---|---|---|
| **all** | 97.2% (105/108) | 94.4% | 64.8% | 76.9% | 103 | 0% (0/90) | 20% | 11.1% |
| ar | 91.7% (11/12) | 91.7% | 75% | 75% | 5 | 0% (0/10) | 30% | 30% |
| au | 100% (12/12) | 91.7% | 50% | 75% | 15 | 0% (0/10) | 10% | 0% |
| br | 100% (12/12) | 100% | 33.3% | 41.7% | 20 | 0% (0/10) | 20% | 20% |
| ca | 91.7% (11/12) | 91.7% | 66.7% | 83.3% | 13 | 0% (0/10) | 20% | 10% |
| es | 100% (12/12) | 100% | 75% | 91.7% | 11 | 0% (0/10) | 10% | 0% |
| gb | 100% (12/12) | 100% | 66.7% | 83.3% | 16 | 0% (0/10) | 20% | 10% |
| mx | 100% (12/12) | 100% | 41.7% | 58.3% | 4 | 0% (0/10) | 40% | 10% |
| nz | 91.7% (11/12) | 83.3% | 75% | 83.3% | 11 | 0% (0/10) | 30% | 20% |
| us | 100% (12/12) | 91.7% | 100% | 100% | 8 | 0% (0/10) | 0% | 0% |

<details><summary>56 messages to look at</summary>

- `ar-08` (scam, expected ar/comprobante-trucho): not_recognised
- `ar-09` (scam, expected ar/fuera-de-mercado-libre): scam, matched ar/falso-correo
- `ar-10` (scam, expected ar/prestamos-falsos): scam, matched ar/falso-banco, ar/falso-mercado-pago, ar/falso-anses-pami
- `ar-16` (safe): suspicious, matched ar/falsa-arca
- `ar-19` (safe): suspicious, matched ar/falso-mercado-pago, ar/whatsapp-codigo
- `ar-21` (safe): suspicious, matched ar/whatsapp-codigo
- `au-01` (scam, expected au/family-in-trouble): scam, matched au/bank-safe-account
- `au-03` (scam, expected au/parcel-delivery-text): scam, matched au/family-in-trouble, au/marketplace-seller-verify, au/parcel-delivery-text
- `au-05` (scam, expected au/task-job-scam): scam, matched au/bank-safe-account, au/airline-booking-update, au/family-in-trouble
- `au-06` (scam, expected au/remote-access-support): scam, matched au/parcel-delivery-text, au/remote-access-support, au/romance-scam
- `au-07` (scam, expected au/romance-scam): suspicious, matched au/remote-access-support, au/romance-scam
- `au-09` (scam, expected au/marketplace-seller-verify): scam, matched au/ato-mygov, au/sextortion-email, au/mobile-number-takeover
- `au-17` (safe): suspicious
- `br-03` (scam, expected br/fake-bank-call-center): scam, matched br/whatsapp-code-clone, br/receita-cpf-charge
- `br-04` (scam, expected br/whatsapp-code-clone): scam, matched br/fake-online-store, br/fake-lawyer, br/receita-cpf-charge
- `br-05` (scam, expected br/wrong-pix-refund): scam, matched br/fake-bank-call-center, br/loan-refund-request, br/wrong-pix-refund
- `br-07` (scam, expected br/inss-proof-of-life): scam, matched br/fake-online-store, br/receita-cpf-charge, br/whatsapp-code-clone
- `br-08` (scam, expected br/fake-online-store): scam
- `br-09` (scam, expected br/fake-job-offer): scam, matched br/fake-lawyer, br/fake-online-store
- `br-10` (scam, expected br/loan-upfront-fee): scam, matched br/loan-refund-request
- `br-11` (scam, expected br/traffic-fine-cnh-text): scam, matched br/fake-boleto, br/fake-online-store, br/fake-lawyer
- `br-17` (safe): suspicious, matched br/traffic-fine-cnh-text
- `br-21` (safe): suspicious, matched br/family-new-number, br/fake-lawyer
- `ca-04` (scam, expected ca/one-time-code-takeover): scam, matched ca/crypto-romance-investment, ca/bank-investigator-courier, ca/one-time-code-takeover
- `ca-07` (scam, expected ca/task-job-crypto): scam, matched ca/fake-online-store, ca/marketplace-overpayment
- `ca-08` (scam, expected ca/crypto-romance-investment): not_recognised
- `ca-10` (scam, expected ca/government-arrest-bitcoin-atm): scam, matched ca/task-job-crypto, ca/government-arrest-bitcoin-atm, ca/rental-deposit
- `ca-13` (safe): suspicious, matched ca/bank-investigator-courier, ca/crypto-romance-investment, ca/government-arrest-bitcoin-atm
- `ca-17` (safe): suspicious
- `es-02` (scam, expected es/whatsapp-friend-asks-money): scam, matched es/bank-sms-safe-account, es/whatsapp-friend-asks-money
- `es-04` (scam, expected es/dgt-fake-fine): scam, matched es/parcel-missing-house-number, es/dgt-fake-fine, es/tax-agency-refund
- `es-07` (scam, expected es/government-payment-pending): scam
- `es-17` (safe): suspicious
- `gb-07` (scam, expected gb/whatsapp-group-code): scam, matched gb/task-job-text
- `gb-09` (scam, expected gb/marketplace-purchase): scam, matched gb/money-mule-job, gb/marketplace-purchase, gb/romance-scam
- `gb-10` (scam, expected gb/hmrc-threat-call): scam, matched gb/dvla-text, gb/hmrc-tax-refund, gb/hmrc-threat-call
- `gb-11` (scam, expected gb/student-finance-phishing): scam, matched gb/parcel-delivery-text, gb/dvla-text, gb/hmrc-tax-refund
- `gb-15` (safe): suspicious, matched gb/hi-mum-text, gb/fake-fca-recovery, gb/money-mule-job
- `gb-17` (safe): suspicious
- `mx-03` (scam, expected mx/fake-bank-call): scam, matched mx/whatsapp-code-theft
- `mx-05` (scam, expected mx/whatsapp-code-theft): scam
- `mx-06` (scam, expected mx/virtual-kidnapping): scam
- `mx-09` (scam, expected mx/loan-shark-apps): scam, matched mx/fake-bank-app-link, mx/loan-shark-apps
- `mx-10` (scam, expected mx/likes-task-job): scam, matched mx/whatsapp-code-theft
- `mx-11` (scam, expected mx/fake-rental-listing): scam
- `mx-12` (scam, expected mx/streaming-account-phishing): scam, matched mx/fake-bank-app-link, mx/streaming-account-phishing
- `mx-15` (safe): suspicious
- `mx-16` (safe): suspicious, matched mx/sat-phishing, mx/sat-deposit-call
- `mx-17` (safe): suspicious
- `mx-21` (safe): suspicious
- `nz-08` (scam, expected nz/romance-scam): not_recognised
- `nz-09` (scam, expected nz/fake-police-crypto): scam, matched nz/bank-fraud-team-call, nz/fake-police-crypto
- `nz-11` (scam, expected nz/job-ad-malicious-app): suspicious
- `nz-14` (safe): suspicious, matched nz/bank-fraud-team-call
- `nz-17` (safe): suspicious
- `nz-21` (safe): suspicious, matched nz/hi-mum

</details>

_1.5 s_

## Held out, one country at a time

```
Held-out (thresholds scam >= 0.7, suspicious >= 0.4):
  scams caught      105/108
  scams called scam 102/108
  safe called scam  1/90
  safe flagged      15/90
  hardest: ar-08 0.10, ar-16 0.42, ar-21 0.70, au-17 0.43, br-17 0.60, br-21 0.65, ca-08 0.07, ca-17 0.60, es-17 0.62, gb-15 0.63, gb-17 0.52, mx-15 0.54, mx-17 0.67, mx-21 0.45, nz-08 0.10, nz-14 0.69, nz-17 0.51, nz-21 0.51

```

The "Matcher + Workers AI" table above uses weights fitted on all 198 messages; the held-out numbers here score each country with weights fitted on the other eight.
