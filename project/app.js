// Упрощенная версия приложения для быстрого старта
class App {
    constructor() {
        this.currentView = 'users';
        this.searchQuery = '';
        this.init();
    }
    
    init() {
        console.log('Приложение инициализировано');
        this.setupEventListeners();
        this.setupNavigation();
        this.loadInitialView();
        this.initializeSampleData(); // Добавляем тестовые данные
    }
    
    setupEventListeners() {
        // Навигация
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = link.getAttribute('href');
                this.navigate(route);
            });
        });
        
        // Поиск
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.updateContent();
        });
        
        searchBtn.addEventListener('click', () => {
            this.updateContent();
        });
        
        // Кнопка добавления пользователя
        document.getElementById('add-user-btn').addEventListener('click', () => {
            this.showAddUserModal();
        });
        
        // Закрытие модального окна
        document.getElementById('modal-close').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Закрытие модального окна по клику вне его
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.closeModal();
            }
        });
    }
    
    setupNavigation() {
        // Обработка hashchange
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });
        
        // Обработка начального hash
        this.handleHashChange();
    }
    
    handleHashChange() {
        const hash = window.location.hash || '#users';
        console.log('Hash изменился:', hash);
        
        // Обновляем активную ссылку
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === hash) {
                link.classList.add('active');
            }
        });
        
        // Обновляем хлебные крошки
        this.updateBreadcrumbs(hash);
        
        // Загружаем контент
        this.loadView(hash);
    }
    
    navigate(route) {
        console.log('Переход на:', route);
        window.location.hash = route;
    }
    
    updateBreadcrumbs(route) {
        const breadcrumbsEl = document.getElementById('breadcrumbs');
        const parts = route.split('#').filter(p => p);
        
        let html = '<ul class="breadcrumbs-list">';
        html += '<li class="breadcrumb-item"><a href="#users" class="breadcrumb-link" data-route>Главная</a><span class="breadcrumb-separator">/</span></li>';
        
        parts.forEach((part, index) => {
            const isLast = index === parts.length - 1;
            let name = part;
            
            // Преобразуем названия
            if (part === 'users') name = 'Пользователи';
            else if (part === 'todos') name = 'Задачи';
            else if (part === 'posts') name = 'Посты';
            else if (part === 'comments') name = 'Комментарии';
            else if (!isNaN(part)) {
                // Если это число, определяем что это
                if (index === 1) name = `Пользователь ${part}`;
                else if (index === 2 && parts[1] === 'posts') name = `Пост ${part}`;
                else name = `ID: ${part}`;
            }
            
            const path = '#' + parts.slice(0, index + 1).join('#');
            
            html += `
                <li class="breadcrumb-item">
                    ${isLast 
                        ? `<span class="breadcrumb-current">${name}</span>`
                        : `<a href="${path}" class="breadcrumb-link" data-route>${name}</a><span class="breadcrumb-separator">/</span>`
                    }
                </li>
            `;
        });
        
        html += '</ul>';
        breadcrumbsEl.innerHTML = html;
        
        // Добавляем обработчики на ссылки в крошках
        breadcrumbsEl.querySelectorAll('a[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(link.getAttribute('href'));
            });
        });
    }
    
    async loadView(route) {
        console.log('Загружаем view для маршрута:', route);
        const contentEl = document.getElementById('content');
        
        // Показываем загрузку
        contentEl.innerHTML = '<div class="message message-info">Загрузка...</div>';
        
        try {
            let html = '';
            
            if (route === '#users' || route === '' || route === '#') {
                html = await this.loadUsersView();
            } else if (route.includes('#todos')) {
                html = await this.loadTodosView(route);
            } else if (route.includes('#posts')) {
                if (route.includes('#comments')) {
                    html = await this.loadCommentsView(route);
                } else {
                    html = await this.loadPostsView(route);
                }
            } else if (route.startsWith('#users#')) {
                // Если просто user/id без указания что дальше
                const parts = route.split('#').filter(p => p);
                if (parts.length === 2 && !isNaN(parts[1])) {
                    html = await this.loadUserDetailsView(parseInt(parts[1]));
                } else {
                    html = await this.loadUsersView();
                }
            } else {
                html = await this.loadUsersView();
            }
            
            contentEl.innerHTML = html;
            this.bindViewEvents(route);
        } catch (error) {
            console.error('Ошибка при загрузке view:', error);
            contentEl.innerHTML = `
                <div class="message message-error">
                    Ошибка при загрузке данных: ${error.message}
                    <br>
                    <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
                        Обновить страницу
                    </button>
                </div>
            `;
        }
    }
    
    async loadUsersView() {
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/users');
            const users = await response.json();
            
            // Добавляем локальных пользователей
            const localUsers = this.getLocalUsers();
            const allUsers = [...localUsers, ...users];
            
            // Фильтрация по поиску
            let filteredUsers = allUsers;
            if (this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase();
                filteredUsers = allUsers.filter(user => 
                    user.name.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query) ||
                    (user.username && user.username.toLowerCase().includes(query))
                );
            }
            
            return `
                <h2>Пользователи (${filteredUsers.length})</h2>
                ${filteredUsers.length === 0 ? 
                    '<div class="message message-info">Пользователи не найдены. Попробуйте изменить запрос поиска.</div>' : 
                    this.renderUsersCards(filteredUsers)
                }
            `;
        } catch (error) {
            console.error('Ошибка при загрузке пользователей:', error);
            return `
                <div class="message message-error">
                    <h3>Ошибка загрузки</h3>
                    <p>Не удалось загрузить пользователей. Проверьте подключение к интернету.</p>
                    <p>Показываем только локальных пользователей...</p>
                </div>
                ${this.renderUsersCards(this.getLocalUsers())}
            `;
        }
    }
    
    renderUsersCards(users) {
        if (users.length === 0) {
            return '<div class="message message-info">Нет пользователей для отображения</div>';
        }
        
        let html = '<div class="cards-grid">';
        
        users.forEach(user => {
            const isCustom = user.id > 10; // Простая проверка на кастомного пользователя
            
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
                            <i class="fas fa-tasks"></i> Задачи
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
    
    async loadUserDetailsView(userId) {
        try {
            const response = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
            const user = await response.json();
            
            return `
                <div class="user-details">
                    <div class="card">
                        <div class="card-header">
                            <h2>${user.name}</h2>
                        </div>
                        <div class="card-body">
                            <div class="user-info-grid">
                                <div>
                                    <h4>Контактная информация</h4>
                                    <p><strong>Email:</strong> ${user.email}</p>
                                    <p><strong>Телефон:</strong> ${user.phone}</p>
                                    <p><strong>Веб-сайт:</strong> ${user.website}</p>
                                </div>
                                <div>
                                    <h4>Адрес</h4>
                                    <p><strong>Улица:</strong> ${user.address.street}</p>
                                    <p><strong>Квартира:</strong> ${user.address.suite}</p>
                                    <p><strong>Город:</strong> ${user.address.city}</p>
                                    <p><strong>Индекс:</strong> ${user.address.zipcode}</p>
                                </div>
                                <div>
                                    <h4>Компания</h4>
                                    <p><strong>Название:</strong> ${user.company.name}</p>
                                    <p><strong>Слоган:</strong> ${user.company.catchPhrase}</p>
                                    <p><strong>Направление:</strong> ${user.company.bs}</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <a href="#users#${user.id}#todos" class="btn btn-primary" data-route>
                                <i class="fas fa-tasks"></i> Задачи пользователя
                            </a>
                            <a href="#users#${user.id}#posts" class="btn btn-primary" data-route>
                                <i class="fas fa-newspaper"></i> Посты пользователя
                            </a>
                            <a href="#users" class="btn btn-secondary" data-route>
                                <i class="fas fa-arrow-left"></i> Назад к списку
                            </a>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            return `
                <div class="message message-error">
                    <h3>Пользователь не найден</h3>
                    <p>Не удалось загрузить информацию о пользователе с ID: ${userId}</p>
                    <a href="#users" class="btn btn-primary" data-route>Вернуться к списку пользователей</a>
                </div>
            `;
        }
    }
    
    async loadTodosView(route) {
        const parts = route.split('#').filter(p => p);
        const userId = parts[1] ? parseInt(parts[1]) : null;
        
        try {
            let url = 'https://jsonplaceholder.typicode.com/todos';
            if (userId) url += `?userId=${userId}`;
            
            const response = await fetch(url);
            let todos = await response.json();
            
            // Добавляем локальные todo
            const localTodos = this.getLocalTodos();
            if (userId) {
                const userLocalTodos = localTodos.filter(todo => todo.userId === userId);
                todos = [...userLocalTodos, ...todos];
            } else {
                todos = [...localTodos, ...todos];
            }
            
            // Фильтрация по поиску
            let filteredTodos = todos;
            if (this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase();
                filteredTodos = todos.filter(todo => 
                    todo.title.toLowerCase().includes(query)
                );
            }
            
            // Получаем информацию о пользователе
            let userInfo = '';
            if (userId) {
                try {
                    const userResponse = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
                    const user = await userResponse.json();
                    userInfo = ` пользователя ${user.name}`;
                } catch (error) {
                    userInfo = ` пользователя ${userId}`;
                }
            }
            
            return `
                <h2>Задачи${userInfo} (${filteredTodos.length})</h2>
                ${userId ? `
                    <div class="actions-bar" style="margin-bottom: 1rem;">
                        <button class="btn btn-primary" id="add-todo-btn">
                            <i class="fas fa-plus"></i> Добавить задачу
                        </button>
                    </div>
                ` : ''}
                ${filteredTodos.length === 0 ? 
                    '<div class="message message-info">Задачи не найдены. Попробуйте изменить запрос поиска.</div>' : 
                    this.renderTodosTable(filteredTodos)
                }
            `;
        } catch (error) {
            console.error('Ошибка при загрузке задач:', error);
            return `
                <div class="message message-error">
                    <h3>Ошибка загрузки</h3>
                    <p>Не удалось загрузить задачи. Показываем только локальные задачи...</p>
                </div>
                ${this.renderTodosTable(this.getLocalTodos().filter(todo => userId ? todo.userId === userId : true))}
            `;
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
            const isCustom = todo.id > 200;
            
            html += `
                <tr>
                    <td>${todo.id}</td>
                    <td>${todo.title}</td>
                    <td>
                        <span class="todo-status ${todo.completed ? 'todo-completed' : 'todo-pending'}">
                            ${todo.completed ? '✅ Завершено' : '🔄 В процессе'}
                        </span>
                    </td>
                    <td>
                        ${isCustom ? `
                            <button class="btn btn-danger btn-sm delete-todo-btn" data-todo-id="${todo.id}">
                                <i class="fas fa-trash"></i> Удалить
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
    
    async loadPostsView(route) {
        const parts = route.split('#').filter(p => p);
        const userId = parts[1] ? parseInt(parts[1]) : null;
        
        try {
            let url = 'https://jsonplaceholder.typicode.com/posts';
            if (userId) url += `?userId=${userId}`;
            
            const response = await fetch(url);
            const posts = await response.json();
            
            // Фильтрация по поиску
            let filteredPosts = posts;
            if (this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase();
                filteredPosts = posts.filter(post => 
                    post.title.toLowerCase().includes(query) ||
                    post.body.toLowerCase().includes(query)
                );
            }
            
            // Получаем информацию о пользователе
            let userInfo = '';
            if (userId) {
                try {
                    const userResponse = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
                    const user = await userResponse.json();
                    userInfo = ` пользователя ${user.name}`;
                } catch (error) {
                    userInfo = ` пользователя ${userId}`;
                }
            }
            
            return `
                <h2>Посты${userInfo} (${filteredPosts.length})</h2>
                ${filteredPosts.length === 0 ? 
                    '<div class="message message-info">Посты не найдены. Попробуйте изменить запрос поиска.</div>' : 
                    this.renderPostsCards(filteredPosts)
                }
            `;
        } catch (error) {
            console.error('Ошибка при загрузке постов:', error);
            return `
                <div class="message message-error">
                    <h3>Ошибка загрузки</h3>
                    <p>Не удалось загрузить посты.</p>
                </div>
            `;
        }
    }
    
    renderPostsCards(posts) {
        let html = '<div class="cards-grid">';
        
        posts.forEach(post => {
            html += `
                <div class="card" data-post-id="${post.id}">
                    <div class="card-header">
                        <h3>${post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title}</h3>
                        <small>ID: ${post.id} | Пользователь: ${post.userId}</small>
                    </div>
                    <div class="card-body">
                        <p>${post.body.length > 150 ? post.body.substring(0, 150) + '...' : post.body}</p>
                    </div>
                    <div class="card-footer">
                        <a href="#users#${post.userId}#posts#${post.id}#comments" 
                           class="btn btn-primary" data-route>
                            <i class="fas fa-comments"></i> Комментарии
                        </a>
                        <button class="btn btn-secondary view-post-btn" data-post-id="${post.id}">
                            <i class="fas fa-eye"></i> Подробнее
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    async loadCommentsView(route) {
    const parts = route.split('#').filter(p => p);
    const postId = parts[2] ? parseInt(parts[2]) : null;
    
    try {
        // Если нет postId - показываем общий список комментариев
        if (!postId) {
            // Загружаем все комментарии для общего раздела
            const response = await fetch('https://jsonplaceholder.typicode.com/comments');
            let allComments = await response.json();
            
            // Добавляем локальные комментарии
            const localComments = this.getLocalComments();
            allComments = [...localComments, ...allComments];
            
            // Фильтрация по поиску
            let filteredComments = allComments;
            if (this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase();
                filteredComments = allComments.filter(comment => 
                    comment.name.toLowerCase().includes(query) ||
                    comment.body.toLowerCase().includes(query) ||
                    comment.email.toLowerCase().includes(query)
                );
            }
            
            // Сортируем по ID поста для группировки
            filteredComments.sort((a, b) => a.postId - b.postId);
            
            // Группируем комментарии по постам
            const commentsByPost = {};
            filteredComments.forEach(comment => {
                if (!commentsByPost[comment.postId]) {
                    commentsByPost[comment.postId] = {
                        postId: comment.postId,
                        comments: []
                    };
                }
                commentsByPost[comment.postId].comments.push(comment);
            });
            
            return `
                <h2>Все комментарии (${filteredComments.length})</h2>
                ${filteredComments.length === 0 ? 
                    '<div class="message message-info">Комментарии не найдены. Попробуйте изменить запрос поиска.</div>' : 
                    this.renderAllCommentsList(Object.values(commentsByPost))
                }
            `;
        }
        
        // Если есть postId - показываем комментарии конкретного поста
        // Сначала загружаем пост, чтобы получить заголовок
        const postResponse = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`);
        const post = await postResponse.json();
        
        // Загружаем комментарии с API
        const commentsResponse = await fetch(`https://jsonplaceholder.typicode.com/comments?postId=${postId}`);
        let apiComments = await commentsResponse.json();
        
        // Добавляем локальные комментарии
        const localComments = this.getLocalComments();
        const postLocalComments = localComments.filter(comment => comment.postId === postId);
        let allComments = [...postLocalComments, ...apiComments];
        
        // Фильтрация по поиску
        let filteredComments = allComments;
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filteredComments = allComments.filter(comment => 
                comment.name.toLowerCase().includes(query) ||
                comment.body.toLowerCase().includes(query) ||
                comment.email.toLowerCase().includes(query)
            );
        }
        
        // Получаем информацию о авторе поста
        let authorInfo = '';
        try {
            const userResponse = await fetch(`https://jsonplaceholder.typicode.com/users/${post.userId}`);
            const user = await userResponse.json();
            authorInfo = `Автор: ${user.name}`;
        } catch (error) {
            authorInfo = `Автор: пользователь ${post.userId}`;
        }
        
        return `
            <div class="post-header" style="margin-bottom: 2rem; padding: 1.5rem; background: white; border-radius: var(--border-radius); box-shadow: var(--box-shadow);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h2>${post.title}</h2>
                        <p style="color: #666; margin-top: 0.5rem;">${authorInfo} • ID поста: ${post.id}</p>
                    </div>
                    <a href="#users#${post.userId}#posts" class="btn btn-secondary" data-route>
                        <i class="fas fa-arrow-left"></i> Назад к постам
                    </a>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <p style="line-height: 1.6;">${post.body}</p>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h3>Комментарии к посту (${filteredComments.length})</h3>
                <button class="btn btn-primary" id="add-comment-btn">
                    <i class="fas fa-plus"></i> Добавить комментарий
                </button>
            </div>
            
            ${filteredComments.length === 0 ? 
                '<div class="message message-info">Комментарии не найдены. Попробуйте изменить запрос поиска или добавить первый комментарий.</div>' : 
                this.renderCommentsList(filteredComments)
            }
        `;
    } catch (error) {
        console.error('Ошибка при загрузке комментариев:', error);
        return `
            <div class="message message-error">
                <h3>Ошибка загрузки</h3>
                <p>Не удалось загрузить комментарии.</p>
                <a href="#users" class="btn btn-primary" data-route>Вернуться к пользователям</a>
            </div>
        `;
    }
}

renderAllCommentsList(commentsByPost) {
    let html = '<div class="all-comments-container">';
    
    commentsByPost.forEach(group => {
        if (group.comments.length === 0) return;
        
        html += `
            <div class="post-comments-group" style="margin-bottom: 2.5rem; background: white; border-radius: var(--border-radius); padding: 1.5rem; box-shadow: var(--box-shadow);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid var(--primary-color);">
                    <div>
                        <h4 style="color: var(--secondary-color); margin: 0;">
                            <i class="fas fa-file-alt" style="color: var(--primary-color); margin-right: 0.5rem;"></i>
                            Комментарии к посту #${group.postId}
                            <span style="font-size: 0.9rem; color: #666; margin-left: 0.5rem;">
                                (${group.comments.length} комментариев)
                            </span>
                        </h4>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm btn-primary add-comment-to-post-btn" data-post-id="${group.postId}">
                            <i class="fas fa-plus"></i> Добавить
                        </button>
                        <a href="#users#posts#${group.postId}#comments" class="btn btn-sm btn-secondary" data-route>
                            <i class="fas fa-external-link-alt"></i> Подробнее
                        </a>
                    </div>
                </div>
                <div class="comments-in-group">
        `;
        
        // Показываем только первые 3 комментария для каждого поста
        group.comments.slice(0, 3).forEach((comment, index) => {
            const isCustom = comment.id > 500;
            
            html += `
                <div class="comment-card-simple" style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: var(--border-radius); border-left: 3px solid ${isCustom ? '#f39c12' : '#3498db'};">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <strong style="color: var(--secondary-color);">
                            <i class="fas fa-user" style="margin-right: 0.5rem;"></i>
                            ${comment.name}
                            ${isCustom ? '<span style="font-size: 0.7rem; color: #f39c12; margin-left: 0.5rem;">(Ваш)</span>' : ''}
                        </strong>
                        <small style="color: #999;">${comment.email}</small>
                    </div>
                    <p style="margin: 0; font-size: 0.95rem;">${comment.body.length > 100 ? comment.body.substring(0, 100) + '...' : comment.body}</p>
                    ${group.comments.length > 3 && index === 2 ? `
                        <div style="text-align: center; margin-top: 0.5rem;">
                            <small style="color: var(--primary-color);">
                                <i class="fas fa-ellipsis-h"></i> и еще ${group.comments.length - 3} комментариев
                            </small>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    if (commentsByPost.length === 0) {
        html = '<div class="message message-info">Комментарии не найдены. Добавьте первый комментарий!</div>';
    }
    
    return html;
}
    
    renderCommentsList(comments) {
        let html = '<div class="comments-container">';
        
        comments.forEach(comment => {
            const isCustom = comment.id > 500; // API комментарии обычно имеют ID до 500
            
            html += `
                <div class="comment-card" style="background: white; border-radius: var(--border-radius); padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: var(--box-shadow);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <div>
                            <h4 style="margin-bottom: 0.25rem; color: var(--secondary-color);">
                                <i class="fas fa-user" style="margin-right: 0.5rem; color: #3498db;"></i>
                                ${comment.name}
                                ${isCustom ? '<span style="font-size: 0.7rem; color: #f39c12; margin-left: 0.5rem;">(Ваш)</span>' : ''}
                            </h4>
                            <p style="color: #666; font-size: 0.9rem;">
                                <i class="fas fa-envelope" style="margin-right: 0.5rem;"></i>${comment.email}
                            </p>
                        </div>
                        <div>
                            <span style="font-size: 0.8rem; color: #999; background: #f8f9fa; padding: 0.25rem 0.75rem; border-radius: 20px;">
                                <i class="fas fa-hashtag" style="margin-right: 0.25rem;"></i>${comment.id}
                            </span>
                            ${isCustom ? `
                                <button class="btn btn-danger btn-sm delete-comment-btn" data-comment-id="${comment.id}" style="margin-left: 0.5rem;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div style="padding: 1rem; background: #f8f9fa; border-radius: var(--border-radius);">
                        <p style="line-height: 1.6; margin: 0;">${comment.body}</p>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
   bindViewEvents(route) {
    // Добавляем обработчики для всех ссылок с data-route
    document.querySelectorAll('a[data-route]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            this.navigate(href);
        });
    });
    
    // Кнопки удаления пользователей
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = parseInt(btn.dataset.userId);
            this.deleteUser(userId);
        });
    });
    
    // Кнопка добавления задачи
    const addTodoBtn = document.getElementById('add-todo-btn');
    if (addTodoBtn) {
        addTodoBtn.addEventListener('click', () => {
            this.showAddTodoModal(route);
        });
    }
    
    // Кнопка добавления комментария
    const addCommentBtn = document.getElementById('add-comment-btn');
    if (addCommentBtn) {
        addCommentBtn.addEventListener('click', () => {
            // Определяем, находимся ли мы на странице конкретного поста или в общем разделе
            if (route.includes('#posts#') && route.includes('#comments')) {
                const parts = route.split('#').filter(p => p);
                const postId = parts[2] ? parseInt(parts[2]) : null;
                
                if (postId) {
                    // Мы на странице конкретного поста
                    this.showAddCommentModal(route);
                } else {
                    // Мы в общем разделе комментариев
                    this.showSelectPostForComment();
                }
            } else if (route === '#users#posts#comments') {
                // Мы в общем разделе комментариев через меню навигации
                this.showSelectPostForComment();
            } else {
                // Для других случаев используем стандартный метод
                this.showAddCommentModal(route);
            }
        });
    }
    
    // Кнопки удаления задач
    document.querySelectorAll('.delete-todo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const todoId = parseInt(btn.dataset.todoId);
            this.deleteTodo(todoId);
        });
    });
    
    // Кнопки удаления комментариев
    document.querySelectorAll('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const commentId = parseInt(btn.dataset.commentId);
            this.deleteComment(commentId);
        });
    });
    
    // Кнопки просмотра поста
    document.querySelectorAll('.view-post-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const postId = parseInt(btn.dataset.postId);
            await this.showPostDetails(postId);
        });
    });
    
    // Обработчики для кнопок в карточках комментариев (для общего раздела)
    document.querySelectorAll('.btn-view-post').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const postId = parseInt(btn.dataset.postId);
            this.navigate(`#users#posts#${postId}#comments`);
        });
    });
    
    // Обработчики для кнопок "Добавить комментарий к этому посту" в общем разделе
    document.querySelectorAll('.add-comment-to-post-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const postId = parseInt(btn.dataset.postId);
            const modalContent = `
                <form id="add-comment-form">
                    <input type="hidden" id="comment-post-id" value="${postId}">
                    <div class="form-group">
                        <label for="comment-name" class="form-label">Ваше имя *</label>
                        <input type="text" id="comment-name" class="form-control" placeholder="Введите ваше имя" required>
                    </div>
                    <div class="form-group">
                        <label for="comment-email" class="form-label">Ваш Email *</label>
                        <input type="email" id="comment-email" class="form-control" placeholder="example@mail.com" required>
                    </div>
                    <div class="form-group">
                        <label for="comment-body" class="form-label">Текст комментария *</label>
                        <textarea id="comment-body" class="form-control" rows="4" placeholder="Напишите ваш комментарий..." required></textarea>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary" style="width: 100%;">
                            <i class="fas fa-paper-plane"></i> Опубликовать комментарий
                        </button>
                    </div>
                </form>
            `;
            
            this.openModal(`Добавить комментарий к посту #${postId}`, modalContent);
            
            document.getElementById('add-comment-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.addCommentFromGeneral();
            });
        });
    });
}
// Вспомогательная функция для показа модального окна выбора поста
showSelectPostForComment() {
    fetch('https://jsonplaceholder.typicode.com/posts?_limit=50')
        .then(response => response.json())
        .then(posts => {
            let optionsHtml = '';
            posts.forEach(post => {
                optionsHtml += `
                    <option value="${post.id}">
                        Пост #${post.id}: ${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}
                    </option>
                `;
            });
            
            const modalContent = `
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: var(--border-radius);">
                    <p style="margin: 0; color: var(--secondary-color);">
                        <i class="fas fa-info-circle"></i> 
                        Вы можете добавить комментарий к любому посту. Комментарий будет сохранен локально.
                    </p>
                </div>
                <form id="select-post-form">
                    <div class="form-group">
                        <label for="post-select" class="form-label">Выберите пост для комментария *</label>
                        <select id="post-select" class="form-control" required>
                            <option value="">-- Выберите пост --</option>
                            ${optionsHtml}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="comment-name" class="form-label">Ваше имя *</label>
                        <input type="text" id="comment-name" class="form-control" placeholder="Введите ваше имя" required>
                    </div>
                    <div class="form-group">
                        <label for="comment-email" class="form-label">Ваш Email *</label>
                        <input type="email" id="comment-email" class="form-control" placeholder="example@mail.com" required>
                    </div>
                    <div class="form-group">
                        <label for="comment-body" class="form-label">Текст комментария *</label>
                        <textarea id="comment-body" class="form-control" rows="4" placeholder="Напишите ваш комментарий..." required></textarea>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary" style="width: 100%;">
                            <i class="fas fa-paper-plane"></i> Опубликовать комментарий
                        </button>
                    </div>
                </form>
            `;
            
            this.openModal('Добавить новый комментарий', modalContent);
            
            document.getElementById('select-post-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.addCommentFromGeneral();
            });
        })
        .catch(error => {
            console.error('Ошибка при загрузке постов:', error);
            this.showMessage('Ошибка при загрузке списка постов', 'error');
        });
}

