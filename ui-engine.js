'use strict';

/* ═══════════════════════════════════════════════════════
   FABCARE — UI-ENGINE.JS
   Wardrobe Asset Vault — DOM Elements Layout Rendering & Handlers
═══════════════════════════════════════════════════════ */

/* ─── METRICS CALCULATION STRIP ────────────────────────── */
function updateMetrics() {
  D.metricTotal.textContent  = state.assets.length;
  D.metricCats.textContent   = new Set(state.assets.map(a => a.type)).size;
  if (state.assets.length) {
    D.metricLatest.textContent = fmtDate(state.assets[0].created_at);
  } else {
    D.metricLatest.textContent = '—';
  }
}

/* ─── FILTER & CLIENT-SIDE SORT ROUTING ────────────────── */
function applyFilters() {
  let r = [...state.assets];

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    r = r.filter(a => [a.brand, a.name, a.type, a.color, a.fabric].some(v => v && v.toLowerCase().includes(q)));
  }

  if (state.filterType) r = r.filter(a => a.type === state.filterType);

  if (state.filterSort === 'name') r.sort((a, b) => a.name.localeCompare(b.name));
  else r.sort((a, b) => b.id - a.id);

  state.filtered = r;
  renderGrid();
}

/* ─── INTERFACE GRID RENDER ────────────────────────────── */
function renderGrid() {
  D.grid.innerHTML = '';
  if (!state.filtered.length) { D.emptyState.classList.add('visible'); return; }
  D.emptyState.classList.remove('visible');
  state.filtered.forEach((a, i) => D.grid.appendChild(createCard(a, i)));
}

function createCard(asset, index) {
  const card = document.createElement('article');
  card.className = 'asset-card';
  if (state.isTreatmentMode && state.selectedAssets.has(asset.id)) card.classList.add('selected');
  card.style.animationDelay = `${index * 35}ms`;
  card.dataset.id = asset.id;
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');

  card.innerHTML = `
    <div class="card-image-wrap">
      ${asset.img
        ? `<img class="card-image" src="${asset.img}" alt="${asset.brand} ${asset.name}" loading="lazy" />`
        : `<div class="card-image-placeholder">${asset.brand.charAt(0)}</div>`
      }
      <span class="card-type-badge">${cap(asset.type)}</span>
    </div>
    <div class="card-body">
      <p class="card-brand">${asset.brand}</p>
      <h3 class="card-name">${asset.name}</h3>
      <span class="card-fabric">${asset.fabric}</span>
    </div>`;

  card.addEventListener('click', () => handleCardClick(asset.id, card));
  return card;
}

function handleCardClick(id, cardEl) {
  if (state.isTreatmentMode) {
    if (state.selectedAssets.has(id)) { state.selectedAssets.delete(id); cardEl.classList.remove('selected'); }
    else                              { state.selectedAssets.add(id);    cardEl.classList.add('selected'); }
    updateTreatBar();
  } else {
    openModal(id);
  }
}

/* ─── TREATMENT MODE PROCESS ───────────────────────────── */
function startTreatmentMode(type) {
  state.isTreatmentMode = true;
  state.treatmentType   = type;
  state.selectedAssets.clear();

  const meta = TREAT_META[type];
  D.treatBadgeLabel.textContent  = meta.label;
  D.btnTreatments.classList.add('active');
  D.treatBar.classList.add('visible');
  D.metricStrip.style.opacity        = '0.3';
  D.metricStrip.style.pointerEvents  = 'none';

  updateTreatBar();
  renderGrid();
}

/* ─── TREATMENT INTERACTION LAYOUT ENDERS ──────────────── */
function endTreatmentMode() {
  state.isTreatmentMode = false;
  state.treatmentType   = '';
  state.selectedAssets.clear();

  D.btnTreatments.classList.remove('active');
  D.treatBar.classList.remove('visible');
  D.metricStrip.style.opacity       = '';
  D.metricStrip.style.pointerEvents = '';

  renderGrid();
}

function updateTreatBar() {
  const n = state.selectedAssets.size;
  D.treatCount.textContent = `${n} item${n !== 1 ? 's' : ''}`;
  D.btnConfirmTreat.classList.toggle('ready', n > 0);
}

