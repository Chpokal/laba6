class API {
    constructor() {
        this.baseURL = 'https://jsonplaceholder.typicode.com';
    }
    
    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
            throw error;
        }
    }
    
    async getUsers() {
        return this.fetchData('/users');
    }
    
    async getUser(userId) {
        return this.fetchData(`/users/${userId}`);
    }
    
    async getTodos(userId = null) {
        const endpoint = userId ? `/todos?userId=${userId}` : '/todos';
        return this.fetchData(endpoint);
    }
    
    async getPosts(userId = null) {
        const endpoint = userId ? `/posts?userId=${userId}` : '/posts';
        return this.fetchData(endpoint);
    }
    
    async getComments(postId = null) {
        const endpoint = postId ? `/comments?postId=${postId}` : '/comments';
        return this.fetchData(endpoint);
    }
    
    async createUser(userData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    ...userData,
                    id: Math.floor(Math.random() * 1000) + 100 
                });
            }, 500);
        });
    }
    
    async createTodo(todoData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    ...todoData,
                    id: Math.floor(Math.random() * 1000) + 100
                });
            }, 500);
        });
    }
}

export default API;