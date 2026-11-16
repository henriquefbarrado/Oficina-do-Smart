/* ===== GestPeças — Vanilla JS + Supabase (Auth + Postgres + RLS) ===== */
'use strict';
const $=q=>document.querySelector(q);
const IC={"phone":"<rect width=\"14\" height=\"20\" x=\"5\" y=\"2\" rx=\"2\" ry=\"2\"/><path d=\"M12 18h.01\"/>","dashboard":"<rect width=\"7\" height=\"9\" x=\"3\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"5\" x=\"14\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"9\" x=\"14\" y=\"12\" rx=\"1\"/><rect width=\"7\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\"/>","clipboard":"<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\"/><path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\"/><path d=\"M12 11h4\"/><path d=\"M12 16h4\"/><path d=\"M8 11h.01\"/><path d=\"M8 16h.01\"/>","cpu":"<rect width=\"16\" height=\"16\" x=\"4\" y=\"4\" rx=\"2\"/><rect width=\"6\" height=\"6\" x=\"9\" y=\"9\" rx=\"1\"/><path d=\"M15 2v2\"/><path d=\"M15 20v2\"/><path d=\"M2 15h2\"/><path d=\"M2 9h2\"/><path d=\"M20 15h2\"/><path d=\"M20 9h2\"/><path d=\"M9 2v2\"/><path d=\"M9 20v2\"/>","undo":"<path d=\"M9 14 4 9l5-5\"/><path d=\"M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11\"/>","circle-check":"<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m9 12 2 2 4-4\"/>","check":"<path d=\"M20 6 9 17l-5-5\"/>","wrench":"<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z\"/>","book":"<path d=\"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z\"/><path d=\"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z\"/>","factory":"<path d=\"M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z\"/><path d=\"M17 18h1\"/><path d=\"M12 18h1\"/><path d=\"M7 18h1\"/>","warehouse":"<path d=\"M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z\"/><path d=\"M6 18h12\"/><path d=\"M6 14h12\"/><rect width=\"12\" height=\"12\" x=\"6\" y=\"10\"/>","swap":"<path d=\"M8 3 4 7l4 4\"/><path d=\"M4 7h16\"/><path d=\"m16 21 4-4-4-4\"/><path d=\"M20 17H4\"/>","history":"<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\"/><path d=\"M3 3v5h5\"/><path d=\"M12 7v5l4 2\"/>","file":"<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\"/><path d=\"M14 2v4a2 2 0 0 0 2 2h4\"/><path d=\"M10 9H8\"/><path d=\"M16 13H8\"/><path d=\"M16 17H8\"/>","users":"<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"/>","eye":"<path d=\"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>","refresh":"<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\"/><path d=\"M21 3v5h-5\"/><path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\"/><path d=\"M8 16H3v5\"/>","receipt":"<path d=\"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z\"/><path d=\"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8\"/><path d=\"M12 17.5v-11\"/>","banknote":"<rect width=\"20\" height=\"12\" x=\"2\" y=\"6\" rx=\"2\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><path d=\"M6 12h.01M18 12h.01\"/>","truck":"<path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\"/><path d=\"M15 18H9\"/><path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14\"/><circle cx=\"17\" cy=\"18\" r=\"2\"/><circle cx=\"7\" cy=\"18\" r=\"2\"/>","download":"<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><path d=\"m7 10 5 5 5-5\"/><path d=\"M12 15V3\"/>","package":"<path d=\"m7.5 4.27 9 5.15\"/><path d=\"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z\"/><path d=\"m3.3 7 8.7 5 8.7-5\"/><path d=\"M12 22V12\"/>","clock":"<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 6v6l4 2\"/>","gamepad":"<line x1='6' x2='10' y1='11' y2='11'/><line x1='8' x2='8' y1='9' y2='13'/><line x1='15' x2='15.01' y1='12' y2='12'/><line x1='18' x2='18.01' y1='10' y2='10'/><path d='M17.32 5H6.68a4 4 0 0 0-3.978 3.59C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258A4 4 0 0 0 17.32 5z'/>"};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IC[n]||''}</svg>`;
const brl=v=>(+v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const dt=t=>new Date(t).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const toast=m=>{const t=$('#t');t.textContent=m;t.className='on';setTimeout(()=>t.className='',3600)};
const nm=x=>x.prod+' '+x.model,sum=(a,f)=>a.reduce((t,x)=>t+f(x),0);
const CE=0,TS=['Aguardando OK da loja de origem','Aguardando aprovação do admin','Concluída','Rejeitada'];
let sb,me=null,booting=true,tab='dash',H={q:'',s:'',a:'',b:''};
let S={cu:[],st:[],sup:[],cat:[],orders:[],units:[],hist:[],tr:[],users:[],mn:[],supv:[],tc:[],cr:[]};
const sn=id=>(S.st.find(s=>s.id===id)||{}).name||'—';
const LJ=()=>S.st.filter(s=>s.kind==='loja'),lopt=()=>LJ().map(s=>[s.id,s.name]);
const supOpt=()=>S.sup.map(s=>[s.id,s.name+(s.company?' ('+s.company+')':'')]);
const inStock=u=>u.status==='Em estoque da unidade';
const cAv=u=>u.loc===CE&&['Recebida','Devolvida','Disponível'].includes(u.status);
const inM=u=>['Aguardando manutenção','Em manutenção'].includes(u.status);

/* ---------- Acesso ao banco (toda regra de verdade está no Postgres) ---------- */
async function rpc(fn,a){const{data,error}=await sb.rpc(fn,a||{});if(error)throw new Error(error.message);return data}
const ok=r=>{if(r.error)throw new Error(r.error.message);return r.data};
const dbx=async q=>{const{error}=await q;if(error)throw new Error(error.code==='23505'?'Já existe um cadastro igual.':error.message)};
async function all(q,pages=50){let out=[];for(let i=0;i<pages;i++){const d=ok(await q().range(i*1000,i*1000+999));out=out.concat(d);if(d.length<1000)break}return out}
const run=async f=>{try{await f();await load();render()}catch(e){toast(e.message||String(e))}};
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
 if(me.admin){S.sup=ok(await sb.from('suppliers').select('*').order('name'));
  S.users=ok(await sb.from('profiles').select('*').order('name')).map(x=>({id:x.id,n:x.name,email:x.email,store:x.store_id,adm:x.is_admin,tech:x.is_technician,on:x.active}))}}

/* ---------- UI utilitários ---------- */
function cl(){$('#m').className='ov'}
function ask(title,msg,fn,label){
 $('#m').innerHTML=`<div class=md><h3>${esc(title)}</h3><p class=mu style="margin:6px 0 20px;line-height:1.55">${esc(msg).replace(/\n/g,'<br>')}</p><div class=bt><button type=button id=ask-no onclick=cl()>Cancelar</button><button type=button class=dg id=ask-ok>${label||'Excluir'}</button></div></div>`;
 $('#m').className='ov on';$('#ask-no').focus();
 $('#ask-ok').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{await fn();await load();cl();render()}catch(x){toast(x.message||String(x));b.disabled=false}}}
function modal(title,fields,fn,ch){
 $('#m').innerHTML=`<div class=md><h3>${title}</h3><form>${fields.map(f=>`<label>${f.l}${f.o?`<select name=${f.n}>${f.o.map(o=>`<option value="${esc(o[0])}" ${String(o[0])===String(f.v)?'selected':''}>${esc(o[1])}</option>`).join('')}</select>`:`<input name=${f.n} type=${f.t||'text'} value="${esc(f.v)}" ${f.r?'required':''} ${f.min!=null?'min='+f.min:''} step=any>`}</label>`).join('')}<div class=bt><button type=button onclick=cl()>Cancelar</button><button class=pr>Confirmar</button></div></form></div>`;
 $('#m').className='ov on';
 {const fm=$('#m form');if(ch){fm.elements[fields[0].n].onchange=()=>ch(fm.elements);ch(fm.elements)}}
 $('#m form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('.pr');b.disabled=true;const d=Object.fromEntries(new FormData(e.target));
  try{await fn(d);await load();cl();render()}catch(x){toast(x.message||String(x));b.disabled=false}}}
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
async function enter(){booting=true;render();try{const{data:{session}}=await sb.auth.getSession();if(!session)return;
 const{data:p,error}=await sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle();if(error)throw error;
 if(!p||!p.active){await sb.auth.signOut();toast('Usuário sem acesso ou desativado.');return}
 me={id:p.id,name:p.name,admin:p.is_admin,store:p.store_id,view:null,tech:!!p.is_technician};tab='dash';await load()}catch(e){toast(e.message||String(e))}finally{booting=false;render()}}
async function logout(){const imp=!!AS;AS=null;await sb.auth.signOut(imp?{scope:'local'}:undefined);me=null;booting=false;S={cu:[],st:[],sup:[],cat:[],orders:[],units:[],hist:[],tr:[],users:[],mn:[],supv:[],tc:[],cr:[]};render()}

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
 return `<h1>${T[0]}</h1><p class="mu sub">Cada peça tem identificação própria, ligada ao pedido de origem. Clique no código para ver o rastro completo.</p>
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
 modal('Nova manutenção',[...(me.admin?[{n:'st',l:'Loja',o:lopt(),v:me.view}]:[]),{n:'os',l:'Número da OS',r:1},{n:'cu',l:'Cliente',r:1},{n:'sv',l:'Serviço realizado',r:1},
  {n:'u',l:'Peça utilizada (do estoque da loja)',o:[]},{n:'pc',l:'Ou digite a peça utilizada (se não for do estoque)'},
  {n:'ch',l:'Valor cobrado (R$)',t:'number',min:0,r:1},{n:'pv',l:'Valor pago na peça (R$)',t:'number',min:0},{n:'tc',l:'Técnico',r:1}],
  d=>rpc('maintenance_new',{p_os:d.os,p_customer:d.cu,p_service:d.sv,p_charged:+d.ch,p_technician:d.tc,p_store:me.admin?+d.st:null,p_unit_id:d.u||null,p_part:d.pc,p_part_cost:d.pv!==''?+d.pv:null}));
 const f=$('#m form').elements,sid=()=>me.admin?+f.st.value:me.store,
  fill=()=>{const us=S.units.filter(u=>u.loc===sid()&&inStock(u));f.u.innerHTML='<option value="">— Sem peça do estoque —</option>'+us.map(u=>`<option value="${esc(u.id)}">${esc(u.id+' · '+nm(u)+' · '+brl(u.cost))}</option>`).join('');f.pc.value='';f.pv.value=''};
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
 return `<h1>Estoques</h1><p class="mu sub">Peças disponíveis e valor por local. Entradas e saídas ficam registradas no Histórico.</p><div class=bar><button class=pr onclick="entForm()">+ Cadastrar peça</button><button onclick="stForm()">+ Cadastrar loja</button><button onclick="estEdit()">Editar</button><button onclick="stkImp()">Importar planilha</button><button onclick="stkExp()">${ic('download')} Exportar planilha</button></div>
${tbl(['Produto',...locs.map(sn),'Ações'],[...P.map((p,i)=>[esc(p),...locs.map(l=>sel(l,p).length),`<button class="dg" onclick="stkDel(${i})">Excluir</button>`]),['<b>Total (peças)</b>',...locs.map(l=>'<b>'+sel(l).length+'</b>'),''],['<b>Valor total</b>',...locs.map(l=>'<b>'+brl(sum(sel(l),u=>u.cost))+'</b>'),'']])}`}
/* Excluir peça do estoque: tira do catálogo e das prateleiras; o histórico fica (unidades viram "Descartada") */
function stkDel(i){const x=SP[i];if(!x)return;const k=x.n+' '+x.m,q=S.units.filter(u=>nm(u)===k&&(u.loc===CE?cAv(u):inStock(u))).length;
  ask('Excluir peça do estoque','Excluir "'+k+'"?\n'+(q?q+' unidade(s) em estoque será(ão) baixada(s) (status Descartada) e sai(rão) de todas as lojas.':'Esta peça não tem unidades em estoque.')+'\nO histórico é mantido. Esta ação não pode ser desfeita.',()=>rpc('stock_part_delete',{p_name:x.n,p_model:x.m}))}
