// Languages: English (the texts in the code) and Dutch. T("text {0}", x) gives the text in the chosen language, with
// {0}, {1} filled in; a text without a translation stays English. The setting Language: "auto" (the browser's
// language), "en" or "nl".
var TEXTS_NL = {
    // overview
    "RegEx puzzles": "RegEx-puzzels",
    "RegEx puzzle {0}": "RegEx-puzzel {0}",
    "Learn": "Leren",
    "Lesson {0}": "Les {0}",
    "{0} of {1} done": "{0} van {1} klaar",
    "{0} of {1} solved": "{0} van {1} opgelost",
    "solved": "opgelost", "started": "begonnen", "new": "nieuw",
    "Solved": "Opgelost", "Started": "Begonnen", "New": "Nieuw",
    "Again: {0}": "Opnieuw: {0}",
    "Continue: {0}": "Verder: {0}",
    "Difficulty in its grid (1–5 stars, 6: extra hard)": "Moeilijkheid binnen het formaat (1–5 sterren, 6: extra moeilijk)",
    "Install as app": "Installeren als app",
    "Plays full screen and offline.": "Speelt schermvullend en offline.",
    "Install as app: tap Share, then Add to Home Screen.": "Installeren als app: tik op Deel, dan Zet op beginscherm.",
    "Installing as an app needs a secure (https) address. Use the browser menu's Add to Home screen for a shortcut.":
        "Installeren als app kan alleen via een beveiligd (https) adres. Gebruik Toevoegen aan startscherm in het browsermenu voor een snelkoppeling.",
    "Easy": "Makkelijk", "Medium": "Gemiddeld",
    "extra hard": "extra moeilijk",
    "difficulty {0} of 5": "moeilijkheid {0} van 5",
    "{0} in this grid": "{0} binnen dit formaat",
    // settings
    "Settings": "Instellingen",
    "Close": "Sluiten",
    "Language": "Taal",
    "Automatic follows the browser. The page loads again.": "Automatisch volgt de browser. De pagina wordt opnieuw geladen.",
    "Automatic": "Automatisch",
    "Colour groups and their backreferences": "Kleur groepen en hun terugverwijzingen",
    "(.)..\\1: the group and the \\1 that repeats it share a colour": "(.)..\\1: de groep en de \\1 die hem herhaalt krijgen dezelfde kleur",
    "Colour the alternatives": "Kleur de alternatieven",
    "(AB|C): AB and C in two colours, so you see what the bar splits": "(AB|C): AB en C in twee kleuren, zodat je ziet wat het streepje scheidt",
    "Always dark": "Altijd donker",
    "Dark colours also when the phone or computer is set to light": "Donkere kleuren, ook als de telefoon of computer op licht staat",
    "Keep Dark Reader off this site": "Dark Reader niet op deze site",
    "Check a letter when you leave its cell": "Controleer een letter als je zijn vakje verlaat",
    "A wrong letter turns red. Every wrong letter counts as a hint.": "Een foute letter wordt rood. Elke foute letter telt als hint.",
    "The site has its own dark colours. Takes effect when the page loads again.": "De site heeft eigen donkere kleuren. Werkt nadat de pagina opnieuw geladen is.",
    // puzzle page: toolbar, board, letters
    "Home": "Start", "Hint": "Hint", "Or": "Of", "Clear": "Wis", "Fit": "Passend", "Full": "Vol", "Exit": "Uit", "Setup": "Opties",
    "Colour the filled cells: green is right, red is wrong (Enter)": "Kleur de ingevulde vakjes: groen is goed, rood is fout (Enter)",
    "The next letter is added as an alternative (/)": "De volgende letter komt erbij als alternatief (/)",
    "Clear the selected cells (Backspace)": "Wis de geselecteerde vakjes (Backspace)",
    "Show the whole puzzle (pinch or scroll to zoom, drag the empty space to move)": "Toon de hele puzzel (knijp of scroll om te zoomen, sleep de lege ruimte om te verschuiven)",
    "Full screen": "Volledig scherm",
    "Leave full screen": "Volledig scherm uit",
    "Puzzle: select cells with the mouse, a finger or the arrow keys, type letters to fill them":
        "Puzzel: kies vakjes met de muis, een vinger of de pijltjestoetsen, typ letters om ze te vullen",
    "Turn the board (up: to the left)": "Draai het bord (omhoog: naar links)",
    "Turn the board": "Draai het bord",
    "Back to 0°": "Terug naar 0°",
    "Turn back to 0 degrees": "Terug naar 0 graden",
    "Letters": "Letters",
    "{0}/{1} lines": "{0}/{1} regels",
    "cell {0}: {1}": "vakje {0}: {1}",
    "empty": "leeg",
    // puzzle page: messages, hints, the end
    "{0} hint": "{0} hint", "{0} hints": "{0} hints", "no hints": "geen hints",
    "Next puzzle ▶": "Volgende puzzel ▶",
    "All solved ▶": "Alles opgelost ▶",
    "{0} letter is wrong": "{0} letter is fout",
    "{0} letters are wrong": "{0} letters zijn fout",
    "Hint: this regex alone decides the marked cell": "Hint: deze regex alleen bepaalt het gemarkeerde vakje",
    "Hint: these {0} regexes together decide the marked cell": "Hint: deze {0} regexen samen bepalen het gemarkeerde vakje",
    ", through the cell where they cross": ", via het vakje waar ze kruisen",
    ", through the cells where they cross": ", via de vakjes waar ze kruisen",
    "No wrong letters": "Geen foute letters",
    "{0} · hints used: {1}": "{0} · hints gebruikt: {1}",
    "Puzzle complete!": "Puzzel klaar!",
    "{0} cell is wrong": "{0} vakje is fout",
    "{0} cells are wrong": "{0} vakjes zijn fout",
    "No mistakes so far": "Nog geen fouten"
};

