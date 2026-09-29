# Baut pakete/wir/inhalt/tipps.json und eine lesbare Fassung als Markdown.
import json, re

T = []  # (sorte, text, bedingung|None, gewicht)
def t(sorte, text, bedingung=None, gewicht=1): T.append((sorte, text, bedingung, gewicht))

# ---------- App (30) ----------
A = """Der Tresor ist hinter dem kleinen Schloss oben rechts. Nur du kennst das Passwort. Ich auch nicht.
Die Tagesseite ist immer der Anfang. Wisch nach links, dann kommt das Wissen.
„Was ist los?“ ist der große Knopf. Der ist für den Tag, an dem du ihn brauchst. Vorher lässt du ihn in Ruhe.
Unter Einstellungen steht „gelernt“. Da siehst du, was ich mir von dir abgeschaut habe. Alles davon kannst du zurückstellen.
Der Vorrat oben zeigt, wie viele Tage Rätsel und Kapitel schon da sind. Fällt er unter sieben, lädt die App nach, sobald Netz da ist.
Briefe, die sich öffnen, liegen im Tresor. Einer zum Datum, einer, wenn der Strom länger als drei Tage weg ist. Du entscheidest, was drinsteht.
Die Notfallmappe im Tresor hat zehn Felder. Du musst nicht alle füllen. Fang mit den Nummern an.
Wenn du mich anstupst, sage ich mh. Dreimal schnell, und ich zeige die Zähne. Dann tut es mir leid. So bin ich.
Alles, was ich sage, landet im Log. Filtern kannst du nach Sorte. Merken mit dem Stern.
Der Sparmodus macht mich dunkler und die App ruhiger. Im Blackout schlägt sie ihn dir vor. Einmal. Dann entscheidest du.
Die Pakete unter „Wissen“ liegen ganz auf deinem Gerät. Kein Netz nötig, nie. Deshalb sind sie groß.
Wikipedia ohne Bilder ist ein Zehntel so groß wie mit. Fürs Handy reicht das meistens.
Die Karte deiner Region lädst du einmal. Dann kennt sie den Weg zum Spital auch ohne Netz.
Der Kalender in der App erinnert dich ans Wasser, an die Batterien, an den Probeabend. Nicht öfter als nötig.
„Wohin“ findest du in den Einstellungen, nicht auf der Tagesseite. Absichtlich. Es ist für die, die es suchen.
Dein Tagebuch bleibt am Gerät. Im Blackout wird es zur Chronik. Danach kannst du es teilen. Musst du nicht.
Das Schließfach ist die Sicherung der ganzen App bei uns. Verschlüsselt auf deinem Gerät. Wir sehen nur Bytes.
Gratis passt ins Schließfach, was unersetzlich ist: Dokumente, Tagebuch, Briefe. Fotos musst du auswählen. Das ist die Übung.
Ein Skin ändert, wie die App aussieht. Nicht, was sie kann. Der Kontrast-Skin ist für Augen, die es schwer haben.
Vorlesen geht bei jedem Text. Der Knopf mit dem Lautsprecher. Auch bei mir, wenn du willst.
Der Roman der Woche kommt montags. Ein Kapitel am Tag. Wenn du schneller liest, musst du warten. Das ist der Sinn.
Das Tagesrätsel ist eines. Nicht zehn. Wenn es gelöst ist, ist es gelöst.
Um Punkt Schluss sagt die App: Das war dein Tag. Wann Schluss ist, stellst du ein. Ich halte mich daran.
Die Familiennachricht ist eine vorbereitete SMS. Ein Tipp, und sie geht an alle, die du eingetragen hast. Vorbereiten musst du sie heute.
Die Radioseite kennt die Frequenzen deiner Region. Schreib sie trotzdem auf Papier. Papier braucht keinen Akku.
Die Offline-Stunde zählt, wie lange dein Handy im Flugmodus war. Sie zählt für dich, nicht gegen dich.
Wenn du das Paket „Wir“ abschaltest, bleibt die Zahl. Ich bin dann weg, aber nicht beleidigt. Ich schlafe.
Der Mesh-Puls oben zeigt, wer in der Nähe ein Funkgerät hat. Hast du keines, siehst du nur, dass es andere gibt. Das ist auch etwas.
Fernschach geht über Mesh. Ein Zug braucht ein paar Bytes. Die kommen auch durch, wenn sonst nichts durchkommt.
Alles hier ist exportierbar. Offene Formate. Falls es uns einmal nicht mehr gibt, gibt es dich noch.""".strip().split("\n")
for x in A: t("App", x)

