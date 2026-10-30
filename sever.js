import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

let users = [
  { id: 1, name: 'Nguyen Van A', email: 'a@example.com' },
  { id: 2, name: 'Tran Thi B', email: 'b@example.com' }
];
let nextId = 3;

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/users', (req, res) => res.json(users));

app.post('/api/users', (req, res) => {
  const newUser = { id: nextId++, ...req.body };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (user) Object.assign(user, req.body);
  res.json(user);
});

app.delete('/api/users/:id', (req, res) => {
  users = users.filter(u => u.id !== Number(req.params.id));
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
