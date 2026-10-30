import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 TỰ TẠO KEY TẠI ĐÂY (Định dạng LAT-XXX-XXX-XXX)
const SECRET_KEY = 'LAT-999-888-777'; // Bạn có thể đổi 3 cụm số tùy thích

// 🛡️ Hàm kiểm tra Key
const checkKey = (req, res, next) => {
  const clientKey = req.headers['x-api-key'];
  
  if (clientKey === SECRET_KEY) {
    next(); // Đúng key -> Cho phép
  } else {
    res.status(403).json({ error: 'Sai hoặc thiếu API Key! Không có quyền truy cập.' });
  }
};

let users = [
  { id: 1, name: 'Nguyen Van A', email: 'a@example.com' },
  { id: 2, name: 'Tran Thi B', email: 'b@example.com' }
];
let nextId = 3;

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// CÁC API BÊN DƯỚI BẮT BUỘC CÓ KEY
app.get('/api/users', checkKey, (req, res) => res.json(users));

app.post('/api/users', checkKey, (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Thiếu thông tin' });
  const newUser = { id: nextId++, name, email };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.put('/api/users/:id', checkKey, (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (user) Object.assign(user, req.body);
  res.json(user);
});

app.delete('/api/users/:id', checkKey, (req, res) => {
  users = users.filter(u => u.id !== Number(req.params.id));
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
