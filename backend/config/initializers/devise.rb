# frozen_string_literal: true

# This is the Devise configuration file that sets up authentication settings.
# It configures things like:
# - Secret keys and tokens
# - Email/mailer settings 
# - Authentication mechanisms and strategies
# - Password requirements and validation
# - Session handling and timeouts
# - JWT (JSON Web Token) configuration for API authentication

Devise.setup do |config|
  # Secret key for generating tokens (uses Rails secret_key_base by default)
  # config.secret_key = 'some_secret_key'

  # Controller configuration
  # config.parent_controller = 'DeviseController'

  # Mailer settings
  config.mailer_sender = 'please-change-me-at-config-initializers-devise@example.com'
  # config.mailer = 'Devise::Mailer'

  # Use ActiveRecord as the ORM
  require 'devise/orm/active_record'

  # Authentication configuration
  # config.authentication_keys = [:email]
  # config.request_keys = []
  config.case_insensitive_keys = [:email]
  config.strip_whitespace_keys = [:email]
  # config.params_authenticatable = true
  # config.http_authenticatable = false
  # config.http_authenticatable_on_xhr = true
  # config.http_authentication_realm = 'Application'

  # Skip sessions for API requests
  config.skip_session_storage = [:http_auth, :params_auth]

  # CSRF token handling
  # config.clean_up_csrf_token_on_authentication = true

  # Password hashing settings
  config.stretches = Rails.env.test? ? 1 : 12
  config.password_length = 6..128
  config.email_regexp = /\A[^@\s]+@[^@\s]+\z/

  # Password reset settings
  # config.reset_password_keys = [:email]
  config.reset_password_within = 6.hours

  # Remember me settings
  config.remember_for = 2.weeks

  # JWT configuration for API authentication
  config.jwt do |jwt|
    # Use Rails secret key for JWT encoding
    jwt.secret = Rails.application.credentials.secret_key_base
    
    # Configure endpoints that issue JWTs
    jwt.dispatch_requests = [
      ['POST', %r{^/api/auth/login$}]
    ]
    
    # Configure endpoints that revoke JWTs
    jwt.revocation_requests = [
      ['DELETE', %r{^/api/auth/logout$}]
    ]
    
    # Set JWT expiration to 24 hours
    jwt.expiration_time = 1.day.to_i
  end
end 