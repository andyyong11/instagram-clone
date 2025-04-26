module Api
  # Controller for managing user-related actions in the API
  # Includes endpoints for viewing profiles, managing follows,
  # and retrieving user posts
  class UsersController < ApplicationController
    include Rails.application.routes.url_helpers
    
    before_action :set_user, only: [:show, :update, :follow, :unfollow, :posts]
    skip_before_action :authenticate_user!, only: [:posts]

    # GET /api/users/:id
    # Returns detailed profile information for a user including:
    # - Basic user details (id, username, bio, etc)
    # - Follow counts (followers and following)
    # - Whether the current user follows this user
    def show
      Rails.logger.info "PROFILE REQUEST: Getting profile for user #{@user.id}"
      
      # Check if current user is following this user
      is_following = current_user && current_user.following?(@user)
      Rails.logger.info "User #{current_user&.id} following user #{@user.id}? #{is_following}"
      
      # Get user's follower and following counts
      followers_count = @user.followers_count
      following_count = @user.following_count
      posts_count = @user.posts_count
      
      Rails.logger.info "User #{@user.id} has #{followers_count} followers, #{following_count} following, and #{posts_count} posts"
      
      # Return user details with follower/following counts and follow status
      begin
        user_json = @user.as_json(only: [:id, :username, :bio, :email, :created_at])
        
        # Add additional fields
        user_json['followersCount'] = followers_count
        user_json['followingCount'] = following_count
        user_json['postsCount'] = posts_count
        user_json['isFollowedByMe'] = is_following
        
        Rails.logger.info "Successfully generated user profile JSON with isFollowedByMe = #{is_following}"
      rescue => e
        Rails.logger.error "Error generating user profile: #{e.message}"
        
        # Fallback in case of error
        user_json = {
          id: @user.id,
          username: @user.username,
          bio: @user.bio,
          email: @user.email,
          created_at: @user.created_at,
          followersCount: followers_count,
          followingCount: following_count,
          postsCount: posts_count,
          isFollowedByMe: is_following
        }
        
        Rails.logger.info "Returning fallback user JSON due to error"
      end
      
      render json: user_json
    end

    # GET /api/users/:id/posts
    # Returns paginated posts for a specific user
    # Optional params:
    # - page: pagination page number, defaults to 1
    def posts
      page = params[:page] || 1
      per_page = 10
      
      @posts = @user.posts.includes(:user, :comments, :likes)
                     .order(created_at: :desc)
                     .offset((page.to_i - 1) * per_page)
                     .limit(per_page)
      
      total_posts = @user.posts.count
      has_more = total_posts > ((page.to_i - 1) * per_page) + @posts.length
      
      # Format the posts similar to the PostsController
      posts_with_details = @posts.map do |post|
        post_json = post.as_json(include: { user: { only: [:id, :username] } })
        post_json['likesCount'] = post.likes.count
        post_json['commentsCount'] = post.comments.count
        post_json['createdAt'] = post.created_at.iso8601
        
        # Check if current user has liked this post
        if current_user
          post_json['likedByMe'] = post.likes.exists?(user_id: current_user.id)
        end
        
        # Add image URL if attached
        if post.image_attachment.present? && post.image_attachment.attached?
          # Use the url_for helper to generate a proper URL
          post_json['image'] = Rails.application.routes.url_helpers.url_for(post.image_attachment)
        elsif post.image.present?
          # Use the direct image URL if there's one stored as a string
          post_json['image'] = post.image
        end

        # Debug log
        Rails.logger.info "Post #{post.id} image URL: #{post_json['image']}"
        
        post_json
      end
      
      render json: {
        posts: posts_with_details,
        hasMore: has_more,
        total: total_posts
      }
    end

    # PATCH/PUT /api/users/:id
    # Updates user profile information if authorized
    # Allowed params: username, email, bio
    def update
      Rails.logger.info "Update request received for user #{@user.id}"
      Rails.logger.info "Parameters: #{params.inspect}"

      if @user.id == current_user.id
        if @user.update(user_params)
          render json: @user.as_json
        else
          Rails.logger.error "User update failed: #{@user.errors.full_messages}"
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end
      else
        Rails.logger.error "Unauthorized update attempt for user #{@user.id} by user #{current_user.id}"
        render json: { error: "Unauthorized" }, status: :unauthorized
      end
    end

    # POST /api/users/:id/follow
    # Creates a follow relationship between current user and target user
    # Uses direct SQL for better reliability
    def follow
      Rails.logger.info "FOLLOW REQUEST: User #{current_user.id} attempting to follow user #{@user.id}"
      
      if @user.id != current_user.id
        begin
          # Check if already following using direct SQL
          follow_exists = ActiveRecord::Base.connection.execute(
            "SELECT 1 FROM follows WHERE follower_id = #{current_user.id} AND followed_id = #{@user.id} LIMIT 1"
          ).any?
          
          Rails.logger.info "FOLLOW CHECK: User #{current_user.id} already following user #{@user.id}? #{follow_exists}"
          
          unless follow_exists
            # Insert with direct SQL to ensure it's committed
            ActiveRecord::Base.connection.execute(
              "INSERT INTO follows (follower_id, followed_id, created_at, updated_at) VALUES (#{current_user.id}, #{@user.id}, NOW(), NOW())"
            )
            Rails.logger.info "FOLLOW SQL: Directly inserted follow relationship"
            
            # Force commit
            ActiveRecord::Base.connection.execute("COMMIT")
          end
          
          # Verify the follow exists
          follow_count = ActiveRecord::Base.connection.execute(
            "SELECT COUNT(*) FROM follows WHERE follower_id = #{current_user.id} AND followed_id = #{@user.id}"
          ).first["count"]
          
          Rails.logger.info "FOLLOW VERIFY: Found #{follow_count} follow relationships"
          
          # Calculate followers count
          followers_count = ActiveRecord::Base.connection.execute(
            "SELECT COUNT(*) FROM follows WHERE followed_id = #{@user.id}"
          ).first["count"]
          
          # Return the updated follower count
          render json: { 
            message: "Successfully followed user",
            followersCount: followers_count,
            isFollowing: true
          }
        rescue => e
          Rails.logger.error "FOLLOW ERROR: #{e.message}\n#{e.backtrace.join("\n")}"
          render json: { error: "Failed to follow user: #{e.message}" }, status: :unprocessable_entity
        end
      else
        render json: { error: "You cannot follow yourself" }, status: :unprocessable_entity
      end
    end

    # DELETE /api/users/:id/unfollow
    # Removes a follow relationship between current user and target user
    # Uses direct SQL for better reliability
    def unfollow
      Rails.logger.info "UNFOLLOW REQUEST: User #{current_user.id} attempting to unfollow user #{@user.id}"
      
      if @user.id != current_user.id
        begin
          # Check if following exists using direct SQL
          follow_exists = ActiveRecord::Base.connection.execute(
            "SELECT 1 FROM follows WHERE follower_id = #{current_user.id} AND followed_id = #{@user.id} LIMIT 1"
          ).any?
          
          Rails.logger.info "UNFOLLOW CHECK: User #{current_user.id} follows user #{@user.id}? #{follow_exists}"
          
          if follow_exists
            # Delete with direct SQL to ensure it's committed
            ActiveRecord::Base.connection.execute(
              "DELETE FROM follows WHERE follower_id = #{current_user.id} AND followed_id = #{@user.id}"
            )
            Rails.logger.info "UNFOLLOW SQL: Directly deleted follow relationship"
            
            # Force commit
            ActiveRecord::Base.connection.execute("COMMIT")
          end
          
          # Verify the follow is gone
          follow_count = ActiveRecord::Base.connection.execute(
            "SELECT COUNT(*) FROM follows WHERE follower_id = #{current_user.id} AND followed_id = #{@user.id}"
          ).first["count"]
          
          Rails.logger.info "UNFOLLOW VERIFY: Found #{follow_count} follow relationships"
          
          # Calculate followers count
          followers_count = ActiveRecord::Base.connection.execute(
            "SELECT COUNT(*) FROM follows WHERE followed_id = #{@user.id}"
          ).first["count"]
          
          # Return the updated follower count
          render json: { 
            message: "Successfully unfollowed user",
            followersCount: followers_count,
            isFollowing: false
          }
        rescue => e
          Rails.logger.error "UNFOLLOW ERROR: #{e.message}\n#{e.backtrace.join("\n")}"
          render json: { error: "Failed to unfollow user: #{e.message}" }, status: :unprocessable_entity
        end
      else
        render json: { error: "You cannot unfollow yourself" }, status: :unprocessable_entity
      end
    end

    private

    # Sets @user instance variable for actions that need it
    def set_user
      @user = User.find(params[:id])
    end

    # Defines allowed parameters for user updates
    def user_params
      params.permit(:username, :email, :bio)
    end
  end
end 