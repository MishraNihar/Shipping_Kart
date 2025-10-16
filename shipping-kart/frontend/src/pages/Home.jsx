import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  TextField,
  Select,
  MenuItem,
  Pagination,
  InputAdornment,
  Slide,
  Fade,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Rating,
  CardActionArea,
  Modal,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import Badge from "@mui/material/Badge";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonIcon from "@mui/icons-material/Person";
import AddIcon from "@mui/icons-material/Add";

const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("price");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartMessage, setCartMessage] = useState(null);
  const [inCart, setInCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [userRole, setUserRole] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  // Get user role from localStorage
  useEffect(() => {
    const userInfo = localStorage.getItem("user");
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        setUserRole(parsed.role);
      } catch {
        console.error("Invalid userInfo in localStorage");
      }
    }
  }, []);

  // Fetch cart count from API
  const fetchCartCount = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5000/api/orders/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCartCount(data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0);
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
    }
  };

  useEffect(() => {
    fetchCartCount();

    const syncCart = () => fetchCartCount();
    window.addEventListener("storage", syncCart);
    return () => window.removeEventListener("storage", syncCart);
  }, []);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const url = `http://localhost:5000/api/products?pageNumber=${page}&keyword=${keyword}`;
        const response = await fetch(url);
        const data = await response.json();

        let sorted = [...data.products];
        if (sort === "price") sorted.sort((a, b) => a.price - b.price);
        if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
        if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));

        setProducts(sorted);
        setPages(data.pages);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [keyword, sort, page]);

  const handleOpenDetail = async (id) => {
    setDetailLoading(true);
    setCartMessage(null);
    setInCart(false);
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`);
      const data = await response.json();
      setSelectedProduct(data);
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedProduct(null);
    setCartMessage(null);
    setQuantity(1);
    setInCart(false);
  };

  const handleAddToCart = async (productId, qty) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCartMessage({ type: "error", text: "Please log in to add items to cart." });
      return;
    }
    try {
      setCartLoading(true);
      setCartMessage(null);
      const res = await fetch("http://localhost:5000/api/orders/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity: qty }),
      });
      const data = await res.json();
      if (res.ok) {
        setCartMessage({ type: "success", text: "Item added to cart successfully!" });
        setInCart(true);
        fetchCartCount();
      } else {
        setCartMessage({ type: "error", text: data.message || "Failed to add item to cart." });
      }
    } catch (error) {
      setCartMessage({ type: "error", text: "Network error. Try again." });
    } finally {
      setCartLoading(false);
    }
  };

  const ProductCard = ({ product }) => {
    const firstImage = product.images?.[0]?.startsWith("http")
      ? product.images?.[0]
      : "https://via.placeholder.com/200";

    return (
      <Card
        elevation={6}
        sx={{
          width: 260,
          height: 400,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRadius: 4,
          bgcolor: "white",
          transition: "transform .25s, box-shadow .25s",
          "&:hover": { transform: "translateY(-5px)", boxShadow: 10 },
          cursor: "pointer",
        }}
        onClick={() => handleOpenDetail(product._id)}
      >
        <CardActionArea sx={{ flexGrow: 1 }}>
          <CardMedia
            component="img"
            height="160"
            image={firstImage}
            alt={product.name}
            sx={{ objectFit: "contain", borderBottom: "2px solid #00bcd4", p: 1 }}
          />
          <CardContent
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, textAlign: "center", mb: 1, height: 45, overflow: "hidden" }}
            >
              {product.name}
            </Typography>
            <Box sx={{ mb: 1, display: "flex", justifyContent: "center", gap: 1 }}>
              <Chip label={`₹${product.price}`} color="success" size="small" sx={{ fontWeight: 500 }} />
              <Chip label={product.category} color="primary" size="small" />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mb: 1 }}>
              <Rating value={product.rating || 0} readOnly size="small" />
              <Typography variant="caption" sx={{ ml: 1 }}>
                {product.countInStock > 0 ? "In Stock" : "Out of Stock"}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {product.description}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  };

  const ProductDetailModal = () => (
    <Modal
      open={!!selectedProduct}
      onClose={handleCloseDetail}
      sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      closeAfterTransition
    >
      <Fade in={!!selectedProduct}>
        <Card
          sx={{
            maxWidth: 720,
            bgcolor: "white",
            borderRadius: 6,
            p: 3,
            boxShadow: 10,
            position: "relative",
          }}
        >
          <IconButton
            onClick={handleCloseDetail}
            sx={{ position: "absolute", top: 12, right: 16 }}
          >
            <CloseIcon fontSize="large" />
          </IconButton>
          {detailLoading ? (
            <Typography m={8} align="center">
              Loading...
            </Typography>
          ) : (
            selectedProduct && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                <Box sx={{ flex: "1 1 40%" }}>
                  {selectedProduct.images?.map((img, i) => (
                    <CardMedia
                      key={i}
                      component="img"
                      height="200"
                      image={img.startsWith("http") ? img : "https://via.placeholder.com/200"}
                      alt={selectedProduct.name}
                      sx={{ objectFit: "cover", borderRadius: 3, border: "1px solid #00bcd4", mb: 2 }}
                    />
                  ))}
                </Box>
                <Box sx={{ flex: "1 1 55%" }}>
                  <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
                    {selectedProduct.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                    {selectedProduct.description}
                  </Typography>
                  <Chip label={`₹${selectedProduct.price}`} color="success" size="medium" sx={{ my: 1, fontWeight: 600 }} />
                  <Box sx={{ my: 2 }}>
                    <Rating value={selectedProduct.rating || 0} readOnly size="medium" />
                    <Typography variant="body2" sx={{ ml: 1, display: "inline" }}>
                      {selectedProduct.countInStock > 0 ? "In Stock" : "Out of Stock"}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Category: <Chip label={selectedProduct.category} color="primary" size="small" />
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Available Quantity:
                    <TextField
                      type="number"
                      size="small"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      sx={{ width: 60, ml: 1 }}
                      inputProps={{ min: 1, max: selectedProduct.countInStock }}
                    />
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {!inCart ? (
                      <Button
                        variant="contained"
                        onClick={() => handleAddToCart(selectedProduct._id, quantity)}
                        disabled={cartLoading}
                        sx={{
                          background: "linear-gradient(135deg,#00bcd4 0%, #3f51b5 100%)",
                          color: "white",
                          borderRadius: 3,
                          px: 3,
                          py: 1,
                          fontWeight: 600,
                          "&:hover": { opacity: 0.9 },
                        }}
                      >
                        {cartLoading ? (
                          <CircularProgress size={24} sx={{ color: "white" }} />
                        ) : (
                          "Add to Cart"
                        )}
                      </Button>
                    ) : (
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: "#4caf50",
                          fontWeight: 600,
                          textAlign: "center",
                        }}
                      >
                        In Basket 🛒
                      </Typography>
                    )}
                    {cartMessage && (
                      <Alert severity={cartMessage.type} sx={{ mt: 2, borderRadius: 2 }}>
                        {cartMessage.text}
                      </Alert>
                    )}
                  </Box>
                </Box>
              </Box>
            )
          )}
        </Card>
      </Fade>
    </Modal>
  );

  return (
    <Box sx={{ bgcolor: "#f3f7fa", minHeight: "100vh" }}>
      {/* Navbar */}
      <AppBar
        position="sticky"
        elevation={6}
        sx={{
          background: "linear-gradient(90deg, #00bcd4 0%, #3f51b5 100%)",
          borderRadius: "0 0 12px 12px",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", letterSpacing: 0.5 }}>
            🛍️ Shop Cart
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#3f51b5" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ bgcolor: "white", borderRadius: 2, width: 240 }}
            />
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              size="small"
              sx={{ bgcolor: "white", borderRadius: 2, minWidth: 140 }}
            >
              <MenuItem value="price">Sort by Price</MenuItem>
              <MenuItem value="rating">Sort by Rating</MenuItem>
              <MenuItem value="name">Sort by Name</MenuItem>
            </Select>

            {/* Cart Icon */}
            <IconButton sx={{ color: "white" }} onClick={() => navigate("/cart")} title="Cart">
              <Badge color="secondary" badgeContent={cartCount} max={99}>
                <ShoppingCartIcon fontSize="large" />
              </Badge>
            </IconButton>

            {/* Orders Icon */}
            <IconButton sx={{ color: "white" }} onClick={() => navigate("/orders")} title="My Orders">
              <PersonIcon fontSize="large" />
            </IconButton>

            {/* Admin Add Product Icon */}
            {userRole === "admin" && (
              <IconButton sx={{ color: "white" }} title="Add Product" onClick={() => navigate("/add-product")}>
                <AddIcon fontSize="large" />
              </IconButton>
            )}

            {/* Logout Button */}
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                navigate("/"); // Redirect to login
              }}
              sx={{
                borderColor: "white",
                color: "white",
                "&:hover": { borderColor: "#00bcd4", backgroundColor: "#3f51b5" },
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Products Section */}
      <Fade in={true} timeout={400}>
        <Box sx={{ p: 4 }}>
          <Typography variant="h4" align="center" sx={{ fontWeight: "bold", color: "#3f51b5", mb: 3 }}>
            Product Catalog
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 3 }}>
            {loading ? (
              <Typography sx={{ color: "#3f51b5", mx: "auto", my: 7 }}>Loading...</Typography>
            ) : (
              products.map((product, i) => (
                <Slide direction="up" in={true} key={product._id} timeout={300 + i * 80}>
                  <Box>
                    <ProductCard product={product} />
                  </Box>
                </Slide>
              ))
            )}
          </Box>

          {/* Pagination */}
          <Box sx={{ mt: 6, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={pages}
              page={page}
              onChange={(e, value) => setPage(value)}
              sx={{
                "& .Mui-selected": {
                  background: "linear-gradient(135deg,#00bcd4 0%, #3f51b5 100%)",
                  color: "white",
                },
              }}
            />
          </Box>
        </Box>
      </Fade>

      {selectedProduct && <ProductDetailModal />}
    </Box>
  );
};

export default Home;
