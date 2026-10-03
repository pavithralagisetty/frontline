title: Loan disbursement stuck
keywords: Disbursement worker crashed, poison message, could not be converted to System.Decimal

One bad message in the disbursement queue crashes the worker every time it is read, so approved loans are not paid out.
First step: move the poison message to the dead letter queue so disbursements resume, then fix the amount format from the sender.
