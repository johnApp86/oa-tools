import request from './request'

// 获取岗位列表
export const getPositionList = (params) => {
  return request({
    url: '/positions',
    method: 'get',
    params
  })
}

// 获取所有岗位
export const getAllPositions = (params) => {
  return request({
    url: '/positions/all',
    method: 'get',
    params
  })
}

// 获取岗位详情
export const getPositionDetail = (id) => {
  return request({
    url: `/positions/${id}`,
    method: 'get'
  })
}

// 创建岗位
export const createPosition = (data) => {
  return request({
    url: '/positions',
    method: 'post',
    data
  })
}

// 更新岗位
export const updatePosition = (id, data) => {
  return request({
    url: `/positions/${id}`,
    method: 'put',
    data
  })
}

// 删除岗位
export const deletePosition = (id) => {
  return request({
    url: `/positions/${id}`,
    method: 'delete'
  })
}
