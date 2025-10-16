// Admin.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Modal,
  Fade,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const API_URL = "http://localhost:5000/api/products";

const AddProduct = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    countInStock: "",
    images: "",
  });

  // Utility: Get token from localStorage
  const token = localStorage.getItem("token");

  // Fetch products list
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        setAlert({ type: "error", text: "Could not fetch products." });
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [modalOpen, token, alert]);

  // Form change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Parse comma-separated URLs string to array
  const imagesArr = form.images
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s);

  // Create product handler
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          category: form.category,
          countInStock: Number(form.countInStock),
          images: imagesArr,
        }),
      });
      if (res.ok) {
        setAlert({ type: "success", text: "Product created successfully." });
        setForm({
          name: "",
          description: "",
          price: "",
          category: "",
          countInStock: "",
          images: "",
        });
        setModalOpen(false);
      } else {
        const error = await res.json();
        setAlert({ type: "error", text: error.message || "Failed to create product." });
      }
    } catch {
      setAlert({ type: "error", text: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal and populate form
  const handleEditOpen = (product) => {
    setEditMode(true);
    setSelectedProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      category: product.category,
      countInStock: String(product.countInStock),
      images: product.images.join(", "),
    });
    setModalOpen(true);
  };

  // Update product handler
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    try {
      const res = await fetch(`${API_URL}/${selectedProduct._id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          category: form.category,
          countInStock: Number(form.countInStock),
          images: imagesArr,
        }),
      });
      if (res.ok) {
        setAlert({ type: "success", text: "Product updated successfully." });
        setModalOpen(false);
        setSelectedProduct(null);
        setEditMode(false);
      } else {
        const error = await res.json();
        setAlert({ type: "error", text: error.message || "Failed to update product." });
      }
    } catch {
      setAlert({ type: "error", text: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  };

  // Delete product handler
  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setLoading(true);
    setAlert(null);
    try {
      const res = await fetch(`${API_URL}/${productId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setAlert({ type: "success", text: "Product deleted." });
      } else {
        const error = await res.json();
        setAlert({ type: "error", text: error.message || "Failed to delete product." });
      }
    } catch {
      setAlert({ type: "error", text: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  };

  // Reset modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditMode(false);
    setSelectedProduct(null);
    setForm({
      name: "",
      description: "",
      price: "",
      category: "",
      countInStock: "",
      images: "",
    });
  };

  // Form UI inside modal
  const renderForm = (
    <Box component="form" sx={{ p: 3, maxWidth: 450 }} onSubmit={editMode ? handleUpdate : handleCreate}>
      <Typography variant="h5" mb={2}>{editMode ? "Update Product" : "Add Product"}</Typography>
      <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth required sx={{ mb: 2 }} />
      <TextField label="Description" name="description" value={form.description} onChange={handleChange} fullWidth required sx={{ mb: 2 }} multiline />
      <TextField label="Price" name="price" value={form.price} onChange={handleChange} fullWidth required sx={{ mb: 2 }} type="number" inputProps={{ min: 0 }} />
      <TextField label="Category" name="category" value={form.category} onChange={handleChange} fullWidth required sx={{ mb: 2 }} />
      <TextField label="Stock" name="countInStock" value={form.countInStock} onChange={handleChange} fullWidth required sx={{ mb: 2 }} type="number" inputProps={{ min: 0 }} />
      <TextField label="Images (comma, URL)" name="images" value={form.images} onChange={handleChange} fullWidth sx={{ mb: 2 }} />
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button type="submit" variant="contained" color="primary" disabled={loading}>{editMode ? "Update" : "Create"}</Button>
        <Button variant="outlined" color="secondary" onClick={handleCloseModal}>Cancel</Button>
      </Box>
      {alert && <Alert severity={alert.type} sx={{ mt: 2 }}>{alert.text}</Alert>}
    </Box>
  );

  return (
    <Box sx={{ bgcolor: "#f5f8fa", minHeight: "100vh", px: 4, py: 6 }}>
      <Typography variant="h4" gutterBottom sx={{ color: "#3f51b5", fontWeight: "bold" }}>
        Admin Product Dashboard
      </Typography>
      <Button variant="contained" color="success" onClick={() => setModalOpen(true)} sx={{ mb: 3 }}>
        Add Product
      </Button>

      {/* Product Table */}
      {loading ? (
        <CircularProgress sx={{ mt: 4 }} />
      ) : (
        <Table sx={{ bgcolor: "white", borderRadius: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell><b>Name</b></TableCell>
              <TableCell><b>Category</b></TableCell>
              <TableCell><b>Price</b></TableCell>
              <TableCell><b>Stock</b></TableCell>
              <TableCell><b>Images</b></TableCell>
              <TableCell><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((prod) => (
              <TableRow key={prod._id}>
                <TableCell>{prod.name}</TableCell>
                <TableCell><Chip label={prod.category} color="primary" size="small" /></TableCell>
                <TableCell>₹{prod.price}</TableCell>
                <TableCell>{prod.countInStock}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {prod.images.map((img, idx) => (
                      <CardMedia
                        key={idx}
                        component="img"
                        image={img}
                        alt={prod.name}
                        sx={{ width: 40, height: 40, borderRadius: 2, border: "1px solid #00bcd4" }}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleEditOpen(prod)} title="Edit">
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(prod._id)} title="Delete">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal for Create/Edit */}
      <Modal open={modalOpen} onClose={handleCloseModal} closeAfterTransition>
        <Fade in={modalOpen}>
          <Card sx={{
            position: "absolute",
            top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            maxWidth: 500, bgcolor: "white", borderRadius: 4, boxShadow: 8, p: 3,
          }}>
            <IconButton onClick={handleCloseModal} sx={{ position: "absolute", top: 12, right: 12 }}>
              <CloseIcon />
            </IconButton>
            {renderForm}
          </Card>
        </Fade>
      </Modal>

      {/* Main Alert */}
      {alert && !modalOpen && (
        <Alert severity={alert.type} sx={{ mt: 3, mb: 1, borderRadius: 2 }}>
          {alert.text}
        </Alert>
      )}
    </Box>
  );
};

export default AddProduct;
