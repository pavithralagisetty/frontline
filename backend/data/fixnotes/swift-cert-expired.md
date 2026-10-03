title: SWIFT certificate expired
keywords: TLS handshake with SWIFT gateway failed, client certificate expired, NotTimeValid

The client certificate wire-gateway uses to talk to SWIFT has expired, so every outgoing wire fails.
First step: install the renewed SWIFT client certificate on wire-gateway and restart it, then release the queued wires. Add a renewal reminder 30 days before expiry.
