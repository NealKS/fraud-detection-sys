import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI(title="Fraud Detection API")

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model from the file
model = joblib.load("fraud_model.joblib")


class Transaction(BaseModel):
    features: dict[str, float]


@app.get("/")
def home():
    return {"message": "Fraud API is running"}


@app.post("/predict")
def predict(tx: Transaction):
    # Put the values in the same column order the model learned
    columns = list(model.feature_names_in_)
    row = pd.DataFrame([tx.features])[columns]

    # Probability that this transaction is fraud (0 to 1)
    prob = float(model.predict_proba(row)[0, 1])

    return {
        "fraud_probability": round(prob, 4),
        "is_fraud": prob > 0.5,
    }