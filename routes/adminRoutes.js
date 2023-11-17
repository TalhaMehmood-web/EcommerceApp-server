import express from "express";
const router = express.Router();
import { addProduct, editProduct, deleteProduct, listAllProducts } from "../controller/adminController.js";
import { getAllOrders, updateOrderStatus, allCustomers } from "../controller/orderController.js";
import protect from "../middleware/authMiddleware.js";



router.post("/add-product/:adminId", protect, addProduct);
router.get("/list-product/:adminId", protect, listAllProducts)
router.get("/all-customers/:adminId", protect, allCustomers)
router.put("/edit-product/:productId", protect, editProduct);
router.delete("/delete-product/:productId", protect, deleteProduct);
router.get("/get-orders/:adminId", protect, getAllOrders)
router.put("/update-status/:orderId", protect, updateOrderStatus)
export default router;
