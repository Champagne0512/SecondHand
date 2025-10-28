<template>
  <div class="analytics-view">
    <!-- 全局导航 -->
    <GlobalNavigation />
    
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>📊 数据分析</h1>
        <p>智能分析商品价格趋势，助您做出明智决策</p>
      </div>
    </div>

    <!-- 数据概览卡片 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
              <div class="stat-number">¥{{ averagePrice }}</div>
              <div class="stat-label">平均价格</div>
            </div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-number">{{ priceTrend }}</div>
              <div class="stat-label">价格趋势</div>
            </div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card">
            <div class="stat-icon">🏷️</div>
            <div class="stat-content">
              <div class="stat-number">{{ categoryCount }}</div>
              <div class="stat-label">商品分类</div>
            </div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-number">{{ totalProducts }}</div>
              <div class="stat-label">商品总数</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 价格分析工具 -->
    <div class="analysis-tool">
      <div class="tool-header">
        <h2>💡 智能价格评估</h2>
        <p>输入商品信息，获得专业的价格建议</p>
      </div>
      
      <el-card class="tool-card">
        <el-form :model="analysisForm" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="商品分类">
                <el-select v-model="analysisForm.category" placeholder="选择分类">
                  <el-option label="电子产品" value="electronics" />
                  <el-option label="图书教材" value="books" />
                  <el-option label="生活用品" value="daily" />
                  <el-option label="运动器材" value="sports" />
                  <el-option label="服装鞋帽" value="clothing" />
                </el-select>
              </el-form-item>
            </el-col>
            
            <el-col :span="12">
              <el-form-item label="商品成色">
                <el-select v-model="analysisForm.condition" placeholder="选择成色">
                  <el-option label="全新" value="全新" />
                  <el-option label="几乎全新" value="几乎全新" />
                  <el-option label="轻微使用" value="轻微使用" />
                  <el-option label="明显使用" value="明显使用" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="使用时间">
                <el-input-number 
                  v-model="analysisForm.usageTime" 
                  :min="0" 
                  :max="60"
                  :step="1"
                />
                <span style="margin-left: 10px; color: #909399;">个月</span>
              </el-form-item>
            </el-col>
            
            <el-col :span="12">
              <el-form-item label="原价">
                <el-input-number 
                  v-model="analysisForm.originalPrice" 
                  :min="0" 
                  :step="100"
                  :precision="2"
                />
                <span style="margin-left: 10px; color: #909399;">元</span>
              </el-form-item>
            </el-col>
          </el-row>
          
          <div class="analysis-actions">
            <el-button 
              type="primary" 
              size="large" 
              :loading="priceStore.isLoading"
              @click="analyzePrice"
            >
              开始分析
            </el-button>
          </div>
        </el-form>
      </el-card>
    </div>

    <!-- 分析结果 -->
    <div v-if="priceEvaluation" class="analysis-result">
      <el-card class="result-card">
        <div class="result-header">
          <h3>📊 分析结果</h3>
          <el-progress 
            :percentage="priceEvaluation.confidence" 
            :status="getConfidenceStatus(priceEvaluation.confidence)"
            :stroke-width="8"
          />
        </div>
        
        <div class="result-content">
          <div class="price-suggestion">
            <div class="suggested-price">
              <span class="price-label">建议售价</span>
              <span class="price-value">¥{{ priceEvaluation.suggestedPrice }}</span>
            </div>
            <div class="price-range">
              <span class="range-label">合理价格区间</span>
              <span class="range-value">
                ¥{{ priceEvaluation.priceRange.min }} - ¥{{ priceEvaluation.priceRange.max }}
              </span>
            </div>
          </div>
          
          <div v-if="priceEvaluation.factors.length > 0" class="factors-section">
            <h4>📋 影响因素</h4>
            <ul class="factors-list">
              <li v-for="factor in priceEvaluation.factors" :key="factor">
                {{ factor }}
              </li>
            </ul>
          </div>
          
          <div v-if="priceEvaluation.marketData" class="market-section">
            <h4>📈 市场数据</h4>
            <div class="market-stats">
              <div class="market-stat">
                <span class="stat-label">同类商品数量</span>
                <span class="stat-value">{{ priceEvaluation.marketData.similarProductsCount }}</span>
              </div>
              <div class="market-stat">
                <span class="stat-label">市场平均价格</span>
                <span class="stat-value">¥{{ priceEvaluation.marketData.averageMarketPrice }}</span>
              </div>
              <div class="market-stat">
                <span class="stat-label">市场价格范围</span>
                <span class="stat-value">
                  ¥{{ priceEvaluation.marketData.priceRange.min }} - ¥{{ priceEvaluation.marketData.priceRange.max }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 分类价格统计 -->
    <div class="category-stats">
      <div class="section-header">
        <h2>📊 分类价格统计</h2>
        <p>各商品分类的平均价格对比</p>
      </div>
      
      <div v-if="priceStore.isLoading" class="loading-container">
        <el-loading :loading="true" text="加载统计数据..." />
      </div>
      
      <div v-else-if="categoryStats.length > 0" class="stats-grid">
        <div 
          v-for="stat in categoryStats" 
          :key="stat.category" 
          class="stat-item"
        >
          <div class="category-header">
            <h4>{{ getCategoryLabel(stat.category) }}</h4>
            <el-tag :type="getCategoryTag(stat.category)" size="small">
              {{ stat.product_count }} 件商品
            </el-tag>
          </div>
          
          <div class="price-info">
            <div class="avg-price">
              <span class="price-label">平均价格</span>
              <span class="price-value">¥{{ Math.round(stat.avg_price) }}</span>
            </div>
            <div class="price-range">
              <span class="range-label">价格区间</span>
              <span class="range-value">
                ¥{{ Math.round(stat.min_price) }} - ¥{{ Math.round(stat.max_price) }}
              </span>
            </div>
          </div>
          
          <div class="price-bar">
            <div class="bar-background">
              <div 
                class="bar-fill"
                :style="{ width: getPriceBarWidth(stat.avg_price, maxAvgPrice) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <el-empty description="暂无价格统计数据" />
      </div>
    </div>

    <!-- 价格趋势预测 -->
    <div class="trend-prediction">
      <div class="section-header">
        <h2>🔮 价格趋势预测</h2>
        <p>基于历史数据预测未来价格走势</p>
      </div>
      
      <div class="prediction-cards">
        <el-card class="prediction-card">
          <template #header>
            <div class="card-header">
              <span>📈 整体趋势</span>
            </div>
          </template>
          <div class="prediction-content">
            <div class="trend-indicator" :class="overallTrend.trend">
              <el-icon size="large">
                <TrendCharts />
              </el-icon>
              <span>{{ getTrendLabel(overallTrend.trend) }}</span>
            </div>
            <p class="prediction-text">{{ overallTrend.prediction }}</p>
          </div>
        </el-card>
        
        <el-card class="prediction-card">
          <template #header>
            <div class="card-header">
              <span>⏰ 最佳购买时机</span>
            </div>
          </template>
          <div class="prediction-content">
            <div class="timing-info">
              <h3>{{ bestDealTiming.bestMonth }}</h3>
              <p>{{ bestDealTiming.reasoning }}</p>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 使用建议 -->
    <div class="usage-tips">
      <el-card class="tips-card">
        <template #header>
          <div class="card-header">
            <span>💡 使用建议</span>
          </div>
        </template>
        <div class="tips-content">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="tip-item">
                <h4>📊 数据准确性</h4>
                <p>价格分析基于近期市场数据，建议结合实际情况考虑。</p>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="tip-item">
                <h4>🔄 定期更新</h4>
                <p>市场价格会随时间变化，建议定期查看最新数据。</p>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="tip-item">
                <h4>🎯 多因素考虑</h4>
                <p>除了价格，还要考虑商品成色、品牌、功能等因素。</p>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="tip-item">
                <h4>💬 市场反馈</h4>
                <p>可以参考其他用户的反馈和评价，做出更明智的选择。</p>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePriceAnalyticsStore } from '@/stores/price-analytics'