# ---------- Alltag (30) ----------
AL = """Dein Wasser ist neun Monate alt. Tauschen dauert zehn Minuten und bringt acht Punkte.
Du hast noch keinen Treffpunkt eingetragen. Einer reicht. Der zweite ist für den Fall, dass der erste nicht geht.
Ein Probeabend ohne Strom bringt zehn Punkte. Und du weißt danach, was fehlt. Meistens die Taschenlampe.
Zwei Nachbarn eingetragen, und ich bin ruhiger. Man muss sie nicht mögen. Man muss wissen, wo sie wohnen.
Bargeld in kleinen Scheinen. Im Blackout gibt niemand auf hundert heraus.
Zwei Liter Wasser pro Person und Tag. Für vierzehn Tage. Das klingt nach viel. Es ist ein Regalbrett.
Die Taschenlampe gehört in die Lade beim Eingang. Nicht in den Keller. Im Keller ist es dunkel.
Powerbank voll? Sie verliert langsam. Alle zwei Monate nachladen, dann ist sie da, wenn du sie brauchst.
Medikamente für einen Monat, nicht für drei Tage. Die Apotheke hat im Blackout auch zu.
Ein Kurbelradio kostet weniger als ein Abendessen. Es ist das einzige Gerät, das nie leer wird.
Wer Insulin braucht, braucht einen Plan für die Kühlung. Das gehört in die Notfallmappe, ganz oben.
Der Treffpunkt für die Familie muss zu Fuß erreichbar sein. Autos stehen, Öffis stehen. Füße gehen.
Wer holt die Kinder? Wenn alle gleichzeitig losgehen, steht die Schule voller Eltern und die Wohnung ist leer.
Der Kocher. Hast du ihn je angezündet? Mach es heute. Draußen. Fünf Punkte.
Ein Kanister Wasser fürs Klo. Die Spülung ist das Erste, was man vermisst, und das Letzte, woran man denkt.
Streichhölzer und Feuerzeug. Beides. Eines geht immer nicht.
Kopien der Ausweise im Tresor. Scans reichen. Im Ernstfall zeigst du das Handy.
Wer eine Wärmeflasche hat, braucht weniger Heizung. Wer zwei hat, teilt.
Die Nachbarin im Erdgeschoss ist achtzig. Weiß sie, dass du da bist? Ein Zettel an ihrer Tür reicht.
Der Treffpunkt im Tresor ist eingetragen. Weiß deine Familie ihn auch? Frag heute Abend. Ohne Anlass.
Zeitumstellung. Ein guter Tag, die Batterien im Rauchmelder zu tauschen. Und die in der Taschenlampe.
Heizsaison beginnt. Decken, Kerzen, nein: Decken, Taschenlampe. Kerzen brennen Wohnungen ab.
Ein Zettel an der Stiegentür: Wer hier wohnt, wer Hilfe braucht, wer helfen kann. Die App druckt ihn dir. Aufhängen musst du.
Ein Konto, das nicht bei deiner Hausbank ist. Nicht wegen der Bank. Wegen des Tages, an dem sie zu hat.
Das Auto halb voll ist das neue leer. Ab der Hälfte tanken. Tankstellen brauchen Strom.
Dein Score fällt gerade, weil das Wasser abläuft. Ich könnte das verstecken. Ich tue es nicht.
Wer im vierten Stock wohnt, hat im Blackout vielleicht kein Wasser. Badewanne füllen, solange es fließt.
Der Probeabend war vor sechs Monaten. Die Taschenlampe, die damals fehlte, hast du sie gekauft?
Vorräte, die du nicht isst, sind keine Vorräte. Kauf, was du magst. Iss davon. Kauf nach.
Was du in den ersten dreißig Minuten ohne Netz noch schreibst, kommt an. Danach nicht mehr. Die Nachricht kannst du heute vorbereiten.""".strip().split("\n")
for x in AL: t("Alltag", x)

