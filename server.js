import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Get all drugs
app.get("/api/drugs", async (req, res) => {
  try {
    const { company } = req.query;
    const where = company ? { company } : {};
    const drugs = await prisma.drugs.findMany({
      where,
      orderBy: { launchDate: "desc" },
    });
    res.json(drugs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single drug by code
app.get("/api/drugs/:code", async (req, res) => {
  try {
    const drug = await prisma.drugs.findFirst({
      where: { code: req.params.code },
    });
    if (!drug) return res.status(404).json({ message: "Drug not found" });
    res.json(drug);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Seed initial data
app.post("/api/seed", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "data", "drugs.json");
    const drugs = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    await prisma.drugs.deleteMany({});
    await prisma.drugs.createMany({ data: drugs });
    res.json({ message: "Database seeded successfully", count: drugs.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
