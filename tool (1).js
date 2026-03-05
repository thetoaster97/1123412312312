(function(){
if(document.getElementById('_llt')){document.getElementById('_llt').remove();return;}

function getAuth(){
  var tc=document.cookie.split(';').map(function(c){return c.trim();}).find(function(c){return c.startsWith('TPR-WDW-LBJS.WEB-PROD.token=');});
  if(!tc)return null;
  try{
    var raw=decodeURIComponent(tc.split('=').slice(1).join('='));
    var jwt=raw.split('|').pop();
    if(!jwt||!jwt.startsWith('eyJ'))return null;
    var sc=document.cookie.split(';').map(function(c){return c.trim();}).find(function(c){return c.startsWith('SWID=');});
    var swid=sc?sc.split('=').slice(1).join('=').replace(/[{}]/g,''):'';
    return {accessToken:jwt,swid:swid};
  }catch(e){return null;}
}

async function api(method,path,body){
  var a=getAuth();
  if(!a)return{s:0,d:'No auth cookie'};
  var headers={'Accept-Language':'en-US','Authorization':'BEARER '+a.accessToken,'x-user-id':a.swid};
  if(body)headers['Content-Type']='application/json';
  try{
    var r=await fetch('https://disneyworld.disney.go.com'+path,{method:method,headers:headers,body:body?JSON.stringify(body):undefined,referrer:'',credentials:'omit',cache:'no-store'});
    var ct=r.headers.get('content-type')||'';
    var d=ct.includes('application/json')?await r.json():await r.text();
    return{s:r.status,d:d};
  }catch(e){return{s:0,d:e.message};}
}

var auth=getAuth();
var st=document.createElement('style');
st.textContent='#_llt{position:fixed;top:20px;right:20px;width:380px;max-height:75vh;overflow-y:auto;background:#08080e;border:1px solid #00d4ff44;border-radius:10px;padding:14px;z-index:2147483647;font-family:monospace;font-size:12px;color:#ddd;box-shadow:0 20px 60px rgba(0,0,0,.9)}'
+'#_llt *{box-sizing:border-box}'
+'#_llt .ttl{color:#00d4ff;font-size:.7rem;letter-spacing:.2em;text-transform:uppercase}'
+'#_llt .ok{margin-left:8px;font-size:.6rem;padding:1px 7px;border-radius:8px;background:rgba(46,213,115,.15);color:#2ed573;border:1px solid #2ed57333}'
+'#_llt .no{margin-left:8px;font-size:.6rem;padding:1px 7px;border-radius:8px;background:rgba(255,71,87,.15);color:#ff4757;border:1px solid #ff475733}'
+'#_llt select{width:100%;background:#0e0e1c;border:1px solid #2a2a3a;border-radius:4px;color:#e8e8f0;padding:5px 8px;font-family:monospace;font-size:11px;margin:8px 0;outline:none}'
+'#_llt .go{padding:6px 16px;border-radius:4px;border:1px solid #00d4ff33;background:rgba(0,212,255,.1);color:#00d4ff;cursor:pointer;font-family:monospace;font-size:11px}'
+'#_llt .go:hover{background:rgba(0,212,255,.2)}'
+'#_llt .cls{float:right;background:none;border:none;color:#555;cursor:pointer;font-size:14px;line-height:1;padding:0}'
+'#_llt .cls:hover{color:#ff4757}'
+'#_llt .res{margin-top:10px;background:#050510;border:1px solid #1e1e2e;border-radius:5px;padding:8px;font-size:11px;white-space:pre-wrap;word-break:break-all;max-height:260px;overflow-y:auto;line-height:1.6;color:#555}'
+'#_llt .rok{color:#2ed573}#_llt .rerr{color:#ff4757}';
document.head.appendChild(st);

var ov=document.createElement('div');
ov.id='_llt';
ov.innerHTML='<button class="cls" id="_cx">✕</button>'
+'<span class="ttl">⚡ Guest Test</span>'
+'<span class="'+(auth?'ok':'no')+'">'+(auth?'✓ logged in':'✗ not logged in')+'</span>'
+'<select id="_pk"><option value="80007944">Magic Kingdom</option><option value="80007838">EPCOT</option><option value="80007998">Hollywood Studios</option><option value="80007823">Animal Kingdom</option></select>'
+'<button class="go" id="_go">Fetch Guests</button>'
+'<div id="_res" class="res" style="display:none"></div>';
document.body.appendChild(ov);
document.getElementById('_cx').onclick=function(){ov.remove();};

document.getElementById('_go').onclick=async function(){
  var el=document.getElementById('_res');
  el.style.display='block';el.className='res';el.textContent='Loading...';
  var pk=document.getElementById('_pk').value;
  var today=new Date().toISOString().split('T')[0];
  var res=await api('POST','/ea-vas/planning/api/v1/experiences/guest/guests',{date:today,facilityId:null,parkId:pk});
  if(res.s===200){
    var g=res.d.guests||[],ig=res.d.ineligibleGuests||[];
    var txt='[200] OK\n\nEligible ('+g.length+'):\n';
    for(var i=0;i<g.length;i++)txt+='  '+g[i].firstName+' '+g[i].lastName+(g[i].primary?' *':'')+': '+g[i].id+'\n';
    if(ig.length){txt+='\nIneligible ('+ig.length+'):\n';for(var j=0;j<ig.length;j++)txt+='  '+ig[j].firstName+' '+ig[j].lastName+'\n';}
    el.className='res rok';el.textContent=txt;
  }else{
    el.className='res rerr';el.textContent='['+res.s+'] FAILED\n'+(typeof res.d==='string'?res.d:JSON.stringify(res.d,null,2));
  }
};
})();
