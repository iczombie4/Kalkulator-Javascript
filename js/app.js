/**
 * Modern Kalkulator Logic (Refactored from 2016 Vanilla JS)
 * Eliminates eval(), undeclared globals, and form reload bugs.
 * Adds dynamic rows, history, sound effects, safe precision math, and toast alerts.
 */

(function () {
  'use strict';

  // --- Sound Effects using Web Audio API (No external assets required) ---
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    }

    playClick() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      } catch (e) {
        // Audio might be blocked by user gesture policy
      }
    }

    playSuccess() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 chord
        freqs.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);
          gain.gain.setValueAtTime(0.08, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.18);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.2);
        });
      } catch (e) {}
    }

    playError() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
      } catch (e) {}
    }
  }

  const sound = new SoundManager();

  // --- State & DOM References ---
  const state = {
    theme: localStorage.getItem('calc_theme') || 'dark',
    sound: localStorage.getItem('calc_sound') !== 'false',
    history: JSON.parse(localStorage.getItem('calc_history') || '[]'),
    requireAllCheckboxes: true, // Faithful to original terms, terms2, terms3 check!
    rowCount: 0
  };

  sound.enabled = state.sound;

  const el = {
    inputRowsList: document.getElementById('inputRowsList'),
    addInputBtn: document.getElementById('addInputBtn'),
    selectAllBtn: document.getElementById('selectAllBtn'),
    clearInputsBtn: document.getElementById('clearInputsBtn'),
    resultValue: document.getElementById('resultValue'),
    resultExpression: document.getElementById('resultExpression'),
    copyResultBtn: document.getElementById('copyResultBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    historyList: document.getElementById('historyList'),
    historyCount: document.getElementById('historyCount'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    requireAllToggle: document.getElementById('requireAllToggle'),
    toastContainer: document.getElementById('toastContainer'),
    calcCard: document.getElementById('calcCard')
  };

  // --- Notification Toast System ---
  function showToast(message, type = 'info', duration = 3200) {
    if (!el.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'error') {
      icon = '⚠️';
      sound.playError();
      if (el.calcCard) {
        el.calcCard.classList.remove('shake');
        void el.calcCard.offsetWidth; // trigger reflow
        el.calcCard.classList.add('shake');
      }
    } else if (type === 'success') {
      icon = '✅';
    }

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 260);
    }, duration);
  }

  // --- Dynamic Input Row Generator ---
  function getLetterLabel(index) {
    return String.fromCharCode(65 + index); // 0 -> A, 1 -> B, 2 -> C, ...
  }

  function createInputRow(index, value = '', isChecked = true) {
    const letter = getLetterLabel(index);
    const row = document.createElement('div');
    row.className = 'input-row';
    row.id = `row-${letter.toLowerCase()}`;
    row.dataset.index = index;

    row.innerHTML = `
      <div class="input-badge" title="Input ${letter}">${letter}</div>
      <div class="input-field-wrapper">
        <input type="number" step="any" class="num-input" id="input-${letter.toLowerCase()}" 
          placeholder="Nilai ${letter} (angka)..." value="${value}" autocomplete="off">
      </div>
      <label class="toggle-wrapper" title="Sertakan ${letter} dalam kalkulasi (seperti checkbox asli)">
        <input type="checkbox" class="custom-checkbox row-checkbox" id="terms-${letter.toLowerCase()}" ${isChecked ? 'checked' : ''}>
        <span class="toggle-label">Ceklis</span>
      </label>
      <button type="button" class="delete-row-btn" title="Hapus baris ini">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    `;

    // Row Checkbox Change Event
    const checkbox = row.querySelector('.row-checkbox');
    checkbox.addEventListener('change', () => {
      sound.playClick();
      updateRowState(row, checkbox.checked);
    });

    // Delete Button Event
    const deleteBtn = row.querySelector('.delete-row-btn');
    deleteBtn.addEventListener('click', () => {
      sound.playClick();
      deleteRow(row);
    });

    // Enter Key Event in Input
    const input = row.querySelector('.num-input');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        calculate('+'); // Default action on enter
      }
    });

    return row;
  }

  function updateRowState(row, isChecked) {
    if (isChecked) {
      row.classList.remove('is-disabled');
    } else {
      row.classList.add('is-disabled');
    }
  }

  function refreshRowBadges() {
    const rows = el.inputRowsList.querySelectorAll('.input-row');
    rows.forEach((row, idx) => {
      const letter = getLetterLabel(idx);
      row.id = `row-${letter.toLowerCase()}`;
      row.dataset.index = idx;
      
      const badge = row.querySelector('.input-badge');
      if (badge) {
        badge.textContent = letter;
        badge.title = `Input ${letter}`;
      }
      
      const input = row.querySelector('.num-input');
      if (input) {
        input.id = `input-${letter.toLowerCase()}`;
        input.placeholder = `Nilai ${letter} (angka)...`;
      }
      
      const checkbox = row.querySelector('.row-checkbox');
      if (checkbox) {
        checkbox.id = `terms-${letter.toLowerCase()}`;
      }

      // Hide delete button if only 2 rows remain
      const deleteBtn = row.querySelector('.delete-row-btn');
      if (deleteBtn) {
        deleteBtn.style.visibility = rows.length <= 2 ? 'hidden' : 'visible';
      }
    });
    state.rowCount = rows.length;
  }

  function addRow(value = '', isChecked = true) {
    const newIndex = el.inputRowsList.querySelectorAll('.input-row').length;
    if (newIndex >= 10) {
      showToast('Maksimum 10 baris input diperbolehkan.', 'info');
      return;
    }
    const row = createInputRow(newIndex, value, isChecked);
    el.inputRowsList.appendChild(row);
    refreshRowBadges();
    const input = row.querySelector('.num-input');
    if (input) input.focus();
  }

  function deleteRow(row) {
    const rows = el.inputRowsList.querySelectorAll('.input-row');
    if (rows.length <= 2) {
      showToast('Minimal harus ada 2 baris input untuk kalkulasi.', 'error');
      return;
    }
    row.style.opacity = '0';
    row.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      row.remove();
      refreshRowBadges();
    }, 200);
  }

  // --- Validation Logic (Faithful to original cek(), but modern & bug-free) ---
  function validateInputs() {
    const rows = Array.from(el.inputRowsList.querySelectorAll('.input-row'));
    if (rows.length === 0) return { valid: false, error: 'Tidak ada baris input' };

    // Check if requireAllCheckboxes is enabled
    if (state.requireAllCheckboxes) {
      const unchecked = rows.filter(r => !r.querySelector('.row-checkbox').checked);
      if (unchecked.length > 0) {
        // This reproduces the original: alert('ceklis semua terlebih dahulu')
        return {
          valid: false,
          error: 'Ceklis semua terlebih dahulu sebelum menghitung!'
        };
      }
    }

    // Collect all checked values
    const activeRows = rows.filter(r => r.querySelector('.row-checkbox').checked);
    if (activeRows.length < 2) {
      return {
        valid: false,
        error: 'Minimal centang 2 input untuk melakukan perhitungan.'
      };
    }

    const numbers = [];
    for (const r of activeRows) {
      const letter = r.querySelector('.input-badge').textContent;
      const rawVal = r.querySelector('.num-input').value.trim();

      if (rawVal === '') {
        return {
          valid: false,
          error: `Harap isi angka pada Input ${letter}.`
        };
      }

      const num = Number(rawVal);
      if (isNaN(num)) {
        return {
          valid: false,
          error: `Nilai pada Input ${letter} bukan angka yang valid.`
        };
      }

      numbers.push({ letter, value: num });
    }

    return { valid: true, items: numbers };
  }

  // --- Accurate Safe Math Execution (Replaces eval) ---
  function calculate(operator) {
    sound.playClick();

    const validation = validateInputs();
    if (!validation.valid) {
      showToast(validation.error, 'error');
      return;
    }

    const items = validation.items;
    let result = items[0].value;
    let expressionParts = [items[0].value];

    for (let i = 1; i < items.length; i++) {
      const nextVal = items[i].value;
      expressionParts.push(operator);
      expressionParts.push(nextVal);

      switch (operator) {
        case '+':
          result += nextVal;
          break;
        case '-':
          result -= nextVal;
          break;
        case '*':
          result *= nextVal;
          break;
        case '/':
          if (nextVal === 0) {
            showToast('Kesalahan: Tidak dapat membagi dengan nol (0).', 'error');
            return;
          }
          result /= nextVal;
          break;
        case '%':
          if (nextVal === 0) {
            showToast('Kesalahan: Modulo dengan nol tidak terdefinisi.', 'error');
            return;
          }
          result %= nextVal;
          break;
        default:
          return;
      }
    }

    // Fix floating point quirks like 0.1 + 0.2 = 0.30000000000000004
    const cleanResult = Math.round(result * 1e12) / 1e12;
    const expressionStr = expressionParts.join(' ') + ' =';

    displayResult(cleanResult, expressionStr);
    sound.playSuccess();

    // Add to calculation history
    addHistoryItem({
      expression: expressionParts.join(' '),
      operator,
      result: cleanResult,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
  }

  // Calculate Average
  function calculateAverage() {
    sound.playClick();
    const validation = validateInputs();
    if (!validation.valid) {
      showToast(validation.error, 'error');
      return;
    }

    const items = validation.items;
    const sum = items.reduce((acc, curr) => acc + curr.value, 0);
    const avg = sum / items.length;
    const cleanResult = Math.round(avg * 1e12) / 1e12;
    const expressionStr = `avg(${items.map(i => i.value).join(', ')}) =`;

    displayResult(cleanResult, expressionStr);
    sound.playSuccess();

    addHistoryItem({
      expression: `avg(${items.map(i => i.value).join(', ')})`,
      operator: 'Avg',
      result: cleanResult,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
  }

  function displayResult(value, expression) {
    if (el.resultExpression) el.resultExpression.textContent = expression;
    if (el.resultValue) {
      el.resultValue.textContent = value.toLocaleString('id-ID', { maximumFractionDigits: 10 });
      el.resultValue.classList.remove('highlight');
      void el.resultValue.offsetWidth;
      el.resultValue.classList.add('highlight');
    }
  }

  // --- Calculation History System ---
  function addHistoryItem(item) {
    state.history.unshift(item);
    if (state.history.length > 20) state.history.pop();
    try {
      localStorage.setItem('calc_history', JSON.stringify(state.history));
    } catch (e) {}
    renderHistory();
  }

  function renderHistory() {
    if (!el.historyList || !el.historyCount) return;

    el.historyCount.textContent = state.history.length;
    el.historyList.innerHTML = '';

    if (state.history.length === 0) {
      el.historyList.innerHTML = `<div class="history-empty">Belum ada riwayat perhitungan.</div>`;
      return;
    }

    state.history.forEach((item) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'history-item';
      itemEl.title = `Waktu: ${item.timestamp} (Klik untuk menyalin hasil)`;

      itemEl.innerHTML = `
        <span class="history-expression">${item.expression}</span>
        <span class="history-result">= ${item.result}</span>
      `;

      itemEl.addEventListener('click', () => {
        sound.playClick();
        navigator.clipboard.writeText(item.result.toString());
        showToast(`Hasil ${item.result} disalin ke clipboard!`, 'success', 2000);
      });

      el.historyList.appendChild(itemEl);
    });
  }

  function clearHistory() {
    sound.playClick();
    state.history = [];
    localStorage.removeItem('calc_history');
    renderHistory();
    showToast('Riwayat perhitungan telah dibersihkan.', 'info');
  }

  // --- Theme & Sound Toggles ---
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('calc_theme', theme);

    if (el.themeToggleBtn) {
      el.themeToggleBtn.innerHTML = theme === 'dark' 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>`;
      el.themeToggleBtn.title = theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap';
    }
  }

  function toggleTheme() {
    sound.playClick();
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  }

  function toggleSound() {
    state.sound = !state.sound;
    sound.enabled = state.sound;
    localStorage.setItem('calc_sound', state.sound.toString());
    updateSoundBtn();
    if (state.sound) sound.playClick();
  }

  function updateSoundBtn() {
    if (!el.soundToggleBtn) return;
    el.soundToggleBtn.innerHTML = state.sound
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
    el.soundToggleBtn.title = state.sound ? 'Suara Aktif (Klik untuk Mute)' : 'Suara Senyap (Klik untuk Aktifkan)';
  }

  // --- Batch Actions ---
  function selectAllCheckboxes(checked = true) {
    sound.playClick();
    const checkboxes = el.inputRowsList.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = checked;
      const row = cb.closest('.input-row');
      if (row) updateRowState(row, checked);
    });
  }

  function clearAllInputs() {
    sound.playClick();
    const inputs = el.inputRowsList.querySelectorAll('.num-input');
    inputs.forEach(i => i.value = '');
    if (el.resultValue) el.resultValue.textContent = '0';
    if (el.resultExpression) el.resultExpression.textContent = 'Siap menghitung';
    if (inputs[0]) inputs[0].focus();
    showToast('Form telah dikosongkan.', 'info', 1800);
  }

  function copyCurrentResult() {
    sound.playClick();
    const valText = el.resultValue ? el.resultValue.textContent : '0';
    // Remove formatting commas/dots for clean clipboard value
    navigator.clipboard.writeText(valText).then(() => {
      showToast(`Hasil (${valText}) berhasil disalin!`, 'success', 2000);
    }).catch(() => {
      showToast('Gagal menyalin ke clipboard.', 'error');
    });
  }

  // --- Keyboard Shortcuts ---
  window.addEventListener('keydown', (e) => {
    // If user is focused on an input and presses operator keys directly
    if (['+', '-', '*', '/'].includes(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
      // If active element is a num-input, check if value already has text
      if (document.activeElement && document.activeElement.classList.contains('num-input')) {
        // Allow typing minus for negative numbers if input is empty
        if (e.key === '-' && document.activeElement.value === '') {
          return;
        }
        e.preventDefault();
        calculate(e.key);
      }
    } else if (e.key === 'Escape') {
      clearAllInputs();
    }
  });

  // --- Initialize App ---
  function init() {
    applyTheme(state.theme);
    updateSoundBtn();

    // Default setup: 3 rows (A, B, C) preserving the original project!
    addRow('', true);
    addRow('', true);
    addRow('', true);

    // Render historical calculations
    renderHistory();

    // Event Listeners for Header Controls
    if (el.themeToggleBtn) el.themeToggleBtn.addEventListener('click', toggleTheme);
    if (el.soundToggleBtn) el.soundToggleBtn.addEventListener('click', toggleSound);

    // Input actions
    if (el.addInputBtn) el.addInputBtn.addEventListener('click', () => { sound.playClick(); addRow(); });
    if (el.selectAllBtn) {
      let allSelected = true;
      el.selectAllBtn.addEventListener('click', () => {
        allSelected = !allSelected;
        selectAllCheckboxes(allSelected);
        el.selectAllBtn.textContent = allSelected ? 'Batal Ceklis Semua' : 'Centang Semua';
      });
    }
    if (el.clearInputsBtn) el.clearInputsBtn.addEventListener('click', clearAllInputs);
    if (el.copyResultBtn) el.copyResultBtn.addEventListener('click', copyCurrentResult);
    if (el.clearHistoryBtn) el.clearHistoryBtn.addEventListener('click', clearHistory);

    // Operator Buttons
    document.querySelectorAll('.op-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const op = btn.dataset.op;
        if (op) calculate(op);
      });
    });

    // Secondary Operator Buttons (Modulo, Average)
    const modBtn = document.getElementById('opMod');
    if (modBtn) modBtn.addEventListener('click', () => calculate('%'));

    const avgBtn = document.getElementById('opAvg');
    if (avgBtn) avgBtn.addEventListener('click', calculateAverage);

    // Require All Checkboxes Toggle
    if (el.requireAllToggle) {
      el.requireAllToggle.checked = state.requireAllCheckboxes;
      el.requireAllToggle.addEventListener('change', () => {
        sound.playClick();
        state.requireAllCheckboxes = el.requireAllToggle.checked;
        showToast(state.requireAllCheckboxes 
          ? 'Mode Validasi: Wajib centang semua (Sesuai kode awal).'
          : 'Mode Fleksibel: Hanya input yang dicentang yang dihitung.', 'info', 2500);
      });
    }
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
