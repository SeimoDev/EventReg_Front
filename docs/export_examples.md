# 活动数据导出前端示例

本文档提供了使用活动数据导出API的前端实现示例。

## 示例1: 全功能导出界面

包含附件导出和文字信息导出功能的前端实现：

```html
<!DOCTYPE html>
<html>
<head>
  <title>活动数据导出工具</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input, select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .btn-group {
      display: flex;
      gap: 10px;
    }
    .btn {
      background-color: #4CAF50;
      color: white;
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      flex: 1;
    }
    .btn-files {
      background-color: #2196F3;
    }
    .btn-text {
      background-color: #4CAF50;
    }
    .btn:hover {
      opacity: 0.9;
    }
    .btn:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    .progress-container {
      margin-top: 20px;
      display: none;
    }
    .progress-bar {
      width: 100%;
      background-color: #f3f3f3;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress {
      height: 20px;
      background-color: #4CAF50;
      width: 0;
      transition: width 0.3s;
      text-align: center;
      line-height: 20px;
      color: white;
    }
    .error {
      color: red;
      margin-top: 10px;
    }
    .success {
      color: green;
      margin-top: 10px;
    }
    .hidden {
      display: none;
    }
    .competitions-list {
      margin-top: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
  </style>
</head>
<body>
  <h1>活动数据导出工具</h1>
  
  <div class="card">
    <h2>选择活动</h2>
    <div class="form-group">
      <label for="competition-select">活动:</label>
      <select id="competition-select">
        <option value="">-- 加载中 --</option>
      </select>
    </div>
    
    <div class="btn-group">
      <button id="export-files-btn" class="btn btn-files" disabled>导出附件</button>
      <button id="export-text-btn" class="btn btn-text" disabled>导出文字信息</button>
    </div>
    
    <div id="progress-container" class="progress-container">
      <h3>导出进度</h3>
      <div class="progress-bar">
        <div id="progress" class="progress">0%</div>
      </div>
      <p id="status-text">准备导出...</p>
    </div>
  </div>
  
  <div id="message"></div>
  
  <div id="competitions-list" class="competitions-list hidden">
    <h2>所有活动</h2>
    <table id="competitions-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>活动名称</th>
          <th>状态</th>
          <th>报名人数</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <!-- 活动列表将在这里动态生成 -->
      </tbody>
    </table>
  </div>
  
  <script>
    // DOM元素
    const competitionSelect = document.getElementById('competition-select');
    const exportFilesBtn = document.getElementById('export-files-btn');
    const exportTextBtn = document.getElementById('export-text-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress');
    const statusText = document.getElementById('status-text');
    const messageDiv = document.getElementById('message');
    const competitionsList = document.getElementById('competitions-list');
    const competitionsTable = document.getElementById('competitions-table').querySelector('tbody');
    
    // 假设管理员令牌已保存
    const adminToken = localStorage.getItem('admin_token');
    
    // 模拟进度更新
    function simulateProgress() {
      let progress = 0;
      progressContainer.style.display = 'block';
      progressBar.style.width = '0%';
      progressBar.textContent = '0%';
      
      const interval = setInterval(() => {
        // 模拟进度增长
        progress += Math.random() * 10;
        if (progress > 90) {
          progress = 90; // 最多到90%，剩下10%在实际完成时更新
          clearInterval(interval);
        }
        
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${Math.round(progress)}%`;
        
        if (progress < 30) {
          statusText.textContent = '正在收集数据...';
        } else if (progress < 60) {
          statusText.textContent = '正在处理数据...';
        } else {
          statusText.textContent = '正在生成文件...';
        }
      }, 500);
      
      return interval;
    }
    
    // 设置按钮状态
    function setButtonsState(disabled) {
      exportFilesBtn.disabled = disabled;
      exportTextBtn.disabled = disabled;
    }
    
    // 获取活动列表
    async function loadCompetitions() {
      try {
        setButtonsState(true);
        messageDiv.innerHTML = '<p>正在加载活动列表...</p>';
        
        const response = await fetch('/competitions/admin/list', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error('获取活动列表失败');
        }
        
        const competitions = await response.json();
        
        // 更新下拉列表
        competitionSelect.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- 请选择活动 --';
        competitionSelect.appendChild(defaultOption);
        
        competitions.forEach(comp => {
          const option = document.createElement('option');
          option.value = comp.id;
          option.textContent = `${comp.title} (ID: ${comp.id})`;
          competitionSelect.appendChild(option);
        });
        
        // 更新活动表格
        competitionsTable.innerHTML = '';
        competitions.forEach(comp => {
          const row = document.createElement('tr');
          
          const idCell = document.createElement('td');
          idCell.textContent = comp.id;
          
          const nameCell = document.createElement('td');
          nameCell.textContent = comp.title;
          
          const statusCell = document.createElement('td');
          statusCell.textContent = comp.status;
          
          const registrationsCell = document.createElement('td');
          registrationsCell.textContent = comp.registration_count || 0;
          
          const actionCell = document.createElement('td');
          
          // 附件导出按钮
          const exportFilesButton = document.createElement('button');
          exportFilesButton.textContent = '导出附件';
          exportFilesButton.className = 'btn btn-files';
          exportFilesButton.style.marginRight = '5px';
          exportFilesButton.addEventListener('click', () => {
            exportCompetitionFiles(comp.id);
          });
          
          // 文字信息导出按钮
          const exportTextButton = document.createElement('button');
          exportTextButton.textContent = '导出文字';
          exportTextButton.className = 'btn btn-text';
          exportTextButton.addEventListener('click', () => {
            exportCompetitionTextData(comp.id);
          });
          
          actionCell.appendChild(exportFilesButton);
          actionCell.appendChild(exportTextButton);
          
          row.appendChild(idCell);
          row.appendChild(nameCell);
          row.appendChild(statusCell);
          row.appendChild(registrationsCell);
          row.appendChild(actionCell);
          
          competitionsTable.appendChild(row);
        });
        
        // 显示活动列表
        competitionsList.classList.remove('hidden');
        
        // 启用导出按钮
        setButtonsState(false);
        messageDiv.innerHTML = '';
        
      } catch (error) {
        console.error('加载活动列表失败:', error);
        messageDiv.innerHTML = `<p class="error">加载活动列表失败: ${error.message}</p>`;
      }
    }
    
    // 导出活动附件
    async function exportCompetitionFiles(competitionId) {
      if (!competitionId) {
        messageDiv.innerHTML = '<p class="error">请选择活动</p>';
        return;
      }
      
      try {
        setButtonsState(true);
        messageDiv.innerHTML = '';
        statusText.textContent = '正在准备导出附件...';
        
        // 模拟进度
        const progressInterval = simulateProgress();
        
        const response = await fetch(
          `/export/competition/${competitionId}/files`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          }
        );
        
        clearInterval(progressInterval);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || '导出失败');
        }
        
        // 完成进度
        progressBar.style.width = '100%';
        progressBar.textContent = '100%';
        statusText.textContent = '附件导出完成!';
        
        // 处理文件下载
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // 获取所选活动名称
        let competitionName = 'competition';
        const selectedOption = competitionSelect.options[competitionSelect.selectedIndex];
        if (selectedOption && selectedOption.text) {
          competitionName = selectedOption.text.split('(')[0].trim();
        }
        
        a.download = `${competitionName}_附件.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        messageDiv.innerHTML = '<p class="success">附件导出成功!</p>';
      } catch (error) {
        console.error('导出失败:', error);
        progressContainer.style.display = 'none';
        messageDiv.innerHTML = `<p class="error">附件导出失败: ${error.message}</p>`;
      } finally {
        setButtonsState(false);
      }
    }
    
    // 处理令牌过期的工具函数
    async function refreshToken() {
      try {
        const oldToken = localStorage.getItem('admin_token');
        
        if (!oldToken) {
          throw new Error('找不到令牌');
        }
        
        const response = await fetch('/auth/refresh-token', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${oldToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error('刷新令牌失败');
        }
        
        const data = await response.json();
        localStorage.setItem('admin_token', data.access_token);
        
        return data.access_token;
      } catch (error) {
        console.error('刷新令牌失败:', error);
        // 跳转到登录页面
        window.location.href = '/login?expired=true';
        throw error;
      }
    }
    
    // 带有令牌自动刷新的API调用函数
    async function apiCallWithRefresh(url, options = {}) {
      // 默认添加授权头
      const token = localStorage.getItem('admin_token');
      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
      
      try {
        // 第一次尝试
        const response = await fetch(url, {
          ...options,
          headers
        });
        
        // 如果令牌过期 (401)，尝试刷新令牌后重试
        if (response.status === 401) {
          try {
            // 尝试刷新令牌
            const newToken = await refreshToken();
            
            // 使用新令牌重试请求
            const retryResponse = await fetch(url, {
              ...options,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${newToken}`
              }
            });
            
            return retryResponse;
          } catch (error) {
            console.error('令牌刷新失败:', error);
            throw new Error('认证失败，请重新登录');
          }
        }
        
        return response;
      } catch (error) {
        console.error('API请求失败:', error);
        throw error;
      }
    }
    
    // 示例：导出活动文字信息（带令牌刷新）
    async function exportCompetitionTextData(competitionId) {
      try {
        // 显示加载提示
        statusText.textContent = '准备导出...';
        progressContainer.style.display = 'block';
        
        // 启动进度模拟
        const progressInterval = simulateProgress();
        
        try {
          // 使用支持令牌刷新的API调用
          const response = await apiCallWithRefresh(
            `/export/competition/${competitionId}/text-data`,
            { method: 'GET' }
          );
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '导出失败');
          }
          
          // 完成进度条
          clearInterval(progressInterval);
          progressBar.style.width = '100%';
          progressBar.textContent = '100%';
          statusText.textContent = '导出完成!';
          
          // 处理文件下载
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `活动${competitionId}文字信息.xlsx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          // 显示成功消息
          messageDiv.innerHTML = '<p class="success">文字信息导出成功!</p>';
          
        } catch (error) {
          // 清除进度模拟
          clearInterval(progressInterval);
          
          // 显示错误
          statusText.textContent = '导出失败';
          messageDiv.innerHTML = `<p class="error">导出失败: ${error.message}</p>`;
          console.error('导出活动文字信息失败:', error);
        }
        
      } catch (error) {
        console.error('导出文字信息失败:', error);
        messageDiv.innerHTML = `<p class="error">导出失败: ${error.message}</p>`;
      }
    }
    
    // 绑定事件
    exportFilesBtn.addEventListener('click', () => {
      const competitionId = competitionSelect.value;
      exportCompetitionFiles(competitionId);
    });
    
    exportTextBtn.addEventListener('click', () => {
      const competitionId = competitionSelect.value;
      exportCompetitionTextData(competitionId);
    });
    
    // 初始加载
    document.addEventListener('DOMContentLoaded', () => {
      loadCompetitions();
    });
  </script>
</body>
</html>
```

## 使用方法

1. 将上述代码保存为HTML文件
2. 确保您的后端API已正确配置并运行
3. 在浏览器中打开HTML文件
4. 登录后将自动加载活动列表
5. 选择要导出的活动并点击相应的导出按钮:
   - "导出附件" - 下载包含所有上传文件的ZIP包
   - "导出文字信息" - 下载包含所有文本字段数据的Excel文件

## 注意事项

1. 示例代码假设管理员已登录并将令牌保存在localStorage中
2. 本示例使用模拟进度条，实际导出过程可能需要较长时间
3. 对于大型数据集，建议在服务器端实现异步导出流程
4. 请根据实际项目需求调整UI和功能 