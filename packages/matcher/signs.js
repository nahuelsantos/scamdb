// Warning signs read from a message (Spanish and English). Spanish rules come from eschamuyo's analyze.js.
// Every regex runs on normalize(text): lowercase, no accents, no punctuation.
import { normalize, foldChar } from '../../lib/text.js';

// Portuguese rules are folded into the same ids (Brazil). English rules need context: bare "code", "pay" or "download" appear in ordinary messages.
const EN = {
  code: String.raw`(send|read|tell|give|share|forward|confirm|text)( \w+){0,4} (code|passcode|password|pin)\b|\b(code|passcode|pin) (we|i|they) (sent|texted)|(code|passcode)( \w+){0,3} (you (got|received|will receive|ll receive|ll get))|verification code|security code|one time (pass|code)|\botp\b`,
  remote: String.raw`(download|install) (this|the|our|an?) (app|application|program)|remote access|(let me|i need to|so i can) (see|access|control) your (screen|computer|phone)|photo of (your|my) (id|passport|licen)|baix(e|a|ar) (o|este|esse|um|nosso) (app|aplicativo)|ver (a )?sua tela|acesso remoto`,
  money: String.raw`send (me |us )?(the )?money|money (now|urgently|today|asap)|\bwire\b|gift ?cards?|bitcoin|crypto|pay (the|a|this|your) (fee|fine|bill|tax|toll|deposit|charge)|pay (with|by|in) (gift|bitcoin|crypto|voucher)|(release|redelivery|processing|customs|admin|unlock|withdrawal) fee|card (number|details)|bank details|safe account|pre ?approved|go to (the|an) atm|\bpix\b|\breais\b|\bboleto\b|dinheiro|mb ?way|multibanco|referencia (de )?pagamento|(efetue|efetuar|faca|fazer|conclua) o pagamento|penhora`,
};
// French and Dutch rules (France, Belgium, Luxembourg, the Netherlands), added to the same ids.
const FR_NL = {
  asks_for_code: String.raw`code (de )?(confirmation|validation|verification|securite|sms)|mot de passe|\bmdp\b|(verificatie|beveiligings|sms|activatie|bevestigings)code|wachtwoord|pincode|(donnez|communiquez|transmettez|envoyez|dictez|lisez|donne|envoie|transmets)( \w+){0,3} (le |ce |votre |ton )?code|(geef|stuur|lees|deel)( \w+){0,3} (de |die |deze |je |uw )?(code|pincode)`,
  remote_access: String.raw`(telechargez|installez|telecharger|installer|telecharge|installe)( \w+){0,2} (application|appli|logiciel)|(prise en main|acces|controle) a distance|(installeer|installeren|download)( \w+){0,2} (app|programma)|meekijken|(overname|toegang) op afstand|scherm delen`,
  urgency: String.raw`pour eviter (des |toute |la )?(frais|penalites|majoration|suspension|poursuites)|aujourd hui|immediatement|sous 24|sans delai|dernier (avis|rappel)|au plus vite|vandaag|onmiddellijk|binnen 24|met spoed|zo snel mogelijk|laatste (herinnering|aanmaning|kans)|geblokkeerd|verloopt`,
  money_request: String.raw`virement|\bpayer\b|paiement|reglez|regler|frais (de |d )?(livraison|douane|dossier|reexpedition|port)|carte bancaire|coordonnees bancaires|\brib\b|\biban\b|compte (securise|de securite)|neosurf|transcash|coupon pcs|rembourse|overmaken|overboeken|betaalverzoek|\bbetalen\b|betaling|tikkie|payconiq|veilige rekening|kluisrekening|rekeningnummer|bankgegevens|bankpas|pinpas|\bboete\b`,
  unknown_link: String.raw`\blien\b|cliquez|cliquer|klik (op|hier)`,
  new_number: String.raw`nouveau (numero|num)|change de numero|enregistre (ce|mon) (nouveau )?numero|(telephone|portable) (est )?(casse|tombe|perdu)|nieuwe? nummer|nummer (is )?veranderd|sla (dit|mijn) (nieuwe )?nummer op|telefoon (is )?(kapot|stuk|gevallen)`,
  impersonation: String.raw`conseiller (bancaire|clientele)|service (fraude|des fraudes|securite)|\bla poste\b|colissimo|chronopost|\bameli\b|assurance maladie|\bantai\b|\bimpots\b|gendarmerie|commissariat|support technique|bankmedewerker|fraudeafdeling|afdeling fraude|veiligheidsafdeling|helpdesk|postnl|belastingdienst|\bdigid\b|\bcjib\b|politie|bpost|\bitsme\b|spf finances|fod financien|myminfin|card stop|luxtrust|spuerkeess|police grand ducale`,
  secrecy: String.raw`n en parlez a personne|ne (le )?dites (rien )?a personne|n en parle a personne|reste entre nous|vertel (het )?(aan )?niemand|zeg (het )?tegen niemand|tussen ons`,
  keep_on_line: String.raw`ne raccrochez pas|ne raccroche pas|restez en ligne|gardez la ligne|niet ophangen|hang niet op|blijf aan de lijn|blijft u aan de lijn`,
  too_good_to_be_true: String.raw`\bgagne|gagnant|felicitations|tirage au sort|loterie|rendement garanti|gewonnen|winnaar|gefeliciteerd|loterij|verloting|winactie|gegarandeerd rendement`,
};
// German rules (Germany, Austria, Switzerland, Luxembourg), added to the same ids. Umlauts are folded (ä → a).
const DE = {
  asks_for_code: String.raw`(bestatigungs|sicherheits|verifizierungs|freigabe)code|\btan\b|phototan|pushtan|smstan|passwort|kennwort|(geben|nennen|schicken|senden|lesen) sie( \w+){0,3} (mir |uns )?(den |diesen |ihren )?(code|tan)\b(?! (niemals|nie|an niemanden|keinesfalls))|(gib|schick|nenn|sag) mir( \w+){0,3} (den |diesen )?code`,
  remote_access: String.raw`(installieren|herunterladen|laden sie)( \w+){0,3} (app|programm|software)|fernwartung|fernzugriff|bildschirm (teilen|freigeben)`,
  urgency: String.raw`\bheute\b|\bsofort\b|umgehend|innerhalb von 24|letzte (mahnung|warnung|chance)|gesperrt|lauft (heute )?ab|dringend`,
  money_request: String.raw`uberweis|bezahlen|zahlung|gebuhr|kontodaten|bankdaten|kreditkarte|sicherheitskonto|bargeld|goldbarren|wertsachen|kaution|paysafecard|guthabenkarte`,
  unknown_link: String.raw`klicken sie|klicke (hier|auf)|hier klicken`,
  new_number: String.raw`neue nummer|nummer (hat sich )?geandert|speicher(e|n sie)? (diese|meine) (neue )?nummer|handy (ist )?(kaputt|ins wasser|verloren|runtergefallen)`,
  impersonation: String.raw`bankmitarbeiter|sicherheitsabteilung|betrugsabteilung|sparkasse|volksbank|raiffeisen|postfinance|kriminalpolizei|\bpolizei\b|staatsanwaltschaft|finanzamt|finanzonline|bundeszentralamt|zollamt|deutsche post|osterreichische post|bundespolizei|europol`,
  secrecy: String.raw`sagen sie (es )?niemandem|erzahlen sie (es )?niemandem|niemandem davon|unter uns`,
  keep_on_line: String.raw`legen sie nicht auf|nicht auflegen|bleiben sie (am telefon|in der leitung|dran)`,
  too_good_to_be_true: String.raw`gewonnen|gewinner|gewinnspiel|herzlichen gluckwunsch|garantierte rendite|lotterie|verlosung`,
};
// Italian, Polish and Romanian rules (wave 4), added to the same ids. Text is folded first (ą → a, ł → l, ș → s, ț → t).
const IT_PL_RO = {
  asks_for_code: String.raw`codice (otp|di sicurezza|di verifica|di conferma)|(dammi|mandami|dimmi|comunicami|leggimi)( \w+){0,2} (il )?codice|kod (blik|sms|weryfikacyjny|autoryzacyjny|potwierdzajacy)|(podaj|przeslij|wyslij|przepisz)( \w+){0,2} (kod )?blik|\bhaslo\b|(podaj|przeslij|wyslij|przepisz|przeczytaj)( \w+){0,2} (mi )?(kod|haslo|pin)|cod(ul)? (de )?(verificare|confirmare|securitate|otp|sms)|\bparola\b|(spuneti|spune|trimiteti|trimite|dati|dictati|cititi) mi( \w+){0,2} (codul|parola)`,
  remote_access: String.raw`(scarica|installa|scaricare|installare)( \w+){0,2} (app|applicazione|programma)|(controllo|accesso) remoto|(zainstaluj|pobierz|zainstalowac|pobrac)( \w+){0,2} (aplikacj|program)|zdalny dostep|zdalnego pulpitu|(instaleaza|descarca|instalati|descarcati)( \w+){0,2} (aplicati|program)|(acces|control) de la distanta`,
  urgency: String.raw`per evitare (aggravamenti|sanzioni|il blocco|la sospensione|ulteriori)|posizione( [a-z]+)? irregolare|\boggi\b|\bsubito\b|immediatamente|entro 24|ultimo avviso|bloccat|sospes|\bdzis\b|dzisiaj|natychmiast|\bpilne\b|w ciagu 24|ostatnie wezwanie|zablokowan|zawieszon|odciecie|\bazi\b|imediat|in 24 de ore|ultima (notificare|somatie|sansa)|\bblocat|suspendat`,
  money_request: String.raw`bonifico|(effettua|effettuare|completa|completare|esegui|eseguire) (il |un )?pagamento|pagamento (entro|immediato|richiesto)|\bpagare\b|ricarica|carta di credito|dati (della carta|bancari)|conto (sicuro|di sicurezza)|contanti|cauzione|przelew|przelac|zaplac|zaplata|platnosc|doplat|\boplat|dane karty|numer karty|bezpieczne konto|konto techniczne|gotowk|kaucj|odbierz (platnosc|pieniadze)|\bplata\b|plateste|platiti|achita|\btaxa\b|datele cardului|cont (sigur|de siguranta)|numerar|cautiune|comision|\bblik`,
  unknown_link: String.raw`\bclicca|cliccare|kliknij|klikniecie|pod linkiem|apasa(ti)? (aici|pe link)|acceseaza linkul|click aici`,
  new_number: String.raw`numero nuovo|nuovo numero|cambiato numero|salva (questo|il mio) (nuovo )?numero|(telefono|cellulare) (rotto|caduto|perso)|nowy numer|zmienil(a|e)m numer|zapisz (ten|moj) (nowy )?numer|telefon (mi )?(sie )?(zepsul|zgubil|wpadl)|numar nou|noul (meu )?numar|mi am schimbat numarul|salveaza (acest|noul) numar|telefonul (mi )?(s a )?(stricat|spart|pierdut)`,
  impersonation: String.raw`polizia postale|carabinieri|guardia di finanza|ufficio (antifrode|sicurezza)|operatore (della banca|bancario)|agenzia delle entrate|\binps\b|poste italiane|\bpagopa\b|intesa sanpaolo|unicredit|pracownik banku|dzial bezpieczenstwa|konsultant banku|\bpolicj|\bcbzc\b|prokurat|urzad skarbowy|\bzus\b|\bknf\b|inpost|poczta polska|\bpko\b|\bmbank\b|mobywatel|angajat al bancii|departamentul de (securitate|fraude)|\bpolitia\b|\bpolitist|procuror|\banaf\b|\bdnsc\b|posta romana|fan courier|banca transilvania`,
  secrecy: String.raw`non dirlo a nessuno|non (dica|dire) niente a nessuno|resti tra noi|nikomu nie mow|nie mow nikomu|nie informuj (nikogo|rodziny)|nu spune(ti)? nimanui|sa nu afle nimeni|ramane intre noi`,
  keep_on_line: String.raw`non riattaccare|non riattacchi|resti in linea|rimanga in linea|nie rozlaczaj|nie rozlaczac|pozostan na linii|nie odkladaj|nu inchide(ti)?|ramai(neti)? pe fir`,
  too_good_to_be_true: String.raw`hai vinto|ha vinto|vincitore|congratulazioni|rendimento garantito|wygral|zwyciezc|gratulacje|gwarantowany zysk|loteri|ai castigat|ati castigat|castigator|felicitari|profit garantat`,
};
// Ukrainian, Russian, Bulgarian, Greek and Turkish rules (wave 5). Without the u flag, \b and \w only know ASCII
// letters, so these use spaces as word boundaries: (^| ) … ( |$) and [^ ]+ for "a word". Greek is folded (no accents,
// ς → σ); Turkish too (ş → s, ç → c, ğ → g, ı → i, ö → o, ü → u).
const CY_EL_TR = {
  asks_for_code: String.raw`код (підтвердження|з смс|из смс|подтверждения|за потвърждение|для входу|для входа)|(скажіть|назвіть|продиктуите|надішліть|скажите|назовите|пришлите|кажете|продиктуваите|изпратете)( [^ ]+){0,3} (код|пароль|парола|пін|пин)|(^| )(пароль|парола|cvv)( |$)|код (з|из) (шести|6) цифр|(скинь|скиньте|перешли|перешліть|пришли)( [^ ]+){0,2} (код|иого|его)|κωδικο(σ|υ)? (επιβεβαιωσησ|επαληθευσησ|ασφαλειασ|μιασ χρησησ)|(πειτε|στειλτε|δωστε|διαβαστε|υπαγορευστε)( [^ ]+){0,3} κωδικο|συνθηματικο|(dogrulama|onay|guvenlik|sms) kodu|kodu(nu)? (bana )?(soyle|soyleyin|ilet|iletin|gonder|gonderin|oku|okuyun|paylas)|(^| )sifre`,
  remote_access: String.raw`(встановіть|завантажте|установите|скачаите|инсталираите|изтеглете)( [^ ]+){0,2} (додаток|програму|приложение|програмата|приложението|программу)|віддален[^ ]* доступ|удаленн[^ ]* доступ|отдалечен достъп|(κατεβαστε|εγκαταστηστε)( [^ ]+){0,2} (εφαρμογη|προγραμμα)|απομακρυσμενη προσβαση|uzaktan erisim|ekran paylas|(uygulamayi|programi) (indirin|yukleyin|kurun)`,
  urgency: String.raw`(^| )(терміново|негаино|сьогодні|срочно|немедленно|сегодня|спешно|веднага|днес|σημερα|αμεσα|επειγον|bugun|hemen|acil|derhal)( |$)|протягом 24|в течение 24|в рамките на 24|заблокован|заблокирован|блокиран|μπλοκαριστηκε|μπλοκαρισμεν|24 saat icinde|son uyari|bloke edil|askiya alin`,
  money_request: String.raw`переказ|переведіть|оплатіть|сплатіть|переведите|оплатите|(^| )превод|преведете|платете|такса|дані картки|данные карты|данни на картата|безпечн[^ ]* рахун|безопасн[^ ]* сч[ее]т|сигурна сметка|защитена сметка|готівк|наличн|задаток|передоплат|предоплат|завдаток|капаро|(^| )(гроші|грошеи|деньги|денег)( |$)|πληρωστε|πληρωσετε|εξοφλησ|τελη αποστολησ|στοιχεια τησ καρτασ|ασφαλη λογαριασμο|μετρητα|προκαταβολ|odeme yap|odemenizi|odeyin|(^| )havale|(^| )eft( |$)|para gonder|kart bilgi|guvenli hesap|kapora|(^| )nakit|altin(lari)? teslim`,
  unknown_link: String.raw`за посиланням|посилання|по ссылке|ссылк|натиснете (тук|линка)|(^| )линк|συνδεσμο|πατηστε εδω|linke tikla|baglantiya tikla|tiklayin|tiklayiniz`,
  new_number: String.raw`новии номер|новыи номер|(^| )нов номер|новият ми номер|змінил[аи]? номер|сменил[а]? номер|смених номера|зберіж (цеи|міи) номер|сохрани (этот|мои) номер|запиши (този|новия) номер|телефон (зламався|розбився|сломался|разбился|се развали|падна)|νεο (μου )?(νουμερο|κινητο)|αλλαξα (νουμερο|κινητο)|το κινητο (μου )?(χαλασε|επεσε|σπασε)|yeni numaram|numaram degisti|numarami degistirdim|bu numarayi kaydet|telefonum (bozuldu|kirildi|kayboldu)`,
  impersonation: String.raw`служба безпеки|відділ безпеки|служба безопасности|отдел безопасности|(^| )слідч|следовател|червонии хрест|красныи крест|(^| )оон( |$)|юнісеф|новапошта|служител на банка|банков служител|кіберполіці|(^| )поліці|(^| )полици|(^| )полицаи|прокуратур|(^| )(сбу|тцк|нбу|нап|гдбоп|мвр|дск)( |$)|приватбанк|монобанк|ощадбанк|нова пошта|укрпошта|еконт|спиди|υπαλληλοσ τησ τραπεζασ|τμημα ασφαλειασ|αστυνομια|διωξη ηλεκτρονικου|(^| )(ααδε|εφκα|ελτα)( |$)|εθνικη τραπεζα|banka (gorevlisi|yetkilisi)|(^| )(polis|savci|emniyet|jandarma|masak|sgk|ptt)( |$)|gelir idaresi|e devlet|yurtici kargo|aras kargo`,
  secrecy: String.raw`нікому не (кажіть|говоріть)|никому не (говорите|рассказываите)|не казваите на никого|між нами|между нами|μην το πειτε σε κανεναν|μεταξυ μασ|kimseye (soylemeyin|soyleme|bahsetmeyin)|aramizda kalsin`,
  keep_on_line: String.raw`не (кладіть|вішаите) слухавку|не (кладите|вешаите) трубку|не затваряите|не затваряи|залишаитеся на лініі|оставаитесь на линии|останете на линия|μην (κλεισετε|κλεινετε)|μεινετε στη γραμμη|telefonu kapatmayin|hatta kalin`,
  too_good_to_be_true: String.raw`пасивн[^ ]* дох|пассивн[^ ]* доход|нова хвиля допомоги|отримаите (виплату|допомогу)|ви виграли|вы выиграли|спечелихте|(^| )виграш|выигрыш|гарантован[^ ]* прибут|гарантированн[^ ]* доход|гарантирана печалба|κερδισατε|κερδισεσ|συγχαρητηρια|εγγυημεν[^ ]* αποδοσ|kazandiniz|kazandin|tebrikler|garantili kazanc`,
};
// Swedish, Danish and Norwegian rules (wave 6), written from the labelled messages. Folded text: å, ä → a; ö, ø → o;
// æ → ae. BankID/MitID approvals are how these scams take money, so "sign/approve in BankID now" is a code request.
const SCAND = {
  asks_for_code: String.raw`legitimera dig|(signera|signerar|godkann|godkand)( [^ ]+){0,4} (bankid|mitid)|signering i (ditt )?bankid|(bekraeft|bekraefte|opdater|opdatere)( [^ ]+){0,3} mitid|(godkend|godkender|bekraeft)( [^ ]+){0,3} (i )?mitid|(signer|godkjenn)( [^ ]+){0,3} (i )?bankid|(las upp|uppge|ge mig|oplys|giv mig|les opp|oppgi|gi meg)( [^ ]+){0,3} (koden|engangskoden|sakerhetskoden|sikkerhedskoden|kode)|(send|skicka)( [^ ]+){0,3} (den|koden) (hit|till mig|til meg)|bilde av kodene|lapp med kodene`,
  remote_access: String.raw`(ladda ner|installera|download|installer|last ned)( [^ ]+){0,3} (appen|programmet|app)|fjarrstyrning|fjernadgang|fjernstyring|dela (din )?skarm`,
  urgency: String.raw`(^| )(idag|i dag|i dag)( |$)|inom (24|48|72) timmar|inom (fem|tre) dagar|omgaende|meddela snabbt|med en gang|(^| )straks( |$)|umiddelbart|hurtigst muligt|innen (24|48|72) timer|inden for (24|48) timer`,
  money_request: String.raw`kontoopplysning|kontonummeret ditt mangler|(^| )swisha|swisha (till|mig)|betala (hyran|avgiften|in)|uppdatera betalningen|tullavgift|serviceavgift|(^| )deposition|kortuppgifter|overfor (pengar|penge)|overfore|mobilepay|(^| )vipps|(^| )betal (gebyr|told|nu)|(^| )gebyr|kortoplysninger|kortinformasjon|depositum|tollavgift|indbetal|aktivera utbetalning|pengarna vantar|pengene venter|(modtag|motta) (betalingen|pengene|penger)|(^| )vippse|(^| )betal innen|(^| )betal [0-9]|(^| )betale (en faktura|regningen|fakturaen)|(^| )(indskud|insattning|innskudd)|utestaende belop|gavekort|presentkort|google play( )?kort|itunes( )?kort`,
  unknown_link: String.raw`(^| )(lank|lanken|linket|lenken|lenke)( |$)|via den har lanken|klicka (har|pa)|(^| )klik (her|pa)|trykk (her|pa)`,
  new_number: String.raw`(^| )(nytt|nyt) (nummer|telefonnummer)|mit nye (nr|nummer)|mitt nye nummer|telefon(en)? er gaet i stykker|telefonen (hamnade|ramlade|gick sonder|ar trasig|gik i stykker|er odelagt|er knust)|mobilen (ar trasig|er odelagt|er knust)|(spara|gem|lagre) (detta|dette|mitt|mit) (nya |nye )?nummer`,
  impersonation: String.raw`bedrageriavdelning|sakerhetsavdelning|kortcentral|polismyndigheten|(^| )polisen|(^| )politiet|skatteverket|kronofogden|postnord|skattestyrelsen|skatteetaten|svindelafdeling|sikkerhedsafdeling|svindelavdeling|sikkerhetsavdeling|civilkladd kollega|sivilkledd|politidistrikt|sikkerhedsteam|sikkerhetsteam|sakerhetsteam|politiassistent|kobenhavns politi|(^| )etterforsker|(^| )bankansatt|statens vegvesen`,
  secrecy: String.raw`(prata|pratar) inte med (nagon|nan)|berattar? inte (for|om) (nagon|det)|inte ens med banken|sig det ikke til nogen|ikke engang (til|med) banken|ikke fortell (det )?til noen|ikke engang med banken|ikke snakk med (noen|banken)`,
  keep_on_line: String.raw`lagg inte pa|lag inte pa|laeg ikke pa|ikke laeg pa|ikke legg pa|bliv i telefonen|stanna kvar i (telefonen|samtalet)|bli i telefonen`,
  too_good_to_be_true: String.raw`(^| )tjanade|(^| )tjente|garanterad avkastning|garanteret afkast|garantert avkastning|du har (vunnit|vundet|vunnet)|hemligheten som bankerna|per (uppgift|opgave|oppgave)|betalt samma dag|betalt samme dag|ekstrainntekt|ekstraindkomst|extrainkomst|av hvert belop|pr (opgave|oppgave)|ingen risiko|utan risk|uten risiko|hjemmejob`,
};
// Finnish rules (wave 6), from the Finland draft's labelled messages. Folded text: ä → a, ö → o.
const FI = {
  asks_for_code: String.raw`(kopioida|kopioi|laheta|kerro|anna|lue)( [^ ]+){0,3} (koodi|koodin|tunnusluku|tunnukset|vahvistuskoodi)|palautuskoodi|tunnistautu`,
  remote_access: String.raw`(asenna|lataa)( [^ ]+){0,2} (sovellus|ohjelma)|etayhteys|nayton jako`,
  urgency: String.raw`(^| )(tanaan|heti|nopeasti)( |$)|vela tanaan|(^| )mennessa( |$)|viimeistaan|rajoitetaan`,
  money_request: String.raw`(^| )maksa( |$)|(^| )maksu(a|n|t)?( |$)(?!ja tolliamet)|tullimaksu|turvamaksu|siirra|siirtaa|siirrat|tilille|hyvaksya rahat|(^| )varat( |$)|(^| )perimme`,
  unknown_link: String.raw`(^| )linkki|tasta linkista|klikkaa|(^| )uusi tasta`,
  new_number: String.raw`puhelin meni rikki|puhelin hajosi|tallenna (tama|taa) numero|uusi numero|tassa uusi numeroni`,
  impersonation: String.raw`asiakasturva|turvallisuus(puolelta|osastolta)|rikoskomisario|keskusrikospoliisi|(^| )poliisi|verohallinto|suomi fi|matkahuolto|nordean|s pankki`,
  secrecy: String.raw`ala kerro (kenellekaan|pankille)|ala puhu (kenellekaan|pankille)`,
  keep_on_line: String.raw`ala sulje puhelinta|pysy linjalla|ala katkaise`,
  too_good_to_be_true: String.raw`tienata jopa|(^| )tienaa|ansaitse jopa|takuuvarma tuotto`,
};
// Icelandic rules (wave 6), from the Iceland draft's labelled messages. Folded text: þ → th, ð → d, æ → ae, á → a.
const IS = {
  asks_for_code: String.raw`audkenna thig|stadfesta audkenni|rafraenum skilrikjum|samthykkir( [^ ]+){0,3}|beidni i simann|gefdu (mer|okkur)( [^ ]+){0,2} (kodann|numerid)`,
  remote_access: String.raw`get eg tengst|eg get tengst|tengjast tolvunni|deila skjanum`,
  urgency: String.raw`fyrir midnaetti|innan (tveggja|thriggja|48|24) (solarhringa|daga|klst)|fyrir lok dags|(^| )nuna( |$)|verdur takmorkud|lokad timabundid`,
  money_request: String.raw`(^| )ogreidd|greidsla|greidslu|greiddu|(^| )greida|tollgjald|med korti|greidslukod`,
  unknown_link: String.raw`(^| )hlekk|smelltu|lesid thad her|opnid vidhengid`,
  new_number: String.raw`nytt numer|nyja numerid|vistadu (thetta|nyja) numer`,
  impersonation: String.raw`logreglan|logreglunnar|rikislogreglustjor|skatturinn|posturinn|heradssaksoknar|(^| )arion( |$)|landsbankinn|islandsbanki|fra microsoft`,
  secrecy: String.raw`ekki segja (neinum|bankanum)`,
  keep_on_line: String.raw`ekki leggja a|ekki skella a`,
  too_good_to_be_true: String.raw`(^| )unnu [0-9]|thu vannst|gjafaleik|milljonamaering`,
};
// Slovenian, Croatian, Czech and Slovak rules (wave 7), from the labelled messages. Folded: č → c, š → s, ž → z,
// ř → r, ě → e, ů → u, ć/đ → c/d.
const SLAVIC = {
  asks_for_code: String.raw`(vpises|vpisite|posljite|povejte|sporocite|preberite)( [^ ]+){0,3} (kodo|geslo|pin)|kodo ki jo dobis|vpisati kartico|podatke o (placilu|kartici)( [^ ]+){0,2} vnes|(preposli|posli|povedz|zadaj|nadiktujte|povedzte|poslete|sdelte|zadejte)( [^ ]+){0,4} (kod|heslo|pin)|kod co ti pride|(vyplnit|vyplnte|vyplnte) udaje karty|(preposlat|poslat|precist|nadiktovat)( [^ ]+){0,2} (kod|ho)( |$)|sestimistny kod|udaju z karty|udaje o platebni karte|(stavis|upisite|upisi|posaljite|recite|procitajte|procitate|kazete)( [^ ]+){0,3} (kod|lozinku|pin)|onaj kod sto ti dode`,
  remote_access: String.raw`(nalozite|namestite|nalozit|namesti)( [^ ]+){0,3} (aplikacijo|program)|oddaljen dostop|(stiahnite|stahnete)( si)?( [^ ]+){0,2} aplikaci|(vzdialeny|vzdaleny) pristup|stahnete( si)? program|otevrete si v prohlizeci`,
  urgency: String.raw`(^| )(danes|takoj)( |$)|rok danes|v (2|24|48) (dneh|urah)|do vecera|(^| )(dnes|okamzite|ihned|hned)( |$)|do (12|24|48) (hodin|h)( |$)|kazda minuta|(^| )specham|je nutne|(^| )(hitno|odmah)( |$)|u (24|48) ?h( |$)`,
  money_request: String.raw`placilo|placati|placate|poravnajte|nakazi|nakazes|nakazala|rezervni racun|premaknili na|varscin|kupnin|vlozk|izplacamo|uhradte|uhradit|zaplatit|zaplatte|presunut|presunout|bezpecny ucet|technick[^ ]* ucet|(^| )vklad|vyberte z uctu|poplatok|poplatek|(^| )pokuta|provizi|penize vybra|vybrat (penize|hotovost)|penize zachran|(^| )poslat [0-9]|na ucet spolubydlic|vlozit [0-9]|vyplata hned|zaplatit najem|platite|platiti|(^| )uplat|prebaciti|prebacite|naknad|preplata|ustedevin|podatke kartice|podataka o racunu i kartici|(^| )zlato( |$)|trebamo [0-9]`,
  unknown_link: String.raw`(^| )povezav|kliknite|spodnjega gumba|(^| )odkaz|klikni|kliknite|kliknete|(^| )poveznic|kliknite ovdje`,
  new_number: String.raw`nova stevilka|novo stevilko|shrani (to|mojo) stevilko|stara kartica mi ne dela|ine cislo|nove cislo|uloz (si )?(toto|moje) cislo|ulozte si (toto|moje) cislo|stary mobil mi odisiel|telefon (sa |se )?(pokazil|rozbil)|novy cislo|mobil mi spadl|telefon mi spadl|privremeni broj|novi broj|stari mob(itel)? (mi )?(je )?pao|spremi (ovaj|moj) broj`,
  impersonation: String.raw`varnostna sluzba banke|policijska uprava|(^| )policist|policijske postaje|(^| )edavki|financna uprava|posta slovenije|oddelka za digitalna|bezpecnostneho utvaru|bezpecnostniho oddeleni|policia sr|policajneho zboru|policie cr|ekonomickej kriminality|financna sprava|financni sprava|slovenska posta|ceska posta|primar chirurgie|(^| )nemocnica|oddeleni bezpecnosti|kriminalni policie|policie ceske republiky|technicka podpora vasi banky|guverner cnb|zastitu klijenata|policijske uprave|(^| )policij|kolega u civilu|porezna uprava|e prekrsaji|hp express|hrvatska posta|iz kbc`,
  secrecy: String.raw`nikomur ne povejte|ne povejte nikomur|med nama|nevolajte (teraz )?nikomu|nikomu (to )?nehovorte|nikomu (to )?nerikejte|nevolejte nikomu|nikome ne govorite|ne govorite nikome|ostane medu nama`,
  keep_on_line: String.raw`ne prekinjajte (zveze|klica)|ostanite na zvezi|nezlozte|nezavesujte|neukoncujte hovor|nepokladejte|ne prekidajte (vezu|poziv)|ostanite na vezi`,
  too_good_to_be_true: String.raw`tudi do [0-9]+ (evrov|eur)|si sluzi denar|zajamcen|privyrab|privydel|[0-9] € mesacne|proviziu denne|za kazdu ulohu|vydelavaji desitky tisic|za kazdy ukol|denne az [0-9]|za svaki zadatak|zaradu odmah|pobjednik dobiva`,
};
// Serbian, Bosnian and Montenegrin rules (wave 9), Latin and Cyrillic script, from the rs/ba/me drafts' labelled messages.
// Folded: č/ć → c, š → s, ž → z, đ → d; Cyrillic keeps ј, ђ, ћ, љ, њ, џ. Non-Latin parts use space boundaries.
const BCS = {
  asks_for_code: String.raw`(sestocifren|sesterocifren)[^ ]* (broj|kod)|(kod|broj)( [^ ]+)? koji (vam|ti) (je )?(sada |upravo )?(stize|stigne|stigao|dode|dosao)|(ukucas|ukucajte|proslijedite|prosledite|posaljite|posalji|procitajte|recite)( [^ ]+){0,3} (kod|koda|sifru)( |$)|slik[^ ]* koda|(шестоцифрен|шестоцифрени)[^ ]* (број|код)|(код|број)( [^ ]+)? које? (вам|ти) (је )?(сада )?(стиже|стигне|стигао)|(проследите|пошаљите|реците|прочитајте)( [^ ]+){0,3} (код|шифру)( |$)`,
  urgency: String.raw`(izmirite|platite|plati|platiti) (danas|odmah)|danas (plati|platite|izmirite)|do (sutra u podne|ponoci)|(^| )imas sat vremena|rok(om)? od (24|48) sat|bit[^ ]* (ogranicen|blokiran|ugasen|deaktiviran)|(измирите|платите|плати) данас|данас (плати|платите|измирите)|(^| )(хитно|одмах)( |$)|до поноћи`,
  money_request: String.raw`prebac(i|is|ite|iti|it)( |$)|(^| )plat(i|it)( |$)|izmirite|kaucij|podacima o kartici|podatke o kartici|(potvrdite|unesite|upisite)( [^ ]+){0,2} (karticu|broj kartice|podatke (o )?kartic)|troskove (skladistenja|dostave|carin)|(^| )ulog( |$)|pocetn[^ ]* (ulog|ulaganj|[0-9]+ (eur|km|din))|ulaganja|(^| )(xbon|paysafe)|(^| )плат(и|ите|ити)( |$)|одштет|кауциј|готовин|(^| )накит|измирите|плаћање|почетн[^ ]* улог|(^| )улог( |$)`,
  unknown_link: String.raw`(^| )линк|на (ovoj|sljedecoj|sledecoj) stranici`,
  new_number: String.raw`(moj )?novi viber|stari (mi je )?hakovan|privremeni broj|нови број|привремени број`,
  impersonation: String.raw`zovem iz (sluzb|banke|odeljenj|odjeljenj|sektora)|vase banke|poreska uprava|poreske uprave|uprava policije|tim za bezbjednost|tim za bezbednost|(^| )policij|пореска управа|пореске управе|(^| )полициј|саобраћајне полиције|зовем у име|(^| )инспектор`,
  secrecy: String.raw`ne govori (mami|tati|nikome)|nemojte ga (sad )?zvati|nikome ne (govorite|pricajte)|не говори (мами|тати|никоме)|никоме не (говорите|причајте)`,
  keep_on_line: String.raw`nemojte prekidati (vezu|poziv)|ne prekidajte|немојте прекидати (везу|позив)`,
  too_good_to_be_true: String.raw`zaradjuj[^ ]* (po )?(nekoliko )?hiljad|donosi preko [0-9]|isplata svaki dan|svakom gradjaninu|до [^ ]+ посто|зарађуј|zaradjuju|do [0-9]+ (posto|%)`,
};
// Albanian rules (wave 9), from the Albania and Kosovo drafts' labelled messages. Folded: ë → e, ç → c.
const SQ = {
  asks_for_code: String.raw`gjashte shifra|(padashur|gabimisht)( [^ ]+){0,4} kod|(^| )kod( [^ ]+){0,4} (padashur|gabimisht)|(ma|na) (lexoni|lexo|dergoni|dergo|kthe|kthen|jepni|thuaj|thoni)( [^ ]+){0,3} kod(in)?( |$)`,
  remote_access: String.raw`(instaloni|shkarkoni)( [^ ]+){0,3} (aplikacion|programin)`,
  urgency: String.raw`deri sot|brenda sot|paguhet (sot|brenda)|(brenda|gjate) (24|48) or|brenda [0-9]+ dit|deri neser|(^| )urgjent|do te bllokohet|eshte kufizuar|mbylljen e llogaris|nderprer|vendet jane te kufizuara`,
  money_request: String.raw`paguani (tarif|taks|vetem)|paguhet (sot|brenda)|duhet te pagua|kryeni pagesen|per ta shlyer|(^| )dergoj(i|ini)( |$)|western union|moneygram|me duhen [0-9]|(^| )duhet [0-9.]+ (euro|leke|lek)( |$)|nevoje per ndihmen tuaj|foto (te|e) kart|(shkrun|shkruaj|shkruani|vendosni|konfirmoni) (kartelen|karten|te dhenat e kart)|(fus|investo|investoni) [0-9]+`,
  unknown_link: String.raw`(^| )kliko|kesaj faqeje|ne kete faqe`,
  new_number: String.raw`nga numri i nje shoku|ma vodhen telefonin|numer(in)? i ri|numri im i ri|kam nderruar numrin`,
  impersonation: String.raw`sektori i monitorimit|departamenti i krimit|zv ?ministri|zevendesdrejtori|njerezit e ministrise|(^| )policia (e kosoves|rrugore|e shtetit)|posta shqiptare|posta e kosoves`,
  secrecy: String.raw`mos i thuaj (gje|askujt)|mos (ia|i) (permend|trego)|mes nesh|mos me telefononi`,
  keep_on_line: String.raw`jam ketu ne linje|mos e mbyllni|qendroni ne linje`,
  too_good_to_be_true: String.raw`merr deri [0-9]|cdo dite( [^ ]+){0,3} fitim|keni fituar|kart dhurate|miratuar paraprakisht|po fitojne nga shtepia`,
};
// Macedonian rules (wave 9), from the North Macedonia draft's labelled messages. Folded: ќ → к, ѓ → г; space boundaries.
const MK = {
  asks_for_code: String.raw`(испратете|пратете|кажете|прочитајте|препратете|испрати|прати|кажи)( [^ ]+){0,3} (кодот|кодовите|лозинката)( |$)|кодот( [^ ]+){0,2} што (ке|ви) пристигн`,
  urgency: String.raw`(^| )(итно|веднаш)( |$)|до вечер( |$)|плакање денес|(платите|плати) денес|(сметка|профил)[^ ]* (ке биде|е) (суспендиран|блокиран|затворен)|во рок од (24|48) час|присилна наплата`,
  money_request: String.raw`префрл(и|иш|ите)( |$)|(^| )плат(и|ите|ам|ат)( |$)|кауциј|уплатете|податоците од (вашата )?картичка|(потврдете|внесете)( [^ ]+){0,3} (податоците|картичка)|(^| )влог( |$)|вложување|административна такса|работен пакет`,
  new_number: String.raw`(^| )(новиот|нов) број|стариот телефон ми`,
  impersonation: String.raw`министерство за внатрешни работи|сајбер криминал|управа за јавни приходи|(^| )мвр( |$)|viber support|овде е полиција`,
  secrecy: String.raw`никому не кажувајте|не кажувај никому|мегу нас`,
  too_good_to_be_true: String.raw`[0-9]+ ?% месечно|делиме сигнали|вложувањето се врака`,
};
// Armenian rules (wave 10), Armenian script and the Latin transliteration SMS often use, from the Armenia draft's
// labelled messages. Lower-cased, punctuation (։ ՝ ՞) becomes a space; space boundaries.
const HY = {
  asks_for_code: String.raw`թվեր կգան|կարդացեք ինձ|եկած կոդ|կոդը (ասեք|ուղարկեք|թելադրեք|կարդացեք|գրեք)|(ասեք|ուղարկեք|թելադրեք|կարդացեք) կոդը|ekac kod|kody (aseq|uxarkeq|grir|greq)`,
  remote_access: String.raw`(տեղադրեք|ներբեռնեք)( [^ ]+){0,2} (հավելված|ծրագիր)`,
  urgency: String.raw`հենց հիմա|ժամվա ընթացքում|ժամանակ չկա|(^| )այլապես( |$)|հակառակ դեպքում|մինչև այսօր|hakarak depqum|minchev aysor|jamva yntacqum`,
  money_request: String.raw`(^| )(գցես|գցեք|փոխանցեք|փոխանցես|վճարեք)( |$)|գումարը տվեք|քարտի տվյալներ|դրամ է պետք|հազար պետք|գումար դնել|(^| )(vjareq|vjarelu|vjarel)( |$)`,
  keep_on_line: String.raw`մի անջատեք|մի անջատի( |$)|սպասեք գծում`,
  unknown_link: String.raw`(^| )հղում`,
  impersonation: String.raw`անհանգստացնում են բանկի|մոնիթորինգի բաժն|հերթապահ բժիշկ|(^| )ոստիկանությ|vostikanutyun`,
  secrecy: String.raw`ոչ մեկին մի ասա|ոչ մեկին ոչինչ մի`,
  too_good_to_be_true: String.raw`անվճար[^ ]* համալրում|յուրաքանչյուր օգտատեր|յուրաքանչյուր օգտատիր|միլիոններ վաստակ|վաստակում են [0-9]|աշխատավարձ օրական`,
};
// More Russian (wave 10), from the Belarus, Armenia and Russia drafts: protected accounts, investigators, loan fees.
const RU2 = {
  asks_for_code: String.raw`(продиктуите|назовите|скажите|сообщите)( [^ ]+){0,2} (его|их|цифры)( |$)|сообщение с кодом( [^ ]+){0,3} продиктуите|код записи`,
  remote_access: String.raw`(установите|скачаите)( [^ ]+){0,2} (его|приложение|программу)|даите разрешения`,
  urgency: String.raw`(^| )срочно( |$)|в течение часа|(^| )до 23 59|(^| )do 23 59|избежать( [^ ]+)? пени|inache posylka`,
  money_request: String.raw`(защищенн|безопасн|резервн|специальн)[^ ]* сч[её]т|переместить( [^ ]+){0,2} средства|возместить ущерб|сбор за (открытие|оформление|выдачу)|оплатите (сбор|комиссию|страховку)|переведи на карту|переведи(те)? по номеру|(^| )выручи( |$)|(^| )выручить [0-9]|введите (карту|данные карты|номер карты)`,
  impersonation: String.raw`(^| )дознавател|(^| )следовател|служба национальнои безопасности|управления по противодеиствию киберпреступности|служба поддержки вашего оператора|(^| )майор( |$)`,
  secrecy: String.raw`таина следствия|никому ничего не (говорите|рассказываите)|разглашать (его )?нельзя|ничего не обсуждаите`,
  keep_on_line: String.raw`останусь на линии|не кладите трубку`,
  too_good_to_be_true: String.raw`кредит( [^ ]+){0,4} одобрен`,
};
// Azerbaijani rules (wave 10), from the Azerbaijan draft's labelled messages. Folded: ç/ş/ğ/ı/ö/ü → c/s/g/i/o/u; ə is
// kept, and SMS often write it as e (and ş/ç as sh/ch), so patterns accept both.
const AZ = {
  asks_for_code: String.raw`kodunu (deyin|de|yazin|yaz|gonderin|gonder|bildirin)( |$)|g[əe]l[əe]n kodu|(telefonunuza|nomr[əe]niz[əe])( [^ ]+){0,3} (g[əe]l[əe]n|gond[əe]rdiyimiz)( [^ ]+){0,2} kod`,
  urgency: String.raw`tez olun|bu gun bitir|bu gun od[əe]|(48|24) saat [əe]rzind[əe]|tez q[əe]rar verin|dondurulacaq|geri qaytarilacaq|ikiqat artirilacaq`,
  money_request: String.raw`(^| )kocur( |$)|kocururs|hesabina kecir|nagdlasdir|od[əe]m[əe]lisiniz|kart m[əe]lumatlar|kart nomr[əe]si|[əe]vv[əe]lc[əe]d[əe]n od[əe]nilir|yoxlama hesab`,
  impersonation: String.raw`musteri d[əe]st[əe]yind[əe]n|prokurorlu|narahat edirl[əe]r|maliyy[əe] m[əe]sl[əe]h[əe]tci`,
  secrecy: String.raw`ail[əe]niz[əe]( [^ ]+){0,4} (dem[əe]yin|danismayin)|(^| )z[əe]ng etm[əe]( |$)`,
  too_good_to_be_true: String.raw`qazanc gorunur|ayda [0-9]+ (azn|manat) qazan|r[əe]dd cavabi yoxdur|zamin t[əe]l[əe]b olunmur|sizin qalir`,
};
// Georgian rules (wave 10), Georgian script and the Latin transliteration some SMS use, from the Georgia draft's labelled
// messages. Georgian has no case and keeps its letters; space boundaries.
const KA = {
  asks_for_code: String.raw`კარნახით უთხარით|შეტყობინებას( [^ ]+){0,2} წაიკითხავთ|კოდი (მითხარით|გვითხარით|გამომიგზავნეთ|გამოგვიგზავნეთ)|(მითხარით|გვითხარით|გამომიგზავნეთ) კოდი`,
  remote_access: String.raw`გაგვიზიარეთ ეკრანი|ეკრანი გაგვიზიარეთ|ეკრანის გაზიარება`,
  urgency: String.raw`(^| )სასწრაფოდ( |$)|საათის განმავლობაში|(^| )ახლავე( |$)|ნახევარ საათში`,
  money_request: String.raw`ჩაურიცხე|ჩარიცხეთ|საფასური [0-9]|შენატან|კომპენსაცია|რამდენი გაქვთ სახლში|(^| )ოქრო|ბანკი უნდა აირჩიოთ|ჩაგერიცხოთ|(^| )ანგარიში( |$)|(^| )shetana|sheavset monacemebi|tankhis dasabruneblad`,
  unknown_link: String.raw`(^| )ბმულ`,
  impersonation: String.raw`ბანკიდან გაწუხებთ|მონიტორინგის ჯგუფ|ეროვნული ბანკის ზედამხედველობ|(^| )გამომძიებელ|shemosavlebis samsakhuri`,
  too_good_to_be_true: String.raw`დღეში [0-9]|დაგამატებენ|გამოიმუშავა [0-9]|მხოლოდ [0-9]+ (ადგილ|ლარად)|დიდი გათამაშება|anazghaureba [0-9]+`,
};
// Latin American Spanish (wave 11), from the South American drafts' labelled messages. Folded: á/é/í/ó/ú → a/e/i/o/u,
// ñ → n. The base Spanish rules (Argentina, Mexico, Spain) are inline in SIGNS.
const LATAM = {
  asks_for_code: String.raw`(numero|codigo|clave)( [^ ]+){0,2} que (le|te) (acaba de llegar|acaban de llegar|llego|llega|va a llegar)|(me confirma|me dice|me lee|me los puede leer|me lo puede leer|me pasa|me dicta)( [^ ]+){0,4} (numero|numeritos|codigo)|numeritos|(mensaje|notificacion) para (autorizar|aprobar)|(^| )seis numeros|me lo puede leer|leamelo|leemelo|me lo lee( |$)|me (los|lo) dicta|mensajito con (unos|los|seis) numeros|mensajito con numeros|me lo reenvias|reenviamelo|(me diga|deme|digame)( [^ ]+){0,2} (usuario|clave|contrasena)`,
  urgency: String.raw`plazo:? [0-9]+ (dias|horas)|solo hasta (la )?medianoche|valido solo hasta|antes de que se cierren|hay otra persona (que )?(ya )?(me )?(quiere|interesad)|antes de las 23 59|cupos (solo )?hasta|ultimos cupos|(esta|anda) apurado|se va de viaje|hay varios interesados|antes de que lo borren|entre bancos se demora|me estan preguntando (bastante|mucho)|por tanto mensaje|se lo doy al siguiente|antes de que (la|lo) quiten|proceso de baja|cierran el registro|personas mas interesadas|mi mensajero pasa|pasa en [0-9]+ minutos por|apurese|tiene hasta (manana|hoy)`,
  money_request: String.raw`(actualice|actualiza|confirme|confirma)( [^ ]+){0,2} (cuenta bancaria|datos bancarios)|si (hoy )?no (se )?(cancelan|cancela|paga|pagan)|invierta desde|invierte desde|(^| )me adelanta(s)?( |$)|me consigue [^ ]+ (millones|mil)|(^| )consigame|(^| )pones [0-9]|(^| )transfier(a|e|an)( |$)|me haces el pago movil|hazme (un|el) pago movil|(llena|completa) (tus|sus) datos para recibir|comision por cada tarea|(^| )(girar|gires|girame|girarme)( |$)|(si )?me pasas [0-9]|pasame [0-9]|saque (sus|tus) ahorros|retirarlos como evidencia|(^| )meti (l |\$ ?)?[0-9]|debe consignar|(cubres|cubre|pagas|paga) la poliza|antes del desembolso|mandame el [0-9]+ ?%|aparto con|sobre con (dolares|dinero|plata)|un taxi para recogerlo|recoger la tarjeta|invertir desde|(^| )q ?[0-9]|(^| )puse [0-9]|inversion minima|(^| )[0-9][0-9.,]* dolares`,
  new_number: String.raw`te escribo de (este|otro) numero|el mio esta sin saldo|soy yo,? [a-z]+,? desde mi numero`,
  impersonation: String.raw`oficina de encomiendas|revision de aduana|retenid[oa] en (la )?aduana|superintendencia de bancos|direccion juridica|(^| )felcc( |$)|habla el (teniente|sargento|capitan|oficial|mayor|inspector|comisario)|policia de investigaciones|area de fraudes|oficina de prevencion|centro de seguridad de|linea preferencial`,
  secrecy: String.raw`no (comente|comentes|cuente|cuentes|diga|digas)( [^ ]+){0,3} con nadie|no me vaya a llamar a ningun policia|no (llame|llames) a (la )?policia|no (llame|llames|avise|avises) a (sus|tus) (papas|padres|hijos)|no le (comente|cuente|diga) a nadie|si (llama|le dice|avisa|le avisa) a la policia|no lo llame,? que le quitaron|sin (comentarle|decirle|contarle) a nadie|no le (cuente|diga|digas|cuentes) a (mi|tu|su) (papa|mama)`,
  keep_on_line: String.raw`no me cuelgue|no me cuelgues|lo espero en (la )?linea|si (cuelga|cuelgas)( |$)`,
  too_good_to_be_true: String.raw`generar [^ ]+ al mes|miles de [a-z]+ ganando|sin hacer nada|(cada semana|todos los dias) me caen|retiros garantizados|gana hasta [0-9.,]+ (dolares )?(semanales|mensuales|diarios)|ganar [0-9]+ (millones|mil) por dia|por cada tarea|por tarea|dando me gusta|quedo aprobado|aunque tenga deudas|(salio|esta|fue) aprobad[oa]|sin garante|sin fiador|aprobacion el mismo dia|pre ?aprobado|ingresos de hasta|(te|le) devuelven el doble|hasta (usd )?[0-9.]+ (mensuales|al mes)`,
};
// More English (wave 12), from the Belize draft's labelled messages: loan "activation fees", forwarded verification
// numbers, sellers holding an item for a deposit.
const EN2 = {
  keep_on_line: String.raw`(don ?t|do not) (end|drop) the call|stay on the call`,
  remote_access: String.raw`(download|install)( the| this| our)? screen ?sharing( app)?|so we can watch you|download( \w+){0,2} app( |$)`,
  asks_for_code: String.raw`(read|tell|give|send)( me)?( the)? (6|six|4|four)[ -]?digits?|(reference|verification|security) code to your (mobile|phone)|(verification|confirmation|security) (number|code) (was |has been )?sent to your phone|please forward it( here)?( |$)`,
  urgency: String.raw`(slots|spots) are filling (up )?fast|or (they|we) will (auction|cancel|suspend|block|dispose)|lots of people want it|(many|other) people (are )?interested|only keep it for you if|spaces (are )?limited`,
  money_request: String.raw`pay the p?[0-9.,]+ (redelivery|delivery|shipping|storage|reservation)|redelivery (charge|fee)|reservation fee|(you must|need to) settle p?[0-9]|activation fee|release the (full )?amount|have your (bank login|debit card|online banking)( [^ ]+){0,3} (on hand|ready)`,
  impersonation: String.raw`central bank of [a-z]+|supervision office`,
  too_good_to_be_true: String.raw`salary sent daily|p?[0-9]+ per (review|task|like)|(give|pay) you back double|bad credit (ok|okay|no problem|accepted)|loans? up to \$?[0-9]`,
};
// Tagalog / Taglish rules (the Philippines), from the Philippines draft's labelled messages. Folded, space boundaries.
const TL = {
  asks_for_code: String.raw`may darating( po)? na code|pakisend( [^ ]+){0,3} (code|otp)|(code|otp)( [^ ]+){0,3} pakisend|(sabihin|ibigay)( mo| nyo)?( [^ ]+){0,2} (code|otp)`,
  money_request: String.raw`pa ?send ng|(^| )pakibalik|(^| )makisuyo|(^| )padalhan|pahiram( [^ ]+){0,2} [0-9]`,
  new_number: String.raw`bagong (sim|number|numero) ko|(^| )nawala (yung|ang) phone ko`,
  secrecy: String.raw`text lang muna tayo|wag mo (sabihin|ipaalam)`,
  urgency: String.raw`(^| )ngayon na( |$)|(^| )kailangan ko( [^ ]+){0,2} ngayon`,
};
// Hungarian rules (wave 7), from the Hungary draft's labelled messages. Folded: á → a, é → e, ő/ö/ó → o, ű/ü/ú → u.
const HU = {
  asks_for_code: String.raw`(mondja meg|diktalja|olvassa fel|kuldje el|adja meg|add meg)( [^ ]+){0,3} (kodot|kodjat|jelszot|jelszavat)`,
  remote_access: String.raw`telepitsunk|telepitse( [^ ]+){0,2} (alkalmazast|programot)|toltse le( [^ ]+){0,2} (alkalmazast|programot)|tavoli hozzaferes`,
  urgency: String.raw`(^| )(azonnal|surgos|surgosen)( |$)|mai napon belul|(24|48) oran belul|[0-9] napon belul`,
  money_request: String.raw`at kell vezet|vedett( technikai)? szamla|technikai szamla|letetbe|ovadek|(^| )kifizet|atutalsz|(^| )atutal|utaljon|befizet|dij kifizet|kartyaadat|egyenliti ki|emelni a betetet`,
  unknown_link: String.raw`kattintson ide|kattints ide`,
  new_number: String.raw`uj szamom|ez az uj szamom|mentsd el|a regit elloptak|telefonom (elromlott|leesett|ellopt)`,
  impersonation: String.raw`biztonsagi (csoport|osztaly)|kiberbunozes elleni|(^| )brfk( |$)|(^| )rendorseg|vedougyved|(^| )nav( |$)|(^| )neak( |$)|mvm next|magyar posta|szemelyes menedzser`,
  secrecy: String.raw`bankfioknak ne mon|ne mondja el (senkinek|a banknak)|senkinek ne szoljon|ne szoljon senkinek`,
  keep_on_line: String.raw`ne tegye le|maradjon (a )?vonalban`,
  too_good_to_be_true: String.raw`nagyobb hozam|(^| )hozamot|nyeremeny|on nyert`,
};
// Lithuanian rules (wave 8), from the Lithuania draft's labelled messages, plus Russian wording seen there.
// Folded: ą → a, č → c, ę/ė → e, į → i, š → s, ų/ū → u, ž → z; й → и.
const LT = {
  asks_for_code: String.raw`iveskite pin|(^| )pin[12]( |$)|(persiusk|persiuskite|pasakykite|padiktuokite|nurodykite)( [^ ]+){0,3} (koda|kodus|ji|pin)|sms su kodu|patvirtin[^ ]* tapatyb|назовите (их|цифры|код)|(sms|смс) с цифрами`,
  remote_access: String.raw`(atsisiuskite|idiekite)( [^ ]+){0,2} (programel|program)|nuotolin[^ ]* priei`,
  urgency: String.raw`(^| )(siandien|skubiai|tuoj pat)( |$)|per (24|48) (val|h)|per 2 d( |$)`,
  money_request: String.raw`pervesti|pervedim|sumokek|sumokesim|apmoket|apmokejim|(^| )bauda|saugi(a)? saskait|grynuosius|nukentejusiajam|korteles duomen|reikia [a-z]+ tukstanc`,
  unknown_link: String.raw`(^| )nuoroda|paspauskite nuoroda`,
  new_number: String.raw`naujas numeris|issisaugok (sita|si numeri)|senaji pameciau`,
  impersonation: String.raw`saugumo tarnyb|policijos departament|(^| )pareigunas|(^| )policij|(^| )vmi( |$)|omniva|lietuvos pastas|финансовыи отдел|ваш мобильныи оператор`,
  secrecy: String.raw`nesakyk (mamai|niekam|tevams)|niekam nesakykite`,
  keep_on_line: String.raw`nepadekite rageli|nedekite rageli|likite linijoje`,
  too_good_to_be_true: String.raw`galima uzdirbti|uzdirbti [0-9]|atlygis kasdien|be rizikos|без риска|доход от [0-9]`,
};
// Estonian rules (wave 8), from the Estonia draft's labelled messages. Folded: ä → a, ö/õ → o, ü → u.
const ET = {
  asks_for_code: String.raw`(kinnitage|kinnita)( [^ ]+){0,3} (smart id|tuvastus|teade|teavitus)|sisestage( [^ ]+){0,2} pin|esimesest koodist|smart id teade|подтвердите( [^ ]+){0,3} smart`,
  remote_access: String.raw`paigalda(ge)?( [^ ]+){0,2} (rakendus|programm)|kaugjuurdepaas`,
  urgency: String.raw`(^| )(tana|kiiresti)( |$)|(24|48) tunni jooksul|[0-9] paeva jooksul|(^| )hiljemalt`,
  money_request: String.raw`(^| )tasuge|tasumise|ulekanne|(^| )kanda( |$)|kaardiandmed|kinnitage pangakonto|vaikelaen|raha vastuvotmine|(^| )trahv`,
  unknown_link: String.raw`avage link|vajutage lingile`,
  new_number: String.raw`uus number|minu uus number|salvesta (see|minu) number|telefon (lagunes|kukkus)`,
  impersonation: String.raw`pettuste ennetuse osakond|(^| )uurija|haigla registratuur|vorguettevot|(^| )politsei|(^| )maksuamet|kullerteenus|investeerimisplatvorm`,
  secrecy: String.raw`arge (raakige|raaki)( [^ ]+){0,2} (kellelegi|pangale|pangatootaja)|ara raagi kellelegi`,
  keep_on_line: String.raw`arge pange toru arra|arge katkestage kone|ara pane toru arra`,
  too_good_to_be_true: String.raw`on juba kasvanud|suuremast tousust|garanteeritud tulu`,
};
// Latvian rules (wave 8), from the Latvia draft's labelled messages, plus Russian wording seen there. Folded: ā → a,
// č → c, ē → e, ģ → g, ī → i, ķ → k, ļ → l, ņ → n, š → s, ū → u, ž → z. "šodien" (today) alone is not urgency: genuine
// family requests use it.
const LV = {
  asks_for_code: String.raw`(sakiet|nosauciet|nolasiet|parsutiet|ievadiet)( [^ ]+){0,3} (kodu|pin|ciparus)|apstipriniet( [^ ]+){0,3} smart id|apstiprinat bankas rekvizitus|spiediet vienu|продиктуите( [^ ]+){0,2} цифр`,
  remote_access: String.raw`(instalejiet|lejupladejiet)( [^ ]+){0,2} (lietotni|programmu)|attalin[^ ]* piekluv`,
  urgency: String.raw`(^| )(steidzami|nekavejoties)( |$)|(24|48) stundu laika`,
  money_request: String.raw`samaksajiet|(^| )samaksat|nomaksat|naudas sods|uzkrajum|parskaitit|parskaitijum|dross?ai?s? kont|bankas rekvizit|внести залог|(^| )залог`,
  unknown_link: String.raw`(^| )saite( |$)`,
  new_number: String.raw`saglaba (so|sho) numuru|jauns numurs|manejais saplisa|telefons saplisa|rakstu no drauga telefona`,
  impersonation: String.raw`ekonomisko noziegumu parvalde|(^| )policij|valsts ienemumu dienest|(^| )csdd( |$)|socialas apdrosinasanas agentur|latvijas bankas prezidents|дежурная часть|юридическая компания|служба доставки`,
  secrecy: String.raw`nevienam nestastiet|nestastiet nevienam`,
  keep_on_line: String.raw`nenolieciet klausuli|neliekiet klausuli`,
  too_good_to_be_true: String.raw`stabilus ienakumus|izmaksa katru dienu|(^| )ienakumi [0-9]`,
};
// Rules every check uses: Spanish, Portuguese and English (the first countries), plus the Latin American and Belize
// blocks. Language blocks below apply only when the check's country uses that language (see compileSigns).
const BASE = {
  asks_for_code: String.raw`\bcodigo|\bclave|\bpin\b|\btoken\b|contrasena|` + EN.code + '|' + EN2.asks_for_code + '|' + LATAM.asks_for_code,
  remote_access: String.raw`(download|install)( the| this| our)? screen ?sharing( app)?|so we can watch you|download( \w+){0,2} app( |$)|instal(a|e|ar|o|en|ame|ate)\b|descarg|anydesk|teamviewer|supremo|baj(a|e|ar|o) (esta|la|una|el|este) (app|aplicacion)|ver (tu|su|mi) pantalla|selfie|foto (de|del) (tu |su )?dni|` + EN.remote,
  urgency: String.raw`evit(a|e|ar|ando)( [a-z]+){0,2} (decomiso|embargo|restriccion|suspension|recargo|bloqueo)|cobro juridico|ultimo recordatorio|embargos? bancari|aumento de la deuda|notificacao extrajudicial|evite (a |sua |o |seu )?(restricao|suspensao|bloqueio|multa)|avoid (late fees|penalt|suspension|additional (fees|charges)|legal action)|urgent|\bhoy\b|vence|vencimiento|bloque|suspend|inmediat|ahora mismo|\b24 ?(h|hs|horas|hours)\b|ultimo aviso|rapido|\btoday\b|immediately|right (now|away)|expir|account (is |will be |has been )?locked|final (notice|warning)|last chance|\basap\b|\bhoje\b|imediatamente|` + EN2.urgency + '|' + LATAM.urgency,
  money_request: String.raw`(registrando|registre|registra|ingrese|indique) (una|su|tu) cuenta bancaria|provide (accurate |your |correct )?(payment|bank|billing|card) (information|details)|\biban\b|transfer|\bplata\b|dinero|\bpag(a|ar|ue|ues|a)\b|abon|\bsena\b|\bcbu\b|\bcvu\b|\balias\b|\$|€|£|deposit|prestamo|cajero|devolv|(datos|numero) de (tu|la|su) tarjeta|` + EN.money + '|' + EN2.money_request + '|' + LATAM.money_request,
  unknown_link: String.raw`(^| )линк|enlace|\blink\b|http|www|desconocid|click (here|the|this|below)|`,
  new_number: String.raw`troquei de numero|numero novo|novo numero|salva (esse|este|meu) numero|numero nuevo|nuevo numero|cambie de numero|agendalo|agenda este|agendame|numero alternativo|se me (cayo|rompio|mojo) el (cel|celu|celular|telefono)|new number|changed my number|save (this|my) number|mudei de numero|guarda (este|esse|o meu) numero|telemovel (caiu|partiu|avariou|estragou)|` + LATAM.new_number,
  impersonation: String.raw`raiffeisen|le hablo de|te hablo de|somos de|\bpami\b|\banses\b|\barca\b|\bafip\b|\bbanco\b|correo argentino|mercado pago|soporte tecnico|area de seguridad|(calling|call|message) from (your|the) bank|your bank s|bank s (fraud|security)|tech(nical)? support|fraud (team|department)|security (team|department)|calling from|post office|customs (office|fee)|tax (office|agency)|from the (irs|hmrc|ato|cra)|royal mail|\busps\b|\bctt\b|financas|autoridade tributaria|seguranca social|seg social|an post|\brevenue\b|\bgarda\b|\bbov\b|maltapost|\bmtca\b|` + EN2.impersonation + '|' + LATAM.impersonation,
  secrecy: String.raw`nao (conta|fala|diga|conte|fale) (pra|para|a) ninguem|no le digas|no se lo digas|no le cuentes|entre nosotros|que no se entere|don ?t tell (anyone|anybody|your)|do not tell (anyone|anybody|your)|between (us|you and me)|keep (this|it) (secret|quiet)|` + LATAM.secrecy,
  keep_on_line: String.raw`(don ?t|do not) (end|drop) the call|stay on the call|nao (desligue|desliga)|fique na linha|no corte|no cortes|quedese en linea|no cuelgue|don ?t hang up|do not hang up|stay on the (line|phone)|` + LATAM.keep_on_line,
  too_good_to_be_true: String.raw`ganaste|ganador|premio|sorteo|gratis|rendimiento|ganancia|duplic|congratulations,? you|you (ve |have )?won|winner|\bprize|lottery|guaranteed (return|profit|income|earning)|double your|` + EN2.too_good_to_be_true + '|' + LATAM.too_good_to_be_true,
};
// Each block applies only to checks whose country uses one of its languages (or a close relative: Azerbaijani and
// Turkish, Macedonian with Bulgarian and Serbian), so a short word in one language can't
// fire inside another (Finnish "varat" in Bosnian "otvarati"). With no languages given, every block applies.
const BLOCKS = [
  { langs: ["fr", "nl"], rules: FR_NL },
  { langs: ["de"], rules: DE },
  { langs: ["it", "pl", "ro"], rules: IT_PL_RO },
  { langs: ["uk", "ru", "bg", "el", "tr", "be", "mk", "az"], rules: CY_EL_TR },
  { langs: ["sv", "da", "no"], rules: SCAND },
  { langs: ["fi"], rules: FI },
  { langs: ["is"], rules: IS },
  { langs: ["sl", "sk", "cs", "hr", "bs", "sr"], rules: SLAVIC },
  { langs: ["ka"], rules: KA },
  { langs: ["az"], rules: AZ },
  { langs: ["ru", "be", "uk"], rules: RU2 },
  { langs: ["hy"], rules: HY },
  { langs: ["mk"], rules: MK },
  { langs: ["sq"], rules: SQ },
  { langs: ["sr", "bs", "hr", "mk", "bg"], rules: BCS },
  { langs: ["hu"], rules: HU },
  { langs: ["lt"], rules: LT },
  { langs: ["et"], rules: ET },
  { langs: ["lv"], rules: LV },
  { langs: ["tl"], rules: TL },
  // Turkish uses "parola" for a password, as Romanian and Italian do.
  { langs: ["tr", "az"], rules: { asks_for_code: String.raw`\bparola\b` } },
];
const SIGN_IDS = Object.keys(BASE);
const COMPILED = new Map();
/** The sign regexes for a set of language codes (null or empty = every block). Cached per language set. */
export function compileSigns(langs) {
  const key = langs && langs.length ? [...new Set(langs)].sort().join(',') : '*';
  let out = COMPILED.get(key);
  if (!out) {
    const want = key === '*' ? null : new Set(key.split(','));
    const blocks = BLOCKS.filter((b) => !want || b.langs.some((l) => want.has(l)));
    out = Object.fromEntries(SIGN_IDS.map((id) => [id, new RegExp([BASE[id], ...blocks.map((b) => b.rules[id])].filter(Boolean).map((r) => r.replace(/^\|+|\|+$/g, '')).join('|'))]));
    COMPILED.set(key, out);
  }
  return out;
}
export const SIGNS = compileSigns(null);

