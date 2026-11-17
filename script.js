/* ===== GestPeças — Vanilla JS + Supabase (Auth + Postgres + RLS) ===== */
'use strict';
const $=q=>document.querySelector(q);
const IC={"phone":"<rect width=\"14\" height=\"20\" x=\"5\" y=\"2\" rx=\"2\" ry=\"2\"/><path d=\"M12 18h.01\"/>","dashboard":"<rect width=\"7\" height=\"9\" x=\"3\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"5\" x=\"14\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"9\" x=\"14\" y=\"12\" rx=\"1\"/><rect width=\"7\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\"/>","clipboard":"<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\"/><path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\"/><path d=\"M12 11h4\"/><path d=\"M12 16h4\"/><path d=\"M8 11h.01\"/><path d=\"M8 16h.01\"/>","cpu":"<rect width=\"16\" height=\"16\" x=\"4\" y=\"4\" rx=\"2\"/><rect width=\"6\" height=\"6\" x=\"9\" y=\"9\" rx=\"1\"/><path d=\"M15 2v2\"/><path d=\"M15 20v2\"/><path d=\"M2 15h2\"/><path d=\"M2 9h2\"/><path d=\"M20 15h2\"/><path d=\"M20 9h2\"/><path d=\"M9 2v2\"/><path d=\"M9 20v2\"/>","undo":"<path d=\"M9 14 4 9l5-5\"/><path d=\"M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11\"/>","circle-check":"<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m9 12 2 2 4-4\"/>","check":"<path d=\"M20 6 9 17l-5-5\"/>","wrench":"<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z\"/>","book":"<path d=\"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z\"/><path d=\"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z\"/>","factory":"<path d=\"M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z\"/><path d=\"M17 18h1\"/><path d=\"M12 18h1\"/><path d=\"M7 18h1\"/>","warehouse":"<path d=\"M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z\"/><path d=\"M6 18h12\"/><path d=\"M6 14h12\"/><rect width=\"12\" height=\"12\" x=\"6\" y=\"10\"/>","swap":"<path d=\"M8 3 4 7l4 4\"/><path d=\"M4 7h16\"/><path d=\"m16 21 4-4-4-4\"/><path d=\"M20 17H4\"/>","history":"<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\"/><path d=\"M3 3v5h5\"/><path d=\"M12 7v5l4 2\"/>","file":"<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\"/><path d=\"M14 2v4a2 2 0 0 0 2 2h4\"/><path d=\"M10 9H8\"/><path d=\"M16 13H8\"/><path d=\"M16 17H8\"/>","users":"<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"/>","eye":"<path d=\"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>","refresh":"<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\"/><path d=\"M21 3v5h-5\"/><path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\"/><path d=\"M8 16H3v5\"/>","receipt":"<path d=\"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z\"/><path d=\"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8\"/><path d=\"M12 17.5v-11\"/>","banknote":"<rect width=\"20\" height=\"12\" x=\"2\" y=\"6\" rx=\"2\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><path d=\"M6 12h.01M18 12h.01\"/>","truck":"<path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\"/><path d=\"M15 18H9\"/><path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14\"/><circle cx=\"17\" cy=\"18\" r=\"2\"/><circle cx=\"7\" cy=\"18\" r=\"2\"/>","download":"<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><path d=\"m7 10 5 5 5-5\"/><path d=\"M12 15V3\"/>","package":"<path d=\"m7.5 4.27 9 5.15\"/><path d=\"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z\"/><path d=\"m3.3 7 8.7 5 8.7-5\"/><path d=\"M12 22V12\"/>","clock":"<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 6v6l4 2\"/>","gamepad":"<line x1='6' x2='10' y1='11' y2='11'/><line x1='8' x2='8' y1='9' y2='13'/><line x1='15' x2='15.01' y1='12' y2='12'/><line x1='18' x2='18.01' y1='10' y2='10'/><path d='M17.32 5H6.68a4 4 0 0 0-3.978 3.59C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258A4 4 0 0 0 17.32 5z'/>"};
Object.assign(IC,{"shield":'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',"activity":'<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',"database":'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',"bug":'<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>'});
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IC[n]||''}</svg>`;
const brl=v=>(+v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const dt=t=>new Date(t).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const toast=m=>{const t=$('#t');t.textContent=m;t.className='on';setTimeout(()=>t.className='',3600)};
const nm=x=>x.prod+' '+x.model,sum=(a,f)=>a.reduce((t,x)=>t+f(x),0);
const CE=0,TS=['Aguardando OK da loja de origem','Aguardando aprovação do admin','Concluída','Rejeitada'];
let sb,me=null,booting=true,tab='dash',H={q:'',s:'',a:'',b:''};
let S={cu:[],st:[],sup:[],cat:[],orders:[],units:[],hist:[],tr:[],users:[],mn:[],supv:[],tc:[],cr:[],gr:[]};
const sn=id=>(S.st.find(s=>s.id===id)||{}).name||'—';
const LJ=()=>S.st.filter(s=>s.kind==='loja'),lopt=()=>LJ().map(s=>[s.id,s.name]);
const supOpt=()=>S.sup.map(s=>[s.id,s.name+(s.company?' ('+s.company+')':'')]);
const inStock=u=>u.status==='Em estoque da unidade';
const cAv=u=>u.loc===CE&&['Recebida','Devolvida','Disponível'].includes(u.status);
const inM=u=>['Aguardando manutenção','Em manutenção'].includes(u.status);

/* ---------- Acesso ao banco (toda regra de verdade está no Postgres) ---------- */
async function rpc(fn,a){const{data,error}=await sb.rpc(fn,a||{});if(error){const x=new Error(error.message);x.fn=fn;x.code=error.code;throw x}return data}
const ok=r=>{if(r.error){const x=new Error(r.error.message);x.code=r.error.code;throw x}return r.data};
const dbx=async q=>{const{error}=await q;if(error){const x=new Error(error.code==='23505'?'Já existe um cadastro igual.':error.message);x.code=error.code;throw x}};
async function all(q,pages=50){let out=[];for(let i=0;i<pages;i++){const d=ok(await q().range(i*1000,i*1000+999));out=out.concat(d);if(d.length<1000)break}return out}
/* Erros viram aviso na tela e também vão para a aba "Erros do sistema" (só o dev lê). */
const EL={seen:{},n:0};
function logErr(e,src){try{
 if(!sb||!me)return;const msg=String(e&&e.message||e||'').slice(0,500);
 if(!msg||/ResizeObserver|^Script error/i.test(msg)||EL.n>=20)return;
 const k=((e&&e.fn)||'')+'|'+msg,now=Date.now();if(EL.seen[k]&&now-EL.seen[k]<30000)return;EL.seen[k]=now;EL.n++;
 const code=String(e&&e.code||'');
 sb.rpc('log_client_error',{p_level:code==='P0001'?'aviso':'erro',p_source:src||(e&&e.fn?'rpc':'js'),p_fn:(e&&e.fn)||'',p_code:code,p_message:msg,p_page:tab,p_extra:{v:typeof APP_V==='string'?APP_V:'',ua:navigator.userAgent.slice(0,120)}}).then(()=>{},()=>{})
}catch(_){}}
const terr=(e,src)=>{toast(e.message||String(e));logErr(e,src)};
addEventListener('error',ev=>logErr(ev.error||new Error(ev.message),'js'));
addEventListener('unhandledrejection',ev=>logErr(ev.reason||new Error('Promise rejeitada'),'js'));
const run=async f=>{try{await f();await load();render()}catch(e){terr(e)}};
async function load(){
 const[st,cat,o,u,h,tr,mn,sv]=await Promise.all([sb.from('stores').select('*').order('id'),sb.from('catalog_view').select('*').order('name'),
  all(()=>sb.from('orders').select('*').order('created_at',{ascending:false}).order('id')),all(()=>sb.from('units').select('*').order('id')),
  all(()=>sb.from('history').select('*').order('at',{ascending:false}).order('id',{ascending:false}),3),
  sb.from('transfers').select('*').order('created_at',{ascending:false}),
  all(()=>sb.from('maintenances').select('*').order('created_at',{ascending:false}).order('id',{ascending:false})),sb.from('suppliers_view').select('*').order('name')]);
 S.st=ok(st);S.cat=ok(cat);S.supv=sv.error?[]:sv.data;
 S.mn=mn.map(x=>({id:x.id,store:x.store_id,os:x.os_number,cu:x.customer,sv:x.service,unit:x.unit_id,part:x.part_used,ch:+x.charged,pc:+x.part_cost,tech:x.technician,pf:+x.profit,by:x.created_by_name,t:Date.parse(x.created_at)}));
 S.tr=ok(tr).map(x=>({id:x.id,from:x.from_store,to:x.to_store,pn:x.part_label,qty:x.qty,by:x.requested_by_name,t:Date.parse(x.created_at),status:x.status,okBy:x.ok_by_name,obs:x.note}));
 S.orders=o.map(x=>({id:x.id,store:x.store_id,prod:x.part_name,model:x.model,qty:x.qty,sup:x.supplier_name||'',price:+x.price,est:+x.est,obs:x.note,user:x.created_by_name,t:Date.parse(x.created_at),status:x.status,buyT:x.buy_at&&Date.parse(x.buy_at),buyer:x.buyer_name}));
 S.units=u.map(x=>({id:x.id,order:x.order_id,prod:x.part_name,model:x.model,status:x.status,loc:x.loc_store_id,org:x.origin_store_id,cost:+x.cost}));
 S.hist=h.map(x=>({t:Date.parse(x.at),u:x.user_name,sid:x.store_id,rid:x.related_store_id,unid:sn(x.store_id),prod:x.part,qtd:x.qty,tipo:x.kind,de:x.from_status,para:x.to_status,ref:x.ref,forn:x.supplier}));
 {const r=await sb.rpc('central_units');S.cuErr=!!r.error;S.cu=r.error?[]:(r.data||[]).map(x=>({id:x.id,order:x.order_id,prod:x.part_name,model:x.model,status:x.status,loc:x.loc_store_id,org:x.origin_store_id,cost:+x.cost}))}
 {const[tc,cr]=await Promise.all([all(()=>sb.from('tech_closings').select('*').order('closing_date',{ascending:false}).order('id',{ascending:false})).catch(()=>[]),
   all(()=>sb.from('controller_repairs').select('*').order('created_at',{ascending:false}).order('id',{ascending:false})).catch(()=>[])]);
  S.tc=tc.map(x=>({id:x.id,d:x.closing_date,store:x.store_id,os:x.os_number,cu:x.customer,sv:x.service,pc:+x.part_cost,ch:+x.charged,sup:x.supplier,by:x.created_by_name,uid:x.created_by,t:Date.parse(x.created_at)}));
  S.cr=cr.map(x=>({id:x.id,os:x.os_number,store:x.store_id,st:x.status,by:x.created_by_name,ub:x.updated_by_name,ut:Date.parse(x.updated_at),t:Date.parse(x.created_at)}))}
 {const gr=await all(()=>sb.from('glass_repairs').select('*').order('created_at',{ascending:false}).order('id',{ascending:false})).catch(()=>[]);
  S.gr=gr.map(x=>({id:x.id,os:x.os_number,store:x.store_id,dev:x.device,st:x.status,nt:x.note,by:x.created_by_name,ub:x.updated_by_name,ut:Date.parse(x.updated_at),t:Date.parse(x.created_at)}))}
 if(me.admin){S.sup=ok(await sb.from('suppliers').select('*').order('name'));
  S.users=ok(await sb.from('profiles').select('*').order('name')).map(x=>({id:x.id,n:x.name,email:x.email,store:x.store_id,adm:x.is_admin,dev:!!x.is_dev,tech:x.is_technician,gl:!!x.is_glass_editor,on:x.active}))}
 if(me.dev){try{const r=await sb.from('error_log').select('id',{count:'exact',head:true}).eq('resolved',false).eq('level','erro');D.ne=r.error?0:(r.count||0)}catch(_){D.ne=0}
  if(DT.includes(tab)&&!D.ld)await devFetch(tab)}}

/* ---------- UI utilitários ---------- */
function cl(){$('#m').className='ov'}
function ask(title,msg,fn,label){
 $('#m').innerHTML=`<div class=md><h3>${esc(title)}</h3><p class=mu style="margin:6px 0 20px;line-height:1.55">${esc(msg).replace(/\n/g,'<br>')}</p><div class=bt><button type=button id=ask-no onclick=cl()>Cancelar</button><button type=button class=dg id=ask-ok>${label||'Excluir'}</button></div></div>`;
 $('#m').className='ov on';$('#ask-no').focus();
 $('#ask-ok').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{await fn();await load();cl();render()}catch(x){terr(x);b.disabled=false}}}
function modal(title,fields,fn,ch){
 $('#m').innerHTML=`<div class=md><h3>${title}</h3><form>${fields.map(f=>`<label>${f.l}${f.o?`<select name=${f.n}>${f.o.map(o=>`<option value="${esc(o[0])}" ${String(o[0])===String(f.v)?'selected':''}>${esc(o[1])}</option>`).join('')}</select>`:`<input name=${f.n} type=${f.t||'text'} value="${esc(f.v)}" ${f.r?'required':''} ${f.min!=null?'min='+f.min:''} step=any>`}</label>`).join('')}<div class=bt><button type=button onclick=cl()>Cancelar</button><button class=pr>Confirmar</button></div></form></div>`;
 $('#m').className='ov on';
 {const fm=$('#m form');if(ch){fm.elements[fields[0].n].onchange=()=>ch(fm.elements);ch(fm.elements)}}
 $('#m form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('.pr');b.disabled=true;const d=Object.fromEntries(new FormData(e.target));
  try{await fn(d);await load();cl();render()}catch(x){terr(x);b.disabled=false}}}
const badge=s=>`<span class="tg ${/Aguard|Solic/.test(s)?'w':/Rejeit|Descart|Sem /.test(s)?'r':/Utiliz|Entreg|Receb|estoque|Dispon|Conclu/.test(s)?'g':''}">${esc(s)}</span>`;
const tbl=(h,r)=>`<div class=tw><table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${r.length?r.map(x=>`<tr>${x.map(c=>`<td>${c}</td>`).join('')}</tr>`).join(''):`<tr><td colspan=${h.length} class=mu>Nenhum registro.</td></tr>`}</table></div>`;
const cnt=(a,f,w=()=>1)=>{const m={};a.forEach(x=>{const k=f(x);m[k]=(m[k]||0)+w(x)});return m};
const bars=(m,keep)=>{let e=Object.entries(m);e=keep?e.sort():e.sort((a,b)=>b[1]-a[1]);e=e.slice(keep?-6:0,keep?undefined:6);const mx=Math.max(1,...e.map(x=>x[1]));
 return e.length?e.map(([k,v])=>`<div class=br><span title="${esc(k)}">${esc(k)}</span><i><b style="width:${v/mx*100}%"></b></i><em>${v}</em></div>`).join(''):'<p class=mu>Sem dados</p>'};
/* O servidor já filtra por loja (RLS); aqui o admin só escolhe qual unidade quer olhar */
const vis=()=>{const a=me.admin,v=me.view,every=a&&v==null,t=a?v:me.store;
 return{o:S.orders.filter(o=>every||o.store===t),u:S.units.filter(u=>every||u.loc===t||u.org===t),h:S.hist.filter(h=>every||h.sid===t||h.rid===t||(!a&&h.sid===CE)),m:S.mn.filter(m=>every||m.store===t)}};
function csv(name,rows){if(!rows.length)return toast('Nada para exportar.');const k=Object.keys(rows[0]);
 const t='\ufeff'+[k,...rows.map(r=>k.map(c=>r[c]))].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/csv'}));a.download=name+'.csv';a.click()}

/* ---------- Login ---------- */
function login(){return `<div class=lg><form onsubmit="lgin(event)"><h1>Oficina do Smart</h1><p class=mu>Gestão de peças, estoque e rastreabilidade</p>
<label>E-mail<input id=le type=email autocomplete=username autocapitalize=off required></label><label>Senha<input id=lp type=password autocomplete=current-password required></label>
<button class=pr>Entrar</button></form></div>`}
async function lgin(e){e.preventDefault();const b=e.target.querySelector('.pr');b.disabled=true;
 const{error}=await sb.auth.signInWithPassword({email:$('#le').value.trim(),password:$('#lp').value});
 if(error){b.disabled=false;return toast('E-mail ou senha incorretos.')}
 await enter()}
async function enter(){D=D0();booting=true;render();try{const{data:{session}}=await sb.auth.getSession();if(!session)return;
 const{data:p,error}=await sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle();if(error)throw error;
 if(!p||!p.active){await sb.auth.signOut();toast('Usuário sem acesso ou desativado.');return}
 me={id:p.id,name:p.name,admin:p.is_admin,dev:!!p.is_dev,store:p.store_id,view:null,tech:!!p.is_technician,glass:!!p.is_glass_editor};tab='dash';await load()}catch(e){terr(e)}finally{booting=false;render()}}
async function logout(){const imp=!!AS;AS=null;await sb.auth.signOut(imp?{scope:'local'}:undefined);me=null;booting=false;S={cu:[],st:[],sup:[],cat:[],orders:[],units:[],hist:[],tr:[],users:[],mn:[],supv:[],tc:[],cr:[],gr:[]};D=D0();render()}

/* ---------- Páginas ---------- */
function pDash(){const{o,u,h}=vis(),p=v=>u.filter(x=>x.status===v).length;
 const av=u.filter(x=>inStock(x)||cAv(x)||x.status==='Recebida').length,bought=o.reduce((s,x)=>s+x.qty*x.price,0),dist=u.filter(x=>x.loc!==CE).reduce((s,x)=>s+x.cost,0);
 const C=[['package','Peças cadastradas',u.length],['check','Quantidade disponível',av],['receipt','Pedidos realizados',o.length],['clock','Aguardando atendimento',o.filter(x=>x.status==='Aguardando atendimento').length],['circle-check','Peças utilizadas',p('Utilizada')],['undo','Peças devolvidas',p('Devolvida')],['wrench','Em manutenção',u.filter(inM).length],['banknote','Total comprado',brl(bought)],['truck','Valor distribuído',brl(dist)]];
 return `<h1>Dashboard</h1><p class="mu sub">${me.admin?(me.view==null?'Visão consolidada das '+LJ().length+' lojas':esc(sn(me.view))):esc(sn(me.store))}</p>
