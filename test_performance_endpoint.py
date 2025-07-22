#!/usr/bin/env python3
"""
Focused test for /api/calculate-performance endpoint with corrected parameters
"""

import requests
import json
import sys

# Backend URL from environment
BACKEND_URL = "https://5615d989-fec4-4cb7-9787-0e64198971f7.preview.emergentagent.com/api"

def test_performance_endpoint_corrected_parameters():
    """Test /api/calculate-performance endpoint with corrected parameters from PERFORMANCE tab"""
    print("🎯 Testing /api/calculate-performance Endpoint with Corrected Parameters...")
    print("=" * 80)
    
    # Test data from review request
    test_cases = [
        {
            "name": "Standard Test Case (Review Request)",
            "data": {
                "flow_rate": 50.0,  # m³/h
                "hmt": 25.0,  # m  
                "pipe_diameter": 114.3,  # mm (DN100)
                "fluid_type": "water",
                "pipe_material": "pvc",
                "pump_efficiency": 75.0,  # %
                "motor_efficiency": 90.0,  # %
                "voltage": 400,  # V
                "power_factor": 0.8,
                "starting_method": "star_delta",
                "cable_length": 50.0,  # m
                "cable_material": "copper"
            }
        },
        {
            "name": "Oil Fluid Test",
            "data": {
                "flow_rate": 30.0,
                "hmt": 35.0,
                "pipe_diameter": 100.0,
                "fluid_type": "oil",
                "pipe_material": "steel",
                "pump_efficiency": 70.0,
                "motor_efficiency": 85.0,
                "voltage": 230,
                "power_factor": 0.75,
                "starting_method": "direct_on_line",
                "cable_length": 75.0,
                "cable_material": "aluminum"
            }
        },
        {
            "name": "High Performance Test",
            "data": {
                "flow_rate": 100.0,
                "hmt": 40.0,
                "pipe_diameter": 150.0,
                "fluid_type": "glycol",
                "pipe_material": "pehd",
                "pump_efficiency": 85.0,
                "motor_efficiency": 95.0,
                "voltage": 400,
                "power_factor": 0.85,
                "starting_method": "star_delta",
                "cable_length": 100.0,
                "cable_material": "copper"
            }
        },
        {
            "name": "Industrial Fluid Test",
            "data": {
                "flow_rate": 75.0,
                "hmt": 30.0,
                "pipe_diameter": 125.0,
                "fluid_type": "diesel",
                "pipe_material": "steel",
                "pump_efficiency": 80.0,
                "motor_efficiency": 92.0,
                "voltage": 400,
                "power_factor": 0.8,
                "starting_method": "star_delta",
                "cable_length": 60.0,
                "cable_material": "copper"
            }
        }
    ]
    
    results = []
    all_passed = True
    
    for case in test_cases:
        print(f"\n📋 Testing: {case['name']}")
        print(f"   Data: {case['data']}")
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate-performance", json=case["data"], timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                
                # 1. Check all new fields are accepted
                input_data = result.get("input_data", {})
                required_fields = [
                    "pump_efficiency", "motor_efficiency", "voltage", "power_factor", 
                    "starting_method", "cable_length", "cable_material"
                ]
                
                missing_fields = []
                for field in required_fields:
                    if field not in input_data:
                        missing_fields.append(field)
                
                if missing_fields:
                    print(f"   ❌ FAIL: Missing fields in input_data: {missing_fields}")
                    all_passed = False
                    results.append(f"❌ {case['name']}: Missing fields {missing_fields}")
                    continue
                
                # 2. Check hydraulic and electrical calculations
                power_calculations = result.get("power_calculations", {})
                if not power_calculations:
                    print(f"   ❌ FAIL: Missing power_calculations section")
                    all_passed = False
                    results.append(f"❌ {case['name']}: Missing power_calculations")
                    continue
                
                hydraulic_power = power_calculations.get("hydraulic_power", 0)
                absorbed_power = power_calculations.get("absorbed_power", 0)
                
                if hydraulic_power <= 0:
                    print(f"   ❌ FAIL: Invalid hydraulic power: {hydraulic_power}")
                    all_passed = False
                    results.append(f"❌ {case['name']}: Invalid hydraulic power {hydraulic_power}")
                    continue
                
                if absorbed_power <= hydraulic_power:
                    print(f"   ❌ FAIL: Absorbed power ({absorbed_power}) should be > hydraulic power ({hydraulic_power})")
                    all_passed = False
                    results.append(f"❌ {case['name']}: Power logic error")
                    continue
                
                # 3. Check efficiency calculations
                overall_efficiency = result.get("overall_efficiency", 0)
                pump_eff = case["data"]["pump_efficiency"]
                motor_eff = case["data"]["motor_efficiency"]
                expected_overall = (pump_eff / 100) * (motor_eff / 100) * 100
                
                if abs(overall_efficiency - expected_overall) > 0.5:
                    print(f"   ❌ FAIL: Expected efficiency {expected_overall:.1f}%, got {overall_efficiency:.1f}%")
                    all_passed = False
                    results.append(f"❌ {case['name']}: Efficiency calculation error")
                    continue
                
                # 4. Check electrical calculations
                nominal_current = result.get("nominal_current", 0)
                if nominal_current <= 0:
                    print(f"   ❌ FAIL: Invalid nominal current: {nominal_current}")
                    all_passed = False
                    results.append(f"❌ {case['name']}: Invalid current {nominal_current}")
                    continue
                
                # 5. Check performance curves generation
                performance_curves = result.get("performance_curves", {})
                if not performance_curves:
                    print(f"   ❌ FAIL: Missing performance_curves")
                    all_passed = False
                    results.append(f"❌ {case['name']}: Missing performance curves")
                    continue
                
                # Check for required curve data
                required_curves = ["flow", "hmt"]
                missing_curves = [c for c in required_curves if c not in performance_curves]
                if missing_curves:
                    print(f"   ❌ FAIL: Missing curves: {missing_curves}")
                    all_passed = False
                    results.append(f"❌ {case['name']}: Missing curves {missing_curves}")
                    continue
                
                # 6. Check velocity and Reynolds number
                velocity = result.get("velocity", 0)
                reynolds_number = result.get("reynolds_number", 0)
                
                if velocity <= 0:
                    print(f"   ❌ FAIL: Invalid velocity: {velocity}")
                    all_passed = False
                    results.append(f"❌ {case['name']}: Invalid velocity {velocity}")
                    continue
                
                if reynolds_number <= 0:
                    print(f"   ❌ FAIL: Invalid Reynolds number: {reynolds_number}")
                    all_passed = False
                    results.append(f"❌ {case['name']}: Invalid Reynolds {reynolds_number}")
                    continue
                
                # 7. Check alerts system
                alerts = result.get("alerts", [])
                # Alerts are optional but should be a list if present
                if not isinstance(alerts, list):
                    print(f"   ❌ FAIL: Alerts should be a list")
                    all_passed = False
                    results.append(f"❌ {case['name']}: Invalid alerts type")
                    continue
                
                print(f"   ✅ PASS: P2: {hydraulic_power:.2f} kW, P1: {absorbed_power:.2f} kW, Eff: {overall_efficiency:.1f}%, I: {nominal_current:.1f}A, V: {velocity:.2f} m/s")
                results.append(f"✅ {case['name']}: All checks passed")
                
            else:
                print(f"   ❌ FAIL: HTTP {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}")
                all_passed = False
                results.append(f"❌ {case['name']}: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ FAIL: Error: {str(e)}")
            all_passed = False
            results.append(f"❌ {case['name']}: Exception {str(e)}")
    
    # Summary
    print("\n" + "=" * 80)
    print("PERFORMANCE ENDPOINT TEST SUMMARY")
    print("=" * 80)
    
    for result in results:
        print(result)
    
    print(f"\nTotal Tests: {len(test_cases)}")
    passed_tests = sum(1 for r in results if r.startswith("✅"))
    print(f"Passed: {passed_tests}")
    print(f"Failed: {len(test_cases) - passed_tests}")
    print(f"Success Rate: {(passed_tests/len(test_cases)*100):.1f}%")
    
    if all_passed:
        print("\n🎉 ALL PERFORMANCE ENDPOINT TESTS PASSED!")
        return True
    else:
        print("\n❌ SOME PERFORMANCE ENDPOINT TESTS FAILED!")
        return False

if __name__ == "__main__":
    success = test_performance_endpoint_corrected_parameters()
    sys.exit(0 if success else 1)