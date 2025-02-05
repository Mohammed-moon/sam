document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('token_expiry');

    if (!token || !tokenExpiry || Date.now() > tokenExpiry) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('token_expiry');
        window.location.href = '/login';
        return;
    }

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
            jobsList.innerHTML = '<p>No jobs found.</p>';
        } else {
            data.forEach(job => {
                fetch(`http://54.175.146.29:5000/api/jobs/${job._id}`, {
                    method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + token }
                })
                .then(response => response.json())
                .then(jobData => {
                    const jobElement = document.createElement('div');
                    jobElement.classList.add('job-card');
                    
                    let statusIcon, statusColor;
                    if (jobData.status === 'open') {
                        statusIcon = 'check-circle';
                        statusColor = '#28a745';
                    } else if (jobData.status === 'closed') {
                        statusIcon = 'times-circle';
                        statusColor = '#dc3545';
                    }

                    const applicantColor = jobData.applicationCount > 0 ? '#007bff' : '#6c757d';

                    jobElement.innerHTML = ` 
                        <div class="job-header">
                            <h3 class="job-title">${jobData.title}</h3>
                            <div class="job-status" style="color: ${statusColor};">
                                <i class="fas fa-${statusIcon}"></i>
                                <span>${jobData.status.charAt(0).toUpperCase() + jobData.status.slice(1)}</span>
                            </div>
                            <div class="job-applicants" style="color: ${applicantColor};">
                                <i class="fas fa-users"></i>
                                <span>${jobData.applicationCount || 0} Applicants</span>
                                <button class="btn btn-info view-applicants-btn" data-job-id="${jobData._id}">View Applicants</button>
                            </div>
                        </div>
                        <p class="job-description"><strong>Description:</strong> ${jobData.description}</p>
                        <p class="job-location"><strong>Location:</strong> ${jobData.location}</p>
                        <p class="job-salary"><strong>Salary:</strong> $${jobData.salary}</p>
                        <p class="job-type"><strong>Job Type:</strong> ${jobData.type}</p>
                        <p class="job-remote"><strong>Remote:</strong> ${jobData.remote ? 'Yes' : 'No'}</p>
                        <p class="job-skills"><strong>Skills Required:</strong> ${jobData.skillsRequired.join(', ')}</p>
                        <p class="job-posted-at"><strong>Posted At:</strong> ${new Date(jobData.createdAt).toLocaleDateString()}</p>
                        <p class="job-updated-at"><strong>Last Updated:</strong> ${new Date(jobData.updatedAt).toLocaleDateString()}</p>
                        <div class="job-actions">
                            <a href="/update-job.html?id=${jobData._id}" class="btn btn-primary">
                                <i class="fas fa-edit"></i> Update Details
                            </a>
                            <button class="btn btn-danger delete-job" data-job-id="${jobData._id}">
                                <i class="fas fa-trash-alt"></i> Delete
                            </button>
                        </div>
                        <hr>
                        <div class="applicant-details" style="display: none;">
                            <div class="applicant-list"></div>
                        </div>
                    `;

                    jobsList.appendChild(jobElement);

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
                        applicantCard.classList.add('applicant-card', 'card', 'mb-3');
                        applicantCard.innerHTML = `
                            <div class="card-body">
                                <h5 class="card-title">${application.user.email}</h5>
                                <p><strong>Status:</strong> ${application.status}</p>
                                <p><strong>Applied At:</strong> ${new Date(application.appliedAt).toLocaleDateString()}</p>
                                <p><strong>Resume:</strong> <a href="/${application.resume}" target="_blank">Download Resume</a></p>
                                <p><strong>Experience:</strong> ${application.profile.experience.map(exp => `${exp.role} at ${exp.company}`).join(', ')}</p>
                                <p><strong>Education:</strong> ${application.profile.education.map(edu => `${edu.degree} from ${edu.university}`).join(', ')}</p>
                                <p><strong>Skills:</strong> ${application.profile.skills.join(', ')}</p>
                                <div class="form-group">
                                    <label for="statusSelect">Change Status:</label>
                                    <select class="form-control" id="statusSelect">
                                        <option value="interview" ${application.status === 'interview' ? 'selected' : ''}>Interview</option>
                                        <option value="approved" ${application.status === 'approved' ? 'selected' : ''}>Approved</option>
                                        <option value="rejected" ${application.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                                    </select>
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
                                    // Optionally, update UI with the new status
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