<div class=cards>${C.map(c=>`<div class=card><small>${ic(c[0])} ${c[1]}</small><strong>${c[2]}</strong></div>`).join('')}</div>
<div class=grid><div class=box><h3>Pedidos por unidade</h3>${bars(cnt(o,x=>sn(x.store)))}</div><div class=box><h3>Peças mais solicitadas</h3>${bars(cnt(o,nm,x=>x.qty))}</div>
<div class=box><h3>Peças mais utilizadas</h3>${bars(cnt(u.filter(x=>x.status==='Utilizada'),nm))}</div><div class=box><h3>Peças devolvidas</h3>${bars(cnt(u.filter(x=>x.status==='Devolvida'),nm))}</div>
<div class=box><h3>Movimentação mensal</h3>${bars(cnt(h,x=>new Date(x.t).toISOString().slice(0,7)),1)}</div></div>
<h3 style="margin-bottom:10px">Movimentações recentes</h3>${tbl(['Data','Funcionário','Unidade','Produto','Qtd','Tipo','Novo status'],h.slice(0,8).map(x=>[dt(x.t),esc(x.u),esc(x.unid),esc(x.prod),x.qtd,x.tipo,badge(x.para||'')]))}`}

function pOrd(){const{o}=vis();
 const form=`<div class=bar><button class=pr onclick="orderForm()">+ Nova solicitação</button></div>`;
 const vp=x=>x.price||x.est||0;
 const act=x=>{if(!me.admin)return '';
  const a=({'Aguardando atendimento':`<button class=pr onclick="oa('${x.id}','ap')">Aprovar</button><button onclick="oa('${x.id}','rj')">Rejeitar</button>`,Comprado:`<button class=pr onclick="oa('${x.id}','rc')">Marcar recebido</button>`,Recebido:x.store===CE?'':`<button class=pr onclick="oa('${x.id}','en')">Entregar à loja</button>`}[x.status])||'';
  return a+`<button class=dg onclick="oa('${x.id}','del')">Excluir</button>`};
 return `<h1>${me.admin?'Pedidos das lojas':'Solicitar Peças'}</h1><p class="mu sub">Pedidos das lojas já entram aprovados (sem precisar do admin). Fluxo: solicitação → compra → recebimento → entrega</p>${form}<div class=cards><div class=card><small>${ic('receipt')} Pedidos</small><strong>${o.length}</strong></div><div class=card><small>${ic('banknote')} Valor comprado</small><strong>${brl(sum(o,x=>x.qty*x.price))}</strong></div></div>
${tbl(['Pedido','Data','Loja','Peça','Qtd','Fornecedor','Valor de peça','Total','Responsável','Status','Ações'],o.map(x=>[x.id,dt(x.t),esc(sn(x.store)),esc(nm(x)),x.qty,esc(x.sup||'—'),vp(x)?brl(vp(x))+(x.price?'':' <span class=mu>(prev.)</span>'):'—',vp(x)?brl(x.qty*vp(x)):'—',esc(x.user),badge(x.status),act(x)]))}`}
const supV=()=>[['','— Escolher fornecedor —'],...(S.supv.length?S.supv:S.sup).map(s=>[s.id,s.name])];
function orderForm(){modal('Nova solicitação de peças',[...(me.admin?[{n:'st',l:'Loja que solicita',o:lopt(),v:me.view}]:[]),
 {n:'c',l:'Peça do catálogo',o:[...S.cat.map(c=>[c.id,c.name+' '+c.model+' · '+(c.supplier_name||'sem fornecedor')]),['x','Outra peça (digitar abaixo)']]},
 {n:'prod',l:'Se outra: nome da peça'},{n:'model',l:'Se outra: modelo'},
 {n:'sf',l:'Fornecedor',o:supV()},{n:'pv',l:'Valor de peça (R$)',t:'number',min:0},
 {n:'qty',l:'Quantidade',t:'number',v:1,min:1,r:1},{n:'obs',l:'Observação'}],
 d=>{const c=S.cat.find(x=>String(x.id)===d.c);return rpc('order_new',{p_store:me.admin?+d.st:me.store,p_part:c?c.name:d.prod,p_model:c?c.model:d.model,p_qty:+d.qty,p_note:d.obs,p_supplier_id:d.sf?+d.sf:null,p_price:d.pv!==''?+d.pv:null})});
 const f=$('#m form').elements,fill=()=>{const c=S.cat.find(x=>String(x.id)===f.c.value);if(c){f.sf.value=c.supplier_id||'';f.pv.value=c.unit_price||''}else{f.sf.value='';f.pv.value=''}};
 f.c.onchange=fill;fill()}
function oa(id,k){const o=S.orders.find(x=>x.id===id);
 if(k==='del')return ask('Excluir pedido','Excluir o pedido '+id+' ('+nm(o)+')?\nAs peças geradas por ele também serão apagadas. Esta ação não pode ser desfeita.',()=>rpc('order_delete',{p_id:id}))
 if(k==='ap')return modal('Aprovar pedido '+id,[{n:'q',l:'Quantidade aprovada',t:'number',v:o.qty,min:1,r:1}],d=>rpc('order_decide',{p_id:id,p_ok:true,p_qty:+d.q}));
 if(k==='bu'){if(!S.sup.length)return toast('Cadastre um fornecedor primeiro.');
  return modal('Registrar compra — '+id,[{n:'s',l:'Fornecedor',v:(S.sup.find(s=>s.name===o.sup)||{}).id,o:supOpt()},{n:'p',l:'Valor unitário (R$)',t:'number',v:o.est||'',min:0.01,r:1}],d=>rpc('order_buy',{p_id:id,p_supplier_id:+d.s,p_price:+d.p}))}
 run(()=>k==='rj'?rpc('order_decide',{p_id:id,p_ok:false}):k==='rc'?rpc('order_receive',{p_id:id}):rpc('order_deliver',{p_id:id}))}

const ALL_ST=['Solicitada','Recebida','Em estoque da unidade','Utilizada','Devolvida','Disponível','Aguardando manutenção','Em manutenção','Descartada'];
const AC={use:['Utilizar',inStock],ret:['Devolver',inStock],tr:['Enviar à loja',cAv],mnt:['Manutenção',u=>inStock(u)||cAv(u)],mn2:['Atualizar manut.',inM],ds:['Descartar',u=>cAv(u)||inM(u)],st:['Editar status',u=>me.admin||inStock(u)||u.status==='Utilizada']};
function pUnits(){const T={pcs:['Controle de Peças',()=>1],ret:['Devoluções',u=>u.status==='Devolvida'],use:['Peças Utilizadas',u=>u.status==='Utilizada'],mnt:['Manutenção',inM]}[tab];
 const us=vis().u.filter(T[1]);
 return `<h1>${T[0]}</h1><p class="mu sub">Cada peça tem identificação própria, ligada ao pedido de origem. Clique no código para ver o rastro completo.</p>${tab==='pcs'&&me.tech?`<div class=bar><button class=pr onclick="partForm()">+ Cadastrar peça</button></div>`:''}
<div class=cards><div class=card><small>${ic('package')} Peças</small><strong>${us.length}</strong></div><div class=card><small>${ic('banknote')} Valor total</small><strong>${brl(sum(us,u=>u.cost))}</strong></div></div>
${tbl(['Código','Peça','Pedido','Local','Status','Valor',...(tab==='ret'?[]:['Ações'])],us.map(u=>[`<a style="color:var(--a);cursor:pointer" onclick="trail('${u.id}')">${u.id}</a>`,esc(nm(u)),u.order,esc(sn(u.loc)),badge(u.status),brl(u.cost),...(tab==='ret'?[]:[Object.entries(AC).filter(([k,a])=>a[1](u)&&(me.admin||u.loc===me.store)).map(([k,a])=>`<button onclick="ua('${u.id}','${k}')">${a[0]}</button>`).join('')])]))}`}
async function trail(id){const u=S.units.find(x=>x.id===id);try{const r=ok(await sb.from('unit_trail').select('*').eq('unit_id',id).order('at').order('id'));
 $('#m').innerHTML=`<div class=md><h3>Rastro de ${u.id} — ${esc(nm(u))}</h3>${r.map(t=>`<div class=trail><b>${esc(t.from_status)} → ${esc(t.to_status)}</b><br><span class=mu>${dt(t.at)} · ${esc(t.by_name)}${t.note?' · '+esc(t.note):''}</span></div>`).join('')}<div class=bt><button onclick=cl()>Fechar</button></div></div>`;$('#m').className='ov on'}catch(e){toast(e.message)}}
function ua(id,k){const u=S.units.find(x=>x.id===id),call=(a,o)=>rpc('unit_action',{p_id:id,p_action:a,...o});const M={
 use:['Utilizar peça '+id,[{n:'m',l:'Observações'}],d=>call('use',{p_note:d.m})],
 ret:['Devolver peça '+id,[{n:'m',l:'Motivo da devolução',r:1},{n:'e',l:'Estado da peça',o:[['Boa','Boa'],['Defeituosa','Defeituosa'],['Danificada','Danificada']]}],d=>call('ret',{p_note:d.m,p_extra:d.e})],
 tr:['Enviar '+id+' à loja',[{n:'d',l:'Loja de destino',o:lopt()},{n:'m',l:'Motivo'}],d=>call('tr',{p_note:d.m,p_dest:+d.d})],
 mnt:['Enviar para manutenção',[{n:'t',l:'Técnico responsável',r:1},{n:'m',l:'Motivo',r:1}],d=>call('mnt',{p_note:d.m,p_extra:d.t})],
 mn2:['Atualizar manutenção',[{n:'r',l:'Resultado',o:[['em','Em manutenção'],['c','Concluída — voltou ao estoque central'],['l','Concluída — devolver à loja de origem'],['x','Sem possibilidade de reparo — descartar']]},{n:'m',l:'Observações'}],d=>call('mn2',{p_note:d.m,p_extra:d.r})],
 ds:['Descartar peça',[{n:'m',l:'Motivo',r:1}],d=>call('ds',{p_note:d.m})],
 st:['Editar status de '+id+' — '+nm(u),[{n:'s',l:'Novo status (atual: '+u.status+')',o:(me.admin?ALL_ST:['Em estoque da unidade','Utilizada']).filter(x=>x!==u.status).map(x=>[x,x])},...(me.admin?[{n:'l',l:'Loja (só se o novo status for "Em estoque da unidade")',o:[['','— manter —'],...lopt()],v:u.loc!==CE?u.loc:''}]:[]),{n:'m',l:'Observação'}],d=>rpc('unit_set_status',{p_id:id,p_status:d.s,p_note:d.m,p_store:d.l?+d.l:null})]}[k];
 modal(M[0],M[1],M[2])}

/* ---------- Manutenção (OS) ---------- */
const pfc=v=>`<b style="color:var(${v<0?'--r':'--g'})">${brl(v)}</b>`;
function pMnt(){const{m}=vis(),ch=sum(m,x=>x.ch),pc=sum(m,x=>x.pc),pf=sum(m,x=>x.pf);
 const rows=m.map(x=>[esc(x.os),dt(x.t),esc(sn(x.store)),esc(x.cu),esc(x.sv),esc(x.part||'—'),brl(x.ch),brl(x.pc),pfc(x.pf),esc(x.tech),`<button onclick="mntForm(${x.id})">Editar</button>`+(me.admin?`<button class=dg onclick="mntDel(${x.id})">Excluir</button>`:'')]);
 if(m.length)rows.push([`<b>Totais (${m.length} OS)</b>`,'','','','','',`<b>${brl(ch)}</b>`,`<b>${brl(pc)}</b>`,pfc(pf),'','']);
 return `<h1>Manutenção</h1><p class="mu sub">Ordens de serviço: cliente, serviço, peça, valores e técnico. Lucro = valor cobrado − valor pago na peça.</p>
