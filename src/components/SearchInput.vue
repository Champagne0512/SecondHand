<template>
  <div class="search-input-container">
    <div class="search-input-wrapper">
      <input
        v-model="inputValue"
        :placeholder="placeholder"
        type="text"
        class="search-input"
        @input="handleInput"
        @keyup.enter="handleSearch"
        @focus="showSuggestions = true"
        @blur="hideSuggestions"
      />
      <button class="search-button" @click="handleSearch">
        <span class="search-icon">🔍</span>
      </button>
    </div>
    
    <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-dropdown">
      <div
        v-for="suggestion in suggestions"
        :key="suggestion"
        class="suggestion-item"
        @mousedown="selectSuggestion(suggestion)"
      >
        {{ suggestion }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '搜索诗词、作者...'
  },
  suggestions: {
    type: Array,
    default: () => []
  },
  debounce: {
    type: Number,
    default: 300
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'input'])

const inputValue = ref(props.modelValue)
const showSuggestions = ref(false)
let debounceTimer = null

// 同步外部modelValue变化
watch(() => props.modelValue, (newValue) => {
  inputValue.value = newValue
})

const handleInput = () => {
  emit('update:modelValue', inputValue.value)
  
  // 防抖处理
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('input', inputValue.value)
  }, props.debounce)
}

const handleSearch = () => {
  if (inputValue.value.trim()) {
    emit('search', inputValue.value.trim())
    showSuggestions.value = false
  }
}

const selectSuggestion = (suggestion) => {
  inputValue.value = suggestion
  emit('update:modelValue', suggestion)
  handleSearch()
}

const hideSuggestions = () => {
  // 延迟隐藏以避免点击建议项时立即隐藏
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}
</script>

<style scoped>
.search-input-container {
  position: relative;
  width: 100%;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  border: 2px solid #e9ecef;
  border-radius: 25px;
  background: white;
  overflow: hidden;
  transition: border-color 0.3s;
}

.search-input-wrapper:focus-within {
  border-color: #3498db;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  outline: none;
  font-size: 1rem;
  background: transparent;
}

.search-button {
  padding: 0.75rem 1rem;
  border: none;
  background: #3498db;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.search-button:hover {
  background: #2980b9;
}

.search-icon {
  font-size: 1rem;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f8f9fa;
}

.suggestion-item:hover {
  background: #f8f9fa;
}

.suggestion-item:last-child {
  border-bottom: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-input-wrapper {
    border-radius: 20px;
  }
  
  .search-input {
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
  }
  
  .search-button {
    padding: 0.5rem 0.75rem;
  }
}
</style>