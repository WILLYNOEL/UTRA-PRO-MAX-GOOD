#!/usr/bin/env python3
"""
Debug Critical Material Analysis - Investigate failing cases
"""

import requests
import json

# Backend URL from environment
BACKEND_URL = "https://5615d989-fec4-4cb7-9787-0e64198971f7.preview.emergentagent.com/api"

def debug_bleach_cast_iron():
    """Debug BLEACH + CAST_IRON case to see what recommendations are generated"""
    print("🔍 DEBUGGING BLEACH + CAST_IRON CASE...")
    
    test_data = {
        "flow_rate": 30.0,
        "fluid_type": "bleach",
        "temperature": 20.0,
        "suction_pipe_diameter": 100.0,
        "discharge_pipe_diameter": 80.0,
        "suction_height": 2.0,
        "discharge_height": 10.0,
        "suction_length": 15.0,
        "discharge_length": 50.0,
        "total_length": 65.0,
        "suction_material": "cast_iron",
        "discharge_material": "cast_iron",
        "useful_pressure": 0.0,
        "suction_elbow_90": 2,
        "discharge_elbow_90": 3,
        "discharge_gate_valve": 1,
        "pump_efficiency": 75.0,
        "motor_efficiency": 88.0,
        "voltage": 400,
        "power_factor": 0.8,
        "starting_method": "star_delta",
        "cable_length": 30.0,
        "cable_material": "copper",
        "npsh_required": 3.0,
        "installation_type": "surface",
        "pump_type": "centrifugal",
        "operating_hours": 2000.0,
        "electricity_cost": 0.12,
        "altitude": 0.0,
        "ambient_temperature": 25.0,
        "humidity": 60.0
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/expert-analysis", json=test_data, timeout=15)
        if response.status_code == 200:
            result = response.json()
            
            expert_recommendations = result.get("expert_recommendations", [])
            print(f"Found {len(expert_recommendations)} recommendations:")
            
            for i, rec in enumerate(expert_recommendations):
                print(f"\nRecommendation {i+1}:")
                print(f"  Type: {rec.get('type', 'N/A')}")
                print(f"  Priority: {rec.get('priority', 'N/A')}")
                print(f"  Title: {rec.get('title', 'N/A')}")
                print(f"  Description: {rec.get('description', 'N/A')}")
                print(f"  Solutions: {rec.get('solutions', [])}")
                
                # Check for keywords
                rec_desc = rec.get("description", "").lower()
                rec_title = rec.get("title", "").lower()
                rec_solutions = str(rec.get("solutions", [])).lower()
                
                chlorine_found = any(keyword in rec_desc or keyword in rec_title or keyword in rec_solutions 
                                   for keyword in ["chlore", "corrosion", "incompatible", "interdit", "danger"])
                incompatibility_found = any(keyword in rec_desc or keyword in rec_title 
                                          for keyword in ["incompatibilité", "incompatible", "interdit"])
                material_replacement_found = any(keyword in rec_desc or keyword in rec_title or keyword in rec_solutions
                                               for keyword in ["pvc", "cpvc", "ptfe", "remplacement", "remplacer"])
                
                print(f"  Chlorine warnings: {chlorine_found}")
                print(f"  Incompatibility: {incompatibility_found}")
                print(f"  Material replacement: {material_replacement_found}")
        else:
            print(f"Error: HTTP {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Error: {str(e)}")

def debug_water_pehd():
    """Debug WATER + PEHD case to see what recommendations are generated"""
    print("\n🔍 DEBUGGING WATER + PEHD CASE...")
    
    test_data = {
        "flow_rate": 45.0,
        "fluid_type": "water",
        "temperature": 25.0,
        "suction_pipe_diameter": 100.0,
        "discharge_pipe_diameter": 80.0,
        "suction_height": 3.0,
        "discharge_height": 15.0,
        "suction_length": 20.0,
        "discharge_length": 60.0,
        "total_length": 80.0,
        "suction_material": "pehd",
        "discharge_material": "pehd",
        "useful_pressure": 1.5,
        "suction_elbow_90": 2,
        "discharge_elbow_90": 4,
        "discharge_gate_valve": 2,
        "pump_efficiency": 78.0,
        "motor_efficiency": 92.0,
        "voltage": 400,
        "power_factor": 0.85,
        "starting_method": "star_delta",
        "cable_length": 50.0,
        "cable_material": "copper",
        "npsh_required": 3.2,
        "installation_type": "surface",
        "pump_type": "centrifugal",
        "operating_hours": 4000.0,
        "electricity_cost": 0.12,
        "altitude": 0.0,
        "ambient_temperature": 25.0,
        "humidity": 60.0
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/expert-analysis", json=test_data, timeout=15)
        if response.status_code == 200:
            result = response.json()
            
            expert_recommendations = result.get("expert_recommendations", [])
            print(f"Found {len(expert_recommendations)} recommendations:")
            
            for i, rec in enumerate(expert_recommendations):
                print(f"\nRecommendation {i+1}:")
                print(f"  Type: {rec.get('type', 'N/A')}")
                print(f"  Priority: {rec.get('priority', 'N/A')}")
                print(f"  Title: {rec.get('title', 'N/A')}")
                print(f"  Description: {rec.get('description', 'N/A')}")
                print(f"  Solutions: {rec.get('solutions', [])}")
                
                # Check for keywords
                rec_desc = rec.get("description", "").lower()
                rec_title = rec.get("title", "").lower()
                rec_solutions = str(rec.get("solutions", [])).lower()
                rec_type = rec.get("type", "").lower()
                
                hydraulic_found = any(keyword in rec_desc or keyword in rec_title or keyword in rec_solutions 
                                    for keyword in ["hydraulique", "débit", "vitesse", "perte", "charge"])
                efficiency_found = any(keyword in rec_desc or keyword in rec_title or keyword in rec_solutions
                                     for keyword in ["rendement", "efficacité", "performance", "optimisation"])
                material_found = any(keyword in rec_desc or keyword in rec_title or keyword in rec_solutions
                                   for keyword in ["matériau", "pehd", "polyéthylène", "compatibilité"])
                general_found = rec_type in ["hydraulic", "efficiency", "electrical", "critical"]
                
                print(f"  Hydraulic: {hydraulic_found}")
                print(f"  Efficiency: {efficiency_found}")
                print(f"  Material: {material_found}")
                print(f"  General type: {general_found}")
        else:
            print(f"Error: HTTP {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    debug_bleach_cast_iron()
    debug_water_pehd()