<div class=bar><button class=pr onclick="mntForm()">+ Nova manutenção</button></div>
${tbl(['OS','Data','Loja','Cliente','Serviço realizado','Peça utilizada','Valor cobrado','Valor pago na peça','Lucro','Técnico','Ações'],rows)}
<div class=cards><div class=card><small>${ic('banknote')} Valor cobrado</small><strong>${brl(ch)}</strong></div><div class=card><small>${ic('package')} Valor gasto (peças)</small><strong>${brl(pc)}</strong></div><div class=card><small>${ic('check')} Lucro</small><strong style="color:var(${pf<0?'--r':'--g'})">${brl(pf)}</strong></div></div>
${pUnits().replace(/^<h1>[^<]*<\/h1>/,'<h3 style="margin:22px 0 10px">Peças em manutenção</h3>')}`}
function mntForm(id){const x=id!=null?S.mn.find(v=>v.id===id):null;
 if(x)return modal('Editar OS '+esc(x.os),[{n:'os',l:'Número da OS',v:x.os,r:1},{n:'cu',l:'Cliente',v:x.cu,r:1},{n:'sv',l:'Serviço realizado',v:x.sv,r:1},{n:'pc',l:'Peça utilizada',v:x.part},{n:'ch',l:'Valor cobrado (R$)',t:'number',v:x.ch,min:0,r:1},{n:'pv',l:'Valor pago na peça (R$)',t:'number',v:x.pc,min:0,r:1},{n:'tc',l:'Técnico',v:x.tech,r:1}],
  d=>rpc('maintenance_update',{p_id:id,p_os:d.os,p_customer:d.cu,p_service:d.sv,p_charged:+d.ch,p_technician:d.tc,p_part:d.pc,p_part_cost:+d.pv}));
 modal('Nova manutenção',[...(me.admin?[{n:'st',l:'Loja',o:lopt(),v:me.view!=null?me.view:(LJ().find(l=>S.units.some(u=>u.loc===l.id&&inStock(u)))||{}).id}]:[]),{n:'os',l:'Número da OS',r:1},{n:'cu',l:'Cliente',r:1},{n:'sv',l:'Serviço realizado',r:1},
  {n:'u',l:'Peça utilizada (do estoque da loja)',o:[]},{n:'pc',l:'Ou digite a peça utilizada (se não for do estoque)'},
  {n:'ch',l:'Valor cobrado (R$)',t:'number',min:0,r:1},{n:'pv',l:'Valor pago na peça (R$)',t:'number',min:0},{n:'tc',l:'Técnico',r:1}],
  d=>rpc('maintenance_new',{p_os:d.os,p_customer:d.cu,p_service:d.sv,p_charged:+d.ch,p_technician:d.tc,p_store:me.admin?+d.st:null,p_unit_id:d.u||null,p_part:d.pc,p_part_cost:d.pv!==''?+d.pv:null}));
 const f=$('#m form').elements,sid=()=>me.admin?+f.st.value:me.store,
  fill=()=>{const us=S.units.filter(u=>u.loc===sid()&&inStock(u)),cen=S.units.filter(cAv).length;
   f.u.innerHTML='<option value="">— '+(us.length?'Sem peça do estoque':'Nenhuma peça em estoque nesta loja')+' —</option>'+us.map(u=>`<option value="${esc(u.id)}">${esc(u.id+' · '+nm(u)+' · '+brl(u.cost))}</option>`).join('');f.pc.value='';f.pv.value='';
   $('#mh').textContent=us.length?us.length+' peça(s) em estoque em '+sn(sid())+'.':'Não há peça em estoque em '+sn(sid())+'.'+(cen?' O Estoque Central tem '+cen+' disponível(is), mas só dá para usar peça que já está na loja'+(me.admin?': envie em Estoques → Editar → Saída para loja.':': peça ao administrador para enviar à sua loja.'):'')+(me.admin?' Se a peça está em outra loja, troque o campo Loja acima.':'')+' Ou digite a peça abaixo.'};
 f.u.insertAdjacentHTML('afterend','<small class=mu id=mh style="display:block;margin-top:6px;line-height:1.4"></small>');
 if(me.admin)f.st.onchange=fill;
 f.u.onchange=()=>{const u=S.units.find(v=>v.id===f.u.value);f.pc.value=u?nm(u):'';f.pv.value=u?u.cost:''};
 fill()}
function mntDel(id){const x=S.mn.find(v=>v.id===id);ask('Excluir OS','Excluir a OS '+x.os+' ('+x.cu+')? Esta ação não pode ser desfeita.',()=>rpc('maintenance_delete',{p_id:id}))}

function pSup(){const P=S.orders.filter(o=>o.price);
 return `<h1>Fornecedores</h1><p class="mu sub">Cadastro e histórico de compras</p><div class=bar><button class=pr onclick="supForm()">+ Novo fornecedor</button></div>
${tbl(['Fornecedor','Empresa','Telefone','E-mail','Observações','Compras','Total comprado','Ações'],S.sup.map(s=>{const c=P.filter(o=>o.sup===s.name);return[esc(s.name),esc(s.company),esc(s.phone),esc(s.email),esc(s.notes),c.length,brl(sum(c,o=>o.qty*o.price)),`<button onclick="supEdit(${s.id})">Editar</button><button class="dg" onclick="supDel(${s.id})">Excluir</button>`]}))}
<h3 style="margin-bottom:10px">Histórico de compras</h3>${tbl(['Pedido','Data','Fornecedor','Loja','Produto','Qtd','Unitário','Total','Responsável'],P.map(o=>[o.id,dt(o.buyT),esc(o.sup),esc(sn(o.store)),esc(nm(o)),o.qty,brl(o.price),brl(o.qty*o.price),esc(o.buyer)]))}`}
function supEdit(id){
 const s=S.sup.find(x=>x.id===id);if(!s)return;
 modal('Editar '+esc(s.name),[{n:'c',l:'Empresa',v:s.company},{n:'tel',l:'Telefone',v:s.phone},{n:'em',l:'E-mail',t:'email',v:s.email},{n:'obs',l:'Observações',v:s.notes}],
 d=>dbx(sb.from('suppliers').update({company:d.c,phone:d.tel,email:d.em,notes:d.obs}).eq('id',id)))}
function supDel(id){
 const s=S.sup.find(x=>x.id===id);if(!s)return;
 const n=S.cat.filter(c=>c.supplier_id===id).length;
 ask('Excluir fornecedor','Excluir o fornecedor "'+s.name+'"?'+(n?'\n'+n+' peça(s) do catálogo ficarão sem fornecedor padrão.':'')+'\nO histórico de compras já feito é mantido. Esta ação não pode ser desfeita.',()=>dbx(sb.from('suppliers').delete().eq('id',id)));
}
function supForm(){modal('Novo fornecedor',[{n:'n',l:'Nome',r:1},{n:'c',l:'Empresa'},{n:'tel',l:'Telefone'},{n:'em',l:'E-mail',t:'email'},{n:'obs',l:'Observações'}],
 d=>dbx(sb.from('suppliers').insert({name:d.n.trim(),company:d.c,phone:d.tel,email:d.em,notes:d.obs})))}

let SP=[];
function pStk(){const locs=[CE,...LJ().map(s=>s.id)],sel=(l,p)=>S.units.filter(u=>u.loc===l&&(l===CE?['Recebida','Disponível','Devolvida'].includes(u.status):inStock(u))&&(!p||nm(u)===p));
  /* Lista = peças do catálogo + peças com unidade em estoque em algum local */
  const M={};S.cat.forEach(c=>{M[c.name+' '+c.model]={n:c.name,m:c.model}});S.units.filter(u=>(u.loc===CE?cAv(u):inStock(u))).forEach(u=>{M[nm(u)]=M[nm(u)]||{n:u.prod,m:u.model}});
  const P=Object.keys(M).sort((a,b)=>a.localeCompare(b,'pt-BR'));SP=P.map(k=>M[k]);
 return `<h1>Estoques</h1><p class="mu sub">Peças disponíveis e valor por local. Entradas e saídas ficam registradas no Histórico.</p><div class=bar><button class=pr onclick="entForm()">+ Cadastrar peça</button><button onclick="estEdit()">Editar</button><button onclick="stkImp()">Importar planilha</button><button onclick="stkExp()">${ic('download')} Exportar planilha</button></div>