import { ElMessage } from 'element-plus'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import { TrendCharts } from '@element-plus/icons-vue'

const priceStore = usePriceAnalyticsStore()

// 表单数据
const analysisForm = ref({
  category: '',
  condition: '',
  usageTime: 0,
  originalPrice: 0
})

// 计算属性
const priceEvaluation = computed(() => priceStore.priceEvaluation)
const categoryStats = computed(() => priceStore.categoryStats)
const maxAvgPrice = computed(() => {
  if (!categoryStats.value.length) return 0
  return Math.max(...categoryStats.value.map(stat => stat.avg_price))
})

// 模拟数据
const averagePrice = ref(1280)
const priceTrend = ref('上涨 5.2%')
const categoryCount = ref(5)
const totalProducts = ref(1247)

const overallTrend = ref({
  trend: 'up',
  confidence: 75,
  prediction: '价格呈上涨趋势，建议尽快购买'
})

const bestDealTiming = ref({
  bestMonth: '3月',
  reasoning: '3月通常是购买电子产品的最佳时机，平均价格比9月低15%',
  confidence: 80
})

// 生命周期
onMounted(async () => {
  await priceStore.getCategoryPriceStats()
})

// 方法
const analyzePrice = async () => {
  if (!analysisForm.value.category) {
    ElMessage.warning('请选择商品分类')
    return
  }
  
  try {
    await priceStore.evaluateProductPrice(analysisForm.value)
    ElMessage.success('价格分析完成！')
  } catch (error) {
    ElMessage.error('分析失败，请稍后重试')
  }
}

const getConfidenceStatus = (confidence: number) => {
  if (confidence >= 80) return 'success'
  if (confidence >= 60) return 'warning'
  return 'exception'
}

const getCategoryLabel = (category: string) => {
  const labelMap = {
    electronics: '电子产品',
    books: '图书教材',
    daily: '生活用品',
    sports: '运动器材',
    clothing: '服装鞋帽'
  }
  return labelMap[category as keyof typeof labelMap] || category
}

