import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { publicAPI } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Lock,      
  UserCog,   
  Clock, 
  LogIn 
} from 'lucide-react';
import toast from 'react-hot-toast';

const TakeSurvey = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // State for view management
  const [statusView, setStatusView] = useState('loading'); 

  useEffect(() => {
    fetchSurvey();
  }, [surveyId, user]); 

  const fetchSurvey = async () => {
    try {
      if (!survey) setLoading(true);

      const response = await publicAPI.getSurvey(surveyId);
      const surveyData = response.data;
      setSurvey(surveyData);
      
      // 1. Check: Creator restriction
      const currentUserId = user?.id || user?._id || user?.sub;
      if (currentUserId && String(currentUserId) === String(surveyData.created_by)) {
        setStatusView('creator_restriction');
        return;
      }

      // 2. Check: Already responded
      if (surveyData.has_responded) {
        setStatusView('already_responded');
        return;
      }

      // 3. Active
      setStatusView('active');

    } catch (error) {
      console.error("Survey Fetch Error:", error);
      const status = error.response?.status;
      const msg = error.response?.data?.error || '';

      if (status === 401) {
        setStatusView('auth_required');
      } 
      else if (status === 403) {
        if (msg.toLowerCase().includes('closed')) {
          setStatusView('closed');
        } else {
          setStatusView('creator_restriction'); 
        }
      } 
      else if (status === 404) {
        setStatusView('not_found');
      } 
      else {
        toast.error('Failed to load survey');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleCheckboxChange = (questionId, option) => {
    const currentAnswers = answers[questionId] || [];
    let newAnswers;
    if (currentAnswers.includes(option)) {
      newAnswers = currentAnswers.filter(item => item !== option);
    } else {
      newAnswers = [...currentAnswers, option];
    }
    setAnswers({ ...answers, [questionId]: newAnswers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // --- UPDATED VALIDATION LOGIC ---
    for (const question of survey.questions) {
      // We only validate if the question is marked as REQUIRED
      if (question.required) {
        const answer = answers[question.id];
        
        // Check if answer is empty, null, undefined, or empty array
        const isEmpty = !answer || (Array.isArray(answer) && answer.length === 0);
        
        if (isEmpty) {
          toast.error(`Please answer the required question: "${question.text}"`);
          return; // Stop submission
        }
      }
    }

    setSubmitting(true);
    try {
      await publicAPI.submitResponse(surveyId, { answers });
      setSubmitted(true);
      toast.success('Response submitted successfully!');
    } catch (error) {
      if (error.response?.status === 409) {
        setStatusView('already_responded');
      } else {
        toast.error(error.response?.data?.error || 'Failed to submit response');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // --- RENDERERS ---

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading survey...</p>
    </div>
  );

  // 1. Auth Required
  if (statusView === 'auth_required') {
    return (
      <div className="restriction-container">
        <div className="restriction-card auth-card">
          <div className="icon-wrapper" style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <Lock size={48} color="#4b5563" />
          </div>
          <h1>Authentication Required</h1>
          <p>You must be logged in to participate in this survey.</p>
          <div className="auth-buttons" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary">
              <LogIn size={18} />
              Log In
            </Link>
            <Link to="/register" className="btn btn-outline">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Creator Restriction
  if (statusView === 'creator_restriction') {
    return (
      <div className="restriction-container">
        <div className="restriction-card creator-card">
          <div className="icon-wrapper" style={{ background: '#eff6ff', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <UserCog size={48} color="#3b82f6" />
          </div>
          <h1>Creator Mode</h1>
          <p>You are the owner of this survey. You cannot submit responses to your own forms.</p>
          <div className="share-section" style={{ marginTop: '1.5rem', width: '100%' }}>
            <p className="text-sm text-gray-500 mb-2">Share this link instead:</p>
            <div className="share-link-box" style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" value={window.location.href} readOnly className="form-control" style={{ flex: 1 }} />
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }} className="btn btn-secondary">Copy</button>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // 3. Closed
  if (statusView === 'closed') {
    return (
      <div className="restriction-container">
        <div className="restriction-card">
          <Clock size={64} color="#ef4444" />
          <h1>Survey Closed</h1>
          <p>This survey is no longer accepting new responses.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-outline" style={{ marginTop: '1rem' }}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  // 4. Already Responded
  if (statusView === 'already_responded' || submitted) {
    return (
      <div className="success-container">
        <div className="success-card">
          <CheckCircle size={64} color="#10b981" />
          <h1>{submitted ? 'Thank You!' : 'Already Responded'}</h1>
          <p>{submitted ? 'Your response has been recorded successfully.' : 'You have already submitted a response to this survey.'}</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // 5. Not Found
  if (statusView === 'not_found') {
    return (
      <div className="restriction-container">
        <div className="restriction-card">
          <AlertCircle size={64} color="#ef4444" />
          <h1>Survey Not Found</h1>
          <p>The survey you are looking for does not exist or has been removed.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">Back Home</button>
        </div>
      </div>
    );
  }

  // --- FORM VIEW ---
  return (
    <div className="take-survey-container">
      <div className="survey-header">
        <h1>{survey.title}</h1>
        {survey.description && <p className="survey-description">{survey.description}</p>}
      </div>

      <form onSubmit={handleSubmit} className="survey-questions">
        {survey.questions.map((question, index) => (
          <div key={question.id} className="question-block">
            <div className="question-header">
              <span className="question-number">Question {index + 1}</span>
              {/* Only show badge if question is actually required */}
              {question.required ? (
                <span className="required-badge">Required</span>
              ) : (
                <span className="optional-badge" style={{ fontSize: '0.8rem', color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>Optional</span>
              )}
            </div>
            <h3 className="question-text">{question.text}</h3>

            {question.type === 'text' && (
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Type your answer here..."
                rows={4}
                required={question.required} // Dynamic HTML attribute
              />
            )}
            
            {question.type === 'radio' && (
              <div className="options-list">
                {question.options.map((option, idx) => (
                  <label key={idx} className="radio-option">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      required={question.required} // Dynamic HTML attribute
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}
            
            {question.type === 'select' && (
                <select 
                  value={answers[question.id] || ''} 
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)} 
                  required={question.required} // Dynamic HTML attribute
                >
                  <option value="">-- Select an option --</option>
                  {question.options.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
            )}

            {question.type === 'checkbox' && (
                <div className="options-list">
                  {question.options.map((opt, i) => (
                    <label key={i} className="checkbox-option">
                      <input 
                        type="checkbox" 
                        checked={(answers[question.id]||[]).includes(opt)} 
                        onChange={() => handleCheckboxChange(question.id, opt)} 
                        // HTML 'required' on checkboxes is tricky (requires one of group), 
                        // so we rely on the JS validation in handleSubmit for checkboxes.
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
            )}
            
            {question.type === 'rating' && (
                <div className="rating-options">
                   {[1,2,3,4,5].map(r => (
                     <label key={r} className="rating-option">
                       <input 
                         type="radio" 
                         name={question.id} 
                         value={r} 
                         checked={answers[question.id] === r.toString()} 
                         onChange={(e)=>handleAnswerChange(question.id, e.target.value)} 
                         required={question.required} // Dynamic HTML attribute
                       />
                       <span className="rating-number">{r}</span>
                     </label>
                   ))}
                </div>
            )}

          </div>
        ))}

        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
          <Send size={20} />
          {submitting ? 'Submitting...' : 'Submit Response'}
        </button>
      </form>
    </div>
  );
};

export default TakeSurvey;