#!/usr/bin/env python3
"""
Focused Testing for Final Corrected Hydraulic Pump Calculation Backend
Tests the specific areas mentioned in the review request
"""

import requests
import json
import math

BACKEND_URL = "https://d2a85c37-7dc9-4de9-be07-f7f7728dd963.preview.emergentagent.com/api"

def test_npshd_formula_corrections():
    """Test NPSHd formula corrections for flooded vs suction_lift"""
    print("🔬 Testing NPSHd Formula Corrections...")
    
    # Same input data but different suction types
    base_data = {
        "hasp": 3.0,  # 3m height
        "flow_rate": 50.0,
        "fluid_type": "water",
        "temperature": 20.0,
        "pipe_diameter": 100.0,
        "pipe_material": "pvc",
        "pipe_length": 50.0,
        "suction_fittings": [
            {"fitting_type": "elbow_90", "quantity": 2}
        ]
    }
    
    # Test flooded suction
    flooded_data = {**base_data, "suction_type": "flooded"}
    flooded_response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=flooded_data)
    
    # Test suction lift
    suction_lift_data = {**base_data, "suction_type": "suction_lift"}
    suction_lift_response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=suction_lift_data)
    
    if flooded_response.status_code == 200 and suction_lift_response.status_code == 200:
        flooded_result = flooded_response.json()
        suction_lift_result = suction_lift_response.json()
        
        flooded_npshd = flooded_result["npshd"]
        suction_lift_npshd = suction_lift_result["npshd"]
        
        print(f"✅ Flooded NPSHd: {flooded_npshd:.2f} m")
        print(f"✅ Suction Lift NPSHd: {suction_lift_npshd:.2f} m")
        print(f"✅ Difference: {flooded_npshd - suction_lift_npshd:.2f} m")
        
        # Verify formulas produce different results
        if abs(flooded_npshd - suction_lift_npshd) > 1.0:
            print("✅ PASS: Formulas produce different results for different suction types")
            
            # Verify flooded suction gives higher NPSHd (as expected)
            if flooded_npshd > suction_lift_npshd:
                print("✅ PASS: Flooded suction gives higher NPSHd than suction lift")
                return True
            else:
                print("❌ FAIL: Flooded suction should give higher NPSHd")
                return False
        else:
            print("❌ FAIL: Formulas should produce different results")
            return False
    else:
        print(f"❌ FAIL: API errors - Flooded: {flooded_response.status_code}, Suction: {suction_lift_response.status_code}")
        return False

