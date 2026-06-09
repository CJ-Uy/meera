/* ===== Meera app: assembly + tweaks + demo env + booking modal ===== */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroLayout": "split",
  "accent": "#2E9C8E",
  "heroChips": true
}/*EDITMODE-END*/;

const ACCENTS = {
  "#2E9C8E": ["#2E9C8E","#26867A","#E4F1EE"],
  "#E79B6B": ["#E79B6B","#D9844F","#FBEADD"],
  "#1C3349": ["#1C3349","#16293B","#E7ECF0"],
  "#D9A65A": ["#C99845","#B98427","#F7EBD3"],
};

function useResponsiveCSS(){
  React.useEffect(()=>{
    if(document.getElementById("meera-resp")) return;
    const s=document.createElement("style"); s.id="meera-resp";
    s.textContent=`
    @media (max-width:980px){
      .wrap{padding:0 24px;}
      .section .wrap[style*="grid-template-columns: 1.02fr"]{grid-template-columns:1fr !important;gap:36px !important;}
      .handoff-copy{order:-1;}
      .section .wrap[style*="grid-template-columns: .82fr"]{grid-template-columns:1fr !important;gap:34px !important;}
      .section .wrap[style*="grid-template-columns: .9fr"]{grid-template-columns:1fr !important;gap:30px !important;}
      .brand-grid > div:first-child img{max-width:260px;}
      .hero-stage-grid{grid-template-columns:1fr !important;}
      .hero-stage-grid > div:last-child{max-width:340px;margin:0 auto;}
    }
    @media (max-width:860px){
      .feat-grid{grid-template-columns:1fr 1fr !important;gap:26px !important;}
      .benefit-grid{grid-template-columns:1fr 1fr !important;}
      .usecase-grid{grid-template-columns:1fr !important;}
      .nav-links{display:none !important;}
      .footer-grid{grid-template-columns:1fr 1fr !important;gap:28px !important;}
      .cta-mascot{display:none !important;}
    }
    @media (max-width:560px){
      .feat-grid,.benefit-grid{grid-template-columns:1fr !important;}
      .footer-grid{grid-template-columns:1fr !important;}
      .nav-signin{display:none !important;}
      .section{padding:64px 0 !important;}
    }`;
    document.head.appendChild(s);
  },[]);
}

