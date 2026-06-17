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

function fixBrazilianMobileLength(digits) {
  if (digits.length !== 10) return digits;

  const ddd = digits.slice(0, 2);
  const local = digits.slice(2);

  return `${ddd}9${local}`;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT id, phone, whatsapp FROM restaurants WHERE phone IS NOT NULL OR whatsapp IS NOT NULL`,
    );

    for (const row of rows) {
      const phone = fixBrazilianMobileLength(
        normalizePhoneNumber(row.phone) ?? '',
      );
      const whatsapp = fixBrazilianMobileLength(
        normalizePhoneNumber(row.whatsapp) ?? '',
      );

      const normalizedPhone = phone || null;
      const normalizedWhatsapp = whatsapp || null;

      if (
        normalizedPhone === row.phone &&
        normalizedWhatsapp === row.whatsapp
      ) {
        continue;
      }

      await queryInterface.sequelize.query(
        `UPDATE restaurants SET phone = :phone, whatsapp = :whatsapp WHERE id = :id`,
        {
          replacements: {
            id: row.id,
            phone: normalizedPhone,
            whatsapp: normalizedWhatsapp,
          },
        },
      );
    }
  },

  async down() {
    // Dados corrigidos não podem ser revertidos com segurança.
  },
};