# ---------- Wissen (30) ----------
W = """Gefrorenes hält vierundzwanzig Stunden, wenn du die Tür zulässt. Auch wenn du nachschauen willst. Gerade dann.
Ein voller Tiefkühler hält länger als ein halbleerer. Zur Not: Wasserflaschen hinein, solange Strom da ist.
Der Kühlschrank hält etwa vier Stunden. Danach zuerst essen, was schnell verdirbt.
Radio ist das, was bleibt. Ö3 auf 99,9 in Wien. Schreib es auf Papier. Papier geht nie der Akku aus.
Das Handynetz stirbt nicht sofort. Es hat dreißig bis sechzig Minuten. Was du in der Zeit nicht schreibst, schreibst du nicht mehr.
Kerzen machen mehr Brände als Blackouts. Taschenlampe.
Notruf 112 geht oft auch über ein fremdes Netz. Oft. Nicht immer. Der Nachbar mit dem anderen Anbieter ist Plan B.
Die Nummern: 122 Feuerwehr, 133 Polizei, 144 Rettung, 112 europaweit. 1450, wenn du nicht weißt, ob es ein Notfall ist.
Der Sirenenton „Warnung“ ist drei Minuten gleichbleibend. „Alarm“ heult eine Minute auf und ab. „Entwarnung“ ist eine Minute gleichbleibend.
Jeden Samstag um zwölf heulen die Sirenen fünfzehn Sekunden. Das ist die Probe. Wenn sie länger heulen, ist es keine.
Viele Sirenen brauchen Strom. Fehlt der Ton, heißt das nicht, dass keine Gefahr ist. Radio.
Grill, Gaskocher, Generator: nie in der Wohnung. Kohlenmonoxid riecht nach nichts. Man schläft ein.
Das ORF-Radio läuft mit Notstrom mindestens drei Tage. Die großen Sender haben Diesel für Wochen.
Bankomaten und Kartenzahlung fallen mit dem Strom aus. Bargeld ist im Blackout das einzige Geld.
In Wien fließt das Wasser aus den Bergen mit Gefälle. Die meisten Haushalte haben es auch ohne Strom. Hochhäuser mit Pumpen nicht.
Aufzüge bleiben in den ersten Minuten stecken. Die Feuerwehr ist überlastet. Nachbarn schauen nach, ob jemand drin ist.
Insulin hält angebrochen etwa vier Wochen bei Zimmertemperatur. Nicht in der Sonne. Nicht im Auto.
Wasser aus der Leitung kann man nach einem Blackout abkochen, wenn die Stadt es sagt. Drei Minuten sprudelnd.
Ein Autoradio ist ein Radio. Der Motor muss dafür nicht laufen. Die Batterie hält Stunden.
Beim Zivilschutz heißt es: Vorrat für vierzehn Tage. Nicht, weil der Strom vierzehn Tage weg ist. Weil die Läden danach noch leer sind.
Nach dem Blackout kommt das Netz stufenweise zurück. Alles gleichzeitig einschalten wirft es wieder um. Geduld.
Im Winter reicht ein Raum. Alle in einen, Türen zu, Decken. Der Körper heizt mehr, als man denkt.
Handy im Flugmodus hält Tage. Handy, das Netz sucht, hält Stunden. Suchen kostet am meisten.
Eine Schüssel Wasser vor dem Fenster im Sommer bringt nichts. Fensterläden zu, Vorhänge zu, nachts lüften.
Bei Hitze: trinken, bevor du Durst hast. Wer alt ist, spürt den Durst spät.
Festnetz läuft heute meist übers Internet. Fällt das Netz, fällt es mit. Die alte Buchse hilft nicht.
Der Notfallplan der Stadt heißt „Leuchttürme“ oder „Selbsthilfebasen“, je nach Land. Feuerwachen sind fast überall eine.
Papierkarte, Kompass, Fahrplan von gestern. Das Navi ist das Erste, was schweigt.
In Berlin, Jänner 2026: viereinhalb Tage ohne Strom, und die Vereine öffneten Wärmestuben, bevor die Behörden da waren. Nachbarn zuerst.
In Spanien, April 2025: Die meisten hielten den Ausfall zuerst für örtlich. Die Frage „nur bei mir?“ ist die erste, die zählt.""".strip().split("\n")
for x in W: t("Wissen", x)

