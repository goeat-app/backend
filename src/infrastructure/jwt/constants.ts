export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'CHANGE_ME_JWT_SECRET',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
};