// Функция для добавления комментария из общего раздела
addCommentFromGeneral() {
    const postId = parseInt(document.getElementById('post-select').value);
    const name = document.getElementById('comment-name').value;
    const email = document.getElementById('comment-email').value;
    const body = document.getElementById('comment-body').value;
    
    if (!postId || !name || !email || !body) {
        this.showMessage('Пожалуйста, заполните все обязательные поля', 'error');
        return;
    }
    
    const comments = this.getLocalComments();
    const newComment = {
        id: Date.now(),
        postId: postId,
        name: name,
        email: email,
        body: body
    };
    
    comments.push(newComment);
    this.saveLocalComments(comments);
    
    this.closeModal();
    this.showMessage('💬 Комментарий успешно добавлен к посту!', 'success');
    this.loadView(window.location.hash);
}
    
    // Локальное хранилище
    getLocalUsers() {
        try {
            const users = localStorage.getItem('customUsers');
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('Ошибка при чтении пользователей из localStorage:', error);
            return [];
        }
    }
    
    saveLocalUsers(users) {
        try {
            localStorage.setItem('customUsers', JSON.stringify(users));
        } catch (error) {
            console.error('Ошибка при сохранении пользователей в localStorage:', error);
            this.showMessage('Ошибка при сохранении данных', 'error');
        }
    }
    
    getLocalTodos() {
        try {
            const todos = localStorage.getItem('customTodos');
            return todos ? JSON.parse(todos) : [];
        } catch (error) {
            console.error('Ошибка при чтении задач из localStorage:', error);
            return [];
        }
    }
    
    saveLocalTodos(todos) {
        try {
            localStorage.setItem('customTodos', JSON.stringify(todos));
        } catch (error) {
            console.error('Ошибка при сохранении задач в localStorage:', error);
            this.showMessage('Ошибка при сохранении данных', 'error');
        }
    }
    
    getLocalComments() {
        try {
            const comments = localStorage.getItem('customComments');
            return comments ? JSON.parse(comments) : [];
        } catch (error) {
            console.error('Ошибка при чтении комментариев из localStorage:', error);
            return [];
        }
    }
    
    saveLocalComments(comments) {
        try {
            localStorage.setItem('customComments', JSON.stringify(comments));
        } catch (error) {
            console.error('Ошибка при сохранении комментариев в localStorage:', error);
            this.showMessage('Ошибка при сохранении данных', 'error');
        }
    }
    
    // Модальные окна
    showAddUserModal() {
        const modalContent = `
            <form id="add-user-form">
                <div class="form-group">
                    <label for="user-name" class="form-label">Имя *</label>
                    <input type="text" id="user-name" class="form-control" placeholder="Введите имя" required>
                </div>
                <div class="form-group">
                    <label for="user-email" class="form-label">Email *</label>
                    <input type="email" id="user-email" class="form-control" placeholder="example@mail.com" required>
                </div>
                <div class="form-group">
                    <label for="user-phone" class="form-label">Телефон</label>
                    <input type="tel" id="user-phone" class="form-control" placeholder="+7 (999) 123-45-67">
                </div>
                <div class="form-group">
                    <label for="user-city" class="form-label">Город</label>
                    <input type="text" id="user-city" class="form-control" placeholder="Москва">
                </div>
                <div class="form-group">
                    <label for="user-company" class="form-label">Компания</label>
                    <input type="text" id="user-company" class="form-control" placeholder="Название компании">
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        <i class="fas fa-save"></i> Сохранить пользователя
                    </button>
                </div>
            </form>
        `;
        
        this.openModal('Добавить нового пользователя', modalContent);
        
        document.getElementById('add-user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addUser();
        });
    }
    
    showAddTodoModal(route) {
        const parts = route.split('#').filter(p => p);
        const userId = parts[1] ? parseInt(parts[1]) : null;
        
        if (!userId) return;
        
        const modalContent = `
            <form id="add-todo-form">
                <input type="hidden" id="todo-user-id" value="${userId}">
                <div class="form-group">
                    <label for="todo-title" class="form-label">Заголовок задачи *</label>
                    <input type="text" id="todo-title" class="form-control" placeholder="Введите описание задачи" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Статус</label>
                    <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="radio" name="todo-completed" value="false" checked>
                            <span>🔄 В процессе</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="radio" name="todo-completed" value="true">
                            <span>✅ Завершено</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        <i class="fas fa-plus"></i> Добавить задачу
                    </button>
                </div>
            </form>
        `;
        
        this.openModal('Добавить новую задачу', modalContent);
        
        document.getElementById('add-todo-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });
    }
    
    showAddCommentModal(route) {
        const parts = route.split('#').filter(p => p);
        const postId = parts[2] ? parseInt(parts[2]) : null;
        
        if (!postId) return;
        
        // Получаем заголовок поста для отображения
        fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`)
            .then(response => response.json())
            .then(post => {
                const modalContent = `
                    <form id="add-comment-form">
                        <input type="hidden" id="comment-post-id" value="${postId}">
                        <div class="form-group">
                            <label for="comment-name" class="form-label">Ваше имя *</label>
                            <input type="text" id="comment-name" class="form-control" placeholder="Введите ваше имя" required>
                        </div>
                        <div class="form-group">
                            <label for="comment-email" class="form-label">Ваш Email *</label>
                            <input type="email" id="comment-email" class="form-control" placeholder="example@mail.com" required>
                        </div>
                        <div class="form-group">
                            <label for="comment-body" class="form-label">Текст комментария *</label>
                            <textarea id="comment-body" class="form-control" rows="4" placeholder="Напишите ваш комментарий..." required></textarea>
                        </div>
                        <div class="form-group">
                            <p style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">
                                <i class="fas fa-info-circle"></i> Комментарий будет добавлен к посту: "<strong>${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}</strong>"
                            </p>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn btn-primary" style="width: 100%;">
                                <i class="fas fa-paper-plane"></i> Опубликовать комментарий
                            </button>
                        </div>
                    </form>
                `;
                
                this.openModal('Добавить новый комментарий', modalContent);
                
                document.getElementById('add-comment-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addComment();
                });
            })
            .catch(error => {
                console.error('Ошибка при загрузке поста:', error);
                this.showMessage('Ошибка при загрузке информации о посте', 'error');
            });
    }
    
    async showPostDetails(postId) {
        try {
            const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`);
            const post = await response.json();
            
            const userResponse = await fetch(`https://jsonplaceholder.typicode.com/users/${post.userId}`);
            const user = await userResponse.json();
            
            const modalContent = `
                <div class="post-details">
                    <h3 style="margin-bottom: 1rem; color: var(--secondary-color);">${post.title}</h3>
                    <div style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: var(--border-radius);">
                        <p><strong>👤 Автор:</strong> ${user.name || 'Неизвестный'}</p>
                        <p><strong>📧 Email автора:</strong> ${user.email || 'Не указан'}</p>
                        <p><strong>🆔 ID поста:</strong> ${post.id}</p>
                        <p><strong>👥 ID пользователя:</strong> ${post.userId}</p>
                    </div>
                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="margin-bottom: 0.5rem;">📝 Содержание:</h4>
                        <p style="line-height: 1.8; padding: 1rem; background: #f8f9fa; border-radius: 8px;">${post.body}</p>
                    </div>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <a href="#users#${post.userId}#posts#${post.id}#comments" 
                           class="btn btn-primary" data-route
                           onclick="app.closeModal()">
                            <i class="fas fa-comments"></i> Перейти к комментариям
                        </a>
                        <button class="btn btn-secondary" onclick="app.closeModal()">
                            <i class="fas fa-times"></i> Закрыть
                        </button>
                    </div>
                </div>
            `;
            
            this.openModal('Детальная информация о посте', modalContent);
        } catch (error) {
            console.error('Ошибка при загрузке деталей поста:', error);
            this.showMessage('Ошибка при загрузке деталей поста', 'error');
        }
    }
    
    openModal(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal').classList.add('active');
        
        setTimeout(() => {
            const firstInput = document.querySelector('#modal-body input, #modal-body textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }
    
    closeModal() {
        document.getElementById('modal').classList.remove('active');
        document.getElementById('modal-body').innerHTML = '';
    }
    
    // Операции с данными
    addUser() {
        const name = document.getElementById('user-name').value;
        const email = document.getElementById('user-email').value;
        const phone = document.getElementById('user-phone').value;
        const city = document.getElementById('user-city').value;
        const company = document.getElementById('user-company').value;
        
        if (!name || !email) {
            this.showMessage('Пожалуйста, заполните обязательные поля (Имя и Email)', 'error');
            return;
        }
        
        const users = this.getLocalUsers();
        const newUser = {
            id: Date.now(), // Используем текущее время как ID
            name,
            email,
            phone: phone || '',
            address: { 
                city: city || '',
                street: '',
                suite: '',
                zipcode: ''
            },
            company: { 
                name: company || '',
                catchPhrase: '',
                bs: ''
            },
            username: name.toLowerCase().replace(/\s+/g, '.'),
            website: ''
        };
        
        users.push(newUser);
        this.saveLocalUsers(users);
        
        this.closeModal();
        this.showMessage('✅ Пользователь успешно добавлен!', 'success');
        this.navigate('#users');
    }
    
    addTodo() {
        const userId = parseInt(document.getElementById('todo-user-id').value);
        const title = document.getElementById('todo-title').value;
        const completed = document.querySelector('input[name="todo-completed"]:checked').value === 'true';
        
        if (!title) {
            this.showMessage('Пожалуйста, введите заголовок задачи', 'error');
            return;
        }
        
        const todos = this.getLocalTodos();
        const newTodo = {
            id: Date.now(),
            userId,
            title,
            completed
        };
        
        todos.push(newTodo);
        this.saveLocalTodos(todos);
        
        this.closeModal();
        this.showMessage('✅ Задача успешно добавлена!', 'success');
        this.navigate(`#users#${userId}#todos`);
    }
    
    addComment() {
        const postId = parseInt(document.getElementById('comment-post-id').value);
        const name = document.getElementById('comment-name').value;
        const email = document.getElementById('comment-email').value;
        const body = document.getElementById('comment-body').value;
        
        if (!name || !email || !body) {
            this.showMessage('Пожалуйста, заполните все обязательные поля', 'error');
            return;
        }
        
        const comments = this.getLocalComments();
        const newComment = {
            id: Date.now(), // Используем текущее время как ID
            postId: postId,
            name: name,
            email: email,
            body: body
        };
        
        comments.push(newComment);
        this.saveLocalComments(comments);
        
        this.closeModal();
        this.showMessage('💬 Комментарий успешно добавлен!', 'success');
        this.loadView(window.location.hash); // Перезагружаем текущую страницу
    }
    
    deleteUser(userId) {
        if (!confirm('Вы уверены, что хотите удалить этого пользователя?\n\nВместе с ним будут удалены все его задачи.')) {
            return;
        }
        
        const users = this.getLocalUsers();
        const filteredUsers = users.filter(user => user.id !== userId);
        this.saveLocalUsers(filteredUsers);
        
        // Также удаляем задачи пользователя
        const todos = this.getLocalTodos();
        const filteredTodos = todos.filter(todo => todo.userId !== userId);
        this.saveLocalTodos(filteredTodos);
        
        this.showMessage('🗑️ Пользователь и его задачи удалены!', 'success');
        this.navigate('#users');
    }
    
    deleteTodo(todoId) {
        if (!confirm('Вы уверены, что хотите удалить эту задачу?')) {
            return;
        }
        
        const todos = this.getLocalTodos();
        const filteredTodos = todos.filter(todo => todo.id !== todoId);
        this.saveLocalTodos(filteredTodos);
        
        this.showMessage('🗑️ Задача удалена!', 'success');
        this.loadView(window.location.hash);
    }
    
    deleteComment(commentId) {
        if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) {
            return;
        }
        
        const comments = this.getLocalComments();
        const filteredComments = comments.filter(comment => comment.id !== commentId);
        this.saveLocalComments(filteredComments);
        
        this.showMessage('🗑️ Комментарий удален!', 'success');
        this.loadView(window.location.hash);
    }
    
    // Вспомогательные методы
    showMessage(text, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `global-message message-${type}`;
        messageEl.textContent = text;
        
        // Стили для сообщения
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;
        
        // Анимация появления
        if (!document.querySelector('#message-animation')) {
            const style = document.createElement('style');
            style.id = 'message-animation';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(messageEl);
        
        // Автоматическое удаление
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.remove();
                }
            }, 300);
        }, 3000);
    }
    
    updateContent() {
        this.loadView(window.location.hash || '#users');
    }
    
    loadInitialView() {
        const hash = window.location.hash;
        if (hash) {
            this.loadView(hash);
        } else {
            this.navigate('#users');
        }
    }
    
    initializeSampleData() {
        // Инициализация тестовых данных, если localStorage пуст
        const customUsers = this.getLocalUsers();
        if (customUsers.length === 0) {
            const sampleUsers = [
                {
                    id: 101,
                    name: "Иван Петров",
                    email: "ivan.petrov@example.com",
                    phone: "+7 (999) 123-45-67",
                    address: {
                        city: "Москва",
                        street: "ул. Примерная",
                        suite: "д. 1",
                        zipcode: "123456"
                    },
                    company: {
                        name: "ООО Рога и Копыта",
                        catchPhrase: "Лучшие рога в городе",
                        bs: "производство рогов"
                    },
                    username: "ivan.petrov",
                    website: "https://example.com"
                },
                {
                    id: 102,
                    name: "Мария Сидорова",
                    email: "maria.sidorova@example.com",
                    phone: "+7 (999) 987-65-43",
                    address: {
                        city: "Санкт-Петербург",
                        street: "ул. Тестовая",
                        suite: "кв. 5",
                        zipcode: "654321"
                    },
                    company: {
                        name: "ИП Сидорова",
                        catchPhrase: "Качественные услуги",
                        bs: "консалтинг"
                    },
                    username: "maria.sidorova",
                    website: "https://sidorova.com"
                }
            ];
            
            sampleUsers.forEach(user => {
                customUsers.push(user);
            });
            
            this.saveLocalUsers(customUsers);
            
            // Добавляем тестовые задачи
            const sampleTodos = [
                {
                    id: 201,
                    userId: 101,
                    title: "Изучить JavaScript",
                    completed: false
                },
                {
                    id: 202,
                    userId: 101,
                    title: "Сделать лабораторную работу",
                    completed: true
                },
                {
                    id: 203,
                    userId: 102,
                    title: "Купить продукты",
                    completed: false
                },
                {
                    id: 204,
                    userId: 102,
                    title: "Заплатить за интернет",
                    completed: true
                }
            ];
            
            this.saveLocalTodos(sampleTodos);
            
            // Добавляем тестовые комментарии
            const sampleComments = [
                {
                    id: 1001,
                    postId: 1,
                    name: "Тестовый Пользователь",
                    email: "test@example.com",
                    body: "Это тестовый комментарий, добавленный в приложении. Вы можете удалить его или добавить свои!"
                }
            ];
            
            this.saveLocalComments(sampleComments);
            
            console.log('Тестовые данные инициализированы');
        }
    }
}

// Запускаем приложение
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});