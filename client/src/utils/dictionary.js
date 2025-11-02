import { getDictByCode } from '@/api/dictionary'

// 字典缓存
const dictCache = new Map()

// 获取字典数据（带缓存）
export const getDictionary = async (code) => {
  if (dictCache.has(code)) {
    return dictCache.get(code)
  }

  try {
    const result = await getDictByCode(code)
    const dict = {}
    if (result.data && Array.isArray(result.data)) {
      result.data.forEach(item => {
        dict[item.dict_value] = item.dict_label
      })
    }
    dictCache.set(code, dict)
    return dict
  } catch (error) {
    console.error(`获取字典 ${code} 失败:`, error)
    return {}
  }
}

// 获取字典标签
export const getDictLabel = async (code, value) => {
  if (value === null || value === undefined || value === '') {
    return value || '-'
  }

  const dict = await getDictionary(code)
  return dict[value] || value || '-'
}

// 清除字典缓存
export const clearDictCache = (code) => {
  if (code) {
    dictCache.delete(code)
  } else {
    dictCache.clear()
  }
}

// 预加载多个字典
export const preloadDictionaries = async (codes) => {
  const promises = codes.map(code => getDictionary(code))
  await Promise.all(promises)
}

// 同步获取字典标签（如果已在缓存中）
export const getDictLabelSync = (code, value) => {
  if (value === null || value === undefined || value === '') {
    return value || '-'
  }

  const dict = dictCache.get(code)
  if (dict) {
    return dict[value] || value || '-'
  }
  
  // 如果缓存中没有，返回原值
  return value || '-'
}

// 获取字典选项列表（用于下拉选择框）
export const getDictOptions = async (code) => {
  const dict = await getDictionary(code)
  return Object.keys(dict).map(value => ({
    label: dict[value],
    value: value
  }))
}

// 同步获取字典选项列表（如果已在缓存中）
export const getDictOptionsSync = (code) => {
  const dict = dictCache.get(code)
  if (dict) {
    return Object.keys(dict).map(value => ({
      label: dict[value],
      value: value
    }))
  }
  return []
}
