"""
JPMC Loan Grader — Retrain + ONNX Export (single script)
Trains a fresh RandomForestClassifier on the current sklearn version,
then exports it to ONNX so the browser can run real predictions.

Outputs
-------
  models/loan_grader.onnx          <- ONNX model for browser
  models/loan_grader_meta.json     <- preprocessing metadata for JS
  models/loan_grader_best_model.pkl <- updated .pkl (current sklearn)

Run:
  python train_and_export_onnx.py
"""

import os, json, pickle
import numpy as np
import pandas as pd

from sklearn.model_selection    import train_test_split
from sklearn.preprocessing      import LabelEncoder, StandardScaler
from sklearn.impute             import SimpleImputer
from sklearn.ensemble           import RandomForestClassifier
from sklearn.metrics            import accuracy_score, roc_auc_score
from sklearn.preprocessing      import label_binarize
from sklearn.pipeline           import Pipeline

from skl2onnx                   import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import onnxruntime as rt

BASE       = os.path.dirname(os.path.abspath(__file__))
DATA_PATH  = os.path.join(BASE, "..", "data", "loan_data.csv")
PKL_PATH   = os.path.join(BASE, "loan_grader_best_model.pkl")
ONNX_PATH  = os.path.join(BASE, "loan_grader.onnx")
META_PATH  = os.path.join(BASE, "loan_grader_meta.json")

# ── 1. Load data ───────────────────────────────────────────────────────────────
print("Loading data...")
df = pd.read_csv(DATA_PATH)
print(f"  Dataset shape: {df.shape}")

# ── 2. Prepare target ─────────────────────────────────────────────────────────
grade_order = ['A','B','C','D','E','F']
grade_map   = {g: i for i, g in enumerate(grade_order)}
df = df.drop(columns=['customer_id'])
df['target'] = df['loan_grade'].map(grade_map)
df = df.drop(columns=['loan_grade'])

X = df.drop(columns=['target'])
y = df['target']

num_features = X.select_dtypes(include=np.number).columns.tolist()
cat_features = X.select_dtypes(include='str').columns.tolist()
print(f"  Numeric features  : {len(num_features)}")
print(f"  Categorical features: {len(cat_features)}")

# ── 3. Encode categoricals ────────────────────────────────────────────────────
le_dict = {}
X_cat = X[cat_features].copy()
for col in cat_features:
    X_cat[col] = X_cat[col].fillna(X_cat[col].mode()[0])
    le = LabelEncoder()
    X_cat[col] = le.fit_transform(X_cat[col])
    le_dict[col] = le

# ── 4. Impute + scale numerics ────────────────────────────────────────────────
imputer = SimpleImputer(strategy='median')
scaler  = StandardScaler()
X_num   = imputer.fit_transform(X[num_features])
X_num   = scaler.fit_transform(X_num)

# ── 5. Combine: numerics first, then categoricals (matches feature_names order)
feature_names = num_features + cat_features
X_proc = np.hstack([X_num, X_cat.to_numpy()])

# ── 6. Train/test split ───────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_proc, y, test_size=0.20, random_state=42, stratify=y
)

# ── 7. Train Random Forest ────────────────────────────────────────────────────
print("\nTraining RandomForestClassifier (200 trees)...")
model = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)
acc    = accuracy_score(y_test, y_pred)
y_bin  = label_binarize(y_test, classes=sorted(y.unique()))
auc    = roc_auc_score(y_bin, y_prob, multi_class='ovr', average='macro')

print(f"  Test Accuracy : {acc:.4f}")
print(f"  ROC-AUC Macro : {auc:.4f}")

# ── 8. Save updated .pkl ──────────────────────────────────────────────────────
artifacts = {
    'model'         : model,
    'imputer'       : imputer,
    'scaler'        : scaler,
    'label_encoders': le_dict,
    'feature_names' : feature_names,
    'grade_map'     : grade_map,
    'grade_order'   : grade_order,
}
with open(PKL_PATH, 'wb') as f:
    pickle.dump(artifacts, f)
print(f"\n✅ Updated .pkl saved → {PKL_PATH}")

# ── 9. Convert ONLY the RandomForest classifier to ONNX ─────────────────────
#    Preprocessing (impute, scale, label-encode) is done in JS using meta.json.
#    ONNX sees the already-preprocessed feature array (26 floats).
#    This avoids skl2onnx pipeline shape-mismatch issues.
n_cols = len(feature_names)   # 26 total
print(f"\nConverting RandomForest to ONNX ({n_cols} input features, pre-scaled)...")

