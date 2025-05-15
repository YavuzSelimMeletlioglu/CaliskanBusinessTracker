import express from "express";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import axios from "axios";
import pool from "../config/db.js";
import QuickChart from "quickchart-js";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const report_router = express.Router();

const fetchGraphData = async (endpoint, company_id, type) => {
  const url = `http://localhost:3000${endpoint}?company_id=${company_id}&type=${type}`;
  const res = await axios.get(url);
  return res.data;
};

const generateChartImage = async ({ labels, values, title }) => {
  const chart = new QuickChart();
  chart.setConfig({
    type: "bar",
    data: {
      labels,
      datasets: [{ label: title, data: values }],
    },
    options: { plugins: { legend: { display: false } } },
  });
  chart.setWidth(500).setHeight(300);
  return await chart.toBinary();
};

report_router.post("/send-multi-company-report", async (req, res) => {
  const { email, endpoint_type } = req.body;

  if (!email || !endpoint_type) {
    return res
      .status(400)
      .json({ success: false, message: "Email ve endpoint zorunlu." });
  }

  try {
    const [companies] = await pool.query("SELECT id, name FROM companies");

    const doc = new PDFDocument();
    const buffers = [];

    const fontPath = path.resolve("assets/fonts/OpenSans-Regular.ttf");
    doc.registerFont("OpenSans", fontPath);
    doc.font("OpenSans");

    let endpoints = [""];
    let subject = "";
    if (endpoint_type.includes("incoming")) {
      endpoints = ["/incoming-graph-data", "/incoming-graph-data-by-product"];
      subject = "Gelen Ürün Raporu";
    } else if (endpoint_type.includes("outgoing")) {
      endpoints = ["/outgoing-graph-data", "/outgoing-graph-data-by-product"];
      subject = "Giden Ürün Raporu";
    } else {
      endpoints = ["/net-graph-data", "/net-graph-data-by-product"];
      subject = "Net Ürün Raporu";
    }

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "yavuz.selim58m@gmail.com",
          pass: process.env.GMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: "Otomatik Rapor",
        to: email,
        subject: subject,
        text: "PDF ekte yer almaktadır.",
        attachments: [{ filename: "rapor.pdf", content: pdfBuffer }],
      });

      res.json({ success: true });
    });

    doc.font("OpenSans").fontSize(20).text("Firma Bazlı Ürün Raporu", {
      align: "center",
    });
    doc.moveDown(2);

    for (const company of companies) {
      for (const type of ["yearly", "monthly"]) {
        for (const endpoint of endpoints) {
          const data = await fetchGraphData(endpoint, company.id, type);
          const result = data.data;

          if (!Array.isArray(result) || result.length === 0) continue;

          const labels = result.map((d) => d.label);
          const values = result.map((d) => d.value);
          const title = `${company.name} - ${
            type === "yearly" ? "Yıllık" : "Aylık"
          } - ${
            endpoint.includes("by-product") ? "Ürün Bazlı" : "Genel"
          } Grafik`;

          doc.addPage().font("OpenSans").fontSize(16).text(title, {
            underline: true,
          });
          doc.moveDown();

          labels.forEach((label, i) => {
            doc.fontSize(12).text(`• ${label}: ${values[i]} kg`);
          });

          const chartImage = await generateChartImage({
            labels,
            values,
            title,
          });

          doc
            .moveDown()
            .image(chartImage, { fit: [480, 300], align: "center" });
        }
      }
    }

    doc.end();
  } catch (err) {
    console.error("Rapor oluşturma hatası:", err);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
});

export default report_router;