/* ── Demo booking modal (kept for CTA section) ── */
function DemoModal({open,onClose}){
  const [sent,setSent]=React.useState(false);
  React.useEffect(()=>{
    if(!open) return;
    const k=e=>{ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",k); document.body.style.overflow="hidden";
    return ()=>{ window.removeEventListener("keydown",k); document.body.style.overflow=""; };
  },[open]);
  React.useEffect(()=>{ if(!open) setTimeout(()=>setSent(false),250); },[open]);
  if(!open) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:90,background:"rgba(22,41,59,.5)",
      backdropFilter:"blur(4px)",display:"grid",placeItems:"center",padding:20,animation:"fadeUp .2s ease"}}>
      <div onClick={e=>e.stopPropagation()} className="card" style={{width:"100%",maxWidth:440,padding:0,overflow:"hidden",boxShadow:"var(--sh-lg)"}}>
        {!sent ? (
          <React.Fragment>
            <div style={{padding:"24px 26px 0",display:"flex",gap:13,alignItems:"center"}}>
              <span style={{width:48,height:48,borderRadius:"50%",overflow:"hidden",background:"#FBEADD",border:"1.5px solid #EBC9A8",display:"grid",placeItems:"center",flexShrink:0}}>
                <img src="assets/meera-avatar.png" style={{width:"150%"}} alt=""/>
              </span>
              <div>
                <h3 style={{fontSize:21}}>Book a demo</h3>
                <p style={{fontSize:13.5,color:"var(--muted)"}}>A 20-minute walkthrough with Meera.</p>
              </div>
            </div>
            <form onSubmit={e=>{e.preventDefault();setSent(true);}} style={{padding:"20px 26px 26px",display:"grid",gap:12}}>
              <DemoInp label="Full name" ph="Alex Rivera"/>
              <DemoInp label="Work email" ph="alex@university.edu" type="email"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <DemoInp label="Organization" ph="Northvale University"/>
                <div>
                  <label style={demoLblS}>I work in</label>
                  <select style={{...demoInpS,appearance:"none"}}>
                    <option>Student services</option><option>University IT</option>
                    <option>Enterprise IT</option><option>Help desk</option><option>Other</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{marginTop:6,width:"100%"}}>Request my demo <Icon name="arrow" size={16} sw={2.2}/></button>
              <p className="mono" style={{fontSize:10.5,color:"var(--muted)",textAlign:"center"}}>No spam. Meera keeps watch on your inbox too.</p>
            </form>
          </React.Fragment>
        ) : (
          <div style={{padding:"34px 30px 38px",textAlign:"center"}}>
            <img src="assets/meera-celebrate.png" alt="" style={{width:150,margin:"0 auto 10px"}}/>
            <h3 style={{fontSize:22,marginBottom:8}}>You're on the list!</h3>
            <p className="lede" style={{fontSize:15.5,marginBottom:22}}>Meera will reach out within one business day to set up your walkthrough.</p>
            <button onClick={onClose} className="btn btn-ghost">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
const demoLblS={display:"block",fontSize:12,fontWeight:600,color:"var(--ink-2)",marginBottom:6};
const demoInpS={width:"100%",padding:"11px 13px",borderRadius:10,border:"1.5px solid var(--line-2)",fontSize:14,
  fontFamily:"inherit",color:"var(--ink)",background:"#fff"};
function DemoInp({label,ph,type="text"}){
  return <div><label style={demoLblS}>{label}</label><input type={type} placeholder={ph} style={demoInpS} required/></div>;
}

/* ── Root App ── */
function App(){
  const [t,setTweak]=useTweaks(TWEAK_DEFAULTS);
  const [bookOpen,setBookOpen]=React.useState(false);
  const [demoOpen,setDemoOpen]=React.useState(false);
  useResponsiveCSS();
  useReveal();

  React.useEffect(()=>{
    const a=ACCENTS[t.accent]||ACCENTS["#2E9C8E"];
    const r=document.documentElement.style;
    r.setProperty("--accent",a[0]); r.setProperty("--accent-600",a[1]); r.setProperty("--accent-050",a[2]);
  },[t.accent]);

  /* Lock scroll on landing when demo is open */
  React.useEffect(()=>{
    document.body.style.overflow = demoOpen ? "hidden" : "";
    return ()=>{ document.body.style.overflow=""; };
  },[demoOpen]);

  const tweaksPanel = (
    <TweaksPanel title="Tweaks">
      {!demoOpen && <React.Fragment>
        <TweakSection label="Hero" />
        <TweakRadio label="Layout" value={t.heroLayout} options={["split","centered","stage"]}
          onChange={v=>setTweak("heroLayout",v)} />
        <TweakToggle label="Floating chips" value={t.heroChips} onChange={v=>setTweak("heroChips",v)} />
      </React.Fragment>}
      <TweakSection label="Brand accent" />
      <TweakColor label="Primary" value={t.accent}
        options={["#2E9C8E","#E79B6B","#1C3349","#D9A65A"]}
        onChange={v=>setTweak("accent",v)} />
    </TweaksPanel>
  );

  return (
    <React.Fragment>
      {/* Landing page (always in DOM; hidden behind fixed DemoEnv when open) */}
      <Nav onDemo={()=>setDemoOpen(true)}/>
      <Hero layout={t.heroLayout} chips={t.heroChips} onDemo={()=>setDemoOpen(true)}/>
      <MeerorSection/>
      <HandoffSection/>
      <LookoutSection/>
      <UseCases/>
      <Benefits/>
      <BrandSection/>
      <CTA onDemo={()=>setBookOpen(true)}/>
      <Footer/>
      <DemoModal open={bookOpen} onClose={()=>setBookOpen(false)}/>

      {/* Demo environment — fixed overlay */}
      {demoOpen && <DemoEnv onExit={()=>setDemoOpen(false)} />}

      {tweaksPanel}
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App/>);
