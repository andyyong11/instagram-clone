class Post < ApplicationRecord
  belongs_to :user
  has_many :comments, dependent: :destroy
  has_many :likes, dependent: :destroy
  
  # Use Active Storage for image handling
  has_one_attached :image_attachment

  validates :caption, length: { maximum: 2200 }
  validate :image_presence

  # Virtual attribute for API responses
  def likes_count
    likes.count
  end

  def comments_count
    comments.count
  end

  def liked_by?(user_id = nil)
    return false unless user_id
    likes.where(user_id: user_id).exists?
  end
  
  # Get image URL with proper host
  def image_url
    if image_attachment.attached?
      Rails.application.routes.url_helpers.rails_blob_url(image_attachment, only_path: true)
    else
      image
    end
  end
  
  private
  
  def image_presence
    errors.add(:image, "must be present") unless image.present? || image_attachment.attached?
  end
end 