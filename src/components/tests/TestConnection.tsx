import React, { useEffect, useState } from 'react';
import { api } from '@/utils/api';

const TestConnection: React.FC = () => {
  const [message, setMessage] = useState('Testing connection...');

  useEffect(() => {
    api.get('/api/auth/user')
      .then(data => {
        setMessage('Connection successful. User data retrieved.');
        console.log('User data:', data);
      })
      .catch(error => {
        setMessage('Connection failed. See console for details.');
        console.error('Error:', error);
      });
  }, []);

  return <div>{message}</div>;
};

export default TestConnection;
