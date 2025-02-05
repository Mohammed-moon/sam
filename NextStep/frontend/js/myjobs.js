document.addEventListener('DOMContentLoaded', function() {
    // Get token and expiry time from localStorage
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('token_expiry');

    // Token expiration validation
    if (!token || !tokenExpiry || Date.now() > tokenExpiry) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('token_expiry');
        window.location.href = '/login';  // Redirect to login page
        return;
    }

    // Fetch applied jobs for the authenticated user
    fetch('http://localhost:5000/api/jobs/user/applications', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,  // Assuming token is stored in localStorage
        }
    })
    .then(response => response.json())
    .then(data => {
        const jobListContainer = document.getElementById('appliedJobList');
        jobListContainer.innerHTML = '';  // Clear any previous content

        // Check if the data has appliedJobs, if not show the message
        if (!data || !data.appliedJobs || data.appliedJobs.length === 0) {
            const noJobsMessage = document.createElement('p');
            noJobsMessage.textContent = 'You have not applied for any jobs yet.';
            jobListContainer.appendChild(noJobsMessage);
            return;
        }

        // Dynamically populate the applied jobs
        data.appliedJobs.forEach(job => {
            if (!job.job) {
                console.error('Job object is missing or invalid:', job);  // Log if 'job' is null or missing
                return;  // Skip the current iteration if the job object is missing
            }

            const jobItem = document.createElement('div');
            jobItem.classList.add('col-md-6');  // Bootstrap grid column for responsive design
            jobItem.classList.add('job-item');
            let statusClass = '';  // To dynamically assign the correct color for the status
            let statusText = '';

            // Set status text and class based on the job status
            if (job.status === 'rejected') {
                statusClass = 'rejected';
                statusText = 'Rejected';
            } else if (job.status === 'approved') {
                statusClass = 'approved';
                statusText = 'Approved';
            } else if (job.status === 'applied') {
                statusClass = 'applied';
                statusText = 'Applied';
            } else if (job.status === 'interview') {
                statusClass = 'interview';
                statusText = 'Interview';
            }

            jobItem.innerHTML = `
                <div class="card mb-3 shadow job-card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div class="job-status ${statusClass} show-status">${statusText}</div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <!-- Left side: Job details -->
                            <div class="col-8">
                           
                            <!-- Display the company logo if it exists -->
                            ${job.job.companyLogo ? 
                                `<img src="data:image/png;base64,${job.job.companyLogo}" alt="${job.job.title} Logo" class="company-logo" />` : ''}
                           
                      
                        <h5 class="card-title">${job.job.title}</h5>
                                <p class="card-text">${job.job.description}</p>
                                <p><strong>Location:</strong> ${job.job.location}</p>
                                <p><strong>Salary:</strong> $${new Intl.NumberFormat().format(job.job.salary)}</p>
                                <p><strong>Type:</strong> ${job.job.type}</p>
                                <p><strong>Remote:</strong> ${job.job.remote ? 'Yes' : 'No'}</p>
                                <p><strong>Applied On:</strong> ${new Date(job.appliedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            jobListContainer.appendChild(jobItem);
        });
    })
    .catch(error => {
        console.error('Error fetching applied jobs:', error);
        const jobListContainer = document.getElementById('appliedJobList');
        jobListContainer.innerHTML = `<p>Error loading your applied jobs. Please try again later.</p>`;
    });
});

// Store the token with expiry time (7 days)
function storeToken(token) {
    const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    localStorage.setItem('token', token);
    localStorage.setItem('token_expiry', expiryTime);
}

window.addEventListener('DOMContentLoaded', function() {
    // Retrieve the profile image URL from localStorage
    const storedProfileImage = localStorage.getItem('profileImage');
  
    const profileImageNavElement = document.getElementById('profileImageNav'); // Reference to the profile image in the navbar
  
    if (storedProfileImage) {
      // If a profile image is stored, use it
      profileImageNavElement.src = storedProfileImage;
    } else {
      // If no image is stored, you can either keep a placeholder or default image
      profileImageNavElement.src = 'frontend/assets/2.png'; // Default image for the nav
    }
});

// Example JavaScript to add the 'show-status' class when needed
function showJobStatus(statusElement, statusClass) {
    // Ensure the status is visible with a fade-in effect
    statusElement.classList.add('show-status');
    
    // Add the corresponding color class based on the job status
    statusElement.classList.add(statusClass); 
}

// Example usage for a job with status
const jobStatusElement = document.querySelector('.job-status'); // Get the status element

// Show "Approved" status after a delay (for demo purposes)
setTimeout(() => {
    showJobStatus(jobStatusElement, 'approved'); // Add the 'approved' status with fade-in
}, 500); // This is just a delay for demonstration
