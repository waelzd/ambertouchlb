// utils/verification.js (updated)
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateVerificationExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000).toISOString();
};

export const isVerificationExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

export const storePendingUser = (userData) => {
  try {
    // Store in localStorage or sessionStorage
    sessionStorage.setItem('pending_verification', JSON.stringify(userData));
  } catch (error) {
    console.error('Error storing pending user:', error);
  }
};

export const getPendingUser = () => {
  try {
    const data = sessionStorage.getItem('pending_verification');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting pending user:', error);
    return null;
  }
};

export const clearPendingUser = () => {
  try {
    sessionStorage.removeItem('pending_verification');
  } catch (error) {
    console.error('Error clearing pending user:', error);
  }
};