function Lang() {
    var chosen = Setting("Language");
    if (chosen == "en" || chosen == "nl")
        return chosen;
    var browser = (navigator.languages && navigator.languages[0]) || navigator.language || "";
    return browser.toLowerCase().indexOf("nl") == 0 ? "nl" : "en";
}

function T(text) {
    var result = (Lang() == "nl" && TEXTS_NL[text]) || text;
    for (var i = 1; i < arguments.length; ++i)
        result = result.split("{" + (i - 1) + "}").join(String(arguments[i]));
    return result;
}

// A field of a puzzle or lesson in the chosen language: "hint_nl" when Dutch and there is one, else "hint"
function Localized(obj, field) {
    return (Lang() == "nl" && obj[field + "_nl"]) || obj[field];
}

// The fixed texts of a page (button words, tooltips, labels for screen readers) in the chosen language
function TranslatePage() {
    document.documentElement.lang = Lang();
    var all = document.querySelectorAll("body *");
    for (var i = 0; i < all.length; ++i) {
        var el = all[i];
        if (el.childNodes.length == 1 && el.firstChild.nodeType == 3 && TEXTS_NL[el.textContent])
            el.textContent = T(el.textContent);
        ["title", "aria-label"].forEach(function (a) {
            var v = el.getAttribute(a);
            if (v && TEXTS_NL[v])
                el.setAttribute(a, T(v));
        });
    }
}

// Puzzle names as players read them: "7x7x7-medium-11" -> "7x7x7 Medium #11", "tutorial3" -> "Lesson 3"
function PrettyName(name) {
    var m = /^(.+)-(easy|medium)-(\d+)$/.exec(name);
    if (m)
        return m[1] + " " + T(m[2].charAt(0).toUpperCase() + m[2].slice(1)) + " #" + m[3];
    m = /^tutorial(\d+)$/.exec(name);
    if (m)
        return T("Lesson {0}", m[1]);
    return name;
}

// The number at the end of a puzzle name: "4x4-easy-10" -> "10"
function PuzzleNumber(name) {
    var m = /(\d+)$/.exec(name);
    return m ? m[1] : name;
}

// A puzzle's difficulty within its grid (1-5, "difficulty" in the puzzle; 6 for an extra hard one) as that many stars
function Stars(level) {
    return new Array(Math.max(0, Math.min(6, level | 0)) + 1).join("★");
}

// The difficulty in words: "difficulty 3 of 5", or "extra hard" for 6
function DifficultyText(level) {
    return level >= 6 ? T("extra hard") : T("difficulty {0} of 5", level);
}

// localStorage can be unavailable (private windows, blocked site data): reading and writing never throw
function Load(key) {
    try {
        return localStorage[key];
    } catch (e) {
        return undefined;
    }
}

function Save(key, value) {
    try {
        localStorage[key] = value;
    } catch (e) {
    }
}

// Settings: stored as SETTING<key> = "true"/"false" (or the chosen option of a list), shown in one panel (ShowSettings)
// on the overview and the puzzle page
var SETTINGS = [
    { key: "Language", label: "Language", note: "Automatic follows the browser. The page loads again.", def: "auto",
      options: [["auto", "Automatic"], ["en", "English"], ["nl", "Nederlands"]] },
    { key: "CheckOnLeave", label: "Check a letter when you leave its cell", note: "A wrong letter turns red. Every wrong letter counts as a hint.", def: true },
    { key: "ColorGroups", label: "Colour groups and their backreferences", note: "(.)..\\1: the group and the \\1 that repeats it share a colour", def: false },
    { key: "ColorAlternatives", label: "Colour the alternatives", note: "(AB|C): AB and C in two colours, so you see what the bar splits", def: false },
    { key: "AlwaysDark", label: "Always dark", note: "Dark colours also when the phone or computer is set to light", def: false },
    { key: "DarkReaderLock", label: "Keep Dark Reader off this site", note: "The site has its own dark colours. Takes effect when the page loads again.", def: true }
];

