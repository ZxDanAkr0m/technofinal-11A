'use strict';

/* ═══════════════════════════════════════════════════════
   FABCARE — CARE-WIZARD.JS
   Wardrobe Asset Vault — Interactive Treatment Slideshow System
═══════════════════════════════════════════════════════ */

/* ─── SLIDESHOW STEP GENERATION SYSTEM ─────────────────── */
function generateWizardSteps() {
  const selectedGarments = state.assets.filter(a => state.selectedAssets.has(a.id));
  const steps = [];

  if (state.treatmentType === 'wash') {
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

    const containsPoly = selectedGarments.some(g => g.fabric_type === 'polyester');
    let restrictedDesc = `
      <p>• <strong>Detergent Rule:</strong> Use standard pH-neutral liquid detergents (e.g., Tide Liquid or Persil Silk/Wool).</p>
      <p>• <strong>Prohibited Substances:</strong> Never use Chlorine Bleach. It eats away natural fibers, causing your clothes to turn yellow and tear.</p>
    `;
    if (containsPoly) {
      restrictedDesc += `<p style="color:#ff6b6b; margin-top:12px;">• <strong>❌ NO FABRIC SOFTENER:</strong> Your selection includes synthetic polyester. Softener creates a waxy film over synthetics that permanently breaks down their breathability and moisture-wicking power.</p>`;
    }
    steps.push({ title: "🧪 Chemical Restrictions", desc: restrictedDesc });

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

    const needsDelicate = selectedGarments.some(g => ['knitwear', 't-shirt'].includes(g.type));
    let cycleValue = needsDelicate ? "Delicate / Low Agitation" : "Normal / Standard Cycle";
    let cycleReason = needsDelicate ? "Knits and T-shirts warp out of shape when spun aggressively. Low agitation preserves seams." : "Sturdy woven items can safely handle traditional spin speeds to lift dirt.";
    steps.push({
      title: "⚙️ Cycle Settings",
      desc: `Set your washer dial mode to: <strong>${cycleValue}</strong>.<br><br><span style="font-size:0.85em; opacity:0.75;">Profile: ${cycleReason}</span>`
    });

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

  steps.push({
    title: "🎉 All Set!",
    desc: "You have reviewed and processed the care steps for your selected garments. Click Finish below to complete the cycle and return to your vault ledger panel.",
    isFinal: true
  });

  return steps;
}

function startWizardPresentation() {
  state.wizardSteps = generateWizardSteps();
  state.currentStepIndex = 0;

  D.stageReview.classList.remove('active');
  D.stageWizard.classList.add('active');

  renderWizardSlide();
}

function renderWizardSlide() {
  const step = state.wizardSteps[state.currentStepIndex];
  const total = state.wizardSteps.length;

  D.wizardSlideBody.innerHTML = `
    <h3 class="wizard-slide-title">${step.title}</h3>
    <div class="wizard-slide-desc">${step.desc}</div>
  `;

  D.wizardProgress.textContent = `Step ${state.currentStepIndex + 1} of ${total}`;
  D.wizardProgressBar.style.width = `${((state.currentStepIndex + 1) / total) * 100}%`;

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