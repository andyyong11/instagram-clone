Rails.application.routes.draw do
  # Temporarily comment out Devise routes until setup is complete
  # devise_for :users,
  #            controllers: {
  #              sessions: 'users/sessions',
  #              registrations: 'users/registrations'
  #            }

  # API routes namespace containing all API endpoints
  namespace :api do
    # Authentication routes
    post '/auth/login', to: 'auth#login'         # Login existing user
    post '/auth/register', to: 'auth#register'   # Register new user
    
    # User routes for profile management and following
    resources :users, only: [:show, :update] do
      member do
        post :follow     # Follow another user
        post :unfollow   # Unfollow another user
        get :posts       # Get posts for a specific user
      end
    end

    # Post routes including nested comment resources
    resources :posts, only: [:index, :show, :create, :update, :destroy] do
      # Nested comments routes for each post
      resources :comments, only: [:index, :create, :update, :destroy]
      member do
        post :like      # Like a post
        post :unlike    # Unlike a post
      end
    end
    
    # Activities routes for tracking user interactions
    resources :activities, only: [:index] do
      collection do
        get :likes      # Get all likes activity
        get :comments   # Get all comments activity
        get :follows    # Get all follows activity
      end
    end

  end

  # Health check endpoint for monitoring application status
  get "up" => "rails/health#show", as: :rails_health_check

  # Root path route currently commented out
  # root "posts#index"
end