// Always dark at once (the head of each page applies both settings when it loads)
function ApplyAppearance() {
    document.documentElement.classList.toggle("dark", Setting("AlwaysDark"));
}

function Setting(key) {
    var value = Load("SETTING" + key), s = SETTINGS.filter(function (s) { return s.key == key; })[0];
    if (value === undefined || value === null)
        return s.def;
    return s.options ? value : value == "true";
}

// onChange(key, value) runs after a setting changed, so the page can redraw
function ShowSettings(onChange) {
    var panel = document.getElementById("Settings");
    if (!panel) {
        panel = document.createElement("dialog");
        panel.id = "Settings";
        panel.setAttribute("aria-labelledby", "SettingsTitle");
        var title = document.createElement("h2");
        title.id = "SettingsTitle";
        title.textContent = T("Settings");
        panel.appendChild(title);
        SETTINGS.forEach(function (s) {
            var row = document.createElement("label");
            row.className = "setting" + (s.options ? " choice" : "");
            var text = document.createElement("span");
            text.textContent = T(s.label);
            if (s.note) {
                var note = document.createElement("small");
                note.textContent = T(s.note);
                text.appendChild(note);
            }
            if (s.options) { // a list: the language; the page loads again in it
                var list = document.createElement("select");
                list.id = "SETTING" + s.key;
                s.options.forEach(function (o) {
                    var option = document.createElement("option");
                    option.value = o[0];
                    option.textContent = T(o[1]);
                    list.appendChild(option);
                });
                list.onchange = function () {
                    Save("SETTING" + s.key, list.value);
                    location.reload();
                };
                row.appendChild(text);
                row.appendChild(list);
            } else {
                var box = document.createElement("input");
                box.type = "checkbox";
                box.id = "SETTING" + s.key;
                box.onchange = function () {
                    Save("SETTING" + s.key, box.checked ? "true" : "false");
                    ApplyAppearance();
                    if (panel.onChange)
                        panel.onChange(s.key, box.checked);
                };
                row.appendChild(box);
                row.appendChild(text);
            }
            panel.appendChild(row);
        });
        var close = document.createElement("button");
        close.type = "button";
        close.className = "close";
        close.textContent = T("Close");
        close.onclick = function () { panel.close(); };
        panel.appendChild(close);
        panel.addEventListener("click", function (evt) { // a tap outside the panel closes it
            if (evt.target == panel)
                panel.close();
        });
        document.body.appendChild(panel);
    }
    panel.onChange = onChange;
    SETTINGS.forEach(function (s) {
        var el = document.getElementById("SETTING" + s.key);
        if (s.options)
            el.value = Setting(s.key);
        else
            el.checked = Setting(s.key);
    });
    if (panel.showModal)
        panel.showModal();
    else
        panel.setAttribute("open", "");
}

// The installed app works offline (sw.js). Service workers need a secure origin: HTTPS or localhost.
if ("serviceWorker" in navigator && window.isSecureContext)
    navigator.serviceWorker.register("sw.js").catch(function () { });

// Progress is saved under a puzzle's id (ids.json, "id" in the puzzle): the same puzzle keeps it when it gets another
// name or number, and another puzzle under an old name starts empty
var PuzzleIds = {};
function ProgressKey(name) {
    return PuzzleIds[name] || name;
}

function LoadPuzzleIds(done) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState != 4)
            return;
        try {
            if (xhr.status == 200)
                PuzzleIds = JSON.parse(xhr.responseText) || {};
        } catch (e) {
        }
        if (done)
            done();
    };
    xhr.open("GET", "puzzles/ids.json", true);
    xhr.send();
}

// Version 4: progress under ids. Earlier versions saved it under the puzzle names, which now mean other puzzles: that
// progress goes, the settings and the last puzzle stay.
(function () {
    try {
        if (localStorage["version"] == "4")
            return;
        for (var i = localStorage.length - 1; i >= 0; --i) {
            var key = localStorage.key(i);
            if (key.indexOf("SETTING") != 0 && key != "LastPuzzle")
                localStorage.removeItem(key);
        }
        localStorage["version"] = "4";
    } catch (e) {
    }
})();

// new / started / solved, from what the puzzle page saved
function PuzzleStatus(name) {
    var key = ProgressKey(name);
    if (Load(key + "DONE") == "true")
        return "solved";
    return Load(key + "STARTED") ? "started" : "new";
}

TranslatePage();
