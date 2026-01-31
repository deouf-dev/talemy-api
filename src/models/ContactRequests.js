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
        field: "student_user_id",
      },
      teacherUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "teacher_user_id",
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
      foreignKey: "student_user_id",
    });
    ContactRequests.belongsTo(models.User, {
      as: "teacher",
      foreignKey: "teacher_user_id",
    });
  };

  return ContactRequests;
};
