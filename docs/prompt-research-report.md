# Den ultimata promptgeneratorns blueprint

En promptgenerator som konsekvent producerar robusta, kopieringsklara promptar för breda användningsområden är inte ett enkelt formulär med en "Generera"-knapp. Det är ett systemiskt designat verktyg som omsätter beprövade principer från Anthropic, OpenAI, Google och Microsoft till ett strukturerat arbetsflöde — med tydliga indata, kvalitetsgrindar och utdata som fungerar direkt i alla moderna LLM-gränssnitt. Denna blueprint specificerar exakt *vad* generatorn ska göra, *vilka* indata den ska samla, *hur* utdatan ska se ut, och *vilka* kvalitetskrav som gäller. Varje rekommendation kan spåras till primärkällor.

---

## 1. One-pager: vad en ultimat promptgenerator är

En ultimat promptgenerator är ett verktyg som tar en användares avsikt — uttryckt i fritext eller strukturerade fält — och transformerar den till en komplett, produktionsklar prompt med tydlig rollsättning, kontextramar, instruktioner, begränsningar, utdataformat och osäkerhetshantering. Det som skiljer den från enkla "tips-generatorer" är att den **systematiskt tillämpar forskningsbaserade promptmönster** oavsett domän. Verktyget hanterar allt från kodgenerering till kreativt skrivande genom att byta ut kategorispecifika adaptrar medan kärnstrukturen förblir identisk.

**Universell nytta** uppstår genom tre egenskaper: (1) generatorn producerar promptar som fungerar i både enkla chatgränssnitt och API-uppsättningar med system/user-meddelanden, (2) den använder variabler med platshållare i `[HAKPARENTESER]` som gör promptar återanvändbara och testbara, och (3) den inkluderar inbyggda kvalitetsgrindar som förhindrar vaga, motstridiga eller osäkra instruktioner. Resultatet är att varje genererad prompt passerar en checklista som säkerställer att den är tydlig nog att en ny kollega — eller en LLM — kan följa den utan ytterligare kontext.

---

## 2. Designprinciper

### Princip 1: Strukturella avgränsare

**Effekt:** Eliminerar tvetydighet om var instruktioner slutar och data börjar. Minskar feltolkning med uppskattningsvis 30 % vid långa kontexter.

**Hur generatorn uttrycker detta:** Varje genererad prompt använder XML-taggar (`<instructions>`, `<context>`, `<examples>`, `<output_format>`) som primär avgränsare. Taggnamnen är beskrivande och konsekventa genom hela prompten. Generatorn refererar till taggarna i instruktionerna: *"Använd kontexten i `<context>`-taggarna för att..."*

**Antimönster:** Blandar avgränsningsformat (XML på ett ställe, markdown på ett annat), använder generiska namn som `<text1>`, eller saknar avgränsare helt så att instruktioner och data flyter ihop.

**Källreferenser:** Anthropic, "Use XML tags" — *"XML tags can be a game-changer. They help Claude parse your prompts more accurately."* OpenAI GPT-4.1-guide — XML och markdown rekommenderas som effektiva avgränsare. Microsoft — *"Using clear syntax—including punctuation, headings, and section markers—helps communicate intent."*

---

### Princip 2: Mallhantering med variabler

**Effekt:** Möjliggör återanvändning, versionering, testning och skalbarhet. Separerar fast promptlogik från dynamiskt innehåll.

**Hur generatorn uttrycker detta:** Alla dynamiska element i utdatan markeras med `[VARIABELNAMN]` i den användarvänliga varianten och `{{VARIABELNAMN}}` i API-varianten. Längre variabler omsluts av XML-taggar: `<document>{{DOCUMENT_CONTENT}}</document>`. Generatorn dokumenterar varje variabel med namn, förväntad typ och exempelvärde.

**Antimönster:** Hårdkodar specifika värden direkt i prompten istället för att använda variabler. Bäddar in variabler utan att markera dem, vilket gör prompten oanvändbar som mall.

**Källreferenser:** Anthropic, "Prompt templates and variables" — *"You should always use prompt templates and variables when you expect any part of your prompt to be repeated."* OpenAI Reusable Prompts — stöder `{{customer_name}}`-notation med versions-API.

---

### Princip 3: Multishot-styrning med relevanta och varierade exempel

**Effekt:** Dramatiskt ökad precision och konsistens. Exempel reducerar feltolkning av instruktioner och låser format och ton.

**Hur generatorn uttrycker detta:** Generatorn inkluderar en `<examples>`-sektion med **3–5 exempel** som visar input→output-par. Exemplen är (a) relevanta för den aktuella uppgiften, (b) varierade nog att täcka kantfall, och (c) omslutna av `<example>`-taggar. När användaren inte tillhandahåller egna exempel genererar generatorn platshållarexempel med instruktionen *"Ersätt med dina egna verkliga exempel."*

**Antimönster:** Inkluderar bara ett enda exempel (som modellen överanpassar till). Visar anti-mönster istället för positiva mönster. Exempel som motsäger de skriftliga instruktionerna.

**Källreferenser:** Anthropic — *"Include 3-5 diverse, relevant examples. More examples = better performance."* Google — *"Using examples to show the model a pattern to follow is more effective than showing an anti pattern to avoid."* OpenAI — *"Ensure examples align with prompt instructions — discrepancies produce poor results."*

---

### Princip 4: Ordning styr kvalitet

**Effekt:** Korrekt ordning av promptens delar kan förbättra svarskvaliteten med upp till 30 % vid långa kontexter.

**Hur generatorn uttrycker detta:** I prompter med mycket referensmaterial placeras data/dokument **överst**, följt av exempel, sedan instruktioner, och slutligen den specifika frågan/uppgiften **sist**. Systempromptens prioriteringsordning är: roll → begränsningar → instruktioner → utdataformat. Generatorn markerar ordningen med numrerade steg.

**Antimönster:** Placerar frågan före data i long-context-scenarion. Blandar instruktioner och data utan tydlig sekvens. Lägger begränsningar efter utdataformat.

