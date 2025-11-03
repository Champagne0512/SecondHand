<template>
  <div class="ai-assistant-enhanced-view">
    <!-- 全局导航 -->
    <GlobalNavigation />
    
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>🤖 AI智能助手</h1>
        <p>智能化的校园二手交易体验，让AI为您保驾护航</p>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-number">{{ stats.totalUsers }}</span>
            <span class="stat-label">服务用户</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ stats.totalQueries }}</span>
            <span class="stat-label">处理请求</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ stats.satisfactionRate }}%</span>
            <span class="stat-label">满意度</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 内置AI状态指示 -->
    <div class="ai-status-bar">
      <el-alert
        title="AI智能助手已激活"
        type="success"
        description="AI助手已准备就绪，为您提供智能化的二手交易服务"
        show-icon
        :closable="false"
      />
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧：功能面板 -->
      <div class="left-panel">
        <!-- 快速功能卡片 -->
        <div class="feature-cards">
          <div 
            v-for="feature in enhancedFeatures" 
            :key="feature.id"
            class="feature-card"
            :class="{ 'active': activeFeature === feature.id }"
            @click="activateFeature(feature)"
          >
            <div class="feature-icon">{{ feature.icon }}</div>
            <div class="feature-info">
              <h3>{{ feature.name }}</h3>
              <p>{{ feature.description }}</p>
            </div>
            <div class="feature-badge" v-if="feature.badge">{{ feature.badge }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧：交互区域 -->
      <div class="right-panel">
        <!-- 功能展示区域 -->
        <div class="feature-display">
          <!-- 商品描述生成器 -->
          <div v-if="activeFeature === 'description'" class="feature-content">
            <div class="feature-header">
              <h2>✍️ 智能商品描述生成</h2>
              <p>AI为您生成专业、吸引人的商品描述</p>
            </div>
            
            <div class="feature-form">
              <el-form :model="descriptionForm" label-width="100px">
                <el-form-item label="商品分类">
                  <el-cascader
                    v-model="descriptionForm.category"
                    :options="categoryOptions"
                    placeholder="选择商品分类"
                  />
                </el-form-item>
                
                <el-form-item label="商品名称">
                  <el-input v-model="descriptionForm.name" placeholder="如：iPhone 12 Pro" />
                </el-form-item>
                
                <el-form-item label="品牌型号">
                  <el-input v-model="descriptionForm.brand" placeholder="如：Apple iPhone 12 Pro 128GB" />
                </el-form-item>
                
                <el-form-item label="商品成色">
                  <el-radio-group v-model="descriptionForm.condition">
                    <el-radio label="全新">全新</el-radio>
                    <el-radio label="九成新">九成新</el-radio>
                    <el-radio label="八成新">八成新</el-radio>
                    <el-radio label="七成新">七成新</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item label="使用时间">
                  <el-input-number v-model="descriptionForm.usageMonths" :min="0" :max="60" />
                  <span style="margin-left: 8px; color: #909399;">个月</span>
                </el-form-item>
                
                <el-form-item label="原价">
                  <el-input-number v-model="descriptionForm.originalPrice" :min="0" :step="100" />
                  <span style="margin-left: 8px; color: #909399;">元</span>
                </el-form-item>
                
                <el-form-item label="转让原因">
                  <el-select v-model="descriptionForm.reason" placeholder="选择转让原因">
                    <el-option label="毕业离校" value="毕业离校" />
                    <el-option label="换新升级" value="换新升级" />
                    <el-option label="闲置转让" value="闲置转让" />
                    <el-option label="急需用钱" value="急需用钱" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="商品特色">
                  <el-checkbox-group v-model="descriptionForm.features">
                    <el-checkbox label="功能齐全">功能齐全</el-checkbox>
                    <el-checkbox label="外观精美">外观精美</el-checkbox>
                    <el-checkbox label="品质优良">品质优良</el-checkbox>
                    <el-checkbox label="性价比">性价比高</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                
                <el-form-item label="补充说明">
                  <el-input
                    v-model="descriptionForm.notes"
                    type="textarea"
                    :rows="3"
                    placeholder="其他需要说明的信息..."
                  />
                </el-form-item>
              </el-form>
              
              <div class="form-actions">
                <el-button 
                  type="primary" 
                  size="large"
                  :loading="isGeneratingDescription"
                  @click="generateDescription"
                >
                  生成描述
                </el-button>
                <el-button 
                  v-if="generatedDescription" 
                  type="success" 
                  size="large"
                  @click="copyDescription"
                >
                  复制描述
                </el-button>
                <el-button 
                  v-if="generatedDescription" 
                  type="info" 
                  size="large"
                  @click="regenerateDescription"
                >
                  重新生成
                </el-button>
              </div>
            </div>
            
            <!-- 生成结果 -->
            <div v-if="generatedDescription" class="generation-result">
              <div class="result-header">
                <h3>生成的商品描述</h3>
                <el-tag type="success">AI生成</el-tag>
              </div>
              <div class="result-content">
                <pre>{{ generatedDescription }}</pre>
              </div>
            </div>
          </div>

          <!-- 价格分析工具 -->
          <div v-else-if="activeFeature === 'price'" class="feature-content">
            <div class="feature-header">
              <h2>💰 智能价格分析</h2>
              <p>基于市场数据为您提供专业的价格建议</p>
            </div>
            
            <div class="price-analysis-workspace">
              <div class="analysis-input">
                <el-form :model="priceForm" label-width="120px">
                  <el-form-item label="商品分类">
                    <el-cascader
                      v-model="priceForm.category"
                      :options="categoryOptions"
                      placeholder="选择商品分类"
                    />
                  </el-form-item>
                  
                  <el-form-item label="商品成色">
                    <el-radio-group v-model="priceForm.condition">
                      <el-radio label="全新">全新</el-radio>
                      <el-radio label="九成新">九成新</el-radio>
                      <el-radio label="八成新">八成新</el-radio>
                      <el-radio label="七成新">七成新</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  
                  <el-form-item label="使用时间">
                    <el-input-number v-model="priceForm.usageMonths" :min="0" :max="60" />
                    <span style="margin-left: 8px; color: #909399;">个月</span>
                  </el-form-item>
                  
                  <el-form-item label="原价">
                    <el-input-number v-model="priceForm.originalPrice" :min="0" :step="100" />
                    <span style="margin-left: 8px; color: #909399;">元</span>
                  </el-form-item>
                  
                  <el-form-item label="期望售价">
                    <el-input-number v-model="priceForm.targetPrice" :min="0" :step="100" />
                    <span style="margin-left: 8px; color: #909399;">元</span>
                  </el-form-item>
                </el-form>
                
                <div class="form-actions">
                  <el-button 
                    type="primary" 
                    size="large"
                    :loading="isAnalyzingPrice"
                    @click="analyzePrice"
                  >
                    分析价格
                  </el-button>
                  <el-button 
                    v-if="priceAnalysisResult" 
                    type="info" 
                    size="large"
                    @click="getMarketTrends"
                  >
                    查看趋势
                  </el-button>
                </div>
              </div>
              
              <!-- 分析结果 -->
              <div v-if="priceAnalysisResult" class="analysis-result">
                <div class="result-summary">
                  <div class="price-suggestion">
                    <div class="suggestion-item">
                      <span class="label">建议售价</span>
                      <span class="price">¥{{ priceAnalysisResult.suggestedPrice }}</span>
                    </div>
                    <div class="suggestion-item">
                      <span class="label">价格区间</span>
                      <span class="range">¥{{ priceAnalysisResult.priceRange.min }} - ¥{{ priceAnalysisResult.priceRange.max }}</span>
                    </div>
                  </div>
                  <div class="confidence-score">
                    <span class="label">分析置信度</span>
                    <el-progress 
                      :percentage="priceAnalysisResult.confidence" 
                      :status="getConfidenceStatus(priceAnalysisResult.confidence)"
                    />
                  </div>
                </div>
                
                <div class="result-details">
                  <div class="factors-section">
                    <h4>影响因素分析</h4>
                    <ul>
                      <li v-for="factor in priceAnalysisResult.factors" :key="factor">
                        {{ factor }}
                      </li>
                    </ul>
                  </div>
                  
                  <div class="market-data-section" v-if="priceAnalysisResult.marketData">
                    <h4>市场数据参考</h4>
                    <div class="market-stats">
                      <div class="stat">
                        <span class="stat-label">同类商品数量</span>
                        <span class="stat-value">{{ priceAnalysisResult.marketData.similarProductsCount }}</span>
                      </div>
                      <div class="stat">
                        <span class="stat-label">市场平均价格</span>
                        <span class="stat-value">¥{{ priceAnalysisResult.marketData.averageMarketPrice }}</span>
                      </div>
                      <div class="stat">
                        <span class="stat-label">市场价格范围</span>
                        <span class="stat-value">¥{{ priceAnalysisResult.marketData.priceRange.min }} - ¥{{ priceAnalysisResult.marketData.priceRange.max }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 智能搜索 -->
          <div v-else-if="activeFeature === 'search'" class="feature-content">
            <div class="feature-header">
              <h2>🔍 智能商品搜索</h2>
              <p>AI理解您的需求，精准推荐相关商品</p>
            </div>
            
            <div class="smart-search-interface">
              <div class="search-input-area">
                <div class="voice-search-option">
                  <el-button 
                    :type="isVoiceSearch ? 'primary' : 'default'"
                    @click="toggleVoiceSearch"
                  >
                    <el-icon><Microphone /></el-icon>
                    {{ isVoiceSearch ? '正在听取...' : '语音搜索' }}
                  </el-button>
                </div>
                
                <el-input
                  v-model="searchQuery"
                  type="textarea"
                  :rows="3"
                  placeholder="告诉我您想找什么商品，比如：
• 我想买一台适合编程的笔记本电脑，预算5000左右
• 推荐一些考研用的数学教材
• 有没有适合宿舍用的台灯"
                  class="smart-search-input"
                />
                
                <div class="search-filters">
                  <el-form :inline="true" :model="searchFilters">
                    <el-form-item label="价格区间">
                      <el-input-number 
                        v-model="searchFilters.minPrice" 
                        :min="0" 
                        placeholder="最低价"
                        style="width: 120px"
                      />
                      <span style="margin: 0 8px;">-</span>
                      <el-input-number 
                        v-model="searchFilters.maxPrice" 
                        :min="0" 
                        placeholder="最高价"
                        style="width: 120px"
                      />
                    </el-form-item>
                    
                    <el-form-item label="商品成色">
                      <el-select v-model="searchFilters.condition" placeholder="不限" style="width: 100px">
                        <el-option label="不限" value="" />
                        <el-option label="全新" value="全新" />
                        <el-option label="九成新" value="九成新" />
                        <el-option label="八成新" value="八成新" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="排序方式">
                      <el-select v-model="searchFilters.sortBy" style="width: 120px">
                        <el-option label="智能推荐" value="relevance" />
                        <el-option label="价格从低到高" value="price_asc" />
                        <el-option label="价格从高到低" value="price_desc" />
                        <el-option label="最新发布" value="newest" />
                      </el-select>
                    </el-form-item>
                  </el-form>
                </div>
                
                <div class="search-actions">
                  <el-button 
                    type="primary" 
                    size="large"
                    :loading="isSearching"
                    @click="performSmartSearch"
                  >
                    <el-icon><Search /></el-icon>
                    智能搜索
                  </el-button>
                  <el-button 
                    size="large"
                    @click="showSearchTips"
                  >
                    搜索技巧
                  </el-button>
                </div>
              </div>
              
              <!-- 搜索结果 -->
              <div v-if="searchResults" class="search-results">
                <div class="results-header">
                  <h3>搜索结果</h3>
                  <div class="results-stats">
                    <span>找到 {{ searchResults.length }} 个相关商品</span>
                    <el-tag type="info">AI推荐</el-tag>
                  </div>
                </div>
                
                <div class="results-list">
                  <div 
                    v-for="result in searchResults" 
                    :key="result.id"
                    class="result-item"
                  >
                    <div class="item-image">
                      <img :src="result.image || '/placeholder-product.png'" :alt="result.name" />
                    </div>
                    <div class="item-info">
                      <h4>{{ result.name }}</h4>
                      <p class="item-description">{{ result.description }}</p>
                      <div class="item-meta">
                        <span class="price">¥{{ result.price }}</span>
                        <span class="condition">{{ result.condition }}</span>
                        <span class="location">{{ result.location }}</span>
                      </div>
                      <div class="item-tags">
                        <el-tag 
                          v-for="tag in result.tags" 
                          :key="tag"
                          size="small"
                          type="info"
                        >
                          {{ tag }}
                        </el-tag>
                      </div>
                    </div>
                    <div class="item-actions">
                      <el-button type="primary" size="small" @click="viewProduct(result)">
                        查看详情
                      </el-button>
                      <el-button size="small" @click="contactSeller(result)">
                        联系卖家
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 安全检测 -->
          <div v-else-if="activeFeature === 'safety'" class="feature-content">
            <div class="feature-header">
              <h2>🛡️ 交易安全检测</h2>
              <p>AI智能识别交易风险，保障您的交易安全</p>
            </div>
            
            <div class="safety-check-workspace">
              <div class="check-modes">
                <el-radio-group v-model="safetyCheckMode" size="large">
                  <el-radio-button label="chat">聊天记录分析</el-radio-button>
                  <el-radio-button label="user">用户信誉检测</el-radio-button>
                  <el-radio-button label="product">商品信息验证</el-radio-button>
                  <el-radio-button label="transaction">交易风险评估</el-radio-button>
                </el-radio-group>
              </div>
              
              <!-- 聊天记录分析 -->
              <div v-if="safetyCheckMode === 'chat'" class="check-content">
                <div class="chat-analysis-input">
                  <h3>聊天记录风险分析</h3>
                  <p>将您的聊天记录粘贴到这里，AI会分析潜在的风险</p>
                  
                  <el-input
                    v-model="chatHistoryText"
                    type="textarea"
                    :rows="8"
                    placeholder="请粘贴聊天记录，例如：
买家：这个商品最低多少钱？
卖家：标价500，最低450
买家：好的，我先付200定金，剩下的见面给
卖家：可以的，我支付宝账号是..."
                  />
                  
                  <div class="analysis-actions">
                    <el-button 
                      type="primary" 
                      size="large"
                      :loading="isAnalyzingSafety"
                      @click="analyzeChatSafety"
                    >
                      分析风险
                    </el-button>
                    <el-upload
                      class="upload-chat"
                      action="#"
                      :auto-upload="false"
                      :show-file-list="false"
                      :on-change="handleChatFileUpload"
                    >
                      <el-button size="large">
                        <el-icon><Upload /></el-icon>
                        上传聊天记录
                      </el-button>
                    </el-upload>
                  </div>
                </div>
              </div>
              
              <!-- 用户信誉检测 -->
              <div v-else-if="safetyCheckMode === 'user'" class="check-content">
                <div class="user-verification-input">
                  <h3>用户信誉检测</h3>
                  <p>输入用户信息进行信誉评估</p>
                  
                  <el-form :model="userCheckForm" label-width="120px">
                    <el-form-item label="用户ID">
                      <el-input v-model="userCheckForm.userId" placeholder="输入用户ID或用户名" />
                    </el-form-item>
                    
                    <el-form-item label="注册时间">
                      <el-date-picker 
                        v-model="userCheckForm.registrationDate" 
                        type="date" 
                        placeholder="选择注册时间"
                      />
                    </el-form-item>
                    
                    <el-form-item label="交易记录">
                      <el-input-number 
                        v-model="userCheckForm.transactionCount" 
                        :min="0" 
                        placeholder="交易次数"
                      />
                    </el-form-item>
                    
                    <el-form-item label="评价分数">
                      <el-rate 
                        v-model="userCheckForm.rating" 
                        show-score 
                        text-color="#ff9900"
                        score-template="{value}分"
                      />
                    </el-form-item>
                    
                    <el-form-item label="可疑行为">
                      <el-checkbox-group v-model="userCheckForm.suspiciousBehaviors">
                        <el-checkbox label="要求预付定金">要求预付定金</el-checkbox>
                        <el-checkbox label="拒绝当面交易">拒绝当面交易</el-checkbox>
                        <el-checkbox label="价格异常低廉">价格异常低廉</el-checkbox>
                        <el-checkbox label="催促快速成交">催促快速成交</el-checkbox>
                        <el-checkbox label="提供虚假信息">提供虚假信息</el-checkbox>
                      </el-checkbox-group>
                    </el-form-item>
                  </el-form>
                  
                  <div class="analysis-actions">
                    <el-button 
                      type="primary" 
                      size="large"
                      :loading="isAnalyzingSafety"
                      @click="analyzeUserSafety"
                    >
                      检测信誉
                    </el-button>
                  </div>
                </div>
              </div>
              
              <!-- 分析结果 -->
              <div v-if="safetyAnalysisResult" class="safety-result">
                <div class="risk-assessment">
                  <div class="risk-level" :class="`risk-${safetyAnalysisResult.riskLevel}`">
                    <span class="risk-label">风险等级</span>
                    <span class="risk-value">{{ safetyAnalysisResult.riskLevelText }}</span>
                  </div>
                  <div class="risk-score">
                    <span class="score-label">风险评分</span>
                    <el-progress 
                      :percentage="safetyAnalysisResult.riskScore" 
                      :status="getRiskStatus(safetyAnalysisResult.riskScore)"
                    />
                  </div>
                </div>
                
                <div class="risk-details">
                  <div class="risk-factors">
                    <h4>风险因素</h4>
                    <ul>
                      <li v-for="factor in safetyAnalysisResult.riskFactors" :key="factor">
                        {{ factor }}
                      </li>
                    </ul>
                  </div>
                  
                  <div class="safety-recommendations">
                    <h4>安全建议</h4>
                    <ol>
                      <li v-for="recommendation in safetyAnalysisResult.recommendations" :key="recommendation">
                        {{ recommendation }}
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 个性化推荐 -->
          <div v-else-if="activeFeature === 'recommend'" class="feature-content">
            <div class="feature-header">
              <h2>⭐ 个性化推荐</h2>
              <p>基于您的偏好和行为，为您推荐最合适的商品</p>
            </div>
            
            <div class="recommendation-interface">
              <div class="preference-settings">
                <h3>偏好设置</h3>
                <p>告诉我们您的偏好，让我们为您提供更精准的推荐</p>
                
                <el-form :model="preferenceForm" label-width="140px">
                  <el-form-item label="感兴趣分类">
                    <el-cascader
                      v-model="preferenceForm.categories"
                      :options="categoryOptions"
                      multiple
                      placeholder="选择感兴趣的分类"
                      style="width: 100%"
                    />
                  </el-form-item>
                  
                  <el-form-item label="价格偏好">
                    <el-slider
                      v-model="preferenceForm.priceRange"
                      range
                      :min="0"
                      :max="10000"
                      :step="100"
                      show-input
                    />
                  </el-form-item>
                  
                  <el-form-item label="成色要求">
                    <el-checkbox-group v-model="preferenceForm.conditions">
                      <el-checkbox label="全新">全新</el-checkbox>
                      <el-checkbox label="九成新">九成新</el-checkbox>
                      <el-checkbox label="八成新">八成新</el-checkbox>
                      <el-checkbox label="七成新">七成新</el-checkbox>
                    </el-checkbox-group>
                  </el-form-item>
                  
                  <el-form-item label="品牌偏好">
                    <el-select
                      v-model="preferenceForm.brands"
                      multiple
                      filterable
                      allow-create
                      placeholder="输入您偏好的品牌"
                      style="width: 100%"
                    >
                      <el-option label="Apple" value="Apple" />
                      <el-option label="Samsung" value="Samsung" />
                      <el-option label="Huawei" value="Huawei" />
                      <el-option label="Xiaomi" value="Xiaomi" />
                    </el-select>
                  </el-form-item>
                  
                  <el-form-item label="交易偏好">
                    <el-radio-group v-model="preferenceForm.transactionType">
                      <el-radio label="any">不限</el-radio>
                      <el-radio label="face_to_face">当面交易</el-radio>
                      <el-radio label="campus_only">校内交易</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-form>
                
                <div class="preference-actions">
                  <el-button 
                    type="primary" 
                    size="large"
                    @click="updatePreferences"
                  >
                    更新偏好
                  </el-button>
                  <el-button 
                    size="large"
                    @click="getRecommendations"
                  >
                    获取推荐
                  </el-button>
                </div>
              </div>
              
              <!-- 推荐结果 -->
              <div v-if="recommendations" class="recommendations-result">
                <div class="recommendations-header">
                  <h3>为您推荐</h3>
                  <div class="recommendations-controls">
                    <el-radio-group v-model="recommendationType" size="small">
                      <el-radio-button label="personalized">个性化</el-radio-button>
                      <el-radio-button label="trending">热门商品</el-radio-button>
                      <el-radio-button label="newest">最新发布</el-radio-button>
                      <el-radio-button label="price_drop">降价商品</el-radio-button>
                    </el-radio-group>
                  </div>
                </div>
                
                <div class="recommendations-list">
                  <div 
                    v-for="item in recommendations" 
                    :key="item.id"
                    class="recommendation-item"
                  >
                    <div class="recommendation-reason">
                      <el-tag size="small" type="success">{{ item.reason }}</el-tag>
                    </div>
                    <div class="item-content">
                      <div class="item-image">
                        <img :src="item.image" :alt="item.name" />
                      </div>
                      <div class="item-details">
                        <h4>{{ item.name }}</h4>
                        <p class="item-description">{{ item.description }}</p>
                        <div class="item-meta">
                          <span class="price">¥{{ item.price }}</span>
                          <span class="condition">{{ item.condition }}</span>
                          <span class="discount" v-if="item.originalPrice">
                            比原价省 ¥{{ item.originalPrice - item.price }}
                          </span>
                        </div>
                      </div>
                      <div class="item-actions">
                        <el-button type="primary" size="small" @click="viewProduct(item)">
                          查看详情
                        </el-button>
                        <el-button size="small" @click="addToFavorites(item)">
                          收藏
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 默认欢迎页面 -->
          <div v-else class="welcome-content">
            <div class="welcome-illustration">
              <div class="ai-robot">
                <el-icon size="64"><Robot /></el-icon>
              </div>
              <h2>欢迎使用AI智能助手</h2>
              <p>选择左侧的功能，开始您的智能化二手交易体验</p>
            </div>
            
            <div class="quick-start-tips">
              <h3>🚀 快速开始</h3>
              <div class="tips-grid">
                <div class="tip-card" @click="activateFeature(enhancedFeatures[0])">
                  <div class="tip-icon">
                    <el-icon size="32"><Edit /></el-icon>
                  </div>
                  <h4>生成商品描述</h4>
                  <p>不会写商品描述？AI帮您写出专业文案</p>
                </div>
                <div class="tip-card" @click="activateFeature(enhancedFeatures[1])">
                  <div class="tip-icon">
                    <el-icon size="32"><Money /></el-icon>
                  </div>
                  <h4>分析合理价格</h4>
                  <p>不知道定价多少？AI基于市场数据分析</p>
                </div>
                <div class="tip-card" @click="activateFeature(enhancedFeatures[2])">
                  <div class="tip-icon">
                    <el-icon size="32"><Search /></el-icon>
                  </div>
                  <h4>智能搜索商品</h4>
                  <p>用自然语言描述需求，AI帮您找到心仪商品</p>
                </div>
                <div class="tip-card" @click="activateFeature(enhancedFeatures[3])">
                  <div class="tip-icon">
                    <el-icon size="32"><Shield /></el-icon>
                  </div>
                  <h4>检测交易安全</h4>
                  <p>AI识别潜在风险，让您的交易更安全</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI聊天区域 -->
        <div class="chat-section">
          <div class="chat-header">
            <h3><el-icon><ChatDotRound /></el-icon> AI助手对话</h3>
            <div class="chat-controls">
              <el-button size="small" @click="clearChat">
                <el-icon><Delete /></el-icon>
                清空对话
              </el-button>
              <el-button size="small" @click="showChatTips">
                <el-icon><QuestionFilled /></el-icon>
                使用提示
              </el-button>
            </div>
          </div>
          
          <div class="chat-container">
            <div class="chat-messages" ref="chatMessagesContainer">
              <div 
                v-for="message in chatMessages" 
                :key="message.id"
                class="chat-message"
                :class="message.type"
              >
                <div class="message-avatar">
                  {{ message.type === 'user' ? '👤' : '🤖' }}
                </div>
                <div class="message-content">
                  <div class="message-bubble">
                    {{ message.content }}
                  </div>
                  <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                </div>
              </div>
              
              <div v-if="isAIMThinking" class="typing-indicator">
                <div class="typing-content">
                  <span class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                  <span>AI正在思考...</span>
                </div>
              </div>
            </div>
            
            <div class="chat-input-area">
              <div class="input-toolbar">
                <el-button 
                  size="small" 
                  :type="isVoiceInput ? 'primary' : 'default'"
                  @click="toggleVoiceInput"
                >
                  <el-icon><Microphone /></el-icon>
                </el-button>
                <el-button size="small" @click="showQuickActions">
                  <el-icon><Lightning /></el-icon>
                </el-button>
                <el-button size="small" @click="showEmojiPicker">
                  <el-icon><ChatLineRound /></el-icon>
                </el-button>
              </div>
              
              <div class="input-container">
                <textarea
                  v-model="currentMessage"
                  :placeholder="isVoiceInput ? '点击开始语音输入...' : '输入消息，AI助手随时为您服务...'"
                  class="chat-input"
                  rows="1"
                  @keydown.enter.prevent="sendMessage"
                  @input="adjustInputHeight"
                ></textarea>
                <el-button 
                  type="primary" 
                  @click="sendMessage"
                  :disabled="!currentMessage.trim() || isAIMThinking"
                  class="send-button"
                >
                  <el-icon><Position /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 悬浮AI助手 -->
    <FloatingAIAssistant />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useAIAssistantEnhancedStore } from '@/stores/ai-assistant-enhanced'
import { usePriceAnalyticsStore } from '@/stores/price-analytics'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import FloatingAIAssistant from '@/components/FloatingAIAssistant.vue'
import AIConfigPanel from '@/components/AIConfigPanel.vue'
import {
  Search,
  Microphone,
  Delete,
  QuestionFilled,
  Lightning,
  ChatLineRound,
  Position,
  Upload,
  Key,
  Link,
  Connection
} from '@element-plus/icons-vue'

const aiStore = useAIAssistantEnhancedStore()
const priceStore = usePriceAnalyticsStore()

// 统计数据
const stats = reactive({
  totalUsers: 1247,
  totalQueries: 8563,
  satisfactionRate: 96
})

// 功能状态
const activeFeature = ref('')
const isAIMThinking = ref(false)
const isVoiceInput = ref(false)
const isVoiceSearch = ref(false)

// 增强功能列表
const enhancedFeatures = [
  {
    id: 'description',
    name: '智能描述生成',
    description: 'AI生成专业商品描述',
    icon: 'Edit',
    badge: '热门'
  },
  {
    id: 'price',
    name: '智能价格分析',
    description: '基于市场数据的价格建议',
    icon: 'Money',
    badge: '精准'
  },
  {
    id: 'search',
    name: '智能商品搜索',
    description: '自然语言理解搜索',
    icon: 'Search',
    badge: 'AI'
  },
  {
    id: 'safety',
    name: '交易安全检测',
    description: 'AI识别交易风险',
    icon: 'Shield',
    badge: '安全'
  },
  {
    id: 'recommend',
    name: '个性化推荐',
    description: '基于偏好的智能推荐',
    icon: '⭐',
    badge: '个性'
  }
]

// 分类选项
const categoryOptions = [
  {
    value: 'electronics',
    label: '电子产品',
    children: [
      { value: 'phone', label: '手机通讯' },
      { value: 'computer', label: '电脑数码' },
      { value: 'tablet', label: '平板设备' },
      { value: 'accessories', label: '配件周边' }
    ]
  },
  {
    value: 'books',
    label: '图书教材',
    children: [
      { value: 'textbook', label: '教材教辅' },
      { value: 'novel', label: '小说文学' },
      { value: 'magazine', label: '杂志期刊' },
      { value: 'reference', label: '工具书籍' }
    ]
  },
  {
    value: 'daily',
    label: '生活用品',
    children: [
      { value: 'furniture', label: '家具用品' },
      { value: 'kitchen', label: '厨房用品' },
      { value: 'decoration', label: '装饰用品' },
      { value: 'storage', label: '收纳用品' }
    ]
  },
  {
    value: 'sports',
    label: '运动器材',
    children: [
      { value: 'fitness', label: '健身器械' },
      { value: 'basketball', label: '篮球用品' },
      { value: 'badminton', label: '羽毛球用品' },
      { value: 'running', label: '跑步用品' }
    ]
  },
  {
    value: 'clothing',
    label: '服装鞋帽',
    children: [
      { value: 'mens', label: '男士服装' },
      { value: 'womens', label: '女士服装' },
      { value: 'shoes', label: '鞋靴' },
      { value: 'accessories', label: '配饰' }
    ]
  }
]

// 商品描述表单
const descriptionForm = reactive({
  category: [],
  name: '',
  brand: '',
  condition: '九成新',
  usageMonths: 6,
  originalPrice: 0,
  reason: '闲置转让',
  features: [],
  notes: ''
})

// 价格分析表单
const priceForm = reactive({
  category: [],
  condition: '九成新',
  usageMonths: 6,
  originalPrice: 0,
  targetPrice: 0
})

// 智能搜索
const searchQuery = ref('')
const searchFilters = reactive({
  minPrice: 0,
  maxPrice: 10000,
  condition: '',
  sortBy: 'relevance'
})

// 安全检测
const safetyCheckMode = ref('chat')
const chatHistoryText = ref('')
const userCheckForm = reactive({
  userId: '',
  registrationDate: '',
  transactionCount: 0,
  rating: 5,
  suspiciousBehaviors: []
})

// 个性化推荐
const preferenceForm = reactive({
  categories: [],
  priceRange: [0, 5000],
  conditions: ['九成新', '八成新'],
  brands: [],
  transactionType: 'any'
})

// 聊天功能
const currentMessage = ref('')
const chatMessages = ref([
  {
    id: 1,
    type: 'ai',
    content: '您好！我是您的AI助手，有什么可以帮助您的吗？',
    timestamp: new Date()
  }
])

// 加载状态
const isGeneratingDescription = ref(false)
const isAnalyzingPrice = ref(false)
const isSearching = ref(false)
const isAnalyzingSafety = ref(false)

// 结果数据
const generatedDescription = ref('')
const priceAnalysisResult = ref<any>(null)
const searchResults = ref<any[]>([])
const safetyAnalysisResult = ref<any>(null)
const recommendations = ref<any[]>([])

// 方法
const activateFeature = (feature: any) => {
  activeFeature.value = feature.id
}

const generateDescription = async () => {
  if (!descriptionForm.name || !descriptionForm.category.length) {
    ElMessage.warning('请填写商品名称和分类')
    return
  }

  isGeneratingDescription.value = true
  try {
    const productInfo = {
      category: descriptionForm.category.join('/'),
      name: descriptionForm.name,
      brand: descriptionForm.brand,
      condition: descriptionForm.condition,
      usageTime: descriptionForm.usageMonths,
      originalPrice: descriptionForm.originalPrice,
      reason: descriptionForm.reason,
      features: descriptionForm.features,
      notes: descriptionForm.notes
    }

    const description = await aiStore.generateProductDescription(productInfo)
    generatedDescription.value = description
    
    // 添加到聊天历史
    addChatMessage('user', `请为我的${descriptionForm.name}生成商品描述`)
    addChatMessage('ai', `已为您生成商品描述：\n${description}`)
    
    ElMessage.success('商品描述生成成功！')
  } catch (error: any) {
    ElMessage.error('生成失败：' + error.message)
  } finally {
    isGeneratingDescription.value = false
  }
}

const copyDescription = () => {
  navigator.clipboard.writeText(generatedDescription.value).then(() => {
    ElMessage.success('描述已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const regenerateDescription = () => {
  generatedDescription.value = ''
  generateDescription()
}

const analyzePrice = async () => {
  if (!priceForm.category.length || !priceForm.originalPrice) {
    ElMessage.warning('请选择商品分类并填写原价')
    return
  }

  isAnalyzingPrice.value = true
  try {
    const productData = {
      category: priceForm.category.join('/'),
      condition: priceForm.condition,
      usageTime: priceForm.usageMonths,
      originalPrice: priceForm.originalPrice,
      targetPrice: priceForm.targetPrice
    }

    const analysis = await aiStore.analyzeProductPrice(productData)
    
    // 解析分析结果（这里简化处理，实际应该解析AI返回的结构化数据）
    priceAnalysisResult.value = {
      suggestedPrice: Math.round(priceForm.originalPrice * 0.7),
      priceRange: {
        min: Math.round(priceForm.originalPrice * 0.6),
        max: Math.round(priceForm.originalPrice * 0.8)
      },
      confidence: 85,
      factors: [
        '商品成色良好，价格系数0.85',
        '使用时间适中，价格系数0.8',
        '品牌保值率高',
        '市场供需平衡'
      ],
      marketData: {
        similarProductsCount: 23,
        averageMarketPrice: Math.round(priceForm.originalPrice * 0.75),
        priceRange: {
          min: Math.round(priceForm.originalPrice * 0.5),
          max: Math.round(priceForm.originalPrice * 0.9)
        }
      }
    }
    
    addChatMessage('user', `请分析我的${priceForm.category.join('/')}价格是否合理`)
    addChatMessage('ai', analysis)
    
    ElMessage.success('价格分析完成！')
  } catch (error: any) {
    ElMessage.error('分析失败：' + error.message)
  } finally {
    isAnalyzingPrice.value = false
  }
}

const getConfidenceStatus = (confidence: number) => {
  if (confidence >= 80) return 'success'
  if (confidence >= 60) return 'warning'
  return 'exception'
}

const performSmartSearch = async () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索内容')
    return
  }

  isSearching.value = true
  try {
    const results = await aiStore.smartSearch(searchQuery.value, searchFilters)
    
    // 模拟搜索结果
    searchResults.value = [
      {
        id: 1,
        name: 'iPhone 12 Pro 128GB 石墨色',
        description: '九成新，功能完好，配件齐全，诚心转让',
        price: 3800,
        originalPrice: 6299,
        condition: '九成新',
        location: '东区宿舍',
        tags: ['Apple', 'iPhone', '5G', '拍照好'],
        image: '/placeholder-phone.jpg'
      },
      {
        id: 2,
        name: 'MacBook Air M1 256GB',
        description: '适合编程学习，续航优秀，轻便便携',
        price: 5200,
        originalPrice: 7999,
        condition: '八成新',
        location: '图书馆',
        tags: ['Apple', 'MacBook', 'M1', '编程'],
        image: '/placeholder-laptop.jpg'
      }
    ]
    
    addChatMessage('user', searchQuery.value)
    addChatMessage('ai', `为您找到 ${searchResults.value.length} 个相关商品`)
    
    ElMessage.success('搜索完成！')
  } catch (error: any) {
    ElMessage.error('搜索失败：' + error.message)
  } finally {
    isSearching.value = false
  }
}

const showSearchTips = () => {
  ElMessage.info('搜索技巧：用自然语言描述您的需求，比如"我想买一台适合编程的笔记本电脑，预算5000左右"')
}

const analyzeChatSafety = async () => {
  if (!chatHistoryText.value.trim()) {
    ElMessage.warning('请输入聊天记录')
    return
  }

  isAnalyzingSafety.value = true
  try {
    const result = await aiStore.checkTransactionSafety({
      type: 'chat_analysis',
      content: chatHistoryText.value
    })
    
    safetyAnalysisResult.value = {
      riskLevel: 'medium',
      riskLevelText: '中等风险',
      riskScore: 65,
      riskFactors: [
        '对方要求预付定金',
        '价格明显低于市场价',
        '催促快速成交'
      ],
      recommendations: [
        '拒绝预付定金要求',
        '选择当面交易',
        '仔细检查商品后再付款',
        '保留所有聊天记录作为证据'
      ]
    }
    
    addChatMessage('user', '请分析这段聊天记录的风险')
    addChatMessage('ai', result)
    
    ElMessage.success('安全分析完成！')
  } catch (error: any) {
    ElMessage.error('分析失败：' + error.message)
  } finally {
    isAnalyzingSafety.value = false
  }
}

const getRiskStatus = (score: number) => {
  if (score >= 70) return 'exception'
  if (score >= 40) return 'warning'
  return 'success'
}

const toggleVoiceInput = () => {
  isVoiceInput.value = !isVoiceInput.value
  if (isVoiceInput.value) {
    ElMessage.info('语音输入功能已开启（模拟）')
  }
}

const toggleVoiceSearch = () => {
  isVoiceSearch.value = !isVoiceSearch.value
  if (isVoiceSearch.value) {
    ElMessage.info('语音搜索功能已开启（模拟）')
  }
}

const sendMessage = async () => {
  if (!currentMessage.value.trim() || isAIMThinking.value) return

  const message = currentMessage.value.trim()
  addChatMessage('user', message)
  currentMessage.value = ''
  isAIMThinking.value = true

  try {
    const response = await aiStore.sendMessage(message, {
      pageType: 'ai-assistant',
      activeFeature: activeFeature.value || 'general'
    })
    
    addChatMessage('ai', response.content)
  } catch (error: any) {
    addChatMessage('ai', '抱歉，我遇到了一些问题，请稍后重试。')
  } finally {
    isAIMThinking.value = false
  }
}

const addChatMessage = (type: 'user' | 'ai', content: string) => {
  const newMessage = {
    id: Date.now(),
    type,
    content,
    timestamp: new Date()
  }
  chatMessages.value.push(newMessage)
  
  nextTick(() => {
    const container = document.querySelector('.chat-messages')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

const clearChat = () => {
  chatMessages.value = [
    {
      id: 1,
      type: 'ai',
      content: '对话已清空，有什么可以帮助您的吗？',
      timestamp: new Date()
    }
  ]
  ElMessage.success('对话已清空')
}

const showChatTips = () => {
  ElMessage.info('您可以问我：商品价格、描述建议、交易安全、搜索商品等问题')
}

const showQuickActions = () => {
  ElMessage.info('快速操作：生成描述、分析价格、智能搜索、安全检测')
}

const showEmojiPicker = () => {
  ElMessage.info('表情功能开发中...')
}

const adjustInputHeight = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 生命周期
onMounted(() => {
  // 内置AI模式，自动初始化
  aiStore.configureAI()
  ElMessage.success('🤖 AI助手已准备就绪！')
})
</script>

<style scoped>
.ai-assistant-enhanced-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.page-header {
  text-align: center;
  padding: 60px 20px;
  color: white;
}

.header-content h1 {
  font-size: 3rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.header-content p {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 30px;
}

.header-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 5px;
}

.config-status-bar {
  max-width: 1200px;
  margin: 0 auto 20px;
  padding: 0 20px;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 40px;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.feature-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 12px;
}

.feature-info h3 {
  font-size: 1.1rem;
  margin: 0 0 8px 0;
  color: #303133;
}

.feature-info p {
  font-size: 0.9rem;
  color: #909399;
  margin: 0;
}

.feature-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #67c23a;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-display {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.feature-header {
  text-align: center;
  margin-bottom: 30px;
}

.feature-header h2 {
  font-size: 1.8rem;
  color: #303133;
  margin: 0 0 10px 0;
}

.feature-header p {
  color: #909399;
  margin: 0;
}

.feature-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-actions {
  text-align: center;
  margin-top: 30px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.generation-result {
  margin-top: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.result-content pre {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  line-height: 1.6;
  color: #606266;
}

.price-analysis-workspace {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.analysis-result {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}

.result-summary {
  margin-bottom: 20px;
}

.price-suggestion {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.suggestion-item .label {
  color: #606266;
  font-weight: 500;
}

.suggestion-item .price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #409eff;
}

.suggestion-item .range {
  font-weight: 600;
  color: #67c23a;
}

.confidence-score {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.factors-section h4,
.market-data-section h4 {
  color: #303133;
  margin: 0 0 12px 0;
}

.market-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: #909399;
}

.stat-value {
  font-weight: 600;
  color: #303133;
}

.smart-search-interface {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.voice-search-option {
  margin-bottom: 15px;
}

.smart-search-input {
  margin-bottom: 20px;
}

.search-filters {
  margin-bottom: 20px;
}

.search-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.search-results {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 16px;
  align-items: center;
}

.item-image img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}

.item-info h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.item-description {
  color: #606266;
  margin: 0 0 12px 0;
  font-size: 0.9rem;
}

.item-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 8px;
}

.price {
  font-size: 1.2rem;
  font-weight: 700;
  color: #409eff;
}

.condition {
  color: #67c23a;
  font-weight: 500;
}

.location {
  color: #909399;
  font-size: 0.9rem;
}

.item-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.safety-check-workspace {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.check-modes {
  display: flex;
  justify-content: center;
}

.safety-result {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}

.risk-assessment {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.risk-level {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.risk-level.risk-low .risk-value {
  color: #67c23a;
}

.risk-level.risk-medium .risk-value {
  color: #e6a23c;
}

.risk-level.risk-high .risk-value {
  color: #f56c6c;
}

.risk-label {
  font-size: 0.9rem;
  color: #909399;
}

.risk-value {
  font-size: 1.2rem;
  font-weight: 700;
}

.risk-score {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 200px;
}

.score-label {
  font-size: 0.9rem;
  color: #909399;
}

.risk-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.recommendation-interface {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.preference-settings {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}

.preference-actions {
  text-align: center;
  margin-top: 20px;
}

.recommendations-result {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}

.recommendations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recommendation-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.recommendation-reason {
  margin-bottom: 12px;
}

.recommendation-item .item-content {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 16px;
  align-items: center;
}

.welcome-content {
  text-align: center;
  padding: 40px 20px;
}

.welcome-illustration {
  margin-bottom: 40px;
}

.ai-robot {
  font-size: 4rem;
  margin-bottom: 20px;
}

.welcome-illustration h2 {
  font-size: 2rem;
  color: #303133;
  margin: 0 0 10px 0;
}

.welcome-illustration p {
  color: #909399;
  font-size: 1.1rem;
  margin: 0;
}

.quick-start-tips {
  text-align: left;
}

.quick-start-tips h3 {
  text-align: center;
  color: #303133;
  margin: 0 0 20px 0;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.tip-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.tip-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.tip-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.tip-card h4 {
  color: #303133;
  margin: 0 0 8px 0;
}

.tip-card p {
  color: #909399;
  margin: 0;
  font-size: 0.9rem;
}

.chat-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.chat-header h3 {
  margin: 0;
  color: #303133;
}

.chat-controls {
  display: flex;
  gap: 8px;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 400px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-message {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.chat-message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.chat-message.user .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.4;
}

.chat-message.ai .message-bubble {
  background: #f8f9fa;
  color: #303133;
  border-bottom-left-radius: 4px;
}

.chat-message.user .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-time {
  font-size: 11px;
  color: #909399;
  text-align: right;
}

.typing-indicator {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
}

.typing-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  font-size: 12px;
  color: #909399;
}

.typing-dots {
  display: flex;
  gap: 3px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #667eea;
  border-radius: 50%;
  animation: typingDot 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

.chat-input-area {
  border-top: 1px solid #f0f0f0;
  padding-top: 15px;
}

.input-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.input-container {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  max-height: 100px;
  outline: none;
  transition: border-color 0.2s ease;
}

.chat-input:focus {
  border-color: #667eea;
}

.send-button {
  width: 40px;
  height: 40px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes typingDot {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-8px);
  }
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .left-panel {
    order: 2;
  }
  
  .right-panel {
    order: 1;
  }
  
  .feature-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 12px;
  }
  
  .price-analysis-workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header-content h1 {
    font-size: 2rem;
  }
  
  .header-stats {
    flex-direction: column;
    gap: 20px;
  }
  
  .tips-grid {
    grid-template-columns: 1fr;
  }
  
  .chat-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .chat-controls {
    justify-content: center;
  }
}
</style>