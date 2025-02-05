document.addEventListener('DOMContentLoaded', function() {
    // Clear user session or token
    localStorage.removeItem('token');
    localStorage.removeItem('skills');
    
    // Redirect user to the login page or home page after logout
    setTimeout(function() {
        window.location.href = 'index.html'; // Redirect to home or login page
    }, 2000); // Redirects after 2 seconds, showing the logout confirmation message
});
