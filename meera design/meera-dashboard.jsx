/* ===== Meera Lookout — admin intelligence dashboard preview ===== */

const TICKETS = [
  { id:"NV-4827", title:"Registration blocked by financial hold", dept:"Bursar’s Office", urgency:"High",
    summary:"Student can’t submit Fall 2026 registration — Submit is disabled by an active financial hold ($310). Transcript & term valid.",
    solution:"Clear the hold, then auto-notify the student to re-submit. Meera can re-open the guided flow once cleared.",
    cross:{from:"Registrar", to:"Bursar’s Office", note:"Registration deadlines depend on holds being cleared 48h prior."},
    conf:97, tag:"Holds" },
  { id:"NV-4826", title:"VPN fails on managed laptops after update", dept:"IT — Network", urgency:"High",
    summary:"23 students report VPN disconnects right after the 14.2 client update. Pattern points to a config push, not user error.",
    solution:"Roll back VPN client to 14.1 for affected fleet; push corrected profile. Draft comms ready for review.",
    cross:{from:"IT — Network", to:"Endpoint Mgmt", note:"Rollback needs MDM profile change — Endpoint owns that policy."},
    conf:92, tag:"Network" },
  { id:"NV-4825", title:"Can’t reset password — email never arrives", dept:"IT — Identity", urgency:"Medium",
    summary:"Reset emails to @alumni addresses are bouncing. Likely a mail-relay rule, not the reset service itself.",
    solution:"Whitelist alumni relay; resend reset. KB article recommended (see suggestions).",
    cross:null, conf:95, tag:"Accounts" },
  { id:"NV-4824", title:"Financial aid form rejects valid SSN", dept:"Student Services", urgency:"Low",
    summary:"Form validation rejects SSNs with leading zeros. Affects ~5 submissions/day.",
    solution:"Patch validation regex; meanwhile Meera guides students to the alt PDF route.",
    cross:null, conf:89, tag:"Forms" },
];
const RECURRING = [
  { t:"Financial holds", n:38, trend:"+14%", tint:"sand" },
  { t:"VPN / network", n:27, trend:"+9%", tint:"teal" },
  { t:"Password resets", n:21, trend:"−6%", tint:"green", down:true },
];
const KB_SUGGEST = [
  { t:"How to clear a financial hold before registration", reason:"asked 38× this week", status:"new" },
  { t:"Fixing VPN drops after the 14.2 update", reason:"trending — draft from 23 tickets", status:"draft" },
];

