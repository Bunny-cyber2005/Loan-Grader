/**
 * JPMC Loan Grader — Real ONNX Predictor
 * Loads the actual trained RandomForestClassifier (exported to ONNX),
 * applies the same preprocessing as the notebook, and runs inference
 * entirely in the browser via onnxruntime-web.
 *
 * No server. No fake heuristics. This IS the real model.
 */

// ── Constants ──────────────────────────────────────────────────────────────────
const ONNX_PATH = '../assets/loan_grader.onnx';
const META_PATH = '../assets/loan_grader_meta.json';

const GRADE_COLORS = {
  A: '#2ecc71', B: '#27ae60', C: '#f39c12',
  D: '#e67e22', E: '#e74c3c', F: '#c0392b'
};

const GRADE_DESCS = {
  A: 'Excellent — Prime customer. Lowest risk. Approve with best rates.',
  B: 'Good — Strong credit, minor risks. Approve with standard rates.',
  C: 'Fair — Acceptable with conditions. Apply moderate scrutiny.',
  D: 'Below Average — Elevated risk. Require collateral or co-signer.',
  E: 'Poor — High risk. Senior review required. Restrict loan amount.',
  F: 'Very Poor — Decline recommended. Refer to collections/recovery.'
};

const RISK_MSGS = {
  A: { bg:'rgba(46,204,113,0.1)',  border:'#2ecc71', msg:'Approved — Offer premium rates. Excellent repayment history predicted.' },
  B: { bg:'rgba(39,174,96,0.1)',   border:'#27ae60', msg:'Approved — Standard loan terms applicable. Low default risk.' },
  C: { bg:'rgba(243,156,18,0.1)',  border:'#f39c12', msg:'Conditional Approval — Apply standard credit checks. Moderate risk.' },
  D: { bg:'rgba(230,126,34,0.1)',  border:'#e67e22', msg:'Requires Review — Elevated risk. Consider reduced loan amount or collateral.' },
  E: { bg:'rgba(231,76,60,0.1)',   border:'#e74c3c', msg:'High Risk — Senior review mandatory. Recommend denial unless secured.' },
  F: { bg:'rgba(192,57,43,0.1)',   border:'#c0392b', msg:'Decline Recommended — Very high default probability. Escalate to collections team.' },
};

// ── Module state ───────────────────────────────────────────────────────────────
let onnxSession = null;   // InferenceSession (onnxruntime-web)
let meta        = null;   // preprocessing metadata from JSON

// ── Init: load meta + ONNX session ────────────────────────────────────────────
async function initModel() {
  setStatus('loading', 'Loading real ML model...');

  try {
    // 1. Load metadata JSON
    const metaResp = await fetch(META_PATH);
    if (!metaResp.ok) throw new Error('Could not load loan_grader_meta.json');
    meta = await metaResp.json();

    // 2. Load ONNX session
    onnxSession = await ort.InferenceSession.create(ONNX_PATH, {
      executionProviders: ['wasm'],   // runs in browser via WebAssembly
    });

    setStatus('ready', `Real model loaded (${meta.model_type} · ${meta.feature_names.length} features · ${(meta.model_accuracy * 100).toFixed(1)}% accuracy)`);

    // 3. Run default prediction with pre-filled values
    await predictGrade();

  } catch (err) {
    console.error('Model load error:', err);
    setStatus('error', `Model load failed: ${err.message}. Make sure loan_grader.onnx is in website/assets/`);
  }
}

// ── Preprocessing: mirrors the notebook pipeline exactly ──────────────────────
function preprocessCustomer(formData) {
  const { num_features, cat_features, label_encoder_classes,
          imputer_medians, scaler_mean, scaler_scale } = meta;

  // 1. Numeric features — impute (median) then standardize
  const numVec = num_features.map((feat, i) => {
    let val = parseFloat(formData[feat]);
    if (isNaN(val)) val = imputer_medians[i];   // median imputation
    // Standardize: (x - mean) / scale
    return (val - scaler_mean[i]) / scaler_scale[i];
  });

  // 2. Categorical features — label encode (integer index)
  const catVec = cat_features.map(feat => {
    const val     = formData[feat] || '';
    const classes = label_encoder_classes[feat];
    const idx     = classes.indexOf(val);
    return idx >= 0 ? idx : 0;   // fallback to 0 if unseen value
  });

  // 3. Combine in exact same order as training: numerics first, then categoricals
  return new Float32Array([...numVec, ...catVec]);
}