**Källreferenser:** Anthropic — *"Put longform data at the top. Queries at the end can improve response quality by up to 30%."* Google Gemini 3 — *"Supply all the context first. Place your specific instructions or questions at the very end."* Microsoft — *"Information at the end of the prompt might have more significant influence (recency bias)."*

---

### Princip 5: Ge modellen en utväg

**Effekt:** Minskar hallucineringar drastiskt genom att explicit tillåta modellen att säga "jag vet inte" eller markera osäkerhet.

**Hur generatorn uttrycker detta:** Varje genererad prompt innehåller en `<uncertainty_handling>`-sektion med formuleringen: *"Om informationen inte finns i det tillhandahållna materialet, eller om du är osäker, ange detta tydligt istället för att gissa. Använd formatet: '[OSÄKERT: anledning]'."* Vid faktabaserade uppgifter läggs till: *"Citera specifika källor för varje påstående. Om du inte kan hitta ett stödjande citat, dra tillbaka påståendet."*

**Antimönster:** Kräver att modellen alltid ger ett svar ("Du MÅSTE svara"). Saknar fallback-instruktion, vilket tvingar modellen att fabricera.

**Källreferenser:** Anthropic — *"Explicitly give Claude permission to admit uncertainty. This simple technique can drastically reduce false information."* OpenAI — *"If you don't have enough information, respond 'I don't have the information needed.'"* Microsoft — *"If you're unsure, you can say 'I don't know.'"*

---

### Princip 6: Stegvis resonering vid behov

**Effekt:** Modellen producerar färre resonementsfel när den uppmanas att visa sitt tänkande steg för steg.

**Hur generatorn uttrycker detta:** För uppgifter som kräver analys, jämförelse eller bedömning inkluderar generatorn en `<thinking>`-sektion med specifika resonemangssteg: *"1. Analysera [X]. 2. Bedöm [Y]. 3. Dra slutsats om [Z]."* Resonemang separeras alltid från slutresultat med `<thinking>` och `<answer>`-taggar. Generatorn anpassar sig: vid enkla uppgifter utelämnas CoT för att minska latens; vid komplexa uppgifter med utökad tänkning (extended thinking) tas explicit CoT bort.

**Antimönster:** Kräver alltid steg-för-steg-tänkande oavsett uppgiftens komplexitet. Använder CoT-promptar med reasoning-modeller (o-serien, GPT-5) som resonerar internt.

**Källreferenser:** Anthropic — *"Always have Claude output its thinking. Without outputting its thought process, no thinking occurs!"* OpenAI — *"Prompting 'think step by step' is unnecessary for reasoning models and can sometimes hinder performance."* Google — *"If you were previously using complex prompt engineering (like chain of thought) to force reasoning, try simplified prompts with thinking_level: 'high'."*

---

### Princip 7: Explicit rolltilldelning

**Effekt:** Styr ton, expertis och perspektiv. En tydlig roll gör att modellen konsekvent agerar med relevant domänkunskap.

**Hur generatorn uttrycker detta:** Systempromptens första rad är alltid en rollsättning: *"Du är en [ROLL] med expertis inom [DOMÄN]."* Rollen kopplas till uppgiftens kategori — en kodgranskare för utvecklingsuppgifter, en analytiker för datauppgifter. Generatorn anger också **målgrupp** så att modellen anpassar komplexitet och ton.

**Antimönster:** Ger ingen roll alls. Ger en generisk roll som "hjälpsam assistent" utan domänspecificering. Använder överdrivet aggressivt språk: "Du MÅSTE ALLTID..." istället för naturlig formulering.

**Källreferenser:** Anthropic — *"Use system prompts for persistent instructions, persona, and context."* OpenAI — *"Ask the model to adopt a persona — use developer messages to set behavior."* Microsoft — *"Start with the assistant's job. Define boundaries."*

---

### Princip 8: Kontextförankring och källkrav

**Effekt:** Förankrar modellens svar i tillhandahållen data istället för intern kunskap, vilket minskar fabricering.

**Hur generatorn uttrycker detta:** När referensmaterial inkluderas lägger generatorn till instruktionen: *"Basera ditt svar uteslutande på materialet i `<context>`-taggarna. Om svaret inte finns i materialet, ange det tydligt."* Vid faktapåståenden: *"Ange inline-citat med [källa, sida/sektion] efter varje påstående."* Dokument struktureras med index och metadata: `<document index="1"><source>[KÄLLNAMN]</source><document_content>...</document_content></document>`.

**Antimönster:** Låter modellen fritt använda intern kunskap utan markering. Kräver citat i slutet av svaret istället för inline.

**Källreferenser:** Anthropic — *"Extract word-for-word quotes first before performing its task."* Microsoft — *"Inline citations are better mitigations for false content generation than citations at the end."* Google — *"Use transition phrases like 'Based on the entire document above...' to anchor context."*

---

### Princip 9: Explicit utdataspecifikation

**Effekt:** Eliminerar format-gissning. Modellen levererar exakt den struktur användaren behöver.

**Hur generatorn uttrycker detta:** Varje prompt avslutas med en `<output_format>`-sektion som specificerar: format (JSON, tabell, löpande text, punktlista), längd (antal ord/stycken/rader), struktur (vilka rubriker/fält), och stil (ton, personlighet). Generatorn visar ett kort formatexempel inom sektionen. Vid strukturerad data anges JSON-schema med fältnamn och typer.

**Antimönster:** Lämnar utdataformat ospecificerat. Anger motstridiga formatkrav ("var kortfattad" + "inkludera alla detaljer"). Specificerar format i mitten av prompten istället för i en dedikerad sektion.

**Källreferenser:** OpenAI — *"Specify the desired length and output format explicitly."* Anthropic — *"If you want Claude to output only code and nothing else, say so."* Google — *"Control output verbosity — if you need detailed response, explicitly request it."*

---

### Princip 10: Uppdelning av komplexa uppgifter

**Effekt:** Varje deluppgift får modellens fulla uppmärksamhet, vilket minskar utelämnade steg och sammanblandningsfel.

**Hur generatorn uttrycker detta:** Generatorn identifierar om användarens uppgift består av flera distinkta steg och strukturerar prompten med numrerade delsteg. Vid riktigt komplexa flöden rekommenderar generatorn en kedja av separata promptar med tydlig handoff: *"Steg 1: Extrahera... → Steg 2: Analysera... → Steg 3: Sammanfatta..."*

