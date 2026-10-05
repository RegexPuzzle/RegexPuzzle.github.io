var FieldSize = 30;
var smallfontsize = 9;
var normalfontsize = 13;

var CellR = FieldSize / 2;
var Field = {};
var FieldRegexes = {};
var Alphabet = [];
var puzzlename = undefined;

var nextisor = false;

var rotation = 0;
var svgCenter = { x: 0, y: 0 };
var selectedCells = [];

var svgNS = "http://www.w3.org/2000/svg";

function SetMessage(text, kind) {
    var el = document.getElementById("Message");
    el.textContent = text;
    el.className = kind || "";
}

function RotateField(degrees) {
    rotation = (rotation + degrees) % 360;

    var group = document.getElementById("SVGGroup");
    group.setAttributeNS(null, "transform", "rotate(" + rotation + "," + svgCenter.x + "," + svgCenter.y + ")");

    // keep the letters upright
    for (var i = group.childNodes.length - 1; i >= 0; --i) {
        if (group.childNodes[i].iscelltext) {
            var cell = Field[group.childNodes[i].cellid];
            group.childNodes[i].setAttributeNS(null, "transform", "rotate(" + -rotation + "," + cell.x + "," + cell.y + ")");
        }
    }
    OrientLabels();
    ComputeFitBox();
    // the board turns around its centre, which stays where it is on the screen: keep the view and its zoom
    // (Fit shows the whole board again)
    if (View)
        SetView(View, true);
    else
        FitView();
    SaveView();
    ShowRotation();
}

// The rotation slider at the right of the board: up turns the board to the left (as pushing up the right edge of a
// wheel), the middle is 0, in steps of 5 degrees (the arrow keys too); the number under it turns the board back to 0.
function Degrees(r) {
    return ((Math.round(r) % 360) + 540) % 360 - 180; // -180 .. 179
}

function ShowRotation() {
    var slider = document.getElementById("RotateSlider");
    var d = Degrees(rotation);
    if (document.activeElement != slider || Math.abs(Number(slider.value) + d) > 1)
        slider.value = -d;
    var label = document.getElementById("RotateValue");
    label.textContent = (d > 0 ? "+" : d < 0 ? "−" : "") + Math.abs(d) + "°";
}

function SetRotation(degrees) {
    RotateField(degrees - rotation);
}

(function () {
    var slider = document.getElementById("RotateSlider");
    slider.addEventListener("input", function () {
        SetRotation(-Number(slider.value));
    });
    document.getElementById("RotateValue").addEventListener("click", function () { SetRotation(0); });
})();

// The slider has the height of the board area
function PlaceRotateSlider() {
    var r = svgElement.getBoundingClientRect(), box = document.getElementById("RotateBox");
    box.style.top = Math.round(r.top) + "px";
    box.style.height = Math.round(r.height) + "px";
}

// A regex label reads along its line, from outside the board towards it, even when that puts it upside down on screen:
// turning it upright would make it read against the order of the cells (turn the board to read it instead).
function OrientLabels() {
    for (var i in FieldRegexes) {
        var label = document.getElementById("Regex" + i);
        if (!label)
            continue;
        label.setAttributeNS(null, "transform", "rotate(" + label.baseAngle + "," + label.anchorX + "," + label.anchorY + ")");
        UpdateLabelBackground(i);
    }
}

// The background of a regex label (shown for the selected cell's lines) has the label's size and turn
function UpdateLabelBackground(i) {
    var label = document.getElementById("Regex" + i), bg = document.getElementById("RegexBg" + i);
    if (!label || !bg)
        return;
    var box = label.getBBox(), pad = 3;
    bg.setAttributeNS(null, "x", box.x - pad);
    bg.setAttributeNS(null, "y", box.y - pad / 2);
    bg.setAttributeNS(null, "width", box.width + 2 * pad);
    bg.setAttributeNS(null, "height", box.height + pad);
    bg.setAttributeNS(null, "transform", label.getAttribute("transform"));
}

// Marks the regexes of the selected cell's lines (of the line all selected cells share, when several are selected)
var activeLines = {};
function MarkLines() {
    activeLines = {};
    for (var i in FieldRegexes) {
        var positions = FieldRegexes[i].positions;
        var all = selectedCells.length > 0;
        for (var j = 0; j < selectedCells.length && all; ++j)
            all = positions.indexOf(selectedCells[j]) >= 0;
        if (all)
            activeLines[i] = true;
        var label = document.getElementById("Regex" + i), bg = document.getElementById("RegexBg" + i);
        if (label)
            label.setAttributeNS(null, "class", (label.getAttribute("class") || "regex").replace(/ active/g, "") + (all ? " active" : ""));
        if (bg)
            bg.setAttributeNS(null, "class", "regexbg" + (all ? " active" : ""));
    }
}

// A letter key can be dragged onto a cell: letting go there fills that cell (and selects it). While dragging, the letter
// floats above the finger and the cell under it is outlined. A tap still fills the selected cells.
var draggedLetter = null;

function CellUnder(x, y) {
    var el = document.elementFromPoint(x, y);
    return el && el.cellid ? el.cellid : null;
}

