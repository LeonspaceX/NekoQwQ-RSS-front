// 后端API基础URL
const API_BASE_URL = 'https://get-rss.nekoqwq.space';

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 初始化页面
    initPage();
});

// 初始化页面
async function initPage() {
    try {
        // 获取文章ID
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        
        // 如果没有文章ID，跳转回首页
        if (!articleId) {
            window.location.href = 'index.html';
            return;
        }
        
        // 获取文章内容
        await fetchArticleContent(articleId);
    } catch (error) {
        console.error('初始化页面失败:', error);
        showError('加载文章失败，请稍后重试');
    }
}

// 获取文章内容
async function fetchArticleContent(articleId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/get/content/${articleId}`);
        if (!response.ok) {
            if (response.status === 404) {
                show404Page();
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
        
        const article = xmlDoc.querySelector('article');
        if (!article) {
            show404Page();
            return;
        }
        
        renderArticle(article);
    } catch (error) {
        console.error('获取文章内容失败:', error);
        showError('加载文章失败，请稍后重试');
    }
}

// 渲染文章
function renderArticle(article) {
    const title = article.querySelector('title')?.textContent || '无标题';
    const publishTime = article.querySelector('publish_time')?.textContent || '2099-01-01';
    const summary = article.querySelector('summary')?.textContent || '无摘要';
    const source = article.querySelector('source')?.textContent || 'RSS订阅';
    const originalLink = article.querySelector('original_link')?.textContent || '#';
    const content = article.querySelector('content')?.textContent || '无内容';
    
    // 设置页面标题
    document.title = `${title} - NekoQwQ RSS Reader`;
    
    // 更新文章内容
    document.getElementById('article-title').textContent = title;
    document.getElementById('article-date').textContent = publishTime;
    document.getElementById('article-author').textContent = source;
    document.getElementById('article-link').href = originalLink;
    // 摘要部分已从HTML中移除，不再需要更新
    
    // 处理文章内容
    const articleBody = document.getElementById('article-body');
    
    // 尝试解析HTML内容
    try {
        // 创建一个安全的HTML解析器
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = content;
        
        // 清除可能的脚本标签
        const scripts = contentDiv.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        
        // 设置内容
        articleBody.innerHTML = contentDiv.innerHTML;
        
        // 处理所有链接，添加target="_blank"
        const links = articleBody.querySelectorAll('a');
        links.forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });
        
        // 处理图片，添加加载失败处理
        const images = articleBody.querySelectorAll('img');
        images.forEach(img => {
            img.onerror = function() {
                this.style.display = 'none';
            };
        });
    } catch (error) {
        console.error('解析文章内容失败:', error);
        articleBody.textContent = content;
    }
}

// 显示404页面
function show404Page() {
    const articleContent = document.getElementById('article-content');
    articleContent.innerHTML = `
        <div class="error-page">
            <h1>404</h1>
            <p>文章不存在或已被删除</p>
            <a href="index.html" class="back-link">返回首页</a>
        </div>
    `;
    
    // 添加404页面样式
    const style = document.createElement('style');
    style.textContent = `
        .error-page {
            text-align: center;
            padding: 50px 0;
        }
        .error-page h1 {
            font-size: 6rem;
            color: var(--overlay1);
            margin-bottom: 20px;
        }
        .error-page p {
            font-size: 1.5rem;
            color: var(--overlay0);
            margin-bottom: 30px;
        }
        .error-page .back-link {
            display: inline-block;
            padding: 10px 20px;
            background-color: var(--blue);
            color: white;
            text-decoration: none;
            border-radius: var(--radius);
            transition: background-color 0.2s;
        }
        .error-page .back-link:hover {
            background-color: var(--lavender);
        }
    `;
    document.head.appendChild(style);
}

// 显示错误信息
function showError(message) {
    const articleContent = document.getElementById('article-content');
    articleContent.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <a href="index.html" class="back-link">返回首页</a>
        </div>
    `;
}