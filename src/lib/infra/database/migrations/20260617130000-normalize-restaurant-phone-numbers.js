'use strict';

function normalizePhoneNumber(value) {
  if (!value) return null;

  const digits = String(value).replace(/\D/g, '');
  if (!digits) return null;

  if (digits.length >= 12 && digits.startsWith('55')) {
    return digits.slice(2);
  }

  return digits;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT id, phone, whatsapp FROM restaurants WHERE phone IS NOT NULL OR whatsapp IS NOT NULL`,
    );

    for (const row of rows) {
      const phone = normalizePhoneNumber(row.phone);
      const whatsapp = normalizePhoneNumber(row.whatsapp);

      if (phone === row.phone && whatsapp === row.whatsapp) {
        continue;
      }

      await queryInterface.sequelize.query(
        `UPDATE restaurants SET phone = :phone, whatsapp = :whatsapp WHERE id = :id`,
        {
          replacements: { id: row.id, phone, whatsapp },
        },
      );
    }
  },

  async down() {
    // Dados normalizados não podem ser revertidos com segurança.
  },
};
