title: HSM unavailable
keywords: HSM node, PIN verification failing, HSM session limit reached, HSM PIN verification unavailable

The hardware security module that checks PINs is not responding. ATM withdrawals and PIN purchases fail.
First step: fail PIN traffic over to the other HSM node and restart the cards-service HSM client; open a ticket with the HSM vendor if both nodes are down.
