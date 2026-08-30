const fs = require('fs');
const file = 'backend/server.py';
let data = fs.readFileSync(file, 'utf8');

// Update backend texts
data = data.replace(
  `"Merchandise Payment Proof Submitted"`,
  `"New Merchandise Order"`
);
data = data.replace(
  `f"{current_user.full_name} from {current_user.center} submitted shop payment proof. "`,
  `f"{current_user.full_name} from {current_user.center} placed a shop order. Order ID: {payment_reference}. "`
);
data = data.replace(
  `"Payment Proof Submitted"`,
  `"Order Placed Successfully"`
);
data = data.replace(
  `"Shop payment screenshot submitted. Waiting for admin confirmation."`,
  `f"Your order ID is {payment_reference}. Please pay at the counter."`
);
data = data.replace(
  `response["payment_message"] = "Payment screenshot submitted. Awaiting admin confirmation."`,
  `response["payment_message"] = f"Order Placed! Your Order ID is {payment_reference}. Please pay at the gym counter."`
);

fs.writeFileSync(file, data);
