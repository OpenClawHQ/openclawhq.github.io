/**
 * OpentheClaw landing page: OS option hover details
 */
(function () {
  function initOsDetails() {
    const pills = document.querySelectorAll('.pill-code');
    const details = document.getElementById('os-details');
    if (!pills.length || !details) return;

    const templates = {
      mac: [
        '<strong>macOS</strong> · For people who live in Finder and Safari/Chrome.',
        'Open Finder, then double‑click <code>mac/Click-default-OpenClaw.command</code>. It starts the SSH tunnel and opens your configured Web UI in your default browser.',
        'You can also run it from Terminal if you prefer:',
        '<pre><code><span class="sh-kwd">cd</span> <span class="sh-path">opentheclaw</span>\n<span class="sh-cmd">mac/Click-default-OpenClaw.command</span></code></pre>'
      ].join('<br>'),
      linux: [
        '<strong>Linux</strong> · Works from your terminal or file manager.',
        'In a terminal, run <code>linux/OpenClaw-linux.sh</code>, or double‑click the script in your file manager and choose "Run". As soon as the tunnel is ready, your Web UI opens on <code>http://127.0.0.1:&lt;local_port&gt;/</code>.',
        'Typical terminal usage:',
        '<pre><code><span class="sh-kwd">cd</span> <span class="sh-path">opentheclaw</span>\n<span class="sh-kwd">bash</span> <span class="sh-cmd">linux/OpenClaw-linux.sh</span></code></pre>'
      ].join('<br>'),
      windows: [
        '<strong>Windows</strong> · One BAT file you can put on your desktop.',
        'In Explorer, double‑click <code>windows/OpenClaw-windows.bat</code>. It starts the SSH tunnel using Python and then launches your browser to the configured URL.',
        'You can also pin it or call it from <code>cmd</code>:',
        '<pre><code><span class="sh-kwd">cd</span> <span class="sh-path">opentheclaw</span>\n<span class="sh-cmd">windows\\OpenClaw-windows.bat</span></code></pre>'
      ].join('<br>')
    };

    function setActive(os, target) {
      pills.forEach(function (p) { p.classList.remove('os-active'); });
      if (target) target.classList.add('os-active');
      details.innerHTML = templates[os] || '';
      details.classList.add('visible');
    }

    pills.forEach(function (pill) {
      pill.addEventListener('mouseenter', function () {
        var os = pill.getAttribute('data-os');
        setActive(os, pill);
      });
    });

    var pillRow = document.getElementById('os-pill');
    if (pillRow) {
      pillRow.addEventListener('mouseleave', function () {
        pills.forEach(function (p) { p.classList.remove('os-active'); });
        details.classList.remove('visible');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOsDetails);
  } else {
    initOsDetails();
  }
})();
