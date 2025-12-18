class TodosView {
    constructor(api, storage) {
        this.api = api;
        this.storage = storage;
    }
    
    async render(params = {}, searchQuery = '') {
        const userId = params.userId;
        const todos = await this.storage.getCombinedTodos(userId);
        let filteredTodos = todos;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredTodos = todos.filter(todo => 
                todo.title.toLowerCase().includes(query)
            );
        }
        
        const user = userId ? await this.getUserInfo(userId) : null;
        const userInfo = user ? ` для ${user.name}` : '';
        
        return `
            <h2>Todo${userInfo} (${filteredTodos.length})</h2>
            ${userId ? `
                <div class="actions-bar" style="margin-bottom: 1rem;">
                    <button class="btn btn-primary" id="add-todo-btn">
                        <i class="fas fa-plus"></i> Добавить Todo
                    </button>
                </div>
            ` : ''}
            ${filteredTodos.length === 0 
                ? '<div class="message message-info">Todo не найдены</div>' 
                : this.renderTodosTable(filteredTodos)
            }
        `;
    }
    
    async getUserInfo(userId) {
        try {
            if (userId > 100) {
                const customUsers = this.storage.getCustomUsers();
                return customUsers.find(user => user.id === userId) || { name: 'Неизвестный пользователь' };
            } else {
                return await this.api.getUser(userId);
            }
        } catch (error) {
            return { name: 'Неизвестный пользователь' };
        }
    }
    
    renderTodosTable(todos) {
        let html = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Заголовок</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        todos.forEach(todo => {
            const isCustom = todo.id > 100;
            
            html += `
                <tr>
                    <td>${todo.id}</td>
                    <td>${todo.title}</td>
                    <td>
                        <span class="todo-status ${todo.completed ? 'todo-completed' : 'todo-pending'}">
                            ${todo.completed ? 'Завершено' : 'В процессе'}
                        </span>
                    </td>
                    <td>
                        ${isCustom ? `
                            <button class="btn btn-danger btn-sm delete-todo-btn" data-todo-id="${todo.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        return html;
    }
    
    bindEvents() {
        const addTodoBtn = document.getElementById('add-todo-btn');
        if (addTodoBtn) {
            addTodoBtn.addEventListener('click', () => {
                this.showAddTodoModal();
            });
        }
        document.querySelectorAll('.delete-todo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const todoId = parseInt(e.target.closest('.delete-todo-btn').dataset.todoId);
                this.deleteTodo(todoId);
            });
        });
    }
    
    showAddTodoModal() {
        const currentRoute = window.app.router.getCurrentRoute();
        const params = window.app.router.getRouteParams();
        const userId = params.userId;
        
        if (!userId) return;
        
        const modalContent = `
            <form id="add-todo-form">
                <div class="form-group">
                    <label for="todo-title" class="form-label">Заголовок *</label>
                    <input type="text" id="todo-title" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Статус</label>
                    <div>
                        <label style="display: inline-block; margin-right: 1rem;">
                            <input type="radio" name="todo-completed" value="false" checked> В процессе
                        </label>
                        <label style="display: inline-block;">
                            <input type="radio" name="todo-completed" value="true"> Завершено
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        <i class="fas fa-save"></i> Сохранить
                    </button>
                </div>
            </form>
        `;
        
        window.app.openModal('Добавить Todo', modalContent);
        document.getElementById('add-todo-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const todoData = {
                userId: userId,
                title: document.getElementById('todo-title').value,
                completed: document.querySelector('input[name="todo-completed"]:checked').value === 'true'
            };
            
            try {
                const newTodo = await this.api.createTodo(todoData);
                this.storage.addCustomTodo(newTodo);
                
                window.app.closeModal();
                window.app.handleRouteChange(currentRoute);
                
                this.showMessage('Todo успешно добавлен', 'success');
            } catch (error) {
                this.showMessage('Ошибка при добавлении todo', 'error');
            }
        });
    }
    
    deleteTodo(todoId) {
        if (confirm('Вы уверены, что хотите удалить этот todo?')) {
            const todos = this.storage.getCustomTodos();
            const filteredTodos = todos.filter(todo => todo.id !== todoId);
            this.storage.saveCustomTodos(filteredTodos);
            
            window.app.handleRouteChange(window.app.router.getCurrentRoute());
            this.showMessage('Todo успешно удален', 'success');
        }
    }
    
    showMessage(text, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = text;
        messageEl.style.position = 'fixed';
        messageEl.style.top = '20px';
        messageEl.style.right = '20px';
        messageEl.style.zIndex = '1001';
        messageEl.style.maxWidth = '300px';
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

export default TodosView;