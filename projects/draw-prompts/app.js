// Drawing prompt generator. Loads prompts.json, picks a template, fills slots.
// Slots referenced multiple times in one template (e.g. {creature} ... {creature})
// resolve to *different* values each time, which is what makes Mad-Libs feel alive.

(async function () {
  const data = await fetch('prompts.json').then(r => r.json());
  const tiers = data.tiers;
  const tierKeys = Object.keys(tiers);

  let currentTier = localStorage.getItem('draw-prompts-tier') || 'medium';
  if (!tierKeys.includes(currentTier)) currentTier = 'medium';

  const $tierRow = document.getElementById('tier-row');
  const $tierDesc = document.getElementById('tier-description');
  const $prompt = document.getElementById('prompt-text');
  const $printablePrompt = document.getElementById('printable-prompt');
  const $newBtn = document.getElementById('new-btn');
  const $printBtn = document.getElementById('print-btn');

  // Build the tier toggle row.
  tierKeys.forEach(key => {
    const btn = document.createElement('button');
    btn.className = 'tier-btn';
    btn.dataset.tier = key;
    btn.textContent = tiers[key].label;
    btn.addEventListener('click', () => {
      currentTier = key;
      localStorage.setItem('draw-prompts-tier', key);
      renderTier();
      newPrompt();
    });
    $tierRow.appendChild(btn);
  });

  function renderTier() {
    document.querySelectorAll('.tier-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tier === currentTier);
    });
    $tierDesc.textContent = tiers[currentTier].description;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generate(tierKey) {
    const tier = tiers[tierKey];
    const template = pick(tier.templates);
    // Replace each {slot} occurrence independently so repeats get different values.
    let out = template.replace(/\{(\w+)\}/g, (_match, slot) => {
      const list = tier.slots[slot];
      if (!list) return `{${slot}}`;
      return pick(list);
    });
    // Capitalize first letter.
    out = out.charAt(0).toUpperCase() + out.slice(1);
    return out;
  }

  function newPrompt() {
    const text = generate(currentTier);
    $prompt.textContent = text;
    $printablePrompt.textContent = text;
  }

  $newBtn.addEventListener('click', newPrompt);
  $printBtn.addEventListener('click', () => {
    // Make sure the printable mirror is current, then trigger print.
    $printablePrompt.textContent = $prompt.textContent;
    window.print();
  });

  renderTier();
  newPrompt();
})();