// A genuine one-time-code text warns you not to share the code ("no lo compartas", "never share", "we will never ask").
// That warning cancels asks_for_code unless the message also asks you to hand the code over.
const CODE_WARNING = /no (lo|la|los|las) compartas|no compartas|nunca (te|le|se) (lo|la) (va a |vamos a |van a )?(pedir|pedira|solicit)|nunca te (pedira|pediremos|solicitara)|nao (compartilhe|partilhe|passe|informe|divulgue)|nunca (pede|solicita|pedimos)|(don t|do not|never) share|will never (call|text|ask|message)|never ask(s)? (you )?for|nunca (te |le )?(vamos a |va a |van a )?(pedir|pediremos|pedira|solicitaremos)|nao pedimos|nunca pedimos|nor (lo|la) (compartas|des)|ne (le |la )?(communiquez|partagez|transmettez|donnez)( le| la)? (jamais|a personne)|ne (vous )?(le )?demander(a|ons|ont) jamais|ne demandons jamais|deel (deze|de|die) code (nooit|met niemand)|nooit (doorgeven|delen)|(vragen|vraagt) (u|je) nooit|zullen (u|je) nooit (vragen|bellen)|(geben|teilen) sie (diesen |den |ihren )?(code|tan)( \w+){0,2} (niemals|nie|an niemanden|mit niemandem)|niemals weiter|nie weitergeben|werden sie (niemals|nie) (nach|anrufen|fragen)|fragen (sie )?(niemals|nie) nach|wir fragen nie|non (condividere|comunicare|fornire)( a nessuno)? (questo |il )?codice|non chiediamo mai|non (ti|le|vi) chiederemo mai|nie (udostepniaj|podawaj|przekazuj) (nikomu )?(tego )?kodu|nikomu nie podawaj|nigdy nie (prosimy|poprosimy|dzwonimy)|nu (comunicati|comunica|divulgati|divulga) (nimanui|acest cod|codul)|nu va vom cere niciodata|niciodata nu (va )?(cerem|solicitam)|нікому не (повідомляите|кажіть|передаваите)( [^ ]+){0,2} код|никому не (сообщаите|говорите|передаваите)( [^ ]+){0,2} код|не (го )?споделяите( [^ ]+){0,2} с никого|никога не (искаме|изискваме)|ніколи не (просимо|запитуємо|телефонуємо|дзвонимо)|никогда не (просим|запрашиваем|звоним)|никога не (звъним|се обаждаме)|μην (τον )?(γνωστοποιησετε|δωσετε|κοινοποιησετε)( [^ ]+){0,3} κανεναν|δεν (σασ )?ζηταμε ποτε|ποτε δεν ζηταμε|kimseyle paylasmayin|lamna aldrig ut|kode ne posredujte|nevienam neizpaudiet|nekad neprasa|ara anna koodi|arge andke koodi|ei kusi kunagi|ei palu( [^ ]+){0,3} kinnitada|niekam neatskleiskite|niekada (nepraso|neprasome)|senkinek ne adja meg|soha nem kerik|soha nem kerjuk|(aktivalni|aktivalhatja)( [^ ]+){0,6} pin|pin koddal (tudja|aktival)|kod nikome ne dajte|no (solicita|pide|pedimos|solicitamos)( [^ ]+){0,2} (contrasenas|claves|codigos|pin)|no lo comparta con nadie|nunca (la|lo) compartas|nunca compartas|nunca (la|lo) comparta( |$)|nunca (le|te) (solicitara|solicitaremos)|no (la|lo) compartas|no necesitamos ningun (dato|codigo)|clave del (porton|wifi|wi fi|edificio|candado)|ningun (funcionario|empleado|asesor)( [^ ]+){0,3} (se lo |le )?(va a )?(solicitar|pedir)|(activa|activala|activarla)( [^ ]+){0,4} con (tu|su) pin|no (te|le|les) (pediremos|vamos a pedir|solicitaremos|pedimos)( [^ ]+){0,2} (claves|contrasenas|codigos|datos)|კოდი არავის (გაუზიაროთ|უთხრათ|გადასცეთ)|არასდროს (გთხოვთ|მოგთხოვთ)|или предъявите паспорт|kodu (h[əe]c|hech) kim[əe] (dem[əe]yin|verm[əe]yin)|kims[əe] il[əe] (paylasmayin|paylashmayin)|pin kodu( [^ ]+){0,3} (t[əe]tbiqd[əe]|tetbiqde)|(kod|kodu) (sorusmur|ist[əe]mir)|կոդը ոչ մեկին մի (հայտնեք|ասեք|տվեք)|երբեք չի (պահանջում|խնդրում)|pin( [^ ]+){0,3} (կստանաք )?(բանկի )?հավելվածում|не даваите (этот )?код никому|никому не даваите( [^ ]+){0,2} код|никому не (го )?(споделувајте|давајте|кажувајте)|никогаш (нема да )?(не )?(побара|бара)|mos (ia|e) (jepni|ndani|tregoni)( [^ ]+){0,3} (kodin|kod|askujt|me askend)|pin( [^ ]+){0,7} (te vecante|vecmas)|nuk (ju )?(kerkojme|kerkon) kurre|nikome ne (otkrivajte|dajte|govorite|prosledujte|prosljedujte|saljite)|ne (otkrivajte|dajte) nikome|pin stize posebn|nikada? (vas )?(nece|ne) tra(ziti|zi|ze)|никоме не (откривајте|дајте|шаљите|прослеђујте)|никада (вас )?(неће|не) тражи|nikad (vas )?(nece|ne) tra(ziti|ze)|ne (dajte|saljite) (kod|pin)|pin( [^ ]+){0,3} u (mobilnoj )?aplikacij|kod nikomu (neposkytujte|nesdelujte|nedavajte)|nikdy (vas )?nebude (ziadat|chtit)|ne posredujte (kode|gesla)|nikoli ne (bo|bomo) (prosila|prosili|zahtevali)|pin prejmete v loceni|gefdu engum( thetta)? (numer|kodann|koda)|bidur aldrei um|munum aldrei bidja|ala koskaan kerro (koodia|tunnuksia)|ala (anna|jaa) (koodia|tunnuksia)|emme (kysy|koskaan pyyda)|tunnuksia en tarvitse|dela aldrig (koden|din kod)|vi (ringer|kommer) aldrig|aldrig (att )?be (om|dig)|(del|giv) aldrig (koden|din kode)|vi ringer aldrig|vi beder aldrig|(del|gi) aldri (koden|din kode)|vi ringer aldri|vi spor aldri|vi ber aldri om|vi beder aldrig om|pin( [^ ]+){0,4} (στην εφαρμογη|μεσω τησ εφαρμογησ|ξεχωριστα)|pin( [^ ]+){0,4} (у застосунку|в застосунку|в приложении|в приложението)|pin( [^ ]+){0,4} uygulama|sifre(nizi|nizi)?( [^ ]+){0,6} kendiniz (olustur|belirle)|kimseyle paylasma|kimseye (vermeyin|soylemeyin)|asla (istemeyiz|talep etmeyiz)|(separaten|eigenen|gesonderten) brief|\bpin(ul)?( \w+){0,3} (in|din) aplicati|\bpin( \w+){0,3} in (the|your) app\b|\bpin( \w+){0,3} w aplikacji|\bpin( \w+){0,3} (nell|in der) app|separately by (post|mail)|par courrier separe|apart per post|por correo (aparte|separado)/;
const CODE_HANDOVER = new RegExp(String.raw`(pasa|manda|envia|dicta|deci|reenvia|da|comparti)(me|nos)\b( \w+){0,3} (el |la |ese |esa )?(codigo|clave|pin)|me (pasas|mandas|envias|dictas|decis|das|reenvias|compartis) (el |la |ese |esa )?(codigo|clave|pin)|(me |nos )?(manda|passa|envia|informa)( \w+){0,2} (o |esse |este )?codigo|(send|read|tell|give|forward|text)( \w+){0,4} (code|passcode|password|pin)\b|\b(code|passcode|pin) (we|i|they) (sent|texted)|(donnez|communiquez|transmettez|envoyez|dictez|lisez|donne|envoie|transmets)( \w+){0,3} (le |ce |votre |ton )?code|(geef|stuur|lees)( \w+){0,3} (de |die |deze |je |uw )?(code|pincode)|(code|pincode) (doorgeven|doorsturen|voorlezen)|(geben|nennen|schicken|senden|lesen) sie( \w+){0,3} (mir |uns )?(den |diesen |ihren )?(code|tan)\b(?! (niemals|nie|an niemanden|keinesfalls|mit niemandem))|(gib|schick|nenn|sag) mir( \w+){0,3} (den |diesen )?code|(скажіть|назвіть|продиктуите|надішліть|скажите|назовите|пришлите|кажете|продиктуваите|изпратете)( [^ ]+){0,3} (код|пароль|парола)(?! из приложения)|(πειτε|στειλτε|δωστε|διαβαστε|υπαγορευστε)( [^ ]+){0,3} κωδικο|kodu(nu)? (bana )?(soyle|soyleyin|ilet|iletin|gonder|gonderin|oku|okuyun)`);

