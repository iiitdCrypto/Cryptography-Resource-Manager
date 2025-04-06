const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [2, 50]
      }
    },
    surname: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notNull: {
          msg: 'ईमेल आवश्यक है'
        }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'पासवर्ड आवश्यक है'
        },
        len: {
          args: [6, 255],
          msg: 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए'
        }
      }
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'authorised'),
      defaultValue: 'user'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    institution: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    profile_image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    account_status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    last_password_change: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resetPasswordToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    resetPasswordExpire: {
      type: DataTypes.DATE,
      allowNull: true
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
        // Set the last_password_change date
        user.last_password_change = Date.now();
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
          // Update the last_password_change date
          user.last_password_change = Date.now();
        }
      },
      afterCreate: async (user, options) => {
        // Create default user settings
        if (sequelize.models.UserSettings) {
          try {
            await sequelize.models.UserSettings.create({
              user_id: user.id,
              theme: 'system',
              language: 'hi',
              email_notifications: true
            }, { transaction: options.transaction });
          } catch (error) {
            console.error('Failed to create user settings:', error);
          }
        }
      }
    },
    defaultScope: {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire', 'verification_token'] }
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] }
      },
      active: {
        where: { account_status: 'active' }
      },
      admin: {
        where: { role: 'admin' }
      }
    }
  });

  // Instance methods
  User.prototype.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

  User.prototype.getResetPasswordToken = function() {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
  };

  User.prototype.getEmailVerificationToken = function() {
    // Generate token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to verification_token field
    this.verification_token = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    return verificationToken;
  };

  // Record login attempt
  User.prototype.recordLoginAttempt = async function(success) {
    if (success) {
      this.login_attempts = 0;
      this.last_login = Date.now();
    } else {
      this.login_attempts += 1;
      
      // Auto-suspend account after 5 failed attempts
      if (this.login_attempts >= 5) {
        this.account_status = 'suspended';
      }
    }
    
    await this.save();
  };

  // Association methods
  User.associate = (models) => {
    User.hasMany(models.Resource, { foreignKey: 'created_by', as: 'resources' });
    User.hasMany(models.Event, { foreignKey: 'created_by', as: 'events' });
    User.hasMany(models.Article, { foreignKey: 'author_id', as: 'articles' });
    User.hasMany(models.AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
    User.hasOne(models.UserPermission, { foreignKey: 'user_id', as: 'permissions' });
    User.hasOne(models.UserSettings, { foreignKey: 'user_id', as: 'settings' });
    User.hasMany(models.ResourceComment, { foreignKey: 'user_id', as: 'comments' });
    User.hasMany(models.EventRegistration, { foreignKey: 'user_id', as: 'eventRegistrations' });
    User.hasMany(models.Notification, { foreignKey: 'user_id', as: 'notifications' });
  };

  return User;
};