/* Cadastrar loja: cria um novo local de estoque (nova coluna em Estoques) */
function stForm(){modal('Cadastrar loja',[{n:'n',l:'Nome da loja',r:1}],
  d=>rpc('store_create',{p_name:d.n}).then(()=>toast('Loja "'+d.n.trim()+'" cadastrada. Já aparece em Estoques e nas listas de loja.')));
  const f=$('#m form').elements.n;f.setAttribute('autocomplete','off');f.focus()}
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
  if(!x.err&&ln&&!['estoque central','central'].includes(norm(ln))){const st=stores.find(s=>norm(s.name)===norm(ln));if(st)x.sid=st.id;else x.err='Loja "'+ln+'" não cadastrada (use + Cadastrar loja).'}
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
 modal('Cadastrar peça no estoque central',[{n:'n',l:'Nome da peça',r:1},{n:'m',l:'Modelo do aparelho',r:1},{n:'q',l:'Quantidade',t:'number',v:1,min:1,r:1},{n:'s',l:'Fornecedor',o:supOpt()},{n:'v',l:'Valor unitário (R$)',t:'number',min:0.01,r:1}],
 async d=>{const n=d.n.trim(),m=d.m.trim();let c=find(n,m),id=c&&c.id;
  if(!c){const r=await sb.from('catalog').insert({name:n,model:m,supplier_id:+d.s,unit_price:+d.v}).select('id').single();
   if(r.error){if(r.error.code!=='23505')throw new Error(r.error.message);throw new Error('Essa peça já existe no catálogo. Atualize os dados e tente de novo.')}id=r.data.id}
  return rpc('stock_entry',{p_catalog_id:id,p_qty:+d.q,p_supplier_id:+d.s,p_price:+d.v})});
 const f=$('#m form').elements,uniq=a=>[...new Set(a)].sort((x,y)=>x.localeCompare(y,'pt-BR'));
 f.n.setAttribute('list','dln');f.m.setAttribute('list','dlm');f.n.setAttribute('autocomplete','off');f.m.setAttribute('autocomplete','off');
 f.n.insertAdjacentHTML('afterend',`<datalist id=dln>${uniq(S.cat.map(c=>c.name)).map(x=>`<option value="${esc(x)}">`).join('')}</datalist>`);
 f.m.insertAdjacentHTML('afterend',`<datalist id=dlm>${uniq(S.cat.map(c=>c.model)).map(x=>`<option value="${esc(x)}">`).join('')}</datalist>`);
 const hint=document.createElement('p');hint.className='mu';hint.style.cssText='margin:0 0 8px;font-size:13px';f.v.closest('label').after(hint);
 const sync=()=>{const c=find(f.n.value,f.m.value);if(c){if(c.supplier_id)f.s.value=c.supplier_id;if(c.unit_price)f.v.value=c.unit_price;hint.textContent='Peça já cadastrada: a quantidade será somada ao estoque.'}else hint.textContent=f.n.value&&f.m.value?'Peça nova: será cadastrada e já entra no estoque.':''};
 f.n.oninput=f.m.oninput=sync;f.n.onchange=f.m.onchange=sync}
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
 modal('Solicitar transferência',[...(me.admin?[{n:'t',l:'Loja de destino (quem recebe)',o:lopt()}]:[]),{n:'f',l:'Loja de origem (quem envia)',o:lopt().filter(x=>me.admin||x[0]!==me.store)},{n:'p',l:'Peça',o:S.cat.map(c=>[c.name+' '+c.model,c.name+' '+c.model])},{n:'qty',l:'Quantidade',t:'number',v:1,min:1,r:1},{n:'m',l:'Motivo'}],
 d=>rpc('transfer_new',{p_from:+d.f,p_part:d.p,p_qty:+d.qty,p_to:me.admin?+d.t:null,p_note:d.m}))}