// Words that cancel the code warning's exception: a request is still a request when it sits next to "don't share".
// Negated clauses ("we'll never ask you to tell us your PIN") are removed before looking for a handover request.
const NEGATED = /\b(never|nunca|nao|no|don t|do not|won t|will not|jamais|nooit|niet|niemals|nie|nicht|mai|non|nigdy|niciodata|nu|nikoli|nikada|nikdy|nikdar)( \w+){0,7} (code|codes|pin|password|passcode|clave|claves|codigo|codigos|contrasena|senha|passe|wachtwoord|pincode|tan|passwort|codice|kodu|kod|hasla|haslo|codul|parola|kode|kodo|gesla|geslo|lozinku|heslo)\b/g;
// The same for Cyrillic, Greek and Turkish, with spaces as boundaries.
const NEGATED_X = /(^| )(ніколи|никогда|никога|не|ποτε|μην|δεν|asla)( [^ ]+){0,7} (код|коду|кода|пароль|парола|κωδικο|κωδικουσ|kod|kodu|sifre)( |$)/g;
const withoutNegations = (t) => t.replace(NEGATED, ' ').replace(NEGATED_X, ' ');
// "Ingresá con tu clave fiscal", "sign in with your password": where to log in, not a request to hand it over.
const LOGIN_WITH = /\b(ingrese|ingresen|ingresa|ingresando|entra|entrando|accede|accediendo|inicia sesion|inicie sesion|log in|login|sign in|acesse|entre)( \w+){0,4} (con|with|com|using|usando) (tu|su|your|sua|seu) (clave|contrasena|password|senha|usuario)|\buse (su|tu) usuario y contrasena|\bingrese usted mismo|\bingrese directamente|\bingresando usted mismo|\b(connectez vous|connecte toi|identifiez vous)( \w+){0,4} (avec|a l aide de) (votre|ton) (mot de passe|identifiant)|\b(inloggen|log in|login)( \w+){0,4} met (uw|je|jouw) (digid|wachtwoord|itsme)|logga in sjalv|log selv ind|logg inn selv|kirjautumalla itse|kirjaudu itse|\b(melden sie sich|loggen sie sich|einloggen|anmelden)( \w+){0,4} mit (ihrem|deinem|ihren) (passwort|zugangsdaten|id austria)|\b(accedi|accedere|entra)( \w+){0,4} con (il tuo|le tue|lo|la tua) (spid|password|credenziali|cie)|\b(zaloguj sie|zalogowac sie)( \w+){0,4} (przez|w|do) (aplikacj|mobywatel|profil zaufany|bankowosc)|\b(autentificati va|autentifica te|conectati va|intrati)( \w+){0,4} (in|cu) (spv|contul|parola|aplicatia)/;
// "No tenés nada que pagar", "nothing to pay": the message says there is no payment.
// "We will never ask for your bank details": a warning, not a request. The negated clause is removed and the money
// sign is read again on what is left, so "never ask for bank details, but pay the fee here" still counts.
const NEGATED_MONEY = /\b(never|nunca|nao|won t|will not|do not|don t)( \w+){0,6} (bank|card|account) (details|number|information)|\b(never|nunca|nao)( \w+){0,6} (datos|dados) (bancarios|de (tu|su) tarjeta|do (seu )?cartao)|\b(jamais|nooit)( \w+){0,6} (coordonnees bancaires|donnees bancaires|numero de carte|bankgegevens|rekeningnummer)|\b(niemals|nie)( \w+){0,6} (bankdaten|kontodaten|kreditkartendaten|kartendaten)|\b(aldrig|aldri|aldrei)( \w+){0,6} (kortoplysninger|kortinformasjon|kortuppgifter|kontonummer|kortnummer|kortanumer)|(^| )(ніколи|никогда|никога|ποτε|asla)( [^ ]+){0,6} (дані картки|данные карты|данни на картата|στοιχεια τησ καρτασ|kart bilgi)|\b(nikad|nikada|nikoli|nikdy)( \w+){0,6} (podatke kartice|udaje karty|podatke o kartici|pin ni cvv|cvv)|\b(niti|ne) trazi( \w+){0,3} podatke kartice|\b(mai|nigdy|niciodata)( \w+){0,6} (dati bancari|dati della carta|dati di pagamento|bonifici|danych karty|numeru karty|datele cardului|datele bancare)/g;
const NO_PAYMENT = /nada que pagar|nothing to pay|no (payment|fee|charge)s? (is |are )?(needed|required|due)|nao (precisa|e preciso|tem que) pagar|sin (costo|cargo)( alguno)?|free of charge|you don t need to pay|no hace falta pagar|rien a payer|aucun (frais|paiement)|niets (te )?betalen|geen kosten|nichts zu (be)?zahlen|keine (zusatzlichen )?(kosten|gebuhren)|keine (zahlung|bezahlung|nachzahlung) (erforderlich|notwendig|notig|fallig)|aucun (frais|paiement) (n est )?(requis|necessaire|a payer)|geen betaling (nodig|vereist)|no payment (is )?(needed|required)|nulla da pagare|niente da pagare|nessun (costo|pagamento)|nic do zaplaty|bez (dodatkowych )?oplat|nie musisz nic placic|нічого (не )?(потрібно |треба )?(платити|сплачувати)|оплата не (потрібна|требуется)|ничего платить не нужно|не е необходимо плащане|нищо за плащане|δεν (χρειαζεται|απαιτειται) (καμια )?πληρωμη|καμια χρεωση|odeme gerekmez|odeme yapmaniza gerek yok|inget att betala|platba nie je potrebna|moketi nieko nereikia|nem kell fizetnie|ki van fizetve|placanje je pouzecem|no solicita( [^ ]+){0,3} datos bancarios|la transferencia que (estas|esta) haciendo|no necesitamos ningun dato|(he?ch|h[əe]c) bir od[əe]nis t[əe]l[əe]b olunmur|լրացուցիչ վճար չի պահանջվում|нема износ за плакање|nuk ka asnje pagese|nuk kerkohet (asnje )?pagese|pouzecem pri preuzimanju|(plati|uhradite|zaplatite|placa|zaplati) pri (prevzati|prevzeti)|na (dobierku|dobirku)|placilo po povzetju|zasielka je uhradena|platba neni potreba|zasilka je zaplacena|ekkert ad greida|ingen (avgift|kostnad)|(modtaget|mottatt|mottagit|ontvangen) (din |uw |je )?betaling|betalingen er (modtaget|mottatt)|betaling ontvangen|intet at betale|ingenting a betale|ingen betaling|nimic de plata|nu aveti nimic de platit|nimic de achitat|plata a fost (facuta|efectuata)|(already|has been) paid|fara (taxe|costuri)/;

