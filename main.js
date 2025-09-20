// 后端API基础URL
// 可以根据需要修改此地址
const API_BASE_URL = 'https://get-rss.nekoqwq.space';

// 当前页码
let currentPage = 1;
// 总页数
let totalPages = 1;

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 初始化页面
    initPage();
});

// 初始化页面
async function initPage() {
    try {
        // 获取总页数
        await fetchPageCount();
        // 获取第一页文章
        await fetchArticles(currentPage);
        // 渲染分页
        renderPagination();
    } catch (error) {
        console.error('初始化页面失败:', error);
        showError('加载页面失败，请稍后重试');
    }
}

// 获取总页数
async function fetchPageCount() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/get/page-count`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
        
        const pageCountElement = xmlDoc.querySelector('page_count');
        if (pageCountElement) {
            totalPages = parseInt(pageCountElement.textContent) || 1;
        }
    } catch (error) {
        console.error('获取页数失败:', error);
        throw error;
    }
}

// 获取文章列表
async function fetchArticles(page) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/get/basic_info/${page}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
        
        const articles = xmlDoc.querySelectorAll('article');
        renderArticles(articles);
    } catch (error) {
        console.error('获取文章列表失败:', error);
        throw error;
    }
}

// 转义HTML内容，用于摘要显示
function escapeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.textContent;
}

// 渲染文章列表
function renderArticles(articles) {
    const articleGrid = document.getElementById('article-grid');
    articleGrid.innerHTML = '';
    
    if (articles.length === 0) {
        articleGrid.innerHTML = '<div class="no-articles">暂无文章</div>';
        return;
    }
    
    articles.forEach(article => {
        const title = article.querySelector('title')?.textContent || '无标题';
        const publishTime = article.querySelector('publish_time')?.textContent || '2099-01-01';
        const summary = article.querySelector('summary')?.textContent || '无摘要';
        const source = article.querySelector('source')?.textContent || 'RSS订阅';
        const uniqueId = article.querySelector('unique_id')?.textContent || '';
        
        const articleCard = document.createElement('div');
        articleCard.className = 'article-card';
        articleCard.onclick = () => {
            window.location.href = `reader.html?id=${encodeURIComponent(uniqueId)}`;
        };
        
        articleCard.innerHTML = `
            <div class="article-card-content">
                <h2>${title}</h2>
                <div class="article-meta">
                    <div class="article-date">
                        <span>🕒</span>
                        <span>${publishTime}</span>
                    </div>
                    <div class="article-author">
                        <span>✍️</span>
                        <span>${source}</span>
                    </div>
                </div>
                <div class="article-summary">${escapeHTML(summary)}</div>
            </div>
        `;
        
        articleGrid.appendChild(articleCard);
    });
}

// 渲染分页
function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    // 上一页按钮
    const prevButton = document.createElement('a');
    prevButton.href = '#';
    prevButton.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevButton.innerHTML = '&lt;';
    prevButton.onclick = (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            navigateToPage(currentPage - 1);
        }
    };
    pagination.appendChild(prevButton);
    
    // 页码按钮
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 第一页
    if (startPage > 1) {
        const firstPageButton = document.createElement('a');
        firstPageButton.href = '#';
        firstPageButton.className = 'page-item';
        firstPageButton.textContent = '1';
        firstPageButton.onclick = (e) => {
            e.preventDefault();
            navigateToPage(1);
        };
        pagination.appendChild(firstPageButton);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-item disabled';
            ellipsis.textContent = '...';
            pagination.appendChild(ellipsis);
        }
    }
    
    // 页码
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('a');
        pageButton.href = '#';
        pageButton.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageButton.textContent = i;
        pageButton.onclick = (e) => {
            e.preventDefault();
            navigateToPage(i);
        };
        pagination.appendChild(pageButton);
    }
    
    // 最后一页
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-item disabled';
            ellipsis.textContent = '...';
            pagination.appendChild(ellipsis);
        }
        
        const lastPageButton = document.createElement('a');
        lastPageButton.href = '#';
        lastPageButton.className = 'page-item';
        lastPageButton.textContent = totalPages;
        lastPageButton.onclick = (e) => {
            e.preventDefault();
            navigateToPage(totalPages);
        };
        pagination.appendChild(lastPageButton);
    }
    
    // 下一页按钮
    const nextButton = document.createElement('a');
    nextButton.href = '#';
    nextButton.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextButton.innerHTML = '&gt;';
    nextButton.onclick = (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            navigateToPage(currentPage + 1);
        }
    };
    pagination.appendChild(nextButton);
}

// 跳转到指定页
async function navigateToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) {
        return;
    }
    
    currentPage = page;
    try {
        await fetchArticles(currentPage);
        renderPagination();
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('加载页面失败:', error);
        showError('加载页面失败，请稍后重试');
    }
}

// 显示错误信息
function showError(message) {
    const articleGrid = document.getElementById('article-grid');
    articleGrid.innerHTML = `<div class="error-message">${message}</div>`;
}