def test_enhanced_alert_system():
    """Test enhanced alert system for materials, velocity, head loss, fittings"""
    print("\n🚨 Testing Enhanced Alert System...")
    
    alerts_found = []
    
    # Test material alerts (PVC > 60°C)
    pvc_high_temp_data = {
        "suction_type": "flooded",
        "hasp": 2.0,
        "flow_rate": 30.0,
        "fluid_type": "water",
        "temperature": 70.0,  # High temperature
        "pipe_diameter": 80.0,
        "pipe_material": "pvc",  # PVC at high temp
        "pipe_length": 30.0,
        "suction_fittings": []
    }
    
    response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=pvc_high_temp_data)
    if response.status_code == 200:
        result = response.json()
        warnings = result.get("warnings", [])
        pvc_warning = any("PVC non recommandé" in w for w in warnings)
        if pvc_warning:
            alerts_found.append("Material Alert (PVC > 60°C)")
            print("✅ PASS: Material alert for PVC > 60°C")
        else:
            print("❌ FAIL: Missing material alert for PVC > 60°C")
    
    # Test velocity alerts (high velocity)
    high_velocity_data = {
        "suction_type": "flooded",
        "hasp": 2.0,
        "flow_rate": 200.0,  # Very high flow
        "fluid_type": "water",
        "temperature": 20.0,
        "pipe_diameter": 50.0,  # Small diameter = high velocity
        "pipe_material": "pvc",
        "pipe_length": 30.0,
        "suction_fittings": []
    }
    
    response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=high_velocity_data)
    if response.status_code == 200:
        result = response.json()
        warnings = result.get("warnings", [])
        velocity_warning = any("Vitesse" in w and "diamètre" in w for w in warnings)
        if velocity_warning:
            alerts_found.append("Velocity Alert (recommend diameter increase)")
            print("✅ PASS: Velocity alert recommending diameter increase")
        else:
            print("❌ FAIL: Missing velocity alert")
    
    # Test head loss alerts (excessive length)
    long_pipe_data = {
        "suction_type": "suction_lift",
        "hasp": 4.0,
        "flow_rate": 50.0,
        "fluid_type": "water",
        "temperature": 20.0,
        "pipe_diameter": 80.0,
        "pipe_material": "pvc",
        "pipe_length": 150.0,  # Very long pipe
        "suction_fittings": []
    }
    
    response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=long_pipe_data)
    if response.status_code == 200:
        result = response.json()
        warnings = result.get("warnings", [])
        length_warning = any("Longueur" in w and "excessive" in w for w in warnings)
        if length_warning:
            alerts_found.append("Head Loss Alert (excessive length)")
            print("✅ PASS: Head loss alert for excessive pipe length")
        else:
            print("❌ FAIL: Missing head loss alert for excessive length")
    
    # Test fitting alerts (check valve recommendation)
    no_check_valve_data = {
        "suction_type": "suction_lift",  # Suction lift without check valve
        "hasp": 3.0,
        "flow_rate": 40.0,
        "fluid_type": "water",
        "temperature": 20.0,
        "pipe_diameter": 100.0,
        "pipe_material": "pvc",
        "pipe_length": 40.0,
        "suction_fittings": [
            {"fitting_type": "elbow_90", "quantity": 2}
            # No check valve
        ]
    }
    
    response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=no_check_valve_data)
    if response.status_code == 200:
        result = response.json()
        warnings = result.get("warnings", [])
        check_valve_warning = any("clapet anti-retour" in w for w in warnings)
        if check_valve_warning:
            alerts_found.append("Fitting Alert (check valve recommendation)")
            print("✅ PASS: Check valve recommendation for suction lift")
        else:
            print("❌ FAIL: Missing check valve recommendation")
    
    # Test excessive fittings alert
    many_fittings_data = {
        "suction_type": "flooded",
        "hasp": 2.0,
        "flow_rate": 40.0,
        "fluid_type": "water",
        "temperature": 20.0,
        "pipe_diameter": 100.0,
        "pipe_material": "pvc",
        "pipe_length": 40.0,
        "suction_fittings": [
            {"fitting_type": "elbow_90", "quantity": 3},
            {"fitting_type": "tee_through", "quantity": 2},
            {"fitting_type": "gate_valve_open", "quantity": 2}
            # Total: 7 fittings (> 5)
        ]
    }
    
    response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=many_fittings_data)
    if response.status_code == 200:
        result = response.json()
        warnings = result.get("warnings", [])
        fittings_warning = any("excessif" in w and "raccords" in w for w in warnings)
        if fittings_warning:
            alerts_found.append("Fitting Alert (excessive fittings)")
            print("✅ PASS: Excessive fittings alert")
        else:
            print("❌ FAIL: Missing excessive fittings alert")
    
    print(f"\n📊 Alert System Summary: {len(alerts_found)}/5 alerts working")
    return len(alerts_found) >= 4  # At least 4 out of 5 alerts should work

def test_enhanced_performance_curves():
    """Test enhanced performance curves with flow, hmt, efficiency, power, head_loss"""
    print("\n📈 Testing Enhanced Performance Curves...")
    
    test_data = {
        "flow_rate": 75.0,
        "hmt": 30.0,
        "pipe_diameter": 125.0,
        "required_npsh": 3.5,
        "calculated_npshd": 8.5,
        "fluid_type": "water",
        "pipe_material": "pvc",
        "pump_efficiency": 80.0,
        "motor_efficiency": 92.0,
        "starting_method": "star_delta",
        "power_factor": 0.8,
        "cable_length": 60.0,
        "voltage": 400
    }
    
    response = requests.post(f"{BACKEND_URL}/calculate-performance", json=test_data)
    if response.status_code == 200:
        result = response.json()
        performance_curves = result.get("performance_curves", {})
        
        expected_curves = ["flow", "hmt", "efficiency", "power", "head_loss"]
        found_curves = []
        
        for curve in expected_curves:
            if curve in performance_curves:
                curve_data = performance_curves[curve]
                if isinstance(curve_data, list) and len(curve_data) > 10:
                    found_curves.append(curve)
                    print(f"✅ PASS: {curve} curve with {len(curve_data)} points")
                else:
                    print(f"❌ FAIL: {curve} curve invalid or too few points")
            else:
                print(f"❌ FAIL: Missing {curve} curve")
        
        # Test best operating point
        if "best_operating_point" in performance_curves:
            bop = performance_curves["best_operating_point"]
            if isinstance(bop, list) and len(bop) == 4:
                print(f"✅ PASS: Best operating point: Flow={bop[0]:.1f}, HMT={bop[1]:.1f}, Eff={bop[2]:.1f}%, Power={bop[3]:.3f}kW")
                found_curves.append("best_operating_point")
            else:
                print("❌ FAIL: Best operating point invalid format")
        else:
            print("❌ FAIL: Missing best operating point")
        
        print(f"\n📊 Performance Curves Summary: {len(found_curves)}/6 curves working")
        return len(found_curves) >= 5  # At least 5 out of 6 should work
    else:
        print(f"❌ FAIL: API error {response.status_code}")
        return False

