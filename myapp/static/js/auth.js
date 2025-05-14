function getCsrfToken() {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Login form handling
if (document.getElementById('login')) {
    document.getElementById('login').onsubmit = function(event) {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const type = document.querySelector('input[name="type"]:checked')?.value;
        if (!type) {
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = 'padding: 10px; margin-bottom: 10px; border-radius: 4px; font-size: 14px; text-align: center; font-family: Arial, sans-serif; background-color: #ffebee; color: #d32f2f; border: 1px solid #d32f2f;';
            messageDiv.textContent = 'Please select a role (Admin or Teacher).';
            document.getElementById('login').prepend(messageDiv);
            setTimeout(() => messageDiv.remove(), 5000);
            return;
        }
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('type', type);
        fetch('/login/', {
            method: 'POST',
            body: formData,
            headers: {'X-CSRFToken': getCsrfToken()}
        })
        .then(response => response.json())
        .then(data => {
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = data.status === 'success'
                ? 'padding: 10px; margin-bottom: 10px; border-radius: 4px; font-size: 14px; text-align: center; font-family: Arial, sans-serif; background-color: #e0f7e0; color: #2e7d32; border: 1px solid #2e7d32;'
                : 'padding: 10px; margin-bottom: 10px; border-radius: 4px; font-size: 14px; text-align: center; font-family: Arial, sans-serif; background-color: #ffebee; color: #d32f2f; border: 1px solid #d32f2f;';
            messageDiv.textContent = data.message;
            document.getElementById('login').prepend(messageDiv);
            setTimeout(() => messageDiv.remove(), 5000);
            if (data.status === 'success') {
                sessionStorage.setItem('activeUser', JSON.stringify({
                    username: username,
                    email: data.email || '',
                    role: data.role
                }));
                if (data.role === 'Admin') {
                    window.location.href = '/admin.html';
                } else if (data.role === 'Teacher') {
                    window.location.href = '/teacher.html';
                }
            }
        });
    };
}

// Signup form handling
if (document.getElementById('signup')) {
    document.getElementById('signup').onsubmit = function(event) {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const cpassword = document.getElementById('confirm_password').value;
        const role = document.querySelector('input[name="role"]:checked')?.value;
        if(password != cpassword){
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = 'padding: 10px; margin-bottom: 10px; border-radius: 4px; font-size: 14px; text-align: center; font-family: Arial, sans-serif; background-color: #ffebee; color: #d32f2f; border: 1px solid #d32f2f;';
            messageDiv.textContent = 'Unmatched passwords';
            document.getElementById('signup').prepend(messageDiv);
            setTimeout(() => messageDiv.remove(), 5000);
            return;
        }
        
        if (!role) {
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = 'padding: 10px; margin-bottom: 10px; border-radius: 4px; font-size: 14px; text-align: center; font-family: Arial, sans-serif; background-color: #ffebee; color: #d32f2f; border: 1px solid #d32f2f;';
            messageDiv.textContent = 'Please select a role (Admin or Teacher).';
            document.getElementById('signup').prepend(messageDiv);
            setTimeout(() => messageDiv.remove(), 5000);
            return;
        }
        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('role', role);
        fetch('/signup/', {
            method: 'POST',
            body: formData,
            headers: {'X-CSRFToken': getCsrfToken()}
        })
        .then(response => response.json())
        .then(data => {
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = data.status === 'success'
                ? 'padding: 10px; margin-bottom: 10px; border-radius: 4px; font-size: 14px; text-align: center; font-family: Arial, sans-serif; background-color: #e0f7e0; color: #2e7d32; border: 1px solid #2e7d32;'
                : 'padding: 10px; margin-bottom: 10px; border-radius: 4px; font-size: 14px; text-align: center; font-family: Arial, sans-serif; background-color: #ffebee; color: #d32f2f; border: 1px solid #d32f2f;';
            messageDiv.textContent = data.message;
            document.getElementById('signup').prepend(messageDiv);
            setTimeout(() => messageDiv.remove(), 5000);
            if (data.status === 'success') {
                setTimeout(() => window.location.href = '/login/', 2000);
            }
        });
    };
}

// Logout button handling
document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.onclick = function() {
            fetch('/logout/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken(),
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    sessionStorage.removeItem('activeUser');
                    alert('See you soon...');
                    window.location.href = '/';
                } else {
                    alert('Failed to log out: ' + data.message);
                }
            });
        };
    }
});