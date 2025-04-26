module Api
  class ActivitiesController < ApplicationController
    before_action :authenticate_user!
    
    def index
      # Get combined activities (likes, comments, follows)
      @activities = []
      
      # Get likes on current user's posts
      likes = Like.joins(:post)
                 .where(posts: { user_id: current_user.id })
                 .where.not(user_id: current_user.id)
                 .includes(:user, :post)
                 .order(created_at: :desc)
                 .limit(20)
      
      # Get comments on current user's posts
      comments = Comment.joins(:post)
                       .where(posts: { user_id: current_user.id })
                       .where.not(user_id: current_user.id)
                       .includes(:user, :post)
                       .order(created_at: :desc)
                       .limit(20)
      
      # Get follows for current user
      follows = Follow.where(followed_id: current_user.id)
                     .includes(:follower)
                     .order(created_at: :desc)
                     .limit(20)
      
      # Combine and transform the data
      likes.each do |like|
        @activities << {
          id: "like_#{like.id}",
          type: 'like',
          userId: like.user_id,
          username: like.user.username,
          userAvatar: like.user.profile_picture,
          postId: like.post_id,
          postImage: get_post_image_url(like.post),
          timestamp: like.created_at.iso8601
        }
      end
      
      comments.each do |comment|
        @activities << {
          id: "comment_#{comment.id}",
          type: 'comment',
          userId: comment.user_id,
          username: comment.user.username,
          userAvatar: comment.user.profile_picture,
          postId: comment.post_id,
          comment: comment.content,
          postImage: get_post_image_url(comment.post),
          timestamp: comment.created_at.iso8601
        }
      end
      
      follows.each do |follow|
        @activities << {
          id: "follow_#{follow.id}",
          type: 'follow',
          userId: follow.follower_id,
          username: follow.follower.username,
          userAvatar: follow.follower.profile_picture,
          timestamp: follow.created_at.iso8601
        }
      end
      
      # Sort all activities by timestamp (newest first)
      @activities.sort_by! { |activity| activity[:timestamp] }.reverse!
      
      render json: @activities
    end
    
    def likes
      # Get likes on current user's posts
      likes = Like.joins(:post)
                 .where(posts: { user_id: current_user.id })
                 .where.not(user_id: current_user.id)
                 .includes(:user, :post)
                 .order(created_at: :desc)
                 .limit(50)
      
      @likes_activities = likes.map do |like|
        {
          id: "like_#{like.id}",
          type: 'like',
          userId: like.user_id,
          username: like.user.username,
          userAvatar: like.user.profile_picture,
          postId: like.post_id,
          postImage: get_post_image_url(like.post),
          timestamp: like.created_at.iso8601
        }
      end
      
      render json: @likes_activities
    end
    
    def comments
      # Get comments on current user's posts
      comments = Comment.joins(:post)
                       .where(posts: { user_id: current_user.id })
                       .where.not(user_id: current_user.id)
                       .includes(:user, :post)
                       .order(created_at: :desc)
                       .limit(50)
      
      @comments_activities = comments.map do |comment|
        {
          id: "comment_#{comment.id}",
          type: 'comment',
          userId: comment.user_id,
          username: comment.user.username,
          userAvatar: comment.user.profile_picture,
          postId: comment.post_id,
          comment: comment.content,
          postImage: get_post_image_url(comment.post),
          timestamp: comment.created_at.iso8601
        }
      end
      
      render json: @comments_activities
    end
    
    def follows
      # Get follows for current user
      follows = Follow.where(followed_id: current_user.id)
                     .includes(:follower)
                     .order(created_at: :desc)
                     .limit(50)
      
      @follows_activities = follows.map do |follow|
        {
          id: "follow_#{follow.id}",
          type: 'follow',
          userId: follow.follower_id,
          username: follow.follower.username,
          userAvatar: follow.follower.profile_picture,
          timestamp: follow.created_at.iso8601
        }
      end
      
      render json: @follows_activities
    end
    
    private
    
    # Helper method to get proper image URL
    def get_post_image_url(post)
      return nil unless post
      
      if post.image_attachment.present? && post.image_attachment.attached?
        # Use url_for with host for complete URL or rails_blob_path for relative path
        Rails.application.routes.url_helpers.url_for(post.image_attachment)
      elsif post.image.is_a?(String)
        # If it's already a string path/url, return it
        post.image
      else
        # Return nil if no valid image
        nil
      end
    rescue => e
      Rails.logger.error "Error getting post image URL: #{e.message}"
      nil
    end
  end
end 