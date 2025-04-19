import express from "express";
import axios from "axios";
import pool from "./config/db.js";
import cors from "cors";
import auth_router from "./routes/auth.js";
import product_router from "./routes/product.js";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/auth", auth_router);
app.use("/urunler", product_router);

app.post("/tahmin", async (req, res) => {
  try {
    const response = await axios.post("http://ml:8001/predict", req.body);
    res.json({ data: response.data, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Python model API erişilemedi.");
  }
});
{
  /* 
  
  
app.get("/urunler", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM urunler");
    res.json(rows);
  } catch (err) {
    console.error("Veritabanı hatası:", err.message);
    res.status(500).send("Veritabanı hatası.");
  }
});

app.post("/urunler", async (req, res) => {
  const { ad, miktar } = req.body;
  try {
    const [result] = await pool.execute(
      "INSERT INTO urunler (ad, miktar) VALUES (?, ?)",
      [ad, miktar]
    );
    res.status(201).json({ id: result.insertId, ad, miktar });
  } catch (err) {
    console.error("Veritabanı hatası:", err.message);
    res.status(500).send("Veritabanı hatası.");
  }
});

  */
}
app.listen(3000, () => {
  console.log("Node.js backend 3000 portunda çalışıyor");
});
