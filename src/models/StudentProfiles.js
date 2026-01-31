export default (sequelize, DataTypes) => {
  return sequelize.define(
    "StudentProfiles",
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
      city: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      level: {
        type: DataTypes.ENUM(
          "MIDDLE_SCHOOL",
          "HIGH_SCHOOL",
          "UNIVERSITY",
          "OTHER",
        ),
        allowNull: true,
      },
      track: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "student_profiles",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
};
