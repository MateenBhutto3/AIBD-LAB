// Root "/" language redirect: saved preference → browser language → English.
// Uses relative URLs so it works at a domain root and under a sub-path (GitHub Pages).
(function () {
  var lang = null;
  try { lang = localStorage.getItem('aibd-lang'); } catch (e) { /* storage unavailable */ }
  if (lang !== 'en' && lang !== 'zh') {
    var prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    lang = 'en';
    for (var i = 0; i < prefs.length; i++) {
      var p = String(prefs[i]).toLowerCase();
      if (p.indexOf('zh') === 0) { lang = 'zh'; break; }
      if (p.indexOf('en') === 0) { lang = 'en'; break; }
    }
  }
  location.replace(lang + '/' + location.search + location.hash);
})();
