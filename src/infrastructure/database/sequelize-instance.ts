import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(`mysql://${process.env.USER}:${process.env.PASSWORD}@${process.env.HOST}:${process.env.PORT}/${process.env.DATABASE}`,{}
);