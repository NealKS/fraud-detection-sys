from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI(title="Fraud Detection API")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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