function openTreatConfirm() {
  const meta = TREAT_META[state.treatmentType];
  const selectedGarments = state.assets.filter(a => state.selectedAssets.has(a.id));

  D.stageReview.classList.add('active');
  D.stageWizard.classList.remove('active');

  D.treatConfirmIcon.textContent    = meta.icon;
  D.treatConfirmHeading.textContent = meta.heading;
  D.treatConfirmSub.textContent     = meta.sub;
  D.treatConfirmItems.innerHTML     = selectedGarments
    .map(a => `<span class="treat-confirm-pill">${a.brand} ${a.name}</span>`)
    .join('');

  D.treatConfirmOverlay.classList.add('open');
  D.treatConfirmOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeTreatConfirm() {
  D.treatConfirmOverlay.classList.remove('open');
  D.treatConfirmOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ─── PROPERTIES INFO MODAL DISPLAY ────────────────────── */
function openModal(id) {
  const a = state.assets.find(x => x.id === id);
  if (!a) return;

  state.activeAssetId = id;
  D.modalImgMain.src        = a.img || '';
  D.modalImgMain.alt        = `${a.brand} ${a.name}`;
  D.modalImgTexture.src     = a.texture || '';
  D.modalBadge.textContent  = cap(a.type);
  D.modalBrand.textContent  = a.brand;
  D.modalTitle.textContent  = a.name;
  D.modalType.textContent   = cap(a.type);
  D.modalColor.textContent  = a.color;
  D.modalFabric.textContent = a.fabric;
  D.modalAcquired.textContent = fmtDate(a.created_at);
  D.modalId.textContent     = `FAB-${String(a.id).padStart(3, '0')}`;

  D.modalOverlay.classList.add('open');
  D.modalOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  D.modalOverlay.classList.remove('open');
  D.modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  state.activeAssetId = null;
}

/* ─── INGESTION PROFILE DRAWER OVERLAY ─────────────────── */
function openDrawer(edit = false) {
  if (edit) {
    const a = state.assets.find(x => x.id === state.activeAssetId);
    if (!a) return;

    state.isEditing      = true;
    state.editingAssetId = a.id;
    D.fBrand.value = a.brand;
    D.fType.value  = a.type;
    D.fColor.value = a.color;
    D.fFabric.value = a.fabric;

    if (a.img)     { D.previewGarment.src = a.img;     D.dzGarment.classList.add('has-image'); }
    if (a.texture) { D.previewTexture.src = a.texture; D.dzTexture.classList.add('has-image'); }

    D.drawerTitle.textContent   = 'Edit Asset';
    D.drawerSub.textContent     = `Updating asset FAB-${String(a.id).padStart(3, '0')}`;
    D.submitLabel.textContent   = 'Save Changes';
    closeModal();
  }

  D.drawerOverlay.classList.add('open');
  D.drawerOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  D.drawerOverlay.classList.remove('open');
  D.drawerOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  D.ingestionForm.reset();
  [D.dzGarment, D.dzTexture].forEach(dz => dz.classList.remove('has-image'));
  D.previewGarment.src = '';
  D.previewTexture.src = '';
  D.submitLabel.style.display = 'inline';
  D.submitLabel.textContent   = 'Secure to Vault';
  D.btnLoader.style.display   = 'none';
  D.drawerTitle.textContent   = 'Ingest New Asset';
  D.drawerSub.textContent     = 'Register a garment into the vault';

  state.isEditing      = false;
  state.editingAssetId = null;
}

/* ─── INTERACTION IMAGE DROPZONES ──────────────────────── */
function initDZ(dz, input, preview) {
  dz.addEventListener('click', () => input.click());

  input.addEventListener('change', e => {
    if (e.target.files[0]) loadPreview(e.target.files[0], dz, preview);
  });

  dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) loadPreview(f, dz, preview);
  });
}

function loadPreview(file, dz, preview) {
  const r = new FileReader();
  r.onload = e => { preview.src = e.target.result; dz.classList.add('has-image'); };
  r.readAsDataURL(file);
}

/* ─── GLOBAL EVENT ROUTING CONTROL BINDINGS ────────────── */
function bindEvents() {
  D.btnAddAsset.addEventListener('click', () => openDrawer(false));
  D.btnEditAsset.addEventListener('click', () => openDrawer(true));
  D.drawerClose.addEventListener('click', closeDrawer);
  D.btnCancelDrawer.addEventListener('click', closeDrawer);
  D.drawerOverlay.addEventListener('click', e => { if (e.target === D.drawerOverlay) closeDrawer(); });

  D.modalClose.addEventListener('click', closeModal);
  D.modalOverlay.addEventListener('click', e => { if (e.target === D.modalOverlay) closeModal(); });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (D.treatConfirmOverlay.classList.contains('open')) closeTreatConfirm();
    else if (D.modalOverlay.classList.contains('open'))   closeModal();
    else if (D.drawerOverlay.classList.contains('open'))  closeDrawer();
    else if (state.isTreatmentMode)                       endTreatmentMode();
  });

  D.btnTreatments.addEventListener('click', e => {
    if (state.isTreatmentMode) { endTreatmentMode(); return; }
    e.stopPropagation();
    D.dropdown.classList.toggle('open', !D.dropdown.classList.contains('open'));
  });
  document.addEventListener('click', () => D.dropdown.classList.remove('open'));

  D.dropdown.querySelectorAll('.treat-option').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      D.dropdown.classList.remove('open');
      startTreatmentMode(btn.dataset.treat);
    });
  });

  D.btnCancelTreat.addEventListener('click', endTreatmentMode);
  D.btnConfirmTreat.addEventListener('click', () => {
    if (state.selectedAssets.size === 0) return;
    openTreatConfirm();
  });

  D.treatConfirmCancel.addEventListener('click', closeTreatConfirm);
  D.treatConfirmOk.addEventListener('click', startWizardPresentation);

  D.btnWizardNext.addEventListener('click', handleWizardNext);
  D.btnWizardPrev.addEventListener('click', handleWizardPrev);

  D.searchInput.addEventListener('input',  e => { state.searchQuery = e.target.value; applyFilters(); });
  D.filterType.addEventListener('change',  e => { state.filterType  = e.target.value; applyFilters(); });
  D.filterSort.addEventListener('change',  e => { state.filterSort  = e.target.value; applyFilters(); });

  D.ingestionForm.addEventListener('submit', handleFormSubmit);

  initDZ(D.dzGarment, D.fileGarment, D.previewGarment);
  initDZ(D.dzTexture,  D.fileTexture,  D.previewTexture);
}

/* ─── INITIALIZATION STARTUP ENGINE ────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  fetchFromSupabase();
});