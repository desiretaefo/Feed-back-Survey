import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyAPI } from '../../api/axios';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { ArrowLeft, Users, TrendingUp, Download } from 'lucide-react';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SurveyResults = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [surveyId]);

  const fetchResults = async () => {
    try {
      const response = await surveyAPI.getResults(surveyId);
      setResults(response.data);
    } catch (error) {
      toast.error('Failed to load results or unauthorized');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = (questionData) => {
    const labels = Object.keys(questionData);
    const data = Object.values(questionData);

    return {
      labels,
      datasets: [
        {
          label: 'Responses',
          data,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)',
            'rgb(139, 92, 246)',
            'rgb(236, 72, 153)',
          ],
          borderWidth: 2
        }
      ]
    };
  };

  const getRatingChartData = (distribution) => {
    return {
      labels: Object.keys(distribution).sort(),
      datasets: [
        {
          label: 'Number of Responses',
          data: Object.keys(distribution).sort().map(key => distribution[key]),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: false
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading results...</p>
      </div>
    );
  }

  if (!results) {
    return <div className="error-message">Results not found</div>;
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <button onClick={() => navigate('/dashboard')} className="btn btn-outline">
          <ArrowLeft size={18} />
          Back
        </button>
        <div>
          <h1>{results.survey_info.title}</h1>
          <p>{results.survey_info.description}</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-summary">
        <div className="stat-box">
          <Users size={32} />
          <div>
            <h3>{results.total_respondents}</h3>
            <p>Total Responses</p>
          </div>
        </div>
        <div className="stat-box">
          <TrendingUp size={32} />
          <div>
            <h3>{results.results.length}</h3>
            <p>Questions</p>
          </div>
        </div>
      </div>

      {/* Question Results */}
      <div className="results-grid">
        {results.results.map((question, index) => (
          <div key={question.id} className="result-card">
            <div className="result-header">
              <h3>Question {index + 1}</h3>
              <span className="response-count">
                {question.total_answers} responses
              </span>
            </div>
            
            <p className="question-text">{question.text}</p>
            
            <div className="result-content">
              {/* Radio/Select - Bar Chart */}
              {(question.type === 'radio' || question.type === 'select') && (
                <div className="chart-container">
                  <Bar data={getChartData(question.data)} options={chartOptions} />
                </div>
              )}

              {/* Checkbox - Bar Chart */}
              {question.type === 'checkbox' && (
                <div className="chart-container">
                  <Bar 
                    data={getChartData(question.data)} 
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          display: true,
                          text: 'Multiple selections allowed'
                        }
                      }
                    }} 
                  />
                </div>
              )}

              {/* Rating - Distribution Chart */}
              {question.type === 'rating' && question.data.average !== undefined && (
                <div>
                  <div className="rating-summary">
                    <div className="rating-avg">
                      <span className="rating-value">{question.data.average}</span>
                      <span className="rating-label">Average Rating</span>
                    </div>
                    <div className="rating-range">
                      <span>Min: {question.data.min}</span>
                      <span>Max: {question.data.max}</span>
                    </div>
                  </div>
                  {question.data.distribution && (
                    <div className="chart-container" style={{ height: '250px' }}>
                      <Bar 
                        data={getRatingChartData(question.data.distribution)}
                        options={{
                          ...chartOptions,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                stepSize: 1
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Text - List of Responses */}
              {question.type === 'text' && (
                <div className="text-responses">
                  <h4>Recent Responses:</h4>
                  {question.data.recent_answers && question.data.recent_answers.length > 0 ? (
                    <ul className="response-list">
                      {question.data.recent_answers.map((answer, i) => (
                        <li key={i} className="response-item">
                          "{answer}"
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-responses">No responses yet</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {results.total_respondents === 0 && (
        <div className="empty-state">
          <Users size={64} />
          <h3>No responses yet</h3>
          <p>Share your survey to start collecting responses</p>
        </div>
      )}
    </div>
  );
};

export default SurveyResults;