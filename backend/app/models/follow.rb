class Follow < ApplicationRecord
  belongs_to :follower, class_name: "User"
  belongs_to :followed, class_name: "User"

  validates :follower_id, uniqueness: { scope: :followed_id }
  validate :not_self_follow
  
  after_create :log_creation
  after_destroy :log_deletion

  private

  def not_self_follow
    errors.add(:follower_id, "can't follow yourself") if follower_id == followed_id
  end
  
  def log_creation
    Rails.logger.info "FOLLOW CREATED: User #{follower_id} is now following User #{followed_id}"
  end
  
  def log_deletion
    Rails.logger.info "FOLLOW DELETED: User #{follower_id} is no longer following User #{followed_id}"
  end
end 