function DashboardPreview(){
  const [sel, setSel] = useState(0);
  const t = TICKETS[sel];
  const uColor = u => u==="High" ? ["#FBE7E0","#C0532F","#F3D2C6"] : u==="Medium" ? ["#F7EBD3","#A9781F","#EEDCB4"] : ["#EAEFF3","#5A6B7B","#DDE4EA"];

  return (
    <div className="card" style={{padding:0,overflow:"hidden",boxShadow:"var(--sh-lg)",maxWidth:1060,margin:"0 auto"}}>
      {/* app top bar */}
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",borderBottom:"1px solid var(--line)",background:"#fff"}}>
        <span style={{display:"flex",gap:6}}>{["#E7836B","#EBC15C","#7FB85C"].map(c=><span key={c} style={{width:11,height:11,borderRadius:99,background:c}}/>)}</span>
        <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:6}}>
          <span style={{width:24,height:24,borderRadius:7,background:"var(--teal-050)",display:"grid",placeItems:"center",color:"var(--teal-700)"}}><Icon name="eye" size={15} sw={2}/></span>
          <span style={{fontWeight:800,fontSize:15,letterSpacing:"-.02em"}}>Meera Lookout</span>
          <span className="mono" style={{fontSize:10.5,color:"var(--muted)",background:"#F3ECE0",padding:"2px 8px",borderRadius:99,marginLeft:4}}>admin</span>
        </div>
        <span style={{flex:1}}/>
        <span className="mono" style={{fontSize:11,color:"var(--muted)",display:"flex",alignItems:"center",gap:6}}>
          <span style={{width:7,height:7,borderRadius:99,background:"var(--teal)"}}/> 12 open · 4 need review
        </span>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"168px 300px 1fr",minHeight:520}}>
        {/* rail */}
        <div style={{borderRight:"1px solid var(--line)",padding:"16px 12px",background:"#FCFAF6"}}>
          {[["inbox","Inbox","12"],["trend","Insights",""],["book","Knowledge",""],["route","Routing",""],["users","Team",""]].map(([ic,lb,c],i)=>(
            <div key={lb} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 11px",borderRadius:9,marginBottom:3,
              fontSize:13,fontWeight:i===0?700:600,color:i===0?"var(--teal-700)":"var(--ink-2)",background:i===0?"var(--teal-050)":"transparent"}}>
              <Icon name={ic} size={17}/> <span style={{flex:1}}>{lb}</span>
              {c && <span className="mono" style={{fontSize:10.5,background:"#fff",border:"1px solid var(--line)",padding:"1px 7px",borderRadius:99}}>{c}</span>}
            </div>
          ))}
          <div style={{margin:"14px 0",height:1,background:"var(--line)"}}/>
          <div className="mono" style={{fontSize:9.5,letterSpacing:".1em",color:"var(--muted)",padding:"0 11px 8px"}}>RESOLVED BY MEERA</div>
          <div style={{padding:"0 11px"}}>
            <div style={{fontSize:28,fontWeight:800,letterSpacing:"-.03em",color:"var(--ink)"}}>71%</div>
            <div style={{fontSize:11.5,color:"var(--muted)"}}>without a human this week</div>
          </div>
        </div>

        {/* queue */}
        <div style={{borderRight:"1px solid var(--line)",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"13px 15px 9px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontWeight:700,fontSize:14}}>Ticket queue</span>
            <span className="mono" style={{fontSize:11,color:"var(--muted)"}}>sorted by urgency</span>
          </div>
          <div style={{overflowY:"auto",flex:1}}>
            {TICKETS.map((tk,i)=>{
              const [bg,fg,bd]=uColor(tk.urgency); const active=i===sel;
              return (
                <button key={tk.id} onClick={()=>setSel(i)} style={{display:"block",width:"100%",textAlign:"left",
                  padding:"12px 15px",borderBottom:"1px solid var(--line)",background:active?"var(--teal-050)":"transparent",
                  borderLeft:active?"3px solid var(--teal)":"3px solid transparent",transition:"background .15s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span className="mono" style={{fontSize:10.5,color:"var(--muted)"}}>#{tk.id}</span>
                    <span style={{marginLeft:"auto",fontSize:10.5,fontWeight:700,background:bg,color:fg,border:`1px solid ${bd}`,padding:"2px 8px",borderRadius:99}}>{tk.urgency}</span>
                  </div>
                  <div style={{fontSize:13.5,fontWeight:600,color:"var(--ink)",lineHeight:1.35,marginBottom:5}}>{tk.title}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span className="mono" style={{fontSize:10.5,color:"var(--teal-700)",background:"#fff",border:"1px solid var(--line)",padding:"1px 7px",borderRadius:99,display:"inline-flex",alignItems:"center",gap:4}}>
                      <Icon name="sparkle" size={10} sw={2}/> {tk.tag}
                    </span>
                    <span className="mono" style={{fontSize:10.5,color:"var(--muted)"}}>{tk.dept}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* detail */}
        <div style={{padding:"18px 20px",overflowY:"auto",background:"#FCFAF6"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:14}}>
            <IconChip name="ticket" tint="sand" size={42} isize={20}/>
            <div style={{flex:1}}>
              <h4 style={{fontSize:18,lineHeight:1.2,marginBottom:4}}>{t.title}</h4>
              <div className="mono" style={{fontSize:11,color:"var(--muted)"}}>#{t.id} · routed to {t.dept}</div>
            </div>
            <Confidence value={t.conf} label="AI confidence"/>
          </div>

          <DBlock icon="sparkle" tint="teal" label="AI-GENERATED SUMMARY">{t.summary}</DBlock>
          <DBlock icon="wand" tint="gold" label="SUGGESTED SOLUTION">
            <div style={{marginBottom:11}}>{t.solution}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <span className="btn btn-primary btn-sm" style={{padding:"7px 14px",fontSize:12.5}}><Icon name="check" size={14} sw={2.2}/> Approve &amp; send</span>
              <span className="btn btn-ghost btn-sm" style={{padding:"7px 14px",fontSize:12.5}}>Edit</span>
              <span className="btn btn-ghost btn-sm" style={{padding:"7px 14px",fontSize:12.5}}><Icon name="flag" size={13}/> Escalate</span>
            </div>
          </DBlock>

          {t.cross && (
            <div style={{display:"flex",gap:11,padding:"13px 15px",borderRadius:14,background:"#FBE7E0",border:"1px solid #F3D2C6",marginBottom:12}}>
              <Icon name="alert" size={19} style={{color:"#C0532F",flexShrink:0,marginTop:1}}/>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:"#A8431F",marginBottom:3}}>Cross-department dependency</div>
                <div style={{fontSize:12.5,color:"#8A4A33",lineHeight:1.5}}>
                  <strong>{t.cross.from} → {t.cross.to}.</strong> {t.cross.note}
                </div>
              </div>
            </div>
          )}

          {/* recurring + KB */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="card" style={{padding:"13px 15px",boxShadow:"none"}}>
              <div className="mono" style={{fontSize:10,letterSpacing:".1em",color:"var(--muted)",marginBottom:10,display:"flex",alignItems:"center",gap:6}}><Icon name="trend" size={13}/> RECURRING ISSUES</div>
              <div style={{display:"grid",gap:9}}>
                {RECURRING.map(r=>(
                  <div key={r.t} style={{display:"flex",alignItems:"center",gap:9}}>
                    <span style={{width:8,height:8,borderRadius:99,background:`var(--${r.tint})`}}/>
                    <span style={{fontSize:12.5,fontWeight:600,flex:1}}>{r.t}</span>
                    <span className="mono tnum" style={{fontSize:12,color:"var(--ink)"}}>{r.n}</span>
                    <span className="mono" style={{fontSize:10.5,fontWeight:600,color:r.down?"var(--green)":"var(--rose)",width:42,textAlign:"right"}}>{r.trend}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{padding:"13px 15px",boxShadow:"none"}}>
              <div className="mono" style={{fontSize:10,letterSpacing:".1em",color:"var(--muted)",marginBottom:10,display:"flex",alignItems:"center",gap:6}}><Icon name="book" size={13}/> KB SUGGESTIONS</div>
              <div style={{display:"grid",gap:9}}>
                {KB_SUGGEST.map(k=>(
                  <div key={k.t} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <span style={{marginTop:2,color:"var(--teal)"}}><Icon name="sparkle" size={13} sw={2}/></span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12.5,fontWeight:600,lineHeight:1.35}}>{k.t}</div>
                      <div className="mono" style={{fontSize:10.5,color:"var(--muted)"}}>{k.reason}</div>
                    </div>
                    <span className="mono" style={{fontSize:9.5,fontWeight:600,padding:"2px 7px",borderRadius:99,
                      background:k.status==="new"?"var(--teal-050)":"var(--gold-050)",color:k.status==="new"?"var(--teal-700)":"#A9781F"}}>{k.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DBlock({icon,tint,label,children}){
  return (
    <div style={{marginBottom:12}}>
      <div className="mono" style={{fontSize:10,letterSpacing:".1em",color:"var(--muted)",marginBottom:6,display:"flex",alignItems:"center",gap:7}}>
        <Icon name={icon} size={13} style={{color:`var(--${tint==="gold"?"gold":tint})`}}/> {label}
      </div>
      <div style={{fontSize:13.5,color:"var(--ink-2)",lineHeight:1.55}}>{children}</div>
    </div>
  );
}

Object.assign(window, { DashboardPreview });
