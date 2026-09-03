require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3068;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00',
});
(async function testMySQL() {
  try {
    const conn = await pool.getConnection();
    console.log('Connected to MySQL:', process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error('MySQL Connection Failed:', err.message);
    process.exit(1);
  }
})();

// ============================
// FILE UPLOAD SETUP (เลือกรูปจากเครื่อง)
// ============================
// โฟลเดอร์เก็บไฟล์รูปที่อัปโหลด (สร้างอัตโนมัติถ้ายังไม่มี)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// เปิดให้เข้าถึงไฟล์ในโฟลเดอร์ uploads ผ่าน URL ได้โดยตรง
// เช่น http://yourserver:3068/uploads/1699999999-123456789.jpg
app.use('/uploads', express.static(uploadDir));

// ตั้งค่า multer: ตั้งชื่อไฟล์ใหม่ไม่ให้ซ้ำกัน แต่คงนามสกุลเดิมไว้
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดไฟล์ไม่เกิน 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('ไฟล์ที่อัปโหลดต้องเป็นรูปภาพเท่านั้น'));
    }
    cb(null, true);
  },
});
// UPLOAD Image - รับไฟล์รูปจาก field ชื่อ "image" แล้วคืน URL กลับไป
app.post('/api/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload Error:', err.message);
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'ไม่พบไฟล์ที่อัปโหลด' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  });
});
// ============================
// AUTHENTICATION APIs
// ============================

// LOGIN
app.post('/api/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้/อีเมล และรหัสผ่าน' });
  }

  try {
    const searchVal = identifier.trim();
    const [rows] = await pool.query(
      'SELECT id, user_name, email, phone, user_password, role, user_img FROM users WHERE user_name = ? OR email = ?',
      [searchVal, searchVal]
    );

 if (rows.length === 0) {
      return res.status(401).json({ error: 'ไม่พบผู้ใช้งานนี้ในระบบ' });
    }

    const account = rows[0];
    const dbPassword = (account.user_password || '').trim();
    const inputPassword = password.trim();

    let isMatch = false;

    // 1. ตรวจสอบด้วย bcrypt
    try {
      isMatch = await bcrypt.compare(inputPassword, dbPassword);
    } catch (bcryptErr) {
      isMatch = false;    }
// 2. Fallback ตรวจสอบ Plaintext (แนะนำให้ลบออกเมื่อใช้ Production)
    if (!isMatch && inputPassword === dbPassword) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
    }

    const { user_password, ...safeUser } = account;

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user: safeUser,
    });
  } catch (e) {
    console.error('Login Error:', e.message);
    res.status(500).json({ error: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' });
  }
});

// REGISTER
app.post('/api/register', async (req, res) => {
  const { user_name, email, phone, password, user_img } = req.body;

  if (!user_name || !email || !password) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็น (ชื่อผู้ใช้, อีเมล, รหัสผ่าน)' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE user_name = ? OR email = ? LIMIT 1',
      [user_name.trim(), email.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว' });
    }
 const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);

    const [result] = await pool.query(
      'INSERT INTO users (user_name, email, phone, user_password, role, user_img) VALUES (?, ?, ?, ?, ?, ?)',
      [
        user_name.trim(),
        email.trim(),
        phone ? phone.trim() : null,
        hashedPassword,
        'user',
        user_img || null,
      ]
    );
 res.json({
      message: 'สมัครสมาชิกสำเร็จ',
      userId: result.insertId,
    });
  } catch (e) {
    console.error('Register Error:', e.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง' });
  }
});
// ============================
// PROFILE APIs
// ============================

// GET Profile
app.get('/api/profile/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, user_name, email, phone, role, user_img FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Fetch Profile Error:', e.message);
    res.status(500).json({ error: 'ดึงข้อมูลโปรไฟล์ไม่สำเร็จ' });
  }
});

// UPDATE Profile Info
app.put('/api/profile/:id', async (req, res) => {
  const { user_name, email, phone } = req.body;
  if (!user_name || !email) {
    return res.status(400).json({ error: 'ชื่อผู้ใช้และอีเมลห้ามว่างเปล่า' });
  }

  try {
    await pool.query(
      'UPDATE users SET user_name = ?, email = ?, phone = ? WHERE id = ?',
      [user_name.trim(), email.trim(), phone ? phone.trim() : null, req.params.id]
    );
    res.json({ message: 'บันทึกข้อมูลเรียบร้อยแล้ว' });
  } catch (e) {
    console.error('Update Profile Error:', e.message);
    res.status(500).json({ error: 'บันทึกไม่สำเร็จ ชื่อผู้ใช้หรืออีเมลอาจถูกใช้งานแล้ว' });
  }
});
// UPDATE Profile Image
app.put('/api/profile/:id/image', async (req, res) => {
  const { user_img } = req.body;
  try {
    await pool.query(
      'UPDATE users SET user_img = ? WHERE id = ?',
      [user_img || null, req.params.id]
    );
    res.json({ message: 'อัปเดตรูปโปรไฟล์สำเร็จ', user_img });
  } catch (e) {
    console.error('Update Image Error:', e.message);
    res.status(500).json({ error: 'ไม่สามารถอัปเดตรูปภาพได้' });
  }
});
// ============================
// BICYCLES APIs (ปรับเปลี่ยนตามตารางใหม่)
// ============================

