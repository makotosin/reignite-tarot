/* REIGNITE TAROT - background music and subtle sound effects */
(() => {
  'use strict';
  const STORAGE_KEY = 'reigniteTarotAudioV1';
  const music = new Audio('audio/bgm.mp3');
  music.loop = true;
  music.preload = 'none';
  let enabled = false;
  let volume = 0.35;

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (typeof saved.volume === 'number' && Number.isFinite(saved.volume)) {
      volume = Math.min(1, Math.max(0, saved.volume));
    }
  } catch (_) {}
  music.volume = volume;

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume })); } catch (_) {}
  }

  let context = null;
  function getContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!context) context = new AudioContextClass();
    return context;
  }

  async function unlockEffects() {
    try {
      const ctx = getContext();
      if (ctx && ctx.state === 'suspended') await ctx.resume();
    } catch (error) { console.warn('効果音の初期化に失敗しました', error); }
  }

  function sound(kind) {
    if (!enabled || volume <= 0) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      if (ctx.state !== 'running') {
        ctx.resume().then(() => { if (enabled) playTone(ctx, kind); }).catch(() => {});
      } else {
        playTone(ctx, kind);
      }
    } catch (error) { console.warn('効果音を再生できませんでした', error); }
  }

  function playTone(ctx, kind) {
    if (!enabled || volume <= 0 || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    // Slightly more audible than the previous version, still restrained.
    const level = Math.min(0.14, volume * 0.3);
    const settings = kind === 'pick'
      ? { frequency: 880, end: 1180, duration: 0.26, type: 'sine' }
      : kind === 'reveal'
        ? { frequency: 240, end: 460, duration: 0.95, type: 'sine' }
        : { frequency: 145, end: 82, duration: 1.6, type: 'triangle' };
    const osc = ctx.createOscillator();
    osc.type = settings.type;
    osc.frequency.setValueAtTime(settings.frequency, now);
    osc.frequency.exponentialRampToValueAtTime(settings.end, now + settings.duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + settings.duration);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + settings.duration + 0.02);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }

  function mountEffects() {
    document.addEventListener('click', event => {
      const card = event.target.closest?.('.deck-card');
      if (card && !card.classList.contains('picked') && !card.disabled) sound('pick');
    }, true);

    const revealRoot = document.getElementById('revealed-cards');
    if (revealRoot) {
      const revealed = new WeakSet();
      const observer = new MutationObserver(() => {
        revealRoot.querySelectorAll('.flip-card.open').forEach(card => {
          if (!revealed.has(card)) { revealed.add(card); sound('reveal'); }
        });
      });
      observer.observe(revealRoot, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    }

    const spirit = document.getElementById('spirit-event');
    if (spirit) {
      let wasVisible = !spirit.hidden;
      const observer = new MutationObserver(() => {
        const visible = !spirit.hidden;
        if (visible && !wasVisible) sound('spirit');
        wasVisible = visible;
      });
      observer.observe(spirit, { attributes: true, attributeFilter: ['hidden'] });
    }
  }

  function mount() {
    const panel = document.createElement('div');
    panel.className = 'audio-controls';
    panel.setAttribute('aria-label', '音楽の設定');
    panel.innerHTML = `
      <button type="button" class="audio-toggle" aria-pressed="false" aria-label="BGMを再生">♪ OFF</button>
      <label class="audio-volume-label" for="audio-volume">音量</label>
      <input id="audio-volume" class="audio-volume" type="range" min="0" max="100" step="5" value="${Math.round(volume * 100)}" aria-label="BGM音量">
    `;
    document.body.appendChild(panel);
    const toggle = panel.querySelector('.audio-toggle');
    const slider = panel.querySelector('.audio-volume');

    function refresh() {
      toggle.textContent = enabled ? '♪ ON' : '♪ OFF';
      toggle.setAttribute('aria-pressed', String(enabled));
      toggle.setAttribute('aria-label', enabled ? 'BGMを停止' : 'BGMを再生');
    }

    toggle.addEventListener('click', async () => {
      if (enabled) {
        enabled = false;
        music.pause();
        refresh();
        return;
      }
      try {
        await music.play();
        enabled = true;
        await unlockEffects();
      } catch (error) {
        enabled = false;
        music.pause();
        console.warn('BGMを再生できませんでした', error);
      }
      refresh();
    });

    slider.addEventListener('input', () => {
      volume = Number(slider.value) / 100;
      music.volume = volume;
      save();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) music.pause();
      else if (enabled) music.play().catch(() => {});
    });
    refresh();
    mountEffects();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
