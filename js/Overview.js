var deviceType = (navigator.userAgent.match(/iPad/i)) == "iPad" ? "iPad" : (navigator.userAgent.match(/iPhone/i)) == "iPhone" ? "iPhone" : (navigator.userAgent.match(/Android/i)) == "Android" ? "Android" : (navigator.userAgent.match(/BlackBerry/i)) == "BlackBerry" ? "BlackBerry" : "null";

function DoPuzzle(puzzlename) {
    window.location = "index.html#" + puzzlename;
};

function isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
}

function ProcessFilenames(obj, Panel, headersize) {

    if (obj.length) {
        for (var i = 0; i < obj.length; ++i) {
            var btn = document.createElement("BUTTON");
            btn.onclick = function (evt) {
                DoPuzzle(evt.currentTarget.innerHTML);
            };
            var t = document.createTextNode(obj[i]);
            btn.appendChild(t);
            if (localStorage[obj[i] + "DONE"] == "true")
                btn.style.backgroundColor = "green";
            Panel.appendChild(btn);
        }
    } else {
        for (var type in obj) {
            var subpanel = document.createElement("DIV");
            var subpaneltext = document.createElement("H" + headersize);
            subpaneltext.innerHTML = type + ":";
            subpanel.appendChild(subpaneltext);
            Panel.appendChild(subpanel);
            ProcessFilenames(obj[type], subpanel, headersize + 1);
        }
    }
}

var xmlhttp = new XMLHttpRequest();
var url = "FileNames.txt";
if (deviceType == "Android")
    url = "file:///android_asset/www/" + url;

xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        var myArr = JSON.parse(xmlhttp.responseText);
        ProcessFilenames(myArr, document.getElementById("Puzzles"), 2);
    }
}
xmlhttp.open("GET", url, true);
xmlhttp.send();

