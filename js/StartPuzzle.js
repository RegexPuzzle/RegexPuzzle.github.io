var FieldSize = 30;
var smallfontsize = 9;
var normalfontsize = 13;

var CellR = FieldSize / 2;
var Field = {};
var FieldRegexes = {};
var puzzlename = undefined;

var nextisor = false;

var rotation = 0;
var svgCenter = { x: 0, y: 0 };
var selectedCells = [];

function RotateField(degrees) {
    var oldrotation = rotation;
    rotation = (rotation + degrees) % 360;

    var transformation = "rotate(" + rotation + "," + svgCenter.x + "," + svgCenter.y + ")";
    document.getElementById("SVGGroup").setAttributeNS(null, "transform", transformation);

    var svg = document.getElementById("SVGGroup");
    for (var i = svg.childNodes.length - 1; i >= 0; --i) {
        if (svg.childNodes[i].iscelltext) {
            var cell = Field[svg.childNodes[i].cellid];
            var transformation = "rotate(" + -rotation + "," + cell.x + "," + cell.y + ")";
            svg.childNodes[i].setAttributeNS(null, "transform", transformation);
        }
    }

    /*
    TODO, animate?
<rect>
 <animateTransform attributeType="xml"
                    attributeName="transform"
                   type="rotate"
                   from="0 180 50"
                   to="360 180 50"
                   dur="1s"
                   repeatCount="indefinite"/>
</rect>
   */
}

function testField(costspoints) {
    SelectCell(null, false); //delelect all fields
    var done = true;
    for (var i in Field) {
        var cellcorrect = true;
        if (Field[i].user.length == 1 && Field[i].user != ".") {
            cellcorrect = Field[i].user && Field[i].user == Field[i].solution;
        } else if (Field[i].user.length > 1) {
            cellcorrect = false;
            for (var j = 0 ; j < Field[i].user.length; ++j)
                cellcorrect = cellcorrect || Field[i].user[j] == Field[i].solution;
        } else
            done = false;

        if (!cellcorrect) {
            document.getElementById("CELLTEXT" + i).style.fill = "red";
            document.getElementById("CELL" + i).style.fill = "#FFAAAA";
            done = false;
        }
    }
    if (done) {
        alert("<fireworks>Puzzle complete</fireworks>")
        localStorage[puzzlename + "DONE"] = true;
    }
};

function SetText(char) {
    for (var i = 0; i < selectedCells.length; ++i) {
        var cell = document.getElementById("CELLTEXT" + selectedCells[i]);
        var cellvalue = cell.childNodes[0].nodeValue;
        if (nextisor && cellvalue != ".") {
            Field[selectedCells[i]].user += char;
            cell.childNodes[0].nodeValue = cellvalue + "|" + char;
            cell.style.fill = "grey";
            cell.style["font-size"] = smallfontsize;
        } else {
            Field[selectedCells[i]].user = char;
            cell.childNodes[0].nodeValue = char;
            cell.style.fill = "black";
            cell.style["font-size"] = normalfontsize;
        }

        localStorage[puzzlename + selectedCells[i]] = Field[selectedCells[i]].user;
    }
    nextisor = false;
}

function SetNextOR() {
    nextisor = true;
}

var MouseIsDown = false;
var MouseDownCellId = null;

document.onkeydown = function (evt) {
    evt = evt || window.event;
    if (evt.keyCode == 13)
        testField(true);
    if (evt.keyCode == 191 || evt.keyCode == 220) // "\" || "/"
        nextisor = true;
    if (evt.keyCode == 8 || evt.keyCode == 46) { //backcpace or delete
        SetText('.');
        evt.preventDefault();
    }
    if (evt.keyCode >= 65 && evt.keyCode <= 90)
        SetText(String.fromCharCode(evt.keyCode));
};

function sqr(x) { return x * x; }

function MouseDown(item, evt) {
    MouseDownCellId = item.cellid;
    if (item.cellid)
       SelectCell(item.cellid, false, evt);
}

function MouseUp(item, evt) {
    if (item.cellid && MouseDownCellId) {
        SelectCellsbetween(MouseDownCellId, item.cellid);
    }
    MouseDownCellId = null;
}

//android start
document.getElementById("SVG").addEventListener("touchstart", function (evt) {
    MouseDown(document.elementFromPoint(evt.targetTouches[0].screenX, evt.targetTouches[0].screenY), evt);
}, false);

//webbrowsers start
document.getElementById("SVG").addEventListener("mousedown", function (evt) {
    MouseDown(evt.target, evt);
}, false);

//android start
document.getElementById("SVG").addEventListener("touchend", function (evt) {
    MouseUp(document.elementFromPoint(evt.changedTouches[0].screenX, evt.changedTouches[0].screenY), evt);
}, false);

//webbrowsers start
document.getElementById("SVG").addEventListener("mouseup", function (evt) {
    MouseUp(evt.target, evt);
}, false);

//Android app drag
document.getElementById("SVG").addEventListener('touchmove', function (evt) {
    OnMouseMove(document.elementFromPoint(evt.targetTouches[0].screenX, evt.targetTouches[0].screenY), evt);
}, false);

//chrome/firefox drag
function CellMouseMove(evt) {
    if (MouseIsDown === true)
        OnMouseMove(evt.target, evt);
}

function OnMouseMove(elem, evt) {
    SelectCellsbetween(MouseDownCellId, elem.cellid);
}

