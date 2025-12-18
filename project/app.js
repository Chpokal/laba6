import Router from './components/router.js';
import Breadcrumbs from './components/breadcrumbs.js';
import API from './components/api.js';
import Storage from './components/storage.js';
import UsersView from './views/users.js';
import TodosView from './views/todos.js';
import PostsView from './views/posts.js';
import CommentsView from './views/comments.js';

class App {
    constructor() {
        this.router = new Router();
        this.breadcrumbs = new Breadcrumbs();
        this.api = new API();
        this.storage = new Storage();
        
        this.views = {
            users: new UsersView(this.api, this.storage),
            todos: new TodosView(this.api, this.storage),
            posts: new PostsView(this.api, this.storage),
            comments: new CommentsView(this.api, this.storage)
        };
        
        this.currentView = null;
        this.searchQuery = '';
        
        this.init();
    }
    
    init() {
        this.router.init(this.handleRouteChange.bind(this));
        
        this.breadcrumbs.init();
        
        this.setupEventListeners();
        
        this.router.navigate();
    }
    
    setupEventListeners() {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.performSearch();
        });
        
        searchBtn.addEventListener('click', () => {
            this.performSearch();
        });
        
        document.getElementById('add-user-btn').addEventListener('click', () => {
            this.views.users.showAddUserModal();
        });
        
        document.getElementById('modal-close').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.closeModal();
            }
        });
    }
    
    handleRouteChange(route) {
        this.breadcrumbs.update(route);
        
        this.updateActiveNavLink(route);
        
        let viewName = 'users';
        let params = {};
        
        if (route.includes('#todos')) {
            viewName = 'todos';
            const parts = route.split('#');
            if (parts.length > 1) {
                params.userId = parts[1] ? parseInt(parts[1]) : null;
            }
        } else if (route.includes('#posts')) {
            viewName = 'posts';
            const parts = route.split('#');
            if (parts.length > 1) {
                params.userId = parts[1] ? parseInt(parts[1]) : null;
            }
        } else if (route.includes('#comments')) {
            viewName = 'comments';
            const parts = route.split('#');
            if (parts.length > 2) {
                params.userId = parts[1] ? parseInt(parts[1]) : null;
                params.postId = parts[2] ? parseInt(parts[2]) : null;
            }
        } else if (route.includes('#users') && route !== '#users') {
            const parts = route.split('#');
            if (parts.length > 1 && parts[1]) {
                params.userId = parseInt(parts[1]);
            }
        }
        
        this.renderView(viewName, params);
    }
    
    updateActiveNavLink(route) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            const href = link.getAttribute('href');
            if (route.startsWith(href) || 
                (href === '#users' && (route === '#users' || route.startsWith('#users#')))) {
                link.classList.add('active');
            }
        });
    }
    
    async renderView(viewName, params) {
        this.currentView = viewName;
        
        const contentEl = document.getElementById('content');
        contentEl.innerHTML = '<div class="message message-info">Загрузка...</div>';
        
        try {
            const html = await this.views[viewName].render(params, this.searchQuery);
            contentEl.innerHTML = html;
            
            this.views[viewName].bindEvents();
        } catch (error) {
            console.error('Ошибка при отображении view:', error);
            contentEl.innerHTML = `
                <div class="message message-error">
                    Ошибка при загрузке данных: ${error.message}
                </div>
            `;
        }
    }
    
    performSearch() {
        if (this.currentView) {
            this.handleRouteChange(this.router.getCurrentRoute());
        }
    }
    
    closeModal() {
        document.getElementById('modal').classList.remove('active');
        document.getElementById('modal-body').innerHTML = '';
    }
    
    openModal(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal').classList.add('active');
    }
}

export { App };

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});