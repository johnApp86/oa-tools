const db = require('../../../core/database/db-connection');

class DictionaryController {
  // 获取字典列表（树形结构，按字典编码分组）
  async getDictionaries(req, res) {
    try {
      const { keyword = '', dictCode = '', dictType = '', tree = false } = req.query;

      let sql = `SELECT * FROM dictionaries WHERE 1=1`;
      const params = [];
      
      if (keyword) {
        sql += ` AND (dict_name LIKE ? OR dict_code LIKE ? OR dict_label LIKE ?)`;
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }

      if (dictCode) {
        sql += ` AND dict_code = ?`;
        params.push(dictCode);
      }

      if (dictType) {
        sql += ` AND dict_type = ?`;
        params.push(dictType);
      }

      sql += ` ORDER BY dict_code, sort_order, id`;

      db.all(sql, params, (err, dictionaries) => {
        if (err) {
          console.error('查询字典列表失败:', err);
          return res.status(500).json({ message: '查询失败', error: err.message });
        }

        if (tree === 'true' || tree === true) {
          // 返回树形结构：按字典编码分组，每个编码作为父节点，其下的字典项作为子节点
          const dictGroupMap = new Map();
          const dictTree = [];

          dictionaries.forEach(dict => {
            const groupKey = dict.dict_code;
            
            if (!dictGroupMap.has(groupKey)) {
              // 创建字典组（父节点）
              const groupNode = {
                id: `group_${groupKey}`,
                dict_code: dict.dict_code,
                dict_name: dict.dict_name,
                dict_type: dict.dict_type,
                dict_value: null,
                dict_label: `${dict.dict_name}(${dict.dict_code})`,
                sort_order: 0,
                status: 1,
                remark: dict.remark || '',
                is_group: true,
                children: []
              };
              dictGroupMap.set(groupKey, groupNode);
              dictTree.push(groupNode);
            }

            // 添加字典项到对应组
            const groupNode = dictGroupMap.get(groupKey);
            groupNode.children.push({
              id: dict.id,
              dict_code: dict.dict_code,
              dict_name: dict.dict_name,
              dict_type: dict.dict_type,
              dict_value: dict.dict_value,
              dict_label: dict.dict_label,
              sort_order: dict.sort_order,
              status: dict.status,
              remark: dict.remark,
              is_group: false,
              children: []
            });
          });

          // 对每个组的子项进行排序
          dictTree.forEach(group => {
            group.children.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
          });

          res.json({
            data: dictTree,
            total: dictionaries.length
          });
        } else {
          // 返回扁平列表（兼容旧代码）
          res.json({
            data: dictionaries,
            total: dictionaries.length
          });
        }
      });
    } catch (error) {
      res.status(500).json({ message: '服务器错误', error: error.message });
    }
  }

  // 根据字典编码获取字典项列表
  async getDictByCode(req, res) {
    try {
      const { code } = req.params;
      
      db.all(
        `SELECT dict_value, dict_label, sort_order 
         FROM dictionaries 
         WHERE dict_code = ? AND status = 1 
         ORDER BY sort_order, id`,
        [code],
        (err, items) => {
          if (err) {
            console.error('查询字典失败:', err);
            return res.status(500).json({ message: '查询失败', error: err.message });
          }

          res.json({ data: items });
        }
      );
    } catch (error) {
      res.status(500).json({ message: '服务器错误', error: error.message });
    }
  }

  // 获取所有字典类型
  async getDictTypes(req, res) {
    try {
      db.all(
        `SELECT DISTINCT dict_code, dict_name, dict_type 
         FROM dictionaries 
         WHERE status = 1 
         ORDER BY dict_code`,
        [],
        (err, types) => {
          if (err) {
            console.error('查询字典类型失败:', err);
            return res.status(500).json({ message: '查询失败', error: err.message });
          }

          res.json({ data: types });
        }
      );
    } catch (error) {
      res.status(500).json({ message: '服务器错误', error: error.message });
    }
  }

  // 创建字典
  async createDictionary(req, res) {
    try {
      const { dictCode, dictName, dictType, dictValue, dictLabel, sortOrder = 0, status = 1, remark = '' } = req.body;

      if (!dictCode || !dictName || !dictType || !dictValue || !dictLabel) {
        return res.status(400).json({ message: '缺少必要参数' });
      }

      db.run(
        `INSERT INTO dictionaries (dict_code, dict_name, dict_type, dict_value, dict_label, sort_order, status, remark) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [dictCode, dictName, dictType, dictValue, dictLabel, sortOrder, status, remark],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              return res.status(400).json({ message: '字典编码和值已存在' });
            }
            return res.status(500).json({ message: '创建字典失败', error: err.message });
          }

          res.json({ message: '创建成功', id: this.lastID });
        }
      );
    } catch (error) {
      res.status(500).json({ message: '服务器错误', error: error.message });
    }
  }

  // 更新字典
  async updateDictionary(req, res) {
    try {
      const { id } = req.params;
      const { dictCode, dictName, dictType, dictValue, dictLabel, sortOrder, status, remark } = req.body;

      db.run(
        `UPDATE dictionaries SET 
         dict_code = ?, dict_name = ?, dict_type = ?, dict_value = ?, dict_label = ?, 
         sort_order = ?, status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [dictCode, dictName, dictType, dictValue, dictLabel, sortOrder, status, remark, id],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              return res.status(400).json({ message: '字典编码和值已存在' });
            }
            return res.status(500).json({ message: '更新失败', error: err.message });
          }

          if (this.changes === 0) {
            return res.status(404).json({ message: '字典不存在' });
          }

          res.json({ message: '更新成功' });
        }
      );
    } catch (error) {
      res.status(500).json({ message: '服务器错误', error: error.message });
    }
  }

  // 删除字典
  async deleteDictionary(req, res) {
    try {
      const { id } = req.params;

      db.run('DELETE FROM dictionaries WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ message: '删除失败', error: err.message });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '字典不存在' });
        }

        res.json({ message: '删除成功' });
      });
    } catch (error) {
      res.status(500).json({ message: '服务器错误', error: error.message });
    }
  }

  // 批量创建字典（用于初始化）
  async batchCreateDictionaries(req, res) {
    try {
      const { dictionaries } = req.body;

      if (!Array.isArray(dictionaries) || dictionaries.length === 0) {
        return res.status(400).json({ message: '字典数据格式错误' });
      }

      let completed = 0;
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      dictionaries.forEach((dict) => {
        const { dictCode, dictName, dictType, dictValue, dictLabel, sortOrder = 0, status = 1, remark = '' } = dict;

        db.run(
          `INSERT OR REPLACE INTO dictionaries (dict_code, dict_name, dict_type, dict_value, dict_label, sort_order, status, remark) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [dictCode, dictName, dictType, dictValue, dictLabel, sortOrder, status, remark],
          function(err) {
            completed++;
            if (err) {
              errorCount++;
              errors.push({ dict, error: err.message });
            } else {
              successCount++;
            }

            if (completed === dictionaries.length) {
              if (errorCount > 0) {
                res.status(500).json({ 
                  message: `部分字典创建失败，成功${successCount}条，失败${errorCount}条`, 
                  errors 
                });
              } else {
                res.json({ message: `成功创建${successCount}条字典` });
              }
            }
          }
        );
      });
    } catch (error) {
      res.status(500).json({ message: '服务器错误', error: error.message });
    }
  }
}

module.exports = new DictionaryController();
