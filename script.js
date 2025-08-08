function loginUser(event) {
    event.preventDefault();
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    if (email === "admin@campus.com" && password === "1234") {
        localStorage.setItem("loggedIn", true);
        window.location.href = "dashboard.html";
    } else {
        alert("Invalid credentials!");
    }
}

function logoutUser() {
    localStorage.removeItem("loggedIn");
    window.location.href = "login.html";
}

// Prevent access to dashboard without login
if (window.location.pathname.includes("dashboard.html") && !localStorage.getItem("loggedIn")) {
    window.location.href = "login.html";
}
