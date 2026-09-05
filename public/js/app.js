// Main application logic

const scanBtn = document.getElementById('scan-btn');
const selectAllBtn = document.getElementById('select-all');
const clearAllBtn = document.getElementById('clear-all');
const sortSelect = document.getElementById('sort-select');
const closeBtn = document.querySelector('.close');

// Initialize on page load
window.addEventListener('load', async () => {
  await ui.renderExchangesList();
});

// Exchange selection controls
selectAllBtn.addEventListener('click', () => {
  document.querySelectorAll('.exchange-checkbox input[type="checkbox"]').forEach(cb => {
    cb.checked = true;
    ui.selectedExchanges.push(cb.value);
  });
  ui.selectedExchanges = [...new Set(ui.selectedExchanges)];
});

clearAllBtn.addEventListener('click', () => {
  document.querySelectorAll('.exchange-checkbox input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
  ui.selectedExchanges = [];
});

// Scan button
scanBtn.addEventListener('click', async () => {
  const pair = document.getElementById('pair-input').value.trim().toUpperCase();
  const amount = parseFloat(document.getElementById('amount-input').value);
  const minLiquidity = parseFloat(document.getElementById('liquidity-input').value);
  const minSpread = parseFloat(document.getElementById('spread-input').value);

  if (!pair) {
    alert('Укажите торговую пару');
    return;
  }

  if (ui.selectedExchanges.length < 2) {
    alert('Выберите минимум 2 биржи');
    return;
  }

  if (!amount || amount <= 0) {
    alert('Укажите корректную сумму');
    return;
  }

  scanBtn.disabled = true;
  scanBtn.textContent = '⏳ Сканирование...';

  try {
    const result = await apiClient.scan({
      exchanges: ui.selectedExchanges,
      pair: pair,
      minAmount: amount,
      minLiquidity: minLiquidity,
      minSpread: minSpread
    });

    if (result.success) {
      ui.renderSignals(result.signals);
    } else {
      alert(result.error || 'Ошибка при сканировании');
    }
  } catch (error) {
    console.error('Scan error:', error);
    alert('Ошибка при сканировании: ' + error.message);
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = '🔍 Сканировать';
  }
});

// Sorting
sortSelect.addEventListener('change', (e) => {
  ui.sortSignals(e.target.value);
});

// Modal close
closeBtn.addEventListener('click', () => {
  document.getElementById('modal').style.display = 'none';
});

window.addEventListener('click', (e) => {
  const modal = document.getElementById('modal');
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});
