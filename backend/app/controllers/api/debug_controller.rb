module Api
  class DebugController < ApplicationController
    skip_before_action :authenticate_user!

    def add_sample_post
      # Only allow in development environment
      unless Rails.env.development?
        render json: { error: "Not allowed in production" }, status: :forbidden
        return
      end

      user = User.find_by(id: params[:user_id])
      
      # If user doesn't exist, create a test user
      unless user
        user = create_test_user
      end
      
      # Use a themed image based on optional category parameter
      category = params[:category] || random_category
      image_url = generate_image_url(category)
      
      # Create a new post with the image
      post = user.posts.new(
        caption: generate_caption(category),
        image: image_url
      )
      
      if post.save
        render json: { 
          message: "Sample post created", 
          post: post.as_json(include: :user),
          image_url: post.image
        }
      else
        render json: { errors: post.errors.full_messages }, status: :unprocessable_entity
      end
    end
    
    # Add multiple sample posts at once
    def add_multiple_posts
      # Only allow in development environment
      unless Rails.env.development?
        render json: { error: "Not allowed in production" }, status: :forbidden
        return
      end
      
      user = User.find_by(id: params[:user_id])
      
      # If user doesn't exist, create a test user
      unless user
        user = create_test_user
      end
      
      count = (params[:count] || 3).to_i
      count = [count, 10].min # Limit to 10 posts at once
      
      created_posts = []
      
      count.times do
        category = random_category
        image_url = generate_image_url(category)
        
        post = user.posts.create(
          caption: generate_caption(category),
          image: image_url
        )
        
        created_posts << post if post.persisted?
      end
      
      render json: {
        message: "Created #{created_posts.size} sample posts",
        posts: created_posts.map { |p| { id: p.id, image: p.image } }
      }
    end
    
    private

    def create_test_user
      # Create a test user if needed
      test_user = User.create!(
        email: "test#{Time.now.to_i}@example.com",
        password: "password123",
        username: "testuser#{Time.now.to_i}",
        bio: "This is a test user created by the debug controller"
      )
      test_user
    end
    
    def random_category
      ['nature', 'food', 'travel', 'animals', 'technology', 'fashion', 'sports', 'art'].sample
    end
    
    def generate_image_url(category)
      # Use publicly available images with reliable URLs
      case category
      when 'nature'
        [
          "https://picsum.photos/600/600?nature=1",
          "https://picsum.photos/600/600?nature=2",
          "https://picsum.photos/600/600?nature=3"
        ].sample
      when 'food'
        [
          "https://picsum.photos/600/600?food=1",
          "https://picsum.photos/600/600?food=2",
          "https://picsum.photos/600/600?food=3"
        ].sample
      when 'travel'
        [
          "https://picsum.photos/600/600?travel=1",
          "https://picsum.photos/600/600?travel=2",
          "https://picsum.photos/600/600?travel=3"
        ].sample
      when 'animals'
        [
          "https://picsum.photos/600/600?animal=1",
          "https://picsum.photos/600/600?animal=2",
          "https://picsum.photos/600/600?animal=3"
        ].sample
      when 'technology'
        [
          "https://picsum.photos/600/600?tech=1",
          "https://picsum.photos/600/600?tech=2",
          "https://picsum.photos/600/600?tech=3"
        ].sample
      when 'fashion'
        [
          "https://picsum.photos/600/600?fashion=1",
          "https://picsum.photos/600/600?fashion=2",
          "https://picsum.photos/600/600?fashion=3"
        ].sample
      when 'sports'
        [
          "https://picsum.photos/600/600?sports=1",
          "https://picsum.photos/600/600?sports=2",
          "https://picsum.photos/600/600?sports=3"
        ].sample
      when 'art'
        [
          "https://picsum.photos/600/600?art=1",
          "https://picsum.photos/600/600?art=2",
          "https://picsum.photos/600/600?art=3"
        ].sample
      else
        # Fallback images
        "https://picsum.photos/600/600?random=#{rand(1000)}"
      end
    end
    
    def generate_caption(category)
      captions = {
        'nature' => [
          "Beautiful day outside! 🌳",
          "Love this amazing view 😍",
          "Nature is the best therapy"
        ],
        'food' => [
          "Delicious meal! #foodie",
          "Cooking is my passion 🍳",
          "Can't resist this dessert!"
        ],
        'travel' => [
          "Exploring new places ✈️",
          "Adventure awaits!",
          "Travel memories that last forever 🌍"
        ],
        'animals' => [
          "My adorable pet! ❤️",
          "Animals make life better",
          "Nature's creatures are amazing"
        ],
        'technology' => [
          "New tech setup! #geek",
          "Coding all night 💻",
          "Technology is changing everything"
        ],
        'fashion' => [
          "Today's outfit 👗",
          "Fashion is self-expression",
          "New look, who dis? 👀"
        ],
        'sports' => [
          "Great workout today! 💪",
          "Game day! Let's go!",
          "Sports bring people together 🏆"
        ],
        'art' => [
          "My latest creation 🎨",
          "Art speaks where words cannot",
          "Creativity takes courage"
        ]
      }
      
      # Get random caption from the category, or use a generic one if category not found
      captions[category]&.sample || "Amazing #{category} post created at #{Time.now.strftime('%Y-%m-%d %H:%M:%S')}"
    end
  end
end 