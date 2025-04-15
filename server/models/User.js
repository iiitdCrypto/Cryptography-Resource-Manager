const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/db');

class User {
  static async findById(id) {
    const [user] = await executeQuery('SELECT * FROM users WHERE id = ?', [id]);
    return user;
  }

  static async findByEmail(email) {
    const [user] = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
    return user;
  }

  static async create(userData) {
    const { first_name, last_name, email, password, role = 'regular' } = userData;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await executeQuery(
      'INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [first_name, last_name, email, hashedPassword, role]
    );

    return { id: result.insertId, first_name, last_name, email, role };
  }

  static async validatePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async updateById(id, updateData) {
    const allowedFields = ['first_name', 'last_name', 'email', 'role'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(updateData.password, salt);
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    values.push(id);
    const result = await executeQuery(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async delete(id) {
    const result = await executeQuery('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getPermissions(userId) {
    const permissions = await executeQuery(
      `SELECT p.* FROM permissions p 
       INNER JOIN user_permissions up ON p.id = up.permission_id 
       WHERE up.user_id = ?`,
      [userId]
    );
    return permissions;
  }

  static async hasPermission(userId, permissionName) {
    const [permission] = await executeQuery(
      `SELECT 1 FROM permissions p 
       INNER JOIN user_permissions up ON p.id = up.permission_id 
       WHERE up.user_id = ? AND p.name = ?`,
      [userId, permissionName]
    );
    return !!permission;
  }
}

module.exports = User;