// "Ce SMS ne contient pas de lien", "this message contains no link": the message says there is no link.
const NO_LINK = /(ne contient|ne contiennent|ne comporte) (aucun|pas de) lien|sans (aucun )?lien|contains? no links?|(does not|doesn t|will never|never) (contain|include|send)( \w+){0,2} links?|no (contiene|incluye) (ningun|enlaces?)|nunca (te )?(enviamos|enviaremos|mandamos) (un |ningun )?enlace|bevat geen link|nooit een link|nao (contem|tem) (nenhum )?link|nunca envia(mos)? links?|enthalt keinen link|keine links?|vi skickar aldrig lankar|ne vsebuje povezav|nesuta saites|me ei saada( [^ ]+){0,3} linke|nesiuncia nuorodu|nem tartalmaz (hivatkozast|linket)|nem kuldunk( [^ ]+){0,2} linket|ne sadrzi poveznic|no (envia|enviamos|envian) enlaces|ne salje poveznic|neobsahuje odkaz|sender aldrig links|sender aldri lenker|sender (vi )?ikke lenker|sender (vi )?ikke links|emme laheta( [^ ]+){0,3} linkkeja|не містить посилань|не содержит ссылок|не съдържа линк|δεν περιεχει (κανεναν )?συνδεσμ|(link|baglanti) icermez|non contiene (alcun )?link|nie zawiera (zadnych )?link|nu contine (niciun )?link/;