def test_power_formula_validation():
    """Test power formula validation: P2 = (débit × HMT) / (rendement pompe × 367) and P1 = P2 / rendement moteur"""
    print("\n⚡ Testing Power Formula Validation...")
    
    test_cases = [
        {
            "name": "Standard Case",
            "flow_rate": 50.0,  # m³/h
            "hmt": 25.0,  # m
            "pump_efficiency": 75.0,  # %
            "motor_efficiency": 90.0,  # %
        },
        {
            "name": "High Efficiency Case",
            "flow_rate": 100.0,
            "hmt": 40.0,
            "pump_efficiency": 85.0,
            "motor_efficiency": 95.0,
        }
    ]
    
    all_passed = True
    
    for case in test_cases:
        test_data = {
            "flow_rate": case["flow_rate"],
            "hmt": case["hmt"],
            "pipe_diameter": 100.0,
            "required_npsh": 3.0,
            "calculated_npshd": 8.0,
            "fluid_type": "water",
            "pipe_material": "pvc",
            "pump_efficiency": case["pump_efficiency"],
            "motor_efficiency": case["motor_efficiency"],
            "starting_method": "star_delta",
            "power_factor": 0.8,
            "cable_length": 50.0,
            "voltage": 400
        }
        
        response = requests.post(f"{BACKEND_URL}/calculate-performance", json=test_data)
        if response.status_code == 200:
            result = response.json()
            power_calcs = result.get("power_calculations", {})
            
            hydraulic_power = power_calcs.get("hydraulic_power", 0)
            absorbed_power = power_calcs.get("absorbed_power", 0)
            
            # Calculate expected values using the formulas
            expected_p2 = (case["flow_rate"] * case["hmt"]) / (case["pump_efficiency"] * 367)
            expected_p1 = expected_p2 / (case["motor_efficiency"] / 100)
            
            # Validate P2 formula
            p2_error = abs(hydraulic_power - expected_p2)
            if p2_error < 0.01:
                print(f"✅ PASS: {case['name']} P2 formula - Expected: {expected_p2:.3f} kW, Got: {hydraulic_power:.3f} kW")
            else:
                print(f"❌ FAIL: {case['name']} P2 formula - Expected: {expected_p2:.3f} kW, Got: {hydraulic_power:.3f} kW (Error: {p2_error:.3f})")
                all_passed = False
            
            # Validate P1 formula
            p1_error = abs(absorbed_power - expected_p1)
            if p1_error < 0.01:
                print(f"✅ PASS: {case['name']} P1 formula - Expected: {expected_p1:.3f} kW, Got: {absorbed_power:.3f} kW")
            else:
                print(f"❌ FAIL: {case['name']} P1 formula - Expected: {expected_p1:.3f} kW, Got: {absorbed_power:.3f} kW (Error: {p1_error:.3f})")
                all_passed = False
            
            # Validate relationship P1 > P2
            if absorbed_power > hydraulic_power:
                print(f"✅ PASS: {case['name']} Power relationship - P1 ({absorbed_power:.3f}) > P2 ({hydraulic_power:.3f})")
            else:
                print(f"❌ FAIL: {case['name']} Power relationship - P1 should be > P2")
                all_passed = False
        else:
            print(f"❌ FAIL: {case['name']} API error {response.status_code}")
            all_passed = False
    
    return all_passed

def main():
    """Run focused tests for the review request areas"""
    print("=" * 80)
    print("FOCUSED TESTING - FINAL CORRECTED HYDRAULIC PUMP CALCULATION BACKEND")
    print("=" * 80)
    
    results = []
    
    # Test the four key areas from the review request
    results.append(("NPSHd Formula Corrections", test_npshd_formula_corrections()))
    results.append(("Enhanced Alert System", test_enhanced_alert_system()))
    results.append(("Enhanced Performance Curves", test_enhanced_performance_curves()))
    results.append(("Power Formula Validation", test_power_formula_validation()))
    
    # Summary
    print("\n" + "=" * 80)
    print("FOCUSED TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    success_rate = (passed / total) * 100
    print(f"\nSuccess Rate: {success_rate:.1f}% ({passed}/{total})")
    
    if success_rate == 100:
        print("\n🎉 EXCELLENT: All key areas are working perfectly!")
    elif success_rate >= 75:
        print("\n✅ GOOD: Most key areas are working well")
    else:
        print("\n⚠️  NEEDS ATTENTION: Some key areas have issues")
    
    return success_rate >= 75

if __name__ == "__main__":
    main()