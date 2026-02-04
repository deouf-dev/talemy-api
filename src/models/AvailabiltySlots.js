export default (sequelize, DataTypes) => {
  const AvailabilitySlots = sequelize.define(
    "AvailabilitySlots",
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
      dayOfWeek: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: false,
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
      tableName: "availability_slots",
      timestamps: false,
      underscored: true,
    },
  );
  AvailabilitySlots.associate = (models) => {
    AvailabilitySlots.belongsTo(models.User, {
      as: "teacher",
      foreignKey: "teacherUserId",
    });
  };
  return AvailabilitySlots;
};
