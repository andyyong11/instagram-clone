class ApplicationController < ActionController::API
  before_action :authenticate_user!

  private

  def authenticate_user!
    if request.headers['Authorization'].present?
      token = request.headers['Authorization'].split(' ').last
      begin
        jwt_payload = JWT.decode(token, Rails.application.credentials.secret_key_base).first
        @current_user_id = jwt_payload['user_id']
      rescue JWT::ExpiredSignature, JWT::VerificationError, JWT::DecodeError
        head :unauthorized
      end
    else
      head :unauthorized unless controller_path.start_with?('api/auth')
    end
  end

  def current_user
    @current_user ||= User.find(@current_user_id) if @current_user_id
  end
end 