from django.db import models

class User(models.Model):
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)  # Store hashed passwords in production
    role = models.CharField(max_length=50, choices=[('Admin', 'Admin'), ('Teacher', 'Teacher')])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username
    

class Task(models.Model):
    PRIORITY_CHOICES = [
        ('High', 'High'),
        ('Medium', 'Medium'),
        ('Low', 'Low'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    completed = models.BooleanField(default=False)
    due_date = models.DateTimeField()
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    assignee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks')

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['due_date']