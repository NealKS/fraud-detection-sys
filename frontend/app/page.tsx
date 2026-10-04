"use client";

import { useEffect, useRef, useState } from "react";

// Structure of raw transaction from dataset
interface RawTransaction {
  Time: number;
  Amount: number;
  Class: number;
  [key: string]: number;
}

// Structure of processed transaction shown in the table
interface ProcessedTransaction {
  id: number;
  time: number;
  amount: number;
  fraudProbability: number;
  status: "SAFE" | "FLAGGED";
  actualLabel: number; // 0 for Normal, 1 for Fraud
}

// Prediction API response structure
interface PredictResponse {
  fraud_probability: number;
  is_fraud: boolean;
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([]);
  const [totalProcessed, setTotalProcessed] = useState<number>(0);
  const [totalFlagged, setTotalFlagged] = useState<number>(0);
  const [totalActualFraud, setTotalActualFraud] = useState<number>(0);

  // Store dataset in a ref to keep it across renders
  const sampleDataRef = useRef<RawTransaction[]>([]);
  // Keep track of current index in sample dataset
  const currentIndexRef = useRef<number>(0);
  // Ensure we don't start multiple interval timers
  const timerStartedRef = useRef<boolean>(false);

  // Function to load the sample transactions JSON file
  const loadSampleTransactions = async () => {
    try {
      const response = await fetch("/sample_transactions.json");
      if (!response.ok) {
        throw new Error(`Failed to load samples: ${response.statusText}`);
      }
      const data: RawTransaction[] = await response.json();
      sampleDataRef.current = data;
    } catch (error) {
      console.error("Error loading sample transactions:", error);
    }
  };

  // Function to send a single transaction to backend API and update state
  const sendNextTransaction = async () => {
    const samples = sampleDataRef.current;
    if (!samples || samples.length === 0) {
      return;
    }

    // Get the next transaction in sequence (loops back if reaches end)
    const rawTx = samples[currentIndexRef.current % samples.length];
    currentIndexRef.current += 1;

    // Remove the "Class" field before sending features to backend
    const { Class, ...featuresWithoutClass } = rawTx;

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          features: featuresWithoutClass,
        }),
      });

      if (!response.ok) {
        throw new Error(`Predict API error: ${response.statusText}`);
      }

      const result: PredictResponse = await response.json();
      const isFlagged = result.is_fraud;
      const status: "SAFE" | "FLAGGED" = isFlagged ? "FLAGGED" : "SAFE";

      const newProcessedItem: ProcessedTransaction = {
        id: Date.now() + Math.random(),
        time: rawTx.Time,
        amount: rawTx.Amount,
        fraudProbability: result.fraud_probability,
        status: status,
        actualLabel: Class,
      };

      // Update the table with the latest 20 transactions (newest on top)
      setTransactions((prev) => [newProcessedItem, ...prev].slice(0, 20));

      // Update summary counts
      setTotalProcessed((prev) => prev + 1);
      if (isFlagged) {
        setTotalFlagged((prev) => prev + 1);
      }
      if (Class === 1) {
        setTotalActualFraud((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error predicting transaction:", error);
    }
  };

  // Effect to initialize dataset loading and run the 2-second interval loop
  useEffect(() => {
    if (timerStartedRef.current) return;
    timerStartedRef.current = true;

    let intervalId: NodeJS.Timeout;

    const startStreaming = async () => {
      await loadSampleTransactions();

      // Send the first transaction immediately, then every 2 seconds
      sendNextTransaction();
      intervalId = setInterval(sendNextTransaction, 2000);
    };

    startStreaming();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="border-b border-slate-800 pb-5">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Fraud Detection Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time transaction stream evaluation against FastAPI ML service
          </p>
        </header>

        {/* Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
              Total Processed
            </span>
            <p className="text-3xl font-extrabold text-white mt-2">
              {totalProcessed}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <span className="text-xs uppercase font-semibold text-amber-400 tracking-wider">
              Total Flagged
            </span>
            <p className="text-3xl font-extrabold text-amber-400 mt-2">
              {totalFlagged}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <span className="text-xs uppercase font-semibold text-rose-400 tracking-wider">
              Total Actually Fraud
            </span>
            <p className="text-3xl font-extrabold text-rose-400 mt-2">
              {totalActualFraud}
            </p>
          </div>
        </section>

        {/* Transactions Table */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Latest Transactions (Max 20)
            </h2>
            <span className="inline-flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Feed (Every 2s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-medium">Time (s)</th>
                  <th className="px-6 py-3 font-medium">Amount ($)</th>
                  <th className="px-6 py-3 font-medium">Fraud Probability</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actual Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      Waiting for stream to start...
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isFlagged = tx.status === "FLAGGED";
                    return (
                      <tr
                        key={tx.id}
                        className={
                          isFlagged
                            ? "bg-red-950/40 text-red-200 font-medium"
                            : "hover:bg-slate-800/40 text-slate-200 transition-colors"
                        }
                      >
                        <td className="px-6 py-3.5 font-mono">{tx.time}</td>
                        <td className="px-6 py-3.5 font-mono">
                          ${tx.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 font-mono">
                          {(tx.fraudProbability * 100).toFixed(2)}%
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                              isFlagged
                                ? "bg-red-500 text-white"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                              tx.actualLabel === 1
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {tx.actualLabel === 1 ? "1 (Fraud)" : "0 (Normal)"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
