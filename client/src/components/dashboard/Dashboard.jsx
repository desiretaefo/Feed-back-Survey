import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { surveyAPI } from '../../api/axios';
import { 
  PlusCircle, 
  BarChart3, 
  Calendar, 
  Users, 
  Share2, 
  Trash2, // New Icon
  Power,  // New Icon
  ExternalLink 
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSurveys: 0,
    totalResponses: 0,
    activeSurveys: 0
  });

  useEffect(() => {
    fetchSurveys();
  }, []);

  // Helper to recalculate stats locally without refetching from API
  const calculateStats = (data) => {
    const total = data.length;
    const active = data.filter(s => s.is_active).length;
    const responses = data.reduce((sum, s) => sum + (s.response_count || 0), 0);
    
    setStats({
      totalSurveys: total,
      totalResponses: responses,
      activeSurveys: active
    });
  };

  const fetchSurveys = async () => {
    try {
      const response = await surveyAPI.getMySurveys();
      const surveysData = response.data;
      setSurveys(surveysData);
      calculateStats(surveysData);
    } catch (error) {
      toast.error('Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const copyShareLink = (surveyId) => {
    const shareLink = `${window.location.origin}/survey/${surveyId}`;
    navigator.clipboard.writeText(shareLink);
    toast.success('Share link copied!');
  };

  // --- NEW: Handle Delete ---
  const handleDelete = async (surveyId) => {
    if (!window.confirm("Are you sure you want to delete this survey? This action cannot be undone.")) {
      return;
    }

    try {
      await surveyAPI.deleteSurvey(surveyId);
      
      // Update local state by removing the deleted survey
      const updatedSurveys = surveys.filter(s => s._id !== surveyId);
      setSurveys(updatedSurveys);
      calculateStats(updatedSurveys);
      
      toast.success('Survey deleted successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete survey');
    }
  };

  // --- NEW: Handle Status Toggle ---
  const handleToggleStatus = async (surveyId, currentStatus) => {
    try {
      const response = await surveyAPI.toggleStatus(surveyId);
      const newStatus = response.data.is_active;

      // Update local state without reloading page
      const updatedSurveys = surveys.map(s => 
        s._id === surveyId ? { ...s, is_active: newStatus } : s
      );
      
      setSurveys(updatedSurveys);
      calculateStats(updatedSurveys);

      toast.success(`Survey is now ${newStatus ? 'Active' : 'Closed'}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>My Dashboard</h1>
          <p>Manage your surveys and view responses</p>
        </div>
        <Link to="/surveys/create" className="btn btn-primary">
          <PlusCircle size={20} />
          Create Survey
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3b82f6' }}>
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Surveys</p>
            <h3 className="stat-value">{stats.totalSurveys}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b981' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Responses</p>
            <h3 className="stat-value">{stats.totalResponses}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Active Surveys</p>
            <h3 className="stat-value">{stats.activeSurveys}</h3>
          </div>
        </div>
      </div>

      {/* Surveys List */}
      <div className="surveys-section">
        <h2>Your Surveys</h2>
        
        {surveys.length === 0 ? (
          <div className="empty-state">
            <BarChart3 size={64} />
            <h3>No surveys yet</h3>
            <p>Create your first survey to get started</p>
            <Link to="/surveys/create" className="btn btn-primary">
              Create Survey
            </Link>
          </div>
        ) : (
          <div className="surveys-grid">
            {surveys.map((survey) => (
              <div key={survey._id} className="survey-card">
                <div className="survey-card-header">
                  <h3>{survey.title}</h3>
                  <span className={`badge ${survey.is_active ? 'badge-success' : 'badge-secondary'}`}>
                    {survey.is_active ? 'Active' : 'Closed'}
                  </span>
                </div>
                
                <p className="survey-description">
                  {survey.description || 'No description'}
                </p>
                
                <div className="survey-meta">
                  <div className="meta-item">
                    <Users size={16} />
                    <span>{survey.response_count || 0} responses</span>
                  </div>
                  <div className="meta-item">
                    <Calendar size={16} />
                    <span>{formatDate(survey.created_at)}</span>
                  </div>
                </div>
                
                {/* ACTIONS BUTTONS */}
                <div className="survey-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  
                  {/* Copy Link Button */}
                  <button
                    onClick={() => copyShareLink(survey._id)}
                    className="btn btn-outline btn-sm"
                    title="Copy Link"
                  >
                    <Share2 size={16} />
                  </button>

                  {/* Toggle Status Button */}
                  <button
                    onClick={() => handleToggleStatus(survey._id, survey.is_active)}
                    className={`btn btn-sm ${survey.is_active ? 'btn-outline' : 'btn-success'}`}
                    title={survey.is_active ? "Close Survey" : "Activate Survey"}
                    style={!survey.is_active ? { backgroundColor: '#10b981', color: 'white', borderColor: 'transparent' } : {}}
                  >
                    <Power size={16} color={survey.is_active ? '#f59e0b' : 'white'} />
                    {survey.is_active ? 'Close' : 'Open'}
                  </button>

                  {/* View Results Button */}
                  <Link 
                    to={`/surveys/${survey._id}/results`} 
                    className="btn btn-secondary btn-sm"
                    title="View Results"
                  >
                    <BarChart3 size={16} />
                    Results
                  </Link>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(survey._id)}
                    className="btn btn-danger btn-sm"
                    title="Delete Survey"
                    style={{ marginLeft: 'auto' }} // Pushes delete button to the far right
                  >
                    <Trash2 size={16} />
                  </button>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;