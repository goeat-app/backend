import { Column, DataType, Default, Model, Table, PrimaryKey, AllowNull } from 'sequelize-typescript';

@Table({
    tableName: 'user',
    freezeTableName: true
    })
export class User extends Model {
    
    @Default(DataType.UUIDV4)
    @PrimaryKey
    @AllowNull(false)
    @Column({ type: DataType.UUID })
    declare id: string;

    @Column
    declare name: string;

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