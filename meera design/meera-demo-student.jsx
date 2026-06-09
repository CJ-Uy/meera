/* ===== Meera Demo Student Views: Site · Embedded · Screenshare ===== */

/* ── 4a. Meera site ── */
const SITE_CHIPS = ["Can't register","Wi-Fi won't connect","Tuition hold","Reset my password"];

function StudentMeeraSite({ onChipSelect }) {
  const [val, setVal] = React.useState("");
  return (
    <div style={{minHeight:"100%", background:"var(--cream)"}}>
      <div style={{background:"#fff", borderBottom:"1px solid var(--line)", padding:"13px 28px", display:"flex", alignItems:"center", gap:14}}>
        <span style={{fontWeight:800, fontSize:15, letterSpacing:"-.02em"}}>Northvale University</span>
        <span style={{color:"var(--line-2)", fontSize:20}}>·</span>
        <div style={{display:"flex", alignItems:"center", gap:7}}>
          <MeerkatMark size={22} />
          <span style={{fontWeight:700, fontSize:13.5}}>powered by Meera</span>
        </div>
        <span className="mono" style={{marginLeft:"auto", fontSize:11, color:"var(--muted)"}}>help.northvale.edu</span>
        <span className="mono" style={{fontSize:10, color:"var(--teal-700)", background:"var(--teal-050)", padding:"2px 8px", borderRadius:99}}>beta</span>
      </div>
      <div style={{maxWidth:580, margin:"0 auto", padding:"56px 24px 48px", textAlign:"center"}}>
        <img src="assets/meera-wave.png" alt="Meera waving" style={{width:112, margin:"0 auto 18px", display:"block"}} />
        <h1 style={{fontSize:34, fontWeight:800, letterSpacing:"-.03em", marginBottom:10, lineHeight:1.1}}>
          Hi! What can I help you with?
        </h1>
        <p style={{fontSize:16, color:"var(--ink-2)", marginBottom:30, lineHeight:1.6}}>
          Tell me what's going on — no need to pick a department. I'll figure out who to loop in.
        </p>
        <div style={{background:"#fff", borderRadius:"var(--r-lg)", border:"1.5px solid var(--line-2)", boxShadow:"var(--sh-md)", padding:4, marginBottom:22}}>
          <textarea
            value={val}
            onChange={e => setVal(e.target.value)}
            placeholder="Describe what's going on…"
            style={{width:"100%", padding:"15px 17px", fontSize:15, border:"none", outline:"none",
              borderRadius:"var(--r-lg)", resize:"none", fontFamily:"inherit",
              color:"var(--ink)", background:"transparent", minHeight:80, display:"block",
              boxSizing:"border-box"}}
          />
          <div style={{display:"flex", justifyContent:"flex-end", padding:"4px 8px 6px"}}>
            <button onClick={() => onChipSelect && onChipSelect(val || "I need help")}
              className="btn btn-primary btn-sm" style={{padding:"9px 18px"}}>
              Ask Meera <Icon name="arrow" size={15} sw={2.2} />
            </button>
          </div>
        </div>
        <span className="mono" style={{fontSize:10.5, color:"var(--muted)", letterSpacing:".1em", marginBottom:12, display:"block"}}>OR PICK A COMMON ISSUE</span>
        <div style={{display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center"}}>
          {SITE_CHIPS.map(c => (
            <button key={c} onClick={() => onChipSelect && onChipSelect(c)}
              className="pill"
              style={{cursor:"pointer", fontSize:13.5, fontWeight:600, padding:"9px 18px", borderRadius:99,
                transition:"box-shadow .15s, transform .15s", fontFamily:"inherit", background:"#fff"}}>
              {c}
            </button>
          ))}
        </div>
        <div className="mono" style={{fontSize:11, color:"var(--muted)", marginTop:26,
          display:"flex", alignItems:"center", justifyContent:"center", gap:6}}>
          <Icon name="shield" size={13} sw={2} style={{color:"var(--green)"}} />
          You control what's shared · nothing leaves this tab without your say-so
        </div>
      </div>
    </div>
  );
}

/* ── 4b. Embedded (university portal + floating Meera chat) ── */
const EMBED_STEPS = [
  { who:"meera",   t:"Hi! What's going on today? I can help with registration, holds, or anything else.", delay:0 },
  { who:"user",    t:"I have a tuition hold and can't register for classes.", delay:1300 },
  { who:"meera",   t:"Got it — let me check your account right now.", delay:900 },
  { who:"echks",   delay:600 },
  { who:"meera",   t:"Found it: a $310 financial hold. I'll create a ticket for the Bursar's Office — you'll hear back within 24 hours.", delay:1800 },
  { who:"eticket", delay:500 },
];
const EMBED_CHKS = [
  { t:"Enrollment term",  ok:true },
  { t:"Advisor approval", ok:true },
  { t:"Active holds",     ok:false, note:"$310 hold" },
];

function EmbedBubble({ side, children }) {
  const left = side === "left";
  return (
    <div style={{display:"flex", justifyContent:left?"flex-start":"flex-end", animation:"fadeUp .3s ease"}}>
      <div style={{maxWidth:"82%", padding:"7px 11px", fontSize:12.5, lineHeight:1.5,
        borderRadius:left?"4px 12px 12px 12px":"12px 4px 12px 12px",
        background:left?"#fff":"var(--ink)", color:left?"var(--ink)":"#fff",
        border:left?"1px solid var(--line)":"none"}}>
        {children}
      </div>
    </div>
  );
}

function StudentEmbedded() {
  const [chatOpen, setChatOpen] = React.useState(false);
  const [n, setN] = React.useState(0);
  const [checkN, setCheckN] = React.useState(0);
  const scrollRef = React.useRef(null);

  React.useEffect(() => { const t = setTimeout(() => setChatOpen(true), 1600); return () => clearTimeout(t); }, []);

  React.useEffect(() => {
    if (!chatOpen || n >= EMBED_STEPS.length) return;
    const item = EMBED_STEPS[n];
    const delay = item.delay !== undefined ? item.delay : (item.who === "user" ? 1100 : 1000);
    const t = setTimeout(() => setN(nn => nn + 1), delay);
    return () => clearTimeout(t);
  }, [n, chatOpen]);

  React.useEffect(() => {
    const idx = EMBED_STEPS.findIndex(s => s.who === "echks");
    if (n > idx && checkN < EMBED_CHKS.length) {
      const t = setTimeout(() => setCheckN(c => c + 1), 550);
      return () => clearTimeout(t);
    }
  }, [n, checkN]);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [n, checkN]);

  const visible = EMBED_STEPS.slice(0, n);
  const showTyping = chatOpen && n < EMBED_STEPS.length && EMBED_STEPS[n]?.who === "meera";

  return (
    <div style={{height:"100%", minHeight:520, display:"grid", gridTemplateColumns:"144px 1fr", position:"relative"}}>
      <div style={{background:"#1C3349", color:"#cdd8e0", padding:"16px 13px"}}>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:20}}>
          <span style={{width:26, height:26, borderRadius:7, background:"#34506b", display:"grid", placeItems:"center", fontWeight:800, fontSize:13, color:"#fff"}}>N</span>
          <span style={{fontWeight:700, fontSize:13, color:"#fff"}}>Northvale</span>
        </div>
        {[["Dashboard",false],["Registration",false],["Financials",true],["Records",false],["Help",false]].map(([t,a]) => (
          <div key={t} style={{padding:"8px 10px", borderRadius:8, fontSize:12.5, marginBottom:3,
            fontWeight:a?700:500, background:a?"#28425b":"transparent", color:a?"#fff":"#9fb0bd"}}>{t}</div>
        ))}
      </div>
      <div style={{padding:"28px 36px", background:"#FCFAF6", position:"relative"}}>
        <div className="mono" style={{fontSize:10.5, letterSpacing:".08em", color:"var(--muted)", marginBottom:8}}>FINANCIALS &amp; HOLDS</div>
        <h3 style={{fontSize:22, marginBottom:18}}>Your Account</h3>
        <div className="card" style={{padding:"16px 18px", maxWidth:400, marginBottom:22}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
            <span style={{fontWeight:700, fontSize:15}}>Outstanding Balance</span>
            <span style={{fontWeight:800, fontSize:18, color:"#C0532F"}}>$310.00</span>
          </div>
          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <span className="pill" style={{background:"#FBE7E0", borderColor:"#F3D2C6", color:"#C0532F", fontSize:11.5}}>Financial hold</span>
            <span style={{fontSize:12.5, color:"var(--muted)"}}>blocks registration</span>
          </div>
        </div>
        <div style={{background:"var(--teal-050)", border:"1px solid var(--teal-100)", borderRadius:12, padding:"12px 16px", maxWidth:400, display:"flex", gap:11}}>
          <MeerkatMark size={26} />
          <div>
            <div style={{fontWeight:700, fontSize:13, marginBottom:4}}>Add Meera to any site in one line</div>
            <code style={{fontSize:10.5, color:"var(--teal-700)", fontFamily:"'DM Mono',monospace", display:"block", marginBottom:4}}>
              {'<script src="meera.js" data-key="northvale">'}
            </code>
            <div style={{fontSize:12, color:"var(--ink-2)"}}>It wears your brand — students never leave your portal.</div>
          </div>
        </div>

        {/* Launcher */}
        {!chatOpen && (
          <button onClick={() => setChatOpen(true)} style={{
            position:"absolute", bottom:20, right:20, width:52, height:52, borderRadius:"50%",
            background:"var(--teal)", color:"#fff", border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 4px 16px rgba(46,156,142,.4)", zIndex:10, transition:"transform .15s",
          }}><Icon name="chat" size={22} /></button>
        )}
        {/* Chat panel */}
        {chatOpen && (
          <div style={{
            position:"absolute", bottom:16, right:16, width:300,
            boxShadow:"var(--sh-lg)", borderRadius:"var(--r-lg)",
            border:"1px solid var(--teal-100)", overflow:"hidden", zIndex:10,
            background:"#fff", animation:"fadeUp .25s ease",
          }}>
            <div style={{background:"var(--teal)", padding:"12px 14px", display:"flex", alignItems:"center", gap:10}}>
              <span style={{width:30, height:30, borderRadius:"50%", overflow:"hidden", background:"#FBEADD", border:"1.5px solid rgba(255,255,255,.3)", display:"grid", placeItems:"center", flexShrink:0}}>
                <img src="assets/meera-avatar.png" style={{width:"150%"}} alt="" />
              </span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700, fontSize:13.5, color:"#fff"}}>Meera</div>
                <div className="mono" style={{fontSize:9.5, color:"rgba(255,255,255,.7)"}}>powered by Northvale</div>
              </div>
              <button onClick={() => setChatOpen(false)} style={{background:"none", border:"none", color:"rgba(255,255,255,.7)", cursor:"pointer", fontSize:17, lineHeight:1, padding:0}}>✕</button>
            </div>
            <div ref={scrollRef} style={{height:224, overflowY:"auto", padding:"11px 12px", background:"#FCFAF6", display:"flex", flexDirection:"column", gap:8}}>
              {visible.map((m, i) => {
                if (m.who === "meera") return <EmbedBubble key={i} side="left">{m.t}</EmbedBubble>;
                if (m.who === "user")  return <EmbedBubble key={i} side="right">{m.t}</EmbedBubble>;
                if (m.who === "echks") return (
                  <div key={i} className="card" style={{padding:"9px 11px"}}>
                    <div className="mono" style={{fontSize:9, letterSpacing:".1em", color:"var(--muted)", marginBottom:6, display:"flex", alignItems:"center", gap:4}}>
                      <Icon name="sparkle" size={10} style={{color:"var(--teal)"}} /> CHECKING ACCOUNT
                    </div>
                    {EMBED_CHKS.map((c, j) => (
                      <div key={j} style={{display:"flex", alignItems:"center", gap:6, fontSize:11.5, marginBottom:4, opacity:j<checkN?1:.3, transition:"opacity .3s"}}>
                        <span style={{width:14, height:14, borderRadius:99, background:c.ok?"var(--green-050)":"#FBE7E0", color:c.ok?"var(--green)":"var(--rose)", display:"grid", placeItems:"center", flexShrink:0}}>
                          {j < checkN && <Icon name={c.ok?"check":"alert"} size={8} sw={2.5} />}
                        </span>
                        {c.t}
                        {j < checkN && c.note && <span className="mono" style={{marginLeft:"auto", fontSize:9, color:"var(--rose)", background:"#FBE7E0", padding:"1px 5px", borderRadius:99}}>{c.note}</span>}
                      </div>
                    ))}
                  </div>
                );
                if (m.who === "eticket") return (
                  <div key={i} className="card" style={{padding:"9px 11px", borderColor:"var(--teal-100)", animation:"fadeUp .35s ease"}}>
                    <div style={{display:"flex", alignItems:"center", gap:7, marginBottom:4}}>
                      <IconChip name="ticket" tint="sand" size={24} isize={12} />
                      <div>
                        <div style={{fontWeight:700, fontSize:11.5}}>Ticket #NV-4827 created</div>
                        <div className="mono" style={{fontSize:9, color:"var(--muted)"}}>Bursar's Office · just now</div>
                      </div>
                    </div>
                    <div style={{fontSize:11, color:"var(--ink-2)", lineHeight:1.5}}>You'll hear back by email — usually within a few hours.</div>
                  </div>
                );
                return null;
              })}
              {showTyping && <Typing />}
            </div>
            <div style={{padding:"8px 10px", borderTop:"1px solid var(--line)", display:"flex", gap:7}}>
              <input placeholder="Type a message…" style={{flex:1, padding:"7px 10px", borderRadius:8, border:"1px solid var(--line-2)", fontSize:12.5, fontFamily:"inherit", outline:"none"}} />
              <button className="btn btn-primary" style={{padding:"6px 10px", borderRadius:8, flexShrink:0}}>
                <Icon name="arrow" size={13} sw={2.2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 4c. Screenshare / Meeror with side rail ── */
const SS_STEPS = [
  { key:"term",   title:"Choose your enrollment term",    body:"Open this dropdown and pick the term you're registering for.", conf:99 },
  { key:"file",   title:"Upload your transcript",         body:"Click here and attach your transcript as a PDF — that's the missing piece.", conf:95 },
  { key:"agree",  title:"Accept the registration terms",  body:"Tick this box — Submit stays locked until you do.", conf:98 },
  { key:"submit", title:"Submit your request",            body:"You're all set — hit Submit to finish your registration.", conf:97 },
];

function StudentScreenshare() {
  const [step, setStep] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);
  const wrapRef = React.useRef(null);
  const refs = { term:React.useRef(), file:React.useRef(), agree:React.useRef(), submit:React.useRef() };
  const [spot, setSpot] = React.useState(null);
  const [pop, setPop]   = React.useState(null);
  const measureRef = React.useRef(() => {});

  measureRef.current = () => {
    const wrap = wrapRef.current; if (!wrap) return;
    const cur = SS_STEPS[step];
    const el = refs[cur.key].current; if (!el) return;
    const wr = wrap.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.width < 4) return;
    const pad = 8;
    const s = { top:r.top-wr.top-pad, left:r.left-wr.left-pad, w:r.width+pad*2, h:r.height+pad*2 };
    setSpot(s);
    const popW = 236, popH = 190, gap = 14;
    let left = s.left + s.w + gap;
    let top  = s.top - 4;
    if (left + popW > wr.width - 8) left = Math.max(8, s.left - popW - gap);
    left = Math.max(8, left);
    top  = Math.max(8, Math.min(top, wr.height - popH - 8));
    setPop({ top, left });
  };

  const remeasure = () => requestAnimationFrame(() => measureRef.current());
  React.useLayoutEffect(() => { measureRef.current(); }, [step]);
  React.useEffect(() => {
    const ro = new ResizeObserver(remeasure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", remeasure);
    return () => { ro.disconnect(); window.removeEventListener("resize", remeasure); };
  }, []);
  React.useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setStep(s => (s + 1) % SS_STEPS.length), 2800);
    return () => clearTimeout(t);
  }, [step, playing]);

  const cur = SS_STEPS[step];
  const done = (k) => SS_STEPS.findIndex(s => s.key === k) < step;
  const fBase = { borderRadius:10, border:"1.5px solid var(--line-2)", background:"#fff",
    padding:"11px 13px", fontSize:13.5, color:"var(--ink-2)", display:"flex", alignItems:"center", justifyContent:"space-between" };
  const sideItems = [
    { label:"Enrollment term",   status: step > 0 ? "done" : "pending" },
    { label:"Transcript upload",  status: step > 1 ? "done" : "pending" },
    { label:"Terms accepted",     status: step > 2 ? "done" : "pending" },
    { label:"Ready to submit",    status: step > 3 ? "done" : step === 3 ? "ready" : "locked" },
  ];

  return (
    <div style={{display:"grid", gridTemplateColumns:"1fr 256px", height:"100%", minHeight:480}}>
      {/* Portal + Meeror overlay */}
      <div style={{overflow:"hidden", position:"relative"}}>
        <div ref={wrapRef} style={{position:"relative", background:"#FCFAF6", height:"100%", minHeight:400}}>
          <div style={{display:"grid", gridTemplateColumns:"144px 1fr", height:"100%"}}>
            <div style={{background:"#1C3349", color:"#cdd8e0", padding:"16px 13px"}}>
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:18}}>
                <span style={{width:24, height:24, borderRadius:7, background:"#34506b", display:"grid", placeItems:"center", fontWeight:800, fontSize:12, color:"#fff"}}>N</span>
                <span style={{fontWeight:700, fontSize:13, color:"#fff"}}>Northvale</span>
              </div>
              {[["Dashboard",false],["Registration",true],["Financials",false],["Records",false],["Help",false]].map(([t,a]) => (
                <div key={t} style={{padding:"8px 10px", borderRadius:8, fontSize:12.5, marginBottom:3,
                  fontWeight:a?700:500, background:a?"#28425b":"transparent", color:a?"#fff":"#9fb0bd"}}>{t}</div>
              ))}
            </div>
            <div style={{padding:"20px 22px"}}>
              <div className="mono" style={{fontSize:11, letterSpacing:".06em", color:"var(--muted)", marginBottom:3}}>FALL 2026 · COURSE REGISTRATION</div>
              <h4 style={{fontSize:18, marginBottom:14}}>Submit your registration request</h4>
              <div style={{display:"grid", gap:11, maxWidth:244}}>
                <div ref={refs.term} style={fBase}>
                  <span style={{color:done("term")?"var(--ink)":"var(--muted)", fontWeight:done("term")?600:500}}>{done("term")?"Fall 2026 — Full-time":"Select enrollment term"}</span>
                  {done("term") ? <Icon name="check" size={16} style={{color:"var(--green)"}} /> : <Icon name="chevronD" size={15} style={{color:"var(--muted)"}} />}
                </div>
                <div ref={refs.file} style={{...fBase, borderStyle:done("file")?"solid":"dashed", background:done("file")?"#fff":"#FBF6EE"}}>
                  <span style={{display:"flex", alignItems:"center", gap:8, color:done("file")?"var(--ink)":"var(--muted)", fontWeight:done("file")?600:500}}>
                    <Icon name="doc" size={15} /> {done("file")?"transcript_2026.pdf":"Upload transcript (PDF)"}
                  </span>
                  {done("file") && <Icon name="check" size={16} style={{color:"var(--green)"}} />}
                </div>
                <label ref={refs.agree} style={{display:"flex", alignItems:"center", gap:10, padding:"4px 2px", fontSize:13, color:"var(--ink-2)"}}>
                  <span style={{width:19, height:19, borderRadius:6,
                    background:done("agree")?"var(--teal)":"#fff",
                    border:`1.5px solid ${done("agree")?"var(--teal)":"var(--line-2)"}`,
                    display:"grid", placeItems:"center", color:"#fff", transition:"all .2s", flexShrink:0}}>
                    {done("agree") && <Icon name="check" size={13} sw={2.4} />}
                  </span>
                  I accept the registration terms &amp; academic policies
                </label>
                <button ref={refs.submit} className="btn" style={{
                  marginTop:4, justifyContent:"center",
                  background:done("agree")?"var(--teal)":"#E4DCCD",
                  color:done("agree")?"#fff":"#A99",
                  boxShadow:"none", padding:"12px 20px"}}>
                  Submit Request
                </button>
              </div>
            </div>
          </div>
          {/* Spotlight */}
          {spot && (
            <div style={{position:"absolute", top:spot.top, left:spot.left, width:spot.w, height:spot.h,
              borderRadius:12, boxShadow:"0 0 0 9999px rgba(22,41,59,.44)", pointerEvents:"none",
              transition:"all .5s cubic-bezier(.4,.8,.2,1)", zIndex:5}}>
              <span style={{position:"absolute", inset:-3, borderRadius:14, border:"2.5px solid var(--teal)"}} />
              <span style={{position:"absolute", inset:-3, borderRadius:14, border:"2.5px solid var(--teal)",
                animation:"pulse-ring 1.8s ease-out infinite"}} />
            </div>
          )}
          {/* Popup */}
          {pop && (
            <div style={{position:"absolute", top:pop.top, left:pop.left, width:236, zIndex:8, transition:"all .5s cubic-bezier(.4,.8,.2,1)"}}>
              <div className="card" style={{padding:0, boxShadow:"var(--sh-lg)", border:"1px solid var(--teal-100)", overflow:"hidden"}}>
                <div style={{display:"flex", alignItems:"center", gap:8, padding:"10px 12px 8px"}}>
                  <span style={{width:28, height:28, borderRadius:"50%", overflow:"hidden", background:"#FBEADD", flexShrink:0, border:"1.5px solid #EBC9A8", display:"grid", placeItems:"center"}}>
                    <img src="assets/meera-avatar.png" style={{width:"150%"}} alt="" />
                  </span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700, fontSize:13}}>Meera</div>
                    <div className="mono" style={{fontSize:10, color:"var(--muted)"}}>step {step+1} / {SS_STEPS.length}</div>
                  </div>
                  <span className="mono" style={{fontSize:10, color:"var(--teal-700)", background:"var(--teal-050)", padding:"2px 7px", borderRadius:99}}>{cur.conf}%</span>
                </div>
                <div style={{padding:"0 12px 10px"}}>
                  <div style={{fontWeight:700, fontSize:14, marginBottom:3}}>{cur.title}</div>
                  <p style={{fontSize:12.5, color:"var(--ink-2)", lineHeight:1.5, margin:0}}>{cur.body}</p>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:7, padding:"8px 12px", borderTop:"1px solid var(--line)", background:"#FCFAF6"}}>
                  <div style={{display:"flex", gap:4, flex:1}}>
                    {SS_STEPS.map((_,i) => (
                      <span key={i} style={{height:4, borderRadius:99, width:i===step?16:4,
                        background:i===step?"var(--teal)":i<step?"var(--teal-100)":"var(--line-2)", transition:"all .3s"}} />
                    ))}
                  </div>
                  <button onClick={() => { setStep(s => (s+1) % SS_STEPS.length); setPlaying(false); }}
                    className="btn btn-primary btn-sm" style={{padding:"6px 11px", fontSize:12}}>
                    Next <Icon name="arrow" size={13} sw={2.2} />
                  </button>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:5, padding:"8px 11px", borderTop:"1px solid var(--line)", background:"#F6EFE3"}}>
                  <button style={ssTrayBtnSt}><Icon name="chat" size={13} /> Chat</button>
                  <button style={ssTrayBtnSt}><Icon name="headset" size={13} /> Human</button>
                  <span style={{flex:1}} />
                  <span className="mono" style={{fontSize:10, color:"var(--green)", display:"inline-flex", alignItems:"center", gap:4}}>
                    <Icon name="shield" size={11} sw={2} /> this tab only
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Side rail */}
      <div style={{borderLeft:"1px solid var(--line)", background:"#fff", padding:"18px 16px", display:"flex", flexDirection:"column", gap:16, overflowY:"auto"}}>
        <div>
          <div className="mono" style={{fontSize:10, letterSpacing:".12em", color:"var(--muted)", marginBottom:12}}>WHAT MEERA SEES</div>
          <div style={{display:"grid", gap:7}}>
            {sideItems.map((item, i) => (
              <div key={i} style={{display:"flex", alignItems:"center", gap:9, padding:"8px 10px", borderRadius:9,
                background:item.status==="done"?"var(--green-050)":item.status==="ready"?"var(--teal-050)":"#F8F5F0",
                transition:"all .4s"}}>
                <span style={{width:16, height:16, borderRadius:99, flexShrink:0,
                  background:item.status==="done"?"var(--green)":item.status==="ready"?"var(--teal)":"var(--line-2)",
                  display:"grid", placeItems:"center", transition:"background .4s"}}>
                  {item.status==="done"  && <Icon name="check" size={9} sw={2.5} style={{color:"#fff"}} />}
                  {item.status==="locked" && <Icon name="lock"  size={9} sw={2}   style={{color:"#fff"}} />}
                </span>
                <span style={{fontSize:12.5, fontWeight:600, color:item.status==="done"?"var(--teal-700)":"var(--ink-2)"}}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{height:1, background:"var(--line)"}} />
        <div>
          <div className="mono" style={{fontSize:10, letterSpacing:".12em", color:"var(--muted)", marginBottom:10}}>DETECTED BLOCKERS</div>
          {step < SS_STEPS.length ? (
            <div style={{display:"flex", gap:8, padding:"9px 12px", borderRadius:10, background:"#FBE7E0", border:"1px solid #F3D2C6"}}>
              <Icon name="alert" size={15} style={{color:"#C0532F", flexShrink:0}} />
              <div>
                <div style={{fontWeight:700, fontSize:12.5, color:"#A8431F"}}>Incomplete form</div>
                <div style={{fontSize:11.5, color:"#8A4A33"}}>{SS_STEPS.length - step} step{SS_STEPS.length - step !== 1 ? "s" : ""} remaining</div>
              </div>
            </div>
          ) : (
            <div style={{display:"flex", gap:8, padding:"9px 12px", borderRadius:10, background:"var(--green-050)", border:"1px solid #C9E8B3"}}>
              <Icon name="check" size={15} style={{color:"var(--green)", flexShrink:0}} />
              <div style={{fontWeight:700, fontSize:12.5, color:"var(--green)"}}>All clear!</div>
            </div>
          )}
        </div>
        <div style={{height:1, background:"var(--line)"}} />
        <div>
          <div className="mono" style={{fontSize:10, letterSpacing:".12em", color:"var(--muted)", marginBottom:10}}>CONFIDENCE</div>
          <Confidence value={cur.conf} label={`Step ${step+1}`} />
        </div>
        <div style={{marginTop:"auto", padding:"10px 0 2px"}}>
          <button onClick={() => setPlaying(p => !p)} className="btn btn-ghost btn-sm" style={{width:"100%", justifyContent:"center", fontSize:12}}>
            <Icon name={playing?"clock":"play"} size={13} /> {playing ? "Auto-guiding" : "Resume"}
          </button>
        </div>
      </div>
    </div>
  );
}

const ssTrayBtnSt = {
  display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:600,
  color:"var(--ink-2)", padding:"4px 9px", borderRadius:7,
  background:"#fff", border:"1px solid var(--line)", cursor:"pointer", fontFamily:"inherit",
};

Object.assign(window, { StudentMeeraSite, StudentEmbedded, StudentScreenshare });
