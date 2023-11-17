import express from "express";
import { addCart, updateCart, getAllCarts, deleteCart, deleteProductsFromCart, products, getSingleProduct } from "../controller/customerController.js";
import { createOrder, getOrderHistory, cancelOrder } from "../controller/orderController.js";
import protect from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/products", products);
router.get("/single-product/:productId", protect, getSingleProduct)
router.post("/add-to-cart", protect, addCart);
router.put("/update-cart/:cartId", protect, updateCart)
router.get("/get-all-carts/:userId", protect, getAllCarts)
router.delete("/delete-cart/:cartId", protect, deleteCart)
router.delete("/delete-products/:cartId", protect, deleteProductsFromCart)
router.post('/create-order', protect, createOrder);
router.get('/history-order/:userId', protect, getOrderHistory);
router.put('/cancel-order/:orderId', protect, cancelOrder);
export default router;

