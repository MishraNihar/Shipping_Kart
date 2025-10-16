import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState({});
  const [message, setMessage] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchProductDetails = async (items) => {
    const detailedItems = await Promise.all(
      items.map(async (item) => {
        if (typeof item.product === "string") {
          try {
            const res = await fetch(`http://localhost:5000/api/products/${item.product}`);
            const productData = await res.json();
            return { ...item, product: productData };
          } catch {
            return item;
          }
        }
        return item;
      })
    );
    return detailedItems;
  };

  const fetchCart = async () => {
    if (!token) {
      setMessage({ type: "error", text: "Please log in to view your cart." });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/orders/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.items?.length > 0) {
        const detailedItems = await fetchProductDetails(data.items);
        setCart({ ...data, items: detailedItems });
      } else {
        setCart(data);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to fetch cart." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (itemId, productId) => {
    if (!token) return;
    setItemLoading((prev) => ({ ...prev, [itemId]: true }));
    setMessage(null);

    try {
      // Optimistic UI update
      setCart((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i._id !== itemId),
      }));

      const res = await fetch(`http://localhost:5000/api/orders/cart/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.message || "Failed to remove item." });
        fetchCart();
      } else {
        const detailedItems = await fetchProductDetails(data.items);
        setCart({ ...data, items: detailedItems });
        setMessage({ type: "success", text: "Item removed from cart." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error." });
      fetchCart();
    } finally {
      setItemLoading((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const calculateTotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce(
      (sum, item) => sum + (item.product?.price || 0) * item.quantity,
      0
    );
  };

  const hasSoldOutItem = cart?.items?.some(item => item.product?.soldOut || item.product?.countInStock <= 0);

  return (
    <Box sx={{ p: 4, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 4, color: "#3f51b5" }}>
        Your Cart
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <CircularProgress />
        </Box>
      ) : !cart || cart.items.length === 0 ? (
        <Typography sx={{ textAlign: "center", mt: 10 }}>Your cart is empty.</Typography>
      ) : (
        <>
          {message && <Alert severity={message.type} sx={{ mb: 3 }}>{message.text}</Alert>}
          {hasSoldOutItem && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Some items in your cart are sold out and cannot be purchased.
            </Alert>
          )}

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center" }}>
            {cart.items.map((item) => {
              const productId = item.product._id || item.product;
              const soldOut = item.product?.soldOut || item.product?.countInStock <= 0;

              return (
                <Card key={item._id} sx={{ width: 300, borderRadius: 3 }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={item.product?.images?.[0] || "https://via.placeholder.com/200"}
                    alt={item.product?.name}
                    sx={{ objectFit: "contain", p: 1, bgcolor: "#f0f0f0" }}
                  />
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                      {item.product?.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                      {item.product?.description}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
                      Price: ₹{item.product?.price} x {item.quantity} = ₹
                      {(item.product?.price || 0) * item.quantity}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                      Category: {item.product?.category}
                    </Typography>
                    {soldOut && (
                      <Typography variant="body2" color="error" sx={{ fontWeight: "bold" }}>
                        SOLD OUT
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleRemove(item._id, productId)}
                      disabled={!!itemLoading[item._id]}
                      fullWidth
                    >
                      {itemLoading[item._id] ? "Removing..." : "Remove"}
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </Box>

          <Box sx={{ mt: 6, textAlign: "right" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Total: ₹{calculateTotal()}
            </Typography>
            <Button
              variant="contained"
              sx={{
                mt: 2,
                background: "linear-gradient(135deg,#00bcd4 0%, #3f51b5 100%)",
                color: "white",
                px: 4,
              }}
              onClick={() => navigate("/checkout")}
              disabled={hasSoldOutItem} // disable checkout if sold out item exists
            >
              Proceed to Checkout
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Cart;
