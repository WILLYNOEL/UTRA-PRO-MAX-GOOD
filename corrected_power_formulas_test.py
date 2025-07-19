#!/usr/bin/env python3
"""
Comprehensive Testing for Corrected Power Formulas in Hydraulic Pump Calculation API
Focus on validating the corrected formulas:
- P2 = ((débit × HMT) / (rendement pompe × 367)) * 100
- P1 = (P2 / rendement moteur) * 100
"""

import requests
import json
import math
from datetime import datetime
import sys

# Backend URL from environment
BACKEND_URL = "https://667f55a2-4328-428f-9c85-4f54318d654a.preview.emergentagent.com/api"

class CorrectedPowerFormulasTester:
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
    
    def test_corrected_power_formula_p2(self):
        """Test P2 = ((débit × HMT) / (rendement pompe × 367)) * 100"""
        print("\n🔬 Testing Corrected P2 Formula: P2 = ((Q × H) / (η × 367)) * 100")
        
        test_cases = [
            {
                "name": "Standard Case (Q=50, H=30, η=80%)",
                "flow_rate": 50.0,  # m³/h
                "hmt": 30.0,  # m
                "pump_efficiency": 80.0,  # %
                "expected_p2": ((50.0 * 30.0) / (80.0 * 367)) * 100  # = 5.109 kW
            },
            {
                "name": "High Efficiency Case (Q=75, H=25, η=90%)",
                "flow_rate": 75.0,
                "hmt": 25.0,
                "pump_efficiency": 90.0,
                "expected_p2": ((75.0 * 25.0) / (90.0 * 367)) * 100  # = 5.681 kW
            },
            {
                "name": "Low Efficiency Case (Q=40, H=35, η=75%)",
                "flow_rate": 40.0,
                "hmt": 35.0,
                "pump_efficiency": 75.0,
                "expected_p2": ((40.0 * 35.0) / (75.0 * 367)) * 100  # = 5.086 kW
            },
            {
                "name": "Realistic Engineering Case (Q=100, H=20, η=85%)",
                "flow_rate": 100.0,
                "hmt": 20.0,
                "pump_efficiency": 85.0,
                "expected_p2": ((100.0 * 20.0) / (85.0 * 367)) * 100  # = 6.413 kW
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
                    power_calcs = result.get("power_calculations", {})
                    actual_p2 = power_calcs.get("hydraulic_power", 0)
                    expected_p2 = case["expected_p2"]
                    
                    # Allow 1% tolerance for floating point calculations
                    tolerance = expected_p2 * 0.01
                    if abs(actual_p2 - expected_p2) <= tolerance:
                        self.log_test(f"P2 Formula - {case['name']}", True, 
                                    f"Expected: {expected_p2:.3f} kW, Actual: {actual_p2:.3f} kW")
                    else:
                        self.log_test(f"P2 Formula - {case['name']}", False, 
                                    f"Expected: {expected_p2:.3f} kW, Actual: {actual_p2:.3f} kW, Diff: {abs(actual_p2 - expected_p2):.3f} kW")
                        all_passed = False
                else:
                    self.log_test(f"P2 Formula - {case['name']}", False, f"HTTP Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"P2 Formula - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_corrected_power_formula_p1(self):
        """Test P1 = (P2 / rendement moteur) * 100"""
        print("\n⚡ Testing Corrected P1 Formula: P1 = (P2 / rendement moteur) * 100")
        
        test_cases = [
            {
                "name": "Standard Motor Efficiency (90%)",
                "flow_rate": 50.0,
                "hmt": 30.0,
                "pump_efficiency": 80.0,
                "motor_efficiency": 90.0
            },
            {
                "name": "High Motor Efficiency (95%)",
                "flow_rate": 60.0,
                "hmt": 25.0,
                "pump_efficiency": 85.0,
                "motor_efficiency": 95.0
            },
            {
                "name": "Lower Motor Efficiency (85%)",
                "flow_rate": 45.0,
                "hmt": 35.0,
                "pump_efficiency": 75.0,
                "motor_efficiency": 85.0
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
            
            try:
                response = requests.post(f"{BACKEND_URL}/calculate-performance", json=test_data, timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    power_calcs = result.get("power_calculations", {})
                    actual_p2 = power_calcs.get("hydraulic_power", 0)
                    actual_p1 = power_calcs.get("absorbed_power", 0)
                    
                    # Calculate expected P1 using the corrected formula
                    expected_p1 = (actual_p2 / case["motor_efficiency"]) * 100
                    
                    # Allow 1% tolerance
                    tolerance = expected_p1 * 0.01
                    if abs(actual_p1 - expected_p1) <= tolerance:
                        self.log_test(f"P1 Formula - {case['name']}", True, 
                                    f"P2: {actual_p2:.3f} kW, P1: {actual_p1:.3f} kW, Expected P1: {expected_p1:.3f} kW")
                    else:
                        self.log_test(f"P1 Formula - {case['name']}", False, 
                                    f"P2: {actual_p2:.3f} kW, Actual P1: {actual_p1:.3f} kW, Expected P1: {expected_p1:.3f} kW")
                        all_passed = False
                    
                    # Verify P1 > P2 relationship
                    if actual_p1 <= actual_p2:
                        self.log_test(f"P1 > P2 Logic - {case['name']}", False, 
                                    f"P1 ({actual_p1:.3f}) should be > P2 ({actual_p2:.3f})")
                        all_passed = False
                    else:
                        self.log_test(f"P1 > P2 Logic - {case['name']}", True, 
                                    f"P1 ({actual_p1:.3f}) > P2 ({actual_p2:.3f}) ✓")
                else:
                    self.log_test(f"P1 Formula - {case['name']}", False, f"HTTP Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"P1 Formula - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_performance_curves_corrected_power(self):
        """Test that performance curves use corrected power formula: ((Q * H) / (η * 367)) * 100"""
        print("\n📈 Testing Performance Curves with Corrected Power Formula")
        
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
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate-performance", json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                performance_curves = result.get("performance_curves", {})
                
                # Check that we have all expected curve data
                required_curves = ["flow", "hmt", "efficiency", "power", "head_loss", "best_operating_point"]
                missing_curves = [curve for curve in required_curves if curve not in performance_curves]
                
                if missing_curves:
                    self.log_test("Performance Curves Structure", False, f"Missing curves: {missing_curves}")
                    return False
                
                flow_points = performance_curves["flow"]
                hmt_points = performance_curves["hmt"]
                efficiency_points = performance_curves["efficiency"]
                power_points = performance_curves["power"]
                
                # Verify we have enough data points
                if len(flow_points) < 10:
                    self.log_test("Performance Curves Data Points", False, f"Too few points: {len(flow_points)}")
                    return False
                
                # Test power calculation at a few specific points
                test_points = [0, len(flow_points)//4, len(flow_points)//2, 3*len(flow_points)//4]
                power_formula_correct = True
                
                for i in test_points:
                    if i < len(flow_points):
                        flow = flow_points[i]
                        hmt = hmt_points[i]
                        efficiency = efficiency_points[i]
                        actual_power = power_points[i]
                        
                        if flow > 0 and efficiency > 0:
                            # Calculate expected power using corrected formula
                            expected_power = ((flow * hmt) / (efficiency * 367)) * 100
                            
                            # Allow 5% tolerance for curve calculations
                            tolerance = max(expected_power * 0.05, 0.1)
                            if abs(actual_power - expected_power) > tolerance:
                                self.log_test(f"Power Curve Formula at Point {i}", False, 
                                            f"Flow: {flow:.1f}, HMT: {hmt:.1f}, Eff: {efficiency:.1f}%, "
                                            f"Expected Power: {expected_power:.3f}, Actual: {actual_power:.3f}")
                                power_formula_correct = False
                
                if power_formula_correct:
                    self.log_test("Performance Curves Power Formula", True, 
                                f"Power curve uses corrected formula across {len(test_points)} test points")
                
                # Test best operating point
                best_point = performance_curves.get("best_operating_point", {})
                if isinstance(best_point, dict):
                    best_flow = best_point.get("flow", 0)
                    best_hmt = best_point.get("hmt", 0)
                    best_efficiency = best_point.get("efficiency", 0)
                    best_power = best_point.get("power", 0)
                    
                    if best_flow > 0 and best_efficiency > 0:
                        expected_best_power = ((best_flow * best_hmt) / (best_efficiency * 367)) * 100
                        tolerance = expected_best_power * 0.02  # 2% tolerance
                        
                        if abs(best_power - expected_best_power) <= tolerance:
                            self.log_test("Best Operating Point Power Formula", True, 
                                        f"Best point power: {best_power:.3f} kW (expected: {expected_best_power:.3f} kW)")
                        else:
                            self.log_test("Best Operating Point Power Formula", False, 
                                        f"Best point power: {best_power:.3f} kW, expected: {expected_best_power:.3f} kW")
                            power_formula_correct = False
                    else:
                        self.log_test("Best Operating Point Data", False, "Invalid best operating point data")
                        power_formula_correct = False
                else:
                    self.log_test("Best Operating Point Structure", False, "Best operating point is not a dict")
                    power_formula_correct = False
                
                return power_formula_correct
            else:
                self.log_test("Performance Curves API", False, f"HTTP Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Performance Curves API", False, f"Error: {str(e)}")
            return False
    
    def test_realistic_power_values(self):
        """Test that power values are realistic for hydraulic pumps"""
        print("\n🔧 Testing Realistic Power Values for Engineering Applications")
        
        realistic_test_cases = [
            {
                "name": "Small Residential Pump",
                "flow_rate": 10.0,  # m³/h
                "hmt": 15.0,  # m
                "pump_efficiency": 70.0,
                "motor_efficiency": 85.0,
                "expected_range": (0.1, 2.0)  # kW range
            },
            {
                "name": "Medium Commercial Pump",
                "flow_rate": 50.0,
                "hmt": 30.0,
                "pump_efficiency": 80.0,
                "motor_efficiency": 90.0,
                "expected_range": (2.0, 8.0)
            },
            {
                "name": "Large Industrial Pump",
                "flow_rate": 200.0,
                "hmt": 50.0,
                "pump_efficiency": 85.0,
                "motor_efficiency": 95.0,
                "expected_range": (15.0, 40.0)
            },
            {
                "name": "High Head Pump",
                "flow_rate": 30.0,
                "hmt": 100.0,
                "pump_efficiency": 75.0,
                "motor_efficiency": 88.0,
                "expected_range": (8.0, 20.0)
            }
        ]
        
        all_passed = True
        for case in realistic_test_cases:
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
            
            try:
                response = requests.post(f"{BACKEND_URL}/calculate-performance", json=test_data, timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    power_calcs = result.get("power_calculations", {})
                    hydraulic_power = power_calcs.get("hydraulic_power", 0)
                    absorbed_power = power_calcs.get("absorbed_power", 0)
                    
                    min_expected, max_expected = case["expected_range"]
                    
                    # Check hydraulic power is in realistic range
                    if min_expected <= hydraulic_power <= max_expected:
                        self.log_test(f"Realistic P2 - {case['name']}", True, 
                                    f"P2: {hydraulic_power:.3f} kW (range: {min_expected}-{max_expected} kW)")
                    else:
                        self.log_test(f"Realistic P2 - {case['name']}", False, 
                                    f"P2: {hydraulic_power:.3f} kW outside expected range {min_expected}-{max_expected} kW")
                        all_passed = False
                    
                    # Check absorbed power is higher but reasonable
                    expected_p1_max = max_expected * 1.5  # Allow up to 50% higher for absorbed power
                    if hydraulic_power < absorbed_power <= expected_p1_max:
                        self.log_test(f"Realistic P1 - {case['name']}", True, 
                                    f"P1: {absorbed_power:.3f} kW (P2: {hydraulic_power:.3f} kW)")
                    else:
                        self.log_test(f"Realistic P1 - {case['name']}", False, 
                                    f"P1: {absorbed_power:.3f} kW seems unrealistic (P2: {hydraulic_power:.3f} kW)")
                        all_passed = False
                    
                    # Check efficiency relationship
                    overall_efficiency = (hydraulic_power / absorbed_power) * 100
                    expected_overall_eff = (case["pump_efficiency"] * case["motor_efficiency"]) / 100
                    
                    if abs(overall_efficiency - expected_overall_eff) <= 2:  # 2% tolerance
                        self.log_test(f"Overall Efficiency - {case['name']}", True, 
                                    f"Overall: {overall_efficiency:.1f}% (expected: {expected_overall_eff:.1f}%)")
                    else:
                        self.log_test(f"Overall Efficiency - {case['name']}", False, 
                                    f"Overall: {overall_efficiency:.1f}%, expected: {expected_overall_eff:.1f}%")
                        all_passed = False
                else:
                    self.log_test(f"Realistic Values - {case['name']}", False, f"HTTP Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Realistic Values - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_edge_cases_and_division_by_zero(self):
        """Test edge cases and ensure no division by zero errors"""
        print("\n⚠️  Testing Edge Cases and Division by Zero Prevention")
        
        edge_cases = [
            {
                "name": "Zero Flow Rate",
                "flow_rate": 0.0,
                "hmt": 30.0,
                "pump_efficiency": 80.0,
                "motor_efficiency": 90.0,
                "should_handle": True
            },
            {
                "name": "Zero HMT",
                "flow_rate": 50.0,
                "hmt": 0.0,
                "pump_efficiency": 80.0,
                "motor_efficiency": 90.0,
                "should_handle": True
            },
            {
                "name": "Very Low Pump Efficiency",
                "flow_rate": 50.0,
                "hmt": 30.0,
                "pump_efficiency": 1.0,  # Very low but not zero
                "motor_efficiency": 90.0,
                "should_handle": True
            },
            {
                "name": "Very Low Motor Efficiency",
                "flow_rate": 50.0,
                "hmt": 30.0,
                "pump_efficiency": 80.0,
                "motor_efficiency": 1.0,  # Very low but not zero
                "should_handle": True
            },
            {
                "name": "Very High Flow Rate",
                "flow_rate": 10000.0,  # Extremely high
                "hmt": 30.0,
                "pump_efficiency": 80.0,
                "motor_efficiency": 90.0,
                "should_handle": True
            }
        ]
        
        all_passed = True
        for case in edge_cases:
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
            
            try:
                response = requests.post(f"{BACKEND_URL}/calculate-performance", json=test_data, timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    power_calcs = result.get("power_calculations", {})
                    hydraulic_power = power_calcs.get("hydraulic_power", 0)
                    absorbed_power = power_calcs.get("absorbed_power", 0)
                    
                    # Check that we get finite numbers (no NaN, Infinity)
                    if math.isfinite(hydraulic_power) and math.isfinite(absorbed_power):
                        # Check that powers are non-negative
                        if hydraulic_power >= 0 and absorbed_power >= 0:
                            self.log_test(f"Edge Case - {case['name']}", True, 
                                        f"P2: {hydraulic_power:.3f} kW, P1: {absorbed_power:.3f} kW")
                        else:
                            self.log_test(f"Edge Case - {case['name']}", False, 
                                        f"Negative power values: P2: {hydraulic_power:.3f}, P1: {absorbed_power:.3f}")
                            all_passed = False
                    else:
                        self.log_test(f"Edge Case - {case['name']}", False, 
                                    f"Non-finite power values: P2: {hydraulic_power}, P1: {absorbed_power}")
                        all_passed = False
                elif case["should_handle"]:
                    self.log_test(f"Edge Case - {case['name']}", False, 
                                f"Should handle gracefully but got HTTP {response.status_code}")
                    all_passed = False
                else:
                    self.log_test(f"Edge Case - {case['name']}", True, 
                                f"Correctly rejected with HTTP {response.status_code}")
            except Exception as e:
                if case["should_handle"]:
                    self.log_test(f"Edge Case - {case['name']}", False, f"Exception: {str(e)}")
                    all_passed = False
                else:
                    self.log_test(f"Edge Case - {case['name']}", True, f"Correctly failed with exception")
        
        return all_passed
    
    def test_api_integration_corrected_formulas(self):
        """Test API integration with corrected formulas"""
        print("\n🔗 Testing API Integration with Corrected Formulas")
        
        # Test the /calculate-performance endpoint specifically
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
                
                # Check that all required sections are present
                required_sections = ["power_calculations", "performance_curves", "npsh_comparison", 
                                   "electrical_data", "recommendations", "warnings"]
                missing_sections = [section for section in required_sections if section not in result]
                
                if missing_sections:
                    self.log_test("API Integration - Response Structure", False, 
                                f"Missing sections: {missing_sections}")
                    return False
                
                # Check power calculations section
                power_calcs = result["power_calculations"]
                required_power_fields = ["hydraulic_power", "absorbed_power", "overall_efficiency"]
                missing_power_fields = [field for field in required_power_fields if field not in power_calcs]
                
                if missing_power_fields:
                    self.log_test("API Integration - Power Calculations", False, 
                                f"Missing power fields: {missing_power_fields}")
                    return False
                
                # Check performance curves section
                curves = result["performance_curves"]
                required_curve_fields = ["flow", "hmt", "efficiency", "power", "head_loss", "best_operating_point"]
                missing_curve_fields = [field for field in required_curve_fields if field not in curves]
                
                if missing_curve_fields:
                    self.log_test("API Integration - Performance Curves", False, 
                                f"Missing curve fields: {missing_curve_fields}")
                    return False
                
                # Verify that curves have data
                for curve_name in ["flow", "hmt", "efficiency", "power"]:
                    curve_data = curves.get(curve_name, [])
                    if not isinstance(curve_data, list) or len(curve_data) < 10:
                        self.log_test(f"API Integration - {curve_name.title()} Curve Data", False, 
                                    f"Insufficient data points: {len(curve_data) if isinstance(curve_data, list) else 'not a list'}")
                        return False
                
                self.log_test("API Integration - Complete Response", True, 
                            f"All sections present with proper data structure")
                return True
            else:
                self.log_test("API Integration", False, f"HTTP Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Integration", False, f"Error: {str(e)}")
            return False
    
    def run_all_corrected_formula_tests(self):
        """Run all corrected formula tests"""
        print("=" * 80)
        print("CORRECTED POWER FORMULAS TESTING - HYDRAULIC PUMP CALCULATION API")
        print("=" * 80)
        print("Testing the corrected formulas:")
        print("• P2 = ((débit × HMT) / (rendement pompe × 367)) * 100")
        print("• P1 = (P2 / rendement moteur) * 100")
        print("=" * 80)
        print()
        
        # Test API connectivity first
        try:
            response = requests.get(f"{BACKEND_URL}/", timeout=10)
            if response.status_code != 200:
                print("❌ API connectivity failed - aborting tests")
                return False
            print("✅ API connectivity confirmed")
        except Exception as e:
            print(f"❌ API connectivity failed: {str(e)}")
            return False
        
        print()
        
        # Run all corrected formula tests
        tests = [
            self.test_corrected_power_formula_p2,
            self.test_corrected_power_formula_p1,
            self.test_performance_curves_corrected_power,
            self.test_realistic_power_values,
            self.test_edge_cases_and_division_by_zero,
            self.test_api_integration_corrected_formulas
        ]
        
        for test in tests:
            print()
            test()
        
        # Summary
        print("\n" + "=" * 80)
        print("CORRECTED POWER FORMULAS TEST SUMMARY")
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
        
        if success_rate >= 95:
            print("\n🎉 EXCELLENT: Corrected power formulas are working perfectly!")
        elif success_rate >= 85:
            print("\n✅ GOOD: Corrected power formulas are working well with minor issues")
        elif success_rate >= 70:
            print("\n⚠️  MODERATE: Corrected power formulas have some issues that need attention")
        else:
            print("\n❌ CRITICAL: Corrected power formulas have major problems")
        
        return success_rate >= 85

if __name__ == "__main__":
    tester = CorrectedPowerFormulasTester()
    success = tester.run_all_corrected_formula_tests()
    sys.exit(0 if success else 1)