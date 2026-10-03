title: Payment timeout
keywords: PaymentProcessorTimeout, connection pool exhausted, /v1/payments 500, PaymentWorker rejected

Payments return 500 or time out talking to the card processor.
Most common cause: a recent payments release changed connection pool or timeout settings.
First step: if a payments release went out in the last 30 minutes, roll it back. Otherwise check processor status and restart PaymentWorker pods.
