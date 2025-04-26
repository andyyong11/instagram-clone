require 'securerandom'

class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable if defined?(Devise)

  # Remove avatar attachment
  # has_one_attached :avatar

  # Add a method to generate JTI for JWT auth
  def generate_jwt
    self.jti = SecureRandom.uuid
  end

  # Make sure to set JTI before creating a user
  before_create :generate_jwt

  has_many :posts, dependent: :destroy
  has_many :comments, dependent: :destroy
  has_many :likes, dependent: :destroy

  has_many :active_follows, class_name: "Follow",
                          foreign_key: "follower_id",
                          dependent: :destroy
  has_many :passive_follows, class_name: "Follow",
                           foreign_key: "followed_id",
                           dependent: :destroy
  has_many :following, through: :active_follows, source: :followed
  has_many :followers, through: :passive_follows, source: :follower

  validates :username, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true
  validates :bio, length: { maximum: 150 }, allow_blank: true

  # Virtual attributes for API responses
  def posts_count
    posts.count
  end

  def followers_count
    # Count directly from the database instead of using the association
    # This ensures we get the accurate count even if associations are not loaded
    count = Follow.where(followed_id: id).count
    Rails.logger.info "Calculating followers count for user #{id} directly from database: #{count}"
    count
  end

  def following_count
    # Count directly from the database instead of using the association
    count = Follow.where(follower_id: id).count
    Rails.logger.info "Calculating following count for user #{id} directly from database: #{count}"
    count
  end

  def follow(other_user)
    return false if self == other_user
    
    Rails.logger.info "User #{id} (#{username}) attempting to follow user #{other_user.id} (#{other_user.username})"
    
    # Check directly in the database if the follow relationship exists using a safer query
    existing_follow = Follow.where(follower_id: id, followed_id: other_user.id).exists?
    
    if existing_follow
      Rails.logger.info "Follow relationship already exists in database"
      return true # Already following
    end
    
    # Create a new follow relationship using ActiveRecord
    begin
      follow = Follow.new(follower_id: id, followed_id: other_user.id)
      result = follow.save
      
      if result
        Rails.logger.info "Successfully created follow relationship in database"
      else
        Rails.logger.error "Failed to create follow: #{follow.errors.full_messages.join(', ')}"
        return false
      end
      
      # Clear association cache to ensure counts are updated
      self.reload
      other_user.reload
      
      Rails.logger.info "After follow: User #{other_user.id} has #{other_user.followers.count} followers"
      return true
    rescue => e
      Rails.logger.error "Error creating follow relationship: #{e.message}"
      return false
    end
  end

  def unfollow(other_user)
    Rails.logger.info "User #{id} (#{username}) attempting to unfollow user #{other_user.id} (#{other_user.username})"
    
    # Check directly in the database if the follow relationship exists
    follow = Follow.find_by(follower_id: id, followed_id: other_user.id)
    
    unless follow
      Rails.logger.info "Follow relationship doesn't exist in database"
      return false # Wasn't following
    end
    
    # Delete the follow relationship using ActiveRecord
    begin
      result = follow.destroy
      
      if result
        Rails.logger.info "Successfully deleted follow relationship from database"
        
        # Force a commit to ensure changes are persisted
        ActiveRecord::Base.connection.execute("COMMIT")
        
        # Double-check that the follow relationship was actually removed
        follow_exists = Follow.where(follower_id: id, followed_id: other_user.id).exists?
        Rails.logger.info "Verification check: Follow relationship still exists? #{follow_exists}"
        
        if follow_exists
          Rails.logger.error "Follow relationship still exists after attempting to delete it"
          # Try to delete it with a direct SQL query as a fallback
          ActiveRecord::Base.connection.execute("DELETE FROM follows WHERE follower_id = #{id} AND followed_id = #{other_user.id}")
          Rails.logger.info "Executed direct DELETE query as fallback"
          
          # Verify again
          follow_exists_after_sql = Follow.where(follower_id: id, followed_id: other_user.id).exists?
          Rails.logger.info "Verification check after SQL: Follow relationship still exists? #{follow_exists_after_sql}"
        end
      else
        Rails.logger.error "Failed to delete follow"
        return false
      end
      
      # Clear association cache to ensure counts are updated
      self.reload
      other_user.reload
      
      Rails.logger.info "After unfollow: User #{other_user.id} has #{other_user.followers.count} followers"
      return true
    rescue => e
      Rails.logger.error "Error removing follow relationship: #{e.message}"
      return false
    end
  end

  def following?(other_user)
    # Check using ActiveRecord
    follow_exists = Follow.where(follower_id: id, followed_id: other_user.id).exists?
    
    Rails.logger.info "Follow check: User #{id} following user #{other_user.id}? #{follow_exists}"
    return follow_exists
  end
end 