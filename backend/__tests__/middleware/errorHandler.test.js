const errorHandler = require('../../src/middleware/errorHandler');

describe('errorHandler middleware', () => {
  test('responds with provided status and message', () => {
    const err = new Error('Failure');
    err.status = 418;
    err.details = { info: 'test' };
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    errorHandler(err, req, res);

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failure', details: { info: 'test' } });
  });

  test('defaults to 500 when status missing', () => {
    const err = new Error();
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    errorHandler(err, req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error', details: undefined });
  });
});