${tbl(['Produto',...locs.map(sn),'Ações'],[...P.map((p,i)=>[esc(p),...locs.map(l=>sel(l,p).length),`<button class="dg" onclick="stkDel(${i})">Excluir</button>`]),['<b>Total (peças)</b>',...locs.map(l=>'<b>'+sel(l).length+'</b>'),''],['<b>Valor total</b>',...locs.map(l=>'<b>'+brl(sum(sel(l),u=>u.cost))+'</b>'),'']])}`}
/* Excluir peça do estoque: tira do catálogo e das prateleiras; o histórico fica (unidades viram "Descartada") */
function stkDel(i){const x=SP[i];if(!x)return;const k=x.n+' '+x.m,q=S.units.filter(u=>nm(u)===k&&(u.loc===CE?cAv(u):inStock(u))).length;
  ask('Excluir peça do estoque','Excluir "'+k+'"?\n'+(q?q+' unidade(s) em estoque será(ão) baixada(s) (status Descartada) e sai(rão) de todas as lojas.':'Esta peça não tem unidades em estoque.')+'\nO histórico é mantido. Esta ação não pode ser desfeita.',()=>rpc('stock_part_delete',{p_name:x.n,p_model:x.m}))}
/* ---------- Planilhas: exportar o estoque / importar entradas (Estoques > Importar planilha / Exportar planilha) ---------- */
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const num=v=>{if(typeof v==='number')return v;let s=String(v??'').replace(/[^\d,.\-]/g,'');if(!s)return NaN;
 if(s.includes(',')&&s.includes('.'))s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');else if(s.includes(','))s=s.replace(',','.');return parseFloat(s)};
const stkSel=(l,p)=>S.units.filter(u=>u.loc===l&&(l===CE?['Recebida','Disponível','Devolvida'].includes(u.status):inStock(u))&&(!p||nm(u)===p));
/* baixa .xlsx (se a biblioteca carregou) ou CSV */
function dl(name,rows,sheet){if(!rows.length)return toast('Nada para exportar.');
 if(window.XLSX){const k=Object.keys(rows[0]),ws=XLSX.utils.json_to_sheet(rows);ws['!cols']=k.map(c=>({wch:Math.min(48,Math.max(c.length,...rows.map(r=>String(r[c]??'').length))+2)}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,sheet);XLSX.writeFile(wb,name+'.xlsx')}else csv(name,rows)}
function stkExp(){const locs=[CE,...LJ().map(s=>s.id)],M={};
 S.cat.forEach(c=>{M[c.name+' '+c.model]={n:c.name,m:c.model,c}});S.units.filter(u=>u.loc===CE?cAv(u):inStock(u)).forEach(u=>{M[nm(u)]=M[nm(u)]||{n:u.prod,m:u.model}});
 const rows=Object.keys(M).sort((a,b)=>a.localeCompare(b,'pt-BR')).map(k=>{const x=M[k],r={'Peça':x.n,'Modelo':x.m,'Fornecedor':(x.c&&x.c.supplier_name)||'','Valor unitário':(x.c&&+x.c.unit_price)||0};
  locs.forEach(l=>r[sn(l)]=stkSel(l,k).length);r['Total']=sum(locs,l=>stkSel(l,k).length);r['Valor em estoque']=sum(locs.flatMap(l=>stkSel(l,k)),u=>u.cost);return r});
 dl('estoques_'+new Date().toISOString().slice(0,10),rows,'Estoques')}
function stkModelo(){const l=(LJ()[0]||{}).name||'Buritis',f=(S.sup[0]||{}).name||'Nome do fornecedor';
 dl('modelo_importacao_estoque',[{'Peça':'BATERIA','Modelo':'S22','Loja':l,'Quantidade':5,'Fornecedor':f,'Valor unitário':45.9},{'Peça':'TELA','Modelo':'S23','Loja':'','Quantidade':2,'Fornecedor':f,'Valor unitário':320}],'Importação')}
function parseCsv(t){const first=t.split(/\r?\n/)[0]||'',d=(first.match(/;/g)||[]).length>=(first.match(/,/g)||[]).length?';':',',rows=[];let r=[],c='',q=false;
 for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}
  else if(ch==='"')q=true;else if(ch===d){r.push(c);c=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;r.push(c);c='';rows.push(r);r=[]}else c+=ch}
 if(c!==''||r.length){r.push(c);rows.push(r)}return rows}
async function readSheet(file){const n=file.name.toLowerCase(),buf=await file.arrayBuffer();
 if(/\.xlsx?$/.test(n)){if(!window.XLSX)throw new Error('A biblioteca de planilhas não carregou. Salve como CSV ou verifique a internet.');
  const wb=XLSX.read(buf,{type:'array'});return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:'',raw:true})}
 let t=new TextDecoder('utf-8').decode(buf);if(t.includes('\ufffd'))t=new TextDecoder('windows-1252').decode(buf);return parseCsv(t.replace(/^\ufeff/,''))}
const COLS={n:['peca','produto','nome','nome da peca','item'],m:['modelo','aparelho'],l:['loja','destino','local','unidade','loja destino'],q:['quantidade','qtd','qtde','quant'],f:['fornecedor'],v:['valor unitario','valor','preco','preco unitario','valor unit','valor unitario (r$)']};
function stkParse(rows){
 const hi=rows.findIndex(r=>r.some(c=>COLS.n.includes(norm(c)))&&r.some(c=>COLS.q.includes(norm(c))));
 if(hi<0)throw new Error('Não achei o cabeçalho. A planilha precisa ter as colunas "Peça", "Modelo" e "Quantidade". Use "Baixar modelo".');
 const ix={};rows[hi].forEach((c,i)=>{const k=norm(c);for(const j in COLS)if(ix[j]==null&&COLS[j].includes(k))ix[j]=i});
 if(ix.m==null)throw new Error('Falta a coluna "Modelo". Use "Baixar modelo".');
 const key=(n,m)=>norm(n)+'|'+norm(m),stores=LJ(),seen={},out=[];
 rows.slice(hi+1).forEach((r,k)=>{if(r.every(c=>String(c).trim()===''))return;
  const g=j=>ix[j]==null?'':r[ix[j]],n=String(g('n')).trim(),m=String(g('m')).trim(),ln=String(g('l')).trim(),q=num(g('q')),fn=String(g('f')).trim(),pv=num(g('v')),
   x={line:hi+k+2,n,m,q,lname:ln||'Estoque Central',sid:CE,sup:null,price:0,nova:false,err:''},cat=S.cat.find(c=>key(c.name,c.model)===key(n,m));
  if(!n||!m)x.err='Informe a peça e o modelo.';
  else if(!(q>0)||!Number.isInteger(q))x.err='Quantidade inválida (use um número inteiro maior que zero).';
  if(!x.err&&ln&&!['estoque central','central'].includes(norm(ln))){const st=stores.find(s=>norm(s.name)===norm(ln));if(st)x.sid=st.id;else x.err='Loja "'+ln+'" não cadastrada.'}
  if(!x.err){let sp=null;if(fn){sp=S.sup.find(s=>norm(s.name)===norm(fn)||norm(s.name+' ('+(s.company||'')+')')===norm(fn)||(s.company&&norm(s.company)===norm(fn)));if(!sp)x.err='Fornecedor "'+fn+'" não cadastrado (aba Fornecedores).'}
   const prev=seen[key(n,m)];
   x.sup=sp?sp.id:(cat&&cat.supplier_id)||(prev&&prev.sup)||null;x.price=pv>0?pv:(cat&&+cat.unit_price)||(prev&&prev.price)||0;
   if(!x.err&&!x.sup)x.err='Informe o fornecedor (peça nova ou sem fornecedor padrão).';
   else if(!x.err&&!(x.price>0))x.err='Informe o valor unitário (peça nova ou sem valor no catálogo).';
   if(!x.err){x.nova=!cat;seen[key(n,m)]={sup:x.sup,price:x.price}}}
  x.cat=cat;out.push(x)});
 if(!out.length)throw new Error('A planilha não tem linhas de dados abaixo do cabeçalho.');return out}
function stkImp(){
 $('#m').innerHTML=`<div class=md style="max-width:860px"><h3>Importar planilha de estoque</h3>
 <p class=mu style="margin:6px 0 12px;line-height:1.5">Aceita <b>.xlsx</b> e <b>.csv</b>. Colunas: <b>Peça</b>, <b>Modelo</b>, <b>Loja</b> (em branco = Estoque Central), <b>Quantidade</b>, <b>Fornecedor</b> e <b>Valor unitário</b> (fornecedor e valor só são obrigatórios para peça nova). As quantidades são <b>somadas</b> ao estoque. Para uma loja, a peça entra no Estoque Central e sai para a loja, e tudo fica no Histórico.</p>
 <input type=file id=sf accept=".xlsx,.xls,.csv,text/csv">
 <div id=sp style="margin-top:12px"></div>
 <div class=bt><button type=button onclick="stkModelo()">Baixar modelo</button><button type=button onclick=cl()>Fechar</button><button type=button class=pr id=sok disabled>Importar</button></div></div>`;
 $('#m').className='ov on';let L=[];
 $('#sf').onchange=async e=>{const f=e.target.files[0],sp=$('#sp'),b=$('#sok');b.disabled=true;if(!f)return;sp.innerHTML='<p class=mu>Lendo planilha…</p>';
  try{L=stkParse(await readSheet(f));const ok=L.filter(x=>!x.err),er=L.length-ok.length;
   sp.innerHTML=`<p style="margin:0 0 8px"><span class="tg g">${ok.length} linha(s) pronta(s)</span> ${er?`<span class="tg r">${er} com erro (não serão importadas)</span>`:''} <span class=mu>· ${sum(ok,x=>x.q)} peça(s) no total</span></p>
   <div class=tw style="max-height:40vh;overflow:auto"><table><tr><th>Linha</th><th>Peça</th><th>Destino</th><th>Qtd</th><th>Situação</th></tr>${L.map(x=>`<tr><td>${x.line}</td><td>${esc(x.n+' '+x.m)}</td><td>${esc(x.lname)}</td><td>${isNaN(x.q)?'—':x.q}</td><td>${x.err?`<span class="tg r">${esc(x.err)}</span>`:`<span class="tg g">OK${x.nova?' · peça nova':''}</span>`}</td></tr>`).join('')}</table></div>`;
   b.disabled=!ok.length}catch(err){L=[];sp.innerHTML=`<p class="tg r" style="display:inline-block">${esc(err.message||String(err))}</p>`}};
 $('#sok').onclick=async e=>{const b=e.currentTarget,sp=$('#sp'),R=L.filter(x=>!x.err);if(!R.length)return;b.disabled=true;$('#sf').disabled=true;
  let n=0,pcs=0;const bad=[],made={};
  for(let i=0;i<R.length;i++){const x=R[i];sp.innerHTML=`<p class=mu>Importando ${i+1} de ${R.length}…</p>`;let step='entrada';
   try{let id=x.cat&&x.cat.id;if(!id){const k=norm(x.n)+'|'+norm(x.m);if(!made[k]){const r=await sb.from('catalog').insert({name:x.n,model:x.m,supplier_id:x.sup,unit_price:x.price}).select('id').single();if(r.error)throw new Error(r.error.message);made[k]=r.data.id}id=made[k]}
    await rpc('stock_entry',{p_catalog_id:id,p_qty:x.q,p_supplier_id:x.sup,p_price:x.price});
    if(x.sid!==CE){step='saída para a loja';await rpc('stock_exit',{p_catalog_id:id,p_qty:x.q,p_dest:x.sid,p_note:'Importação de planilha'})}
    n++;pcs+=x.q}catch(err){bad.push('Linha '+x.line+' ('+x.n+' '+x.m+'): '+(step!=='entrada'?'a entrada no Estoque Central foi feita, mas a saída para a loja falhou — ':'')+(err.message||String(err)))}}
  try{await load()}catch(_){}render();
  sp.innerHTML=`<p style="margin:0 0 8px"><span class="tg g">${n} linha(s) importada(s) · ${pcs} peça(s)</span> ${bad.length?`<span class="tg r">${bad.length} falharam</span>`:''}</p>${bad.length?`<div class=tw style="max-height:30vh;overflow:auto;padding:10px 12px"><p class=mu style="line-height:1.6;margin:0">${bad.map(esc).join('<br>')}</p></div>`:''}`;
  b.style.display='none'}}
function estEdit(){$('#m').innerHTML=`<div class=md><h3>Editar estoque</h3><div style="display:flex;flex-direction:column;gap:8px;margin-top:14px"><button onclick="bulkForm()">Entrada em lote (várias peças já cadastradas)</button><button onclick="saiForm()">− Saída para loja</button><button onclick=cl()>Fechar</button></div></div>`;$('#m').className='ov on'}
function entForm(){if(!S.sup.length)return toast('Cadastre um fornecedor primeiro.');
 const key=(n,m)=>(n||'').trim().toLowerCase()+'|'+(m||'').trim().toLowerCase(),find=(n,m)=>S.cat.find(c=>key(c.name,c.model)===key(n,m));
 modal('Cadastrar peça no estoque',[{n:'n',l:'Nome da peça',r:1},{n:'m',l:'Modelo do aparelho',r:1},{n:'q',l:'Quantidade',t:'number',v:1,min:1,r:1},{n:'l',l:'Loja (onde a peça será cadastrada)',v:CE,o:[[CE,'Estoque Central'],...lopt()]},{n:'s',l:'Fornecedor',o:supOpt()},{n:'v',l:'Valor unitário (R$)',t:'number',min:0.01,r:1}],
 async d=>{const n=d.n.trim(),m=d.m.trim();let c=find(n,m),id=c&&c.id;
  if(!c){const r=await sb.from('catalog').insert({name:n,model:m,supplier_id:+d.s,unit_price:+d.v}).select('id').single();
   if(r.error){if(r.error.code!=='23505')throw new Error(r.error.message);throw new Error('Essa peça já existe no catálogo. Atualize os dados e tente de novo.')}id=r.data.id}
  await rpc('stock_entry',{p_catalog_id:id,p_qty:+d.q,p_supplier_id:+d.s,p_price:+d.v});
  /* Loja diferente do Estoque Central: a peça entra no central e já sai para a loja escolhida (ambos ficam no Histórico) */
  if(+d.l!==CE){try{await rpc('stock_exit',{p_catalog_id:id,p_qty:+d.q,p_dest:+d.l,p_note:'Cadastro de peça direto na loja'})}
   catch(e){toast('A peça entrou no Estoque Central, mas não foi enviada para '+sn(+d.l)+': '+(e.message||e)+' Use Editar → Saída para loja.')}}});
 const f=$('#m form').elements,uniq=a=>[...new Set(a)].sort((x,y)=>x.localeCompare(y,'pt-BR'));
 f.n.setAttribute('list','dln');f.m.setAttribute('list','dlm');f.n.setAttribute('autocomplete','off');f.m.setAttribute('autocomplete','off');
 f.n.insertAdjacentHTML('afterend',`<datalist id=dln>${uniq(S.cat.map(c=>c.name)).map(x=>`<option value="${esc(x)}">`).join('')}</datalist>`);
 f.m.insertAdjacentHTML('afterend',`<datalist id=dlm>${uniq(S.cat.map(c=>c.model)).map(x=>`<option value="${esc(x)}">`).join('')}</datalist>`);
 const hint=document.createElement('p');hint.className='mu';hint.style.cssText='margin:0 0 8px;font-size:13px';f.v.closest('label').after(hint);
 const sync=()=>{const c=find(f.n.value,f.m.value);if(c){if(c.supplier_id)f.s.value=c.supplier_id;if(c.unit_price)f.v.value=c.unit_price;hint.textContent='Peça já cadastrada: a quantidade será somada ao estoque de '+sn(+f.l.value)+'.'}else hint.textContent=f.n.value&&f.m.value?'Peça nova: será cadastrada e já entra no estoque de '+sn(+f.l.value)+'.':''};
 f.n.oninput=f.m.oninput=sync;f.n.onchange=f.m.onchange=sync;f.l.onchange=sync}
/* Entrada em lote: digita a quantidade de várias peças do catálogo de uma vez */
function bulkForm(){if(!S.cat.length)return toast('Ainda não há peças cadastradas. Use "+ Cadastrar peça".');
 const ok_=c=>c.supplier_id&&+c.unit_price>0;
 $('#m').innerHTML=`<div class=md style="max-width:780px"><h3>Entrada em lote — catálogo no estoque central</h3><p class=mu style="margin:6px 0 12px;line-height:1.5">Digite a quantidade que chegou de cada peça. Fornecedor e valor vêm do catálogo. O que ficar em branco não é lançado.</p>
 <input id=bq placeholder="Buscar peça ou modelo…" style="margin-bottom:10px" oninput="const q=this.value.toLowerCase();document.querySelectorAll('#bl tr[data-n]').forEach(r=>r.style.display=r.dataset.n.includes(q)?'':'none')">
 <div class=tw style="max-height:50vh;overflow:auto"><table id=bl><tr><th>Peça</th><th>Fornecedor</th><th>Valor</th><th>Qtd</th></tr>${S.cat.map(c=>`<tr data-n="${esc((c.name+' '+c.model).toLowerCase())}"><td>${esc(c.name+' '+c.model)}</td><td>${esc(c.supplier_name||'—')}</td><td>${c.unit_price?brl(c.unit_price):'—'}</td><td>${ok_(c)?`<input type=number min=0 step=1 data-id="${c.id}" style="width:80px">`:'<span class=mu>sem fornecedor/valor</span>'}</td></tr>`).join('')}</table></div>
 <div class=bt><button type=button onclick=cl()>Cancelar</button><button type=button class=pr id=bok>Lançar no estoque</button></div></div>`;
 $('#m').className='ov on';
 $('#bok').onclick=async e=>{const b=e.currentTarget,L=[...document.querySelectorAll('#bl input[data-id]')].map(i=>({c:S.cat.find(x=>String(x.id)===i.dataset.id),q:parseInt(i.value,10)})).filter(x=>x.q>0);
  if(!L.length)return toast('Digite a quantidade de pelo menos uma peça.');b.disabled=true;let n=0,pcs=0;
  try{for(const x of L){await rpc('stock_entry',{p_catalog_id:x.c.id,p_qty:x.q,p_supplier_id:x.c.supplier_id,p_price:+x.c.unit_price});n++;pcs+=x.q}
   toast(pcs+' peça(s) de '+n+' item(ns) lançadas no estoque central.')}
  catch(err){toast((n?n+' item(ns) lançados antes do erro. ':'')+(err.message||String(err)))}
  try{await load()}catch(_){}cl();render()}}
const avC=c=>S.units.filter(u=>cAv(u)&&u.prod===c.name&&u.model===c.model);
function saiForm(){if(!S.cat.length)return toast('Ainda não há peças cadastradas. Use "+ Cadastrar peça" na aba Estoques.');
 modal('Saída do estoque central para loja',[{n:'p',l:'Peça',o:S.cat.map(c=>[c.id,c.name+' '+c.model+' (disp. '+avC(c).length+')'])},{n:'q',l:'Quantidade',t:'number',v:1,min:1,r:1},{n:'d',l:'Loja de destino',o:lopt()},{n:'m',l:'Motivo'}],
 d=>rpc('stock_exit',{p_catalog_id:+d.p,p_qty:+d.q,p_dest:+d.d,p_note:d.m}))}
/* ---------- Estoque Central (todos os usuários consultam; só o admin movimenta) ---------- */
let EC={q:''};
const ecg=()=>{const G={};(S.cu||[]).filter(cAv).forEach(u=>{const k=nm(u),g=G[k]||(G[k]={n:k,q:0,v:0});g.q++;g.v+=u.cost});
 const q=EC.q.trim().toLowerCase();return Object.values(G).filter(g=>!q||g.n.toLowerCase().includes(q)).sort((a,b)=>a.n.localeCompare(b.n,'pt-BR'))};
const ecrows=()=>{const l=ecg(),t=sum(l,g=>g.q),v=sum(l,g=>g.v),rows=l.map(g=>[esc(g.n),'<b>'+g.q+'</b>',brl(g.q?g.v/g.q:0),brl(g.v)]);
 if(l.length)rows.push(['<b>Total</b>','<b>'+t+'</b>','','<b>'+brl(v)+'</b>']);return tbl(['Peça','Quantidade disponível','Valor unitário (médio)','Valor total'],rows)};
function pCen(){const l=(S.cu||[]).filter(cAv);
 return `<h1>Estoque Central</h1><p class="mu sub">Peças disponíveis no estoque central, para consulta de todas as lojas.${me.admin?'':' Para pegar uma peça, peça uma transferência ou fale com o administrador.'}</p>
