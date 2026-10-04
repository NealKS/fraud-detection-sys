import pandas as pd

df = pd.read_csv('/Users/neal.sk/Downloads/creditcard.csv')
fraud = df[df.Class == 1].sample(15, random_state=1)
normal = df[df.Class == 0].sample(185, random_state=1)
samples = pd.concat([fraud, normal]).sample(frac=1, random_state=1)
samples.to_json('sample_transactions.json', orient='records')
print("Saved", len(samples), "transactions")