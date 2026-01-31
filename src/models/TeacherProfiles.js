export default (sequelize, DataTypes) => {
  const TeacherProfiles = sequelize.define(
    "TeacherProfiles",
    {
      userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: "users",
          key: "id",
        },
        allowNull: false,
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        field: "user_id",
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      hourlyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "hourly_rate",
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "created_at",
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "updated_at",
      },
    },
    {
      tableName: "teacher_profiles",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  TeacherProfiles.associate = (models) => {
    TeacherProfiles.belongsToMany(models.Subjects, {
      through: models.TeacherSubjects,
      foreignKey: "userId",
      otherKey: "subjectId",
      as: "subjects",
    });
    TeacherProfiles.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };
  return TeacherProfiles;
};
