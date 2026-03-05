/** Minimal cookie: get/set; attached to window for page or other scripts */
(function () {
  function get(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + encodeURIComponent(name) + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  function set(name, value, days) {
    var s = encodeURIComponent(name) + '=' + encodeURIComponent(value) + '; path=/';
    if (days) s += '; max-age=' + (days * 86400);
    document.cookie = s;
  }
  window.getCookie = get;
  window.setCookie = set;
})();
