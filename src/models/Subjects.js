export default (sequelize, DataTypes) => {
  const Subjects = sequelize.define(
    "Subjects",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "subjects",
      timestamps: false,
    },
  );
  Subjects.associate = (models) => {
    Subjects.belongsToMany(models.User, {
      through: models.TeacherSubjects,
      foreignKey: "subjectId",
      otherKey: "userId",
      as: "teachers",
    });
  };
  return Subjects;
};