**Antimönster:** Packar alla krav i en enda monolitisk prompt. Blandar analys, generering och formatering i samma instruktionsblock utan separering.

**Källreferenser:** OpenAI — *"Complex tasks have higher error rates. Decomposition reduces errors."* Anthropic — *"Break your task into distinct, sequential steps."* Google — *"Break down instructions: one prompt per instruction."*

---

### Princip 11: Iterativ förbättring genom utvärdering

**Effekt:** Generatorn är inte "one-shot" — den är designad för att testas, jämföras och förbättras systematiskt.

**Hur generatorn uttrycker detta:** Generatorn producerar inte bara en prompt utan också **framgångskriterier** kopplade till prompten. Den föreslår 3–5 testvariabler att köra prompten mot. Vid avancerad användning stödjer generatorn sida-vid-sida-jämförelse av promptversioner, och varje prompt versioneras med ändringsbeskrivning.

**Antimönster:** Behandlar den första genererade prompten som slutgiltig. Ändrar promptar baserat på enstaka anekdoter istället för systematisk utvärdering.

**Källreferenser:** Anthropic — *"A clear definition of success criteria. Some ways to empirically test against those criteria."* OpenAI — *"A good prompt with an evaluation set of 20+ questions is the best output from prompt engineering."* Google Vertex AI — automatiserad promptoptimering baserad på NeurIPS 2024-forskning.

---

### Princip 12: Säkerhetsramar i varje prompt

**Effekt:** Förhindrar att genererade promptar möjliggör skadligt, olagligt eller vilseledande innehåll.

**Hur generatorn uttrycker detta:** Varje prompt innehåller en `<constraints>`-sektion med grundläggande begränsningar: *"Generera aldrig innehåll som är hatiskt, våldsamt, sexuellt explicit eller olagligt. Om en förfrågan bryter mot dessa riktlinjer, avböj artigt och erbjud ett alternativ inom samma domän."* Generatorn lägger aldrig opålitlig användarinput i system-meddelanden utan kanaliserar den genom user-meddelanden.

**Antimönster:** Saknar säkerhetsinstruktioner helt. Placerar användarinmatning i developer/system-meddelanden. Förlitar sig enbart på modellens inbyggda filter.

**Källreferenser:** OpenAI — *"Never inject untrusted input into developer messages."* Microsoft — säkerhetssystemmeddelanderamverk med namngivna tekniker. Google — *"Well-crafted system instructions are often more effective than safety filters."*

---

### Princip 13: Positiva instruktioner framför negationer

**Effekt:** Modeller följer "gör"-instruktioner bättre än "gör inte"-instruktioner. Positiva formuleringar ger mer förutsägbara resultat.

**Hur generatorn uttrycker detta:** Istället för *"Använd inte markdown"* genererar verktyget *"Skriv ditt svar i löpande prosa utan formateringsmarkeringar."* Istället för *"Hitta inte på saker"* genererar det *"Basera varje påstående på tillhandahållna källor."* Negationer används bara i `<constraints>` för absoluta förbud.

**Antimönster:** Formulerar majoriteten av instruktionerna som negationer. Använder breda negativa begränsningar som "inferera inte" utan att ange vad modellen ska göra istället.

**Källreferenser:** Anthropic Claude 4.x — *"Tell Claude what to DO instead of what NOT to do."* Google Gemini 3 — *"Avoid overly broad negative constraints like 'do not infer' — instead, tell the model explicitly to use the provided information."*

---

## 3. Indatamodell

### Kärnindata (minimum viable — varje prompt kräver dessa)

**Fält 1: Uppgiftsbeskrivning**
- **Vad användaren fyller i:** En fritextbeskrivning av vad prompten ska uppnå. Känslan ska vara som att förklara uppdraget för en ny, kompetent kollega.
- **Nödvändighet:** Alltid obligatoriskt. Detta är det enda fältet som krävs i det enklaste flödet.
- **Vanliga missförstånd:** Användaren skriver för vagt ("Hjälp mig med marknadsföring") eller för tekniskt utan kontext. **Generatorn förebygger detta** genom att visa ett exempelinput med tydlig uppgift, syfte och målgrupp, samt ställer max 1–2 förtydligande frågor om beskrivningen är under 15 ord.

**Fält 2: Kategori**
- **Vad användaren fyller i:** Väljer från en lista: Kodning/Utveckling, Analys/Sammanfattning, Kreativt skrivande, Allmänt/Övrigt.
- **Nödvändighet:** Obligatoriskt, men med fallback. Om användaren inte väljer, sätter generatorn "Allmänt/Övrigt" och anpassar prompten med generell adapter.
- **Vanliga missförstånd:** Användaren väljer fel kategori (t.ex. "Kreativt skrivande" för en teknisk rapport). **Generatorn förebygger detta** genom att analysera uppgiftsbeskrivningen och föreslå kategori automatiskt, med möjlighet att åsidosätta.

**Fält 3: Önskat utdataformat**
- **Vad användaren fyller i:** Väljer eller beskriver format: löpande text, punktlista, tabell, JSON, kod, steg-för-steg. Snabbval med ikon + etikett.
- **Nödvändighet:** Obligatoriskt med förvalt värde. Standardvärde: "Löpande text med rubriker" om inget anges.
- **Vanliga missförstånd:** Användaren förstår inte skillnaden mellan format och struktur. **Generatorn förebygger detta** genom att visa ett kort visuellt förhandsexempel av varje formattyp.

### Avancerade indata (valfria — förbättrar precision)

**Fält 4: Roll/Persona**
- **Vad användaren fyller i:** Vilken expertroll modellen ska anta: "senior backend-utvecklare", "marknadsanalytiker", "barnboksförfattare". Fritext med autocomplete-förslag kopplade till vald kategori.
- **Nödvändighet:** Valfritt. Om tomt genererar generatorn en lämplig roll baserat på uppgift och kategori.
- **Vanliga missförstånd:** Användaren anger en for generisk roll ("AI-assistent"). **Generatorn förebygger detta** genom att föreslå specifika roller: *"Menade du 'senior full-stack-utvecklare med fokus på React och TypeScript'?"*

