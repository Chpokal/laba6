class PostsView {
    constructor(api, storage) {
        this.api = api;
        this.storage = storage;
    }
    
    async render(params = {}, searchQuery = '') {
        const userId = params.userId;
        const posts = await this.api.getPosts(userId);
        let filteredPosts = posts;
        
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredPosts = posts.filter(post => 
                post.title.toLowerCase().includes(query) ||
                post.body.toLowerCase().includes(query)
            );
        }
        
        const user = userId ? await this.getUserInfo(userId) : null;
        const userInfo = user ? ` пользователя ${user.name}` : '';
        
        return `
            <h2>Посты${userInfo} (${filteredPosts.length})</h2>
            ${filteredPosts.length === 0 
                ? '<div class="message message-info">Посты не найдены</div>' 
                : this.renderPostsGrid(filteredPosts)
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
    
    renderPostsGrid(posts) {
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
    
    bindEvents() {
        document.querySelectorAll('.view-post-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = parseInt(e.target.closest('.view-post-btn').dataset.postId);
                this.showPostDetails(postId);
            });
        });
    }
    
    async showPostDetails(postId) {
        try {
            const posts = await this.api.getPosts();
            const post = posts.find(p => p.id === postId);
            
            if (!post) {
                this.showMessage('Пост не найден', 'error');
                return;
            }
            
            const user = await this.getUserInfo(post.userId);
            
            const modalContent = `
                <div class="post-details">
                    <h3 style="margin-bottom: 1rem; color: var(--secondary-color);">${post.title}</h3>
                    <div style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: var(--border-radius);">
                        <p><strong>Автор:</strong> ${user.name || 'Неизвестный'}</p>
                        <p><strong>ID:</strong> ${post.id}</p>
                        <p><strong>User ID:</strong> ${post.userId}</p>
                    </div>
                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="margin-bottom: 0.5rem;">Содержание:</h4>
                        <p style="line-height: 1.8;">${post.body}</p>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <a href="#users#${post.userId}#posts#${post.id}#comments" 
                           class="btn btn-primary" data-route
                           onclick="window.app.closeModal()">
                            <i class="fas fa-comments"></i> Перейти к комментариям
                        </a>
                        <button class="btn btn-secondary" onclick="window.app.closeModal()">
                            <i class="fas fa-times"></i> Закрыть
                        </button>
                    </div>
                </div>
            `;
            
            window.app.openModal('Детали поста', modalContent);
        } catch (error) {
            console.error('Ошибка при загрузке деталей поста:', error);
            this.showMessage('Ошибка при загрузке деталей поста', 'error');
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

export default PostsView;