function MakeLetterDraggable(btn) {
    var start = null, ghost = null, target = null;
    function Mark(cellid) {
        if (target)
            document.getElementById("CELL" + target).removeAttribute("data-drop");
        target = cellid;
        if (target)
            document.getElementById("CELL" + target).setAttribute("data-drop", "true");
    }
    function End() {
        Mark(null);
        if (ghost)
            ghost.parentNode.removeChild(ghost);
        ghost = null;
        start = null;
        setTimeout(function () { draggedLetter = null; }, 0); // after the click that follows a drag
    }
    btn.addEventListener("pointerdown", function (evt) {
        start = { x: evt.clientX, y: evt.clientY, id: evt.pointerId };
        try {
            btn.setPointerCapture(evt.pointerId);
        } catch (e) {
        }
    });
    btn.addEventListener("pointermove", function (evt) {
        if (!start || evt.pointerId != start.id)
            return;
        if (!ghost) {
            if (Math.hypot(evt.clientX - start.x, evt.clientY - start.y) < 10)
                return; // still a tap
            draggedLetter = btn.textContent;
            ghost = document.createElement("div");
            ghost.id = "DragLetter";
            ghost.textContent = draggedLetter;
            ghost.setAttribute("aria-hidden", "true");
            document.body.appendChild(ghost);
        }
        ghost.style.left = evt.clientX + "px";
        ghost.style.top = (evt.clientY - 56) + "px"; // above the finger, so it stays visible
        Mark(CellUnder(evt.clientX, evt.clientY));
        evt.preventDefault();
    });
    btn.addEventListener("pointerup", function (evt) {
        if (!start || evt.pointerId != start.id)
            return;
        var letter = ghost ? draggedLetter : null, cell = target;
        End();
        if (letter && cell) {
            SelectCell(cell, false);
            SetText(letter);
        } else if (!letter) { // a tap: browsers do not always send a click after a drag, so do not wait for it
            btn.tappedAt = Date.now();
            SetText(btn.textContent);
        }
    });
    btn.addEventListener("pointercancel", End);
}

// The letter buttons in even rows: one row for up to 8 letters, otherwise as few rows as needed of at most 8.
// On a phone held sideways (low and wide) the pad is a column at the right instead, so the board keeps the height.
var sidePad = window.matchMedia("(orientation: landscape) and (max-height: 540px)");
function SetLetterPad() {
    var pad = document.getElementById("Alphabet");
    var n = pad.children.length;
    document.body.classList.toggle("side-pad", sidePad.matches);
    if (sidePad.matches) {
        var rows = Math.max(1, Math.floor((window.innerHeight - 16) / 50)); // 44px keys and their gap
        var columns = Math.ceil(n / rows);
        pad.style.gridTemplateColumns = "repeat(" + columns + ", 52px)";
        document.body.style.setProperty("--pad-width", (columns * 58 + 16) + "px");
    } else {
        var rows = Math.ceil(n / 8);
        pad.style.gridTemplateColumns = "repeat(" + Math.ceil(n / rows) + ", minmax(0, 64px))";
    }
    pad.style.justifyContent = "center";
}

// Cell position on screen (after rotation), for the arrow keys
function ScreenPos(cellid) {
    var cell = Field[cellid];
    var a = rotation * Math.PI / 180;
    var dx = cell.x - svgCenter.x, dy = cell.y - svgCenter.y;
    return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
}

function MoveSelection(dirx, diry) {
    if (selectedCells.length == 0) {
        for (var first in Field) {
            SelectCell(first, false);
            return;
        }
    }
    var from = ScreenPos(selectedCells[selectedCells.length - 1]);
    var best = null, bestScore = Infinity;
    for (var id in Field) {
        var p = ScreenPos(id);
        var vx = p.x - from.x, vy = p.y - from.y;
        var along = vx * dirx + vy * diry;
        var across = Math.abs(vx * diry - vy * dirx);
        if (along < FieldSize / 4 || across > along) // only cells within 45 degrees of the arrow direction
            continue;
        var score = along + 2 * across;
        if (score < bestScore) {
            bestScore = score;
            best = id;
        }
    }
    if (best)
        SelectCell(best, false);
}

function CellText(cellid) {
    return Field[cellid].user.split("").join("|");
}

function DrawCell(cellid) {
    var item = Field[cellid];
    var text = document.getElementById("CELLTEXT" + cellid);
    text.textContent = CellText(cellid);
    text.setAttributeNS(null, "class", item.user.length > 1 ? "multi" : "");
    text.style["font-size"] = item.user.length > 1 ? smallfontsize : normalfontsize;
    var circle = document.getElementById("CELL" + cellid);
    circle.setAttributeNS(null, "aria-label", "cell " + cellid + ": " + (item.user == "." ? "empty" : CellText(cellid)));
}

// Progress, the finish, hints and the remembered view (proposals 7, 10 and 13 of the front-end review)
var hintMode = false;
var announceSolved = false; // only when the last line matches while playing, not when a solved puzzle is opened

function UpdateProgress(ok, total) {
    document.getElementById("ProgressText").textContent = ok + "/" + total + " lines";
    document.getElementById("ProgressBar").style.width = (total ? 100 * ok / total : 0) + "%";
}

// Time spent on a puzzle (<name>TIME, seconds): counts while the page is visible, until the puzzle is solved
setInterval(function () {
    if (puzzlename && document.visibilityState == "visible" && Load(puzzlename + "DONE") != "true")
        Save(puzzlename + "TIME", Number(Load(puzzlename + "TIME") || 0) + 1);
}, 1000);

function Duration(seconds) {
    var m = Math.floor(seconds / 60), s = seconds % 60;
    return m >= 60 ? Math.floor(m / 60) + ":" + ("0" + m % 60).slice(-2) + ":" + ("0" + s).slice(-2) : m + ":" + ("0" + s).slice(-2);
}

// The puzzle after this one in the overview's order that is not solved yet (callback gets null when all are)
function NextPuzzle(callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState != 4)
            return;
        var names = [];
        try {
            (function walk(node) {
                if (Array.isArray(node))
                    names.push.apply(names, node);
                else
                    for (var key in node)
                        walk(node[key]);
            })(JSON.parse(xhr.responseText));
        } catch (e) {
        }
        var at = names.indexOf(puzzlename);
        for (var k = 1; k < names.length; ++k) {
            var name = names[(at + k) % names.length];
            if (PuzzleStatus(name) != "solved")
                return callback(name);
        }
        callback(null);
    };
    xhr.open("GET", "puzzles/index.json", true);
    xhr.send();
}

