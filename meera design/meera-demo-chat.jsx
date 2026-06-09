/* ===== Meera Demo: Chat flow (4d) + Build the Mound (4e) ===== */

/* ── Shared sub-components ── */
function StudentFaqCard() {
  return (
    <div className="card" style={{padding:"13px 15px", animation:"fadeUp .35s ease both"}}>
      <div className="mono" style={{fontSize:10.5, letterSpacing:".1em", color:"var(--muted)", marginBottom:8, display:"flex", alignItems:"center", gap:6}}>
        <Icon name="book" size={13} style={{color:"var(--teal)"}} /> FROM KNOWLEDGE BASE
      </div>
      <div style={{fontWeight:700, fontSize:14, marginBottom:5}}>Why is my Submit button greyed out?</div>
      <div style={{fontSize:13, color:"var(--ink-2)", lineHeight:1.55, marginBottom:10}}>
        Registration Submit is typically locked by a financial hold, a missing document, or pending advisor sign-off. All three must be clear before you can submit.
      </div>
      <div style={{display:"flex", alignItems:"center", gap:10, flexWrap:"wrap"}}>
        <span className="pill" style={{background:"var(--teal-050)", borderColor:"var(--teal-100)", color:"var(--teal-700)", padding:"4px 10px", fontSize:11.5, display:"inline-flex", alignItems:"center", gap:5}}>
          <Icon name="book" size={11} /> IT Knowledge Base · 3 sources
        </span>
        <Confidence value={94} />
      </div>
    </div>
  );
}

function StudentQuickFixCard({ onChoice }) {
  const [choice, setChoice] = React.useState(null);
  React.useEffect(() => {
    if (choice !== null) return;
    const t = setTimeout(() => { setChoice("stuck"); onChoice("stuck"); }, 3500);
    return () => clearTimeout(t);
  }, []);
  const pick = (c) => { if (choice !== null) return; setChoice(c); onChoice(c); };
  return (
    <div className="card" style={{padding:"14px 15px", animation:"fadeUp .35s ease both"}}>
      <div style={{fontWeight:700, fontSize:14, marginBottom:11}}>Did this help?</div>
      <div style={{display:"flex", gap:9}}>
        <button onClick={() => pick("fixed")} style={{
          flex:1, padding:"10px", borderRadius:10, fontFamily:"inherit", cursor:choice?"default":"pointer",
          border:`1.5px solid ${choice==="fixed"?"var(--green)":"var(--line-2)"}`,
          background:choice==="fixed"?"var(--green-050)":"#fff",
          color:choice==="fixed"?"#5E9438":"var(--ink-2)",
          fontWeight:600, fontSize:13.5, transition:"all .2s",
        }}>✓ Yes, sorted!</button>
        <button onClick={() => pick("stuck")} style={{
          flex:1, padding:"10px", borderRadius:10, fontFamily:"inherit", cursor:choice?"default":"pointer",
          border:`1.5px solid ${choice==="stuck"?"var(--sand-600)":"var(--line-2)"}`,
          background:choice==="stuck"?"var(--sand-050)":"#fff",
          color:choice==="stuck"?"var(--sand-600)":"var(--ink-2)",
          fontWeight:600, fontSize:13.5, transition:"all .2s",
        }}>Still stuck →</button>
      </div>
      {choice === "stuck" && <div style={{marginTop:8, fontSize:12.5, color:"var(--muted)"}}>OK — escalating with full context.</div>}
    </div>
  );
}

