document.addEventListener('DOMContentLoaded', function () {
    // Get token and expiry time from localStorage
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('token_expiry');
    
    console.log("Token: ", token);
    console.log("Token Expiry: ", tokenExpiry);
    
    // Token expiration validation (7 days)
    if (!token || !tokenExpiry || Date.now() > tokenExpiry) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('token_expiry');
        window.location.href = '/login'; // Redirect to login page
        return;
    }

    // Get the user's skills (this could be from localStorage, a form, or any other source)
    let userSkills = localStorage.getItem('skills') || ''; // Default skills if not set
    console.log("User Skills: ", userSkills);

    // Build the query string based on the user's skills
    function buildQueryString() {
        return userSkills ? `?skills=${encodeURIComponent(userSkills)}` : '';
    }

    // Function to fetch job recommendations based on user's skills
    function fetchJobs() {
        const queryString = buildQueryString();
        console.log("Query String: ", queryString);
    
        // Show a loading indicator while fetching
        const jobListContainer = document.getElementById('recommendedJobList');
        jobListContainer.innerHTML = '<p>Loading jobs...</p>';  // Loading text or spinner
    
        fetch('http://54.175.146.29:5000/api/jobs/recommend' + queryString, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // Assuming token is stored in localStorage
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log("Job Data: ", data);
    
            // Check for success and render jobs
            if (data.success && data.jobs && data.jobs.length > 0) {
                jobListContainer.innerHTML = '';  // Clear previous job listings
    
                // Get the applied jobs from localStorage
                const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs')) || [];
    
                // Filter out the jobs that the user has already applied for
                const filteredJobs = data.jobs.filter(job => !appliedJobs.includes(job._id));
    
                if (filteredJobs.length === 0) {
                    const noJobsMessage = document.createElement('p');
                    noJobsMessage.textContent = 'No recommended jobs available.';
                    jobListContainer.appendChild(noJobsMessage);
                    return;
                }
    
                // Dynamically populate the job listings
                filteredJobs.forEach(job => {
                    const jobItem = document.createElement('div');
                    jobItem.classList.add('job-item');
                    jobItem.innerHTML = `  
                    <div class="job-header">
                    <!-- Display the company logo if it exists -->
                    ${job.companyLogo ? `<img src="data:image/png;base64,${job.companyLogo}" alt="${job.title} Logo" class="company-logo" />` : ''}
                    <h3>${job.title}</h3>
                </div>
                     
                        <p>${job.description}</p>
                        <p><strong>Location:</strong> ${job.location}</p>
                        <p><strong>Salary:</strong> $${new Intl.NumberFormat().format(job.salary)}</p>
                        <p><strong>Type:</strong> ${job.type}</p>
                        <p><strong>Remote:</strong> ${job.remote ? 'Yes' : 'No'}</p>
                        <button class="view-btn" data-job-id="${job._id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="apply-btn" data-job-id="${job._id}">
                            <i class="fas fa-paper-plane"></i> Apply
                        </button>
                    `;
                    jobListContainer.appendChild(jobItem);
                });
    
                // Event delegation for View and Apply buttons
                jobListContainer.addEventListener('click', function (e) {
                    if (e.target.classList.contains('view-btn')) {
                        const jobId = e.target.getAttribute('data-job-id');
                        viewJob(jobId);
                    }
                    if (e.target.classList.contains('apply-btn')) {
                        const jobId = e.target.getAttribute('data-job-id');
                        openApplyModal(jobId);  // Open modal for applying to job
                    }
                });
            } else {
                jobListContainer.innerHTML = '<p>No jobs available based on your skills.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching recommended jobs:', error);
            const jobListContainer = document.getElementById('recommendedJobList');
            jobListContainer.innerHTML = '<p>Error loading jobs. Please try again later.</p>';
        });
    }
    

    // Fetch jobs when the page loads
    fetchJobs();

    // Function to handle viewing a job's details
    function viewJob(jobId) {
        // Redirect to the view page with the jobId
        window.location.href = `view.html?jobId=${jobId}`;
    }

    // Function to handle applying for a job
    function applyForJob(jobId) {
        fetch(`http://54.175.146.29:5000/api/jobs/${jobId}/apply`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                } else {
                    alert('Successfully applied for the job!');
                    updateApplyButtonState(jobId);  // Disable button and update text
                }
            })
            .catch(error => {
                console.error('Error applying for job:', error);
                alert('Something went wrong while applying for the job.');
            });
    }

    // Function to open the Apply modal (this is triggered by clicking "Apply" button)
    function openApplyModal(jobId) {
        const applyModal = document.getElementById('applyModal');
        const applyWithResumeBtn = document.getElementById('applyWithResume');
        const resumeFileInput = document.getElementById('resumeFile');
        const errorMessage = document.getElementById('error-message');

        applyModal.style.display = 'flex';

        applyWithResumeBtn.onclick = function () {
            const formData = new FormData();
            const resumeFile = resumeFileInput.files[0];

            if (!resumeFile) {
                errorMessage.style.display = 'block';
                return;
            }

            errorMessage.style.display = 'none';
            formData.append('resume', resumeFile);

            fetch(`http://54.175.146.29:5000/api/jobs/${jobId}/apply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    alert(data.message || 'Successfully applied for the job!');
                    applyModal.style.display = 'none';
                    updateApplyButtonState(jobId);  // Disable button and update text
                })
                .catch(error => {
                    console.error('Error applying for the job:', error);
                    alert('Something went wrong while applying for the job.');
                });
        };

        document.getElementById('closeModal').onclick = function () {
            applyModal.style.display = 'none';
        };
    }

    // Function to update the apply button to "Applied" and disable it
    function updateApplyButtonState(jobId) {
        const applyButton = document.querySelector(`.apply-btn[data-job-id="${jobId}"]`);
        if (applyButton) {
            applyButton.textContent = 'Applied';
            applyButton.disabled = true;
        }

        // Update the applied jobs in localStorage
        let appliedJobs = JSON.parse(localStorage.getItem('appliedJobs')) || [];
        if (!appliedJobs.includes(jobId)) {
            appliedJobs.push(jobId);
            localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
        }
    }

    // Retrieve the profile image URL from localStorage
    const storedProfileImage = localStorage.getItem('profileImage');
    const profileImageNavElement = document.getElementById('profileImageNav');
  
    if (storedProfileImage) {
        profileImageNavElement.src = storedProfileImage;
    } else {
        profileImageNavElement.src = 'frontend/assets/2.png'; // Default image for the nav
    }
});
