import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'base' })
export class Base {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: null, type: 'varchar' })
    varString: string;

    @Column({ default: null, type: 'int' })
    varNumber: number;

    @Column({ type: 'int', default: null })
    age: number;

}
