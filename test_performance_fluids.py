#!/usr/bin/env python3
"""
Additional tests for /api/calculate-performance endpoint with different fluid types
"""

import requests
import json
import sys

# Backend URL from environment
BACKEND_URL = "https://4968e4ba-1ad0-4e33-8cd8-4035e032c31e.preview.emergentagent.com/api"

def test_performance_endpoint_different_fluids():
    """Test /api/calculate-performance endpoint with different fluid types"""
    print("🧪 Testing /api/calculate-performance Endpoint with Different Fluid Types...")
    print("=" * 80)
    
    # Test data with different fluids
    test_cases = [
        {
            "name": "Water (Standard)",
            "data": {
                "flow_rate": 50.0,
                "hmt": 25.0,
                "pipe_diameter": 114.3,
                "fluid_type": "water",
                "pipe_material": "pvc",
                "pump_efficiency": 75.0,
                "motor_efficiency": 90.0,
                "voltage": 400,
                "power_factor": 0.8,
                "starting_method": "star_delta",
                "cable_length": 50.0,
                "cable_material": "copper"
            }
        },
        {
            "name": "Acid Solution",
            "data": {
                "flow_rate": 40.0,
                "hmt": 30.0,
                "pipe_diameter": 100.0,
                "fluid_type": "acid",
                "pipe_material": "pvc",
                "pump_efficiency": 70.0,
                "motor_efficiency": 88.0,
                "voltage": 400,
                "power_factor": 0.8,
                "starting_method": "star_delta",
                "cable_length": 40.0,
                "cable_material": "copper"
            }
        },
        {
            "name": "Seawater",
            "data": {
                "flow_rate": 60.0,
                "hmt": 35.0,
                "pipe_diameter": 125.0,
                "fluid_type": "seawater",
                "pipe_material": "steel",
                "pump_efficiency": 78.0,
                "motor_efficiency": 91.0,
                "voltage": 400,
                "power_factor": 0.82,
                "starting_method": "star_delta",
                "cable_length": 60.0,
                "cable_material": "copper"
            }
        },
        {
            "name": "Milk (Food Grade)",
            "data": {
                "flow_rate": 25.0,
                "hmt": 20.0,
                "pipe_diameter": 80.0,
                "fluid_type": "milk",
                "pipe_material": "steel",
                "pump_efficiency": 72.0,
                "motor_efficiency": 87.0,
                "voltage": 400,
                "power_factor": 0.8,
                "starting_method": "star_delta",
                "cable_length": 30.0,
                "cable_material": "copper"
            }
        },
        {
            "name": "Gasoline (Volatile)",
            "data": {
                "flow_rate": 35.0,
                "hmt": 28.0,
                "pipe_diameter": 90.0,
                "fluid_type": "gasoline",
                "pipe_material": "steel",
                "pump_efficiency": 74.0,
                "motor_efficiency": 89.0,
                "voltage": 400,
                "power_factor": 0.8,
                "starting_method": "star_delta",
                "cable_length": 45.0,
                "cable_material": "copper"
            }
        }
    ]
    
    results = []
    all_passed = True
    
    for case in test_cases:
        print(f"\n📋 Testing: {case['name']}")
        print(f"   Fluid: {case['data']['fluid_type']}")
        print(f"   Flow: {case['data']['flow_rate']} m³/h, HMT: {case['data']['hmt']} m")
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate-performance", json=case["data"], timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                
                # Check basic structure
                required_sections = ["input_data", "power_calculations", "performance_curves", "velocity", "reynolds_number", "overall_efficiency"]
                missing_sections = [s for s in required_sections if s not in result]
                
                if missing_sections:
                    print(f"   ❌ FAIL: Missing sections: {missing_sections}")
                    all_passed = False
                    results.append(f"❌ {case['name']}: Missing sections")
                    continue
                
                # Get key values
                power_calculations = result.get("power_calculations", {})
                hydraulic_power = power_calculations.get("hydraulic_power", 0)
                absorbed_power = power_calculations.get("absorbed_power", 0)
                overall_efficiency = result.get("overall_efficiency", 0)
                velocity = result.get("velocity", 0)
                reynolds_number = result.get("reynolds_number", 0)
                nominal_current = result.get("nominal_current", 0)
                
                # Validate calculations
                errors = []
                
                if hydraulic_power <= 0:
                    errors.append(f"Invalid hydraulic power: {hydraulic_power}")
                
                if absorbed_power <= hydraulic_power:
                    errors.append(f"Power logic error: P1({absorbed_power}) <= P2({hydraulic_power})")
                
                if overall_efficiency <= 0 or overall_efficiency > 100:
                    errors.append(f"Invalid efficiency: {overall_efficiency}%")
                
                if velocity <= 0:
                    errors.append(f"Invalid velocity: {velocity}")
                
                if reynolds_number <= 0:
                    errors.append(f"Invalid Reynolds: {reynolds_number}")
                
                if nominal_current <= 0:
                    errors.append(f"Invalid current: {nominal_current}")
                
                # Check performance curves
                performance_curves = result.get("performance_curves", {})
                if "flow" not in performance_curves or "hmt" not in performance_curves:
                    errors.append("Missing performance curve data")
                
                if errors:
                    print(f"   ❌ FAIL: {'; '.join(errors)}")
                    all_passed = False
                    results.append(f"❌ {case['name']}: {errors[0]}")
                else:
                    print(f"   ✅ PASS: P2: {hydraulic_power:.2f} kW, P1: {absorbed_power:.2f} kW")
                    print(f"           Eff: {overall_efficiency:.1f}%, I: {nominal_current:.1f}A, V: {velocity:.2f} m/s, Re: {reynolds_number:.0f}")
                    results.append(f"✅ {case['name']}: All calculations valid")
                
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
    print("DIFFERENT FLUIDS TEST SUMMARY")
    print("=" * 80)
    
    for result in results:
        print(result)
    
    print(f"\nTotal Tests: {len(test_cases)}")
    passed_tests = sum(1 for r in results if r.startswith("✅"))
    print(f"Passed: {passed_tests}")
    print(f"Failed: {len(test_cases) - passed_tests}")
    print(f"Success Rate: {(passed_tests/len(test_cases)*100):.1f}%")
    
    if all_passed:
        print("\n🎉 ALL DIFFERENT FLUIDS TESTS PASSED!")
        return True
    else:
        print("\n❌ SOME DIFFERENT FLUIDS TESTS FAILED!")
        return False

if __name__ == "__main__":
    success = test_performance_endpoint_different_fluids()
    sys.exit(0 if success else 1)