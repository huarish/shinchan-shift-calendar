'use strict';
const C=ShiftCore, $=id=>document.getElementById(id);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const week=['周日','周一','周二','周三','周四','周五','周六'];
const label=key=>`${Number(key.slice(5,7))}月${Number(key.slice(8))}日 ${week[C.weekday(key)]}`;
const monthLabel=key=>`${key.slice(0,4)} 年 ${Number(key.slice(5))} 月`;
let data,person,month,anchor,selected,view='month';
function tell(message){$('notice').textContent=message;$('notice').hidden=false;}
function savePerson(){try{localStorage.setItem('shift-person',person);}catch{}}
function card(key){
 const mine=C.shifts(data.days,key,person),item=data.days[key];
 const names=$('showAll').checked?C.roles.filter(r=>item?.[r]):mine;
 const body=names.map(r=>`<span class="shift ${mine.includes(r)?'mine':''}">${escapeHTML(r)}${$('showAll').checked?' · '+escapeHTML(item[r]):''}</span>`).join('');
 return `<div class="detail-head"><h3>${label(key)}</h3><span class="badge ${mine.length?'on':''}">${!item?'尚未导入':mine.length?'有班 · '+mine.length+'项':'未列个人排班'}</span></div><div class="shift-row">${body||`<span class="off">${item?'原表未列出这一天的个人班次。':'该日期的排班尚未导入，请勿据此判断休假。'}</span>`}</div>`;
}
function renderHero(){
 const next=C.next(data.days,anchor,person);
 $('daysCount').textContent=C.monthDates(month).filter(d=>C.shifts(data.days,d,person).length).length;
 $('heroKicker').textContent=anchor===C.today()?'从今天起 · 下一次排班':`从 ${label(anchor).split(' ')[0]} 起 · 下一次排班`;
 $('heroMain').textContent=next?label(next):'已导入范围内暂无后续班';
 $('heroDetail').innerHTML=next?C.shifts(data.days,next,person).map(r=>`<span>${escapeHTML(r)}</span>`).join(''):'排班目前更新至 11 月 30 日';
}
function renderCalendar(){
 const dates=C.monthDates(month),offset=(C.weekday(dates[0])+6)%7,index=data.months.indexOf(month);
 const cells=dates.map(key=>{
  const mine=C.shifts(data.days,key,person),wk=C.weekday(key);
  return `<button class="cell ${mine.length?'mine':''} ${selected===key?'selected':''} ${key===C.today()?'today':''} ${wk===0||wk===6?'weekend':''}" data-date="${key}" aria-label="${label(key)}，${mine.length?mine.join('、'):'未列个人排班'}" aria-pressed="${selected===key}" ${key===C.today()?'aria-current="date"':''}><span class="num">${Number(key.slice(8))}</span><span class="mini">${mine.map(escapeHTML).join('<br>')}</span></button>`;
 }).join('');
 $('content').innerHTML=`<section class="calendar" aria-label="${monthLabel(month)}排班日历"><div class="calendar-head"><strong>${monthLabel(month)}</strong><div class="month-arrows"><button class="arrow" id="prevMonth" aria-label="上个月" ${index===0?'disabled':''}>‹</button><button class="arrow" id="nextMonth" aria-label="下个月" ${index===data.months.length-1?'disabled':''}>›</button></div></div><div class="week-head">${['一','二','三','四','五','六','日'].map(w=>`<span>${w}</span>`).join('')}</div><div class="cal-grid">${'<span class="blank" aria-hidden="true"></span>'.repeat(offset)}${cells}</div></section>`;
 $('prevMonth').onclick=()=>setMonth(data.months[index-1]);
 $('nextMonth').onclick=()=>setMonth(data.months[index+1]);
 document.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>{selected=b.dataset.date;anchor=selected;$('anchorDate').value=anchor;render();});
 $('detail').hidden=false;$('detail').innerHTML=card(selected);
}
function renderList(){
 const keys=view==='next'?Object.keys(data.days).sort().filter(k=>k>=anchor&&C.shifts(data.days,k,person).length):C.range(anchor,Number(view));
 $('detail').hidden=true;
 $('content').innerHTML=`<p class="range-note">${escapeHTML(person)} · 从 ${label(anchor)} 起${view==='next'?' · 已导入范围内全部后续班次':''}</p>`+(keys.length?`<div class="list">${keys.map(k=>`<section class="detail-panel">${card(k)}</section>`).join('')}</div>`:'<div class="empty">已导入范围内没有后续个人排班。<br>当前数据更新至 2026 年 11 月 30 日。</div>');
}
function render(){
 if(!data)return;
 $('month').value=month;$('anchorDate').value=anchor;
 document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-pressed',String(b.dataset.view===view));});
 document.querySelector('.legend').hidden=view!=='month';
 $('source').textContent=`${data.sources[month]} · 更新 ${data.updated}`;
 renderHero();if(view==='month')renderCalendar();else renderList();
}
function setMonth(value){
 if(!data.months.includes(value))return;
 month=value;anchor=C.today().startsWith(month)?C.today():month+'-01';selected=anchor;render();
}
async function setupOffline(){
 if(!('serviceWorker' in navigator)){ $('cacheState').textContent='当前浏览器不支持离线保存。';return; }
 try{
  const registration=await navigator.serviceWorker.register('./sw.js');
  let wasControlled=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
   if(wasControlled){tell('新版排班已准备好。');const b=document.createElement('button');b.textContent='刷新查看';b.onclick=()=>location.reload();$('notice').appendChild(b);}
   wasControlled=true;
  });
  await navigator.serviceWorker.ready;
  $('cacheState').textContent='离线资源已保存。本机记住所选人员，联网后会检查更新。';
  registration.update().catch(()=>{});
 }catch{$('cacheState').textContent='暂未完成离线保存，请联网后刷新重试。';}
}
async function start(){
 try{
  const response=await fetch('./schedule.json');if(!response.ok)throw new Error('排班数据读取失败');
  data=await response.json();
  const people=[...new Set(Object.values(data.days).flatMap(Object.values))].sort((a,b)=>a.localeCompare(b,'zh-CN'));
  $('person').innerHTML=people.map(p=>`<option value="${escapeHTML(p)}">${escapeHTML(p)}</option>`).join('');
  let saved;try{saved=localStorage.getItem('shift-person');}catch{}
  person=people.includes(saved)?saved:people.includes('鲁旦')?'鲁旦':people[0];$('person').value=person;
  $('month').innerHTML=data.months.map(m=>`<option value="${m}">${monthLabel(m)}</option>`).join('');
  const today=C.today();month=data.months.includes(today.slice(0,7))?today.slice(0,7):data.months.at(-1);
  anchor=today;selected=today.startsWith(month)?today:month+'-01';
  if(!data.days[today])tell('今天超出已导入的排班范围，日历显示最近一个已导入月份。请选择日期查看历史排班。');
  $('person').onchange=()=>{person=$('person').value;savePerson();render();};
  $('month').onchange=()=>setMonth($('month').value);
  $('anchorDate').onchange=()=>{
   const v=$('anchorDate').value;if(!C.validDate(v)){ $('anchorDate').value=anchor;return; }
   anchor=v;if(data.months.includes(v.slice(0,7))){month=v.slice(0,7);selected=v;}else if(view==='month')view='3';render();
  };
  $('showAll').onchange=render;
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;render();});
  $('today').onclick=()=>{const now=C.today();anchor=now;if(data.days[now]){month=now.slice(0,7);selected=now;}else view='3';render();};
  render();setupOffline();
 }catch(error){$('content').innerHTML='<div class="empty">排班暂时没有加载成功，请检查网络后刷新重试。<br><button class="text-button" id="retry">重新加载 ↻</button></div>';$('retry').onclick=()=>location.reload();$('heroMain').textContent='暂时无法读取排班';$('heroDetail').textContent='请联网后重试';$('heroKicker').textContent='加载未完成';}
}
$('installHelp').onclick=()=>{$('install').open=true;$('install').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});};
window.addEventListener('offline',()=>tell('当前离线 · 正在显示本机已保存的排班。'));
window.addEventListener('online',()=>tell('网络已恢复，刷新页面可检查最新排班。'));
if(!navigator.onLine)tell('当前离线 · 正在显示本机已保存的排班。');
start();
