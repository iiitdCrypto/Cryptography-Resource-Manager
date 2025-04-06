module.exports = (sequelize, DataTypes) => {
  const VisitorStat = sequelize.define('VisitorStat', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    pageViews: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    uniqueVisitors: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    newVisitors: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    returningVisitors: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    avgSessionDuration: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    bounceRate: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  });

  return VisitorStat;
};