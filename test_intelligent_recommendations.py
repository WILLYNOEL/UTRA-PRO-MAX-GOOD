#!/usr/bin/env python3
"""
Test Intelligent Recommendations Integration across all tabs (HMT, Performance, Expert)
"""

import requests
import json
import sys

# Backend URL from environment
BACKEND_URL = "https://19f490cc-936b-4813-a142-210cb79d9a88.preview.emergentagent.com/api"

def test_intelligent_recommendations_integration():
    """Test intelligent recommendations integration across all tabs (HMT, Performance, Expert)"""
    print("🧠 Testing Intelligent Recommendations Integration...")
    print("=" * 80)
    
    results = []
    
    # Test Case 1: Chemical Compatibility Issue (acid + cast_iron)
    print("\n🧪 Test Case 1: Chemical Compatibility Issue (acid + cast_iron)")
    
    # HMT Tab Test - Chemical Compatibility
    print("Testing HMT Tab - Chemical Compatibility...")
    hmt_chemical_data = {
        "installation_type": "surface",
        "suction_type": "flooded",
        "hasp": 2.0,
        "discharge_height": 15.0,
        "useful_pressure": 0.0,
        "suction_pipe_diameter": 100.0,
        "discharge_pipe_diameter": 80.0,
        "suction_pipe_length": 30.0,
        "discharge_pipe_length": 50.0,
        "suction_pipe_material": "cast_iron",  # Incompatible with acid
        "discharge_pipe_material": "cast_iron",  # Incompatible with acid
        "suction_fittings": [],
        "discharge_fittings": [],
        "fluid_type": "acid",  # Incompatible with cast_iron
        "temperature": 20.0,
        "flow_rate": 50.0
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/calculate-hmt", json=hmt_chemical_data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            recommendations = result.get("recommendations", [])
            
            # Check for chemical compatibility warnings
            compatibility_found = any("INCOMPATIBILITÉ" in rec.upper() or "CORROSIF" in rec.upper() or "MATÉRIAU" in rec.upper() for rec in recommendations)
            if compatibility_found:
                print("✅ HMT Chemical Compatibility: PASSED")
                print(f"   Found {len([r for r in recommendations if 'INCOMPATIBILITÉ' in r.upper() or 'CORROSIF' in r.upper()])} compatibility warnings")
                results.append(("HMT Chemical Compatibility", True))
            else:
                print("❌ HMT Chemical Compatibility: FAILED")
                print("   Missing chemical compatibility warnings for acid + cast_iron")
                results.append(("HMT Chemical Compatibility", False))
        else:
            print(f"❌ HMT Chemical Compatibility: FAILED - Status: {response.status_code}")
            results.append(("HMT Chemical Compatibility", False))
    except Exception as e:
        print(f"❌ HMT Chemical Compatibility: FAILED - Error: {str(e)}")
        results.append(("HMT Chemical Compatibility", False))
    
    # Performance Tab Test - Chemical Compatibility
    print("\nTesting Performance Tab - Chemical Compatibility...")
    perf_chemical_data = {
        "flow_rate": 50.0,
        "hmt": 25.0,
        "pipe_diameter": 100.0,
        "fluid_type": "acid",
        "pipe_material": "cast_iron",  # Incompatible
        "pump_efficiency": 75.0,
        "motor_efficiency": 90.0,
        "starting_method": "star_delta",
        "power_factor": 0.8,
        "cable_length": 50.0,
        "voltage": 400
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/calculate-performance", json=perf_chemical_data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            recommendations = result.get("recommendations", [])
            
            # Check for chemical compatibility in performance recommendations
            compatibility_found = any("MATÉRIAU" in rec.upper() or "CORROSIF" in rec.upper() or "INCOMPATIBLE" in rec.upper() for rec in recommendations)
            if compatibility_found:
                print("✅ Performance Chemical Compatibility: PASSED")
                results.append(("Performance Chemical Compatibility", True))
            else:
                print("❌ Performance Chemical Compatibility: FAILED")
                print("   Missing chemical compatibility in performance recommendations")
                results.append(("Performance Chemical Compatibility", False))
        else:
            print(f"❌ Performance Chemical Compatibility: FAILED - Status: {response.status_code}")
            results.append(("Performance Chemical Compatibility", False))
    except Exception as e:
        print(f"❌ Performance Chemical Compatibility: FAILED - Error: {str(e)}")
        results.append(("Performance Chemical Compatibility", False))
    
    # Expert Tab Test - Advanced Chemical Compatibility
    print("\nTesting Expert Tab - Advanced Chemical Compatibility...")
    expert_chemical_data = {
        "flow_rate": 50.0,
        "fluid_type": "acid",
        "temperature": 20.0,
        "suction_type": "flooded",
        "suction_pipe_diameter": 100.0,
        "discharge_pipe_diameter": 80.0,
        "suction_height": 2.0,
        "discharge_height": 15.0,
        "suction_length": 30.0,
        "discharge_length": 50.0,
        "total_length": 80.0,
        "useful_pressure": 0.0,
        "suction_material": "cast_iron",  # Incompatible - correct field name
        "discharge_material": "cast_iron",  # Incompatible - correct field name
        "pump_efficiency": 75.0,
        "motor_efficiency": 90.0,
        "voltage": 400,
        "power_factor": 0.8,
        "starting_method": "star_delta",
        "cable_length": 50.0,
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
        response = requests.post(f"{BACKEND_URL}/expert-analysis", json=expert_chemical_data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            expert_recommendations = result.get("expert_recommendations", [])
            
            # Check for advanced chemical compatibility in expert recommendations
            chemical_recs = [rec for rec in expert_recommendations if 
                           any(keyword in str(rec).upper() for keyword in ["CHEMICAL", "COMPATIBILITY", "MATÉRIAU", "CORROSIF", "INCOMPATIBLE"])]
            
            if chemical_recs:
                print("✅ Expert Chemical Compatibility: PASSED")
                print(f"   Found {len(chemical_recs)} advanced chemical compatibility recommendations")
                results.append(("Expert Chemical Compatibility", True))
            else:
                print("❌ Expert Chemical Compatibility: FAILED")
                print("   Missing advanced chemical compatibility in expert recommendations")
                results.append(("Expert Chemical Compatibility", False))
        else:
            print(f"❌ Expert Chemical Compatibility: FAILED - Status: {response.status_code}")
            results.append(("Expert Chemical Compatibility", False))
    except Exception as e:
        print(f"❌ Expert Chemical Compatibility: FAILED - Error: {str(e)}")
        results.append(("Expert Chemical Compatibility", False))
    
    # Test Case 2: High Velocity Scenario (graduated diameter recommendations)
    print("\n⚡ Test Case 2: High Velocity Scenario (graduated diameter recommendations)")
    
    # HMT Tab Test - Graduated Diameter
    print("Testing HMT Tab - Graduated Diameter...")
    hmt_velocity_data = {
        "installation_type": "surface",
        "suction_type": "flooded",
        "hasp": 2.0,
        "discharge_height": 15.0,
        "useful_pressure": 0.0,
        "suction_pipe_diameter": 42.4,  # DN32 - small diameter
        "discharge_pipe_diameter": 42.4,  # DN32 - small diameter
        "suction_pipe_length": 30.0,
        "discharge_pipe_length": 50.0,
        "suction_pipe_material": "pvc",
        "discharge_pipe_material": "pvc",
        "suction_fittings": [],
        "discharge_fittings": [],
        "fluid_type": "water",
        "temperature": 20.0,
        "flow_rate": 120.0  # High flow rate to trigger high velocity
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/calculate-hmt", json=hmt_velocity_data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            recommendations = result.get("recommendations", [])
            
            # Check for graduated diameter recommendations
            diameter_recs = [rec for rec in recommendations if 
                           any(keyword in rec.upper() for keyword in ["DN32", "DN40", "DN50", "DIAMÈTRE", "VITESSE"])]
            
            print(f"   Debug: Found {len(diameter_recs)} diameter recommendations")
            for i, rec in enumerate(diameter_recs[:3]):  # Show first 3
                print(f"   Debug rec {i+1}: {rec[:100]}...")
            
            if diameter_recs:
                # Check for velocity limits compliance (no >4 m/s recommendations)
                # Look for actual velocity values in the recommendations like "3.2m/s" or "1.5m/s"
                # But exclude warning messages about current excessive velocities
                import re
                excessive_velocity = False
                max_velocity_found = 0.0
                for rec in diameter_recs:
                    # Skip warning messages about current excessive velocities
                    if "VITESSE EXCESSIVE" in rec.upper() or "VITESSE CIBLE" in rec.upper():
                        continue
                    
                    # Extract velocity values from actual recommendations like "DN32→DN100: 3.2m/s"
                    velocity_matches = re.findall(r'DN\d+→DN\d+:\s*(\d+\.?\d*)\s*m/s', rec)
                    for velocity_str in velocity_matches:
                        velocity_val = float(velocity_str)
                        max_velocity_found = max(max_velocity_found, velocity_val)
                        if velocity_val > 4.0:
                            excessive_velocity = True
                            break
                    if excessive_velocity:
                        break
                
                print(f"   Debug: Max recommended velocity found: {max_velocity_found} m/s")
                print(f"   Debug: Excessive velocity in recommendations: {excessive_velocity}")
                
                if not excessive_velocity:
                    print("✅ HMT Graduated Diameter: PASSED")
                    print(f"   Found {len(diameter_recs)} graduated diameter recommendations with proper velocity limits")
                    results.append(("HMT Graduated Diameter", True))
                else:
                    print("❌ HMT Velocity Limits: FAILED")
                    print("   Found recommendations with excessive velocity >4 m/s")
                    results.append(("HMT Graduated Diameter", False))
            else:
                print("❌ HMT Graduated Diameter: FAILED")
                print("   Missing graduated diameter recommendations for high velocity")
                results.append(("HMT Graduated Diameter", False))
        else:
            print(f"❌ HMT Graduated Diameter: FAILED - Status: {response.status_code}")
            results.append(("HMT Graduated Diameter", False))
    except Exception as e:
        print(f"❌ HMT Graduated Diameter: FAILED - Error: {str(e)}")
        results.append(("HMT Graduated Diameter", False))
    
    # Performance Tab Test - Graduated Diameter
    print("\nTesting Performance Tab - Graduated Diameter...")
    perf_velocity_data = {
        "flow_rate": 120.0,  # High flow rate
        "hmt": 25.0,
        "pipe_diameter": 42.4,  # DN32 - small diameter
        "fluid_type": "water",
        "pipe_material": "pvc",
        "pump_efficiency": 75.0,
        "motor_efficiency": 90.0,
        "starting_method": "star_delta",
        "power_factor": 0.8,
        "cable_length": 50.0,
        "voltage": 400
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/calculate-performance", json=perf_velocity_data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            recommendations = result.get("recommendations", [])
            
            # Check for graduated diameter recommendations in performance
            diameter_recs = [rec for rec in recommendations if 
                           any(keyword in rec.upper() for keyword in ["DN32", "DN40", "DN50", "DIAMÈTRE", "VITESSE", "OPTIMISATION"])]
            
            if diameter_recs:
                print("✅ Performance Graduated Diameter: PASSED")
                print(f"   Found {len(diameter_recs)} performance-specific diameter recommendations")
                results.append(("Performance Graduated Diameter", True))
            else:
                print("❌ Performance Graduated Diameter: FAILED")
                print("   Missing graduated diameter recommendations for performance optimization")
                results.append(("Performance Graduated Diameter", False))
        else:
            print(f"❌ Performance Graduated Diameter: FAILED - Status: {response.status_code}")
            results.append(("Performance Graduated Diameter", False))
    except Exception as e:
        print(f"❌ Performance Graduated Diameter: FAILED - Error: {str(e)}")
        results.append(("Performance Graduated Diameter", False))
    
    # Test Case 3: Energy Optimization (low efficiencies)
    print("\n⚡ Test Case 3: Energy Optimization (low efficiencies)")
    
    # Performance Tab Test - Energy Optimization
    print("Testing Performance Tab - Energy Optimization...")
    perf_energy_data = {
        "flow_rate": 50.0,
        "hmt": 25.0,
        "pipe_diameter": 100.0,
        "fluid_type": "water",
        "pipe_material": "pvc",
        "pump_efficiency": 65.0,  # Low efficiency
        "motor_efficiency": 85.0,  # Low efficiency
        "starting_method": "star_delta",
        "power_factor": 0.8,
        "cable_length": 50.0,
        "voltage": 400
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/calculate-performance", json=perf_energy_data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            recommendations = result.get("recommendations", [])
            
            # Check for energy optimization recommendations
            energy_recs = [rec for rec in recommendations if 
                          any(keyword in rec.upper() for keyword in ["EFFICACITÉ", "RENDEMENT", "ÉNERGIE", "OPTIMIZATION", "EFFICIENCY"])]
            
            if energy_recs:
                print("✅ Performance Energy Optimization: PASSED")
                print(f"   Found {len(energy_recs)} energy optimization recommendations")
                results.append(("Performance Energy Optimization", True))
            else:
                print("❌ Performance Energy Optimization: FAILED")
                print("   Missing energy optimization recommendations for low efficiencies")
                results.append(("Performance Energy Optimization", False))
        else:
            print(f"❌ Performance Energy Optimization: FAILED - Status: {response.status_code}")
            results.append(("Performance Energy Optimization", False))
    except Exception as e:
        print(f"❌ Performance Energy Optimization: FAILED - Error: {str(e)}")
        results.append(("Performance Energy Optimization", False))
    
    # Expert Tab Test - Advanced Energy Optimization with ROI
    print("\nTesting Expert Tab - Advanced Energy Optimization with ROI...")
    expert_energy_data = {
        "flow_rate": 50.0,
        "fluid_type": "water",
        "temperature": 20.0,
        "suction_type": "flooded",
        "suction_pipe_diameter": 100.0,
        "discharge_pipe_diameter": 80.0,
        "suction_height": 2.0,
        "discharge_height": 15.0,
        "suction_length": 30.0,
        "discharge_length": 50.0,
        "total_length": 80.0,
        "useful_pressure": 0.0,
        "suction_material": "pvc",  # Correct field name
        "discharge_material": "pvc",  # Correct field name
        "pump_efficiency": 65.0,  # Low efficiency
        "motor_efficiency": 85.0,  # Low efficiency
        "voltage": 400,
        "power_factor": 0.8,
        "starting_method": "star_delta",
        "cable_length": 50.0,
        "cable_material": "copper",
        "npsh_required": 3.0,
        "installation_type": "surface",
        "pump_type": "centrifugal",
        "operating_hours": 2000.0,  # For ROI calculations
        "electricity_cost": 0.12,  # For cost analysis
        "altitude": 0.0,
        "ambient_temperature": 25.0,
        "humidity": 60.0
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/expert-analysis", json=expert_energy_data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            expert_recommendations = result.get("expert_recommendations", [])
            optimization_potential = result.get("optimization_potential", {})
            
            # Check for advanced energy optimization with ROI analysis
            energy_recs = [rec for rec in expert_recommendations if 
                          any(keyword in str(rec).upper() for keyword in ["ENERGY", "EFFICIENCY", "ROI", "COST", "SAVINGS", "OPTIMIZATION"])]
            
            roi_analysis = any(keyword in str(optimization_potential).upper() for keyword in ["ENERGY_SAVINGS", "ROI", "COST"])
            
            if energy_recs or roi_analysis:
                print("✅ Expert Energy Optimization: PASSED")
                print(f"   Found {len(energy_recs)} energy recommendations with ROI analysis")
                results.append(("Expert Energy Optimization", True))
            else:
                print("❌ Expert Energy Optimization: FAILED")
                print("   Missing advanced energy optimization with ROI analysis")
                results.append(("Expert Energy Optimization", False))
        else:
            print(f"❌ Expert Energy Optimization: FAILED - Status: {response.status_code}")
            results.append(("Expert Energy Optimization", False))
    except Exception as e:
        print(f"❌ Expert Energy Optimization: FAILED - Error: {str(e)}")
        results.append(("Expert Energy Optimization", False))
    
    # Overall assessment
    print("\n" + "=" * 80)
    print("INTELLIGENT RECOMMENDATIONS INTEGRATION TEST SUMMARY")
    print("=" * 80)
    
    passed_tests = sum(1 for _, passed in results if passed)
    total_tests = len(results)
    success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {total_tests - passed_tests}")
    print(f"Success Rate: {success_rate:.1f}%")
    
    print("\nDetailed Results:")
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"  {status}: {test_name}")
    
    if passed_tests == total_tests:
        print("\n🎉 SUCCESS: All tabs (HMT, Performance, Expert) successfully integrate intelligent recommendations!")
        print("   ✅ Chemical compatibility analysis working")
        print("   ✅ Graduated diameter recommendations working")
        print("   ✅ Energy optimization recommendations working")
        return True
    else:
        failed_areas = []
        chemical_tests = ["HMT Chemical Compatibility", "Performance Chemical Compatibility", "Expert Chemical Compatibility"]
        diameter_tests = ["HMT Graduated Diameter", "Performance Graduated Diameter"]
        energy_tests = ["Performance Energy Optimization", "Expert Energy Optimization"]
        
        if not all(passed for test_name, passed in results if test_name in chemical_tests):
            failed_areas.append("Chemical Compatibility")
        if not all(passed for test_name, passed in results if test_name in diameter_tests):
            failed_areas.append("Graduated Diameter")
        if not all(passed for test_name, passed in results if test_name in energy_tests):
            failed_areas.append("Energy Optimization")
        
        print(f"\n❌ FAILED: Issues found in: {', '.join(failed_areas)}")
        return False

if __name__ == "__main__":
    success = test_intelligent_recommendations_integration()
    sys.exit(0 if success else 1)