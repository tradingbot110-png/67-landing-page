import re

with open('c:/Users/info/Desktop/67/landing_page/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Make dashboard visible
html = html.replace('id="grid-dashboard" class="dashboard-mockup" style="display: none;"', 
                   'id="grid-dashboard" class="dashboard-mockup" style="display: block;"')

# Hide the paywall box
html = html.replace('id="paywall-box" class="maintenance-box"', 
                   'id="paywall-box" class="maintenance-box" style="display: none;"')

# Add blur filter to the main section
html = html.replace('<section id="mining" class="mining-section">', 
                    '<section id="mining" class="mining-section" style="filter: blur(6px) brightness(0.4); pointer-events: none;">')

overlay = """
<div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; pointer-events: none;">
    <h1 class="glitch" data-text="THE GRID V2" style="font-family: 'Orbitron', sans-serif; font-size: 6rem; text-shadow: 0 0 30px #00ff88; color: #fff; margin: 0; font-weight: bold; letter-spacing: 2px;">THE GRID V2</h1>
    <h3 style="font-family: 'Inter', sans-serif; color: #00ff88; font-size: 1.8rem; letter-spacing: 8px; margin-top: 10px; text-shadow: 0 0 15px rgba(0,255,136,0.5); text-transform: uppercase;">Upgrades in Progress</h3>
</div>
"""

html = html.replace('</body>', overlay + '\n</body>')

with open('c:/Users/info/Desktop/67/landing_page/teaser.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("teaser.html generated successfully!")