// ── Main prediction function ───────────────────────────────────────────────────
async function predictGrade() {
  if (!onnxSession || !meta) {
    setStatus('error', 'Model not loaded yet. Please wait...');
    return;
  }

  // Collect form values
  const formData = collectFormData();

  // Validate credit score
  const cs = parseFloat(formData.credit_score);
  if (isNaN(cs) || cs < 300 || cs > 900) {
    alert('Credit Score must be between 300 and 900');
    return;
  }

  try {
    setStatus('running', 'Running inference...');

    // Preprocess
    const inputData = preprocessCustomer(formData);
    const inputTensor = new ort.Tensor('float32', inputData, [1, meta.feature_names.length]);

    // Run ONNX inference
    const feeds   = { float_input: inputTensor };
    const results = await onnxSession.run(feeds);

    // Extract outputs
    const predClass  = results['label'].data[0];           // predicted class index
    const probsRaw   = Array.from(results['probabilities'].data);  // [p0, p1, ..., p5]
    const gradeOrder = meta.grade_order;
    const grade      = gradeOrder[predClass];
    const confidence = Math.max(...probsRaw) * 100;

    // Render results
    renderResult(grade, predClass, probsRaw, gradeOrder, confidence, formData);
    setStatus('ready', `Real model (${meta.model_type}) · ${(meta.model_accuracy*100).toFixed(1)}% accuracy`);

  } catch (err) {
    console.error('Inference error:', err);
    setStatus('error', `Inference failed: ${err.message}`);
  }
}

// ── Collect all form inputs into a flat object ─────────────────────────────────
function collectFormData() {
  const ids = [
    'age','gender','marital_status','education','employment_type','years_employed',
    'annual_income','monthly_balance','num_bank_accounts','savings_balance',
    'monthly_deposits','monthly_withdrawals','num_bounced_checks',
    'num_credit_cards','credit_limit','credit_utilization','monthly_card_spend',
    'num_late_payments','num_card_defaults','num_existing_loans',
    'total_loan_amount','monthly_emi','loan_repayment_pct','num_loan_defaults',
    'debt_to_income','credit_score'
  ];
  const data = {};
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) data[id] = el.value;
  });
  return data;
}

// ── Render prediction results ──────────────────────────────────────────────────
function renderResult(grade, predClass, probs, gradeOrder, confidence, formData) {
  // Grade letter
  const gradeEl = document.getElementById('resultGrade');
  gradeEl.textContent = grade;
  gradeEl.style.color = GRADE_COLORS[grade];

  // Description
  document.getElementById('resultDesc').textContent = GRADE_DESCS[grade];

  // Probability bars
  document.getElementById('probBars').innerHTML = gradeOrder.map((g, i) => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;">
      <span style="width:56px;font-size:0.72rem;font-weight:700;color:${GRADE_COLORS[g]}">Grade ${g}</span>
      <div style="flex:1;background:#21262d;border-radius:4px;height:8px;">
        <div style="width:${(probs[i]*100).toFixed(1)}%;height:8px;border-radius:4px;background:${GRADE_COLORS[g]};transition:width 0.6s ease;"></div>
      </div>
      <span style="font-size:0.7rem;color:#8b949e;width:42px;text-align:right;">${(probs[i]*100).toFixed(1)}%</span>
    </div>
  `).join('');

  // Top feature importances from real model
  if (meta.feature_importances) {
    const topFeatures = Object.entries(meta.feature_importances)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    document.getElementById('scoreBreakdown').innerHTML =
      `<div style="font-size:0.7rem;color:var(--muted);margin-bottom:6px;font-weight:600;">Top 5 Decision Factors</div>` +
      topFeatures.map(([feat, imp]) => `
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
          <span style="font-size:0.7rem;color:#8b949e;">${feat.replace(/_/g,' ')}</span>
          <span style="font-size:0.7rem;color:#e6edf3;font-weight:700;">${(imp*100).toFixed(1)}%</span>
        </div>
      `).join('');
  }

  // Risk alert
  const r      = RISK_MSGS[grade];
  const riskEl = document.getElementById('riskAlert');
  riskEl.style.background  = r.bg;
  riskEl.style.borderColor = r.border;
  riskEl.style.color       = r.border;
  riskEl.textContent       = r.msg;

  // Model badge
  const badgeEl = document.getElementById('modelBadge');
  if (badgeEl) {
    badgeEl.textContent = `${meta.model_type} · ${confidence.toFixed(1)}% confidence`;
    badgeEl.style.color = GRADE_COLORS[grade];
  }

  // Show result box
  document.getElementById('resultBox').style.display = 'block';
}

// ── Status bar helper ──────────────────────────────────────────────────────────
function setStatus(state, msg) {
  const el = document.getElementById('modelStatus');
  if (!el) return;
  const icons = { loading: '⏳', ready: '✅', running: '⚡', error: '❌' };
  el.textContent = `${icons[state] || ''} ${msg}`;
  el.style.color = state === 'error' ? '#e74c3c' : state === 'ready' ? '#2ecc71' : '#8b949e';
}

// ── Boot ───────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', initModel);
