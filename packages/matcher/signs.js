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
  urgency: String.raw`aujourd hui|immediatement|sous 24|sans delai|dernier (avis|rappel)|au plus vite|vandaag|onmiddellijk|binnen 24|met spoed|zo snel mogelijk|laatste (herinnering|aanmaning|kans)|geblokkeerd|verloopt`,
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
  urgency: String.raw`\boggi\b|\bsubito\b|immediatamente|entro 24|ultimo avviso|bloccat|sospes|\bdzis\b|dzisiaj|natychmiast|\bpilne\b|w ciagu 24|ostatnie wezwanie|zablokowan|zawieszon|odciecie|\bazi\b|imediat|in 24 de ore|ultima (notificare|somatie|sansa)|\bblocat|suspendat`,
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
  asks_for_code: String.raw`legitimera dig|(signera|signerar|godkann|godkand)( [^ ]+){0,4} (bankid|mitid)|signering i (ditt )?bankid|(godkend|godkender|bekraeft)( [^ ]+){0,3} (i )?mitid|(signer|godkjenn)( [^ ]+){0,3} (i )?bankid|(las upp|uppge|ge mig|oplys|giv mig|les opp|oppgi|gi meg)( [^ ]+){0,3} (koden|engangskoden|sakerhetskoden|sikkerhedskoden|kode)`,
  remote_access: String.raw`(ladda ner|installera|download|installer|last ned)( [^ ]+){0,3} (appen|programmet|app)|fjarrstyrning|fjernadgang|fjernstyring|dela (din )?skarm`,
  urgency: String.raw`(^| )(idag|i dag|i dag)( |$)|inom (24|48|72) timmar|inom (fem|tre) dagar|omgaende|meddela snabbt|med en gang|(^| )straks( |$)|umiddelbart|hurtigst muligt|innen (24|48|72) timer|inden for (24|48) timer`,
  money_request: String.raw`(^| )swisha|swisha (till|mig)|betala (hyran|avgiften|in)|uppdatera betalningen|tullavgift|serviceavgift|(^| )deposition|kortuppgifter|overfor (pengar|penge)|overfore|mobilepay|(^| )vipps|(^| )betal (gebyr|told|nu)|(^| )gebyr|kortoplysninger|kortinformasjon|depositum|tollavgift|indbetal|aktivera utbetalning|pengarna vantar|pengene venter|(modtag|motta) (betalingen|pengene)`,
  unknown_link: String.raw`(^| )(lank|lanken|linket|lenken|lenke)( |$)|via den har lanken|klicka (har|pa)|(^| )klik (her|pa)|trykk (her|pa)`,
  new_number: String.raw`(^| )(nytt|nyt) (nummer|telefonnummer)|telefonen (hamnade|ramlade|gick sonder|ar trasig|gik i stykker|er odelagt|er knust)|mobilen (ar trasig|er odelagt|er knust)|(spara|gem|lagre) (detta|dette|mitt|mit) (nya |nye )?nummer`,
  impersonation: String.raw`bedrageriavdelning|sakerhetsavdelning|kortcentral|polismyndigheten|(^| )polisen|(^| )politiet|skatteverket|kronofogden|postnord|skattestyrelsen|skatteetaten|svindelafdeling|sikkerhedsafdeling|svindelavdeling|sikkerhetsavdeling|civilkladd kollega`,
  secrecy: String.raw`(prata|pratar) inte med (nagon|nan)|berattar? inte (for|om) (nagon|det)|inte ens med banken|sig det ikke til nogen|ikke engang (til|med) banken|ikke fortell (det )?til noen|ikke engang med banken`,
  keep_on_line: String.raw`lagg inte pa|lag inte pa|laeg ikke pa|ikke laeg pa|ikke legg pa|bliv i telefonen|stanna kvar i (telefonen|samtalet)|bli i telefonen`,
  too_good_to_be_true: String.raw`(^| )tjanade|(^| )tjente|garanterad avkastning|garanteret afkast|garantert avkastning|du har (vunnit|vundet|vunnet)|hemligheten som bankerna|per (uppgift|opgave|oppgave)|betalt samma dag|betalt samme dag`,
};
export const SIGNS = {
  asks_for_code: new RegExp(String.raw`\bcodigo|\bclave|\bpin\b|\btoken\b|contrasena|` + EN.code + '|' + FR_NL.asks_for_code + '|' + DE.asks_for_code + '|' + IT_PL_RO.asks_for_code + '|' + CY_EL_TR.asks_for_code + '|' + SCAND.asks_for_code),
  remote_access: new RegExp(String.raw`instal(a|e|ar|o|en|ame|ate)\b|descarg|anydesk|teamviewer|supremo|baj(a|e|ar|o) (esta|la|una|el|este) (app|aplicacion)|ver (tu|su|mi) pantalla|selfie|foto (de|del) (tu |su )?dni|` + EN.remote + '|' + FR_NL.remote_access + '|' + DE.remote_access + '|' + IT_PL_RO.remote_access + '|' + CY_EL_TR.remote_access + '|' + SCAND.remote_access),
  urgency: new RegExp(String.raw`urgent|\bhoy\b|vence|vencimiento|bloque|suspend|inmediat|ahora mismo|\b24 ?(h|hs|horas|hours)\b|ultimo aviso|rapido|\btoday\b|immediately|right (now|away)|expir|account (is |will be |has been )?locked|final (notice|warning)|last chance|\basap\b|\bhoje\b|imediatamente|` + FR_NL.urgency + '|' + DE.urgency + '|' + IT_PL_RO.urgency + '|' + CY_EL_TR.urgency + '|' + SCAND.urgency),
  money_request: new RegExp(String.raw`transfer|\bplata\b|dinero|\bpag(a|ar|ue|ues|a)\b|abon|\bsena\b|\bcbu\b|\bcvu\b|\balias\b|\$|€|£|deposit|prestamo|cajero|devolv|(datos|numero) de (tu|la|su) tarjeta|` + EN.money + '|' + FR_NL.money_request + '|' + DE.money_request + '|' + IT_PL_RO.money_request + '|' + CY_EL_TR.money_request + '|' + SCAND.money_request),
  unknown_link: new RegExp(String.raw`enlace|\blink\b|http|www|desconocid|click (here|the|this|below)|` + FR_NL.unknown_link + '|' + DE.unknown_link + '|' + IT_PL_RO.unknown_link + '|' + CY_EL_TR.unknown_link + '|' + SCAND.unknown_link),
  new_number: new RegExp(String.raw`troquei de numero|numero novo|novo numero|salva (esse|este|meu) numero|numero nuevo|nuevo numero|cambie de numero|agendalo|agenda este|agendame|numero alternativo|se me (cayo|rompio|mojo) el (cel|celu|celular|telefono)|new number|changed my number|save (this|my) number|mudei de numero|guarda (este|esse|o meu) numero|telemovel (caiu|partiu|avariou|estragou)|` + FR_NL.new_number + '|' + DE.new_number + '|' + IT_PL_RO.new_number + '|' + CY_EL_TR.new_number + '|' + SCAND.new_number),
  impersonation: new RegExp(String.raw`le hablo de|te hablo de|somos de|\bpami\b|\banses\b|\barca\b|\bafip\b|\bbanco\b|correo argentino|mercado pago|soporte tecnico|area de seguridad|(calling|call|message) from (your|the) bank|your bank s|bank s (fraud|security)|tech(nical)? support|fraud (team|department)|security (team|department)|calling from|post office|customs (office|fee)|tax (office|agency)|from the (irs|hmrc|ato|cra)|royal mail|\busps\b|\bctt\b|financas|autoridade tributaria|seguranca social|seg social|an post|\brevenue\b|\bgarda\b|\bbov\b|maltapost|\bmtca\b|` + FR_NL.impersonation + '|' + DE.impersonation + '|' + IT_PL_RO.impersonation + '|' + CY_EL_TR.impersonation + '|' + SCAND.impersonation),
  secrecy: new RegExp(String.raw`nao (conta|fala|diga|conte|fale) (pra|para|a) ninguem|no le digas|no se lo digas|no le cuentes|entre nosotros|que no se entere|don ?t tell (anyone|anybody|your)|do not tell (anyone|anybody|your)|between (us|you and me)|keep (this|it) (secret|quiet)|` + FR_NL.secrecy + '|' + DE.secrecy + '|' + IT_PL_RO.secrecy + '|' + CY_EL_TR.secrecy + '|' + SCAND.secrecy),
  keep_on_line: new RegExp(String.raw`nao (desligue|desliga)|fique na linha|no corte|no cortes|quedese en linea|no cuelgue|don ?t hang up|do not hang up|stay on the (line|phone)|` + FR_NL.keep_on_line + '|' + DE.keep_on_line + '|' + IT_PL_RO.keep_on_line + '|' + CY_EL_TR.keep_on_line + '|' + SCAND.keep_on_line),
  too_good_to_be_true: new RegExp(String.raw`ganaste|ganador|premio|sorteo|gratis|rendimiento|ganancia|duplic|congratulations,? you|you (ve |have )?won|winner|\bprize|lottery|guaranteed (return|profit|income|earning)|double your|` + FR_NL.too_good_to_be_true + '|' + DE.too_good_to_be_true + '|' + IT_PL_RO.too_good_to_be_true + '|' + CY_EL_TR.too_good_to_be_true + '|' + SCAND.too_good_to_be_true),
};

