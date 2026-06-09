/* ===== Meera Demo Admin Views: Lookout (5 depts) + Cross-dept workflow ===== */

const DEPT_DATA = {
  it: {
    label:"IT — Help Desk", resolved:"68%",
    tickets:[
      { id:"NV-4826", title:"VPN fails on managed laptops after update", dept:"IT — Network", urgency:"High", tag:"Network",
        summary:"23 students report VPN disconnects immediately after the 14.2 client push. Pattern indicates a misconfigured MDM profile, not user error.",
        solution:"Roll back VPN client to 14.1 for affected fleet and push corrected MDM profile. Draft comms ready for review.",
        cross:{from:"IT — Network", to:"Endpoint Mgmt", note:"Rollback requires MDM profile change — Endpoint Mgmt owns that policy."},
        conf:92, steps:["Confirmed 14.2 was pushed 4 h ago","Correlated timeline with 23 support tickets","Identified affected device ID list"] },
      { id:"NV-4825", title:"Password reset emails not arriving for alumni", dept:"IT — Identity", urgency:"Medium", tag:"Accounts",
        summary:"Reset emails to @alumni addresses are bouncing. Likely a mail-relay allow-list issue, not the reset service itself.",
        solution:"Whitelist alumni relay domain; resend resets for 14 affected users. KB article ready.",
        cross:null, conf:95, steps:["Verified reset service logs — no failures","Traced bounces to relay filter","14 @alumni addresses identified"] },
      { id:"NV-4824", title:"Floor-3 print queue stuck — jobs lost", dept:"IT — Print", urgency:"Low", tag:"Hardware",
        summary:"Print queue on PRT-3B has 47 stuck jobs. Network spool service hung — requires remote restart.",
        solution:"Remote-restart spooler on PRT-3B; re-queue 12 jobs sent in the last 60 min.",
        cross:null, conf:97, steps:["Identified stuck queue remotely","47 jobs held since 09:14","Spooler not responding to ping"] },
    ],
    recurring:[{t:"VPN / network drops",n:27,trend:"+9%",tint:"teal"},{t:"Password resets",n:21,trend:"−6%",tint:"green",down:true},{t:"Printer issues",n:14,trend:"+3%",tint:"sand"}],
    kb:[{t:"Fix VPN drops after 14.2 update",reason:"trending — 23 tickets this week",status:"draft"},{t:"Alumni email relay troubleshooting",reason:"asked 14× this month",status:"new"}],
  },
  registrar: {
    label:"Registrar", resolved:"74%",
    tickets:[
      { id:"NV-4831", title:"Financial hold blocks course registration", dept:"Registrar", urgency:"High", tag:"Holds",
        summary:"Student can't submit Fall 2026 registration; Submit is disabled by an active $310 financial hold. Transcript and term valid.",
        solution:"Coordinate with Bursar to clear hold; Meera will re-notify student and re-enable the submission flow.",
        cross:{from:"Registrar", to:"Bursar's Office", note:"Registrar can't re-enable registration until Finance clears the hold first."},
        conf:97, steps:["Confirmed Submit button locked","Identified $310 hold on account","Transcript and term selection valid"] },
      { id:"NV-4830", title:"Enrollment term shows wrong year in portal", dept:"Registrar", urgency:"Medium", tag:"Data",
        summary:"Portal showing 2025 enrollment term for 38 students who enrolled for 2026. Likely a batch sync error from last night's run.",
        solution:"Re-run the Fall 2026 enrollment sync for the affected cohort. ETA: 2 hours.",
        cross:null, conf:89, steps:["38 students affected","Last sync ran at 02:14 — incomplete","Re-sync estimated 2 h"] },
      { id:"NV-4829", title:"Transcript requests stuck at 'Processing' 48h+", dept:"Registrar", urgency:"Low", tag:"Records",
        summary:"6 transcript requests have been in 'Processing' for over 48h. Manual review flag triggered but not actioned.",
        solution:"Action the manual review flags; release 6 stuck requests.",
        cross:null, conf:91, steps:["6 requests >48h in processing","Manual flag raised but unreviewed","No technical blocker"] },
    ],
    recurring:[{t:"Financial holds",n:38,trend:"+14%",tint:"sand"},{t:"Enrollment data errors",n:12,trend:"+3%",tint:"teal"},{t:"Transcript delays",n:9,trend:"−4%",tint:"green",down:true}],
    kb:[{t:"How to clear a financial hold before registration",reason:"asked 38× this week",status:"new"},{t:"Enrollment sync error FAQ",reason:"12 tickets from data error",status:"draft"}],
  },
  finance: {
    label:"Finance / Bursar", resolved:"63%",
    tickets:[
      { id:"NV-4827", title:"$310 hold blocking course registration", dept:"Bursar's Office", urgency:"High", tag:"Holds",
        summary:"Student cannot submit Fall 2026 registration due to active $310 balance. Account otherwise in good standing — one missed installment.",
        solution:"Waive or collect the $310 balance; confirm with Registrar to re-enable registration. Meera will re-notify student.",
        cross:{from:"Bursar's Office", to:"Registrar", note:"Registration re-enable depends on hold clearance. Deadline: tomorrow 5 pm."},
        conf:97, steps:["Confirmed $310 balance on account","Hold auto-applied at 48h overdue","Registration deadline is tomorrow at 5 pm"] },
      { id:"NV-4833", title:"Financial aid disbursement 3 days late — 14 students", dept:"Bursar's Office", urgency:"High", tag:"Aid",
        summary:"Aid disbursement for 14 students delayed due to missing certification from Financial Aid office. Students may receive service holds.",
        solution:"Expedite missing certifications with Financial Aid; release disbursements for 14 students.",
        cross:{from:"Bursar's Office", to:"Financial Aid", note:"Certifications must come from FA before Bursar can disburse."},
        conf:88, steps:["14 disbursements pending since Monday","Missing certification from FA office","3 students at risk of service holds today"] },
      { id:"NV-4834", title:"Tuition refund not processed after withdrawal", dept:"Bursar's Office", urgency:"Low", tag:"Refunds",
        summary:"Student withdrew on Day 2 (within full-refund window) but refund not issued after 5 business days.",
        solution:"Process refund manually; confirm bank details on file. Standard processing: 3–5 days once initiated.",
        cross:null, conf:94, steps:["Withdrawal confirmed Day 2","Within full-refund window","Refund not initiated — missed in queue"] },
    ],
    recurring:[{t:"Financial holds",n:38,trend:"+14%",tint:"sand"},{t:"Aid disbursements",n:14,trend:"+22%",tint:"rose"},{t:"Refund requests",n:8,trend:"−2%",tint:"green",down:true}],
    kb:[{t:"Financial hold clearance process",reason:"asked 38× — recurring peak",status:"new"},{t:"Aid disbursement certification guide",reason:"14 cases this week",status:"draft"}],
  },
  health: {
    label:"Health Services", resolved:"81%",
    tickets:[
      { id:"NV-4840", title:"MyHealth appointment booking returning 504 errors", dept:"Health Services", urgency:"High", tag:"Portal",
        summary:"Student Health portal returning 504 errors for ~40% of users. Pattern matches a load spike — likely semester-start surge.",
        solution:"Scale up MyHealth web tier for semester-start load. Interim: direct students to phone booking at x4400.",
        cross:null, conf:93, steps:["504 errors started at 08:40","~40% of booking attempts failing","Phone line operational as fallback"] },
      { id:"NV-4839", title:"Health clearance form missing 3 immunization fields", dept:"Health Services", urgency:"Medium", tag:"Forms",
        summary:"3 required immunization fields removed in the last form update. 200+ students have submitted incomplete forms.",
        solution:"Restore the 3 missing fields; notify 200+ students to re-submit. Form fix can be done without data loss.",
        cross:null, conf:96, steps:["Fields removed in v4.2 update (June 3)","200+ submissions affected","Students will need to re-submit"] },
      { id:"NV-4838", title:"Insurance waiver form rejecting valid submissions", dept:"Health Services", urgency:"Low", tag:"Insurance",
        summary:"Form validation rejects waiver submissions from students with out-of-state insurance plans. Regex too strict.",
        solution:"Patch validation to accept out-of-state plan formats; re-open 18 rejected submissions.",
        cross:null, conf:90, steps:["18 rejections identified","All from out-of-state insurance plans","Validation regex confirmed too strict"] },
    ],
    recurring:[{t:"Portal / booking errors",n:17,trend:"+11%",tint:"rose"},{t:"Form submission issues",n:9,trend:"+4%",tint:"sand"},{t:"Insurance queries",n:6,trend:"−8%",tint:"teal",down:true}],
    kb:[{t:"MyHealth booking fallback guide",reason:"17 portal errors this week",status:"draft"},{t:"Immunization clearance FAQ",reason:"200+ incomplete submissions",status:"new"}],
  },
  studsvcs: {
    label:"Student Services", resolved:"77%",
    tickets:[
      { id:"NV-4845", title:"Reprinted ID cards not activating on building readers", dept:"Student Services", urgency:"High", tag:"ID Access",
        summary:"Reprinted ID cards for 8 students aren't activating on access readers. The card vendor updated their encoding format to v3.",
        solution:"Re-encode affected cards using the updated vendor format (v3); coordinate firmware update with Facilities.",
        cross:{from:"Student Services", to:"Facilities", note:"Building access readers need a firmware update from Facilities before new encoding works."},
        conf:90, steps:["8 reprinted cards failing","Vendor updated encoding format on June 4","Reader firmware at v2 — needs v3 to accept new cards"] },
      { id:"NV-4844", title:"Commuter lounge WiFi drops every 20 minutes", dept:"Student Services", urgency:"Medium", tag:"Facilities",
        summary:"Commuter lounge AP (AP-COMM-02) showing intermittent drops every ~20 min. Likely a channel conflict with the adjacent building.",
        solution:"Reconfigure AP-COMM-02 to channel 11; verify with a 4-hour monitoring window. Coordinate with IT Networking.",
        cross:{from:"Student Services", to:"IT — Network", note:"AP config changes are owned by IT Networking."},
        conf:87, steps:["Drops reported by 14 students","AP logs show disconnects every 22 min","Adjacent AP confirmed on same channel"] },
      { id:"NV-4843", title:"Financial aid form rejects valid SSNs with leading zeros", dept:"Student Services", urgency:"Low", tag:"Forms",
        summary:"Form validation rejects SSNs starting with 0. Affects ~5 submissions/day.",
        solution:"Patch validation regex to handle leading zeros; meanwhile guide students to the alt PDF route.",
        cross:null, conf:88, steps:["~5 rejections/day confirmed","All have leading-zero SSNs","Validation regex confirmed incorrect"] },
    ],
    recurring:[{t:"ID access issues",n:16,trend:"+8%",tint:"sand"},{t:"Facilities / WiFi",n:12,trend:"+5%",tint:"teal"},{t:"General inquiries",n:31,trend:"−3%",tint:"green",down:true}],
    kb:[{t:"Student ID reprint and activation guide",reason:"8 cases — new vendor encoding",status:"new"},{t:"WiFi troubleshooting for common areas",reason:"trending — 12 cases",status:"draft"}],
  },
};

