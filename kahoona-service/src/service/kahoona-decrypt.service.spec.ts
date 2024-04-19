import {
  decrypt
} from './kahoona-decrypt.service';
import { DecryptRequestDto } from 'src/dto/decrypt.request.dto';

// jest.mock('../config/data-source.config', () => ({
//   MyDataSource: {
//     isInitialized: false,
//     initialize: jest.fn(),
// getRepository: jest.fn().mockReturnValue({
//   findOneBy: jest.fn(),
//   save: jest.fn(),
//   remove: jest.fn().mockResolvedValue({}),
//   update: jest.fn(),
// }),
// createQueryBuilder: jest.fn().mockReturnValue({
//   delete: jest.fn().mockReturnThis(),
//   from: jest.fn().mockReturnThis(),
//   where: jest.fn().mockReturnThis(),
//   execute: jest.fn().mockResolvedValue({}),
// }),

//   },
// }));

// jest.mock('../config/redis.config', () => ({
//   redisClient: {
//     isOpen: true,
//     isReady: true,
//     connect: jest.fn(),
//     get: jest.fn(),
//     set: jest.fn(),
//   },
// }));

describe('Cache Functions', () => {
  jest.mock('./kahoona-decrypt.service', () => ({
    findBaseById: jest.fn(),
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findCachedBaseById - cache hit', async () => {
    // (redisClient.get as jest.Mock).mockResolvedValueOnce(JSON.stringify({ id: 1, name: 'Sample Base' }));

    const request = new DecryptRequestDto();
    request.encryptedData = "encryptedData";

    const result = await decrypt(request);

    expect(result).toEqual({ id: 1, name: 'Sample Base' });
    // expect(redisClient.get).toHaveBeenCalledWith('base:1');
  });

});
