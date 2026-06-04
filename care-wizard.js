'use strict';

/* ═══════════════════════════════════════════════════════
   FABCARE — CARE-WIZARD.JS
   Wardrobe Asset Vault — Interactive Treatment Slideshow System
═══════════════════════════════════════════════════════ */

/* ─── SLIDESHOW STEP GENERATION SYSTEM ─────────────────── */
function generateWizardSteps() {
  const selectedGarments = state.assets.filter(a => state.selectedAssets.has(String(a.id)) || state.selectedAssets.has(Number(a.id)));
  const steps = [];

  if (state.treatmentType === 'wash') {
    const groups = new Set(selectedGarments.map(g => g.color_group));
    
    // Step 1: Color Sorting Evaluation
    if (groups.has('dark') && groups.has('white')) {
      steps.push({
        title: "Color Sorting Evaluation",
        rules: [
          { type: 'dont', icon: '❌', text: "<strong>High Bleeding Danger!</strong> You grouped Dark garments directly with Crisp Whites. Dyes from the dark items will transfer in the water, causing permanent stains." },
          { type: 'do', icon: '🧼', text: "<strong>Recommendation:</strong> Take the white items out of this load right now and run them completely separately." }
        ]
      });
    } else if (groups.has('dark') && groups.has('light')) {
      steps.push({
        title: "Color Sorting Evaluation",
        rules: [
          { type: 'dont', icon: '⚠️', text: "Avoid mixing dark fabrics with light/pastel colors. Over time, subtle bleeding will cause light garments to fade and look dull." },
          { type: 'do', icon: '❄️', text: "If you absolute must proceed together, ensure the washer temperature dial is set completely to cold." }
        ]
      });
    } else {
      steps.push({
        title: "Color Sorting Evaluation",
        rules: [
          { type: 'do', icon: '✅', text: "Nice work! This batch has safe color composition values. No high-risk fabric dye bleeding detected." }
        ]
      });
    }

    // Step 2: Chemical Restrictions
    const containsPoly = selectedGarments.some(g => g.fabric_type === 'polyester');
    const chemicalRules = [
      { type: 'do', icon: '🧪', text: "Use standard pH-neutral liquid detergents like Tide Liquid or Persil Silk/Wool profiles." },
      { type: 'dont', icon: '🚫', text: "Never use Chlorine Bleach. It aggressively eats away at natural weaving matrixes, causing yellowing." }
    ];
    if (containsPoly) {
      chemicalRules.push({ type: 'dont', icon: '❌', text: "<strong>No Fabric Softener:</strong> Your selection includes synthetic polyester. Softener leaves a waxy coating that breaks down breathability." });
    }
    steps.push({ title: "Chemical Restrictions", rules: chemicalRules });

    // Step 3: Temperature Configuration
    if (containsPoly) {
      steps.push({
        title: "Temperature Configuration",
        rules: [
          { type: 'do', icon: '💧', text: "Set your washing machine dial to <strong>30°C (Cold Water Setup)</strong>." },
          { type: 'do', icon: '🛡️', text: "Cold water limits synthetic matrix warping, structural shrinking, and seam stretching." }
        ]
      });
    } else {
      steps.push({
        title: "Temperature Configuration",
        rules: [
          { type: 'do', icon: '🔥', text: "Set your washing machine dial to <strong>40°C (Warm Water Setup)</strong>." },
          { type: 'do', icon: '🧼', text: "Pure cotton load can handle warm setup perfectly to break down persistent body oils and surface dirt." }
        ]
      });
    }

    // Step 4: Machine Cycle Selector
    const needsDelicate = selectedGarments.some(g => ['knitwear', 't-shirt'].includes(g.type));
    if (needsDelicate) {
      steps.push({
        title: "Machine Cycle Selector",
        rules: [
          { type: 'do', icon: '⚙️', text: "Set your cycle mode to <strong>Delicate / Low Agitation Spin</strong>." },
          { type: 'dont', icon: '⚠️', text: "Avoid high-speed spinning. Knits and lightweight premium cotton warp out of shape when agitated aggressively." }
        ]
      });
    } else {
      steps.push({
        title: "Machine Cycle Selector",
        rules: [
          { type: 'do', icon: '🔄', text: "Set your cycle mode to <strong>Normal / Standard Cycle</strong>." },
          { type: 'do', icon: '👕', text: "Sturdy woven items can safely handle traditional spin cycles to extract dirt effectively." }
        ]
      });
    }

    // Step 5: Loading Execution
    steps.push({
      title: "Loading Execution",
      rules: [
        { type: 'do', icon: '🪙', text: "Completely empty all pockets. Coins, keys, or stray tissues can damage machine drums or melt onto fabrics." },
        { type: 'do', icon: '🙃', text: "Turn graphic shirts and screenprints inside out to protect visual designs from frictional peeling." },
        { type: 'dont', icon: '❌', text: "Do not overstuff the drum. Load clothes loosely to allow proper structural water circulation." }
      ]
    });

  } else if (state.treatmentType === 'dry') {
    const containsPoly = selectedGarments.some(g => g.fabric_type === 'polyester');
    const containsCotton = selectedGarments.some(g => g.fabric_type === 'cotton');

    steps.push({
      title: "Drying Strategy Management",
      rules: [
        { type: 'do', icon: '💨', text: containsPoly && !containsCotton ? "Recommended Strategy: <strong>Line Hang Dry</strong>. Synthetics air-dry incredibly fast." : "Recommended Strategy: <strong>Flat Air Drying / Low Tumble</strong>." },
        { type: 'dont', icon: '🔥', text: "Avoid localized high heat exposure. Forced heat shrinks natural fibers and turns synthetic bonds stiff." }
      ]
    });

    steps.push({
      title: "Drying Placement Execution",
      rules: [
        { type: 'do', icon: '👋', text: "Give each garment a firm snap-shake right out of the spin loop to dislodge deep wrinkles before drying." },
        { type: 'do', icon: '💨', text: "If air drying sweaters, place them completely flat on top of a rack. Vertical hanging pulls knits out of shape." }
      ]
    });

  } else if (state.treatmentType === 'store') {
    const needsFolding = selectedGarments.some(g => ['t-shirt', 'knitwear', 'sweater'].includes(g.type));

    steps.push({
      title: "Storage Layout Assignment",
      rules: [
        { type: 'do', icon: '📦', text: needsFolding ? "Archiving Strategy: <strong>Horizontal Flat Fold Setup</strong>." : "Archiving Strategy: <strong>Contoured Hanger Placement</strong>." },
        { type: 'dont', icon: '🧥', text: "Never hang heavy knitwear or sweaters on thin wire hangers. They will permanently stretch out the shoulders." }
      ]
    });

    steps.push({
      title: "Preservation Protection Rules",
      rules: [
        { type: 'do', icon: '☀️', text: "Ensure items are 100% dry. Storing items with trapped ambient humidity inside a dark closet breeds mildew." },
        { type: 'dont', icon: '🚫', text: "Keep clothes out of direct window exposure. Continuous sunlight UV rays cause colors to fade unevenly." }
      ]
    });
  }

  // Safe fallback if zero rule steps generated
  if (steps.length === 0) {
    steps.push({
      title: "Ready to Process",
      rules: [
        { type: 'do', icon: '✅', text: "<strong>All Cleared!</strong> No processing conflicts detected. Safe to proceed with standard guidelines." }
      ]
    });
  }

  // Final Sequence Target
  steps.push({
    title: "Care Guide Finalized",
    isFinal: true,
    rules: [
      { type: 'do', icon: '🎉', text: "All diagnostic validation runs complete! Your garments are ready for processing according to ledger guidelines." }
    ]
  });

  return steps;
}

