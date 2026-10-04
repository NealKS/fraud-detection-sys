import pandas as pd, joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, average_precision_score
from xgboost import XGBClassifier

df = pd.read_csv("creditcard.csv")  # download from Kaggle, not stored in repo
X, y = df.drop("Class", axis=1), df["Class"]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)

ratio = (y_train == 0).sum() / (y_train == 1).sum()
model = XGBClassifier(n_estimators=300, max_depth=4, learning_rate=0.1,
                      scale_pos_weight=ratio, eval_metric="aucpr",
                      random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

probs = model.predict_proba(X_test)[:, 1]
print(classification_report(y_test, (probs > 0.5).astype(int), digits=3))
print("ROC-AUC:", roc_auc_score(y_test, probs))
print("AUPRC:", average_precision_score(y_test, probs))
joblib.dump(model, "fraud_model.joblib")