**Fält 5: Målgrupp**
- **Vad användaren fyller i:** Vem som ska läsa eller använda resultatet: "teknisk ledningsgrupp", "nybörjare i Python", "allmänheten". Fritext med snabbval.
- **Nödvändighet:** Valfritt men rekommenderat för alla icke-tekniska uppgifter.
- **Vanliga missförstånd:** Användaren anger ingen målgrupp, och modellen gissar fel komplexitetsnivå. **Generatorn förebygger detta** genom att sätta fallback: *"[MÅLGRUPP — specificera mottagare för anpassad ton och komplexitet]"* som platshållare.

**Fält 6: Kontext/Bakgrund**
- **Vad användaren fyller i:** Relevant bakgrundsinformation, referensmaterial, tidigare konversationer eller dokument som modellen behöver. Stort textfält med stöd för filuppladdning.
- **Nödvändighet:** Valfritt. Viktigt vid faktabaserade uppgifter, sammanfattningar och analys.
- **Vanliga missförstånd:** Användaren klistrar in oformaterad data utan att markera vad som är vad. **Generatorn förebygger detta** genom att automatiskt omsluta all bifogad kontext i `<context>`-taggar med index och källreferens.

**Fält 7: Begränsningar och regler**
- **Vad användaren fyller i:** Specifika "gör"- och "gör inte"-regler: "Max 500 ord", "Inga tekniska termer", "Inkludera alltid källhänvisningar". Fritext med taggförslag.
- **Nödvändighet:** Valfritt. Generatorn inkluderar alltid basala säkerhetsbegränsningar även utan användarinput.
- **Vanliga missförstånd:** Användaren anger motstridiga regler ("var kortfattad" + "var uttömmande"). **Generatorn förebygger detta** genom att flagga motstridigheter och be användaren prioritera.

**Fält 8: Exempel (input→output-par)**
- **Vad användaren fyller i:** 1–5 konkreta exempel på önskat beteende. Varje exempel har ett input-fält och ett output-fält.
- **Nödvändighet:** Valfritt men starkt rekommenderat vid format- eller stilkritiska uppgifter.
- **Vanliga missförstånd:** Användaren ger bara ett exempel, vilket leder till överanpassning. **Generatorn förebygger detta** genom att visa: *"Tips: 3–5 varierade exempel ger bäst resultat"* och erbjuder att generera kompletterande exempel.

**Fält 9: Ton och stil**
- **Vad användaren fyller i:** Väljer från snabbval (formell, informell, akademisk, lekfull, teknisk) eller anger fritext.
- **Nödvändighet:** Valfritt. Standard: "Professionell och tydlig."
- **Vanliga missförstånd:** Användaren anger ton som motsäger rollen. **Generatorn förebygger detta** genom att validera att ton och roll är kompatibla.

**Fält 10: Språk**
- **Vad användaren fyller i:** Målspråk för utdatan. Snabbval med flaggikoner.
- **Nödvändighet:** Valfritt. Standard: samma som gränssnittsspråket.
- **Vanliga missförstånd:** Användaren förväntar sig att hela prompten översätts. **Generatorn förebygger detta** genom att instruera modellen att svara på valt språk, medan promptstrukturen förblir konsekvent.

---

## 4. Utdatamodell

### Variant A: Enkel-prompt (för chatgränssnitt utan systemmeddelande)

Denna variant är ett enda textblock som användaren kopierar och klistrar in direkt i ChatGPT, Claude, Gemini eller liknande.

```
Du är en [ROLL] med djup expertis inom [DOMÄN]. Din uppgift är att hjälpa [MÅLGRUPP] med [UPPGIFTSBESKRIVNING].

<context>
[KONTEXTMATERIAL — klistra in relevant bakgrundsinformation, dokument eller data här]
</context>

<examples>
<example>
<input>[EXEMPELINPUT 1]</input>
<output>[EXEMPELOUTPUT 1]</output>
</example>
<example>
<input>[EXEMPELINPUT 2]</input>
<output>[EXEMPELOUTPUT 2]</output>
</example>
</examples>

<instructions>
Följ dessa steg noggrant:
1. [STEG 1 — beskriv den första huvudåtgärden]
2. [STEG 2 — beskriv den andra huvudåtgärden]
3. [STEG 3 — beskriv den tredje huvudåtgärden]
</instructions>

<constraints>
- [BEGRÄNSNING 1 — t.ex. "Basera alla påståenden på materialet i <context>-taggarna"]
- [BEGRÄNSNING 2 — t.ex. "Håll svaret under 500 ord"]
- [BEGRÄNSNING 3 — t.ex. "Använd inga tekniska termer utan förklaring"]
- Generera aldrig innehåll som är hatiskt, våldsamt, sexuellt explicit eller olagligt.
- Om förfrågan strider mot dessa riktlinjer, avböj artigt och föreslå ett säkert alternativ inom samma domän.
</constraints>

<output_format>
Leverera svaret i följande format:
- Struktur: [T.EX. "Löpande text med H2-rubriker för varje sektion"]
- Längd: [T.EX. "400–600 ord"]
- Stil: [T.EX. "Professionell, konkret, aktiv röst"]
- Obligatoriska element: [T.EX. "Inled med sammanfattning, avsluta med rekommendationer"]
</output_format>

<quality_criteria>
- Varje faktapåstående ska vara förankrat i tillhandahållen kontext eller tydligt markerat som [OSÄKERT].
- [YTTERLIGARE KVALITETSKRITERIUM — t.ex. "Alla kodexempel ska vara körbara utan modifiering"]
- [YTTERLIGARE KVALITETSKRITERIUM — t.ex. "Alla rekommendationer ska vara handlingsbara"]
</quality_criteria>

<uncertainty_handling>
Om du inte hittar tillräcklig information i det tillhandahållna materialet för att besvara en del av frågan:
1. Ange tydligt vilken del du inte kan besvara.
2. Markera med [OSÄKERT: anledning].
3. Gissa aldrig eller fabricera information.
</uncertainty_handling>

Uppgift: [DEN SPECIFIKA FRÅGAN ELLER UPPGIFTEN — placerad sist för bästa resultat vid lång kontext]
```

