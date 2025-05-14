# Task Management System

This is a Django-based web application for managing tasks. It allows users with different roles (Admin and Teacher) to interact with the system.

## Features

- **User Authentication:**
  - User Sign up (Admin/Teacher roles)
  - User Login
  - User Logout
  - Forgot Password functionality
- **Admin Role:**
  - Dashboard view
  - Create new tasks and assign them to Teachers.
  - View tasks created by them.
  - Edit existing tasks.
  - Delete tasks.
  - Search for teachers when assigning tasks.
- **Teacher Role:**
  - Dashboard view
  - View tasks assigned to them.
  - Mark tasks as complete.
  - View their completed tasks.
- **Task Management:**
  - Tasks have attributes like title, description, priority (High, Medium, Low), due date, creator, and assignee.
  - View task details.

## Project Structure

```
.
├── db.sqlite3            # SQLite database file
├── final/                # Django project configuration directory
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py       # Project settings
│   ├── urls.py           # Project-level URL routing
│   └── wsgi.py
├── manage.py             # Django's command-line utility
├── myapp/                # Django application directory
│   ├── __init__.py
│   ├── admin.py          # Django admin configuration
│   ├── apps.py
│   ├── migrations/       # Database migrations
│   ├── models.py         # Application data models (User, Task)
│   ├── static/           # Static files (CSS, JavaScript, images)
│   ├── templates/        # HTML templates
│   ├── tests.py
│   └── views.py          # Application views (request handling logic)
└── README.md             # This file
```

## Setup and Installation

1.  **Prerequisites:**

    - Python 3.x
    - Django

2.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

3.  **Install dependencies:**

    ```bash
    pip install Django
    ```

4.  **Apply database migrations:**

    ```bash
    python manage.py migrate
    ```

5.  **Create a superuser (optional, for accessing Django admin):**

    ```bash
    python manage.py createsuperuser
    ```

6.  **Run the development server:**
    ```bash
    python manage.py runserver
    ```
    The application will typically be available at `http://127.0.0.1:8000/`.

## Usage

1.  Navigate to the application URL in your web browser.
2.  **Sign up** as an 'Admin' or 'Teacher'.
3.  **Login** with your credentials.
4.  Based on your role, you will be redirected to your respective dashboard:
    - **Admins** can:
      - Go to "Add Task" to create and assign tasks.
      - View "Created Tasks" to manage tasks they've made.
    - **Teachers** can:
      - View "Assigned Tasks" to see what's pending.
      - Mark tasks as complete from the task list or task details page.
      - View "Completed Tasks".
5.  Both users can view task details by clicking on a task.
6.  Admins can edit or delete tasks from the "Created Tasks" list or task details page.

## Key Files

- `myapp/models.py`: Defines the `User` and `Task` database models.
- `myapp/views.py`: Contains the logic for handling user requests, authentication, and task operations.
- `myapp/templates/`: Contains the HTML templates for the user interface.
- `final/urls.py` and `myapp/urls.py` (if it exists, though not explicitly seen yet): Define the URL routing for the application.
- `final/settings.py`: Configures the Django project, including database settings and installed apps.

---
