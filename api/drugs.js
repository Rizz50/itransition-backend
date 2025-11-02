import { PrismaClient } from "@prisma/client";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import serverless from "serverless-http";
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
    const { company, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where = company ? { company } : {};

    // Count total records
    const total = await prisma.drugs.count({ where });

    // Fetch paginated results
    const drugs = await prisma.drugs.findMany({
      where,
      orderBy: { launchDate: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    res.json({
      data: drugs,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
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

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`)
  );
}

export default app;
export const handler = serverless(app);
