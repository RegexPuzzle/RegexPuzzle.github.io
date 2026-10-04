// Puzzle names as players read them: "7x7x7-medium-11" -> "7x7x7 Medium #11", "tutorial3" -> "Tutorial 3"
function PrettyName(name) {
    var m = /^(.+)-(easy|medium)-(\d+)$/.exec(name);
    if (m)
        return m[1] + " " + m[2].charAt(0).toUpperCase() + m[2].slice(1) + " #" + m[3];
    m = /^tutorial(\d+)$/.exec(name);
    if (m)
        return "Tutorial " + m[1];
    return name;
}

// The number at the end of a puzzle name: "4x4-easy-10" -> "10"
function PuzzleNumber(name) {
    var m = /(\d+)$/.exec(name);
    return m ? m[1] : name;
}

// A puzzle's difficulty within its grid (1-5, "difficulty" in the puzzle) as that many stars
function Stars(level) {
    return new Array(Math.max(0, Math.min(5, level | 0)) + 1).join("★");
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

// Settings: stored as SETTING<key> = "true"/"false", shown in one panel (ShowSettings) on the overview and the puzzle page
var SETTINGS = [
    { key: "ColorGroups", label: "Colour groups and their backreferences", note: "(.)..\\1: the group and the \\1 that repeats it share a colour", def: false }
];

function Setting(key) {
    var value = Load("SETTING" + key);
    if (value === undefined || value === null)
        return SETTINGS.filter(function (s) { return s.key == key; })[0].def;
    return value == "true";
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
        title.textContent = "Settings";
        panel.appendChild(title);
        SETTINGS.forEach(function (s) {
            var row = document.createElement("label");
            row.className = "setting";
            var box = document.createElement("input");
            box.type = "checkbox";
            box.id = "SETTING" + s.key;
            box.onchange = function () {
                Save("SETTING" + s.key, box.checked ? "true" : "false");
                if (panel.onChange)
                    panel.onChange(s.key, box.checked);
            };
            var text = document.createElement("span");
            text.textContent = s.label;
            if (s.note) {
                var note = document.createElement("small");
                note.textContent = s.note;
                text.appendChild(note);
            }
            row.appendChild(box);
            row.appendChild(text);
            panel.appendChild(row);
        });
        var close = document.createElement("button");
        close.type = "button";
        close.className = "close";
        close.textContent = "Close";
        close.onclick = function () { panel.close(); };
        panel.appendChild(close);
        panel.addEventListener("click", function (evt) { // a tap outside the panel closes it
            if (evt.target == panel)
                panel.close();
        });
        document.body.appendChild(panel);
    }
    panel.onChange = onChange;
    SETTINGS.forEach(function (s) { document.getElementById("SETTING" + s.key).checked = Setting(s.key); });
    if (panel.showModal)
        panel.showModal();
    else
        panel.setAttribute("open", "");
}

// The installed app works offline (sw.js). Service workers need a secure origin: HTTPS or localhost.
if ("serviceWorker" in navigator && window.isSecureContext)
    navigator.serviceWorker.register("sw.js").catch(function () { });

// new / started / solved, from what the puzzle page saved
function PuzzleStatus(name) {
    if (Load(name + "DONE") == "true")
        return "solved";
    return Load(name + "STARTED") ? "started" : "new";
}
