import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Dữ liệu users mẫu
let users = [
  { id: 1, name: 'Nguyen Van A', email: 'a@example.com' },
  { id: 2, name: 'Tran Thi B', email: 'b@example.com' }
];
let nextId = 3;

// API kiểm tra server
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// API lấy danh sách
app.get('/api/users', (req, res) => res.json(users));

// API thêm user
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Thiếu thông tin' });
  const newUser = { id: nextId++, name, email };
  users.push(newUser);
  res.status(201).json(newUser);
});

// API sửa user
app.put('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (user) Object.assign(user, req.body);
  res.json(user);
});

// API xóa user
app.delete('/api/users/:id', (req, res) => {
  users = users.filter(u => u.id !== Number(req.params.id));
  res.status(204).send();
});

// Chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
