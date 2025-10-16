// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import connectDB from "./src/config/db.js";
// import productRoutes from "./src/routes/productRoutes.js";
// import userRoutes from "./src/routes/userRoutes.js";
// import orderRoutes from "./src/routes/orderRoutes.js";

// dotenv.config();
// connectDB();

// const app = express();
// app.use(cors());
// app.use(express.json());

// app.use("/api/products", productRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/orders", orderRoutes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

/* -------------------- MongoDB Connection -------------------- */
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("🚀 MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

/* -------------------- Models -------------------- */
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  countInStock: { type: Number, required: true },
  soldOut: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  images: [String],
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, default: 1 },
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [cartItemSchema],
}, { timestamps: true });

const Cart = mongoose.model("Cart", cartSchema);

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [orderItemSchema],
  shippingAddress: { type: String, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, default: "Processing" },
  paymentStatus: { type: String, default: "Pending" },
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);

/* -------------------- Middleware -------------------- */
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") next();
  else res.status(401).json({ message: "Not authorized as admin" });
};

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

/* -------------------- User Routes -------------------- */
app.post("/api/users/signup", async (req, res) => {
  const { name, email, password, role, adminSecret } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: "User already exists" });

  let userRole = "user";
  if (role === "admin" && adminSecret === process.env.ADMIN_SECRET) userRole = "admin";

  const user = await User.create({ name, email, password, role: userRole });
  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
});

app.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else res.status(401).json({ message: "Invalid email or password" });
});

app.get("/api/users/profile", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  else res.status(404).json({ message: "User not found" });
});

app.get("/api/users", protect, admin, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

app.delete("/api/users/:id", protect, admin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user._id.toString() === req.user._id.toString()) return res.status(400).json({ message: "Admins cannot delete their own account" });
  await User.deleteOne({ _id: user._id });
  res.json({ message: "User deleted successfully" });
});

/* -------------------- Product Routes -------------------- */
app.get("/api/products", async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword
      ? { $or: [
          { name: { $regex: req.query.keyword, $options: "i" } },
          { category: { $regex: req.query.keyword, $options: "i" } }
        ]}
      : {};

    const count = await Product.countDocuments(keyword);
    const products = await Product.find(keyword).limit(pageSize).skip(pageSize * (page - 1));

    res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) res.json(product);
  else res.status(404).json({ message: "Product not found" });
});

app.post("/api/products", protect, admin, async (req, res) => {
  const product = new Product(req.body);
  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

app.put("/api/products/:id", protect, admin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    Object.assign(product, req.body);
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else res.status(404).json({ message: "Product not found" });
});

app.delete("/api/products/:id", protect, admin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  await product.deleteOne();
  res.json({ message: "Product removed" });
});

/* -------------------- Cart Routes -------------------- */
app.get("/api/orders/cart", protect, async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  res.json(cart || { items: [] });
});

app.post("/api/orders/cart", protect, async (req, res) => {
  const { productId, quantity } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found" });
  if (product.soldOut || product.countInStock < quantity) return res.status(400).json({ message: "Product out of stock" });

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
  if (itemIndex > -1) cart.items[itemIndex].quantity = quantity;
  else cart.items.push({ product: productId, quantity });

  await cart.save();
  const populatedCart = await cart.populate("items.product");
  res.json(populatedCart);
});

app.delete("/api/orders/cart/:productId", protect, async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
  await cart.save();
  res.json(cart);
});

/* -------------------- Checkout -------------------- */
app.post("/api/orders/checkout", protect, async (req, res) => {
  const { shippingAddress, paymentSuccess } = req.body;
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  if (!cart || cart.items.length === 0) return res.status(400).json({ message: "Cart is empty" });
  if (!paymentSuccess) return res.status(400).json({ message: "Payment failed" });

  const validItems = cart.items.filter(i => i.product);
  const totalPrice = validItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  for (const item of validItems) {
    const product = await Product.findById(item.product._id);
    if (!product) continue;
    product.countInStock -= item.quantity;
    if (product.countInStock <= 0) product.soldOut = true;
    await product.save();
  }

  const order = await Order.create({
    user: req.user._id,
    items: validItems.map(i => ({ product: i.product._id, quantity: i.quantity, price: i.product.price })),
    shippingAddress,
    totalPrice,
    status: "Processing",
    paymentStatus: "Paid",
  });

  cart.items = [];
  await cart.save();

  res.status(201).json(order);
});

app.get("/api/orders", protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate("items.product");
  res.json(orders);
});

app.get("/api/orders/:id", protect, async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.product");
  if (order) res.json(order);
  else res.status(404).json({ message: "Order not found" });
});

/* -------------------- Server -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
