/* ===== Meera Demo Environment Shell (v2: Student | Admin) ===== */

const ADMIN_DEPTS = [
  { id:"it",        label:"IT" },
  { id:"registrar", label:"Registrar" },
  { id:"health",    label:"Health" },
  { id:"studsvcs",  label:"Student Svcs" },
  { id:"finance",   label:"Finance" },
];

function DemoEnv({ onExit }) {
  const [topView, setTopView]         = React.useState("student"); // "student" | "admin"
  const [studentView, setStudentView] = React.useState("site");
  const [adminDept, setAdminDept]     = React.useState("it");
  const [adminView, setAdminView]     = React.useState("inbox");
  const [resetKey, setResetKey]       = React.useState(0);
  const [preIssue, setPreIssue]       = React.useState(null);

  const isStudent = topView === "student";

  const switchTop = (view) => {
    setTopView(view);
    setResetKey(k => k + 1);
    setStudentView("site");
    setAdminDept("it");
    setAdminView("inbox");
    setPreIssue(null);
  };

  const switchAdminDept = (dept) => {
    setAdminDept(dept);
    setAdminView("inbox");
    setResetKey(k => k + 1);
  };

  const doReset = () => {
    setResetKey(k => k + 1);
    setPreIssue(null);
  };

  const handleChipSelect = (issue) => {
    setPreIssue(issue);
    setStudentView("chat");
    setResetKey(k => k + 1);
  };

  const stage = React.useMemo(() => {
    const k = resetKey;
    if (isStudent) {
      switch (studentView) {
        case "embedded":    return <StudentEmbedded key={k} />;
        case "screenshare": return <StudentScreenshare key={k} />;
        case "chat":        return <StudentChat key={k} preIssue={preIssue} />;
        case "mound":       return <StudentMound key={k} preIssue={preIssue} />;
        default:            return <StudentMeeraSite key={k} onChipSelect={handleChipSelect} />;
      }
    }
    if (adminView === "crossdept") return <AdminCrossDept key={k} dept={adminDept} />;
    return <AdminLookout key={k} dept={adminDept} />;
  }, [topView, studentView, adminDept, adminView, resetKey, isStudent]);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:100,
      display:"flex", flexDirection:"column",
      background:"var(--cream)",
    }}>
      {/* ── Cockpit ── */}
      <div style={{background:"#fff", borderBottom:"1px solid var(--line)", flexShrink:0}}>

        {/* Row 1: Logo · Student/Admin · DEMO badge · Reset/Exit */}
        <div style={{display:"flex", alignItems:"center", gap:10, padding:"0 16px", height:50}}>
          <div style={{display:"flex", alignItems:"center", gap:7, flexShrink:0}}>
            <MeerkatMark size={28} />
            <span style={{fontWeight:800, fontSize:15, letterSpacing:"-.03em"}}>Meera</span>
          </div>

          <div style={{width:1, height:18, background:"var(--line-2)", margin:"0 4px", flexShrink:0}} />

          {/* Top-level persona toggle */}
          <div style={{display:"flex", gap:2, background:"var(--cream-2)", borderRadius:99, padding:3, flexShrink:0}}>
            {[["student","Student"],["admin","Admin"]].map(([id,label]) => (
              <button key={id} onClick={() => switchTop(id)} style={{
                padding:"5px 18px", borderRadius:99, fontSize:13, fontWeight:700,
                background: topView===id ? "#fff" : "transparent",
                color: topView===id ? "var(--ink)" : "var(--muted)",
                border:"none", cursor:"pointer", fontFamily:"inherit",
                boxShadow: topView===id ? "var(--sh-sm)" : "none",
                transition:"all .18s",
              }}>{label}</button>
            ))}
          </div>

          <span className="mono" style={{
            fontSize:9.5, letterSpacing:".16em",
            color:"var(--teal-700)", background:"var(--teal-050)",
            padding:"2px 9px", borderRadius:99, flexShrink:0,
          }}>· DEMO ·</span>

          <span style={{flex:1}} />

          <div style={{display:"flex", gap:3, flexShrink:0}}>
            <button onClick={doReset} style={demoCtrlBtnSt}>
              <Icon name="refresh" size={13} /> Reset
            </button>
            <button onClick={onExit} style={{...demoCtrlBtnSt, color:"var(--rose)"}}>
              ✕ Exit
            </button>
          </div>
        </div>

        {/* Row 2: Contextual sub-nav */}
        <div style={{
          display:"flex", alignItems:"center", gap:4,
          padding:"5px 16px 7px",
          borderTop:"1px solid var(--line-2)",
          background:"var(--cream)", overflowX:"auto",
        }}>
          {isStudent ? (
            <React.Fragment>
              <DemoSubLabel>WHERE</DemoSubLabel>
              <DemoSubTab active={studentView==="site"}        onClick={() => setStudentView("site")}>Meera site</DemoSubTab>
              <DemoSubTab active={studentView==="embedded"}    onClick={() => setStudentView("embedded")}>Embedded</DemoSubTab>
              <DemoDivider />
              <DemoSubLabel>HOW</DemoSubLabel>
              <DemoSubTab active={studentView==="screenshare"} onClick={() => setStudentView("screenshare")}>Screenshare</DemoSubTab>
              <DemoSubTab active={studentView==="chat"}        onClick={() => setStudentView("chat")}>Chat</DemoSubTab>
              <DemoSubTab active={studentView==="mound"}       onClick={() => setStudentView("mound")}>Build the Mound</DemoSubTab>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <DemoSubLabel>DEPT</DemoSubLabel>
              {ADMIN_DEPTS.map(d => (
                <DemoSubTab key={d.id} active={adminDept===d.id} onClick={() => switchAdminDept(d.id)}>
                  {d.label}
                </DemoSubTab>
              ))}
              <DemoDivider />
              <DemoSubLabel>VIEW</DemoSubLabel>
              <DemoSubTab active={adminView==="inbox"}     onClick={() => setAdminView("inbox")}>Inbox</DemoSubTab>
              <DemoSubTab active={adminView==="crossdept"} onClick={() => setAdminView("crossdept")}>Cross-dept</DemoSubTab>
            </React.Fragment>
          )}
        </div>
      </div>

      {/* ── Stage ── */}
      <div style={{flex:1, overflowY:"auto", overflowX:"hidden", display:"flex", flexDirection:"column"}}>
        {stage}
      </div>
    </div>
  );
}

