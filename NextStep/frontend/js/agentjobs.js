document.addEventListener('DOMContentLoaded', function () {
    // Get token and expiry time from localStorage
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('token_expiry');

    // Token expiration validation (7 days)
    if (!token || !tokenExpiry || Date.now() > tokenExpiry) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('token_expiry');
        window.location.href = '/login'; // Redirect to login page
        return;
    }

    // Update navbar with company logo from localStorage
    const companyLogo = localStorage.getItem('companyLogo');

    const loader = document.getElementById('loadingSpinner');
    loader.style.display = 'block';

    fetch('http://localhost:5000/api/jobs', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(response => response.json())
    .then(data => {
        loader.style.display = 'none';
        if (data.message) {
            alert(data.message);
            return;
        }

        const jobsList = document.getElementById('jobsList');
        if (data.length === 0) {
            jobsList.innerHTML = '<p class="text-muted">No jobs found.</p>';
        } else {
            data.forEach(job => {
                fetch(`http://localhost:5000/api/jobs/${job._id}`, {
                    method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + token }
                })
                .then(response => response.json())
                .then(jobData => {
                    const jobElement = document.createElement('div');
                    jobElement.classList.add('job-card', 'border', 'rounded', 'p-3', 'mb-4', 'shadow-sm');

                    let statusIcon, statusColor;
                    if (jobData.status === 'open') {
                        statusIcon = 'check-circle';
                        statusColor = '#28a745';
                    } else if (jobData.status === 'closed') {
                        statusIcon = 'times-circle';
                        statusColor = '#dc3545';
                    }

                    // Create the job card HTML with the logo, title, and status properly aligned
                    jobElement.innerHTML = `
                        <div class="job-header d-flex align-items-center mb-4 p-4 rounded-3 shadow-sm" style="font-family: 'Roboto', sans-serif; background-color: #f0f8ff;">
                            <!-- Company Logo 
                            <div class="company-logo me-3" style="display: none;">
                                <img src="data:image/png;base64,${companyLogo}" alt="Company Logo" style="max-height: 50px; max-width: 50px;" id="companyLogo"/>
                            </div>
-->
                            <!-- Job Title -->
                            <h3 class="job-title fs-4 fw-bold text-dark flex-grow-1">${jobData.title}</h3>

                            <!-- Job Status aligned to the right -->
                            <div class="job-status ms-3" style="color: ${statusColor};">
                                <i class="fas fa-${statusIcon}"></i>
                                <span class="ms-1">${jobData.status.charAt(0).toUpperCase() + jobData.status.slice(1)}</span>
                            </div>

                            <!-- Job Action Icons (Update and Delete) -->
                            <div class="job-actions ms-3 d-flex">
                                <a href="/update-job.html?id=${jobData._id}" class="me-2">
                                    <i class="fas fa-edit fs-4" title="Update Job"></i>
                                </a>
                                <button class="btn btn-link p-0 delete-job" data-job-id="${jobData._id}">
                                    <i class="fas fa-trash-alt fs-4 text-danger" title="Delete Job"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Job Meta Information (Location, Posted At) -->
                        <div class="job-meta d-flex flex-column flex-sm-row justify-content-between w-100 p-4" style="font-family: 'Roboto', sans-serif;">
                            <p class="job-location text-muted mb-2 mb-sm-0">
                                <i class="fas fa-map-marker-alt text-primary me-2"></i><strong>Location:</strong> ${jobData.location}
                            </p>
                            <p class="job-posted-at text-muted mb-0">
                                <i class="fas fa-calendar text-primary me-2"></i><strong>Posted At:</strong> ${new Date(jobData.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        <!-- Job Details Section -->
                        <div class="job-details p-4" style="font-family: 'Roboto', sans-serif;">
                            <p class="job-description text-muted"><strong>Description:</strong> ${jobData.description}</p>
                            <p class="job-salary"><strong>Salary:</strong> $${jobData.salary}</p>
                            <p class="job-type"><strong>Job Type:</strong> ${jobData.type}</p>
                            <p class="job-remote"><strong>Remote:</strong> ${jobData.remote ? 'Yes' : 'No'}</p>
                            <p class="job-skills"><strong>Skills Required:</strong> ${jobData.skillsRequired.join(', ')}</p>
                            <p class="job-updated-at">
                                <i class="fas fa-sync-alt text-primary me-2"></i><strong>Last Updated:</strong> ${new Date(jobData.updatedAt).toLocaleDateString()}
                            </p>
                        </div>

                        <hr>

                        <!-- Applicant Details Section (hidden by default) -->
                        <div class="applicant-details" style="display: none;">
                            <div class="applicant-list"></div>
                        </div>
                    `;

                    jobsList.appendChild(jobElement);

                    // Display the company logo after clicking the "Update" button
                    const updateButton = jobElement.querySelector('.fa-edit');
                    if (updateButton) {
                        updateButton.addEventListener('click', () => {
                            const companyLogoElement = jobElement.querySelector('.company-logo');
                            if (companyLogoElement) {
                                companyLogoElement.style.display = 'block';  // Show the company logo
                            }
                        });
                    }

                    // Fetch applicants for the job (optional, based on your needs)
                    fetch(`http://localhost:5000/api/jobs/${jobData._id}/applications`, {
                        method: 'GET',
                        headers: { 'Authorization': 'Bearer ' + token }
                    })
                    .then(response => response.json())
                    .then(applicantData => {
                        if (applicantData.message !== "Applications fetched successfully") {
                            console.error('Error fetching applications:', applicantData.message);
                            return;
                        }

                        if (applicantData.applications && applicantData.applications.length > 0) {
                            jobElement.dataset.applicants = JSON.stringify(applicantData.applications);
                        } else {
                            jobElement.dataset.applicants = '[]';
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching applicants:', error);
                    });

                    // Add event listener for the "Delete" button
                    jobElement.querySelector('.delete-job').addEventListener('click', function () {
                        const jobId = jobData._id;

                        // Send DELETE request to the backend
                        fetch(`http://localhost:5000/api/jobs/${jobId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': 'Bearer ' + token
                            }
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.message === 'Job deleted successfully.') {
                                alert('Job deleted successfully!');
                                jobElement.remove();  // Remove the job from the UI
                            } else {
                                alert('Failed to delete the job: ' + data.message);
                            }
                        })
                        .catch(error => {
                            console.error('Error deleting job:', error);
                            alert('An error occurred while deleting the job.');
                        });
                    });
                })
                .catch(error => {
                    console.error('Error fetching job details:', error);
                    alert('Error fetching job details. Please try again later.');
                });
            });
        }
    })
    .catch(error => {
        console.error('Error fetching jobs:', error);
        loader.style.display = 'none';
        alert('Error fetching jobs. Please try again later.');
    });
});
