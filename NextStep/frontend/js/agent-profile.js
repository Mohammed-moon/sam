//import serverConfig from '../js/serverHelper.js';

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

    fetch('http://54.175.146.29:5000/api/jobs', {
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
                fetch(`http://54.175.146.29:5000/api/jobs/${job._id}`, {
                    method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + token }
                })
                .then(response => response.json())
                .then(jobData => {
                    const jobElement = document.createElement('div');
                    jobElement.classList.add('job-card', 'border', 'rounded', 'p-3', 'mb-4', 'shadow-sm');

                    // Create the job card HTML with the company logo
                    jobElement.innerHTML = `
                    <div class="job-container" style="font-family: 'Roboto', sans-serif;">
                        <div class="job-header d-flex align-items-center mb-4 p-4 rounded-3 shadow-sm" style="background-color: #f0f8ff;">
                            <!-- Company Logo -->
                            <div class="company-logo me-3">
                                <img src="data:image/png;base64,${companyLogo}" alt="Company Logo" style="max-height: 50px; max-width: 50px;"/>
                            </div>
                
                            <!-- Job Title -->
                            <h3 class="job-title fs-4 fw-bold text-dark flex-grow-1">${jobData.title}</h3>
                
                            <!-- Job Action Icons (Delete) -->
                            <div class="job-actions ms-3 d-flex">
                                  <button class="btn btn-link p-0 delete-job" data-job-id="${jobData._id}">
                                    <i class="fas fa-trash-alt fs-4 text-danger" title="Delete Job"></i>
                                </button>
                            </div>
                        </div>
                
                        <!-- Applicant Info (Moved outside header) -->
                        <div class="job-applicants text-muted mb-3">
                            <i class="fas fa-users text-primary"></i>
                            <span>${jobData.applicationCount || 0} Applicants</span>
                            <button class="btn btn-info btn-sm ms-2 view-applicants-btn" data-job-id="${jobData._id}">View Applicants</button>
                        </div>
                        <p class="job-skills"><strong>Skills Required:</strong> ${jobData.skillsRequired.join(', ')}</p>
                        <p class="job-posted-at"><strong>Posted At:</strong> ${new Date(jobData.createdAt).toLocaleDateString()}</p>
                        <p class="job-updated-at"><strong>Last Updated:</strong> ${new Date(jobData.updatedAt).toLocaleDateString()}</p>
                        <hr>
                        <div class="applicant-details" style="display: none;">
                            <div class="applicant-list"></div>
                        </div>
                    </div>
                `;

                // Add event listener for the "Delete" button
                jobElement.querySelector('.delete-job').addEventListener('click', function () {
                    const jobId = jobData._id;
                
                    // Send DELETE request to the backend
                    fetch(`http://54.175.146.29:5000/api/jobs/${jobId}`, {
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

                jobsList.appendChild(jobElement);

                // Fetch applicants for the job
                fetch(`http://54.175.146.29:5000/api/jobs/${jobData._id}/applications`, {
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

// Event listener for "View Applicants" button
document.addEventListener('click', function (event) {
    if (event.target && event.target.classList.contains('view-applicants-btn')) {
        const jobId = event.target.getAttribute('data-job-id');
        const jobElement = event.target.closest('.job-card');
        const applicantDetailsContainer = jobElement.querySelector('.applicant-details');
        const applicantList = applicantDetailsContainer.querySelector('.applicant-list');

        if (applicantDetailsContainer.style.display === 'none' || applicantDetailsContainer.style.display === '') {
            applicantDetailsContainer.style.display = 'block';
            const applicants = JSON.parse(jobElement.dataset.applicants || '[]');

            applicantList.innerHTML = '';
            if (applicants.length > 0) {
                applicants.forEach(application => {
                    const applicantCard = document.createElement('div');
                    applicantCard.classList.add('applicant-card', 'card', 'mb-4', 'shadow-sm', 'rounded');
            
                    applicantCard.innerHTML = `
                        <div class="card-body" style="font-family: 'Roboto', sans-serif;">
                            <div class="d-flex justify-content-between align-items-center">
                                <!-- Applicant Email -->
                                <h5 class="card-title" style="font-size: 1.25rem; font-weight: bold; color: #333;">${application.user.email}</h5>
                            </div>
            
                            <!-- Status display with conditional color -->
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <strong>Status:</strong> 
                                    <span class="badge 
                                        ${application.status === 'applied' ? 'bg-secondary' : ''} 
                                        ${application.status === 'interview' ? 'bg-warning' : ''} 
                                        ${application.status === 'approved' ? 'bg-success' : ''} 
                                        ${application.status === 'rejected' ? 'bg-danger' : ''}">
                                        ${application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                    </span>
                                </div>
            
                                <!-- Status Dropdown -->
                                <div class="form-group" style="width: 150px;">
                                    <label for="statusSelect" class="visually-hidden">Change Status</label>
                                    <select class="form-select" id="statusSelect">
                                        <option value="applied" ${application.status === 'applied' ? 'selected' : ''}>Applied</option>
                                        <option value="interview" ${application.status === 'interview' ? 'selected' : ''}>Interview</option>
                                        <option value="approved" ${application.status === 'approved' ? 'selected' : ''}>Approved</option>
                                        <option value="rejected" ${application.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                                    </select>
                                </div>
                            </div>
            
                            <p style="font-size: 1rem; color: #555;">
                                <strong>Applied At:</strong> ${new Date(application.appliedAt).toLocaleDateString()}
                            </p>
            
                            <p style="font-size: 1rem; color: #555;">
                                <strong>Resume:</strong> 
                                <a href="/${application.resume}" target="_blank" class="btn btn-link p-0 text-decoration-none" style="font-size: 1rem; color: #007bff;">
                                    <i class="fas fa-eye" title="View Resume"></i> View Resume
                                </a>
                            </p>
            
                            <div class="experience-section">
                                <p style="font-size: 1rem; color: #555;">
                                    <strong>Experience:</strong> 
                                    ${application.profile.experience.map(exp => `${exp.role} at ${exp.company}`).join(', ')}
                                </p>
                            </div>
            
                            <div class="education-section">
                                <p style="font-size: 1rem; color: #555;">
                                    <strong>Education:</strong> 
                                    ${application.profile.education.map(edu => `${edu.degree} from ${edu.university}`).join(', ')}
                                </p>
                            </div>
            
                            <div class="skills-section">
                                <p style="font-size: 1rem; color: #555;">
                                    <strong>Skills:</strong> 
                                    ${application.profile.skills.join(', ')}
                                </p>
                            </div>
                        </div>
                    `;
        
                    applicantList.appendChild(applicantCard);

                    // Handle status change
                    applicantCard.querySelector('#statusSelect').addEventListener('change', function (e) {
                        const newStatus = e.target.value;

                        fetch(`http://54.175.146.29:5000/api/applications/user/${application.user._id}/status`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': 'Bearer ' + token,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ status: newStatus })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.message === 'Application statuses updated successfully') {
                                alert('Applicant status updated');
                                application.status = newStatus;  // Update the status in the UI
                            } else {
                                alert('Error updating status');
                            }
                        })
                        .catch(error => {
                            console.error('Error updating status:', error);
                        });
                    });
                });
            } else {
                applicantList.innerHTML = '<p>No applicants found for this job.</p>';
            }
        } else {
            applicantDetailsContainer.style.display = 'none';
        }
    }
});
});