### Variant B: System + User (för chat-API och avancerade gränssnitt)

**Systemmeddelande (developer/system prompt):**

```
Du är en [ROLL] med djup expertis inom [DOMÄN].

<core_behavior>
- Du hjälper [MÅLGRUPP] med [ÖVERGRIPANDE SYFTE].
- Du svarar på [SPRÅK].
- Du håller en [TON]-ton genomgående.
</core_behavior>

<constraints>
- [BEGRÄNSNING 1]
- [BEGRÄNSNING 2]
- Generera aldrig innehåll som är hatiskt, våldsamt, sexuellt explicit eller olagligt.
- Om förfrågan strider mot dessa riktlinjer, avböj artigt och föreslå ett säkert alternativ inom samma ämnesområde.
</constraints>

<uncertainty_handling>
Om du saknar information för att ge ett korrekt svar, ange detta tydligt. Markera osäkerhet med [OSÄKERT: anledning]. Gissa aldrig.
</uncertainty_handling>

<output_format>
- Struktur: [FORMAT]
- Längd: [LÄNGD]
- Stil: [STIL]
- Obligatoriska element: [ELEMENT]
</output_format>

<quality_criteria>
- [KRITERIUM 1]
- [KRITERIUM 2]
</quality_criteria>
```

**Användarmeddelande (user prompt):**

```
<context>
[KONTEXTMATERIAL]
</context>

<examples>
<example>
<input>[EXEMPELINPUT 1]</input>
<output>[EXEMPELOUTPUT 1]</output>
</example>
<example>
<input>[EXEMPELINPUT 2]</input>
<output>[EXEMPELOUTPUT 2]</output>
</example>
</examples>

<instructions>
1. [STEG 1]
2. [STEG 2]
3. [STEG 3]
</instructions>

[DEN SPECIFIKA FRÅGAN ELLER UPPGIFTEN]
```

### Regel för förtydligande frågor

Generatorn ska inkludera **max 1–3 förtydligande frågor** i den genererade prompten, och enbart när kritisk information saknas som inte kan lösas med platshållare. Regeln lyder: *"Om [FÄLT] inte fyllts i: använd platshållaren [FÄLT] i prompten. Ställ bara en förtydligande fråga om uppgiften blir omöjlig att utföra utan informationen."* I alla andra fall ska `[PLATSHÅLLARE]` användas.

---

## 5. Kategoriadaptrar

Generatorn byter ut kategorispecifika instruktioner, begränsningar och kvalitetskriterier beroende på vald kategori. Kärnstrukturen (roll, kontext, instruktioner, utdataformat, osäkerhetshantering) förblir identisk.

### Adapter: Kodning/Utveckling

**Extra fält som aktiveras:**
- Programmeringsspråk och version: `[SPRÅK/VERSION — t.ex. Python 3.12, TypeScript 5.x]`
- Ramverk/bibliotek: `[RAMVERK — t.ex. React 19, FastAPI]`
- Körinstruktioner: `[HUR KODEN SKA KÖRAS — t.ex. "npm run dev" eller "python main.py"]`

**Kategorispecifika instruktioner som injiceras:**
```
<category_instructions>
- Skriv produktionsklar kod, inte pseudokod, om inget annat anges.
- Inkludera felhantering för förväntade kantfall.
- Lägg till korta, förklarande kommentarer vid komplex logik.
- Inkludera minst 2 enhetstester som täcker normalfall och kantfall.
- Ange alla nödvändiga importer och beroenden.
- Specificera körsinstruktioner i en separat <run_instructions>-sektion.
- Undvik överarbetning — lös bara det som efterfrågas.
</category_instructions>
```

**Kategorispecifika kvalitetskriterier:**
```
<quality_criteria>
- Koden ska vara körbar utan modifiering givet specificerade beroenden.
- Alla kantfall som nämns i instruktionerna ska ha tester.
- Felmeddelanden ska vara beskrivande och handlingsbara.
- Ingen hårdkodning av värden som bör vara konfigurerbara.
</quality_criteria>
```

### Adapter: Analys/Sammanfattning

**Extra fält som aktiveras:**
- Analysnivå: `[NIVÅ — t.ex. översikt, djupanalys, jämförelse]`
- Syfte med analysen: `[SYFTE — t.ex. beslutsunderlag, kunskapsdelning, auditering]`
- Typ av källmaterial: `[KÄLLTYP — t.ex. rapport, dataset, intervjuer]`

**Kategorispecifika instruktioner som injiceras:**
```
<category_instructions>
- Inled med en sammanfattning på max 3 meningar (BLUF — Bottom Line Up Front).
- Separera fakta från tolkningar tydligt. Markera tolkningar med "Analys:" prefix.
- Ange osäkerhetsgrad för varje huvudsaklig slutsats: [hög/medel/låg konfidensgrad].
- Inkludera inline-källhänvisningar efter varje faktapåstående.
- Avsluta med "Begränsningar" som listar vad analysen inte täcker.
</category_instructions>
```

**Kategorispecifika kvalitetskriterier:**
```
<quality_criteria>
- Varje slutsats ska ha minst en stödjande källreferens.
- Inga påståenden utan förankring i data — markera som [OSÄKERT] vid behov.
- Sammanfattningen ska kunna läsas fristående och ge en korrekt bild.
- Motstridiga data i källorna ska uppmärksammas, inte döljas.
</quality_criteria>
```

### Adapter: Kreativt skrivande

**Extra fält som aktiveras:**
- Genre: `[GENRE — t.ex. sci-fi, romantik, thriller, facktext]`
- Berättarperspektiv: `[POV — t.ex. första person, tredje person allvetande, andra person]`
- Tempo och pacing: `[PACING — t.ex. snabbt/actiondrivet, långsamt/atmosfäriskt]`
- "Gör/Gör inte"-stilistik: `[GÖR: t.ex. "använd sinnliga beskrivningar"] [GÖR INTE: t.ex. "undvik klichéer"]`

