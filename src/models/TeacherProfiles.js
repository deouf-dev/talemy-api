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
      },
      ratingAvg: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0,
      },
      reviewsCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
      tableName: "teacher_profiles",
      underscored: true,
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
