import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const validDdds = [
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '21',
  '22',
  '24',
  '27',
  '28',
  '31',
  '32',
  '33',
  '34',
  '35',
  '37',
  '38',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '47',
  '48',
  '49',
  '51',
  '53',
  '54',
  '55',
  '61',
  '62',
  '63',
  '64',
  '65',
  '66',
  '67',
  '68',
  '69',
  '71',
  '73',
  '74',
  '75',
  '77',
  '79',
  '81',
  '82',
  '83',
  '84',
  '85',
  '86',
  '87',
  '88',
  '89',
  '91',
  '92',
  '93',
  '94',
  '95',
  '96',
  '97',
  '98',
  '99',
];

const UpdateUserSchema = z.object({
  name: z.string().trim().min(3, 'Nome completo deve ter ao menos 3 caracteres'),
  email: z.string().trim().email('E-mail invalido'),
  phone: z
    .string()
    .regex(/^\((\d{2})\)\s9\d{4}-\d{4}$/, 'Telefone invalido. Use (11) 91111-1111')
    .refine((phone) => validDdds.includes(phone.slice(1, 3)), {
      message: 'DDD invalido',
    }),
  birthDate: z.coerce
    .date()
    .refine((date) => !Number.isNaN(date.getTime()), 'Data de nascimento invalida')
    .refine((date) => date <= new Date(), 'Data de nascimento nao pode ser futura')
    .transform((date) => date.toISOString().split('T')[0]),
  cpf: z
    .string()
    .trim()
    .regex(/^\d{11}$/, 'CPF invalido. Informe somente 11 digitos')
    .optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

export type UpdateUserType = z.infer<typeof UpdateUserSchema>;