// GET Bicycles (with Search & Filter)
app.get('/api/Inventory', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;
    let sql = 'SELECT * FROM bicycles WHERE 1=1';
    const params = [];

    if (search && search.trim() !== '') {
      sql += ' AND (bike_name LIKE ? OR brand LIKE ?)';
      const like = `%${search.trim()}%`;
      params.push(like, like);
    }

 if (category && category.trim() !== '') {
      sql += ' AND category LIKE ?';
      params.push(category.trim());
    }
    if (minPrice !== undefined && minPrice !== '') {
      sql += ' AND price >= ?';
      params.push(Number(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      sql += ' AND price <= ?';
      params.push(Number(maxPrice));
    }

    sql += ' ORDER BY id DESC';


    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('Products Error:', e.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});
// GET Distinct Categories
app.get('/api/Inventory/categories', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT category FROM bicycles WHERE category IS NOT NULL AND category <> "" ORDER BY category ASC'
    );
    res.json(rows.map((r) => r.category));
  } catch (e) {
    console.error('Categories Error:', e.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});
// POST Create Bike Item
app.post('/api/Inventory', async (req, res) => {
  const { bike_name, brand, price, stock_qty, category, image } = req.body;

  if (!bike_name) {
    return res.status(400).json({ error: 'bike_name is required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO bicycles (bike_name, brand, price, stock_qty, category, image) VALUES (?, ?, ?, ?, ?, ?)',
      [
        bike_name,
        brand || null,
        price || 0,
        stock_qty || 0,
        category || null,
        image || null,
      ]
 );
    res.json({ message: 'Product added successfully', id: result.insertId });
  } catch (e) {
    console.error('Add Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});
// DELETE Bike Item
app.delete('/api/Inventory/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM bicycles WHERE id=?', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (e) {
    console.error('Delete Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});
// ============================
// CART APIs (ตะกร้าสินค้า)
// ============================
// หมายเหตุ: ต้องสร้างตาราง cart_items ในฐานข้อมูลก่อนใช้งาน (ดูคำสั่ง SQL ท้ายไฟล์)

// GET Cart ของ user คนหนึ่ง (พร้อมข้อมูลสินค้า + ยอดรวม)
app.get('/api/cart/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT
         c.id AS cart_id,
         c.user_id,
         c.bicycle_id,
         c.quantity,
         b.bike_name,
         b.brand,
         b.price,
         b.image,
         b.stock_qty,
         (c.quantity * b.price) AS subtotal
       FROM cart_items c
       JOIN bicycles b ON b.id = c.bicycle_id
       WHERE c.user_id = ?
       ORDER BY c.id DESC`,
      [userId]
    );
 const total = rows.reduce((sum, item) => sum + Number(item.subtotal), 0);

    res.json({ items: rows, total });
  } catch (e) {
    console.error('Get Cart Error:', e.message);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลตะกร้าได้' });
  }
});
// POST เพิ่มสินค้าลงตะกร้า (ถ้ามีอยู่แล้วให้บวกจำนวนเพิ่ม)
app.post('/api/cart', async (req, res) => {
  const { user_id, bicycle_id, quantity } = req.body;
  const qty = Number(quantity) > 0 ? Number(quantity) : 1;

  if (!user_id || !bicycle_id) {
    return res.status(400).json({ error: 'ต้องระบุ user_id และ bicycle_id' });
  }

  try {
    // เช็คสต็อกสินค้าก่อน
    const [bikeRows] = await pool.query(
      'SELECT id, stock_qty FROM bicycles WHERE id = ?',
      [bicycle_id]
    );
    if (bikeRows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบสินค้านี้ในระบบ' });
    }
    if (bikeRows[0].stock_qty <= 0) {
      return res.status(400).json({ error: 'สินค้าหมดสต็อก' });
    }
 // ถ้ามีสินค้านี้อยู่ในตะกร้าแล้ว ให้บวกจำนวนเพิ่ม, ถ้ายังไม่มีให้เพิ่มแถวใหม่
    await pool.query(
      `INSERT INTO cart_items (user_id, bicycle_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [user_id, bicycle_id, qty]
    );

    res.json({ message: 'เพิ่มสินค้าลงตะกร้าเรียบร้อยแล้ว' });
  } catch (e) {
    console.error('Add To Cart Error:', e.message);
    res.status(500).json({ error: 'เพิ่มสินค้าลงตะกร้าไม่สำเร็จ' });
  }
});
// PUT แก้ไขจำนวนสินค้าในตะกร้า (ระบุจำนวนใหม่ตรง ๆ)
app.put('/api/cart/:cartId', async (req, res) => {
  const { cartId } = req.params;

  
  const { quantity } = req.body;
  const qty = Number(quantity);

  if (!qty || qty <= 0) {
    return res.status(400).json({ error: 'จำนวนสินค้าต้องมากกว่า 0' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [qty, cartId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'ไม่พบรายการนี้ในตะกร้า' });
    }
    res.json({ message: 'อัปเดตจำนวนสินค้าเรียบร้อยแล้ว' });
  } catch (e) {
    console.error('Update Cart Error:', e.message);
    res.status(500).json({ error: 'อัปเดตตะกร้าไม่สำเร็จ' });
  }
});

// DELETE ลบสินค้าออกจากตะกร้าทีละรายการ
app.delete('/api/cart/:cartId', async (req, res) => {
  const { cartId } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM cart_items WHERE id = ?', [cartId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'ไม่พบรายการนี้ในตะกร้า' });
    }
    res.json({ message: 'ลบสินค้าออกจากตะกร้าเรียบร้อยแล้ว' });
  } catch (e) {
    console.error('Delete Cart Item Error:', e.message);
    res.status(500).json({ error: 'ลบสินค้าออกจากตะกร้าไม่สำเร็จ' });
  }
});
// DELETE ล้างตะกร้าทั้งหมดของ user (ใช้ตอนกด Checkout สำเร็จ)
app.delete('/api/cart/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    res.json({ message: 'ล้างตะกร้าเรียบร้อยแล้ว' });
  } catch (e) {
    console.error('Clear Cart Error:', e.message);
    res.status(500).json({ error: 'ล้างตะกร้าไม่สำเร็จ' });
  }
});
// ============================
// ORDERS APIs (บันทึกข้อมูลการชำระเงิน)
// ============================

app.post('/api/orders', async (req, res) => {
  // 1. ดึง shipping_address เพิ่มจาก req.body
  const { user_id, total_amount, slip_url, shipping_address } = req.body;

  // 2. ตรวจสอบข้อมูลเบื้องต้น (เช็ก shipping_address เพิ่มด้วย)
  if (!user_id || !total_amount || !slip_url || !shipping_address) {
    return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน (ต้องการ user_id, total_amount, slip_url, shipping_address)' });
  }

  try {
    // 3. บันทึกลงตาราง orders เพิ่มคอลัมน์ shipping_address
    const sql = `INSERT INTO orders (user_id, total_amount, slip_url, status, shipping_address) VALUES (?, ?, ?, 'pending', ?)`;
    await pool.query(sql, [user_id, total_amount, slip_url, shipping_address]);

    // 4. (Optional) ล้างตะกร้าสินค้าของ user หลังสั่งซื้อสำเร็จ
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [user_id]);

    return res.status(201).json({ message: 'บันทึกคำสั่งซื้อเรียบร้อยแล้ว' });

  } catch (error) {
    console.error('Order Insert Error:', error.message);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลลง Database' });
  }
});
// GET Orders (สำหรับหน้า Admin) - แสดงคำสั่งซื้อทั้งหมด กรองตามสถานะได้ (pending/approved/rejected/all)
app.get('/api/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT
        o.id,
        o.user_id,
        o.total_amount,
        o.slip_url,
        o.status,
        o.created_at,
        o.shipping_address,
        u.user_name,
        u.email,
        u.phone
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status.trim() !== '' && status.trim().toLowerCase() !== 'all') {
      sql += ' AND o.status = ?';
      params.push(status.trim());
    }

    sql += ' ORDER BY o.created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('Get Orders Error:', e.message);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลคำสั่งซื้อได้' });
  }
});
// PUT Update Order Status (Approve / Reject จากฝั่ง Admin)
app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowedStatus = ['pending', 'approved', 'rejected'];

  if (!status || !allowedStatus.includes(status)) {
    return res.status(400).json({ error: 'สถานะไม่ถูกต้อง (ต้องเป็น pending, approved หรือ rejected)' });
  }

  try {
    const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อนี้ในระบบ' });
    }
    res.json({ message: 'อัปเดตสถานะคำสั่งซื้อเรียบร้อยแล้ว', status });
  } catch (e) {
    console.error('Update Order Status Error:', e.message);
    res.status(500).json({ error: 'อัปเดตสถานะไม่สำเร็จ' });
  }
});

// ============================
// SERVER START
// ============================
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