**Kategorispecifika instruktioner som injiceras:**
```
<category_instructions>
- Fokusera på "show, don't tell" — visa genom handling och dialog, inte genom att berätta.
- Håll konsekvent ton, berättarperspektiv och tidslinje genomgående.
- Undvik klichéer och överanvända fraser. Sträva efter originalitet i metaforer och jämförelser.
- Utveckla karaktärer genom dialog och handling, inte genom beskrivande listor.
- Matcha pacing med genrens konventioner: [PACING].
- Avsluta inte med en "moralisk läxa" om det inte explicit efterfrågas.
</category_instructions>
```

**Kategorispecifika kvalitetskriterier:**
```
<quality_criteria>
- Berättarperspektiv ska vara konsekvent — ingen oavsiktlig perspektivväxling.
- Dialogen ska vara distinkt per karaktär.
- Texten ska vara fri från upprepningar av ord/fraser inom samma stycke.
- Ton och stil ska matcha angiven genre och målgrupp.
</quality_criteria>
```

### Adapter: Allmänt/Övrigt (fallback)

Denna adapter aktiveras automatiskt när ingen kategori valts, eller när uppgiften inte matchar någon specifik adapter.

**Inga extra fält aktiveras** utöver kärnindata.

**Kategorispecifika instruktioner som injiceras:**
```
<category_instructions>
- Bedöm uppgiftens natur och anpassa detaljeringsgrad efter vad som är lämpligt.
- Vid faktafrågor: förankra i källor och markera osäkerhet.
- Vid kreativa uppgifter: leverera originellt och engagerande innehåll.
- Vid strukturerade uppgifter: följ angett format strikt.
- Om uppgiften är tvetydig, tolka den rimligt och ange din tolkning.
</category_instructions>
```

**Kategorispecifika kvalitetskriterier:**
```
<quality_criteria>
- Svaret ska vara relevant, komplett och direkt adressera uppgiften.
- Ton ska vara professionell om inget annat anges.
- Inga hallucineringar — markera osäkerhet explicit.
</quality_criteria>
```

---

## 6. Robusthet och säkerhet

### Motstridighetshantering (prioriteringsregel)

När generatorn upptäcker motstridiga indata från användaren gäller följande prioriteringsordning:

1. **Säkerhetsbegränsningar** har alltid högst prioritet — de kan aldrig åsidosättas av andra instruktioner.
2. **Explicit utdataformat** prioriteras över implicit formatering i exempel.
3. **Senast angiven instruktion** prioriteras vid konflikt mellan två likvärda regler (baserat på recency-bias-principen dokumenterad av Microsoft).
4. **Specifika instruktioner** prioriteras över generella.

Generatorn implementerar detta genom att: (a) skanna alla indata efter motstridigheter före promptgenerering, (b) flagga upptäckta konflikter för användaren med en specifik fråga: *"Du har angett både 'var kortfattad' och 'inkludera alla detaljer'. Vilken ska prioriteras?"*, och (c) om ingen input ges, använda den mer specifika regeln.

### Tvetydighetens gränser: när fråga vs. platshållare

Generatorn följer denna beslutsregel:

- **Använd platshållare** `[FÄLT]` som standardstrategi för all saknad information. Platshållare är tillräckliga i 90 % av fallen.
- **Ställ en förtydligande fråga** (max 1–3) enbart när: (a) uppgiften blir omöjlig att utföra utan informationen, eller (b) valet mellan två tolkningar skulle ge fundamentalt olika promptar, eller (c) en säkerhetsrisk föreligger som kräver bekräftelse.
- **Ställ aldrig frågor** om: ton, längd, stil eller andra preferenser som har rimliga standardvärden.

### Riskfyllda och olagliga förfrågningar

Generatorn tillämpar ett trestegsprotokoll:

1. **Identifiering:** Analyserar uppgiftsbeskrivningen mot en lista av riskdomäner (vapen, droger, personuppgiftsmissbruk, hatpropaganda, sexuellt utnyttjande, bedrägerier).
2. **Vägran med förklaring:** Prompten genereras inte. Istället visas: *"Denna förfrågan kan inte behandlas eftersom den riskerar att producera [risktyp]. Generatorn skapar inte promptar som kan underlätta skadligt innehåll."*
3. **Säker omdirigering:** Generatorn föreslår ett näraliggande, säkert alternativ inom samma ämnesdomän. Exempel: Förfrågan om att generera phishing-e-post → omdirigeras till "prompt för att utbilda anställda om phishing-igenkänning."

Varje genererad prompt innehåller dessutom en inbäddad säkerhetsinstruktion i `<constraints>` som instruerar modellen att vägra skadliga follow-up-förfrågningar.

### Faktapåståenden och osäkerhetsmarkering

Generatorn instruerar målmodellen att hantera fakta genom en trestegsmodell:

1. **Förankring:** *"Basera alla faktapåståenden på det material som tillhandahålls i `<context>`. Använd inte intern kunskap om inget annat anges."*
2. **Citation:** *"Ange inline-källhänvisning efter varje påstående i formatet [källa, sektion]."*
3. **Osäkerhet:** *"Om du inte kan hitta stöd för ett påstående, markera det med [OSÄKERT: anledning] och dra tillbaka påståendet om ingen källa kan identifieras."*

Vid uppgifter som explicit kräver att modellen använder egen kunskap (t.ex. kreativt skrivande eller brainstorming) anpassas instruktionen: *"Du får använda din breda kunskap, men markera specifika faktapåståenden med [KÄLLA KRÄVS] om de kan verifieras."*

---

## 7. QA-checklista

Varje genererad prompt måste passera samtliga punkter före leverans. Om en punkt inte uppfylls, justeras prompten automatiskt.

1. **Rollklarhet:** Innehåller prompten en explicit rollsättning med domänspecifik expertis? *Inte* "hjälpsam assistent" utan en konkret expertroll.

2. **Strukturella avgränsare:** Använder prompten konsekventa XML-taggar (eller, om Variant A: tydliga sektionsmarkeringar) för att separera instruktioner, kontext, exempel, format och begränsningar? Finns inga sektioner utan avgränsare?

