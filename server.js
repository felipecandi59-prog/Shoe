require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: true } // Aiven exige SSL
});

// ==========================
// Rotas da API
// ==========================

// 1️⃣ Buscar todos os produtos
app.get('/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// 2️⃣ Buscar usuários
app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// 3️⃣ Buscar histórico de compras
app.get('/purchases', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM purchases');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar compras' });
  }
});

// 4️⃣ Registrar usuário
app.post('/users', async (req, res) => {
  const { name, email, password, isAdmin } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, isAdmin, active) VALUES (?, ?, ?, ?, true)',
      [name, email, password, isAdmin || false]
    );
    res.json({ id: result.insertId, name, email, isAdmin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// 5️⃣ Atualizar estoque de produto
app.patch('/products/:id/stock', async (req, res) => {
  const productId = req.params.id;
  const { stockBySize } = req.body;
  try {
    await pool.query(
      'UPDATE products SET stockBySize = ? WHERE id = ?',
      [JSON.stringify(stockBySize), productId]
    );
    res.json({ message: 'Estoque atualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar estoque' });
  }
});

// 6️⃣ Registrar compra
app.post('/purchases', async (req, res) => {
  const { userEmail, items, total, paymentMethod } = req.body;
  try {
    await pool.query(
      'INSERT INTO purchases (userEmail, items, total, paymentMethod, date) VALUES (?, ?, ?, ?, NOW())',
      [userEmail, JSON.stringify(items), total, paymentMethod]
    );
    res.json({ message: 'Compra registrada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar compra' });
  }
});

// ==========================
// Start server
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
