title: Duplicate debit
keywords: Duplicate debit detected, idempotency key, Idempotency store returned null

The same transfer was posted twice because the idempotency check did not find the request key. Customers lose money, so this is data loss.
Most common cause: a recent transfers release changed how idempotency keys are stored or read in Redis.
First step: roll back the latest transfers-service release, then list affected accounts from the ledger reconciliation mismatches and reverse the duplicate debits.
