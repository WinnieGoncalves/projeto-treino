export const exercises = {};
function e(id,name,loads,labels=[],unit='kg') { exercises[id]={id,name,loads,labels,unit}; return id; }
e('leg','Leg Press 45°',[100]); e('pant','Panturrilha no Leg Press',[100]); e('adu','Adução - fecha',[45]); e('abd','Abdução - abre',[30]); e('ext','Cadeira Extensora',[70]); e('coice','Coice',[40]); e('mesa','Mesa Flexora',[30]); e('taca','Agachamento Taça',[22]); e('sumo','Agachamento Sumô com Kettlebell',[22]); e('inv','Crucifixo Invertido',[25]); e('cruc','Crucifixo',[40]); e('peito','Peito Empurra',[15],[],'kg por lado');
e('frontal','Puxada Frontal no Pulley',[35]); e('tri','Puxada Triângulo',[35]); e('dev','Desenvolvimento Máquina ou Halter',[10,3],['Máquina','Halter']); e('curva','Remada Curvada com Máquina ou Barra',[25]); e('banco','Tríceps Banco',[20]); e('testa','Tríceps Testa',[10]); e('direta','Rosca Direta com Halter, Barra W ou Polia',[7]); e('martelo','Rosca Martelo com Halteres, Barra H ou Polia',[7]); e('levantfr','Levantamento Frontal',[5]); e('lateral','Levantamento Lateral',[5]); e('flex','Flexão',null); e('curto','Abdominal Curto',null); e('canoa','Abdominal Canoinha',[10]); e('obliquo','Abdominal Oblíquo',null); e('reto','Abdominal Reto',[10]); e('stiff','Stiff ou Mesa Flexora',[8,30],['Stiff','Mesa flexora']); e('livre','Agachamento Livre',[20]); e('afundo','Afundo com Halteres',[12]); e('aberta','Puxada Aberta no Pulley',[35]); e('baixa','Remada Baixa no Pulley',[25]); e('triceps','Extensão de Tríceps',[30]); e('levant','Levantamento com Halter',[5]);
const core=['flex','curto','canoa','obliquo','reto','inv','cruc','peito','cardio'];
export const workouts = [
 {id:'seg',day:'Segunda',number:1,reps:'4 × 8-10-12',items:['leg','pant','adu','abd','ext','coice','mesa','taca','sumo','inv','cruc','peito']},
 {id:'ter',day:'Terça',number:2,reps:'4 × 8-10-12',items:['frontal','tri','dev','curva','banco','testa','direta','martelo','levantfr','lateral','cardio']},
 {id:'qua',day:'Quarta',number:3,reps:'4 × 10',items:core,minutes:15},
 {id:'qui',day:'Quinta',number:4,reps:'4 × 8-10-12',items:['leg','pant','adu','abd','ext','stiff','coice','livre','afundo','cardio'],minutes:15,initial:{adu:[40],coice:[70]}},
 {id:'sex',day:'Sexta',number:5,reps:'4 × 8-10-12',items:['aberta','tri','dev','baixa','testa','triceps','martelo','direta','lateral','levant','cardio'],names:{tri:'Puxada Triângulo no Pulley',dev:'Desenvolvimento com Halter ou Máquina',lateral:'Levantamento Lateral com Halter'}},
 {id:'sab',day:'Sábado',number:6,reps:'4 × 10',items:core,minutes:15}
];
export function weekKey(date=new Date()) { const d=new Date(date); d.setHours(12,0,0,0); d.setDate(d.getDate()-((d.getDay()+6)%7)); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function createState(now=new Date().toISOString()) { return {version:1,history:Object.fromEntries(Object.values(exercises).filter(e=>e.loads).map(e=>[e.id,[{date:now,loads:[...e.loads],kind:'initial'}]])),sessions:[],exerciseRecords:[]}; }
export function current(state,id,workout) { const h=state.history[id]; if(!h) return null; return [...(h.length===1 && workout?.initial?.[id] ? workout.initial[id] : h.at(-1).loads)]; }
export function updateLoad(state,id,loads,date=new Date().toISOString(),previous) { const ex=exercises[id]; if(!ex?.loads || loads.length!==ex.loads.length || loads.some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0)) throw new Error('Informe uma carga válida, maior ou igual a zero.'); if(previous && state.history[id].length===1 && previous.some((n,i)=>n!==state.history[id][0].loads[i])) state.history[id].push({date,loads:[...previous],kind:'prescription'}); state.history[id].push({date,loads:[...loads],kind:'change'}); if(id==='stiff' && state.history.mesa.at(-1).loads[0]!==loads[1]) state.history.mesa.push({date,loads:[loads[1]],kind:'change'}); if(id==='mesa' && state.history.stiff.at(-1).loads[1]!==loads[0]) state.history.stiff.push({date,loads:[state.history.stiff.at(-1).loads[0],loads[0]],kind:'change'}); }
export function migrateState(state) {
 if(state.exerciseRecords) return state;
 state.exerciseRecords=state.sessions.flatMap(s=>{
  const w=workouts.find(w=>w.id===s.workout);
  return w?w.items.map(exercise=>({week:s.week,workout:s.workout,exercise,date:s.date,loads:s.loads[exercise]?[...s.loads[exercise]]:null,selection:s.selections?.[exercise]??0,...(s.undone?{undone:s.undone}:{})})):[];
 });
 return state;
}
export function exerciseRecord(state,workout,exercise,date=new Date()) {
 migrateState(state);
 return state.exerciseRecords.findLast(r=>r.week===weekKey(date)&&r.workout===workout.id&&r.exercise===exercise&&!r.undone);
}
function recordExercise(state,workout,exercise,date) {
 if(exerciseRecord(state,workout,exercise,date)) return;
 state.exerciseRecords.push({week:weekKey(date),workout:workout.id,exercise,date:date.toISOString(),loads:current(state,exercise,workout),selection:state.selections?.[weekKey(date)+':'+workout.id+':'+exercise]??0});
}
export function complete(state,workout,date=new Date()) {
 migrateState(state);
 const week=weekKey(date);
 if(state.sessions.some(s=>s.week===week&&s.workout===workout.id&&!s.undone)) return;
 for(const id of workout.items) recordExercise(state,workout,id,date);
 state.sessions.push({id:globalThis.crypto.randomUUID?.()??Date.now()+'-'+Math.random(),week,workout:workout.id,date:date.toISOString(),loads:Object.fromEntries(workout.items.filter(id=>exercises[id]?.loads).map(id=>[id,[...exerciseRecord(state,workout,id,date).loads]])),selections:Object.fromEntries(workout.items.filter(id=>exercises[id]?.labels.length).map(id=>[id,exerciseRecord(state,workout,id,date).selection])),minutes:workout.minutes??null});
}
export function toggleExercise(state,workout,exercise,date=new Date()) {
 if(!workout.items.includes(exercise)) throw new Error('Exercício inválido.');
 const record=exerciseRecord(state,workout,exercise,date);
 if(record) {
  record.undone=date.toISOString();
  const session=state.sessions.findLast(s=>s.week===weekKey(date)&&s.workout===workout.id&&!s.undone);
  if(session) session.undone=date.toISOString();
 } else {
  recordExercise(state,workout,exercise,date);
  if(workout.items.every(id=>exerciseRecord(state,workout,id,date))) complete(state,workout,date);
 }
}
export function undo(state,id,date=new Date().toISOString()) {
 migrateState(state);
 const s=state.sessions.find(s=>s.id===id);
 if(!s||s.undone) return;
 s.undone=date;
 for(const r of state.exerciseRecords) if(r.week===s.week&&r.workout===s.workout&&!r.undone) r.undone=date;
}
