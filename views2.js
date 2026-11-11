/* Application views — academics, alerts, guidance, overview and modals */
(function () {
  const H = window.H;
  const icon = H.icon;
  const esc = H.esc;
  const pageHead = window.Views.pageHead;

  /* =========================================================
     Academics
     ========================================================= */
  function selectedCurrentPaper(state, ui) {
    const papers = state.papers.filter((p) => p.type === "current");
    return papers.find((p) => p.id === ui.studyPaperId) || papers[0] || null;
  }

  function renderMessage(message) {
    const assistant = message.role === "assistant";
    const sources = (message.sources || []).filter(Boolean);
    return `<div class="chat-message${assistant ? "" : " chat-message--user"}">
      <span class="chat-message__avatar">${icon(assistant ? "sparkles" : "user")}</span>
      <div class="chat-message__body">
        <div class="chat-bubble">${assistant ? '<span class="chat-label">StudyAI</span>' : ""}${assistant ? H.markdown(message.text) : esc(message.text).replace(/\n/g, "<br>")}</div>
        ${sources.length ? `<div class="chat-sources">${sources.map((source) => `<button class="chat-source" type="button" data-action="preview-note" data-note-id="${source.id}">${icon("file")}${esc(source.title.length > 36 ? source.title.slice(0, 36) + "…" : source.title)}</button>`).join("")}</div>` : ""}
        ${assistant && message.confidence ? `<div class="chat-meta">${icon("shield")}${esc(message.confidence)} · grounded in your notes</div>` : ""}
      </div>
    </div>`;
  }

  function academics(state, ui) {
    const current = state.papers.filter((p) => p.type === "current").sort((a, b) => H.daysUntil(a.examDate) - H.daysUntil(b.examDate));
    const paper = selectedCurrentPaper(state, ui);

    if (!paper) {
      return `${pageHead(
        "Academics",
        "A quieter place to <em>study.</em>",
        "Upload notes and ask questions without leaving your course context.",
        `<button class="btn btn--primary" type="button" data-action="add-paper">${icon("plus")} Add current paper</button>`
      )}
      <div class="course-empty">
        <span class="course-empty__icon">${icon("book-open")}</span>
        <h3>Add a current paper to open your study desk.</h3>
        <p>Once you add a paper, you can upload notes and use StudyAI to revise from them.</p>
        <button class="btn btn--primary btn--sm" type="button" data-action="add-paper">${icon("plus")} Add current paper</button>
      </div>`;
    }

    const notes = state.notes.filter((note) => note.paperId === paper.id);
    const messages = state.chats[paper.id] || [];
    const pending = ui.pendingChat === paper.id;
    const promptOptions = (paper.prompts && paper.prompts.length
      ? paper.prompts
      : ["Summarise the key ideas in my notes", "What are the most exam-worthy points?", "Ask me a practice question on this paper"]).slice(0, 3);
    const notifPaper = state.alerts.find((a) => a.paperId === paper.id);

    const greeting = `<div class="chat-message">
      <span class="chat-message__avatar">${icon("sparkles")}</span>
      <div class="chat-message__body">
        <div class="chat-bubble"><span class="chat-label">StudyAI</span>Hi ${esc(H.firstName(state.profile.name))} — I've indexed <strong>${notes.length} note${notes.length === 1 ? "" : "s"}</strong> for ${esc(paper.title)}. Ask me a concept, a comparison or a revision question. I'll answer only from your material and show the source.</div>
      </div>
    </div>`;

    return `${pageHead(
      "Academics",
      "Ask anything. <em>Cite everything.</em>",
      "Your current papers, your own notes and a study assistant that stays close to the syllabus.",
      `<button class="btn btn--outline" type="button" data-action="upload-note" data-paper-id="${paper.id}">${icon("upload")} Upload notes</button>`
    )}

    <div class="academics-layout">
      <aside class="course-rail" aria-label="Current papers">
        <div class="course-rail__head"><span>Current papers</span><strong>${current.length}</strong></div>
        ${current.map((item) => {
          const count = state.notes.filter((note) => note.paperId === item.id).length;
          return `<button class="rail-paper${item.id === paper.id ? " is-active" : ""}" type="button" data-action="select-paper" data-paper-id="${item.id}">
            <div class="rail-paper__top"><span class="rail-paper__code">${esc(item.code)}</span><span class="rail-paper__count">${icon("file")}${count}</span></div>
            <strong>${esc(item.title)}</strong>
            <div class="rail-paper__exam"><span class="dot"></span>${H.fmtDate(item.examDate)} · ${H.countdownText(item.examDate).text}</div>
          </button>`;
        }).join("")}
        <div class="rail-tip">
          <div class="rail-tip__head">${icon("lightbulb")} A better question</div>
          <p>Ask for a comparison or an example. “Paging vs segmentation” gets a sharper answer than “explain memory”.</p>
        </div>
      </aside>

      <section class="study-area">
        <div class="study-hero">
          <div class="study-hero__main">
            <span class="study-hero__icon">${icon("book-open")}</span>
            <div>
              <h2>${esc(paper.title)}</h2>
              <div class="study-hero__meta">
                <span class="code-tag">${esc(paper.code)}</span>
                <span>${paper.credits} credits</span>
                <span class="dot"></span>
                <span>${icon("calendar")}${H.fmtDate(paper.examDate, { year: true })}</span>
                <span class="dot"></span>
                <span>${icon("clock")}${H.countdownText(paper.examDate).text}</span>
              </div>
            </div>
          </div>
          <div class="study-hero__actions">
            <button class="btn btn--outline btn--sm" type="button" data-action="alert-paper" data-paper-id="${paper.id}">${icon("bell")} ${notifPaper ? "Edit reminder" : "Set reminder"}</button>
            <button class="btn btn--lime btn--sm" type="button" data-action="upload-note" data-paper-id="${paper.id}">${icon("plus")} Add note</button>
          </div>
        </div>

        <div class="study-grid">
          <section class="notes-panel">
            <div class="panel-head">
              <div><h3>Your notes</h3><p>Files and revision material for this paper</p></div>
              <span class="panel-head__count">${notes.length}</span>
            </div>
            <button class="upload-zone" type="button" data-action="upload-note" data-paper-id="${paper.id}">
              <span class="upload-zone__icon">${icon("upload")}</span>
              <span><strong>Upload a note</strong><span>PDF, Markdown or TXT · up to 4 MB</span></span>
            </button>

            ${notes.length ? `<div class="notes-list">
              ${notes.map((note) => `<div class="note-card">
                <button class="note-card__open" type="button" data-action="preview-note" data-note-id="${note.id}">
                  <span class="note-type note-type--${esc(note.fileType)}">${H.noteTypeLabel(note.fileType)}</span>
                  <span class="note-card__copy">
                    <strong>${esc(note.title)}</strong>
                    <span>${esc(note.fileName)} · ${note.pages || "—"} pages</span>
                    <span class="note-tags">${(note.tags || []).slice(0, 3).map((tag) => `<span>${esc(tag)}</span>`).join("")}</span>
                  </span>
                </button>
                <button class="note-card__del" type="button" data-action="delete-note" data-note-id="${note.id}" aria-label="Delete note">${icon("trash")}</button>
              </div>`).join("")}
            </div>` : `<div class="notes-empty">
              <span class="notes-empty__icon">${icon("file-text")}</span>
              <h4>No notes for this paper yet</h4>
              <p>Upload your class notes or a revision sheet. StudyAI will use them as its only source.</p>
            </div>`}

            <div class="notes-panel__foot">${icon("shield")} Your notes never leave this browser.</div>
          </section>

          <section class="ai-panel" aria-label="StudyAI tutor">
            <div class="ai-panel__head">
              <div class="ai-identity">
                <span class="ai-orb">${icon("sparkles")}</span>
                <div><strong>StudyAI <span class="badge badge--lime">Beta</span></strong><span>Grounded in ${notes.length} note${notes.length === 1 ? "" : "s"} · ${esc(paper.code)}</span></div>
              </div>
              <button class="icon-btn icon-btn--dark" type="button" data-action="reset-chat" data-paper-id="${paper.id}" aria-label="Start a new conversation" title="New conversation">${icon("rotate-ccw")}</button>
            </div>

            <div class="ai-messages" id="ai-messages">
              ${greeting}
              ${messages.map(renderMessage).join("")}
              ${pending ? `<div class="chat-message">
                <span class="chat-message__avatar">${icon("sparkles")}</span>
                <div class="chat-message__body"><div class="chat-bubble"><span class="chat-label">StudyAI</span><span class="typing"><i></i><i></i><i></i></span></div></div>
              </div>` : ""}
            </div>

            ${!pending && messages.length < 3 ? `<div class="ai-prompts">
              ${promptOptions.map((prompt) => `<button class="prompt-chip" type="button" data-action="ask-prompt" data-prompt="${esc(prompt)}">${esc(prompt)}</button>`).join("")}
            </div>` : ""}

            <form class="ai-compose" id="ai-form" data-paper-id="${paper.id}">
              <div class="ai-compose__box">
                <textarea id="ai-input" name="question" rows="1" placeholder="Ask about this paper…" aria-label="Ask StudyAI a question"${pending ? " disabled" : ""}></textarea>
                <button class="ai-send" type="submit" aria-label="Send question"${pending ? " disabled" : ""}>${icon("send")}</button>
              </div>
              <div class="ai-disclaimer">${icon("info")} AI answers are pulled from your notes. Always verify with your syllabus.</div>
            </form>
          </section>
        </div>
      </section>
    </div>`;
  }

  /* =========================================================
     Alerts
     ========================================================= */
  function alerts(state, ui) {
    const papers = [...state.papers].sort((a, b) => H.daysUntil(a.examDate) - H.daysUntil(b.examDate));
    const upcoming = papers.filter((p) => H.daysUntil(p.examDate) >= 0);
    const next = upcoming[0] || null;
    const enabled = state.alerts.filter((a) => a.enabled);
    const supported = typeof window.Notification !== "undefined";
    const permission = supported ? Notification.permission : "unsupported";

    return `${pageHead(
      "Alerts",
      "Never miss a <em>deadline.</em>",
      "Set gentle reminders for upcoming papers and keep the next few weeks visible.",
      `<button class="btn btn--outline" type="button" data-action="enable-notifications">${icon("bell")} Enable browser alerts</button>
       <button class="btn btn--primary" type="button" data-action="new-alert">${icon("plus")} New reminder</button>`
    )}

    <div class="alert-stats">
      <div class="mini-stat">
        <span class="mini-stat__icon mini-stat__icon--lime">${icon("bell")}</span>
        <div><strong>${enabled.length}</strong><span>Active reminders</span></div>
      </div>
      <div class="mini-stat">
        <span class="mini-stat__icon mini-stat__icon--coral">${icon("clock")}</span>
        <div><strong>${next ? `${H.daysUntil(next.examDate)} days` : "—"}</strong><span>Until ${next ? esc(next.code) : "next exam"}</span></div>
      </div>
      <div class="mini-stat">
        <span class="mini-stat__icon">${icon("shield")}</span>
        <div><strong>${permission === "granted" ? "On" : supported ? "Off" : "N/A"}</strong><span>Browser notifications</span></div>
      </div>
    </div>

    <div class="alerts-layout">
      <section class="alerts-panel">
        <div class="alerts-panel__head">
          <div><h2>Upcoming paper reminders</h2><p>Reminders you can actually act on — not a wall of noise.</p></div>
          <button class="btn btn--outline btn--sm" type="button" data-action="new-alert">${icon("plus")} Add</button>
        </div>

        ${papers.length ? `<div class="alert-list">
          ${papers.map((paper) => {
            const alert = state.alerts.find((item) => item.paperId === paper.id);
            const date = H.parseDate(paper.examDate);
            const days = H.daysUntil(paper.examDate);
            return `<div class="alert-row">
              <div class="alert-row__date"><strong>${date ? date.getDate() : "—"}</strong><span>${date ? date.toLocaleDateString("en-GB", { month: "short" }) : "—"}</span></div>
              <div class="alert-row__copy">
                <strong>${esc(paper.title)}</strong>
                <span>
                  <b>${esc(paper.code)}</b>
                  <span class="dot"></span>
                  ${days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}
                  <span class="dot"></span>
                  ${alert ? `<span class="reminder-pill">${icon("bell")}${alert.enabled ? H.alertLeadLabel(alert.leadDays) + " · " + (alert.channel === "email" ? "Email" : "In-app") : "Reminder off"}</span>` : `<span class="reminder-pill">${icon("bell")}No reminder</span>`}
                </span>
              </div>
              <div class="alert-row__controls">
                <label class="switch" title="${alert && alert.enabled ? "Turn reminder off" : "Turn reminder on"}">
                  <input type="checkbox" data-toggle-alert data-paper-id="${paper.id}"${alert && alert.enabled ? " checked" : ""} aria-label="Toggle reminder for ${esc(paper.title)}" />
                  <span></span>
                </label>
                <button class="alert-row__edit" type="button" data-action="alert-paper" data-paper-id="${paper.id}" aria-label="Edit reminder for ${esc(paper.title)}">${icon("edit")}</button>
              </div>
            </div>`;
          }).join("")}
        </div>` : `<div class="alerts-empty"><span class="alerts-empty__icon">${icon("check-circle")}</span><h3>No papers to remind you about.</h3><p>Add a paper to your workspace and set a reminder from here.</p><button class="btn btn--primary btn--sm" type="button" data-action="add-paper">${icon("plus")} Add paper</button></div>`}
      </section>

      <aside class="alerts-side">
        <div class="side-card side-card--dark">
          <div class="side-card__head">${icon("clock")}<strong>Deadline pulse</strong></div>
          <div class="deadline-stack">
            ${upcoming.slice(0, 3).map((paper) => {
              const days = H.daysUntil(paper.examDate);
              const tone = days <= 7 ? "coral" : days <= 21 ? "" : "muted";
              return `<div class="deadline-item">
                <span class="deadline-item__bar${tone === "coral" ? " deadline-item__bar--coral" : tone === "muted" ? " deadline-item__bar--muted" : ""}"></span>
                <div class="deadline-item__copy"><strong>${esc(paper.title)}</strong><span>${esc(paper.code)} · ${H.fmtDate(paper.examDate, { year: true })}</span></div>
                <span class="deadline-item__days${tone === "coral" ? " deadline-item__days--coral" : tone === "muted" ? " deadline-item__days--muted" : ""}">${days === 0 ? "today" : days + "d"}</span>
              </div>`;
            }).join("") || `<p class="muted" style="color:rgba(255,255,255,.4);font-size:9px">No upcoming exams.</p>`}
          </div>
        </div>

        <div class="side-card notification-card">
          <div class="side-card__head">${icon("bell")}<strong>Browser reminders</strong></div>
          <p>Get a quiet nudge even when this tab is closed. You control the timing of every reminder.</p>
          <div class="notification-status"><span class="dot"></span>${permission === "granted" ? "Browser notifications are enabled on this device." : permission === "denied" ? "Notifications are blocked in browser settings." : supported ? "Notifications are not enabled yet." : "This browser doesn't support notifications."}</div>
          ${permission !== "granted" ? `<button class="btn btn--outline btn--sm" type="button" data-action="enable-notifications"${!supported || permission === "denied" ? " disabled" : ""}>${icon("bell")} ${permission === "denied" ? "Blocked in settings" : "Enable notifications"}</button>` : ""}
        </div>

        <div class="side-card">
          <div class="side-card__head">${icon("lightbulb")}<strong>A useful rule</strong></div>
          <div class="alert-tip" style="margin-top:9px;padding:0;background:transparent">${icon("info")}<span>Set one reminder 7 days before an exam for revision planning, and a second 1 day before for logistics. More alerts rarely mean more prepared.</span></div>
        </div>
      </aside>
    </div>`;
  }

  /* =========================================================
     Academic guidance
     ========================================================= */
  function strengthsFor(state) {
    const weights = {};
    state.papers.forEach((paper) => (paper.tags || []).forEach((tag) => { weights[tag] = (weights[tag] || 0) + (paper.credits || 3); }));
    return [
      { label: "Problem solving", tag: "programming" },
      { label: "Systems thinking", tag: "systems" },
      { label: "Data & modelling", tag: "databases" },
      { label: "Communication", tag: "management" },
    ].map((item) => ({ ...item, value: Math.max(58, Math.min(94, 55 + (weights[item.tag] || 0) * 3)) }));
  }

  function guidance(state, ui) {
    const interests = (state.preferences && state.preferences.interests) || [];
    const careers = window.ArrearData.careers
      .map((career) => ({ ...career, match: window.ArrearData.careerMatch(career, state.papers, interests) }))
      .sort((a, b) => b.match - a.match);
    const top = careers[0];
    const runnerUp = careers[1];
    const strengths = strengthsFor(state);
    const categoryLabels = {
      software: "Software & systems",
      data: "Data & AI",
      cloud: "Cloud & infrastructure",
      security: "Security & networks",
    };

    return `${pageHead(
      "Academic guidance",
      "Your subjects are already <em>pointing somewhere.</em>",
      "Career directions shaped by the papers in your registered course — plus what to build next.",
      `<button class="btn btn--outline" type="button" data-action="nav" data-tab="overview">${icon("grid")} View exam history</button>`
    )}

    <section class="guidance-hero">
      <div class="guidance-hero__copy">
        <span class="eyebrow eyebrow--dark">${icon("compass")} Based on your registered course</span>
        <h2>Your subject mix points toward <em>${esc(top.title)}</em>${runnerUp ? ` and ${esc(runnerUp.title)}` : ""}.</h2>
        <p>We weighted every active paper in ${esc(state.profile.courseShort)} Semester ${state.profile.semester} against the skills each path uses. Tap your interests to refine the picture — the guidance updates instantly.</p>
        <div class="interest-row">
          <span>I enjoy</span>
          ${window.ArrearData.interests.map((interest) => `<button class="interest-chip${interests.includes(interest.id) ? " is-active" : ""}" type="button" data-action="toggle-interest" data-interest="${interest.id}">${icon(interest.icon)}${esc(interest.label)}</button>`).join("")}
        </div>
      </div>
      <div class="guidance-hero__side">
        <div class="profile-line"><span>Course</span><strong>${esc(state.profile.courseShort)}</strong></div>
        <div class="profile-line"><span>Active subject mix</span><strong>${state.papers.length} papers</strong></div>
        <div class="profile-line"><span>Strongest signal</span><strong>${esc(categoryLabels[top.category] || "Software & systems")}</strong></div>
        <div class="top-match">
          <span class="top-match__score">${top.match}%</span>
          <div><strong>${esc(top.title)}</strong><span>Your strongest current match</span></div>
        </div>
      </div>
    </section>

    <div class="section-head">
      <div><h2>Career matches</h2><p>Ranked by overlap with your papers and selected interests.</p></div>
      <span class="badge badge--neutral">${careers.length} paths explored</span>
    </div>

    <div class="career-grid">
      ${careers.map((career, index) => `<article class="career-card" style="animation-delay:${Math.min(index * 45, 180)}ms">
        <div class="career-card__top">
          <span class="career-icon">${icon(career.icon)}</span>
          <span class="match-pill"><span class="dot"></span>${career.match}% match</span>
        </div>
        <h3>${esc(career.title)}</h3>
        <p class="career-card__tagline">${esc(career.tagline)}</p>
        <div class="career-skill-list">${career.skills.slice(0, 4).map((skill) => `<span>${esc(skill)}</span>`).join("")}</div>
        <div class="career-match-bar">
          <div class="career-match-bar__label"><span>Subject fit</span><strong>${career.match}%</strong></div>
          <div class="career-match-bar__track"><div class="career-match-bar__fill" style="width:${career.match}%"></div></div>
        </div>
        <div class="career-card__foot">
          <span class="career-card__demand"><span class="dot"></span>${esc(career.demand)} demand</span>
          <button class="career-card__link" type="button" data-action="career-detail" data-career-id="${career.id}">Explore path ${icon("arrow-up-right")}</button>
        </div>
      </article>`).join("")}
    </div>

    <div class="guidance-bottom">
      <section class="strength-card">
        <div class="section-head" style="margin:0"><div><h2>Your subject strengths</h2><p>What your current paper mix is already building.</p></div>${icon("chart")}</div>
        <div class="strength-list">
          ${strengths.map((item) => `<div class="strength-row"><span>${esc(item.label)}</span><div class="strength-track"><i style="width:${item.value}%"></i></div><strong>${item.value}</strong></div>`).join("")}
        </div>
      </section>

      <section class="plan-card">
        <span class="eyebrow">A practical head start</span>
        <h3>Your next 90 days</h3>
        <div class="plan-list">
          ${top.roadmap.map((step, index) => `<div class="plan-step"><span class="plan-step__num">0${index + 1}</span><div><strong>${esc(step)}</strong><span>${index === 0 ? "Start this month" : index === 1 ? "While this semester runs" : "Build after exams"}</span></div></div>`).join("")}
        </div>
      </section>
    </div>`;
  }

  /* =========================================================
     Overall dashboard
     ========================================================= */
  function semesterScores(state) {
    const current = Math.max(5, Math.min(9.8, Number(state.profile.cgpa) || 7.8));
    const offsets = [-0.72, -0.48, -0.24, 0.04, 0.2];
    const currentSemester = Number(state.profile.semester) || 5;
    const start = Math.max(1, currentSemester - 4);
    return offsets.map((offset, index) => ({
      label: `Sem ${start + index}`,
      score: Math.max(6.4, Math.min(9.8, current + offset)),
    }));
  }

  function combinedRecords(state) {
    const paperRows = state.papers.map((paper) => ({
      id: paper.id,
      code: paper.code,
      title: paper.title,
      semester: paper.semester,
      examDate: paper.examDate,
      kind: paper.type,
      status: paper.type === "arrear" ? "Pending" : paper.type === "current" ? "In progress" : "Scheduled",
      raw: paper,
    }));
    return [...paperRows, ...state.records.map((record) => ({ ...record, kind: "cleared", raw: record }))];
  }

  function sortRecords(rows) {
    return [...rows].sort((a, b) => {
      const aDays = H.daysUntil(a.examDate);
      const bDays = H.daysUntil(b.examDate);
      const aFuture = aDays >= 0;
      const bFuture = bDays >= 0;
      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;
      if (aFuture && bFuture) return aDays - bDays;
      return new Date(b.examDate) - new Date(a.examDate);
    });
  }

  const TYPE_META = {
    arrear: { label: "Arrear", className: "coral" },
    current: { label: "Current", className: "green" },
    upcoming: { label: "Upcoming", className: "blue" },
    cleared: { label: "Cleared", className: "neutral" },
  };

  function overview(state, ui) {
    const arrears = state.papers.filter((p) => p.type === "arrear");
    const current = state.papers.filter((p) => p.type === "current");
    const upcoming = state.papers.filter((p) => p.type === "upcoming");
    const next = [...state.papers].filter((p) => H.daysUntil(p.examDate) >= 0).sort((a, b) => H.daysUntil(a.examDate) - H.daysUntil(b.examDate))[0];
    const cleared = state.records.filter((record) => record.status === "Cleared").length;
    const clearanceRate = Math.round((cleared / Math.max(1, cleared + arrears.length)) * 100);
    const scores = semesterScores(state);
    const rows = combinedRecords(state);
    const filters = [
      { id: "all", label: "All records" },
      { id: "arrear", label: "Arrears" },
      { id: "current", label: "Current" },
      { id: "upcoming", label: "Upcoming" },
      { id: "cleared", label: "Cleared" },
    ];
    const activeFilter = filters.some((filter) => filter.id === ui.recordFilter) ? ui.recordFilter : "all";
    const filtered = sortRecords(activeFilter === "all" ? rows : rows.filter((row) => row.kind === activeFilter));
    const timeline = sortRecords(state.papers.map((paper) => ({ ...paper, kind: paper.type }))).filter((paper) => H.daysUntil(paper.examDate) >= 0).slice(0, 5);

    return `${pageHead(
      "Overall dashboard",
      "Everything, <em>in one place.</em>",
      "A complete view of cleared papers, active backlogs, current semester work and every upcoming date.",
      `<button class="btn btn--outline" type="button" data-action="download-records">${icon("download")} Export records</button>
       <button class="btn btn--primary" type="button" data-action="nav" data-tab="courses">${icon("book-open")} Manage papers</button>`
    )}

    <div class="kpi-grid">
      <article class="kpi-card kpi-card--accent">
        <div class="kpi-card__top"><span class="kpi-card__label">Active arrears</span><span class="kpi-card__icon">${icon("alert-triangle")}</span></div>
        <div class="kpi-card__value"><strong>${String(arrears.length).padStart(2, "0")}</strong><span>papers to clear</span></div>
        <div class="kpi-card__foot">${icon("layers")}<strong>${arrears.reduce((sum, p) => sum + p.credits, 0)} credits</strong>&nbsp;at stake</div>
      </article>
      <article class="kpi-card">
        <div class="kpi-card__top"><span class="kpi-card__label">Current semester</span><span class="kpi-card__icon">${icon("book-open")}</span></div>
        <div class="kpi-card__value"><strong>${String(current.length).padStart(2, "0")}</strong><span>registered papers</span></div>
        <div class="kpi-card__foot">${icon("check-circle")}<strong>${cleared}</strong>&nbsp;papers cleared so far</div>
      </article>
      <article class="kpi-card">
        <div class="kpi-card__top"><span class="kpi-card__label">Next exam</span><span class="kpi-card__icon">${icon("clock")}</span></div>
        <div class="kpi-card__value"><strong>${next ? `${H.daysUntil(next.examDate)}d` : "—"}</strong><span>${next ? esc(next.code) + " · " + H.fmtDate(next.examDate) : "nothing scheduled"}</span></div>
        <div class="kpi-card__foot">${icon("calendar")}${upcoming.length} upcoming papers</div>
      </article>
      <article class="kpi-card">
        <div class="kpi-card__top"><span class="kpi-card__label">Cumulative GPA</span><span class="kpi-card__icon">${icon("award")}</span></div>
        <div class="kpi-card__value"><strong>${Number(state.profile.cgpa).toFixed(2)}</strong><span>/ 10.00</span></div>
        <div class="kpi-card__foot">${icon("trending-up")}<strong>${state.profile.creditsEarned}</strong>&nbsp;of ${state.profile.creditsTotal} credits</div>
      </article>
    </div>

    <div class="overview-grid">
      <section class="overview-card">
        <div class="overview-card__head">
          <div><h3>Semester performance</h3><p>SGPA trend across your recent semesters.</p></div>
          <span class="badge badge--green">${icon("trending-up")} Trending up</span>
        </div>
        <div class="chart-wrap">
          <div class="chart-grid"><i></i><i></i><i></i><i></i></div>
          <div class="chart-bars">
            ${scores.map((item) => `<div class="chart-bar">
              <span class="chart-bar__value">${item.score.toFixed(1)}</span>
              <div class="chart-bar__column" style="height:${Math.max(16, ((item.score - 6) / 3.8) * 100)}%"></div>
              <span class="chart-bar__label">${item.label}</span>
            </div>`).join("")}
          </div>
        </div>
      </section>

      <section class="overview-card">
        <div class="overview-card__head"><div><h3>Backlog clearance</h3><p>Across all recorded papers.</p></div></div>
        <div class="donut-wrap">
          <div class="donut" style="--value:${clearanceRate}">
            <div class="donut__center"><strong>${clearanceRate}%</strong><span>cleared</span></div>
          </div>
        </div>
        <div class="donut-legend"><span><i></i>${cleared} cleared</span><span><i></i>${arrears.length} active</span></div>
      </section>

      <section class="overview-card overview-card--timeline">
        <div class="overview-card__head"><div><h3>Next on your calendar</h3><p>The nearest papers, in order.</p></div></div>
        <div class="timeline-list">
          ${timeline.map((paper) => {
            const date = H.parseDate(paper.examDate);
            return `<div class="timeline-item">
              <div class="timeline-item__date"><strong>${date ? date.getDate() : "—"}</strong>${date ? date.toLocaleDateString("en-GB", { month: "short" }) : "—"}</div>
              <div class="timeline-item__copy"><strong>${esc(paper.title)}</strong><span>${esc(paper.code)} · ${esc(paper.type)}</span></div>
              <span class="timeline-item__days">${H.countdownText(paper.examDate).text}</span>
            </div>`;
          }).join("") || `<p class="muted" style="font-size:9px">No upcoming exams.</p>`}
        </div>
      </section>
    </div>

    <section class="records-card">
      <div class="records-head">
        <div><h3>All exam records</h3><p>Old results, current papers and upcoming schedules from your registered course.</p></div>
        <div class="filter-chips" role="tablist" aria-label="Filter exam records">
          ${filters.map((filter) => `<button type="button" role="tab" aria-selected="${filter.id === activeFilter}" class="${filter.id === activeFilter ? "is-active" : ""}" data-action="record-filter" data-filter="${filter.id}">${filter.label}</button>`).join("")}
        </div>
      </div>
      <div class="table-wrap">
        <table class="records-table">
          <thead><tr><th>Subject</th><th>Code</th><th>Type</th><th>Exam date</th><th>Status</th><th>Result</th></tr></thead>
          <tbody>
            ${filtered.length ? filtered.map((row) => {
              const type = TYPE_META[row.kind] || TYPE_META.cleared;
              const result = row.kind === "cleared"
                ? `<span class="grade">${esc(row.grade)}</span>${row.marks ? ` <span class="muted" style="font-size:8px;margin-left:3px">${row.marks}/100</span>` : ""}`
                : row.kind === "arrear"
                  ? `<span class="grade grade--pending">Attempt ${row.raw?.attempt || 1}</span>`
                  : `<span class="grade grade--pending">—</span>`;
              return `<tr>
                <td><strong>${esc(row.title)}</strong></td>
                <td><span class="code-tag">${esc(row.code)}</span></td>
                <td><span class="badge badge--${type.className}">${type.label}</span></td>
                <td class="table-date">${H.fmtDate(row.examDate, { year: true })}</td>
                <td>${row.kind === "cleared" ? `<span class="badge badge--green">${icon("check")}Cleared</span>` : row.kind === "arrear" ? `<span class="badge badge--amber">${icon("alert-triangle")}Pending</span>` : row.kind === "current" ? `<span class="badge badge--blue">In progress</span>` : `<span class="badge badge--neutral">Scheduled</span>`}</td>
                <td>${result}</td>
              </tr>`;
            }).join("") : `<tr><td colspan="6" class="table-empty">No records in this filter yet.</td></tr>`}
          </tbody>
        </table>
      </div>
      <div class="records-foot">
        <span>${filtered.length} record${filtered.length === 1 ? "" : "s"} shown · Academic year ${esc(state.profile.academicYear)}</span>
        <button class="btn btn--outline btn--sm" type="button" data-action="download-records">${icon("download")} Download CSV</button>
      </div>
    </section>`;
  }

  /* =========================================================
     Modals
     ========================================================= */
  function modalHead(eyebrow, title, subtitle) {
    return `<div class="modal__head">
      <div><span class="eyebrow">${eyebrow}</span><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ""}</div>
      <button class="modal__close" type="button" data-modal-close aria-label="Close dialog">${icon("close")}</button>
    </div>`;
  }

  function paperModal(state, paper) {
    const alert = state.alerts.find((item) => item.paperId === paper.id);
    const notes = state.notes.filter((note) => note.paperId === paper.id);
    const date = H.parseDate(paper.examDate);
    const typeLabel = paper.type === "arrear" ? `Arrear · attempt ${paper.attempt || 1}` : paper.type === "current" ? "Current paper" : "Upcoming paper";
    const meta = window.Views.priorityBadge(paper);

    return `${modalHead(
      `${esc(paper.code)} · ${esc(typeLabel)}`,
      esc(paper.title),
      `${paper.credits} credits · Semester ${paper.semester || state.profile.semester} · ${H.countdownText(paper.examDate).text}`
    )}
    <div class="detail-hero" style="--paper-color:${H.paperColor(paper)}">
      <span class="detail-hero__icon">${icon("book-open")}</span>
      <div class="detail-hero__copy"><strong>${esc(paper.examTime || "Time to be announced")}</strong><span>${esc(paper.venue || "Venue to be announced")}</span></div>
      ${meta}
    </div>
    <div class="detail-meta-grid">
      <div><span>Exam date</span><strong>${date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"}</strong></div>
      <div><span>Preparation</span><strong>${paper.progress || 0}% complete</strong></div>
      <div><span>Notes on file</span><strong>${notes.length} note${notes.length === 1 ? "" : "s"}</strong></div>
      <div><span>Reminder</span><strong>${alert && alert.enabled ? H.alertLeadLabel(alert.leadDays) : "Not set"}</strong></div>
    </div>
    <div class="detail-section">
      <h4>Topics and syllabus</h4>
      <div class="topic-list">${(paper.syllabus || ["Syllabus details not added yet"]).map((topic) => `<span>${icon("check")}${esc(topic)}</span>`).join("")}</div>
    </div>
    ${paper.tags && paper.tags.length ? `<div class="detail-section"><h4>Subject signals</h4><div class="topic-list topic-list--muted">${paper.tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div></div>` : ""}
    <div class="modal__actions modal__actions--split">
      <div style="display:flex;gap:7px">
        <button class="btn btn--danger btn--sm" type="button" data-action="mark-cleared" data-paper-id="${paper.id}">${icon("check-circle")} Mark cleared</button>
        ${paper.type === "current" ? `<button class="btn btn--ghost btn--sm" type="button" data-action="study-paper" data-paper-id="${paper.id}">${icon("sparkles")} Open notes</button>` : ""}
      </div>
      <div style="display:flex;gap:7px">
        <button class="btn btn--outline" type="button" data-action="alert-paper" data-paper-id="${paper.id}">${icon("bell")} ${alert ? "Edit" : "Set"} reminder</button>
        <button class="btn btn--primary" type="button" data-modal-close>Done</button>
      </div>
    </div>`;
  }

  function addPaperModal(state) {
    return `${modalHead("Add to workspace", "Add a paper", "Track an arrear, current paper or a paper coming next semester.")}
    <form id="paper-form">
      <div class="form-alert" id="paper-error" hidden>${icon("alert-triangle")}<span></span></div>
      <div class="form-grid">
        <div class="field span-2"><label for="paper-title">Paper title</label><input class="input" id="paper-title" name="title" placeholder="e.g. Operating Systems" required /></div>
        <div class="field"><label for="paper-code">Paper code</label><input class="input" id="paper-code" name="code" placeholder="CS501" required /></div>
        <div class="field"><label for="paper-type">Paper type</label><select class="select" id="paper-type" name="type"><option value="arrear">Old arrear</option><option value="current" selected>Current paper</option><option value="upcoming">Upcoming paper</option></select></div>
        <div class="field"><label for="paper-credits">Credits</label><select class="select" id="paper-credits" name="credits"><option>1</option><option>2</option><option>3</option><option selected>4</option></select></div>
        <div class="field"><label for="paper-exam-date">Exam date</label><input class="input" id="paper-exam-date" name="examDate" type="date" value="${window.ArrearData.isoDay(30)}" required /></div>
        <div class="field"><label for="paper-exam-time">Exam time</label><input class="input" id="paper-exam-time" name="examTime" placeholder="9:30 AM" /></div>
        <div class="field"><label for="paper-venue">Venue</label><input class="input" id="paper-venue" name="venue" placeholder="Block C · Hall 201" /></div>
        <div class="field span-2" data-priority-field><label for="paper-priority">Priority</label><select class="select" id="paper-priority" name="priority"><option>High</option><option selected>Medium</option><option>Low</option></select></div>
      </div>
      <div class="modal__actions">
        <button class="btn btn--ghost" type="button" data-modal-close>Cancel</button>
        <button class="btn btn--primary" type="submit">${icon("plus")} Add paper</button>
      </div>
    </form>`;
  }

  function alertModal(state, options = {}) {
    const paper = state.papers.find((item) => item.id === options.paperId);
    const alert = state.alerts.find((item) => item.id === options.alertId) || (paper ? state.alerts.find((item) => item.paperId === paper.id) : null);
    const selectedPaper = paper || state.papers.find((item) => item.id === alert?.paperId);
    const available = [...state.papers].sort((a, b) => H.daysUntil(a.examDate) - H.daysUntil(b.examDate));

    return `${modalHead(
      alert ? "Edit reminder" : "New reminder",
      alert ? `Reminder for ${esc(selectedPaper ? selectedPaper.code : "this paper")}` : "Set an exam reminder",
      "We'll keep it in your workspace. Enable browser alerts for an extra nudge."
    )}
    <form id="alert-form" data-alert-id="${alert ? alert.id : ""}">
      ${selectedPaper ? `<div class="detail-hero" style="--paper-color:${H.paperColor(selectedPaper)};margin-bottom:16px">
        <span class="detail-hero__icon">${icon("calendar")}</span>
        <div class="detail-hero__copy"><strong>${esc(selectedPaper.title)}</strong><span>${esc(selectedPaper.code)} · ${H.fmtDate(selectedPaper.examDate, { year: true })} · ${H.countdownText(selectedPaper.examDate).text}</span></div>
      </div>` : `<div class="field"><label for="alert-paper">Paper</label><select class="select" id="alert-paper" name="paperId">${available.map((item) => `<option value="${item.id}">${esc(item.code)} — ${esc(item.title)}</option>`).join("")}</select></div>`}
      <input type="hidden" name="paperId" value="${selectedPaper ? selectedPaper.id : ""}" />
      <div class="form-grid" style="margin-top:15px">
        <div class="field"><label for="alert-lead">Remind me</label><select class="select" id="alert-lead" name="leadDays">
          ${[0, 1, 2, 3, 5, 7, 14].map((days) => `<option value="${days}"${(alert ? Number(alert.leadDays) : 3) === days ? " selected" : ""}>${H.alertLeadLabel(days)}</option>`).join("")}
        </select></div>
        <div class="field"><label for="alert-channel">Channel</label><select class="select" id="alert-channel" name="channel"><option value="email"${!alert || alert.channel === "email" ? " selected" : ""}>Email</option><option value="in-app"${alert && alert.channel === "in-app" ? " selected" : ""}>In-app</option></select></div>
      </div>
      <label class="checkbox-row" style="margin-top:16px;justify-content:flex-start"><input type="checkbox" name="enabled"${!alert || alert.enabled ? " checked" : ""} /> Keep this reminder active</label>
      <div class="modal__actions modal__actions--split">
        <div>${alert ? `<button class="btn btn--danger btn--sm" type="button" data-action="delete-alert" data-alert-id="${alert.id}">${icon("trash")} Delete</button>` : ""}</div>
        <div style="display:flex;gap:7px"><button class="btn btn--ghost" type="button" data-modal-close>Cancel</button><button class="btn btn--primary" type="submit">${icon("bell")} Save reminder</button></div>
      </div>
    </form>`;
  }

  function uploadNoteModal(state, paper) {
    return `${modalHead(
      "Add academic note",
      "Upload a note",
      `${esc(paper.title)} · PDF, Markdown or TXT. StudyAI will read the text and cite this note.`
    )}
    <form id="note-form" data-paper-id="${paper.id}">
      <div class="form-alert" id="note-error" hidden>${icon("alert-triangle")}<span></span></div>
      <div class="form-grid">
        <div class="field span-2"><label for="note-title">Note title <span>optional</span></label><input class="input" id="note-title" name="title" placeholder="e.g. Unit 3 — Memory management" /></div>
        <div class="field span-2"><label for="note-tags">Tags <span>comma separated</span></label><input class="input" id="note-tags" name="tags" placeholder="Unit 3, Paging, Revision" /></div>
      </div>
      <label class="file-drop" id="file-drop" for="note-file">
        <input id="note-file" name="file" type="file" accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf" hidden />
        <span class="file-drop__icon">${icon("upload")}</span>
        <strong>Drop your file here or click to browse</strong>
        <span>PDF, TXT or MD · up to 4 MB</span>
        <span class="file-status" id="file-status" hidden></span>
      </label>
      <div class="field" style="margin-top:14px"><label for="note-content">Note text <span>used by StudyAI</span></label><textarea class="textarea" id="note-content" name="content" placeholder="Text is extracted automatically from TXT, MD and PDF files. You can also paste or edit notes here."></textarea></div>
      <div class="modal__actions">
        <button class="btn btn--ghost" type="button" data-modal-close>Cancel</button>
        <button class="btn btn--primary" type="submit">${icon("upload")} Save note</button>
      </div>
    </form>`;
  }

  function notePreviewModal(state, note) {
    const paper = state.papers.find((item) => item.id === note.paperId);
    const paragraphs = (note.content || "No readable text was extracted from this file.").split(/\n\s*\n/).filter(Boolean);
    return `${modalHead(
      `${H.noteTypeLabel(note.fileType)} · ${note.pages || "—"} pages`,
      esc(note.title),
      `${esc(note.fileName)} · ${paper ? esc(paper.code) + " " + esc(paper.title) : "Academic note"} · Added ${H.fmtDate(note.addedAt, { year: true })}`
    )}
    <div class="note-tags" style="margin:0 0 14px">${(note.tags || []).map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
    <div class="note-preview">${paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}</div>
    <div class="modal__actions modal__actions--split">
      <button class="btn btn--danger btn--sm" type="button" data-action="delete-note" data-note-id="${note.id}">${icon("trash")} Delete note</button>
      <div style="display:flex;gap:7px"><button class="btn btn--outline" type="button" data-action="study-paper" data-paper-id="${note.paperId}">${icon("sparkles")} Open study desk</button><button class="btn btn--primary" type="button" data-modal-close>Close</button></div>
    </div>`;
  }

  function careerModal(career, match) {
    return `${modalHead(
      `${esc(career.category)} path · ${match}% subject match`,
      esc(career.title),
      esc(career.tagline)
    )}
    <div class="career-modal-hero">
      <span class="career-icon">${icon(career.icon)}</span>
      <div><strong>${esc(career.demand)} demand</strong><span>Typical early-career range: ${esc(career.salary)}</span></div>
      <span class="match-pill"><span class="dot"></span>${match}% match</span>
    </div>
    <p class="career-modal-desc">${esc(career.description)}</p>
    <div class="detail-section"><h4>Skills to build</h4><div class="topic-list topic-list--muted">${career.skills.map((skill) => `<span>${esc(skill)}</span>`).join("")}</div></div>
    <div class="detail-section"><h4>Useful certifications</h4><div class="topic-list">${career.certifications.map((cert) => `<span>${icon("award")}${esc(cert)}</span>`).join("")}</div></div>
    <div class="detail-section"><h4>One portfolio project</h4><p class="detail-copy">${esc(career.project)}</p></div>
    <div class="detail-section"><h4>Your roadmap</h4><div class="roadmap-list">${career.roadmap.map((step, index) => `<div class="roadmap-step"><span>${index + 1}</span><p>${esc(step)}</p></div>`).join("")}</div></div>
    <div class="modal__actions"><button class="btn btn--primary" type="button" data-modal-close>Close</button></div>`;
  }

  function confirmModal(options) {
    return `${modalHead(options.eyebrow || "Please confirm", esc(options.title), esc(options.message || ""))}
    <div class="confirm-icon confirm-icon--${options.tone || "coral"}">${icon(options.icon || "alert-triangle")}</div>
    <div class="modal__actions">
      <button class="btn btn--ghost" type="button" data-modal-close>Cancel</button>
      <button class="btn ${options.tone === "danger" ? "btn--danger" : "btn--primary"}" type="button" data-action="${options.action}"${options.paperId ? ` data-paper-id="${options.paperId}"` : ""}${options.noteId ? ` data-note-id="${options.noteId}"` : ""}${options.alertId ? ` data-alert-id="${options.alertId}"` : ""}>${esc(options.confirmLabel || "Confirm")}</button>
    </div>`;
  }

  function profileModal(state) {
    return `${modalHead("Student profile", esc(state.profile.name), "This information shapes your course view and career guidance.")}
    <form id="profile-form">
      <div class="form-grid">
        <div class="field span-2"><label for="profile-name">Full name</label><input class="input" id="profile-name" name="name" value="${esc(state.profile.name)}" required /></div>
        <div class="field span-2"><label for="profile-course">Registered course</label><input class="input" id="profile-course" name="course" value="${esc(state.profile.course)}" required /></div>
        <div class="field"><label for="profile-semester">Current semester</label><select class="select" id="profile-semester" name="semester">${[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => `<option value="${sem}"${Number(state.profile.semester) === sem ? " selected" : ""}>Semester ${sem}</option>`).join("")}</select></div>
        <div class="field"><label for="profile-cgpa">CGPA</label><input class="input" id="profile-cgpa" name="cgpa" type="number" min="0" max="10" step="0.01" value="${Number(state.profile.cgpa).toFixed(2)}" /></div>
      </div>
      <div class="modal__actions"><button class="btn btn--ghost" type="button" data-modal-close>Cancel</button><button class="btn btn--primary" type="submit">${icon("check")} Save profile</button></div>
    </form>`;
  }

  Object.assign(window.Views, {
    academics,
    alerts,
    guidance,
    overview,
    modals: {
      paper: paperModal,
      addPaper: addPaperModal,
      alert: alertModal,
      uploadNote: uploadNoteModal,
      notePreview: notePreviewModal,
      career: careerModal,
      confirm: confirmModal,
      profile: profileModal,
    },
  });
})();
