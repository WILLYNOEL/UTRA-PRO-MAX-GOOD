#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Hydraulic Pump Calculation API
Tests all engineering calculations, API endpoints, and edge cases
"""

import requests
import json
import math
from datetime import datetime
import sys

# Backend URL from environment
BACKEND_URL = "https://bc3e480f-b07d-4f4c-9965-462069354fb5.preview.emergentagent.com/api"

class HydraulicPumpTester:
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
    
    def test_fluids_api(self):
        """Test fluid properties API"""
        try:
            response = requests.get(f"{BACKEND_URL}/fluids", timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                # Check structure
                if "fluids" not in data:
                    self.log_test("Fluids API Structure", False, "Missing 'fluids' key")
                    return False
                
                fluids = data["fluids"]
                expected_fluids = ["water", "oil", "acid", "glycol"]
                
                # Check all expected fluids are present
                fluid_ids = [f["id"] for f in fluids]
                missing_fluids = [f for f in expected_fluids if f not in fluid_ids]
                
                if missing_fluids:
                    self.log_test("Fluids API Content", False, f"Missing fluids: {missing_fluids}")
                    return False
                
                # Check fluid structure
                for fluid in fluids:
                    if "id" not in fluid or "name" not in fluid:
                        self.log_test("Fluids API Structure", False, f"Invalid fluid structure: {fluid}")
                        return False
                
                self.log_test("Fluids API", True, f"Found {len(fluids)} fluids: {fluid_ids}")
                return True
            else:
                self.log_test("Fluids API", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Fluids API", False, f"Error: {str(e)}")
            return False
    
    def test_standard_water_calculation(self):
        """Test standard water calculation (flow=50 m³/h, suction=3m, diameter=100mm, length=50m)"""
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
                
                # Validate key calculations
                errors = []
                
                # Check velocity calculation (Q/A = flow_rate/(π*d²/4))
                expected_velocity = (50/3600) / (math.pi * (0.1/2)**2)  # ~1.77 m/s
                actual_velocity = result.get("flow_velocity", 0)
                if abs(actual_velocity - expected_velocity) > 0.1:
                    errors.append(f"Velocity: expected ~{expected_velocity:.2f}, got {actual_velocity:.2f}")
                
                # Check Reynolds number (ρ*v*d/μ)
                density = 1000  # water at 20°C
                viscosity = 0.001  # water at 20°C
                expected_reynolds = (density * actual_velocity * 0.1) / viscosity
                actual_reynolds = result.get("reynolds_number", 0)
                if abs(actual_reynolds - expected_reynolds) > 1000:
                    errors.append(f"Reynolds: expected ~{expected_reynolds:.0f}, got {actual_reynolds:.0f}")
                
                # Check that we have all required fields
                required_fields = [
                    "flow_velocity", "reynolds_number", "friction_factor",
                    "linear_pressure_loss", "total_pressure_loss", "hmt_meters", "hmt_bar",
                    "npsh_required", "npsh_available_calc", "cavitation_risk",
                    "hydraulic_power", "absorbed_power", "total_efficiency",
                    "nominal_current", "cable_section", "starting_method"
                ]
                
                for field in required_fields:
                    if field not in result:
                        errors.append(f"Missing field: {field}")
                
                # Check power calculation reasonableness
                hydraulic_power = result.get("hydraulic_power", 0)
                if hydraulic_power <= 0 or hydraulic_power > 100:
                    errors.append(f"Hydraulic power seems unreasonable: {hydraulic_power} kW")
                
                if errors:
                    self.log_test("Standard Water Calculation", False, "; ".join(errors))
                    return False
                else:
                    self.log_test("Standard Water Calculation", True, 
                                f"Velocity: {actual_velocity:.2f} m/s, Power: {hydraulic_power:.2f} kW")
                    return True
            else:
                self.log_test("Standard Water Calculation", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Standard Water Calculation", False, f"Error: {str(e)}")
            return False
    
    def test_oil_calculation_high_temp(self):
        """Test oil calculation with different temperature (30°C)"""
        test_data = {
            "flow_rate": 30.0,
            "suction_height": 2.0,
            "pipe_diameter": 80.0,
            "pipe_length": 100.0,
            "fluid_type": "oil",
            "temperature": 30.0,
            "pump_efficiency": 70.0,
            "motor_efficiency": 88.0,
            "voltage": 230,
            "cable_length": 75.0
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate", json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                
                # Check that fluid properties are temperature-adjusted
                fluid_props = result.get("fluid_properties", {})
                if fluid_props.get("name") != "Hydraulic Oil":
                    self.log_test("Oil Calculation - Temperature", False, "Wrong fluid name")
                    return False
                
                # Oil density should be temperature-adjusted (lower at higher temp)
                density = fluid_props.get("density", 0)
                if density <= 0 or density > 900:  # Should be less than base 850 at 30°C
                    self.log_test("Oil Calculation - Temperature", False, f"Unreasonable density: {density}")
                    return False
                
                # Check 230V electrical calculations
                voltage_used = result["input_data"]["voltage"]
                if voltage_used != 230:
                    self.log_test("Oil Calculation - Temperature", False, "Voltage not preserved")
                    return False
                
                self.log_test("Oil Calculation - Temperature", True, 
                            f"Oil density at 30°C: {density:.1f} kg/m³")
                return True
            else:
                self.log_test("Oil Calculation - Temperature", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Oil Calculation - Temperature", False, f"Error: {str(e)}")
            return False
    
    def test_edge_cases(self):
        """Test edge cases: very low flow, very high flow, negative suction height"""
        edge_cases = [
            {
                "name": "Very Low Flow",
                "data": {
                    "flow_rate": 1.0,  # Very low
                    "suction_height": 1.0,
                    "pipe_diameter": 50.0,
                    "pipe_length": 20.0,
                    "fluid_type": "water",
                    "temperature": 20.0
                }
            },
            {
                "name": "Very High Flow", 
                "data": {
                    "flow_rate": 500.0,  # Very high
                    "suction_height": 5.0,
                    "pipe_diameter": 200.0,
                    "pipe_length": 100.0,
                    "fluid_type": "water",
                    "temperature": 20.0
                }
            },
            {
                "name": "Negative Suction (Flooded)",
                "data": {
                    "flow_rate": 50.0,
                    "suction_height": -2.0,  # Flooded suction
                    "pipe_diameter": 100.0,
                    "pipe_length": 50.0,
                    "fluid_type": "water",
                    "temperature": 20.0
                }
            }
        ]
        
        all_passed = True
        for case in edge_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/calculate", json=case["data"], timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    # Just check that we get reasonable results
                    if result.get("flow_velocity", 0) <= 0:
                        self.log_test(f"Edge Case - {case['name']}", False, "Zero or negative velocity")
                        all_passed = False
                    else:
                        self.log_test(f"Edge Case - {case['name']}", True, 
                                    f"Velocity: {result['flow_velocity']:.2f} m/s")
                else:
                    self.log_test(f"Edge Case - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Edge Case - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_npsh_cavitation_warnings(self):
        """Test NPSH calculations and cavitation warnings"""
        # Create a scenario likely to cause cavitation
        test_data = {
            "flow_rate": 100.0,  # High flow
            "suction_height": 8.0,  # High suction lift
            "pipe_diameter": 80.0,  # Smaller diameter
            "pipe_length": 100.0,  # Long pipe
            "fluid_type": "water",
            "temperature": 80.0,  # High temperature (higher vapor pressure)
            "npsh_available": 2.0  # Low NPSH available
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate", json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                
                # Check NPSH calculations
                npsh_required = result.get("npsh_required", 0)
                npsh_available = result.get("npsh_available_calc", 0)
                cavitation_risk = result.get("cavitation_risk", False)
                warnings = result.get("warnings", [])
                
                if npsh_required <= 0:
                    self.log_test("NPSH Calculations", False, "NPSH required is zero or negative")
                    return False
                
                # Check cavitation logic
                if npsh_available <= npsh_required and not cavitation_risk:
                    self.log_test("NPSH Cavitation Logic", False, "Should detect cavitation risk")
                    return False
                
                # Check for cavitation warning in warnings list
                cavitation_warning_found = any("CAVITATION" in w.upper() for w in warnings)
                if cavitation_risk and not cavitation_warning_found:
                    self.log_test("NPSH Cavitation Warnings", False, "Missing cavitation warning message")
                    return False
                
                self.log_test("NPSH Calculations", True, 
                            f"NPSHr: {npsh_required:.2f}m, NPSHa: {npsh_available:.2f}m, Risk: {cavitation_risk}")
                return True
            else:
                self.log_test("NPSH Calculations", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("NPSH Calculations", False, f"Error: {str(e)}")
            return False
    
    def test_power_and_electrical_calculations(self):
        """Test power calculations and electrical parameters"""
        test_data = {
            "flow_rate": 75.0,
            "suction_height": 4.0,
            "pipe_diameter": 125.0,
            "pipe_length": 80.0,
            "fluid_type": "water",
            "temperature": 20.0,
            "pump_efficiency": 80.0,
            "motor_efficiency": 92.0,
            "voltage": 400,
            "cable_length": 100.0
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate", json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                
                # Check power calculations
                hydraulic_power = result.get("hydraulic_power", 0)
                absorbed_power = result.get("absorbed_power", 0)
                total_efficiency = result.get("total_efficiency", 0)
                
                # Hydraulic power should be positive
                if hydraulic_power <= 0:
                    self.log_test("Power Calculations", False, "Hydraulic power is zero or negative")
                    return False
                
                # Absorbed power should be higher than hydraulic power
                if absorbed_power <= hydraulic_power:
                    self.log_test("Power Calculations", False, "Absorbed power should be higher than hydraulic power")
                    return False
                
                # Check efficiency calculation
                expected_efficiency = (80 * 92) / 100  # pump_eff * motor_eff / 100
                if abs(total_efficiency - expected_efficiency) > 1:
                    self.log_test("Power Calculations", False, f"Efficiency: expected {expected_efficiency}%, got {total_efficiency}%")
                    return False
                
                # Check electrical calculations
                nominal_current = result.get("nominal_current", 0)
                cable_section = result.get("cable_section", 0)
                starting_method = result.get("starting_method", "")
                
                if nominal_current <= 0:
                    self.log_test("Electrical Calculations", False, "Current is zero or negative")
                    return False
                
                if cable_section <= 0:
                    self.log_test("Electrical Calculations", False, "Cable section is zero or negative")
                    return False
                
                if not starting_method:
                    self.log_test("Electrical Calculations", False, "Missing starting method")
                    return False
                
                self.log_test("Power and Electrical Calculations", True, 
                            f"Power: {hydraulic_power:.2f}/{absorbed_power:.2f} kW, Current: {nominal_current:.1f}A, Cable: {cable_section}mm²")
                return True
            else:
                self.log_test("Power and Electrical Calculations", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Power and Electrical Calculations", False, f"Error: {str(e)}")
            return False
    
    def test_history_management(self):
        """Test save/load/delete operations with calculation results"""
        # First, perform a calculation to save
        calc_data = {
            "flow_rate": 40.0,
            "suction_height": 2.5,
            "pipe_diameter": 90.0,
            "pipe_length": 60.0,
            "fluid_type": "water",
            "temperature": 20.0
        }
        
        try:
            # Get calculation result
            calc_response = requests.post(f"{BACKEND_URL}/calculate", json=calc_data, timeout=10)
            if calc_response.status_code != 200:
                self.log_test("History Management - Calculation", False, "Failed to get calculation for history test")
                return False
            
            calc_result = calc_response.json()
            
            # Save calculation to history
            history_data = {
                "project_name": f"Test Project {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "calculation_result": calc_result
            }
            
            save_response = requests.post(f"{BACKEND_URL}/save-calculation", json=history_data, timeout=10)
            if save_response.status_code != 200:
                self.log_test("History Management - Save", False, f"Save failed: {save_response.status_code}")
                return False
            
            saved_item = save_response.json()
            saved_id = saved_item.get("id")
            
            if not saved_id:
                self.log_test("History Management - Save", False, "No ID returned from save")
                return False
            
            # Load history
            history_response = requests.get(f"{BACKEND_URL}/history", timeout=10)
            if history_response.status_code != 200:
                self.log_test("History Management - Load", False, f"Load failed: {history_response.status_code}")
                return False
            
            history_list = history_response.json()
            if not isinstance(history_list, list):
                self.log_test("History Management - Load", False, "History response is not a list")
                return False
            
            # Find our saved item
            found_item = None
            for item in history_list:
                if item.get("id") == saved_id:
                    found_item = item
                    break
            
            if not found_item:
                self.log_test("History Management - Load", False, "Saved item not found in history")
                return False
            
            # Delete the item
            delete_response = requests.delete(f"{BACKEND_URL}/history/{saved_id}", timeout=10)
            if delete_response.status_code != 200:
                self.log_test("History Management - Delete", False, f"Delete failed: {delete_response.status_code}")
                return False
            
            # Verify deletion
            verify_response = requests.get(f"{BACKEND_URL}/history", timeout=10)
            if verify_response.status_code == 200:
                updated_history = verify_response.json()
                still_exists = any(item.get("id") == saved_id for item in updated_history)
                if still_exists:
                    self.log_test("History Management - Delete Verification", False, "Item still exists after deletion")
                    return False
            
            self.log_test("History Management", True, f"Save/Load/Delete cycle completed successfully")
            return True
            
        except Exception as e:
            self.log_test("History Management", False, f"Error: {str(e)}")
            return False
    
    def test_error_handling(self):
        """Test invalid inputs, missing fields, wrong fluid types"""
        error_cases = [
            {
                "name": "Invalid Fluid Type",
                "data": {
                    "flow_rate": 50.0,
                    "suction_height": 3.0,
                    "pipe_diameter": 100.0,
                    "pipe_length": 50.0,
                    "fluid_type": "invalid_fluid",
                    "temperature": 20.0
                },
                "should_fail": True
            },
            {
                "name": "Missing Required Field",
                "data": {
                    "suction_height": 3.0,
                    "pipe_diameter": 100.0,
                    "pipe_length": 50.0,
                    "fluid_type": "water",
                    "temperature": 20.0
                    # Missing flow_rate
                },
                "should_fail": True
            },
            {
                "name": "Negative Flow Rate",
                "data": {
                    "flow_rate": -10.0,
                    "suction_height": 3.0,
                    "pipe_diameter": 100.0,
                    "pipe_length": 50.0,
                    "fluid_type": "water",
                    "temperature": 20.0
                },
                "should_fail": False  # Should handle gracefully
            },
            {
                "name": "Zero Diameter",
                "data": {
                    "flow_rate": 50.0,
                    "suction_height": 3.0,
                    "pipe_diameter": 0.0,
                    "pipe_length": 50.0,
                    "fluid_type": "water",
                    "temperature": 20.0
                },
                "should_fail": True  # Should fail - division by zero
            }
        ]
        
        all_passed = True
        for case in error_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/calculate", json=case["data"], timeout=10)
                
                if case["should_fail"]:
                    if response.status_code == 200:
                        self.log_test(f"Error Handling - {case['name']}", False, "Should have failed but didn't")
                        all_passed = False
                    else:
                        self.log_test(f"Error Handling - {case['name']}", True, f"Correctly failed with status {response.status_code}")
                else:
                    if response.status_code != 200:
                        self.log_test(f"Error Handling - {case['name']}", False, f"Should have succeeded but failed with status {response.status_code}")
                        all_passed = False
                    else:
                        self.log_test(f"Error Handling - {case['name']}", True, "Handled gracefully")
                        
            except Exception as e:
                if case["should_fail"]:
                    self.log_test(f"Error Handling - {case['name']}", True, f"Correctly failed with exception")
                else:
                    self.log_test(f"Error Handling - {case['name']}", False, f"Unexpected exception: {str(e)}")
                    all_passed = False
        
        return all_passed
    
    def test_updated_npshd_formula(self):
        """Test the updated NPSHd formula: NPSHd = Patm - ρ*g*H_aspiration - Pertes de charges totales - Pression de vapeur saturante"""
        print("\n🔬 Testing Updated NPSHd Formula...")
        
        test_cases = [
            {
                "name": "Water Flooded Suction",
                "data": {
                    "suction_type": "flooded",
                    "hasp": 2.0,  # 2m flooded (positive value)
                    "flow_rate": 50.0,
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "pipe_diameter": 100.0,
                    "pipe_material": "pvc",
                    "pipe_length": 30.0,
                    "suction_fittings": [
                        {"fitting_type": "elbow_90", "quantity": 2},
                        {"fitting_type": "entrance_sharp", "quantity": 1}
                    ]
                }
            },
            {
                "name": "Water Suction Lift",
                "data": {
                    "suction_type": "suction_lift",
                    "hasp": 3.0,  # 3m suction lift
                    "flow_rate": 40.0,
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "pipe_diameter": 100.0,
                    "pipe_material": "pvc",
                    "pipe_length": 50.0,
                    "suction_fittings": [
                        {"fitting_type": "elbow_90", "quantity": 1},
                        {"fitting_type": "check_valve", "quantity": 1}
                    ]
                }
            },
            {
                "name": "Oil High Temperature",
                "data": {
                    "suction_type": "flooded",
                    "hasp": 1.5,
                    "flow_rate": 30.0,
                    "fluid_type": "oil",
                    "temperature": 60.0,  # High temperature
                    "pipe_diameter": 80.0,
                    "pipe_material": "steel",
                    "pipe_length": 40.0,
                    "suction_fittings": []
                }
            },
            {
                "name": "Acid Solution",
                "data": {
                    "suction_type": "suction_lift",
                    "hasp": 2.5,
                    "flow_rate": 25.0,
                    "fluid_type": "acid",
                    "temperature": 25.0,
                    "pipe_diameter": 75.0,
                    "pipe_material": "pvc",
                    "pipe_length": 35.0,
                    "suction_fittings": [
                        {"fitting_type": "elbow_45", "quantity": 1}
                    ]
                }
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=case["data"], timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    
                    # Verify formula components
                    atmospheric_pressure = result.get("atmospheric_pressure", 0)
                    npshd = result.get("npshd", 0)
                    total_head_loss = result.get("total_head_loss", 0)
                    fluid_props = result.get("fluid_properties", {})
                    
                    # Check atmospheric pressure is constant at 101325 Pa
                    if abs(atmospheric_pressure - 101325) > 1:
                        self.log_test(f"NPSHd Formula - {case['name']} - Atmospheric Pressure", False, 
                                    f"Expected 101325 Pa, got {atmospheric_pressure} Pa")
                        all_passed = False
                        continue
                    
                    # Verify NPSHd calculation makes sense
                    if case["data"]["suction_type"] == "flooded":
                        # For flooded suction, NPSHd should be higher
                        if npshd < 5:  # Should be reasonably high for flooded
                            self.log_test(f"NPSHd Formula - {case['name']}", False, 
                                        f"NPSHd too low for flooded suction: {npshd:.2f} m")
                            all_passed = False
                            continue
                    else:  # suction_lift
                        # For suction lift, NPSHd should be lower
                        if npshd < 0:
                            # This might be acceptable for high suction lift
                            warnings = result.get("warnings", [])
                            if not any("NPSHd négatif" in w for w in warnings):
                                self.log_test(f"NPSHd Formula - {case['name']}", False, 
                                            "Missing warning for negative NPSHd")
                                all_passed = False
                                continue
                    
                    # Check that all required fields are present
                    required_fields = ["velocity", "reynolds_number", "friction_factor", 
                                     "linear_head_loss", "singular_head_loss", "total_head_loss", "npshd"]
                    missing_fields = [f for f in required_fields if f not in result]
                    if missing_fields:
                        self.log_test(f"NPSHd Formula - {case['name']}", False, 
                                    f"Missing fields: {missing_fields}")
                        all_passed = False
                        continue
                    
                    self.log_test(f"NPSHd Formula - {case['name']}", True, 
                                f"NPSHd: {npshd:.2f} m, Head Loss: {total_head_loss:.2f} m, Fluid: {fluid_props.get('name', 'Unknown')}")
                else:
                    self.log_test(f"NPSHd Formula - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"NPSHd Formula - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_updated_power_formulas(self):
        """Test the updated power formulas: P2 = (débit × HMT) / (rendement pompe × 367) and P1 = P2 / rendement moteur"""
        print("\n⚡ Testing Updated Power Formulas...")
        
        test_cases = [
            {
                "name": "Standard Water Pump",
                "data": {
                    "flow_rate": 50.0,  # m³/h
                    "hmt": 25.0,  # m
                    "pipe_diameter": 100.0,
                    "required_npsh": 3.0,
                    "calculated_npshd": 8.0,
                    "fluid_type": "water",
                    "pipe_material": "pvc",
                    "pump_efficiency": 75.0,  # %
                    "motor_efficiency": 90.0,  # %
                    "starting_method": "star_delta",
                    "power_factor": 0.8,
                    "cable_length": 50.0,
                    "voltage": 400
                }
            },
            {
                "name": "High Efficiency Pump",
                "data": {
                    "flow_rate": 100.0,
                    "hmt": 40.0,
                    "pipe_diameter": 150.0,
                    "required_npsh": 4.0,
                    "calculated_npshd": 10.0,
                    "fluid_type": "water",
                    "pipe_material": "pvc",
                    "pump_efficiency": 85.0,  # High efficiency
                    "motor_efficiency": 95.0,  # High efficiency
                    "starting_method": "direct_on_line",
                    "power_factor": 0.85,
                    "cable_length": 75.0,
                    "voltage": 400
                }
            },
            {
                "name": "Oil Pump with Provided Powers",
                "data": {
                    "flow_rate": 30.0,
                    "hmt": 35.0,
                    "pipe_diameter": 80.0,
                    "required_npsh": 2.5,
                    "calculated_npshd": 6.0,
                    "fluid_type": "oil",
                    "pipe_material": "steel",
                    "pump_efficiency": 70.0,
                    "motor_efficiency": 88.0,
                    "hydraulic_power": 3.5,  # Provided value
                    "absorbed_power": 5.5,   # Provided value
                    "starting_method": "star_delta",
                    "power_factor": 0.8,
                    "cable_length": 100.0,
                    "voltage": 230
                }
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/calculate-performance", json=case["data"], timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    
                    power_calcs = result.get("power_calculations", {})
                    hydraulic_power = power_calcs.get("hydraulic_power", 0)
                    absorbed_power = power_calcs.get("absorbed_power", 0)
                    
                    # Test the power formulas
                    flow_rate = case["data"]["flow_rate"]
                    hmt = case["data"]["hmt"]
                    pump_eff = case["data"]["pump_efficiency"]
                    motor_eff = case["data"]["motor_efficiency"]
                    
                    if "hydraulic_power" not in case["data"]:
                        # Calculate expected hydraulic power: P2 = (débit × HMT) / (rendement pompe × 367)
                        expected_p2 = (flow_rate * hmt) / (pump_eff * 367)
                        
                        if abs(hydraulic_power - expected_p2) > 0.1:
                            self.log_test(f"Power Formula P2 - {case['name']}", False, 
                                        f"Expected P2: {expected_p2:.3f} kW, got {hydraulic_power:.3f} kW")
                            all_passed = False
                            continue
                    
                    if "absorbed_power" not in case["data"]:
                        # Calculate expected absorbed power: P1 = P2 / rendement moteur
                        expected_p1 = hydraulic_power / (motor_eff / 100)
                        
                        if abs(absorbed_power - expected_p1) > 0.1:
                            self.log_test(f"Power Formula P1 - {case['name']}", False, 
                                        f"Expected P1: {expected_p1:.3f} kW, got {absorbed_power:.3f} kW")
                            all_passed = False
                            continue
                    
                    # Check that absorbed power > hydraulic power
                    if absorbed_power <= hydraulic_power:
                        self.log_test(f"Power Logic - {case['name']}", False, 
                                    f"Absorbed power ({absorbed_power:.3f}) should be > hydraulic power ({hydraulic_power:.3f})")
                        all_passed = False
                        continue
                    
                    # Check electrical calculations
                    nominal_current = result.get("nominal_current", 0)
                    voltage = case["data"]["voltage"]
                    power_factor = case["data"]["power_factor"]
                    
                    if voltage == 230:
                        # Single phase: I = P / (V * cos φ)
                        expected_current = (absorbed_power * 1000) / (voltage * power_factor)
                    else:
                        # Three phase: I = P / (V * √3 * cos φ)
                        expected_current = (absorbed_power * 1000) / (voltage * 1.732 * power_factor)
                    
                    if abs(nominal_current - expected_current) > 0.5:
                        self.log_test(f"Current Calculation - {case['name']}", False, 
                                    f"Expected current: {expected_current:.2f} A, got {nominal_current:.2f} A")
                        all_passed = False
                        continue
                    
                    self.log_test(f"Power Formulas - {case['name']}", True, 
                                f"P2: {hydraulic_power:.3f} kW, P1: {absorbed_power:.3f} kW, I: {nominal_current:.2f} A")
                else:
                    self.log_test(f"Power Formulas - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Power Formulas - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_performance_curves_flow_vs_hmt(self):
        """Test that performance curves return only flow vs HMT data"""
        print("\n📈 Testing Performance Curves (Flow vs HMT)...")
        
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
                
                # Check that we have flow and hmt data
                if "flow" not in performance_curves or "hmt" not in performance_curves:
                    self.log_test("Performance Curves Structure", False, "Missing flow or hmt data")
                    return False
                
                flow_points = performance_curves["flow"]
                hmt_points = performance_curves["hmt"]
                
                # Check that both arrays have the same length
                if len(flow_points) != len(hmt_points):
                    self.log_test("Performance Curves Data", False, 
                                f"Flow points ({len(flow_points)}) != HMT points ({len(hmt_points)})")
                    return False
                
                # Check that we have reasonable number of points
                if len(flow_points) < 10:
                    self.log_test("Performance Curves Points", False, f"Too few points: {len(flow_points)}")
                    return False
                
                # Check curve characteristics (typical pump curve)
                base_flow = test_data["flow_rate"]
                base_hmt = test_data["hmt"]
                
                # Find points at 0%, 100%, and 150% flow
                zero_flow_hmt = hmt_points[0] if flow_points[0] == 0 else None
                nominal_hmt = None
                max_flow_hmt = hmt_points[-1] if len(hmt_points) > 0 else None
                
                # Find nominal point (closest to base flow)
                for i, flow in enumerate(flow_points):
                    if abs(flow - base_flow) < 1:
                        nominal_hmt = hmt_points[i]
                        break
                
                # Check typical pump curve behavior
                if zero_flow_hmt and nominal_hmt:
                    if zero_flow_hmt <= nominal_hmt:
                        self.log_test("Performance Curves Behavior", False, 
                                    f"Shut-off head ({zero_flow_hmt:.1f}) should be > nominal HMT ({nominal_hmt:.1f})")
                        return False
                
                # Check that HMT generally decreases with increasing flow
                decreasing_trend = True
                for i in range(1, len(hmt_points)):
                    if hmt_points[i] > hmt_points[i-1] + 1:  # Allow small variations
                        decreasing_trend = False
                        break
                
                if not decreasing_trend:
                    self.log_test("Performance Curves Trend", False, "HMT should generally decrease with increasing flow")
                    return False
                
                # Check that we don't have other curve types (efficiency, power, etc.)
                unexpected_keys = [k for k in performance_curves.keys() if k not in ["flow", "hmt"]]
                if unexpected_keys:
                    self.log_test("Performance Curves Content", False, 
                                f"Should only have flow and hmt, found: {unexpected_keys}")
                    return False
                
                self.log_test("Performance Curves", True, 
                            f"Generated {len(flow_points)} points, Shut-off: {zero_flow_hmt:.1f}m, Nominal: {nominal_hmt:.1f}m")
                return True
            else:
                self.log_test("Performance Curves", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Performance Curves", False, f"Error: {str(e)}")
            return False
    
    def test_api_endpoints_comprehensive(self):
        """Test all API endpoints with the new formulas"""
        print("\n🔗 Testing All API Endpoints...")
        
        endpoints_passed = 0
        total_endpoints = 0
        
        # Test /calculate-npshd endpoint
        total_endpoints += 1
        npshd_data = {
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
            response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=npshd_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                if "npshd" in result and "atmospheric_pressure" in result:
                    self.log_test("API Endpoint - /calculate-npshd", True, f"NPSHd: {result['npshd']:.2f} m")
                    endpoints_passed += 1
                else:
                    self.log_test("API Endpoint - /calculate-npshd", False, "Missing required fields")
            else:
                self.log_test("API Endpoint - /calculate-npshd", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("API Endpoint - /calculate-npshd", False, f"Error: {str(e)}")
        
        # Test /calculate-hmt endpoint
        total_endpoints += 1
        hmt_data = {
            "installation_type": "surface",
            "suction_type": "flooded",
            "hasp": 2.0,
            "discharge_height": 15.0,
            "useful_pressure": 2.0,
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
            response = requests.post(f"{BACKEND_URL}/calculate-hmt", json=hmt_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                if "hmt" in result and "total_head_loss" in result:
                    self.log_test("API Endpoint - /calculate-hmt", True, f"HMT: {result['hmt']:.2f} m")
                    endpoints_passed += 1
                else:
                    self.log_test("API Endpoint - /calculate-hmt", False, "Missing required fields")
            else:
                self.log_test("API Endpoint - /calculate-hmt", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("API Endpoint - /calculate-hmt", False, f"Error: {str(e)}")
        
        # Test /calculate-performance endpoint
        total_endpoints += 1
        perf_data = {
            "flow_rate": 50.0,
            "hmt": 25.0,
            "pipe_diameter": 100.0,
            "required_npsh": 3.0,
            "calculated_npshd": 8.0,
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
            response = requests.post(f"{BACKEND_URL}/calculate-performance", json=perf_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                if "power_calculations" in result and "performance_curves" in result:
                    power_calcs = result["power_calculations"]
                    self.log_test("API Endpoint - /calculate-performance", True, 
                                f"P2: {power_calcs.get('hydraulic_power', 0):.3f} kW")
                    endpoints_passed += 1
                else:
                    self.log_test("API Endpoint - /calculate-performance", False, "Missing required fields")
            else:
                self.log_test("API Endpoint - /calculate-performance", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("API Endpoint - /calculate-performance", False, f"Error: {str(e)}")
        
        # Test legacy /calculate endpoint (should still work)
        total_endpoints += 1
        legacy_data = {
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
            response = requests.post(f"{BACKEND_URL}/calculate", json=legacy_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                if "hydraulic_power" in result and "absorbed_power" in result:
                    self.log_test("API Endpoint - /calculate (legacy)", True, "Legacy endpoint working")
                    endpoints_passed += 1
                else:
                    self.log_test("API Endpoint - /calculate (legacy)", False, "Missing required fields")
            else:
                self.log_test("API Endpoint - /calculate (legacy)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("API Endpoint - /calculate (legacy)", False, f"Error: {str(e)}")
        
        success_rate = (endpoints_passed / total_endpoints) * 100 if total_endpoints > 0 else 0
        overall_passed = success_rate >= 75
        
        self.log_test("API Endpoints Overall", overall_passed, 
                    f"{endpoints_passed}/{total_endpoints} endpoints working ({success_rate:.1f}%)")
        
        return overall_passed

    def run_all_tests(self):
        """Run all tests including the new formula tests"""
        print("=" * 80)
        print("HYDRAULIC PUMP CALCULATION API - UPDATED FORMULAS TESTING")
        print("=" * 80)
        print()
        
        # Test connectivity first
        if not self.test_api_connectivity():
            print("\n❌ API connectivity failed - aborting remaining tests")
            return False
        
        print()
        
        # Run all tests - prioritizing new formula tests
        tests = [
            self.test_fluids_api,
            self.test_updated_npshd_formula,  # NEW: Test updated NPSHd formula
            self.test_updated_power_formulas,  # NEW: Test updated power formulas
            self.test_performance_curves_flow_vs_hmt,  # NEW: Test performance curves
            self.test_api_endpoints_comprehensive,  # NEW: Test all endpoints
            self.test_standard_water_calculation,
            self.test_oil_calculation_high_temp,
            self.test_edge_cases,
            self.test_npsh_cavitation_warnings,
            self.test_power_and_electrical_calculations,
            self.test_history_management,
            self.test_error_handling
        ]
        
        for test in tests:
            print()
            test()
        
        # Summary
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
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
        
        if success_rate >= 90:
            print("\n🎉 EXCELLENT: Backend API is working very well!")
        elif success_rate >= 75:
            print("\n✅ GOOD: Backend API is mostly working with minor issues")
        elif success_rate >= 50:
            print("\n⚠️  MODERATE: Backend API has significant issues that need attention")
        else:
            print("\n❌ CRITICAL: Backend API has major problems that must be fixed")
        
        return success_rate >= 75

if __name__ == "__main__":
    tester = HydraulicPumpTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)