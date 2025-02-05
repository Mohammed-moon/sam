document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId');

    // Token expiration validation
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('token_expiry');  // Get token expiry time from localStorage

    // Check if token exists and has expired (7 days validity)
    if (!token || !tokenExpiry || Date.now() > tokenExpiry) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('token_expiry');  // Remove expired token
        window.location.href = '/login';  // Redirect to login page
        return;
    }

    // Fetch job details if jobId is present
    if (jobId) {
        fetchJobDetails(jobId);
    } else {
        alert('Job ID is missing');
    }

    // Retrieve search parameters from localStorage if available
    const searchParams = JSON.parse(localStorage.getItem('searchParams'));
    if (searchParams) {
        // Optionally use the search parameters to display them or apply logic
        console.log('Search parameters:', searchParams);
    }
});

function fetchJobDetails(jobId) {
    fetch(`http://54.175.146.29:5000/api/jobs/${jobId}`, {  // Fixed endpoint
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
    })
    .then(response => response.json())
    .then(job => {
        if (job) {
            // Display job details including application count
            displayJobDetails(job);
        } else {
            alert('Job not found!');
        }
    })
    .catch(error => {
        console.error('Error fetching job details:', error);
        alert('Error fetching job details');
    });
}

function displayJobDetails(job) {
    const jobDetailsContainer = document.getElementById('job-details-container');
    const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs')) || [];
    const hasApplied = appliedJobs.includes(job._id);

    const jobStatus = job.status ? job.status.trim().toLowerCase() : '';
    const statusText = (jobStatus === 'open') ? 'Open' : 'Closed';

    const jobDetailsHTML = `
    <div class="job-header">
    <!-- Display the company logo if it exists -->
    ${job.companyLogo ? `<img src="data:image/png;base64,${job.companyLogo}" alt="${job.title} Logo" class="company-logo" />` : ''}
    <h3>${job.title}</h3>
</div>
      <div class="header">
          <div class="job-header-item">
              <i class="fas fa-map-marker-alt"></i> <strong>Location:</strong> ${job.location}
          </div>
          <div class="job-header-item">
              <i class="fas fa-users"></i> <strong>Applicants:</strong> ${job.applicationCount}
          </div>
          <div class="job-header-item">
              <i class="fas fa-check-circle"></i> <strong>Status:</strong> ${statusText}
          </div>
          
      </div>
      
    
      <p><strong>Description:</strong></p>
      <p>${job.description}</p>

      <div class="job-details">
          <p><strong>Salary:</strong> $${new Intl.NumberFormat().format(job.salary)}</p>
          <p><strong>Contract Type:</strong> ${job.type}</p>
          <p><strong>Remote:</strong> ${job.remote ? 'Yes' : 'No'}</p>
      </div>

      <!-- Apply Button -->
      <button id="applyBtn" class="btn btn-primary" ${hasApplied ? 'disabled' : ''}>
        ${hasApplied ? 'Applied' : 'Apply'}
      </button>
    `;

    jobDetailsContainer.innerHTML = jobDetailsHTML;

    // Handle apply button click
    document.getElementById('applyBtn').addEventListener('click', () => {
        if (!hasApplied) {
            applyForJob(job._id);
        }
    });
}

function applyForJob(jobId) {
    fetch(`http://54.175.146.29:5000/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);  // Display the message if the user has already applied
        } else {
            alert('Successfully applied for the job!');
            updateAppliedJobs(jobId, data.applicationCount);  // Update count from backend response
        }
    })
    .catch(error => {
        console.error('Error applying for the job:', error);
        alert('Something went wrong while applying for the job.');
    });
}

function updateAppliedJobs(jobId, newApplicationCount) {
    let appliedJobs = JSON.parse(localStorage.getItem('appliedJobs')) || [];
    if (!appliedJobs.includes(jobId)) {
        appliedJobs.push(jobId);
        localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
    }

    // Disable the "Apply" button and change its text
    const applyButton = document.getElementById('applyBtn');
    if (applyButton) {
        applyButton.textContent = 'Applied';
        applyButton.disabled = true;
    }

    // Update the applicant count on the page using the new value from the backend response
    const applicantCountElement = document.querySelector('.job-header-item i + strong');
    if (applicantCountElement) {
        applicantCountElement.textContent = newApplicationCount;
    }
}
