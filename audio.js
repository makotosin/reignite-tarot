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
  // Smoothly lower BGM only while the reveal bell is sounding.
  let bgmMix = 1;
  let fadeFrame = null;
  let restoreTimer = null;
  function applyMusicVolume() {
    music.volume = Math.min(1, Math.max(0, volume * bgmMix));
  }
  function fadeMusic(target, durationMs) {
    if (fadeFrame !== null) cancelAnimationFrame(fadeFrame);
    const from = bgmMix;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = t * t * (3 - 2 * t);
      bgmMix = from + (target - from) * eased;
      applyMusicVolume();
      fadeFrame = t < 1 ? requestAnimationFrame(step) : null;
    }
    fadeFrame = requestAnimationFrame(step);
  }
  function duckForReveal() {
    if (restoreTimer !== null) clearTimeout(restoreTimer);
    fadeMusic(0.4, 200);
    // Keep the bell audible, then gradually restore the original BGM level.
    restoreTimer = setTimeout(() => {
      restoreTimer = null;
      fadeMusic(1, 1100);
    }, 2600);
  }
  applyMusicVolume();

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume })); } catch (_) {}
  }

  // Approved WAV effects. BGM controls and reading event hooks are unchanged.
  const effectFiles = {
    pick: 'audio/card_select.wav',
    reveal: 'audio/card_reveal.wav',
    spirit: 'audio/spirit_appearance.wav'
  };
  const effects = Object.fromEntries(Object.entries(effectFiles).map(([kind, path]) => {
    const audio = new Audio(path);
    audio.preload = 'auto';
    return [kind, audio];
  }));

  function sound(kind) {
    if (!enabled || volume <= 0) return;
    const effect = effects[kind];
    if (!effect) return;
    if (kind === 'reveal') duckForReveal();
    try {
      // Clone to support repeated card actions without cutting off previous audio.
      const instance = effect.cloneNode(true);
      instance.volume = Math.min(1, volume * (kind === 'spirit' ? 1.3 : 0.9));
      instance.play().catch(error => console.warn('効果音を再生できませんでした', error));
    } catch (error) { console.warn('効果音を再生できませんでした', error); }
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
        if (restoreTimer !== null) clearTimeout(restoreTimer);
        restoreTimer = null;
        if (fadeFrame !== null) cancelAnimationFrame(fadeFrame);
        fadeFrame = null;
        bgmMix = 1;
        applyMusicVolume();
        refresh();
        return;
      }
      try {
        await music.play();
        enabled = true;
      } catch (error) {
        enabled = false;
        music.pause();
        console.warn('BGMを再生できませんでした', error);
      }
      refresh();
    });

    slider.addEventListener('input', () => {
      volume = Number(slider.value) / 100;
      applyMusicVolume();
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