function SelectCellsbetween(startell, endcell) {
    SelectCell(startell, false);

    for (var regex in FieldRegexes) {
        var startcellIdx = -1;
        var endcellIdx = -1;
        for (var i = 0; i < FieldRegexes[regex].positions.length; ++i) {
            if (FieldRegexes[regex].positions[i] == startell)
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

//all browsers mouse down/up
document.body.addEventListener('mousedown', function () { MouseIsDown = true; }, true);
document.body.addEventListener('mouseup', function () { MouseIsDown = false;}, true);

function SelectCell(Cell, addtoselection, evt) {
    nextisor = false;
    if (evt)
        evt.preventDefault(); //also prevents scrolling of window on selecting cells in android
    var selinselection = false;
    for (var i = 0; i < selectedCells.length; ++i)
        selinselection = selinselection || selectedCells[i] == Cell;

    if (!addtoselection) {
        for (var i in Field)
            document.getElementById("CELL" + i).style.fill = "white";
        selectedCells = [];
    }
    if (!Cell)
        return;
    if (!selinselection)
        selectedCells.push(Cell);
    document.getElementById("CELL" + Cell).style.fill = "yellow";
}

function StartPuzzle(arr, Newpuzzlename) {
    Field = {};
    FieldRegexes = arr.regexes;
    rotation = 0;
    selectedCells = [];

    document.getElementById("Hint").innerHTML = arr.hint;

    var buttons = document.getElementById("Alphabet");
    for (var i = buttons.childNodes.length - 1; i >= 0; --i)
        buttons.removeChild(buttons.childNodes[i]);

    for (var i = 0; i < arr.Alphabet.length; ++i) {
        var btn = document.createElement("BUTTON");
        btn.onclick = function (evt) {
            SetText(evt.currentTarget.innerHTML);
        };

        var t = document.createTextNode(arr.Alphabet[i]);
        btn.appendChild(t);
        buttons.appendChild(btn);
    }

    document.getElementById("PuzzleName").innerHTML = Newpuzzlename;


    var svg = document.getElementById("SVG");
    for (var i = svg.childNodes.length - 1; i >= 0; --i)
        svg.removeChild(svg.childNodes[i]);

    puzzlename = Newpuzzlename;
    for (var i in arr.field) {
        Field[i] = {
            x: undefined,
            y: undefined,
            brothers: [],
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

    if (maxregexcount == 2) {
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

    if (maxregexcount == 3) {
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
        var item = Field[fieldpos];
        svgCenter.x += item.x;
        svgCenter.y += item.y;
        fieldsize++;
    }
    svgCenter.x = svgCenter.x / fieldsize;
    svgCenter.y = svgCenter.y / fieldsize;

    var svgNS = "http://www.w3.org/2000/svg";

    var SVGGroup = document.createElementNS(svgNS, "g");
    SVGGroup.setAttribute('id', 'SVGGroup');

    var out = "";
    for (var fieldpos in Field) {
        var item = Field[fieldpos];
        var Circle = document.createElementNS(svgNS, "circle");
        Circle.setAttributeNS(null, "id", "CELL" + fieldpos);
        Circle.setAttributeNS(null, "cx", item.x);
        Circle.setAttributeNS(null, "cy", item.y);
        Circle.setAttributeNS(null, "r", FieldSize / 2);
        Circle.setAttributeNS(null, "fill", "white");
        Circle.setAttributeNS(null, "stroke", "black");
        Circle.cellid = fieldpos;

        Circle.onmousemove = CellMouseMove;
        SVGGroup.appendChild(Circle);

        var Text = document.createElementNS(svgNS, "text");
        Text.setAttributeNS(null, "id", "CELLTEXT" + fieldpos);
        Text.setAttributeNS(null, "x", item.x);
        Text.setAttributeNS(null, "y", item.y);
        Text.setAttributeNS(null, "text-anchor", "middle");
        Text.setAttributeNS(null, "dominant-baseline", "central");

        Text.cellid = fieldpos;
        Text.iscelltext = true;

        Text.onmousemove = CellMouseMove;
        var NodeText = "";
        for (var i = 0; i < item.user.length; ++i)
            NodeText += item.user[i] + "|";
        NodeText = NodeText.substr(0, NodeText.length - 1);
        var textNode = document.createTextNode(NodeText);
        Text.appendChild(textNode);
        var TextNode = SVGGroup.appendChild(Text);
        if (item.user.length > 1) {
            TextNode.style.fill = "grey";
            TextNode.style["font-size"] = smallfontsize;
        }
    }

    document.getElementById("SVG").appendChild(SVGGroup);

    for (var i in arr.regexes) {
        var Positions = arr.regexes[i].positions;
        var p0 = { x: Field[Positions[0]].x, y: Field[Positions[0]].y };
        var p1 = { x: Field[Positions[1]].x, y: Field[Positions[1]].y };
        var startpos = {
            x: p0.x - (p1.x - p0.x) * 0.6,
            y: p0.y - (p1.y - p0.y) * 0.6,
        }
        var rotate = p0.y == p1.y ? 0 : p0.x == p1.x ? 90 : p1.y < p0.y ? 240 : -240;
        var transformation = "rotate(" + rotate + "," + startpos.x + "," + startpos.y + ")";

        var Text = document.createElementNS(svgNS, "text");
        Text.setAttributeNS(null, "id", "Regex" + i);
        Text.setAttributeNS(null, "x", startpos.x);
        Text.setAttributeNS(null, "y", startpos.y);
        Text.setAttributeNS(null, "text-anchor", "end");
        Text.setAttributeNS(null, "dominant-baseline", "central");
        Text.setAttributeNS(null, "transform", transformation);
        var textNode = document.createTextNode(arr.regexes[i].regex);
        Text.appendChild(textNode);
        SVGGroup.appendChild(Text);
    }
}