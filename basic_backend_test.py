#!/usr/bin/env python3
"""
Basic Backend Stability Testing for ECO PUMP EXPERT
Focus on core API endpoints after frontend modifications
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://3cd9f542-b6a9-4745-bbaf-f64139ff26c2.preview.emergentagent.com/api"

class BasicBackendTester:
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
    
    def test_api_health_check(self):
        """Test basic API health check"""
        try:
            response = requests.get(f"{BACKEND_URL}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("API Health Check", True, f"Response: {data.get('message', 'OK')}")
                return True
            else:
                self.log_test("API Health Check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Health Check", False, f"Error: {str(e)}")
            return False
    
    def test_fluids_endpoint(self):
        """Test fluids endpoint - critical for frontend combos"""
        try:
            response = requests.get(f"{BACKEND_URL}/fluids", timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                if "fluids" not in data:
                    self.log_test("Fluids Endpoint", False, "Missing 'fluids' key")
                    return False
                
                fluids = data["fluids"]
                if len(fluids) < 4:  # At least basic fluids
                    self.log_test("Fluids Endpoint", False, f"Too few fluids: {len(fluids)}")
                    return False
                
                # Check basic structure
                for fluid in fluids[:3]:  # Check first 3
                    if "id" not in fluid or "name" not in fluid:
                        self.log_test("Fluids Endpoint", False, f"Invalid fluid structure: {fluid}")
                        return False
                
                self.log_test("Fluids Endpoint", True, f"Found {len(fluids)} fluids")
                return True
            else:
                self.log_test("Fluids Endpoint", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Fluids Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_pipe_materials_endpoint(self):
        """Test pipe materials endpoint - critical for frontend combos"""
        try:
            response = requests.get(f"{BACKEND_URL}/pipe-materials", timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                if "materials" not in data:
                    self.log_test("Pipe Materials Endpoint", False, "Missing 'materials' key")
                    return False
                
                materials = data["materials"]
                if len(materials) < 3:  # At least basic materials
                    self.log_test("Pipe Materials Endpoint", False, f"Too few materials: {len(materials)}")
                    return False
                
                # Check basic structure
                for material in materials[:3]:  # Check first 3
                    if "id" not in material or "name" not in material:
                        self.log_test("Pipe Materials Endpoint", False, f"Invalid material structure: {material}")
                        return False
                
                self.log_test("Pipe Materials Endpoint", True, f"Found {len(materials)} materials")
                return True
            else:
                self.log_test("Pipe Materials Endpoint", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Pipe Materials Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_solar_regions_endpoint(self):
        """Test solar regions endpoint - for Expert Solaire"""
        try:
            response = requests.get(f"{BACKEND_URL}/solar-regions", timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                if "regions" not in data:
                    self.log_test("Solar Regions Endpoint", False, "Missing 'regions' key")
                    return False
                
                regions = data["regions"]
                if len(regions) < 5:  # At least some regions
                    self.log_test("Solar Regions Endpoint", False, f"Too few regions: {len(regions)}")
                    return False
                
                self.log_test("Solar Regions Endpoint", True, f"Found {len(regions)} regions")
                return True
            else:
                self.log_test("Solar Regions Endpoint", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Solar Regions Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_basic_calculation(self):
        """Test basic hydraulic calculation"""
        test_data = {
            "flow_rate": 50.0,
            "suction_height": 3.0,
            "pipe_diameter": 100.0,
            "pipe_length": 50.0,
            "fluid_type": "water",
            "temperature": 20.0,
            "pump_efficiency": 75.0,
            "motor_efficiency": 90.0,
            "voltage": 400,
            "cable_length": 50.0
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate", json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                
                # Check essential fields
                required_fields = ["flow_velocity", "hydraulic_power", "absorbed_power", "hmt_meters"]
                missing_fields = [f for f in required_fields if f not in result]
                
                if missing_fields:
                    self.log_test("Basic Calculation", False, f"Missing fields: {missing_fields}")
                    return False
                
                # Check reasonable values
                velocity = result.get("flow_velocity", 0)
                if velocity <= 0 or velocity > 10:
                    self.log_test("Basic Calculation", False, f"Unreasonable velocity: {velocity} m/s")
                    return False
                
                power = result.get("hydraulic_power", 0)
                if power <= 0 or power > 100:
                    self.log_test("Basic Calculation", False, f"Unreasonable power: {power} kW")
                    return False
                
                self.log_test("Basic Calculation", True, f"Velocity: {velocity:.2f} m/s, Power: {power:.2f} kW")
                return True
            else:
                self.log_test("Basic Calculation", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Basic Calculation", False, f"Error: {str(e)}")
            return False
    
    def test_npshd_calculation(self):
        """Test NPSHd calculation endpoint"""
        test_data = {
            "suction_type": "flooded",
            "hasp": 2.0,
            "flow_rate": 50.0,
            "fluid_type": "water",
            "temperature": 20.0,
            "pipe_diameter": 100.0,
            "pipe_material": "pvc",
            "pipe_length": 30.0,
            "suction_fittings": []
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                
                # Check essential fields
                if "npshd" not in result:
                    self.log_test("NPSHd Calculation", False, "Missing npshd field")
                    return False
                
                npshd = result.get("npshd", 0)
                if npshd < -50 or npshd > 50:  # Reasonable range
                    self.log_test("NPSHd Calculation", False, f"NPSHd out of range: {npshd} m")
                    return False
                
                self.log_test("NPSHd Calculation", True, f"NPSHd: {npshd:.2f} m")
                return True
            else:
                self.log_test("NPSHd Calculation", False, f"Status: {response.status_code}")
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
            "suction_pipe_length": 30.0,
            "discharge_pipe_length": 100.0,
            "suction_pipe_material": "pvc",
            "discharge_pipe_material": "pvc",
            "suction_fittings": [],
            "discharge_fittings": [],
            "fluid_type": "water",
            "temperature": 20.0,
            "flow_rate": 50.0
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate-hmt", json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                
                # Check essential fields
                if "hmt" not in result:
                    self.log_test("HMT Calculation", False, "Missing hmt field")
                    return False
                
                hmt = result.get("hmt", 0)
                if hmt <= 0 or hmt > 200:  # Reasonable range
                    self.log_test("HMT Calculation", False, f"HMT out of range: {hmt} m")
                    return False
                
                self.log_test("HMT Calculation", True, f"HMT: {hmt:.2f} m")
                return True
            else:
                self.log_test("HMT Calculation", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("HMT Calculation", False, f"Error: {str(e)}")
            return False
    
    def test_solar_pumping_calculation(self):
        """Test solar pumping calculation - Expert Solaire"""
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
                
                # Check essential sections
                required_sections = ["input_data", "dimensioning"]
                missing_sections = [s for s in required_sections if s not in result]
                
                if missing_sections:
                    self.log_test("Solar Pumping Calculation", False, f"Missing sections: {missing_sections}")
                    return False
                
                # Check dimensioning has basic fields
                dimensioning = result.get("dimensioning", {})
                if "recommended_pump" not in dimensioning:
                    self.log_test("Solar Pumping Calculation", False, "Missing recommended_pump in dimensioning")
                    return False
                
                self.log_test("Solar Pumping Calculation", True, "Solar pumping calculation working")
                return True
            else:
                self.log_test("Solar Pumping Calculation", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Solar Pumping Calculation", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all basic backend tests"""
        print("=" * 80)
        print("BASIC BACKEND STABILITY TESTING - ECO PUMP EXPERT")
        print("Testing core API endpoints after frontend modifications")
        print("=" * 80)
        
        tests = [
            self.test_api_health_check,
            self.test_fluids_endpoint,
            self.test_pipe_materials_endpoint,
            self.test_solar_regions_endpoint,
            self.test_basic_calculation,
            self.test_npshd_calculation,
            self.test_hmt_calculation,
            self.test_solar_pumping_calculation
        ]
        
        for test in tests:
            test()
        
        print("\n" + "=" * 80)
        print("BASIC BACKEND TESTING SUMMARY")
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
        
        if success_rate >= 80:
            print(f"\n✅ BACKEND STABILITY TEST PASSED!")
            print("Core APIs are working correctly after frontend modifications")
            return True
        else:
            print(f"\n❌ BACKEND STABILITY TEST FAILED!")
            print("Some critical issues were found - see details above")
            return False

if __name__ == "__main__":
    tester = BasicBackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)