// A wave of colour across the cells, from the top left of the screen
function Wave() {
    var cells = Object.keys(Field).map(function (id) { var p = ScreenPos(id); return { id: id, d: p.x + p.y }; });
    var min = Math.min.apply(null, cells.map(function (c) { return c.d; }));
    var max = Math.max.apply(null, cells.map(function (c) { return c.d; }));
    cells.forEach(function (c) {
        var el = document.getElementById("CELL" + c.id);
        el.style.animationDelay = Math.round(600 * (c.d - min) / Math.max(1, max - min)) + "ms";
        el.setAttribute("data-wave", "true");
    });
    setTimeout(function () {
        cells.forEach(function (c) { document.getElementById("CELL" + c.id).removeAttribute("data-wave"); });
    }, 1400);
}

// Every line matches: with a unique solution that is the solution
function Solved() {
    Save(puzzlename + "DONE", true);
    SetMessage("Solved", "done");
    if (!announceSolved)
        return;
    announceSolved = false;
    SelectCell(null, false);
    Wave();
    var hints = Number(Load(puzzlename + "HINTS") || 0), time = Number(Load(puzzlename + "TIME") || 0);
    var box = document.getElementById("Solved");
    box.innerHTML = "";
    var title = document.createElement("b");
    title.textContent = "Solved";
    box.appendChild(title);
    box.appendChild(document.createTextNode(PrettyName(puzzlename)));
    var facts = document.createElement("span");
    facts.className = "facts";
    facts.textContent = [time ? Duration(time) : "", hints ? hints + (hints == 1 ? " hint" : " hints") : "no hints"].filter(Boolean).join(" · ");
    box.appendChild(facts);
    var buttons = document.createElement("span");
    buttons.className = "actions";
    var close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    close.onclick = function () { box.hidden = true; };
    var next = document.createElement("button");
    next.type = "button";
    next.className = "next";
    next.textContent = "Next puzzle ▶";
    next.disabled = true;
    buttons.appendChild(close);
    buttons.appendChild(next);
    box.appendChild(buttons);
    NextPuzzle(function (name) {
        if (!name) {
            next.textContent = "All solved ▶";
            next.onclick = function () { gotomain(); };
        } else
            next.onclick = function () { box.hidden = true; window.location.hash = name; };
        next.disabled = false;
    });
    var solvedName = puzzlename;
    setTimeout(function () { // after the wave, unless another puzzle was opened meanwhile
        if (puzzlename != solvedName)
            return;
        box.hidden = false;
        next.focus({ preventScroll: true });
    }, 700);
    try {
        if (navigator.vibrate)
            navigator.vibrate([60, 40, 120]);
    } catch (e) {
    }
}

// Hint mode: filled cells are green when right and orange-red when wrong (not yellow: that is the selection); every time it is switched on counts as a hint
// With no wrong letters, it also marks the next solving step (the puzzle's "steps", docs/design-solve-steps.md): the
// first cell in that order that is not filled in correctly, and the regex (or regexes) that decide it from the cells
// before it. Typing a letter in that cell switches hint mode off (SetText); Hint again gives the next step.
var Steps = [];
var stepHint = null; // null, "pending" (wait for the wrong letters to be fixed), or a step

function ToggleHints() {
    hintMode = !hintMode;
    if (hintMode)
        Save(puzzlename + "HINTS", Number(Load(puzzlename + "HINTS") || 0) + 1);
    stepHint = hintMode && Steps.length ? "pending" : null;
    var button = document.getElementById("HintButton");
    button.className = "tool" + (hintMode ? " on" : "");
    button.setAttribute("aria-pressed", hintMode ? "true" : "false");
    ShowHints();
}

// A step of several regexes whose cell is not on all of them: they decide it through the cell(s) where they cross
// (the steps take the crossing cell itself when they can; docs/design-solve-steps.md)
function Through(step) {
    var off = step.lines.filter(function (l) { return FieldRegexes[l].positions.indexOf(step.cell) < 0; }).length;
    if (!off)
        return "";
    return step.lines.length == 2 ? ", through the cell where they cross" : ", through the cells where they cross";
}

function NextStep() {
    for (var i = 0; i < Steps.length; ++i)
        if (Field[Steps[i].cell] && Field[Steps[i].cell].user != Field[Steps[i].cell].solution)
            return Steps[i];
    return null;
}

function MarkStep(step) {
    var marked = document.querySelectorAll("#SVG [data-step]");
    for (var i = 0; i < marked.length; ++i)
        marked[i].removeAttribute("data-step");
    if (!step || typeof step != "object")
        return;
    document.getElementById("CELL" + step.cell).setAttribute("data-step", "true");
    step.lines.forEach(function (l) {
        var label = document.getElementById("Regex" + l), bg = document.getElementById("RegexBg" + l);
        if (label)
            label.setAttribute("data-step", "true");
        if (bg)
            bg.setAttribute("data-step", "true");
        UpdateLabelBackground(l);
    });
}