initial_type = [("float_input", FloatTensorType([None, n_cols]))]
onnx_model   = convert_sklearn(
    model,                                      # classifier only, not the pipeline
    initial_types=initial_type,
    target_opset=17,
    options={id(model): {"zipmap": False}},
)

with open(ONNX_PATH, "wb") as f:
    f.write(onnx_model.SerializeToString())

size_kb = os.path.getsize(ONNX_PATH) / 1024
print(f"✅ ONNX model saved → {ONNX_PATH}  ({size_kb:.1f} KB)")

# ── 10. Export meta.json ──────────────────────────────────────────────────────
le_classes = {col: le.classes_.tolist() for col, le in le_dict.items()}
importances_sorted = sorted(
    zip(feature_names, model.feature_importances_.tolist()),
    key=lambda x: x[1], reverse=True
)

meta = {
    "feature_names"         : feature_names,
    "num_features"          : num_features,
    "cat_features"          : cat_features,
    "grade_order"           : grade_order,
    "label_encoder_classes" : le_classes,
    "imputer_medians"       : imputer.statistics_.tolist(),
    "scaler_mean"           : scaler.mean_.tolist(),
    "scaler_scale"          : scaler.scale_.tolist(),
    "feature_importances"   : {f: round(v, 6) for f, v in importances_sorted},
    "model_accuracy"        : round(float(acc), 4),
    "model_auc"             : round(float(auc), 4),
    "model_type"            : type(model).__name__,
}

with open(META_PATH, "w") as f:
    json.dump(meta, f, indent=2)
print(f"✅ Metadata saved  → {META_PATH}")

# ── 11. Sanity check via onnxruntime ─────────────────────────────────────────
print("\n── Sanity Check (onnxruntime) ────────────────────────────")
sess        = rt.InferenceSession(ONNX_PATH, providers=["CPUExecutionProvider"])
input_name  = sess.get_inputs()[0].name
out_label   = sess.get_outputs()[0].name
out_prob    = sess.get_outputs()[1].name

sample = {
    "age":35,"gender":"Male","marital_status":"Married","education":"Graduate",
    "employment_type":"Salaried","years_employed":10,"annual_income":85000,
    "monthly_balance":6000,"num_bank_accounts":2,"savings_balance":25000,
    "monthly_deposits":4000,"monthly_withdrawals":3000,"num_bounced_checks":0,
    "num_credit_cards":2,"credit_limit":20000,"credit_utilization":0.25,
    "monthly_card_spend":1500,"num_late_payments":1,"num_card_defaults":0,
    "num_existing_loans":1,"total_loan_amount":150000,"monthly_emi":3500,
    "loan_repayment_pct":0.92,"num_loan_defaults":0,"debt_to_income":0.49,
    "credit_score":720,
}

row_num = []   # numeric features, imputed + scaled
row_cat = []   # categorical features, label-encoded

for feat in num_features:
    v = sample.get(feat, np.nan)
    row_num.append(float(v) if v is not None else np.nan)

for feat in cat_features:
    v = sample.get(feat, "")
    classes = le_classes[feat]
    row_cat.append(float(classes.index(v)) if v in classes else 0.0)

# Apply imputer then scaler on numeric part
arr_num = np.array([row_num], dtype=np.float32)
arr_num = imputer.transform(arr_num)
arr_num = scaler.transform(arr_num)

X_sample = np.hstack([arr_num, np.array([row_cat], dtype=np.float32)]).astype(np.float32)
pred_class = int(sess.run([out_label], {input_name: X_sample})[0][0])
proba      = sess.run([out_prob],  {input_name: X_sample})[0][0]
pred_grade = grade_order[pred_class]

print(f"  Sample customer → Grade {pred_grade}  (confidence {max(proba)*100:.1f}%)")
for g, p in zip(grade_order, proba):
    bar = "█" * int(p * 30)
    print(f"  Grade {g}: {bar} {p*100:.1f}%")

print(f"\n{'='*60}")
print(f"  ONNX export complete!")
print(f"  Model size  : {size_kb:.0f} KB")
print(f"  Features    : {n_cols}")
print(f"  Accuracy    : {acc:.4f}")
print(f"  ROC-AUC     : {auc:.4f}")
print(f"{'='*60}")
print(f"\n  Copy these files to your website folder:")
print(f"  {ONNX_PATH}")
print(f"  {META_PATH}")
