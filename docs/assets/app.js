/*
 * The Journey - download page.
 *
 * The download button itself never changes: it points at GitHub's stable
 * "latest release asset" URL, so a new release is picked up automatically.
 *
 * This script only decorates the page with the current version number and
 * release date, read from GitHub's public API. If anything fails (offline,
 * rate limit, blocked network) the page keeps working: the download button
 * stays exactly as it is and the version line quietly disappears.
 */
(function () {
  'use strict';

  var REPO = 'Tony-Devv/The-Journey-App';
  var ASSET = 'The-Journey.apk';
  var API = 'https://api.github.com/repos/' + REPO + '/releases/latest';

  var verEl = document.getElementById('ver');
  var relEl = document.getElementById('released');
  var dlEl = document.getElementById('dl');
  var metaEl = document.getElementById('meta');

  // Belt and braces: keep the canonical permanent URL on the button.
  var stableURL = 'https://github.com/' + REPO + '/releases/latest/download/' + ASSET;
  if (dlEl) dlEl.href = stableURL;

  // Arabic page: Egyptian colloquial units, Latin digits (how devs read them).
  function size(bytes) {
    if (!bytes || bytes < 0) return '';
    var mb = bytes / (1024 * 1024);
    return (mb >= 100 ? mb.toFixed(0) : mb.toFixed(1)) + ' ميجا';
  }

  function date(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    var months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function clearMeta() {
    if (!metaEl) return;
    metaEl.innerHTML = '';
  }

  function fail() {
    // Never show an error state to someone trying to install the app.
    clearMeta();
  }

  if (typeof fetch !== 'function') { fail(); return; }

  var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var timer = controller ? setTimeout(function () { controller.abort(); }, 6000) : null;

  fetch(API, {
    headers: { Accept: 'application/vnd.github+json' },
    signal: controller ? controller.signal : undefined
  })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (data) {
      if (timer) clearTimeout(timer);

      var tag = (data.tag_name || '').replace(/^v/, '');
      var assets = data.assets || [];
      var apk = null;
      for (var i = 0; i < assets.length; i++) {
        if (assets[i].name === ASSET) { apk = assets[i]; break; }
      }

      // Deliberately no longer swapping the href to the versioned URL.
      // The button keeps pointing at /releases/latest/download/, which always
      // serves the newest APK. A shared or bookmarked page must not freeze on
      // whichever version happened to be current when it was rendered.

      var parts = [];
      if (tag) parts.push('v' + tag);
      if (apk) parts.push(size(apk.size));
      var when = date(data.published_at);
      if (when) parts.push(when);

      if (verEl && parts.length) {
        verEl.textContent = parts.join('  ·  ');
      } else {
        clearMeta();
      }

      if (relEl && tag) {
        relEl.textContent = 'الرحلة v' + tag;
      }
    })
    .catch(function () {
      if (timer) clearTimeout(timer);
      fail();
    });
})();