import os

file_path = 'backend/server.py'
with open(file_path, 'r') as f:
    data = f.read()

data = data.replace('payment_proof_image: Optional[str] = None', 'payment_proof_image: str')

data = data.replace('"New Merchandise Order"', '"Merchandise Payment Proof Submitted"')
data = data.replace('placed a shop order. Order ID: {payment_reference}.', 'submitted shop payment proof.')
data = data.replace('"Order Placed Successfully"', '"Payment Proof Submitted"')
data = data.replace('f"Your order ID is {payment_reference}. Please pay at the counter."', '"Shop payment screenshot submitted. Waiting for admin confirmation."')
data = data.replace('f"Order Placed! Your Order ID is {payment_reference}. Please pay at the gym counter."', '"Payment screenshot submitted. Awaiting admin confirmation."')

with open(file_path, 'w') as f:
    f.write(data)
