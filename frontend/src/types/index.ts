export interface User {
  id: number;
  username: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  profile_picture?: string;
  profile_picture_url?: string;
  avatar?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowedByMe?: boolean;
  followers?: any[];
  _cache?: number;
}

export interface Post {
  id: number;
  caption: string;
  image: string;
  createdAt: string;
  user: User;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  location?: string;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: User;
}

export interface AuthResponse {
  status: string;
  message: string;
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  bio?: string;
}

export interface CreatePostData {
  caption: string;
  image: File;
} 