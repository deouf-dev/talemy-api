export default (sequelize, DataTypes) => {
  const ContactRequests = sequelize.define(
    "ContactRequests",
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
      status: {
        type: DataTypes.ENUM("PENDING", "ACCEPTED", "REJECTED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
      },
    },
    {
      tableName: "contact_requests",
      underscored: true,
      indexes: [
        {
          fields: ["studentUserId", "teacherUserId", "status"],
        },
      ],
    },
  );

  ContactRequests.associate = (models) => {
    ContactRequests.belongsTo(models.User, {
      as: "student",
      foreignKey: "studentUserId",
    });
    ContactRequests.belongsTo(models.User, {
      as: "teacher",
      foreignKey: "teacherUserId",
    });
  };

  return ContactRequests;
};