${S.cuErr?'<p class=tg style="display:inline-block;margin-bottom:12px">Não foi possível carregar o estoque central. Falta rodar o migracao_estoque_central.sql no Supabase.</p>':''}<div class=bar>${me.admin?`<button class=pr onclick="entForm()">+ Cadastrar peça</button><button onclick="estEdit()">Editar</button>`:''}<input placeholder="Buscar peça ou modelo…" value="${esc(EC.q)}" oninput="EC.q=this.value;$('#eb').innerHTML=ecrows()"></div>
<div class=cards><div class=card><small>${ic('package')} Peças disponíveis</small><strong>${l.length}</strong></div><div class=card><small>${ic('cpu')} Tipos de peça</small><strong>${new Set(l.map(nm)).size}</strong></div><div class=card><small>${ic('banknote')} Valor em estoque</small><strong>${brl(sum(l,u=>u.cost))}</strong></div></div>
<div id=eb>${ecrows()}</div>`}
function pCat(){const q=c=>S.units.filter(u=>u.prod===c.name&&u.model===c.model&&(cAv(u)||inStock(u)));
 return `<h1>Catálogo de Peças</h1><p class="mu sub">As peças são cadastradas na aba <b>Estoques</b> (ou Estoque Central) e já entram no estoque. Aqui você só ajusta fornecedor e valor.</p>
${tbl(['Peça','Modelo','Fornecedor padrão','Valor unitário','Em estoque','Valor em estoque','Ações'],S.cat.map(c=>[esc(c.name),esc(c.model),esc(c.supplier_name||'—'),c.unit_price?brl(c.unit_price):'—',q(c).length,brl(sum(q(c),u=>u.cost)),`<button onclick="catForm(${c.id})">Editar</button><button class="dg" onclick="catDel(${c.id})">Excluir</button>`]))}`}
function catDel(id){
 const c=S.cat.find(x=>x.id===id);if(!c)return;
 ask('Excluir peça','Excluir "'+c.name+' '+c.model+'" do catálogo? Esta ação não pode ser desfeita.',()=>rpc('catalog_delete',{p_id:id}));
}
function catForm(id){const c=S.cat.find(x=>x.id===id),N=!c;if(!S.sup.length)return toast('Cadastre um fornecedor primeiro.');
 modal(N?'Nova peça':'Editar '+c.name+' '+c.model,[...(N?[{n:'n',l:'Nome da peça',r:1},{n:'m',l:'Modelo do aparelho',r:1}]:[]),{n:'s',l:'Fornecedor padrão',v:N?S.sup[0].id:c.supplier_id,o:supOpt()},{n:'p',l:'Valor unitário (R$)',t:'number',v:N?'':c.unit_price,min:0,r:1}],
 d=>N?dbx(sb.from('catalog').insert({name:d.n.trim(),model:d.m.trim(),supplier_id:+d.s,unit_price:+d.p})):dbx(sb.from('catalog').update({supplier_id:+d.s,unit_price:+d.p}).eq('id',id)))}

const hf=()=>vis().h.filter(h=>(!H.s||h.unid===H.s)&&(!H.q||Object.values(h).join(' ').toLowerCase().includes(H.q.toLowerCase()))&&(!H.a||h.t>=new Date(H.a).getTime())&&(!H.b||h.t<=new Date(H.b).getTime()+864e5));
const hrows=()=>tbl(['Data','Funcionário','Unidade','Produto','Qtd','Tipo','Status anterior','Novo status','Ref. / motivo'],hf().map(x=>[dt(x.t),esc(x.u),esc(x.unid),esc(x.prod),x.qtd,x.tipo,esc(x.de),esc(x.para),esc(x.ref)]));
function pHis(){return `<h1>Histórico</h1><p class="mu sub">Registro permanente de todas as movimentações (busque por loja, funcionário, produto ou fornecedor)</p>
<div class=bar><input placeholder="Buscar funcionário, produto, fornecedor…" value="${esc(H.q)}" oninput="H.q=this.value;$('#hb').innerHTML=hrows()"><select onchange="H.s=this.value;$('#hb').innerHTML=hrows()"><option value="">Todas as unidades</option>${S.st.map(s=>`<option ${H.s===s.name?'selected':''}>${esc(s.name)}</option>`).join('')}</select>
<input type=date value="${H.a}" onchange="H.a=this.value;$('#hb').innerHTML=hrows()"><input type=date value="${H.b}" onchange="H.b=this.value;$('#hb').innerHTML=hrows()"><button onclick="exp('his')">${ic('download')} CSV</button></div><div id=hb>${hrows()}</div>`}

function exp(k){const U=S.units,R={
 ped:()=>S.orders.map(o=>({Pedido:o.id,Data:dt(o.t),Loja:sn(o.store),Peca:nm(o),Qtd:o.qty,Fornecedor:o.sup,Total:o.qty*o.price,Responsavel:o.user,Status:o.status})),
 com:()=>S.orders.filter(o=>o.price).map(o=>({Pedido:o.id,Data:dt(o.buyT),Fornecedor:o.sup,Loja:sn(o.store),Produto:nm(o),Qtd:o.qty,Unitario:o.price,Total:o.qty*o.price,Funcionario:o.buyer})),
 pec:()=>U.map(u=>({Codigo:u.id,Pedido:u.order,Peca:nm(u),Local:sn(u.loc),Status:u.status,Valor:u.cost})),
 dev:()=>U.filter(u=>u.status==='Devolvida').map(u=>({Codigo:u.id,Peca:nm(u),Pedido:u.order})),
 man:()=>U.filter(inM).map(u=>({Codigo:u.id,Peca:nm(u),Loja:sn(u.loc),Status:u.status})),
 uti:()=>U.filter(u=>u.status==='Utilizada').map(u=>({Codigo:u.id,Peca:nm(u),Loja:sn(u.loc),Pedido:u.order})),
 his:()=>hf().map(h=>({Data:dt(h.t),Funcionario:h.u,Unidade:h.unid,Produto:h.prod,Qtd:h.qtd,Tipo:h.tipo,Anterior:h.de,Novo:h.para,Ref:h.ref,Fornecedor:h.forn}))};csv('gestpecas_'+k,R[k]())}
function pRep(){const P=S.orders.filter(o=>o.price),sup=cnt(P,o=>o.sup,o=>o.qty),sv=cnt(P,o=>o.sup,o=>o.qty*o.price);
 return `<h1>Relatórios</h1><p class="mu sub">Exporte em CSV (abre no Excel)</p><div class=bar>${[['ped','Pedidos'],['com','Compras'],['pec','Peças'],['uti','Utilizadas'],['dev','Devolvidas'],['man','Em manutenção'],['his','Histórico']].map(x=>`<button onclick="exp('${x[0]}')">${ic('download')} ${x[1]}</button>`).join('')}</div>
<h3 style="margin-bottom:10px">Compras por fornecedor</h3>${tbl(['Fornecedor','Peças','Valor'],Object.keys(sup).map(k=>[esc(k),sup[k],brl(sv[k])]))}
<h3 style="margin-bottom:10px">Resumo por unidade</h3>${tbl(['Unidade','Utilizadas','Devolvidas','Em manutenção','Pedidos pendentes','Valor em estoque'],LJ().map(s=>{const u=S.units.filter(x=>x.loc===s.id);return[esc(s.name),u.filter(x=>x.status==='Utilizada').length,S.hist.filter(h=>h.tipo==='Devolução'&&h.sid===s.id).length,u.filter(inM).length,S.orders.filter(o=>o.store===s.id&&o.status==='Aguardando atendimento').length,brl(sum(u.filter(inStock),x=>x.cost))]}))}`}

function pTra(){const t=me.admin?S.tr.filter(x=>me.view==null||x.from===me.view||x.to===me.view):S.tr;
 const act=x=>(x.status===TS[0]&&!me.admin&&me.store===x.from?`<button class=pr onclick="ts('${x.id}','ok')">Dar OK</button><button onclick="ts('${x.id}','rj')">Recusar</button>`:'')+(x.status===TS[1]&&me.admin?`<button class=pr onclick="ts('${x.id}','ad')">Aprovar e transferir</button><button onclick="ts('${x.id}','rj')">Rejeitar</button>`:'');
 return `<h1>Transferências</h1><p class="mu sub">Loja solicita → OK da loja de origem (somente ela) → aprovação do admin → peças transferidas</p><div class=bar><button class=pr onclick="trForm()">+ Solicitar transferência</button></div>
