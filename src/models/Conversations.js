export default (sequelize, DataTypes) => {
  const Conversations = sequelize.define(
    "Conversations",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      studentUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      teacherUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      requestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "conversations",
      underscored: true,
    },
  );

  Conversations.associate = (models) => {
    Conversations.belongsTo(models.User, {
      as: "student",
      foreignKey: "studentUserId",
    });
    Conversations.belongsTo(models.User, {
      as: "teacher",
      foreignKey: "teacherUserId",
    });
    Conversations.belongsTo(models.ContactRequests, {
      as: "contactRequest",
      foreignKey: "requestId",
    });
  };

  return Conversations;
};
