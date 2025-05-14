from django.shortcuts import render
from django.http import JsonResponse
from django.contrib import messages
from .models import User, Task
import json
from django.views.decorators.http import require_GET
from django.utils import timezone

def index(request):
    return render(request, 'index.html')

def login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        type = request.POST.get('type')
        try:
            user = User.objects.get(username=username, password=password)
            if user.role != type:
                return JsonResponse({'status': 'error', 'message': f'Role mismatch! You signed up as {user.role}.'})
            print(f"Login successful for {username}, role: {user.role}")
            request.session['active_user'] = json.dumps({
                'username': user.username,
                'email': user.email,
                'role': user.role
            })
            return JsonResponse({
                'status': 'success',
                'message': f'Welcome, {user.username}!',
                'role': user.role,
                'email': user.email
            })
        except User.DoesNotExist:
            print(f"Login failed: Invalid username or password for {username}")
            return JsonResponse({'status': 'error', 'message': 'Invalid username or password.'})
    return render(request, 'login.html')

def forgot_psw(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        if User.objects.filter(email=email).exists():
            print(f"Password reset requested for {email}")
            return JsonResponse({'status': 'success', 'message': f'Password reset link sent to {email}'})
        print(f"Password reset failed: Email {email} not found")
        return JsonResponse({'status': 'error', 'message': 'Email not found. Please sign up or try again.'})
    return render(request, 'forgot-psw.html')

def signup(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        role = request.POST.get('role')
        print(f"Signup attempt: username={username}, email={email}, role={role}")
        if not all([username, email, password, role]):
            print("Signup failed: Missing required fields")
            return JsonResponse({'status': 'error', 'message': 'All fields are required.'})
        if User.objects.filter(username=username).exists():
            print(f"Signup failed: Username {username} already taken")
            return JsonResponse({'status': 'error', 'message': 'Username already taken.'})
        if User.objects.filter(email=email).exists():
            print(f"Signup failed: Email {email} already taken")
            return JsonResponse({'status': 'error', 'message': 'Email already taken.'})
        User.objects.create(username=username, email=email, password=password, role=role)
        print(f"Signup successful for {username}, role: {role}")
        return JsonResponse({'status': 'success', 'message': 'User created successfully!', 'role': role})
    return render(request, 'signup.html')

def admin_dashboard(request):
    return render(request, 'admin.html')

def teacher_dashboard(request):
    return render(request, 'teacher.html')

def logout(request):
    if request.method == 'POST':
        print("Logout request received")
        request.session.flush()
        return JsonResponse({'status': 'success', 'message': 'You have been logged out.'})
    print("Logout failed: Invalid request method")
    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'})

def add_task(request):
    if request.method == 'POST':
        active_user = json.loads(request.session.get('active_user', '{}'))
        if not active_user or active_user.get('role') != 'Admin':
            return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
        data = json.loads(request.body)
        task_id = data.get('taskId')
        title = data.get('taskTitle')
        teacher_name = data.get('teacherName')
        priority = data.get('priority')
        due_date = data.get('dueDate')
        description = data.get('description')
        created_by = active_user['username']

        try:
            creator = User.objects.get(username=created_by)
            assignee = User.objects.get(username=teacher_name, role='Teacher')
            task = Task.objects.create(
                id=task_id if task_id else None,  # Let DB assign ID if not provided
                title=title,
                description=description,
                priority=priority.capitalize(),  # Ensure consistency with model
                due_date=timezone.datetime.strptime(due_date, '%Y-%m-%d'),
                creator=creator,
                assignee=assignee
            )
            print(f"Task created: {title} by {creator.username}, assigned to {teacher_name}")
            return JsonResponse({
                'status': 'success',
                'message': 'Task created successfully!',
                'taskId': task.id
            })
        except User.DoesNotExist:
            print(f"Task creation failed: Teacher {teacher_name} not found")
            return JsonResponse({'status': 'error', 'message': 'Teacher not found.'})
        except Exception as e:
            print(f"Task creation failed: {str(e)}")
            return JsonResponse({'status': 'error', 'message': str(e)})
    return render(request, 'add-task.html')

def get_teachers(request):
    if request.method == 'GET':
        query = request.GET.get('query', '')
        teachers = User.objects.filter(
            role='Teacher',
            username__icontains=query
        ).values('username')[:5]  # Limit to 5 suggestions
        return JsonResponse({'status': 'success', 'teachers': list(teachers)})
    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'})

def created_tasks(request):
    active_user = json.loads(request.session.get('active_user', '{}'))
    if not active_user or active_user.get('role') != 'Admin':
        return render(request, 'index.html')  # Redirect unauthorized users
    return render(request, 'created-tasks.html')

@require_GET
def get_created_tasks(request):
    active_user = json.loads(request.session.get('active_user', '{}'))
    if not active_user or active_user.get('role') != 'Admin':
        return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
    tasks = Task.objects.filter(creator__username=active_user['username']).values(
        'id', 'title', 'priority', 'due_date', 'assignee__username', 'description', 'creator__username'
    )
    return JsonResponse({'status': 'success', 'tasks': list(tasks)})

def assigned_tasks(request):
    active_user = json.loads(request.session.get('active_user', '{}'))
    if not active_user or active_user.get('role') != 'Teacher':
        return render(request, 'index.html')  # Redirect unauthorized users
    return render(request, 'assigned-task.html')

@require_GET
def get_assigned_tasks(request):
    active_user = json.loads(request.session.get('active_user', '{}'))
    if not active_user or active_user.get('role') != 'Teacher':
        return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
    tasks = Task.objects.filter(
        assignee__username=active_user['username'],
        completed=False
    ).values(
        'id', 'title', 'priority', 'due_date', 'creator__username', 'description'
    )
    return JsonResponse({'status': 'success', 'tasks': list(tasks)})

def completed_tasks(request):
    active_user = json.loads(request.session.get('active_user', '{}'))
    if not active_user or active_user.get('role') != 'Teacher':
        return render(request, 'index.html')  # Redirect unauthorized users
    return render(request, 'completed-task.html')

@require_GET
def get_completed_tasks(request):
    active_user = json.loads(request.session.get('active_user', '{}'))
    if not active_user or active_user.get('role') != 'Teacher':
        return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
    tasks = Task.objects.filter(
        assignee__username=active_user['username'],
        completed=True
    ).values(
        'id', 'title', 'priority', 'due_date', 'creator__username', 'description'
    )
    return JsonResponse({'status': 'success', 'tasks': list(tasks)})

def task_details(request):
    active_user = json.loads(request.session.get('active_user', '{}'))
    if not active_user:
        return render(request, 'index.html')  # Redirect unauthorized users
    return render(request, 'task-details.html')

@require_GET
def get_task_details(request):
    active_user = json.loads(request.session.get('active_user', '{}'))
    if not active_user:
        return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
    task_id = request.GET.get('taskId')
    try:
        task = Task.objects.filter(id=task_id).values(
            'id', 'title', 'priority', 'due_date', 'description',
            'creator__username', 'assignee__username', 'completed'
        ).first()
        if not task:
            return JsonResponse({'status': 'error', 'message': 'Task not found.'})
        if active_user['role'] == 'Admin' and task['creator__username'] != active_user['username']:
            return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
        if active_user['role'] == 'Teacher' and task['assignee__username'] != active_user['username']:
            return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
        return JsonResponse({'status': 'success', 'task': task})
    except Exception as e:
        print(f"Task details failed: {str(e)}")
        return JsonResponse({'status': 'error', 'message': str(e)})

def mark_complete(request, task_id):
    if request.method == 'POST':
        active_user = json.loads(request.session.get('active_user', '{}'))
        if not active_user or active_user.get('role') != 'Teacher':
            return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
        try:
            task = Task.objects.get(id=task_id, assignee__username=active_user['username'])
            task.completed = True
            task.save()
            print(f"Task marked complete: {task.title}")
            return JsonResponse({'status': 'success', 'message': 'Task marked as complete!'})
        except Task.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Task not found.'})
        except Exception as e:
            print(f"Mark complete failed: {str(e)}")
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'})

def delete_task(request, task_id):
    if request.method == 'DELETE':
        active_user = json.loads(request.session.get('active_user', '{}'))
        if not active_user or active_user.get('role') != 'Admin':
            return JsonResponse({'status': 'error', 'message': 'Unauthorized'}, status=403)
        try:
            task = Task.objects.get(id=task_id, creator__username=active_user['username'])
            task.delete()
            print(f"Task deleted: {task.title}")
            return JsonResponse({'status': 'success', 'message': 'Task deleted successfully!'})
        except Task.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Task not found.'})
    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'})

def edit_task(request):
    active_user = json.loads(request.session.get('active_user', '{}'))
    if not active_user or active_user.get('role') != 'Admin':
        return render(request, 'index.html')

    if request.method == 'GET':
        task_id = request.GET.get('taskId')
        if not task_id:
            return render(request, 'edit-task.html', {'error': 'No task ID provided.'})
        try:
            task = Task.objects.filter(id=task_id, creator__username=active_user['username']).values(
                'id', 'title', 'priority', 'due_date', 'description', 'assignee__username'
            ).first()
            if not task:
                return render(request, 'edit-task.html', {'error': 'Task not found.'})
            return render(request, 'edit-task.html', {'task': task})
        except Exception as e:
            print(f"Edit task failed: {str(e)}")
            return render(request, 'edit-task.html', {'error': str(e)})

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            task_id = data.get('taskId')
            if not task_id:
                return JsonResponse({'status': 'error', 'message': 'No task ID provided.'})
            task = Task.objects.get(id=task_id, creator__username=active_user['username'])
            task.title = data.get('taskTitle', task.title)
            task.description = data.get('description', task.description)
            task.priority = data.get('priority', task.priority).capitalize()
            due_date = data.get('dueDate')
            if due_date:
                task.due_date = timezone.datetime.strptime(due_date, '%Y-%m-%d')
            assignee_username = data.get('teacherName', task.assignee__username)
            task.assignee = User.objects.get(username=assignee_username, role='Teacher')
            task.save()
            print(f"Task updated: {task.title}")
            return JsonResponse({'status': 'success', 'message': 'Task updated successfully!'})
        except Task.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Task not found.'})
        except User.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Teacher not found.'})
        except ValueError as e:
            return JsonResponse({'status': 'error', 'message': f'Invalid date format: {str(e)}'})
        except Exception as e:
            print(f"Task update failed: {str(e)}")
            return JsonResponse({'status': 'error', 'message': str(e)})