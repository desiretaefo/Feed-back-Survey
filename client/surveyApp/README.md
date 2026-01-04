# Survey App - React Frontend

## 📋 Prerequisites

- Node.js 16+ installed
- Backend Flask server running on `http://localhost:5000`
- npm or yarn package manager

## 🚀 Installation Steps

### 1. Create React Project with Vite

```bash
npm create vite@latest survey-frontend -- --template react
cd survey-frontend
```

### 2. Install Dependencies

```bash
npm install react-router-dom axios chart.js react-chartjs-2 react-hot-toast lucide-react
```

### 3. Project Structure

Create the following folder structure:

```
survey-frontend/
├── public/
├── src/
│   ├── api/
│   │   └── axios.js
│   ├── components/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.jsx
│   │   ├── survey/
│   │   │   ├── SurveyForm.jsx
│   │   │   ├── TakeSurvey.jsx
│   │   │   └── SurveyResults.jsx
│   │   ├── profile/
│   │   │   └── Profile.jsx
│   │   └── layout/
│   │       ├── Navbar.jsx
│   │       └── PrivateRoute.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── package.json
└── vite.config.js
```

### 4. Copy Files

Copy all the provided code files into their respective locations.

### 5. Update vite.config.js

Replace the content with:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

### 6. Update index.html

Ensure your `index.html` has:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Survey App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## 🔌 Connecting Backend and Frontend

### Backend Setup (Flask)

1. **Update Flask CORS Configuration**

In your `app.py`:

```python
from flask_cors import CORS

# Allow React frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

2. **Ensure Backend is Running**

```bash
cd backend
python app.py
```

Backend should be running on: `http://localhost:5000`

### Frontend Configuration

The frontend is already configured to connect to the backend through:

1. **Vite Proxy** (`vite.config.js`):
   - All `/api/*` requests are proxied to `http://localhost:5000`

2. **Axios Configuration** (`src/api/axios.js`):
   - Base URL: `http://localhost:5000/api`
   - Automatic token injection
   - Global error handling

## 🎯 Running the Application

### 1. Start Backend (Terminal 1)

```bash
cd backend
python app.py
# Server running on http://localhost:5000
```

### 2. Start Frontend (Terminal 2)

```bash
cd survey-frontend
npm run dev
# Vite server running on http://localhost:3000
```

### 3. Open Browser

Navigate to: `http://localhost:3000`

## 📱 Features Overview

### ✅ Authentication
- **Register**: Create new account with name, email, password
- **Login**: Authenticate with JWT tokens
- **Logout**: Clear session and redirect
- **Protected Routes**: Automatic redirect to login

### ✅ Dashboard
- View statistics (total surveys, responses, active surveys)
- List all your surveys
- Quick actions (create survey, view results)

### ✅ Survey Management (CRUD)

**Create:**
- Form with title, description
- Multiple question types:
  - Text (open-ended)
  - Radio (single choice)
  - Checkbox (multiple choice)
  - Select (dropdown)
  - Rating (1-5 scale)
- Dynamic options for choice questions

**Read:**
- View all surveys
- Preview survey questions
- Public survey link for responses

**Update:**
- (To be implemented in future version)

**Delete:**
- (To be implemented in future version)

### ✅ Response Collection
- Public survey access (no auth required)
- Anonymous response submission
- Response validation
- Success confirmation

### ✅ Results & Statistics

**Visualization:**
- **Bar Charts**: For radio, checkbox, select questions
- **Distribution Charts**: For rating questions
- **Text Responses**: Listed individually

**Analytics:**
- Total response count
- Per-question statistics
- Average ratings
- Option distribution

### ✅ Profile Management
- View user information
- Display account details

## 🔐 Authentication Flow

1. **Registration:**
   ```
   User → Register Form → POST /api/auth/register → Success → Redirect to Login
   ```

2. **Login:**
   ```
   User → Login Form → POST /api/auth/login → Receive JWT → Store in localStorage → Redirect to Dashboard
   ```

3. **Protected Routes:**
   ```
   Request → Check localStorage for token → Add to Authorization header → API Call
   ```

4. **Token Expiration:**
   ```
   API returns 401 → Interceptor catches → Clear localStorage → Redirect to Login
   ```

## 📡 API Endpoints Used

