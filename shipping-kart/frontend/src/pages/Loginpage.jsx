import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  Alert,
  Collapse,
  InputAdornment,
  IconButton,
  Fade,
  Slide,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  Login as LoginIcon,
  PersonAdd,
  Login
} from '@mui/icons-material';

const Loginpage = () => {
  const navigate = useNavigate();
  // State Management
  const [tabValue, setTabValue] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    adminSecret: ''
  });

  // Handle Tab Change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');
    setFormData({ name: '', email: '', password: '', adminSecret: '' });
  };

  // Handle Input Change
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle Admin Toggle
  const handleAdminToggle = (e) => {
    setIsAdmin(e.target.checked);
    setError('');
    if (!e.target.checked) {
      setFormData({ ...formData, adminSecret: '' });
    }
  };

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role
      }));

      setSuccess(`Welcome back, ${data.name}! (${data.role})`);
      
      // Redirect to home page after successful login
      setTimeout(() => {
        navigate('/home');
      }, 1500);

    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Signup Handler
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const requestBody = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };

      // Add admin fields if admin mode is enabled
      if (isAdmin) {
        requestBody.role = 'admin';
        requestBody.adminSecret = formData.adminSecret;
      }

      const response = await fetch('http://localhost:5000/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role
      }));

      setSuccess(`Account created successfully! Welcome, ${data.name} (${data.role})`);
      
        // Switch to login tab after successful signup
        setTimeout(() => {
          setTabValue(0);
        }, 1500);

    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="sm">
        <Fade in={true} timeout={800}>
          <Card
            elevation={10}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
              },
            }}
          >
            {/* Header */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: 4,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  animation: 'fadeInDown 0.6s ease-out',
                  '@keyframes fadeInDown': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateY(-20px)',
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateY(0)',
                    },
                  },
                }}
              >
              Shipping Cart
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Your trusted logistics partner
              </Typography>
            </Box>

            <CardContent sx={{ padding: { xs: 3, sm: 4 } }}>
              {/* Admin Mode Toggle */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isAdmin}
                      onChange={handleAdminToggle}
                      color="secondary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AdminPanelSettings />
                      <Typography variant="body2" fontWeight={600}>
                        Admin Mode
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              {/* Tabs */}
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                  mb: 3,
                  '& .MuiTab-root': {
                    fontWeight: 600,
                    fontSize: '1rem',
                  },
                }}
              >
                <Tab
                  icon={<LoginIcon />}
                  label="Login"
                  iconPosition="start"
                />
                <Tab
                  icon={<PersonAdd />}
                  label="Sign Up"
                  iconPosition="start"
                />
              </Tabs>

              {/* Alert Messages */}
              <Collapse in={!!error}>
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              </Collapse>

              <Collapse in={!!success}>
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                  {success}
                </Alert>
              </Collapse>

              {/* Login Form */}
              {tabValue === 0 && (
                <Slide direction="right" in={tabValue === 0} mountOnEnter unmountOnExit>
                  <Box
                    component="form"
                    onSubmit={handleLogin}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2.5,
                    }}
                  >
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                      autoComplete="email"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'scale(1.01)',
                          },
                        },
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                      autoComplete="current-password"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'scale(1.01)',
                          },
                        },
                      }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{
                        mt: 2,
                        py: 1.5,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontWeight: 600,
                        fontSize: '1rem',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                        },
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Login'
                      )}
                    </Button>
                  </Box>
                </Slide>
              )}

              {/* Signup Form */}
              {tabValue === 1 && (
                <Slide direction="left" in={tabValue === 1} mountOnEnter unmountOnExit>
                  <Box
                    component="form"
                    onSubmit={handleSignup}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2.5,
                    }}
                  >
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                      autoComplete="name"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'scale(1.01)',
                          },
                        },
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                      autoComplete="email"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'scale(1.01)',
                          },
                        },
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                      autoComplete="new-password"
                      helperText="Minimum 6 characters"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'scale(1.01)',
                          },
                        },
                      }}
                    />

                    {/* Admin Secret Field - Only shown when Admin Mode is ON */}
                    <Collapse in={isAdmin}>
                      <TextField
                        fullWidth
                        label="Admin Secret Key"
                        name="adminSecret"
                        type="password"
                        value={formData.adminSecret}
                        onChange={handleInputChange}
                        required={isAdmin}
                        variant="outlined"
                        helperText="Required for admin registration"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            transition: 'all 0.3s',
                            backgroundColor: 'rgba(102, 126, 234, 0.05)',
                            '&:hover': {
                              transform: 'scale(1.01)',
                            },
                          },
                        }}
                      />
                    </Collapse>

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{
                        mt: 2,
                        py: 1.5,
                        background: isAdmin 
                          ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontWeight: 600,
                        fontSize: '1rem',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          boxShadow: isAdmin
                            ? '0 8px 20px rgba(245, 87, 108, 0.4)'
                            : '0 8px 20px rgba(102, 126, 234, 0.4)',
                        },
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        `Create ${isAdmin ? 'Admin' : 'User'} Account`
                      )}
                    </Button>
                  </Box>
                </Slide>
              )}

              {/* Footer Text */}
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'center',
                  mt: 3,
                  color: 'text.secondary',
                }}
              >
                {tabValue === 0 ? (
                  <>
                    Don't have an account?{' '}
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        color: 'primary.main',
                        fontWeight: 600,
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                      onClick={() => setTabValue(1)}
                    >
                      Sign up here
                    </Typography>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        color: 'primary.main',
                        fontWeight: 600,
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                      onClick={() => setTabValue(0)}
                    >
                      Login here
                    </Typography>
                  </>
                )}
              </Typography>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
};

export default Loginpage;