function StudentIdentityCard() {
  const [val, setVal] = React.useState("");
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    const t1 = setTimeout(() => setVal("alex.rivera@northvale.edu"), 1800);
    const t2 = setTimeout(() => setDone(true), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div className="card" style={{padding:"13px 15px", animation:"fadeUp .35s ease both"}}>
      <div className="mono" style={{fontSize:10.5, letterSpacing:".1em", color:"var(--muted)", marginBottom:9}}>QUICK CHECK</div>
      <div style={{fontWeight:600, fontSize:14, marginBottom:10}}>What's your university email or student ID?</div>
      <div style={{display:"flex", gap:8, marginBottom:9}}>
        <input value={val} onChange={e => setVal(e.target.value)} placeholder="your@university.edu"
          style={{flex:1, padding:"9px 12px", borderRadius:9, outline:"none", fontFamily:"inherit",
            border:`1.5px solid ${done?"var(--teal)":"var(--line-2)"}`, fontSize:13.5, transition:"border-color .3s"}} />
        {done && <span style={{display:"flex", alignItems:"center", color:"var(--teal)", paddingRight:2}}><Icon name="check" size={18} sw={2.2} /></span>}
      </div>
      <div className="mono" style={{fontSize:10.5, color:"var(--green)", display:"flex", alignItems:"center", gap:5}}>
        <Icon name="shield" size={12} sw={2} /> this tab only · you control what's shared
      </div>
    </div>
  );
}

function StudentHandoffCloser() {
  return (
    <div style={{background:"var(--teal-050)", border:"1px solid var(--teal-100)", borderRadius:"var(--r-md)", padding:"16px 18px", animation:"fadeUp .45s ease both"}}>
      <div style={{display:"flex", gap:13, alignItems:"center", marginBottom:12}}>
        <img src="assets/meera-wave.png" style={{width:54, flexShrink:0}} alt="" />
        <div>
          <div style={{fontWeight:700, fontSize:15, marginBottom:4}}>Handed to the Bursar's Office</div>
          <div style={{fontSize:13.5, color:"var(--ink-2)", lineHeight:1.55}}>You'll hear back by email — usually within a few hours. No need to explain again; everything's documented.</div>
          <div className="mono" style={{fontSize:11, color:"var(--teal-700)", marginTop:6}}>Ticket #NV-4827 · created just now</div>
        </div>
      </div>
      <div style={{display:"flex", alignItems:"center", gap:9, paddingTop:10, borderTop:"1px solid var(--teal-100)"}}>
        <span style={{fontSize:13, color:"var(--muted)"}}>How was this?</span>
        {["👍","❤️","🙌"].map(e => (
          <button key={e} style={{fontSize:17, background:"#fff", border:"1px solid var(--line)", borderRadius:8, padding:"4px 8px", cursor:"pointer"}}>{e}</button>
        ))}
      </div>
    </div>
  );
}

