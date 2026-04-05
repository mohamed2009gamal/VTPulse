import React, { useState } from 'react';
import styled from 'styled-components';

const Form = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:4000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setSuccess('Account created successfully!');
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: ''
            });
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };


    return (
        <StyledWrapper>
            <div className="main-container">
                <div className="card-box">
                    {/* LEFT PANEL — unchanged */}

                    <div className="right-panel">
                        <form className="form-wrapper" onSubmit={handleSubmit}>
                            <div className="form-header-group">
                                <div className="form-title">Sign Up Account</div>
                                <div className="form-desc">
                                    Enter your personal data to create your account.
                                </div>
                            </div>

                            <div className="row-inputs">
                                <div className="input-box">
                                    <label className="input-label">First Name</label>
                                    <input
                                        className="input-field"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="input-box">
                                    <label className="input-label">Last Name</label>
                                    <input
                                        className="input-field"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-box">
                                <label className="input-label">Email</label>
                                <input
                                    className="input-field"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="input-box">
                                <label className="input-label">Password</label>
                                <input
                                    className="input-field"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {error && <p style={{ color: 'red' }}>{error}</p>}
                            {success && <p style={{ color: 'lime' }}>{success}</p>}

                            <button className="submit-button" disabled={loading}>
                                {loading ? 'Creating...' : 'Sign Up'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </StyledWrapper>
    );
};

export default Form;

const StyledWrapper = styled.div`
  .main-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100vh;
    background-color: #000;
    padding: 20px;
    font-family: "Inter", sans-serif;
    color: white;
  }

  .main-container * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .main-container .card-box {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    max-width: 1000px;
    background: #000;
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid #1a1a1a;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
  }

  .main-container .right-panel {
    flex: 1 1 340px;
    background: black;
    padding: 40px;
    display: flex;
    justify-content: center;
  }

  .form-wrapper {
    width: 100%;
    max-width: 400px;
  }

  .form-header-group {
    margin-bottom: 30px;
  }

  .form-title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
    color: white;
  }

  .form-desc {
    font-size: 14px;
    color: #888;
  }

  .divider-text {
    font-size: 12px;
    color: #555;
    margin-bottom: 15px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .row-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 15px;
  }

  .input-box {
    margin-bottom: 20px;
  }

  .input-label {
    display: block;
    font-size: 14px;
    color: #888;
    margin-bottom: 8px;
  }

  .input-field {
    width: 100%;
    padding: 12px;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    transition: border-color 0.2s;
  }

  .input-field:focus {
    outline: none;
    border-color: #7e22ce;
  }

  .submit-button {
    width: 100%;
    padding: 12px;
    background: #7e22ce;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    margin-top: 10px;
  }

  .submit-button:hover:not(:disabled) {
    background: #6b1fa8;
  }

  .submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
