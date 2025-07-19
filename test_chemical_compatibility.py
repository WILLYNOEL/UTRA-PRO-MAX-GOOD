#!/usr/bin/env python3
"""
Test Chemical Compatibility Analysis Integration
Focus on testing the analyze_chemical_compatibility function integration in expert analysis
"""

import requests
import json
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://e406f3cc-b728-4eef-af89-3026b698c1a6.preview.emergentagent.com/api"

class ChemicalCompatibilityTester:
    def __init__(self):
        self.test_results = []
        self.failed_tests = []
        
    def log_test(self, test_name, passed, details=""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "details": details
        })
        
        if not passed:
            self.failed_tests.append(test_name)
    
    def test_expert_analysis_chemical_compatibility(self):
        """Test chemical compatibility analysis integration in expert analysis endpoint"""
        print("\n🧪 Testing Chemical Compatibility Analysis Integration...")
        
        test_cases = [
            {
                "name": "Acid Solution with Steel (Incompatible)",
                "data": {
                    "flow_rate": 30.0,
                    "fluid_type": "acid",
                    "temperature": 25.0,
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 80.0,
                    "discharge_pipe_diameter": 80.0,
                    "suction_height": 2.0,
                    "discharge_height": 15.0,
                    "suction_length": 20.0,
                    "discharge_length": 50.0,
                    "total_length": 70.0,
                    "useful_pressure": 1.0,
                    "suction_material": "steel",  # Should be incompatible with acid
                    "discharge_material": "steel",
                    "pump_efficiency": 75.0,
                    "motor_efficiency": 88.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 50.0,
                    "cable_material": "copper",
                    "npsh_required": 3.5,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 8760,
                    "electricity_cost": 0.12,
                    "altitude": 0,
                    "ambient_temperature": 25,
                    "humidity": 60
                },
                "expected_warnings": ["FLUIDE CORROSIF", "INCOMPATIBILITÉ", "Inox 316L"]
            },
            {
                "name": "Seawater with Stainless Steel (Compatible)",
                "data": {
                    "flow_rate": 50.0,
                    "fluid_type": "seawater",
                    "temperature": 20.0,
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 100.0,
                    "discharge_pipe_diameter": 100.0,
                    "suction_height": 1.5,
                    "discharge_height": 20.0,
                    "suction_length": 30.0,
                    "discharge_length": 80.0,
                    "total_length": 110.0,
                    "useful_pressure": 2.0,
                    "suction_material": "stainless_steel_316",  # Should be compatible
                    "discharge_material": "stainless_steel_316",
                    "pump_efficiency": 80.0,
                    "motor_efficiency": 90.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 75.0,
                    "cable_material": "copper",
                    "npsh_required": 4.0,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 8760,
                    "electricity_cost": 0.12,
                    "altitude": 0,
                    "ambient_temperature": 25,
                    "humidity": 60
                },
                "expected_warnings": ["EAU DE MER", "Duplex 2205", "chlorures"]
            },
            {
                "name": "Milk with Food Grade Materials",
                "data": {
                    "flow_rate": 25.0,
                    "fluid_type": "milk",
                    "temperature": 4.0,  # Refrigeration temperature
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 75.0,
                    "discharge_pipe_diameter": 75.0,
                    "suction_height": 1.0,
                    "discharge_height": 10.0,
                    "suction_length": 15.0,
                    "discharge_length": 40.0,
                    "total_length": 55.0,
                    "useful_pressure": 0.5,
                    "suction_material": "stainless_steel_316",  # Food grade
                    "discharge_material": "stainless_steel_316",
                    "pump_efficiency": 78.0,
                    "motor_efficiency": 90.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 40.0,
                    "cable_material": "copper",
                    "npsh_required": 3.0,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 8760,
                    "electricity_cost": 0.12,
                    "altitude": 0,
                    "ambient_temperature": 25,
                    "humidity": 60
                },
                "expected_warnings": ["FLUIDE ALIMENTAIRE", "FDA", "CIP", "HACCP"]
            },
            {
                "name": "Gasoline with PVC (Incompatible)",
                "data": {
                    "flow_rate": 40.0,
                    "fluid_type": "gasoline",
                    "temperature": 20.0,
                    "suction_type": "suction_lift",
                    "suction_pipe_diameter": 90.0,
                    "discharge_pipe_diameter": 90.0,
                    "suction_height": 3.0,
                    "discharge_height": 12.0,
                    "suction_length": 25.0,
                    "discharge_length": 60.0,
                    "total_length": 85.0,
                    "useful_pressure": 1.5,
                    "suction_material": "pvc",  # Should be incompatible with gasoline
                    "discharge_material": "pvc",
                    "pump_efficiency": 75.0,
                    "motor_efficiency": 88.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 60.0,
                    "cable_material": "copper",
                    "npsh_required": 4.5,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 8760,
                    "electricity_cost": 0.12,
                    "altitude": 0,
                    "ambient_temperature": 25,
                    "humidity": 60
                },
                "expected_warnings": ["FLUIDE INFLAMMABLE", "ATEX", "FKM", "Viton"]
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/expert-analysis", json=case["data"], timeout=15)
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check that expert_recommendations exist
                    expert_recommendations = result.get("expert_recommendations", [])
                    if not expert_recommendations:
                        self.log_test(f"Chemical Compatibility - {case['name']} - Recommendations", False, 
                                    "No expert recommendations found")
                        all_passed = False
                        continue
                    
                    # Convert recommendations to text for searching
                    recommendations_text = ""
                    for rec in expert_recommendations:
                        if isinstance(rec, dict):
                            recommendations_text += str(rec.get("description", "")) + " "
                            recommendations_text += str(rec.get("title", "")) + " "
                            if "solutions" in rec:
                                for solution in rec["solutions"]:
                                    recommendations_text += str(solution) + " "
                        else:
                            recommendations_text += str(rec) + " "
                    
                    # Check for expected warnings/recommendations
                    found_warnings = []
                    missing_warnings = []
                    
                    for expected_warning in case["expected_warnings"]:
                        if expected_warning.upper() in recommendations_text.upper():
                            found_warnings.append(expected_warning)
                        else:
                            missing_warnings.append(expected_warning)
                    
                    if missing_warnings:
                        self.log_test(f"Chemical Compatibility - {case['name']} - Expected Warnings", False, 
                                    f"Missing warnings: {missing_warnings}. Found: {found_warnings}")
                        all_passed = False
                        continue
                    
                    # Check that we have comprehensive analysis structure
                    required_sections = ["npshd_analysis", "hmt_analysis", "performance_analysis", 
                                       "expert_recommendations", "optimization_potential"]
                    missing_sections = [s for s in required_sections if s not in result]
                    if missing_sections:
                        self.log_test(f"Chemical Compatibility - {case['name']} - Analysis Structure", False, 
                                    f"Missing sections: {missing_sections}")
                        all_passed = False
                        continue
                    
                    # Check optimization potential includes material recommendations
                    optimization_potential = result.get("optimization_potential", {})
                    if not optimization_potential:
                        self.log_test(f"Chemical Compatibility - {case['name']} - Optimization", False, 
                                    "Missing optimization potential")
                        all_passed = False
                        continue
                    
                    self.log_test(f"Chemical Compatibility - {case['name']}", True, 
                                f"Found {len(expert_recommendations)} recommendations with expected warnings: {found_warnings}")
                else:
                    self.log_test(f"Chemical Compatibility - {case['name']}", False, 
                                f"HTTP {response.status_code}: {response.text[:200]}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Chemical Compatibility - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_chemical_compatibility_materials_database(self):
        """Test that the chemical compatibility database is comprehensive"""
        print("\n🔬 Testing Chemical Compatibility Materials Database...")
        
        # Test different fluid-material combinations
        test_combinations = [
            {
                "name": "Water with Various Materials",
                "fluid": "water",
                "materials": ["pvc", "stainless_steel_316", "steel"],
                "expected_compatible": ["pvc", "stainless_steel_316"],
                "expected_incompatible": ["steel"]  # Should warn about corrosion
            },
            {
                "name": "Acid with Various Materials", 
                "fluid": "acid",
                "materials": ["pvc", "stainless_steel_316", "steel"],
                "expected_compatible": ["stainless_steel_316"],
                "expected_incompatible": ["steel"]
            },
            {
                "name": "Seawater with Various Materials",
                "fluid": "seawater", 
                "materials": ["stainless_steel_316", "steel", "pvc"],
                "expected_compatible": ["stainless_steel_316"],
                "expected_incompatible": ["steel"]
            }
        ]
        
        all_passed = True
        for combination in test_combinations:
            for material in combination["materials"]:
                test_data = {
                    "flow_rate": 50.0,
                    "fluid_type": combination["fluid"],
                    "temperature": 20.0,
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 100.0,
                    "discharge_pipe_diameter": 100.0,
                    "suction_height": 2.0,
                    "discharge_height": 15.0,
                    "suction_length": 30.0,
                    "discharge_length": 70.0,
                    "total_length": 100.0,
                    "useful_pressure": 1.0,
                    "suction_material": material,
                    "discharge_material": material,
                    "pump_efficiency": 80.0,
                    "motor_efficiency": 90.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 50.0,
                    "cable_material": "copper",
                    "npsh_required": 3.5,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 8760,
                    "electricity_cost": 0.12,
                    "altitude": 0,
                    "ambient_temperature": 25,
                    "humidity": 60
                }
                
                try:
                    response = requests.post(f"{BACKEND_URL}/expert-analysis", json=test_data, timeout=15)
                    if response.status_code == 200:
                        result = response.json()
                        expert_recommendations = result.get("expert_recommendations", [])
                        
                        # Convert recommendations to text
                        recommendations_text = ""
                        for rec in expert_recommendations:
                            if isinstance(rec, dict):
                                recommendations_text += str(rec.get("description", "")) + " "
                                recommendations_text += str(rec.get("title", "")) + " "
                            else:
                                recommendations_text += str(rec) + " "
                        
                        # Check if material compatibility is addressed
                        if material in combination["expected_incompatible"]:
                            # Should have warnings about incompatibility
                            if "INCOMPATIBILITÉ" not in recommendations_text.upper() and "REMPLACEMENT" not in recommendations_text.upper():
                                self.log_test(f"Material Database - {combination['name']} - {material} (Incompatible)", False, 
                                            "Missing incompatibility warning")
                                all_passed = False
                                continue
                        
                        self.log_test(f"Material Database - {combination['name']} - {material}", True, 
                                    f"Compatibility analysis present")
                    else:
                        self.log_test(f"Material Database - {combination['name']} - {material}", False, 
                                    f"HTTP {response.status_code}")
                        all_passed = False
                except Exception as e:
                    self.log_test(f"Material Database - {combination['name']} - {material}", False, f"Error: {str(e)}")
                    all_passed = False
        
        return all_passed
    
    def test_temperature_dependent_compatibility(self):
        """Test temperature-dependent compatibility warnings"""
        print("\n🌡️ Testing Temperature-Dependent Compatibility...")
        
        test_cases = [
            {
                "name": "PVC at High Temperature",
                "data": {
                    "flow_rate": 40.0,
                    "fluid_type": "water",
                    "temperature": 70.0,  # Above PVC limit
                    "suction_material": "pvc",
                    "discharge_material": "pvc"
                },
                "expected_warning": "PVC non recommandé au-dessus de 60°C"
            },
            {
                "name": "Steel at High Temperature",
                "data": {
                    "flow_rate": 40.0,
                    "fluid_type": "water", 
                    "temperature": 90.0,
                    "suction_material": "steel",
                    "discharge_material": "steel"
                },
                "expected_warning": "adapté aux hautes températures"
            }
        ]
        
        all_passed = True
        for case in test_cases:
            # Complete the test data
            complete_data = {
                "suction_type": "flooded",
                "suction_pipe_diameter": 100.0,
                "discharge_pipe_diameter": 100.0,
                "suction_height": 2.0,
                "discharge_height": 15.0,
                "suction_length": 30.0,
                "discharge_length": 70.0,
                "total_length": 100.0,
                "useful_pressure": 1.0,
                "pump_efficiency": 80.0,
                "motor_efficiency": 90.0,
                "voltage": 400,
                "power_factor": 0.8,
                "starting_method": "star_delta",
                "cable_length": 50.0,
                "cable_material": "copper",
                "npsh_required": 3.5,
                "installation_type": "surface",
                "pump_type": "centrifugal",
                "operating_hours": 8760,
                "electricity_cost": 0.12,
                "altitude": 0,
                "ambient_temperature": 25,
                "humidity": 60
            }
            complete_data.update(case["data"])
            
            try:
                response = requests.post(f"{BACKEND_URL}/expert-analysis", json=complete_data, timeout=15)
                if response.status_code == 200:
                    result = response.json()
                    expert_recommendations = result.get("expert_recommendations", [])
                    
                    # Convert recommendations to text
                    recommendations_text = ""
                    for rec in expert_recommendations:
                        if isinstance(rec, dict):
                            recommendations_text += str(rec.get("description", "")) + " "
                            recommendations_text += str(rec.get("title", "")) + " "
                        else:
                            recommendations_text += str(rec) + " "
                    
                    # Check for temperature warning
                    if case["expected_warning"].upper() not in recommendations_text.upper():
                        self.log_test(f"Temperature Compatibility - {case['name']}", False, 
                                    f"Missing expected warning: {case['expected_warning']}")
                        all_passed = False
                        continue
                    
                    self.log_test(f"Temperature Compatibility - {case['name']}", True, 
                                f"Found temperature warning at {complete_data['temperature']}°C")
                else:
                    self.log_test(f"Temperature Compatibility - {case['name']}", False, 
                                f"HTTP {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Temperature Compatibility - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def run_all_tests(self):
        """Run all chemical compatibility tests"""
        print("="*80)
        print("CHEMICAL COMPATIBILITY ANALYSIS INTEGRATION TESTING")
        print("="*80)
        
        tests = [
            self.test_expert_analysis_chemical_compatibility,
            self.test_chemical_compatibility_materials_database,
            self.test_temperature_dependent_compatibility
        ]
        
        total_passed = 0
        total_tests = len(tests)
        
        for test in tests:
            if test():
                total_passed += 1
        
        print("\n" + "="*80)
        print("CHEMICAL COMPATIBILITY TESTING SUMMARY")
        print("="*80)
        print(f"Total Test Categories: {total_tests}")
        print(f"Passed: {total_passed}")
        print(f"Failed: {total_tests - total_passed}")
        print(f"Success Rate: {(total_passed/total_tests)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        overall_success = total_passed == total_tests
        if overall_success:
            print("\n✅ CHEMICAL COMPATIBILITY ANALYSIS INTEGRATION WORKING PERFECTLY!")
        else:
            print("\n❌ CHEMICAL COMPATIBILITY ANALYSIS INTEGRATION HAS ISSUES!")
        
        return overall_success

if __name__ == "__main__":
    tester = ChemicalCompatibilityTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)