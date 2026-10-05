// Offline use of the installed app: the pages, scripts and every puzzle are cached when the app is installed.
// Network first, so a new version (and new puzzles) arrive when online; the cache answers when offline. Requests are
// matched without their query (?v=N), so the cached copy serves any version link.
var CACHE = "regex-puzzles-19"; // raise when puzzles or files are added: installed apps then fetch the full set again
var SHELL = [
    "Overview.html", "index.html", "css/index.css",
    "js/names.js", "js/Overview.js", "js/index.js", "js/StartPuzzle.js",
    "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png",
    "puzzles/index.json", "puzzles/difficulty.json", "puzzles/titles.json", "puzzles/ids.json"
];

// all puzzle names in index.json (nested: group -> grid -> names, or group -> names)
function PuzzleNames(index) {
    var names = [];
    (function walk(node) {
        if (Array.isArray(node))
            names.push.apply(names, node);
        else
            for (var key in node)
                walk(node[key]);
    })(index);
    return names;
}

self.addEventListener("install", function (event) {
    event.waitUntil(caches.open(CACHE).then(function (cache) {
        return cache.addAll(SHELL).then(function () {
            return fetch("puzzles/index.json").then(function (res) { return res.json(); }).then(function (index) {
                return cache.addAll(PuzzleNames(index).map(function (name) { return "puzzles/" + name + ".json"; }));
            });
        });
    }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (event) {
    event.waitUntil(caches.keys().then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k != CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (event) {
    var req = event.request;
    if (req.method != "GET" || new URL(req.url).origin != self.location.origin)
        return;
    event.respondWith(fetch(req).then(function (res) {
        if (res.ok) {
            var copy = res.clone();
            caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
        }
        return res;
    }).catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (hit) {
            return hit || caches.match("Overview.html", { ignoreSearch: true });
        });
    }));
});
