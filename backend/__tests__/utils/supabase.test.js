const { toHttpError } = require('../../src/utils/supabase');

describe('supabase utils', () => {
  test('toHttpError returns null when no error provided', () => {
    expect(toHttpError(null)).toBeNull();
  });

  test('toHttpError maps supabase error details', () => {
    const input = {
      message: 'fail',
      hint: 'try again',
      details: 'bad request',
      code: '400',
    };

    const err = toHttpError(input, 'custom message');

    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('custom message');
    expect(err.status).toBe(500);
    expect(err.details).toEqual({
      message: 'fail',
      hint: 'try again',
      details: 'bad request',
      code: '400',
    });
  });
});
