/* Arrear Management — application shell and interactions */
(function () {
  const H = window.H;
  const icon = H.icon;
  const app = document.getElementById("app");
  const modalRoot = document.getElementById("modal-root");
  const toastRoot = document.getElementById("toast-root");

  const USERS_KEY = "arrear.users.v1";
  const SESSION_KEY = "arrear.session.v1";
  const DATA_PREFIX = "arrear.data.v1::";
  const VALID_TABS = ["courses", "academics", "alerts", "guidance", "overview"];

  let state = null;
  let sessionUser = null;
  let uploadContext = { file: null, type: "", name: "", size: "", pages: null };
  let lastModalReturnFocus = null;

  const ui = {
    authMode: "signin",
    tab: "courses",
    courseTab: "arrear",
    studyPaperId: null,
    recordFilter: "all",
    profileOpen: false,
    mobileNav: false,
    pendingChat: null,
    focusChat: false,
    chatToken: 0,
  };

  /* =========================================================
     Storage
     ========================================================= */
  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      toast("This browser is out of local storage. Try removing an older note first.", "error");
      return false;
    }
  }

  function getUsers() {
    const users = readJSON(USERS_KEY, []);
    return Array.isArray(users) ? users : [];
  }

  function setUsers(users) {
    return writeJSON(USERS_KEY, users);
  }

  function dataKey(email) {
    return DATA_PREFIX + String(email || "").toLowerCase();
  }

  function normaliseState(data) {
    if (!data || typeof data !== "object") return null;
    data.papers = Array.isArray(data.papers) ? data.papers : [];
    data.notes = Array.isArray(data.notes) ? data.notes : [];
    data.records = Array.isArray(data.records) ? data.records : [];
    data.alerts = Array.isArray(data.alerts) ? data.alerts : [];
    data.chats = data.chats && typeof data.chats === "object" ? data.chats : {};
    data.preferences = data.preferences && typeof data.preferences === "object" ? data.preferences : { interests: [] };
    if (!Array.isArray(data.preferences.interests)) data.preferences.interests = [];
    data.profile = data.profile && typeof data.profile === "object" ? data.profile : {};
    return data;
  }

  function saveState() {
    if (!sessionUser || !state) return false;
    return writeJSON(dataKey(sessionUser.email), state);
  }

  function ensureDemoUser() {
    const users = getUsers();
    let demo = users.find((user) => user.email === "demo@arrear.app");
    if (!demo) {
      demo = {
        name: "Aarav Mehta",
        email: "demo@arrear.app",
        password: "demo1234",
        createdAt: new Date().toISOString(),
      };
      users.push(demo);
      setUsers(users);
    }
    if (!localStorage.getItem(dataKey(demo.email))) {
      writeJSON(dataKey(demo.email), window.ArrearData.createSeed({ name: demo.name, email: demo.email }));
    }
  }

  function loadStateFor(user) {
    let data = normaliseState(readJSON(dataKey(user.email), null));
    if (!data) {
      data = normaliseState(
        window.ArrearData.createSeed({
          name: user.name,
          email: user.email,
          joinedAt: window.ArrearData.isoDay(0),
        })
      );
      writeJSON(dataKey(user.email), data);
    }
    return data;
  }

  /* =========================================================
     Boot
     ========================================================= */
  function init() {
    ensureDemoUser();
    const savedEmail = localStorage.getItem(SESSION_KEY);
    if (savedEmail) {
      const user = getUsers().find((item) => item.email.toLowerCase() === savedEmail.toLowerCase());
      if (user) {
        sessionUser = user;
        state = loadStateFor(user);
        const hash = location.hash.replace("#", "");
        ui.tab = VALID_TABS.includes(hash) ? hash : "courses";
        const currentPapers = state.papers.filter((p) => p.type === "current");
        ui.studyPaperId = currentPapers[0]?.id || null;
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    if (!sessionUser) {
      const hash = location.hash.replace("#", "");
      if (hash === "signup") ui.authMode = "signup";
    }
    render();
    bindEvents();
  }

  /* =========================================================
     Rendering
     ========================================================= */
  function render(options = {}) {
    if (sessionUser && state) {
      app.innerHTML = window.Views.dashboard(state, ui);
      const content = app.querySelector(".content");
      if (content) content.classList.add("rise");
      if (ui.focusChat) {
        ui.focusChat = false;
        requestAnimationFrame(() => {
          const input = document.getElementById("ai-input");
          const messages = document.getElementById("ai-messages");
          if (messages) messages.scrollTop = messages.scrollHeight;
          if (input && !input.disabled) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
          }
        });
      }
      if (!options.skipScroll) {
        const currentScroll = window.scrollY;
        if (currentScroll > 0 && options.keepScroll) window.scrollTo(0, currentScroll);
      }
    } else {
      app.innerHTML = window.Views.welcome(ui.authMode);
    }
    if (ui.profileOpen) {
      document.addEventListener("click", closeProfileOnOutsideClick, { once: true });
    }
  }

  function rerenderPage() {
    render();
  }

  function navigate(tab, options = {}) {
    if (!VALID_TABS.includes(tab)) tab = "courses";
    ui.tab = tab;
    ui.profileOpen = false;
    ui.mobileNav = false;
    if (tab === "academics") {
      const current = state.papers.filter((p) => p.type === "current");
      if (!current.some((p) => p.id === ui.studyPaperId)) ui.studyPaperId = current[0]?.id || null;
    }
    history.replaceState(null, "", "#" + tab);
    render();
    if (!options.keepScroll) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toast(message, tone = "success") {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span class="toast__icon">${icon(tone === "error" ? "alert-triangle" : "check")}</span><span>${H.esc(message)}</span>`;
    toastRoot.appendChild(el);
    window.setTimeout(() => {
      el.classList.add("is-leaving");
      window.setTimeout(() => el.remove(), 220);
    }, 3600);
  }

  /* =========================================================
     Modal helpers
     ========================================================= */
  function openModal(html, options = {}) {
    lastModalReturnFocus = document.activeElement;
    modalRoot.innerHTML = `<div class="modal-backdrop"><div class="modal ${options.size ? "modal--" + options.size : ""}" role="dialog" aria-modal="true" aria-label="${H.esc(options.label || "Dialog")}">${html}</div></div>`;
    document.body.classList.add("modal-open");
    const backdrop = modalRoot.querySelector(".modal-backdrop");
    requestAnimationFrame(() => {
      backdrop.classList.add("is-open");
      const active = backdrop.querySelector("input:not([type=hidden]):not([disabled]), select, textarea, button");
      if (active) active.focus({ preventScroll: true });
    });
  }

  function closeModal() {
    const backdrop = modalRoot.querySelector(".modal-backdrop");
    if (!backdrop) return;
    backdrop.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    window.setTimeout(() => {
      if (modalRoot.contains(backdrop)) modalRoot.innerHTML = "";
    }, 180);
    if (lastModalReturnFocus && typeof lastModalReturnFocus.focus === "function") {
      try {
        lastModalReturnFocus.focus({ preventScroll: true });
      } catch (error) {
        /* noop */
      }
    }
    lastModalReturnFocus = null;
  }

  /* =========================================================
     Auth
     ========================================================= */
  function showFormError(form, message) {
    if (!form) return;
    const box = form.querySelector(".form-alert");
    if (!box) {
      toast(message, "error");
      return;
    }
    box.hidden = false;
    const span = box.querySelector("span");
    if (span) span.textContent = message;
    else box.textContent = message;
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function signIn(email, password) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const user = getUsers().find((item) => item.email.toLowerCase() === cleanEmail);
    if (!user || user.password !== password) {
      return { ok: false, message: "That email and password don’t match a workspace. Try the demo account below." };
    }
    sessionUser = user;
    state = loadStateFor(user);
    localStorage.setItem(SESSION_KEY, user.email);
    ui.studyPaperId = state.papers.filter((p) => p.type === "current")[0]?.id || null;
    ui.tab = VALID_TABS.includes(location.hash.replace("#", "")) ? location.hash.replace("#", "") : "courses";
    ui.profileOpen = false;
    render();
    window.scrollTo(0, 0);
    return { ok: true };
  }

  function createAccount(name, email, password) {
    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (cleanName.length < 2) return { ok: false, message: "Please enter your full name." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false, message: "Please enter a valid email address." };
    if (String(password || "").length < 6) return { ok: false, message: "Your password needs at least 6 characters." };
    const users = getUsers();
    if (users.some((user) => user.email.toLowerCase() === cleanEmail)) {
      return { ok: false, message: "A workspace already exists with that email. Try signing in instead." };
    }
    const user = { name: cleanName, email: cleanEmail, password, createdAt: new Date().toISOString() };
    users.push(user);
    if (!setUsers(users)) return { ok: false, message: "We couldn’t create the workspace in this browser." };
    const seed = window.ArrearData.createSeed({
      name: cleanName,
      email: cleanEmail,
      joinedAt: window.ArrearData.isoDay(0),
    });
    state = normaliseState(seed);
    writeJSON(dataKey(cleanEmail), state);
    sessionUser = user;
    localStorage.setItem(SESSION_KEY, cleanEmail);
    ui.studyPaperId = state.papers.filter((p) => p.type === "current")[0]?.id || null;
    ui.tab = "courses";
    history.replaceState(null, "", "#courses");
    render();
    window.scrollTo(0, 0);
    return { ok: true };
  }

  function logout() {
    if (!sessionUser) return;
    localStorage.removeItem(SESSION_KEY);
    sessionUser = null;
    state = null;
    ui.tab = "courses";
    ui.profileOpen = false;
    ui.mobileNav = false;
    ui.pendingChat = null;
    ui.studyPaperId = null;
    ui.authMode = "signin";
    ui.courseTab = "arrear";
    history.replaceState(null, "", "#welcome");
    closeModal();
    render();
    window.scrollTo(0, 0);
    toast("Signed out. Your workspace is saved in this browser.");
  }

  /* =========================================================
     Paper / note / reminder actions
     ========================================================= */
  function getPaper(id) {
    return state.papers.find((paper) => paper.id === id);
  }

  function getSelectedStudyPaper() {
    return (
      state.papers.find((paper) => paper.id === ui.studyPaperId) ||
      state.papers.filter((paper) => paper.type === "current")[0] ||
      null
    );
  }

  function openPaperDetail(id) {
    const paper = getPaper(id);
    if (!paper) return;
    openModal(window.Views.modals.paper(state, paper), { size: "wide", label: paper.title });
  }

  function openAddPaper() {
    openModal(window.Views.modals.addPaper(state), { size: "wide", label: "Add a paper" });
    syncPriorityField();
  }

  function openAlertModal(paperId, alertId) {
    openModal(window.Views.modals.alert(state, { paperId, alertId }), { label: "Set reminder" });
  }

  function openUploadNote(paperId) {
    const paper = getPaper(paperId) || getSelectedStudyPaper();
    if (!paper) {
      toast("Add a current paper before uploading notes.", "error");
      return;
    }
    uploadContext = { file: null, type: "", name: "", size: "", pages: null };
    openModal(window.Views.modals.uploadNote(state, paper), { size: "wide", label: "Upload a note" });
    bindUploadModal();
  }

  function openNotePreview(noteId) {
    const note = state.notes.find((item) => item.id === noteId);
    if (!note) return;
    openModal(window.Views.modals.notePreview(state, note), { size: "wide", label: note.title });
  }

  function openCareer(id) {
    const career = window.ArrearData.careers.find((item) => item.id === id);
    if (!career) return;
    const interests = state.preferences.interests || [];
    const match = window.ArrearData.careerMatch(career, state.papers, interests);
    openModal(window.Views.modals.career(career, match), { size: "wide", label: career.title });
  }

  function openConfirm(options) {
    openModal(window.Views.modals.confirm(options), { size: "narrow", label: options.title });
  }

  function markPaperCleared(paperId) {
    const paper = getPaper(paperId);
    if (!paper) return;
    state.papers = state.papers.filter((item) => item.id !== paperId);
    state.alerts = state.alerts.filter((alert) => alert.paperId !== paperId);
    state.notes = state.notes.filter((note) => note.paperId !== paperId);
    delete state.chats[paperId];
    state.records.unshift({
      id: "record-" + Date.now(),
      code: paper.code,
      title: paper.title,
      semester: paper.semester || state.profile.semester,
      examDate: window.ArrearData.isoDay(0),
      status: "Cleared",
      grade: "Pass",
      marks: null,
      credits: paper.credits,
      type: "cleared",
    });
    if (ui.studyPaperId === paperId) {
      ui.studyPaperId = state.papers.filter((item) => item.type === "current")[0]?.id || null;
    }
    saveState();
    closeModal();
    rerenderPage();
    toast(`${paper.code} moved to your cleared papers.`);
  }

  function toggleInterest(id) {
    const interests = state.preferences.interests || [];
    state.preferences.interests = interests.includes(id) ? interests.filter((item) => item !== id) : [...interests, id];
    saveState();
    rerenderPage();
    ui.focusChat = false;
  }

  function recordFilter(key) {
    ui.recordFilter = key;
    rerenderPage();
  }

  function resetChat(paperId) {
    ui.chatToken += 1;
    state.chats[paperId] = [];
    ui.pendingChat = null;
    saveState();
    rerenderPage();
    toast("Started a new StudyAI conversation.");
  }

  function askQuestion(question, paperId) {
    const paper = getPaper(paperId);
    const text = String(question || "").trim();
    if (!paper || !text || ui.pendingChat) return;
    const notes = state.notes.filter((note) => note.paperId === paperId);
    const history = state.chats[paperId] || [];
    state.chats[paperId] = [...history, { role: "user", text, timestamp: Date.now() }].slice(-24);
    ui.pendingChat = paperId;
    const token = ++ui.chatToken;
    const emailAtAsk = sessionUser.email;
    saveState();
    ui.focusChat = true;
    rerenderPage();

    window.setTimeout(() => {
      if (token !== ui.chatToken || !sessionUser || sessionUser.email !== emailAtAsk) return;
      const currentPaper = getPaper(paperId);
      const result = window.StudyAI.answer(text, notes, currentPaper || paper);
      state.chats[paperId] = [
        ...(state.chats[paperId] || []),
        {
          role: "assistant",
          text: result.text,
          sources: result.sources,
          confidence: result.confidence,
          grounded: result.grounded,
          timestamp: Date.now(),
        },
      ].slice(-24);
      ui.pendingChat = null;
      saveState();
      if (ui.tab === "academics" && ui.studyPaperId === paperId) {
        ui.focusChat = true;
        rerenderPage();
      } else {
        toast("StudyAI finished answering your question.");
      }
    }, 820);
  }

  /* =========================================================
     Uploads
     ========================================================= */
  function syncPriorityField() {
    const type = document.getElementById("paper-type");
    const field = document.querySelector("[data-priority-field]");
    if (!type || !field) return;
    field.hidden = type.value !== "arrear";
  }

  function bindUploadModal() {
    const input = document.getElementById("note-file");
    const drop = document.getElementById("file-drop");
    if (!input || !drop) return;
    input.addEventListener("change", () => {
      if (input.files && input.files[0]) processFile(input.files[0]);
    });
    ["dragenter", "dragover"].forEach((eventName) => {
      drop.addEventListener(eventName, (event) => {
        event.preventDefault();
        drop.classList.add("is-dragging");
      });
    });
    ["dragleave", "drop"].forEach((eventName) => {
      drop.addEventListener(eventName, (event) => {
        event.preventDefault();
        drop.classList.remove("is-dragging");
      });
    });
    drop.addEventListener("drop", (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (file) processFile(file);
    });
  }

  async function processFile(file) {
    const form = document.getElementById("note-form");
    const status = document.getElementById("file-status");
    const content = document.getElementById("note-content");
    const title = document.getElementById("note-title");
    if (!file || !status || !content) return;

    const extension = (file.name.split(".").pop() || "").toLowerCase();
    if (!["pdf", "txt", "md", "markdown"].includes(extension)) {
      showFormError(form, "Please upload a PDF, TXT or Markdown file.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      showFormError(form, "That file is over 4 MB. Try a smaller file or paste the important text below.");
      return;
    }

    status.hidden = false;
    status.className = "file-status is-loading";
    status.textContent = `Reading ${file.name}…`;
    uploadContext = {
      file,
      type: extension === "markdown" ? "md" : extension,
      name: file.name,
      size: formatBytes(file.size),
      pages: null,
    };
    if (!title.value.trim()) title.value = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");

    try {
      let extracted = "";
      if (extension === "pdf") {
        extracted = await extractPdfText(file, (page, total) => {
          status.textContent = `Reading PDF · page ${page} of ${total}…`;
        });
      } else {
        extracted = await file.text();
      }
      extracted = extractableContent(extracted);
      if (extracted) {
        content.value = extracted;
      }
      status.className = "file-status is-ready";
      status.innerHTML = `${icon("check-circle")} ${H.esc(file.name)} · ${formatBytes(file.size)}${uploadContext.pages ? " · " + uploadContext.pages + " pages" : ""} · text ready`;
      const error = document.getElementById("note-error");
      if (error) error.hidden = true;
    } catch (error) {
      status.className = "file-status is-error";
      status.innerHTML = `${icon("alert-triangle")} ${H.esc(error.message || "Couldn't read that file.")}`;
      showFormError(form, "The file is attached, but we couldn't extract its text. Paste or type the key notes below so StudyAI can use them.");
    }
  }

  async function extractPdfText(file, onPage) {
    statusMessage("Loading the PDF reader…");
    const pdfjs = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    uploadContext.pages = pdf.numPages;
    const pageCount = Math.min(pdf.numPages, 70);
    const chunks = [];
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      if (onPage) onPage(pageNumber, pageCount);
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      chunks.push(textContent.items.map((item) => item.str).join(" "));
      if (chunks.join(" ").length > 60000) break;
    }
    return chunks.join("\n\n");
  }

  function statusMessage(message) {
    const status = document.getElementById("file-status");
    if (status) {
      status.hidden = false;
      status.className = "file-status is-loading";
      status.textContent = message;
    }
  }

  function extractableContent(text) {
    return String(text || "")
      .replace(/\u0000/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 60000);
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  /* =========================================================
     Exports
     ========================================================= */
  function downloadRecords() {
    const paperRows = state.papers.map((paper) => ({
      title: paper.title,
      code: paper.code,
      type: paper.type,
      examDate: paper.examDate,
      status: paper.type === "arrear" ? "Pending" : paper.type === "current" ? "In progress" : "Scheduled",
      result: paper.type === "arrear" ? "Attempt " + (paper.attempt || 1) : "—",
      credits: paper.credits,
    }));
    const clearedRows = state.records.map((record) => ({
      title: record.title,
      code: record.code,
      type: "cleared",
      examDate: record.examDate,
      status: "Cleared",
      result: `${record.grade}${record.marks ? " · " + record.marks + "/100" : ""}`,
      credits: record.credits,
    }));
    const rows = [...paperRows, ...clearedRows];
    const header = ["Subject", "Code", "Type", "Exam date", "Status", "Result", "Credits"];
    const csv = [header, ...rows.map((row) => [row.title, row.code, row.type, row.examDate, row.status, row.result, row.credits])]
      .map((line) => line.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "arrear-exam-records.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast("Exam records exported as CSV.");
  }

  /* =========================================================
     Notifications
     ========================================================= */
  async function enableNotifications() {
    if (!("Notification" in window)) {
      toast("This browser doesn’t support notifications.", "error");
      return;
    }
    if (Notification.permission === "granted") {
      toast("Browser notifications are already enabled.");
      return;
    }
    if (Notification.permission === "denied") {
      toast("Notifications are blocked. Allow them from your browser’s site settings.", "error");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast("Browser reminders enabled for this device.");
      } else {
        toast("No problem — your in-app reminders are still active.");
      }
      rerenderPage();
    } catch (error) {
      toast("Couldn’t request notification permission.", "error");
    }
  }

  /* =========================================================
     Events
     ========================================================= */
  function bindEvents() {
    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("change", handleChange);
    document.addEventListener("keydown", handleKeydown);

    modalRoot.addEventListener("click", (event) => {
      if (event.target.classList.contains("modal-backdrop")) closeModal();
    });

    window.addEventListener("hashchange", () => {
      if (!sessionUser) return;
      const tab = location.hash.replace("#", "");
      if (VALID_TABS.includes(tab) && tab !== ui.tab) {
        ui.tab = tab;
        if (tab === "academics") {
          const current = state.papers.filter((p) => p.type === "current");
          if (!current.some((p) => p.id === ui.studyPaperId)) ui.studyPaperId = current[0]?.id || null;
        }
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  function closeProfileOnOutsideClick(event) {
    if (!ui.profileOpen) return;
    if (event.target.closest(".profile-button") || event.target.closest(".profile-popover")) return;
    ui.profileOpen = false;
    render();
  }

  function handleClick(event) {
    if (event.target.closest("[data-modal-close]")) {
      event.preventDefault();
      closeModal();
      return;
    }

    const actionEl = event.target.closest("[data-action]");
    if (!actionEl) {
      if (ui.profileOpen) {
        ui.profileOpen = false;
        render();
      }
      return;
    }
    const action = actionEl.dataset.action;

    if (action === "brand") {
      event.preventDefault();
      if (sessionUser) navigate("courses");
      return;
    }

    if (action === "auth-mode") {
      ui.authMode = actionEl.dataset.mode === "signup" ? "signup" : "signin";
      history.replaceState(null, "", "#" + ui.authMode);
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (action === "demo-login") {
      ensureDemoUser();
      const result = signIn("demo@arrear.app", "demo1234");
      if (result.ok) toast("Demo workspace opened. Explore freely — changes are saved locally.");
      else toast(result.message, "error");
      return;
    }

    if (action === "toggle-password") {
      event.preventDefault();
      const input = document.getElementById(actionEl.dataset.target);
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      actionEl.innerHTML = icon(show ? "eye-off" : "eye");
      actionEl.setAttribute("aria-label", show ? "Hide password" : "Show password");
      return;
    }

    if (!sessionUser) return;

    if (action === "nav") {
      navigate(actionEl.dataset.tab);
      return;
    }
    if (action === "open-menu") {
      ui.mobileNav = true;
      ui.profileOpen = false;
      render();
      return;
    }
    if (action === "close-menu") {
      ui.mobileNav = false;
      render();
      return;
    }
    if (action === "toggle-profile") {
      ui.profileOpen = !ui.profileOpen;
      render();
      return;
    }
    if (action === "profile-settings") {
      ui.profileOpen = false;
      openModal(window.Views.modals.profile(state), { label: "Student profile" });
      return;
    }
    if (action === "logout") {
      openConfirm({
        eyebrow: "Account",
        title: "Log out of arrear?",
        message: "Your papers, notes and reminders stay saved in this browser. You can sign back in any time.",
        action: "logout-confirm",
        confirmLabel: "Log out",
        icon: "logout",
        tone: "coral",
      });
      return;
    }
    if (action === "logout-confirm") {
      logout();
      return;
    }
    if (action === "course-tab") {
      ui.courseTab = actionEl.dataset.courseTab || "arrear";
      render();
      return;
    }
    if (action === "add-paper") {
      openAddPaper();
      return;
    }
    if (action === "paper-detail") {
      openPaperDetail(actionEl.dataset.paperId);
      return;
    }
    if (action === "study-paper") {
      const paperId = actionEl.dataset.paperId;
      const paper = getPaper(paperId);
      if (paper && paper.type === "current") {
        ui.studyPaperId = paperId;
        closeModal();
        navigate("academics", { keepScroll: true });
      } else {
        toast("Notes and StudyAI are available for current papers.", "error");
      }
      return;
    }
    if (action === "mark-cleared") {
      const paper = getPaper(actionEl.dataset.paperId);
      if (!paper) return;
      openConfirm({
        eyebrow: "Update record",
        title: `Mark ${paper.code} as cleared?`,
        message: `This moves ${paper.title} out of your active papers and adds it to your cleared record. Its notes and reminders will be removed from this workspace.`,
        action: "mark-cleared-confirm",
        paperId: paper.id,
        confirmLabel: "Mark as cleared",
        icon: "check-circle",
        tone: "success",
      });
      return;
    }
    if (action === "mark-cleared-confirm") {
      markPaperCleared(actionEl.dataset.paperId);
      return;
    }
    if (action === "alert-paper") {
      openAlertModal(actionEl.dataset.paperId);
      return;
    }
    if (action === "new-alert") {
      openAlertModal(null);
      return;
    }
    if (action === "enable-notifications") {
      enableNotifications();
      return;
    }
    if (action === "delete-alert") {
      const alert = state.alerts.find((item) => item.id === actionEl.dataset.alertId);
      if (!alert) return;
      const paper = getPaper(alert.paperId);
      openConfirm({
        eyebrow: "Reminder",
        title: "Delete this reminder?",
        message: paper ? `No more nudges for ${paper.title}. You can set a new one any time.` : "This reminder will be removed.",
        action: "delete-alert-confirm",
        alertId: alert.id,
        confirmLabel: "Delete reminder",
        icon: "trash",
        tone: "danger",
      });
      return;
    }
    if (action === "delete-alert-confirm") {
      const id = actionEl.dataset.alertId || actionEl.getAttribute("data-alert-id");
      state.alerts = state.alerts.filter((item) => item.id !== id);
      saveState();
      closeModal();
      rerenderPage();
      toast("Reminder deleted.");
      return;
    }
    if (action === "toggle-interest") {
      toggleInterest(actionEl.dataset.interest);
      return;
    }
    if (action === "career-detail") {
      openCareer(actionEl.dataset.careerId);
      return;
    }
    if (action === "record-filter") {
      recordFilter(actionEl.dataset.filter || "all");
      return;
    }
    if (action === "download-records") {
      downloadRecords();
      return;
    }
    if (action === "select-paper") {
      ui.studyPaperId = actionEl.dataset.paperId;
      render();
      return;
    }
    if (action === "upload-note") {
      openUploadNote(actionEl.dataset.paperId);
      return;
    }
    if (action === "preview-note") {
      openNotePreview(actionEl.dataset.noteId);
      return;
    }
    if (action === "delete-note") {
      const note = state.notes.find((item) => item.id === actionEl.dataset.noteId);
      if (!note) return;
      openConfirm({
        eyebrow: "Study notes",
        title: "Delete this note?",
        message: `“${note.title}” will be removed from this paper. StudyAI will no longer use it as a source.`,
        action: "delete-note-confirm",
        noteId: note.id,
        confirmLabel: "Delete note",
        icon: "trash",
        tone: "danger",
      });
      return;
    }
    if (action === "delete-note-confirm") {
      const noteId = actionEl.dataset.noteId;
      state.notes = state.notes.filter((note) => note.id !== noteId);
      saveState();
      closeModal();
      rerenderPage();
      toast("Note deleted.");
      return;
    }
    if (action === "reset-chat") {
      const paper = getSelectedStudyPaper();
      if (paper) resetChat(paper.id);
      return;
    }
    if (action === "ask-prompt") {
      const prompt = actionEl.dataset.prompt || "";
      const paper = getSelectedStudyPaper();
      if (paper) askQuestion(prompt, paper.id);
      return;
    }
  }

  function handleSubmit(event) {
    const form = event.target;

    if (form.id === "auth-form") {
      event.preventDefault();
      const mode = form.dataset.mode;
      const data = new FormData(form);
      const email = data.get("email");
      const password = data.get("password");
      if (mode === "signup") {
        const result = createAccount(data.get("name"), email, password);
        if (!result.ok) showFormError(form, result.message);
        else toast("Workspace created. Your semester starts here.");
      } else {
        const result = signIn(email, password);
        if (!result.ok) showFormError(form, result.message);
        else toast("Welcome back. Let’s keep the momentum.");
      }
      return;
    }

    if (!sessionUser || !state) return;

    if (form.id === "ai-form") {
      event.preventDefault();
      const input = document.getElementById("ai-input");
      const question = input ? input.value : "";
      const paperId = form.dataset.paperId;
      if (!String(question).trim()) {
        if (input) input.focus();
        return;
      }
      if (input) input.value = "";
      askQuestion(question, paperId);
      return;
    }

    if (form.id === "paper-form") {
      event.preventDefault();
      const data = new FormData(form);
      const title = String(data.get("title") || "").trim();
      const code = String(data.get("code") || "").trim().toUpperCase();
      const type = data.get("type");
      const examDate = data.get("examDate");
      if (!title || !code || !examDate) {
        showFormError(form, "Please add a title, paper code and exam date.");
        return;
      }
      if (state.papers.some((paper) => paper.code.toUpperCase() === code)) {
        showFormError(form, `A paper with code ${code} already exists in your workspace.`);
        return;
      }
      const palettes = ["blue", "teal", "green", "violet", "coral", "amber"];
      const paper = {
        id: "paper-" + Date.now(),
        type,
        title,
        code,
        credits: Number(data.get("credits")) || 3,
        semester: Number(state.profile.semester) || 5,
        examDate,
        examTime: String(data.get("examTime") || "").trim() || "Time TBA",
        venue: String(data.get("venue") || "").trim() || "Venue TBA",
        attempt: type === "arrear" ? 1 : undefined,
        priority: type === "arrear" ? data.get("priority") || "Medium" : undefined,
        progress: 0,
        color: palettes[state.papers.length % palettes.length],
        tags: [],
        syllabus: ["Syllabus details to be added"],
      };
      state.papers.push(paper);
      ui.courseTab = type;
      if (type === "current" && !ui.studyPaperId) ui.studyPaperId = paper.id;
      saveState();
      closeModal();
      rerenderPage();
      toast(`${code} added to your ${type === "arrear" ? "arrears" : type === "current" ? "current papers" : "upcoming papers"}.`);
      return;
    }

    if (form.id === "alert-form") {
      event.preventDefault();
      const data = new FormData(form);
      const alertId = form.dataset.alertId;
      const paperId = data.get("paperId");
      const paper = getPaper(paperId);
      if (!paper) {
        showFormError(form, "Choose a paper for this reminder.");
        return;
      }
      const leadDays = Number(data.get("leadDays"));
      const channel = data.get("channel") || "email";
      const enabled = data.get("enabled") === "on";
      let alert = state.alerts.find((item) => item.id === alertId);
      if (alert) {
        Object.assign(alert, { paperId, leadDays, channel, enabled });
      } else {
        alert = {
          id: "alert-" + paperId + "-" + Date.now(),
          paperId,
          leadDays,
          channel,
          enabled,
          createdAt: window.ArrearData.isoDay(0),
        };
        state.alerts.push(alert);
      }
      saveState();
      closeModal();
      rerenderPage();
      toast(enabled ? `Reminder set for ${paper.code} · ${H.alertLeadLabel(leadDays)}.` : "Reminder saved but turned off.");
      return;
    }

    if (form.id === "note-form") {
      event.preventDefault();
      const data = new FormData(form);
      const paperId = form.dataset.paperId;
      const paper = getPaper(paperId);
      if (!paper) {
        showFormError(form, "The paper for this note no longer exists.");
        return;
      }
      const content = extractableContent(data.get("content"));
      const title = String(data.get("title") || "").trim() || uploadContext.name?.replace(/\.[^.]+$/, "") || "Untitled note";
      if (!content && !uploadContext.name) {
        showFormError(form, "Add a file or paste some note text before saving.");
        return;
      }
      if (!content) {
        showFormError(form, "We couldn't extract text from this file. Paste the key notes below so StudyAI can use them.");
        return;
      }
      const tags = String(data.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 5);
      const note = {
        id: "note-" + Date.now(),
        paperId,
        title,
        fileName: uploadContext.name || title + ".txt",
        fileType: uploadContext.type || "txt",
        size: uploadContext.size || formatBytes(content.length),
        pages: uploadContext.pages || Math.max(1, Math.ceil(content.split(/\s+/).length / 300)),
        addedAt: window.ArrearData.isoDay(0),
        tags,
        content: content.slice(0, 50000),
      };
      state.notes.unshift(note);
      if (!saveState()) {
        state.notes = state.notes.filter((item) => item.id !== note.id);
        showFormError(form, "There wasn’t enough browser storage for this note. Remove an older note and try again.");
        return;
      }
      closeModal();
      rerenderPage();
      toast("Note saved. StudyAI has indexed it.");
      return;
    }

    if (form.id === "profile-form") {
      event.preventDefault();
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const course = String(data.get("course") || "").trim();
      if (!name || !course) {
        showFormError(form, "Name and course are required.");
        return;
      }
      state.profile.name = name;
      state.profile.course = course;
      state.profile.courseShort = course.length > 26 ? course.split(/\s+/).slice(0, 3).join(" ") : course;
      state.profile.semester = Number(data.get("semester")) || state.profile.semester;
      state.profile.cgpa = Math.max(0, Math.min(10, Number(data.get("cgpa")) || state.profile.cgpa));
      const users = getUsers().map((user) => (user.email === sessionUser.email ? { ...user, name } : user));
      setUsers(users);
      sessionUser = users.find((user) => user.email === sessionUser.email) || sessionUser;
      saveState();
      closeModal();
      rerenderPage();
      toast("Profile updated.");
      return;
    }
  }

  function handleChange(event) {
    const input = event.target;
    if (input.matches("[data-toggle-alert]")) {
      const paperId = input.dataset.paperId;
      const paper = getPaper(paperId);
      if (!paper) return;
      let alert = state.alerts.find((item) => item.paperId === paperId);
      if (!alert) {
        alert = {
          id: "alert-" + paperId + "-" + Date.now(),
          paperId,
          leadDays: 3,
          channel: "email",
          enabled: input.checked,
          createdAt: window.ArrearData.isoDay(0),
        };
        state.alerts.push(alert);
      } else {
        alert.enabled = input.checked;
      }
      saveState();
      rerenderPage();
      toast(input.checked ? `Reminder turned on for ${paper.code}.` : `Reminder turned off for ${paper.code}.`);
      return;
    }

    if (input.id === "paper-type") {
      syncPriorityField();
    }
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      if (modalRoot.querySelector(".modal-backdrop")) {
        closeModal();
        return;
      }
      if (ui.mobileNav || ui.profileOpen) {
        ui.mobileNav = false;
        ui.profileOpen = false;
        render();
      }
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && sessionUser) {
      event.preventDefault();
      navigate("academics");
      ui.focusChat = true;
      render();
      window.setTimeout(() => document.getElementById("ai-input")?.focus(), 80);
    }

    if (event.key === "Enter" && !event.shiftKey && event.target.id === "ai-input") {
      event.preventDefault();
      const form = document.getElementById("ai-form");
      if (form) form.requestSubmit();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