/* ─── SLIDESACT SETUP ENGINE ──────────────────────────── */
function startWizardPresentation() {
  state.wizardSteps = generateWizardSteps();
  state.currentStepIndex = 0;

  D.stageReview.classList.remove('active');
  D.stageWizard.classList.add('active');

  // Clear previous execution maps and render fresh structures
  const track = D.wizardSlideTrack;
  track.innerHTML = '';
  
  state.wizardSteps.forEach((step, idx) => {
    track.appendChild(buildSlideDOM(step, idx));
  });

  moveTrackPosition();
}

/* ─── DOM INJECTION BUILDER ────────────────────────────── */
/* ─── DOM INJECTION BUILDER ────────────────────────────── */
function buildSlideDOM(step, index) {
  const slide = document.createElement('div');
  slide.className = 'wizard-slide-view';
  
  // Final Sequence Layout Handlers
  if (step.isFinal) {
    slide.innerHTML = `
      <div class="care-interactive-box revealed">
        <div class="care-box-step-tag">🎉</div>
        <h3 class="care-box-title">${step.title}</h3>
        <div class="care-instructions-container">
          <div class="care-rule-item do" style="animation-delay: 100ms;">
            <span class="care-rule-icon">🎉</span>
            <div class="care-rule-text">${step.rules[0].text}</div>
          </div>
        </div>
      </div>
    `;
    return slide;
  }

  const box = document.createElement('div');
  
  // Dynamic interaction bypass check: Only Step 1 (index 0) requires interaction
  if (index === 0) {
    box.className = 'care-interactive-box clickable';
    box.innerHTML = `
      <div class="care-box-step-tag">Step ${index + 1}</div>
      <h3 class="care-box-title">${step.title}</h3>
      <p class="care-click-prompt">👇 Click to view step details</p>
      <div class="care-instructions-container"></div>
    `;
  } else {
    // Steps 2 onwards display information instantly with standard animations
    box.className = 'care-interactive-box revealed';
    box.innerHTML = `
      <div class="care-box-step-tag">Step ${index + 1}</div>
      <h3 class="care-box-title">${step.title}</h3>
      <div class="care-instructions-container"></div>
    `;
  }

  const instructionsContainer = box.querySelector('.care-instructions-container');

  // Loop rules arrays to append targeted conditional lists
  step.rules.forEach((rule, rIdx) => {
    const item = document.createElement('div');
    item.className = `care-rule-item ${rule.type}`;
    // Maintain cascade delay sequence offsets
    item.style.animationDelay = `${rIdx * 150}ms`;
    
    item.innerHTML = `
      <span class="care-rule-icon">${rule.icon}</span>
      <div class="care-rule-text">${rule.text}</div>
    `;
    instructionsContainer.appendChild(item);
  });

  // Attach click toggle action monitors exclusively to Step 1
  if (index === 0) {
    box.addEventListener('click', () => {
      if (!box.classList.contains('revealed')) {
        box.classList.remove('clickable');
        box.classList.add('revealed');
        
        // Reveal the orange action button when Step 1 breaks open
        if (index === state.currentStepIndex) {
          D.btnWizardNext.classList.add('visible');
        }
      }
    });
  }

  slide.appendChild(box);
  return slide;
}

