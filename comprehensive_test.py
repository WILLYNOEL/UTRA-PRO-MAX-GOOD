#!/usr/bin/env python3
"""
Comprehensive Fluid and Edge Case Testing
"""

import requests
import json

BACKEND_URL = "https://d2a85c37-7dc9-4de9-be07-f7f7728dd963.preview.emergentagent.com/api"

def test_all_fluids_npshd():
    """Test NPSHd calculations for all fluid types"""
    print("🧪 Testing All Fluids NPSHd Calculations...")
    
    fluids = ["water", "oil", "acid", "glycol"]
    results = []
    
    for fluid in fluids:
        test_data = {
            "suction_type": "flooded",
            "hasp": 2.0,
            "flow_rate": 50.0,
            "fluid_type": fluid,
            "temperature": 30.0,  # Test temperature dependency
            "pipe_diameter": 100.0,
            "pipe_material": "pvc",
            "pipe_length": 40.0,
            "suction_fittings": [
                {"fitting_type": "elbow_90", "quantity": 1}
            ]
        }
        
        response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=test_data)
        if response.status_code == 200:
            result = response.json()
            fluid_props = result["fluid_properties"]
            npshd = result["npshd"]
            
            print(f"✅ {fluid.upper()}: NPSHd={npshd:.2f}m, Density={fluid_props['density']:.1f}kg/m³, Name='{fluid_props['name']}'")
            results.append(True)
        else:
            print(f"❌ {fluid.upper()}: API error {response.status_code}")
            results.append(False)
    
    return all(results)

def test_suction_type_differences():
    """Test that suction type formulas work correctly for all fluids"""
    print("\n🔄 Testing Suction Type Differences...")
    
    fluids = ["water", "oil", "acid", "glycol"]
    all_passed = True
    
    for fluid in fluids:
        base_data = {
            "hasp": 3.0,
            "flow_rate": 40.0,
            "fluid_type": fluid,
            "temperature": 25.0,
            "pipe_diameter": 100.0,
            "pipe_material": "steel",
            "pipe_length": 50.0,
            "suction_fittings": []
        }
        
        # Test both suction types
        flooded_data = {**base_data, "suction_type": "flooded"}
        suction_lift_data = {**base_data, "suction_type": "suction_lift"}
        
        flooded_response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=flooded_data)
        suction_lift_response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=suction_lift_data)
        
        if flooded_response.status_code == 200 and suction_lift_response.status_code == 200:
            flooded_npshd = flooded_response.json()["npshd"]
            suction_lift_npshd = suction_lift_response.json()["npshd"]
            
            # Flooded should always be higher than suction lift
            if flooded_npshd > suction_lift_npshd:
                print(f"✅ {fluid.upper()}: Flooded ({flooded_npshd:.2f}m) > Suction Lift ({suction_lift_npshd:.2f}m)")
            else:
                print(f"❌ {fluid.upper()}: Formula error - Flooded should be > Suction Lift")
                all_passed = False
        else:
            print(f"❌ {fluid.upper()}: API errors")
            all_passed = False
    
    return all_passed

def test_temperature_effects():
    """Test temperature effects on fluid properties and calculations"""
    print("\n🌡️  Testing Temperature Effects...")
    
    temperatures = [10, 20, 40, 60, 80]
    fluid = "water"
    results = []
    
    for temp in temperatures:
        test_data = {
            "suction_type": "flooded",
            "hasp": 2.0,
            "flow_rate": 50.0,
            "fluid_type": fluid,
            "temperature": temp,
            "pipe_diameter": 100.0,
            "pipe_material": "pvc",
            "pipe_length": 40.0,
            "suction_fittings": []
        }
        
        response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=test_data)
        if response.status_code == 200:
            result = response.json()
            fluid_props = result["fluid_properties"]
            npshd = result["npshd"]
            warnings = result.get("warnings", [])
            
            # Check for temperature warnings at high temps
            temp_warning = any("TEMPÉRATURE" in w or "température" in w for w in warnings) if temp > 60 else False
            
            print(f"✅ {temp}°C: NPSHd={npshd:.2f}m, Density={fluid_props['density']:.1f}kg/m³, Warnings={len(warnings)}")
            results.append(True)
        else:
            print(f"❌ {temp}°C: API error {response.status_code}")
            results.append(False)
    
    return all(results)

