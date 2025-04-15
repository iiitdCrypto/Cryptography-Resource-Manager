<<<<<<< HEAD
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
=======
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'professor', 'student', 'guest'),
    defaultValue: 'student'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  resetToken: {
    type: DataTypes.STRING
  },
  resetTokenExpiry: {
    type: DataTypes.DATE
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  timestamps: true
});

// Instance method to validate password
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};
>>>>>>> 82939576ee37b12dba67578adf111e420d0654ac

module.exports = User;