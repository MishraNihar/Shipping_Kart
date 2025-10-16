// Orders.jsx
// Orders.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Modal,
  Fade,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const token = localStorage.getItem("token");

  // Fetch all orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:5000/api/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (res.ok) {
          setOrders(data);
        } else {
          setError(data.message || "Failed to load orders.");
        }
      } catch (err) {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  // Fetch single order detail
  const handleViewDetail = async (orderId) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedOrder(data);
      } else {
        setError(data.message || "Failed to fetch order details.");
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseModal = () => setSelectedOrder(null);

  return (
    <Box sx={{ p: 4, minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 4, color: "#3f51b5" }}>
        My Orders
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Typography align="center" sx={{ mt: 5 }}>
          No orders found.
        </Typography>
      ) : (
        orders.map((order) => (
          <Card
            key={order._id}
            sx={{
              mb: 3,
              borderRadius: 3,
              boxShadow: 4,
              "&:hover": { boxShadow: 8 },
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Order ID: {order._id}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Total Price: ₹{order.totalPrice}
              </Typography>
              <Typography variant="body2">
                Status: {order.status} | Payment: {order.paymentStatus}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Created At: {new Date(order.createdAt).toLocaleString()}
              </Typography>

              <Button
                variant="contained"
                onClick={() => handleViewDetail(order._id)}
                sx={{ mt: 1 }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))
      )}

      {/* 🧾 Order Detail Modal */}
      <Modal
        open={!!selectedOrder}
        onClose={handleCloseModal}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        closeAfterTransition
      >
        <Fade in={!!selectedOrder}>
          <Card sx={{ maxWidth: 600, p: 3, borderRadius: 3, boxShadow: 10, bgcolor: "white" }}>
            <IconButton
              onClick={handleCloseModal}
              sx={{ position: "absolute", top: 10, right: 10 }}
            >
              <CloseIcon />
            </IconButton>

            {detailLoading ? (
              <CircularProgress sx={{ m: "auto", display: "block" }} />
            ) : (
              selectedOrder && (
                <>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                    Order Details
                  </Typography>
                  <Typography>Order ID: {selectedOrder._id}</Typography>
                  <Typography>Shipping: {selectedOrder.shippingAddress}</Typography>
                  <Typography>Total: ₹{selectedOrder.totalPrice}</Typography>
                  <Typography>Status: {selectedOrder.status}</Typography>
                  <Typography>Payment: {selectedOrder.paymentStatus}</Typography>

                  <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: "bold" }}>
                    Items:
                  </Typography>
                  {selectedOrder.items?.map((item, idx) => (
                    <Box key={idx} sx={{ p: 1, bgcolor: "#f1f8e9", borderRadius: 2, my: 1 }}>
                      <Typography>
                        {item.product?.name} × {item.quantity} — ₹{item.price}
                      </Typography>
                    </Box>
                  ))}
                </>
              )
            )}
          </Card>
        </Fade>
      </Modal>
    </Box>
  );
};

export default Orders;
