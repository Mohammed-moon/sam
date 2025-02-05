document.getElementById('login').addEventListener('click', async function (event) {
    event.preventDefault();

    // Get form values
    const email = document.getElementById('form3Example3').value;
    const password = document.getElementById('form3Example4').value;

    // Basic validation
    if (!email || !password) {
        alert("Please fill in both email and password fields.");
        return;
    }

    // Show loading state
    const loginButton = document.getElementById('login');
    const originalText = loginButton.innerHTML;
    loginButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Logging in...';
    loginButton.disabled = true;

    try {
        // Send login request
        const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        // Handle non-JSON responses
        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            console.error("Invalid server response:", responseText);
            throw new Error("Server returned an invalid response");
        }

        // Handle successful login
        if (response.ok) {
            const { token, role } = data;
            const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
            
            // Store token and expiry
            localStorage.setItem('token', token);
            localStorage.setItem('token_expiry', expiryTime.toString());

            console.log("Token stored successfully:", {
                token: token,
                expiry: new Date(expiryTime).toLocaleString()
            });

            // Redirect based on role
            setTimeout(() => {
                window.location.href = role === 'seeker' 
                    ? 'create-profile.html' 
                    : 'post-job.html';
            }, 1000);

        } else {
            alert(data.message || "Login failed. Please check your credentials.");
        }

    } catch (error) {
        console.error("Login error:", error);
        alert(error.message || "Unable to connect to the server. Please try again.");
    } finally {
        loginButton.disabled = false;
        loginButton.innerHTML = originalText;
    }
});

// Token validation utility
function isTokenValid() {
    const token = localStorage.getItem('token');
    const expiry = parseInt(localStorage.getItem('token_expiry'), 10);
    return token && expiry && Date.now() < expiry;
}

// Auto-check token on page load
if (window.location.pathname.includes('post-job.html') && !isTokenValid()) {
    localStorage.removeItem('token');
    localStorage.removeItem('token_expiry');
    window.location.href = 'login.html';
}