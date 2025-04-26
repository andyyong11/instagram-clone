# Represents a follow relationship between two users
# follower: The user who is following another user
# followed: The user being followed
class Follow < ApplicationRecord
  belongs_to :follower, class_name: "User"
  belongs_to :followed, class_name: "User"

  # Ensures a user can't follow another user multiple times
  validates :follower_id, uniqueness: { scope: :followed_id }
  # Prevents users from following themselves
  validate :not_self_follow
  
  # Log follow/unfollow events for debugging
  after_create :log_creation
  after_destroy :log_deletion

  private

  # Custom validation to prevent self-follows
  def not_self_follow
    errors.add(:follower_id, "can't follow yourself") if follower_id == followed_id
  end
  
  # Log when a follow relationship is created
  def log_creation
    Rails.logger.info "FOLLOW CREATED: User #{follower_id} is now following User #{followed_id}"
  end
  
  # Log when a follow relationship is removed
  def log_deletion
    Rails.logger.info "FOLLOW DELETED: User #{follower_id} is no longer following User #{followed_id}"
  end
end 