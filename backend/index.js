import express from "express";
import axios from "axios";
import cors from "cors";
import auth_router from "./routes/auth.js";
import product_router from "./routes/product.js";
import company_router from "./routes/company.js";
import movement_router from "./routes/movement.js";
import assignment_router from "./routes/assignments.js";
import operation_router from "./routes/operations.js";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/auth", auth_router);
app.use("/products", product_router);
app.use("/companies", company_router);
app.use("/", movement_router);
app.use("/assignments", assignment_router);
app.use("/operations", operation_router);

app.post("/tahmin", async (req, res) => {
  try {
    const response = await axios.post("http://ml:8001/predict", req.body);
    res.json({ data: response.data, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Python model API erişilemedi.");
  }
});

app.listen(3000, () => {
  console.log("Node.js backend 3000 portunda çalışıyor");
});
