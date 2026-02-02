"use strict";

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("teacher_profiles", {
      user_id: {
        type: Sequelize.INTEGER,
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
        type: Sequelize.TEXT,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      hourly_rate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      rating_avg: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      reviews_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("teacher_profiles");
  },
};
