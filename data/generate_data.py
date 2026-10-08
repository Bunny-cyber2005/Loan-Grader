"""
JPMC - Loan Grader Project
Synthetic Data Generator for Demo Purposes
Author: Data Science Team
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)
n = 5000

# ── Customer Demographics ──────────────────────────────────────────────────────
customer_id     = [f"CUST{str(i).zfill(5)}" for i in range(1, n + 1)]
age             = np.random.randint(21, 70, n)
gender          = np.random.choice(["Male", "Female"], n, p=[0.55, 0.45])
marital_status  = np.random.choice(["Single", "Married", "Divorced"], n, p=[0.35, 0.50, 0.15])
education       = np.random.choice(["High School", "Graduate", "Post-Graduate", "Doctorate"],
                                   n, p=[0.20, 0.45, 0.25, 0.10])
employment      = np.random.choice(["Salaried", "Self-Employed", "Business Owner", "Unemployed"],
                                   n, p=[0.50, 0.25, 0.15, 0.10])
years_employed  = np.where(employment == "Unemployed", 0,
                           np.random.randint(1, 30, n))

# ── Banking Transactions ───────────────────────────────────────────────────────
annual_income       = np.random.normal(75000, 30000, n).clip(15000, 500000).astype(int)
monthly_balance     = np.random.normal(5000, 3000, n).clip(0, 100000).astype(int)
num_bank_accounts   = np.random.randint(1, 6, n)
savings_balance     = np.random.normal(20000, 15000, n).clip(0, 300000).astype(int)
monthly_deposits    = np.random.normal(3000, 1500, n).clip(0, 50000).astype(int)
monthly_withdrawals = np.random.normal(2500, 1200, n).clip(0, 50000).astype(int)
num_bounced_checks  = np.random.poisson(0.5, n)

# ── Card Transactions ──────────────────────────────────────────────────────────
num_credit_cards    = np.random.randint(0, 6, n)
credit_limit        = (annual_income * np.random.uniform(0.1, 0.5, n)).astype(int)
credit_utilization  = np.random.beta(2, 5, n).round(2)        # skewed low is healthy
monthly_card_spend  = (credit_limit * credit_utilization * 0.08).astype(int)
num_late_payments   = np.random.poisson(1.2, n)
num_card_defaults   = np.random.poisson(0.3, n)

# ── Loan History ───────────────────────────────────────────────────────────────
num_existing_loans  = np.random.randint(0, 5, n)
total_loan_amount   = (annual_income * np.random.uniform(0, 4, n)).astype(int)
monthly_emi         = (total_loan_amount / np.random.randint(12, 120, n)).astype(int)
loan_repayment_pct  = np.random.beta(5, 2, n).round(2)         # mostly high
num_loan_defaults   = np.random.poisson(0.4, n)
debt_to_income      = ((monthly_emi * 12) / (annual_income + 1)).round(2).clip(0, 2)

# ── Credit Score (CIBIL-style 300-900) ────────────────────────────────────────
raw_score = (
      0.30 * (1 - credit_utilization)
    + 0.25 * loan_repayment_pct
    + 0.15 * (1 - debt_to_income.clip(0, 1))
    + 0.10 * ((annual_income - 15000) / (500000 - 15000))
    + 0.10 * (1 - (num_late_payments  / (num_late_payments.max()  + 1)))
    + 0.05 * (1 - (num_loan_defaults  / (num_loan_defaults.max()  + 1)))
    + 0.05 * (1 - (num_bounced_checks / (num_bounced_checks.max() + 1)))
)
credit_score = (300 + raw_score * 600).astype(int).clip(300, 900)

# ── Loan Grade (Target Variable) ──────────────────────────────────────────────
def assign_grade(score):
    if score >= 800: return "A"
    elif score >= 700: return "B"
    elif score >= 600: return "C"
    elif score >= 500: return "D"
    elif score >= 400: return "E"
    else:              return "F"

loan_grade = pd.Series(credit_score).apply(assign_grade)

# Introduce realistic noise
noise_idx = np.random.choice(n, size=int(0.05 * n), replace=False)
grades     = ["A", "B", "C", "D", "E", "F"]
loan_grade.iloc[noise_idx] = np.random.choice(grades, size=len(noise_idx))

# ── Assemble DataFrame ─────────────────────────────────────────────────────────
df = pd.DataFrame({
    "customer_id"         : customer_id,
    "age"                 : age,
    "gender"              : gender,
    "marital_status"      : marital_status,
    "education"           : education,
    "employment_type"     : employment,
    "years_employed"      : years_employed,
    "annual_income"       : annual_income,
    "monthly_balance"     : monthly_balance,
    "num_bank_accounts"   : num_bank_accounts,
    "savings_balance"     : savings_balance,
    "monthly_deposits"    : monthly_deposits,
    "monthly_withdrawals" : monthly_withdrawals,
    "num_bounced_checks"  : num_bounced_checks,
    "num_credit_cards"    : num_credit_cards,
    "credit_limit"        : credit_limit,
    "credit_utilization"  : credit_utilization,
    "monthly_card_spend"  : monthly_card_spend,
    "num_late_payments"   : num_late_payments,
    "num_card_defaults"   : num_card_defaults,
    "num_existing_loans"  : num_existing_loans,
    "total_loan_amount"   : total_loan_amount,
    "monthly_emi"         : monthly_emi,
    "loan_repayment_pct"  : loan_repayment_pct,
    "num_loan_defaults"   : num_loan_defaults,
    "debt_to_income"      : debt_to_income,
    "credit_score"        : credit_score,
    "loan_grade"          : loan_grade,
})

# Inject 3 % missing values in select columns
for col in ["annual_income", "credit_utilization", "loan_repayment_pct",
            "monthly_balance", "monthly_emi"]:
    idx = np.random.choice(n, size=int(0.03 * n), replace=False)
    df.loc[idx, col] = np.nan

os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
df.to_csv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "loan_data.csv"), index=False)
print(f"Dataset saved: {df.shape[0]} rows x {df.shape[1]} columns")
print(df["loan_grade"].value_counts())
