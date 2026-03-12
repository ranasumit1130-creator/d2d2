# DWWIAT — Strike Planning Demo

Standalone Django project with formation suggestion + impact analysis.

## Setup (one-time)

```bash
pip install django
```

## Run

```bash
cd dwwiat_demo
python manage.py runserver
```

Open **http://127.0.0.1:8000/** — it will auto-redirect to the strike analysis page.

## What you'll see

1. **Formation Cards** — 3 options (Precision Strike, Saturation Assault, Shadow Recon Strike)
   - Each shows drone composition, TNT yield, CEP, ETA, effectiveness bar, risk level
   - Click any card to see the full impact analysis

2. **Impact Report** — per-drone breakdown table, blast radius SVG, overpressure curve, damage zones, verdict stamp

3. **Confirm bar** — sticky footer with effectiveness % and confirm button

## Sample Data

The demo uses baked-in sample data (see `config/views.py`):
- **Base:** FOB Kilo (Delhi, 28.61°N 77.21°E)
- **Target:** Fuel Depot Bravo (Chandigarh, 30.73°N 76.78°E) — HARD target, CTR CAP 2
- **Drones:** Shahed-136 ×8, Bayraktar TB2 ×4, MQ-9 Reaper ×2, Hermes 450 ×3, Harop ×6, RQ-11 Raven ×5, Krakow EW-3 ×2

## File Structure

```
dwwiat_demo/
├── manage.py
├── dwwiat/                          # Django project settings
│   ├── settings.py
│   └── urls.py
└── config/                          # Main app
    ├── views.py                     # Views + sample data
    ├── urls.py                      # URL routes
    ├── templates/config/
    │   ├── base.html                # DWWIAT nav bar + styling
    │   └── strike_analysis.html     # The main page
    └── static/js/
        ├── physics.js               # Pure math (Sadovsky, Gurney, etc.)
        ├── formationEngine.js       # Mappers + formation builder + impact calc
        ├── strikeUI.js              # Vanilla JS UI renderer
        ├── simulationDataBuilder.js # Cesium flight path data compiler
        └── simState.js              # sessionStorage state manager
```

## Integration into your real project

Copy the 5 JS files into your `static/js/` folder. The `strike_analysis.html` template shows exactly how to wire them up with Django context data. Replace the sample data in `views.py` with your real DB queries.
