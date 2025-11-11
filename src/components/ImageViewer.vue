<template>
  <transition name="image-viewer-fade">
    <div 
      v-if="visible" 
      class="image-viewer"
      @click.self="close"
    >
      <!-- 关闭按钮 -->
      <div class="image-viewer-close" @click="close">
        <el-icon><Close /></el-icon>
      </div>

      <!-- 图片容器 -->
      <div class="image-container">
        <!-- 上一张按钮 -->
        <div 
          v-if="imageList && imageList.length > 1" 
          class="nav-button prev-button"
          @click="prevImage"
        >
          <el-icon><ArrowLeft /></el-icon>
        </div>

        <!-- 图片显示 -->
        <div class="image-wrapper">
          <img 
            :src="currentImage" 
            :alt="`图片 ${currentIndex + 1}`"
            class="viewer-image"
            :style="imageStyle"
            @mousedown="startDrag"
            @wheel="handleWheel"
            @dblclick="toggleZoom"
          />
        </div>

        <!-- 下一张按钮 -->
        <div 
          v-if="imageList && imageList.length > 1" 
          class="nav-button next-button"
          @click="nextImage"
        >
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>

      <!-- 底部信息栏 -->
      <div class="image-info">
        <span class="image-counter">
          {{ currentIndex + 1 }} / {{ imageList ? imageList.length : 1 }}
        </span>
        <div class="zoom-controls">
          <el-button 
            size="small" 
            @click="zoomOut"
            :disabled="scale <= 0.2"
          >
            <el-icon><Minus /></el-icon>
          </el-button>
          <span class="zoom-percent">{{ Math.round(scale * 100) }}%</span>
          <el-button 
            size="small" 
            @click="zoomIn"
            :disabled="scale >= 3"
          >
            <el-icon><Plus /></el-icon>
          </el-button>
          <el-button 
            size="small" 
            @click="resetZoom"
            :disabled="scale === 1"
          >
            重置
          </el-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Close, ArrowLeft, ArrowRight, Plus, Minus } from '@element-plus/icons-vue'

interface Props {
  visible: boolean
  imageUrl?: string
  imageList?: string[]
  initialIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  imageUrl: '',
  imageList: () => [],
  initialIndex: 0
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'close': []
}>()

// 响应式数据
const currentIndex = ref(props.initialIndex)
const scale = ref(1)
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// 计算属性
const currentImage = computed(() => {
  if (props.imageList && props.imageList.length > 0) {
    return props.imageList[currentIndex.value]
  }
  return props.imageUrl
})

const imageStyle = computed(() => ({
  transform: `scale(${scale.value}) translate(${position.value.x}px, ${position.value.y}px)`,
  transition: isDragging.value ? 'none' : 'transform 0.2s ease'
}))

// 监听器
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 显示时重置状态
    resetZoom()
    currentIndex.value = props.initialIndex
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

watch(() => props.initialIndex, (newIndex) => {
  currentIndex.value = newIndex
  resetZoom()
})

// 方法
const close = () => {
  emit('update:visible', false)
  emit('close')
}

const nextImage = () => {
  if (props.imageList && props.imageList.length > 0) {
    currentIndex.value = (currentIndex.value + 1) % props.imageList.length
    resetZoom()
  }
}

const prevImage = () => {
  if (props.imageList && props.imageList.length > 0) {
    currentIndex.value = (currentIndex.value - 1 + props.imageList.length) % props.imageList.length
    resetZoom()
  }
}

const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.1, 3)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.1, 0.2)
}

const resetZoom = () => {
  scale.value = 1
  position.value = { x: 0, y: 0 }
}

const toggleZoom = () => {
  if (scale.value === 1) {
    scale.value = 2
  } else {
    resetZoom()
  }
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  if (event.deltaY < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

const startDrag = (event: MouseEvent) => {
  if (scale.value > 1) {
    isDragging.value = true
    dragStart.value = {
      x: event.clientX - position.value.x,
      y: event.clientY - position.value.y
    }
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      if (isDragging.value) {
        position.value = {
          x: moveEvent.clientX - dragStart.value.x,
          y: moveEvent.clientY - dragStart.value.y
        }
      }
    }
    
    const onMouseUp = () => {
      isDragging.value = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.visible) return
  
  switch (event.key) {
    case 'Escape':
      close()
      break
    case 'ArrowLeft':
      prevImage()
      break
    case 'ArrowRight':
      nextImage()
      break
    case '+':
    case '=':
      zoomIn()
      break
    case '-':
      zoomOut()
      break
    case '0':
      resetZoom()
      break
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.image-viewer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.image-viewer-fade-enter-active,
.image-viewer-fade-leave-active {
  transition: opacity 0.3s ease;
}

.image-viewer-fade-enter-from,
.image-viewer-fade-leave-to {
  opacity: 0;
}

.image-viewer-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 20px;
  transition: all 0.3s ease;
  z-index: 10000;
}

.image-viewer-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.image-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: calc(100vh - 120px);
  max-width: 90vw;
  max-height: 80vh;
}

.image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.viewer-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: grab;
  user-select: none;
}

.viewer-image:active {
  cursor: grabbing;
}

.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 24px;
  transition: all 0.3s ease;
  z-index: 1000;
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-50%) scale(1.1);
}

.prev-button {
  left: 20px;
}

.next-button {
  right: 20px;
}

.image-info {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  color: white;
}

.image-counter {
  font-size: 14px;
  opacity: 0.8;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.zoom-percent {
  min-width: 50px;
  text-align: center;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-button {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .prev-button {
    left: 10px;
  }
  
  .next-button {
    right: 10px;
  }
  
  .image-info {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}
</style>