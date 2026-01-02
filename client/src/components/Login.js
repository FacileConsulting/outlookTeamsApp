import React, { useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated, redirect to app
    if (accounts.length > 0) {
      navigate('/');
    }
  }, [accounts, navigate]);

  const handleLogin = async () => {
    try {
      // Use MSAL popup for authentication (no backend needed)
      await instance.loginPopup({
        scopes: [
          'https://graph.microsoft.com/Mail.ReadWrite',
          'https://graph.microsoft.com/Mail.Send',
          'https://graph.microsoft.com/User.Read',
        ],
      });
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      // Try redirect flow as fallback
      try {
        await instance.loginRedirect({
          scopes: [
            'https://graph.microsoft.com/Mail.ReadWrite',
            'https://graph.microsoft.com/Mail.Send',
            'https://graph.microsoft.com/User.Read',
          ],
        });
      } catch (redirectError) {
        console.error('Redirect login error:', redirectError);
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Outlook Team App</h1>
          <p>Sign in with your Microsoft account</p>
        </div>
        <button onClick={handleLogin} className="login-button">
          <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="19" height="19" rx="2" fill="#F25022"/>
            <rect x="1" y="1" width="19" height="9" fill="#7FBA00"/>
            <rect x="1" y="10" width="9" height="10" fill="#00A4EF"/>
            <rect x="11" y="10" width="9" height="10" fill="#FFB900"/>
          </svg>
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
};

export default Login;