const getCategoryTag = (category: string) => {
  const tagMap = {
    electronics: 'primary',
    books: 'success',
    daily: 'info',
    sports: 'warning',
    clothing: 'danger'
  }
  return tagMap[category as keyof typeof tagMap] || 'info'
}

const getPriceBarWidth = (price: number, maxPrice: number) => {
  return Math.min(100, (price / maxPrice) * 100)
}

const getTrendLabel = (trend: string) => {
  const labelMap = {
    up: '价格上涨',
    down: '价格下跌',
    stable: '价格稳定'
  }
  return labelMap[trend as keyof typeof labelMap] || trend
}
</script>

<style scoped>
.analytics-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
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
}

.stats-overview {
  max-width: 1200px;
  margin: 0 auto 40px;
  padding: 0 20px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 50%;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  color: #909399;
  font-size: 1rem;
}

.analysis-tool {
  max-width: 1200px;
  margin: 0 auto 40px;
  padding: 0 20px;
}

.tool-header {
  text-align: center;
  margin-bottom: 30px;
}

.tool-header h2 {
  color: #303133;
  font-size: 2rem;
  margin-bottom: 10px;
}

.tool-header p {
  color: #909399;
  font-size: 1.1rem;
}

.tool-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.analysis-actions {
  text-align: center;
  margin-top: 30px;
}

.analysis-actions .el-button {
  min-width: 140px;
  height: 48px;
  font-size: 16px;
}

.analysis-result {
  max-width: 1200px;
  margin: 0 auto 40px;
  padding: 0 20px;
}

.result-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.result-header h3 {
  color: #303133;
  font-size: 1.5rem;
}

.result-content {
  padding: 20px 0;
}

.price-suggestion {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
  padding: 25px;
  background: #f5f7fa;
  border-radius: 12px;
}

.suggested-price {
  text-align: center;
}

.price-label {
  display: block;
  color: #909399;
  font-size: 1rem;
  margin-bottom: 10px;
}

.price-value {
  display: block;
  font-size: 2.5rem;
  font-weight: 700;
  color: #409eff;
}

.price-range {
  text-align: center;
}

.range-label {
  display: block;
  color: #909399;
  font-size: 1rem;
  margin-bottom: 10px;
}

.range-value {
  display: block;
  font-size: 1.3rem;
  font-weight: 600;
  color: #67c23a;
}

.confidence-score {
  margin-bottom: 30px;
}

.factors-section {
  margin-bottom: 30px;
}

.factors-section h4 {
  color: #303133;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.factors-list {
  margin: 0;
  padding-left: 20px;
}

.factors-list li {
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.5;
}

.market-section {
  margin-bottom: 30px;
}

.market-section h4 {
  color: #303133;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.market-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.market-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-label {
  color: #909399;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.stat-value {
  color: #303133;
  font-size: 1.5rem;
  font-weight: 600;
}

.category-stats {
  max-width: 1200px;
  margin: 0 auto 40px;
  padding: 0 20px;
}

.section-header {
  text-align: center;
  margin-bottom: 30px;
}

.section-header h2 {
  color: #303133;
  font-size: 2rem;
  margin-bottom: 10px;
}

.section-header p {
  color: #909399;
  font-size: 1.1rem;
}

.loading-container {
  text-align: center;
  padding: 60px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.stat-item {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.category-header h4 {
  color: #303133;
  font-size: 1.3rem;
  margin: 0;
}

.price-info {
  margin-bottom: 20px;
}

.avg-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.price-label {
  color: #909399;
  font-size: 0.9rem;
}

.price-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #409eff;
}

.price-range {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.range-label {
  color: #909399;
  font-size: 0.9rem;
}

.range-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #67c23a;
}

.price-bar {
  margin-top: 15px;
}

.bar-background {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.trend-prediction {
  max-width: 1200px;
  margin: 0 auto 40px;
  padding: 0 20px;
}

.prediction-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.prediction-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.prediction-content {
  padding: 20px;
}

.trend-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding: 15px;
  border-radius: 8px;
}

.trend-indicator.up {
  background: #fef0f0;
  color: #f56c6c;
}

.trend-indicator.down {
  background: #f0f9ff;
  color: #409eff;
}

.trend-indicator.stable {
  background: #f5f7fa;
  color: #909399;
}

.prediction-text {
  color: #606266;
  line-height: 1.6;
}

.timing-info {
  text-align: center;
}

.timing-info h3 {
  color: #409eff;
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.timing-info p {
  color: #606266;
  line-height: 1.6;
}

.usage-tips {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.tips-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.tips-content {
  padding: 20px;
}

.tip-item {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 15px;
}

.tip-item h4 {
  color: #303133;
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.tip-item p {
  color: #606266;
  line-height: 1.6;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}

@media (max-width: 768px) {
  .header-content h1 {
    font-size: 2rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .prediction-cards {
    grid-template-columns: 1fr;
  }
  
  .price-suggestion {
    grid-template-columns: 1fr;
  }
  
  .market-stats {
    grid-template-columns: 1fr;
  }
}
</style>