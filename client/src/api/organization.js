import request from './request'

// 获取组织树
export const getOrganizationTree = () => {
  return request({
    url: '/system/organizations/tree',
    method: 'get'
  })
}

// 获取组织列表
export const getOrganizationList = (params) => {
  return request({
    url: '/system/organizations',
    method: 'get',
    params
  })
}

// 获取所有组织
export const getAllOrganizations = () => {
  return request({
    url: '/system/organizations/all',
    method: 'get'
  })
}

// 获取组织详情
export const getOrganizationDetail = (id) => {
  return request({
    url: `/system/organizations/${id}`,
    method: 'get'
  })
}

// 创建组织
export const createOrganization = (data) => {
  return request({
    url: '/system/organizations',
    method: 'post',
    data
  })
}

// 更新组织
export const updateOrganization = (id, data) => {
  return request({
    url: `/system/organizations/${id}`,
    method: 'put',
    data
  })
}

// 删除组织
export const deleteOrganization = (id) => {
  return request({
    url: `/system/organizations/${id}`,
    method: 'delete'
  })
}