function uColor(u) {
  if (u==="High")   return ["#FBE7E0","#C0532F","#F3D2C6"];
  if (u==="Medium") return ["#F7EBD3","#A9781F","#EEDCB4"];
  return ["#EAEFF3","#5A6B7B","#DDE4EA"];
}

/* ── 5a. AdminLookout ── */
function AdminLookout({ dept }) {
  const data = DEPT_DATA[dept] || DEPT_DATA.it;
  const [sel, setSel] = React.useState(0);
  const t = data.tickets[sel];

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%"}}>
      {/* Lookout app bar */}
      <div style={{display:"flex", alignItems:"center", gap:11, padding:"11px 20px", background:"#fff", borderBottom:"1px solid var(--line)", flexShrink:0}}>
        <span style={{width:26, height:26, borderRadius:8, background:"var(--teal-050)", display:"grid", placeItems:"center", color:"var(--teal-700)"}}>
          <Icon name="eye" size={15} sw={2} />
        </span>
        <span style={{fontWeight:800, fontSize:14.5, letterSpacing:"-.02em"}}>Meera Lookout</span>
        <span className="mono" style={{fontSize:10.5, color:"var(--muted)", background:"#F3ECE0", padding:"2px 8px", borderRadius:99}}>{data.label}</span>
        <span style={{flex:1}} />
        <span className="mono" style={{fontSize:11, color:"var(--muted)", display:"flex", alignItems:"center", gap:6}}>
          <span style={{width:7, height:7, borderRadius:99, background:"var(--teal)"}} /> {data.tickets.length} open · needs review
        </span>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"162px 272px 1fr", flex:1, minHeight:0, overflow:"hidden"}}>
        {/* Left rail */}
        <div style={{borderRight:"1px solid var(--line)", padding:"14px 11px", background:"#FCFAF6", overflowY:"auto"}}>
          {[["inbox","Inbox",String(data.tickets.length)],["trend","Insights",""],["book","Knowledge",""],["route","Routing",""],["users","Team",""]].map(([ic,lb,c],i) => (
            <div key={lb} style={{display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:9, marginBottom:3,
              fontSize:13, fontWeight:i===0?700:600, color:i===0?"var(--teal-700)":"var(--ink-2)", background:i===0?"var(--teal-050)":"transparent"}}>
              <Icon name={ic} size={16} /> <span style={{flex:1}}>{lb}</span>
              {c && <span className="mono" style={{fontSize:10, background:"#fff", border:"1px solid var(--line)", padding:"1px 6px", borderRadius:99}}>{c}</span>}
            </div>
          ))}
          <div style={{margin:"12px 0", height:1, background:"var(--line)"}} />
          <div className="mono" style={{fontSize:9.5, letterSpacing:".1em", color:"var(--muted)", padding:"0 10px 8px"}}>RESOLVED BY MEERA</div>
          <div style={{padding:"0 10px", marginBottom:14}}>
            <div style={{fontSize:27, fontWeight:800, letterSpacing:"-.03em"}}>{data.resolved}</div>
            <div style={{fontSize:11.5, color:"var(--muted)", lineHeight:1.4}}>without a human this week</div>
          </div>
          <div style={{margin:"0 0 12px", height:1, background:"var(--line)"}} />
          <div className="mono" style={{fontSize:9.5, letterSpacing:".1em", color:"var(--muted)", padding:"0 10px 8px"}}>RECURRING ISSUES</div>
          <div style={{padding:"0 8px", display:"grid", gap:8, marginBottom:14}}>
            {data.recurring.map(r => (
              <div key={r.t} style={{display:"flex", alignItems:"center", gap:7}}>
                <span style={{width:7, height:7, borderRadius:99, background:`var(--${r.tint})`, flexShrink:0}} />
                <span style={{fontSize:12, fontWeight:600, flex:1, lineHeight:1.3}}>{r.t}</span>
                <span className="mono tnum" style={{fontSize:11, color:"var(--ink)"}}>{r.n}</span>
                <span className="mono" style={{fontSize:10, fontWeight:600, color:r.down?"var(--green)":"var(--rose)", width:38, textAlign:"right"}}>{r.trend}</span>
              </div>
            ))}
          </div>
          <div style={{margin:"0 0 12px", height:1, background:"var(--line)"}} />
          <div className="mono" style={{fontSize:9.5, letterSpacing:".1em", color:"var(--muted)", padding:"0 10px 8px"}}>KB SUGGESTIONS</div>
          <div style={{padding:"0 8px", display:"grid", gap:10}}>
            {data.kb.map(k => (
              <div key={k.t} style={{display:"flex", gap:7, alignItems:"flex-start"}}>
                <Icon name="sparkle" size={12} sw={2} style={{color:"var(--teal)", marginTop:1, flexShrink:0}} />
                <div style={{flex:1}}>
                  <div style={{fontSize:11.5, fontWeight:600, lineHeight:1.35}}>{k.t}</div>
                  <div className="mono" style={{fontSize:10, color:"var(--muted)"}}>{k.reason}</div>
                </div>
                <span className="mono" style={{fontSize:9, fontWeight:600, padding:"2px 6px", borderRadius:99,
                  background:k.status==="new"?"var(--teal-050)":"var(--gold-050)",
                  color:k.status==="new"?"var(--teal-700)":"#A9781F"}}>{k.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Queue */}
        <div style={{borderRight:"1px solid var(--line)", display:"flex", flexDirection:"column", overflow:"hidden"}}>
          <div style={{padding:"12px 14px 8px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0}}>
            <span style={{fontWeight:700, fontSize:14}}>Ticket queue</span>
            <span className="mono" style={{fontSize:11, color:"var(--muted)"}}>urgency ↓</span>
          </div>
          <div style={{overflowY:"auto", flex:1}}>
            {data.tickets.map((tk, i) => {
              const [bg,fg,bd] = uColor(tk.urgency);
              const active = i === sel;
              return (
                <button key={tk.id} onClick={() => setSel(i)} style={{
                  display:"block", width:"100%", textAlign:"left",
                  padding:"12px 14px", borderBottom:"1px solid var(--line)",
                  background:active?"var(--teal-050)":"transparent",
                  borderLeft:active?"3px solid var(--teal)":"3px solid transparent",
                  cursor:"pointer", fontFamily:"inherit", transition:"background .15s",
                }}>
                  <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
                    <span className="mono" style={{fontSize:10.5, color:"var(--muted)"}}>#{tk.id}</span>
                    <span style={{marginLeft:"auto", fontSize:10.5, fontWeight:700, background:bg, color:fg, border:`1px solid ${bd}`, padding:"2px 8px", borderRadius:99}}>{tk.urgency}</span>
                  </div>
                  <div style={{fontSize:13.5, fontWeight:600, lineHeight:1.35, marginBottom:5}}>{tk.title}</div>
                  <div style={{display:"flex", alignItems:"center", gap:6}}>
                    <span className="mono" style={{fontSize:10.5, color:"var(--teal-700)", background:"#fff", border:"1px solid var(--line)", padding:"1px 7px", borderRadius:99, display:"inline-flex", alignItems:"center", gap:4}}>
                      <Icon name="sparkle" size={10} sw={2} /> {tk.tag}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail pane */}
        <div style={{padding:"18px 20px", overflowY:"auto", background:"#FCFAF6"}}>
          <div style={{display:"flex", alignItems:"flex-start", gap:12, marginBottom:16}}>
            <IconChip name="ticket" tint="sand" size={44} isize={21} />
            <div style={{flex:1}}>
              <h4 style={{fontSize:19, lineHeight:1.2, marginBottom:4}}>{t.title}</h4>
              <div className="mono" style={{fontSize:11, color:"var(--muted)"}}>#{t.id} · routed to {t.dept}</div>
            </div>
            <Confidence value={t.conf} label="AI confidence" />
          </div>
          <AdminDBlock icon="sparkle" tint="teal" label="AI-GENERATED SUMMARY">{t.summary}</AdminDBlock>
          <AdminDBlock icon="layers" tint="ink" label="ATTEMPTED BY MEERA">
            <ul style={{margin:0, paddingLeft:16, display:"grid", gap:4}}>
              {t.steps.map((s,i) => <li key={i} style={{fontSize:13, color:"var(--ink-2)"}}>{s}</li>)}
            </ul>
          </AdminDBlock>
          <AdminDBlock icon="wand" tint="gold" label="SUGGESTED SOLUTION">
            <div style={{marginBottom:12}}>{t.solution}</div>
            <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
              <button className="btn btn-primary btn-sm" style={{padding:"7px 14px", fontSize:12.5}}>
                <Icon name="check" size={14} sw={2.2} /> Approve &amp; send
              </button>
              <button className="btn btn-ghost btn-sm" style={{padding:"7px 14px", fontSize:12.5}}>Edit</button>
              <button className="btn btn-ghost btn-sm" style={{padding:"7px 14px", fontSize:12.5}}>
                <Icon name="flag" size={13} /> Escalate
              </button>
            </div>
          </AdminDBlock>
          {t.cross && (
            <div style={{display:"flex", gap:11, padding:"13px 15px", borderRadius:14, background:"#FBE7E0", border:"1px solid #F3D2C6", marginTop:4}}>
              <Icon name="alert" size={19} style={{color:"#C0532F", flexShrink:0, marginTop:1}} />
              <div>
                <div style={{fontWeight:700, fontSize:13, color:"#A8431F", marginBottom:3}}>Cross-department dependency</div>
                <div style={{fontSize:12.5, color:"#8A4A33", lineHeight:1.5}}>
                  <strong>{t.cross.from} → {t.cross.to}.</strong> {t.cross.note}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminDBlock({ icon, tint, label, children }) {
  const c = { teal:"var(--teal)", gold:"var(--gold)", ink:"var(--ink-2)" };
  return (
    <div style={{marginBottom:14}}>
      <div className="mono" style={{fontSize:10, letterSpacing:".1em", color:"var(--muted)", marginBottom:6, display:"flex", alignItems:"center", gap:7}}>
        <Icon name={icon} size={13} style={{color:c[tint]||"var(--muted)"}} /> {label}
      </div>
      <div style={{fontSize:13.5, color:"var(--ink-2)", lineHeight:1.55}}>{children}</div>
    </div>
  );
}

/* ── 5b. Cross-dept workflow ── */
const CROSS_WF = {
  it:       { ticket:"NV-4826", title:"VPN rollback needs MDM profile — IT & Endpoint",
    desc:"Meera flagged a dependency: the VPN rollback requires an MDM profile change that Endpoint Mgmt owns. Here's the proposed resolution sequence.",
    steps:[{dept:"IT — Network",icon:"bolt",tint:"teal",action:"Roll back VPN client to 14.1 on 23 devices"},{dept:"Endpoint Mgmt",icon:"plug",tint:"sand",action:"Push corrected MDM profile to affected fleet"},{dept:"Meera (auto)",icon:"sparkle",tint:"green",action:"Re-notify students when VPN is restored"}] },
  registrar:{ ticket:"NV-4831", title:"Hold clearance requires Finance before Registrar can act",
    desc:"Registration can't be re-enabled until the financial hold is cleared. Meera proposed a sequenced workflow to resolve this without ticket ping-pong.",
    steps:[{dept:"Finance / Bursar",icon:"building",tint:"gold",action:"Clear $310 financial hold on account"},{dept:"Registrar",icon:"doc",tint:"teal",action:"Re-enable course registration Submit"},{dept:"Meera (auto)",icon:"sparkle",tint:"green",action:"Re-notify student to complete registration"}] },
  finance:  { ticket:"NV-4827", title:"Finance clears hold → Registrar re-enables registration",
    desc:"The student's registration is blocked by a hold your office needs to clear first. Once cleared, Registrar re-enables submission and Meera closes the loop.",
    steps:[{dept:"Finance / Bursar",icon:"building",tint:"gold",action:"Clear $310 hold and confirm to Registrar"},{dept:"Registrar",icon:"doc",tint:"teal",action:"Re-enable registration after hold confirmation"},{dept:"Meera (auto)",icon:"sparkle",tint:"green",action:"Auto-notify student to submit"}] },
  health:   { ticket:"NV-4840", title:"Portal outage — Health & IT must coordinate",
    desc:"The MyHealth portal outage needs IT to scale the web tier while Health manages student comms and routing to the phone line.",
    steps:[{dept:"IT — Infra",icon:"bolt",tint:"teal",action:"Scale MyHealth web tier for semester load spike"},{dept:"Health Services",icon:"headset",tint:"sand",action:"Redirect students to phone booking at x4400"},{dept:"Meera (auto)",icon:"sparkle",tint:"green",action:"Auto-update students when portal is restored"}] },
  studsvcs: { ticket:"NV-4845", title:"ID encoding fix needs Facilities firmware update first",
    desc:"New ID cards won't activate until Facilities updates reader firmware to v3. Student Services can then re-encode the affected cards.",
    steps:[{dept:"Facilities",icon:"building",tint:"gold",action:"Update building reader firmware to v3"},{dept:"Student Services",icon:"users",tint:"teal",action:"Re-encode 8 ID cards with the new v3 format"},{dept:"Meera (auto)",icon:"sparkle",tint:"green",action:"Notify 8 students when their cards are active"}] },
};

function AdminCrossDept({ dept }) {
  const wf = CROSS_WF[dept] || CROSS_WF.registrar;
  const [approved, setApproved]     = React.useState(false);
  const [notifiedN, setNotifiedN]   = React.useState(-1);

  const handleApprove = () => {
    setApproved(true);
    wf.steps.forEach((_, i) => setTimeout(() => setNotifiedN(i), (i + 1) * 520));
  };

  return (
    <div style={{padding:"28px 24px", maxWidth:920, margin:"0 auto", width:"100%"}}>
      <div style={{marginBottom:26}}>
        <div className="eyebrow" style={{marginBottom:10}}>Cross-dept workflow · Ticket #{wf.ticket}</div>
        <h2 style={{fontSize:26, fontWeight:800, letterSpacing:"-.03em", marginBottom:8}}>{wf.title}</h2>
        <p style={{fontSize:15, color:"var(--ink-2)", maxWidth:600, lineHeight:1.6, margin:0}}>{wf.desc}</p>
      </div>

      {/* Stepper */}
      <div className="card" style={{padding:"24px 24px 20px", marginBottom:20}}>
        <div className="mono" style={{fontSize:10, letterSpacing:".12em", color:"var(--muted)", marginBottom:22}}>PROPOSED RESOLUTION SEQUENCE</div>
        <div style={{display:"flex", alignItems:"flex-start"}}>
          {wf.steps.map((step, i) => (
            <React.Fragment key={i}>
              <CrossStepCard step={step} index={i} notified={notifiedN >= i} />
              {i < wf.steps.length - 1 && (
                <div style={{flex:1, height:2, marginTop:30, minWidth:12,
                  background:notifiedN >= i ? "var(--teal)" : "var(--line-2)",
                  transition:"background .5s"}} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Actions */}
      {!approved ? (
        <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
          <button onClick={handleApprove} className="btn btn-primary">
            <Icon name="check" size={16} sw={2.2} /> Approve workflow
          </button>
          <button className="btn btn-ghost">Edit steps</button>
          <button className="btn btn-ghost"><Icon name="users" size={16} /> Reassign owner</button>
        </div>
      ) : (
        <React.Fragment>
          <div style={{padding:"15px 20px", borderRadius:"var(--r-md)", background:"var(--teal-050)", border:"1px solid var(--teal-100)", marginBottom:16, display:"flex", gap:11, alignItems:"center"}}>
            <Icon name="check" size={18} style={{color:"var(--teal)", flexShrink:0}} />
            <div>
              <div style={{fontWeight:700, fontSize:15, marginBottom:3}}>Workflow approved — sub-tasks sent to each team</div>
              <div style={{fontSize:13.5, color:"var(--ink-2)"}}>Each department sees their step and can track the shared timeline as it progresses.</div>
            </div>
          </div>
          {/* Shared timeline */}
          <div className="card" style={{padding:"16px 18px"}}>
            <div className="mono" style={{fontSize:10, letterSpacing:".12em", color:"var(--muted)", marginBottom:14}}>SHARED TIMELINE — visible to all departments</div>
            <div style={{display:"grid", gap:9}}>
              {wf.steps.map((step, i) => (
                <div key={i} style={{display:"flex", alignItems:"center", gap:12, padding:"10px 13px", borderRadius:10,
                  background:notifiedN>=i?"var(--teal-050)":"#F8F5F0",
                  border:`1px solid ${notifiedN>=i?"var(--teal-100)":"var(--line)"}`,
                  transition:"all .4s"}}>
                  <span style={{width:28, height:28, borderRadius:99, flexShrink:0,
                    background:notifiedN>=i?"var(--teal)":"var(--line-2)",
                    display:"grid", placeItems:"center", transition:"background .4s"}}>
                    <span className="mono" style={{fontSize:11, fontWeight:700, color:"#fff"}}>{i+1}</span>
                  </span>
                  <div style={{flex:1}}>
                    <div className="mono" style={{fontSize:10, color:"var(--muted)", marginBottom:2}}>{step.dept}</div>
                    <div style={{fontSize:13.5, fontWeight:600}}>{step.action}</div>
                  </div>
                  {notifiedN>=i && (
                    <span className="mono" style={{fontSize:10.5, color:"var(--teal-700)", background:"var(--teal-050)", border:"1px solid var(--teal-100)", padding:"3px 9px", borderRadius:99, animation:"fadeUp .3s ease", flexShrink:0}}>
                      notified ✓
                    </span>
                  )}
                  {notifiedN < i && approved && (
                    <span className="mono" style={{fontSize:10.5, color:"var(--muted)", padding:"3px 9px", borderRadius:99, background:"#F0EBE2", flexShrink:0}}>
                      waiting on step {i}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

function CrossStepCard({ step, index, notified }) {
  return (
    <div style={{display:"flex", flexDirection:"column", alignItems:"center", flex:"0 0 auto", width:200}}>
      <div style={{
        width:58, height:58, borderRadius:"50%",
        background:notified?"var(--teal-050)":"#fff",
        border:`2px solid ${notified?"var(--teal)":"var(--line-2)"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all .4s", marginBottom:11, position:"relative",
      }}>
        <IconChip name={step.icon} tint={notified?"teal":step.tint} size={38} isize={18} />
        {notified && (
          <span style={{position:"absolute", top:-5, right:-5, width:20, height:20,
            borderRadius:"50%", background:"var(--teal)", color:"#fff",
            display:"grid", placeItems:"center", animation:"fadeUp .3s ease"}}>
            <Icon name="check" size={10} sw={2.5} />
          </span>
        )}
      </div>
      <div className="mono" style={{fontSize:9.5, letterSpacing:".08em", color:"var(--muted)", marginBottom:5, textAlign:"center"}}>
        {index + 1}. {step.dept.toUpperCase()}
      </div>
      <div style={{fontSize:13, fontWeight:600, textAlign:"center", lineHeight:1.3, maxWidth:172, color:notified?"var(--teal-700)":"var(--ink)"}}>{step.action}</div>
      {notified && (
        <span className="mono" style={{marginTop:9, fontSize:9.5, color:"var(--teal-700)", background:"var(--teal-050)", padding:"2px 8px", borderRadius:99, animation:"fadeUp .3s ease"}}>
          sub-task sent
        </span>
      )}
    </div>
  );
}

Object.assign(window, { AdminLookout, AdminCrossDept });
