import { DataSource } from 'typeorm';
import { Base } from '../entity/base.entity';


export const MyDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'password',
    database: 'postgres',


    synchronize: true,
    logging: false,
    // entities: [Base],
    // migrations: [],
    entities: ["dist/src/entity/*entity{.js,.ts}"],
    migrations: ["dist/src/migration/**/*{.js,.ts}"],
    subscribers: ["dist/src/subscribers/**/*{.js,.ts}"],
});

