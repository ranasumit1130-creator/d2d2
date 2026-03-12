import json
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt

# ============================================================
# SAMPLE DATA — simulates what the DB would return
# ============================================================

SAMPLE_MISSION = {
    'id': 1,
    'name': 'OPERATION IRON VEIL',
    'status': 'ACTIVE',
}

SAMPLE_BASES = [
    {
        'id': 1,
        'name': 'FOB Kilo',
        'lat': 28.6139,
        'lon': 77.2090,
    },
]

SAMPLE_TARGETS = [
    {
        'id': 1,
        'name': 'Fuel Depot Bravo',
        'lat': 30.7333,
        'lon': 76.7794,
        'details': {
            'type': 'hard',
            'ctr_cap_scale': '2',
            'width': 60,
            'length': 80,
            'height': 12,
            'disposition': 'static',
            'size': '60m x 80m',
        },
    },
]

SAMPLE_DRONES = [
    {
        'id': 1,
        'name': 'Shahed-136',
        'category': 'kamikaze',
        'weight_kg': 200,
        'cruise_speed_kmh': 185,
        'max_speed_kmh': 220,
        'max_range_km': 2500,
        'service_ceiling_m': 4000,
        'endurance_hours': 10,
        'payload_capacity_kg': 50,
        'warhead_weight_kg': 40,
        'guidance_system': 'gps',
        'stealth_rating': 3,
        'anti_jam_resistance_pct': 20,
        'ai_enabled': False,
        'base_success_rate_pct': 65,
        'evasion_probability_pct': 30,
        'radar_cross_section': 0.5,
        'unit_cost_usd': 20000,
        'launch_cost_usd': 5000,
        'count': 8,
    },
    {
        'id': 2,
        'name': 'Bayraktar TB2',
        'category': 'attack',
        'weight_kg': 650,
        'cruise_speed_kmh': 130,
        'max_speed_kmh': 220,
        'max_range_km': 150,
        'service_ceiling_m': 8200,
        'endurance_hours': 27,
        'payload_capacity_kg': 150,
        'warhead_weight_kg': 70,
        'guidance_system': 'ai',
        'stealth_rating': 5,
        'anti_jam_resistance_pct': 55,
        'ai_enabled': True,
        'base_success_rate_pct': 82,
        'evasion_probability_pct': 50,
        'radar_cross_section': 0.3,
        'unit_cost_usd': 5000000,
        'launch_cost_usd': 50000,
        'count': 4,
    },
    {
        'id': 3,
        'name': 'MQ-9 Reaper',
        'category': 'attack',
        'weight_kg': 4760,
        'cruise_speed_kmh': 313,
        'max_speed_kmh': 482,
        'max_range_km': 1850,
        'service_ceiling_m': 15240,
        'endurance_hours': 27,
        'payload_capacity_kg': 1700,
        'warhead_weight_kg': 500,
        'guidance_system': 'ai',
        'stealth_rating': 4,
        'anti_jam_resistance_pct': 75,
        'ai_enabled': True,
        'base_success_rate_pct': 92,
        'evasion_probability_pct': 40,
        'radar_cross_section': 1.1,
        'unit_cost_usd': 32000000,
        'launch_cost_usd': 200000,
        'count': 2,
    },
    {
        'id': 4,
        'name': 'Hermes 450',
        'category': 'surveillance',
        'weight_kg': 450,
        'cruise_speed_kmh': 176,
        'max_speed_kmh': 176,
        'max_range_km': 300,
        'service_ceiling_m': 5500,
        'endurance_hours': 17,
        'payload_capacity_kg': 150,
        'warhead_weight_kg': 0,
        'guidance_system': 'gps',
        'stealth_rating': 6,
        'anti_jam_resistance_pct': 40,
        'ai_enabled': False,
        'base_success_rate_pct': 88,
        'evasion_probability_pct': 55,
        'radar_cross_section': 0.2,
        'unit_cost_usd': 2000000,
        'launch_cost_usd': 15000,
        'count': 3,
    },
    {
        'id': 5,
        'name': 'Harop',
        'category': 'kamikaze',
        'weight_kg': 135,
        'cruise_speed_kmh': 185,
        'max_speed_kmh': 400,
        'max_range_km': 1000,
        'service_ceiling_m': 4600,
        'endurance_hours': 6,
        'payload_capacity_kg': 23,
        'warhead_weight_kg': 23,
        'guidance_system': 'ir',
        'stealth_rating': 7,
        'anti_jam_resistance_pct': 60,
        'ai_enabled': True,
        'base_success_rate_pct': 78,
        'evasion_probability_pct': 65,
        'radar_cross_section': 0.05,
        'unit_cost_usd': 100000,
        'launch_cost_usd': 10000,
        'count': 6,
    },
    {
        'id': 6,
        'name': 'RQ-11 Raven',
        'category': 'surveillance',
        'weight_kg': 1.9,
        'cruise_speed_kmh': 50,
        'max_speed_kmh': 95,
        'max_range_km': 10,
        'service_ceiling_m': 4500,
        'endurance_hours': 1.5,
        'payload_capacity_kg': 0.2,
        'warhead_weight_kg': 0,
        'guidance_system': 'gps',
        'stealth_rating': 9,
        'anti_jam_resistance_pct': 10,
        'ai_enabled': False,
        'base_success_rate_pct': 95,
        'evasion_probability_pct': 80,
        'radar_cross_section': 0.01,
        'unit_cost_usd': 35000,
        'launch_cost_usd': 500,
        'count': 5,
    },
    {
        'id': 7,
        'name': 'Krakow EW-3',
        'category': 'ew',
        'weight_kg': 320,
        'cruise_speed_kmh': 160,
        'max_speed_kmh': 200,
        'max_range_km': 250,
        'service_ceiling_m': 6000,
        'endurance_hours': 8,
        'payload_capacity_kg': 40,
        'warhead_weight_kg': 0,
        'guidance_system': 'ai',
        'stealth_rating': 7,
        'anti_jam_resistance_pct': 90,
        'ai_enabled': True,
        'base_success_rate_pct': 90,
        'evasion_probability_pct': 70,
        'radar_cross_section': 0.15,
        'unit_cost_usd': 3000000,
        'launch_cost_usd': 30000,
        'count': 2,
    },
]


