<template>
  <div class="settings-section about-section">
    <div class="about-content">
      <div class="app-info">
        <h1 class="app-name">NovelBox</h1>
        <p class="app-description">AI辅助的小说创作工具</p>
        <p class="app-version">版本 1.0.0</p>
      </div>
      
      <div class="links">
        <div class="link-item">
          <span class="link-label">GitHub：</span>
          <a href="https://github.com/AliyahZombie/NovelBox" target="_blank" class="link-url">
            https://github.com/AliyahZombie/NovelBox
          </a>
        </div>
        <div class="link-item">
          <span class="link-label">联系作者：</span>
          <a href="mailto:aliyahzombie2024@gmail.com" class="link-url">
            aliyahzombie2024@gmail.com
          </a>
        </div>
        <div class="link-item">
          <span class="link-label">开源协议: </span>
          <span class="link-url">AGPL-3.0</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AboutSection'
}
</script>

<style scoped>
.settings-section {
  max-width: 800px;
}

.about-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.about-content {
  text-align: center;
  max-width: 600px;
  padding: 2rem;
  background: var(--card-bg);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
}

.app-name {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
  background: var(--accent-color);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-description {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  color: var(--text-secondary);
}

.app-version {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.links {
  text-align: left;
  margin-top: 2rem;
}

.link-item {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.link-label {
  font-weight: 500;
  color: var(--text-primary);
  min-width: 100px;
}

.link-url {
  color: var(--accent-color);
  text-decoration: none;
  word-break: break-all;
}

.link-url:hover {
  text-decoration: underline;
}
</style>