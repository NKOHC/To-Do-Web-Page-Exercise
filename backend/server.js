const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');

// 加载环境变量
dotenv.config();

const app = express();
const port = process.env.PORT || 8085;

// CORS 配置
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS || 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// 中间件
app.use(cors(corsOptions));
app.use(express.json());

// 定义数据文件路径
const dataFile = path.join(__dirname, 'data', 'todos.json');

// 确保数据目录存在
async function ensureDataDirectory() {
  const dir = path.dirname(dataFile);
  try {
    await fs.access(dir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dir, { recursive: true });
    } else {
      throw error;
    }
  }
}

// 读取所有待办事项
async function getTodos() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(dataFile, 'utf8');
    const todos = JSON.parse(data);
    if (!Array.isArray(todos)) {
      console.warn('Stored data is not an array. Initializing with empty array.');
      return [];
    }
    return todos;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Data file not found. Initializing with empty array.');
      return [];
    }
    console.error('Error reading todos:', error);
    throw error;
  }
}

// 保存待办事项
async function saveTodos(todos) {
  try {
    await ensureDataDirectory();
    await fs.writeFile(dataFile, JSON.stringify(todos, null, 2));
  } catch (error) {
    console.error('Error saving todos:', error);
    throw error;
  }
}

// 路由
app.get('/', (req, res) => {
  res.send('Hello from the Todo List server!');
});

// 获取所有待办事项
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await getTodos();
    console.log('Fetched todos:', todos);
    res.json(todos);
  } catch (error) {
    console.error('Error in GET /api/todos:', error);
    res.status(500).json({ message: 'Error fetching todos', error: error.message });
  }
});

// 添加新的待办事项
app.post('/api/todos', async (req, res) => {
  try {
    if (!req.body.text || typeof req.body.text !== 'string') {
      return res.status(400).json({ message: 'Invalid todo text' });
    }
    const todos = await getTodos();
    const newTodo = { id: Date.now().toString(), text: req.body.text, completed: false };
    todos.push(newTodo);
    await saveTodos(todos);
    console.log('Added new todo:', newTodo);
    res.status(201).json(newTodo);
  } catch (error) {
    console.error('Error in POST /api/todos:', error);
    res.status(500).json({ message: 'Error adding todo', error: error.message });
  }
});

// 更新待办事项
app.put('/api/todos/:id', async (req, res) => {
  try {
    if (typeof req.body.completed !== 'boolean') {
      return res.status(400).json({ message: 'Invalid completed status' });
    }
    const todos = await getTodos();
    const todo = todos.find(t => t.id === req.params.id);
    if (todo) {
      todo.completed = req.body.completed;
      await saveTodos(todos);
      console.log('Updated todo:', todo);
      res.json(todo);
    } else {
      res.status(404).json({ message: 'Todo not found' });
    }
  } catch (error) {
    console.error('Error in PUT /api/todos/:id:', error);
    res.status(500).json({ message: 'Error updating todo', error: error.message });
  }
});

// 删除待办事项
app.delete('/api/todos/:id', async (req, res) => {
  try {
    let todos = await getTodos();
    const originalLength = todos.length;
    todos = todos.filter(t => t.id !== req.params.id);
    if (todos.length < originalLength) {
      await saveTodos(todos);
      console.log('Deleted todo with id:', req.params.id);
      res.status(204).end();
    } else {
      res.status(404).json({ message: 'Todo not found' });
    }
  } catch (error) {
    console.error('Error in DELETE /api/todos/:id:', error);
    res.status(500).json({ message: 'Error deleting todo', error: error.message });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

// 启动服务器
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`CORS is enabled for origin: ${corsOptions.origin}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('Received SIGINT. Closing server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});