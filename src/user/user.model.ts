import { Column, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'user',
    freezeTableName: true
    })
export class User extends Model {
    @Column({ primaryKey: true, autoIncrement: true })
    declare id: number;

    @Column
    declare username: string;

    @Column
    declare email: string;

    @Column
    declare password: string;

    @Column({ defaultValue: 0 })
    declare tokenVersion: number;

    @Column 
    declare phone: string;

    @Column
    declare createdAt: Date;

    @Column
    declare updatedAt: Date;    
}