/* Usuários: o admin cria, redefine senha, troca de loja e ativa/desativa (sem precisar pedir) */
function pUsr(){return `<h1>Usuários</h1><p class="mu sub">Crie o acesso de funcionários, técnicos e administradores. Funcionários e técnicos entram só na própria loja e só movimentam o que é dela. Administradores veem e gerenciam todas as unidades.</p><div class=bar><button class=pr onclick="usrForm()">+ Novo usuário</button></div>
${tbl(['Nome','E-mail','Acesso','Unidade','Status','Ações'],S.users.map(u=>[esc(u.n),esc(u.email),u.adm?'Administrador':u.tech?'Técnico':'Funcionário',u.adm?'Todas':esc(sn(u.store)),`<span class="tg ${u.on?'g':'r'}">${u.on?'Ativo':'Inativo'}</span>`,`<button onclick="usrEdit('${u.id}')">Editar</button>`+(u.id!==me.id&&!u.adm&&u.on&&!AS?`<button onclick="usrAs('${u.id}')">Logar como</button>`:'')]))}`}
function usrForm(){modal('Novo usuário',[{n:'n',l:'Nome do funcionário',r:1},{n:'e',l:'E-mail (será o login)',t:'email',r:1},{n:'s',l:'Unidade (loja)',o:lopt()},{n:'r',l:'Perfil',o:[['f','Funcionário (vendedor)'],['t','Técnico'],['a','Administrador (acesso total)']]},{n:'p',l:'Senha (mín. 6 caracteres)',t:'password',r:1}],
 async d=>{const id=await rpc('admin_create_user',{p_email:d.e,p_password:d.p,p_name:d.n,p_store:+d.s});if(d.r==='t')await rpc('admin_set_technician',{p_user:id,p_on:true});
  if(d.r==='a'){try{await rpc('admin_set_admin',{p_user:id,p_on:true})}catch(e){toast('Usuário criado, mas não foi possível torná-lo administrador: '+e.message+' Use o botão "Tornar admin" na lista.')}}})}
