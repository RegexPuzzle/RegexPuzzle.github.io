var deviceType = (navigator.userAgent.match(/iPad/i)) == "iPad" ? "iPad" : (navigator.userAgent.match(/iPhone/i)) == "iPhone" ? "iPhone" : (navigator.userAgent.match(/Android/i)) == "Android" ? "Android" : (navigator.userAgent.match(/BlackBerry/i)) == "BlackBerry" ? "BlackBerry" : "null";

function DoPuzzle(puzzlename) {
    window.location = "index.html?v=27#" + puzzlename; // ?v=: a new version of the scripts, not the cached one
};

function Element(tag, className, text) {
    var el = document.createElement(tag);
    if (className)
        el.className = className;
    if (text !== undefined)
        el.textContent = text;
    return el;
}

// Level and name of each tutorial lesson (titles.json: {"tutorial1": ["Basics", "Letters and dots"], ...})
var Titles = {};

// The tutorial as a card of lessons: under each level its lessons, as buttons with number and name, coloured by status
function LessonCard(names) {
    var card = Element("section", "card lessons");
    var solved = 0;
    names.forEach(function (n) { solved += PuzzleStatus(n) == "solved"; });
    var head = Element("div", "card-head");
    head.appendChild(Element("h3", "", "Learn"));
    head.appendChild(Element("span", "card-count", solved + " of " + names.length + " done"));
    card.appendChild(head);
    var level = null, list = null;
    names.forEach(function (name) {
        var t = Titles[name] || ["", PrettyName(name)];
        if (t[0] != level || !list) {
            level = t[0];
            if (level)
                card.appendChild(Element("h4", "", level));
            list = Element("div", "lesson-list");
            card.appendChild(list);
        }
        var status = PuzzleStatus(name);
        var btn = Element("button", "lesson " + status);
        btn.type = "button";
        btn.appendChild(Element("span", "lesson-number", PuzzleNumber(name)));
        btn.appendChild(Element("span", "lesson-name", t[1]));
        btn.setAttribute("aria-label", "Lesson " + PuzzleNumber(name) + ", " + t[1] + ", " + status);
        btn.onclick = function () { DoPuzzle(name); };
        list.appendChild(btn);
    });
    return card;
}

// Difficulty 1-5 of each puzzle within its grid (difficulty.json, the same as "difficulty" in the puzzle files)
var Difficulty = {};

// One card per grid size: its puzzles as numbered buttons (easy to hard, as index.json lists them), coloured by
// status, with their difficulty as stars under the number
function Card(title, names) {
    var card = Element("section", "card");
    var solved = 0;
    for (var i = 0; i < names.length; ++i)
        solved += PuzzleStatus(names[i]) == "solved";
    var head = Element("div", "card-head");
    head.appendChild(Element("h3", "", title));
    head.appendChild(Element("span", "card-count", solved + " of " + names.length + " solved"));
    card.appendChild(head);
    var grid = Element("div", "numbers");
    names.forEach(function (name) {
        var status = PuzzleStatus(name);
        var btn = Element("button", "number " + status, PuzzleNumber(name));
        btn.type = "button";
        var level = Difficulty[name];
        btn.setAttribute("aria-label", PrettyName(name) + ", " + status + (level ? ", " + DifficultyText(level) : ""));
        btn.title = PrettyName(name) + (level ? " · " + DifficultyText(level) : "");
        if (level)
            btn.appendChild(Element("span", "stars", Stars(level)));
        btn.onclick = function () { DoPuzzle(name); };
        grid.appendChild(btn);
    });
    card.appendChild(grid);
    return card;
}

// Install as an app: the browser's own prompt where it has one (Chrome, Edge, Samsung Internet), otherwise how to do it
var installPrompt = null;
window.addEventListener("beforeinstallprompt", function (evt) {
    evt.preventDefault();
    installPrompt = evt;
    ShowInstall();
});
window.addEventListener("appinstalled", function () {
    installPrompt = null;
    ShowInstall();
});

