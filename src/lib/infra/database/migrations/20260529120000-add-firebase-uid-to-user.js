'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user', 'firebase_uid', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addIndex('user', ['firebase_uid'], {
      unique: true,
      name: 'user_firebase_uid_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('user', 'user_firebase_uid_unique');
    await queryInterface.removeColumn('user', 'firebase_uid');
  },
};
