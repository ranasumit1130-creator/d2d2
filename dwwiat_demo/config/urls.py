from django.urls import path
from . import views

app_name = 'config'

urlpatterns = [
    path('', views.home, name='home'),
    path('mission/<int:mission_id>/force/<str:force_type>/strike-analysis/',
         views.strike_analysis, name='strike_analysis'),
    path('mission/<int:mission_id>/force/<str:force_type>/step3/',
         views.step3_stub, name='step3'),
    path('mission/<int:mission_id>/force/<str:force_type>/step4/',
         views.step4_stub, name='step4'),
    path('mission/<int:mission_id>/simulation/',
         views.simulation_cesium_stub, name='simulation_cesium'),
    path('api/strike-planning/save/',
         views.api_strike_planning_save, name='api_strike_planning_save'),
    path('api/strike-record/save/',
         views.api_save_strike_record, name='api_save_strike_record'),
]
