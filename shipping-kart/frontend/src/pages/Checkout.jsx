// Checkout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from "@mui/material";

const Checkout = () => {
  const navigate = useNavigate();
  const [shippingAddress, setShippingAddress] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  // ✅ Payment validation — success only if 16 digits
  const validateCard = (num) => {
    const cleaned = num.replace(/\s+/g, "");
    return cleaned.length === 16;
  };

  const handleCheckout = async () => {
    if (!shippingAddress) {
      setError("Please enter a shipping address.");
      return;
    }

    if (!cardNumber) {
      setError("Please enter a card number.");
      return;
    }

    if (!validateCard(cardNumber)) {
      setError("Payment failed: Invalid card number.");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("http://localhost:5000/api/orders/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shippingAddress,
          paymentSuccess: true, // simulate payment success
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResponse(data);
      } else {
        setError(data.message || "Order creation failed.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Format card input as XXXX XXXX XXXX XXXX
  const handleCardInput = (e) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 16);
    const formatted = value.replace(/(.{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  };

  // ✅ Navigate to home after delay if payment successful
  useEffect(() => {
    if (response) {
      const timer = setTimeout(() => {
        navigate("/home"); // Navigate to Home page
      }, 3000); // 3 seconds delay
      return () => clearTimeout(timer);
    }
  }, [response, navigate]);

  return (
    <Box sx={{ p: 4, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <Typography
        variant="h4"
        sx={{ fontWeight: "bold", mb: 4, color: "#3f51b5" }}
      >
        Checkout
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!response ? (
        <Box
          sx={{
            maxWidth: 500,
            mx: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <TextField
            label="Shipping Address"
            multiline
            rows={3}
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            fullWidth
            variant="outlined"
          />

          <TextField
            label="Card Number (Mock)"
            value={cardNumber}
            onChange={handleCardInput}
            placeholder="Enter 16-digit card number"
            fullWidth
            variant="outlined"
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleCheckout}
            disabled={loading}
            sx={{ py: 1.5 }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              "Pay Now"
            )}
          </Button>
        </Box>
      ) : (
        <Card
          sx={{
            maxWidth: 600,
            mx: "auto",
            mt: 5,
            bgcolor: "#e8f5e9",
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", mb: 2, color: "#2e7d32" }}
            >
              ✅ Payment Successful!
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <b>Order ID:</b> {response._id}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <b>Shipping Address:</b> {response.shippingAddress}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <b>Total Items:</b> {response.items?.length || 0}
            </Typography>

            {response.items?.map((item, i) => (
              <Box
                key={i}
                sx={{
                  mt: 1,
                  p: 1,
                  bgcolor: "#c8e6c9",
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2">
                  {item.product?.name || `Product ID: ${item.product}`} × {item.quantity}
                </Typography>
              </Box>
            ))}

            <Typography variant="body1" sx={{ mt: 2, fontWeight: "bold" }}>
              Payment Status: Success ✅
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: "#2e7d32" }}>
              Redirecting to Home...
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Checkout;