const withoutNegatedMoney = (t, signs = SIGNS) => { const rest = t.replace(NEGATED_MONEY, ' '); return rest !== t && !signs.money_request.test(rest); };

// A bill's fixed due date ("vence el 25", "vence segun su NIT") is not pressure; urgency stays if anything else in the message is.
const DUE_DATE = /vencen? (el (dia )?[0-9]+|segun)/;
const DUE_DATE_ALL = /vencen? (el (dia )?[0-9]+|segun)/g;

// A text that only delivers a code ("Your verification code is: 730968", "Codice di sicurezza 123456 per...") asks for
// nothing; it is a code request only when it also asks you to pass the code on.
const CODE_DELIVERY = /(code|codigo|codice|code de verification|kod|kodu|codul|kodas|koodi|kods|codigo de verificacao)( [a-z]+){0,3}( is| es| e| ist| est| ir| on)?:? [0-9]{4,8}( |$)/;
// A bank alert that sends you to the number on the back of your card (and carries no link) mentions an amount to
// check, not one to pay.
const BACK_OF_CARD = /(number|numero) (on|at) the back of (your|the) card|numero (al|en el|que aparece al|del) reverso de (tu|su|la) tarjeta|numero (no|do) verso do (seu )?cartao|numero au dos de (votre|la) carte|nummer auf der ruckseite (ihrer|der) karte|numero sul retro della (sua |tua )?carta/;
const HAS_LINK = /\[(link|enlace|lien|lenke|linke|linkki|nuoroda|saite|link)\]|https?:|www\./;

