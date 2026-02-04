export default (sequelize, DataTypes) => {
  const Messages = sequelize.define(
    "Messages",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      conversationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "conversations",
          key: "id",
        },
      },
      senderUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "messages",
      underscored: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: false,
    },
  );

  Messages.associate = (models) => {
    Messages.belongsTo(models.Conversations, {
      as: "conversation",
      foreignKey: "conversationId",
    });
    Messages.belongsTo(models.User, {
      as: "sender",
      foreignKey: "senderUserId",
    });
  };
  return Messages;
};
