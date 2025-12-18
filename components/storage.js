class Storage {
    constructor() {
        this.key = 'customUsers';
        this.todosKey = 'customTodos';
    }
    
    getCustomUsers() {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    }
    
    saveCustomUsers(users) {
        localStorage.setItem(this.key, JSON.stringify(users));
    }
    
    addCustomUser(user) {
        const users = this.getCustomUsers();
        users.push(user);
        this.saveCustomUsers(users);
        return user;
    }
    
    deleteCustomUser(userId) {
        const users = this.getCustomUsers();
        const filteredUsers = users.filter(user => user.id !== userId);
        this.saveCustomUsers(filteredUsers);
        
        this.deleteUserTodos(userId);
        
        return true;
    }
    
    getCustomTodos() {
        const data = localStorage.getItem(this.todosKey);
        return data ? JSON.parse(data) : [];
    }
    
    saveCustomTodos(todos) {
        localStorage.setItem(this.todosKey, JSON.stringify(todos));
    }
    
    addCustomTodo(todo) {
        const todos = this.getCustomTodos();
        todos.push(todo);
        this.saveCustomTodos(todos);
        return todo;
    }
    
    getUserTodos(userId) {
        const todos = this.getCustomTodos();
        return todos.filter(todo => todo.userId === userId);
    }
    
    deleteUserTodos(userId) {
        const todos = this.getCustomTodos();
        const filteredTodos = todos.filter(todo => todo.userId !== userId);
        this.saveCustomTodos(filteredTodos);
    }
    
    async getCombinedUsers() {
        const apiUsers = await window.app.api.getUsers();
        const customUsers = this.getCustomUsers();
        return [...customUsers, ...apiUsers];
    }
    
    async getCombinedTodos(userId = null) {
        const apiTodos = await window.app.api.getTodos(userId);
        const customTodos = userId ? this.getUserTodos(userId) : this.getCustomTodos();
        return [...customTodos, ...apiTodos];
    }
}

export default Storage;