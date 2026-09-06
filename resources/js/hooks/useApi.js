import { useState, useCallback } from 'react';
import api from '../services/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const get = useCallback(async (url) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(url);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const post = useCallback(async (url, payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(url, payload);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const put = useCallback(async (url, payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.put(url, payload);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const patch = useCallback(async (url, payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.patch(url, payload);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const del = useCallback(async (url) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.delete(url);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { get, post, put, patch, del, loading, error };
};