function StudentResolvedState() {
  return (
    <div style={{textAlign:"center", padding:"20px 12px 12px", animation:"fadeUp .45s ease both"}}>
      <img src="assets/meera-celebrate.png" alt="Meera celebrating" style={{width:88, margin:"0 auto 10px", display:"block"}} />
      <div style={{fontWeight:800, fontSize:20, marginBottom:6}}>Glad that's sorted!</div>
      <div style={{fontSize:14, color:"var(--ink-2)", lineHeight:1.6, maxWidth:320, margin:"0 auto 16px"}}>No ticket needed — you're all set. Come back any time.</div>
      <div style={{display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
        <span style={{fontSize:13, color:"var(--muted)"}}>How was this?</span>
        {[1,2,3,4,5].map(i => <span key={i} style={{fontSize:20, cursor:"pointer"}}>⭐</span>)}
      </div>
    </div>
  );
}

/* ── 4d. StudentChat ── */
const FULL_CHAT = [
  { who:"meera",    t:"Hi! I'm Meera 👋  Tell me what's going on — in your own words. No department to pick, no form to fill.", delay:0 },
  { who:"user",     t:"I can't register for classes and the deadline is tomorrow. I'm kind of panicking.", delay:1400 },
  { who:"meera",    t:"I hear you — deadline pressure is real. Let me look at this right now.", delay:1000 },
  { who:"faq",      delay:900 },
  { who:"meera",    t:"One quick question: when you try to click Submit, is it greyed out or is there an error message?", delay:1300 },
  { who:"user",     t:"It's completely greyed out. I can't click it at all.", delay:1400 },
  { who:"checks",   delay:700 },
  { who:"meera",    t:"Found it. There's a $310 financial hold on your account — that's what's locking Submit. Not a form issue on your end.", delay:1800 },
  { who:"quickfix", delay:700 },
  { who:"identity", delay:300 },
  { who:"meera",    t:"Thanks, Alex. I've packaged everything the Bursar's Office needs to resolve this today. Creating your ticket now.", delay:1200 },
  { who:"ticket",   delay:600 },
  { who:"closer",   delay:400 },
];
const FULL_CHECKS = [
  { t:"Advisor approval on file",   ok:true },
  { t:"Enrollment term selected",   ok:true },
  { t:"Course prerequisites met",   ok:true },
  { t:"Active account holds",       ok:false, note:"$310 hold" },
];

function StudentChat({ preIssue }) {
  const [n, setN]           = React.useState(0);
  const [checkN, setCheckN] = React.useState(0);
  const [fixChoice, setFix] = React.useState(null);
  const scrollRef           = React.useRef(null);
  const script = React.useMemo(() =>
    preIssue ? FULL_CHAT.map((s,i) => i===1 ? {...s,t:preIssue} : s) : FULL_CHAT
  , [preIssue]);
  const qIdx = script.findIndex(s => s.who === "quickfix");

  React.useEffect(() => {
    if (n >= script.length) return;
    if (n > qIdx && fixChoice !== "stuck") return;
    const item = script[n];
    const delay = item.delay !== undefined ? item.delay : (item.who==="user"?1300:item.who==="checks"?700:1100);
    const t = setTimeout(() => setN(nn => nn + 1), delay);
    return () => clearTimeout(t);
  }, [n, fixChoice]);

  React.useEffect(() => {
    const idx = script.findIndex(s => s.who === "checks");
    if (n > idx && checkN < FULL_CHECKS.length) {
      const t = setTimeout(() => setCheckN(c => c + 1), 600);
      return () => clearTimeout(t);
    }
  }, [n, checkN]);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [n, checkN, fixChoice]);

  const visible = script.slice(0, n);
  const showTyping = n < script.length && script[n]?.who === "meera" && !(n > qIdx && fixChoice !== "stuck");

  return (
    <div style={{height:"100%", display:"flex", flexDirection:"column", background:"var(--cream)"}}>
      <div style={{background:"#fff", borderBottom:"1px solid var(--line)", padding:"11px 24px", display:"flex", alignItems:"center", gap:13, flexShrink:0}}>
        <span style={{width:36, height:36, borderRadius:"50%", overflow:"hidden", background:"#FBEADD", border:"1.5px solid #EBC9A8", display:"grid", placeItems:"center", flexShrink:0}}>
          <img src="assets/meera-avatar.png" style={{width:"150%"}} alt="" />
        </span>
        <div style={{flex:1}}>
          <div style={{fontWeight:700, fontSize:15}}>Meera</div>
          <div className="mono" style={{fontSize:11, color:"var(--green)", display:"flex", alignItems:"center", gap:5}}>
            <span style={{width:7, height:7, borderRadius:99, background:"var(--green)"}} /> online · help.northvale.edu
          </div>
        </div>
        <Confidence value={94} label="confidence" />
      </div>
      <div ref={scrollRef} style={{flex:1, overflowY:"auto", padding:"18px 16px", display:"flex", flexDirection:"column", gap:12, maxWidth:680, width:"100%", margin:"0 auto", alignSelf:"stretch"}}>
        {visible.map((m, i) => {
          if (m.who === "user")  return <Bubble key={i} side="right">{m.t}</Bubble>;
          if (m.who === "meera") return <Bubble key={i} side="left">{m.t}</Bubble>;
          if (m.who === "faq")   return <StudentFaqCard key={i} />;
          if (m.who === "checks") return (
            <div key={i} className="card" style={{padding:"13px 15px", animation:"fadeUp .35s ease both"}}>
              <div className="mono" style={{fontSize:10.5, letterSpacing:".1em", color:"var(--muted)", marginBottom:9, display:"flex", alignItems:"center", gap:6}}>
                <Icon name="sparkle" size={13} style={{color:"var(--teal)"}} /> RUNNING DIAGNOSTICS
              </div>
              <div style={{display:"grid", gap:9}}>
                {FULL_CHECKS.map((c, j) => (
                  <div key={j} style={{display:"flex", alignItems:"center", gap:9, fontSize:13.5, opacity:j<checkN?1:.3, transition:"opacity .3s"}}>
                    <span style={{width:18, height:18, borderRadius:99, display:"grid", placeItems:"center", flexShrink:0,
                      background:j>=checkN?"#EEE7DA":c.ok?"var(--green-050)":"#FBE7E0", color:c.ok?"var(--green)":"var(--rose)"}}>
                      {j < checkN && <Icon name={c.ok?"check":"alert"} size={11} sw={2.4} />}
                    </span>
                    <span style={{fontWeight:500}}>{c.t}</span>
                    {j < checkN && c.note && <span className="mono" style={{marginLeft:"auto", fontSize:11, color:"var(--rose)", background:"#FBE7E0", padding:"2px 8px", borderRadius:99}}>{c.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          );
          if (m.who === "quickfix") return <StudentQuickFixCard key={i} onChoice={setFix} />;
          if (m.who === "identity" && fixChoice === "stuck") return <StudentIdentityCard key={i} />;
          if (m.who === "ticket"   && fixChoice === "stuck") return <TicketCard key={i} />;
          if (m.who === "closer"   && fixChoice === "stuck") return <StudentHandoffCloser key={i} />;
          return null;
        })}
        {fixChoice === "fixed" && n > qIdx && <StudentResolvedState />}
        {showTyping && <Typing />}
      </div>
      <div style={{padding:"11px 16px", borderTop:"1px solid var(--line)", background:"#fff", maxWidth:680, width:"100%", margin:"0 auto", alignSelf:"stretch", flexShrink:0}}>
        <div style={{display:"flex", gap:9, alignItems:"flex-end"}}>
          <textarea placeholder="Reply to Meera…" style={{flex:1, padding:"10px 14px", borderRadius:"var(--r-md)", border:"1.5px solid var(--line-2)", fontSize:14, fontFamily:"inherit", resize:"none", outline:"none", lineHeight:1.5, height:44}} />
          <button className="btn btn-primary" style={{padding:"10px 15px", borderRadius:"var(--r-md)", flexShrink:0}}>
            <Icon name="arrow" size={16} sw={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   4e. BUILD THE MOUND — same chat engine, dramatically different visual shell
──────────────────────────────────────────────────────────────────────────── */

/* Dedicated chat script for Mound mode — references the visual */
const MOUND_CHAT = [
  { who:"meera",    t:"Hey 👋 Watch the Case Meter on the right — it grows as we make progress. What's going on?", delay:0 },
  { who:"user",     t:"I can't register for classes and the deadline is tomorrow. I'm seriously panicking.", delay:1400 },
  { who:"meera",    t:"I hear you — deadline pressure is real. I'm on it right now.", delay:900 },
  { who:"faq",      delay:800 },
  { who:"meera",    t:"One thing: when you try Submit, is it greyed out or giving you an error?", delay:1200 },
  { who:"user",     t:"Completely greyed out. Can't click it at all.", delay:1400 },
  { who:"checks",   delay:700 },
  { who:"meera",    t:"Found it — a $310 financial hold is locking Submit. Not a form issue on your end.", delay:1800 },
  { who:"quickfix", delay:700 },
  { who:"identity", delay:300 },
  { who:"meera",    t:"Got it, Alex. Packaging everything now and creating your ticket.", delay:1200 },
  { who:"ticket",   delay:600 },
  { who:"closer",   delay:400 },
];

/* Layer definitions — brand gradient fills, bottom→top */
const CASE_LAYERS = [
  { label:"Student heard",   icon:"chat",    bg:"linear-gradient(135deg,var(--cream-3) 0%,var(--cream-2) 100%)", border:"var(--line-2)",    text:"var(--ink-2)",    glow:"rgba(110,126,139,.18)" },
  { label:"Researched",      icon:"book",    bg:"linear-gradient(135deg,var(--teal-100) 0%,#aed4cf 100%)",       border:"#a0cbc5",           text:"var(--teal-700)", glow:"rgba(46,156,142,.22)" },
  { label:"Diagnosed",       icon:"sparkle", bg:"linear-gradient(135deg,var(--teal) 0%,var(--teal-600) 100%)",   border:"var(--teal-700)",   text:"#fff",            glow:"rgba(46,156,142,.38)" },
  { label:"Case packaged",   icon:"ticket",  bg:"linear-gradient(135deg,var(--teal-700) 0%,#12433c 100%)",       border:"#0e3430",           text:"#fff",            glow:"rgba(18,67,60,.42)" },
];
const CASE_W = [170, 144, 118, 92]; /* widths: bottom→top */

const MOUND_LABELS = ["Ready…","Meera listening","Investigating","Issue found!","Case ready!"];
const MOUND_CONF   = [0, 34, 61, 84, 97];

function getMoundStage(n, fixChoice, qIdx) {
  if (fixChoice === "fixed") return 4;
  if (n > qIdx + 2) return 4;
  if (n > qIdx)     return 2;
  if (n >= 7)       return 3;
  if (n >= 3)       return 2;
  if (n >= 1)       return 1;
  return 0;
}

/* Milestone pill that appears in the chat thread at each layer */
function MilestoneChip({ text, icon }) {
  return (
    <div style={{display:"flex", alignItems:"center", gap:9, padding:"7px 14px", borderRadius:"var(--r-pill)",
      background:"var(--teal-050)", border:"1px solid var(--teal-100)",
      animation:"fadeUp .4s ease both", alignSelf:"center", margin:"0 auto"}}>
      <span style={{width:22, height:22, borderRadius:"50%", background:"var(--teal)",
        display:"grid", placeItems:"center", flexShrink:0}}>
        <Icon name={icon} size={11} sw={2.4} style={{color:"#fff"}} />
      </span>
      <span className="mono" style={{fontSize:11, fontWeight:600, color:"var(--teal-700)", letterSpacing:".03em", whiteSpace:"nowrap"}}>{text}</span>
    </div>
  );
}

/* The living case meter sidebar */
function CaseMeter({ n, fixChoice, qIdx, showDamage }) {
  const stage   = getMoundStage(n, fixChoice, qIdx);
  const isSolved = fixChoice === "fixed" || stage >= 4;
  const conf    = MOUND_CONF[Math.min(stage, 4)];
  const R = 44, CIRC = 2 * Math.PI * R;

  return (
    <div style={{
      borderLeft:"1px solid var(--line)",
      background:"linear-gradient(180deg, oklch(95% 0.02 185) 0%, #fff 52%)",
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"18px 14px 16px", gap:13, position:"relative", overflow:"hidden",
    }}>
      {/* Ambient radial glow that intensifies with stage */}
      <div style={{
        position:"absolute", top:-50, left:"50%", transform:"translateX(-50%)",
        width:260, height:260, borderRadius:"50%", pointerEvents:"none",
        background:`radial-gradient(circle, rgba(46,156,142,${(stage*0.06).toFixed(3)}) 0%, transparent 68%)`,
        transition:"background 1s",
      }} />

      <div className="mono" style={{fontSize:9.5, letterSpacing:".14em", color:"var(--teal-700)", position:"relative"}}>CASE METER</div>

      {/* Circular SVG ring */}
      <div style={{position:"relative", width:104, height:104, flexShrink:0}}>
        <svg width="104" height="104" viewBox="0 0 104 104" style={{display:"block", overflow:"visible"}}>
          {/* Subtle outer pulse ring */}
          <circle cx="52" cy="52" r={R+7} fill="none"
            stroke={`rgba(46,156,142,${(stage*0.08).toFixed(2)})`} strokeWidth="3"
            style={{transition:"stroke 1s"}} />
          {/* Track */}
          <circle cx="52" cy="52" r={R} fill="none" stroke="var(--line-2)" strokeWidth="9" />
          {/* Progress arc */}
          <circle cx="52" cy="52" r={R} fill="none"
            stroke={showDamage ? "var(--sand)" : "var(--teal)"}
            strokeWidth="9" strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - conf / 100)}
            transform="rotate(-90 52 52)"
            style={{transition:"stroke-dashoffset .95s cubic-bezier(.2,.9,.3,1), stroke .3s"}}
          />
        </svg>
        {/* Center */}
        <div style={{position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
          {isSolved ? (
            <img src="assets/meera-avatar.png" style={{width:36, animation:"bob 2.2s ease-in-out infinite"}} alt="" />
          ) : (
            <React.Fragment>
              <span style={{fontWeight:800, fontSize:22, letterSpacing:"-.03em", lineHeight:1,
                color:showDamage?"var(--sand-600)":"var(--teal-700)", transition:"color .3s"}}>{conf}%</span>
              <span className="mono" style={{fontSize:8.5, color:"var(--muted)", letterSpacing:".06em"}}>progress</span>
            </React.Fragment>
          )}
        </div>
      </div>

      {/* Stacked layers with 3D perspective */}
      <div style={{
        display:"flex", flexDirection:"column-reverse",
        alignItems:"center", gap:5, width:"100%",
        transform:"perspective(280px) rotateX(11deg)",
        transformOrigin:"bottom center", position:"relative",
      }}>
        {CASE_LAYERS.map((layer, i) => {
          const isBuilt = i < stage;
          const isDmg   = showDamage && i === stage - 1;
          const isNew   = isBuilt && i === stage - 1 && !showDamage;
          return (
            <div key={i} style={{
              width: isBuilt ? CASE_W[i] : CASE_W[i] * 0.1,
              height: 34, borderRadius:10,
              background: isDmg ? "var(--sand)" : isBuilt ? layer.bg : "var(--cream-2)",
              border: `1.5px solid ${isDmg ? "var(--sand-600)" : isBuilt ? layer.border : "var(--line)"}`,
              color: isBuilt && !isDmg ? layer.text : "transparent",
              display:"flex", alignItems:"center", justifyContent:"center", gap:5,
              transition:"width .7s cubic-bezier(.2,.9,.3,1), box-shadow .4s",
              opacity: isBuilt ? 1 : 0.12,
              boxShadow: isBuilt && !isDmg ? `0 5px 18px ${layer.glow}` : "none",
              animation: isDmg ? "mound-shake .7s ease" : isNew ? "mound-layer-in .5s ease" : "none",
              fontSize:11, fontWeight:700, overflow:"hidden", whiteSpace:"nowrap",
            }}>
              {isBuilt && <Icon name={isDmg ? "alert" : layer.icon} size={12} sw={2} />}
              {isBuilt && <span>{isDmg ? "Hmm…" : layer.label}</span>}
              {isBuilt && !isDmg && <span style={{opacity:.5, marginLeft:1, fontSize:10}}>✓</span>}
            </div>
          );
        })}
        {/* Ground bar */}
        <div style={{width:"90%", height:5, borderRadius:"0 0 99px 99px",
          background:"linear-gradient(90deg,var(--teal-100),var(--teal-050),var(--teal-100))", marginTop:2}} />
      </div>

      {/* Status + glowing dots */}
      <div style={{textAlign:"center", position:"relative"}}>
        <div style={{fontWeight:700, fontSize:12.5, marginBottom:8,
          color:showDamage?"var(--sand-600)":isSolved?"var(--teal-700)":"var(--ink-2)", transition:"color .3s"}}>
          {showDamage ? "Regrouping…" : isSolved ? (fixChoice==="fixed"?"All sorted! 🎉":"Case ready!") : MOUND_LABELS[stage]}
        </div>
        <div style={{display:"flex", gap:7, justifyContent:"center"}}>
          {[0,1,2,3].map(i => (
            <span key={i} style={{
              width:9, height:9, borderRadius:99,
              background: i < stage ? "var(--teal)" : "var(--line-2)",
              boxShadow: i < stage ? "0 0 8px var(--teal), 0 0 3px var(--teal)" : "none",
              transition:"background .4s, box-shadow .5s",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* StudentMound — chat engine + CaseMeter sidebar */
function StudentMound({ preIssue }) {
  const [n, setN]           = React.useState(0);
  const [checkN, setCheckN] = React.useState(0);
  const [fixChoice, setFix] = React.useState(null);
  const [showDamage, setDmg] = React.useState(false);
  const scrollRef           = React.useRef(null);

  const script = React.useMemo(() =>
    preIssue ? MOUND_CHAT.map((s,i) => i===1 ? {...s,t:preIssue} : s) : MOUND_CHAT
  , [preIssue]);
  const qIdx = script.findIndex(s => s.who === "quickfix");
  const stage = getMoundStage(n, fixChoice, qIdx);

  React.useEffect(() => {
    if (n >= script.length) return;
    if (n > qIdx && fixChoice !== "stuck") return;
    const item = script[n];
    const delay = item.delay !== undefined ? item.delay : (item.who==="user"?1300:item.who==="checks"?700:1100);
    const t = setTimeout(() => setN(nn => nn + 1), delay);
    return () => clearTimeout(t);
  }, [n, fixChoice]);

  React.useEffect(() => {
    const idx = script.findIndex(s => s.who === "checks");
    if (n > idx && checkN < FULL_CHECKS.length) {
      const t = setTimeout(() => setCheckN(c => c + 1), 600);
      return () => clearTimeout(t);
    }
  }, [n, checkN]);

  React.useEffect(() => {
    if (fixChoice === "stuck") {
      setDmg(true);
      const t = setTimeout(() => setDmg(false), 1900);
      return () => clearTimeout(t);
    }
  }, [fixChoice]);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [n, checkN, fixChoice]);

  const visible = script.slice(0, n);
  const showTyping = n < script.length && script[n]?.who === "meera" && !(n > qIdx && fixChoice !== "stuck");

  return (
    <div style={{height:"100%", display:"flex", flexDirection:"column", background:"var(--cream)"}}>
      {/* Header */}
      <div style={{background:"#fff", borderBottom:"1px solid var(--line)", padding:"11px 24px",
        display:"flex", alignItems:"center", gap:13, flexShrink:0}}>
        <span style={{width:36, height:36, borderRadius:"50%", overflow:"hidden", background:"#FBEADD",
          border:"1.5px solid #EBC9A8", display:"grid", placeItems:"center", flexShrink:0}}>
          <img src="assets/meera-avatar.png" style={{width:"150%"}} alt="" />
        </span>
        <div style={{flex:1}}>
          <div style={{fontWeight:700, fontSize:15}}>Meera</div>
          <div className="mono" style={{fontSize:11, color:"var(--green)", display:"flex", alignItems:"center", gap:5}}>
            <span style={{width:7, height:7, borderRadius:99, background:"var(--green)"}} />
            Build the Mound · watch the case meter grow
          </div>
        </div>
        <span className="pill" style={{background:"var(--teal-050)", borderColor:"var(--teal-100)",
          color:"var(--teal-700)", fontSize:11.5, padding:"4px 12px", display:"inline-flex", alignItems:"center", gap:5}}>
          <Icon name="sparkle" size={12} /> {stage} / 4 layers
        </span>
      </div>

      {/* Two-column: chat + meter */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 250px", flex:1, minHeight:0, overflow:"hidden"}}>
        {/* Chat thread */}
        <div ref={scrollRef} style={{overflowY:"auto", padding:"18px 16px", display:"flex", flexDirection:"column", gap:12}}>
          {visible.map((m, i) => {
            const prevWho = i > 0 ? script[i-1]?.who : null;
            if (m.who === "user") return <Bubble key={i} side="right">{m.t}</Bubble>;
            if (m.who === "meera") {
              const bubble = <Bubble key={`b${i}`} side="left">{m.t}</Bubble>;
              /* After FAQ → Layer 2 milestone */
              if (prevWho === "faq") return (
                <React.Fragment key={i}>{bubble}<MilestoneChip text="Layer 2 built · Researched" icon="book" /></React.Fragment>
              );
              /* After checks → Layer 3 milestone */
              if (prevWho === "checks") return (
                <React.Fragment key={i}>{bubble}<MilestoneChip text="Layer 3 built · Diagnosed" icon="sparkle" /></React.Fragment>
              );
              return bubble;
            }
            if (m.who === "faq") return <StudentFaqCard key={i} />;
            if (m.who === "checks") return (
              <div key={i} className="card" style={{padding:"13px 15px", animation:"fadeUp .35s ease both"}}>
                <div className="mono" style={{fontSize:10.5, letterSpacing:".1em", color:"var(--muted)", marginBottom:9, display:"flex", alignItems:"center", gap:6}}>
                  <Icon name="sparkle" size={13} style={{color:"var(--teal)"}} /> RUNNING DIAGNOSTICS
                </div>
                <div style={{display:"grid", gap:9}}>
                  {FULL_CHECKS.map((c, j) => (
                    <div key={j} style={{display:"flex", alignItems:"center", gap:9, fontSize:13.5, opacity:j<checkN?1:.3, transition:"opacity .3s"}}>
                      <span style={{width:18, height:18, borderRadius:99, display:"grid", placeItems:"center", flexShrink:0,
                        background:j>=checkN?"#EEE7DA":c.ok?"var(--green-050)":"#FBE7E0", color:c.ok?"var(--green)":"var(--rose)"}}>
                        {j < checkN && <Icon name={c.ok?"check":"alert"} size={11} sw={2.4} />}
                      </span>
                      <span style={{fontWeight:500}}>{c.t}</span>
                      {j < checkN && c.note && <span className="mono" style={{marginLeft:"auto", fontSize:11, color:"var(--rose)", background:"#FBE7E0", padding:"2px 8px", borderRadius:99}}>{c.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
            if (m.who === "quickfix") return <StudentQuickFixCard key={i} onChoice={setFix} />;
            if (m.who === "identity" && fixChoice === "stuck") return <StudentIdentityCard key={i} />;
            if (m.who === "ticket" && fixChoice === "stuck") return (
              <React.Fragment key={i}>
                <TicketCard />
                <MilestoneChip text="Layer 4 built · Case packaged" icon="ticket" />
              </React.Fragment>
            );
            if (m.who === "closer" && fixChoice === "stuck") return <StudentHandoffCloser key={i} />;
            return null;
          })}
          {fixChoice === "fixed" && n > qIdx && (
            <React.Fragment>
              <MilestoneChip text="All done · Mound complete 🎉" icon="check" />
              <StudentResolvedState />
            </React.Fragment>
          )}
          {showTyping && <Typing />}
        </div>

        {/* Case Meter */}
        <CaseMeter n={n} fixChoice={fixChoice} qIdx={qIdx} showDamage={showDamage} />
      </div>

      {/* Input */}
      <div style={{padding:"11px 16px", borderTop:"1px solid var(--line)", background:"#fff", flexShrink:0}}>
        <div style={{display:"flex", gap:9, alignItems:"flex-end", maxWidth:560}}>
          <textarea placeholder="Reply to Meera…" style={{
            flex:1, padding:"10px 14px", borderRadius:"var(--r-md)",
            border:"1.5px solid var(--line-2)", fontSize:14, fontFamily:"inherit",
            resize:"none", outline:"none", lineHeight:1.5, height:44,
          }} />
          <button className="btn btn-primary" style={{padding:"10px 15px", borderRadius:"var(--r-md)", flexShrink:0}}>
            <Icon name="arrow" size={16} sw={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* Inject keyframes once */
(function() {
  if (document.getElementById("meera-mound-kf")) return;
  const s = document.createElement("style");
  s.id = "meera-mound-kf";
  s.textContent = `
    @keyframes mound-shake {
      0%,100%{transform:translateX(0) rotate(0deg)}
      15%{transform:translateX(-8px) rotate(-2.5deg)}
      30%{transform:translateX(8px) rotate(2.5deg)}
      50%{transform:translateX(-5px) rotate(-1deg)}
      70%{transform:translateX(5px) rotate(1deg)}
      85%{transform:translateX(-2px)}
    }
    @keyframes mound-layer-in {
      from{transform:scaleX(.06);opacity:0}
      60%{transform:scaleX(1.04)}
      to{transform:scaleX(1);opacity:1}
    }
  `;
  document.head.appendChild(s);
})();

Object.assign(window, { StudentChat, StudentMound });
