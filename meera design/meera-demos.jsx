/* ===== Meera interactive demos: Meeror overlay + Chat-to-ticket ===== */
const { useState, useEffect, useRef, useLayoutEffect } = React;

/* ---------------------------------------------------------------------------
   1) MEEROR — guided on-screen overlay over a mock university portal
--------------------------------------------------------------------------- */
const MEEROR_STEPS = [
  { key:"term",   title:"Choose your enrollment term", body:"Open this dropdown and pick the term you’re registering for.", conf:99, place:"right" },
  { key:"file",   title:"Upload your transcript", body:"Click here and attach your transcript as a PDF — that’s the missing piece.", conf:95, place:"right" },
  { key:"agree",  title:"Accept the registration terms", body:"Tick this box. The Submit button stays locked until you do.", conf:98, place:"right" },
  { key:"submit", title:"Submit your request", body:"You’re all set — click ‘Submit Request’ to finish your registration.", conf:97, place:"top" },
];

function MeerorDemo(){
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [seen, setSeen] = useState(false);
  const wrapRef = useRef(null);
  const refs = { term:useRef(), file:useRef(), agree:useRef(), submit:useRef() };
  const [spot, setSpot] = useState(null);   // {top,left,w,h}
  const [pop, setPop] = useState(null);      // {top,left,place}
  const measureRef = useRef(()=>{});

  measureRef.current = ()=>{
    const wrap = wrapRef.current; if(!wrap) return;
    const cur = MEEROR_STEPS[step];
    const el = refs[cur.key].current; if(!el) return;
    const wr = wrap.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if(r.width < 4) return; // not laid out yet — skip until it is
    const pad = 8;
    const s = { top:r.top-wr.top-pad, left:r.left-wr.left-pad, w:r.width+pad*2, h:r.height+pad*2 };
    setSpot(s);
    const popW = 252, popH = 252, gap = 16;
    let place = "right";
    let left = s.left + s.w + gap;
    let top  = s.top - 4;
    if(left + popW > wr.width - 6){
      place = "below";
      left = Math.min(s.left, wr.width - popW - 8);
      top  = s.top + s.h + 12;
    }
    left = Math.max(8, left);
    top  = Math.max(8, Math.min(top, wr.height - popH - 8));
    setPop({ top, left, place });
  };
  const remeasure = ()=>requestAnimationFrame(()=>measureRef.current());
  useLayoutEffect(()=>{ measureRef.current(); }, [step]);
  useEffect(()=>{
    const wrap = wrapRef.current; if(!wrap) return;
    remeasure();
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    const io = new IntersectionObserver((es)=>{ if(es[0].isIntersecting){ setSeen(true); remeasure(); } }, {threshold:.12});
    io.observe(wrap);
    const ro = new ResizeObserver(remeasure); ro.observe(wrap);
    window.addEventListener("resize", remeasure);
    return ()=>{ io.disconnect(); ro.disconnect(); window.removeEventListener("resize", remeasure); };
  }, []);
  useEffect(()=>{
    if(!playing || !seen) return;
    const t=setTimeout(()=> setStep(s=> (s+1)%MEEROR_STEPS.length), 3000);
    return ()=>clearTimeout(t);
  }, [step, playing, seen]);

  const cur = MEEROR_STEPS[step];
  const done = (k)=> MEEROR_STEPS.findIndex(s=>s.key===k) < step;

  const fieldBase = {borderRadius:10, border:"1.5px solid var(--line-2)", background:"#fff",
    padding:"11px 13px", fontSize:13.5, color:"var(--ink-2)", display:"flex", alignItems:"center", justifyContent:"space-between"};

  return (
    <div className="card" style={{padding:0, overflow:"hidden", maxWidth:760, margin:"0 auto", boxShadow:"var(--sh-lg)"}}>
      {/* browser chrome */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 15px",background:"#F3ECE0",borderBottom:"1px solid var(--line)"}}>
        <span style={{display:"flex",gap:6}}>
          {["#E7836B","#EBC15C","#7FB85C"].map(c=><span key={c} style={{width:11,height:11,borderRadius:99,background:c}}/>)}
        </span>
        <div style={{flex:1,display:"flex",justifyContent:"center"}}>
          <span className="mono" style={{fontSize:11.5,color:"var(--muted)",background:"#fff",border:"1px solid var(--line)",
            padding:"5px 14px",borderRadius:99,display:"inline-flex",alignItems:"center",gap:7}}>
            <Icon name="lock" size={12} sw={2} style={{color:"var(--green)"}}/> portal.northvale.edu/registration
          </span>
        </div>
        <span className="pill" style={{background:"var(--teal-050)",borderColor:"var(--teal-100)",color:"var(--teal-700)",padding:"5px 11px",fontSize:11.5}}>
          <span style={{width:7,height:7,borderRadius:99,background:"var(--teal)",boxShadow:"0 0 0 3px var(--teal-100)"}}/> Meeror live
        </span>
      </div>

      {/* portal body + overlay */}
      <div ref={wrapRef} style={{position:"relative", background:"#FCFAF6"}}>
        <div style={{display:"grid", gridTemplateColumns:"148px 1fr", minHeight:386}}>
          {/* portal sidebar */}
          <div style={{background:"#1C3349",color:"#cdd8e0",padding:"16px 13px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
              <span style={{width:24,height:24,borderRadius:7,background:"#34506b",display:"grid",placeItems:"center",fontWeight:800,fontSize:12,color:"#fff"}}>N</span>
              <span style={{fontWeight:700,fontSize:13,color:"#fff"}}>Northvale</span>
            </div>
            {[["Dashboard",0],["Registration",1],["Financials",0],["Records",0],["Help",0]].map(([t,a])=>(
              <div key={t} style={{padding:"8px 10px",borderRadius:8,fontSize:12.5,marginBottom:3,fontWeight:a?700:500,
                background:a?"#28425b":"transparent",color:a?"#fff":"#9fb0bd"}}>{t}</div>
            ))}
          </div>
          {/* form */}
          <div style={{padding:"20px 22px"}}>
            <div style={{fontSize:11,letterSpacing:".06em",color:"var(--muted)",fontWeight:600,marginBottom:3}} className="mono">FALL 2026 · COURSE REGISTRATION</div>
            <h4 style={{fontSize:18,marginBottom:14}}>Submit your registration request</h4>
            <div style={{display:"grid",gap:11,maxWidth:244}}>
              <div ref={refs.term} style={fieldBase}>
                <span style={{color:done("term")?"var(--ink)":"var(--muted)",fontWeight:done("term")?600:500}}>{done("term")?"Fall 2026 — Full-time":"Select enrollment term"}</span>
                {done("term")? <Icon name="check" size={16} style={{color:"var(--green)"}}/> : <Icon name="chevronD" size={15} style={{color:"var(--muted)"}}/>}
              </div>
              <div ref={refs.file} style={{...fieldBase, borderStyle:done("file")?"solid":"dashed", background:done("file")?"#fff":"#FBF6EE"}}>
                <span style={{display:"flex",alignItems:"center",gap:8,color:done("file")?"var(--ink)":"var(--muted)",fontWeight:done("file")?600:500}}>
                  <Icon name="doc" size={15}/> {done("file")?"transcript_2026.pdf":"Upload transcript (PDF)"}
                </span>
                {done("file") && <Icon name="check" size={16} style={{color:"var(--green)"}}/>}
              </div>
              <label ref={refs.agree} style={{display:"flex",alignItems:"center",gap:10,padding:"4px 2px",fontSize:13,color:"var(--ink-2)"}}>
                <span style={{width:19,height:19,borderRadius:6,border:"1.5px solid var(--line-2)",
                  background:done("agree")?"var(--teal)":"#fff",borderColor:done("agree")?"var(--teal)":"var(--line-2)",
                  display:"grid",placeItems:"center",color:"#fff",transition:"all .2s"}}>
                  {done("agree") && <Icon name="check" size={13} sw={2.4}/>}
                </span>
                I accept the registration terms &amp; academic policies
              </label>
              <button ref={refs.submit} className="btn" style={{
                marginTop:4, justifyContent:"center",
                background: done("agree")?"var(--teal)":"#E4DCCD",
                color: done("agree")?"#fff":"#A99",
                boxShadow:"none", padding:"12px 20px"}}>
                Submit Request
              </button>
            </div>
          </div>
        </div>

        {/* spotlight scrim + ring */}
        {spot && (
          <div style={{position:"absolute", top:spot.top, left:spot.left, width:spot.w, height:spot.h,
            borderRadius:12, boxShadow:"0 0 0 9999px rgba(22,41,59,.42)", pointerEvents:"none",
            transition:"all .5s cubic-bezier(.4,.8,.2,1)", zIndex:5}}>
            <span style={{position:"absolute",inset:-3,borderRadius:14,border:"2.5px solid var(--teal)"}}/>
            <span style={{position:"absolute",inset:-3,borderRadius:14,border:"2.5px solid var(--teal)",
              animation:"pulse-ring 1.8s ease-out infinite"}}/>
          </div>
        )}

        {/* Meera popup */}
        {pop && (
          <div style={{position:"absolute", top:pop.top, left:pop.left, width:252, zIndex:8,
            transition:"all .5s cubic-bezier(.4,.8,.2,1)"}}>
            <div className="card" style={{padding:0, boxShadow:"var(--sh-lg)", border:"1px solid var(--teal-100)", overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",gap:9,padding:"11px 13px 9px"}}>
                <span style={{width:32,height:32,borderRadius:"50%",overflow:"hidden",background:"#FBEADD",flexShrink:0,border:"1.5px solid #EBC9A8",display:"grid",placeItems:"center"}}>
                  <img src="assets/meera-avatar.png" style={{width:"150%"}} alt=""/>
                </span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13.5}}>Meera</div>
                  <div className="mono" style={{fontSize:10.5,color:"var(--muted)"}}>guiding you · step {step+1} of {MEEROR_STEPS.length}</div>
                </div>
                <span className="mono" style={{fontSize:10.5,color:"var(--teal-700)",background:"var(--teal-050)",padding:"3px 8px",borderRadius:99}}>{cur.conf}%</span>
              </div>
              <div style={{padding:"0 13px 11px"}}>
                <div style={{fontWeight:700,fontSize:14.5,marginBottom:3,letterSpacing:"-.01em"}}>{cur.title}</div>
                <p style={{fontSize:13,color:"var(--ink-2)",lineHeight:1.5}}>{cur.body}</p>
              </div>
              {/* step dots + controls */}
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 13px",borderTop:"1px solid var(--line)",background:"#FCFAF6"}}>
                <div style={{display:"flex",gap:5,flex:1}}>
                  {MEEROR_STEPS.map((_,i)=>(
                    <span key={i} onClick={()=>{setStep(i);setPlaying(false);}} style={{height:5,borderRadius:99,cursor:"pointer",
                      width:i===step?20:5, background:i===step?"var(--teal)":(i<step?"var(--teal-100)":"#E2D6C2"), transition:"all .3s"}}/>
                  ))}
                </div>
                <button onClick={()=>{setStep(s=>(s+1)%MEEROR_STEPS.length);setPlaying(false);}}
                  className="btn btn-primary btn-sm" style={{padding:"7px 13px",fontSize:12.5}}>
                  Next <Icon name="arrow" size={14} sw={2.2}/>
                </button>
              </div>
              {/* tray: chat / escalate / privacy */}
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 11px",borderTop:"1px solid var(--line)",background:"#F6EFE3"}}>
                <button title="Switch to chat" style={trayBtn}><Icon name="chat" size={14}/> Chat</button>
                <button title="Escalate to a person" style={trayBtn}><Icon name="headset" size={14}/> Human</button>
                <span style={{flex:1}}/>
                <span title="You control what's shared" className="mono" style={{fontSize:10,color:"var(--green)",display:"inline-flex",alignItems:"center",gap:4}}>
                  <Icon name="shield" size={12} sw={2}/> this tab only
                </span>
              </div>
            </div>
            {pop.place==="right" && <span style={{position:"absolute",left:-7,top:26,width:14,height:14,background:"#fff",borderLeft:"1px solid var(--teal-100)",borderBottom:"1px solid var(--teal-100)",transform:"rotate(45deg)"}}/>}
          </div>
        )}
      </div>

      {/* footer control bar */}
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",background:"#fff",borderTop:"1px solid var(--line)"}}>
        <button onClick={()=>setPlaying(p=>!p)} className="btn btn-ghost btn-sm" style={{padding:"7px 14px"}}>
          <Icon name={playing?"clock":"play"} size={14}/> {playing?"Auto-guiding":"Resume"}
        </button>
        <span className="mono" style={{fontSize:11,color:"var(--muted)",flex:1}}>Meera highlights each step on the real screen — no guesswork.</span>
        <Confidence value={cur.conf} label="confidence"/>
      </div>
    </div>
  );
}
const trayBtn = {display:"inline-flex",alignItems:"center",gap:5,fontSize:11.5,fontWeight:600,color:"var(--ink-2)",
  padding:"5px 10px",borderRadius:8,background:"#fff",border:"1px solid var(--line)"};


/* ---------------------------------------------------------------------------
   2) CHAT → TICKET  (diagnoses, then auto-creates a routed ticket)
--------------------------------------------------------------------------- */
const CHAT_SCRIPT = [
  { who:"user", t:"I can’t submit my course registration — the Submit button is greyed out." },
  { who:"meera", t:"Got it — let me check a few things on your account." },
  { who:"checks" },
  { who:"meera", t:"Found it: there’s a financial hold on your account, and that locks registration until it’s cleared." },
  { who:"meera", t:"This one needs the Bursar’s Office. I’ve packaged everything into a ticket so they can clear it fast — no need to re-explain." },
  { who:"ticket" },
];
const CHECKS = [
  { t:"Transcript uploaded", ok:true },
  { t:"Enrollment term selected", ok:true },
  { t:"Account holds", ok:false, note:"1 financial hold" },
];

function ChatTicketDemo(){
  const [n, setN] = useState(0);          // how many script items revealed
  const [checkN, setCheckN] = useState(0);
  const [started, setStarted] = useState(false);
  const rootRef = useRef(null);
  const scrollRef = useRef(null);

  // auto-start when scrolled into view
  useEffect(()=>{
    const el=rootRef.current; if(!el) return;
    const io=new IntersectionObserver((e)=>{ if(e[0].isIntersecting){ setStarted(true); io.disconnect(); }},{threshold:.4});
    io.observe(el); return ()=>io.disconnect();
  },[]);

  useEffect(()=>{
    if(!started) return;
    if(n>=CHAT_SCRIPT.length) return;
    const item=CHAT_SCRIPT[n];
    const delay = item.who==="checks"?500 : item.who==="ticket"?700 : item.who==="user"?500:1150;
    const t=setTimeout(()=> setN(n+1), delay);
    return ()=>clearTimeout(t);
  },[n,started]);

  // run the diagnostic checks animation when reached
  useEffect(()=>{
    const idx=CHAT_SCRIPT.findIndex(s=>s.who==="checks");
    if(n> idx && checkN<CHECKS.length){
      const t=setTimeout(()=>setCheckN(c=>c+1), 620); return ()=>clearTimeout(t);
    }
  },[n,checkN]);

  useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=scrollRef.current.scrollHeight; },[n,checkN]);

  const replay=()=>{ setN(0); setCheckN(0); };
  const visible = CHAT_SCRIPT.slice(0,n);

  return (
    <div ref={rootRef} style={{display:"grid",gridTemplateColumns:"1fr",gap:0,maxWidth:760,margin:"0 auto"}}>
      <div className="card" style={{overflow:"hidden",boxShadow:"var(--sh-lg)",padding:0}}>
        {/* chat header */}
        <div style={{display:"flex",alignItems:"center",gap:11,padding:"13px 17px",borderBottom:"1px solid var(--line)",background:"#fff"}}>
          <span style={{position:"relative",width:38,height:38,borderRadius:"50%",overflow:"hidden",background:"#FBEADD",border:"1.5px solid #EBC9A8",display:"grid",placeItems:"center"}}>
            <img src="assets/meera-avatar.png" style={{width:"150%"}} alt=""/>
          </span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:15}}>Meera</div>
            <div className="mono" style={{fontSize:11,color:"var(--green)",display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:7,height:7,borderRadius:99,background:"var(--green)"}}/> online · usually solves in seconds
            </div>
          </div>
          <button onClick={replay} className="btn btn-ghost btn-sm" style={{padding:"7px 13px"}}><Icon name="refresh" size={14}/> Replay</button>
        </div>

        {/* thread */}
        <div ref={scrollRef} style={{height:430,overflowY:"auto",padding:"18px 17px",background:"#FCFAF6",display:"flex",flexDirection:"column",gap:11}}>
          {visible.map((m,i)=>{
            if(m.who==="user") return <Bubble key={i} side="right">{m.t}</Bubble>;
            if(m.who==="meera") return <Bubble key={i} side="left">{m.t}</Bubble>;
            if(m.who==="checks") return <ChecksCard key={i} shown={checkN}/>;
            if(m.who==="ticket") return <TicketCard key={i}/>;
            return null;
          })}
          {started && n<CHAT_SCRIPT.length && CHAT_SCRIPT[n] && CHAT_SCRIPT[n].who==="meera" && <Typing/>}
        </div>
      </div>
    </div>
  );
}

