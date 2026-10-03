title: Fraud model timeout
keywords: Fraud model inference timeout, scoring queue depth, fraud check unavailable

The fraud scoring model is too slow to answer, so the scoring queue backs up. Card authorizations fail closed and get declined, and wires are held.
Customers cannot pay by card while this lasts.
First step: scale out the fraud model inference pods and check model server CPU and memory; if it does not recover in 5 minutes, switch scoring to the rules-only fallback.
