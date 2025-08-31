import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Простое in-memory хранилище для демонстрации
// В реальном приложении здесь можно подключить к реальной базе данных
let users: any[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'user' }
];

// API endpoints
app.get('/users', async (req, res) => {
  try {
    res.json({
      total_rows: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/users/count', async (req, res) => {
  try {
    res.json({ count: users.length });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const user = users.find(u => u.id === req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/users', async (req, res) => {
  try {
    const newUser = { ...req.body, id: Date.now().toString() };
    users.push(newUser);
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    const index = users.findIndex(u => u.id === req.params.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...req.body };
      res.json(users[index]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    const index = users.findIndex(u => u.id === req.params.id);
    if (index !== -1) {
      const deletedUser = users.splice(index, 1)[0];
      res.json(deletedUser);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`HTTP сервер запущен на порту ${PORT}`);
  console.log(`API доступен по адресу: http://localhost:${PORT}`);
  console.log(`Количество пользователей в памяти: ${users.length}`);
});
