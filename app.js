'use strict';

/* ═══════════════════════════════════════════════════════
   FABCARE — APP.JS (CONNECTED TO SUPABASE BACKEND)
   Wardrobe Asset Vault — State & Cloud Database Routing
═══════════════════════════════════════════════════════ */

// ─── SUPABASE CLOUD CONNECTOR CONFIGURATION ───
const SUPABASE_URL = "https://qigkcngxqizwobvmtdea.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZ2tjbmd4cWl6d29idm10ZGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NDI5OTYsImV4cCI6MjA5NjAxODk5Nn0.EMO_p7d9zvJb8lYcnnAllG5tkrkl8SkXm5HKM3i5IOg";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ─── TREATMENT CONFIG METADATA ────────────────────────── */

const TREAT_META = {
  wash:  { icon: '🫧', label: 'Wash',  heading: 'Schedule a Wash', sub: 'The following garments will be queued for professional cleaning.' },
  dry:   { icon: '☀️', label: 'Dry',   heading: 'Schedule Drying', sub: 'The following garments will be processed for drying.' },
  store: { icon: '📦', label: 'Store', heading: 'Schedule Storage', sub: 'The following garments will be archived into seasonal vault storage.' },
};

/* ─── CENTRAL CLIENT-SIDE MANAGEMENT STATE ──────────────── */

const state = {
  assets:          [], 
  filtered:        [],
  activeAssetId:   null,
  isEditing:       false,
  editingAssetId:  null,
  searchQuery:     '',
  filterType:      '',
  filterSort:      'recent',
  isTreatmentMode: false,
  treatmentType:   '',
  selectedAssets:  new Set(),
  // Slideshow States
  wizardSteps:     [],
  currentStepIndex: 0
};

/* ─── CACHED APPLICATION ELEMENT OBJECT REFS ───────────── */

const $ = id => document.getElementById(id);

const D = {
  grid:              $('asset-grid'),
  emptyState:        $('empty-state'),
  metricStrip:       $('metric-strip'),
  metricTotal:       $('metric-total'),
  metricCats:        $('metric-cats'),
  metricLatest:      $('metric-latest'),
  searchInput:       $('search-input'),
  filterType:        $('filter-type'),
  filterSort:        $('filter-sort'),
  btnTreatments:     $('btn-treatments'),
  dropdown:          $('treatments-dropdown'),
  treatBar:          $('treatment-bar'),
  treatBadgeLabel:   $('treat-badge-label'),
  treatCount:        $('treat-count'),
  btnCancelTreat:    $('btn-cancel-treat'),
  btnConfirmTreat:   $('btn-confirm-treat'),
  btnAddAsset:       $('btn-add-asset'),
  drawerOverlay:     $('drawer-overlay'),
  drawerClose:       $('drawer-close'),
  btnCancelDrawer:   $('btn-cancel-drawer'),
  drawerTitle:       $('drawer-title'),
  drawerSub:         $('drawer-sub'),
  ingestionForm:     $('ingestion-form'),
  submitLabel:       $('submit-label'),
  btnLoader:         $('btn-loader'),
  modalOverlay:      $('modal-overlay'),
  modalClose:        $('modal-close'),
  modalImgMain:      $('modal-img-main'),
  modalImgTexture:   $('modal-img-texture'),
  modalBadge:        $('modal-badge'),
  modalBrand:        $('modal-brand'),
  modalTitle:        $('modal-title'),
  modalType:         $('modal-type'),
  modalColor:        $('modal-color'),
  modalFabric:       $('modal-fabric'),
  modalAcquired:     $('modal-acquired'),
  modalId:           $('modal-id'),
  btnEditAsset:      $('btn-edit-asset'),
  dzGarment:         $('dz-garment'),
  dzTexture:         $('dz-texture'),
  fileGarment:       $('file-garment'),
  fileTexture:       $('file-texture'),
  previewGarment:    $('preview-garment'),
  previewTexture:    $('preview-texture'),
  fBrand:            $('f-brand'),
  fType:             $('f-type'),
  fColor:            $('f-color'),
  fFabric:           $('f-fabric'),
  // Modals and Interactive Stages
  treatConfirmOverlay: $('treat-confirm-overlay'),
  treatConfirmIcon:    $('treat-confirm-icon'),
  treatConfirmHeading: $('treat-confirm-heading'),
  treatConfirmSub:     $('treat-confirm-sub'),
  treatConfirmItems:   $('treat-confirm-items'),
  treatConfirmCancel:  $('treat-confirm-cancel'),
  treatConfirmOk:      $('treat-confirm-ok'),
  stageReview:         $('treat-stage-review'),
  stageWizard:         $('treat-stage-wizard'),
  wizardSlideBody:     $('wizard-slide-body'),
  wizardProgress:      $('wizard-progress'),
  wizardProgressBar:   $('wizard-progress-bar'),
  btnWizardPrev:       $('btn-wizard-prev'),
  btnWizardNext:       $('btn-wizard-next')
};

