import { redisClient } from '../config/redis.config';

export const connect = async()=>{
    return await redisClient.connect();
}
export const disconnect = async()=>{
    return await redisClient.disconnect();
}
export const set = async (key: string, value: any): Promise<any> => {
    if(redisClient.isOpen)
    return await redisClient.set(key, value);
}
export const setEx = async (key: string, value: any, seconds: number): Promise<any> => {
    return await redisClient.setEx(key, seconds, value);
}
export const get = async (key: string): Promise<any> => {
    return await redisClient.get(key);
}
export const del = async (key: string): Promise<any> => {
    return await redisClient.del(key);
}
export const delAll = async (keys: string[]): Promise<any> => {
    return await redisClient.del(keys);
}
export const setExpire = async (key: string, seconds: number): Promise<any> => {
    return await redisClient.expire(key, seconds);
}
export const setExpireIn = async (key: string, seconds: number): Promise<any> => {
    return await redisClient.expire(key, seconds);
}
