
import express from "express";
const router = express.Router();

// Example route
router.get("/", (req, res) => {
	res.send("Order route working!");
});

export default router;
