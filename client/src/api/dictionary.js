import request from './request'

// 获取字典列表
export const getDictionaryList = (params) => {
  return request({
    url: '/system/dictionaries',
    method: 'get',
    params
  })
}

// 根据字典编码获取字典项列表
export const getDictByCode = (code) => {
  return request({
    url: `/system/dictionaries/code/${code}`,
    method: 'get'
  })
}

// 获取所有字典类型
export const getDictTypes = () => {
  return request({
    url: '/system/dictionaries/types',
    method: 'get'
  })
}

// 创建字典
export const createDictionary = (data) => {
  return request({
    url: '/system/dictionaries',
    method: 'post',
    data
  })
}

// 批量创建字典
export const batchCreateDictionaries = (data) => {
  return request({
    url: '/system/dictionaries/batch',
    method: 'post',
    data
  })
}

// 更新字典
export const updateDictionary = (id, data) => {
  return request({
    url: `/system/dictionaries/${id}`,
    method: 'put',
    data
  })
}

// 删除字典
export const deleteDictionary = (id) => {
  return request({
    url: `/system/dictionaries/${id}`,
    method: 'delete'
  })
}