### Authentication
```
POST /api/auth/register
POST /api/auth/login
```

### Surveys (Protected)
```
POST   /api/surveys/              # Create survey
GET    /api/surveys/              # Get my surveys
GET    /api/surveys/:id/results   # Get survey results
```

### Public Surveys
```
GET    /api/public/surveys/:id           # Get survey details
POST   /api/public/surveys/:id/respond   # Submit response
```

## 🔧 Troubleshooting

### CORS Error

**Problem:** "Access to fetch blocked by CORS policy"

**Solution:** 
1. Check Flask CORS configuration
2. Ensure backend is running
3. Verify origin URL matches

### 401 Unauthorized

**Problem:** "Token is invalid or expired"

**Solution:**
1. Clear localStorage
2. Login again
3. Check token expiration (24h default)

### Proxy Not Working

**Problem:** "Cannot proxy to http://localhost:5000"

**Solution:**
1. Ensure backend is running first
2. Restart Vite dev server
3. Check port numbers match

### Chart Not Displaying

**Problem:** Charts don't render

**Solution:**
1. Verify Chart.js is installed
2. Check console for errors
3. Ensure data format is correct

## 📊 Data Flow Example

### Creating a Survey:

```javascript
// Frontend: SurveyForm.jsx
const surveyData = {
  title: "Customer Satisfaction",
  description: "Help us improve",
  questions: [
    {
      id: "1",
      text: "How satisfied are you?",
      type: "rating"
    }
  ]
};

// API Call
POST /api/surveys/
Headers: { Authorization: "Bearer <token>" }
Body: surveyData

// Backend: survey.py
@token_required
def create_survey():
  # Validate with Pydantic
  # Insert into MongoDB
  # Return survey ID
```

### Submitting Response:

```javascript
// Frontend: TakeSurvey.jsx
const answers = {
  "1": "5",  // Question ID: Answer
  "2": "Great service"
};

// API Call
POST /api/public/surveys/:id/respond
Body: { answers }

// Backend: public.py
def submit_response(survey_id):
  # Save to responses collection
  # Increment response count
  # Return success
```

### Viewing Results:

```javascript
// Frontend: SurveyResults.jsx
GET /api/surveys/:id/results
Headers: { Authorization: "Bearer <token>" }

// Backend: survey.py
@token_required
def get_results(survey_id):
  # Verify ownership
  # Fetch responses
  # Calculate statistics
  # Return aggregated data

// Frontend receives:
{
  survey_info: {...},
  results: [
    {
      id: "1",
      text: "How satisfied?",
      type: "rating",
      data: {
        average: 4.5,
        distribution: {1: 2, 2: 5, ...}
      }
    }
  ],
  total_respondents: 50
}
```

## 🎨 Customization

### Change Colors

Edit CSS variables in `App.css`:

```css
:root {
  --primary: #3b82f6;        /* Your brand color */
  --success: #10b981;
  --danger: #ef4444;
}
```

### Add New Question Type

1. Update `QUESTION_TYPES` in `SurveyForm.jsx`
2. Add rendering logic in `TakeSurvey.jsx`
3. Add statistics calculation in backend

### Modify Chart Styles

Edit chart options in `SurveyResults.jsx`:

```javascript
const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom',
    }
  }
};
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)

```bash
npm run build
# Deploy 'dist' folder
```

**Environment Variables:**
```
VITE_API_URL=https://your-backend.com/api
```

### Backend (Heroku/Railway)

Update CORS to include production URL:

```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://your-frontend.com"]
    }
})
```

## 📚 Technologies Used

- **React 18** - UI library
- **React Router 6** - Navigation
- **Axios** - HTTP client
- **Chart.js + React-ChartJS-2** - Data visualization
- **React Hot Toast** - Notifications
- **Lucide React** - Icons
- **Vite** - Build tool

## 🤝 Contributing

To add new features:

1. Create new component in appropriate folder
2. Add route in `App.jsx`
3. Connect to backend API
4. Update styles in `App.css`

## 📝 License

This project is for educational purposes.

## 🆘 Support

If you encounter issues:

1. Check browser console for errors
2. Verify backend is running
3. Clear browser cache and localStorage
4. Check Network tab for failed requests
5. Ensure all dependencies are installed

---

**Happy Coding! 🎉**