function Bubble({side,children}){
  const left=side==="left";
  return (
    <div style={{display:"flex",justifyContent:left?"flex-start":"flex-end",animation:"fadeUp .35s ease both"}}>
      <div style={{maxWidth:"78%",padding:"11px 15px",fontSize:14,lineHeight:1.5,
        borderRadius:left?"4px 16px 16px 16px":"16px 4px 16px 16px",
        background:left?"#fff":"var(--ink)", color:left?"var(--ink)":"#fff",
        border:left?"1px solid var(--line)":"none", boxShadow:"var(--sh-sm)"}}>{children}</div>
    </div>
  );
}
function Typing(){
  return (
    <div style={{display:"flex",gap:4,padding:"12px 16px",background:"#fff",border:"1px solid var(--line)",
      borderRadius:"4px 16px 16px 16px",width:"fit-content",boxShadow:"var(--sh-sm)"}}>
      {[0,1,2].map(i=><span key={i} style={{width:7,height:7,borderRadius:99,background:"var(--muted)",
        animation:`tdot 1.1s ${i*.15}s ease-in-out infinite`}}/>)}
    </div>
  );
}
function ChecksCard({shown}){
  return (
    <div className="card" style={{padding:"13px 15px",animation:"fadeUp .35s ease both"}}>
      <div className="mono" style={{fontSize:10.5,letterSpacing:".1em",color:"var(--muted)",marginBottom:9,display:"flex",alignItems:"center",gap:6}}>
        <Icon name="sparkle" size={13} style={{color:"var(--teal)"}}/> RUNNING DIAGNOSTICS
      </div>
      <div style={{display:"grid",gap:8}}>
        {CHECKS.map((c,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:9,fontSize:13.5,opacity:i<shown?1:.3,transition:"opacity .3s"}}>
            <span style={{width:18,height:18,borderRadius:99,display:"grid",placeItems:"center",flexShrink:0,
              background:i>=shown?"#EEE7DA":c.ok?"var(--green-050)":"#FBE7E0",
              color:c.ok?"var(--green)":"var(--rose)"}}>
              {i<shown? <Icon name={c.ok?"check":"alert"} size={11} sw={2.4}/> : <span className="mono" style={{fontSize:9,color:"var(--muted)"}}>·</span>}
            </span>
            <span style={{fontWeight:500,color:"var(--ink)"}}>{c.t}</span>
            {i<shown && c.note && <span className="mono" style={{marginLeft:"auto",fontSize:11,color:"var(--rose)",background:"#FBE7E0",padding:"2px 8px",borderRadius:99}}>{c.note}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
function TicketCard(){
  return (
    <div style={{animation:"fadeUp .45s ease both"}}>
      <div className="mono" style={{fontSize:10.5,letterSpacing:".1em",color:"var(--sand-600)",margin:"4px 0 8px",display:"flex",alignItems:"center",gap:7}}>
        <span style={{flex:1,height:1,background:"var(--line-2)"}}/> AUTO-CREATED TICKET <span style={{flex:1,height:1,background:"var(--line-2)"}}/>
      </div>
      <div className="card" style={{padding:0,overflow:"hidden",boxShadow:"var(--sh-md)",borderColor:"var(--line-2)"}}>
        <div style={{display:"flex",alignItems:"center",gap:9,padding:"12px 15px",background:"#fff",borderBottom:"1px solid var(--line)"}}>
          <IconChip name="ticket" tint="sand" size={36} isize={18}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:14}}>Registration blocked by financial hold</div>
            <div className="mono" style={{fontSize:11,color:"var(--muted)"}}>#NV-4827 · created by Meera · just now</div>
          </div>
          <span className="pill" style={{background:"#FBE7E0",borderColor:"#F3D2C6",color:"#C0532F",fontSize:11.5}}>High urgency</span>
        </div>
        <div style={{padding:"13px 15px",display:"grid",gap:12}}>
          <Field label="AI SUMMARY">Student cannot submit Fall 2026 registration; Submit is disabled by an active financial hold ($310 balance). Transcript &amp; term are valid.</Field>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="ROUTED TO"><span style={{display:"inline-flex",alignItems:"center",gap:6,fontWeight:600}}><Icon name="route" size={14} style={{color:"var(--teal)"}}/> Bursar’s Office</span></Field>
            <Field label="CONTEXT"><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name="layers" size={14} style={{color:"var(--muted)"}}/> Session + 1 screenshot</span></Field>
          </div>
          <Field label="ATTEMPTED BY MEERA">
            <ul style={{margin:0,paddingLeft:16,display:"grid",gap:3}}>
              <li>Verified transcript upload &amp; term selection</li>
              <li>Checked account holds — found financial hold</li>
            </ul>
          </Field>
          <Field label="SUGGESTED NEXT STEP"><span style={{color:"var(--teal-700)",fontWeight:600}}>Clear hold → notify student → re-enable submission</span></Field>
        </div>
      </div>
    </div>
  );
}
function Field({label,children}){
  return (
    <div>
      <div className="mono" style={{fontSize:10,letterSpacing:".1em",color:"var(--muted)",marginBottom:4}}>{label}</div>
      <div style={{fontSize:13,color:"var(--ink-2)",lineHeight:1.5}}>{children}</div>
    </div>
  );
}

/* shared keyframes for demos */
const _demoStyle = document.createElement("style");
_demoStyle.textContent = `
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes tdot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
`;
document.head.appendChild(_demoStyle);

Object.assign(window, { MeerorDemo, ChatTicketDemo, Bubble, Typing, TicketCard, Field });