/* ─── SLIDE TRACK TRANSLATION TRANSFORMS ──────────────── */
function moveTrackPosition() {
  const track = D.wizardSlideTrack;
  const total = state.wizardSteps.length;
  
  // AFTER
const slideWidth = track.parentElement.offsetWidth;
track.style.transform = `translateX(-${state.currentStepIndex * slideWidth}px)`;

  // Update status indicators
  D.wizardProgress.textContent = `Step ${state.currentStepIndex + 1} of ${total}`;
  D.wizardProgressBar.style.width = `${((state.currentStepIndex + 1) / total) * 100}%`;

  D.btnWizardPrev.style.visibility = state.currentStepIndex === 0 ? 'hidden' : 'visible';

  const currentStep = state.wizardSteps[state.currentStepIndex];

  if (currentStep.isFinal) {
    D.btnWizardNext.textContent = "Finish Ledger";
    D.btnWizardNext.classList.add('finish-btn');
    D.btnWizardNext.classList.add('visible'); 
  } else {
    D.btnWizardNext.textContent = "Next";
    D.btnWizardNext.classList.remove('finish-btn');
    
    // Check if current view window panel has auto-revealed or been manual-clicked
    if (state.currentStepIndex > 0) {
      // Step 2+ always shows orange next button immediately
      D.btnWizardNext.classList.add('visible');
    } else {
      // Step 1 respects user selection status rules
      const slides = track.querySelectorAll('.wizard-slide-view');
      const firstBox = slides[0].querySelector('.care-interactive-box');
      
      if (firstBox && firstBox.classList.contains('revealed')) {
        D.btnWizardNext.classList.add('visible');
      } else {
        D.btnWizardNext.classList.remove('visible');
      }
    }
  }
}

function handleWizardNext() {
  if (state.wizardSteps[state.currentStepIndex].isFinal) {
    closeTreatConfirm();
    endTreatmentMode();
  } else {
    state.currentStepIndex++;
    moveTrackPosition();
  }
}

function handleWizardPrev() {
  if (state.currentStepIndex > 0) {
    state.currentStepIndex--;
    moveTrackPosition();
  }
}