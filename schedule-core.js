(function(root){
  'use strict';
  const roles=['急诊','跟班','25w白班','24w白班','病房','二线','三线'];
  const parse=s=>new Date(s+'T00:00:00Z');
  const iso=d=>d.toISOString().slice(0,10);
  function validDate(s){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(parse(s))&&iso(parse(s))===s;}
  function range(start,n){if(!validDate(start))return [];return Array.from({length:n},(_,i)=>iso(new Date(+parse(start)+i*86400000)));}
  function shifts(days,key,person){return roles.filter(r=>days[key]?.[r]===person);}
  function next(days,start,person){return Object.keys(days).sort().find(k=>k>=start&&shifts(days,k,person).length)||null;}
  function monthDates(month){const [y,m]=month.split('-').map(Number);return range(month+'-01',new Date(Date.UTC(y,m,0)).getUTCDate());}
  function status(days,key,person){return !days[key]?'unavailable':shifts(days,key,person).length?'working':'unlisted';}
  function weekday(key){return parse(key).getUTCDay();}
  function today(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const val=t=>p.find(x=>x.type===t).value;return `${val('year')}-${val('month')}-${val('day')}`;}
  const api={roles,range,shifts,next,monthDates,status,weekday,validDate,today};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ShiftCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
