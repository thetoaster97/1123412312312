(function main() {
  if (!document.body) { setTimeout(main, 100); return; }
  if (window.location.origin !== 'https://disneyworld.disney.go.com') {
    alert('Open this on disneyworld.disney.go.com first, then tap the bookmark.');
    return;
  }

  document.close();

  var style = document.createElement('style');
  style.textContent = '*{box-sizing:border-box;margin:0;padding:0}'
    + 'body{background:#08080e;color:#ddd;font-family:monospace;padding:16px;min-height:100vh}'
    + 'h1{color:#00d4ff;font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;margin-bottom:4px}'
    + '.badge{display:inline-block;font-size:.65rem;padding:2px 9px;border-radius:8px;margin-bottom:16px}'
    + '.ok{background:rgba(46,213,115,.15);color:#2ed573;border:1px solid #2ed57333}'
    + '.no{background:rgba(255,71,87,.15);color:#ff4757;border:1px solid #ff475733}'
    + 'label{display:block;font-size:.6rem;color:#555;text-transform:uppercase;letter-spacing:.1em;margin:12px 0 4px}'
    + 'select,input{width:100%;background:#0e0e1c;border:1px solid #2a2a3a;border-radius:6px;color:#e8e8f0;padding:11px 12px;font-family:monospace;font-size:14px;outline:none}'
    + 'button{width:100%;margin-top:16px;padding:14px;border-radius:6px;border:1px solid #00d4ff33;background:rgba(0,212,255,.1);color:#00d4ff;cursor:pointer;font-family:monospace;font-size:15px;font-weight:bold}'
    + '#res{margin-top:14px;background:#050510;border:1px solid #1e1e2e;border-radius:6px;padding:12px;font-size:12px;white-space:pre-wrap;word-break:break-all;line-height:1.7;color:#555;min-height:40px;display:none}';
  document.head.appendChild(style);

  function ga() {
    var t = document.cookie.split(';').map(function(c){return c.trim();}).find(function(c){return c.startsWith('TPR-WDW-LBJS.WEB-PROD.token=');});
    if (!t) return null;
    try {
      var raw = decodeURIComponent(t.split('=').slice(1).join('='));
      var jwt = raw.split('|').pop();
      if (!jwt || !jwt.startsWith('eyJ')) return null;
      var s = document.cookie.split(';').map(function(c){return c.trim();}).find(function(c){return c.startsWith('SWID=');});
      var swid = s ? s.split('=').slice(1).join('=').replace(/[{}]/g,'') : '';
      return {j: jwt, w: swid};
    } catch(e) { return null; }
  }

  var auth = ga();

  document.body.innerHTML = '';

  var h1 = document.createElement('h1'); h1.textContent = '⚡ Guest Test'; document.body.appendChild(h1);
  var badge = document.createElement('div');
  badge.className = 'badge ' + (auth ? 'ok' : 'no');
  badge.textContent = auth ? '✓ logged in' : '✗ not logged in';
  document.body.appendChild(badge);

  var l1 = document.createElement('label'); l1.textContent = 'Park'; document.body.appendChild(l1);
  var sel = document.createElement('select'); sel.id = 'pk';
  [['80007944','Magic Kingdom'],['80007838','EPCOT'],['80007998','Hollywood Studios'],['80007823','Animal Kingdom']].forEach(function(o){
    var opt = document.createElement('option'); opt.value = o[0]; opt.textContent = o[1]; sel.appendChild(opt);
  });
  document.body.appendChild(sel);

  var l2 = document.createElement('label'); l2.textContent = 'Facility ID (optional)'; document.body.appendChild(l2);
  var fid = document.createElement('input'); fid.placeholder = 'e.g. 80010176'; document.body.appendChild(fid);

  var btn = document.createElement('button'); btn.textContent = 'Fetch Guests'; document.body.appendChild(btn);
  var res = document.createElement('div'); res.id = 'res'; document.body.appendChild(res);

  btn.onclick = async function() {
    var a = ga();
    res.style.display = 'block';
    if (!a) { res.textContent = 'Not logged in'; res.style.color = '#ff4757'; return; }
    res.style.color = '#aaa'; res.textContent = 'Loading...';
    var today = new Date().toISOString().split('T')[0];
    var isAndroid = navigator.userAgent.toLowerCase().includes('android');
    try {
      var r = await fetch('https://disneyworld.disney.go.com/ea-vas/planning/api/v1/experiences/guest/guests', {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'en-US',
          'Authorization': 'BEARER ' + a.j,
          'Content-Type': 'application/json',
          'x-user-id': a.w,
          'x-app-id': isAndroid ? 'ANDROID' : 'IOS'
        },
        body: JSON.stringify({date: today, facilityId: fid.value.trim() || null, parkId: sel.value}),
        referrer: '', credentials: 'omit', cache: 'no-store'
      });
      var txt = await r.text();
      var d; try { d = JSON.parse(txt); } catch(e) { d = txt; }
      if (r.status === 200) {
        var g = d.guests || [], ig = d.ineligibleGuests || [], out = '[200] OK\n\nEligible (' + g.length + '):';
        for (var i = 0; i < g.length; i++) out += '\n  ' + g[i].firstName + ' ' + g[i].lastName + (g[i].primary ? ' *' : '') + '\n  ' + g[i].id;
        if (ig.length) { out += '\n\nIneligible (' + ig.length + '):'; for (var j = 0; j < ig.length; j++) out += '\n  ' + ig[j].firstName + ' ' + ig[j].lastName; }
        res.style.color = '#2ed573'; res.textContent = out;
      } else {
        res.style.color = '#ff4757';
        res.textContent = '[' + r.status + ']\n' + (typeof d === 'string' ? d : JSON.stringify(d, null, 2));
      }
    } catch(e) { res.style.color = '#ff4757'; res.textContent = 'Error: ' + e.message; }
  };
})();
