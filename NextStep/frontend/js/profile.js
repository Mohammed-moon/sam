document.addEventListener("DOMContentLoaded", function () {
  // Initialize counters for dynamic fields
  let experienceCount = 1;
  let educationCount = 1;

  // Add Experience Field
  document.getElementById('addExperienceBtn')?.addEventListener('click', () => {
    experienceCount++;
    const newExperience = `
      <div class="experience-entry mt-3">
        <label class="form-label">Experience #${experienceCount}</label>
        <input type="text" class="form-control" id="experienceRole${experienceCount}" placeholder="Role">
        <input type="text" class="form-control mt-2" id="experienceCompany${experienceCount}" placeholder="Company">
        <input type="number" class="form-control mt-2" id="experienceYears${experienceCount}" placeholder="Years">
      </div>
    `;
    document.getElementById('experienceFields').insertAdjacentHTML('beforeend', newExperience);
  });

  // Add Education Field
  document.getElementById('addEducationBtn')?.addEventListener('click', () => {
    educationCount++;
    const newEducation = `
      <div class="education-entry mt-3">
        <label class="form-label">Education #${educationCount}</label>
        <input type="text" class="form-control" id="educationDegree${educationCount}" placeholder="Degree">
        <input type="text" class="form-control mt-2" id="educationUniversity${educationCount}" placeholder="University">
        <input type="number" class="form-control mt-2" id="educationYear${educationCount}" placeholder="Graduation Year">
      </div>
    `;
    document.getElementById('educationFields').insertAdjacentHTML('beforeend', newEducation);
  });

  // Handle form submission
  document.getElementById('profile-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Please login first!');
      window.location.href = '/login';
      return;
    }

    const formData = new FormData();

    // Collect experience data
    const experience = [];
    for (let i = 1; i <= experienceCount; i++) {
      const role = document.getElementById(`experienceRole${i}`)?.value;
      const company = document.getElementById(`experienceCompany${i}`)?.value;
      const years = document.getElementById(`experienceYears${i}`)?.value;

      if (role || company || years) {
        experience.push({ role, company, years });
      }
    }
    formData.append('experience', JSON.stringify(experience));

    // Collect education data
    const education = [];
    for (let i = 1; i <= educationCount; i++) {
      const degree = document.getElementById(`educationDegree${i}`)?.value;
      const university = document.getElementById(`educationUniversity${i}`)?.value;
      const year = document.getElementById(`educationYear${i}`)?.value;

      if (degree || university || year) {
        education.push({ degree, university, year });
      }
    }
    formData.append('education', JSON.stringify(education));

    // Add other form fields
    const fields = [
      'fullName', 'phone', 'bio', 'skills',
      'linkedin', 'github', 'address'
    ];

    fields.forEach(field => {
      const value = document.getElementById(field)?.value;
      if (value) formData.append(field, value);
    });

    // Handle file uploads
    const profileImage = document.getElementById('profileImage').files[0];
    const resume = document.getElementById('resume').files[0];

    if (profileImage) {
      formData.append('profileImage', profileImage);
    }else{
      alert('Please upload a profile image');
      return;
    }
    if (resume) {
      formData.append('resume', resume);
    }else{
      alert('Please upload a resume');
      return;
    }

    // Show loader
    const loader = document.getElementById('loadingSpinner');
    loader.style.display = 'block';

    // Determine if creating or updating
    fetch('http://54.175.146.29:5000/api/profile', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => response.json())
      .then(existingProfile => {
        if (existingProfile._id) {
          updateProfile(formData, loader, token);
        } else {
          createProfile(formData, loader, token);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        loader.style.display = 'none';
      });
  });

  // Initial profile load
  getProfile();
});

// Create Profile
function createProfile(formData, loader, token) {
  fetch('http://54.175.146.29:5000/api/profile', {
      method: 'POST',
      body: formData,
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      loader.style.display = 'none';
      if (data.message && data.message.includes('created')) {
          console.log('Profile created:', data);
          localStorage.setItem('profileData', JSON.stringify(data.profile));
          alert(data.message || 'Profile created successfully!');
          // Save profile data to localStorage
          
          // Redirect to manage.html
          console.log("Redirecting to seeker.html...");
          window.location.href = 'seekerdashboard.html';
      } else {
          console.error('Unexpected response from server:', data);
          alert('Error creating profile. Please try again later.');
      }
  })
  .catch(error => {
      console.error('Error creating profile:', error);
      loader.style.display = 'none';
      alert('Something went wrong while creating your profile.');
  });
}

// Update Profile
function updateProfile(formData, loader, token) {
  fetch('http://54.175.146.29:5000/api/profile', {
    method: 'PUT',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .then(data => {
      loader.style.display = 'none';
      console.log('Profile updated:', data);
      alert(data.message || 'Profile updated successfully!');

      // Update profile data in localStorage
      localStorage.setItem('profileData', JSON.stringify(data));

      // Save the updated profile image URL to localStorage
      if (data.profile?.profileImage) {
        localStorage.setItem('profileImage', data.profile.profileImage);
      }

      // Redirect to seekerdashboard.html
      console.log("Redirecting to seeker.html...");
      window.location.href = 'seekerdashboard.html';
    })
    .catch(error => {
      console.error('Error:', error);
      loader.style.display = 'none';
      alert('Error updating profile, please try again later.');
    });
}

// Get Profile (Read)
function getProfile() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const loader = document.getElementById('loadingSpinner');
  loader.style.display = 'block';

  fetch('http://54.175.146.29:5000/api/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(response => response.json())
    .then(profileData => {
      loader.style.display = 'none';
      if (!profileData._id) return;

      // Populate form fields
      const fields = [
        'fullName', 'phone', 'bio', 'skills',
        'linkedin', 'github', 'address'
      ];

      fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) element.value = profileData[field] || '';
      });

      // Handle experience
      if (profileData.experience?.length > 0) {
        profileData.experience.forEach((exp, index) => {
          if (index === 0) {
            document.getElementById('experienceRole').value = exp.role || '';
            document.getElementById('experienceCompany').value = exp.company || '';
            document.getElementById('experienceYears').value = exp.years || '';
          } else {
            // Add dynamic fields for additional experiences
            document.getElementById('addExperienceBtn').click();
            document.getElementById(`experienceRole${index + 1}`).value = exp.role || '';
            document.getElementById(`experienceCompany${index + 1}`).value = exp.company || '';
            document.getElementById(`experienceYears${index + 1}`).value = exp.years || '';
          }
        });
      }

      // Handle education
      if (profileData.education?.length > 0) {
        profileData.education.forEach((edu, index) => {
          if (index === 0) {
            document.getElementById('educationDegree').value = edu.degree || '';
            document.getElementById('educationUniversity').value = edu.university || '';
            document.getElementById('educationYear').value = edu.year || '';
          } else {
            // Add dynamic fields for additional education
            document.getElementById('addEducationBtn').click();
            document.getElementById(`educationDegree${index + 1}`).value = edu.degree || '';
            document.getElementById(`educationUniversity${index + 1}`).value = edu.university || '';
            document.getElementById(`educationYear${index + 1}`).value = edu.year || '';
          }
        });
      }

      // Handle profile image
      const profileImageElement = document.getElementById('profileImageDisplay');
      if (profileData.profileImage) {
        profileImageElement.src = profileData.profileImage;
      }

      // Handle resume
      const resumeLink = document.getElementById('resumeLink');
      if (profileData.resume) {
        resumeLink.href = profileData.resume;
        resumeLink.textContent = 'Download Resume';
      }
    })
    .catch(error => {
      console.error('Error:', error);
      loader.style.display = 'none';
    });
}