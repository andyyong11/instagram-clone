# Instagram Clone

A full-stack Instagram clone built with React, Ruby on Rails, and PostgreSQL.

## Features

- User authentication (register/login)
- Create and view posts
- Like and comment on posts
- Follow/unfollow users
- User profiles
- Image upload

## Prerequisites

- Ruby (3.0 or higher)
- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Setup

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   bundle install
   ```
3. Set up the database:
   ```bash
   rails db:create db:migrate db:seed
   ```
4. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```
5. Start the servers:
   
   **Option 1: Start both servers at once using Foreman**
   ```bash
   # From project root
   foreman start
   ```
   
   **Option 2: Start servers separately**
   ```bash
   # In one terminal window (from project root)
   cd backend && rails server -p 3000
   
   # In another terminal window (from project root)
   cd frontend && npm start
   ```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user

### Posts
- POST /api/posts - Create a new post
- GET /api/posts - Get all posts
- GET /api/posts/user/:userId - Get posts by user
- PUT /api/posts/like/:id - Like a post
- POST /api/posts/comment/:id - Add a comment to a post

### Users
- GET /api/users - Get all users
- GET /api/users/:id - Get user by ID
- PUT /api/users/follow/:id - Follow a user
- PUT /api/users/unfollow/:id - Unfollow a user

## License

MIT
