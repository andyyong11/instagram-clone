module Api
  class CommentsController < ApplicationController
    before_action :set_post
    before_action :set_comment, only: [:update, :destroy]
    skip_before_action :authenticate_user!, only: [:index]
    before_action :authenticate_if_token_present, only: [:index]
    
    def index
      @comments = @post.comments.includes(:user).order(created_at: :desc)
      
      # Format comments with proper date formatting
      formatted_comments = @comments.map do |comment|
        comment_json = comment.as_json(include: {:user => {only: [:id, :username, :profile_picture]}})
        comment_json['createdAt'] = comment.created_at.iso8601
        comment_json
      end
      
      render json: formatted_comments
    end
    
    def create
      @comment = @post.comments.build(comment_params)
      @comment.user = current_user
      
      if @comment.save
        comment_json = @comment.as_json(include: {:user => {only: [:id, :username, :profile_picture]}})
        comment_json['createdAt'] = @comment.created_at.iso8601
        
        render json: comment_json, status: :created
      else
        render json: { errors: @comment.errors.full_messages }, status: :unprocessable_entity
      end
    end
    
    def update
      if @comment.user_id == current_user.id && @comment.update(comment_params)
        render json: @comment
      else
        render json: { errors: @comment.errors.full_messages }, status: :unprocessable_entity
      end
    end
    
    def destroy
      if @comment.user_id == current_user.id || @post.user_id == current_user.id
        @comment.destroy
        head :no_content
      else
        render json: { error: "Unauthorized" }, status: :unauthorized
      end
    end
    
    private
    
    def authenticate_if_token_present
      if request.headers['Authorization'].present?
        begin
          token = request.headers['Authorization'].split(' ').last
          jwt_payload = JWT.decode(token, Rails.application.credentials.secret_key_base).first
          @current_user_id = jwt_payload['user_id']
        rescue JWT::ExpiredSignature, JWT::VerificationError, JWT::DecodeError
          # Just ignore errors - we don't require authentication for these routes
        end
      end
    end
    
    def set_post
      @post = Post.find(params[:post_id])
    end
    
    def set_comment
      @comment = @post.comments.find(params[:id])
    end
    
    def comment_params
      params.permit(:content)
    end
  end
end 