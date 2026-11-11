/* StudyAI — a grounded, note-first study assistant. No network calls. */
(function () {
  const STOP_WORDS = new Set(
    "a an the and or but if then than that this these those is are was were be been being do does did doing have has had having i me my we our you your he she it they them to of in on at for with about from into over under again further once here there when where why how all any both each few more most other some such no nor not only own same so too very can will just should now explain describe define tell summarize summarise summary difference between versus vs mean meaning what which who whom whose please give list write short long detailed clearly note notes".split(
      " "
    )
  );

  const SYNONYMS = {
    deadlock: ["deadlocks", "coffman", "mutual", "preemption", "circular", "wait-for", "banker"],
    paging: ["page", "pages", "frame", "frames", "segmentation", "page-fault", "tl"],
    segmentation: ["segment", "segments", "paging", "frames"],
    tcp: ["handshake", "syn", "ack", "transport", "reliable", "sequence"],
    osi: ["layer", "layers", "physical", "data", "network", "transport", "application"],
    acid: ["atomicity", "consistency", "isolation", "durability", "transactions"],
    normalization: ["normalisation", "normalisation", "1nf", "2nf", "3nf", "bcnf", "functional", "dependency"],
    normalisation: ["normalization", "1nf", "2nf", "3nf", "bcnf", "functional", "dependency"],
    index: ["indexes", "indexing", "b+", "lookup", "query", "performance"],
    agile: ["scrum", "sprint", "backlog", "retrospective", "iteration"],
    rest: ["get", "post", "http", "api", "resources", "endpoint"],
    scheduling: ["fcfs", "round", "robin", "priority", "sjf", "cpu"],
    memory: ["paging", "segmentation", "page", "frame", "thrashing"],
  };

  function uniq(list) {
    return Array.from(new Set(list));
  }

  function tokenize(text) {
    const base = (text || "").toLowerCase().match(/[a-z0-9][a-z0-9+#.-]*/g) || [];
    const tokens = base.filter((t) => t.length > 2 && !STOP_WORDS.has(t));
    const expanded = [];
    tokens.forEach((token) => {
      expanded.push(token);
      const singular = token.endsWith("s") && token.length > 4 ? token.slice(0, -1) : token;
      if (singular !== token) expanded.push(singular);
      (SYNONYMS[token] || []).forEach((syn) => expanded.push(syn));
      Object.keys(SYNONYMS).forEach((key) => {
        if (SYNONYMS[key].includes(token)) expanded.push(key);
      });
    });
    return uniq(expanded);
  }

  function splitSentences(text) {
    return (text || "")
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 36);
  }

  function trimSentence(sentence, max = 260) {
    if (sentence.length <= max) return sentence;
    return sentence.slice(0, max).replace(/\s+\S*$/, "") + "…";
  }

  function scoreText(text, tokens) {
    const norm = text.toLowerCase();
    let score = 0;
    tokens.forEach((token) => {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matches = norm.match(new RegExp(escaped, "g"));
      if (matches) score += Math.min(matches.length, 3) * (token.length > 5 ? 1.5 : 1);
    });
    return score;
  }

  function buildCandidates(notes) {
    const candidates = [];
    notes.forEach((note) => {
      splitSentences(note.content).forEach((sentence) => {
        candidates.push({
          text: sentence,
          noteId: note.id,
          noteTitle: note.title,
          noteType: note.fileType,
          tags: note.tags || [],
        });
      });
    });
    return candidates;
  }

  function confidenceLabel(score) {
    if (score >= 14) return "High confidence";
    if (score >= 7) return "Good match";
    return "Limited match";
  }

  function uniqueNotes(selected) {
    const seen = new Set();
    return selected.filter((item) => {
      if (seen.has(item.noteId)) return false;
      seen.add(item.noteId);
      return true;
    });
  }

  function formatSources(selected) {
    return uniqueNotes(selected).slice(0, 3).map((item) => ({
      id: item.noteId,
      title: item.noteTitle,
      type: item.noteType,
      tags: item.tags,
    }));
  }

  function answer(question, notes, paper) {
    const tokens = tokenize(question);
    const cleanedNotes = (notes || []).filter((note) => note.content && note.content.trim().length > 80);
    if (!cleanedNotes.length) {
      return {
        text:
          "I don’t have readable notes for **" +
          escapePlain(paper ? paper.title : "this paper") +
          "** yet.\n\nUpload a PDF, TXT or Markdown file from the notes panel, then ask me again. I’ll answer using only the material you provide, with sources for every response.",
        sources: [],
        confidence: "No notes yet",
        grounded: false,
      };
    }

    if (!tokens.length) {
      return {
        text:
          "Ask me something specific and I’ll search your **" +
          escapePlain(paper ? paper.title : "") +
          "** notes.\n\nTry a concept (“explain deadlock”), a comparison (“paging vs segmentation”) or a revision request (“summarise Unit 2”).",
        sources: [],
        confidence: "Need a topic",
        grounded: false,
      };
    }

    const candidates = buildCandidates(cleanedNotes).map((candidate) => {
      let score = scoreText(candidate.text, tokens);
      const context = candidate.noteTitle + " " + (candidate.tags || []).join(" ");
      score += scoreText(context, tokens) * 1.3;
      return Object.assign({}, candidate, { score });
    });

    candidates.sort((a, b) => b.score - a.score);
    const matched = candidates.filter((candidate) => candidate.score > 0);

    if (!matched.length || matched[0].score < 1.5) {
      const fallback = cleanedNotes
        .slice(0, 2)
        .map((note) => {
          const sentences = splitSentences(note.content);
          return {
            text: sentences[0] || note.content.slice(0, 220),
            noteId: note.id,
            noteTitle: note.title,
            noteType: note.fileType,
            tags: note.tags || [],
            score: 0,
          };
        });
      const topics = cleanedNotes
        .slice(0, 3)
        .flatMap((note) => (note.tags || []).slice(0, 2))
        .filter(Boolean);
      return {
        text:
          "I couldn’t find a direct answer to that in your uploaded notes, so I won’t guess.\n\n**Closest material available:**\n" +
          fallback.map((item) => "- " + trimSentence(item.text, 190)).join("\n") +
          "\n\nTry asking about one of these topics: **" +
          uniq(topics).slice(0, 5).join("**, **") +
          "**. Or add another note that covers this concept.",
        sources: formatSources(fallback),
        confidence: "No direct match",
        grounded: false,
      };
    }

    const top = matched.slice(0, 4);
    const answerSentences = top.slice(0, 2).map((item) => trimSentence(item.text));
    const keyPoints = matched
      .filter((item) => !answerSentences.includes(trimSentence(item.text)))
      .slice(0, 3)
      .map((item) => trimSentence(item.text, 220));

    const keywordLabels = [];
    if (paper) (paper.tags || []).forEach((tag) => keywordLabels.push(tag));
    top.forEach((item) => (item.tags || []).forEach((tag) => keywordLabels.push(tag)));
    const focus = uniq(keywordLabels).slice(0, 3);

    let text = "";
    text += "Here’s the clearest explanation from your **" + escapePlain(paper ? paper.title : "uploaded") + "** notes:\n\n";
    text += answerSentences.join(" ") + "\n\n";

    if (keyPoints.length) {
      text += "**What to remember**\n";
      keyPoints.forEach((point) => {
        text += "- " + point + "\n";
      });
    }

    text += "\n**Exam angle**\n";
    if (focus.length) {
      text +=
        "Lead with a precise definition, then connect it to **" +
        focus.slice(0, 2).join("** and **") +
        "**. A labelled diagram or a short worked example will usually earn more marks than extra prose.";
    } else {
      text += "Lead with a precise definition, then add one example and one limitation to show depth.";
    }

    return {
      text,
      sources: formatSources(top),
      confidence: confidenceLabel(top[0].score),
      grounded: true,
    };
  }

  function escapePlain(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function extractiveSummary(notes, paper) {
    const all = (notes || []).filter((note) => note.content && note.content.length > 80);
    if (!all.length) return "Upload your first note and I’ll build a revision brief here.";
    const picks = [];
    all.slice(0, 3).forEach((note) => {
      const sentences = splitSentences(note.content);
      if (sentences[0]) picks.push(sentences[0]);
      if (sentences[1]) picks.push(sentences[1]);
    });
    return picks.slice(0, 5).map((s) => trimSentence(s, 210)).join(" ");
  }

  window.StudyAI = {
    answer,
    tokenize,
    extractiveSummary,
    escapePlain,
  };
})();
