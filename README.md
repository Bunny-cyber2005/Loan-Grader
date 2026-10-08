# 🏦 JPMC — Loan Grader Project

**Client:** JPMorgan Chase & Co.  
**Role:** Data Scientist  
**Stack:** Python · Scikit-Learn · Matplotlib · Seaborn

---

## Objective
Predict the **loan grade (A–F)** of customers using historical banking, card, and loan transactional data to identify creditworthy customers for JPMC.

---

## Project Structure

```
Loan grader/
├── data/
│   ├── generate_data.py      ← Synthetic dataset generator (5,000 records)
│   └── loan_data.csv         ← Generated dataset (27 features)
│
├── notebooks/
│   └── Loan_Grader_JPMC.ipynb ← Main analysis notebook
│
├── dashboard/
│   └── index.html            ← Interactive analytics dashboard
│
├── models/
│   ├── loan_grader_best_model.pkl  ← Saved best model + artifacts
│   └── *.png                 ← All exported visualisation plots
│
├── requirements.txt
└── README.md
```

---

## How to Run

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Generate dataset
```bash
cd data
python generate_data.py
```

### 3. Launch Notebook
```bash
cd notebooks
jupyter notebook Loan_Grader_JPMC.ipynb
```

### 4. View Dashboard
Open `dashboard/index.html` directly in any browser — no server needed.

---

## Notebook Flow

| # | Section | Description |
|---|---------|-------------|
| 1 | Setup & Load | Import libraries, load dataset |
| 2 | EDA | 8 visualisation blocks — distributions, correlations, outliers |
| 3 | Pre-Processing | Imputation, encoding, scaling, train/test split |
| 4 | Feature Engineering | Feature importances using quick RF |
| 5 | Model Training | 8 algorithms · 5-fold CV · Test evaluation |
| 6 | Best Model | Selection, explainability, confidence distribution |
| 7 | Model Persistence | Save `.pkl` + sample prediction demo |

---

## Algorithms Evaluated

| Algorithm | CV Acc | Test Acc | ROC-AUC |
|-----------|--------|----------|---------|
| **Random Forest** ✅ | 96.89% | **97.20%** | **0.993** |
| Gradient Boosting | 96.31% | 96.70% | 0.991 |
| Decision Tree | 95.10% | 95.40% | 0.977 |
| AdaBoost | 94.05% | 94.30% | 0.982 |
| Logistic Regression | 91.20% | 91.45% | 0.975 |
| SVM | 90.90% | 91.00% | 0.971 |
| KNN | 89.50% | 89.70% | 0.960 |
| Naive Bayes | 78.20% | 78.10% | 0.920 |

---

## Loan Grade Reference

| Grade | Score Range | Risk Level |
|-------|-------------|------------|
| A | 800–900 | Excellent – Prime customer |
| B | 700–799 | Good – Low risk |
| C | 600–699 | Fair – Moderate risk |
| D | 500–599 | Below Average – Elevated risk |
| E | 400–499 | Poor – High risk |
| F | 300–399 | Very Poor – Decline recommended |
