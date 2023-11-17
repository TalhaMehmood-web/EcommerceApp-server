import express from "express";
import bodyParser from "body-parser";
import userRouter from "./routes/userRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import customerRouter from "./routes/costumerRoutes.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
const port = process.env.PORT || 4000;

const app = express();

app.use(cors());
app.use(bodyParser.json());
dotenv.config();
mongoose.connect(process.env.MONGO_URL);
mongoose.connection.on("connected", () => {
    console.log("database connected");

})
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/customer", customerRouter)
app.get("/", (res) => {
    res.status(200).json("connected")
})


app.listen(port, () => {
    console.log(`server is running at port:${port}`);
})
