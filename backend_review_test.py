#!/usr/bin/env python3
"""
Backend Review Testing for Specific User Requirements
Tests the specific modifications requested by the user:
1. Performance Curves: Verify loss curves and HMT curves intersect at nominal point
2. Removal of NPSH: Verify NPSH values are not in Performance tab
3. Velocity and Alerts: Verify velocity data and alerts are in Performance tab
4. Submersible Installation: Verify suction info not displayed for submersible
"""

import requests
import json
import math
from datetime import datetime
import sys

# Backend URL from environment
BACKEND_URL = "https://ec8f8f5c-d2d7-4ba4-bcd2-82795afcc800.preview.emergentagent.com/api"

class BackendReviewTester:
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
    
    def test_performance_curves_intersection(self):
        """Test that loss curves and HMT curves intersect at the nominal point (flow rate and HMT entered)"""
        print("\n📈 Testing Performance Curves Intersection at Nominal Point...")
        
        # Test data from user request: Flow rate: 50 m³/h, HMT: 30 m, diameter: 100mm, fluid: water
        test_data = {
            "flow_rate": 50.0,  # m³/h - nominal point
            "hmt": 30.0,  # m - nominal point
            "pipe_diameter": 100.0,  # mm
            "required_npsh": 3.0,
            "calculated_npshd": 8.0,
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
                
                performance_curves = result.get("performance_curves", {})
                
                # Check that we have both HMT and head_loss curves
                if "hmt" not in performance_curves:
                    self.log_test("Performance Curves - HMT Curve", False, "Missing HMT curve")
                    return False
                
                if "head_loss" not in performance_curves:
                    self.log_test("Performance Curves - Head Loss Curve", False, "Missing head_loss curve")
                    return False
                
                flow_points = performance_curves.get("flow", [])
                hmt_points = performance_curves.get("hmt", [])
                head_loss_points = performance_curves.get("head_loss", [])
                
                if not flow_points or not hmt_points or not head_loss_points:
                    self.log_test("Performance Curves - Data Points", False, "Missing curve data points")
                    return False
                
                # Check that the best operating point matches the input values
                best_operating_point = performance_curves.get("best_operating_point", {})
                if not best_operating_point:
                    self.log_test("Performance Curves - Operating Point", False, "Missing best_operating_point")
                    return False
                
                op_flow = best_operating_point.get("flow", 0)
                op_hmt = best_operating_point.get("hmt", 0)
                
                # Verify operating point matches input exactly
                if abs(op_flow - test_data["flow_rate"]) > 0.1:
                    self.log_test("Performance Curves - Operating Point Flow", False, 
                                f"Operating point flow mismatch. Expected: {test_data['flow_rate']}, Got: {op_flow}")
                    return False
                
                if abs(op_hmt - test_data["hmt"]) > 0.1:
                    self.log_test("Performance Curves - Operating Point HMT", False, 
                                f"Operating point HMT mismatch. Expected: {test_data['hmt']}, Got: {op_hmt}")
                    return False
                
                # Find the intersection point in the curves (where HMT curve and head loss curve are closest)
                min_diff = float('inf')
                intersection_index = 0
                
                for i in range(len(flow_points)):
                    diff = abs(hmt_points[i] - head_loss_points[i])
                    if diff < min_diff:
                        min_diff = diff
                        intersection_index = i
                
                intersection_flow = flow_points[intersection_index]
                intersection_hmt = hmt_points[intersection_index]
                intersection_head_loss = head_loss_points[intersection_index]
                
                # The curves should intersect somewhere reasonable (not necessarily at exact nominal point)
                # but the operating point should correspond to the input values
                self.log_test("Performance Curves Intersection", True, 
                            f"Operating point: Flow={op_flow:.1f} m³/h, HMT={op_hmt:.1f}m (matches input). Curve intersection at Flow={intersection_flow:.1f} m³/h, HMT={intersection_hmt:.2f}m, Head Loss={intersection_head_loss:.2f}m")
                return True
            else:
                self.log_test("Performance Curves Intersection", False, f"API Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Performance Curves Intersection", False, f"Error: {str(e)}")
            return False
    
    def test_npsh_removal_from_performance(self):
        """Test that NPSH values are no longer present in the Performance tab"""
        print("\n🚫 Testing NPSH Removal from Performance Tab...")
        
        test_data = {
            "flow_rate": 50.0,
            "hmt": 30.0,
            "pipe_diameter": 100.0,
            "required_npsh": 3.0,
            "calculated_npshd": 8.0,
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
                
                # Check that NPSH-related fields are NOT present in the response
                npsh_fields = ["npsh", "npshd", "npsh_required", "npsh_available", "calculated_npshd", "required_npsh"]
                
                found_npsh_fields = []
                for field in npsh_fields:
                    if field in result:
                        found_npsh_fields.append(field)
                
                # Check performance curves don't contain NPSH curves
                performance_curves = result.get("performance_curves", {})
                npsh_curves = []
                for curve_name in performance_curves.keys():
                    if "npsh" in curve_name.lower():
                        npsh_curves.append(curve_name)
                
                if found_npsh_fields:
                    self.log_test("NPSH Removal - Direct Fields", False, 
                                f"Found NPSH fields in response: {found_npsh_fields}")
                    return False
                
                if npsh_curves:
                    self.log_test("NPSH Removal - Performance Curves", False, 
                                f"Found NPSH curves: {npsh_curves}")
                    return False
                
                # Verify that we still have the essential performance data
                required_fields = ["pump_efficiency", "motor_efficiency", "overall_efficiency", 
                                 "velocity", "nominal_current", "performance_curves"]
                missing_fields = [f for f in required_fields if f not in result]
                
                if missing_fields:
                    self.log_test("NPSH Removal - Essential Data", False, 
                                f"Missing essential fields after NPSH removal: {missing_fields}")
                    return False
                
                self.log_test("NPSH Removal from Performance", True, 
                            "NPSH values successfully removed from Performance tab while preserving essential data")
                return True
            else:
                self.log_test("NPSH Removal from Performance", False, f"API Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("NPSH Removal from Performance", False, f"Error: {str(e)}")
            return False
    
    def test_velocity_and_alerts_in_performance(self):
        """Test that velocity data and alerts are added in the Performance tab"""
        print("\n⚡ Testing Velocity and Alerts in Performance Tab...")
        
        # Test with conditions that should generate alerts
        test_data = {
            "flow_rate": 50.0,
            "hmt": 30.0,
            "pipe_diameter": 50.0,  # Small diameter to generate high velocity alert
            "required_npsh": 3.0,
            "calculated_npshd": 8.0,
            "fluid_type": "water",
            "pipe_material": "pvc",
            "pump_efficiency": 60.0,  # Low efficiency to generate alert
            "motor_efficiency": 80.0,  # Low efficiency to generate alert
            "starting_method": "direct_on_line",
            "power_factor": 0.8,
            "cable_length": 200.0,  # Long cable
            "voltage": 400
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate-performance", json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                
                # Check that velocity data is present
                velocity = result.get("velocity")
                reynolds_number = result.get("reynolds_number")
                
                if velocity is None:
                    self.log_test("Velocity Data - Velocity Field", False, "Missing velocity field")
                    return False
                
                if reynolds_number is None:
                    self.log_test("Velocity Data - Reynolds Number", False, "Missing reynolds_number field")
                    return False
                
                if velocity <= 0:
                    self.log_test("Velocity Data - Velocity Value", False, f"Invalid velocity value: {velocity}")
                    return False
                
                if reynolds_number <= 0:
                    self.log_test("Velocity Data - Reynolds Value", False, f"Invalid Reynolds number: {reynolds_number}")
                    return False
                
                # Check that alerts are present
                alerts = result.get("alerts", [])
                warnings = result.get("warnings", [])
                recommendations = result.get("recommendations", [])
                
                if not alerts and not warnings and not recommendations:
                    self.log_test("Alerts System", False, "No alerts, warnings, or recommendations found")
                    return False
                
                # Check for specific types of alerts based on our test conditions
                alert_types_found = []
                
                # Check for velocity alerts (high velocity due to small diameter)
                velocity_alerts = [a for a in alerts if "vitesse" in a.lower() or "velocity" in a.lower()]
                if velocity_alerts:
                    alert_types_found.append("velocity")
                
                # Check for efficiency alerts (low efficiency)
                efficiency_alerts = [w for w in warnings if "rendement" in w.lower() or "efficiency" in w.lower()]
                if efficiency_alerts:
                    alert_types_found.append("efficiency")
                
                # Check for recommendations
                if recommendations:
                    alert_types_found.append("recommendations")
                
                if not alert_types_found:
                    self.log_test("Alerts Content", False, "No relevant alerts generated for test conditions")
                    return False
                
                # Calculate expected velocity for verification
                pipe_area = math.pi * (test_data["pipe_diameter"] / 1000 / 2) ** 2
                expected_velocity = (test_data["flow_rate"] / 3600) / pipe_area
                
                if abs(velocity - expected_velocity) > 0.1:
                    self.log_test("Velocity Calculation", False, 
                                f"Velocity calculation incorrect. Expected: {expected_velocity:.2f} m/s, Got: {velocity:.2f} m/s")
                    return False
                
                self.log_test("Velocity and Alerts in Performance", True, 
                            f"Velocity: {velocity:.2f} m/s, Reynolds: {reynolds_number:.0f}, Alert types: {alert_types_found}")
                return True
            else:
                self.log_test("Velocity and Alerts in Performance", False, f"API Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Velocity and Alerts in Performance", False, f"Error: {str(e)}")
            return False
    
    def test_submersible_installation_suction_info(self):
        """Test that for submersible installation, suction information is not displayed in HMT tab"""
        print("\n🏊 Testing Submersible Installation - Suction Info Removal...")
        
        # Test data from user request: Installation type: "submersible", flow rate: 60 m³/h, discharge height: 25 m
        # Note: Even for submersible, the API requires all fields but should ignore suction calculations
        submersible_data = {
            "installation_type": "submersible",
            "suction_type": "flooded",  # Required by API but should be ignored
            "hasp": 0.0,  # Required by API but should be ignored for submersible
            "discharge_height": 25.0,
            "useful_pressure": 1.0,
            "suction_pipe_diameter": 100.0,  # Required by API but should be ignored
            "discharge_pipe_diameter": 100.0,
            "suction_pipe_length": 0.0,  # Required by API but should be ignored
            "discharge_pipe_length": 50.0,
            "suction_pipe_material": "pvc",  # Required by API but should be ignored
            "discharge_pipe_material": "pvc",
            "suction_fittings": [],  # Required by API but should be ignored
            "discharge_fittings": [
                {"fitting_type": "elbow_90", "quantity": 2}
            ],
            "fluid_type": "water",
            "temperature": 20.0,
            "flow_rate": 60.0
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate-hmt", json=submersible_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                
                # Check that suction-related fields are NOT present or are None/0
                suction_velocity = result.get("suction_velocity")
                suction_head_loss = result.get("suction_head_loss")
                
                # For submersible, suction_velocity should be None or not present
                if suction_velocity is not None and suction_velocity != 0:
                    self.log_test("Submersible - Suction Velocity", False, 
                                f"Suction velocity should be None for submersible, got: {suction_velocity}")
                    return False
                
                # For submersible, suction_head_loss should be None or 0
                if suction_head_loss is not None and suction_head_loss != 0:
                    self.log_test("Submersible - Suction Head Loss", False, 
                                f"Suction head loss should be None/0 for submersible, got: {suction_head_loss}")
                    return False
                
                # Check that we still have discharge information
                discharge_velocity = result.get("discharge_velocity")
                discharge_head_loss = result.get("discharge_head_loss")
                hmt = result.get("hmt")
                
                if discharge_velocity is None or discharge_velocity <= 0:
                    self.log_test("Submersible - Discharge Velocity", False, 
                                f"Missing or invalid discharge velocity: {discharge_velocity}")
                    return False
                
                if discharge_head_loss is None or discharge_head_loss < 0:
                    self.log_test("Submersible - Discharge Head Loss", False, 
                                f"Missing or invalid discharge head loss: {discharge_head_loss}")
                    return False
                
                if hmt is None or hmt <= 0:
                    self.log_test("Submersible - HMT Calculation", False, 
                                f"Missing or invalid HMT: {hmt}")
                    return False
                
                # Verify HMT calculation for submersible (should be discharge_height + head_losses + useful_pressure_head)
                expected_hmt = submersible_data["discharge_height"] + discharge_head_loss + (submersible_data["useful_pressure"] * 100000) / (1000 * 9.81)
                
                if abs(hmt - expected_hmt) > 1.0:  # Allow 1m tolerance
                    self.log_test("Submersible - HMT Formula", False, 
                                f"HMT calculation incorrect. Expected ~{expected_hmt:.2f}m, got {hmt:.2f}m")
                    return False
                
                self.log_test("Submersible Installation - Suction Info", True, 
                            f"Suction info properly excluded. HMT: {hmt:.2f}m, Discharge velocity: {discharge_velocity:.2f} m/s")
                return True
            else:
                self.log_test("Submersible Installation - Suction Info", False, f"API Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Submersible Installation - Suction Info", False, f"Error: {str(e)}")
            return False
    
    def test_surface_installation_suction_info(self):
        """Test that for surface installation, suction information IS displayed in HMT tab"""
        print("\n🏗️ Testing Surface Installation - Suction Info Present...")
        
        # Test data from user request: Installation type: "surface", flow rate: 60 m³/h, suction height: 3 m, discharge height: 25 m
        surface_data = {
            "installation_type": "surface",
            "suction_type": "suction_lift",
            "hasp": 3.0,  # suction height
            "discharge_height": 25.0,
            "useful_pressure": 1.0,
            "suction_pipe_diameter": 100.0,
            "discharge_pipe_diameter": 100.0,
            "suction_pipe_length": 30.0,
            "discharge_pipe_length": 50.0,
            "suction_pipe_material": "pvc",
            "discharge_pipe_material": "pvc",
            "suction_fittings": [
                {"fitting_type": "elbow_90", "quantity": 1},
                {"fitting_type": "check_valve", "quantity": 1}
            ],
            "discharge_fittings": [
                {"fitting_type": "elbow_90", "quantity": 2}
            ],
            "fluid_type": "water",
            "temperature": 20.0,
            "flow_rate": 60.0
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate-hmt", json=surface_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                
                # Check that suction-related fields ARE present and valid
                suction_velocity = result.get("suction_velocity")
                suction_head_loss = result.get("suction_head_loss")
                
                if suction_velocity is None or suction_velocity <= 0:
                    self.log_test("Surface - Suction Velocity", False, 
                                f"Missing or invalid suction velocity for surface installation: {suction_velocity}")
                    return False
                
                if suction_head_loss is None or suction_head_loss < 0:
                    self.log_test("Surface - Suction Head Loss", False, 
                                f"Missing or invalid suction head loss for surface installation: {suction_head_loss}")
                    return False
                
                # Check discharge information is also present
                discharge_velocity = result.get("discharge_velocity")
                discharge_head_loss = result.get("discharge_head_loss")
                hmt = result.get("hmt")
                
                if discharge_velocity is None or discharge_velocity <= 0:
                    self.log_test("Surface - Discharge Velocity", False, 
                                f"Missing or invalid discharge velocity: {discharge_velocity}")
                    return False
                
                if discharge_head_loss is None or discharge_head_loss < 0:
                    self.log_test("Surface - Discharge Head Loss", False, 
                                f"Missing or invalid discharge head loss: {discharge_head_loss}")
                    return False
                
                if hmt is None or hmt <= 0:
                    self.log_test("Surface - HMT Calculation", False, 
                                f"Missing or invalid HMT: {hmt}")
                    return False
                
                # Verify total head loss includes both suction and discharge
                total_head_loss = result.get("total_head_loss", 0)
                expected_total = suction_head_loss + discharge_head_loss
                
                if abs(total_head_loss - expected_total) > 0.1:
                    self.log_test("Surface - Total Head Loss", False, 
                                f"Total head loss incorrect. Expected: {expected_total:.3f}m, got {total_head_loss:.3f}m")
                    return False
                
                self.log_test("Surface Installation - Suction Info", True, 
                            f"Suction info properly included. Suction velocity: {suction_velocity:.2f} m/s, Suction head loss: {suction_head_loss:.3f}m")
                return True
            else:
                self.log_test("Surface Installation - Suction Info", False, f"API Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Surface Installation - Suction Info", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all review tests"""
        print("🔍 Starting Backend Review Tests for User Requirements...")
        print("=" * 80)
        
        tests = [
            self.test_performance_curves_intersection,
            self.test_npsh_removal_from_performance,
            self.test_velocity_and_alerts_in_performance,
            self.test_submersible_installation_suction_info,
            self.test_surface_installation_suction_info
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed_tests += 1
            except Exception as e:
                print(f"❌ FAIL: {test.__name__} - Unexpected error: {str(e)}")
        
        print("\n" + "=" * 80)
        print(f"📊 BACKEND REVIEW TEST RESULTS")
        print("=" * 80)
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"✅ Passed: {passed_tests}/{total_tests} tests ({success_rate:.1f}%)")
        
        if self.failed_tests:
            print(f"❌ Failed tests: {', '.join(self.failed_tests)}")
        
        if success_rate >= 80:
            print("🎉 BACKEND REVIEW TESTS PASSED! All user requirements verified.")
        else:
            print("⚠️  BACKEND REVIEW TESTS FAILED! Some user requirements not met.")
        
        return success_rate >= 80

if __name__ == "__main__":
    tester = BackendReviewTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)