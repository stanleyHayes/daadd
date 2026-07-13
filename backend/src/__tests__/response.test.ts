import { success, paginated } from '../utils/response';

describe('response helpers', () => {
  describe('success()', () => {
    it('wraps data with success: true', () => {
      expect(success({ id: 1 })).toEqual({ success: true, data: { id: 1 } });
    });

    it('includes the message when provided', () => {
      expect(success(null, 'done')).toEqual({ success: true, data: null, message: 'done' });
    });

    it('omits the message key when not provided', () => {
      const body = success([1, 2, 3]);
      expect(body).not.toHaveProperty('message');
    });

    it('supports null and undefined payloads', () => {
      expect(success(null).data).toBeNull();
      expect(success(undefined).data).toBeUndefined();
    });
  });

  describe('paginated()', () => {
    it('computes pagination meta fields', () => {
      const body = paginated([1, 2, 3], 25, 2, 10);

      expect(body.success).toBe(true);
      expect(body.data).toEqual([1, 2, 3]);
      expect(body.pagination).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });

    it('handles an empty result set (totalPages falls back to 1)', () => {
      const body = paginated([], 0, 1, 10);

      expect(body.data).toEqual([]);
      expect(body.pagination.total).toBe(0);
      expect(body.pagination.totalPages).toBe(1);
      expect(body.pagination.hasNext).toBe(false);
      expect(body.pagination.hasPrev).toBe(false);
    });

    it('flags the first page of many', () => {
      const body = paginated([1], 30, 1, 10);

      expect(body.pagination.hasNext).toBe(true);
      expect(body.pagination.hasPrev).toBe(false);
    });

    it('flags the last page (including a partial one)', () => {
      const body = paginated([1, 2, 3], 23, 3, 10);

      expect(body.pagination.totalPages).toBe(3);
      expect(body.pagination.hasNext).toBe(false);
      expect(body.pagination.hasPrev).toBe(true);
    });

    it('handles a page beyond the bounds without a next page', () => {
      const body = paginated([], 10, 5, 10);

      expect(body.pagination.totalPages).toBe(1);
      expect(body.pagination.hasNext).toBe(false);
      expect(body.pagination.hasPrev).toBe(true);
    });

    it('rounds totalPages up for exact and non-exact divisions', () => {
      expect(paginated([], 20, 1, 10).pagination.totalPages).toBe(2);
      expect(paginated([], 21, 1, 10).pagination.totalPages).toBe(3);
    });
  });
});
