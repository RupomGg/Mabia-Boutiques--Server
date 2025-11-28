// Lazy-load PayPal only when actually needed
// This prevents the SDK from trying to authenticate on server startup

const getPaypalClient = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID || "";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    const error = new Error("PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
    error.code = "PAYPAL_NOT_CONFIGURED";
    throw error;
  }

  // Only require and configure PayPal when this function is called
  const paypal = require("paypal-rest-sdk");
  
  paypal.configure({
    mode: process.env.PAYPAL_MODE || "sandbox",
    client_id: clientId,
    client_secret: clientSecret,
  });

  return paypal;
};

module.exports = { getPaypalClient };
