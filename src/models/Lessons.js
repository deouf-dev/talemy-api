export default (sequelize, DataTypes) => {
  const Lessons = sequelize.define(
    "Lessons",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      subjectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "subjects",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      teacherUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      studentUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      startAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      durationMin: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      statusForStudent: {
        type: DataTypes.ENUM("PENDING", "CONFIRMED", "CANCELLED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      statusForTeacher: {
        type: DataTypes.ENUM("PENDING", "CONFIRMED", "CANCELLED"),
        allowNull: false,
        defaultValue: "PENDING",
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
      tableName: "lessons",
      underscored: true,
    },
  );

  Lessons.associate = (models) => {
    Lessons.belongsTo(models.User, {
      as: "teacher",
      foreignKey: "teacherUserId",
    });
    Lessons.belongsTo(models.User, {
      as: "student",
      foreignKey: "studentUserId",
    });
    Lessons.belongsTo(models.Subjects, {
      as: "subject",
      foreignKey: "subjectId",
    });
  };

  return Lessons;
};
