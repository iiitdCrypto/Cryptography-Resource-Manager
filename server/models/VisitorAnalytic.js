module.exports = (sequelize, DataTypes) => {
  const VisitorAnalytic = sequelize.define('VisitorAnalytic', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    pageUrl: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    visitedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'visitor_analytics',
    timestamps: false
  });

  VisitorAnalytic.associate = (models) => {
    VisitorAnalytic.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return VisitorAnalytic;
};
