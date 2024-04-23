import {
    connect,
    disconnect,
    set,
    setEx,
    get,
    del,
    delAll,
    setExpire,
    setExpireIn
} from './redis.util';

import { redisClient } from '../config/redis.config';

// Mock the redis client
jest.mock('../config/redis.config', () => ({
    redisClient: {
        isOpen: true,
        connect: jest.fn(),
        disconnect: jest.fn(),
        set: jest.fn(),
        setEx: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
        expire: jest.fn(),
    },
}));

describe('Redis Utility Functions', () => {
    beforeEach(() => {
        // Clear mock calls before each test
        jest.clearAllMocks();
    });

    test('connect', async () => {
        // Call the function
        await connect();

        // Expectations
        expect(redisClient.connect).toHaveBeenCalled();
    });

    test('disconnect', async () => {
        // Call the function
        await disconnect();

        // Expectations
        expect(redisClient.disconnect).toHaveBeenCalled();
    });

    test('set', async () => {
        // Call the function
        await set('testKey', 'testValue');

        // Expectations
        expect(redisClient.set).toHaveBeenCalledWith('testKey', 'testValue');
    });

    test('setEx', async () => {
        // Call the function
        await setEx('testKey', 'testValue', 60);

        // Expectations
        expect(redisClient.setEx).toHaveBeenCalledWith('testKey', 60, 'testValue');
    });

    test('get', async () => {
        // Mock redis client's get method to return a value
        (redisClient.get as jest.Mock).mockResolvedValueOnce('testValue');

        // Call the function
        const result = await get('testKey');

        // Expectations
        expect(result).toEqual('testValue');
        expect(redisClient.get).toHaveBeenCalledWith('testKey');
    });

    test('del', async () => {
        // Call the function
        await del('testKey');

        // Expectations
        expect(redisClient.del).toHaveBeenCalledWith('testKey');
    });

    test('delAll', async () => {
        // Call the function
        await delAll(['testKey1', 'testKey2']);

        // Expectations
        expect(redisClient.del).toHaveBeenCalledWith(['testKey1', 'testKey2']);
    });

    test('setExpire', async () => {
        // Call the function
        await setExpire('testKey', 60);

        // Expectations
        expect(redisClient.expire).toHaveBeenCalledWith('testKey', 60);
    });

    test('setExpireIn', async () => {
        // Call the function
        await setExpireIn('testKey', 60);

        // Expectations
        expect(redisClient.expire).toHaveBeenCalledWith('testKey', 60);
    });
});
