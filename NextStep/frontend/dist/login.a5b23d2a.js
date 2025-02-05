document.getElementById('login').addEventListener('click', async function(event) {
    event.preventDefault(); // Prevent default anchor behavior
    // Get form values
    const form = document.querySelector("form");
    const email = form.querySelector("#form3Example3").value;
    const password = form.querySelector("#form3Example4").value;
    // Validate inputs
    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }
    try {
        // Send login request to backend
        const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });
        const data = await response.json();
        console.log("Login response data:", data);
        if (response.ok) {
            // Save token and its expiration time to localStorage
            const token = data.token;
            const expirationTime = Date.now() + 604800000; // Token expires in 7 days
            localStorage.setItem('token', token);
            localStorage.setItem('token_expiry', expirationTime);
            // Get the user's role
            const userRole = data.role;
            // Role-based redirection
            alert("Login successful! Redirecting...");
            setTimeout(function() {
                // Redirect based on user role
                if (userRole === 'seeker') window.location.replace("http://localhost:5000/create-profile.html");
                else window.location.replace("http://localhost:5000/post-job.html"); // Default home page redirection
            }, 2000); // Delay to show alert before redirection
        } else alert(data.message || "Login failed!");
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred. Please try again later.');
    }
});
// Before making requests that require authentication, ensure the token is valid
function checkSession() {
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('token_expiry');
    if (!token || Date.now() > tokenExpiry) {
        alert('Your session has expired. Please log in again.');
        window.location.replace("http://localhost:5000/login.html"); // Redirect to login page
    }
}
// Example of making an authenticated request to a protected endpoint
async function makeAuthenticatedRequest() {
    const token = localStorage.getItem('token');
    if (!token || Date.now() > localStorage.getItem('token_expiry')) {
        alert("Session expired. Please log in again.");
        window.location.replace("http://localhost:5000/login.html"); // Redirect to login
    } else {
        const response = await fetch("http://localhost:5000/api/protected-endpoint", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            console.log('Protected data:', data);
        } else {
            const errorData = await response.json();
            alert(errorData.message || "Error with the request");
        }
    }
}

//# sourceMappingURL=login.a5b23d2a.js.map
