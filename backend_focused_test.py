#!/usr/bin/env python3
"""
Focused Backend Testing for Review Request
Tests core backend functionality to ensure no regressions from frontend fixes
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://d40305d1-f7e4-4761-aff0-c1f2df1cb0f9.preview.emergentagent.com/api"

class FocusedBackendTester:
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
    
    def test_fluids_endpoint(self):
        """Test fluids endpoint for Expert Solaire"""
        try:
            response = requests.get(f"{BACKEND_URL}/fluids", timeout=10)
            if response.status_code == 200:
                data = response.json()
                fluids = data.get("fluids", [])
                
                # Check we have the expected fluids
                expected_count = 20
                if len(fluids) >= expected_count:
                    self.log_test("Fluids Endpoint", True, f"Found {len(fluids)} fluids")
                    return True
                else:
                    self.log_test("Fluids Endpoint", False, f"Expected {expected_count}+ fluids, found {len(fluids)}")
                    return False
            else:
                self.log_test("Fluids Endpoint", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Fluids Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_pipe_materials_endpoint(self):
        """Test pipe materials endpoint"""
        try:
            response = requests.get(f"{BACKEND_URL}/pipe-materials", timeout=10)
            if response.status_code == 200:
                data = response.json()
                materials = data.get("materials", [])
                
                # Check we have expected materials
                expected_materials = ["pvc", "pehd", "steel", "steel_galvanized", "cast_iron", "concrete"]
                found_materials = [m.get("id") for m in materials]
                
                missing = [m for m in expected_materials if m not in found_materials]
                if not missing:
                    self.log_test("Pipe Materials Endpoint", True, f"Found {len(materials)} materials")
                    return True
                else:
                    self.log_test("Pipe Materials Endpoint", False, f"Missing materials: {missing}")
                    return False
            else:
                self.log_test("Pipe Materials Endpoint", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Pipe Materials Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_solar_regions_endpoint(self):
        """Test solar regions endpoint for Expert Solaire"""
        try:
            response = requests.get(f"{BACKEND_URL}/solar-regions", timeout=10)
            if response.status_code == 200:
                data = response.json()
                regions = data.get("regions", [])
                
                # Check we have solar regions
                if len(regions) >= 10:
                    self.log_test("Solar Regions Endpoint", True, f"Found {len(regions)} regions")
                    return True
                else:
                    self.log_test("Solar Regions Endpoint", False, f"Expected 10+ regions, found {len(regions)}")
                    return False
            else:
                self.log_test("Solar Regions Endpoint", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Solar Regions Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_npshd_calculation(self):
        """Test NPSHd calculation endpoint"""
        test_data = {
            "suction_type": "flooded",
            "hasp": 2.0,
            "flow_rate": 30.0,
            "fluid_type": "water",
            "temperature": 20.0,
            "pipe_diameter": 100.0,
            "pipe_material": "pvc",
            "pipe_length": 20.0,
            "npsh_required": 3.0
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                
                # Check required fields
                required_fields = ["npshd", "velocity", "reynolds_number", "cavitation_risk"]
                missing = [f for f in required_fields if f not in result]
                
                if not missing:
                    npshd = result.get("npshd", 0)
                    cavitation_risk = result.get("cavitation_risk", False)
                    self.log_test("NPSHd Calculation", True, f"NPSHd: {npshd:.2f}m, Cavitation Risk: {cavitation_risk}")
                    return True
                else:
                    self.log_test("NPSHd Calculation", False, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("NPSHd Calculation", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("NPSHd Calculation", False, f"Error: {str(e)}")
            return False
    
    def test_hmt_calculation(self):
        """Test HMT calculation endpoint"""
        test_data = {
            "installation_type": "surface",
            "suction_type": "flooded",
            "hasp": 2.0,
            "discharge_height": 15.0,
            "useful_pressure": 1.0,
            "suction_pipe_diameter": 100.0,
            "discharge_pipe_diameter": 80.0,
            "suction_pipe_length": 20.0,
            "discharge_pipe_length": 50.0,
            "suction_pipe_material": "pvc",
            "discharge_pipe_material": "pvc",
            "fluid_type": "water",
            "temperature": 20.0,
            "flow_rate": 25.0
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate-hmt", json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                
                # Check required fields
                required_fields = ["hmt", "total_head_loss", "static_head"]
                missing = [f for f in required_fields if f not in result]
                
                if not missing:
                    hmt = result.get("hmt", 0)
                    head_loss = result.get("total_head_loss", 0)
                    self.log_test("HMT Calculation", True, f"HMT: {hmt:.2f}m, Head Loss: {head_loss:.2f}m")
                    return True
                else:
                    self.log_test("HMT Calculation", False, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("HMT Calculation", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("HMT Calculation", False, f"Error: {str(e)}")
            return False
    
    def test_performance_calculation(self):
        """Test Performance calculation endpoint"""
        test_data = {
            "flow_rate": 50.0,
            "hmt": 25.0,
            "pipe_diameter": 100.0,
            "fluid_type": "water",
            "pipe_material": "pvc",
            "pump_efficiency": 80.0,
            "motor_efficiency": 90.0,
            "starting_method": "star_delta",
            "power_factor": 0.8,
            "cable_length": 50.0,
            "voltage": 400
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate-performance", json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                
                # Check required fields
                required_fields = ["power_calculations", "overall_efficiency", "nominal_current"]
                missing = [f for f in required_fields if f not in result]
                
                if not missing:
                    power_calcs = result.get("power_calculations", {})
                    hydraulic_power = power_calcs.get("hydraulic_power", 0)
                    absorbed_power = power_calcs.get("absorbed_power", 0)
                    efficiency = result.get("overall_efficiency", 0)
                    
                    self.log_test("Performance Calculation", True, 
                                f"P2: {hydraulic_power:.2f}kW, P1: {absorbed_power:.2f}kW, Eff: {efficiency:.1f}%")
                    return True
                else:
                    self.log_test("Performance Calculation", False, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("Performance Calculation", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Performance Calculation", False, f"Error: {str(e)}")
            return False
    
    def test_audit_analysis_endpoint(self):
        """Test audit analysis endpoint"""
        test_data = {
            "installation_type": "surface",
            "fluid_type": "water",
            "current_flow_rate": 30.0,
            "required_flow_rate": 50.0,
            "measured_current": 15.0,
            "rated_current": 10.0,
            "vibration_level": 8.5,
            "motor_temperature": 85.0,
            "suction_pipe_diameter": 100.0,
            "discharge_pipe_diameter": 80.0
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/audit-analysis", json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                
                # Check required fields
                required_fields = ["overall_score", "hydraulic_score", "electrical_score", "mechanical_score"]
                missing = [f for f in required_fields if f not in result]
                
                if not missing:
                    overall_score = result.get("overall_score", 0)
                    hydraulic_score = result.get("hydraulic_score", 0)
                    electrical_score = result.get("electrical_score", 0)
                    mechanical_score = result.get("mechanical_score", 0)
                    
                    self.log_test("Audit Analysis", True, 
                                f"Overall: {overall_score}/100, H: {hydraulic_score}, E: {electrical_score}, M: {mechanical_score}")
                    return True
                else:
                    self.log_test("Audit Analysis", False, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("Audit Analysis", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Audit Analysis", False, f"Error: {str(e)}")
            return False
    
    def test_solar_pumping_endpoint(self):
        """Test solar pumping calculation for Expert Solaire"""
        test_data = {
            "daily_water_need": 100,
            "operating_hours": 8,
            "total_head": 25,
            "efficiency_pump": 75,
            "efficiency_motor": 90,
            "region": "dakar"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/solar-pumping", json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                
                # Check required sections
                required_sections = ["dimensioning", "solar_irradiation", "system_efficiency"]
                missing = [s for s in required_sections if s not in result]
                
                if not missing:
                    dimensioning = result.get("dimensioning", {})
                    total_cost = dimensioning.get("total_system_cost", 0)
                    
                    self.log_test("Solar Pumping Calculation", True, f"System Cost: {total_cost}€")
                    return True
                else:
                    self.log_test("Solar Pumping Calculation", False, f"Missing sections: {missing}")
                    return False
            else:
                self.log_test("Solar Pumping Calculation", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Solar Pumping Calculation", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all focused backend tests"""
        print("=" * 80)
        print("FOCUSED BACKEND TESTING - REVIEW REQUEST VALIDATION")
        print("Testing core backend functionality after frontend fixes")
        print("=" * 80)
        
        tests = [
            self.test_fluids_endpoint,
            self.test_pipe_materials_endpoint,
            self.test_solar_regions_endpoint,
            self.test_npshd_calculation,
            self.test_hmt_calculation,
            self.test_performance_calculation,
            self.test_audit_analysis_endpoint,
            self.test_solar_pumping_endpoint
        ]
        
        for test in tests:
            test()
        
        # Summary
        print("\n" + "=" * 80)
        print("FOCUSED BACKEND TESTING SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["passed"]])
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        if success_rate >= 90:
            print(f"\n✅ BACKEND TESTING SUCCESSFUL!")
            print("All core backend functionality is working correctly")
            return True
        elif success_rate >= 75:
            print(f"\n⚠️ BACKEND TESTING MOSTLY SUCCESSFUL")
            print("Most backend functionality working, minor issues detected")
            return True
        else:
            print(f"\n❌ BACKEND TESTING FAILED!")
            print("Critical backend issues detected")
            return False

if __name__ == "__main__":
    tester = FocusedBackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)