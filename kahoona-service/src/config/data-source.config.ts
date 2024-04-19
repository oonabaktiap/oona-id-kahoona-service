import { DataSource } from 'typeorm';
import { Base } from '../entity/base.entity';
import dotenv from 'dotenv';


// dotenv.config();
// console.log('database host : ' + process.env.DATABASE_HOST)

//docker run --name postgres-container -p 5432:2345 -e POSTGRES_PASSWORD=password123 -e POSTGRES_USER=admin -d postgres
export const MyDataSource = new DataSource({
  type: 'postgres',
  host: 'host.docker.internal',
  port: 5432,
  username: 'postgres',
  password: 'password',
  database: 'postgres',


  // type: 'postgres',
  // host: process.env.DATABASE_HOST,
  // port: parseInt(process.env.DATABASE_PORT, 10),
  // username: process.env.DATABASE_USERNAME,
  // password: process.env.DATABASE_PASSWORD,
  // database: process.env.DATABASE_SCHEMA,


  synchronize: true,
  logging: false,
  entities: [Base],
  migrations: [],
  subscribers: [],
  // entities: ['../entity/*.entity.ts'],
  // migrations: ['../migration/*.ts'],
});

// MyDataSource.initialize()
//   .then(() => {
//     // console.log(process.env.DATABASE_HOST);
//     // console.log(process.env.DATABASE_PORT);
//     // console.log(process.env.DATABASE_USERNAME);
//     // console.log(process.env.DATABASE_PASSWORD);
//     // console.log(process.env.DATABASE_SCHEMA);
//     console.log('Data Source has been initialized!');
//   })
//   .catch((err) => {
//     console.error('Error during Data Source initialization:', err);
//     // console.log(process.env.DATABASE_HOST);
//     // console.log(process.env.DATABASE_PORT);
//     // console.log(process.env.DATABASE_USERNAME);
//     // console.log(process.env.DATABASE_PASSWORD);
//     // console.log(process.env.DATABASE_SCHEMA);
//   });
