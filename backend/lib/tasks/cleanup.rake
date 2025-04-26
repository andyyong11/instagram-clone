namespace :cleanup do
  desc "Remove test users from the database"
  task remove_test_users: :environment do
    # Find test users by username pattern
    test_users = User.where("username LIKE ?", "%testuser%")
    
    puts "Found #{test_users.count} test users:"
    test_users.each do |user|
      puts "- ID: #{user.id}, Username: #{user.username}, Email: #{user.email}"
    end
    
    # Count posts and follows
    posts_count = Post.where(user_id: test_users.pluck(:id)).count
    follow_count = Follow.where(follower_id: test_users.pluck(:id)).or(Follow.where(followed_id: test_users.pluck(:id))).count
    
    puts "These users have #{posts_count} posts and are involved in #{follow_count} follow relationships."
    
    # Delete all test users and their associated data
    if test_users.destroy_all
      puts "Successfully removed all test users and their associated data."
    else
      puts "Error removing test users."
    end
  end
end 