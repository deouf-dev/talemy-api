export default (sequelize, DataTypes) => {
  const Reviews = sequelize.define(
    "Reviews",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
      rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "reviews",
      timestamps: false,
      underscored: true,
    },
  );
  Reviews.associate = (models) => {
    Reviews.belongsTo(models.User, {
      as: "teacher",
      foreignKey: "teacherUserId",
    });
    Reviews.belongsTo(models.User, {
      as: "student",
      foreignKey: "studentUserId",
    });
  };
  return Reviews;
};