// A remote session the person arranged themselves (a colleague, a planned IT visit) is not a stranger's remote access.
const AGREED_SESSION = /kako smo (se )?dogovorili|као што смо се договорили|kako smo se dogovorili/;

/** The sign ids that apply, after context rules (genuine-code warnings, login instructions, "nothing to pay"). */
function applyContext(t, ids, signs = SIGNS) {
  let out = ids;
  if (out.includes('asks_for_code')) {
    const handover = CODE_HANDOVER.test(withoutNegations(t));
    if (!handover && (CODE_WARNING.test(t) || LOGIN_WITH.test(t) || CODE_DELIVERY.test(t))) out = out.filter((id) => id !== 'asks_for_code');
  }
  if (out.includes('urgency') && DUE_DATE.test(t) && !signs.urgency.test(t.replace(DUE_DATE_ALL, ' '))) out = out.filter((id) => id !== 'urgency');
  if (out.includes('remote_access') && AGREED_SESSION.test(t)) out = out.filter((id) => id !== 'remote_access');
  if (out.includes('unknown_link') && NO_LINK.test(t)) out = out.filter((id) => id !== 'unknown_link');
  if (out.includes('money_request') && (NO_PAYMENT.test(t) || withoutNegatedMoney(t, signs) || (BACK_OF_CARD.test(t) && !out.includes('unknown_link')))) out = out.filter((id) => id !== 'money_request');
  return out;
}