/* ─── HELPER STRING FORMATTERS ─────────────────────────── */

const cap     = str => str.charAt(0).toUpperCase() + str.slice(1);
const fmtDate = dateStr => {
  if(!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

/* ─── DATA ENGINE FEEDS FROM SUPABASE CLOUD ────────────── */

async function fetchFromSupabase() {
  try {
    const { data, error } = await supabaseClient
      .from('clothes')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    state.assets = data || [];
    applyFilters();
    updateMetrics();
  } catch (err) {
    console.error("Critical Cloud Retrieval Failure:", err.message);
  }
}

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

/* ─── SLIDESHOW STEP GENERATION SYSTEM ─────────────────── */

function generateWizardSteps() {
  const selectedGarments = state.assets.filter(a => state.selectedAssets.has(a.id));
  const steps = [];

  if (state.treatmentType === 'wash') {
    // Step 1: Color Classification
    const groups = new Set(selectedGarments.map(g => g.color_group));
    if (groups.has('dark') && groups.has('white')) {
      steps.push({
        title: "⚠️ High Bleeding Danger!",
        desc: "You grouped <strong>Dark garments</strong> directly with <strong>Crisp Whites</strong>. Dyes from the dark items will transfer in the water, permanently staining or muddying your white items. <br><br><strong>Recommendation:</strong> Take the white items out of this load right now and run them completely separately."
      });
    } else if (groups.has('dark') && groups.has('light')) {
      steps.push({
        title: "⚠️ Color Bleeding Warning",
        desc: "You have mixed dark items with pastel/light fabrics. Over time, slight dye bleed will cause light items to fade and look dull. If you must proceed together, ensure the washer temperature is set to completely cold."
      });
    }

    // Step 2: Restricted Chemistry Submicro
    const containsPoly = selectedGarments.some(g => g.fabric_type === 'polyester');
    let restrictedDesc = `
      <p>• <strong>Detergent Rule:</strong> Use standard pH-neutral liquid detergents (e.g., Tide Liquid or Persil Silk/Wool).</p>
      <p>• <strong>Prohibited Substances:</strong> Never use Chlorine Bleach. It eats away natural fibers, causing your clothes to turn yellow and tear.</p>
    `;
    if (containsPoly) {
      restrictedDesc += `<p style="color:#ff6b6b; margin-top:12px;">• <strong>❌ NO FABRIC SOFTENER:</strong> Your selection includes synthetic polyester. Softener creates a waxy film over synthetics that permanently breaks down their breathability and moisture-wicking power.</p>`;
    }
    steps.push({ title: "🧪 Chemical Restrictions", desc: restrictedDesc });

    // Step 3: Temperature Configuration
    let tempValue = "30°C (Cold Water Setup)";
    let tempReason = "Delicate synthetic or mixed fibers detected. Cold water limits fabric shrinkage, stretching, and color transfer.";
    if (!containsPoly && selectedGarments.every(g => g.fabric_type === 'cotton')) {
      tempValue = "40°C (Warm Water Setup)";
      tempReason = "Purely structural cotton load. Warm water is perfect for breaking down body oils, sweat, and surface mud stains.";
    }
    steps.push({
      title: "💧 Temperature Selection",
      desc: `Set your washing machine dial to: <strong>${tempValue}</strong>.<br><br><span style="font-size:0.85em; opacity:0.75;">Reason: ${tempReason}</span>`
    });

    // Step 4: Mechanical Cycle Choice
    const needsDelicate = selectedGarments.some(g => ['knitwear', 't-shirt'].includes(g.type));
    let cycleValue = needsDelicate ? "Delicate / Low Agitation" : "Normal / Standard Cycle";
    let cycleReason = needsDelicate ? "Knits and T-shirts warp out of shape when spun aggressively. Low agitation preserves seams." : "Sturdy woven items can safely handle traditional spin speeds to lift dirt.";
    steps.push({
      title: "⚙️ Cycle Settings",
      desc: `Set your washer dial mode to: <strong>${cycleValue}</strong>.<br><br><span style="font-size:0.85em; opacity:0.75;">Profile: ${cycleReason}</span>`
    });

    // Step 5: Master Action Blueprint
    steps.push({
      title: "🚀 Final Loading Instructions",
      desc: `<ol style="padding-left:18px; line-height:1.6;">
              <li>Empty all pockets (coins or tissues will damage clothes or melt).</li>
              <li>Turn graphic shirts inside out to protect prints from frictional peeling.</li>
              <li>Add liquid detergent up to <strong>Line 1</strong> on the cap and drop clothes loosely into the drum. Don't overstuff! Close the door and press Start.</li>
             </ol>`
    });

  } else if (state.treatmentType === 'dry') {
    const containsPoly = selectedGarments.some(g => g.fabric_type === 'polyester');
    const containsCotton = selectedGarments.some(g => g.fabric_type === 'cotton');

    let method = "Flat Air Drying / Low Tumble";
    let reason = "Mixed fabrics dry unevenly. High heat shrinks natural cotton and turns synthetic polyester rigid.";
    if (containsPoly && !containsCotton) { method = "Line Hang Dry"; reason = "Synthetics reject heavy water absorption and air-dry incredibly fast on a standard line."; }
    else if (!containsPoly && containsCotton) { method = "Medium Heat Tumble"; reason = "Sturdy cotton can handle tumbling heat. Pull out while slightly damp to prevent wrinkles."; }

    steps.push({ title: "☀️ Drying Strategy", desc: `Recommended Method: <strong>${method}</strong><br><br><span style="font-size:0.85em; opacity:0.75;">Why: ${reason}</span>` });
    steps.push({
      title: "📋 Action Steps",
      desc: `<ol style="padding-left:18px; line-height:1.6;">
              <li>Give each item a firm snap-shake right out of the wash to drop heavy wrinkles.</li>
              <li>If machine drying, always clear out the lint mesh screen before hitting start.</li>
              <li>If air drying sweaters, place them flat on top of a rack. Hanging wet sweaters vertically pulls them completely out of shape.</li>
             </ol>`
    });

  } else if (state.treatmentType === 'store') {
    const needsFolding = selectedGarments.some(g => ['t-shirt', 'knitwear', 'sweater'].includes(g.type));
    let method = needsFolding ? "Horizontal Flat Fold" : "Contoured Hanger Placement";
    let reason = needsFolding ? "Knits stretch out under their own weight if hung. Fold them to preserve their shape." : "Woven shirts and jackets need structured wide hangers to support shoulder contours.";

    steps.push({ title: "📦 Storage Layout", desc: `Archiving Strategy: <strong>${method}</strong><br><br><span style="font-size:0.85em; opacity:0.75;">Preservation Reason: ${reason}</span>` });
    steps.push({
      title: "📋 Preservation Steps",
      desc: `<ol style="padding-left:18px; line-height:1.6;">
              <li>Ensure items are 100% dry. Trapped humidity in a closet creates mildew.</li>
              <li>Stack heavier folded items at the bottom of the drawer stack, lighter on top.</li>
              <li>Keep clothes out of direct window sunlight to prevent colors from fading over time.</li>
             </ol>`
    });
  }

  // Final Success Step
  steps.push({
    title: "🎉 All Set!",
    desc: "You have reviewed and processed the care steps for your selected garments. Click Finish below to complete the cycle and return to your vault ledger panel.",
    isFinal: true
  });

  return steps;
}

/* ─── MODAL DISPLAY CONTROL WINDOWS ────────────────────── */

function openTreatConfirm() {
  const meta = TREAT_META[state.treatmentType];
  const selectedGarments = state.assets.filter(a => state.selectedAssets.has(a.id));

  // Reset Stages back to Review Selection (Stage 1)
  D.stageReview.classList.add('active');
  D.stageWizard.classList.remove('active');

  // Load Review Panel Info (Your original clean UI layout)
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

function startWizardPresentation() {
  state.wizardSteps = generateWizardSteps();
  state.currentStepIndex = 0;

  // Swap Visible Panels
  D.stageReview.classList.remove('active');
  D.stageWizard.classList.add('active');

  renderWizardSlide();
}

function renderWizardSlide() {
  const step = state.wizardSteps[state.currentStepIndex];
  const total = state.wizardSteps.length;

  // Render text inside slide viewport
  D.wizardSlideBody.innerHTML = `
    <h3 class="wizard-slide-title">${step.title}</h3>
    <div class="wizard-slide-desc">${step.desc}</div>
  `;

  // Progress Bar updates
  D.wizardProgress.textContent = `Step ${state.currentStepIndex + 1} of ${total}`;
  D.wizardProgressBar.style.width = `${((state.currentStepIndex + 1) / total) * 100}%`;

  // Control Buttons labels & switching states
  D.btnWizardPrev.style.visibility = state.currentStepIndex === 0 ? 'hidden' : 'visible';
  
  if (step.isFinal) {
    D.btnWizardNext.textContent = "Finish";
    D.btnWizardNext.classList.add('finish-btn');
  } else {
    D.btnWizardNext.textContent = "Next";
    D.btnWizardNext.classList.remove('finish-btn');
  }
}

function handleWizardNext() {
  if (state.wizardSteps[state.currentStepIndex].isFinal) {
    // Wrap up and return safely
    closeTreatConfirm();
    endTreatmentMode();
  } else {
    state.currentStepIndex++;
    renderWizardSlide();
  }
}

function handleWizardPrev() {
  if (state.currentStepIndex > 0) {
    state.currentStepIndex--;
    renderWizardSlide();
  }
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

/* ─── MUTATION SUBMISSIONS BACK TO SUPABASE CLOUD ──────── */

async function handleFormSubmit(e) {
  e.preventDefault();

  const brand  = D.fBrand.value.trim();
  const type   = D.fType.value;
  const color  = D.fColor.value.trim();
  const fabric = D.fFabric.value.trim();

  if (!brand || !type || !color || !fabric) return;

  D.submitLabel.style.display = 'none';
  D.btnLoader.style.display   = 'block';

  const lowerFabric = fabric.toLowerCase();
  let fabric_type = 'cotton'; 
  if (lowerFabric.includes('poly') || lowerFabric.includes('dacron') || lowerFabric.includes('nylon')) {
    fabric_type = 'polyester';
  }

  const lowerColor = color.toLowerCase();
  let color_group = 'light'; 
  const darks = ['black', 'navy', 'dark', 'charcoal', 'grey', 'brown', 'maroon', 'indigo', 'blue'];
  const whites = ['white', 'ivory', 'cream', 'optic white', 'undyed'];
  
  if (darks.some(d => lowerColor.includes(d))) {
    color_group = 'dark';
  } else if (whites.some(w => lowerColor.includes(w))) {
    color_group = 'white';
  }

  const payload = {
    brand,
    name:     `${brand} ${cap(type)}`,
    type, 
    color, 
    fabric,
    fabric_type, 
    color_group,  
    img:      D.previewGarment.src || null,
    texture:  D.previewTexture.src || null
  };

  try {
    if (state.isEditing) {
      const { data, error } = await supabaseClient
        .from('clothes')
        .update(payload)
        .eq('id', state.editingAssetId)
        .select();

      if (error) throw error;
      
      const i = state.assets.findIndex(a => a.id === state.editingAssetId);
      if (i > -1) state.assets[i] = data[0];
    } else {
      const { data, error } = await supabaseClient
        .from('clothes')
        .insert([payload])
        .select();

      if (error) throw error;
      state.assets.unshift(data[0]);
    }

    applyFilters();
    updateMetrics();
    closeDrawer();
  } catch (err) {
    console.error("Database Write Error Failed:", err.message);
    D.submitLabel.style.display = 'inline';
    D.btnLoader.style.display   = 'none';
  }
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

  // Stage Bindings
  D.treatConfirmCancel.addEventListener('click', closeTreatConfirm);
  D.treatConfirmOk.addEventListener('click', startWizardPresentation); // Triggers Slider

  // PowerPoint Controls
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