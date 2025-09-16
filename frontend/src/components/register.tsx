import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import ImageUpload from './imageUpload';

interface UserRegistrationProps {
  onRegister: (name: string, profilePicHash: string) => Promise<void>;
  loading: boolean;
}

const UserRegistration: React.FC<UserRegistrationProps> = ({ onRegister, loading }) => {
  const [username, setUsername] = useState('');
  const [profilePicHash, setProfilePicHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }
    
    if (!profilePicHash) {
      alert('Please upload a profile picture');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegister(username.trim(), profilePicHash);
    } catch (error) {
      console.error('Registration failed:', error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Godbrand Chat</h1>
          <p className="text-gray-600">Create your profile to start chatting</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ImageUpload onImageUpload={setProfilePicHash} />
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 border border-gray-300 text-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                maxLength={20}
              />
              <span className="absolute right-3 top-3 text-sm text-gray-500">
                .godbrand
              </span>
            </div>
            {username && (
              <p className="mt-2 text-sm text-gray-600">
                Your full username: <strong>{username}.godbrand</strong>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || loading || !username.trim() || !profilePicHash}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(isSubmitting || loading) && <Loader className="w-5 h-5 animate-spin" />}
            <span>{isSubmitting || loading ? 'Creating Account...' : 'Create Account'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserRegistration;
