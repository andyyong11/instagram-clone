# Clean existing data to avoid duplicates
puts "Cleaning database..."
Like.destroy_all
Comment.destroy_all
Post.destroy_all
Follow.destroy_all
User.destroy_all

# Create users
puts "Creating users..."
user1 = User.create!(
  email: "john@example.com",
  password: "password123",
  username: "john_doe",
  bio: "Photographer and travel enthusiast",
  jti: SecureRandom.uuid
)

user2 = User.create!(
  email: "jane@example.com",
  password: "password123",
  username: "jane_smith",
  bio: "Food blogger | Coffee addict",
  jti: SecureRandom.uuid
)

user3 = User.create!(
  email: "alex@example.com",
  password: "password123",
  username: "alex_photography",
  bio: "Capturing moments | Professional photographer",
  jti: SecureRandom.uuid
)

user4 = User.create!(
  email: "sarah@example.com",
  password: "password123",
  username: "sarah_travels",
  bio: "✈️ Exploring the world one country at a time",
  jti: SecureRandom.uuid
)

user5 = User.create!(
  email: "mike@example.com",
  password: "password123",
  username: "mike_fitness",
  bio: "Personal trainer | Fitness tips and motivation",
  jti: SecureRandom.uuid
)

users = [user1, user2, user3, user4, user5]

# Create follows
puts "Creating follow relationships..."
# John follows everyone except Mike
user1.follow(user2)
user1.follow(user3)
user1.follow(user4)

# Jane follows John and Alex
user2.follow(user1)
user2.follow(user3)

# Alex follows everyone
user3.follow(user1)
user3.follow(user2)
user3.follow(user4)
user3.follow(user5)

# Sarah follows Jane and Mike
user4.follow(user2)
user4.follow(user5)

# Mike follows John and Sarah
user5.follow(user1)
user5.follow(user4)

# Create posts with placeholder images from placeholders
puts "Creating posts..."
post_captions = [
  "Just another day in paradise #travel #beach",
  "Morning coffee vibes ☕",
  "New workout routine is paying off 💪",
  "Sunset views are the best #photography",
  "Exploring the city #urban #adventure",
  "Homemade dinner tonight #foodie",
  "Weekend getaway with friends #roadtrip",
  "Nature is healing #hiking #outdoors",
  "New book, can't wait to dive in! #reading",
  "Home office setup complete! #wfh",
  "Art gallery visit #culture",
  "Morning meditation #mindfulness",
  "Beach day! #sun #ocean",
  "Concert night with friends #music #fun",
  "New plant baby #plantparent"
]

# Helper to create image URLs
def placeholder_image_url(width = 600, height = 600, category = nil)
  categories = %w[nature people food architecture animals]
  category ||= categories.sample
  "https://source.unsplash.com/random/#{width}x#{height}/?#{category}"
end

# Create 15 posts distributed among users
posts = []
post_captions.each_with_index do |caption, index|
  user = users[index % users.size]
  category = %w[nature people food architecture animals][index % 5]
  
  post = Post.create!(
    user: user,
    caption: caption,
    image: placeholder_image_url(800, 600, category),
    created_at: rand(1..30).days.ago
  )
  posts << post
  puts "Created post ##{index+1} by #{user.username}"
end

# Create comments
puts "Creating comments..."
comments = [
  "Looks amazing! 😍",
  "Great photo!",
  "I need to visit this place",
  "So beautiful!",
  "Love this!",
  "Wow! 🔥",
  "Perfect shot",
  "This is awesome",
  "I'm jealous!",
  "Goals! 🙌"
]

100.times do
  post = posts.sample
  user = users.sample
  Comment.create!(
    post: post,
    user: user,
    content: comments.sample,
    created_at: rand(1..5).days.ago
  )
end

# Create likes
puts "Creating likes..."
posts.each do |post|
  # Each post gets between 1 and 15 likes
  like_count = rand(1..15)
  users_to_like = users.sample(like_count)
  
  users_to_like.each do |user|
    Like.create!(post: post, user: user)
  end
end

puts "Seed completed! Created:"
puts "- #{User.count} users"
puts "- #{Post.count} posts"
puts "- #{Comment.count} comments"
puts "- #{Like.count} likes"
puts "- #{Follow.count} follows" 