#!/usr/bin/env python3
"""
Debug velocity parsing
"""

import re

test_recommendations = [
    "  🔴 LIMITE DN32→DN150: 1.5m/s ⚠️ ACCEPTABLE (réduction -94%, coût +1476%)",
    "  🟢 OPTIMAL DN32→DN200: 0.9m/s ✅ CONFORME (réduction -96%, coût +2570%)",
    "  🟡 RECOMMANDÉ DN32→DN100: 3.2m/s ⚠️ ACCEPTABLE (réduction -86%, coût +627%)",
    "  🟢 OPTIMAL DN32→DN125: 2.2m/s ✅ CONFORME (réduction -91%, coût +986%)"
]

print("Testing velocity parsing:")
for rec in test_recommendations:
    velocity_matches = re.findall(r'(\d+\.?\d*)\s*m/s', rec)
    print(f"Recommendation: {rec}")
    print(f"Velocities found: {velocity_matches}")
    for velocity_str in velocity_matches:
        velocity_val = float(velocity_str)
        print(f"  Velocity: {velocity_val} m/s, >4.0: {velocity_val > 4.0}")
    print()