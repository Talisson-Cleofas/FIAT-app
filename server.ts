import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";

import { GoogleGenAI } from "@google/genai";
import { MercadoPagoConfig, Preference } from 'mercadopago';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("fiat.db");
const JWT_SECRET = process.env.JWT_SECRET || "fiat-secret-key-2024";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Mercado Pago Lazy Initialization
let mpClient: MercadoPagoConfig | null = null;
const getMPClient = () => {
  if (!mpClient && process.env.MERCADOPAGO_ACCESS_TOKEN) {
    mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
  }
  return mpClient;
};

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    thumbnail TEXT,
    video_url TEXT,
    audio_url TEXT,
    views INTEGER DEFAULT 0,
    tags TEXT,
    is_active INTEGER DEFAULT 1,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER,
    content_id INTEGER,
    PRIMARY KEY (user_id, content_id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (content_id) REFERENCES content (id)
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content_id INTEGER,
    progress INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (content_id) REFERENCES content (id)
  );
`);

// Seed Categories
const categories = [
  { name: "FIAT A Jornada", slug: "a-jornada" },
  { name: "FIAT Eclésia", slug: "eclesia" },
  { name: "FIAT Hesed", slug: "hesed" },
  { name: "FIAT Young", slug: "young" },
  { name: "FIAT Podcast", slug: "podcast" }
];

const insertCategory = db.prepare("INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)");
categories.forEach(cat => insertCategory.run(cat.name, cat.slug));

// Seed Content
const seedContent = [
  {
    title: "A Bíblia em um Ano - Gênesis",
    description: "FIAT a jornada será uma serie de varios videos lendo a biblia toda em um ano. Começamos hoje pelo livro do Gênesis.",
    category_id: 1,
    thumbnail: "https://picsum.photos/seed/bible1/1920/1080",
    video_url: "https://www.youtube.com/watch?v=example1",
    audio_url: "",
    views: 1250,
    tags: "Bíblia, Gênesis, Formação"
  },
  {
    title: "A Bíblia em um Ano - Êxodo",
    description: "FIAT a jornada será uma serie de varios videos lendo a biblia toda em um ano. Hoje meditamos sobre a libertação do Egito.",
    category_id: 1,
    thumbnail: "https://picsum.photos/seed/bible2/1920/1080",
    video_url: "https://www.youtube.com/watch?v=example13",
    audio_url: "",
    views: 980,
    tags: "Bíblia, Êxodo, Libertação"
  },
  {
    title: "A Bíblia em um Ano - Levítico",
    description: "FIAT a jornada será uma serie de varios videos lendo a biblia toda em um ano. A santidade e as leis do povo de Deus.",
    category_id: 1,
    thumbnail: "https://picsum.photos/seed/bible3/1920/1080",
    video_url: "https://www.youtube.com/watch?v=example14",
    audio_url: "",
    views: 750,
    tags: "Bíblia, Levítico, Santidade"
  },
  {
    title: "O Catecismo da Igreja",
    description: "Explore os fundamentos da nossa fé através da leitura guiada do Catecismo da Igreja Católica.",
    category_id: 2,
    thumbnail: "https://picsum.photos/seed/catechism/1920/1080",
    video_url: "https://www.youtube.com/watch?v=example2",
    audio_url: "",
    views: 2100,
    tags: "Catecismo, Doutrina, Fé"
  },
  {
    title: "Diário de Santa Faustina",
    description: "Mergulhe na Divina Misericórdia através das experiências místicas de Santa Faustina Kowalska.",
    category_id: 3,
    thumbnail: "https://picsum.photos/seed/hesed/1920/1080",
    video_url: "https://www.youtube.com/watch?v=example3",
    audio_url: "",
    views: 3400,
    tags: "Misericórdia, Santa Faustina, Oração"
  },
  {
    title: "Devocional para Jovens",
    description: "Uma jornada diária de oração e reflexão pensada especialmente para os desafios da juventude católica.",
    category_id: 4,
    thumbnail: "https://picsum.photos/seed/young/1920/1080",
    video_url: "https://www.youtube.com/watch?v=example4",
    audio_url: "",
    views: 1800,
    tags: "Jovens, Devocional, Espiritualidade"
  },
  {
    title: "Podcast: Formação Católica",
    description: "Conversas e ensinamentos sobre a vida cristã, doutrina e espiritualidade para ouvir em qualquer lugar.",
    category_id: 5,
    thumbnail: "https://picsum.photos/seed/podcast/1920/1080",
    video_url: "",
    audio_url: "https://example.com/audio.mp3",
    views: 5600,
    tags: "Podcast, Formação, Vida Cristã"
  },
  {
    title: "História dos Santos",
    description: "Conheça a vida e o legado dos grandes santos que moldaram a história da Igreja.",
    category_id: 2,
    thumbnail: "https://picsum.photos/seed/saints/1920/1080",
    video_url: "https://www.youtube.com/watch?v=example5",
    audio_url: "",
    views: 1200,
    tags: "Santos, História, Legado"
  },
  {
    title: "Oração do Rosário",
    description: "Reze o Santo Rosário diariamente com meditações sobre os mistérios da nossa redenção.",
    category_id: 3,
    thumbnail: "https://picsum.photos/seed/rosary/1920/1080",
    video_url: "https://www.youtube.com/watch?v=example6",
    audio_url: "",
    views: 8900,
    tags: "Rosário, Maria, Oração"
  },
  {
    title: "Teologia do Corpo",
    description: "Uma introdução aos ensinamentos de São João Paulo II sobre o amor humano e a sexualidade.",
    category_id: 4,
    thumbnail: "https://picsum.photos/seed/theology/1920/1080",
    video_url: "https://www.youtube.com/watch?v=example7",
    audio_url: "",
    views: 2300,
    tags: "Teologia, Corpo, João Paulo II"
  },
  {
    title: "Música e Espiritualidade",
    description: "Como a música pode elevar a alma e auxiliar na vida de oração e contemplação.",
    category_id: 5,
    thumbnail: "https://picsum.photos/seed/music/1920/1080",
    video_url: "",
    audio_url: "https://example.com/music.mp3",
    views: 1500,
    tags: "Música, Espiritualidade, Louvor"
  },
  {
    title: "A Vida de Oração - Introdução",
    description: "FIAT a jornada será uma serie de varios videos lendo a biblia toda em um ano. Nesta aula bônus, aprendemos a rezar com a Palavra.",
    category_id: 1,
    thumbnail: "https://picsum.photos/seed/prayer/1920/1080",
    video_url: "https://www.youtube.com/watch?v=example8",
    audio_url: "",
    views: 4200,
    tags: "Oração, Bíblia, Formação"
  },
  {
    title: "Doutrina Social da Igreja",
    description: "O que a Igreja ensina sobre justiça social, economia e o bem comum na sociedade moderna.",
    category_id: 2,
    thumbnail: "https://picsum.photos/seed/social/1920/1080",
    video_url: "https://www.youtube.com/watch?v=example9",
    audio_url: "",
    views: 1100,
    tags: "Doutrina Social, Justiça, Sociedade"
  },
  {
    title: "Espiritualidade Carmelita",
    description: "Os ensinamentos de Santa Teresa d'Ávila e São João da Cruz sobre o caminho da perfeição.",
    category_id: 3,
    thumbnail: "https://picsum.photos/seed/carmel/1920/1080",
    video_url: "https://www.youtube.com/watch?v=example10",
    audio_url: "",
    views: 2800,
    tags: "Carmelo, Espiritualidade, Santos"
  },
  {
    title: "Vocação e Discernimento",
    description: "Como escutar a voz de Deus e discernir o chamado para a vida religiosa, sacerdotal ou matrimonial.",
    category_id: 4,
    thumbnail: "https://picsum.photos/seed/vocation/1920/1080",
    video_url: "https://www.youtube.com/watch?v=example11",
    audio_url: "",
    views: 3100,
    tags: "Vocação, Discernimento, Chamado"
  },
  {
    title: "Entrevista: Vida Missionária",
    description: "Relatos emocionantes de missionários que dedicam suas vidas ao anúncio do Evangelho em terras distantes.",
    category_id: 5,
    thumbnail: "https://picsum.photos/seed/mission/1920/1080",
    video_url: "",
    audio_url: "https://example.com/mission.mp3",
    views: 1400,
    tags: "Missão, Evangelização, Testemunho"
  },
  {
    title: "Os Sacramentos",
    description: "Uma série detalhada sobre os sete sinais visíveis da graça invisível instituídos por Cristo.",
    category_id: 2,
    thumbnail: "https://picsum.photos/seed/sacraments/1920/1080",
    video_url: "https://www.youtube.com/watch?v=example12",
    audio_url: "",
    views: 5200,
    tags: "Sacramentos, Graça, Igreja"
  }
];

const insertContent = db.prepare(`
  INSERT INTO content (title, description, category_id, thumbnail, video_url, audio_url, views, tags)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

