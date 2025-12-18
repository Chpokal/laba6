class CommentsView {
    constructor(api, storage) {
        this.api = api;
        this.storage = storage;
    }
    
    async render(params = {}, searchQuery = '') {
        const { userId, postId } = params;
        
        if (!postId) {
            return `
                <div class="message message-info">
                    <h2>Комментарии</h2>
                    <p>Выберите пост для просмотра комментариев</p>
                </div>
            `;
        }
        
        const comments = await this.api.getComments(postId);
        let filteredComments = comments;
        
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredComments = comments.filter(comment => 
                comment.name.toLowerCase().includes(query) ||
                comment.body.toLowerCase().includes(query) ||
                comment.email.toLowerCase().includes(query)
            );
        }
        
        const post = await this.getPostInfo(postId);
        const postTitle = post ? post.title : `Пост #${postId}`;
        
        return `
            <h2>Комментарии к посту</h2>
            <div class="post-info" style="margin-bottom: 2rem; padding: 1.5rem; background: white; border-radius: var(--border-radius); box-shadow: var(--box-shadow);">
                <h3>${postTitle.length > 80 ? postTitle.substring(0, 80) + '...' : postTitle}</h3>
                ${post ? `<p style="margin-top: 0.5rem; color: #666;">${post.body.length > 150 ? post.body.substring(0, 150) + '...' : post.body}</p>` : ''}
            </div>
            <h3>Комментарии (${filteredComments.length})</h3>
            ${filteredComments.length === 0 
                ? '<div class="message message-info">Комментарии не найдены</div>' 
                : this.renderCommentsList(filteredComments)
            }
        `;
    }
    
    async getPostInfo(postId) {
        try {
            const posts = await this.api.getPosts();
            return posts.find(p => p.id === postId);
        } catch (error) {
            return null;
        }
    }
    
    renderCommentsList(comments) {
        let html = '<div class="comments-container">';
        
        comments.forEach(comment => {
            html += `
                <div class="comment-card" style="background: white; border-radius: var(--border-radius); padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: var(--box-shadow);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <div>
                            <h4 style="margin-bottom: 0.25rem; color: var(--secondary-color);">${comment.name}</h4>
                            <p style="color: #666; font-size: 0.9rem;">
                                <i class="fas fa-envelope" style="margin-right: 0.5rem;"></i>${comment.email}
                            </p>
                        </div>
                        <span style="font-size: 0.8rem; color: #999; background: #f8f9fa; padding: 0.25rem 0.75rem; border-radius: 20px;">
                            ID: ${comment.id}
                        </span>
                    </div>
                    <div style="padding: 1rem; background: #f8f9fa; border-radius: var(--border-radius);">
                        <p style="line-height: 1.6;">${comment.body}</p>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    bindEvents() {
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

export default CommentsView;