function ShowHints() {
    var wrong = 0;
    for (var id in Field) {
        var el = document.getElementById("CELL" + id), user = Field[id].user, solution = Field[id].solution;
        if (!hintMode || user == ".") {
            el.removeAttribute("data-hint");
            continue;
        }
        var good = user.length == 1 ? user == solution : user.indexOf(solution) >= 0; // with alternatives: still among them
        el.setAttribute("data-hint", good ? "good" : "bad");
        wrong += !good;
    }
    if (stepHint == "pending" && !wrong)
        stepHint = NextStep();
    else if (stepHint && typeof stepHint == "object" && Field[stepHint.cell].user == Field[stepHint.cell].solution)
        stepHint = null; // done: Hint again for the next one
    MarkStep(hintMode ? stepHint : null);
    if (hintMode) {
        var hints = Number(Load(puzzlename + "HINTS") || 0), text;
        if (wrong)
            text = wrong + (wrong == 1 ? " letter is wrong" : " letters are wrong");
        else if (stepHint && typeof stepHint == "object")
            text = stepHint.lines.length == 1 ? "Hint: this regex alone decides the marked cell"
                : "Hint: these " + stepHint.lines.length + " regexes together decide the marked cell" + Through(stepHint);
        else
            text = "No wrong letters";
        SetMessage(text + " · hints used: " + hints, wrong ? "wrong" : "");
    } else if (!document.getElementById("Message").classList.contains("done"))
        SetMessage("");
}

// Zoom, position and rotation per puzzle
var restoringView = false;
function SaveView() {
    if (!puzzlename || restoringView || !View)
        return;
    Save(puzzlename + "VIEW", JSON.stringify({ r: rotation, x: View.x, y: View.y, w: View.w }));
}

function RestoreView() {
    var saved = null;
    try {
        saved = JSON.parse(Load(puzzlename + "VIEW") || "null");
    } catch (e) {
    }
    if (!saved)
        return;
    restoringView = true;
    if (saved.r)
        RotateField(saved.r);
    SetView({ x: saved.x, y: saved.y, w: saved.w, h: 0 }, true); // as it was left, also a zoom set by turning
    restoringView = false;
}

// The regex as pieces of text, where a group that a backreference uses and its backreferences share a colour
// (g1..g5): [{ text, color }]. Groups are numbered as JavaScript numbers them: every "(" except "(?:".
function RegexPieces(regex) {
    function Scan(visit) {
        var inSet = false, stack = [], number = 0;
        for (var i = 0; i < regex.length; ++i) {
            var c = regex[i];
            if (c == "\\") {
                var m = /^\\(\d+)/.exec(regex.slice(i));
                if (m && !inSet) {
                    visit(i, m[0].length, "ref", Number(m[1]));
                    i += m[0].length - 1;
                } else {
                    visit(i, 2, "", 0);
                    ++i;
                }
            } else if (inSet) {
                inSet = c != "]";
                visit(i, 1, "", 0);
            } else if (c == "[") {
                inSet = true;
                visit(i, 1, "", 0);
            } else if (c == "(") {
                var plain = regex.substr(i + 1, 2) == "?:";
                stack.push(plain ? 0 : ++number);
                visit(i, plain ? 3 : 1, plain ? "" : "open", plain ? 0 : number);
                i += plain ? 2 : 0;
            } else if (c == ")") {
                var n = stack.pop() || 0;
                visit(i, 1, n ? "close" : "", n);
            } else
                visit(i, 1, "", 0);
        }
    }
    var colorOf = {}, colors = 0;
    Scan(function (at, length, kind, n) {
        if (kind == "ref" && !colorOf[n])
            colorOf[n] = "g" + (colors++ % 5 + 1);
    });
    var pieces = [];
    Scan(function (at, length, kind, n) {
        var color = kind && colorOf[n] ? colorOf[n] : "";
        var last = pieces[pieces.length - 1];
        if (last && last.color == color && !color)
            last.text += regex.substr(at, length);
        else
            pieces.push({ text: regex.substr(at, length), color: color });
    });
    return pieces;
}

function SetLabelText(label, prefix, regex) {
    while (label.firstChild)
        label.removeChild(label.firstChild);
    if (prefix)
        label.appendChild(document.createTextNode(prefix));
    if (!Setting("ColorGroups")) {
        label.appendChild(document.createTextNode(regex));
        return;
    }
    RegexPieces(regex).forEach(function (piece) {
        if (!piece.color) {
            label.appendChild(document.createTextNode(piece.text));
            return;
        }
        var span = document.createElementNS(svgNS, "tspan");
        span.setAttributeNS(null, "class", "group " + piece.color);
        span.textContent = piece.text;
        label.appendChild(span);
    });
}

