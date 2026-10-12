/* REIGNITE TAROT - optional background music controller */
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
    // Start muted on every launch; sound requires an explicit user action.
  } catch (_) {}
  music.volume = volume;

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume })); } catch (_) {}
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
      } catch (error) {
        enabled = false;
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