// A genuine one-time-code text warns you not to share the code ("no lo compartas", "never share", "we will never ask").
// That warning cancels asks_for_code unless the message also asks you to hand the code over.
const CODE_WARNING = /no (lo|la|los|las) compartas|no compartas|nunca (te|le|se) (lo|la) (va a |vamos a |van a )?(pedir|pedira|solicit)|nunca te (pedira|pediremos|solicitara)|nao (compartilhe|partilhe|passe|informe|divulgue)|nunca (pede|solicita|pedimos)|(don t|do not|never) share|will never (call|text|ask|message)|never ask(s)? (you )?for|nunca (te |le )?(vamos a |va a |van a )?(pedir|pediremos|pedira|solicitaremos)|nao pedimos|nunca pedimos|nor (lo|la) (compartas|des)|ne (le |la )?(communiquez|partagez|transmettez|donnez)( le| la)? (jamais|a personne)|ne (vous )?(le )?demander(a|ons|ont) jamais|ne demandons jamais|deel (deze|de|die) code (nooit|met niemand)|nooit (doorgeven|delen)|(vragen|vraagt) (u|je) nooit|zullen (u|je) nooit (vragen|bellen)|(geben|teilen) sie (diesen |den |ihren )?(code|tan)( \w+){0,2} (niemals|nie|an niemanden|mit niemandem)|niemals weiter|nie weitergeben|werden sie (niemals|nie) (nach|anrufen|fragen)|fragen (sie )?(niemals|nie) nach|wir fragen nie|non (condividere|comunicare|fornire)( a nessuno)? (questo |il )?codice|non chiediamo mai|non (ti|le|vi) chiederemo mai|nie (udostepniaj|podawaj|przekazuj) (nikomu )?(tego )?kodu|nikomu nie podawaj|nigdy nie (prosimy|poprosimy|dzwonimy)|nu (comunicati|comunica|divulgati|divulga) (nimanui|acest cod|codul)|nu va vom cere niciodata|niciodata nu (va )?(cerem|solicitam)|нікому не (повідомляите|кажіть|передаваите)( [^ ]+){0,2} код|никому не (сообщаите|говорите|передаваите)( [^ ]+){0,2} код|не (го )?споделяите( [^ ]+){0,2} с никого|никога не (искаме|изискваме)|ніколи не (просимо|запитуємо|телефонуємо|дзвонимо)|никогда не (просим|запрашиваем|звоним)|никога не (звъним|се обаждаме)|μην (τον )?(γνωστοποιησετε|δωσετε|κοινοποιησετε)( [^ ]+){0,3} κανεναν|δεν (σασ )?ζηταμε ποτε|ποτε δεν ζηταμε|kimseyle paylasmayin|lamna aldrig ut|dela aldrig (koden|din kod)|vi (ringer|kommer) aldrig|aldrig (att )?be (om|dig)|(del|giv) aldrig (koden|din kode)|vi ringer aldrig|vi beder aldrig|(del|gi) aldri (koden|din kode)|vi ringer aldri|vi spor aldri|pin( [^ ]+){0,4} (στην εφαρμογη|μεσω τησ εφαρμογησ|ξεχωριστα)|pin( [^ ]+){0,4} (у застосунку|в застосунку|в приложении|в приложението)|pin( [^ ]+){0,4} uygulama|sifre(nizi|nizi)?( [^ ]+){0,6} kendiniz (olustur|belirle)|kimseyle paylasma|kimseye (vermeyin|soylemeyin)|asla (istemeyiz|talep etmeyiz)|(separaten|eigenen|gesonderten) brief|\bpin(ul)?( \w+){0,3} (in|din) aplicati|\bpin( \w+){0,3} in (the|your) app\b|\bpin( \w+){0,3} w aplikacji|\bpin( \w+){0,3} (nell|in der) app|separately by (post|mail)|par courrier separe|apart per post|por correo (aparte|separado)/;
const CODE_HANDOVER = new RegExp(String.raw`(pasa|manda|envia|dicta|deci|reenvia|da|comparti)(me|nos)\b( \w+){0,3} (el |la |ese |esa )?(codigo|clave|pin)|me (pasas|mandas|envias|dictas|decis|das|reenvias|compartis) (el |la |ese |esa )?(codigo|clave|pin)|(me |nos )?(manda|passa|envia|informa)( \w+){0,2} (o |esse |este )?codigo|(send|read|tell|give|forward|text)( \w+){0,4} (code|passcode|password|pin)\b|\b(code|passcode|pin) (we|i|they) (sent|texted)|(donnez|communiquez|transmettez|envoyez|dictez|lisez|donne|envoie|transmets)( \w+){0,3} (le |ce |votre |ton )?code|(geef|stuur|lees)( \w+){0,3} (de |die |deze |je |uw )?(code|pincode)|(code|pincode) (doorgeven|doorsturen|voorlezen)|(geben|nennen|schicken|senden|lesen) sie( \w+){0,3} (mir |uns )?(den |diesen |ihren )?(code|tan)\b(?! (niemals|nie|an niemanden|keinesfalls|mit niemandem))|(gib|schick|nenn|sag) mir( \w+){0,3} (den |diesen )?code|(скажіть|назвіть|продиктуите|надішліть|скажите|назовите|пришлите|кажете|продиктуваите|изпратете)( [^ ]+){0,3} (код|пароль|парола)|(πειτε|στειλτε|δωστε|διαβαστε|υπαγορευστε)( [^ ]+){0,3} κωδικο|kodu(nu)? (bana )?(soyle|soyleyin|ilet|iletin|gonder|gonderin|oku|okuyun)`);