${tbl(['Código','Data','Origem','Destino','Peça','Qtd','Solicitante','OK da origem','Status','Ações'],t.map(x=>[x.id,dt(x.t),esc(sn(x.from)),esc(sn(x.to)),esc(x.pn),x.qty,esc(x.by),x.okBy?esc(x.okBy):'—',badge(x.status),act(x)]))}`}
function ts(id,k){run(()=>rpc(k==='ok'?'transfer_ok':k==='rj'?'transfer_reject':'transfer_approve',{p_id:id}))}
function trForm(){if(!S.cat.length)return toast('Nenhuma peça cadastrada ainda.');
 modal('Solicitar transferência',[...(me.admin?[{n:'t',l:'Loja de destino (quem recebe)',o:lopt()}]:[]),{n:'f',l:'Loja de origem (quem envia)',o:[[CE,'Estoque Central'],...lopt().filter(x=>me.admin||x[0]!==me.store)]},{n:'p',l:'Peça',o:S.cat.map(c=>[c.name+' '+c.model,c.name+' '+c.model])},{n:'qty',l:'Quantidade',t:'number',v:1,min:1,r:1},{n:'m',l:'Motivo'}],
 d=>rpc('transfer_new',{p_from:+d.f,p_part:d.p,p_qty:+d.qty,p_to:me.admin?+d.t:null,p_note:d.m}))}

/* Usuários: o admin cria, redefine senha, troca de loja e ativa/desativa (sem precisar pedir) */
function pUsr(){return `<h1>Usuários</h1><p class="mu sub">Crie o acesso de funcionários, técnicos e administradores. Funcionários e técnicos entram só na própria loja e só movimentam o que é dela. Administradores veem e gerenciam todas as unidades.</p><div class=bar><button class=pr onclick="usrForm()">+ Novo usuário</button></div>
${tbl(['Nome','E-mail','Acesso','Unidade','Status','Ações'],S.users.map(u=>[esc(u.n),esc(u.email),u.dev?'Desenvolvedor':u.adm?'Administrador':u.tech?'Técnico':'Funcionário',u.adm?'Todas':esc(sn(u.store)),`<span class="tg ${u.on?'g':'r'}">${u.on?'Ativo':'Inativo'}</span>`,`<button onclick="usrEdit('${u.id}')">Editar</button>`+(u.id!==me.id&&!u.adm&&u.on&&!AS?`<button onclick="usrAs('${u.id}')">Logar como</button>`:'')]))}`}
function usrForm(){modal('Novo usuário',[{n:'n',l:'Nome do funcionário',r:1},{n:'e',l:'E-mail (será o login)',t:'email',r:1},{n:'s',l:'Unidade (loja)',o:lopt()},{n:'r',l:'Perfil',o:[['f','Funcionário (vendedor)'],['t','Técnico'],['a','Administrador (acesso total)'],...(me.dev?[['d','Desenvolvedor (acesso total + gerencia devs)']]:[])]},{n:'p',l:'Senha (mín. 6 caracteres)',t:'password',r:1}],
 async d=>{const id=await rpc('admin_create_user',{p_email:d.e,p_password:d.p,p_name:d.n,p_store:+d.s});if(d.r==='t')await rpc('admin_set_technician',{p_user:id,p_on:true});
  if(d.r==='a'||d.r==='d'){try{await rpc(d.r==='d'?'admin_set_dev':'admin_set_admin',{p_user:id,p_on:true})}catch(e){toast('Usuário criado, mas não foi possível torná-lo '+(d.r==='d'?'dev':'administrador')+': '+e.message+' Use o botão "'+(d.r==='d'?'Tornar dev':'Tornar admin')+'" na lista.')}}})}
function usrAdm(id){const u=S.users.find(x=>x.id===id);if(!u)return;
 ask(u.adm?'Remover administrador':'Tornar administrador',u.adm?u.n+' deixa de ser administrador e passa a ser funcionário da primeira loja (depois você pode trocar a unidade em Editar).':u.n+' passa a ter acesso total: todas as lojas, estoque central, usuários e exclusões.',()=>rpc('admin_set_admin',{p_user:id,p_on:!u.adm}),'Confirmar')}
function usrEdit(id){const u=S.users.find(x=>x.id===id);if(!u)return;const self=u.id===me.id,B=(f,t,c)=>`<button${c?' class='+c:''} onclick="cl();${f}('${id}')">${t}</button>`;
 $('#m').innerHTML=`<div class=md><h3>Editar — ${esc(u.n)}</h3><p class=mu style="margin:4px 0 0">${esc(u.email)} · ${u.dev?'Desenvolvedor':u.adm?'Administrador':u.tech?'Técnico':'Funcionário'}${u.adm?'':' · '+esc(sn(u.store))}</p>
 <div style="display:flex;flex-direction:column;gap:8px;margin-top:16px">${u.dev&&!me.dev?'<p class=mu style="margin:0">Somente o desenvolvedor pode alterar este usuário.</p>':B('usrPass','Redefinir senha')+(self?'':B('usrAdm',u.adm?'Remover admin':'Tornar admin'))+(me.dev&&!self?B('usrDev',u.dev?'Remover dev':'Tornar dev'):'')}${u.adm?'':B('usrTec',u.tech?'Remover técnico':'Tornar técnico')+B('usrGlass',u.gl?'Remover acesso ao Reparo em Vidro':'Dar acesso ao Reparo em Vidro (Paola)')+B('usrStore','Trocar loja')+B('usrTog',u.on?'Desativar':'Ativar')}${self||(u.dev&&!me.dev)?'':B('usrDel','Excluir usuário','dg')}<button onclick=cl()>Fechar</button></div></div>`;$('#m').className='ov on'}
function usrDel(id){const u=S.users.find(x=>x.id===id);if(!u)return;
 ask('Excluir usuário','Excluir o acesso de '+u.n+' ('+u.email+')?\nEle não vai mais conseguir entrar. Se tiver histórico no sistema, use Desativar em vez de excluir. Esta ação não pode ser desfeita.',()=>rpc('admin_delete_user',{p_user:id}))}
/* Logar como outro usuário (só admin; a troca é feita por uma Edge Function, sem digitar senha) */
let AS=null;
function usrAs(id){const u=S.users.find(x=>x.id===id);if(!u)return;
 ask('Logar como '+u.n,'Você vai entrar na conta de '+u.n+' ('+u.email+') sem usar a senha dela.\nTudo o que você fizer ali ficará registrado no nome dessa pessoa. Para voltar, use o botão no topo da tela.',async()=>{
  const{data:{session}}=await sb.auth.getSession();if(!session)throw new Error('Sessão expirada. Entre novamente.');
  const r=await sb.functions.invoke('smooth-service',{body:{user_id:id},headers:{Authorization:'Bearer '+session.access_token}});
  if(r.error){let m=r.error.message;try{const j=await r.error.context.json();if(j&&j.error)m=j.error}catch(_){}throw new Error(m)}
  const v=await sb.auth.verifyOtp({token_hash:r.data.token_hash,type:'magiclink'});
  if(v.error)throw new Error(v.error.message);
  AS={access_token:session.access_token,refresh_token:session.refresh_token};await enter()},'Entrar')}
async function backAdmin(){if(!AS)return;const a=AS;AS=null;booting=true;render();
 try{await sb.auth.signOut({scope:'local'});const{error}=await sb.auth.setSession(a);if(error)throw error;await enter()}
 catch(e){booting=false;me=null;try{await sb.auth.signOut({scope:'local'})}catch(_){}render();toast('Sua sessão de administrador expirou. Entre novamente.')}}
function usrDev(id){const u=S.users.find(x=>x.id===id);if(!u)return;
 ask(u.dev?'Remover dev':'Tornar dev',u.dev?u.n+' deixa de ser dev, mas continua administrador.':u.n+' passa a ser dev: acesso total de administrador, e só devs podem alterar, redefinir senha ou excluir outro dev.',()=>rpc('admin_set_dev',{p_user:id,p_on:!u.dev}),'Confirmar')}
function usrTec(id){const u=S.users.find(x=>x.id===id);run(()=>rpc('admin_set_technician',{p_user:id,p_on:!u.tech}))}
function usrGlass(id){const u=S.users.find(x=>x.id===id);run(()=>rpc('admin_set_glass_editor',{p_user:id,p_on:!u.gl}))}
function usrPass(id){const u=S.users.find(x=>x.id===id);modal('Nova senha de '+esc(u.n),[{n:'p',l:'Nova senha (mín. 6 caracteres)',t:'password',r:1}],d=>rpc('admin_set_password',{p_user:id,p_password:d.p}))}
function usrStore(id){const u=S.users.find(x=>x.id===id);modal('Trocar loja de '+esc(u.n),[{n:'s',l:'Nova loja',v:u.store,o:lopt()}],d=>rpc('admin_set_store',{p_user:id,p_store:+d.s}))}
function usrTog(id){const u=S.users.find(x=>x.id===id);run(()=>rpc('admin_set_active',{p_user:id,p_on:!u.on}))}

/* ---------- Fechamento Técnico (técnico preenche; todos consultam) ---------- */
let F={q:'',a:'',b:'',mine:false};
const dbr=d=>d?String(d).split('-').reverse().join('/'):'—';
const fcf=()=>S.tc.filter(x=>(!F.mine||x.uid===me.id)&&(!F.a||x.d>=F.a)&&(!F.b||x.d<=F.b)&&(!F.q||[x.os,x.cu,x.sv,x.sup,x.by,sn(x.store)].join(' ').toLowerCase().includes(F.q.toLowerCase())));
const fcrows=()=>{const l=fcf(),ch=sum(l,x=>x.ch),pc=sum(l,x=>x.pc),rows=l.map(x=>[dbr(x.d),esc(x.os),esc(x.cu),esc(x.sv),brl(x.pc),brl(x.ch),esc(x.sup||'—'),esc(x.by),esc(sn(x.store))]);
 if(l.length)rows.push([`<b>Totais (${l.length})</b>`,'','','',`<b>${brl(pc)}</b>`,`<b>${brl(ch)}</b>`,'','','']);
 return tbl(['Data','OS','Cliente','Serviço realizado','Valor da peça','Valor cobrado','Fornecedor','Técnico','Loja'],rows)};
function pFec(){
 return `<h1>Fechamento Técnico</h1><p class="mu sub">Registro diário dos serviços realizados. Cada preenchimento gera um registro, com a data salva automaticamente.</p>
<div class=bar>${me.tech?`<button class=pr onclick="fecForm()">+ Novo fechamento</button>`:''}<input placeholder="Buscar OS, cliente, serviço, fornecedor…" value="${esc(F.q)}" oninput="F.q=this.value;$('#fb').innerHTML=fcrows()"><input type=date value="${F.a}" onchange="F.a=this.value;$('#fb').innerHTML=fcrows()"><input type=date value="${F.b}" onchange="F.b=this.value;$('#fb').innerHTML=fcrows()">${me.tech?`<label style="display:flex;gap:6px;align-items:center;margin:0"><input type=checkbox style="width:auto" ${F.mine?'checked':''} onchange="F.mine=this.checked;$('#fb').innerHTML=fcrows()"> Só os meus</label>`:''}</div><div id=fb>${fcrows()}</div>`}
function fecForm(){
 modal('Novo fechamento',[{n:'os',l:'OS (número da ordem de serviço)',r:1},{n:'cu',l:'Cliente',r:1},{n:'sv',l:'Serviço realizado',r:1},
  {n:'pc',l:'Valor da peça (R$)',t:'number',v:0,min:0,r:1},{n:'ch',l:'Valor cobrado do cliente (R$)',t:'number',min:0,r:1},{n:'fo',l:'Fornecedor'}],
  d=>rpc('closing_new',{p_os:d.os,p_customer:d.cu,p_service:d.sv,p_part_cost:+d.pc,p_charged:+d.ch,p_supplier:d.fo}));
 const fo=$('#m form').elements.fo;fo.setAttribute('list','dlf');fo.setAttribute('autocomplete','off');
 fo.insertAdjacentHTML('afterend',`<datalist id=dlf>${(S.supv.length?S.supv:S.sup).map(s=>`<option value="${esc(s.name)}">`).join('')}</datalist>`)}

/* ---------- Manutenção de Manetes (todos veem; só o técnico cadastra e atualiza) ---------- */
const MS=['Aguardando peças','Sem reparo','Pronta','Enviada para reparo em placa'];
let MF='';
const mbadge=s=>`<span class="tg ${s==='Aguardando peças'?'w':s==='Sem reparo'?'r':s==='Pronta'?'g':''}">${esc(s)}</span>`;
function pMan(){const l=S.cr.filter(x=>!MF||x.st===MF);
 return `<h1>Manutenção de Manetes</h1><p class="mu sub">Acompanhe o status de cada manete. Todos visualizam; somente o técnico atualiza.</p>