seedContent.forEach(c => {
  const exists = db.prepare("SELECT id FROM content WHERE title = ?").get(c.title);
  if (!exists) {
    insertContent.run(c.title, c.description, c.category_id, c.thumbnail, c.video_url, c.audio_url, (c as any).views || 0, (c as any).tags || "");
  }
});

// Seed Admin User
const adminEmail = "admin@fiat.com";
const adminExists = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail);
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run("Admin FIAT", adminEmail, hashedPassword, "admin");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    next();
  };

  // --- API Routes ---

  // Auth
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").run(name, email, hashedPassword);
      res.status(201).json({ id: result.lastInsertRowid });
    } catch (error) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Categories
  app.get("/api/categories", (req, res) => {
    const rows = db.prepare("SELECT * FROM categories").all();
    res.json(rows);
  });

  // Content
  app.get("/api/content", (req, res) => {
    const { category_id } = req.query;
    let query = "SELECT c.*, cat.name as category_name FROM content c JOIN categories cat ON c.category_id = cat.id WHERE c.is_active = 1";
    const params: any[] = [];

    if (category_id) {
      query += " AND c.category_id = ?";
      params.push(category_id);
    }

    query += " ORDER BY c.published_at DESC";
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  });

  app.get("/api/content/:id", (req, res) => {
    const row = db.prepare("SELECT c.*, cat.name as category_name FROM content c JOIN categories cat ON c.category_id = cat.id WHERE c.id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Content not found" });
    res.json(row);
  });

  // Admin Content Management
  app.post("/api/admin/content", authenticateToken, isAdmin, (req, res) => {
    const { title, description, category_id, thumbnail, video_url, audio_url, views, tags } = req.body;
    const result = db.prepare(`
      INSERT INTO content (title, description, category_id, thumbnail, video_url, audio_url, views, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, category_id, thumbnail, video_url, audio_url, views || 0, tags || "");
    res.status(201).json({ id: result.lastInsertRowid });
  });

  app.put("/api/admin/content/:id", authenticateToken, isAdmin, (req, res) => {
    const { title, description, category_id, thumbnail, video_url, audio_url, is_active, views, tags } = req.body;
    db.prepare(`
      UPDATE content SET title = ?, description = ?, category_id = ?, thumbnail = ?, video_url = ?, audio_url = ?, is_active = ?, views = ?, tags = ?
      WHERE id = ?
    `).run(title, description, category_id, thumbnail, video_url, audio_url, is_active, views || 0, tags || "", req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/content/:id", authenticateToken, isAdmin, (req, res) => {
    db.prepare("DELETE FROM content WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // User Interactions
  app.get("/api/user/favorites", authenticateToken, (req: any, res) => {
    const rows = db.prepare(`
      SELECT c.* FROM content c
      JOIN favorites f ON c.id = f.content_id
      WHERE f.user_id = ?
    `).all(req.user.id);
    res.json(rows);
  });

  app.post("/api/user/favorites/:content_id", authenticateToken, (req: any, res) => {
    try {
      db.prepare("INSERT INTO favorites (user_id, content_id) VALUES (?, ?)").run(req.user.id, req.params.content_id);
      res.status(201).json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Already in favorites" });
    }
  });

  app.delete("/api/user/favorites/:content_id", authenticateToken, (req: any, res) => {
    db.prepare("DELETE FROM favorites WHERE user_id = ? AND content_id = ?").run(req.user.id, req.params.content_id);
    res.json({ success: true });
  });

  app.get("/api/user/history", authenticateToken, (req: any, res) => {
    const rows = db.prepare(`
      SELECT c.*, h.progress, h.updated_at FROM content c
      JOIN history h ON c.id = h.content_id
      WHERE h.user_id = ?
      ORDER BY h.updated_at DESC
    `).all(req.user.id);
    res.json(rows);
  });

  app.post("/api/user/history", authenticateToken, (req: any, res) => {
    const { content_id, progress } = req.body;
    const existing = db.prepare("SELECT id FROM history WHERE user_id = ? AND content_id = ?").get(req.user.id, content_id) as any;
    
    if (existing) {
      db.prepare("UPDATE history SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(progress, existing.id);
    } else {
      db.prepare("INSERT INTO history (user_id, content_id, progress) VALUES (?, ?, ?)").run(req.user.id, content_id, progress);
    }
    res.json({ success: true });
  });

  // Admin Dashboard Metrics
  app.get("/api/admin/metrics", authenticateToken, isAdmin, (req, res) => {
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
    const totalContent = db.prepare("SELECT COUNT(*) as count FROM content").get() as any;
    const totalFavorites = db.prepare("SELECT COUNT(*) as count FROM favorites").get() as any;
    res.json({
      users: totalUsers.count,
      content: totalContent.count,
      favorites: totalFavorites.count
    });
  });

  // Daily Verse using Gemini
  app.get("/api/daily-verse", async (req, res) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: "Forneça um versículo bíblico católico inspirador para hoje, com uma breve reflexão de 2 frases. Formato JSON: { \"verse\": \"...\", \"reference\": \"...\", \"reflection\": \"...\" }"
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (error) {
      res.json({ 
        verse: "O Senhor é meu pastor, nada me faltará.", 
        reference: "Salmo 23, 1", 
        reflection: "Confie na providência divina hoje. Deus guia seus passos com amor e misericórdia." 
      });
    }
  });

  // Mercado Pago Payment
  app.post("/api/payment/create-preference", authenticateToken, async (req, res) => {
    const { planType } = req.body;
    const client = getMPClient();
    if (!client) {
      return res.status(500).json({ error: "Mercado Pago não configurado" });
    }

    const plans = {
      monthly: {
        id: 'fiat-monthly',
        title: 'Assinatura FIAT Mensal',
        price: 29.90
      },
      yearly: {
        id: 'fiat-yearly',
        title: 'Assinatura FIAT Anual',
        price: 299.00
      }
    };

    const selectedPlan = plans[planType as keyof typeof plans] || plans.monthly;

    try {
      const preference = new Preference(client);
      const result = await preference.create({
        body: {
          items: [
            {
              id: selectedPlan.id,
              title: selectedPlan.title,
              quantity: 1,
              unit_price: selectedPlan.price,
              currency_id: 'BRL'
            }
          ],
          back_urls: {
            success: `${process.env.APP_URL || 'http://localhost:3000'}?payment=success`,
            failure: `${process.env.APP_URL || 'http://localhost:3000'}?payment=failure`,
            pending: `${process.env.APP_URL || 'http://localhost:3000'}?payment=pending`,
          },
          auto_return: 'approved',
        }
      });

      res.json({ init_point: result.init_point });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao criar preferência de pagamento" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
