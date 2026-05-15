(() => {
  const AUDIO_STORAGE_KEY = "appraisal-detective-audio-muted";
  const BGM_STORAGE_KEY = "appraisal-detective-bgm-muted";
  const VOICE_STORAGE_KEY = "appraisal-detective-voice-muted";
  const localVoicevoxProxyAvailable = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const VOICEVOX_PROXY_PATH = window.__APPRAISAL_VOICEVOX_PROXY_PATH__ ?? (localVoicevoxProxyAvailable ? "/voicevox" : "");
  const VOICEVOX_DIRECT_URLS = navigator.webdriver
    ? []
    : (window.__APPRAISAL_VOICEVOX_ENGINE_URLS__ ?? ["http://127.0.0.1:50021", "http://localhost:50021"]).filter(Boolean);
  const VOICE_ACTING_VERSION = "2026-05-15-narrator-1.25-player-crisp-1.14";
  const NARRATOR_TEMPO_MULTIPLIER = 1.25;
  const PLAYER_CRISP_RATE = 1.14;
  const PLAYER_CRISP_RATE_CAP = 1.18;
  const VOICE_START_DELAY_MS = 450;
  const PRONUNCIATION_LEXICON_VERSION = "2026-05-13-real-estate-1";
  const STIMULUS_STORAGE_KEY =
    window.__APPRAISAL_LOW_STIMULUS_STORAGE_KEY__ ??
    document.querySelector('meta[name="appraisal-low-stimulus-storage-key"]')?.getAttribute("content") ??
    "appraisal-detective-low-stimulus";
  const BGM_TRACKS = {
    caseSelect: {
      src: "./assets/audio/mixkit-echoes-188.mp3",
      volume: 0.14,
    },
    investigation: {
      src: "./assets/audio/mixkit-tapis-615.mp3",
      volume: 0.13,
    },
    confrontation: {
      src: "./assets/audio/mixkit-piano-horror-671.mp3",
      volume: 0.11,
    },
    result: {
      src: "./assets/audio/mixkit-echoes-188.mp3",
      volume: 0.12,
    },
  };

  const motionReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let audioContext;
  let audioMuted = localStorage.getItem(AUDIO_STORAGE_KEY) === "true";
  let bgmMuted = localStorage.getItem(BGM_STORAGE_KEY) === "true";
  let voiceMuted = localStorage.getItem(VOICE_STORAGE_KEY) === "true";
  let bgmPrimed = false;
  let voicePrimed = false;
  let bgmKey = "";
  let bgmSceneOverride = null;
  let pendingVoiceLines = null;
  let activeVoiceKey = "";
  let activeVoiceToken = 0;
  let voiceStartTimer = 0;
  let voiceSpeaking = false;
  let activeVoicevoxAudio = null;
  let voicevoxAvailable = null;
  let voicevoxSpeakersPromise = null;
  let lastVoiceBackendStatus = "idle";
  const bgmAudio = typeof Audio === "function" ? new Audio() : null;
  const voicevoxAudioCache = new Map();
  const voicevoxSynthesisPromises = new Map();
  const voiceDebugLog = [];
  const initialLowStimulus =
    window.__APPRAISAL_LOW_STIMULUS_BOOT__ ??
    (localStorage.getItem(STIMULUS_STORAGE_KEY) === "true" || motionReduced.matches);
  const speechFallbackProfiles = {
    narrator: { pitch: 0.86, rate: 1, volume: 0.88 },
    player: { pitch: 1.02, rate: PLAYER_CRISP_RATE, volume: 0.92 },
    mentor: { pitch: 0.84, rate: 1, volume: 0.96 },
    anxiousClient: { pitch: 1.1, rate: 1.02, volume: 0.92 },
    aggressiveClient: { pitch: 0.86, rate: 1.06, volume: 0.96 },
    elderlyClient: { pitch: 0.9, rate: 1, volume: 0.92 },
    corporateClient: { pitch: 0.94, rate: 0.99, volume: 0.93 },
    casualClient: { pitch: 1.14, rate: 1.06, volume: 0.92 },
    quietWitness: { pitch: 1.04, rate: 0.98, volume: 0.88 },
    client: { pitch: 0.96, rate: 0.99, volume: 0.92 },
  };
  const voiceRateCaps = {
    narrator: 1.25,
    player: PLAYER_CRISP_RATE_CAP,
    mentor: 1,
    elderlyClient: 1,
    corporateClient: 1.02,
    quietWitness: 1,
  };
  const clientCastByPortrait = {
    "portrait-tanaka": "elderlyClient",
    "portrait-saeki": "corporateClient",
    "portrait-kurokawa": "aggressiveClient",
    "portrait-ehara": "aggressiveClient",
    "portrait-kubo": "anxiousClient",
    "portrait-segawa": "elderlyClient",
    "portrait-tachibana": "quietWitness",
    "portrait-hayami": "aggressiveClient",
    "portrait-onuki": "corporateClient",
    "portrait-kanzaki": "quietWitness",
  };
  const voiceCast = {
    narrator: {
      speakerPreferences: ["九州そら"],
      styleRules: { scene_set: ["ノーマル", "ふつう", "normal"], neutral: ["ノーマル", "ふつう", "normal"] },
      defaults: { speed: 1, pitch: -0.025, intonation: 1.08, volume: 0.9, pre: 0.1, post: 0.1, maxRate: 1.25 },
    },
    player: {
      speakerPreferences: ["雀松朱司"],
      strictSpeakerPreference: true,
      styleRules: {
        internal_focus: ["ノーマル", "ふつう"],
        question: ["ノーマル", "ふつう"],
        neutral: ["ノーマル", "ふつう"],
      },
      defaults: { speed: PLAYER_CRISP_RATE, pitch: 0.006, intonation: 1.13, volume: 0.92, pre: 0.06, post: 0.08, maxRate: PLAYER_CRISP_RATE_CAP },
    },
    mentor: {
      speakerPreferences: ["青山龍星"],
      styleRules: {
        stern_correction: ["ノーマル", "ふつう"],
        low_warning: ["ノーマル", "ふつう"],
        praise: ["ノーマル", "ふつう"],
        neutral: ["ノーマル", "ふつう"],
      },
      defaults: { speed: 0.98, pitch: -0.025, intonation: 0.98, volume: 0.96, pre: 0.14, post: 0.16, maxRate: 1 },
    },
    anxiousClient: {
      speakerPreferences: ["白上虎太郎", "ずんだもん", "小夜", "SAYO", "冥鳴ひまり", "雨晴はう", "四国めたん"],
      styleRules: { anxious_pressure: ["びくびく", "なみだめ", "びえーん", "ヘロヘロ", "ノーマル", "ふつう"], relief: ["喜", "わーい", "あまあま", "ノーマル", "ふつう"], neutral: ["びくびく", "ノーマル", "ふつう"] },
      defaults: { speed: 1.04, pitch: 0.035, intonation: 1.32, volume: 0.94, pre: 0.1, post: 0.14 },
    },
    aggressiveClient: {
      speakerPreferences: ["玄野武宏", "青山龍星", "白上虎太郎", "四国めたん"],
      styleRules: { aggressive_pressure: ["ツンギレ", "不機嫌", "おこ", "熱血", "ツンツン", "ノーマル", "ふつう"], doubt: ["不機嫌", "ツンギレ", "ノーマル", "ふつう"], neutral: ["不機嫌", "ノーマル", "ふつう"] },
      defaults: { speed: 1.12, pitch: -0.025, intonation: 1.22, volume: 0.98, pre: 0.08, post: 0.1 },
    },
    elderlyClient: {
      speakerPreferences: ["玄野武宏"],
      styleRules: { anxious_pressure: ["ノーマル", "しっとり", "落ち着", "ふつう"], neutral: ["ノーマル", "しっとり", "落ち着", "ふつう"] },
      defaults: { speed: 1, pitch: -0.012, intonation: 1.08, volume: 0.92, pre: 0.1, post: 0.12, maxRate: 1 },
    },
    corporateClient: {
      speakerPreferences: ["ナースロボ", "No.7", "九州そら", "四国めたん", "青山龍星"],
      styleRules: { aggressive_pressure: ["楽々", "アナウンス", "ツンツン", "ノーマル", "ふつう"], doubt: ["アナウンス", "ノーマル", "ふつう"], neutral: ["アナウンス", "ノーマル", "ふつう"] },
      defaults: { speed: 0.99, pitch: -0.005, intonation: 1.12, volume: 0.94, pre: 0.1, post: 0.12 },
    },
    casualClient: {
      speakerPreferences: ["春日部つむぎ", "満別花丸", "ずんだもん", "四国めたん"],
      styleRules: { anxious_pressure: ["ぶりっ子", "なみだめ", "弱", "ノーマル", "ふつう"], relief: ["喜", "元気", "わーい", "ノーマル", "ふつう"], neutral: ["元気", "ノーマル", "ふつう"] },
      defaults: { speed: 1.08, pitch: 0.06, intonation: 1.42, volume: 0.93, pre: 0.08, post: 0.14 },
    },
    quietWitness: {
      speakerPreferences: ["四国めたん", "九州そら", "小夜", "SAYO", "冥鳴ひまり", "もち子さん"],
      styleRules: { neutral: ["泣き", "ノーマル", "ふつう"], anxious_pressure: ["泣き", "ノーマル", "ふつう"] },
      defaults: { speed: 0.96, pitch: 0.01, intonation: 1.18, volume: 0.9, pre: 0.12, post: 0.14 },
    },
  };
  const emotionQueryAdjustments = {
    neutral: {},
    scene_set: { speed: 0, intonation: 0.06, pre: 0.02, post: 0.04 },
    internal_focus: { speed: 0, pitch: 0.005, intonation: 0.1, pre: 0.02, post: 0.04 },
    question: { speed: 0.01, pitch: 0.02, intonation: 0.14, post: 0.06 },
    low_warning: { speed: -0.02, pitch: -0.01, intonation: -0.02, pre: 0.04, post: 0.06 },
    stern_correction: { speed: 0, pitch: -0.01, intonation: 0.04, pre: 0.04, post: 0.06 },
    anxious_pressure: { speed: 0.02, pitch: 0.025, intonation: 0.14, pre: 0.02, post: 0.06 },
    aggressive_pressure: { speed: 0.08, pitch: -0.012, intonation: 0.12, post: -0.02 },
    doubt: { speed: 0, pitch: -0.005, intonation: 0.08, post: 0.05 },
    relief: { speed: 0, pitch: 0.02, intonation: 0.1, post: 0.05 },
    praise: { speed: 0, pitch: 0.01, intonation: 0.08, post: 0.05 },
    result_good: { speed: 0, pitch: 0.01, intonation: 0.1, post: 0.05 },
    result_bad: { speed: -0.02, pitch: -0.01, intonation: -0.02, post: 0.08 },
  };
  const pronunciationLexicon = [
    ["NOI", "エヌオーアイ"],
    ["ＤＣＦ", "ディーシーエフ"],
    ["DCF", "ディーシーエフ"],
  ];

  function runtime() {
    return window.APPRAISAL_RUNTIME ?? {};
  }

  function currentPhase() {
    return runtime().getPhase?.() ?? -1;
  }

  function lowStimulus() {
    return Boolean(runtime().isLowStimulus?.());
  }

  function bgmForCurrentPhase() {
    const phase = currentPhase();
    if (phase < 0) return "caseSelect";
    if (phase === 4) return "confrontation";
    if (phase > 4) return "result";
    return "investigation";
  }

  function bgmStatusLabel() {
    if (bgmMuted) return "停止中";
    if (lowStimulus()) return "低刺激で停止";
    return bgmPrimed ? "再生中" : "待機中";
  }

  function seStatusLabel() {
    return audioMuted ? "停止中" : "有効";
  }

  function voiceSupported() {
    return voicevoxSupported() || speechVoiceSupported();
  }

  function speechVoiceSupported() {
    return typeof window.speechSynthesis === "object" && typeof window.SpeechSynthesisUtterance === "function";
  }

  function voicevoxSupported() {
    return (
      !window.__APPRAISAL_DISABLE_VOICEVOX__ &&
      typeof window.fetch === "function" &&
      typeof Audio === "function" &&
      typeof URL === "function" &&
      typeof URL.createObjectURL === "function" &&
      (VOICEVOX_DIRECT_URLS.length > 0 || Boolean(VOICEVOX_PROXY_PATH))
    );
  }

  function voiceStatusLabel() {
    if (!voiceSupported()) return "未対応";
    if (voiceMuted) return "停止中";
    if (lowStimulus()) return "低刺激で停止";
    if (voiceSpeaking && lastVoiceBackendStatus === "voicevox") return "VOICEVOX";
    if (voiceSpeaking && lastVoiceBackendStatus === "fallback") return "代替音声";
    if (voiceSpeaking) return "再生中";
    if (!voicePrimed) return "待機中";
    if (voicevoxAvailable === true) return "VOICEVOX";
    if (voicevoxAvailable === false) return "代替音声";
    return "有効";
  }

  function stimulusStatusLabel() {
    return lowStimulus() ? "有効" : "無効";
  }

  function renderBgmToggle() {
    const bgmToggle = document.querySelector("#bgm-toggle");
    if (!bgmToggle) return;
    bgmToggle.textContent = `BGM ${bgmStatusLabel()}`;
    bgmToggle.setAttribute("aria-pressed", String(!bgmMuted));
    bgmToggle.setAttribute(
      "aria-label",
      lowStimulus() && !bgmMuted
        ? "BGMはオンですが、低刺激モードにより停止中です"
        : bgmMuted
        ? "BGMを再生可能にする"
        : bgmPrimed
        ? "BGMを停止する"
        : "BGMは次のクリックまたはキー操作で再生します。押すと停止中にします",
    );
  }

  function renderAudioToggle() {
    const audioToggle = document.querySelector("#audio-toggle");
    if (!audioToggle) return;
    audioToggle.textContent = audioMuted ? "SE OFF" : "SE ON";
    audioToggle.setAttribute("aria-pressed", String(!audioMuted));
  }

  function renderVoiceToggle() {
    const voiceToggle = document.querySelector("#voice-toggle");
    if (!voiceToggle) return;
    voiceToggle.textContent = `VOICE ${voiceStatusLabel()}`;
    voiceToggle.setAttribute("aria-pressed", String(!voiceMuted && voiceSupported()));
    voiceToggle.disabled = !voiceSupported();
  }

  function renderStimulusToggle() {
    const stimulusToggle = document.querySelector("#stimulus-toggle");
    if (!stimulusToggle) return;
    stimulusToggle.textContent = lowStimulus() ? "低刺激 ON" : "低刺激 OFF";
    stimulusToggle.setAttribute("aria-pressed", String(lowStimulus()));
  }

  function setBgmTrack(nextKey) {
    if (!bgmAudio) return;
    if (bgmKey === nextKey) return;
    const track = BGM_TRACKS[nextKey];
    bgmKey = nextKey;
    bgmAudio.loop = true;
    bgmAudio.preload = bgmPrimed ? "auto" : "none";
    bgmAudio.volume = track.volume;
    bgmAudio.src = track.src;
  }

  function setBgmSceneOverride(nextKey) {
    bgmSceneOverride = nextKey;
  }

  function updateBgmTrack() {
    setBgmTrack(bgmSceneOverride ?? bgmForCurrentPhase());
  }

  function updateBgmPlayback() {
    renderBgmToggle();
    if (!bgmAudio) return;
    updateBgmTrack();
    if (bgmMuted || lowStimulus() || !bgmPrimed) {
      bgmAudio.pause();
      return;
    }
    bgmAudio.play().catch(() => {
      bgmPrimed = false;
    });
  }

  function primeBgmPlayback(event) {
    const bgmToggle = document.querySelector("#bgm-toggle");
    if (event?.target?.closest?.("#bgm-toggle") && !bgmMuted) return;
    if (event?.type === "keydown" && document.activeElement === bgmToggle && !bgmMuted) return;
    bgmPrimed = true;
    updateBgmPlayback();
  }

  function primeVoicePlayback() {
    voicePrimed = true;
    if (pendingVoiceLines) prewarmVoiceLines(pendingVoiceLines.lines);
    scheduleVoiceStart();
    renderVoiceToggle();
  }

  function ensureAudio() {
    if (audioMuted) return null;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    audioContext ??= new AudioContextCtor();
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  }

  function playTone(frequency, duration = 0.08, volume = 0.035, type = "sine") {
    if (lowStimulus()) return;
    const context = ensureAudio();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  function playClick() {
    playTone(560, 0.045, 0.025, "triangle");
  }

  function playEvidence() {
    playTone(720, 0.09, 0.04, "square");
    window.setTimeout(() => playTone(980, 0.06, 0.025, "triangle"), 58);
  }

  function playPressure() {
    playTone(125, 0.18, 0.045, "sawtooth");
  }

  function playResult() {
    playTone(420, 0.12, 0.04, "triangle");
    window.setTimeout(() => playTone(630, 0.12, 0.032, "triangle"), 120);
  }

  function playCaseSelect() {
    playTone(180, 0.1, 0.03, "triangle");
  }

  function cleanVoiceText(value = "") {
    const template = document.createElement("template");
    template.innerHTML = String(value);
    return (template.content.textContent ?? String(value))
      .replace(/[「」]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function castIdForLine(line = {}) {
    if (line.kind === "mentor") return "mentor";
    if (line.kind === "player") return "player";
    if (line.kind === "narrator") return "narrator";
    return clientCastByPortrait[line.portraitClass] ?? "client";
  }

  function emotionForLine(line = {}, text = "") {
    if (line.emotion) return line.emotion;
    const isQuestion = /[？?]$/.test(text) || /ですか|ますか|ませんか|でしょうか/.test(text);
    const isPressure = /困|助か|高め|低め|強め|軽め|満額|最大|銀行|融資|止ま|揉め|急|寄せ|見ていただ|できれば/.test(text);
    if (line.kind === "mentor") {
      if (/だが|根拠|切り分け|混ぜるな|分けて|支え|収め|消すな|説明可能|戻さなくていい|守れている/.test(text)) return "stern_correction";
      return /よく|十分|できた|適合/.test(text) ? "praise" : "low_warning";
    }
    if (line.kind === "client") {
      const castId = castIdForLine(line);
      if (isPressure) return castId === "aggressiveClient" || castId === "corporateClient" ? "aggressive_pressure" : "anxious_pressure";
      if (isQuestion) return "doubt";
      return "neutral";
    }
    if (line.kind === "player") return isQuestion ? "question" : "internal_focus";
    if (line.kind === "narrator") return "scene_set";
    return "neutral";
  }

  function buildUtterancePlan(line = {}) {
    const displayText = cleanVoiceText(line.text);
    const castId = castIdForLine(line);
    const emotion = emotionForLine(line, displayText);
    const spokenText = spokenTextForLine(displayText, { ...line, castId, emotion });
    const phrases = phrasePlanForLine(spokenText, { ...line, castId, emotion });
    const fallbackProfile = speechProfileForPlan({ ...line, castId, emotion });
    return {
      line,
      displayText,
      spokenText,
      castId,
      emotion,
      intensity: intensityForLine(line, displayText, emotion),
      phrases,
      fallbackProfile,
      phraseCount: phrases.length,
    };
  }

  function spokenTextForLine(text, plan) {
    let spoken = applyPronunciationLexicon(text);
    if (plan.kind === "mentor") {
      spoken = spoken
        .replace("数字の裏に人の都合がある。", "数字の裏には、人の都合がある。")
        .replace("どの案件も、数字の裏に人の都合がある。", "どの案件も、数字の裏には、人の都合がある。")
        .replace("。だが、", "。……だが、")
        .replace("鑑定評価は同情ではなく根拠で切り分けろ。", "鑑定評価は、同情ではなく、根拠で分ける。希望では分けない。")
        .replace("根拠で切り分けろ。", "根拠で分ける。希望では分けない。")
        .replace("正常価格と担保リスクは混ぜるな。", "正常価格と担保リスクは、別に見よう。")
        .replace("探せ。", "手がかりを探そう。")
        .replace("選別しろ。", "使える根拠だけを選ぼう。")
        .replace("支えろ。", "根拠で支えよう。そこは省かない。")
        .replace("返せ。", "根拠カードで返そう。");
    }
    if (plan.kind === "player") {
      spoken = spoken
        .replace("拾います。", "拾います。")
        .replace("決めます。", "決めます。");
    }
    if (plan.kind === "client") {
      spoken = spoken
        .replace("本当にその評価額になるんですか。", "本当に、その評価額になるんですか？")
        .replace("できますか。", "できますか？")
        .replace("ませんか。", "ませんか？")
        .replace("ですよね。", "ですよね？");
      if (plan.emotion === "anxious_pressure") {
        spoken = spoken
          .replace(/^父の遺した/, "あの……父の遺した")
          .replace(/^買主には/, "できれば、買主には")
          .replace(/^そこまで/, "えっ、そこまで")
          .replace(/^こちらに/, "あの、こちらに");
      }
      if (plan.emotion === "aggressive_pressure") {
        spoken = spoken
          .replace(/^銀行が見るので、/, "銀行が見るので。")
          .replace(/^銀行提出用なので、/, "銀行提出用なので。")
          .replace(/^融資が止まると/, "融資が止まると、")
          .replace(/^市も前向きですし、/, "市も前向きです。");
      }
    }
    if (plan.kind === "narrator") {
      spoken = spoken.replace("第一章", "第一章。").replace("第二章", "第二章。").replace("第三章", "第三章。").replace("第四章", "第四章。");
    }
    return spoken;
  }

  function applyPronunciationLexicon(text) {
    return pronunciationLexicon.reduce((nextText, [source, reading]) => nextText.replaceAll(source, reading), text);
  }

  function phrasePlanForLine(spokenText, plan) {
    if (!spokenText) return [];
    if (plan.kind === "mentor" && /……だが、|……/.test(spokenText)) {
      const [lead, tail] = spokenText.includes("……だが、") ? spokenText.split("……だが、") : spokenText.split("……", 2);
      return [
        { text: lead.trim(), pauseAfter: 240, tone: "low_warning" },
        { text: `${spokenText.includes("……だが、") ? "……だが、" : "……"}${tail.trim()}`, pauseAfter: 0, tone: "stern_correction" },
      ].filter((phrase) => phrase.text);
    }
    if (plan.kind === "player" && spokenText.includes("……でも、")) {
      const [lead, tail] = spokenText.split("……でも、");
      return [
        { text: lead.trim(), pauseAfter: 220, tone: "internal_focus" },
        { text: `……でも、${tail.trim()}`, pauseAfter: 0, tone: "question" },
      ].filter((phrase) => phrase.text);
    }
    if (plan.kind === "client" && /。/.test(spokenText) && /pressure/.test(plan.emotion)) {
      const sentences = spokenText
        .split(/(?<=。)/)
        .map((part) => part.trim())
        .filter(Boolean);
      if (sentences.length > 1) {
        return sentences.map((text, index) => ({
          text,
          pauseAfter: index === sentences.length - 1 ? 0 : plan.emotion === "aggressive_pressure" ? 120 : 190,
          tone: plan.emotion,
        }));
      }
    }
    if (spokenText.length > 72 && /。/.test(spokenText)) {
      const sentences = spokenText
        .split(/(?<=。)/)
        .map((part) => part.trim())
        .filter(Boolean);
      if (sentences.length > 1) {
        return sentences.map((text, index) => ({
          text,
          pauseAfter: index === sentences.length - 1 ? 0 : plan.kind === "narrator" ? 220 : 170,
          tone: plan.emotion,
        }));
      }
    }
    return [{ text: spokenText, pauseAfter: pauseAfterForPlan(plan, spokenText), tone: plan.emotion }];
  }

  function pauseAfterForPlan(plan, text) {
    if (/[？?]$/.test(text)) return 170;
    if (plan.emotion === "stern_correction") return 180;
    if (plan.emotion === "anxious_pressure") return 140;
    if (plan.emotion === "aggressive_pressure") return 100;
    if (plan.kind === "narrator") return 190;
    return 110;
  }

  function speechProfileForPlan(plan) {
    const base = speechFallbackProfiles[plan.castId] ?? speechFallbackProfiles[plan.kind] ?? speechFallbackProfiles.client;
    const adjustment = emotionQueryAdjustments[plan.emotion] ?? {};
    const maxRate = rateCapForPlan(plan);
    const tempoMultiplier = tempoMultiplierForVoice(plan);
    return {
      kind: plan.kind,
      pitch: clampVoice(base.pitch + (adjustment.pitch ?? 0) * 2.2, 0.55, 1.35),
      rate: clampVoice((base.rate + (adjustment.speed ?? 0)) * tempoMultiplier, 0.86, maxRate),
      volume: clampVoice(base.volume + (adjustment.volume ?? 0), 0.72, 1),
    };
  }

  function tempoMultiplierForVoice(plan = {}) {
    return isNarratorVoice(plan) ? NARRATOR_TEMPO_MULTIPLIER : 1;
  }

  function isNarratorVoice(plan = {}) {
    return plan.kind === "narrator" || plan.castId === "narrator";
  }

  function rateCapForCast(castId, kind) {
    return voiceRateCaps[castId] ?? voiceRateCaps[kind] ?? 1.18;
  }

  function rateCapForPlan(plan = {}) {
    return isNarratorVoice(plan) ? NARRATOR_TEMPO_MULTIPLIER : rateCapForCast(plan.castId, plan.kind);
  }

  function intensityForLine(line, text, emotion) {
    if (/pressure|correction/.test(emotion)) return 0.72;
    if (/[！？!?]/.test(text)) return 0.62;
    if (line.kind === "mentor") return 0.58;
    return 0.45;
  }

  function japaneseVoices() {
    if (!speechVoiceSupported()) return [];
    return window.speechSynthesis
      .getVoices()
      .filter((voice) => /^ja([-_]|$)/i.test(voice.lang) || /Japanese|日本|Kyoko|Otoya|Haruka|Ichiro/i.test(voice.name));
  }

  function pickVoice(profile) {
    const voices = japaneseVoices();
    if (!voices.length) return null;
    if (profile.kind === "mentor" || profile.kind === "player" || profile.pitch < 0.85) {
      return voices.find((voice) => /Otoya|Ichiro|\bMale\b|男性/i.test(voice.name)) ?? voices[0];
    }
    if (profile.pitch > 1.05) {
      return voices.find((voice) => /Kyoko|Haruka|Sayaka|\bFemale\b|女性/i.test(voice.name)) ?? voices[0];
    }
    return voices[0];
  }

  function canSpeakVoice() {
    return voiceSupported() && voicePrimed && !voiceMuted && !lowStimulus();
  }

  function speakLines(lines = [], { key = "" } = {}) {
    const normalized = lines
      .map((line) => ({
        ...line,
        text: cleanVoiceText(line.text),
      }))
      .filter((line) => line.text);
    if (!normalized.length || key === activeVoiceKey) return;
    pendingVoiceLines = { lines: normalized, key };
    if (!canSpeakVoice()) {
      clearVoiceStartTimer();
      renderVoiceToggle();
      return;
    }
    prewarmVoiceLines(normalized);
    scheduleVoiceStart();
  }

  function playPendingVoiceLines() {
    if (!pendingVoiceLines || !canSpeakVoice()) return;
    clearVoiceStartTimer();
    const { lines, key } = pendingVoiceLines;
    pendingVoiceLines = null;
    activeVoiceKey = key;
    const token = ++activeVoiceToken;
    cancelSpeechVoice();
    cancelVoicevoxAudio();
    voiceSpeaking = true;
    renderVoiceToggle();
    speakVoiceQueue(expandVoiceQueue(lines), token, 0);
  }

  function expandVoiceQueue(lines) {
    return lines.flatMap((line) => {
      const plan = buildUtterancePlan(line);
      return plan.phrases.map((part, index) => ({
        ...line,
        displayText: plan.displayText,
        spokenText: plan.spokenText,
        castId: plan.castId,
        emotion: part.tone ?? plan.emotion,
        intensity: plan.intensity,
        phraseCount: plan.phraseCount,
        phraseIndex: index,
        ...part,
        pauseAfter: Math.round((part.pauseAfter ?? 0) / tempoMultiplierForVoice(plan)),
        profile: plan.fallbackProfile,
      }));
    });
  }

  function scheduleVoiceStart(delayMs = VOICE_START_DELAY_MS) {
    if (!pendingVoiceLines || !canSpeakVoice()) return;
    clearVoiceStartTimer();
    voiceStartTimer = window.setTimeout(() => {
      voiceStartTimer = 0;
      playPendingVoiceLines();
    }, delayMs);
  }

  function clearVoiceStartTimer() {
    if (!voiceStartTimer) return;
    window.clearTimeout(voiceStartTimer);
    voiceStartTimer = 0;
  }

  function prewarmVoiceLines(lines = []) {
    if (!voicevoxSupported() || voiceMuted || lowStimulus()) return;
    const parts = expandVoiceQueue(lines);
    for (const part of parts) {
      prewarmVoicevoxPart(part);
    }
  }

  function voiceParts(text) {
    return buildUtterancePlan({ kind: "narrator", text }).phrases;
  }

  function clampVoice(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  async function speakVoiceQueue(parts, token, index) {
    if (token !== activeVoiceToken || index >= parts.length || !canSpeakVoice()) {
      voiceSpeaking = false;
      renderVoiceToggle();
      return;
    }
    if (voicevoxSupported() && voicevoxAvailable !== false) {
      const completed = await speakVoicevoxQueue(parts, token, index);
      if (completed || token !== activeVoiceToken || !canSpeakVoice()) {
        voiceSpeaking = false;
        renderVoiceToggle();
        return;
      }
    }
    speakSpeechQueue(parts, token, index);
  }

  async function speakVoicevoxQueue(parts, token, index) {
    for (let nextIndex = index; nextIndex < parts.length; nextIndex += 1) {
      if (token !== activeVoiceToken || !canSpeakVoice()) return true;
      const part = parts[nextIndex];
      try {
        lastVoiceBackendStatus = "voicevox";
        renderVoiceToggle();
        await speakVoicevoxPart(part, token);
        if (part.pauseAfter > 0) await delay(part.pauseAfter);
      } catch {
        voicevoxAvailable = false;
        lastVoiceBackendStatus = "fallback";
        cancelVoicevoxAudio();
        renderVoiceToggle();
        return false;
      }
    }
    return true;
  }

  async function speakVoicevoxPart(part, token) {
    const voiceStyle = await resolveVoicevoxStyle(part);
    const profile = part.profile;
    const synthesized = await synthesizeVoicevoxPart(part, voiceStyle, profile);
    debugVoice(voiceDebugEntry(part, voiceStyle, profile, synthesized));
    await playVoicevoxAudio(synthesized.audioUrl, token, profile.volume);
    voicevoxAvailable = true;
    lastVoiceBackendStatus = "voicevox";
    renderVoiceToggle();
  }

  async function prewarmVoicevoxPart(part) {
    try {
      const voiceStyle = await resolveVoicevoxStyle(part);
      await synthesizeVoicevoxPart(part, voiceStyle, part.profile);
      voicevoxAvailable = true;
      renderVoiceToggle();
    } catch {
      // Prewarm is opportunistic. Playback can still fall back or synthesize live.
    }
  }

  function voiceDebugEntry(part, voiceStyle, profile, synthesized) {
    return {
      backend: "voicevox",
      speakerName: voiceStyle.speakerName,
      speakerUuid: voiceStyle.speakerUuid,
      styleName: voiceStyle.name,
      styleId: voiceStyle.id,
      castId: part.castId,
      emotion: part.emotion,
      displayText: part.displayText,
      spokenText: part.spokenText,
      phraseText: part.text,
      phraseCount: part.phraseCount,
      phraseIndex: part.phraseIndex,
      cacheKey: synthesized.cacheKey,
      cached: synthesized.cached,
      profile: {
        rate: profile.rate,
        pitch: profile.pitch,
        volume: profile.volume,
      },
      query: synthesized.query
        ? {
            speedScale: synthesized.query.speedScale,
            pitchScale: synthesized.query.pitchScale,
            intonationScale: synthesized.query.intonationScale,
            volumeScale: synthesized.query.volumeScale,
            prePhonemeLength: synthesized.query.prePhonemeLength,
            postPhonemeLength: synthesized.query.postPhonemeLength,
          }
        : null,
    };
  }

  async function synthesizeVoicevoxPart(part, voiceStyle, profile) {
    const speakerId = voiceStyle.id;
    const cacheKey = voiceCacheKey(part, voiceStyle, profile);
    const cachedAudioUrl = voicevoxAudioCache.get(cacheKey);
    if (cachedAudioUrl) return { audioUrl: cachedAudioUrl, cacheKey, cached: true, query: null };
    if (voicevoxSynthesisPromises.has(cacheKey)) {
      const synthesized = await voicevoxSynthesisPromises.get(cacheKey);
      return { ...synthesized, cached: true };
    }
    const synthesisPromise = (async () => {
      const query = await voicevoxJson("audio_query", {
        method: "POST",
        params: { text: part.text, speaker: speakerId },
      });
      applyVoicePlanToQuery(query, part, voiceStyle);
      const audioBlob = await voicevoxBlob("synthesis", {
        method: "POST",
        params: { speaker: speakerId },
        body: JSON.stringify(query),
      });
      const audioUrl = URL.createObjectURL(audioBlob);
      rememberVoicevoxAudio(cacheKey, audioUrl);
      return { audioUrl, cacheKey, cached: false, query };
    })();
    voicevoxSynthesisPromises.set(cacheKey, synthesisPromise);
    try {
      return await synthesisPromise;
    } finally {
      voicevoxSynthesisPromises.delete(cacheKey);
    }
  }

  async function resolveVoicevoxStyle(part) {
    const speakers = await voicevoxSpeakers();
    const cast = voiceCast[part.castId] ?? voiceCast.client ?? voiceCast.narrator;
    const preferredNames = cast.speakerPreferences ?? [];
    for (const name of preferredNames) {
      const speaker = speakers.find((candidate) => normalizedText(candidate.name).includes(normalizedText(name)));
      const style = pickStyleForSpeaker(speaker, cast, part.emotion);
      if (style) return { ...style, speakerName: speaker.name, speakerUuid: speaker.speaker_uuid };
    }
    if (cast.strictSpeakerPreference) {
      throw new Error(`Preferred VOICEVOX speaker is unavailable for ${part.castId ?? "unknown cast"}`);
    }
    for (const speaker of speakers) {
      const style = pickStyleForSpeaker(speaker, cast, part.emotion);
      if (style) return { ...style, speakerName: speaker.name, speakerUuid: speaker.speaker_uuid };
    }
    throw new Error("VOICEVOX speaker styles are unavailable");
  }

  function pickStyleForSpeaker(speaker, cast, emotion) {
    const styles = (speaker?.styles ?? []).filter((style) => Number.isFinite(style.id));
    if (!styles.length) return null;
    const preferredPatterns = [...(cast.styleRules?.[emotion] ?? []), ...(cast.styleRules?.neutral ?? [])];
    for (const pattern of preferredPatterns) {
      const normalizedPattern = normalizedText(pattern);
      const style = styles.find((candidate) => normalizedText(candidate.name).includes(normalizedPattern));
      if (style) return style;
    }
    return styles.find((candidate) => /ノーマル|ふつう|normal/i.test(candidate.name ?? "")) ?? styles[0];
  }

  function normalizedText(value = "") {
    return String(value).normalize("NFKC").toLowerCase();
  }

  function voicevoxSpeakers() {
    voicevoxSpeakersPromise ??= voicevoxJson("speakers", { method: "GET" });
    return voicevoxSpeakersPromise;
  }

  function applyVoicePlanToQuery(query, part) {
    const cast = voiceCast[part.castId] ?? voiceCast.client ?? voiceCast.narrator;
    const defaults = cast.defaults ?? voiceCast.narrator.defaults;
    const emotion = emotionQueryAdjustments[part.emotion] ?? {};
    const isQuestion = /[？?]$/.test(part.text) || /ですか|ますか|ませんか/.test(part.text);
    const maxRate = isNarratorVoice(part) ? NARRATOR_TEMPO_MULTIPLIER : defaults.maxRate ?? rateCapForCast(part.castId, part.kind);
    const tempoMultiplier = tempoMultiplierForVoice(part);
    query.speedScale = clampVoice((defaults.speed + (emotion.speed ?? 0)) * tempoMultiplier, 0.82, maxRate);
    query.pitchScale = clampVoice(defaults.pitch + (emotion.pitch ?? 0) + (isQuestion ? 0.012 : 0), -0.06, 0.08);
    query.intonationScale = clampVoice(defaults.intonation + (emotion.intonation ?? 0) + (isQuestion ? 0.08 : 0), 0.86, 1.38);
    query.volumeScale = clampVoice(defaults.volume + (emotion.volume ?? 0), 0.72, 1);
    query.prePhonemeLength = clampVoice((defaults.pre + (emotion.pre ?? 0) + (part.phraseIndex > 0 ? 0.02 : 0)) / tempoMultiplier, 0.02, 0.16);
    query.postPhonemeLength = clampVoice((defaults.post + (emotion.post ?? 0) + part.pauseAfter / 2200) / tempoMultiplier, 0.04, 0.2);
  }

  function voiceCacheKey(part, voiceStyle, profile) {
    return [
      VOICE_ACTING_VERSION,
      PRONUNCIATION_LEXICON_VERSION,
      voiceStyle.speakerUuid ?? "",
      voiceStyle.speakerName ?? "",
      voiceStyle.id,
      voiceStyle.name ?? "",
      part.castId,
      part.emotion,
      part.intensity,
      hashText(part.displayText ?? ""),
      hashText(part.spokenText ?? ""),
      hashText(`${part.phraseIndex}/${part.phraseCount}:${part.text}:${part.pauseAfter}`),
      profile.rate.toFixed(3),
      profile.pitch.toFixed(3),
      profile.volume.toFixed(3),
    ].join("|");
  }

  function hashText(text = "") {
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) {
      hash = (hash * 31 + text.charCodeAt(index)) | 0;
    }
    return Math.abs(hash).toString(36);
  }

  async function voicevoxJson(path, options = {}) {
    const response = await voicevoxFetch(path, options);
    return response.json();
  }

  async function voicevoxBlob(path, options = {}) {
    const response = await voicevoxFetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    });
    return response.blob();
  }

  async function voicevoxFetch(path, options = {}) {
    let lastError = null;
    for (const url of voicevoxCandidateUrls(path, options.params ?? {})) {
      try {
        const response = await fetch(url, {
          method: options.method ?? "GET",
          headers: options.headers,
          body: options.body,
        });
        if (response.ok) return response;
        lastError = new Error(`VOICEVOX request failed: ${response.status}`);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError ?? new Error("VOICEVOX request failed");
  }

  function voicevoxCandidateUrls(path, params = {}) {
    const candidates = [];
    for (const baseUrl of VOICEVOX_DIRECT_URLS) {
      candidates.push(new URL(path, `${baseUrl.replace(/\/$/, "")}/`));
    }
    if (VOICEVOX_PROXY_PATH) {
      candidates.push(new URL(`${VOICEVOX_PROXY_PATH.replace(/\/$/, "")}/${path}`, window.location.origin));
    }
    for (const url of candidates) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }
    }
    return candidates;
  }

  function playVoicevoxAudio(audioUrl, token, volume) {
    return new Promise((resolve, reject) => {
      if (token !== activeVoiceToken || !canSpeakVoice()) {
        resolve();
        return;
      }
      const audio = new Audio(audioUrl);
      activeVoicevoxAudio = audio;
      audio.volume = clampVoice(volume, 0.2, 1);
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("VOICEVOX audio playback failed"));
      audio.play().catch(reject);
    });
  }

  function rememberVoicevoxAudio(key, audioUrl) {
    voicevoxAudioCache.set(key, audioUrl);
    if (voicevoxAudioCache.size <= 120) return;
    const [oldestKey, oldestUrl] = voicevoxAudioCache.entries().next().value;
    URL.revokeObjectURL(oldestUrl);
    voicevoxAudioCache.delete(oldestKey);
  }

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function speakSpeechQueue(parts, token, index) {
    if (!speechVoiceSupported()) {
      voiceSpeaking = false;
      renderVoiceToggle();
      return;
    }
    const part = parts[index];
    const profile = part.profile;
    lastVoiceBackendStatus = "fallback";
    debugVoice({
      backend: "fallback",
      castId: part.castId,
      emotion: part.emotion,
      displayText: part.displayText,
      spokenText: part.spokenText,
      phraseText: part.text,
      phraseCount: part.phraseCount,
      phraseIndex: part.phraseIndex,
    });
    renderVoiceToggle();
    const utterance = new SpeechSynthesisUtterance(part.text);
    utterance.lang = "ja-JP";
    utterance.pitch = profile.pitch;
    utterance.rate = profile.rate;
    utterance.volume = profile.volume;
    utterance.voice = pickVoice(profile);
    utterance.onend = () => {
      window.setTimeout(() => speakVoiceQueue(parts, token, index + 1), part.pauseAfter);
    };
    utterance.onerror = () => {
      window.setTimeout(() => speakVoiceQueue(parts, token, index + 1), part.pauseAfter);
    };
    window.speechSynthesis.speak(utterance);
  }

  function cancelSpeechVoice() {
    if (speechVoiceSupported()) window.speechSynthesis.cancel();
  }

  function cancelVoicevoxAudio() {
    if (!activeVoicevoxAudio) return;
    activeVoicevoxAudio.pause();
    activeVoicevoxAudio.removeAttribute?.("src");
    activeVoicevoxAudio = null;
  }

  function cancelVoice() {
    pendingVoiceLines = null;
    activeVoiceToken += 1;
    activeVoiceKey = "";
    voiceSpeaking = false;
    lastVoiceBackendStatus = "idle";
    clearVoiceStartTimer();
    cancelSpeechVoice();
    cancelVoicevoxAudio();
    renderVoiceToggle();
  }

  function debugVoice(entry) {
    voiceDebugLog.push({ at: Date.now(), ...entry });
    if (voiceDebugLog.length > 80) voiceDebugLog.shift();
  }

  function toggleBgm() {
    bgmMuted = !bgmMuted;
    if (!bgmMuted) bgmPrimed = true;
    localStorage.setItem(BGM_STORAGE_KEY, String(bgmMuted));
    updateBgmPlayback();
  }

  function toggleAudio() {
    audioMuted = !audioMuted;
    localStorage.setItem(AUDIO_STORAGE_KEY, String(audioMuted));
    renderAudioToggle();
  }

  function toggleVoice() {
    if (!voiceSupported()) return;
    if (!voiceMuted && !voicePrimed) {
      voicePrimed = true;
      if (pendingVoiceLines) prewarmVoiceLines(pendingVoiceLines.lines);
      scheduleVoiceStart();
      renderVoiceToggle();
      return;
    }
    voiceMuted = !voiceMuted;
    if (!voiceMuted) {
      voicePrimed = true;
      voicevoxAvailable = null;
      voicevoxSpeakersPromise = null;
      if (pendingVoiceLines) prewarmVoiceLines(pendingVoiceLines.lines);
      scheduleVoiceStart();
    } else {
      cancelVoice();
    }
    localStorage.setItem(VOICE_STORAGE_KEY, String(voiceMuted));
    renderVoiceToggle();
  }

  window.APPRAISAL_AUDIO = {
    AUDIO_STORAGE_KEY,
    BGM_STORAGE_KEY,
    VOICE_STORAGE_KEY,
    VOICEVOX_PROXY_PATH,
    VOICEVOX_DIRECT_URLS,
    STIMULUS_STORAGE_KEY,
    initialLowStimulus,
    bgmStatusLabel,
    seStatusLabel,
    voiceStatusLabel,
    stimulusStatusLabel,
    renderBgmToggle,
    renderAudioToggle,
    renderVoiceToggle,
    renderStimulusToggle,
    setBgmSceneOverride,
    updateBgmPlayback,
    primeBgmPlayback,
    primeVoicePlayback,
    speakLines,
    prewarmVoiceLines,
    voiceParts,
    buildUtterancePlan,
    resolveVoicevoxStyle,
    voicevoxSupported,
    voiceDebugLog,
    cancelVoice,
    playClick,
    playEvidence,
    playPressure,
    playResult,
    playCaseSelect,
    toggleBgm,
    toggleAudio,
    toggleVoice,
  };
})();
