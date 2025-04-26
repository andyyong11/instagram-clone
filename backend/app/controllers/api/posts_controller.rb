module Api
  # Controller for handling post-related actions in the API
  # Includes endpoints for CRUD operations, liking/unliking posts,
  # and retrieving post feeds (explore and following)
  class PostsController < ApplicationController
    before_action :set_post, only: [:show, :update, :destroy, :like, :unlike]
    skip_before_action :authenticate_user!, only: [:index, :show]
    before_action :authenticate_if_token_present, only: [:index, :show]

    # GET /api/posts
    # Returns paginated posts based on feed type (explore or following)
    # Optional params:
    # - feed_type: 'following' to get posts from followed users, defaults to explore
    # - page: pagination page number, defaults to 1
    def index
      # Handle feed type parameter
      feed_type = params[:feed_type]
      page = params[:page] || 1
      per_page = 10
      
      if feed_type == 'following' && current_user
        # Get posts from users that the current user is following
        following_ids = current_user.following.pluck(:id)
        
        # If user is not following anyone, return empty posts
        if following_ids.empty?
          @posts = Post.none.page(page).per(per_page)
          Rails.logger.info "Following feed: User is not following anyone, returning empty posts"
          
          # Add a metadata message for the frontend
          return render json: {
            posts: [],
            hasMore: false,
            feedType: 'following',
            message: 'You are not following anyone yet'
          }
        else
          @posts = Post.where(user_id: following_ids)
                      .includes(:user, :comments, :likes)
                      .order(created_at: :desc)
                      .page(page)
                      .per(per_page)
          
          Rails.logger.info "Following feed: Found #{@posts.size} posts from #{following_ids.size} followed users"
        end
      else
        # Original explore behavior - all posts
        @posts = Post.includes(:user, :comments, :likes)
                    .order(created_at: :desc)
                    .page(page)
                    .per(per_page)
      end
      
      # Create a custom JSON response with liked_by information
      posts_with_likes = @posts.map do |post|
        post_json = post.as_json(include: [:user])
        post_json['likedByMe'] = current_user ? post.liked_by?(current_user.id) : false
        post_json['likesCount'] = post.likes_count
        post_json['commentsCount'] = post.comments_count
        post_json['createdAt'] = post.created_at.iso8601
        
        # Add image URL for Active Storage attachments
        if post.image_attachment.present? && post.image_attachment.attached?
          post_json['image'] = Rails.application.routes.url_helpers.url_for(post.image_attachment)
        elsif post.image.present?
          post_json['image'] = post.image
        end
        
        # Debug logging
        Rails.logger.info "Post #{post.id} image URL: #{post_json['image']}"
        
        post_json
      end
      
      render json: {
        posts: posts_with_likes,
        hasMore: @posts.next_page.present?,
        feedType: feed_type || 'explore'
      }
    end

    # GET /api/posts/:id
    # Returns detailed information for a single post including comments
    def show
      post_json = @post.as_json(include: [:user, comments: { include: :user }])
      post_json['likedByMe'] = current_user ? @post.liked_by?(current_user.id) : false
      post_json['likesCount'] = @post.likes_count
      post_json['commentsCount'] = @post.comments_count
      post_json['createdAt'] = @post.created_at.iso8601
      
      # Add image URL for Active Storage attachments
      if @post.image_attachment.present? && @post.image_attachment.attached?
        post_json['image'] = Rails.application.routes.url_helpers.url_for(@post.image_attachment)
      elsif @post.image.present?
        post_json['image'] = @post.image
      end
      
      render json: post_json
    end

    # POST /api/posts
    # Creates a new post with optional image attachment
    def create
      @post = current_user.posts.build(post_params)
      
      # Attach the image if provided
      if params[:image].present?
        @post.image_attachment.attach(params[:image])
      end
      
      if @post.save
        # Create a full response with all needed fields
        post_json = @post.as_json(include: [:user])
        post_json['likesCount'] = 0
        post_json['commentsCount'] = 0
        post_json['likedByMe'] = false
        post_json['createdAt'] = @post.created_at.iso8601
        
        # Add image URL
        if @post.image_attachment.attached?
          post_json['image'] = Rails.application.routes.url_helpers.url_for(@post.image_attachment)
        elsif @post.image.present?
          post_json['image'] = @post.image
        end
        
        render json: post_json, status: :created
      else
        render json: { errors: @post.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # PATCH/PUT /api/posts/:id
    # Updates an existing post if user is authorized
    def update
      if @post.user_id == current_user.id && @post.update(post_params)
        render json: @post
      else
        render json: { errors: @post.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/posts/:id
    # Deletes a post if user is authorized
    def destroy
      if @post.user_id == current_user.id
        @post.destroy
        head :no_content
      else
        render json: { error: "Unauthorized" }, status: :unauthorized
      end
    end

    # POST /api/posts/:id/like
    # Adds a like to the post from current user
    def like
      like = @post.likes.find_or_create_by(user: current_user)
      
      if like.persisted?
        render json: { 
          message: "Post liked successfully",
          likesCount: @post.likes_count,
          likedByMe: true
        }
      else
        render json: { errors: like.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/posts/:id/unlike
    # Removes current user's like from the post
    def unlike
      like = @post.likes.find_by(user: current_user)
      
      if like&.destroy
        render json: { 
          message: "Post unliked successfully",
          likesCount: @post.likes_count,
          likedByMe: false
        }
      else
        render json: { error: "You haven't liked this post" }, status: :not_found
      end
    end

    private

    # Attempts to authenticate user if Authorization header is present
    # Used for optional authentication on public endpoints
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

    # Sets @post instance variable for actions that need it
    def set_post
      @post = Post.find(params[:id])
    end

    # Defines allowed parameters for post creation/updating
    def post_params
      params.permit(:caption, :image)
    end
  end
end 