# ============================================================
# VIEWS
# ============================================================

def home(request):
    return redirect('config:strike_analysis', mission_id=1, force_type='blue')


def strike_analysis(request, mission_id, force_type):
    mission = {**SAMPLE_MISSION, 'id': mission_id}

    context = {
        'mission':       mission,
        'mission_id':    mission_id,
        'force_type':    force_type,
        'bases_json':    json.dumps(SAMPLE_BASES),
        'targets_json':  json.dumps(SAMPLE_TARGETS),
        'drones_json':   json.dumps(SAMPLE_DRONES),
        'ads_count':     2,
        'csrf_token':    'demo-csrf-token',
    }
    return render(request, 'config/strike_analysis.html', context)


def step3_stub(request, mission_id, force_type):
    return HttpResponse(
        f'<h2 style="color:#8fa94e;background:#1a1c16;padding:40px;font-family:monospace">'
        f'← Step 3 stub (mission {mission_id}, {force_type}). '
        f'<a href="/" style="color:#a4c639">Go back to Strike Analysis</a></h2>'
    )


def step4_stub(request, mission_id, force_type):
    return HttpResponse(
        f'<h2 style="color:#8fa94e;background:#1a1c16;padding:40px;font-family:monospace">'
        f'✓ You arrived at Step 4 — ADS Config (mission {mission_id}, {force_type}). '
        f'Formation saved successfully! '
        f'<a href="/" style="color:#a4c639">Go back to Strike Analysis</a></h2>'
    )


def simulation_cesium_stub(request, mission_id):
    return HttpResponse(
        f'<h2 style="color:#8fa94e;background:#1a1c16;padding:40px;font-family:monospace">'
        f'Cesium Simulation stub (mission {mission_id}). '
        f'<a href="/" style="color:#a4c639">Go back</a></h2>'
    )


@csrf_exempt
def api_strike_planning_save(request):
    if request.method == 'POST':
        return JsonResponse({
            'success': True,
            'next_url': None,  # template fallback to NEXT_URL
            'message': 'Strike plan saved.',
        })
    return JsonResponse({'error': 'POST required'}, status=405)


@csrf_exempt
def api_save_strike_record(request):
    if request.method == 'POST':
        return JsonResponse({
            'status': 'SUCCESS',
            'record_id': 42,
        })
    return JsonResponse({'error': 'POST required'}, status=405)
