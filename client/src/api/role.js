import request from './request'

// 获取角色列表
export const getRoleList = (params) => {
  return request({
    url: '/roles',
    method: 'get',
    params
  })
}

// 获取所有角色
export const getAllRoles = () => {
  return request({
    url: '/roles/all',
    method: 'get'
  })
}

// 获取角色详情
export const getRoleDetail = (id) => {
  return request({
    url: `/roles/${id}`,
    method: 'get'
  })
}

// 创建角色
export const createRole = (data) => {
  return request({
    url: '/roles',
    method: 'post',
    data
  })
}

// 更新角色
export const updateRole = (id, data) => {
  return request({
    url: `/roles/${id}`,
    method: 'put',
    data
  })
}

// 删除角色
export const deleteRole = (id) => {
  return request({
    url: `/roles/${id}`,
    method: 'delete'
  })
}
