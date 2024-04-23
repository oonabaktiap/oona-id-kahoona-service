import { createClient } from 'redis';
// import dotenv from 'dotenv';

// dotenv.config();


export const redisClient = createClient(
  { url: 'redis://host.docker.internal:6379' }
  // { url: `redis://${process.env.REDIS_HOST}:${parseInt(process.env.REDIS_PORT || '6379', 10)}` }
  //   {
  //     password: '',
  //     socket: {
  //         host: 'host.docker.internal',
  //         port: 6379,
  //     }


  //     // password: process.env.REDIS_PASSWORD,
  //     // socket: {
  //     //     host: process.env.REDIS_HOST,
  //     //     port: parseInt(process.env.REDIS_PORT || '6379', 10)
  //     // }
  // }
);

// redisClient.connect().then(() => {
//   // console.log('redis details')
//   // console.log(process.env.REDIS_HOST);
//   // console.log(process.env.REDIS_PORT);
//   // console.log(process.env.REDIS_PASSWORD);
//   console.log('Redis connection established ');
// })
//   .catch((err) => {
//     console.error('Error during Redis connection: with details ', err);
//     // console.log(process.env.REDIS_HOST);
//     // console.log(process.env.REDIS_PORT);
//     // console.log(process.env.REDIS_PASSWORD);
//   });