/** normalize(text) plus, for each of its characters, the index of the original character it came from. */
export function normalizeWithMap(text) {
  const src = String(text ?? '');
  let out = '';
  const map = [];
  for (let i = 0; i < src.length; i++) {
    // Keep thousands separators inside numbers ("$1,480", "$50.000") so evidence quotes the whole amount.
    if ((src[i] === ',' || src[i] === '.') && /\d/.test(src[i - 1] ?? '') && /\d/.test(src[i + 1] ?? '')) continue;
    const c = foldChar(src[i]);
    for (const ch of c) {
      const ws = /\s/.test(ch);
      if (ws && (out === '' || out.endsWith(' '))) continue;
      out += ws ? ' ' : ch;
      map.push(i);
    }
  }
  if (out.endsWith(' ')) { out = out.slice(0, -1); map.pop(); }
  return { text: out, map };
}

/** Signal ids found in the text, in SIGNS order. `langs`: the check's languages (see compileSigns). */
export function readSigns(text, langs) {
  const t = normalize(text);
  const signs = compileSigns(langs);
  return applyContext(t, Object.keys(signs).filter((k) => signs[k].test(t)), signs);
}

/** Like readSigns, with the words that triggered each sign (from the original text, up to 60 characters). */
export function readSignsWithEvidence(text, langs) {
  const { text: t, map } = normalizeWithMap(text);
  const src = String(text ?? '');
  const signs = compileSigns(langs);
  const out = [];
  for (const [id, re] of Object.entries(signs)) {
    const m = re.exec(t);
    if (!m) continue;
    // widen to whole words around the match
    let a = m.index, b = m.index + m[0].length;
    while (a > 0 && t[a - 1] !== ' ') a--;
    while (b < t.length && t[b] !== ' ') b++;
    const from = map[a], to = map[b - 1] + 1;
    out.push({ id, evidence: src.slice(from, to).slice(0, 60) });
  }
  const keep = applyContext(t, out.map((s) => s.id), signs);
  return out.filter((s) => keep.includes(s.id));
}

