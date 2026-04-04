import api from './axios';
import type { ApiResponse, PaginatedResponse, Tweet } from '../types';

export const getTimeline = async (page = 1): Promise<PaginatedResponse<Tweet>> => {
  const { data } = await api.get(`/tweets?page=${page}`);
  return data;
};

export const getExplore = async (page = 1): Promise<PaginatedResponse<Tweet>> => {
  const { data } = await api.get(`/tweets/explore?page=${page}`);
  return data;
};

export const getTweetDetail = async (id: number): Promise<ApiResponse<Tweet>> => {
  const { data } = await api.get(`/tweets/${id}`);
  return data;
};

export const getTweetReplies = async (id: number, page = 1): Promise<PaginatedResponse<Tweet>> => {
  const { data } = await api.get(`/tweets/${id}/replies?page=${page}`);
  return data;
};

export const createTweet = async (tweetData: {content?: string, media?: string[]}): Promise<ApiResponse<Tweet>> => {
  const { data } = await api.post('/tweets', tweetData);
  return data;
};

export const replyToTweet = async (id: number, tweetData: {content?: string, media?: string[]}): Promise<ApiResponse<Tweet>> => {
  const { data } = await api.post(`/tweets/${id}/reply`, tweetData);
  return data;
};

export const toggleLike = async (id: number): Promise<ApiResponse<{is_liked: boolean, likes_count: number}>> => {
  const { data } = await api.post(`/tweets/${id}/like`);
  return data;
};

export const toggleRetweet = async (id: number): Promise<ApiResponse<{is_retweeted: boolean, retweets_count: number}>> => {
  const { data } = await api.post(`/tweets/${id}/retweet`);
  return data;
};

export const toggleBookmark = async (id: number): Promise<ApiResponse<{is_bookmarked: boolean, bookmarks_count: number}>> => {
  const { data } = await api.post(`/tweets/${id}/bookmark`);
  return data;
};

export const deleteTweet = async (id: number): Promise<ApiResponse<void>> => {
  const { data } = await api.delete(`/tweets/${id}`);
  return data;
};