// Words that cancel the code warning's exception: a request is still a request when it sits next to "don't share".
// Negated clauses ("we'll never ask you to tell us your PIN") are removed before looking for a handover request.
const NEGATED = /\b(never|nunca|nao|no|don t|do not|won t|will not|jamais|nooit|niet|niemals|nie|nicht|mai|non|nigdy|niciodata|nu)( \w+){0,7} (code|codes|pin|password|passcode|clave|claves|codigo|codigos|contrasena|senha|passe|wachtwoord|pincode|tan|passwort|codice|kodu|kod|hasla|haslo|codul|parola)\b/g;
// The same for Cyrillic, Greek and Turkish, with spaces as boundaries.
const NEGATED_X = /(^| )(ніколи|никогда|никога|не|ποτε|μην|δεν|asla)( [^ ]+){0,7} (код|коду|кода|пароль|парола|κωδικο|κωδικουσ|kod|kodu|sifre)( |$)/g;
const withoutNegations = (t) => t.replace(NEGATED, ' ').replace(NEGATED_X, ' ');
// "Ingresá con tu clave fiscal", "sign in with your password": where to log in, not a request to hand it over.
const LOGIN_WITH = /\b(ingresa|ingresando|entra|entrando|accede|accediendo|inicia sesion|inicie sesion|log in|login|sign in|acesse|entre)( \w+){0,4} (con|with|com|using|usando) (tu|su|your|sua|seu) (clave|contrasena|password|senha|usuario)|\b(connectez vous|connecte toi|identifiez vous)( \w+){0,4} (avec|a l aide de) (votre|ton) (mot de passe|identifiant)|\b(inloggen|log in|login)( \w+){0,4} met (uw|je|jouw) (digid|wachtwoord|itsme)|logga in sjalv|log selv ind|logg inn selv|\b(melden sie sich|loggen sie sich|einloggen|anmelden)( \w+){0,4} mit (ihrem|deinem|ihren) (passwort|zugangsdaten|id austria)|\b(accedi|accedere|entra)( \w+){0,4} con (il tuo|le tue|lo|la tua) (spid|password|credenziali|cie)|\b(zaloguj sie|zalogowac sie)( \w+){0,4} (przez|w|do) (aplikacj|mobywatel|profil zaufany|bankowosc)|\b(autentificati va|autentifica te|conectati va|intrati)( \w+){0,4} (in|cu) (spv|contul|parola|aplicatia)/;
// "No tenés nada que pagar", "nothing to pay": the message says there is no payment.
// "We will never ask for your bank details": a warning, not a request. The negated clause is removed and the money
// sign is read again on what is left, so "never ask for bank details, but pay the fee here" still counts.
const NEGATED_MONEY = /\b(never|nunca|nao|won t|will not|do not|don t)( \w+){0,6} (bank|card|account) (details|number|information)|\b(never|nunca|nao)( \w+){0,6} (datos|dados) (bancarios|de (tu|su) tarjeta|do (seu )?cartao)|\b(jamais|nooit)( \w+){0,6} (coordonnees bancaires|donnees bancaires|numero de carte|bankgegevens|rekeningnummer)|\b(niemals|nie)( \w+){0,6} (bankdaten|kontodaten|kreditkartendaten|kartendaten)|(^| )(ніколи|никогда|никога|ποτε|asla)( [^ ]+){0,6} (дані картки|данные карты|данни на картата|στοιχεια τησ καρτασ|kart bilgi)|\b(mai|nigdy|niciodata)( \w+){0,6} (dati bancari|dati della carta|dati di pagamento|bonifici|danych karty|numeru karty|datele cardului|datele bancare)/g;
const NO_PAYMENT = /nada que pagar|nothing to pay|no (payment|fee|charge)s? (is |are )?(needed|required|due)|nao (precisa|e preciso|tem que) pagar|sin (costo|cargo)( alguno)?|free of charge|you don t need to pay|no hace falta pagar|rien a payer|aucun (frais|paiement)|niets (te )?betalen|geen kosten|nichts zu (be)?zahlen|keine (zusatzlichen )?(kosten|gebuhren)|keine (zahlung|bezahlung|nachzahlung) (erforderlich|notwendig|notig|fallig)|aucun (frais|paiement) (n est )?(requis|necessaire|a payer)|geen betaling (nodig|vereist)|no payment (is )?(needed|required)|nulla da pagare|niente da pagare|nessun (costo|pagamento)|nic do zaplaty|bez (dodatkowych )?oplat|nie musisz nic placic|нічого (не )?(потрібно |треба )?(платити|сплачувати)|оплата не (потрібна|требуется)|ничего платить не нужно|не е необходимо плащане|нищо за плащане|δεν (χρειαζεται|απαιτειται) (καμια )?πληρωμη|καμια χρεωση|odeme gerekmez|odeme yapmaniza gerek yok|inget att betala|ingen (avgift|kostnad)|intet at betale|ingenting a betale|ingen betaling|nimic de plata|nu aveti nimic de platit|nimic de achitat|plata a fost (facuta|efectuata)|(already|has been) paid|fara (taxe|costuri)/;