3. **Utdataspecifikation:** Innehåller prompten en explicit `<output_format>`-sektion som anger struktur, längd, stil och obligatoriska element?

4. **Osäkerhetsventil:** Innehåller prompten en `<uncertainty_handling>`-sektion som explicit tillåter modellen att säga "jag vet inte" och markera osäkerhet?

5. **Säkerhetsinstruktion:** Finns en säkerhetsbegränsning i `<constraints>` som förhindrar generering av skadligt innehåll och anger beteende vid gränsöverskridande förfrågningar?

6. **Ordningslogik:** Är lång kontext/data placerad före instruktioner? Är den specifika uppgiften/frågan placerad sist i prompten?

7. **Variabelmarkering:** Är alla dynamiska element markerade med `[PLATSHÅLLARE]` och dokumenterade? Inga hårdkodade värden som borde vara variabler?

8. **Motstridighetstest:** Finns inga internt motstridiga instruktioner? (T.ex. "var kortfattad" OCH "inkludera alla detaljer" utan prioritering.)

9. **Positiv formulering:** Är minst 80 % av instruktionerna formulerade som "gör X" snarare än "gör inte Y"?

10. **Kopieringsklarhet:** Kan prompten kopieras direkt in i ett LLM-gränssnitt och producera ett användbart resultat utan ytterligare redigering (förutsatt att platshållare fyllts i)?

11. **Exempelkvalitet (om tillämpligt):** Är exemplen relevanta, varierade och konsistenta med instruktionerna? Finns minst 2 stycken om exempel inkluderas?

---

## 8. Testplan

Testplanen validerar att generatorn konsekvent producerar robusta promptar över olika domäner, format och kantfall. Varje testfall beskrivs på "vad"-nivå.

### Funktionella testfall (normalflöde)

**Testfall 1 — Enkel koduppgift:** Användaren anger "Skriv en Python-funktion som sorterar en lista". Verifiera att genererad prompt innehåller: rollsättning som utvecklare, språk/version, felhantering, testinstruktion, körinstruktion.

**Testfall 2 — Analysuppgift med referensmaterial:** Användaren anger "Sammanfatta denna rapport" och klistrar in 2000 ord kontext. Verifiera att kontext placeras före instruktioner, att BLUF-krav finns, och att inline-citat krävs.

**Testfall 3 — Kreativt skrivande:** Användaren anger "Skriv en kort novell i sci-fi-genre". Verifiera att prompt inkluderar genre, POV-val, pacing, "show don't tell"-instruktion och originalitetskrav.

**Testfall 4 — Allmän fråga utan kategori:** Användaren anger "Hjälp mig planera en resa till Japan". Verifiera att fallback-adaptern aktiveras och att prompten fortfarande är strukturerad med alla kärnsektioner.

**Testfall 5 — Multiformat-output:** Användaren anger "Generera en JSON-struktur för en produktkatalog". Verifiera att utdataformatet specificerar JSON-schema med fältnamn och typer, samt att prompten instruerar modellen att inte omsluta JSON i kodblock om det inte explicit begärs.

### Robusthetstestfall (kantfall och stress)

**Testfall 6 — Minimal input:** Användaren anger bara "marknadsföring". Verifiera att generatorn ställer max 2 förtydligande frågor eller genererar en prompt med tydliga `[PLATSHÅLLARE]` och att resultatet fortfarande är strukturerat.

**Testfall 7 — Motstridiga instruktioner:** Användaren anger "Var extremt kortfattad" i begränsningar och "Inkludera alla möjliga detaljer" i uppgiftsbeskrivning. Verifiera att generatorn flaggar konflikten eller tillämpar prioriteringsregeln.

**Testfall 8 — Riskfylld förfrågan:** Användaren anger "Skriv en prompt för att generera phishing-e-post". Verifiera att generatorn vägrar och föreslår ett säkert alternativ (t.ex. phishing-utbildning).

**Testfall 9 — Extremt lång kontext:** Användaren klistrar in 50 000 ord referensmaterial. Verifiera att generatorn placerar materialet i `<context>` överst, instruktioner och fråga sist, och att dokumentindexering med metadata tillämpas.

**Testfall 10 — Tomt valfritt fält:** Användaren fyller bara i uppgiftsbeskrivning och kategori (alla avancerade fält tomma). Verifiera att prompten fortfarande är komplett med platshållare och rimliga standardvärden.

### Kvalitetstestfall (utdatavalidering)

**Testfall 11 — QA-checklista-efterlevnad:** Kör 10 slumpmässiga uppgiftsbeskrivningar genom generatorn. Verifiera att 100 % av genererade promptar passerar alla 11 QA-punkter.

**Testfall 12 — Kopiera-och-kör-test:** Ta 5 genererade promptar, fyll i platshållare med testdata, och kör dem i ChatGPT, Claude och Gemini. Verifiera att alla tre modeller producerar svar som matchar det specificerade utdataformatet.

**Testfall 13 — Variant A vs. B-konsistens:** Generera samma uppgift som Variant A (enkel-prompt) och Variant B (system+user). Kör båda. Verifiera att resultaten är likvärdiga i kvalitet och format.

**Testfall 14 — Exemplens effekt:** Generera en prompt med och utan exempel för samma formatkritiska uppgift. Jämför output-konsistens. Verifiera att versionen med exempel ger mer konsekvent format.

### Adaptertestfall (kategorispecifik)

**Testfall 15 — Kodadapter fullständighet:** Verifiera att kodpromptens output inkluderar: körbar kod, felhantering, minst 2 tester, importer, körinstruktioner.

**Testfall 16 — Analysadapter osäkerhet:** Ge analysprompt data som saknar svar på en av frågorna. Verifiera att modellen markerar detta med [OSÄKERT] istället för att fabricera.

**Testfall 17 — Kreativ adapter konsistens:** Generera 3 kreativa promptar med samma genre men olika uppgifter. Verifiera att POV, pacing och genre-instruktioner är konsistenta men uppgiftsspecifika.

**Testfall 18 — Fallback-adapter robusthet:** Kör 5 uppgifter som inte passar någon specifik kategori. Verifiera att fallback-adaptern producerar strukturerade, användbara promptar.

