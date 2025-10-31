import request from './request'

// 获取用户列表
export const getUserList = (params) => {
  return request({
    url: '/system/users',
    method: 'get',
    params
  })
}

// 获取用户详情
export const getUserDetail = (id) => {
  return request({
    url: `/system/users/${id}`,
    method: 'get'
  })
}

// 创建用户
export const createUser = (data) => {
  return request({
    url: '/system/users',
    method: 'post',
    data
  })
}

// 更新用户
export const updateUser = (id, data) => {
  return request({
    url: `/system/users/${id}`,
    method: 'put',
    data
  })
}

// 删除用户
export const deleteUser = (id) => {
  return request({
    url: `/system/users/${id}`,
    method: 'delete'
  })
}

// 重置密码
export const resetPassword = (id, data) => {
  return request({
    url: `/system/users/${id}/reset-password`,
    method: 'put',
    data
  })
}
