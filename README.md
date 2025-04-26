# Instagram Clone

A full-stack Instagram clone built with React, Ruby on Rails, and PostgreSQL.

## Features

- User authentication (register/login)
- Create and view posts
- Like and comment on posts
- Follow/unfollow users
- User profiles
- Image upload

## Tech Stack

- **Frontend**: React, TypeScript, Material-UI
- **Backend**: Ruby on Rails
- **Database**: PostgreSQL
- **Storage**: Active Storage with local storage (configurable for cloud storage)
- **Authentication**: JWT (JSON Web Tokens)

## Prerequisites

- Ruby (3.0 or higher)
- Node.js (v14 or higher)
- PostgreSQL
- PgAdmin (for database management)
- npm or yarn
- Foreman (`gem install foreman`) for running multiple processes

## Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/andyyong11/instagram-clone.git
cd instagram-clone
```

### 2. Database Setup
You have two options for database setup:

#### Option 1: Restore from backup (Recommended)
A backup of the database is included in the root directory as `Instagram_Clone_PSQL`.

1. Open PgAdmin
2. Create a new database named `instagram_clone_development`
3. Right-click on the database and select "Restore"
4. Select the `Instagram_Clone_PSQL` file from the project root directory
5. Complete the restore process

#### Option 2: Create and seed a new database
```bash
# Navigate to backend directory
cd backend

# Run database creation and migrations
rails db:create db:migrate db:seed
```

### 3. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Ruby dependencies
bundle install

# Skip database setup if you restored from backup in the previous step
# Otherwise run: rails db:create db:migrate db:seed

# Create config/master.key or set RAILS_MASTER_KEY env variable
# (Contact repository owner for the master key if needed)
```

### 4. Frontend Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Install JavaScript dependencies
npm install
# or if you use yarn
yarn install
```

## Running the Application

### Option 1: Using Foreman (recommended for development)
```bash
# From project root
foreman start
```

### Option 2: Running servers separately
```bash
# In one terminal (backend)
cd backend
rails server -p 3001

# In another terminal (frontend)
cd frontend
npm start
```

The application should now be running at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Deployment

This project can be deployed to any platform that supports Rails and React applications:

- **Backend**: Deploy as a standard Rails API application
- **Frontend**: Build (`npm run build`) and deploy the static files to a web server or CDN

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

## Troubleshooting

- **Database connection issues**: Ensure PostgreSQL is running and credentials in `config/database.yml` are correct
- **Image upload issues**: Check that Active Storage is properly configured
- **CORS issues**: Verify CORS settings in `config/initializers/cors.rb` if API calls fail

## License

MIT
