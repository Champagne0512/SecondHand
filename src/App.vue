<template>
  <div id="app">
    <!-- 统一古风导航栏 -->
    <nav class="unified-nav">
      <div class="nav-container">
        <div class="nav-brand">
          <div class="logo-wrapper">
            <span class="logo-icon">📜</span>
            <h1 class="logo">诗词雅集</h1>
          </div>
        </div>
        <div class="nav-menu">
          <router-link to="/" class="nav-link" active-class="active">首页</router-link>
          <router-link to="/poems" class="nav-link" active-class="active">诗词浏览</router-link>
          <router-link to="/search" class="nav-link" active-class="active">搜索</router-link>
          <router-link to="/profile" class="nav-link" active-class="active">个人中心</router-link>
        </div>
        <div class="nav-actions">
          <div class="auth-buttons">
            <button class="btn-login">登录</button>
            <button class="btn-register">注册</button>
          </div>
        </div>
      </div>
    </nav>
    
    <main class="app-main">
      <router-view />
    </main>
    
    <!-- 统一古风页脚 -->
    <footer class="unified-footer">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-brand">
            <span class="footer-logo-icon">📜</span>
            <h3>诗词雅集</h3>
            <p>传承中华文化，品味诗词之美</p>
          </div>
          <div class="footer-links">
            <div class="link-group">
              <h4>快速导航</h4>
              <router-link to="/">首页</router-link>
              <router-link to="/poems">诗词浏览</router-link>
              <router-link to="/search">搜索</router-link>
            </div>
            <div class="link-group">
              <h4>诗人名录</h4>
              <a href="#">李白</a>
              <a href="#">杜甫</a>
              <a href="#">苏轼</a>
              <a href="#">李清照</a>
            </div>
            <div class="link-group">
              <h4>关于我们</h4>
              <a href="#">团队介绍</a>
              <a href="#">联系我们</a>
              <a href="#">帮助中心</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2024 诗词雅集 - 让诗词之美触手可及</p>
          <div class="social-links">
            <a href="#" class="social-link">微信</a>
            <a href="#" class="social-link">微博</a>
            <a href="#" class="social-link">知乎</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
// 应用主组件
</script>

<style scoped>
/* 统一古风导航栏样式 */
.unified-nav {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  font-family: var(--font-ui);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-icon {
  font-size: 2rem;
  animation: float 3s ease-in-out infinite;
}

.logo {
  color: var(--accent-color);
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-menu {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  font-family: var(--font-ui);
}

.nav-link:hover,
.nav-link.active {
  color: var(--primary-color);
  background: rgba(139, 115, 85, 0.1);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background: var(--primary-color);
  border-radius: 50%;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.auth-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn-login,
.btn-register {
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--primary-color);
  border-radius: 25px;
  background: transparent;
  color: var(--primary-color);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-family: var(--font-ui);
}

.btn-register {
  background: var(--primary-color);
  color: white;
}

.btn-login:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px);
}

.btn-register:hover {
  background: #6d5c47;
  transform: translateY(-2px);
}

.app-main {
  min-height: calc(100vh - 160px);
  padding: 0;
}

/* 统一古风页脚样式 */
.unified-footer {
  background: linear-gradient(135deg, var(--accent-color) 0%, #1a202c 100%);
  color: white;
  padding: 3rem 0 1.5rem;
  font-family: var(--font-ui);
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.footer-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 4rem;
  margin-bottom: 2rem;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.footer-logo-icon {
  font-size: 3rem;
}

.footer-brand h3 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.footer-brand p {
  opacity: 0.8;
  line-height: 1.6;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.link-group h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #e2e8f0;
}

.link-group a {
  display: block;
  color: #a0aec0;
  text-decoration: none;
  margin-bottom: 0.5rem;
  transition: color 0.3s ease;
}

.link-group a:hover {
  color: var(--primary-color);
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 2rem;
  border-top: 1px solid #4a5568;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-link {
  color: #a0aec0;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border: 1px solid #4a5568;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.social-link:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .nav-menu {
    gap: 1rem;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .footer-links {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .footer-bottom {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>