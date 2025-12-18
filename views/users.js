class UsersView {
    constructor(api, storage) {
        this.api = api;
        this.storage = storage;
    }
    
    async render(params = {}, searchQuery = '') {
        const users = await this.storage.getCombinedUsers();
        let filteredUsers = users;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredUsers = users.filter(user => 
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                (user.username && user.username.toLowerCase().includes(query))
            );
        }
        
        return `
            <h2>Пользователи (${filteredUsers.length})</h2>
            ${filteredUsers.length === 0 
                ? '<div class="message message-info">Пользователи не найдены</div>' 
                : this.renderUsersGrid(filteredUsers)
            }
        `;
    }
    
    renderUsersGrid(users) {
        let html = '<div class="cards-grid">';
        
        users.forEach(user => {
            const isCustom = user.id > 100; 
            
            html += `
                <div class="card" data-user-id="${user.id}">
                    <div class="card-header">
                        <h3>${user.name}</h3>
                        ${isCustom ? '<span style="font-size: 0.8rem; color: #f39c12;">(Локальный)</span>' : ''}
                    </div>
                    <div class="card-body">
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Телефон:</strong> ${user.phone || 'Не указан'}</p>
                        <p><strong>Город:</strong> ${user.address?.city || 'Не указан'}</p>
                        <p><strong>Компания:</strong> ${user.company?.name || 'Не указана'}</p>
                    </div>
                    <div class="card-footer">
                        <a href="#users#${user.id}#todos" class="btn btn-primary" data-route>
                            <i class="fas fa-tasks"></i> Todo
                        </a>
                        <a href="#users#${user.id}#posts" class="btn btn-primary" data-route>
                            <i class="fas fa-newspaper"></i> Посты
                        </a>
                        ${isCustom ? `
                            <button class="btn btn-danger delete-user-btn" data-user-id="${user.id}">
                                <i class="fas fa-trash"></i> Удалить
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    bindEvents() {
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = parseInt(e.target.closest('.delete-user-btn').dataset.userId);
                this.deleteUser(userId);
            });
        });
    }
    
    deleteUser(userId) {
        if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
            this.storage.deleteCustomUser(userId);
            window.app.handleRouteChange(window.app.router.getCurrentRoute());
            this.showMessage('Пользователь успешно удален', 'success');
        }
    }
    
    showAddUserModal() {
        const modalContent = `
            <form id="add-user-form">
                <div class="form-group">
                    <label for="user-name" class="form-label">Имя *</label>
                    <input type="text" id="user-name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="user-email" class="form-label">Email *</label>
                    <input type="email" id="user-email" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="user-phone" class="form-label">Телефон</label>
                    <input type="tel" id="user-phone" class="form-control">
                </div>
                <div class="form-group">
                    <label for="user-city" class="form-label">Город</label>
                    <input type="text" id="user-city" class="form-control">
                </div>
                <div class="form-group">
                    <label for="user-company" class="form-label">Компания</label>
                    <input type="text" id="user-company" class="form-control">
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        <i class="fas fa-save"></i> Сохранить
                    </button>
                </div>
            </form>
        `;
        
        window.app.openModal('Добавить пользователя', modalContent);
        document.getElementById('add-user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userData = {
                name: document.getElementById('user-name').value,
                email: document.getElementById('user-email').value,
                phone: document.getElementById('user-phone').value || '',
                address: {
                    city: document.getElementById('user-city').value || ''
                },
                company: {
                    name: document.getElementById('user-company').value || ''
                }
            };
            
            try {
                const newUser = await this.api.createUser(userData);
                this.storage.addCustomUser(newUser);
                
                window.app.closeModal();
                window.app.handleRouteChange(window.app.router.getCurrentRoute());
                
                this.showMessage('Пользователь успешно добавлен', 'success');
            } catch (error) {
                this.showMessage('Ошибка при добавлении пользователя', 'error');
            }
        });
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

export default UsersView;