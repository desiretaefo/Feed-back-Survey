import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Calendar } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <User size={64} />
          </div>
          <h1>My Profile</h1>
        </div>

        <div className="profile-info">
          <div className="info-item">
            <div className="info-icon">
              <User size={20} />
            </div>
            <div className="info-content">
              <label>Full Name</label>
              <p>{user?.name}</p>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">
              <Mail size={20} />
            </div>
            <div className="info-content">
              <label>Email Address</label>
              <p>{user?.email}</p>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">
              <Calendar size={20} />
            </div>
            <div className="info-content">
              <label>Member Since</label>
              <p>{new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              })}</p>
            </div>
          </div>
        </div>

        <div className="profile-note">
          <p>
            <strong>Note:</strong> Account management features (update profile, change password) 
            will be available in a future update.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;