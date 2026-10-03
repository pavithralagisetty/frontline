title: Ledger replica out of memory
keywords: OutOfMemoryError, LedgerReplicaUnavailable, replica degraded, Journal posting queue backlog

A ledger DB replica ran out of memory. Postings queue up but are not lost; the primary still accepts writes.
Workaround: reads fail over to the other replicas.
First step: restart the failing replica and raise its memory limit; watch the posting backlog drain.