function Installed() {
    return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

function ShowInstall() {
    var box = document.getElementById("Install");
    if (!box)
        return;
    while (box.firstChild)
        box.removeChild(box.firstChild);
    var ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (Installed()) {
        box.hidden = true;
        return;
    }
    box.hidden = false;
    if (installPrompt) {
        var btn = Element("button", "install", "Install as app");
        btn.type = "button";
        btn.onclick = function () {
            installPrompt.prompt();
            installPrompt.userChoice.then(function () { installPrompt = null; ShowInstall(); });
        };
        box.appendChild(btn);
        box.appendChild(Element("span", "", "Plays full screen and offline."));
    } else if (ios)
        box.appendChild(Element("span", "", "Install as app: tap Share, then Add to Home Screen."));
    else if (!window.isSecureContext)
        box.appendChild(Element("span", "", "Installing as an app needs a secure (https) address. Use the browser menu's Add to Home screen for a shortcut."));
    else
        box.hidden = true; // the browser may offer it later (beforeinstallprompt)
}

function Render(index) {
    var root = document.getElementById("Puzzles");
    while (root.firstChild)
        root.removeChild(root.firstChild);
    var header = Element("div", "page-head");
    header.appendChild(Element("h1", "", "RegEx puzzles"));
    var gear = Element("button", "settings-button", "⚙");
    gear.type = "button";
    gear.title = "Settings";
    gear.setAttribute("aria-label", "Settings");
    gear.onclick = function () { ShowSettings(null); };
    header.appendChild(gear);
    root.appendChild(header);
    var install = Element("div", "install-box");
    install.id = "Install";
    install.hidden = true;
    root.appendChild(install);
    ShowInstall();

    var last = Load("LastPuzzle");
    if (last) {
        var cont = Element("button", "continue");
        cont.type = "button";
        cont.appendChild(Element("span", "", (PuzzleStatus(last) == "solved" ? "Again: " : "Continue: ") + PrettyName(last)));
        cont.appendChild(Element("span", "", "▶"));
        cont.onclick = function () { DoPuzzle(last); };
        root.appendChild(cont);
    }

    var legend = Element("p", "legend");
    [["solved", "Solved"], ["started", "Started"], ["new", "New"]].forEach(function (s) {
        var item = Element("span", "");
        item.appendChild(Element("i", "swatch " + s[0]));
        item.appendChild(document.createTextNode(s[1]));
        legend.appendChild(item);
    });
    var scale = Element("span", "");
    scale.appendChild(Element("i", "stars", "★★★"));
    scale.appendChild(document.createTextNode("Difficulty in its grid (1–5 stars, 6: extra hard)"));
    legend.appendChild(scale);
    root.appendChild(legend);

    for (var group in index) {
        var section = Element("div", "group");
        if (!Array.isArray(index[group])) // a single card (Tutorial) is its own heading
            section.appendChild(Element("h2", "", group));
        var cards = Element("div", "cards");
        if (group == "Tutorial")
            cards.appendChild(LessonCard(index[group]));
        else if (Array.isArray(index[group]))
            cards.appendChild(Card(group, index[group]));
        else
            for (var grid in index[group])
                cards.appendChild(Card(grid, index[group][grid]));
        section.appendChild(cards);
        root.appendChild(section);
    }
}

// index.json, and difficulty.json (optional: without it the buttons have no stars)
function Fetch(file, done) {
    var xhr = new XMLHttpRequest();
    var url = "puzzles/" + file;
    if (deviceType == "Android" && location.protocol == "file:") // inside the Cordova app
        url = "file:///android_asset/www/" + url;
    xhr.onreadystatechange = function () {
        if (xhr.readyState != 4)
            return;
        var data = null;
        try {
            data = xhr.status == 200 ? JSON.parse(xhr.responseText) : null;
        } catch (e) {
        }
        done(data);
    };
    xhr.open("GET", url, true);
    xhr.send();
}

Fetch("difficulty.json", function (levels) {
    Difficulty = levels || {};
    Fetch("titles.json", function (titles) {
        Titles = titles || {};
        Fetch("index.json", function (index) {
            if (index)
                Render(index);
        });
    });
});
