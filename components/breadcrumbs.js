class Breadcrumbs {
    constructor() {
        this.breadcrumbsEl = document.getElementById('breadcrumbs');
    }
    
    init() {
        this.update(window.location.hash || '#users');
    }
    
    update(route) {
        const crumbs = this.generateBreadcrumbs(route);
        this.render(crumbs);
    }
    
    generateBreadcrumbs(route) {
        const crumbs = [
            { name: 'Главная', path: '#users' }
        ];
        
        if (route === '#users') {
            return crumbs;
        }
        
        const parts = route.split('#').filter(part => part);
        
        if (parts.length > 0 && parts[0] !== 'users') {
            const userId = parseInt(parts[0]);
            crumbs.push({
                name: `Пользователь ${userId}`,
                path: `#users#${userId}`
            });
        } else if (parts.length > 1) {
            const userId = parseInt(parts[1]);
            crumbs.push({
                name: `Пользователь ${userId}`,
                path: `#users#${userId}`
            });
        }
        
        if (route.includes('#todos')) {
            crumbs.push({
                name: 'Todo',
                path: route
            });
        } else if (route.includes('#posts')) {
            if (route.includes('#comments')) {
                const postId = parseInt(parts[2]);
                crumbs.push(
                    {
                        name: 'Посты',
                        path: `#users#${parts[1]}#posts`
                    },
                    {
                        name: `Комментарии к посту ${postId}`,
                        path: route
                    }
                );
            } else {
                crumbs.push({
                    name: 'Посты',
                    path: route
                });
            }
        }
        
        return crumbs;
    }
    
    render(crumbs) {
        if (!crumbs.length) {
            this.breadcrumbsEl.innerHTML = '';
            return;
        }
        
        let html = '<ul class="breadcrumbs-list">';
        
        crumbs.forEach((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            
            html += `
                <li class="breadcrumb-item">
                    ${isLast 
                        ? `<span class="breadcrumb-current">${crumb.name}</span>`
                        : `<a href="${crumb.path}" class="breadcrumb-link" data-route>${crumb.name}</a>`
                    }
                    ${!isLast ? '<span class="breadcrumb-separator">/</span>' : ''}
                </li>
            `;
        });
        
        html += '</ul>';
        this.breadcrumbsEl.innerHTML = html;
    }
}

export default Breadcrumbs;