function usrAdm(id){const u=S.users.find(x=>x.id===id);if(!u)return;
 ask(u.adm?'Remover administrador':'Tornar administrador',u.adm?u.n+' deixa de ser administrador e passa a ser funcionário da loja dele.':u.n+' passa a ter acesso total: todas as lojas, estoque central, usuários e exclusões.',()=>rpc('admin_set_admin',{p_user:id,p_on:!u.adm}),'Confirmar')}
function usrEdit(id){const u=S.users.find(x=>x.id===id);if(!u)return;const self=u.id===me.id,B=(f,t,c)=>`<button${c?' class='+c:''} onclick="cl();${f}('${id}')">${t}</button>`;
 $('#m').innerHTML=`<div class=md><h3>Editar — ${esc(u.n)}</h3><p class=mu style="margin:4px 0 0">${esc(u.email)} · ${u.adm?'Administrador':u.tech?'Técnico':'Funcionário'}${u.adm?'':' · '+esc(sn(u.store))}</p>
 <div style="display:flex;flex-direction:column;gap:8px;margin-top:16px">${B('usrPass','Redefinir senha')}${self?'':B('usrAdm',u.adm?'Remover admin':'Tornar admin')}${u.adm?'':B('usrTec',u.tech?'Remover técnico':'Tornar técnico')+B('usrStore','Trocar loja')+B('usrTog',u.on?'Desativar':'Ativar')}${self?'':B('usrDel','Excluir usuário','dg')}<button onclick=cl()>Fechar</button></div></div>`;$('#m').className='ov on'}
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
function usrTec(id){const u=S.users.find(x=>x.id===id);run(()=>rpc('admin_set_technician',{p_user:id,p_on:!u.tech}))}
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