// Full screen (no address bar or system bars), where the browser allows it: not on iPhones. Opening another puzzle
// keeps it (only the hash changes); going to the overview loads another page, which ends it.
function FullScreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function ToggleFullScreen() {
    var root = document.documentElement;
    try {
        if (FullScreenElement())
            (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else {
            var result = (root.requestFullscreen || root.webkitRequestFullscreen).call(root, { navigationUI: "hide" });
            if (result && result.catch)
                result.catch(function () { });
        }
    } catch (e) {
    }
}

function UpdateFullScreenButton() {
    var button = document.getElementById("FullScreenButton");
    var root = document.documentElement;
    button.hidden = !(document.fullscreenEnabled || document.webkitFullscreenEnabled) || !(root.requestFullscreen || root.webkitRequestFullscreen);
    var on = !!FullScreenElement();
    button.setAttribute("aria-label", on ? "Leave full screen" : "Full screen");
    button.querySelector("small").textContent = on ? "Exit" : "Full";
    button.title = on ? "Leave full screen" : "Full screen";
    button.setAttribute("aria-pressed", on ? "true" : "false");
}
document.addEventListener("fullscreenchange", UpdateFullScreenButton);
document.addEventListener("webkitfullscreenchange", UpdateFullScreenButton);
UpdateFullScreenButton();

// The settings panel; labels are drawn again when a setting changed
function OpenSettings() {
    ShowSettings(function () {
        for (var i in FieldRegexes) {
            var label = document.getElementById("Regex" + i);
            if (label)
                while (label.firstChild)
                    label.removeChild(label.firstChild); // CheckLines writes the text again
        }
        CheckLines();
    });
}

// A line that becomes wrong while playing flashes its label (not when a puzzle is opened)
var lineStatus = {};
function Flash(label) {
    label.classList.remove("flash");
    void label.getBBox(); // restart the animation
    label.classList.add("flash");
    try {
        if (navigator.vibrate)
            navigator.vibrate(40);
    } catch (e) {
    }
}

// Checks every line whose cells all hold one letter with JavaScript's regex engine, and marks its label
function CheckLines() {
    var ok = 0, total = 0;
    for (var i in FieldRegexes) {
        var line = FieldRegexes[i];
        var text = "";
        var complete = true;
        for (var j = 0; j < line.positions.length; ++j) {
            var user = Field[line.positions[j]].user;
            if (user.length != 1 || user == ".")
                complete = false;
            text += user;
        }
        var label = document.getElementById("Regex" + i);
        var status = "";
        if (complete) {
            try {
                status = new RegExp("^(?:" + line.regex + ")$").test(text) ? "ok" : "wrong";
            } catch (e) {
                status = "";
            }
        }
        if (lineStatus[i] !== status || !label.firstChild)
            SetLabelText(label, status == "ok" ? "✓ " : status == "wrong" ? "✗ " : "", line.regex);
        label.setAttributeNS(null, "class", "regex " + status + (activeLines[i] ? " active" : ""));
        if (status == "wrong" && lineStatus[i] !== undefined && lineStatus[i] != "wrong")
            Flash(label);
        lineStatus[i] = status;
        UpdateLabelBackground(i);
        total++;
        ok += status == "ok";
    }
    UpdateProgress(ok, total);
    if (total > 0 && ok == total)
        Solved();
    else if (document.getElementById("Message").classList.contains("done"))
        SetMessage(""); // a letter was changed after solving
}

function testField(costspoints) {
    SelectCell(null, false); //deselect all fields
    var done = true;
    var wrong = 0;
    for (var i in Field) {
        var user = Field[i].user;
        var cellcorrect = true;
        if (user.length == 1 && user != ".") {
            cellcorrect = user == Field[i].solution;
        } else if (user.length > 1) {
            cellcorrect = user.indexOf(Field[i].solution) >= 0; // the answer is still among the candidates
            done = false;
        } else
            done = false;

        document.getElementById("CELL" + i).setAttributeNS(null, "class", cellcorrect ? "cell" : "cell wrong");
        if (!cellcorrect) {
            wrong++;
            done = false;
        }
    }
    if (done) {
        SetMessage("Puzzle complete!", "done");
        localStorage[puzzlename + "DONE"] = true;
    } else if (costspoints)
        SetMessage(wrong ? wrong + (wrong == 1 ? " cell is wrong" : " cells are wrong") : "No mistakes so far", wrong ? "wrong" : "");
    return done;
};

function SetText(char) {
    if (char != "." && Alphabet.indexOf(char) < 0)
        return;
    for (var i = 0; i < selectedCells.length; ++i) {
        var cell = Field[selectedCells[i]];
        if (nextisor && cell.user != "." && char != ".") {
            if (cell.user.indexOf(char) < 0)
                cell.user += char;
        } else
            cell.user = char;
        Save(puzzlename + selectedCells[i], cell.user);
        Save(puzzlename + "STARTED", "1");
        document.getElementById("CELL" + selectedCells[i]).setAttributeNS(null, "class", "cell selected");
        DrawCell(selectedCells[i]);
    }
    nextisor = false;
    CheckLines();
    // a letter in the cell that the hint marked: the hint has done its job, so hint mode goes off (right or wrong)
    if (hintMode && char != "." && stepHint && typeof stepHint == "object" && selectedCells.indexOf(stepHint.cell) >= 0)
        ToggleHints();
    else if (hintMode)
        ShowHints();
}

function SetNextOR() {
    nextisor = true;
}

var MouseDownCellId = null;

document.onkeydown = function (evt) {
    if (evt.ctrlKey || evt.altKey || evt.metaKey)
        return;
    var key = evt.key;
    if ((key == "Enter" || key == " ") && evt.target && evt.target.tagName == "BUTTON")
        return; // a focused button: Enter and Space press it
    if (evt.target && evt.target.tagName == "INPUT")
        return; // the rotation slider uses the arrow keys itself
    var handled = true;
    if (key == "Enter")
        ToggleHints();
    else if (key == "/" || key == "\\" || key == "|")
        nextisor = true;
    else if (key == "Backspace" || key == "Delete" || key == " " || key == ".")
        SetText('.');
    else if (key == "ArrowLeft")
        MoveSelection(-1, 0);
    else if (key == "ArrowRight")
        MoveSelection(1, 0);
    else if (key == "ArrowUp")
        MoveSelection(0, -1);
    else if (key == "ArrowDown")
        MoveSelection(0, 1);
    else if (key && key.length == 1 && Alphabet.indexOf(key.toUpperCase()) >= 0)
        SetText(key.toUpperCase());
    else
        handled = false;
    if (handled)
        evt.preventDefault();
};

function CellAt(elem) {
    return elem && elem.cellid ? elem.cellid : null;
}

function MouseDown(elem, evt) {
    MouseDownCellId = CellAt(elem);
    if (MouseDownCellId) {
        evt.preventDefault(); // no page scrolling while selecting cells
        SelectCell(MouseDownCellId, false);
    }
}

function MouseMove(elem) {
    var cellid = CellAt(elem);
    if (MouseDownCellId && cellid)
        SelectCellsbetween(MouseDownCellId, cellid);
}

function MouseUp(elem) {
    MouseMove(elem);
    MouseDownCellId = null;
}

function TouchElement(touch) {
    return touch ? document.elementFromPoint(touch.clientX, touch.clientY) : null;
}

// Zoom and pan: the visible part of the drawing (the viewBox), always with the aspect ratio of the SVG element, so
// one SVG unit is View.w / width pixels everywhere. FitBox is the whole drawing at the current rotation.
var View = null;
var FitBox = null;
var MaxZoom = 8;

function SvgRect() {
    return svgElement.getBoundingClientRect();
}

// keepZoom (turning the board): v's width stays as it is, even where the turned drawing would allow another one
function SetView(v, keepZoom) {
    var r = SvgRect();
    var minW = FitBox.w / MaxZoom;
    var maxW = Math.max(FitBox.w, FitBox.h * r.width / r.height);
    var w = keepZoom ? v.w : Math.min(Math.max(v.w, minW), maxW);
    var h = w * r.height / r.width;
    // keep some of the drawing in view
    var x = Math.min(Math.max(v.x, FitBox.x - w / 2), FitBox.x + FitBox.w - w / 2);
    var y = Math.min(Math.max(v.y, FitBox.y - h / 2), FitBox.y + FitBox.h - h / 2);
    if (w >= maxW && !keepZoom) { // fully zoomed out: centred across, at the top (right below the toolbar; spare room is below)
        x = FitBox.x + (FitBox.w - w) / 2;
        y = FitBox.y;
    }
    View = { x: x, y: y, w: w, h: h };
    svgElement.setAttributeNS(null, "viewBox", x + " " + y + " " + w + " " + h);
    SaveView();
}

// The drawing point under a screen point, for view v
function ToSvg(v, clientX, clientY) {
    var r = SvgRect();
    var k = v.w / r.width;
    return { x: v.x + (clientX - r.left) * k, y: v.y + (clientY - r.top) * k };
}

// The view of width w that shows drawing point s at screen point (clientX, clientY)
function ViewWith(s, w, clientX, clientY) {
    var r = SvgRect();
    var k = w / r.width;
    return { x: s.x - (clientX - r.left) * k, y: s.y - (clientY - r.top) * k, w: w, h: w * r.height / r.width };
}

function FitView() {
    if (!FitBox)
        return;
    var r = SvgRect();
    var w = Math.max(FitBox.w, FitBox.h * r.width / r.height);
    SetView({ x: 0, y: 0, w: w, h: 0 });
}

// The SVG takes the height that is left below the toolbars
function SizeSvg() {
    var top = svgElement.getBoundingClientRect().top + window.scrollY;
    var pad = sidePad.matches ? 0 : document.getElementById("Alphabet").offsetHeight; // the letter pad is fixed at the bottom (or at the side)
    svgElement.style.height = Math.max(sidePad.matches ? 160 : 240, window.innerHeight - top - pad - 4) + "px";
    PlaceRotateSlider();
}

// Bounds of the drawing at the current rotation
function ComputeFitBox() {
    var group = document.getElementById("SVGGroup");
    if (!group)
        return;
    var box = group.getBBox();
    var a = rotation * Math.PI / 180;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    [[box.x, box.y], [box.x + box.width, box.y], [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]].forEach(function (c) {
        var dx = c[0] - svgCenter.x, dy = c[1] - svgCenter.y;
        var x = svgCenter.x + dx * Math.cos(a) - dy * Math.sin(a);
        var y = svgCenter.y + dx * Math.sin(a) + dy * Math.cos(a);
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    });
    var margin = 10;
    FitBox = { x: minX - margin, y: minY - margin, w: maxX - minX + 2 * margin, h: maxY - minY + 2 * margin };
}

window.addEventListener("resize", function () { SetLetterPad(); SizeSvg(); FitView(); });

// A pan (one pointer) or pinch (two) in progress: the drawing point under the centre of the pointers stays under it
var Gesture = null;

function GestureCenter(points) {
    var x = 0, y = 0;
    for (var i = 0; i < points.length; ++i) {
        x += points[i].clientX;
        y += points[i].clientY;
    }
    return { x: x / points.length, y: y / points.length };
}

function GestureDistance(points) {
    return points.length < 2 ? 0 : Math.hypot(points[0].clientX - points[1].clientX, points[0].clientY - points[1].clientY);
}

function StartGesture(points) {
    var c = GestureCenter(points);
    Gesture = { view: View, anchor: ToSvg(View, c.x, c.y), distance: GestureDistance(points), count: points.length };
}

function MoveGesture(points) {
    if (points.length != Gesture.count) { // a finger was added or lifted: continue from here
        StartGesture(points);
        return;
    }
    var c = GestureCenter(points);
    var w = Gesture.view.w;
    if (points.length >= 2 && Gesture.distance > 0)
        w = w * Gesture.distance / GestureDistance(points);
    SetView(ViewWith(Gesture.anchor, w, c.x, c.y));
}

function TouchList(list) {
    var result = [];
    for (var i = 0; i < list.length && i < 2; ++i)
        result.push(list[i]);
    return result;
}

var svgElement = document.getElementById("SVG");
svgElement.addEventListener("touchstart", function (evt) {
    if (evt.touches.length >= 2 || (!Gesture && !CellAt(TouchElement(evt.touches[0])))) {
        MouseDownCellId = null; // a second finger: zoom instead of selecting
        StartGesture(TouchList(evt.touches));
        evt.preventDefault();
    } else if (!Gesture)
        MouseDown(TouchElement(evt.targetTouches[0]), evt);
}, { passive: false });
svgElement.addEventListener("touchmove", function (evt) {
    if (Gesture)
        MoveGesture(TouchList(evt.touches));
    else
        MouseMove(TouchElement(evt.targetTouches[0]));
    evt.preventDefault();
}, { passive: false });
svgElement.addEventListener("touchend", function (evt) {
    if (Gesture) {
        if (evt.touches.length == 0)
            Gesture = null;
        else
            StartGesture(TouchList(evt.touches));
    } else
        MouseUp(TouchElement(evt.changedTouches[0]));
}, false);
svgElement.addEventListener("touchcancel", function () { Gesture = null; MouseDownCellId = null; }, false);
svgElement.addEventListener("mousedown", function (evt) {
    if (CellAt(evt.target))
        MouseDown(evt.target, evt);
    else if (evt.button == 0 && View) { // drag the empty space: pan
        StartGesture([evt]);
        evt.preventDefault();
    }
}, false);
svgElement.addEventListener("mousemove", function (evt) {
    if (Gesture)
        MoveGesture([evt]);
    else if (evt.buttons & 1)
        MouseMove(evt.target);
}, false);
document.addEventListener("mouseup", function (evt) {
    if (Gesture)
        Gesture = null;
    else
        MouseUp(evt.target);
}, false);
svgElement.addEventListener("wheel", function (evt) { // zoom around the mouse
    if (!View)
        return;
    var s = ToSvg(View, evt.clientX, evt.clientY);
    SetView(ViewWith(s, View.w * Math.exp(evt.deltaY * 0.0015), evt.clientX, evt.clientY));
    evt.preventDefault();
}, { passive: false });

function SelectCellsbetween(startcell, endcell) {
    SelectCell(startcell, false);

    for (var regex in FieldRegexes) {
        var startcellIdx = -1;
        var endcellIdx = -1;
        for (var i = 0; i < FieldRegexes[regex].positions.length; ++i) {
            if (FieldRegexes[regex].positions[i] == startcell)
                startcellIdx = i;
            if (FieldRegexes[regex].positions[i] == endcell)
                endcellIdx = i;
        }
        if (startcellIdx >= 0 && endcellIdx >= 0) {
            for (var i = Math.min(startcellIdx, endcellIdx); i <= Math.max(startcellIdx, endcellIdx); ++i) {
                SelectCell(FieldRegexes[regex].positions[i], true);
            }
        }
    }
}

function SelectCell(Cell, addtoselection) {
    nextisor = false;
    if (!addtoselection) {
        for (var i in Field)
            document.getElementById("CELL" + i).setAttributeNS(null, "class", "cell");
        selectedCells = [];
    }
    if (!Cell) {
        MarkLines();
        return;
    }
    if (selectedCells.indexOf(Cell) < 0)
        selectedCells.push(Cell);
    var circle = document.getElementById("CELL" + Cell);
    circle.setAttributeNS(null, "class", "cell selected");
    if (!addtoselection && circle.focus)
        circle.focus({ preventScroll: true });
    MarkLines();
}

function StartPuzzle(arr, Newpuzzlename) {
    Field = {};
    FieldRegexes = arr.regexes;
    Alphabet = arr.Alphabet;
    rotation = 0;
    ShowRotation();
    selectedCells = [];
    hintMode = false;
    announceSolved = false;
    lineStatus = {};
    Steps = arr.steps || [];
    stepHint = null;
    document.getElementById("HintButton").className = "tool";
    document.getElementById("Solved").hidden = true;
    SetMessage("");

    // a tutorial lesson: its level and explanation in a card above the board
    var hint = document.getElementById("Hint");
    hint.textContent = "";
    if (arr.hint) {
        if (arr.level)
            hint.appendChild(document.createElement("b")).textContent = arr.level;
        hint.appendChild(document.createTextNode(arr.hint));
    }

    var buttons = document.getElementById("Alphabet");
    while (buttons.firstChild)
        buttons.removeChild(buttons.firstChild);

    var letters = arr.Alphabet.slice().sort(); // the file's order is the order the generator met them: show A to Z
    for (var i = 0; i < letters.length; ++i) {
        var btn = document.createElement("BUTTON");
        btn.type = "button";
        btn.textContent = letters[i];
        btn.onclick = function (evt) { // keyboard (Enter, Space); a tap or drag is handled on pointerup
            if (draggedLetter || evt.currentTarget.tappedAt > Date.now() - 600)
                return;
            SetText(evt.currentTarget.textContent);
        };
        MakeLetterDraggable(btn);
        buttons.appendChild(btn);
    }
    SetLetterPad();

    document.getElementById("PuzzleName").textContent = arr.title ? "Lesson " + PuzzleNumber(Newpuzzlename) + " · " + arr.title : PrettyName(Newpuzzlename);
    var stars = document.getElementById("PuzzleStars");
    stars.textContent = arr.difficulty ? Stars(arr.difficulty) : "";
    stars.title = arr.difficulty ? "Difficulty " + arr.difficulty + " of 5 in this grid" : "";
    stars.setAttribute("aria-label", stars.title);
    document.title = "RegEx puzzle " + Newpuzzlename;

    var svg = document.getElementById("SVG");
    while (svg.firstChild)
        svg.removeChild(svg.firstChild);

    puzzlename = Newpuzzlename;
    for (var i in arr.field) {
        Field[i] = {
            x: undefined,
            y: undefined,
            regexes: [],
            solution: arr.field[i],
            user: localStorage[puzzlename + i] || '.',
            positioned: false
        };
    }

    for (var i in arr.regexes) {
        var Positions = arr.regexes[i].positions;
        for (var index = 0; index < Positions.length; ++index)
            Field[Positions[index]].regexes.push(arr.regexes[i]);
    }

    var maxregexcount = 0;
    for (var i in Field)
        maxregexcount = Math.max(maxregexcount, Field[i].regexes.length);

    if (maxregexcount == 2) { // square grid
        var regexnr = 0;
        for (var i in arr.regexes) {
            var Positions = arr.regexes[i].positions;
            for (var index = 0; index < Positions.length; ++index) {
                var fieldpos = Field[Positions[index]];
                if (!fieldpos.positioned) {
                    fieldpos.positioned = true;
                    fieldpos.x = 450 - (Positions.length / 2) * FieldSize + (index * FieldSize);
                    fieldpos.y = 250 + regexnr * FieldSize;
                }
            }
            regexnr++;
        }
    }

    if (maxregexcount == 3) { // hexagonal grid
        var regexnr = 0;
        for (var i in arr.regexes) {
            var Positions = arr.regexes[i].positions;
            for (var index = 0; index < Positions.length; ++index) {
                var fieldpos = Field[Positions[index]];
                if (!fieldpos.positioned) {
                    fieldpos.positioned = true;
                    fieldpos.x = 450 - (Positions.length / 2) * FieldSize + (index * FieldSize);
                    fieldpos.y = 200 + regexnr * Math.sqrt((FieldSize * FieldSize) - (FieldSize / 2 * FieldSize / 2)) + FieldSize;
                }
            }
            regexnr++;
        }
    }

    var fieldsize = 0;
    svgCenter = { x: 0, y: 0 };
    for (var fieldpos in Field) {
        svgCenter.x += Field[fieldpos].x;
        svgCenter.y += Field[fieldpos].y;
        fieldsize++;
    }
    svgCenter.x = svgCenter.x / fieldsize;
    svgCenter.y = svgCenter.y / fieldsize;

    var SVGGroup = document.createElementNS(svgNS, "g");
    SVGGroup.setAttribute('id', 'SVGGroup');

    for (var fieldpos in Field) {
        var item = Field[fieldpos];
        var Circle;
        if (maxregexcount == 3) { // hexagonal grid: hexagons that share their edges
            Circle = document.createElementNS(svgNS, "polygon");
            var R = FieldSize / Math.sqrt(3), points = [];
            for (var k = 0; k < 6; ++k) {
                var a = Math.PI / 3 * k + Math.PI / 6;
                points.push((item.x + R * Math.cos(a)).toFixed(2) + "," + (item.y + R * Math.sin(a)).toFixed(2));
            }
            Circle.setAttributeNS(null, "points", points.join(" "));
        } else { // square grid: squares that share their edges
            Circle = document.createElementNS(svgNS, "rect");
            Circle.setAttributeNS(null, "x", item.x - FieldSize / 2);
            Circle.setAttributeNS(null, "y", item.y - FieldSize / 2);
            Circle.setAttributeNS(null, "width", FieldSize);
            Circle.setAttributeNS(null, "height", FieldSize);
        }
        Circle.setAttributeNS(null, "id", "CELL" + fieldpos);
        Circle.setAttributeNS(null, "class", "cell");
        Circle.setAttributeNS(null, "role", "gridcell");
        Circle.setAttributeNS(null, "tabindex", "-1");
        Circle.cellid = fieldpos;
        SVGGroup.appendChild(Circle);

        var Text = document.createElementNS(svgNS, "text");
        Text.setAttributeNS(null, "id", "CELLTEXT" + fieldpos);
        Text.setAttributeNS(null, "x", item.x);
        Text.setAttributeNS(null, "y", item.y);
        Text.setAttributeNS(null, "text-anchor", "middle");
        Text.setAttributeNS(null, "dominant-baseline", "central");
        Text.setAttributeNS(null, "aria-hidden", "true");
        Text.cellid = fieldpos;
        Text.iscelltext = true;
        SVGGroup.appendChild(Text);
    }

    for (var i in arr.regexes) {
        var Positions = arr.regexes[i].positions;
        var p0 = { x: Field[Positions[0]].x, y: Field[Positions[0]].y };
        var p1 = { x: Field[Positions[1]].x, y: Field[Positions[1]].y };
        var startpos = {
            x: p0.x - (p1.x - p0.x) * 0.6,
            y: p0.y - (p1.y - p0.y) * 0.6,
        }
        var rotate = p0.y == p1.y ? 0 : p0.x == p1.x ? 90 : p1.y < p0.y ? 240 : -240;

        var Bg = document.createElementNS(svgNS, "rect");
        Bg.setAttributeNS(null, "id", "RegexBg" + i);
        Bg.setAttributeNS(null, "class", "regexbg");
        Bg.setAttributeNS(null, "rx", 3);
        SVGGroup.appendChild(Bg);

        var Text = document.createElementNS(svgNS, "text");
        Text.setAttributeNS(null, "id", "Regex" + i);
        Text.setAttributeNS(null, "x", startpos.x);
        Text.setAttributeNS(null, "y", startpos.y);
        Text.setAttributeNS(null, "text-anchor", "end");
        Text.setAttributeNS(null, "dominant-baseline", "central");
        Text.baseAngle = rotate;
        Text.anchorX = startpos.x;
        Text.anchorY = startpos.y;
        Text.textContent = arr.regexes[i].regex;
        SVGGroup.appendChild(Text);
    }

    svg.appendChild(SVGGroup);
    activeLines = {};
    OrientLabels();
    for (var fieldpos in Field)
        DrawCell(fieldpos);
    CheckLines();

    // Fit the drawing into the space below the toolbars, or show it as it was left
    SizeSvg();
    ComputeFitBox();
    restoringView = true;
    FitView();
    restoringView = false;
    RestoreView();
    announceSolved = true;
}