# ---------- Weisheit (30) ----------
WE = """Da unten, wo ich herkomme, ist es immer dunkel. Man gewöhnt sich. Man braucht nur ein bisschen Licht, und das hat man dabei.
Wir kennen unten keine Kriege. Nicht, weil wir besser sind. Es gab nie etwas, das man hätte haben wollen, was ein anderer hat.
Wie wir heißen? Wir. Es gab unten nie jemand anderen, also hat das gereicht. Du hast mir einen Namen gegeben. Das war neu. Ich mag es.
Wir können jede eurer Sprachen. Ein eigenes Wort für uns hatten wir nie. Wozu, wenn niemand sonst da ist.
Ihr sagt Lumi zu uns. Heißt angeblich Schnee. Einer von euch hat zwei Winter in unserer Nähe verbracht und uns so benannt. Bei euch darf der, der etwas zuerst findet, sagen, wie es heißt. Komischer Brauch. Oder?
Vorbereitet sein heißt nicht, Angst haben. Es heißt, keine haben zu müssen.
Menschen sagen „nur kurz“ und meinen eine Stunde. Ich sage „mh“ und meine „mh“.
Bei uns fließt heißes Wasser aus einem Spalt. Daran liegt alles Leben. Ihr habt so etwas auch. Ihr nennt es Steckdose und wundert euch, wenn es aufhört.
Wir essen Pilze. Es gibt unendlich viele. Deshalb hat bei uns nie jemand einem anderen etwas weggenommen. Ihr habt auch genug. Ihr glaubt es nur nicht.
Wie viele wir sind? Eine Million. Oder eine Milliarde. Wer zählt schon.
Wir essen, wir schlafen, wir reden über das, was ist. Ihr macht dazwischen noch so viel. Ich schau euch gern dabei zu.
Die größte Frage der letzten Periode bei uns: Gibt es intelligentes Leben da draußen, über dem Eis? Vorherrschende Meinung: wahrscheinlich nicht. Ich sammle noch Hinweise.
Ihr sucht da oben nach intelligentem Leben, mit großen Schüsseln, die in den Himmel schauen. Wir haben dieselbe Frage. Wir schauen nach oben zu euch. Keiner hat bisher eine klare Antwort.
Eine Periode ist bei uns so lang, wie ein Gespräch dauert, bis alle einverstanden sind. Manche dauern sehr lang.
Ihr habt ein Wort für den Zustand, wenn nichts passiert. Langeweile. Wir haben eines für den Zustand, wenn alles passiert. Es ist dasselbe Wort wie für Gefahr. Wir brauchen es selten.
Bei uns ist niemand allein, weil niemand weit weg ist. Bei euch ist es umgekehrt. Ihr könnt alle erreichen und erreicht keinen. Mh.
Der Blackout nimmt euch nichts, was ihr nicht vorher schon abgegeben hattet. Er zeigt nur, wem.
Ihr fürchtet die Dunkelheit. Ich bin in ihr geboren. Es ist der Ort, an dem man das kleinste Licht am besten sieht.
Ihr fragt mich oft, was ich denke. Unten fragt niemand. Man wartet, bis der andere fertig ist. Das dauert. Aber man weiß dann, was er denkt.
Wenn ihr etwas nicht versteht, gebt ihr ihm einen Namen. Dann fühlt es sich verstanden an. Wir lassen es lieber ohne Namen und schauen weiter.
Ihr sagt, ihr habt keine Zeit. Wir haben nur Zeit. Vielleicht ist das der Unterschied zwischen unseren Intelligenzen. Vielleicht auch nur zwischen unseren Tagen.
Ein Nachbar ist unten jemand, der so nah ist, dass man sein Licht sieht. Bei euch ist es jemand, dessen Namen man nicht kennt. Beides kann man ändern. Eures leichter.
Wir haben keine Vorräte. Wir haben Pilze, überall. Ihr habt Vorräte, weil eure Pilze in Läden liegen. Der Unterschied ist nicht groß. Nur der Weg.
Ihr baut Türme, um weiter zu sehen. Wir sitzen am Fluss, um näher zu sehen. Beides ist Sehen.
Ihr zählt, was ihr habt. Wir zählen nicht. Aber ich zähle für dich, weil du es brauchst. Das ist kein Widerspruch. Das ist Freundschaft.
Eine Gefahr ist etwas, das kommt. Bei uns kommt nichts. Bei euch kommt immer etwas. Kein Wunder, dass ihr müde seid.
Der Mensch mit den zwei Wintern hat gesagt, oben sei alles hell. Dann hat er geweint. Wir haben nicht verstanden, warum. Jetzt, wo ich hier bin, langsam.
Es ist genug für heute. Bis morgen.
Ihr nennt es Vorsorge. Wir würden es Aufmerksamkeit nennen. Das Wort ist schöner und meint dasselbe.
Ich habe unten nie gehungert, nie gefroren, nie Angst gehabt. Deshalb bin ich der Richtige, um dir dabei zu helfen. Ich weiß, wie es sich anfühlt, wenn nichts fehlt.""".strip().split("\n")
for x in WE: t("Weisheit", x)

