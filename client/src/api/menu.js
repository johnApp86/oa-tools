import request from './request'

// 获取菜单树
export const getMenuTree = () => {
  return request({
    url: '/menus/tree',
    method: 'get'
  })
}

// 获取菜单列表
export const getMenuList = (params) => {
  return request({
    url: '/menus',
    method: 'get',
    params
  })
}

// 获取菜单详情
export const getMenuDetail = (id) => {
  return request({
    url: `/menus/${id}`,
    method: 'get'
  })
}

// 创建菜单
export const createMenu = (data) => {
  return request({
    url: '/menus',
    method: 'post',
    data
  })
}

// 更新菜单
export const updateMenu = (id, data) => {
  return request({
    url: `/menus/${id}`,
    method: 'put',
    data
  })
}

// 删除菜单
export const deleteMenu = (id) => {
  return request({
    url: `/menus/${id}`,
    method: 'delete'
  })
}
