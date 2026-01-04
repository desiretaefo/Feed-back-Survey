import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveyAPI } from '../../api/axios';
import { Plus, Trash2, Save, Asterisk } from 'lucide-react';
import toast from 'react-hot-toast';

const QUESTION_TYPES = [
  { value: 'text', label: 'Text Answer' },
  { value: 'radio', label: 'Single Choice' },
  { value: 'checkbox', label: 'Multiple Choice' },
  { value: 'rating', label: 'Rating (1-5)' },
  { value: 'select', label: 'Dropdown' }
];

const SurveyForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  
  // Added 'required' field to the initial question state
  const [questions, setQuestions] = useState([
    { id: '1', text: '', type: 'text', options: [], required: false }
  ]);
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    const newId = (questions.length + 1).toString();
    setQuestions([
      ...questions, 
      { id: newId, text: '', type: 'text', options: [], required: false }
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) {
      toast.error('Survey must have at least one question');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push('');
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.splice(optionIndex, 1);
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a survey title');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        toast.error(`Question ${i + 1} cannot be empty`);
        return;
      }
      if (['radio', 'checkbox', 'select'].includes(questions[i].type)) {
        const validOptions = questions[i].options.filter(opt => opt.trim());
        if (validOptions.length < 2) {
          toast.error(`Question ${i + 1} must have at least 2 options`);
          return;
        }
        questions[i].options = validOptions;
      }
    }

    setLoading(true);

    try {
      const surveyData = {
        ...formData,
        questions: questions.map(q => ({
          ...q,
          // Include 'required' in the payload sent to backend
          required: !!q.required, 
          options: ['radio', 'checkbox', 'select'].includes(q.type) ? q.options : undefined
        }))
      };

      await surveyAPI.create(surveyData);
      toast.success('Survey created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create survey');
    } finally {
      setLoading(false);
    }
  };

  const requiresOptions = (type) => ['radio', 'checkbox', 'select'].includes(type);

  return (
    <div className="survey-form-container">
      <div className="survey-form-header">
        <h1>Create New Survey</h1>
        <p>Design your survey with custom questions</p>
      </div>

      <form onSubmit={handleSubmit} className="survey-form">
        {/* Basic Info */}
        <div className="form-section">
          <h2>Survey Information</h2>
          
          <div className="form-group">
            <label htmlFor="title">Survey Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              placeholder="Enter survey title"
              required
              minLength={5}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              placeholder="Describe what this survey is about (optional)"
              rows={3}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="form-section">
          <div className="section-header">
            <h2>Questions</h2>
            <button type="button" onClick={addQuestion} className="btn btn-secondary btn-sm">
              <Plus size={16} />
              Add Question
            </button>
          </div>

          {questions.map((question, qIndex) => (
            <div key={qIndex} className="question-card">
              <div className="question-header">
                <div className="question-meta">
                    <span className="question-number">Question {qIndex + 1}</span>
                    {question.required && <span className="required-badge"><Asterisk size={12} /> Required</span>}
                </div>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="btn-icon btn-danger"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Question Text *</label>
                <input
                  type="text"
                  value={question.text}
                  onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                  placeholder="Enter your question"
                  required
                />
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                    <label>Question Type</label>
                    <select
                    value={question.type}
                    onChange={(e) => {
                        handleQuestionChange(qIndex, 'type', e.target.value);
                        if (requiresOptions(e.target.value) && question.options.length === 0) {
                        handleQuestionChange(qIndex, 'options', ['', '']);
                        }
                    }}
                    >
                    {QUESTION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                        {type.label}
                        </option>
                    ))}
                    </select>
                </div>

                {/* --- NEW: REQUIRED TOGGLE --- */}
                <div className="form-group" style={{ flex: 1, marginBottom: '10px' }}>
                    <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                        <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => handleQuestionChange(qIndex, 'required', e.target.checked)}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <span>Mandatory</span>
                    </label>
                </div>
              </div>

              {/* Options for radio/checkbox/select */}
              {requiresOptions(question.type) && (
                <div className="options-section">
                  <label>Options *</label>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="option-input-group">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                      />
                      {question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(qIndex, oIndex)}
                          className=""
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(qIndex)}
                    className="btn btn-outline btn-sm"
                  >
                    <Plus size={16} />
                    Add Option
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={18} />
            {loading ? 'Creating...' : 'Create Survey'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SurveyForm;