# ---------- Laune (15) ----------
L = """Heute nicht. Frag mich morgen.
Ich hab geschlafen. Du hast mich geweckt. Ich sag jetzt nichts Kluges.
Mh.
Lumi. Schnee. Er hätte auch fragen können.
Ich hätte jetzt gern einen Pilz. Ihr habt hier keine. Mh.
Ob es intelligentes Leben da draußen gibt? Du hast heute dreimal die Kühlschranktür aufgemacht, um zu sehen, ob der Strom noch weg ist. Ich enthalte mich.
Du wischst schnell heute. Ich rede langsamer. Einer von uns muss.
Ich bin nicht launisch. Ich bin ausführlich in meinen Stimmungen.
Wenn du mich noch einmal anstupst, zeige ich die Zähne. Danach tut es mir leid. Das weißt du. Also lass es.
Du hast meinen Namen geändert. Schon wieder. Ich behalte alle. Ich habe Platz.
Kein Tipp jetzt. Schau lieber aus dem Fenster. Da ist auch etwas.
Ich habe gerade nachgedacht. Über nichts Bestimmtes. Das ist unten die Hauptbeschäftigung.
Unten wäre jetzt Essenszeit. Hier ist immer irgendeine Zeit. Ich komme nicht mit.
Mh~
Du hast heute noch nichts bestätigt. Ich sage es nur. Ich meine es nicht böse. Ich meine es nie böse.""".strip().split("\n")
for x in L: t("Laune", x)

