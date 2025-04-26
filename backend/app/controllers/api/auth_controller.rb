module Api
  class AuthController < ApplicationController
    # Skip authentication for register and login endpoints since users won't have tokens yet
    skip_before_action :authenticate_user!, only: [:register, :login]

    def register
      # Create new user with permitted parameters
      user = User.new(user_params)
      
      if user.save
        # Generate JWT token valid for 24 hours
        token = JWT.encode(
          { user_id: user.id, exp: 24.hours.from_now.to_i },
          Rails.application.credentials.secret_key_base
        )
        
        # Return success response with token and user details
        render json: { 
          status: 'success', 
          message: 'User created successfully',
          token: token,
          user: user.as_json(only: [:id, :username, :email, :bio, :profile_picture])
        }, status: :created
      else
        # Return error if user creation failed
        render json: { 
          status: 'error', 
          message: 'User could not be created', 
          errors: user.errors.full_messages 
        }, status: :unprocessable_entity
      end
    end

    def login
      # Find user by email
      user = User.find_by(email: params[:email])
      
      # Check if user exists and password is valid
      if user&.valid_password?(params[:password])
        # Generate JWT token valid for 24 hours
        token = JWT.encode(
          { user_id: user.id, exp: 24.hours.from_now.to_i },
          Rails.application.credentials.secret_key_base
        )
        
        # Return success response with token and user details
        render json: { 
          status: 'success', 
          message: 'Logged in successfully',
          token: token,
          user: user.as_json(only: [:id, :username, :email, :bio, :profile_picture])
        }
      else
        # Return error for invalid credentials
        render json: { 
          status: 'error', 
          message: 'Invalid email or password' 
        }, status: :unauthorized
      end
    end

    private

    # Define permitted parameters for user creation
    def user_params
      params.permit(:username, :email, :password, :bio)
    end
  end
end 