<div class=bar>${me.tech?`<button class=pr onclick="manForm()">+ Nova manete</button>`:''}<select onchange="MF=this.value;render()"><option value="">Todos os status</option>${MS.map(s=>`<option ${MF===s?'selected':''}>${esc(s)}</option>`).join('')}</select></div>
<div class=cards>${MS.map(s=>`<div class=card><small>${ic('gamepad')} ${esc(s)}</small><strong>${S.cr.filter(x=>x.st===s).length}</strong></div>`).join('')}</div>
${tbl(['OS','Loja de origem','Status','Cadastrado em','Última atualização',...(me.tech?['Ações']:[])],l.map(x=>[esc(x.os),esc(sn(x.store)),mbadge(x.st),dt(x.t),dt(x.ut)+' · '+esc(x.ub),...(me.tech?[`<button onclick="manSt(${x.id})">Atualizar status</button><button onclick="manEdit(${x.id})">Editar</button><button class=dg onclick="manDel(${x.id})">Excluir</button>`]:[])]))}`}
function manForm(){modal('Nova manete',[{n:'os',l:'Número da OS',r:1},{n:'s',l:'Loja de origem',o:lopt()},{n:'st',l:'Status',o:MS.map(x=>[x,x])}],
 d=>rpc('controller_new',{p_os:d.os,p_store:+d.s,p_status:d.st}))}
function manEdit(id){const x=S.cr.find(v=>v.id===id);if(!x)return;
 modal('Editar manete — OS '+esc(x.os),[{n:'os',l:'Número da OS',v:x.os,r:1},{n:'s',l:'Loja de origem',v:x.store,o:lopt()},{n:'st',l:'Status',v:x.st,o:MS.map(s=>[s,s])}],
 d=>rpc('controller_update',{p_id:id,p_os:d.os,p_store:+d.s,p_status:d.st}))}
function manDel(id){const x=S.cr.find(v=>v.id===id);if(!x)return;
 ask('Excluir manete','Excluir a manete da OS '+x.os+' ('+sn(x.store)+')? Esta ação não pode ser desfeita.',()=>rpc('controller_delete',{p_id:id}))}
function manSt(id){const x=S.cr.find(v=>v.id===id);if(!x)return;
 modal('Status da manete — OS '+esc(x.os),[{n:'st',l:'Status (atual: '+x.st+')',v:x.st,o:MS.map(s=>[s,s])}],d=>rpc('controller_set_status',{p_id:id,p_status:d.st}))}

/* ---------- Painel do desenvolvedor (só dev): Auditoria, Diagnóstico, Backup e Erros ---------- */
const DT=['aud','dia','bkp','err'],APP_V='20261117e';
const D0=()=>({aud:[],err:[],diag:null,diagMs:0,miss:'',ld:false,ne:0});
let D=D0();
const AU={q:'',k:'',a:'',b:''},ER={lvl:'erro',res:'0',q:''};
async function devFetch(t){
 if(!me||!me.dev)return;
 try{
  if(t==='aud')D.aud=await all(()=>sb.from('audit_log').select('*').order('at',{ascending:false}).order('id',{ascending:false}),10);
  if(t==='err')D.err=await all(()=>sb.from('error_log').select('*').order('at',{ascending:false}).order('id',{ascending:false}),5);
  if(t==='dia'||t==='bkp'){const t0=performance.now();D.diag=await rpc('dev_diagnostics');D.diagMs=Math.round(performance.now()-t0)}
  D.miss=''}
 catch(e){D.miss=e.message||String(e);if(t==='dia'||t==='bkp')D.diag=null}}
async function go(t){tab=t;if(me&&me.dev&&DT.includes(t)){D.ld=true;render();await devFetch(t);D.ld=false}render()}
const needMig=m=>/audit_log|error_log|dev_diagnostics|dev_error|log_client|schema cache|does not exist|Could not find/i.test(m||'');
const devBox=()=>`<div class=box style="border-color:var(--w)"><h3>Não foi possível carregar</h3><p class=mu style="line-height:1.55">${esc(D.miss)}${needMig(D.miss)?'<br><br>Provavelmente falta rodar o <b>migracao_dev_painel.sql</b> no Supabase (SQL Editor). Depois clique em <b>Atualizar dados</b>.':''}</p></div>`;
const devWrap=(title,sub,body)=>`<h1>${title}</h1><p class="mu sub">${sub}</p>${D.ld?'<div class=box><p class=mu>Carregando…</p></div>':D.miss?devBox():body()}`;
const wrapTxt=h=>`<div style="white-space:normal;min-width:240px;max-width:480px">${h}</div>`;

/* --- Auditoria --- */
const AK={user_create:'Usuário criado',user_delete:'Usuário excluído',admin_on:'Virou administrador',admin_off:'Deixou de ser administrador',dev_on:'Virou dev',dev_off:'Deixou de ser dev',tech_on:'Virou técnico',tech_off:'Deixou de ser técnico',user_on:'Usuário ativado',user_off:'Usuário desativado',store_change:'Troca de loja',password_reset:'Senha redefinida',impersonate:'Logar como',backup_export:'Backup exportado',errors_clear:'Erros limpos'};
const AT={user_create:'g',user_on:'g',admin_on:'w',admin_off:'w',dev_on:'w',dev_off:'w',password_reset:'w',impersonate:'w',user_off:'r',user_delete:'r'};
const adet=x=>{const d=x.details||{};
 if(x.action==='store_change')return (d.de||'—')+' → '+(d.para||'—');
 if(x.action==='user_create')return [d.email,d.loja].filter(Boolean).join(' · ');
 if(x.action==='backup_export')return (d.fmt||'')+' · '+(d.n||0)+' tabelas · '+(d.rows||0)+' linhas';
 if(x.action==='errors_clear')return (d.n||0)+' removidos';
 if(d.email&&Object.keys(d).length===1)return d.email;
 return Object.keys(d).length?JSON.stringify(d):''};
const aufil=()=>D.aud.filter(x=>{const t=Date.parse(x.at);return(!AU.k||x.action===AU.k)&&(!AU.a||t>=new Date(AU.a).getTime())&&(!AU.b||t<=new Date(AU.b).getTime()+864e5)&&(!AU.q||[x.actor_name,x.target_name,AK[x.action]||x.action,adet(x)].join(' ').toLowerCase().includes(AU.q.toLowerCase()))});
const aurows=()=>{const l=aufil();return tbl(['Data','Quem fez','Ação','Alvo','Detalhes'],l.slice(0,500).map(x=>[dt(x.at),esc(x.actor_name||'—'),`<span class="tg ${AT[x.action]||''}">${esc(AK[x.action]||x.action)}</span>`,esc(x.target_name||'—'),esc(adet(x))]))+(l.length>500?`<p class=mu style="margin:-8px 0 14px">Mostrando 500 de ${l.length}. Use os filtros ou exporte o CSV.</p>`:'')};
function pAud(){return devWrap('Auditoria','Quem mudou acessos e senhas, quem usou o Logar como e quem exportou dados. O registro só recebe inclusão: nem o dev apaga pela tela.',()=>{
 const now=Date.now(),n30=a=>D.aud.filter(x=>x.action===a&&now-Date.parse(x.at)<2592e6).length;
 return `<div class=cards><div class=card><small>${ic('history')} Eventos registrados</small><strong>${D.aud.length}</strong></div><div class=card><small>${ic('clock')} Últimos 7 dias</small><strong>${D.aud.filter(x=>now-Date.parse(x.at)<6048e5).length}</strong></div><div class=card><small>${ic('eye')} Logar como (30 dias)</small><strong>${n30('impersonate')}</strong></div><div class=card><small>${ic('users')} Senhas redefinidas (30 dias)</small><strong>${n30('password_reset')}</strong></div></div>
<div class=bar><input placeholder="Buscar pessoa, ação ou detalhe…" value="${esc(AU.q)}" oninput="AU.q=this.value;$('#ab').innerHTML=aurows()"><select onchange="AU.k=this.value;$('#ab').innerHTML=aurows()"><option value="">Todas as ações</option>${Object.entries(AK).map(([k,v])=>`<option value="${k}" ${AU.k===k?'selected':''}>${esc(v)}</option>`).join('')}</select><input type=date value="${AU.a}" onchange="AU.a=this.value;$('#ab').innerHTML=aurows()"><input type=date value="${AU.b}" onchange="AU.b=this.value;$('#ab').innerHTML=aurows()"><button onclick="audCsv()">${ic('download')} CSV</button></div><div id=ab>${aurows()}</div>`})}
function audCsv(){csv('auditoria',aufil().map(x=>({Data:dt(x.at),Quem:x.actor_name,Acao:AK[x.action]||x.action,Alvo:x.target_name,Detalhes:adet(x)})))}

/* --- Diagnóstico do sistema --- */
const fixTxt=f=>f?(/^[\w]+\.sql/.test(f)?'Rodar '+f+' no SQL Editor':f):'';
function pDia(){return devWrap('Diagnóstico do sistema','Confere se o banco tem tudo o que o site espera. Migração esquecida aparece aqui como pendência, e não como erro solto na tela dos usuários.',()=>{
 const g=D.diag;if(!g)return '<p class=mu>Sem dados.</p>';
 const ck=g.checks||[],bad=ck.filter(c=>!c.ok),n=g.numbers||{},v=k=>+n[k]||0;
 const num=[
  ['Devs ativos',v('devs'),v('devs')>0,'Precisa haver pelo menos 1.'],
  ['Administradores ativos (inclui devs)',v('admins'),v('admins')>0,'Precisa haver pelo menos 1.'],
  ['Usuários ativos / inativos',v('active')+' / '+v('inactive'),true,''],
  ['Usuários de loja sem loja',v('no_store'),!v('no_store'),'Ativos, não admin e sem loja: não enxergam nada. Use Usuários → Trocar loja.'],
  ['Técnicos que também são admin',v('tech_admin'),!v('tech_admin'),'Não deveria existir (regra tecnico_nao_admin).'],
  ['Devs que não são admin',v('dev_not_admin'),!v('dev_not_admin'),'O dev deve ser administrador também.'],
  ['Logins sem perfil',v('auth_no_profile'),!v('auth_no_profile'),'Existem no Auth, mas entram como "sem acesso". Crie o perfil ou exclua o login.'],
  ['Erros pendentes (24 h)',v('errors_24h'),!v('errors_24h'),'Veja em Erros do sistema.'],
  ...('glass_editors' in n?[['Quem edita Reparo em Vidro',v('glass_editors'),v('glass_editors')>0,'Ninguém tem a marca: nem a Paola consegue editar. Veja o fim do migracao_reparo_vidro.sql.']]:[])];
 return `<div class=bar><button class=pr onclick="go('dia')">${ic('refresh')} Executar de novo</button></div>
<div class=cards><div class=card><small>${ic('check')} Verificações</small><strong>${ck.length}</strong></div><div class=card><small>${ic('circle-check')} Passaram</small><strong>${ck.length-bad.length}</strong></div><div class=card><small>${ic('activity')} Pendências</small><strong>${bad.length}</strong></div><div class=card><small>${ic('clock')} Resposta do banco</small><strong>${D.diagMs} ms</strong></div></div>
${bad.length?`<h3 style="margin-bottom:10px">Pendências</h3>${tbl(['Item','Tipo','Como corrigir'],bad.map(c=>[`<span class=mono>${esc(c.name)}</span>`,esc(c.grp),esc(fixTxt(c.fix))]))}`:`<div class=box style="margin-bottom:18px"><h3>Tudo certo</h3><p class=mu>As ${ck.length} verificações passaram.</p></div>`}
<h3 style="margin-bottom:10px">Usuários e acessos</h3>${tbl(['Verificação','Resultado','Situação','Observação'],num.map(x=>[x[0],`<b>${esc(x[1])}</b>`,`<span class="tg ${x[2]?'g':'r'}">${x[2]?'OK':'Atenção'}</span>`,x[2]?'':wrapTxt(esc(x[3]))]))}
<details class=dtl><summary>Ver as ${ck.length} verificações</summary>${tbl(['Item','Tipo','Situação'],ck.map(c=>[`<span class=mono>${esc(c.name)}</span>`,esc(c.grp),`<span class="tg ${c.ok?'g':'r'}">${c.ok?'OK':'Pendente'}</span>`]))}</details>
<p class=mu style="max-width:75ch;line-height:1.55">O banco não enxerga a Edge Function <b>smooth-service</b> (Logar como). Se ela não foi republicada com o código novo de <code>backend/edge-function/logar-como.ts</code>, o botão funciona, mas o uso dele não aparece na Auditoria.</p>`})}

/* --- Backup e dados --- */
const BK=[['stores','Lojas'],['profiles','Usuarios'],['suppliers','Fornecedores'],['catalog','Catalogo'],['orders','Pedidos'],['units','Pecas'],['unit_trail','Rastro_das_pecas'],['history','Historico'],['transfers','Transferencias'],['maintenances','Manutencoes'],['tech_closings','Fechamento_tecnico'],['controller_repairs','Manetes'],['glass_repairs','Reparo_em_vidro',1],['audit_log','Auditoria',1],['error_log','Erros',1]];
const BKS={busy:false,msg:''};
const bkMsg=m=>{BKS.msg=m;const e=$('#bkm');if(e)e.textContent=m};
const bkBtn=on=>['#bk1','#bk2'].forEach(s=>{const b=$(s);if(b)b.disabled=on});
const flat=r=>{const o={};for(const k in r){const v=r[k];o[k]=v!==null&&typeof v==='object'?JSON.stringify(v):v}return o};
const stamp=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes())};
function pBkp(){const r=(D.diag&&D.diag.rows)||{};
 return `<h1>Backup e dados</h1><p class="mu sub">Baixa uma cópia de todas as tabelas do sistema para guardar fora do Supabase.</p>${D.ld?'<div class=box><p class=mu>Carregando…</p></div>':`
<div class=bar><button class=pr id=bk1 onclick="bkExport('xlsx')">${ic('download')} Exportar tudo (.xlsx)</button><button id=bk2 onclick="bkExport('json')">${ic('download')} Exportar tudo (.json)</button></div>
<p class=mu id=bkm style="margin-bottom:16px">${esc(BKS.msg)}</p>
${D.miss?`<p class=tg style="display:inline-block;margin-bottom:14px">Não foi possível contar as linhas (${esc(D.miss)}). A exportação continua funcionando, só sem a conferência de totais.</p>`:''}
<div class=cards>${BK.map(b=>`<div class=card><small>${ic('database')} ${esc(b[1].replace(/_/g,' '))}</small><strong>${r[b[0]]??'—'}</strong></div>`).join('')}</div>
<div class=box><h3>Antes de guardar</h3><p class=mu style="line-height:1.6;max-width:75ch">O arquivo tem nomes, e-mails e contatos de fornecedores: guarde em lugar seguro. Não inclui senhas nem a tabela de logins do Supabase. É uma cópia de consulta, não um restore automático; para restaurar o banco inteiro, use também o backup do próprio Supabase (Database → Backups).</p></div>`}`}
async function bkExport(fmt){
 if(BKS.busy||!me||!me.dev)return;BKS.busy=true;bkBtn(true);
 const data={},notes=[];let total=0;
 try{
  const rows=(D.diag&&D.diag.rows)||{};
  for(const[t,sheet,opt]of BK){
   bkMsg('Lendo '+sheet.replace(/_/g,' ')+'…');
   try{data[t]=await all(()=>sb.from(t).select('*').order('id'),400)}
   catch(e){if(!opt)throw new Error('Falha ao ler '+t+': '+(e.message||e));notes.push(t+': não exportada ('+(e.message||e)+')');continue}
   total+=data[t].length;
   if(rows[t]!=null&&rows[t]!==data[t].length)notes.push(t+': leu '+data[t].length+' de '+rows[t]+' linhas');
  }
  const meta={gerado_em:new Date().toISOString(),gerado_por:me.name,versao_site:APP_V,linhas:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.length])),avisos:notes},name='oficina-do-smart_backup_'+stamp();
  if(fmt==='json'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({...meta,tabelas:data},null,1)],{type:'application/json'}));a.download=name+'.json';a.click()}
  else{const wb=XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet([{info:'Gerado em',valor:dt(meta.gerado_em)},{info:'Gerado por',valor:me.name},...Object.entries(meta.linhas).map(([k,v])=>({info:k,valor:v+' linhas'})),...notes.map(x=>({info:'AVISO',valor:x}))]),'LEIA-ME');
   BK.forEach(([t,sheet])=>{if(data[t])XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data[t].map(flat)),sheet)});
   XLSX.writeFile(wb,name+'.xlsx')}
  try{await rpc('dev_audit_note',{p_action:'backup_export',p_details:{fmt,n:Object.keys(data).length,rows:total}})}catch(_){}
  bkMsg('Backup concluído: '+Object.keys(data).length+' tabelas, '+total.toLocaleString('pt-BR')+' linhas.'+(notes.length?' Atenção: '+notes.join(' · '):''));
  if(notes.length)toast('Backup gerado com avisos. Veja a mensagem na tela.');
 }catch(e){bkMsg('Falhou: '+(e.message||e));terr(e)}
 finally{BKS.busy=false;bkBtn(false)}}

/* --- Erros do sistema --- */
const erfil=()=>D.err.filter(x=>(ER.lvl==='all'||x.level===ER.lvl)&&(ER.res==='all'||(ER.res==='1')===!!x.resolved)&&(!ER.q||[x.user_name,x.fn,x.code,x.message,x.page].join(' ').toLowerCase().includes(ER.q.toLowerCase())));
const errows=()=>{const l=erfil();return tbl(['Data','Usuário','Loja','Onde','Mensagem','Tela','Ações'],l.slice(0,300).map(x=>[dt(x.at),esc(x.user_name||'—'),esc(sn(x.store_id)),`<span class=mono>${esc(x.fn||x.source)}</span>${x.code?' <span class=mu>'+esc(x.code)+'</span>':''}`,wrapTxt(`<span class="tg ${x.level==='aviso'?'w':'r'}">${x.level==='aviso'?'Aviso':'Erro'}</span> ${esc(x.message)}`),esc(x.page),x.resolved?`<button onclick="errRes(${x.id},false)">Reabrir</button>`:`<button class=pr onclick="errRes(${x.id},true)">Resolvido</button>`]))+(l.length>300?`<p class=mu style="margin:-8px 0 14px">Mostrando 300 de ${l.length}. Use os filtros.</p>`:'')};
function pErr(){return devWrap('Erros do sistema','Tudo o que falhou na tela dos usuários e sumiria com o aviso. Erro = problema do sistema (função faltando, permissão, rede, script). Aviso = regra de negócio, como "Informe a OS".',()=>{
 const now=Date.now(),pe=D.err.filter(x=>!x.resolved&&x.level==='erro');
 return `<div class=cards><div class=card><small>${ic('bug')} Erros pendentes</small><strong>${pe.length}</strong></div><div class=card><small>${ic('clock')} Erros nas últimas 24 h</small><strong>${D.err.filter(x=>x.level==='erro'&&now-Date.parse(x.at)<864e5).length}</strong></div><div class=card><small>${ic('clipboard')} Avisos pendentes</small><strong>${D.err.filter(x=>!x.resolved&&x.level==='aviso').length}</strong></div></div>