// "Ce SMS ne contient pas de lien", "this message contains no link": the message says there is no link.
const NO_LINK = /(ne contient|ne contiennent|ne comporte) (aucun|pas de) lien|sans (aucun )?lien|contains? no links?|(does not|doesn t|will never|never) (contain|include|send)( \w+){0,2} links?|no (contiene|incluye) (ningun|enlaces?)|nunca (te )?(enviamos|enviaremos|mandamos) (un |ningun )?enlace|bevat geen link|nooit een link|nao (contem|tem) (nenhum )?link|nunca envia(mos)? links?|enthalt keinen link|keine links?|vi skickar aldrig lankar|sender aldrig links|sender aldri lenker|не містить посилань|не содержит ссылок|не съдържа линк|δεν περιεχει (κανεναν )?συνδεσμ|(link|baglanti) icermez|non contiene (alcun )?link|nie zawiera (zadnych )?link|nu contine (niciun )?link/;

const withoutNegatedMoney = (t) => { const rest = t.replace(NEGATED_MONEY, ' '); return rest !== t && !SIGNS.money_request.test(rest); };

/** The sign ids that apply, after context rules (genuine-code warnings, login instructions, "nothing to pay"). */
function applyContext(t, ids) {
  let out = ids;
  if (out.includes('asks_for_code')) {
    const handover = CODE_HANDOVER.test(withoutNegations(t));
    if (!handover && (CODE_WARNING.test(t) || LOGIN_WITH.test(t))) out = out.filter((id) => id !== 'asks_for_code');
  }
  if (out.includes('unknown_link') && NO_LINK.test(t)) out = out.filter((id) => id !== 'unknown_link');
  if (out.includes('money_request') && (NO_PAYMENT.test(t) || withoutNegatedMoney(t))) out = out.filter((id) => id !== 'money_request');
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

/** Signal ids found in the text, in SIGNS order. */
export function readSigns(text) {
  const t = normalize(text);
  return applyContext(t, Object.keys(SIGNS).filter((k) => SIGNS[k].test(t)));
}

/** Like readSigns, with the words that triggered each sign (from the original text, up to 60 characters). */
export function readSignsWithEvidence(text) {
  const { text: t, map } = normalizeWithMap(text);
  const src = String(text ?? '');
  const out = [];
  for (const [id, re] of Object.entries(SIGNS)) {
    const m = re.exec(t);
    if (!m) continue;
    // widen to whole words around the match
    let a = m.index, b = m.index + m[0].length;
    while (a > 0 && t[a - 1] !== ' ') a--;
    while (b < t.length && t[b] !== ' ') b++;
    const from = map[a], to = map[b - 1] + 1;
    out.push({ id, evidence: src.slice(from, to).slice(0, 60) });
  }
  const keep = applyContext(t, out.map((s) => s.id));
  return out.filter((s) => keep.includes(s.id));
}

// A warning *about* a scam (a forwarded alert: "they call you from a fake courier to ask for your WhatsApp code,
// warn your family") uses the scam's own words but asks the reader for nothing. It asks you to warn others, or
// describes what scammers do in the third person next to a word of caution. It is not a warning when it also makes a
// request of its own: a link, a handover of a code, "stay on the line" or "don't tell anyone" (fake bank calls often
// open with "scammers are impersonating us, so move your money").
const WARN_OTHERS = /\b(avisen|avisales|adviertan|difundan|compartan|pasalo|reenvienlo|warn (your|others|everyone|friends|family|the elderly)|pass (this|it) on|share this|avisem|compartilhem|repassem|faites passer|partagez|prevenez|warnen sie|weitersagen|waarschuw|deel dit|avvisate|condividete|ostrzezcie|udostepnijcie)\b/;
const DESCRIBES = /\b(te|los|nos|les|lo|la) (llaman|escriben|mandan|piden|van a pedir|contactan)\b|estan llamando|se hacen pasar|they (call|text|message|ask|pretend|will ask)|scammers (are|will|call|pretend)|\b(estafadores|golpistas|delincuentes)\b|se fazem passar|ligam para|ils (appellent|se font passer)|\bescrocs\b|\bbetruger\b|\boplichters\b|\btruffatori\b|\boszusci\b|\bescroci\b/;
const CAUTION = /tengan cuidado|\bcuidado\b|\bojo\b|atencion|\balerta\b|be careful|beware|watch out|\bvorsicht\b|let op|attenzione|\buwaga\b|\bmefiez\b|\bprudence\b/;

/** True when the text reads as a warning about a scam rather than as the scam itself. */
export function isWarningAbout(text) {
  const t = normalize(text);
  const ids = readSigns(text);
  if (ids.some((id) => ['unknown_link', 'keep_on_line', 'secrecy'].includes(id))) return false;
  if (CODE_HANDOVER.test(withoutNegations(t))) return false;
  return WARN_OTHERS.test(t) || (DESCRIBES.test(t) && CAUTION.test(t));
}
