from django.contrib import admin
from django.urls import path
from django.shortcuts import render
from myapp.views import (
    index, login, forgot_psw, signup, admin_dashboard, teacher_dashboard, logout,
    add_task, get_teachers, created_tasks, get_created_tasks, assigned_tasks, completed_tasks,
    get_assigned_tasks, get_completed_tasks, task_details, get_task_details, mark_complete, delete_task, edit_task
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', index, name='index'),
    path('login/', login, name='login'),
    path('forgot-psw/', forgot_psw, name='forgot_psw'),
    path('signup/', signup, name='signup'),
    path('admin.html', admin_dashboard, name='admin_dashboard'),
    path('teacher.html', teacher_dashboard, name='teacher_dashboard'),
    path('logout/', logout, name='logout'),
    path('add-task/', add_task, name='add_task'),
    path('get-teachers/', get_teachers, name='get_teachers'),
    path('created-tasks/', created_tasks, name='created_tasks'),
    path('get-created-tasks/', get_created_tasks, name='get_created_tasks'),
    path('assigned-task/', assigned_tasks, name='assigned_tasks'),
    path('get-assigned-tasks/', get_assigned_tasks, name='get_assigned_tasks'),
    path('completed-task/', completed_tasks, name='completed_tasks'),
    path('get-completed-tasks/', get_completed_tasks, name='get_completed_tasks'),
    path('task-details/', task_details, name='task_details'),
    path('get-task-details/', get_task_details, name='get_task_details'),
    path('mark-complete/<int:task_id>/', mark_complete, name='mark_complete'),
    path('edit-task/', edit_task, name='edit_task'),
    path('profileAdmin/', lambda request: render(request, 'profileAdmin.html'), name='profileAdmin'),
    path('assignment/', lambda request: render(request, 'assignment.html'), name='assignment'),
    path('profileTeacher/', lambda request: render(request, 'profileTeacher.html'), name='profileTeacher'),
    path('delete-task/<int:task_id>/', delete_task, name='delete_task'),
]