/* ---------- Shell ---------- */
function render(){
 if(!me){$('#app').innerHTML=booting?'<div class=lg><div class=boot><i></i><p class=mu>Carregando…</p></div></div>':login();return}
 if(!me.admin&&['cat','sup','stk','rep','usr'].includes(tab))tab='dash';
 const pn=S.tr.filter(x=>me.admin?x.status===TS[1]:x.status===TS[0]&&x.from===me.store).length;
 const N=[['dash','dashboard','Dashboard',1],['ord','clipboard',me.admin?'Pedidos':'Solicitar Peças',1],['pcs','cpu','Controle de Peças',1],['cen','warehouse','Estoque Central',1],['ret','undo','Devoluções',1],['use','circle-check','Peças Utilizadas',1],['mnt','wrench','Manutenção',1],['fec','banknote','Fechamento Técnico',1],['man','gamepad','Manutenção de Manetes',1],['cat','book','Catálogo de Peças',2],['sup','factory','Fornecedores',2],['stk','warehouse','Estoques',2],['tra','swap','Transferências'+(pn?' ('+pn+')':''),1],['his','history','Histórico',1],['rep','file','Relatórios',2],['usr','users','Usuários',2]].filter(n=>n[3]===1||me.admin);
 const P={dash:pDash,cen:pCen,ord:pOrd,pcs:pUnits,ret:pUnits,use:pUnits,mnt:pMnt,cat:pCat,tra:pTra,usr:pUsr,sup:pSup,stk:pStk,his:pHis,rep:pRep,fec:pFec,man:pMan};
 $('#app').innerHTML=`<aside><h2>${ic('phone')} Oficina do <span>Smart</span></h2>${N.map(n=>`<a class="${n[0]===tab?'on':''}" onclick="tab='${n[0]}';render()">${ic(n[1])} ${n[2]}</a>`).join('')}

 ${me.admin?`<label style="padding:8px 12px;margin:6px 0">${ic('eye')} Ver unidade<select onchange="me.view=this.value===''?null:+this.value;render()"><option value="">Todas as unidades</option>${LJ().map(s=>`<option value=${s.id} ${me.view===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>`:''}
 <a onclick="run(async()=>{})">${ic('refresh')} Atualizar dados</a>
 <div class=me><b>${esc(me.name)}</b>${me.admin?'Administrador · todas as lojas':(me.tech?'Técnico · ':'')+esc(sn(me.store))}<br><a style="padding:4px 0;display:inline-block;color:var(--a)" onclick="logout()">Sair</a></div></aside><main>${AS?`<div class=tg style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:14px;padding:10px 14px">${ic('eye')} Você está logado como <b>${esc(me.name)}</b><button class=pr onclick="backAdmin()">Voltar para minha conta</button></div>`:''}${me.admin&&me.view!=null?`<p class=tg style="display:inline-block;margin-bottom:12px">${ic('eye')} Visualizando: ${esc(sn(me.view))}</p>`:''}${P[tab]()}</main>`}

/* ---------- Início ---------- */
if(typeof SB_URL==='undefined'||/SEU-PROJETO|COLE_AQUI/.test(SB_URL+SB_KEY)||!window.supabase){
 $('#app').innerHTML='<div class=lg><form onsubmit="return false"><h1>GestPeças</h1><p class=mu>Falta configurar: abra <b>config.js</b> e cole a URL e a chave anon do seu projeto Supabase.</p></form></div>'}
else{sb=window.supabase.createClient(SB_URL,SB_KEY);enter()}
