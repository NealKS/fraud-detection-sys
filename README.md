# Fraud Detection System
![Dashboard](dashboard.png)

> A real-time end-to-end fraud detection pipeline combining an XGBoost machine learning model, FastAPI inference backend, and a live Next.js streaming dashboard.

---

## 📁 Project Structure

```text
fraud-detection-sys/
├── backend/
│   ├── main.py                     # FastAPI backend application & /predict endpoint
│   ├── train_model.py              # XGBoost model training and evaluation script
│   ├── make_samples.py             # Script to extract balanced test samples
│   ├── fraud_model.joblib          # Trained XGBoost model artifact
│   ├── requirements.txt            # Python dependencies
│   └── sample_transactions.json    # Stream source transactions
├── frontend/
│   ├── app/
│   │   ├── layout.tsx              # Root HTML & Tailwind layout
│   │   ├── page.tsx                # Live dashboard UI with real-time stream table
│   │   └── globals.css             # Tailwind CSS styles
│   ├── public/
│   │   └── sample_transactions.json# Sample transaction payload for stream
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
└── README.md                       # Project documentation
```

---

## 🎯 The Problem

In credit card transaction datasets, fraudulent activity is extremely rare—typically accounting for only **~0.17%** of all transactions. 

Because of this severe class imbalance, standard **accuracy is misleading** (a naive model predicting every transaction as legitimate would achieve 99.83% accuracy while missing 100% of fraud). To properly detect fraudulent transactions, the system must optimize for **Precision**, **Recall**, **ROC-AUC**, and **AUPRC (Average Precision)**.

---

## 📊 Results Table

| Model | Precision | Recall | ROC-AUC | AUPRC |
| :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression** | 0.061 | 0.918 | 0.972 | — |
| **XGBoost (Selected)** | **0.828** | **0.837** | **0.987** | **0.866** |

XGBoost achieves a balanced trade-off, catching over 83.7% of fraud instances with an 82.8% precision rate compared to baseline logistic regression which triggers substantial false positives.

---

## 🏗️ Architecture

```text
[ Live Next.js Dashboard ] 
           │
           │ (Streams JSON features every 2s via POST /predict)
           ▼
[ FastAPI Backend Service (port 8000) ]
           │
           │ (Runs inference via loaded model)
           ▼
[ XGBoost Classifier (`fraud_model.joblib`) ]
           │
           ▼
{ "fraud_probability": 0.9421, "is_fraud": true }
```

---

## 🛠️ Tech Stack

- **Machine Learning**: Python, XGBoost, Scikit-learn, Pandas, Joblib
- **Backend**: FastAPI, Uvicorn, Pydantic
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS

---

## 🚀 How to Run

### 1. Prerequisites (macOS)
If running on macOS, install OpenMP for XGBoost:
```bash
brew install libomp
```

### 2. Backend Setup & Model Training
1. Download the `creditcard.csv` dataset from [Kaggle Credit Card Fraud Detection](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) and place it in the `backend/` directory.
2. Set up the Python virtual environment and run the training script:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python train_model.py
```
3. Generate the sample stream file:
```bash
python make_samples.py
```
4. Start the FastAPI backend server:
```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup & Live Dashboard
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the live dashboard stream.

---

## ⚠️ Limitations

- **Anonymized Features**: Features `V1` through `V28` are PCA-transformed numerical components for confidentiality, meaning raw domain features (like merchant ID, device, geolocation) are not directly accessible.
- **Enriched Demo Stream**: The evaluation sample stream contains an artificially higher fraud rate (~7.5%) to visualize model decisions live within seconds, compared to the ~0.17% natural distribution.
- **Default Classification Threshold**: The system applies a standard decision threshold of `0.5`, whereas production environments would tune the threshold based on specific business costs of false positives vs. false negatives.
- **Historical Data**: The model was trained on European cardholder transactions collected across 2 days in September 2013.
