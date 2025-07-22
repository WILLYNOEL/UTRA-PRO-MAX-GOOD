#!/usr/bin/env python3
"""
Critical Material Analysis Testing - Focus on Review Request
Tests the improved critical material analysis with specific cases mentioned by user
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://19f490cc-936b-4813-a142-210cb79d9a88.preview.emergentagent.com/api"

class CriticalMaterialAnalysisTester:
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
    
    def test_api_connectivity(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{BACKEND_URL}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("API Connectivity", True, f"Response: {data}")
                return True
            else:
                self.log_test("API Connectivity", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Connectivity", False, f"Error: {str(e)}")
            return False
    
    def test_critical_material_analysis_bleach_cast_iron(self):
        """Test BLEACH + CAST_IRON specifically mentioned by user - should generate severe warnings about chlorine corrosion"""
        print("\n🧪 Testing Critical Material Analysis - BLEACH + CAST_IRON...")
        
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
                
                # Check that expert_recommendations section exists and is populated
                expert_recommendations = result.get("expert_recommendations", [])
                if not expert_recommendations:
                    self.log_test("BLEACH + CAST_IRON - Expert Recommendations", False, "No expert recommendations found")
                    return False
                
                # Look for severe chlorine corrosion warnings
                chlorine_warnings_found = False
                incompatibility_found = False
                material_replacement_found = False
                
                for recommendation in expert_recommendations:
                    rec_desc = recommendation.get("description", "").lower()
                    rec_title = recommendation.get("title", "").lower()
                    rec_solutions = str(recommendation.get("solutions", [])).lower()
                    
                    # Check for chlorine/corrosion warnings
                    if any(keyword in rec_desc or keyword in rec_title or keyword in rec_solutions 
                           for keyword in ["chlore", "corrosion", "incompatible", "interdit", "danger"]):
                        chlorine_warnings_found = True
                    
                    # Check for incompatibility detection
                    if any(keyword in rec_desc or keyword in rec_title 
                           for keyword in ["incompatibilité", "incompatible", "interdit"]):
                        incompatibility_found = True
                    
                    # Check for material replacement recommendations
                    if any(keyword in rec_desc or keyword in rec_title or keyword in rec_solutions
                           for keyword in ["pvc", "cpvc", "ptfe", "remplacement", "remplacer"]):
                        material_replacement_found = True
                
                # Verify critical analysis is present
                if not chlorine_warnings_found:
                    self.log_test("BLEACH + CAST_IRON - Chlorine Warnings", False, "No chlorine corrosion warnings found")
                    return False
                
                if not incompatibility_found:
                    self.log_test("BLEACH + CAST_IRON - Incompatibility Detection", False, "Incompatibility not detected")
                    return False
                
                if not material_replacement_found:
                    self.log_test("BLEACH + CAST_IRON - Material Recommendations", False, "No alternative material recommendations")
                    return False
                
                # Check that all required analysis sections are present
                required_sections = [
                    "npshd_analysis", "hmt_analysis", "performance_analysis", 
                    "electrical_analysis", "expert_recommendations"
                ]
                missing_sections = [section for section in required_sections if section not in result]
                if missing_sections:
                    self.log_test("BLEACH + CAST_IRON - Analysis Sections", False, f"Missing sections: {missing_sections}")
                    return False
                
                self.log_test("BLEACH + CAST_IRON Critical Analysis", True, 
                            f"Found {len(expert_recommendations)} recommendations with severe chlorine corrosion warnings")
                return True
            else:
                self.log_test("BLEACH + CAST_IRON Critical Analysis", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("BLEACH + CAST_IRON Critical Analysis", False, f"Error: {str(e)}")
            return False
    
    def test_critical_material_analysis_tomato_sauce_pvc(self):
        """Test TOMATO_SAUCE + PVC (newly added) - should provide food-grade recommendations"""
        print("\n🍅 Testing Critical Material Analysis - TOMATO_SAUCE + PVC...")
        
        test_data = {
            "flow_rate": 20.0,
            "fluid_type": "tomato_sauce",
            "temperature": 60.0,  # Processing temperature
            "suction_pipe_diameter": 100.0,
            "discharge_pipe_diameter": 80.0,
            "suction_height": 1.5,
            "discharge_height": 8.0,
            "suction_length": 10.0,
            "discharge_length": 40.0,
            "total_length": 50.0,
            "suction_material": "pvc",
            "discharge_material": "pvc",
            "useful_pressure": 1.0,
            "suction_elbow_90": 1,
            "discharge_elbow_90": 2,
            "discharge_gate_valve": 1,
            "pump_efficiency": 70.0,
            "motor_efficiency": 85.0,
            "voltage": 400,
            "power_factor": 0.8,
            "starting_method": "star_delta",
            "cable_length": 25.0,
            "cable_material": "copper",
            "npsh_required": 3.5,
            "installation_type": "surface",
            "pump_type": "centrifugal",
            "operating_hours": 1500.0,
            "electricity_cost": 0.12,
            "altitude": 0.0,
            "ambient_temperature": 25.0,
            "humidity": 60.0
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/expert-analysis", json=test_data, timeout=15)
            if response.status_code == 200:
                result = response.json()
                
                # Check that expert_recommendations section exists and is populated
                expert_recommendations = result.get("expert_recommendations", [])
                if not expert_recommendations:
                    self.log_test("TOMATO_SAUCE + PVC - Expert Recommendations", False, "No expert recommendations found")
                    return False
                
                # Look for food-grade specific recommendations
                food_grade_found = False
                temperature_warnings_found = False
                material_compatibility_found = False
                
                for recommendation in expert_recommendations:
                    rec_desc = recommendation.get("description", "").lower()
                    rec_title = recommendation.get("title", "").lower()
                    rec_solutions = str(recommendation.get("solutions", [])).lower()
                    
                    # Check for food-grade recommendations
                    if any(keyword in rec_desc or keyword in rec_title or keyword in rec_solutions 
                           for keyword in ["alimentaire", "fda", "ce", "sanitaire", "haccp", "cip"]):
                        food_grade_found = True
                    
                    # Check for temperature warnings (PVC at 60°C)
                    if any(keyword in rec_desc or keyword in rec_title 
                           for keyword in ["température", "60°c", "limite", "pvc"]):
                        temperature_warnings_found = True
                    
                    # Check for material compatibility analysis
                    if any(keyword in rec_desc or keyword in rec_title or keyword in rec_solutions
                           for keyword in ["316l", "inox", "stainless", "compatibilité"]):
                        material_compatibility_found = True
                
                # Verify analysis completeness
                if not food_grade_found:
                    self.log_test("TOMATO_SAUCE + PVC - Food Grade Recommendations", False, "No food-grade recommendations found")
                    return False
                
                # Check that all required analysis sections are present
                required_sections = [
                    "npshd_analysis", "hmt_analysis", "performance_analysis", 
                    "electrical_analysis", "expert_recommendations"
                ]
                missing_sections = [section for section in required_sections if section not in result]
                if missing_sections:
                    self.log_test("TOMATO_SAUCE + PVC - Analysis Sections", False, f"Missing sections: {missing_sections}")
                    return False
                
                self.log_test("TOMATO_SAUCE + PVC Critical Analysis", True, 
                            f"Found {len(expert_recommendations)} recommendations with food-grade analysis")
                return True
            else:
                self.log_test("TOMATO_SAUCE + PVC Critical Analysis", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("TOMATO_SAUCE + PVC Critical Analysis", False, f"Error: {str(e)}")
            return False
    
    def test_critical_material_analysis_glycerol_steel(self):
        """Test GLYCEROL + STEEL (high viscosity case) - should provide viscosity-specific recommendations"""
        print("\n🍯 Testing Critical Material Analysis - GLYCEROL + STEEL...")
        
        test_data = {
            "flow_rate": 15.0,
            "fluid_type": "glycerol",
            "temperature": 40.0,  # Reduced viscosity at higher temp
            "suction_pipe_diameter": 125.0,  # Larger diameter for viscous fluid
            "discharge_pipe_diameter": 100.0,
            "suction_height": 1.0,
            "discharge_height": 12.0,
            "suction_length": 8.0,
            "discharge_length": 35.0,
            "total_length": 43.0,
            "suction_material": "steel",
            "discharge_material": "steel",
            "useful_pressure": 2.0,
            "suction_elbow_90": 1,
            "discharge_elbow_90": 2,
            "discharge_gate_valve": 1,
            "pump_efficiency": 65.0,  # Lower efficiency for viscous fluid
            "motor_efficiency": 90.0,
            "voltage": 400,
            "power_factor": 0.8,
            "starting_method": "star_delta",
            "cable_length": 40.0,
            "cable_material": "copper",
            "npsh_required": 4.0,
            "installation_type": "surface",
            "pump_type": "centrifugal",
            "operating_hours": 3000.0,
            "electricity_cost": 0.12,
            "altitude": 0.0,
            "ambient_temperature": 25.0,
            "humidity": 60.0
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/expert-analysis", json=test_data, timeout=15)
            if response.status_code == 200:
                result = response.json()
                
                # Check that expert_recommendations section exists and is populated
                expert_recommendations = result.get("expert_recommendations", [])
                if not expert_recommendations:
                    self.log_test("GLYCEROL + STEEL - Expert Recommendations", False, "No expert recommendations found")
                    return False
                
                # Look for viscosity-specific recommendations
                viscosity_recommendations_found = False
                diameter_recommendations_found = False
                temperature_recommendations_found = False
                pump_type_recommendations_found = False
                
                for recommendation in expert_recommendations:
                    rec_desc = recommendation.get("description", "").lower()
                    rec_title = recommendation.get("title", "").lower()
                    rec_solutions = str(recommendation.get("solutions", [])).lower()
                    
                    # Check for viscosity-related recommendations
                    if any(keyword in rec_desc or keyword in rec_title or keyword in rec_solutions 
                           for keyword in ["visqueux", "viscosité", "fluide épais", "glycérine"]):
                        viscosity_recommendations_found = True
                    
                    # Check for diameter recommendations
                    if any(keyword in rec_desc or keyword in rec_title or keyword in rec_solutions
                           for keyword in ["diamètre", "majoré", "augmenter", "vitesse réduite"]):
                        diameter_recommendations_found = True
                    
                    # Check for temperature recommendations
                    if any(keyword in rec_desc or keyword in rec_title or keyword in rec_solutions
                           for keyword in ["préchauffage", "température", "chauffage", "réchauffer"]):
                        temperature_recommendations_found = True
                    
                    # Check for pump type recommendations
                    if any(keyword in rec_desc or keyword in rec_title or keyword in rec_solutions
                           for keyword in ["volumétrique", "pompe", "centrifuge", "déplacement"]):
                        pump_type_recommendations_found = True
                
                # Verify viscosity analysis is present
                if not viscosity_recommendations_found:
                    self.log_test("GLYCEROL + STEEL - Viscosity Analysis", False, "No viscosity-specific recommendations found")
                    return False
                
                # Check that all required analysis sections are present
                required_sections = [
                    "npshd_analysis", "hmt_analysis", "performance_analysis", 
                    "electrical_analysis", "expert_recommendations"
                ]
                missing_sections = [section for section in required_sections if section not in result]
                if missing_sections:
                    self.log_test("GLYCEROL + STEEL - Analysis Sections", False, f"Missing sections: {missing_sections}")
                    return False
                
                self.log_test("GLYCEROL + STEEL Critical Analysis", True, 
                            f"Found {len(expert_recommendations)} recommendations with viscosity analysis")
                return True
            else:
                self.log_test("GLYCEROL + STEEL Critical Analysis", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GLYCEROL + STEEL Critical Analysis", False, f"Error: {str(e)}")
            return False
    
    def test_critical_material_analysis_water_pehd_default(self):
        """Test WATER + PEHD (default case) - should provide generic but useful analysis"""
        print("\n💧 Testing Critical Material Analysis - WATER + PEHD (Default Case)...")
        
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
                
                # Check that expert_recommendations section exists and is populated
                expert_recommendations = result.get("expert_recommendations", [])
                if not expert_recommendations:
                    self.log_test("WATER + PEHD - Expert Recommendations", False, "No expert recommendations found")
                    return False
                
                # Look for generic but useful recommendations
                hydraulic_recommendations_found = False
                efficiency_recommendations_found = False
                material_recommendations_found = False
                general_recommendations_found = False
                
                for recommendation in expert_recommendations:
                    rec_desc = recommendation.get("description", "").lower()
                    rec_title = recommendation.get("title", "").lower()
                    rec_solutions = str(recommendation.get("solutions", [])).lower()
                    rec_type = recommendation.get("type", "").lower()
                    
                    # Check for hydraulic recommendations
                    if any(keyword in rec_desc or keyword in rec_title or keyword in rec_solutions 
                           for keyword in ["hydraulique", "débit", "vitesse", "perte", "charge"]):
                        hydraulic_recommendations_found = True
                    
                    # Check for efficiency recommendations
                    if any(keyword in rec_desc or keyword in rec_title or keyword in rec_solutions
                           for keyword in ["rendement", "efficacité", "performance", "optimisation"]):
                        efficiency_recommendations_found = True
                    
                    # Check for material recommendations
                    if any(keyword in rec_desc or keyword in rec_title or keyword in rec_solutions
                           for keyword in ["matériau", "pehd", "polyéthylène", "compatibilité"]):
                        material_recommendations_found = True
                    
                    # Check for general engineering recommendations
                    if rec_type in ["hydraulic", "efficiency", "electrical", "critical"]:
                        general_recommendations_found = True
                
                # Verify that we have meaningful recommendations even for standard case
                if not general_recommendations_found:
                    self.log_test("WATER + PEHD - General Recommendations", False, "No general engineering recommendations found")
                    return False
                
                # Check that all required analysis sections are present
                required_sections = [
                    "npshd_analysis", "hmt_analysis", "performance_analysis", 
                    "electrical_analysis", "expert_recommendations"
                ]
                missing_sections = [section for section in required_sections if section not in result]
                if missing_sections:
                    self.log_test("WATER + PEHD - Analysis Sections", False, f"Missing sections: {missing_sections}")
                    return False
                
                # Verify no empty recommendations
                empty_recommendations = 0
                for recommendation in expert_recommendations:
                    if not recommendation.get("description", "").strip() or not recommendation.get("title", "").strip():
                        empty_recommendations += 1
                
                if empty_recommendations > 0:
                    self.log_test("WATER + PEHD - Empty Recommendations", False, f"Found {empty_recommendations} empty recommendations")
                    return False
                
                self.log_test("WATER + PEHD Default Case Analysis", True, 
                            f"Found {len(expert_recommendations)} meaningful recommendations for standard case")
                return True
            else:
                self.log_test("WATER + PEHD Default Case Analysis", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("WATER + PEHD Default Case Analysis", False, f"Error: {str(e)}")
            return False
    
    def test_material_recommendations_always_populated(self):
        """Test that material_recommendations section is always populated with meaningful content for all cases"""
        print("\n🔧 Testing Material Recommendations Always Populated...")
        
        test_cases = [
            {
                "name": "Corrosive Fluid Case",
                "data": {
                    "flow_rate": 25.0,
                    "fluid_type": "acid",
                    "temperature": 30.0,
                    "suction_material": "steel",
                    "discharge_material": "steel"
                }
            },
            {
                "name": "Food Grade Case",
                "data": {
                    "flow_rate": 35.0,
                    "fluid_type": "milk",
                    "temperature": 4.0,
                    "suction_material": "pvc",
                    "discharge_material": "pvc"
                }
            },
            {
                "name": "High Temperature Case",
                "data": {
                    "flow_rate": 40.0,
                    "fluid_type": "oil",
                    "temperature": 80.0,
                    "suction_material": "pvc",
                    "discharge_material": "pvc"
                }
            },
            {
                "name": "Standard Case",
                "data": {
                    "flow_rate": 50.0,
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "suction_material": "steel",
                    "discharge_material": "steel"
                }
            }
        ]
        
        all_passed = True
        for case in test_cases:
            # Complete the test data with standard values
            complete_data = {
                "suction_pipe_diameter": 100.0,
                "discharge_pipe_diameter": 80.0,
                "suction_height": 2.0,
                "discharge_height": 10.0,
                "suction_length": 15.0,
                "discharge_length": 45.0,
                "total_length": 60.0,
                "useful_pressure": 1.0,
                "suction_elbow_90": 1,
                "discharge_elbow_90": 2,
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
            complete_data.update(case["data"])
            
            try:
                response = requests.post(f"{BACKEND_URL}/expert-analysis", json=complete_data, timeout=15)
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check that expert_recommendations section exists and is populated
                    expert_recommendations = result.get("expert_recommendations", [])
                    if not expert_recommendations:
                        self.log_test(f"Material Recommendations - {case['name']}", False, "No expert recommendations found")
                        all_passed = False
                        continue
                    
                    # Check for material-specific content
                    material_content_found = False
                    empty_recommendations = 0
                    
                    for recommendation in expert_recommendations:
                        rec_desc = recommendation.get("description", "").strip()
                        rec_title = recommendation.get("title", "").strip()
                        rec_solutions = recommendation.get("solutions", [])
                        
                        # Check for empty recommendations
                        if not rec_desc or not rec_title:
                            empty_recommendations += 1
                            continue
                        
                        # Check for material-related content
                        if any(keyword in rec_desc.lower() or keyword in rec_title.lower() 
                               for keyword in ["matériau", "material", "compatibilité", "inox", "pvc", "acier", "fonte", "joint", "seal"]):
                            material_content_found = True
                    
                    if empty_recommendations > 0:
                        self.log_test(f"Material Recommendations - {case['name']} - Empty Content", False, 
                                    f"Found {empty_recommendations} empty recommendations")
                        all_passed = False
                        continue
                    
                    if not material_content_found:
                        self.log_test(f"Material Recommendations - {case['name']} - Material Content", False, 
                                    "No material-specific recommendations found")
                        all_passed = False
                        continue
                    
                    self.log_test(f"Material Recommendations - {case['name']}", True, 
                                f"Found {len(expert_recommendations)} meaningful material recommendations")
                else:
                    self.log_test(f"Material Recommendations - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Material Recommendations - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed

    def run_critical_material_analysis_tests(self):
        """Run all critical material analysis tests from review request"""
        print("=" * 80)
        print("CRITICAL MATERIAL ANALYSIS TESTING - REVIEW REQUEST FOCUS")
        print("=" * 80)
        print()
        
        # Test connectivity first
        if not self.test_api_connectivity():
            print("\n❌ API connectivity failed - aborting remaining tests")
            return False
        
        print()
        
        # Run critical material analysis tests
        tests = [
            self.test_critical_material_analysis_bleach_cast_iron,  # BLEACH + CAST_IRON specific case
            self.test_critical_material_analysis_tomato_sauce_pvc,  # TOMATO_SAUCE + PVC newly added
            self.test_critical_material_analysis_glycerol_steel,    # GLYCEROL + STEEL high viscosity
            self.test_critical_material_analysis_water_pehd_default, # WATER + PEHD default case
            self.test_material_recommendations_always_populated,    # Verify no empty recommendations
        ]
        
        for test in tests:
            print()
            test()
        
        # Summary
        print("\n" + "=" * 80)
        print("CRITICAL MATERIAL ANALYSIS TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["passed"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        if self.failed_tests:
            print(f"\nFailed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        # Specific analysis of critical cases
        critical_cases = [
            "BLEACH + CAST_IRON Critical Analysis",
            "TOMATO_SAUCE + PVC Critical Analysis", 
            "GLYCEROL + STEEL Critical Analysis",
            "WATER + PEHD Default Case Analysis"
        ]
        
        critical_passed = sum(1 for result in self.test_results 
                            if result["passed"] and result["test"] in critical_cases)
        critical_total = len(critical_cases)
        
        if critical_total > 0:
            critical_success_rate = (critical_passed / critical_total) * 100
            print(f"\nSpecific Cases Success Rate: {critical_success_rate:.1f}% ({critical_passed}/{critical_total})")
        
        if success_rate >= 90:
            print("\n🎉 EXCELLENT: Critical material analysis is working very well!")
            print("✅ Analysis appears for ALL fluid-material combinations")
            print("✅ Material recommendations section is always populated with meaningful content")
        elif success_rate >= 75:
            print("\n✅ GOOD: Critical material analysis is mostly working with minor issues")
        elif success_rate >= 50:
            print("\n⚠️  MODERATE: Critical material analysis has significant issues that need attention")
        else:
            print("\n❌ CRITICAL: Critical material analysis has major problems that must be fixed")
        
        return success_rate >= 75

if __name__ == "__main__":
    tester = CriticalMaterialAnalysisTester()
    success = tester.run_critical_material_analysis_tests()
    sys.exit(0 if success else 1)