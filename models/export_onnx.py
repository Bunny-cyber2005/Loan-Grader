"""
JPMC Loan Grader — ONNX Export Script
Converts the trained sklearn model + full preprocessing pipeline
into a single ONNX file the browser can run via onnxruntime-web.

Output
------
  models/loan_grader.onnx          <- model for browser inference
  models/loan_grader_meta.json     <- preprocessing metadata for JS
"""

import os, pickle, json
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

BASE  = os.path.dirname(os.path.abspath(__file__))
PKL   = os.path.join(BASE, "loan_grader_best_model.pkl")
ONNX  = os.path.join(BASE, "loan_grader.onnx")
META  = os.path.join(BASE, "loan_grader_meta.json")

# ── 1. Load artifacts ──────────────────────────────────────────────────────────
with open(PKL, "rb") as f:
    art = pickle.load(f)

model         = art["model"]
imputer       = art["imputer"]
scaler        = art["scaler"]
le_dict       = art["label_encoders"]
feature_names = art["feature_names"]
grade_order   = art["grade_order"]

cat_features = list(le_dict.keys())
num_features = [f for f in feature_names if f not in cat_features]

print(f"Model        : {type(model).__name__}")
print(f"Num features : {len(num_features)}")
print(f"Cat features : {len(cat_features)}")

# ── 2. Build a full sklearn Pipeline so ONNX sees one object ──────────────────
#    Preprocessing is already fit; we wrap imputer + scaler in a pipeline
#    and chain with the classifier.  Label-encoded categoricals are baked
#    into the meta.json so JS can do them without ONNX (they're just integer
#    lookups — no sklearn transformer needed in the graph).

from sklearn.pipeline import Pipeline as SKPipeline

full_pipe = SKPipeline([
    ("imputer", imputer),
    ("scaler",  scaler),
    ("clf",     model),
])

# The pipeline input is ALL features (num + cat already encoded as int).
# Total columns = len(num_features) + len(cat_features) = len(feature_names)
n_cols = len(feature_names)

# ── 3. Convert to ONNX ────────────────────────────────────────────────────────
initial_type = [("float_input", FloatTensorType([None, n_cols]))]

onnx_model = convert_sklearn(
    full_pipe,
    initial_types=initial_type,
    target_opset=17,          # widely supported in onnxruntime-web 1.18
    options={id(model): {"zipmap": False}},   # return raw float array, not dict
)

with open(ONNX, "wb") as f:
    f.write(onnx_model.SerializeToString())

size_kb = os.path.getsize(ONNX) / 1024
print(f"\n✅ ONNX model saved → {ONNX}")
print(f"   Size: {size_kb:.1f} KB")

# ── 4. Export meta.json so the JS knows how to preprocess ─────────────────────
#    JS needs:
#      - exact column order
#      - label-encoder classes for each categorical (to replicate LE)
#      - imputer medians  (for NaN handling client-side before ONNX)
#      - scaler mean/std  (already inside pipeline, but useful for display)
#      - grade_order

le_classes = {col: le.classes_.tolist() for col, le in le_dict.items()}

meta = {
    "feature_names"         : feature_names,           # full ordered list fed to ONNX
    "num_features"          : num_features,
    "cat_features"          : cat_features,
    "grade_order"           : grade_order,
    "label_encoder_classes" : le_classes,
    # imputer medians — JS uses these as fallback for missing values
    "imputer_medians"       : imputer.statistics_.tolist(),
    # scaler params — informational; already baked into ONNX pipeline
    "scaler_mean"           : scaler.mean_.tolist(),
    "scaler_scale"          : scaler.scale_.tolist(),
    # feature importances for display
    "feature_importances"   : (
        dict(zip(feature_names,
                 [round(float(v), 6) for v in model.feature_importances_]))
        if hasattr(model, "feature_importances_") else {}
    ),
}

with open(META, "w") as f:
    json.dump(meta, f, indent=2)

print(f"✅ Metadata saved  → {META}")
print(f"\nGrade mapping: { {g: i for i, g in enumerate(grade_order)} }")

# ── 5. Quick sanity check — run one inference through the ONNX model ──────────
import onnxruntime as rt

sess = rt.InferenceSession(ONNX, providers=["CPUExecutionProvider"])
input_name  = sess.get_inputs()[0].name
output_name = sess.get_outputs()[0].name   # class labels
prob_name   = sess.get_outputs()[1].name   # probabilities

# Sample customer (same as notebook cell 7.2)
sample_data = {
    "age": 35, "gender": "Male", "marital_status": "Married",
    "education": "Graduate", "employment_type": "Salaried", "years_employed": 10,
    "annual_income": 85000, "monthly_balance": 6000, "num_bank_accounts": 2,
    "savings_balance": 25000, "monthly_deposits": 4000, "monthly_withdrawals": 3000,
    "num_bounced_checks": 0, "num_credit_cards": 2, "credit_limit": 20000,
    "credit_utilization": 0.25, "monthly_card_spend": 1500, "num_late_payments": 1,
    "num_card_defaults": 0, "num_existing_loans": 1, "total_loan_amount": 150000,
    "monthly_emi": 3500, "loan_repayment_pct": 0.92, "num_loan_defaults": 0,
    "debt_to_income": 0.49, "credit_score": 720,
}

# Build feature row in correct order
row = []
for feat in feature_names:
    val = sample_data[feat]
    if feat in cat_features:
        # label-encode
        classes = le_classes[feat]
        val = classes.index(val) if val in classes else 0
    row.append(float(val))

X_test = np.array([row], dtype=np.float32)

pred_class = int(sess.run([output_name], {input_name: X_test})[0][0])
proba      = sess.run([prob_name],  {input_name: X_test})[0][0]
pred_grade = grade_order[pred_class]

print(f"\n── Sanity Check ──────────────────────────────────────────")
print(f"   Predicted grade : {pred_grade}")
print(f"   Confidence      : {max(proba)*100:.1f}%")
for g, p in zip(grade_order, proba):
    bar = "█" * int(p * 30)
    print(f"   Grade {g}: {bar} {p*100:.1f}%")
print(f"\n🚀 ONNX export complete — open website/pages/predictor.html to use the real model.")