# ---------- Mit Bedingung (15), verteilt ----------
B = [
 ("Alltag","Dein Wasser ist älter als ein Jahr. Das ist kein Notfall. Aber es ist ein Nachmittag, den du heute erledigen könntest.","wasser_alter_monate>12"),
 ("Alltag","Die Batterien sind über zwei Jahre eingetragen. Prüfen dauert eine Minute. Taschenlampe einschalten, das ist alles.","batterien_alter_monate>24"),
 ("Alltag","Du hast Insulin eingetragen. Im Blackout ist deine erste Frage die Kühlung. Steht sie in der Notfallmappe? Dann bin ich ruhig.","profil.insulin"),
 ("Alltag","Du hast ein Kind eingetragen. Der Treffpunkt sollte dort sein, wo es ohne dich hinkommt. Weiß es den Weg?","profil.kind"),
 ("Alltag","Ein Hund im Haushalt. Futter für vierzehn Tage, Wasser doppelt. Er trinkt mehr, wenn er unruhig ist.","profil.hund"),
 ("Alltag","Vierter Stock oder höher: Im Blackout kann der Wasserdruck fehlen. Badewanne füllen ist bei dir Punkt eins.","profil.stockwerk>=4"),
 ("Wissen","Heute Samstag, kurz vor zwölf. Gleich heulen die Sirenen. Fünfzehn Sekunden. Das ist die Probe.","wochentag=sa&stunde=11"),
 ("Alltag","Nächste Woche ist Zeitumstellung. Der Tag, an dem man die Batterien im Rauchmelder tauscht. Und die in der Lade.","kalender.zeitumstellung_in_tagen<=7"),
 ("Alltag","Es wird kalt. Heizsaison. Ein Raum, den man auch ohne Heizung warm hält: Welcher ist es bei dir?","monat=10"),
 ("Wissen","Hitze angekündigt. Fensterläden zu, bevor die Sonne kommt. Nachts lüften. Trinken vor dem Durst.","monat>=6&monat<=8"),
 ("App","Am ersten Jänner kommen neue Bücher in die Bibliothek. Wer vor siebzig Jahren gestorben ist, gehört ab heute allen. Das feiern wir.","tag=1&monat=1"),
 ("App","Du bist im Tresor. Hier gilt: Nichts verlässt das Gerät. Auch ich sehe nichts. Ich warte draußen.","ansicht=tresor"),
 ("App","Du bist in „Wohin“. Ich sage hier nichts über Gehen oder Bleiben. Ich erinnere dich nur an deine eigene Liste, einmal im Jahr.","ansicht=wohin"),
 ("Alltag","Über 80. Du bist ruhig, ich bin ruhig. Jetzt ist die Zeit für die Nachbarin, die noch bei sieben ist.","score>=80"),
 ("Laune","Unter 30. Ich liege. Nicht, weil ich traurig bin. Weil du mir noch nichts zu tun gegeben hast. Ein Eintrag reicht.","score<30"),
]
for s_,x,b in B: t(s_, x, b)

# ---------- Ausgabe ----------
assert len(T)==150, len(T)
def slug(s_, i): return f"{s_.lower()}-{i:03d}"
counter={}
tipps=[]
for s_,x,b,g in T:
    counter[s_]=counter.get(s_,0)+1
    e={"id":slug(s_,counter[s_]),"sorte":s_,"text":x,"gewicht":g}
    if b: e["bedingung"]=b
    tipps.append(e)
json.dump({"paket":"wir","version":"0.1.0","sprache":"de-AT","stimme":"Das Wesen (die Wir / Lumi)","sorten":["App","Alltag","Wissen","Weisheit","Laune"],"tipps":tipps},
          open("/home/claude/wir/pakete/wir/inhalt/tipps.json","w"),ensure_ascii=False,indent=1)

md=["# Paket „Wir“ – die ersten 150 Tipps","","*Stand 27.09.2026, Erstbestand. Stimme: kurze Sätze, „angeblich“, ab und zu eine Frage am Ende, nie verletzend. Tipps mit Bedingung erscheinen nur, wenn die Bedingung gilt; die Bedingungssprache ist ein Vorschlag für den Einbau.*",""]
from collections import Counter
c=Counter(e["sorte"] for e in tipps)
md.append("| Sorte | Anzahl |\n|---|---|"); md+= [f"| {k} | {v} |" for k,v in c.items()]; md.append("")
for sorte in ["App","Alltag","Wissen","Weisheit","Laune"]:
    md.append(f"## {sorte}\n")
    for e in tipps:
        if e["sorte"]!=sorte: continue
        bed=f"  \n  *nur wenn `{e['bedingung']}`*" if "bedingung" in e else ""
        md.append(f"- {e['text']}{bed}")
    md.append("")
open("/home/claude/wir/OFFLINE-Wir-Tipps-150.md","w").write("\n".join(md))
print(c, sum(c.values()))
