"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("subjects", [
      { name: "Mathématiques" },
      { name: "Physique" },
      { name: "Chimie" },
      { name: "SVT" },
      { name: "Histoire-Géographie" },
      { name: "Littérature" },
      { name: "Informatique" },
      { name: "SES (économie)" },
      { name: "Philosophie" },
      { name: "Anglais" },
      { name: "Espagnol" },
      { name: "Allemand" },
      { name: "Italien" },
      { name: "Arts" },
      { name: "Musique" },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("subjects", null, {});
  },
};