// A warning *about* a scam (a forwarded alert: "they call you from a fake courier to ask for your WhatsApp code,
// warn your family") uses the scam's own words but asks the reader for nothing. It asks you to warn others, or
// describes what scammers do in the third person next to a word of caution. It is not a warning when it also makes a
// request of its own: a link, a handover of a code, "stay on the line" or "don't tell anyone" (fake bank calls often
// open with "scammers are impersonating us, so move your money").
const WARN_OTHERS = /\b(avisen|avisales|adviertan|difundan|compartan|pasalo|reenvienlo|warn (your|others|everyone|friends|family|the elderly)|pass (this|it) on|share this|avisem|compartilhem|repassem|faites passer|partagez|prevenez|warnen sie|weitersagen|waarschuw|deel dit|avvisate|condividete|ostrzezcie|udostepnijcie)\b/;
const DESCRIBES = /\b(te|los|nos|les|lo|la) (llaman|escriben|mandan|piden|van a pedir|contactan)\b|estan llamando|se hacen pasar|they (call|text|message|ask|pretend|will ask)|scammers (are|will|call|pretend)|\b(estafadores|golpistas|delincuentes)\b|se fazem passar|ligam para|ils (appellent|se font passer)|\bescrocs\b|\bbetruger\b|\boplichters\b|\btruffatori\b|\boszusci\b|\bescroci\b/;
// An official warning post says outright that the message is a fraud, or what the sender never sends. It can mention
// "link" or "transfer" as things not to trust; it is still a warning when it carries no link of its own.
const STRONG_WARNING = /\b(es un fraude|es una estafa|it ?s a scam|this is a scam|est une arnaque|c est une arnaque|e una truffa|ist betrug|e golpe|e fraude|dejalo en visto)\b|\b(no|nunca) (enviamos|solicitamos|pedimos)( [a-z]+){0,4} (correos|mensajes|sms|emails?)\b|\bwe (will )?never (send|ask|text|email)\b/;
const CAUTION = /tengan cuidado|\bcuidado\b|\bojo\b|atencion|\balerta\b|be careful|beware|watch out|\bvorsicht\b|let op|attenzione|\buwaga\b|\bmefiez\b|\bprudence\b/;

/** True when the text reads as a warning about a scam rather than as the scam itself. */
export function isWarningAbout(text, ids = readSigns(text)) {
  const t = normalize(text);
  if (STRONG_WARNING.test(t) && !HAS_LINK.test(String(text ?? '').toLowerCase()) && !CODE_HANDOVER.test(withoutNegations(t))) return true;
  if (ids.some((id) => ['unknown_link', 'keep_on_line', 'secrecy'].includes(id))) return false;
  if (CODE_HANDOVER.test(withoutNegations(t))) return false;
  return WARN_OTHERS.test(t) || (DESCRIBES.test(t) && CAUTION.test(t));
}
