class Router {
    constructor() {
        this.routes = {
            '#users': 'users',
            '#users#todos': 'todos',
            '#users#posts': 'posts',
            '#users#posts#comments': 'comments'
        };
        
        this.currentRoute = '';
    }
    
    init(routeChangeCallback) {
        this.routeChangeCallback = routeChangeCallback;
        
        window.addEventListener('hashchange', () => {
            this.navigate();
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-route]') || e.target.closest('[data-route]')) {
                e.preventDefault();
                const route = e.target.getAttribute('href') || 
                             e.target.closest('[data-route]').getAttribute('href');
                this.navigate(route);
            }
        });
    }
    
    navigate(route) {
        if (route) {
            window.location.hash = route;
        } else {
            route = window.location.hash || '#users';
        }
        
        this.currentRoute = route;
        
        if (this.routeChangeCallback) {
            this.routeChangeCallback(route);
        }
    }
    
    getCurrentRoute() {
        return this.currentRoute;
    }
    
    getRouteParams() {
        const route = this.currentRoute;
        const params = {};
        
        if (route.includes('#todos')) {
            const parts = route.split('#');
            if (parts.length > 1 && parts[1]) {
                params.userId = parseInt(parts[1]);
            }
        } else if (route.includes('#posts')) {
            const parts = route.split('#');
            if (parts.length > 1 && parts[1]) {
                params.userId = parseInt(parts[1]);
            }
        } else if (route.includes('#comments')) {
            const parts = route.split('#');
            if (parts.length > 2) {
                params.userId = parts[1] ? parseInt(parts[1]) : null;
                params.postId = parts[2] ? parseInt(parts[2]) : null;
            }
        }
        
        return params;
    }
}

export default Router;