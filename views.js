/* Application views — welcome, shell and My Courses */
(function () {
  const H = window.H;
  const icon = H.icon;
  const esc = H.esc;

  const TAB_META = {
    courses: { label: "My Courses", title: "My Courses", crumb: "My courses" },
    academics: { label: "Academics", title: "Academics", crumb: "Academics" },
    alerts: { label: "Alerts", title: "Alerts", crumb: "Alerts" },
    guidance: { label: "Academic Guidance", title: "Academic Guidance", crumb: "Guidance" },
    overview: { label: "Overall Dashboard", title: "Overall Dashboard", crumb: "Overview" },
  };

  function brand(light = false) {
    return `<a class="brand${light ? " brand--light" : ""}" href="#" data-action="brand">
      <span class="brand-mark">${icon("book-open")}</span>
      <span class="brand-word">arrear<span>.</span></span>
    </a>`;
  }

  function passwordField(id, label, placeholder, autocomplete) {
    return `<div class="field">
      <label for="${id}">${label}</label>
      <div class="input-wrap">
        <input class="input input--icon" id="${id}" name="password" type="password" placeholder="${placeholder}" autocomplete="${autocomplete}" required />
        <button class="input-action" type="button" data-action="toggle-password" data-target="${id}" aria-label="Show password">${icon("eye")}</button>
      </div>
    </div>`;
  }

  function welcome(authMode) {
    const isSignup = authMode === "signup";
    return `<main class="welcome">
      <section class="welcome-visual">
        <header class="welcome-top">
          ${brand(true)}
          <span class="welcome-beta">Student workspace</span>
        </header>

        <div class="welcome-copy">
          <span class="eyebrow">Arrear management, minus the panic</span>
          <h1>Clear the backlog.<em>Keep your momentum.</em></h1>
          <p>One calm place to track every paper, study smarter with your own notes and walk into each exam knowing exactly what comes next.</p>

          <div class="welcome-features">
            <div class="welcome-feature">
              <span class="welcome-feature__icon">${icon("layers")}</span>
              <strong>Every paper, tracked</strong>
              <span>Arrears, current papers and what lies ahead.</span>
            </div>
            <div class="welcome-feature">
              <span class="welcome-feature__icon">${icon("sparkles")}</span>
              <strong>StudyAI, grounded</strong>
              <span>Answers built from the notes you upload.</span>
            </div>
            <div class="welcome-feature">
              <span class="welcome-feature__icon">${icon("compass")}</span>
              <strong>Guidance that fits</strong>
              <span>Career paths shaped by your subjects.</span>
            </div>
          </div>

          <div class="welcome-glance">
            <div class="glance-item">
              <span>Next paper</span>
              <strong><span class="dot"></span>Data Structures</strong>
            </div>
            <div class="glance-item">
              <span>Arrears tracked</span>
              <strong>3 active</strong>
            </div>
            <div class="glance-item glance-item--accent">
              <span>StudyAI</span>
              <strong>Notes indexed</strong>
            </div>
          </div>
        </div>

        <footer class="welcome-footer">
          <span>${icon("shield")} Your workspace stays private to this browser.</span>
          <span>Built for students who plan ahead.</span>
        </footer>
      </section>

      <section class="welcome-auth">
        <div class="auth-top">
          <span>Post-exam clarity, all semester.</span>
          <span class="auth-top__login">Workspace online</span>
        </div>

        <div class="auth-brand-mobile">${brand()}</div>

        <div class="auth-card">
          <div class="auth-tabs" role="tablist" aria-label="Sign in or create account">
            <button class="auth-tab${!isSignup ? " is-active" : ""}" type="button" role="tab" aria-selected="${!isSignup}" data-action="auth-mode" data-mode="signin">Sign in</button>
            <button class="auth-tab${isSignup ? " is-active" : ""}" type="button" role="tab" aria-selected="${isSignup}" data-action="auth-mode" data-mode="signup">Create account</button>
          </div>

          <div class="auth-heading">
            <h2>${isSignup ? "Start your semester <em>steady.</em>" : "Welcome <em>back.</em>"}</h2>
            <p>${isSignup ? "Set up your workspace in under a minute. No credit card, no clutter." : "Pick up where you left off — your papers, notes and reminders are waiting."}</p>
          </div>

          <form class="auth-form" id="auth-form" data-mode="${isSignup ? "signup" : "signin"}" novalidate>
            <div class="form-alert" id="auth-error" hidden>${icon("alert-triangle")}<span></span></div>

            ${isSignup ? `<div class="field">
              <label for="auth-name">Full name</label>
              <div class="input-wrap">
                <input class="input input--icon" id="auth-name" name="name" type="text" placeholder="Aarav Mehta" autocomplete="name" required />
                ${icon("user", "input-icon")}
              </div>
            </div>` : ""}

            <div class="field">
              <label for="auth-email">College email</label>
              <div class="input-wrap">
                <input class="input input--icon" id="auth-email" name="email" type="email" placeholder="you@college.edu" autocomplete="email" required />
                ${icon("mail", "input-icon")}
              </div>
            </div>

            ${isSignup
              ? passwordField("auth-password", "Create password", "At least 6 characters", "new-password")
              : passwordField("auth-password", "Password", "Enter your password", "current-password")}

            ${isSignup
              ? `<div class="signup-note">${icon("info")}<span>Your demo workspace starts with B.Tech CSE, Semester 5 sample papers and notes. You can add your own papers at any time.</span></div>`
              : `<div class="checkbox-row"><label class="checkbox-row"><input type="checkbox" name="remember" checked /> Keep me signed in</label></div>`}

            <button class="btn btn--primary btn--block auth-submit" type="submit">
              <span>${isSignup ? "Create my workspace" : "Sign in to my workspace"}</span>
              <span class="arrow">${icon("arrow-right")}</span>
            </button>
          </form>

          ${!isSignup ? `<div class="auth-divider">or explore the demo</div>
          <div class="demo-card">
            <span class="demo-card__icon">${icon("sparkles")}</span>
            <div class="demo-card__copy">
              <strong>Try the demo workspace</strong>
              <span>demo@arrear.app · demo1234</span>
            </div>
            <button class="btn" type="button" data-action="demo-login">Open</button>
          </div>` : ""}

          <div class="auth-switch">
            ${isSignup ? "Already have a workspace?" : "New to arrear?"}
            <button type="button" data-action="auth-mode" data-mode="${isSignup ? "signin" : "signup"}">${isSignup ? "Sign in" : "Create an account"}</button>
          </div>
        </div>

        <p class="auth-legal">This is a student prototype. Your account and study data are stored locally in this browser. ${isSignup ? "By creating an account you agree to keep learning." : ""}</p>
      </section>
    </main>`;
  }

  function navItem(tab, iconName, label, count, activeTab) {
    const active = activeTab === tab;
    return `<button class="nav-item${active ? " is-active" : ""}" type="button" data-action="nav" data-tab="${tab}"${active ? ' aria-current="page"' : ""}>
      ${icon(iconName)}
      <span>${label}</span>
      ${count !== null && count !== undefined ? `<span class="nav-count${tab === "alerts" && count > 0 ? " nav-count--alert" : ""}">${count}</span>` : ""}
    </button>`;
  }

  function sidebar(state, ui) {
    const courses = state.papers.filter((p) => p.type === "arrear").length;
    const alerts = state.alerts.filter((a) => a.enabled).length;
    const next = [...state.papers].filter((p) => H.daysUntil(p.examDate) >= 0).sort((a, b) => H.daysUntil(a.examDate) - H.daysUntil(b.examDate))[0];
    const nextDays = next ? H.daysUntil(next.examDate) : null;

    return `<aside class="sidebar${ui.mobileNav ? " is-open" : ""}" id="sidebar" aria-label="Primary navigation">
      <div class="sidebar__brand">${brand(true)}</div>

      <div class="workspace-switcher">
        <span class="workspace-switcher__icon">${icon("graduation")}</span>
        <div class="workspace-switcher__copy">
          <span>Registered course</span>
          <strong>${esc(state.profile.courseShort)} · Sem ${state.profile.semester}</strong>
        </div>
        ${icon("chevron-down")}
      </div>

      <nav class="sidebar__nav">
        <div class="nav-label">Workspace</div>
        ${navItem("courses", "book-open", "My courses", courses, ui.tab)}
        ${navItem("academics", "sparkles", "Academics", null, ui.tab)}
        ${navItem("alerts", "bell", "Alerts", alerts, ui.tab)}
        ${navItem("guidance", "compass", "Academic guidance", null, ui.tab)}
        ${navItem("overview", "grid", "Overall dashboard", null, ui.tab)}

        <div class="nav-label">Account</div>
        <button class="nav-item" type="button" data-action="profile-settings">${icon("user")}<span>Student profile</span></button>
        <button class="nav-item" type="button" data-action="logout">${icon("logout")}<span>Log out</span></button>
      </nav>

      <div class="sidebar__footer">
        ${next ? `<div class="sidebar-next">
          <div class="sidebar-next__top"><span>Next up</span>${icon("clock")}</div>
          <h4>${esc(next.title)}</h4>
          <div class="sidebar-next__date"><span class="dot"></span>${H.fmtDate(next.examDate, { year: true })} · ${nextDays === 0 ? "today" : `${nextDays} day${nextDays === 1 ? "" : "s"} to go`}</div>
          <button class="btn btn--block" type="button" data-action="paper-detail" data-paper-id="${next.id}">Open paper ${icon("arrow-right")}</button>
        </div>` : ""}
      </div>
    </aside>
    <div class="sidebar-scrim${ui.mobileNav ? " is-open" : ""}" data-action="close-menu"></div>`;
  }

  function topbar(state, ui) {
    const meta = TAB_META[ui.tab] || TAB_META.courses;
    return `<header class="topbar">
      <div class="topbar__left">
        <button class="icon-btn topbar__menu" type="button" data-action="open-menu" aria-label="Open navigation">${icon("menu")}</button>
        <div>
          <div class="breadcrumb">Workspace ${icon("chevron-right")} <strong>${meta.crumb}</strong></div>
          <div class="topbar__title">${meta.title}</div>
        </div>
      </div>
      <div class="topbar__right">
        <span class="date-chip">${icon("calendar")}${H.fmtToday()}</span>
        <button class="icon-btn topbar__bell" type="button" data-action="nav" data-tab="alerts" aria-label="View alerts">${icon("bell")}</button>
        <button class="profile-button" type="button" data-action="toggle-profile" aria-haspopup="menu" aria-expanded="${!!ui.profileOpen}">
          <span class="avatar">${H.initials(state.profile.name)}</span>
          <span class="profile-button__copy">
            <strong>${esc(H.firstName(state.profile.name))}</strong>
            <span>Semester ${state.profile.semester}</span>
          </span>
          ${icon("chevron-down")}
        </button>
      </div>
      ${ui.profileOpen ? `<div class="profile-popover" role="menu">
        <div class="profile-popover__head">
          <strong>${esc(state.profile.name)}</strong>
          <span>${esc(state.profile.email)}</span>
        </div>
        <button type="button" role="menuitem" data-action="nav" data-tab="overview">${icon("grid")} Academic overview</button>
        <button type="button" role="menuitem" data-action="nav" data-tab="guidance">${icon("compass")} Career guidance</button>
        <button type="button" role="menuitem" data-action="logout">${icon("logout")} Log out</button>
      </div>` : ""}
    </header>`;
  }

  function dashboard(state, ui) {
    return `<div class="app-shell">
      ${sidebar(state, ui)}
      <div class="main">
        ${topbar(state, ui)}
        <main class="content" id="page-content">
          ${ui.tab === "courses" ? courses(state, ui) : ""}
          ${ui.tab === "academics" ? window.Views.academics(state, ui) : ""}
          ${ui.tab === "alerts" ? window.Views.alerts(state, ui) : ""}
          ${ui.tab === "guidance" ? window.Views.guidance(state, ui) : ""}
          ${ui.tab === "overview" ? window.Views.overview(state, ui) : ""}
        </main>
      </div>
    </div>`;
  }

  function pageHead(eyebrow, title, description, actions = "") {
    return `<div class="page-head">
      <div class="page-head__copy">
        <span class="eyebrow">${eyebrow}</span>
        <h1>${title}</h1>
        <p>${description}</p>
      </div>
      ${actions ? `<div class="page-head__actions">${actions}</div>` : ""}
    </div>`;
  }

  function priorityBadge(paper) {
    if (paper.type === "arrear") {
      const tone = paper.priority === "High" ? "coral" : paper.priority === "Medium" ? "amber" : "neutral";
      return `<span class="badge badge--${tone}"><span class="dot"></span>${esc(paper.priority || "Medium")} priority</span>`;
    }
    if (paper.type === "current") return `<span class="badge badge--green"><span class="dot"></span>In progress</span>`;
    return `<span class="badge badge--blue"><span class="dot"></span>Upcoming</span>`;
  }

  function countdownClass(tone) {
    if (tone === "urgent") return "";
    if (tone === "soon") return " countdown--calm";
    return " countdown--safe";
  }

  function paperCard(state, paper) {
    const date = H.parseDate(paper.examDate);
    const cd = H.countdownText(paper.examDate);
    const color = H.paperColor(paper);
    const alert = state.alerts.find((a) => a.paperId === paper.id);
    const meta = [];
    meta.push(`<span>${icon("layers")}${paper.credits} credits</span>`);
    if (paper.type === "arrear") meta.push(`<span>${icon("refresh")}Attempt ${paper.attempt || 1}</span>`);
    if (paper.type === "current") {
      if (paper.internal !== undefined) meta.push(`<span>${icon("target")}Internal ${paper.internal}/30</span>`);
      if (paper.attendance !== undefined) meta.push(`<span>${icon("check-circle")}${paper.attendance}% attendance</span>`);
    }
    if (paper.type === "upcoming" && paper.registrationDate) meta.push(`<span>${icon("calendar")}Registration open</span>`);

    const progressLabel = paper.type === "arrear" ? "Syllabus revised" : paper.type === "current" ? "Syllabus covered" : "Prep started";

    return `<article class="paper-card" style="--paper-color:${color}">
      <div class="paper-card__head">
        <span class="code-tag">${esc(paper.code)}</span>
        ${priorityBadge(paper)}
      </div>
      <h3>${esc(paper.title)}</h3>
      <div class="paper-card__meta">${meta.join("")}</div>
      <div class="exam-row">
        <div class="date-tile"><strong>${date ? date.getDate() : "—"}</strong><span>${date ? date.toLocaleDateString("en-GB", { month: "short" }) : "—"}</span></div>
        <div class="exam-row__copy">
          <strong>${esc(paper.examTime || "Time TBA")}</strong>
          <span>${esc(paper.venue || "Venue to be announced")}</span>
        </div>
        <span class="countdown${countdownClass(cd.tone)}">${icon("clock")}${cd.text}</span>
      </div>
      <div class="paper-progress">
        <div class="paper-progress__label"><span>${progressLabel}</span><strong>${paper.progress || 0}%</strong></div>
        <div class="progress-track"><div class="progress-fill" style="width:${Math.max(0, Math.min(100, paper.progress || 0))}%"></div></div>
      </div>
      <div class="paper-card__foot">
        <button class="btn btn--outline btn--sm" type="button" data-action="paper-detail" data-paper-id="${paper.id}">View details ${icon("arrow-right")}</button>
        <button class="icon-btn${alert && alert.enabled ? " is-set" : ""}" type="button" data-action="alert-paper" data-paper-id="${paper.id}" aria-label="${alert ? "Edit reminder" : "Set reminder"}">${icon("bell")}</button>
      </div>
    </article>`;
  }

  function courses(state, ui) {
    const tabs = [
      { id: "arrear", label: "Old arrears", papers: state.papers.filter((p) => p.type === "arrear") },
      { id: "current", label: "Current papers", papers: state.papers.filter((p) => p.type === "current") },
      { id: "upcoming", label: "Upcoming papers", papers: state.papers.filter((p) => p.type === "upcoming") },
    ];
    const selected = tabs.find((tab) => tab.id === ui.courseTab) || tabs[0];
    const nextArrear = [...tabs[0].papers].sort((a, b) => H.daysUntil(a.examDate) - H.daysUntil(b.examDate))[0];
    const nextDays = nextArrear ? H.daysUntil(nextArrear.examDate) : null;
    const clearedCount = state.records.filter((r) => r.status === "Cleared").length;
    const introMap = {
      arrear: {
        title: "Clear one paper at a time.",
        text: "These are your open backlogs. Start with the nearest exam and use the notes and reminders to keep momentum.",
      },
      current: {
        title: "The semester you're in.",
        text: "Your registered papers, internal marks and attendance — all in one view.",
      },
      upcoming: {
        title: "A head start on next semester.",
        text: "Nothing to panic about yet. Build a light revision rhythm before these papers arrive.",
      },
    };
    const intro = introMap[selected.id];

    return `${pageHead(
      "My courses",
      "Your semester, <em>at a glance.</em>",
      "Every paper in one calm view — what needs clearing, what you're studying now and what comes next.",
      `<button class="btn btn--primary" type="button" data-action="add-paper">${icon("plus")} Add paper</button>`
    )}

    <section class="program-card">
      <div class="program-card__main">
        <span class="eyebrow eyebrow--light">Registered course</span>
        <h2>${esc(state.profile.courseShort)} <span>· Semester ${state.profile.semester}</span> <span class="badge">Active</span></h2>
        <div class="program-card__meta">
          <span>${icon("calendar")}Academic year ${esc(state.profile.academicYear)}</span>
          <span>${icon("graduation")}Section ${esc(state.profile.section)}</span>
          <span>${icon("award")}${state.profile.creditsEarned} / ${state.profile.creditsTotal} credits earned</span>
        </div>
      </div>
      <div class="program-card__stats">
        <div class="program-stat"><strong>${tabs[0].papers.length.toString().padStart(2, "0")}</strong><span>Arrears</span></div>
        <div class="program-stat"><strong>${Number(state.profile.cgpa).toFixed(2)}</strong><span>CGPA</span></div>
        <div class="program-stat program-stat--accent"><strong>${nextDays === null ? "—" : nextDays + "d"}</strong><span>Next exam</span></div>
      </div>
    </section>

    <div class="course-toolbar">
      <div class="segmented" role="tablist" aria-label="Course paper types">
        ${tabs.map((tab) => `<button type="button" role="tab" aria-selected="${tab.id === selected.id}" class="${tab.id === selected.id ? "is-active" : ""}" data-action="course-tab" data-course-tab="${tab.id}">${tab.label}<span>${tab.papers.length}</span></button>`).join("")}
      </div>
      <div class="course-toolbar__hint">${icon("check-circle")}${clearedCount} papers cleared so far</div>
    </div>

    <div class="section-head">
      <div>
        <h2>${intro.title}</h2>
        <p>${intro.text}</p>
      </div>
      ${selected.id === "arrear" && nextArrear ? `<button class="section-head__link" type="button" data-action="paper-detail" data-paper-id="${nextArrear.id}">Start with ${esc(nextArrear.code)} ${icon("arrow-right")}</button>` : ""}
    </div>

    ${selected.papers.length
      ? `<div class="paper-grid">${selected.papers.map((paper) => paperCard(state, paper)).join("")}</div>`
      : `<div class="course-empty">
          <span class="course-empty__icon">${icon("check-circle")}</span>
          <h3>${selected.id === "arrear" ? "No arrears left. That's worth celebrating." : "Nothing here yet."}</h3>
          <p>${selected.id === "arrear" ? "You've cleared every backlog paper in this workspace. Add another paper if your records need updating." : "Add a paper to start tracking dates, notes and reminders for it."}</p>
          <button class="btn btn--primary btn--sm" type="button" data-action="add-paper">${icon("plus")} Add paper</button>
        </div>`}`;
  }

  window.Views = {
    welcome,
    dashboard,
    courses,
    pageHead,
    priorityBadge,
    TAB_META,
  };
})();
