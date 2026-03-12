from django.urls import path, include
urlpatterns = [
    path('', include('config.urls', namespace='config')),
]
