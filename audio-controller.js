(() => {
  const AUDIO_STORAGE_KEY = "appraisal-detective-audio-muted";
  const BGM_STORAGE_KEY = "appraisal-detective-bgm-muted";
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
  let bgmPrimed = false;
  let bgmKey = "";
  let bgmSceneOverride = null;
  const bgmAudio = typeof Audio === "function" ? new Audio() : null;
  const initialLowStimulus =
    window.__APPRAISAL_LOW_STIMULUS_BOOT__ ??
    (localStorage.getItem(STIMULUS_STORAGE_KEY) === "true" || motionReduced.matches);

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

  window.APPRAISAL_AUDIO = {
    AUDIO_STORAGE_KEY,
    BGM_STORAGE_KEY,
    STIMULUS_STORAGE_KEY,
    initialLowStimulus,
    bgmStatusLabel,
    seStatusLabel,
    stimulusStatusLabel,
    renderBgmToggle,
    renderAudioToggle,
    renderStimulusToggle,
    setBgmSceneOverride,
    updateBgmPlayback,
    primeBgmPlayback,
    playClick,
    playEvidence,
    playPressure,
    playResult,
    playCaseSelect,
    toggleBgm,
    toggleAudio,
  };
})();