const demoCtrlBtnSt = {
  display:"inline-flex", alignItems:"center", gap:5,
  padding:"5px 10px", borderRadius:7, fontSize:12.5, fontWeight:600,
  color:"var(--muted)", background:"transparent",
  border:"1px solid transparent", cursor:"pointer", fontFamily:"inherit",
};

function DemoSubLabel({ children }) {
  return (
    <span className="mono" style={{fontSize:10, letterSpacing:".12em", color:"var(--muted)", flexShrink:0, paddingRight:2}}>
      {children}
    </span>
  );
}
function DemoSubTab({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding:"4px 12px", borderRadius:7, fontSize:12.5, fontWeight:600,
      background: active ? "var(--teal-050)" : "transparent",
      color: active ? "var(--teal-700)" : "var(--ink-2)",
      border: active ? "1px solid var(--teal-100)" : "1px solid transparent",
      cursor:"pointer", fontFamily:"inherit",
      whiteSpace:"nowrap", flexShrink:0, transition:"all .15s",
    }}>{children}</button>
  );
}
function DemoDivider() {
  return <span style={{width:1, height:14, background:"var(--line-2)", margin:"0 5px", flexShrink:0}} />;
}

Object.assign(window, { DemoEnv, DemoSubLabel, DemoSubTab, DemoDivider });
