// Initialize Quill Editor
const quill = new Quill('#jobDescriptionEditor', {
    theme: 'snow',
    placeholder: 'Enter job description...',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean']
      ]
    }
  });
  
  // Logo Preview Handler
  document.getElementById('companyLogo').addEventListener('change', function(event) {
    const logoPreview = document.getElementById('logoPreview');
    const file = event.target.files[0];
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        logoPreview.src = e.target.result;
        logoPreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      logoPreview.style.display = 'none';
    }
  });
  
  // Form Submission Handler
  document.getElementById('postJobForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log('[DEBUG] Form submission started');
  
    // Validate Token First
    if (!isTokenValid()) {
      alert('Session expired. Please log in again.');
      clearAuthData();
      window.location.href = 'login.html';
      return;
    }
  
    // Prepare Job Data
    const jobData = {
      title: document.getElementById('jobTitle').value.trim(),
      description: quill.root.innerHTML,
      location: document.getElementById('location').value.trim(),
      salary: parseFloat(document.getElementById('salary').value),
      type: document.getElementById('jobType').value,
      remote: document.getElementById('remote').checked,
      skills: document.getElementById('skills').value.split(',').map(skill => skill.trim())
    };
  
    // Validate Form Data
    if (!validateForm(jobData)) return;
  
    // Handle File Upload
    const companyLogo = document.getElementById('companyLogo').files[0];
    const loader = document.getElementById('loadingSpinner');
    const submitBtn = document.getElementById('submitBtn');
  
    // Show Loading State
    submitBtn.disabled = true;
    loader.style.display = 'block';
  
    try {
      // Process Image if Exists
      if (companyLogo) {
        const base64Image = await convertToBase64(companyLogo);
        jobData.companyLogo = base64Image;
      }
  
      // Submit Job Data
      await submitJobData(jobData);
      
    } catch (error) {
      console.error('[SUBMISSION ERROR]', error);
      alert(`Submission failed: ${error.message}`);
    } finally {
      submitBtn.disabled = false;
      loader.style.display = 'none';
    }
  });
  
  // Convert Image to Base64
  async function convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }
  
  // Submit Job Data to Server
  async function submitJobData(jobData) {
    const token = localStorage.getItem('token');
    
    try {
      console.log('[DEBUG] Submitting to:', 'http://localhost:5000/api/jobs');
      console.log('[DEBUG] Job data:', jobData);
  
      const response = await fetch('http://localhost:5000/api/jobs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobData)
      });
  
      console.log('[DEBUG] Response status:', response.status);
  
      // Handle Empty Responses
      const responseText = await response.text();
      let data = {};
      
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        console.error('[ERROR] Invalid JSON response:', responseText);
        throw new Error('Server returned invalid response');
      }
  
      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }
  
      if (data.message === 'Job posted successfully') {
        alert('Job posted successfully!');
        clearForm();
        window.location.href = 'agentjobs.html';
      } else {
        throw new Error(data.message || 'Unknown server response');
      }
  
    } catch (error) {
      console.error('[NETWORK ERROR]', error);
      throw new Error(error.message || 'Failed to connect to server');
    }
  }
  
  // Form Validation
  function validateForm(jobData) {
    const errors = [];
  
    if (!jobData.title) errors.push('Job title is required');
    if (!jobData.description || quill.getText().trim().length < 50) {
      errors.push('Description must be at least 50 characters');
    }
    if (!jobData.location) errors.push('Location is required');
    if (isNaN(jobData.salary) || jobData.salary <= 0) {
      errors.push('Valid salary is required');
    }
    if (jobData.skills.length === 0) errors.push('At least one skill is required');
  
    if (errors.length > 0) {
      alert(`Form errors:\n${errors.join('\n')}`);
      return false;
    }
    return true;
  }
  
  // Token Validation
  function isTokenValid() {
    const token = localStorage.getItem('token');
    const expiry = parseInt(localStorage.getItem('token_expiry'), 10);
    return token && expiry && Date.now() < expiry;
  }
  
  // Clear Form
  function clearForm() {
    document.getElementById('postJobForm').reset();
    quill.root.innerHTML = '';
    document.getElementById('logoPreview').style.display = 'none';
    console.log('[DEBUG] Form cleared');
  }
  
  // Clear Authentication Data
  function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('token_expiry');
    console.log('[DEBUG] Auth data cleared');
  }