// 定义API的基础URL
const API_BASE_URL = 'http://localhost:8085/api';

console.log('Using API_BASE_URL:', API_BASE_URL);

// 获取DOM元素
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

// 获取所有待办事项
async function fetchTodos() {
    try {
        const response = await fetch(`${API_BASE_URL}/todos`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data);
        if (!Array.isArray(data)) {
            throw new Error('Fetched data is not an array');
        }
        renderTodos(data);
    } catch (error) {
        console.error('Error fetching todos:', error);
        todoList.innerHTML = '<li>Error loading todos. Please try again later.</li>';
    }
}

// 渲染待办事项列表
function renderTodos(todos) {
    todoList.innerHTML = '';
    if (todos.length === 0) {
        todoList.innerHTML = '<li>No todos yet. Add a new one!</li>';
        return;
    }
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="todo-item">
                <input type="checkbox" id="todo-${todo.id}" ${todo.completed ? 'checked' : ''}>
                <label for="todo-${todo.id}">${escapeHtml(todo.text)}</label>
            </div>
            <button class="delete-btn">Delete</button>
        `;
        const checkbox = li.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => toggleTodo(todo.id, checkbox.checked));
        
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
        
        todoList.appendChild(li);
    });
}

// 添加新的待办事项
async function addTodo(text) {
    try {
        const response = await fetch(`${API_BASE_URL}/todos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newTodo = await response.json();
        console.log('Added new todo:', newTodo);
        await fetchTodos();
    } catch (error) {
        console.error('Error adding todo:', error);
        alert('Failed to add todo. Please try again.');
    }
}

// 切换待办事项的完成状态
async function toggleTodo(id, completed) {
    try {
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Updated todo status:', id, completed);
        await fetchTodos(); // 重新获取所有待办事项以更新视图
    } catch (error) {
        console.error('Error updating todo:', error);
        alert('Failed to update todo. Please try again.');
        // 恢复复选框状态
        const checkbox = document.querySelector(`#todo-${id}`);
        if (checkbox) {
            checkbox.checked = !completed;
        }
    }
}

// 删除待办事项
async function deleteTodo(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Deleted todo:', id);
        await fetchTodos();
    } catch (error) {
        console.error('Error deleting todo:', error);
        alert('Failed to delete todo. Please try again.');
    }
}

// 监听表单提交事件
todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (text) {
        await addTodo(text);
        todoInput.value = '';
    }
});

// 转义HTML特殊字符以防止XSS攻击
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// 页面加载时获取所有待办事项
document.addEventListener('DOMContentLoaded', fetchTodos);