<div class=bar><input placeholder="Buscar usuário, função, mensagem…" value="${esc(ER.q)}" oninput="ER.q=this.value;$('#eb2').innerHTML=errows()"><select onchange="ER.lvl=this.value;$('#eb2').innerHTML=errows()"><option value=erro ${ER.lvl==='erro'?'selected':''}>Só erros</option><option value=aviso ${ER.lvl==='aviso'?'selected':''}>Só avisos de regra</option><option value=all ${ER.lvl==='all'?'selected':''}>Erros e avisos</option></select><select onchange="ER.res=this.value;$('#eb2').innerHTML=errows()"><option value=0 ${ER.res==='0'?'selected':''}>Pendentes</option><option value=1 ${ER.res==='1'?'selected':''}>Resolvidos</option><option value=all ${ER.res==='all'?'selected':''}>Todos</option></select><button class=dg onclick="errClear()">Limpar resolvidos</button></div><div id=eb2>${errows()}</div>`})}
function errRes(id,on){run(()=>rpc('dev_error_resolve',{p_id:id,p_on:on}))}
function errClear(){ask('Limpar erros resolvidos','Apaga de vez os erros marcados como resolvidos. Os pendentes ficam. Esta ação fica registrada na Auditoria.',()=>rpc('dev_error_clear',{p_days:0}),'Limpar')}

/* ---------- Reparo em Vidro (todos veem; só a Paola cadastra, edita, atualiza e exclui) ---------- */
const GS=['Pronto','Em manutenção','Display danificado'];
let GF={s:'',q:''};
const gbadge=s=>`<span class="tg ${s==='Em manutenção'?'w':s==='Display danificado'?'r':s==='Pronto'?'g':''}">${esc(s)}</span>`;
const gvl=()=>S.gr.filter(x=>(!GF.s||x.st===GF.s)&&(!GF.q||[x.os,x.dev,x.nt,sn(x.store),x.by].join(' ').toLowerCase().includes(GF.q.toLowerCase())));
const grows=()=>tbl(['OS','Loja de origem','Aparelho','Status','Observação','Cadastrado em','Última atualização',...(me.glass?['Ações']:[])],gvl().map(x=>[esc(x.os),esc(sn(x.store)),esc(x.dev||'—'),gbadge(x.st),x.nt?wrapTxt(esc(x.nt)):'—',dt(x.t),dt(x.ut)+' · '+esc(x.ub),...(me.glass?[`<button onclick="vidSt(${x.id})">Atualizar status</button><button onclick="vidEdit(${x.id})">Editar</button><button class=dg onclick="vidDel(${x.id})">Excluir</button>`]:[])]));
function pVid(){
 return `<h1>Reparo em Vidro</h1><p class="mu sub">Acompanhe os reparos em vidro de cada loja. Todos visualizam; somente a Paola cadastra e atualiza.</p>
<div class=bar>${me.glass?`<button class=pr onclick="vidForm()">+ Cadastrar serviço</button>`:''}<input placeholder="Buscar OS, aparelho, loja, observação…" value="${esc(GF.q)}" oninput="GF.q=this.value;$('#gb').innerHTML=grows()"><select onchange="GF.s=this.value;$('#gb').innerHTML=grows()"><option value="">Todos os status</option>${GS.map(s=>`<option ${GF.s===s?'selected':''}>${esc(s)}</option>`).join('')}</select></div>
<div class=cards>${GS.map(s=>`<div class=card><small>${ic('phone')} ${esc(s)}</small><strong>${S.gr.filter(x=>x.st===s).length}</strong></div>`).join('')}</div>
<div id=gb>${grows()}</div>`}
const vidOk=()=>me.glass||(toast('Somente a Paola pode alterar os reparos em vidro.'),false);
function vidForm(){if(!vidOk())return;
 modal('Cadastrar serviço — Reparo em Vidro',[{n:'os',l:'OS',r:1},{n:'s',l:'Loja',o:lopt()},{n:'dv',l:'Modelo do aparelho',r:1},{n:'st',l:'Status',o:GS.map(x=>[x,x])},{n:'nt',l:'Observação'}],
  d=>rpc('glass_new',{p_os:d.os,p_store:+d.s,p_device:d.dv,p_status:d.st,p_note:d.nt}))}
function vidEdit(id){const x=S.gr.find(v=>v.id===id);if(!x||!vidOk())return;
 modal('Editar reparo — OS '+esc(x.os),[{n:'os',l:'OS',v:x.os,r:1},{n:'s',l:'Loja',v:x.store,o:lopt()},{n:'dv',l:'Modelo do aparelho',v:x.dev,r:1},{n:'st',l:'Status',v:x.st,o:GS.map(s=>[s,s])},{n:'nt',l:'Observação',v:x.nt}],
  d=>rpc('glass_update',{p_id:id,p_os:d.os,p_store:+d.s,p_device:d.dv,p_status:d.st,p_note:d.nt}))}
function vidSt(id){const x=S.gr.find(v=>v.id===id);if(!x||!vidOk())return;
 modal('Status do reparo — OS '+esc(x.os),[{n:'st',l:'Status (atual: '+x.st+')',v:x.st,o:GS.map(s=>[s,s])}],d=>rpc('glass_set_status',{p_id:id,p_status:d.st}))}
function vidDel(id){const x=S.gr.find(v=>v.id===id);if(!x||!vidOk())return;
 ask('Excluir reparo','Excluir o reparo em vidro da OS '+x.os+' ('+sn(x.store)+')? Esta ação não pode ser desfeita.',()=>rpc('glass_delete',{p_id:id}))}

/* ---------- Técnico cadastra peça (vai direto para o estoque da própria loja) ---------- */
function partForm(){if(!me.tech)return toast('Somente o técnico cadastra peças por aqui.');
 const key=(n,m)=>(n||'').trim().toLowerCase()+'|'+(m||'').trim().toLowerCase(),find=(n,m)=>S.cat.find(c=>key(c.name,c.model)===key(n,m));
 modal('Cadastrar peça — '+esc(sn(me.store)),[{n:'n',l:'Nome da peça',r:1},{n:'m',l:'Modelo do aparelho',r:1},{n:'q',l:'Quantidade',t:'number',v:1,min:1,r:1},{n:'s',l:'Fornecedor',o:supV()},{n:'v',l:'Valor unitário (R$)',t:'number',min:0.01,r:1}],
  d=>{if(!d.s){const e=new Error('Escolha o fornecedor.');e.code='P0001';throw e}
   return rpc('part_register',{p_name:d.n,p_model:d.m,p_qty:+d.q,p_supplier_id:+d.s,p_price:+d.v})});
 const f=$('#m form').elements,uniq=a=>[...new Set(a)].sort((x,y)=>x.localeCompare(y,'pt-BR'));
 f.n.setAttribute('list','dln');f.m.setAttribute('list','dlm');f.n.setAttribute('autocomplete','off');f.m.setAttribute('autocomplete','off');
 f.n.insertAdjacentHTML('afterend',`<datalist id=dln>${uniq(S.cat.map(c=>c.name)).map(x=>`<option value="${esc(x)}">`).join('')}</datalist>`);
 f.m.insertAdjacentHTML('afterend',`<datalist id=dlm>${uniq(S.cat.map(c=>c.model)).map(x=>`<option value="${esc(x)}">`).join('')}</datalist>`);
 const fill=()=>{const c=find(f.n.value,f.m.value);if(c){if(!f.s.value)f.s.value=c.supplier_id||'';if(!f.v.value&&c.unit_price)f.v.value=c.unit_price}};
 f.n.onchange=fill;f.m.onchange=fill}

/* ---------- Shell ---------- */
function render(){
 if(!me){$('#app').innerHTML=booting?'<div class=lg><div class=boot><i></i><p class=mu>Carregando…</p></div></div>':login();return}
 if(!me.admin&&['cat','sup','stk','rep','usr'].includes(tab))tab='dash';
 if(!me.dev&&DT.includes(tab))tab='dash';
 const pn=S.tr.filter(x=>me.admin?x.status===TS[1]:x.status===TS[0]&&x.from===me.store).length;
 const N=[['dash','dashboard','Dashboard',1],['ord','clipboard',me.admin?'Pedidos':'Solicitar Peças',1],['pcs','cpu','Controle de Peças',1],['cen','warehouse','Estoque Central',1],['ret','undo','Devoluções',1],['use','circle-check','Peças Utilizadas',1],['mnt','wrench','Manutenção',1],['fec','banknote','Fechamento Técnico',1],['man','gamepad','Manutenção de Manetes',1],['vid','phone','Reparo em Vidro',1],['cat','book','Catálogo de Peças',2],['sup','factory','Fornecedores',2],['stk','warehouse','Estoques',2],['tra','swap','Transferências'+(pn?' ('+pn+')':''),1],['his','history','Histórico',1],['rep','file','Relatórios',2],['usr','users','Usuários',2],['aud','shield','Auditoria',3],['dia','activity','Diagnóstico do sistema',3],['bkp','database','Backup e dados',3],['err','bug','Erros do sistema'+(D.ne?' ('+D.ne+')':''),3]].filter(n=>n[3]===1||(n[3]===2&&me.admin)||(n[3]===3&&me.dev));
 const P={dash:pDash,cen:pCen,ord:pOrd,pcs:pUnits,ret:pUnits,use:pUnits,mnt:pMnt,cat:pCat,tra:pTra,usr:pUsr,sup:pSup,stk:pStk,his:pHis,rep:pRep,fec:pFec,man:pMan,vid:pVid,aud:pAud,dia:pDia,bkp:pBkp,err:pErr};
 const sy=document.querySelector('aside')?.scrollTop||0;
 $('#app').innerHTML=`<aside><h2>${ic('phone')} Oficina do <span>Smart</span></h2>${N.map(n=>(n[0]==='aud'?'<p class=sp>Desenvolvedor</p>':'')+`<a class="${n[0]===tab?'on':''}" onclick="go('${n[0]}')">${ic(n[1])} ${n[2]}</a>`).join('')}

 ${me.admin?`<label style="padding:8px 12px;margin:6px 0">${ic('eye')} Ver unidade<select onchange="me.view=this.value===''?null:+this.value;render()"><option value="">Todas as unidades</option>${LJ().map(s=>`<option value=${s.id} ${me.view===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>`:''}
 <a onclick="run(async()=>{})">${ic('refresh')} Atualizar dados</a>
 <div class=me><b>${esc(me.name)}</b>${me.admin?(me.dev?'Desenvolvedor':'Administrador')+' · todas as lojas':(me.tech?'Técnico · ':'')+esc(sn(me.store))}<br><a style="padding:4px 0;display:inline-block;color:var(--a)" onclick="logout()">Sair</a></div></aside><main>${AS?`<div class=tg style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:14px;padding:10px 14px">${ic('eye')} Você está logado como <b>${esc(me.name)}</b><button class=pr onclick="backAdmin()">Voltar para minha conta</button></div>`:''}${me.admin&&me.view!=null?`<p class=tg style="display:inline-block;margin-bottom:12px">${ic('eye')} Visualizando: ${esc(sn(me.view))}</p>`:''}${P[tab]()}</main>`;
 const as=document.querySelector('aside');if(as)as.scrollTop=sy}

/* ---------- Início ---------- */
if(typeof SB_URL==='undefined'||/SEU-PROJETO|COLE_AQUI/.test(SB_URL+SB_KEY)||!window.supabase){
 $('#app').innerHTML='<div class=lg><form onsubmit="return false"><h1>GestPeças</h1><p class=mu>Falta configurar: abra <b>config.js</b> e cole a URL e a chave anon do seu projeto Supabase.</p></form></div>'}
else{sb=window.supabase.createClient(SB_URL,SB_KEY);enter()}