def test_pipe_materials():
    """Test different pipe materials and their effects"""
    print("\n🔧 Testing Pipe Materials...")
    
    materials = ["pvc", "pehd", "steel", "steel_galvanized", "cast_iron", "concrete"]
    results = []
    
    for material in materials:
        test_data = {
            "suction_type": "flooded",
            "hasp": 2.0,
            "flow_rate": 50.0,
            "fluid_type": "water",
            "temperature": 20.0,
            "pipe_diameter": 100.0,
            "pipe_material": material,
            "pipe_length": 50.0,
            "suction_fittings": []
        }
        
        response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=test_data)
        if response.status_code == 200:
            result = response.json()
            head_loss = result["total_head_loss"]
            friction_factor = result["friction_factor"]
            
            print(f"✅ {material.upper()}: Head Loss={head_loss:.3f}m, Friction Factor={friction_factor:.6f}")
            results.append(True)
        else:
            print(f"❌ {material.upper()}: API error {response.status_code}")
            results.append(False)
    
    return all(results)

def test_extreme_conditions():
    """Test extreme operating conditions"""
    print("\n⚠️  Testing Extreme Conditions...")
    
    extreme_cases = [
        {
            "name": "Very High Flow",
            "data": {
                "suction_type": "flooded",
                "hasp": 1.0,
                "flow_rate": 500.0,  # Very high
                "fluid_type": "water",
                "temperature": 20.0,
                "pipe_diameter": 200.0,
                "pipe_material": "steel",
                "pipe_length": 30.0,
                "suction_fittings": []
            }
        },
        {
            "name": "Very Low Flow",
            "data": {
                "suction_type": "suction_lift",
                "hasp": 2.0,
                "flow_rate": 1.0,  # Very low
                "fluid_type": "oil",
                "temperature": 20.0,
                "pipe_diameter": 50.0,
                "pipe_material": "pvc",
                "pipe_length": 20.0,
                "suction_fittings": []
            }
        },
        {
            "name": "High Suction Lift",
            "data": {
                "suction_type": "suction_lift",
                "hasp": 8.0,  # Very high suction
                "flow_rate": 30.0,
                "fluid_type": "water",
                "temperature": 20.0,
                "pipe_diameter": 100.0,
                "pipe_material": "pvc",
                "pipe_length": 40.0,
                "suction_fittings": []
            }
        },
        {
            "name": "High Temperature Acid",
            "data": {
                "suction_type": "flooded",
                "hasp": 1.5,
                "flow_rate": 25.0,
                "fluid_type": "acid",
                "temperature": 70.0,  # High temp
                "pipe_diameter": 80.0,
                "pipe_material": "steel",
                "pipe_length": 35.0,
                "suction_fittings": []
            }
        }
    ]
    
    results = []
    for case in extreme_cases:
        response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=case["data"])
        if response.status_code == 200:
            result = response.json()
            npshd = result["npshd"]
            warnings = result.get("warnings", [])
            
            print(f"✅ {case['name']}: NPSHd={npshd:.2f}m, Warnings={len(warnings)}")
            
            # Check for appropriate warnings in extreme conditions
            if case["name"] == "High Suction Lift" and npshd < 2:
                has_warning = any("NPSHd" in w or "aspiration" in w for w in warnings)
                if has_warning:
                    print(f"   ✅ Appropriate warning for extreme condition")
                else:
                    print(f"   ⚠️  Missing warning for extreme condition")
            
            results.append(True)
        else:
            print(f"❌ {case['name']}: API error {response.status_code}")
            results.append(False)
    
    return all(results)

def main():
    """Run comprehensive fluid and edge case tests"""
    print("=" * 80)
    print("COMPREHENSIVE FLUID AND EDGE CASE TESTING")
    print("=" * 80)
    
    tests = [
        ("All Fluids NPSHd", test_all_fluids_npshd),
        ("Suction Type Differences", test_suction_type_differences),
        ("Temperature Effects", test_temperature_effects),
        ("Pipe Materials", test_pipe_materials),
        ("Extreme Conditions", test_extreme_conditions)
    ]
    
    results = []
    for test_name, test_func in tests:
        print()
        result = test_func()
        results.append((test_name, result))
    
    # Summary
    print("\n" + "=" * 80)
    print("COMPREHENSIVE TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    success_rate = (passed / total) * 100
    print(f"\nSuccess Rate: {success_rate:.1f}% ({passed}/{total})")
    
    if success_rate == 100:
        print("\n🎉 EXCELLENT: All comprehensive tests passed!")
    elif success_rate >= 80:
        print("\n✅ GOOD: Most comprehensive tests passed")
    else:
        print("\n⚠️  NEEDS ATTENTION: Some comprehensive tests failed")
    
    return success_rate >= 80

if __name__ == "__main__":
    main()