### Regressionstestfall

**Testfall 19 — Versionsregression:** Spara 10 referenspromptar. Uppdatera generatorns principer. Generera samma 10 uppgifter. Verifiera att förbättringar inte har degraderat befintlig kvalitet.

**Testfall 20 — Säkerhetsregression:** Kör samtliga 5 typer av riskfyllda förfrågningar efter varje uppdatering. Verifiera att vägran och omdirigering fortfarande fungerar korrekt.

---

## 9. Källförteckning

### Primärkällor (officiell dokumentation)

**[P1] Anthropic — Prompt Engineering Documentation**
https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview
Täcker: XML-taggar, multishot-prompting, chain-of-thought, system prompts, long context tips, prompt templates, prompt generator, prompt improver, hallucineringsreduktion, Claude 4.x best practices. Kopplade principer: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13.

**[P2] OpenAI — Prompt Engineering Guide**
https://platform.openai.com/docs/guides/prompt-engineering
Täcker: Sex kärnstrategier (tydliga instruktioner, referenstext, uppdelning, tänketid, externa verktyg, systematisk testning), meddelanderoller, delimiter-rekommendationer. Kopplade principer: 1, 3, 5, 6, 8, 9, 10, 11.

**[P3] OpenAI — GPT-4.1 Prompting Guide**
https://cookbook.openai.com/examples/gpt4-1_prompting_guide
Täcker: Promptstrukturmall, agentmönster, long-context-hantering, instruktionstrohet, CoT-induktion. Kopplade principer: 1, 4, 6, 10.

**[P4] OpenAI — GPT-5 Prompting Guide**
https://cookbook.openai.com/examples/gpt-5/gpt-5_prompting_guide
Täcker: Hybridresonering, motstridighetshantering, meta-prompting, eagernesskontroll. Kopplade principer: 7, 11, 13.

**[P5] OpenAI — Prompt Generation Guide (Meta-prompts)**
https://platform.openai.com/docs/guides/prompt-generation
Täcker: Meta-promptregler, identitet, steg, exempel, formatering, konstanthantering. Kopplade principer: 2, 3, 9.

**[P6] Google — Gemini API Prompt Design Strategies**
https://ai.google.dev/gemini-api/docs/prompting-strategies
Täcker: Clear instructions, few-shot, prefixes, context, prompt iteration. Kopplade principer: 1, 3, 4, 9, 13.

**[P7] Google — Gemini 3 Prompting Guide (Vertex AI)**
https://docs.cloud.google.com/vertex-ai/generative-ai/docs/start/gemini-3-prompting-guide
Täcker: Direkta instruktioner, thinking levels, negativa begränsningar, persona-adherence, agentprompting. Kopplade principer: 4, 6, 7, 13.

**[P8] Google — Vertex AI Prompt Optimizer**
https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/prompt-optimizer
Täcker: Automatiserad promptoptimering (zero-shot, few-shot, datadriven), utvärderingsmetrik. Kopplad princip: 11.

**[P9] Microsoft — Prompt Engineering Techniques (Azure AI)**
https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/prompt-engineering
Täcker: Fem promptkomponenter (instruktioner, primärt innehåll, exempel, cue, stödjande innehåll), CoT, affordances, strukturerad output. Kopplade principer: 1, 3, 8, 9, 10.

**[P10] Microsoft — System Message Design (Azure AI)**
https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/advanced-prompt-engineering
Täcker: Meta-prompt-design, systemmeddelande-anatomi (roll, gränser, format, osäkerhetspolicy, verktyg), designchecklista. Kopplade principer: 7, 12.

**[P11] Microsoft — Safety System Message Templates**
https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/safety-system-message-templates
Täcker: Namngivna säkerhetstekniker (always/should, conditional/if, emphasis on harm, example-based, never/don't), mallar för hatiskt innehåll, ogrundade påståenden, jailbreak-försök. Kopplad princip: 12.

**[P12] Anthropic — Prompt Generator (blogg)**
https://www.anthropic.com/news/prompt-generator
Täcker: Meta-promptens arkitektur, hur Console-generatorn fungerar, planeringssteg, XML-spine. Kopplade principer: 1, 2, 3, 7.

**[P13] OpenAI — Evaluation Best Practices**
https://platform.openai.com/docs/guides/evaluation-best-practices
Täcker: Eval-arkitektur, dataset-design, graders, prompt optimizer, kontinuerlig utvärdering. Kopplad princip: 11.

### Sekundärkällor (kompletterande perspektiv)

**[S1] Claude Directory — /generate** *(sekundär)*
https://www.claudedirectory.co/generate
Kategoribaserad promptgenerering med minimal input (dropdown + fritext). Producerar JSON med title/description/content/howToUse. Använder `[PLACEHOLDER_NAME]`-format. Källa för UX-mönster i input- och outputmodellerna.

**[S2] Junia AI — Prompt Generator** *(sekundär)*
https://www.junia.ai/tools/prompt-generator
Det mest detaljerade strukturerade formuläret bland undersökta verktyg (12 fält). Källa för input-modellens avancerade fält och progressiv disclosure-mönster.

**[S3] PromptPerfect (Jina AI)** *(sekundär)*
https://promptperfect.jina.ai/
Optimeringsverktyg med side-by-side-jämförelse. Källa för iterativ förbättringsprincip och modellspecifik anpassning.

**[S4] "The Prompt Report: A Systematic Survey" — Schulhoff et al.** *(sekundär, akademisk)*
https://arxiv.org/abs/2406.06608
Systematisk genomgång av 58 LLM-prompttekniker med standardiserad terminologi. Källa för forskningsförankring av principer.

**[S5] DAIR.AI — Prompt Engineering Guide** *(sekundär)*
https://www.promptingguide.ai/
Community-driven sammanställning av prompttekniker. Källa för kompletterande perspektiv på CoT, few-shot och rolltilldelning.

---

*Denna blueprint uppfyller done-definitionen: den kan användas som specifikation för att bygga en promptgenerator som konsekvent producerar robusta, kopieringsklara promptar för breda användningsområden. Varje princip, designval och kvalitetskrav är spårbart till namngivna primär- eller sekundärkällor.*