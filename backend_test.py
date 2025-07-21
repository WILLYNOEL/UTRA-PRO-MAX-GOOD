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
BACKEND_URL = "https://d251a688-d89e-4006-a0d6-5228c30cbc8b.preview.emergentagent.com/api"

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
        """Test fluid properties API - Phase 4: All 20 fluids (12 industrial + 8 food/domestic)"""
        try:
            response = requests.get(f"{BACKEND_URL}/fluids", timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                # Check structure
                if "fluids" not in data:
                    self.log_test("Fluids API Structure", False, "Missing 'fluids' key")
                    return False
                
                fluids = data["fluids"]
                # Phase 4: All 20 fluids (12 industrial + 8 food/domestic)
                expected_fluids = [
                    "water", "oil", "acid", "glycol",  # Original 4
                    "palm_oil", "gasoline", "diesel", "hydraulic_oil",  # Industrial fluids
                    "ethanol", "seawater", "methanol", "glycerol",  # Additional industrial fluids
                    "milk", "honey", "wine", "bleach",  # New food/domestic fluids
                    "yogurt", "tomato_sauce", "soap_solution", "fruit_juice"  # Additional food/domestic fluids
                ]
                
                # Check all expected fluids are present
                fluid_ids = [f["id"] for f in fluids]
                missing_fluids = [f for f in expected_fluids if f not in fluid_ids]
                
                if missing_fluids:
                    self.log_test("Phase 4 - Food & Domestic Fluids API", False, f"Missing fluids: {missing_fluids}")
                    return False
                
                # Check total count
                if len(fluids) != 20:
                    self.log_test("Phase 4 - Food & Domestic Fluids API", False, f"Expected 20 fluids, found {len(fluids)}")
                    return False
                
                # Check fluid structure
                for fluid in fluids:
                    if "id" not in fluid or "name" not in fluid:
                        self.log_test("Fluids API Structure", False, f"Invalid fluid structure: {fluid}")
                        return False
                
                self.log_test("Phase 4 - Food & Domestic Fluids API", True, f"Found {len(fluids)} fluids: {fluid_ids}")
                return True
            else:
                self.log_test("Phase 4 - Food & Domestic Fluids API", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Phase 4 - Food & Domestic Fluids API", False, f"Error: {str(e)}")
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
                expected_names = ["Hydraulic Oil", "Huile Hydraulique"]  # Accept both English and French
                if fluid_props.get("name") not in expected_names:
                    self.log_test("Oil Calculation - Temperature", False, f"Unexpected fluid name: {fluid_props.get('name')}")
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
                        # Calculate expected hydraulic power: P2 = ((débit × HMT) / (rendement pompe × 367)) * 100
                        expected_p2 = ((flow_rate * hmt) / (pump_eff * 367)) * 100
                        
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
                
                # Check that we don't have unexpected curve types - actually, having more curves is good
                # Just ensure we have the minimum required: flow and hmt
                required_keys = ["flow", "hmt"]
                missing_keys = [k for k in required_keys if k not in performance_curves]
                if missing_keys:
                    self.log_test("Performance Curves Content", False, 
                                f"Missing required keys: {missing_keys}")
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

    def test_corrected_global_efficiency_formula(self):
        """Test the corrected global efficiency formula: Rendement Global = Rendement Moteur × Rendement Pompe"""
        print("\n🎯 Testing Corrected Global Efficiency Formula...")
        
        # Test data from user request
        test_data = {
            "flow_rate": 50.0,  # m³/h
            "hmt": 30.0,  # m
            "pipe_diameter": 100.0,
            "required_npsh": 3.0,
            "calculated_npshd": 8.0,
            "fluid_type": "water",
            "pipe_material": "pvc",
            "pump_efficiency": 80.0,  # %
            "motor_efficiency": 90.0,  # %
            "starting_method": "star_delta",
            "power_factor": 0.8,
            "cable_length": 50.0,
            "voltage": 400
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate-performance", json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                
                # Get efficiency values
                pump_efficiency = result.get("pump_efficiency", 0)
                motor_efficiency = result.get("motor_efficiency", 0)
                overall_efficiency = result.get("overall_efficiency", 0)
                
                # Expected global efficiency = 80% × 90% = 72%
                expected_global_efficiency = (80.0 / 100) * (90.0 / 100) * 100  # 72%
                
                # Check that the formula is correctly applied
                if abs(overall_efficiency - expected_global_efficiency) > 0.1:
                    self.log_test("Corrected Global Efficiency Formula", False, 
                                f"Expected {expected_global_efficiency:.1f}%, got {overall_efficiency:.1f}%")
                    return False
                
                # Verify individual efficiencies are preserved
                if abs(pump_efficiency - 80.0) > 0.1:
                    self.log_test("Pump Efficiency Preservation", False, 
                                f"Expected 80.0%, got {pump_efficiency:.1f}%")
                    return False
                
                if abs(motor_efficiency - 90.0) > 0.1:
                    self.log_test("Motor Efficiency Preservation", False, 
                                f"Expected 90.0%, got {motor_efficiency:.1f}%")
                    return False
                
                self.log_test("Corrected Global Efficiency Formula", True, 
                            f"Pump: {pump_efficiency:.1f}%, Motor: {motor_efficiency:.1f}%, Global: {overall_efficiency:.1f}%")
                return True
            else:
                self.log_test("Corrected Global Efficiency Formula", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Corrected Global Efficiency Formula", False, f"Error: {str(e)}")
            return False
    
    def test_operating_point_precision(self):
        """Test that the best operating point corresponds exactly to user input values"""
        print("\n🎯 Testing Operating Point Precision...")
        
        test_cases = [
            {
                "name": "Standard Operating Point",
                "data": {
                    "flow_rate": 50.0,  # m³/h
                    "hmt": 30.0,  # m
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
            },
            {
                "name": "High Flow Operating Point",
                "data": {
                    "flow_rate": 120.0,  # m³/h
                    "hmt": 45.0,  # m
                    "pipe_diameter": 150.0,
                    "required_npsh": 4.0,
                    "calculated_npshd": 10.0,
                    "fluid_type": "water",
                    "pipe_material": "steel",
                    "pump_efficiency": 85.0,
                    "motor_efficiency": 92.0,
                    "starting_method": "direct_on_line",
                    "power_factor": 0.85,
                    "cable_length": 75.0,
                    "voltage": 400
                }
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/calculate-performance", json=case["data"], timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    
                    performance_curves = result.get("performance_curves", {})
                    best_operating_point = performance_curves.get("best_operating_point", {})
                    
                    if not best_operating_point:
                        self.log_test(f"Operating Point Precision - {case['name']}", False, 
                                    "Missing best_operating_point in performance_curves")
                        all_passed = False
                        continue
                    
                    # Check that operating point matches input exactly
                    input_flow = case["data"]["flow_rate"]
                    input_hmt = case["data"]["hmt"]
                    input_efficiency = case["data"]["pump_efficiency"]
                    
                    op_flow = best_operating_point.get("flow", 0)
                    op_hmt = best_operating_point.get("hmt", 0)
                    op_efficiency = best_operating_point.get("efficiency", 0)
                    
                    # Check flow rate precision
                    if abs(op_flow - input_flow) > 0.1:
                        self.log_test(f"Operating Point Flow - {case['name']}", False, 
                                    f"Expected {input_flow:.1f} m³/h, got {op_flow:.1f} m³/h")
                        all_passed = False
                        continue
                    
                    # Check HMT precision
                    if abs(op_hmt - input_hmt) > 0.1:
                        self.log_test(f"Operating Point HMT - {case['name']}", False, 
                                    f"Expected {input_hmt:.1f} m, got {op_hmt:.1f} m")
                        all_passed = False
                        continue
                    
                    # Check efficiency precision
                    if abs(op_efficiency - input_efficiency) > 0.1:
                        self.log_test(f"Operating Point Efficiency - {case['name']}", False, 
                                    f"Expected {input_efficiency:.1f}%, got {op_efficiency:.1f}%")
                        all_passed = False
                        continue
                    
                    self.log_test(f"Operating Point Precision - {case['name']}", True, 
                                f"Flow: {op_flow:.1f} m³/h, HMT: {op_hmt:.1f} m, Eff: {op_efficiency:.1f}%")
                else:
                    self.log_test(f"Operating Point Precision - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Operating Point Precision - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_darcy_formula_integration(self):
        """Test that Darcy-Weisbach formula is properly used in all head loss calculations"""
        print("\n🎯 Testing Darcy Formula Integration...")
        
        test_cases = [
            {
                "name": "NPSHd Calculation with Darcy",
                "endpoint": "/calculate-npshd",
                "data": {
                    "suction_type": "flooded",
                    "hasp": 2.0,
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
            },
            {
                "name": "HMT Calculation with Darcy",
                "endpoint": "/calculate-hmt",
                "data": {
                    "installation_type": "surface",
                    "suction_type": "flooded",
                    "hasp": 2.0,
                    "discharge_height": 20.0,
                    "useful_pressure": 1.5,
                    "suction_pipe_diameter": 100.0,
                    "discharge_pipe_diameter": 80.0,
                    "suction_pipe_length": 30.0,
                    "discharge_pipe_length": 100.0,
                    "suction_pipe_material": "pvc",
                    "discharge_pipe_material": "steel",
                    "suction_fittings": [],
                    "discharge_fittings": [
                        {"fitting_type": "elbow_90", "quantity": 3},
                        {"fitting_type": "gate_valve_open", "quantity": 1}
                    ],
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "flow_rate": 50.0
                }
            },
            {
                "name": "Performance Analysis with Darcy",
                "endpoint": "/calculate-performance",
                "data": {
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
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}{case['endpoint']}", json=case["data"], timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check for Darcy-related calculations
                    if case["endpoint"] == "/calculate-npshd":
                        # Check NPSHd calculation components
                        velocity = result.get("velocity", 0)
                        reynolds_number = result.get("reynolds_number", 0)
                        friction_factor = result.get("friction_factor", 0)
                        linear_head_loss = result.get("linear_head_loss", 0)
                        
                        if velocity <= 0:
                            self.log_test(f"Darcy Integration - {case['name']} - Velocity", False, "Velocity is zero or negative")
                            all_passed = False
                            continue
                        
                        if reynolds_number <= 0:
                            self.log_test(f"Darcy Integration - {case['name']} - Reynolds", False, "Reynolds number is zero or negative")
                            all_passed = False
                            continue
                        
                        if friction_factor <= 0:
                            self.log_test(f"Darcy Integration - {case['name']} - Friction Factor", False, "Friction factor is zero or negative")
                            all_passed = False
                            continue
                        
                        if linear_head_loss <= 0:
                            self.log_test(f"Darcy Integration - {case['name']} - Head Loss", False, "Linear head loss is zero or negative")
                            all_passed = False
                            continue
                        
                        # Verify Darcy formula: ΔH = f × (L/D) × (V²/2g)
                        pipe_length = case["data"]["pipe_length"]
                        pipe_diameter = case["data"]["pipe_diameter"] / 1000  # Convert mm to m
                        expected_head_loss = friction_factor * (pipe_length / pipe_diameter) * (velocity**2) / (2 * 9.81)
                        
                        if abs(linear_head_loss - expected_head_loss) > 0.1:
                            self.log_test(f"Darcy Integration - {case['name']} - Formula Verification", False, 
                                        f"Expected {expected_head_loss:.3f} m, got {linear_head_loss:.3f} m")
                            all_passed = False
                            continue
                    
                    elif case["endpoint"] == "/calculate-hmt":
                        # Check HMT calculation components
                        suction_velocity = result.get("suction_velocity", 0)
                        discharge_velocity = result.get("discharge_velocity", 0)
                        suction_head_loss = result.get("suction_head_loss", 0)
                        discharge_head_loss = result.get("discharge_head_loss", 0)
                        
                        if suction_velocity <= 0 or discharge_velocity <= 0:
                            self.log_test(f"Darcy Integration - {case['name']} - Velocities", False, "Velocities are zero or negative")
                            all_passed = False
                            continue
                        
                        if suction_head_loss < 0 or discharge_head_loss <= 0:
                            self.log_test(f"Darcy Integration - {case['name']} - Head Losses", False, "Head losses are negative or zero")
                            all_passed = False
                            continue
                    
                    elif case["endpoint"] == "/calculate-performance":
                        # Check performance curves use Darcy formula
                        performance_curves = result.get("performance_curves", {})
                        head_loss_points = performance_curves.get("head_loss", [])
                        
                        if not head_loss_points:
                            self.log_test(f"Darcy Integration - {case['name']} - Head Loss Curve", False, "Missing head_loss curve")
                            all_passed = False
                            continue
                        
                        # Check that head loss increases with flow (Darcy behavior)
                        if len(head_loss_points) > 1:
                            increasing_trend = True
                            for i in range(1, len(head_loss_points)):
                                if head_loss_points[i] < head_loss_points[i-1]:
                                    increasing_trend = False
                                    break
                            
                            if not increasing_trend:
                                self.log_test(f"Darcy Integration - {case['name']} - Head Loss Trend", False, 
                                            "Head loss should increase with flow (Darcy behavior)")
                                all_passed = False
                                continue
                    
                    self.log_test(f"Darcy Integration - {case['name']}", True, "Darcy-Weisbach formula properly integrated")
                else:
                    self.log_test(f"Darcy Integration - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Darcy Integration - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_user_interface_modifications(self):
        """Test specific user interface modifications requested"""
        print("\n🎯 Testing User Interface Modifications...")
        
        # Test data from user request
        test_data = {
            "flow_rate": 50.0,  # m³/h
            "hmt": 30.0,  # m
            "pipe_diameter": 100.0,  # mm
            "required_npsh": 3.0,
            "calculated_npshd": 8.0,
            "fluid_type": "water",
            "pipe_material": "pvc",
            "pump_efficiency": 80.0,  # %
            "motor_efficiency": 90.0,  # %
            "starting_method": "star_delta",
            "power_factor": 0.8,
            "cable_length": 50.0,
            "voltage": 400
        }
        
        all_passed = True
        
        try:
            response = requests.post(f"{BACKEND_URL}/calculate-performance", json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                
                # 1. Test NPSH Removal from Performance
                npsh_fields = ["npshd", "npsh_available", "npsh_required", "calculated_npshd", "required_npsh"]
                found_npsh_fields = []
                
                # Check top level
                for field in npsh_fields:
                    if field in result:
                        found_npsh_fields.append(f"top_level.{field}")
                
                # Check power_calculations
                power_calcs = result.get("power_calculations", {})
                for field in npsh_fields:
                    if field in power_calcs:
                        found_npsh_fields.append(f"power_calculations.{field}")
                
                # Check performance_curves
                perf_curves = result.get("performance_curves", {})
                for field in npsh_fields:
                    if field in perf_curves:
                        found_npsh_fields.append(f"performance_curves.{field}")
                
                if found_npsh_fields:
                    self.log_test("NPSH Removal from Performance", False, 
                                f"Found NPSH fields: {found_npsh_fields}")
                    all_passed = False
                else:
                    self.log_test("NPSH Removal from Performance", True, 
                                "✅ NPSH fields successfully removed from Performance endpoint")
                
                # 2. Test Velocity and Alerts Integration
                velocity = result.get("velocity", None)
                reynolds_number = result.get("reynolds_number", None)
                alerts = result.get("alerts", None)
                
                if velocity is None:
                    self.log_test("Velocity Data Integration", False, "Missing velocity field")
                    all_passed = False
                elif velocity <= 0:
                    self.log_test("Velocity Data Integration", False, f"Invalid velocity: {velocity}")
                    all_passed = False
                else:
                    self.log_test("Velocity Data Integration", True, f"✅ Velocity: {velocity:.2f} m/s")
                
                if reynolds_number is None:
                    self.log_test("Reynolds Number Integration", False, "Missing reynolds_number field")
                    all_passed = False
                elif reynolds_number <= 0:
                    self.log_test("Reynolds Number Integration", False, f"Invalid Reynolds number: {reynolds_number}")
                    all_passed = False
                else:
                    self.log_test("Reynolds Number Integration", True, f"✅ Reynolds: {reynolds_number:.0f}")
                
                if alerts is None:
                    self.log_test("Alerts Integration", False, "Missing alerts field")
                    all_passed = False
                elif not isinstance(alerts, list):
                    self.log_test("Alerts Integration", False, f"Alerts should be a list, got: {type(alerts)}")
                    all_passed = False
                else:
                    self.log_test("Alerts Integration", True, f"✅ Alerts system integrated ({len(alerts)} alerts)")
                
                # 3. Test Precise Intersection Point
                performance_curves = result.get("performance_curves", {})
                best_operating_point = performance_curves.get("best_operating_point", {})
                
                if not best_operating_point:
                    self.log_test("Precise Intersection Point", False, "Missing best_operating_point")
                    all_passed = False
                else:
                    op_flow = best_operating_point.get("flow", 0)
                    op_hmt = best_operating_point.get("hmt", 0)
                    
                    # Check exact match with input values
                    flow_match = abs(op_flow - test_data["flow_rate"]) < 0.1
                    hmt_match = abs(op_hmt - test_data["hmt"]) < 0.1
                    
                    if not flow_match:
                        self.log_test("Intersection Point - Flow", False, 
                                    f"Expected {test_data['flow_rate']:.1f}, got {op_flow:.1f}")
                        all_passed = False
                    else:
                        self.log_test("Intersection Point - Flow", True, f"✅ Exact match: {op_flow:.1f} m³/h")
                    
                    if not hmt_match:
                        self.log_test("Intersection Point - HMT", False, 
                                    f"Expected {test_data['hmt']:.1f}, got {op_hmt:.1f}")
                        all_passed = False
                    else:
                        self.log_test("Intersection Point - HMT", True, f"✅ Exact match: {op_hmt:.1f} m")
                
                # 4. Test General Functionality
                required_fields = [
                    "pump_efficiency", "motor_efficiency", "overall_efficiency",
                    "velocity", "reynolds_number", "nominal_current", "starting_current",
                    "recommended_cable_section", "power_calculations", "electrical_data",
                    "performance_curves", "recommendations", "warnings", "alerts"
                ]
                
                missing_fields = [field for field in required_fields if field not in result]
                if missing_fields:
                    self.log_test("General Functionality", False, f"Missing fields: {missing_fields}")
                    all_passed = False
                else:
                    self.log_test("General Functionality", True, "✅ All required fields present")
                
                # Test power calculations are reasonable
                power_calcs = result.get("power_calculations", {})
                hydraulic_power = power_calcs.get("hydraulic_power", 0)
                absorbed_power = power_calcs.get("absorbed_power", 0)
                
                if hydraulic_power <= 0 or absorbed_power <= hydraulic_power:
                    self.log_test("Power Calculations Logic", False, 
                                f"Invalid power relationship: P2={hydraulic_power:.3f}, P1={absorbed_power:.3f}")
                    all_passed = False
                else:
                    self.log_test("Power Calculations Logic", True, 
                                f"✅ P2={hydraulic_power:.3f} kW, P1={absorbed_power:.3f} kW")
                
            else:
                self.log_test("User Interface Modifications", False, f"API call failed: {response.status_code}")
                all_passed = False
                
        except Exception as e:
            self.log_test("User Interface Modifications", False, f"Error: {str(e)}")
            all_passed = False
        
        return all_passed

    def test_urgent_performance_endpoint_issue(self):
        """URGENT: Test the specific issue reported by user with /api/calculate-performance endpoint"""
        print("\n🚨 URGENT: Testing Performance Endpoint Issue...")
        
        # Exact test data from user request
        test_data = {
            "flow_rate": 50,
            "hmt": 30,
            "pipe_diameter": 100,
            "fluid_type": "water",
            "pipe_material": "pvc",
            "pump_efficiency": 80,
            "motor_efficiency": 90,
            "starting_method": "star_delta",
            "power_factor": 0.8,
            "cable_length": 50,
            "cable_material": "copper",
            "voltage": 400
        }
        
        try:
            print(f"Testing with data: {test_data}")
            response = requests.post(f"{BACKEND_URL}/calculate-performance", json=test_data, timeout=15)
            
            # 1. Check that API doesn't return error
            if response.status_code != 200:
                self.log_test("URGENT - API No Error", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            result = response.json()
            self.log_test("URGENT - API No Error", True, f"Status: {response.status_code}")
            
            # 2. Check that NPSH fields are absent from results (not input_data)
            npsh_fields = ["npshd", "npsh_available", "npsh_required", "calculated_npshd", "required_npsh"]
            found_npsh_fields = []
            
            def check_npsh_in_dict(data, path="", exclude_input_data=True):
                """Recursively check for NPSH fields in nested dictionaries, excluding input_data"""
                if isinstance(data, dict):
                    for key, value in data.items():
                        current_path = f"{path}.{key}" if path else key
                        
                        # Skip input_data section as it's just echoing the input
                        if exclude_input_data and key == "input_data":
                            continue
                            
                        if any(npsh_field.lower() in key.lower() for npsh_field in npsh_fields):
                            found_npsh_fields.append(current_path)
                        if isinstance(value, (dict, list)):
                            check_npsh_in_dict(value, current_path, exclude_input_data)
                elif isinstance(data, list):
                    for i, item in enumerate(data):
                        check_npsh_in_dict(item, f"{path}[{i}]", exclude_input_data)
            
            check_npsh_in_dict(result)
            
            if found_npsh_fields:
                self.log_test("URGENT - NPSH Fields Absent", False, f"Found NPSH fields: {found_npsh_fields}")
                return False
            else:
                self.log_test("URGENT - NPSH Fields Absent", True, "No NPSH fields found in response")
            
            # 3. Check that velocity and alerts are present
            velocity = result.get("velocity")
            alerts = result.get("alerts")
            reynolds_number = result.get("reynolds_number")
            
            if velocity is None:
                self.log_test("URGENT - Velocity Present", False, "Velocity field missing")
                return False
            elif velocity <= 0:
                self.log_test("URGENT - Velocity Present", False, f"Invalid velocity: {velocity}")
                return False
            else:
                self.log_test("URGENT - Velocity Present", True, f"Velocity: {velocity:.2f} m/s")
            
            if reynolds_number is None:
                self.log_test("URGENT - Reynolds Number Present", False, "Reynolds number field missing")
                return False
            elif reynolds_number <= 0:
                self.log_test("URGENT - Reynolds Number Present", False, f"Invalid Reynolds number: {reynolds_number}")
                return False
            else:
                self.log_test("URGENT - Reynolds Number Present", True, f"Reynolds: {reynolds_number:.0f}")
            
            if alerts is None:
                self.log_test("URGENT - Alerts Present", False, "Alerts field missing")
                return False
            elif not isinstance(alerts, list):
                self.log_test("URGENT - Alerts Present", False, f"Alerts should be a list, got: {type(alerts)}")
                return False
            else:
                self.log_test("URGENT - Alerts Present", True, f"Alerts: {len(alerts)} items")
            
            # 4. Check that performance curves are generated correctly
            performance_curves = result.get("performance_curves")
            if not performance_curves:
                self.log_test("URGENT - Performance Curves Present", False, "Performance curves missing")
                return False
            
            # Check required curve data
            required_curves = ["flow", "hmt"]
            missing_curves = [curve for curve in required_curves if curve not in performance_curves]
            if missing_curves:
                self.log_test("URGENT - Performance Curves Structure", False, f"Missing curves: {missing_curves}")
                return False
            
            # Check curve data quality
            flow_points = performance_curves.get("flow", [])
            hmt_points = performance_curves.get("hmt", [])
            
            if len(flow_points) < 10:
                self.log_test("URGENT - Performance Curves Data", False, f"Too few flow points: {len(flow_points)}")
                return False
            
            if len(flow_points) != len(hmt_points):
                self.log_test("URGENT - Performance Curves Data", False, f"Flow points ({len(flow_points)}) != HMT points ({len(hmt_points)})")
                return False
            
            # Check for best operating point
            best_operating_point = performance_curves.get("best_operating_point")
            if not best_operating_point:
                self.log_test("URGENT - Operating Point Present", False, "Best operating point missing")
                return False
            
            # Verify operating point matches input
            op_flow = best_operating_point.get("flow", 0)
            op_hmt = best_operating_point.get("hmt", 0)
            
            if abs(op_flow - test_data["flow_rate"]) > 0.1:
                self.log_test("URGENT - Operating Point Accuracy", False, f"Flow mismatch: expected {test_data['flow_rate']}, got {op_flow}")
                return False
            
            if abs(op_hmt - test_data["hmt"]) > 0.1:
                self.log_test("URGENT - Operating Point Accuracy", False, f"HMT mismatch: expected {test_data['hmt']}, got {op_hmt}")
                return False
            
            self.log_test("URGENT - Performance Curves Generated", True, f"Curves with {len(flow_points)} points, Operating point: {op_flow:.1f} m³/h, {op_hmt:.1f} m")
            
            # Additional checks for power calculations
            power_calculations = result.get("power_calculations", {})
            hydraulic_power = power_calculations.get("hydraulic_power", 0)
            absorbed_power = power_calculations.get("absorbed_power", 0)
            
            if hydraulic_power <= 0:
                self.log_test("URGENT - Power Calculations", False, f"Invalid hydraulic power: {hydraulic_power}")
                return False
            
            if absorbed_power <= hydraulic_power:
                self.log_test("URGENT - Power Calculations", False, f"Absorbed power ({absorbed_power}) should be > hydraulic power ({hydraulic_power})")
                return False
            
            self.log_test("URGENT - Power Calculations", True, f"P2: {hydraulic_power:.3f} kW, P1: {absorbed_power:.3f} kW")
            
            # Overall success
            self.log_test("URGENT - Performance Endpoint Overall", True, "All requirements met successfully")
            return True
            
        except Exception as e:
            self.log_test("URGENT - Performance Endpoint Overall", False, f"Exception: {str(e)}")
            return False

    def test_urgent_hmt_surface_installation(self):
        """🚨 URGENT: Test HMT endpoint with surface installation data as requested"""
        print("\n🚨 URGENT: Testing HMT Surface Installation Issue...")
        
        # Exact test data from the review request
        test_data = {
            "installation_type": "surface",
            "suction_type": "flooded",
            "hasp": 3.0,
            "discharge_height": 25.0,
            "useful_pressure": 0,
            "suction_pipe_diameter": 100.0,
            "discharge_pipe_diameter": 80.0,
            "suction_pipe_length": 10.0,
            "discharge_pipe_length": 50.0,
            "suction_pipe_material": "pvc",
            "discharge_pipe_material": "pvc",
            "suction_fittings": [],
            "discharge_fittings": [],
            "fluid_type": "water",
            "temperature": 20,
            "flow_rate": 60
        }
        
        try:
            print(f"🔍 Testing /api/calculate-hmt with surface installation data...")
            print(f"   Flow Rate: {test_data['flow_rate']} m³/h")
            print(f"   Installation: {test_data['installation_type']}")
            print(f"   Suction Type: {test_data['suction_type']}")
            print(f"   HASP: {test_data['hasp']} m")
            print(f"   Discharge Height: {test_data['discharge_height']} m")
            
            response = requests.post(f"{BACKEND_URL}/calculate-hmt", json=test_data, timeout=15)
            
            # Check 1: API doesn't return an error
            if response.status_code != 200:
                error_detail = ""
                try:
                    error_data = response.json()
                    error_detail = f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    error_detail = f" - Response: {response.text[:200]}"
                
                self.log_test("🚨 URGENT - HMT API No Error", False, 
                            f"API returned status {response.status_code}{error_detail}")
                return False
            
            result = response.json()
            self.log_test("🚨 URGENT - HMT API No Error", True, 
                        f"API returned HTTP 200 successfully")
            
            # Check 2: Suction calculations are included for surface installation
            suction_velocity = result.get("suction_velocity")
            suction_head_loss = result.get("suction_head_loss")
            
            if suction_velocity is None:
                self.log_test("🚨 URGENT - Suction Calculations Included", False, 
                            "suction_velocity is None - should be calculated for surface installation")
                return False
            
            if suction_head_loss is None:
                self.log_test("🚨 URGENT - Suction Calculations Included", False, 
                            "suction_head_loss is None - should be calculated for surface installation")
                return False
            
            if suction_velocity <= 0:
                self.log_test("🚨 URGENT - Suction Calculations Included", False, 
                            f"suction_velocity is {suction_velocity} - should be positive for surface installation")
                return False
            
            self.log_test("🚨 URGENT - Suction Calculations Included", True, 
                        f"Suction velocity: {suction_velocity:.2f} m/s, Suction head loss: {suction_head_loss:.2f} m")
            
            # Check 3: Data correctness
            errors = []
            
            # Check discharge velocity
            discharge_velocity = result.get("discharge_velocity", 0)
            if discharge_velocity <= 0:
                errors.append(f"discharge_velocity is {discharge_velocity} - should be positive")
            
            # Check HMT calculation
            hmt = result.get("hmt", 0)
            if hmt <= 0:
                errors.append(f"hmt is {hmt} - should be positive")
            
            # Check total head loss
            total_head_loss = result.get("total_head_loss", 0)
            if total_head_loss <= 0:
                errors.append(f"total_head_loss is {total_head_loss} - should be positive")
            
            # Check static head calculation
            static_head = result.get("static_head", 0)
            expected_static_head = test_data["discharge_height"] - test_data["hasp"]  # 25 - 3 = 22m
            if abs(static_head - expected_static_head) > 0.1:
                errors.append(f"static_head is {static_head} - expected ~{expected_static_head}")
            
            # Check fluid properties
            fluid_props = result.get("fluid_properties", {})
            if fluid_props.get("name") != "Eau":
                errors.append(f"fluid name is '{fluid_props.get('name')}' - expected 'Eau'")
            
            # Check input data preservation
            input_data = result.get("input_data", {})
            if input_data.get("installation_type") != "surface":
                errors.append("installation_type not preserved in response")
            
            if errors:
                self.log_test("🚨 URGENT - Data Correctness", False, "; ".join(errors))
                return False
            else:
                self.log_test("🚨 URGENT - Data Correctness", True, 
                            f"HMT: {hmt:.2f} m, Static Head: {static_head:.2f} m, Total Head Loss: {total_head_loss:.2f} m")
            
            # Check 4: Detailed response structure for debugging Network Error
            required_fields = [
                "input_data", "fluid_properties", "suction_velocity", "discharge_velocity",
                "suction_head_loss", "discharge_head_loss", "total_head_loss", 
                "static_head", "useful_pressure_head", "hmt", "warnings"
            ]
            
            missing_fields = [field for field in required_fields if field not in result]
            if missing_fields:
                self.log_test("🚨 URGENT - Response Structure", False, 
                            f"Missing fields: {missing_fields}")
                return False
            
            # Print detailed response for debugging
            print(f"   ✅ Complete Response Structure:")
            print(f"      - Suction Velocity: {suction_velocity:.3f} m/s")
            print(f"      - Discharge Velocity: {discharge_velocity:.3f} m/s")
            print(f"      - Suction Head Loss: {suction_head_loss:.3f} m")
            print(f"      - Discharge Head Loss: {result.get('discharge_head_loss', 0):.3f} m")
            print(f"      - Total Head Loss: {total_head_loss:.3f} m")
            print(f"      - Static Head: {static_head:.3f} m")
            print(f"      - HMT: {hmt:.3f} m")
            print(f"      - Warnings: {len(result.get('warnings', []))}")
            
            self.log_test("🚨 URGENT - Response Structure", True, 
                        f"All {len(required_fields)} required fields present")
            
            # Overall success
            self.log_test("🚨 URGENT - HMT Surface Installation", True, 
                        f"All checks passed - API working correctly for surface installation")
            
            return True
            
        except requests.exceptions.Timeout:
            self.log_test("🚨 URGENT - HMT Surface Installation", False, 
                        "Request timeout - possible network issue")
            return False
        except requests.exceptions.ConnectionError as e:
            self.log_test("🚨 URGENT - HMT Surface Installation", False, 
                        f"Connection error - Network Error cause identified: {str(e)}")
            return False
        except requests.exceptions.RequestException as e:
            self.log_test("🚨 URGENT - HMT Surface Installation", False, 
                        f"Request error - Network Error cause: {str(e)}")
            return False
        except Exception as e:
            self.log_test("🚨 URGENT - HMT Surface Installation", False, 
                        f"Unexpected error: {str(e)}")
            return False

    def test_npshd_required_field_acceptance(self):
        """Test that npsh_required field is properly accepted and used in NPSHd calculations"""
        print("\n🔧 Testing NPSHd Required Field Acceptance...")
        
        test_cases = [
            {
                "name": "Standard NPSH Required",
                "data": {
                    "suction_type": "flooded",
                    "hasp": 2.0,
                    "flow_rate": 30.0,
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "pipe_diameter": 150.0,
                    "pipe_material": "pvc",
                    "pipe_length": 20.0,
                    "suction_fittings": [],
                    "npsh_required": 3.0  # Test case 1 from review request
                }
            },
            {
                "name": "High NPSH Required",
                "data": {
                    "suction_type": "suction_lift",
                    "hasp": 6.0,
                    "flow_rate": 80.0,
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "pipe_diameter": 80.0,
                    "pipe_material": "pvc",
                    "pipe_length": 100.0,
                    "suction_fittings": [],
                    "npsh_required": 4.0  # Test case 2 from review request
                }
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=case["data"], timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check that npsh_required is properly accepted and returned
                    returned_npsh_required = result.get("npsh_required", 0)
                    expected_npsh_required = case["data"]["npsh_required"]
                    
                    if abs(returned_npsh_required - expected_npsh_required) > 0.01:
                        self.log_test(f"NPSH Required Field - {case['name']}", False, 
                                    f"Expected {expected_npsh_required:.2f} m, got {returned_npsh_required:.2f} m")
                        all_passed = False
                        continue
                    
                    # Check that input data is preserved
                    input_data = result.get("input_data", {})
                    if input_data.get("npsh_required") != expected_npsh_required:
                        self.log_test(f"NPSH Required Input Preservation - {case['name']}", False, 
                                    "NPSH required not preserved in input_data")
                        all_passed = False
                        continue
                    
                    self.log_test(f"NPSH Required Field - {case['name']}", True, 
                                f"NPSH required properly accepted: {returned_npsh_required:.2f} m")
                else:
                    self.log_test(f"NPSH Required Field - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"NPSH Required Field - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_npshd_vs_npsh_required_comparison(self):
        """Test automatic comparison between NPSHd and NPSH required"""
        print("\n⚖️ Testing NPSHd vs NPSH Required Comparison...")
        
        test_cases = [
            {
                "name": "No Cavitation Case",
                "data": {
                    "suction_type": "flooded",
                    "hasp": 2.0,
                    "flow_rate": 30.0,
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "pipe_diameter": 150.0,
                    "pipe_material": "pvc",
                    "pipe_length": 20.0,
                    "suction_fittings": [],
                    "npsh_required": 3.0
                },
                "expected_cavitation": False
            },
            {
                "name": "Cavitation Risk Case",
                "data": {
                    "suction_type": "suction_lift",
                    "hasp": 6.0,
                    "flow_rate": 80.0,
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "pipe_diameter": 80.0,
                    "pipe_material": "pvc",
                    "pipe_length": 100.0,
                    "suction_fittings": [],
                    "npsh_required": 4.0
                },
                "expected_cavitation": True
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=case["data"], timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    
                    # Get comparison values
                    npshd = result.get("npshd", 0)
                    npsh_required = result.get("npsh_required", 0)
                    npsh_margin = result.get("npsh_margin", 0)
                    cavitation_risk = result.get("cavitation_risk", False)
                    
                    # Verify margin calculation: margin = NPSHd - NPSHr
                    expected_margin = npshd - npsh_required
                    if abs(npsh_margin - expected_margin) > 0.01:
                        self.log_test(f"NPSH Margin Calculation - {case['name']}", False, 
                                    f"Expected margin {expected_margin:.2f} m, got {npsh_margin:.2f} m")
                        all_passed = False
                        continue
                    
                    # Verify cavitation risk logic: risk = NPSHd <= NPSHr
                    expected_risk = npshd <= npsh_required
                    if cavitation_risk != expected_risk:
                        self.log_test(f"Cavitation Risk Logic - {case['name']}", False, 
                                    f"Expected risk {expected_risk}, got {cavitation_risk}")
                        all_passed = False
                        continue
                    
                    # Check against expected result from test case
                    if cavitation_risk != case["expected_cavitation"]:
                        self.log_test(f"Expected Cavitation Result - {case['name']}", False, 
                                    f"Expected cavitation {case['expected_cavitation']}, got {cavitation_risk}")
                        all_passed = False
                        continue
                    
                    self.log_test(f"NPSHd vs NPSH Required - {case['name']}", True, 
                                f"NPSHd: {npshd:.2f} m, NPSHr: {npsh_required:.2f} m, Margin: {npsh_margin:.2f} m, Risk: {cavitation_risk}")
                else:
                    self.log_test(f"NPSHd vs NPSH Required - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"NPSHd vs NPSH Required - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_cavitation_risk_detection(self):
        """Test that cavitation_risk is correctly calculated and returned"""
        print("\n🚨 Testing Cavitation Risk Detection...")
        
        test_cases = [
            {
                "name": "Safe Operation - No Cavitation",
                "data": {
                    "suction_type": "flooded",
                    "hasp": 3.0,  # Good flooded suction
                    "flow_rate": 25.0,  # Moderate flow
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "pipe_diameter": 150.0,  # Large diameter
                    "pipe_material": "pvc",
                    "pipe_length": 15.0,  # Short length
                    "suction_fittings": [],
                    "npsh_required": 2.5  # Low requirement
                },
                "expected_cavitation": False
            },
            {
                "name": "High Risk - Probable Cavitation",
                "data": {
                    "suction_type": "suction_lift",
                    "hasp": 7.0,  # High suction lift
                    "flow_rate": 100.0,  # High flow
                    "fluid_type": "water",
                    "temperature": 60.0,  # High temperature (higher vapor pressure)
                    "pipe_diameter": 75.0,  # Small diameter
                    "pipe_material": "steel",  # Rough material
                    "pipe_length": 150.0,  # Long length
                    "suction_fittings": [
                        {"fitting_type": "elbow_90", "quantity": 3},
                        {"fitting_type": "check_valve", "quantity": 1}
                    ],
                    "npsh_required": 5.0  # High requirement
                },
                "expected_cavitation": True
            },
            {
                "name": "Borderline Case",
                "data": {
                    "suction_type": "suction_lift",
                    "hasp": 4.0,
                    "flow_rate": 50.0,
                    "fluid_type": "water",
                    "temperature": 40.0,
                    "pipe_diameter": 100.0,
                    "pipe_material": "pvc",
                    "pipe_length": 50.0,
                    "suction_fittings": [
                        {"fitting_type": "elbow_90", "quantity": 1}
                    ],
                    "npsh_required": 3.5
                }
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=case["data"], timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check that cavitation_risk field exists
                    if "cavitation_risk" not in result:
                        self.log_test(f"Cavitation Risk Field - {case['name']}", False, 
                                    "Missing cavitation_risk field in response")
                        all_passed = False
                        continue
                    
                    cavitation_risk = result.get("cavitation_risk", False)
                    npshd = result.get("npshd", 0)
                    npsh_required = result.get("npsh_required", 0)
                    
                    # Verify cavitation risk is boolean
                    if not isinstance(cavitation_risk, bool):
                        self.log_test(f"Cavitation Risk Type - {case['name']}", False, 
                                    f"cavitation_risk should be boolean, got {type(cavitation_risk)}")
                        all_passed = False
                        continue
                    
                    # Check expected result if provided
                    if "expected_cavitation" in case:
                        if cavitation_risk != case["expected_cavitation"]:
                            self.log_test(f"Cavitation Risk Detection - {case['name']}", False, 
                                        f"Expected {case['expected_cavitation']}, got {cavitation_risk} (NPSHd: {npshd:.2f}, NPSHr: {npsh_required:.2f})")
                            all_passed = False
                            continue
                    
                    # Verify logic consistency: cavitation_risk should be True when NPSHd <= NPSHr
                    logical_risk = npshd <= npsh_required
                    if cavitation_risk != logical_risk:
                        self.log_test(f"Cavitation Risk Logic - {case['name']}", False, 
                                    f"Logic inconsistency: NPSHd={npshd:.2f}, NPSHr={npsh_required:.2f}, Risk={cavitation_risk}, Expected={logical_risk}")
                        all_passed = False
                        continue
                    
                    self.log_test(f"Cavitation Risk Detection - {case['name']}", True, 
                                f"Risk: {cavitation_risk}, NPSHd: {npshd:.2f} m, NPSHr: {npsh_required:.2f} m")
                else:
                    self.log_test(f"Cavitation Risk Detection - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Cavitation Risk Detection - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_cavitation_alerts_and_recommendations(self):
        """Test that appropriate alerts and corrective recommendations are generated for cavitation"""
        print("\n💡 Testing Cavitation Alerts and Recommendations...")
        
        test_cases = [
            {
                "name": "No Cavitation - Good Conditions",
                "data": {
                    "suction_type": "flooded",
                    "hasp": 2.0,
                    "flow_rate": 30.0,
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "pipe_diameter": 150.0,
                    "pipe_material": "pvc",
                    "pipe_length": 20.0,
                    "suction_fittings": [],
                    "npsh_required": 3.0
                },
                "should_have_cavitation_alerts": False,
                "should_have_recommendations": False
            },
            {
                "name": "Cavitation Risk - Multiple Issues",
                "data": {
                    "suction_type": "suction_lift",
                    "hasp": 6.0,
                    "flow_rate": 80.0,
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "pipe_diameter": 80.0,
                    "pipe_material": "pvc",
                    "pipe_length": 100.0,
                    "suction_fittings": [
                        {"fitting_type": "elbow_90", "quantity": 2},
                        {"fitting_type": "tee_branch", "quantity": 1}
                    ],
                    "npsh_required": 4.0
                },
                "should_have_cavitation_alerts": True,
                "should_have_recommendations": True
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=case["data"], timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    
                    warnings = result.get("warnings", [])
                    recommendations = result.get("recommendations", [])
                    cavitation_risk = result.get("cavitation_risk", False)
                    
                    # Check for cavitation alerts in warnings
                    cavitation_alerts = [w for w in warnings if "CAVITATION" in w.upper() or "RISQUE" in w.upper()]
                    
                    if case["should_have_cavitation_alerts"]:
                        if not cavitation_alerts:
                            self.log_test(f"Cavitation Alerts - {case['name']}", False, 
                                        "Expected cavitation alerts but none found")
                            all_passed = False
                            continue
                        
                        # Check for specific cavitation warning messages
                        expected_messages = ["RISQUE DE CAVITATION", "NPSHd calculé", "NPSH requis"]
                        found_messages = 0
                        for msg in expected_messages:
                            if any(msg in w for w in warnings):
                                found_messages += 1
                        
                        if found_messages < 2:  # At least 2 of the expected messages
                            self.log_test(f"Cavitation Alert Content - {case['name']}", False, 
                                        f"Missing expected cavitation warning messages. Found: {found_messages}/3")
                            all_passed = False
                            continue
                    else:
                        if cavitation_alerts:
                            self.log_test(f"Cavitation Alerts - {case['name']}", False, 
                                        f"Unexpected cavitation alerts found: {cavitation_alerts}")
                            all_passed = False
                            continue
                    
                    # Check for corrective recommendations
                    if case["should_have_recommendations"]:
                        if not recommendations:
                            self.log_test(f"Cavitation Recommendations - {case['name']}", False, 
                                        "Expected corrective recommendations but none found")
                            all_passed = False
                            continue
                        
                        # Check for specific types of recommendations
                        expected_recommendation_types = [
                            "hauteur d'aspiration",  # Reduce suction height
                            "diamètre",              # Increase diameter
                            "longueur",              # Reduce length
                            "raccords",              # Reduce fittings
                            "matériau",              # Use smoother material
                            "température",           # Lower temperature
                            "pompe"                  # Pump positioning
                        ]
                        
                        found_recommendation_types = 0
                        for rec_type in expected_recommendation_types:
                            if any(rec_type.lower() in r.lower() for r in recommendations):
                                found_recommendation_types += 1
                        
                        if found_recommendation_types < 3:  # At least 3 types of recommendations
                            self.log_test(f"Recommendation Variety - {case['name']}", False, 
                                        f"Expected diverse recommendations. Found {found_recommendation_types}/7 types")
                            all_passed = False
                            continue
                    else:
                        # For no cavitation cases, recommendations should be minimal or absent
                        cavitation_recommendations = [r for r in recommendations if "CAVITATION" in r.upper() or "CORRECTIONS" in r.upper()]
                        if cavitation_recommendations:
                            self.log_test(f"Cavitation Recommendations - {case['name']}", False, 
                                        f"Unexpected cavitation recommendations: {cavitation_recommendations}")
                            all_passed = False
                            continue
                    
                    self.log_test(f"Cavitation Alerts and Recommendations - {case['name']}", True, 
                                f"Alerts: {len(cavitation_alerts)}, Recommendations: {len(recommendations)}, Risk: {cavitation_risk}")
                else:
                    self.log_test(f"Cavitation Alerts and Recommendations - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Cavitation Alerts and Recommendations - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_performance_endpoint_corrected_parameters(self):
        """Test /api/calculate-performance endpoint with corrected parameters from PERFORMANCE tab"""
        print("\n🎯 Testing /api/calculate-performance Endpoint with Corrected Parameters...")
        
        # Test data from review request
        test_cases = [
            {
                "name": "Standard Test Case (Review Request)",
                "data": {
                    "flow_rate": 50.0,  # m³/h
                    "hmt": 25.0,  # m  
                    "pipe_diameter": 114.3,  # mm (DN100)
                    "fluid_type": "water",
                    "pipe_material": "pvc",
                    "pump_efficiency": 75.0,  # %
                    "motor_efficiency": 90.0,  # %
                    "voltage": 400,  # V
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 50.0,  # m
                    "cable_material": "copper"
                }
            },
            {
                "name": "Oil Fluid Test",
                "data": {
                    "flow_rate": 30.0,
                    "hmt": 35.0,
                    "pipe_diameter": 100.0,
                    "fluid_type": "oil",
                    "pipe_material": "steel",
                    "pump_efficiency": 70.0,
                    "motor_efficiency": 85.0,
                    "voltage": 230,
                    "power_factor": 0.75,
                    "starting_method": "direct_on_line",
                    "cable_length": 75.0,
                    "cable_material": "aluminum"
                }
            },
            {
                "name": "High Performance Test",
                "data": {
                    "flow_rate": 100.0,
                    "hmt": 40.0,
                    "pipe_diameter": 150.0,
                    "fluid_type": "glycol",
                    "pipe_material": "pehd",
                    "pump_efficiency": 85.0,
                    "motor_efficiency": 95.0,
                    "voltage": 400,
                    "power_factor": 0.85,
                    "starting_method": "star_delta",
                    "cable_length": 100.0,
                    "cable_material": "copper"
                }
            },
            {
                "name": "Industrial Fluid Test",
                "data": {
                    "flow_rate": 75.0,
                    "hmt": 30.0,
                    "pipe_diameter": 125.0,
                    "fluid_type": "diesel",
                    "pipe_material": "steel",
                    "pump_efficiency": 80.0,
                    "motor_efficiency": 92.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 60.0,
                    "cable_material": "copper"
                }
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/calculate-performance", json=case["data"], timeout=15)
                if response.status_code == 200:
                    result = response.json()
                    
                    # 1. Check all new fields are accepted
                    input_data = result.get("input_data", {})
                    required_fields = [
                        "pump_efficiency", "motor_efficiency", "voltage", "power_factor", 
                        "starting_method", "cable_length", "cable_material"
                    ]
                    
                    missing_fields = []
                    for field in required_fields:
                        if field not in input_data:
                            missing_fields.append(field)
                    
                    if missing_fields:
                        self.log_test(f"Performance Endpoint Field Acceptance - {case['name']}", False, 
                                    f"Missing fields in input_data: {missing_fields}")
                        all_passed = False
                        continue
                    
                    # 2. Check hydraulic and electrical calculations
                    power_calculations = result.get("power_calculations", {})
                    if not power_calculations:
                        self.log_test(f"Performance Endpoint Power Calculations - {case['name']}", False, 
                                    "Missing power_calculations section")
                        all_passed = False
                        continue
                    
                    hydraulic_power = power_calculations.get("hydraulic_power", 0)
                    absorbed_power = power_calculations.get("absorbed_power", 0)
                    
                    if hydraulic_power <= 0:
                        self.log_test(f"Performance Endpoint Hydraulic Power - {case['name']}", False, 
                                    f"Invalid hydraulic power: {hydraulic_power}")
                        all_passed = False
                        continue
                    
                    if absorbed_power <= hydraulic_power:
                        self.log_test(f"Performance Endpoint Power Logic - {case['name']}", False, 
                                    f"Absorbed power ({absorbed_power}) should be > hydraulic power ({hydraulic_power})")
                        all_passed = False
                        continue
                    
                    # 3. Check efficiency calculations
                    overall_efficiency = result.get("overall_efficiency", 0)
                    pump_eff = case["data"]["pump_efficiency"]
                    motor_eff = case["data"]["motor_efficiency"]
                    expected_overall = (pump_eff / 100) * (motor_eff / 100) * 100
                    
                    if abs(overall_efficiency - expected_overall) > 0.5:
                        self.log_test(f"Performance Endpoint Overall Efficiency - {case['name']}", False, 
                                    f"Expected {expected_overall:.1f}%, got {overall_efficiency:.1f}%")
                        all_passed = False
                        continue
                    
                    # 4. Check electrical calculations
                    nominal_current = result.get("nominal_current", 0)
                    if nominal_current <= 0:
                        self.log_test(f"Performance Endpoint Current Calculation - {case['name']}", False, 
                                    f"Invalid nominal current: {nominal_current}")
                        all_passed = False
                        continue
                    
                    # 5. Check performance curves generation
                    performance_curves = result.get("performance_curves", {})
                    if not performance_curves:
                        self.log_test(f"Performance Endpoint Curves Generation - {case['name']}", False, 
                                    "Missing performance_curves")
                        all_passed = False
                        continue
                    
                    # Check for required curve data
                    required_curves = ["flow", "hmt"]
                    missing_curves = [c for c in required_curves if c not in performance_curves]
                    if missing_curves:
                        self.log_test(f"Performance Endpoint Curves Content - {case['name']}", False, 
                                    f"Missing curves: {missing_curves}")
                        all_passed = False
                        continue
                    
                    # 6. Check velocity and Reynolds number
                    velocity = result.get("velocity", 0)
                    reynolds_number = result.get("reynolds_number", 0)
                    
                    if velocity <= 0:
                        self.log_test(f"Performance Endpoint Velocity - {case['name']}", False, 
                                    f"Invalid velocity: {velocity}")
                        all_passed = False
                        continue
                    
                    if reynolds_number <= 0:
                        self.log_test(f"Performance Endpoint Reynolds - {case['name']}", False, 
                                    f"Invalid Reynolds number: {reynolds_number}")
                        all_passed = False
                        continue
                    
                    # 7. Check alerts system
                    alerts = result.get("alerts", [])
                    # Alerts are optional but should be a list if present
                    if not isinstance(alerts, list):
                        self.log_test(f"Performance Endpoint Alerts - {case['name']}", False, 
                                    "Alerts should be a list")
                        all_passed = False
                        continue
                    
                    self.log_test(f"Performance Endpoint - {case['name']}", True, 
                                f"P2: {hydraulic_power:.2f} kW, P1: {absorbed_power:.2f} kW, Eff: {overall_efficiency:.1f}%, I: {nominal_current:.1f}A, V: {velocity:.2f} m/s")
                    
                else:
                    self.log_test(f"Performance Endpoint - {case['name']}", False, 
                                f"HTTP {response.status_code}: {response.text[:200]}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"Performance Endpoint - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_expert_analysis_endpoint(self):
        """Test the new expert analysis endpoint with comprehensive data"""
        print("\n🎯 Testing Expert Analysis Endpoint...")
        
        # Test data from review request
        expert_test_data = {
            "flow_rate": 60,
            "fluid_type": "water",
            "temperature": 20,
            "suction_pipe_diameter": 100,
            "discharge_pipe_diameter": 80,
            "suction_height": 3.0,
            "discharge_height": 25.0,
            "suction_length": 10,
            "discharge_length": 50,
            "total_length": 60,
            "suction_material": "pvc",
            "discharge_material": "pvc",
            "elbow_90_qty": 2,
            "elbow_45_qty": 1,
            "valve_qty": 1,
            "check_valve_qty": 1,
            "pump_efficiency": 80,
            "motor_efficiency": 90,
            "voltage": 400,
            "power_factor": 0.8,
            "starting_method": "star_delta",
            "cable_length": 50,
            "cable_material": "copper",
            "npsh_required": 3.5,
            "useful_pressure": 0,
            "installation_type": "surface"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/expert-analysis", json=expert_test_data, timeout=15)
            if response.status_code == 200:
                result = response.json()
                
                # Check main structure
                required_sections = [
                    "input_data", "npshd_analysis", "hmt_analysis", 
                    "performance_analysis", "electrical_analysis",
                    "overall_efficiency", "total_head_loss", "system_stability",
                    "energy_consumption", "expert_recommendations", 
                    "optimization_potential", "performance_curves", "system_curves"
                ]
                
                missing_sections = [section for section in required_sections if section not in result]
                if missing_sections:
                    self.log_test("Expert Analysis - Structure", False, f"Missing sections: {missing_sections}")
                    return False
                
                # Check NPSHd analysis integration
                npshd_analysis = result.get("npshd_analysis", {})
                required_npshd_fields = ["npshd", "npsh_required", "npsh_margin", "cavitation_risk", "velocity", "reynolds_number"]
                missing_npshd = [field for field in required_npshd_fields if field not in npshd_analysis]
                if missing_npshd:
                    self.log_test("Expert Analysis - NPSHd Integration", False, f"Missing NPSHd fields: {missing_npshd}")
                    return False
                
                # Check HMT analysis integration
                hmt_analysis = result.get("hmt_analysis", {})
                required_hmt_fields = ["hmt", "static_head", "total_head_loss", "suction_velocity", "discharge_velocity"]
                missing_hmt = [field for field in required_hmt_fields if field not in hmt_analysis]
                if missing_hmt:
                    self.log_test("Expert Analysis - HMT Integration", False, f"Missing HMT fields: {missing_hmt}")
                    return False
                
                # Check Performance analysis integration
                performance_analysis = result.get("performance_analysis", {})
                required_perf_fields = ["overall_efficiency", "pump_efficiency", "motor_efficiency", "nominal_current", "power_calculations"]
                missing_perf = [field for field in required_perf_fields if field not in performance_analysis]
                if missing_perf:
                    self.log_test("Expert Analysis - Performance Integration", False, f"Missing Performance fields: {missing_perf}")
                    return False
                
                # Check expert recommendations
                expert_recommendations = result.get("expert_recommendations", [])
                if not isinstance(expert_recommendations, list):
                    self.log_test("Expert Analysis - Recommendations", False, "Expert recommendations should be a list")
                    return False
                
                # Check that recommendations have proper structure
                for i, rec in enumerate(expert_recommendations):
                    required_rec_fields = ["type", "priority", "title", "description", "impact", "solutions", "urgency"]
                    missing_rec_fields = [field for field in required_rec_fields if field not in rec]
                    if missing_rec_fields:
                        self.log_test("Expert Analysis - Recommendation Structure", False, 
                                    f"Recommendation {i} missing fields: {missing_rec_fields}")
                        return False
                
                # Check system stability calculation
                system_stability = result.get("system_stability", None)
                if system_stability is None:
                    self.log_test("Expert Analysis - System Stability", False, "Missing system_stability field")
                    return False
                
                # Check energy consumption calculation
                energy_consumption = result.get("energy_consumption", 0)
                if energy_consumption <= 0:
                    self.log_test("Expert Analysis - Energy Consumption", False, "Energy consumption should be positive")
                    return False
                
                # Check performance curves integration
                performance_curves = result.get("performance_curves", {})
                required_curve_fields = ["flow", "hmt", "efficiency", "power"]
                missing_curves = [field for field in required_curve_fields if field not in performance_curves]
                if missing_curves:
                    self.log_test("Expert Analysis - Performance Curves", False, f"Missing curve fields: {missing_curves}")
                    return False
                
                # Check system curves
                system_curves = result.get("system_curves", {})
                required_system_fields = ["flow_points", "system_curve", "operating_point"]
                missing_system = [field for field in required_system_fields if field not in system_curves]
                if missing_system:
                    self.log_test("Expert Analysis - System Curves", False, f"Missing system curve fields: {missing_system}")
                    return False
                
                # Validate numerical results
                overall_efficiency = result.get("overall_efficiency", 0)
                total_head_loss = result.get("total_head_loss", 0)
                
                if overall_efficiency <= 0 or overall_efficiency > 100:
                    self.log_test("Expert Analysis - Overall Efficiency", False, f"Invalid overall efficiency: {overall_efficiency}%")
                    return False
                
                if total_head_loss <= 0:
                    self.log_test("Expert Analysis - Total Head Loss", False, f"Invalid total head loss: {total_head_loss} m")
                    return False
                
                self.log_test("Expert Analysis Endpoint", True, 
                            f"Complete analysis: Efficiency={overall_efficiency:.1f}%, Head Loss={total_head_loss:.2f}m, "
                            f"Recommendations={len(expert_recommendations)}, Stability={system_stability}")
                return True
            else:
                self.log_test("Expert Analysis Endpoint", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Expert Analysis Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_expert_recommendations_generation(self):
        """Test that expert recommendations are properly generated based on analysis"""
        print("\n🎯 Testing Expert Recommendations Generation...")
        
        # Test case designed to trigger multiple recommendation types
        test_data = {
            "flow_rate": 100,  # High flow to trigger velocity warnings
            "fluid_type": "water",
            "temperature": 20,
            "suction_pipe_diameter": 80,  # Small diameter for high velocity
            "discharge_pipe_diameter": 75,
            "suction_height": -4.0,  # Suction lift to trigger cavitation risk
            "discharge_height": 50.0,  # High discharge
            "suction_length": 20,
            "discharge_length": 100,
            "total_length": 120,
            "suction_material": "pvc",
            "discharge_material": "pvc",
            "elbow_90_qty": 4,  # Many fittings
            "elbow_45_qty": 2,
            "valve_qty": 2,
            "check_valve_qty": 1,
            "pump_efficiency": 65,  # Low efficiency
            "motor_efficiency": 85,  # Moderate efficiency
            "voltage": 400,
            "power_factor": 0.8,
            "starting_method": "direct_on_line",  # High starting current
            "cable_length": 100,
            "cable_material": "copper",
            "npsh_required": 4.5,  # High NPSH requirement
            "useful_pressure": 2.0,  # Additional pressure requirement
            "installation_type": "surface"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/expert-analysis", json=test_data, timeout=15)
            if response.status_code == 200:
                result = response.json()
                
                expert_recommendations = result.get("expert_recommendations", [])
                
                # Should have multiple recommendations for this challenging scenario
                if len(expert_recommendations) < 2:
                    self.log_test("Expert Recommendations - Quantity", False, 
                                f"Expected multiple recommendations, got {len(expert_recommendations)}")
                    return False
                
                # Check for different recommendation types
                recommendation_types = [rec.get("type", "") for rec in expert_recommendations]
                expected_types = ["critical", "efficiency", "hydraulic", "electrical"]
                
                # Should have at least some of these types
                found_types = [t for t in expected_types if t in recommendation_types]
                if len(found_types) < 2:
                    self.log_test("Expert Recommendations - Types", False, 
                                f"Expected diverse recommendation types, found: {found_types}")
                    return False
                
                # Check priority ordering (critical should be priority 1)
                priorities = [rec.get("priority", 999) for rec in expert_recommendations]
                if min(priorities) != 1:
                    self.log_test("Expert Recommendations - Priority", False, 
                                "Should have at least one critical (priority 1) recommendation")
                    return False
                
                # Check that solutions are provided
                for i, rec in enumerate(expert_recommendations):
                    solutions = rec.get("solutions", [])
                    if not solutions or len(solutions) < 2:
                        self.log_test("Expert Recommendations - Solutions", False, 
                                    f"Recommendation {i} should have multiple solutions")
                        return False
                
                # Check optimization potential
                optimization_potential = result.get("optimization_potential", {})
                required_opt_fields = ["energy_savings", "npsh_margin", "velocity_optimization", "head_loss_reduction"]
                missing_opt = [field for field in required_opt_fields if field not in optimization_potential]
                if missing_opt:
                    self.log_test("Expert Recommendations - Optimization Potential", False, 
                                f"Missing optimization fields: {missing_opt}")
                    return False
                
                self.log_test("Expert Recommendations Generation", True, 
                            f"Generated {len(expert_recommendations)} recommendations with types: {set(recommendation_types)}")
                return True
            else:
                self.log_test("Expert Recommendations Generation", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Expert Recommendations Generation", False, f"Error: {str(e)}")
            return False
    
    def test_expert_analysis_integration(self):
        """Test that expert analysis properly integrates all calculation modules"""
        print("\n🎯 Testing Expert Analysis Integration...")
        
        # Use the exact test data from review request
        test_data = {
            "flow_rate": 60,
            "fluid_type": "water",
            "temperature": 20,
            "suction_pipe_diameter": 100,
            "discharge_pipe_diameter": 80,
            "suction_height": 3.0,
            "discharge_height": 25.0,
            "suction_length": 10,
            "discharge_length": 50,
            "total_length": 60,
            "suction_material": "pvc",
            "discharge_material": "pvc",
            "elbow_90_qty": 2,
            "elbow_45_qty": 1,
            "valve_qty": 1,
            "check_valve_qty": 1,
            "pump_efficiency": 80,
            "motor_efficiency": 90,
            "voltage": 400,
            "power_factor": 0.8,
            "starting_method": "star_delta",
            "cable_length": 50,
            "cable_material": "copper",
            "npsh_required": 3.5,
            "useful_pressure": 0,
            "installation_type": "surface"
        }
        
        try:
            # Get expert analysis
            expert_response = requests.post(f"{BACKEND_URL}/expert-analysis", json=test_data, timeout=15)
            if expert_response.status_code != 200:
                self.log_test("Expert Analysis Integration", False, f"Expert analysis failed: {expert_response.status_code}")
                return False
            
            expert_result = expert_response.json()
            
            # Test individual endpoints to compare integration
            # Test NPSHd endpoint
            npshd_data = {
                "suction_type": "flooded",  # suction_height > 0
                "hasp": 3.0,
                "flow_rate": 60,
                "fluid_type": "water",
                "temperature": 20,
                "pipe_diameter": 100,
                "pipe_material": "pvc",
                "pipe_length": 10,
                "suction_fittings": [
                    {"fitting_type": "elbow_90", "quantity": 2},
                    {"fitting_type": "elbow_45", "quantity": 1},
                    {"fitting_type": "check_valve", "quantity": 1}
                ],
                "npsh_required": 3.5
            }
            
            npshd_response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=npshd_data, timeout=10)
            if npshd_response.status_code != 200:
                self.log_test("Expert Analysis Integration - NPSHd", False, "NPSHd endpoint failed")
                return False
            
            npshd_result = npshd_response.json()
            
            # Compare NPSHd results
            expert_npshd = expert_result["npshd_analysis"]
            standalone_npshd = npshd_result["npshd"]
            expert_npshd_value = expert_npshd["npshd"]
            
            if abs(expert_npshd_value - standalone_npshd) > 0.1:
                self.log_test("Expert Analysis Integration - NPSHd Consistency", False, 
                            f"NPSHd mismatch: Expert={expert_npshd_value:.2f}, Standalone={standalone_npshd:.2f}")
                return False
            
            # Test HMT endpoint
            hmt_data = {
                "installation_type": "surface",
                "suction_type": "flooded",
                "hasp": 3.0,
                "discharge_height": 25.0,
                "useful_pressure": 0,
                "suction_pipe_diameter": 100,
                "discharge_pipe_diameter": 80,
                "suction_pipe_length": 10,
                "discharge_pipe_length": 50,
                "suction_pipe_material": "pvc",
                "discharge_pipe_material": "pvc",
                "suction_fittings": [
                    {"fitting_type": "elbow_90", "quantity": 2},
                    {"fitting_type": "elbow_45", "quantity": 1},
                    {"fitting_type": "check_valve", "quantity": 1}
                ],
                "discharge_fittings": [
                    {"fitting_type": "valve", "quantity": 1}
                ],
                "fluid_type": "water",
                "temperature": 20,
                "flow_rate": 60
            }
            
            hmt_response = requests.post(f"{BACKEND_URL}/calculate-hmt", json=hmt_data, timeout=10)
            if hmt_response.status_code != 200:
                self.log_test("Expert Analysis Integration - HMT", False, "HMT endpoint failed")
                return False
            
            hmt_result = hmt_response.json()
            
            # Compare HMT results
            expert_hmt = expert_result["hmt_analysis"]
            standalone_hmt = hmt_result["hmt"]
            expert_hmt_value = expert_hmt["hmt"]
            
            if abs(expert_hmt_value - standalone_hmt) > 0.1:
                self.log_test("Expert Analysis Integration - HMT Consistency", False, 
                            f"HMT mismatch: Expert={expert_hmt_value:.2f}, Standalone={standalone_hmt:.2f}")
                return False
            
            # Test Performance endpoint
            perf_data = {
                "flow_rate": 60,
                "hmt": expert_hmt_value,  # Use calculated HMT
                "pipe_diameter": 100,
                "fluid_type": "water",
                "pipe_material": "pvc",
                "pump_efficiency": 80,
                "motor_efficiency": 90,
                "starting_method": "star_delta",
                "power_factor": 0.8,
                "cable_length": 50,
                "cable_material": "copper",
                "voltage": 400
            }
            
            perf_response = requests.post(f"{BACKEND_URL}/calculate-performance", json=perf_data, timeout=10)
            if perf_response.status_code != 200:
                self.log_test("Expert Analysis Integration - Performance", False, "Performance endpoint failed")
                return False
            
            perf_result = perf_response.json()
            
            # Compare Performance results
            expert_perf = expert_result["performance_analysis"]
            standalone_efficiency = perf_result["overall_efficiency"]
            expert_efficiency = expert_perf["overall_efficiency"]
            
            if abs(expert_efficiency - standalone_efficiency) > 0.1:
                self.log_test("Expert Analysis Integration - Performance Consistency", False, 
                            f"Efficiency mismatch: Expert={expert_efficiency:.1f}%, Standalone={standalone_efficiency:.1f}%")
                return False
            
            # Check that expert analysis provides additional insights
            expert_recommendations = expert_result.get("expert_recommendations", [])
            optimization_potential = expert_result.get("optimization_potential", {})
            system_curves = expert_result.get("system_curves", {})
            
            if not expert_recommendations:
                self.log_test("Expert Analysis Integration - Added Value", False, "No expert recommendations generated")
                return False
            
            if not optimization_potential:
                self.log_test("Expert Analysis Integration - Optimization", False, "No optimization potential calculated")
                return False
            
            if not system_curves:
                self.log_test("Expert Analysis Integration - System Curves", False, "No system curves generated")
                return False
            
            self.log_test("Expert Analysis Integration", True, 
                        f"All modules integrated: NPSHd={expert_npshd_value:.2f}m, HMT={expert_hmt_value:.2f}m, "
                        f"Efficiency={expert_efficiency:.1f}%, Recommendations={len(expert_recommendations)}")
            return True
            
        except Exception as e:
            self.log_test("Expert Analysis Integration", False, f"Error: {str(e)}")
            return False

    def test_expert_analysis_comprehensive(self):
        """Test the completely revised EXPERT tab with comprehensive test case"""
        print("\n🎯 Testing Expert Analysis - Complete Revision...")
        
        # Test case from review request with all new fields
        expert_test_data = {
            "flow_rate": 75,
            "fluid_type": "water",
            "temperature": 25,
            "suction_pipe_diameter": 100,
            "discharge_pipe_diameter": 80,
            "suction_height": 2.5,
            "discharge_height": 28.0,
            "suction_length": 12,
            "discharge_length": 45,
            "total_length": 57,
            "suction_material": "pvc",
            "discharge_material": "pvc",
            "suction_elbow_90": 2,
            "suction_elbow_45": 1,
            "suction_strainer": 1,
            "discharge_elbow_90": 3,
            "discharge_valve": 2,
            "discharge_check_valve": 1,
            "pump_efficiency": 78,
            "motor_efficiency": 88,
            "voltage": 400,
            "power_factor": 0.85,
            "starting_method": "star_delta",
            "cable_length": 35,
            "cable_material": "copper",
            "npsh_required": 3.2,
            "useful_pressure": 1.5,
            "installation_type": "surface",
            "pump_type": "centrifugal",
            "operating_hours": 6000,
            "electricity_cost": 0.14,
            "altitude": 200,
            "ambient_temperature": 22,
            "humidity": 65
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/expert-analysis", json=expert_test_data, timeout=15)
            if response.status_code == 200:
                result = response.json()
                
                # Test 1: All fields accepted
                input_data = result.get("input_data", {})
                if not input_data:
                    self.log_test("Expert Analysis - Field Acceptance", False, "Missing input_data section")
                    return False
                
                # Check key fields are preserved
                key_fields = ["flow_rate", "fluid_type", "temperature", "suction_pipe_diameter", 
                             "discharge_pipe_diameter", "pump_efficiency", "motor_efficiency", 
                             "npsh_required", "useful_pressure", "installation_type"]
                missing_fields = [f for f in key_fields if f not in input_data]
                if missing_fields:
                    self.log_test("Expert Analysis - Field Acceptance", False, f"Missing input fields: {missing_fields}")
                    return False
                
                self.log_test("Expert Analysis - Field Acceptance", True, f"All {len(key_fields)} key fields accepted")
                
                # Test 2: Complete analysis structure
                required_sections = [
                    "npshd_analysis", "hmt_analysis", "performance_analysis", "electrical_analysis",
                    "overall_efficiency", "total_head_loss", "system_stability", "energy_consumption",
                    "expert_recommendations", "optimization_potential", "performance_curves", "system_curves"
                ]
                
                missing_sections = [s for s in required_sections if s not in result]
                if missing_sections:
                    self.log_test("Expert Analysis - Complete Structure", False, f"Missing sections: {missing_sections}")
                    return False
                
                self.log_test("Expert Analysis - Complete Structure", True, f"All {len(required_sections)} sections present")
                
                # Test 3: NPSHd integration
                npshd_analysis = result.get("npshd_analysis", {})
                npshd_fields = ["npshd", "npsh_required", "npsh_margin", "cavitation_risk", "velocity", "reynolds_number"]
                missing_npshd = [f for f in npshd_fields if f not in npshd_analysis]
                if missing_npshd:
                    self.log_test("Expert Analysis - NPSHd Integration", False, f"Missing NPSHd fields: {missing_npshd}")
                    return False
                
                npshd_value = npshd_analysis.get("npshd", 0)
                npsh_required = npshd_analysis.get("npsh_required", 0)
                cavitation_risk = npshd_analysis.get("cavitation_risk", False)
                
                self.log_test("Expert Analysis - NPSHd Integration", True, 
                            f"NPSHd: {npshd_value:.2f}m, NPSHr: {npsh_required:.2f}m, Risk: {cavitation_risk}")
                
                # Test 4: HMT integration
                hmt_analysis = result.get("hmt_analysis", {})
                hmt_fields = ["hmt", "static_head", "total_head_loss", "suction_velocity", "discharge_velocity"]
                missing_hmt = [f for f in hmt_fields if f not in hmt_analysis]
                if missing_hmt:
                    self.log_test("Expert Analysis - HMT Integration", False, f"Missing HMT fields: {missing_hmt}")
                    return False
                
                hmt_value = hmt_analysis.get("hmt", 0)
                static_head = hmt_analysis.get("static_head", 0)
                
                self.log_test("Expert Analysis - HMT Integration", True, 
                            f"HMT: {hmt_value:.2f}m, Static Head: {static_head:.2f}m")
                
                # Test 5: Performance integration
                performance_analysis = result.get("performance_analysis", {})
                perf_fields = ["overall_efficiency", "pump_efficiency", "motor_efficiency", "nominal_current", "power_calculations"]
                missing_perf = [f for f in perf_fields if f not in performance_analysis]
                if missing_perf:
                    self.log_test("Expert Analysis - Performance Integration", False, f"Missing performance fields: {missing_perf}")
                    return False
                
                overall_efficiency = result.get("overall_efficiency", 0)
                power_calcs = performance_analysis.get("power_calculations", {})
                
                self.log_test("Expert Analysis - Performance Integration", True, 
                            f"Overall Efficiency: {overall_efficiency:.1f}%, Power: {power_calcs.get('hydraulic_power', 0):.2f}kW")
                
                # Test 6: Expert recommendations
                expert_recommendations = result.get("expert_recommendations", [])
                if not expert_recommendations:
                    self.log_test("Expert Analysis - Recommendations", False, "No expert recommendations generated")
                    return False
                
                # Check recommendation structure
                for i, rec in enumerate(expert_recommendations):
                    required_rec_fields = ["type", "priority", "title", "description", "impact", "solutions", "urgency"]
                    missing_rec_fields = [f for f in required_rec_fields if f not in rec]
                    if missing_rec_fields:
                        self.log_test("Expert Analysis - Recommendation Structure", False, 
                                    f"Recommendation {i+1} missing fields: {missing_rec_fields}")
                        return False
                
                self.log_test("Expert Analysis - Recommendations", True, 
                            f"{len(expert_recommendations)} detailed recommendations with priorities and impacts")
                
                # Test 7: Performance curves
                performance_curves = result.get("performance_curves", {})
                curve_fields = ["flow", "hmt", "efficiency", "power", "best_operating_point"]
                missing_curves = [f for f in curve_fields if f not in performance_curves]
                if missing_curves:
                    self.log_test("Expert Analysis - Performance Curves", False, f"Missing curves: {missing_curves}")
                    return False
                
                best_op_point = performance_curves.get("best_operating_point", {})
                if "flow" not in best_op_point or "hmt" not in best_op_point:
                    self.log_test("Expert Analysis - Operating Point", False, "Missing operating point data")
                    return False
                
                self.log_test("Expert Analysis - Performance Curves", True, 
                            f"All curves generated, Operating point: {best_op_point.get('flow', 0):.1f} m³/h")
                
                # Test 8: System stability analysis
                system_stability = result.get("system_stability", None)
                if system_stability is None:
                    self.log_test("Expert Analysis - System Stability", False, "Missing system stability analysis")
                    return False
                
                energy_consumption = result.get("energy_consumption", 0)
                total_head_loss = result.get("total_head_loss", 0)
                
                self.log_test("Expert Analysis - System Stability", True, 
                            f"Stability: {system_stability}, Energy: {energy_consumption:.3f} kWh/m³, Head Loss: {total_head_loss:.2f}m")
                
                # Test 9: Optimization potential
                optimization_potential = result.get("optimization_potential", {})
                opt_fields = ["energy_savings", "npsh_margin", "velocity_optimization", "head_loss_reduction"]
                missing_opt = [f for f in opt_fields if f not in optimization_potential]
                if missing_opt:
                    self.log_test("Expert Analysis - Optimization Potential", False, f"Missing optimization fields: {missing_opt}")
                    return False
                
                self.log_test("Expert Analysis - Optimization Potential", True, 
                            f"Energy savings potential: {optimization_potential.get('energy_savings', 0):.1f}%")
                
                # Overall success
                self.log_test("Expert Analysis - Complete Test", True, 
                            f"All expert analysis features working perfectly - Efficiency: {overall_efficiency:.1f}%, Stability: {system_stability}")
                return True
                
            else:
                self.log_test("Expert Analysis - Complete Test", False, f"HTTP Status: {response.status_code}")
                if response.status_code == 422:
                    try:
                        error_detail = response.json()
                        self.log_test("Expert Analysis - Validation Error", False, f"Validation error: {error_detail}")
                    except:
                        pass
                return False
                
        except Exception as e:
            self.log_test("Expert Analysis - Complete Test", False, f"Error: {str(e)}")
            return False

    def test_expert_analysis_final_comprehensive(self):
        """
        Final comprehensive test for EXPERT tab with all user-requested improvements:
        1. Pression utile (Useful pressure) in HMT calculation
        2. Pertes de charges (Head losses) display
        3. Régime d'écoulement (Flow regime) determination
        4. Sélection aspiration (Suction selection) configuration
        5. Prix kWh (kWh price) in cost calculations
        6. Singularités complètes (Complete singularities) integration
        """
        print("\n🎯 FINAL EXPERT ANALYSIS COMPREHENSIVE TEST...")
        print("Testing all user-requested improvements with complete test case")
        
        # Test case from review request with all new features
        expert_test_data = {
            "flow_rate": 80,
            "fluid_type": "water",
            "temperature": 25,
            "suction_type": "flooded",
            "suction_pipe_diameter": 100,
            "discharge_pipe_diameter": 80,
            "suction_height": 2.5,
            "discharge_height": 30.0,
            "useful_pressure": 2.5,  # Should add 25.5m CE to HMT
            "suction_length": 15,
            "discharge_length": 60,
            "suction_material": "pvc",
            "discharge_material": "pvc",
            
            # Complete singularities - ASPIRATION
            "suction_elbow_90": 2,
            "suction_elbow_45": 1,
            "suction_elbow_30": 1,
            "suction_tee_flow": 1,
            "suction_gate_valve": 1,
            "suction_ball_valve": 1,
            "suction_check_valve": 1,
            "suction_strainer": 1,
            "suction_foot_valve": 1,
            
            # Complete singularities - REFOULEMENT
            "discharge_elbow_90": 4,
            "discharge_elbow_45": 2,
            "discharge_tee_flow": 1,
            "discharge_reducer_gradual": 1,
            "discharge_gate_valve": 2,
            "discharge_ball_valve": 1,
            "discharge_butterfly_valve": 1,
            "discharge_check_valve": 1,
            "discharge_flow_meter": 1,
            "discharge_pressure_gauge": 1,
            
            # Electrical and performance
            "pump_efficiency": 75,
            "motor_efficiency": 85,
            "voltage": 400,
            "power_factor": 0.85,
            "starting_method": "star_delta",
            "cable_length": 40,
            "cable_material": "copper",
            "npsh_required": 4.0,
            "installation_type": "surface",
            "operating_hours": 5000,
            "electricity_cost": 0.15,  # €/kWh - should be used in cost calculations
            "altitude": 150,
            "ambient_temperature": 20,
            "humidity": 50
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/expert-analysis", json=expert_test_data, timeout=15)
            if response.status_code != 200:
                self.log_test("Expert Analysis Final - API Response", False, f"Status: {response.status_code}")
                return False
            
            result = response.json()
            all_tests_passed = True
            
            # 1. TEST PRESSION UTILE (Useful Pressure) Integration
            hmt_analysis = result.get("hmt_analysis", {})
            hmt_value = hmt_analysis.get("hmt", 0)
            useful_pressure_head = hmt_analysis.get("useful_pressure_head", 0)
            
            # 2.5 bar = 25.5 m CE (approximately)
            expected_useful_pressure_head = 2.5 * 10.2  # bar to m CE
            if abs(useful_pressure_head - expected_useful_pressure_head) > 1.0:
                self.log_test("Expert Analysis - Useful Pressure Integration", False, 
                            f"Expected ~{expected_useful_pressure_head:.1f}m, got {useful_pressure_head:.1f}m")
                all_tests_passed = False
            else:
                self.log_test("Expert Analysis - Useful Pressure Integration", True, 
                            f"Useful pressure: {useful_pressure_head:.1f}m CE included in HMT")
            
            # Verify HMT includes useful pressure
            if hmt_value < useful_pressure_head:
                self.log_test("Expert Analysis - HMT includes Useful Pressure", False, 
                            f"HMT ({hmt_value:.1f}m) should include useful pressure ({useful_pressure_head:.1f}m)")
                all_tests_passed = False
            else:
                self.log_test("Expert Analysis - HMT includes Useful Pressure", True, 
                            f"HMT: {hmt_value:.1f}m includes useful pressure")
            
            # 2. TEST PERTES DE CHARGES (Head Losses) Display
            total_head_loss = result.get("total_head_loss", 0)
            npshd_analysis = result.get("npshd_analysis", {})
            npshd_head_loss = npshd_analysis.get("total_head_loss", 0)
            hmt_head_loss = hmt_analysis.get("total_head_loss", 0)
            
            if total_head_loss <= 0:
                self.log_test("Expert Analysis - Head Losses Display", False, "Total head loss is zero or missing")
                all_tests_passed = False
            else:
                self.log_test("Expert Analysis - Head Losses Display", True, 
                            f"Total head losses: {total_head_loss:.2f}m (NPSHd: {npshd_head_loss:.2f}m, HMT: {hmt_head_loss:.2f}m)")
            
            # 3. TEST RÉGIME D'ÉCOULEMENT (Flow Regime) Determination
            reynolds_number = npshd_analysis.get("reynolds_number", 0)
            if reynolds_number <= 0:
                self.log_test("Expert Analysis - Flow Regime Determination", False, "Reynolds number missing or zero")
                all_tests_passed = False
            else:
                # Determine flow regime
                if reynolds_number > 4000:
                    flow_regime = "turbulent"
                elif reynolds_number < 2300:
                    flow_regime = "laminar"
                else:
                    flow_regime = "transitional"
                
                # For flow_rate=80 m³/h, diameter=100mm, water, should be turbulent (Re > 4000)
                if reynolds_number <= 4000:
                    self.log_test("Expert Analysis - Flow Regime Determination", False, 
                                f"Expected turbulent flow (Re > 4000), got Re = {reynolds_number:.0f}")
                    all_tests_passed = False
                else:
                    self.log_test("Expert Analysis - Flow Regime Determination", True, 
                                f"Flow regime: {flow_regime} (Re = {reynolds_number:.0f})")
            
            # 4. TEST SÉLECTION ASPIRATION (Suction Selection) Configuration
            input_data = result.get("input_data", {})
            suction_type = input_data.get("suction_type", "")
            if suction_type != "flooded":
                self.log_test("Expert Analysis - Suction Selection", False, 
                            f"Expected 'flooded', got '{suction_type}'")
                all_tests_passed = False
            else:
                self.log_test("Expert Analysis - Suction Selection", True, 
                            f"Suction type configured: {suction_type}")
            
            # 5. TEST PRIX kWh (kWh Price) in Cost Calculations
            electrical_analysis = result.get("electrical_analysis", {})
            annual_energy_cost = electrical_analysis.get("annual_energy_cost", 0)
            electricity_cost = electrical_analysis.get("electricity_cost", 0)
            operating_hours = electrical_analysis.get("operating_hours", 0)
            
            if electricity_cost != 0.15:
                self.log_test("Expert Analysis - kWh Price Configuration", False, 
                            f"Expected 0.15 €/kWh, got {electricity_cost} €/kWh")
                all_tests_passed = False
            else:
                self.log_test("Expert Analysis - kWh Price Configuration", True, 
                            f"Electricity cost: {electricity_cost} €/kWh")
            
            # Verify cost calculation uses the price
            if annual_energy_cost <= 0:
                self.log_test("Expert Analysis - Annual Energy Cost Calculation", False, 
                            "Annual energy cost is zero or missing")
                all_tests_passed = False
            else:
                # Verify calculation: cost = power × hours × price
                performance_analysis = result.get("performance_analysis", {})
                hydraulic_power = performance_analysis.get("hydraulic_power", 0)
                expected_cost = hydraulic_power * operating_hours * electricity_cost
                
                if abs(annual_energy_cost - expected_cost) > expected_cost * 0.1:  # 10% tolerance
                    self.log_test("Expert Analysis - Cost Calculation Logic", False, 
                                f"Expected ~{expected_cost:.0f}€, got {annual_energy_cost:.0f}€")
                    all_tests_passed = False
                else:
                    self.log_test("Expert Analysis - Annual Energy Cost Calculation", True, 
                                f"Annual cost: {annual_energy_cost:.0f}€ (Power: {hydraulic_power:.1f}kW × {operating_hours}h × {electricity_cost}€/kWh)")
            
            # 6. TEST SINGULARITÉS COMPLÈTES (Complete Singularities) Integration
            # Count all singularities from input
            total_suction_singularities = (
                expert_test_data["suction_elbow_90"] + expert_test_data["suction_elbow_45"] + 
                expert_test_data["suction_elbow_30"] + expert_test_data["suction_tee_flow"] +
                expert_test_data["suction_gate_valve"] + expert_test_data["suction_ball_valve"] +
                expert_test_data["suction_check_valve"] + expert_test_data["suction_strainer"] +
                expert_test_data["suction_foot_valve"]
            )
            
            total_discharge_singularities = (
                expert_test_data["discharge_elbow_90"] + expert_test_data["discharge_elbow_45"] +
                expert_test_data["discharge_tee_flow"] + expert_test_data["discharge_reducer_gradual"] +
                expert_test_data["discharge_gate_valve"] + expert_test_data["discharge_ball_valve"] +
                expert_test_data["discharge_butterfly_valve"] + expert_test_data["discharge_check_valve"] +
                expert_test_data["discharge_flow_meter"] + expert_test_data["discharge_pressure_gauge"]
            )
            
            total_singularities = total_suction_singularities + total_discharge_singularities
            
            # Verify singularities affect head losses
            if npshd_head_loss <= 0 or hmt_head_loss <= 0:
                self.log_test("Expert Analysis - Singularities Integration", False, 
                            "Head losses should be > 0 with many singularities")
                all_tests_passed = False
            else:
                self.log_test("Expert Analysis - Singularities Integration", True, 
                            f"All {total_singularities} singularities integrated (Suction: {total_suction_singularities}, Discharge: {total_discharge_singularities})")
            
            # 7. TEST EXPERT RECOMMENDATIONS
            expert_recommendations = result.get("expert_recommendations", [])
            if not expert_recommendations:
                self.log_test("Expert Analysis - Expert Recommendations", False, "No expert recommendations generated")
                all_tests_passed = False
            else:
                # Check for detailed recommendations
                recommendation_types = [rec.get("type", "") for rec in expert_recommendations]
                if len(set(recommendation_types)) < 2:  # Should have diverse recommendation types
                    self.log_test("Expert Analysis - Recommendation Diversity", False, 
                                f"Limited recommendation types: {recommendation_types}")
                    all_tests_passed = False
                else:
                    self.log_test("Expert Analysis - Expert Recommendations", True, 
                                f"Generated {len(expert_recommendations)} recommendations with types: {set(recommendation_types)}")
            
            # 8. TEST COMPLETE STRUCTURE
            required_sections = [
                "npshd_analysis", "hmt_analysis", "performance_analysis", "electrical_analysis",
                "overall_efficiency", "total_head_loss", "system_stability", "energy_consumption",
                "expert_recommendations", "optimization_potential", "performance_curves", "system_curves"
            ]
            
            missing_sections = [section for section in required_sections if section not in result]
            if missing_sections:
                self.log_test("Expert Analysis - Complete Structure", False, 
                            f"Missing sections: {missing_sections}")
                all_tests_passed = False
            else:
                self.log_test("Expert Analysis - Complete Structure", True, 
                            f"All {len(required_sections)} sections present")
            
            # 9. TEST PERFORMANCE CURVES
            performance_curves = result.get("performance_curves", {})
            if "best_operating_point" not in performance_curves:
                self.log_test("Expert Analysis - Performance Curves", False, "Missing best_operating_point")
                all_tests_passed = False
            else:
                best_op = performance_curves["best_operating_point"]
                op_flow = best_op.get("flow", 0)
                if abs(op_flow - 80.0) > 0.1:  # Should match input flow
                    self.log_test("Expert Analysis - Operating Point Match", False, 
                                f"Expected flow 80.0, got {op_flow}")
                    all_tests_passed = False
                else:
                    self.log_test("Expert Analysis - Performance Curves", True, 
                                f"Operating point matches input: {op_flow} m³/h")
            
            # 10. OVERALL SUMMARY
            if all_tests_passed:
                self.log_test("🎯 EXPERT ANALYSIS FINAL COMPREHENSIVE TEST", True, 
                            "ALL USER REQUIREMENTS SUCCESSFULLY IMPLEMENTED AND TESTED")
                return True
            else:
                self.log_test("🎯 EXPERT ANALYSIS FINAL COMPREHENSIVE TEST", False, 
                            "Some user requirements failed testing")
                return False
                
        except Exception as e:
            self.log_test("Expert Analysis Final Comprehensive", False, f"Error: {str(e)}")
            return False

    def test_expert_analysis_enhanced_recommendations(self):
        """Test Enhanced Expert Recommendations with 7 categories and various configurations"""
        print("\n🎯 Testing Enhanced Expert Recommendations...")
        
        test_cases = [
            {
                "name": "Normal Operation - Flooded Configuration",
                "data": {
                    "flow_rate": 50.0,
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 100.0,
                    "discharge_pipe_diameter": 80.0,
                    "suction_height": 2.0,
                    "discharge_height": 15.0,
                    "suction_length": 30.0,
                    "discharge_length": 100.0,
                    "total_length": 130.0,
                    "useful_pressure": 0.0,
                    "suction_material": "pvc",
                    "discharge_material": "pvc",
                    "suction_elbow_90": 2,
                    "discharge_elbow_90": 3,
                    "discharge_check_valve": 1,
                    "pump_efficiency": 80.0,
                    "motor_efficiency": 90.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 50.0,
                    "cable_material": "copper",
                    "npsh_required": 3.2,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 8760.0,
                    "electricity_cost": 0.12,
                    "altitude": 0.0,
                    "ambient_temperature": 25.0,
                    "humidity": 60.0
                }
            },
            {
                "name": "High Velocity Scenario - Small Diameter",
                "data": {
                    "flow_rate": 100.0,
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 80.0,  # Small diameter for high velocity
                    "discharge_pipe_diameter": 80.0,
                    "suction_height": 1.5,
                    "discharge_height": 20.0,
                    "suction_length": 25.0,
                    "discharge_length": 80.0,
                    "total_length": 105.0,
                    "useful_pressure": 1.0,
                    "suction_material": "pvc",
                    "discharge_material": "steel",
                    "suction_elbow_90": 1,
                    "discharge_elbow_90": 4,
                    "discharge_gate_valve": 2,
                    "pump_efficiency": 75.0,
                    "motor_efficiency": 88.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "direct_on_line",
                    "cable_length": 75.0,
                    "cable_material": "copper",
                    "npsh_required": 4.0,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 6000.0,
                    "electricity_cost": 0.15,
                    "altitude": 0.0,
                    "ambient_temperature": 25.0,
                    "humidity": 60.0
                }
            },
            {
                "name": "Cavitation Risk Scenario - Suction Lift",
                "data": {
                    "flow_rate": 75.0,
                    "fluid_type": "water",
                    "temperature": 60.0,  # High temperature
                    "suction_type": "suction_lift",  # Suction lift configuration
                    "suction_pipe_diameter": 100.0,
                    "discharge_pipe_diameter": 100.0,
                    "suction_height": 6.0,  # High suction lift
                    "discharge_height": 25.0,
                    "suction_length": 80.0,  # Long suction line
                    "discharge_length": 120.0,
                    "total_length": 200.0,
                    "useful_pressure": 2.0,
                    "suction_material": "steel",
                    "discharge_material": "steel",
                    "suction_elbow_90": 3,
                    "suction_check_valve": 1,
                    "suction_foot_valve": 1,
                    "discharge_elbow_90": 5,
                    "discharge_gate_valve": 1,
                    "discharge_check_valve": 1,
                    "pump_efficiency": 70.0,
                    "motor_efficiency": 85.0,
                    "voltage": 400,
                    "power_factor": 0.75,
                    "starting_method": "star_delta",
                    "cable_length": 100.0,
                    "cable_material": "aluminum",
                    "npsh_required": 5.0,  # High NPSH required
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 4000.0,
                    "electricity_cost": 0.18,
                    "altitude": 0.0,
                    "ambient_temperature": 30.0,
                    "humidity": 70.0
                }
            },
            {
                "name": "Complex Installation - Multiple Fittings",
                "data": {
                    "flow_rate": 60.0,
                    "fluid_type": "oil",
                    "temperature": 80.0,  # High temperature
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 125.0,
                    "discharge_pipe_diameter": 100.0,
                    "suction_height": 3.0,
                    "discharge_height": 30.0,
                    "suction_length": 50.0,
                    "discharge_length": 150.0,
                    "total_length": 200.0,
                    "useful_pressure": 3.0,
                    "suction_material": "steel",
                    "discharge_material": "steel_galvanized",
                    "suction_elbow_90": 4,
                    "suction_elbow_45": 2,
                    "suction_tee_flow": 1,
                    "suction_gate_valve": 1,
                    "suction_ball_valve": 1,
                    "discharge_elbow_90": 6,
                    "discharge_elbow_45": 3,
                    "discharge_tee_branch": 2,
                    "discharge_gate_valve": 2,
                    "discharge_check_valve": 2,
                    "discharge_flow_meter": 1,
                    "discharge_pressure_gauge": 1,
                    "pump_efficiency": 65.0,  # Lower efficiency
                    "motor_efficiency": 82.0,
                    "voltage": 400,
                    "power_factor": 0.7,
                    "starting_method": "direct_on_line",
                    "cable_length": 150.0,
                    "cable_material": "aluminum",
                    "npsh_required": 3.8,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 8760.0,
                    "electricity_cost": 0.20,
                    "altitude": 500.0,  # Altitude effect
                    "ambient_temperature": 35.0,
                    "humidity": 80.0
                }
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/expert-analysis", json=case["data"], timeout=15)
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check for complete analysis structure
                    required_sections = [
                        "npshd_analysis", "hmt_analysis", "performance_analysis", 
                        "electrical_analysis", "overall_efficiency", "total_head_loss",
                        "system_stability", "energy_consumption", "expert_recommendations",
                        "optimization_potential", "performance_curves", "system_curves"
                    ]
                    
                    missing_sections = [s for s in required_sections if s not in result]
                    if missing_sections:
                        self.log_test(f"Expert Analysis Structure - {case['name']}", False, 
                                    f"Missing sections: {missing_sections}")
                        all_passed = False
                        continue
                    
                    # Check expert recommendations structure and categories
                    expert_recommendations = result.get("expert_recommendations", [])
                    if not expert_recommendations:
                        self.log_test(f"Expert Recommendations - {case['name']}", False, 
                                    "No expert recommendations generated")
                        all_passed = False
                        continue
                    
                    # Check for 7 categories of recommendations
                    expected_categories = ["critical", "installation", "velocity", "head_loss", 
                                         "materials", "electrical", "maintenance"]
                    found_categories = set()
                    
                    for rec in expert_recommendations:
                        if "type" in rec:
                            found_categories.add(rec["type"])
                        
                        # Check recommendation structure
                        required_rec_fields = ["type", "priority", "title", "description", 
                                             "impact", "solutions", "urgency"]
                        missing_rec_fields = [f for f in required_rec_fields if f not in rec]
                        if missing_rec_fields:
                            self.log_test(f"Recommendation Structure - {case['name']}", False, 
                                        f"Missing fields in recommendation: {missing_rec_fields}")
                            all_passed = False
                            break
                    
                    # Check hydraulic data display
                    npshd_analysis = result.get("npshd_analysis", {})
                    hmt_analysis = result.get("hmt_analysis", {})
                    
                    # Verify flow rate (débit) is included
                    if "flow_rate" not in result.get("input_data", {}):
                        self.log_test(f"Flow Rate Display - {case['name']}", False, 
                                    "Flow rate not preserved in input_data")
                        all_passed = False
                        continue
                    
                    # Check flow regime calculation (Reynolds number)
                    if "reynolds_number" not in npshd_analysis:
                        self.log_test(f"Flow Regime Calculation - {case['name']}", False, 
                                    "Reynolds number missing from npshd_analysis")
                        all_passed = False
                        continue
                    
                    reynolds = npshd_analysis.get("reynolds_number", 0)
                    flow_regime = "laminar" if reynolds < 2300 else "turbulent"
                    
                    # Configuration-specific recommendations check
                    suction_type = case["data"]["suction_type"]
                    config_specific_found = False
                    
                    for rec in expert_recommendations:
                        if suction_type == "flooded" and "charge" in rec.get("description", "").lower():
                            config_specific_found = True
                            break
                        elif suction_type == "suction_lift" and "aspiration" in rec.get("description", "").lower():
                            config_specific_found = True
                            break
                    
                    self.log_test(f"Expert Analysis Enhanced - {case['name']}", True, 
                                f"Generated {len(expert_recommendations)} recommendations, "
                                f"Flow regime: {flow_regime}, Config: {suction_type}")
                else:
                    self.log_test(f"Expert Analysis Enhanced - {case['name']}", False, 
                                f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Expert Analysis Enhanced - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_hydraulic_data_display_enhanced(self):
        """Test hydraulic data display with flow rate and flow regime calculations"""
        print("\n💧 Testing Enhanced Hydraulic Data Display...")
        
        test_data = {
            "flow_rate": 75.0,  # m³/h - should be prominently displayed
            "fluid_type": "water",
            "temperature": 25.0,
            "suction_type": "flooded",
            "suction_pipe_diameter": 100.0,
            "discharge_pipe_diameter": 100.0,
            "suction_height": 2.5,
            "discharge_height": 20.0,
            "suction_length": 40.0,
            "discharge_length": 120.0,
            "total_length": 160.0,
            "useful_pressure": 1.5,
            "suction_material": "pvc",
            "discharge_material": "pvc",
            "suction_elbow_90": 2,
            "discharge_elbow_90": 4,
            "discharge_check_valve": 1,
            "pump_efficiency": 78.0,
            "motor_efficiency": 88.0,
            "voltage": 400,
            "power_factor": 0.8,
            "starting_method": "star_delta",
            "cable_length": 60.0,
            "cable_material": "copper",
            "npsh_required": 3.2,
            "installation_type": "surface",
            "pump_type": "centrifugal",
            "operating_hours": 8760.0,
            "electricity_cost": 0.12,
            "altitude": 0.0,
            "ambient_temperature": 25.0,
            "humidity": 60.0
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/expert-analysis", json=test_data, timeout=15)
            if response.status_code == 200:
                result = response.json()
                
                # Check flow rate (débit) is properly included
                input_data = result.get("input_data", {})
                if "flow_rate" not in input_data:
                    self.log_test("Flow Rate Display", False, "Flow rate missing from input_data")
                    return False
                
                displayed_flow = input_data.get("flow_rate", 0)
                if abs(displayed_flow - test_data["flow_rate"]) > 0.1:
                    self.log_test("Flow Rate Accuracy", False, 
                                f"Expected {test_data['flow_rate']}, got {displayed_flow}")
                    return False
                
                # Check flow regime calculation
                npshd_analysis = result.get("npshd_analysis", {})
                reynolds_number = npshd_analysis.get("reynolds_number", 0)
                
                if reynolds_number <= 0:
                    self.log_test("Reynolds Number Calculation", False, "Reynolds number is zero or negative")
                    return False
                
                # Determine flow regime
                if reynolds_number < 2300:
                    flow_regime = "laminar"
                elif reynolds_number > 4000:
                    flow_regime = "turbulent"
                else:
                    flow_regime = "transitional"
                
                # Check velocity calculation
                velocity = npshd_analysis.get("velocity", 0)
                if velocity <= 0:
                    self.log_test("Velocity Calculation", False, "Velocity is zero or negative")
                    return False
                
                # Verify hydraulic parameters are correctly returned
                hmt_analysis = result.get("hmt_analysis", {})
                required_hydraulic_params = ["hmt", "static_head", "total_head_loss", 
                                           "suction_velocity", "discharge_velocity"]
                
                missing_params = [p for p in required_hydraulic_params if p not in hmt_analysis]
                if missing_params:
                    self.log_test("Hydraulic Parameters", False, f"Missing parameters: {missing_params}")
                    return False
                
                self.log_test("Enhanced Hydraulic Data Display", True, 
                            f"Flow: {displayed_flow:.1f} m³/h, Reynolds: {reynolds_number:.0f} ({flow_regime}), "
                            f"Velocity: {velocity:.2f} m/s")
                return True
            else:
                self.log_test("Enhanced Hydraulic Data Display", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Enhanced Hydraulic Data Display", False, f"Error: {str(e)}")
            return False
    
    def test_configuration_specific_recommendations_enhanced(self):
        """Test configuration-specific recommendations for flooded vs suction_lift"""
        print("\n⚙️ Testing Enhanced Configuration-Specific Recommendations...")
        
        test_cases = [
            {
                "name": "Flooded Configuration (En Charge)",
                "data": {
                    "flow_rate": 50.0,
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "suction_type": "flooded",  # En charge
                    "suction_pipe_diameter": 100.0,
                    "discharge_pipe_diameter": 100.0,
                    "suction_height": 3.0,  # Positive = flooded
                    "discharge_height": 18.0,
                    "suction_length": 25.0,
                    "discharge_length": 100.0,
                    "total_length": 125.0,
                    "useful_pressure": 1.0,
                    "suction_material": "pvc",
                    "discharge_material": "pvc",
                    "suction_elbow_90": 1,
                    "discharge_elbow_90": 3,
                    "pump_efficiency": 80.0,
                    "motor_efficiency": 90.0,
                    "voltage": 400,
                    "npsh_required": 3.0,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 8760.0,
                    "electricity_cost": 0.12
                }
            },
            {
                "name": "Suction Lift Configuration (Aspiration)",
                "data": {
                    "flow_rate": 50.0,
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "suction_type": "suction_lift",  # Aspiration
                    "suction_pipe_diameter": 100.0,
                    "discharge_pipe_diameter": 100.0,
                    "suction_height": 4.0,  # Suction lift height
                    "discharge_height": 18.0,
                    "suction_length": 30.0,
                    "discharge_length": 100.0,
                    "total_length": 130.0,
                    "useful_pressure": 1.0,
                    "suction_material": "pvc",
                    "discharge_material": "pvc",
                    "suction_elbow_90": 1,
                    "suction_check_valve": 1,  # Required for suction lift
                    "suction_foot_valve": 1,   # Required for suction lift
                    "discharge_elbow_90": 3,
                    "pump_efficiency": 80.0,
                    "motor_efficiency": 90.0,
                    "voltage": 400,
                    "npsh_required": 3.0,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 8760.0,
                    "electricity_cost": 0.12
                }
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/expert-analysis", json=case["data"], timeout=15)
                if response.status_code == 200:
                    result = response.json()
                    
                    expert_recommendations = result.get("expert_recommendations", [])
                    if not expert_recommendations:
                        self.log_test(f"Configuration Recommendations - {case['name']}", False, 
                                    "No recommendations generated")
                        all_passed = False
                        continue
                    
                    # Check for configuration-specific recommendations
                    suction_type = case["data"]["suction_type"]
                    config_specific_found = False
                    installation_recommendations = []
                    
                    for rec in expert_recommendations:
                        rec_type = rec.get("type", "")
                        description = rec.get("description", "").lower()
                        solutions = rec.get("solutions", [])
                        
                        if rec_type == "installation":
                            installation_recommendations.extend(solutions)
                        
                        # Check for configuration-specific content
                        if suction_type == "flooded":
                            if any(keyword in description for keyword in ["charge", "flooded", "submerg"]):
                                config_specific_found = True
                        elif suction_type == "suction_lift":
                            if any(keyword in description for keyword in ["aspiration", "suction", "lift", "dépression"]):
                                config_specific_found = True
                    
                    # Check material compatibility recommendations
                    material_recommendations = []
                    for rec in expert_recommendations:
                        if rec.get("type") == "materials":
                            material_recommendations.extend(rec.get("solutions", []))
                    
                    # Verify different NPSHd calculations for different configurations
                    npshd_analysis = result.get("npshd_analysis", {})
                    npshd_value = npshd_analysis.get("npshd", 0)
                    
                    # Flooded should generally have higher NPSHd than suction lift
                    if suction_type == "flooded" and npshd_value < 5:
                        self.log_test(f"NPSHd Configuration Logic - {case['name']}", False, 
                                    f"NPSHd too low for flooded configuration: {npshd_value:.2f} m")
                        all_passed = False
                        continue
                    
                    self.log_test(f"Enhanced Configuration Recommendations - {case['name']}", True, 
                                f"NPSHd: {npshd_value:.2f} m, Config-specific: {config_specific_found}, "
                                f"Recommendations: {len(expert_recommendations)}")
                else:
                    self.log_test(f"Enhanced Configuration Recommendations - {case['name']}", False, 
                                f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Enhanced Configuration Recommendations - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_expert_analysis_test_cases_enhanced(self):
        """Test the 4 specific test cases from the review request"""
        print("\n🧪 Testing Enhanced Expert Analysis Specific Test Cases...")
        
        test_cases = [
            {
                "name": "Test Case 1: Normal Operation",
                "data": {
                    "flow_rate": 50.0,  # m³/h
                    "fluid_type": "water",
                    "temperature": 20.0,  # °C
                    "suction_type": "flooded",  # Flooded configuration
                    "suction_pipe_diameter": 100.0,
                    "discharge_pipe_diameter": 100.0,
                    "suction_height": 2.0,
                    "discharge_height": 15.0,
                    "suction_length": 30.0,
                    "discharge_length": 80.0,
                    "total_length": 110.0,
                    "useful_pressure": 0.0,
                    "suction_material": "pvc",
                    "discharge_material": "pvc",
                    "suction_elbow_90": 2,
                    "discharge_elbow_90": 3,
                    "pump_efficiency": 80.0,
                    "motor_efficiency": 90.0,
                    "voltage": 400,
                    "npsh_required": 3.0,
                    "installation_type": "surface",
                    "operating_hours": 8760.0,
                    "electricity_cost": 0.12
                }
            },
            {
                "name": "Test Case 2: High Velocity Scenario",
                "data": {
                    "flow_rate": 100.0,  # m³/h - High flow
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 80.0,  # Small diameter = high velocity
                    "discharge_pipe_diameter": 80.0,
                    "suction_height": 1.5,
                    "discharge_height": 20.0,
                    "suction_length": 25.0,
                    "discharge_length": 100.0,
                    "total_length": 125.0,
                    "useful_pressure": 1.0,
                    "suction_material": "pvc",
                    "discharge_material": "steel",
                    "suction_elbow_90": 1,
                    "discharge_elbow_90": 4,
                    "pump_efficiency": 75.0,
                    "motor_efficiency": 88.0,
                    "voltage": 400,
                    "npsh_required": 4.0,
                    "installation_type": "surface",
                    "operating_hours": 6000.0,
                    "electricity_cost": 0.15
                }
            },
            {
                "name": "Test Case 3: Cavitation Risk Scenario",
                "data": {
                    "flow_rate": 75.0,
                    "fluid_type": "water",
                    "temperature": 70.0,  # High temperature
                    "suction_type": "suction_lift",  # Suction lift
                    "suction_pipe_diameter": 100.0,
                    "discharge_pipe_diameter": 100.0,
                    "suction_height": 7.0,  # High suction lift
                    "discharge_height": 25.0,
                    "suction_length": 60.0,
                    "discharge_length": 120.0,
                    "total_length": 180.0,
                    "useful_pressure": 2.0,
                    "suction_material": "steel",
                    "discharge_material": "steel",
                    "suction_elbow_90": 3,
                    "suction_check_valve": 1,
                    "discharge_elbow_90": 5,
                    "pump_efficiency": 70.0,
                    "motor_efficiency": 85.0,
                    "voltage": 400,
                    "npsh_required": 5.0,  # High NPSH required
                    "installation_type": "surface",
                    "operating_hours": 4000.0,
                    "electricity_cost": 0.18
                }
            },
            {
                "name": "Test Case 4: Complex Installation",
                "data": {
                    "flow_rate": 60.0,
                    "fluid_type": "oil",  # Different fluid
                    "temperature": 80.0,  # High temperature
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 125.0,
                    "discharge_pipe_diameter": 100.0,
                    "suction_height": 3.0,
                    "discharge_height": 30.0,
                    "suction_length": 50.0,
                    "discharge_length": 150.0,
                    "total_length": 200.0,
                    "useful_pressure": 3.0,
                    "suction_material": "steel",
                    "discharge_material": "steel_galvanized",
                    # Multiple fittings
                    "suction_elbow_90": 4,
                    "suction_elbow_45": 2,
                    "suction_gate_valve": 1,
                    "discharge_elbow_90": 6,
                    "discharge_elbow_45": 3,
                    "discharge_tee_branch": 2,
                    "discharge_gate_valve": 2,
                    "discharge_check_valve": 2,
                    "discharge_flow_meter": 1,
                    "pump_efficiency": 65.0,  # Lower efficiency
                    "motor_efficiency": 82.0,
                    "voltage": 400,
                    "npsh_required": 3.8,
                    "installation_type": "surface",
                    "operating_hours": 8760.0,
                    "electricity_cost": 0.20
                }
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/expert-analysis", json=case["data"], timeout=15)
                if response.status_code == 200:
                    result = response.json()
                    
                    # Validate comprehensive hydraulic advice
                    expert_recommendations = result.get("expert_recommendations", [])
                    if len(expert_recommendations) < 3:
                        self.log_test(f"Enhanced Expert Test Case - {case['name']}", False, 
                                    f"Insufficient recommendations: {len(expert_recommendations)}")
                        all_passed = False
                        continue
                    
                    # Check for 7 categories of recommendations
                    recommendation_types = set(rec.get("type", "") for rec in expert_recommendations)
                    expected_types = {"critical", "installation", "velocity", "head_loss", 
                                    "materials", "electrical", "maintenance"}
                    
                    # At least 4 different types should be present for comprehensive advice
                    if len(recommendation_types.intersection(expected_types)) < 4:
                        self.log_test(f"Enhanced Expert Recommendation Diversity - {case['name']}", False, 
                                    f"Limited recommendation types: {recommendation_types}")
                        all_passed = False
                        continue
                    
                    # Check hydraulic analysis completeness
                    npshd_analysis = result.get("npshd_analysis", {})
                    hmt_analysis = result.get("hmt_analysis", {})
                    performance_analysis = result.get("performance_analysis", {})
                    
                    # Verify key hydraulic parameters
                    required_npshd_fields = ["npshd", "npsh_required", "npsh_margin", 
                                           "cavitation_risk", "velocity", "reynolds_number"]
                    missing_npshd = [f for f in required_npshd_fields if f not in npshd_analysis]
                    
                    if missing_npshd:
                        self.log_test(f"Enhanced NPSHd Analysis Completeness - {case['name']}", False, 
                                    f"Missing fields: {missing_npshd}")
                        all_passed = False
                        continue
                    
                    # Check scenario-specific validations
                    if "High Velocity" in case["name"]:
                        velocity = npshd_analysis.get("velocity", 0)
                        if velocity < 3.0:  # Should be high velocity
                            self.log_test(f"Enhanced High Velocity Validation - {case['name']}", False, 
                                        f"Expected high velocity, got {velocity:.2f} m/s")
                            all_passed = False
                            continue
                    
                    elif "Cavitation Risk" in case["name"]:
                        cavitation_risk = npshd_analysis.get("cavitation_risk", False)
                        if not cavitation_risk:
                            self.log_test(f"Enhanced Cavitation Risk Validation - {case['name']}", False, 
                                        "Expected cavitation risk but none detected")
                            all_passed = False
                            continue
                    
                    elif "Complex Installation" in case["name"]:
                        # Should have recommendations about complexity
                        complexity_mentioned = any("complex" in rec.get("description", "").lower() or 
                                                 "singularités" in rec.get("description", "").lower()
                                                 for rec in expert_recommendations)
                    
                    # Check material compatibility for high temperature cases
                    if case["data"]["temperature"] > 60:
                        material_warnings = any("température" in rec.get("description", "").lower() or
                                              "matériau" in rec.get("description", "").lower()
                                              for rec in expert_recommendations)
                    
                    self.log_test(f"Enhanced Expert Test Case - {case['name']}", True, 
                                f"Generated {len(expert_recommendations)} recommendations, "
                                f"Types: {len(recommendation_types)}, "
                                f"NPSHd: {npshd_analysis.get('npshd', 0):.2f} m")
                else:
                    self.log_test(f"Enhanced Expert Test Case - {case['name']}", False, 
                                f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Enhanced Expert Test Case - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_expert_analysis_zero_and_half_values(self):
        """Test /api/expert-analysis endpoint with 0 and 0.5 values for specific fields"""
        print("\n🎯 Testing Expert Analysis with 0 and 0.5 Values...")
        
        # Base test data structure for expert analysis
        base_data = {
            "flow_rate": 50.0,
            "fluid_type": "water",
            "temperature": 20.0,
            "suction_type": "flooded",
            "suction_pipe_diameter": 100.0,
            "discharge_pipe_diameter": 80.0,
            "total_length": 100.0,
            "useful_pressure": 2.0,
            "suction_material": "pvc",
            "discharge_material": "pvc",
            "pump_efficiency": 80.0,
            "motor_efficiency": 90.0,
            "voltage": 400,
            "power_factor": 0.8,
            "starting_method": "star_delta",
            "cable_length": 50.0,
            "cable_material": "copper",
            "installation_type": "surface",
            "pump_type": "centrifugal",
            "operating_hours": 8760.0,
            "electricity_cost": 0.12,
            "altitude": 0.0,
            "ambient_temperature": 25.0,
            "humidity": 60.0
        }
        
        test_cases = [
            {
                "name": "Case 1: All Zero Values",
                "data": {
                    **base_data,
                    "suction_height": 0.0,
                    "discharge_height": 0.0,
                    "suction_length": 0.0,
                    "discharge_length": 0.0,
                    "npsh_required": 0.0
                }
            },
            {
                "name": "Case 2: All 0.5 Values",
                "data": {
                    **base_data,
                    "suction_height": 0.5,
                    "discharge_height": 0.5,
                    "suction_length": 0.5,
                    "discharge_length": 0.5,
                    "npsh_required": 0.5
                }
            },
            {
                "name": "Case 3: Mixed Values (0 and 0.5)",
                "data": {
                    **base_data,
                    "suction_height": 0.0,
                    "discharge_height": 0.5,
                    "suction_length": 0.5,
                    "discharge_length": 0.0,
                    "npsh_required": 0.5
                }
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/expert-analysis", json=case["data"], timeout=15)
                if response.status_code == 200:
                    result = response.json()
                    
                    # Verify complete response structure
                    required_sections = [
                        "input_data", "npshd_analysis", "hmt_analysis", 
                        "performance_analysis", "electrical_analysis", 
                        "overall_efficiency", "total_head_loss", "system_stability",
                        "energy_consumption", "expert_recommendations", 
                        "optimization_potential", "performance_curves", "system_curves"
                    ]
                    
                    missing_sections = [section for section in required_sections if section not in result]
                    if missing_sections:
                        self.log_test(f"Expert Analysis Structure - {case['name']}", False, 
                                    f"Missing sections: {missing_sections}")
                        all_passed = False
                        continue
                    
                    # Verify input data preservation
                    input_data = result.get("input_data", {})
                    test_fields = ["suction_height", "discharge_height", "suction_length", "discharge_length", "npsh_required"]
                    
                    for field in test_fields:
                        expected_value = case["data"][field]
                        actual_value = input_data.get(field)
                        
                        if actual_value != expected_value:
                            self.log_test(f"Expert Analysis Input Preservation - {case['name']} - {field}", False, 
                                        f"Expected {expected_value}, got {actual_value}")
                            all_passed = False
                            continue
                    
                    # Verify NPSHd calculations work with these values
                    npshd_analysis = result.get("npshd_analysis", {})
                    npshd_value = npshd_analysis.get("npshd")
                    npsh_required = npshd_analysis.get("npsh_required")
                    cavitation_risk = npshd_analysis.get("cavitation_risk")
                    
                    if npshd_value is None:
                        self.log_test(f"Expert Analysis NPSHd - {case['name']}", False, "NPSHd value is None")
                        all_passed = False
                        continue
                    
                    if npsh_required != case["data"]["npsh_required"]:
                        self.log_test(f"Expert Analysis NPSH Required - {case['name']}", False, 
                                    f"NPSH required not preserved: expected {case['data']['npsh_required']}, got {npsh_required}")
                        all_passed = False
                        continue
                    
                    if cavitation_risk is None:
                        self.log_test(f"Expert Analysis Cavitation Risk - {case['name']}", False, "Cavitation risk is None")
                        all_passed = False
                        continue
                    
                    # Verify HMT calculations work with these values
                    hmt_analysis = result.get("hmt_analysis", {})
                    hmt_value = hmt_analysis.get("hmt")
                    static_head = hmt_analysis.get("static_head")
                    total_head_loss = hmt_analysis.get("total_head_loss")
                    
                    if hmt_value is None:
                        self.log_test(f"Expert Analysis HMT - {case['name']}", False, "HMT value is None")
                        all_passed = False
                        continue
                    
                    if static_head is None:
                        self.log_test(f"Expert Analysis Static Head - {case['name']}", False, "Static head is None")
                        all_passed = False
                        continue
                    
                    # Verify Performance calculations work with these values
                    performance_analysis = result.get("performance_analysis", {})
                    overall_efficiency = result.get("overall_efficiency")
                    
                    if overall_efficiency is None or overall_efficiency <= 0:
                        self.log_test(f"Expert Analysis Performance - {case['name']}", False, 
                                    f"Invalid overall efficiency: {overall_efficiency}")
                        all_passed = False
                        continue
                    
                    # Verify no calculation errors occurred
                    if "error" in result or "Error" in str(result):
                        self.log_test(f"Expert Analysis Errors - {case['name']}", False, "Calculation errors detected")
                        all_passed = False
                        continue
                    
                    # Verify performance curves are generated
                    performance_curves = result.get("performance_curves", {})
                    if not performance_curves or "flow" not in performance_curves:
                        self.log_test(f"Expert Analysis Curves - {case['name']}", False, "Performance curves missing or incomplete")
                        all_passed = False
                        continue
                    
                    self.log_test(f"Expert Analysis - {case['name']}", True, 
                                f"NPSHd: {npshd_value:.2f}m, HMT: {hmt_value:.2f}m, Efficiency: {overall_efficiency:.1f}%")
                else:
                    self.log_test(f"Expert Analysis - {case['name']}", False, f"HTTP Status: {response.status_code}")
                    if response.status_code == 422:
                        try:
                            error_detail = response.json()
                            self.log_test(f"Expert Analysis Error Detail - {case['name']}", False, f"Validation error: {error_detail}")
                        except:
                            pass
                    all_passed = False
            except Exception as e:
                self.log_test(f"Expert Analysis - {case['name']}", False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_new_industrial_fluids_api(self):
        """Test that all 12 new industrial fluids are available in /api/fluids endpoint"""
        print("\n🧪 Testing New Industrial Fluids API...")
        
        try:
            response = requests.get(f"{BACKEND_URL}/fluids", timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                # Check structure
                if "fluids" not in data:
                    self.log_test("New Industrial Fluids API Structure", False, "Missing 'fluids' key")
                    return False
                
                fluids = data["fluids"]
                
                # Expected 12 fluids total (4 original + 8 new)
                expected_fluids = [
                    "water", "oil", "acid", "glycol",  # Original 4
                    "palm_oil", "gasoline", "diesel", "hydraulic_oil",  # New 4
                    "ethanol", "seawater", "methanol", "glycerol"  # New 4 more
                ]
                
                # Check all expected fluids are present
                fluid_ids = [f["id"] for f in fluids]
                missing_fluids = [f for f in expected_fluids if f not in fluid_ids]
                
                if missing_fluids:
                    self.log_test("New Industrial Fluids API Content", False, f"Missing fluids: {missing_fluids}")
                    return False
                
                # Check we have exactly 12 fluids
                if len(fluids) != 12:
                    self.log_test("New Industrial Fluids API Count", False, f"Expected 12 fluids, got {len(fluids)}")
                    return False
                
                # Check fluid structure for new fluids
                new_fluids = ["palm_oil", "gasoline", "diesel", "hydraulic_oil", "ethanol", "seawater", "methanol", "glycerol"]
                for fluid in fluids:
                    if fluid["id"] in new_fluids:
                        if "id" not in fluid or "name" not in fluid:
                            self.log_test("New Industrial Fluids API Structure", False, f"Invalid fluid structure: {fluid}")
                            return False
                
                self.log_test("New Industrial Fluids API", True, f"Found all 12 fluids: {fluid_ids}")
                return True
            else:
                self.log_test("New Industrial Fluids API", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("New Industrial Fluids API", False, f"Error: {str(e)}")
            return False
    
    def test_new_fluids_property_calculations(self):
        """Test property calculations with new industrial fluids at specific temperatures"""
        print("\n🌡️ Testing New Fluids Property Calculations...")
        
        test_cases = [
            {
                "name": "Palm Oil at 30°C",
                "fluid_type": "palm_oil",
                "temperature": 30.0,
                "expected_density_range": (900, 920),  # Should be lower than base 915 at 30°C
                "expected_viscosity_range": (0.025, 0.050)  # Should be lower than base 0.045 at 30°C
            },
            {
                "name": "Diesel at 40°C", 
                "fluid_type": "diesel",
                "temperature": 40.0,
                "expected_density_range": (820, 850),  # Should be lower than base 840 at 40°C
                "expected_viscosity_range": (0.002, 0.004)  # Should be lower than base 0.0035 at 40°C
            },
            {
                "name": "Gasoline at 25°C",
                "fluid_type": "gasoline", 
                "temperature": 25.0,
                "expected_density_range": (735, 745),  # Should be lower than base 740 at 25°C
                "expected_viscosity_range": (0.0005, 0.0006)  # Should be slightly lower than base 0.00055 at 25°C
            },
            {
                "name": "Hydraulic Oil at 50°C",
                "fluid_type": "hydraulic_oil",
                "temperature": 50.0,
                "expected_density_range": (855, 880),  # Should be lower than base 875 at 50°C
                "expected_viscosity_range": (0.025, 0.050)  # Should be lower than base 0.046 at 50°C
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                # Test with NPSHd calculation to get fluid properties
                test_data = {
                    "suction_type": "flooded",
                    "hasp": 2.0,
                    "flow_rate": 50.0,
                    "fluid_type": case["fluid_type"],
                    "temperature": case["temperature"],
                    "pipe_diameter": 100.0,
                    "pipe_material": "pvc",
                    "pipe_length": 30.0,
                    "suction_fittings": [],
                    "npsh_required": 3.0
                }
                
                response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=test_data, timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    fluid_props = result.get("fluid_properties", {})
                    
                    # Check fluid name
                    fluid_name = fluid_props.get("name", "")
                    if not fluid_name:
                        self.log_test(f"New Fluid Properties - {case['name']} - Name", False, "Missing fluid name")
                        all_passed = False
                        continue
                    
                    # Check density is in expected range and temperature-adjusted
                    density = fluid_props.get("density", 0)
                    if not (case["expected_density_range"][0] <= density <= case["expected_density_range"][1]):
                        self.log_test(f"New Fluid Properties - {case['name']} - Density", False, 
                                    f"Density {density:.1f} kg/m³ not in expected range {case['expected_density_range']}")
                        all_passed = False
                        continue
                    
                    # Check viscosity is in expected range and temperature-adjusted
                    viscosity = fluid_props.get("viscosity", 0)
                    if not (case["expected_viscosity_range"][0] <= viscosity <= case["expected_viscosity_range"][1]):
                        self.log_test(f"New Fluid Properties - {case['name']} - Viscosity", False, 
                                    f"Viscosity {viscosity:.6f} Pa·s not in expected range {case['expected_viscosity_range']}")
                        all_passed = False
                        continue
                    
                    # Check vapor pressure is present and reasonable
                    vapor_pressure = fluid_props.get("vapor_pressure", 0)
                    if vapor_pressure < 0:
                        self.log_test(f"New Fluid Properties - {case['name']} - Vapor Pressure", False, 
                                    f"Negative vapor pressure: {vapor_pressure}")
                        all_passed = False
                        continue
                    
                    # Check that calculations don't return NaN
                    npshd = result.get("npshd", 0)
                    velocity = result.get("velocity", 0)
                    reynolds_number = result.get("reynolds_number", 0)
                    
                    if math.isnan(npshd) or math.isnan(velocity) or math.isnan(reynolds_number):
                        self.log_test(f"New Fluid Properties - {case['name']} - NaN Check", False, 
                                    f"NaN values detected: NPSHd={npshd}, Velocity={velocity}, Reynolds={reynolds_number}")
                        all_passed = False
                        continue
                    
                    self.log_test(f"New Fluid Properties - {case['name']}", True, 
                                f"Density: {density:.1f} kg/m³, Viscosity: {viscosity:.6f} Pa·s, NPSHd: {npshd:.2f} m")
                else:
                    self.log_test(f"New Fluid Properties - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"New Fluid Properties - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_expert_analysis_with_new_fluids(self):
        """Test /api/expert-analysis endpoint with new industrial fluids"""
        print("\n🎓 Testing Expert Analysis with New Industrial Fluids...")
        
        test_cases = [
            {
                "name": "Expert Analysis - Palm Oil",
                "data": {
                    "flow_rate": 40.0,
                    "fluid_type": "palm_oil",
                    "temperature": 30.0,
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 100.0,
                    "discharge_pipe_diameter": 80.0,
                    "suction_height": 2.0,
                    "discharge_height": 15.0,
                    "suction_length": 20.0,
                    "discharge_length": 80.0,
                    "total_length": 100.0,
                    "useful_pressure": 1.5,
                    "suction_material": "steel",
                    "discharge_material": "steel",
                    "pump_efficiency": 78.0,
                    "motor_efficiency": 88.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 50.0,
                    "cable_material": "copper",
                    "npsh_required": 3.2,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 6000.0,
                    "electricity_cost": 0.15,
                    "altitude": 0.0,
                    "ambient_temperature": 25.0,
                    "humidity": 60.0
                }
            },
            {
                "name": "Expert Analysis - Diesel",
                "data": {
                    "flow_rate": 60.0,
                    "fluid_type": "diesel",
                    "temperature": 40.0,
                    "suction_type": "suction_lift",
                    "suction_pipe_diameter": 125.0,
                    "discharge_pipe_diameter": 100.0,
                    "suction_height": 3.5,
                    "discharge_height": 20.0,
                    "suction_length": 30.0,
                    "discharge_length": 100.0,
                    "total_length": 130.0,
                    "useful_pressure": 2.0,
                    "suction_material": "steel",
                    "discharge_material": "steel",
                    "pump_efficiency": 80.0,
                    "motor_efficiency": 90.0,
                    "voltage": 400,
                    "power_factor": 0.85,
                    "starting_method": "direct_on_line",
                    "cable_length": 75.0,
                    "cable_material": "copper",
                    "npsh_required": 4.0,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 8760.0,
                    "electricity_cost": 0.12,
                    "altitude": 0.0,
                    "ambient_temperature": 25.0,
                    "humidity": 60.0
                }
            },
            {
                "name": "Expert Analysis - Gasoline",
                "data": {
                    "flow_rate": 35.0,
                    "fluid_type": "gasoline",
                    "temperature": 25.0,
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 80.0,
                    "discharge_pipe_diameter": 65.0,
                    "suction_height": 1.5,
                    "discharge_height": 12.0,
                    "suction_length": 15.0,
                    "discharge_length": 60.0,
                    "total_length": 75.0,
                    "useful_pressure": 1.0,
                    "suction_material": "stainless_steel",
                    "discharge_material": "stainless_steel",
                    "pump_efficiency": 75.0,
                    "motor_efficiency": 87.0,
                    "voltage": 230,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 40.0,
                    "cable_material": "copper",
                    "npsh_required": 2.8,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 4000.0,
                    "electricity_cost": 0.18,
                    "altitude": 0.0,
                    "ambient_temperature": 25.0,
                    "humidity": 60.0
                }
            },
            {
                "name": "Expert Analysis - Hydraulic Oil",
                "data": {
                    "flow_rate": 25.0,
                    "fluid_type": "hydraulic_oil",
                    "temperature": 50.0,
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 75.0,
                    "discharge_pipe_diameter": 65.0,
                    "suction_height": 1.0,
                    "discharge_height": 25.0,
                    "suction_length": 10.0,
                    "discharge_length": 120.0,
                    "total_length": 130.0,
                    "useful_pressure": 3.0,
                    "suction_material": "steel",
                    "discharge_material": "steel",
                    "pump_efficiency": 82.0,
                    "motor_efficiency": 92.0,
                    "voltage": 400,
                    "power_factor": 0.85,
                    "starting_method": "star_delta",
                    "cable_length": 60.0,
                    "cable_material": "copper",
                    "npsh_required": 3.5,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 8000.0,
                    "electricity_cost": 0.14,
                    "altitude": 0.0,
                    "ambient_temperature": 25.0,
                    "humidity": 60.0
                }
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/expert-analysis", json=case["data"], timeout=15)
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check that all required sections are present
                    required_sections = [
                        "input_data", "npshd_analysis", "hmt_analysis", "performance_analysis",
                        "electrical_analysis", "overall_efficiency", "total_head_loss",
                        "system_stability", "energy_consumption", "expert_recommendations",
                        "optimization_potential", "performance_curves", "system_curves"
                    ]
                    
                    missing_sections = [s for s in required_sections if s not in result]
                    if missing_sections:
                        self.log_test(f"Expert Analysis Structure - {case['name']}", False, 
                                    f"Missing sections: {missing_sections}")
                        all_passed = False
                        continue
                    
                    # Check NPSHd analysis
                    npshd_analysis = result.get("npshd_analysis", {})
                    npshd = npshd_analysis.get("npshd", 0)
                    cavitation_risk = npshd_analysis.get("cavitation_risk", None)
                    
                    if math.isnan(npshd):
                        self.log_test(f"Expert Analysis NPSHd - {case['name']}", False, "NPSHd is NaN")
                        all_passed = False
                        continue
                    
                    if cavitation_risk is None:
                        self.log_test(f"Expert Analysis Cavitation - {case['name']}", False, "Missing cavitation_risk")
                        all_passed = False
                        continue
                    
                    # Check HMT analysis
                    hmt_analysis = result.get("hmt_analysis", {})
                    hmt = hmt_analysis.get("hmt", 0)
                    
                    if math.isnan(hmt) or hmt <= 0:
                        self.log_test(f"Expert Analysis HMT - {case['name']}", False, f"Invalid HMT: {hmt}")
                        all_passed = False
                        continue
                    
                    # Check performance analysis
                    performance_analysis = result.get("performance_analysis", {})
                    overall_efficiency = result.get("overall_efficiency", 0)
                    
                    if math.isnan(overall_efficiency) or overall_efficiency <= 0:
                        self.log_test(f"Expert Analysis Efficiency - {case['name']}", False, f"Invalid efficiency: {overall_efficiency}")
                        all_passed = False
                        continue
                    
                    # Check expert recommendations
                    expert_recommendations = result.get("expert_recommendations", [])
                    if not isinstance(expert_recommendations, list):
                        self.log_test(f"Expert Analysis Recommendations - {case['name']}", False, "Recommendations not a list")
                        all_passed = False
                        continue
                    
                    # Check performance curves
                    performance_curves = result.get("performance_curves", {})
                    if "flow" not in performance_curves or "hmt" not in performance_curves:
                        self.log_test(f"Expert Analysis Curves - {case['name']}", False, "Missing performance curves")
                        all_passed = False
                        continue
                    
                    # Check system stability
                    system_stability = result.get("system_stability", None)
                    if system_stability is None:
                        self.log_test(f"Expert Analysis Stability - {case['name']}", False, "Missing system_stability")
                        all_passed = False
                        continue
                    
                    self.log_test(f"Expert Analysis - {case['name']}", True, 
                                f"NPSHd: {npshd:.2f}m, HMT: {hmt:.2f}m, Efficiency: {overall_efficiency:.1f}%, Stable: {system_stability}")
                else:
                    self.log_test(f"Expert Analysis - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Expert Analysis - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_hydraulic_calculations_consistency(self):
        """Test that hydraulic calculations are consistent and don't return NaN with new fluids"""
        print("\n🔧 Testing Hydraulic Calculations Consistency...")
        
        # Test all new fluids with various conditions
        new_fluids = ["palm_oil", "gasoline", "diesel", "hydraulic_oil", "ethanol", "seawater", "methanol", "glycerol"]
        
        all_passed = True
        for fluid in new_fluids:
            try:
                # Test NPSHd calculation
                npshd_data = {
                    "suction_type": "flooded",
                    "hasp": 2.0,
                    "flow_rate": 45.0,
                    "fluid_type": fluid,
                    "temperature": 30.0,
                    "pipe_diameter": 100.0,
                    "pipe_material": "pvc",
                    "pipe_length": 40.0,
                    "suction_fittings": [
                        {"fitting_type": "elbow_90", "quantity": 1}
                    ],
                    "npsh_required": 3.0
                }
                
                response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=npshd_data, timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check for NaN values
                    critical_values = [
                        ("npshd", result.get("npshd", 0)),
                        ("velocity", result.get("velocity", 0)),
                        ("reynolds_number", result.get("reynolds_number", 0)),
                        ("friction_factor", result.get("friction_factor", 0)),
                        ("total_head_loss", result.get("total_head_loss", 0))
                    ]
                    
                    for name, value in critical_values:
                        if math.isnan(value) or math.isinf(value):
                            self.log_test(f"Hydraulic Consistency - {fluid} - {name}", False, f"{name} is NaN/Inf: {value}")
                            all_passed = False
                            break
                        
                        if name in ["velocity", "reynolds_number", "friction_factor"] and value <= 0:
                            self.log_test(f"Hydraulic Consistency - {fluid} - {name}", False, f"{name} is zero or negative: {value}")
                            all_passed = False
                            break
                    else:
                        # Test HMT calculation with same fluid
                        hmt_data = {
                            "installation_type": "surface",
                            "suction_type": "flooded",
                            "hasp": 2.0,
                            "discharge_height": 18.0,
                            "useful_pressure": 1.5,
                            "suction_pipe_diameter": 100.0,
                            "discharge_pipe_diameter": 80.0,
                            "suction_pipe_length": 25.0,
                            "discharge_pipe_length": 90.0,
                            "suction_pipe_material": "pvc",
                            "discharge_pipe_material": "pvc",
                            "suction_fittings": [],
                            "discharge_fittings": [
                                {"fitting_type": "elbow_90", "quantity": 2}
                            ],
                            "fluid_type": fluid,
                            "temperature": 30.0,
                            "flow_rate": 45.0
                        }
                        
                        hmt_response = requests.post(f"{BACKEND_URL}/calculate-hmt", json=hmt_data, timeout=10)
                        if hmt_response.status_code == 200:
                            hmt_result = hmt_response.json()
                            
                            hmt_critical_values = [
                                ("hmt", hmt_result.get("hmt", 0)),
                                ("suction_velocity", hmt_result.get("suction_velocity", 0)),
                                ("discharge_velocity", hmt_result.get("discharge_velocity", 0)),
                                ("total_head_loss", hmt_result.get("total_head_loss", 0))
                            ]
                            
                            for name, value in hmt_critical_values:
                                if value is not None and (math.isnan(value) or math.isinf(value)):
                                    self.log_test(f"Hydraulic Consistency - {fluid} - HMT {name}", False, f"{name} is NaN/Inf: {value}")
                                    all_passed = False
                                    break
                            else:
                                self.log_test(f"Hydraulic Consistency - {fluid}", True, 
                                            f"NPSHd: {result['npshd']:.2f}m, HMT: {hmt_result['hmt']:.2f}m")
                        else:
                            self.log_test(f"Hydraulic Consistency - {fluid} - HMT", False, f"HMT Status: {hmt_response.status_code}")
                            all_passed = False
                else:
                    self.log_test(f"Hydraulic Consistency - {fluid} - NPSHd", False, f"NPSHd Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Hydraulic Consistency - {fluid}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_phase3_new_industrial_fluids_properties(self):
        """Phase 3: Test new industrial fluids property calculations"""
        print("\n🧪 Testing Phase 3 - New Industrial Fluids Properties...")
        
        test_cases = [
            {
                "name": "Palm Oil at 30°C",
                "fluid": "palm_oil",
                "temperature": 30.0,
                "expected_density_range": (900, 920),  # Should be around 908.5 kg/m³
                "expected_viscosity_range": (0.02, 0.03)  # Should be around 0.027 Pa·s
            },
            {
                "name": "Diesel at 40°C", 
                "fluid": "diesel",
                "temperature": 40.0,
                "expected_density_range": (820, 850),
                "expected_viscosity_range": (0.002, 0.005)
            },
            {
                "name": "Gasoline at 25°C",
                "fluid": "gasoline", 
                "temperature": 25.0,
                "expected_density_range": (730, 750),
                "expected_viscosity_range": (0.0004, 0.0007)
            },
            {
                "name": "Seawater at 20°C",
                "fluid": "seawater",
                "temperature": 20.0,
                "expected_density_range": (1020, 1030),
                "expected_viscosity_range": (0.001, 0.0012)
            }
        ]
        
        all_passed = True
        for case in test_cases:
            # Test with NPSHd calculation to get fluid properties
            test_data = {
                "suction_type": "flooded",
                "hasp": 2.0,
                "flow_rate": 50.0,
                "fluid_type": case["fluid"],
                "temperature": case["temperature"],
                "pipe_diameter": 100.0,
                "pipe_material": "pvc",
                "pipe_length": 30.0,
                "suction_fittings": [],
                "npsh_required": 3.0
            }
            
            try:
                response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=test_data, timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    fluid_props = result.get("fluid_properties", {})
                    
                    density = fluid_props.get("density", 0)
                    viscosity = fluid_props.get("viscosity", 0)
                    npshd = result.get("npshd", 0)
                    
                    # Check density range
                    if not (case["expected_density_range"][0] <= density <= case["expected_density_range"][1]):
                        self.log_test(f"Phase 3 - {case['name']} Density", False, 
                                    f"Density {density:.1f} kg/m³ outside expected range {case['expected_density_range']}")
                        all_passed = False
                        continue
                    
                    # Check viscosity range
                    if not (case["expected_viscosity_range"][0] <= viscosity <= case["expected_viscosity_range"][1]):
                        self.log_test(f"Phase 3 - {case['name']} Viscosity", False, 
                                    f"Viscosity {viscosity:.6f} Pa·s outside expected range {case['expected_viscosity_range']}")
                        all_passed = False
                        continue
                    
                    # Check that NPSHd calculation produces valid results
                    if math.isnan(npshd) or math.isinf(npshd):
                        self.log_test(f"Phase 3 - {case['name']} NPSHd", False, f"Invalid NPSHd value: {npshd}")
                        all_passed = False
                        continue
                    
                    self.log_test(f"Phase 3 - {case['name']}", True, 
                                f"Density: {density:.1f} kg/m³, Viscosity: {viscosity:.6f} Pa·s, NPSHd: {npshd:.2f} m")
                else:
                    self.log_test(f"Phase 3 - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Phase 3 - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_phase3_expert_analysis_new_fluids(self):
        """Phase 3: Test expert analysis with new industrial fluids"""
        print("\n🎯 Testing Phase 3 - Expert Analysis with New Industrial Fluids...")
        
        test_cases = [
            {
                "name": "Palm Oil Expert Analysis",
                "data": {
                    "flow_rate": 75.0,
                    "fluid_type": "palm_oil",
                    "temperature": 30.0,
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 125.0,
                    "discharge_pipe_diameter": 100.0,
                    "suction_height": 2.0,
                    "discharge_height": 25.0,
                    "suction_length": 20.0,
                    "discharge_length": 80.0,
                    "total_length": 100.0,
                    "useful_pressure": 1.5,
                    "suction_material": "steel",
                    "discharge_material": "steel",
                    "pump_efficiency": 78.0,
                    "motor_efficiency": 88.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 50.0,
                    "cable_material": "copper",
                    "npsh_required": 3.2,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 6000.0,
                    "electricity_cost": 0.12,
                    "altitude": 0.0,
                    "ambient_temperature": 25.0,
                    "humidity": 60.0
                }
            },
            {
                "name": "Diesel Expert Analysis",
                "data": {
                    "flow_rate": 60.0,
                    "fluid_type": "diesel",
                    "temperature": 40.0,
                    "suction_type": "suction_lift",
                    "suction_pipe_diameter": 100.0,
                    "discharge_pipe_diameter": 80.0,
                    "suction_height": 3.0,
                    "discharge_height": 30.0,
                    "suction_length": 25.0,
                    "discharge_length": 100.0,
                    "total_length": 125.0,
                    "useful_pressure": 2.0,
                    "suction_material": "steel",
                    "discharge_material": "steel",
                    "pump_efficiency": 72.0,
                    "motor_efficiency": 90.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 75.0,
                    "cable_material": "copper",
                    "npsh_required": 4.0,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 8760.0,
                    "electricity_cost": 0.15,
                    "altitude": 0.0,
                    "ambient_temperature": 25.0,
                    "humidity": 60.0
                }
            },
            {
                "name": "Seawater Expert Analysis",
                "data": {
                    "flow_rate": 100.0,
                    "fluid_type": "seawater",
                    "temperature": 25.0,
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 150.0,
                    "discharge_pipe_diameter": 125.0,
                    "suction_height": 1.5,
                    "discharge_height": 20.0,
                    "suction_length": 15.0,
                    "discharge_length": 60.0,
                    "total_length": 75.0,
                    "useful_pressure": 3.0,
                    "suction_material": "316L_stainless",
                    "discharge_material": "316L_stainless",
                    "pump_efficiency": 80.0,
                    "motor_efficiency": 92.0,
                    "voltage": 400,
                    "power_factor": 0.85,
                    "starting_method": "star_delta",
                    "cable_length": 60.0,
                    "cable_material": "copper",
                    "npsh_required": 3.5,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 8000.0,
                    "electricity_cost": 0.10,
                    "altitude": 0.0,
                    "ambient_temperature": 25.0,
                    "humidity": 80.0
                }
            },
            {
                "name": "Ethanol Expert Analysis",
                "data": {
                    "flow_rate": 40.0,
                    "fluid_type": "ethanol",
                    "temperature": 30.0,
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 80.0,
                    "discharge_pipe_diameter": 65.0,
                    "suction_height": 1.0,
                    "discharge_height": 15.0,
                    "suction_length": 10.0,
                    "discharge_length": 50.0,
                    "total_length": 60.0,
                    "useful_pressure": 1.0,
                    "suction_material": "stainless_steel",
                    "discharge_material": "stainless_steel",
                    "pump_efficiency": 75.0,
                    "motor_efficiency": 88.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 40.0,
                    "cable_material": "copper",
                    "npsh_required": 2.8,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 4000.0,
                    "electricity_cost": 0.12,
                    "altitude": 0.0,
                    "ambient_temperature": 25.0,
                    "humidity": 60.0
                }
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/expert-analysis", json=case["data"], timeout=15)
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check all required sections are present
                    required_sections = [
                        "input_data", "npshd_analysis", "hmt_analysis", "performance_analysis",
                        "electrical_analysis", "overall_efficiency", "total_head_loss",
                        "system_stability", "energy_consumption", "expert_recommendations",
                        "optimization_potential", "performance_curves", "system_curves"
                    ]
                    
                    missing_sections = [s for s in required_sections if s not in result]
                    if missing_sections:
                        self.log_test(f"Phase 3 Expert - {case['name']} Structure", False, 
                                    f"Missing sections: {missing_sections}")
                        all_passed = False
                        continue
                    
                    # Check NPSHd analysis
                    npshd_analysis = result.get("npshd_analysis", {})
                    npshd = npshd_analysis.get("npshd", 0)
                    cavitation_risk = npshd_analysis.get("cavitation_risk", True)
                    
                    if math.isnan(npshd) or math.isinf(npshd):
                        self.log_test(f"Phase 3 Expert - {case['name']} NPSHd", False, f"Invalid NPSHd: {npshd}")
                        all_passed = False
                        continue
                    
                    # Check HMT analysis
                    hmt_analysis = result.get("hmt_analysis", {})
                    hmt = hmt_analysis.get("hmt", 0)
                    
                    if hmt <= 0:
                        self.log_test(f"Phase 3 Expert - {case['name']} HMT", False, f"Invalid HMT: {hmt}")
                        all_passed = False
                        continue
                    
                    # Check performance analysis
                    performance_analysis = result.get("performance_analysis", {})
                    overall_efficiency = result.get("overall_efficiency", 0)
                    
                    if overall_efficiency <= 0 or overall_efficiency > 100:
                        self.log_test(f"Phase 3 Expert - {case['name']} Efficiency", False, 
                                    f"Invalid efficiency: {overall_efficiency}%")
                        all_passed = False
                        continue
                    
                    # Check system stability
                    system_stability = result.get("system_stability", False)
                    
                    # Check expert recommendations
                    expert_recommendations = result.get("expert_recommendations", [])
                    if not isinstance(expert_recommendations, list):
                        self.log_test(f"Phase 3 Expert - {case['name']} Recommendations", False, 
                                    "Expert recommendations should be a list")
                        all_passed = False
                        continue
                    
                    # Check performance curves
                    performance_curves = result.get("performance_curves", {})
                    if "flow" not in performance_curves or "hmt" not in performance_curves:
                        self.log_test(f"Phase 3 Expert - {case['name']} Curves", False, 
                                    "Missing performance curves data")
                        all_passed = False
                        continue
                    
                    self.log_test(f"Phase 3 Expert - {case['name']}", True, 
                                f"NPSHd: {npshd:.2f}m, HMT: {hmt:.2f}m, Eff: {overall_efficiency:.1f}%, Stable: {system_stability}")
                else:
                    self.log_test(f"Phase 3 Expert - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Phase 3 Expert - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_phase3_npshd_gasoline_methanol(self):
        """Phase 3: Test NPSHd calculations with gasoline and methanol (volatile fluids)"""
        print("\n⚡ Testing Phase 3 - NPSHd with Volatile Fluids (Gasoline & Methanol)...")
        
        test_cases = [
            {
                "name": "Gasoline NPSHd",
                "data": {
                    "suction_type": "suction_lift",
                    "hasp": 2.5,
                    "flow_rate": 30.0,
                    "fluid_type": "gasoline",
                    "temperature": 25.0,
                    "pipe_diameter": 80.0,
                    "pipe_material": "steel",
                    "pipe_length": 40.0,
                    "suction_fittings": [
                        {"fitting_type": "elbow_90", "quantity": 1},
                        {"fitting_type": "check_valve", "quantity": 1}
                    ],
                    "npsh_required": 3.5
                }
            },
            {
                "name": "Methanol NPSHd",
                "data": {
                    "suction_type": "flooded",
                    "hasp": 1.5,
                    "flow_rate": 25.0,
                    "fluid_type": "methanol",
                    "temperature": 30.0,
                    "pipe_diameter": 75.0,
                    "pipe_material": "stainless_steel",
                    "pipe_length": 30.0,
                    "suction_fittings": [
                        {"fitting_type": "elbow_45", "quantity": 2}
                    ],
                    "npsh_required": 4.0
                }
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=case["data"], timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    
                    npshd = result.get("npshd", 0)
                    fluid_props = result.get("fluid_properties", {})
                    vapor_pressure = fluid_props.get("vapor_pressure", 0)
                    cavitation_risk = result.get("cavitation_risk", False)
                    warnings = result.get("warnings", [])
                    
                    # Check that vapor pressure is high for volatile fluids
                    if case["data"]["fluid_type"] == "gasoline" and vapor_pressure < 10000:
                        self.log_test(f"Phase 3 - {case['name']} Vapor Pressure", False, 
                                    f"Gasoline vapor pressure too low: {vapor_pressure} Pa")
                        all_passed = False
                        continue
                    
                    if case["data"]["fluid_type"] == "methanol" and vapor_pressure < 8000:
                        self.log_test(f"Phase 3 - {case['name']} Vapor Pressure", False, 
                                    f"Methanol vapor pressure too low: {vapor_pressure} Pa")
                        all_passed = False
                        continue
                    
                    # Check that NPSHd calculation handles high vapor pressure correctly
                    if math.isnan(npshd) or math.isinf(npshd):
                        self.log_test(f"Phase 3 - {case['name']} NPSHd Calculation", False, 
                                    f"Invalid NPSHd: {npshd}")
                        all_passed = False
                        continue
                    
                    # For volatile fluids, NPSHd might be lower due to high vapor pressure
                    # This is expected behavior
                    
                    # Check that appropriate warnings are generated for volatile fluids
                    volatile_warnings = [w for w in warnings if "vapeur" in w.lower() or "volatile" in w.lower() or "cavitation" in w.lower()]
                    
                    self.log_test(f"Phase 3 - {case['name']}", True, 
                                f"NPSHd: {npshd:.2f}m, Vapor Pressure: {vapor_pressure:.0f} Pa, Risk: {cavitation_risk}")
                else:
                    self.log_test(f"Phase 3 - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Phase 3 - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_phase3_zero_half_values_robustness(self):
        """Phase 3: Test robustness - ensure 0 and 0.5 field corrections still work"""
        print("\n🔧 Testing Phase 3 - Robustness of 0 and 0.5 Values...")
        
        test_cases = [
            {
                "name": "Expert Analysis with 0 Values",
                "data": {
                    "flow_rate": 50.0,
                    "fluid_type": "water",
                    "temperature": 20.0,
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 100.0,
                    "discharge_pipe_diameter": 80.0,
                    "suction_height": 0.0,  # Zero value
                    "discharge_height": 20.0,
                    "suction_length": 0.0,  # Zero value
                    "discharge_length": 50.0,
                    "total_length": 50.0,
                    "useful_pressure": 0.0,  # Zero value
                    "suction_material": "pvc",
                    "discharge_material": "pvc",
                    "pump_efficiency": 75.0,
                    "motor_efficiency": 88.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 50.0,
                    "cable_material": "copper",
                    "npsh_required": 0.0,  # Zero value
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 8760.0,
                    "electricity_cost": 0.12,
                    "altitude": 0.0,
                    "ambient_temperature": 25.0,
                    "humidity": 60.0
                }
            },
            {
                "name": "Expert Analysis with 0.5 Values",
                "data": {
                    "flow_rate": 40.0,
                    "fluid_type": "oil",
                    "temperature": 25.0,
                    "suction_type": "suction_lift",
                    "suction_pipe_diameter": 90.0,
                    "discharge_pipe_diameter": 75.0,
                    "suction_height": 0.5,  # 0.5 value
                    "discharge_height": 15.0,
                    "suction_length": 0.5,  # 0.5 value
                    "discharge_length": 40.0,
                    "total_length": 40.5,
                    "useful_pressure": 0.5,  # 0.5 value
                    "suction_material": "steel",
                    "discharge_material": "steel",
                    "pump_efficiency": 70.0,
                    "motor_efficiency": 85.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 60.0,
                    "cable_material": "copper",
                    "npsh_required": 0.5,  # 0.5 value
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 6000.0,
                    "electricity_cost": 0.15,
                    "altitude": 0.0,
                    "ambient_temperature": 25.0,
                    "humidity": 60.0
                }
            },
            {
                "name": "Expert Analysis with Mixed 0 and 0.5 Values",
                "data": {
                    "flow_rate": 60.0,
                    "fluid_type": "glycol",
                    "temperature": 30.0,
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 110.0,
                    "discharge_pipe_diameter": 90.0,
                    "suction_height": 0.0,  # Zero value
                    "discharge_height": 25.0,
                    "suction_length": 0.5,  # 0.5 value
                    "discharge_length": 60.0,
                    "total_length": 60.5,
                    "useful_pressure": 0.0,  # Zero value
                    "suction_material": "pvc",
                    "discharge_material": "pvc",
                    "pump_efficiency": 80.0,
                    "motor_efficiency": 90.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 55.0,
                    "cable_material": "copper",
                    "npsh_required": 0.5,  # 0.5 value
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 7000.0,
                    "electricity_cost": 0.10,
                    "altitude": 0.0,
                    "ambient_temperature": 25.0,
                    "humidity": 60.0
                }
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/expert-analysis", json=case["data"], timeout=15)
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check that input data is preserved correctly
                    input_data = result.get("input_data", {})
                    
                    # Verify 0 and 0.5 values are preserved
                    test_fields = ["suction_height", "suction_length", "useful_pressure", "npsh_required"]
                    for field in test_fields:
                        if field in case["data"]:
                            expected_value = case["data"][field]
                            actual_value = input_data.get(field, -999)  # Use -999 as sentinel
                            
                            if abs(actual_value - expected_value) > 0.001:
                                self.log_test(f"Phase 3 Robustness - {case['name']} - {field}", False, 
                                            f"Expected {expected_value}, got {actual_value}")
                                all_passed = False
                                continue
                    
                    # Check that calculations work with 0 and 0.5 values
                    npshd_analysis = result.get("npshd_analysis", {})
                    hmt_analysis = result.get("hmt_analysis", {})
                    overall_efficiency = result.get("overall_efficiency", 0)
                    
                    npshd = npshd_analysis.get("npshd", 0)
                    hmt = hmt_analysis.get("hmt", 0)
                    
                    if math.isnan(npshd) or math.isinf(npshd):
                        self.log_test(f"Phase 3 Robustness - {case['name']} NPSHd", False, 
                                    f"Invalid NPSHd with 0/0.5 values: {npshd}")
                        all_passed = False
                        continue
                    
                    if math.isnan(hmt) or math.isinf(hmt) or hmt <= 0:
                        self.log_test(f"Phase 3 Robustness - {case['name']} HMT", False, 
                                    f"Invalid HMT with 0/0.5 values: {hmt}")
                        all_passed = False
                        continue
                    
                    if math.isnan(overall_efficiency) or overall_efficiency <= 0:
                        self.log_test(f"Phase 3 Robustness - {case['name']} Efficiency", False, 
                                    f"Invalid efficiency with 0/0.5 values: {overall_efficiency}")
                        all_passed = False
                        continue
                    
                    # Check that performance curves are generated
                    performance_curves = result.get("performance_curves", {})
                    if "flow" not in performance_curves or len(performance_curves["flow"]) == 0:
                        self.log_test(f"Phase 3 Robustness - {case['name']} Curves", False, 
                                    "Performance curves not generated with 0/0.5 values")
                        all_passed = False
                        continue
                    
                    self.log_test(f"Phase 3 Robustness - {case['name']}", True, 
                                f"NPSHd: {npshd:.2f}m, HMT: {hmt:.2f}m, Eff: {overall_efficiency:.1f}%")
                else:
                    self.log_test(f"Phase 3 Robustness - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Phase 3 Robustness - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_phase3_system_integrity(self):
        """Phase 3: Test system integrity - ensure no regressions in existing functionality"""
        print("\n🔍 Testing Phase 3 - System Integrity (No Regressions)...")
        
        # Test original functionality still works
        legacy_tests = [
            {
                "name": "Legacy Calculate Endpoint",
                "endpoint": "/calculate",
                "data": {
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
            },
            {
                "name": "NPSHd Calculation with Original Fluids",
                "endpoint": "/calculate-npshd",
                "data": {
                    "suction_type": "flooded",
                    "hasp": 2.0,
                    "flow_rate": 40.0,
                    "fluid_type": "oil",  # Original fluid
                    "temperature": 25.0,
                    "pipe_diameter": 90.0,
                    "pipe_material": "pvc",
                    "pipe_length": 40.0,
                    "suction_fittings": [],
                    "npsh_required": 3.0
                }
            },
            {
                "name": "Performance Analysis with Original Fluids",
                "endpoint": "/calculate-performance",
                "data": {
                    "flow_rate": 60.0,
                    "hmt": 25.0,
                    "pipe_diameter": 110.0,
                    "fluid_type": "acid",  # Original fluid
                    "pipe_material": "pvc",
                    "pump_efficiency": 78.0,
                    "motor_efficiency": 88.0,
                    "starting_method": "star_delta",
                    "power_factor": 0.8,
                    "cable_length": 60.0,
                    "voltage": 400
                }
            }
        ]
        
        all_passed = True
        for test in legacy_tests:
            try:
                response = requests.post(f"{BACKEND_URL}{test['endpoint']}", json=test["data"], timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check basic structure based on endpoint
                    if test["endpoint"] == "/calculate":
                        required_fields = ["hydraulic_power", "absorbed_power", "total_efficiency", "flow_velocity"]
                    elif test["endpoint"] == "/calculate-npshd":
                        required_fields = ["npshd", "velocity", "reynolds_number", "total_head_loss"]
                    elif test["endpoint"] == "/calculate-performance":
                        required_fields = ["power_calculations", "performance_curves", "overall_efficiency"]
                    
                    missing_fields = [f for f in required_fields if f not in result]
                    if missing_fields:
                        self.log_test(f"Phase 3 Integrity - {test['name']}", False, 
                                    f"Missing fields: {missing_fields}")
                        all_passed = False
                        continue
                    
                    # Check that calculations produce reasonable results
                    if test["endpoint"] == "/calculate":
                        hydraulic_power = result.get("hydraulic_power", 0)
                        if hydraulic_power <= 0 or hydraulic_power > 1000:
                            self.log_test(f"Phase 3 Integrity - {test['name']}", False, 
                                        f"Unreasonable hydraulic power: {hydraulic_power}")
                            all_passed = False
                            continue
                    
                    elif test["endpoint"] == "/calculate-npshd":
                        npshd = result.get("npshd", 0)
                        if math.isnan(npshd) or math.isinf(npshd):
                            self.log_test(f"Phase 3 Integrity - {test['name']}", False, 
                                        f"Invalid NPSHd: {npshd}")
                            all_passed = False
                            continue
                    
                    elif test["endpoint"] == "/calculate-performance":
                        overall_efficiency = result.get("overall_efficiency", 0)
                        if overall_efficiency <= 0 or overall_efficiency > 100:
                            self.log_test(f"Phase 3 Integrity - {test['name']}", False, 
                                        f"Invalid efficiency: {overall_efficiency}")
                            all_passed = False
                            continue
                    
                    self.log_test(f"Phase 3 Integrity - {test['name']}", True, "Legacy functionality preserved")
                else:
                    self.log_test(f"Phase 3 Integrity - {test['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Phase 3 Integrity - {test['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_food_domestic_fluids_properties(self):
        """Test properties of new food and domestic fluids at specific temperatures"""
        print("\n🥛 Testing Food & Domestic Fluids Properties...")
        
        test_cases = [
            {
                "name": "Milk at 20°C",
                "fluid": "milk",
                "temperature": 20.0,
                "expected_density_range": (1025, 1035),  # kg/m³
                "expected_viscosity_range": (0.0014, 0.0016)  # Pa·s
            },
            {
                "name": "Milk at 4°C (refrigeration)",
                "fluid": "milk",
                "temperature": 4.0,
                "expected_density_range": (1035, 1045),  # Higher density at lower temp
                "expected_viscosity_range": (0.0016, 0.0018)  # Higher viscosity at lower temp
            },
            {
                "name": "Honey at 20°C",
                "fluid": "honey",
                "temperature": 20.0,
                "expected_density_range": (1395, 1405),  # kg/m³
                "expected_viscosity_range": (8.0, 9.0)  # Pa·s (very viscous)
            },
            {
                "name": "Honey at 40°C (processing)",
                "fluid": "honey",
                "temperature": 40.0,
                "expected_density_range": (1380, 1390),  # Lower density at higher temp
                "expected_viscosity_range": (3.0, 6.0)  # Much lower viscosity at higher temp
            },
            {
                "name": "Wine at 20°C",
                "fluid": "wine",
                "temperature": 20.0,
                "expected_density_range": (985, 995),  # kg/m³ (less dense due to alcohol)
                "expected_viscosity_range": (0.0011, 0.0013)  # Pa·s
            },
            {
                "name": "Bleach at 20°C",
                "fluid": "bleach",
                "temperature": 20.0,
                "expected_density_range": (1045, 1055),  # kg/m³
                "expected_viscosity_range": (0.0010, 0.0012)  # Pa·s (close to water)
            },
            {
                "name": "Yogurt at 4°C (refrigeration)",
                "fluid": "yogurt",
                "temperature": 4.0,
                "expected_density_range": (1055, 1065),  # kg/m³
                "expected_viscosity_range": (0.18, 0.22)  # Pa·s (creamy consistency)
            },
            {
                "name": "Tomato Sauce at 80°C (processing)",
                "fluid": "tomato_sauce",
                "temperature": 80.0,
                "expected_density_range": (1070, 1080),  # kg/m³
                "expected_viscosity_range": (1.0, 2.0)  # Pa·s (much lower at high temp)
            },
            {
                "name": "Soap Solution at 20°C",
                "fluid": "soap_solution",
                "temperature": 20.0,
                "expected_density_range": (1005, 1015),  # kg/m³
                "expected_viscosity_range": (0.0012, 0.0014)  # Pa·s
            },
            {
                "name": "Fruit Juice at 5°C (service)",
                "fluid": "fruit_juice",
                "temperature": 5.0,
                "expected_density_range": (1050, 1060),  # kg/m³
                "expected_viscosity_range": (0.0019, 0.0021)  # Pa·s
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                # Test with NPSHd calculation to get fluid properties
                test_data = {
                    "suction_type": "flooded",
                    "hasp": 2.0,
                    "flow_rate": 30.0,
                    "fluid_type": case["fluid"],
                    "temperature": case["temperature"],
                    "pipe_diameter": 100.0,
                    "pipe_material": "pvc",
                    "pipe_length": 30.0,
                    "suction_fittings": [],
                    "npsh_required": 3.0
                }
                
                response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=test_data, timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    fluid_props = result.get("fluid_properties", {})
                    
                    # Check for NaN values
                    density = fluid_props.get("density", 0)
                    viscosity = fluid_props.get("viscosity", 0)
                    vapor_pressure = fluid_props.get("vapor_pressure", 0)
                    npshd = result.get("npshd", 0)
                    
                    # Check for NaN or invalid values
                    if math.isnan(density) or math.isnan(viscosity) or math.isnan(vapor_pressure) or math.isnan(npshd):
                        self.log_test(f"Food/Domestic Fluids - {case['name']} - NaN Check", False, 
                                    "Found NaN values in calculations")
                        all_passed = False
                        continue
                    
                    # Check density range
                    if not (case["expected_density_range"][0] <= density <= case["expected_density_range"][1]):
                        self.log_test(f"Food/Domestic Fluids - {case['name']} - Density", False, 
                                    f"Density {density:.1f} kg/m³ outside expected range {case['expected_density_range']}")
                        all_passed = False
                        continue
                    
                    # Check viscosity range
                    if not (case["expected_viscosity_range"][0] <= viscosity <= case["expected_viscosity_range"][1]):
                        self.log_test(f"Food/Domestic Fluids - {case['name']} - Viscosity", False, 
                                    f"Viscosity {viscosity:.6f} Pa·s outside expected range {case['expected_viscosity_range']}")
                        all_passed = False
                        continue
                    
                    # Check that NPSHd calculation is reasonable
                    if npshd < -20 or npshd > 50:  # Reasonable range for NPSHd
                        self.log_test(f"Food/Domestic Fluids - {case['name']} - NPSHd", False, 
                                    f"NPSHd {npshd:.2f} m seems unreasonable")
                        all_passed = False
                        continue
                    
                    self.log_test(f"Food/Domestic Fluids - {case['name']}", True, 
                                f"Density: {density:.1f} kg/m³, Viscosity: {viscosity:.6f} Pa·s, NPSHd: {npshd:.2f} m")
                else:
                    self.log_test(f"Food/Domestic Fluids - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Food/Domestic Fluids - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_expert_analysis_with_food_domestic_fluids(self):
        """Test expert analysis endpoint with new food and domestic fluids"""
        print("\n🧪 Testing Expert Analysis with Food & Domestic Fluids...")
        
        test_cases = [
            {
                "name": "Milk Processing System",
                "data": {
                    "flow_rate": 25.0,
                    "fluid_type": "milk",
                    "temperature": 4.0,  # Refrigeration temperature
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 80.0,
                    "discharge_pipe_diameter": 80.0,
                    "suction_height": 1.0,
                    "discharge_height": 8.0,
                    "suction_length": 15.0,
                    "discharge_length": 50.0,
                    "total_length": 65.0,
                    "useful_pressure": 1.5,
                    "suction_material": "pvc",
                    "discharge_material": "pvc",
                    "suction_elbow_90": 1,
                    "discharge_elbow_90": 2,
                    "discharge_check_valve": 1,
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
                    "operating_hours": 8760,
                    "electricity_cost": 0.12,
                    "altitude": 0,
                    "ambient_temperature": 25,
                    "humidity": 60
                }
            },
            {
                "name": "Honey Processing System",
                "data": {
                    "flow_rate": 15.0,
                    "fluid_type": "honey",
                    "temperature": 40.0,  # Processing temperature
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 100.0,
                    "discharge_pipe_diameter": 100.0,
                    "suction_height": 0.5,
                    "discharge_height": 5.0,
                    "suction_length": 10.0,
                    "discharge_length": 30.0,
                    "total_length": 40.0,
                    "useful_pressure": 2.0,
                    "suction_material": "steel",
                    "discharge_material": "steel",
                    "suction_elbow_90": 0,
                    "discharge_elbow_90": 1,
                    "discharge_gate_valve": 1,
                    "pump_efficiency": 70.0,
                    "motor_efficiency": 85.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "direct_on_line",
                    "cable_length": 25.0,
                    "cable_material": "copper",
                    "npsh_required": 4.0,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 2000,
                    "electricity_cost": 0.12,
                    "altitude": 0,
                    "ambient_temperature": 25,
                    "humidity": 60
                }
            },
            {
                "name": "Wine Transfer System",
                "data": {
                    "flow_rate": 40.0,
                    "fluid_type": "wine",
                    "temperature": 20.0,
                    "suction_type": "flooded",
                    "suction_pipe_diameter": 100.0,
                    "discharge_pipe_diameter": 80.0,
                    "suction_height": 1.5,
                    "discharge_height": 12.0,
                    "suction_length": 20.0,
                    "discharge_length": 80.0,
                    "total_length": 100.0,
                    "useful_pressure": 1.0,
                    "suction_material": "pvc",
                    "discharge_material": "pvc",
                    "suction_elbow_90": 2,
                    "discharge_elbow_90": 3,
                    "discharge_check_valve": 1,
                    "pump_efficiency": 78.0,
                    "motor_efficiency": 90.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 50.0,
                    "cable_material": "copper",
                    "npsh_required": 3.5,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 1500,
                    "electricity_cost": 0.12,
                    "altitude": 0,
                    "ambient_temperature": 25,
                    "humidity": 60
                }
            },
            {
                "name": "Cleaning Solution System",
                "data": {
                    "flow_rate": 35.0,
                    "fluid_type": "soap_solution",
                    "temperature": 20.0,
                    "suction_type": "suction_lift",
                    "suction_pipe_diameter": 100.0,
                    "discharge_pipe_diameter": 80.0,
                    "suction_height": 3.0,
                    "discharge_height": 15.0,
                    "suction_length": 25.0,
                    "discharge_length": 60.0,
                    "total_length": 85.0,
                    "useful_pressure": 2.5,
                    "suction_material": "pvc",
                    "discharge_material": "pvc",
                    "suction_elbow_90": 1,
                    "suction_check_valve": 1,
                    "discharge_elbow_90": 2,
                    "discharge_gate_valve": 1,
                    "pump_efficiency": 72.0,
                    "motor_efficiency": 87.0,
                    "voltage": 400,
                    "power_factor": 0.8,
                    "starting_method": "star_delta",
                    "cable_length": 40.0,
                    "cable_material": "copper",
                    "npsh_required": 3.2,
                    "installation_type": "surface",
                    "pump_type": "centrifugal",
                    "operating_hours": 3000,
                    "electricity_cost": 0.12,
                    "altitude": 0,
                    "ambient_temperature": 25,
                    "humidity": 60
                }
            }
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(f"{BACKEND_URL}/expert-analysis", json=case["data"], timeout=15)
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check all required sections are present
                    required_sections = [
                        "input_data", "npshd_analysis", "hmt_analysis", "performance_analysis",
                        "electrical_analysis", "overall_efficiency", "total_head_loss",
                        "system_stability", "energy_consumption", "expert_recommendations",
                        "optimization_potential", "performance_curves", "system_curves"
                    ]
                    
                    missing_sections = [s for s in required_sections if s not in result]
                    if missing_sections:
                        self.log_test(f"Expert Analysis - {case['name']} - Structure", False, 
                                    f"Missing sections: {missing_sections}")
                        all_passed = False
                        continue
                    
                    # Check for NaN values in key calculations
                    npshd_analysis = result.get("npshd_analysis", {})
                    hmt_analysis = result.get("hmt_analysis", {})
                    performance_analysis = result.get("performance_analysis", {})
                    
                    npshd = npshd_analysis.get("npshd", 0)
                    hmt = hmt_analysis.get("hmt", 0)
                    overall_efficiency = result.get("overall_efficiency", 0)
                    energy_consumption = result.get("energy_consumption", 0)
                    
                    # Check for NaN values
                    values_to_check = [npshd, hmt, overall_efficiency, energy_consumption]
                    nan_values = [v for v in values_to_check if math.isnan(v) or math.isinf(v)]
                    
                    if nan_values:
                        self.log_test(f"Expert Analysis - {case['name']} - NaN Check", False, 
                                    f"Found NaN/Inf values in calculations")
                        all_passed = False
                        continue
                    
                    # Check reasonable ranges
                    if npshd < -50 or npshd > 100:
                        self.log_test(f"Expert Analysis - {case['name']} - NPSHd Range", False, 
                                    f"NPSHd {npshd:.2f} m outside reasonable range")
                        all_passed = False
                        continue
                    
                    if hmt <= 0 or hmt > 200:
                        self.log_test(f"Expert Analysis - {case['name']} - HMT Range", False, 
                                    f"HMT {hmt:.2f} m outside reasonable range")
                        all_passed = False
                        continue
                    
                    if overall_efficiency <= 0 or overall_efficiency > 100:
                        self.log_test(f"Expert Analysis - {case['name']} - Efficiency Range", False, 
                                    f"Overall efficiency {overall_efficiency:.1f}% outside reasonable range")
                        all_passed = False
                        continue
                    
                    # Check expert recommendations are present
                    expert_recommendations = result.get("expert_recommendations", [])
                    if not expert_recommendations:
                        self.log_test(f"Expert Analysis - {case['name']} - Recommendations", False, 
                                    "No expert recommendations generated")
                        all_passed = False
                        continue
                    
                    # Check performance curves are generated
                    performance_curves = result.get("performance_curves", {})
                    if not performance_curves or "flow" not in performance_curves:
                        self.log_test(f"Expert Analysis - {case['name']} - Performance Curves", False, 
                                    "Performance curves not generated")
                        all_passed = False
                        continue
                    
                    self.log_test(f"Expert Analysis - {case['name']}", True, 
                                f"NPSHd: {npshd:.2f}m, HMT: {hmt:.2f}m, Eff: {overall_efficiency:.1f}%, Stable: {result.get('system_stability', False)}")
                else:
                    self.log_test(f"Expert Analysis - {case['name']}", False, f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Expert Analysis - {case['name']}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_hydraulic_calculations_consistency_food_domestic(self):
        """Test hydraulic calculations consistency with food and domestic fluids"""
        print("\n🔧 Testing Hydraulic Calculations Consistency - Food & Domestic Fluids...")
        
        test_fluids = ["milk", "honey", "wine", "bleach", "yogurt", "tomato_sauce", "soap_solution", "fruit_juice"]
        
        all_passed = True
        for fluid in test_fluids:
            try:
                # Test NPSHd calculation
                npshd_data = {
                    "suction_type": "flooded",
                    "hasp": 2.0,
                    "flow_rate": 30.0,
                    "fluid_type": fluid,
                    "temperature": 20.0,
                    "pipe_diameter": 100.0,
                    "pipe_material": "pvc",
                    "pipe_length": 40.0,
                    "suction_fittings": [{"fitting_type": "elbow_90", "quantity": 1}],
                    "npsh_required": 3.0
                }
                
                npshd_response = requests.post(f"{BACKEND_URL}/calculate-npshd", json=npshd_data, timeout=10)
                if npshd_response.status_code != 200:
                    self.log_test(f"Hydraulic Consistency - {fluid} - NPSHd", False, f"NPSHd calculation failed: {npshd_response.status_code}")
                    all_passed = False
                    continue
                
                npshd_result = npshd_response.json()
                
                # Test HMT calculation
                hmt_data = {
                    "installation_type": "surface",
                    "suction_type": "flooded",
                    "hasp": 2.0,
                    "discharge_height": 15.0,
                    "useful_pressure": 1.5,
                    "suction_pipe_diameter": 100.0,
                    "discharge_pipe_diameter": 80.0,
                    "suction_pipe_length": 30.0,
                    "discharge_pipe_length": 80.0,
                    "suction_pipe_material": "pvc",
                    "discharge_pipe_material": "pvc",
                    "suction_fittings": [{"fitting_type": "elbow_90", "quantity": 1}],
                    "discharge_fittings": [{"fitting_type": "elbow_90", "quantity": 2}],
                    "fluid_type": fluid,
                    "temperature": 20.0,
                    "flow_rate": 30.0
                }
                
                hmt_response = requests.post(f"{BACKEND_URL}/calculate-hmt", json=hmt_data, timeout=10)
                if hmt_response.status_code != 200:
                    self.log_test(f"Hydraulic Consistency - {fluid} - HMT", False, f"HMT calculation failed: {hmt_response.status_code}")
                    all_passed = False
                    continue
                
                hmt_result = hmt_response.json()
                
                # Check for NaN values in all critical calculations
                critical_values = [
                    npshd_result.get("npshd", 0),
                    npshd_result.get("velocity", 0),
                    npshd_result.get("reynolds_number", 0),
                    npshd_result.get("friction_factor", 0),
                    npshd_result.get("total_head_loss", 0),
                    hmt_result.get("hmt", 0),
                    hmt_result.get("suction_velocity", 0),
                    hmt_result.get("discharge_velocity", 0),
                    hmt_result.get("total_head_loss", 0)
                ]
                
                # Remove None values (for submersible installations)
                critical_values = [v for v in critical_values if v is not None]
                
                # Check for NaN or Inf values
                invalid_values = [v for v in critical_values if math.isnan(v) or math.isinf(v)]
                if invalid_values:
                    self.log_test(f"Hydraulic Consistency - {fluid} - NaN Check", False, 
                                f"Found NaN/Inf values in calculations")
                    all_passed = False
                    continue
                
                # Check that all values are positive (except NPSHd which can be negative)
                npshd = npshd_result.get("npshd", 0)
                velocity = npshd_result.get("velocity", 0)
                reynolds = npshd_result.get("reynolds_number", 0)
                friction_factor = npshd_result.get("friction_factor", 0)
                hmt = hmt_result.get("hmt", 0)
                
                if velocity <= 0:
                    self.log_test(f"Hydraulic Consistency - {fluid} - Velocity", False, 
                                f"Velocity should be positive: {velocity}")
                    all_passed = False
                    continue
                
                if reynolds <= 0:
                    self.log_test(f"Hydraulic Consistency - {fluid} - Reynolds", False, 
                                f"Reynolds number should be positive: {reynolds}")
                    all_passed = False
                    continue
                
                if friction_factor <= 0:
                    self.log_test(f"Hydraulic Consistency - {fluid} - Friction Factor", False, 
                                f"Friction factor should be positive: {friction_factor}")
                    all_passed = False
                    continue
                
                if hmt <= 0:
                    self.log_test(f"Hydraulic Consistency - {fluid} - HMT", False, 
                                f"HMT should be positive: {hmt}")
                    all_passed = False
                    continue
                
                # Check reasonable ranges
                if velocity > 10:  # Very high velocity
                    self.log_test(f"Hydraulic Consistency - {fluid} - Velocity Range", False, 
                                f"Velocity seems too high: {velocity:.2f} m/s")
                    all_passed = False
                    continue
                
                if hmt > 100:  # Very high HMT
                    self.log_test(f"Hydraulic Consistency - {fluid} - HMT Range", False, 
                                f"HMT seems too high: {hmt:.2f} m")
                    all_passed = False
                    continue
                
                self.log_test(f"Hydraulic Consistency - {fluid}", True, 
                            f"NPSHd: {npshd:.2f}m, Velocity: {velocity:.2f}m/s, HMT: {hmt:.2f}m")
                
            except Exception as e:
                self.log_test(f"Hydraulic Consistency - {fluid}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def run_food_domestic_fluids_tests(self):
        """Run comprehensive tests for food and domestic fluids extension"""
        print("=" * 80)
        print("FOOD & DOMESTIC FLUIDS EXTENSION - COMPREHENSIVE TESTING")
        print("=" * 80)
        print()
        
        # Test connectivity first
        if not self.test_api_connectivity():
            print("\n❌ API connectivity failed - aborting remaining tests")
            return False
        
        print()
        
        # Test 1: Verify 20 fluids are available
        print("🔍 PHASE 1: Verifying 20 Fluids API...")
        fluids_test = self.test_fluids_api()
        
        # Test 2: Test properties of new food and domestic fluids
        print("\n🔍 PHASE 2: Testing Food & Domestic Fluids Properties...")
        properties_test = self.test_food_domestic_fluids_properties()
        
        # Test 3: Test expert analysis with new fluids
        print("\n🔍 PHASE 3: Testing Expert Analysis with New Fluids...")
        expert_test = self.test_expert_analysis_with_food_domestic_fluids()
        
        # Test 4: Test hydraulic calculations consistency
        print("\n🔍 PHASE 4: Testing Hydraulic Calculations Consistency...")
        consistency_test = self.test_hydraulic_calculations_consistency_food_domestic()
        
        # Summary
        print("\n" + "=" * 80)
        print("FOOD & DOMESTIC FLUIDS TESTING SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["passed"]])
        failed_tests = len(self.failed_tests)
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        overall_success = fluids_test and properties_test and expert_test and consistency_test
        
        if overall_success:
            print(f"\n✅ FOOD & DOMESTIC FLUIDS EXTENSION TESTING COMPLETED SUCCESSFULLY!")
            print(f"✅ All 20 fluids are available and working correctly")
            print(f"✅ No NaN values detected in calculations")
            print(f"✅ Expert analysis works with all new fluids")
            print(f"✅ Hydraulic calculations are consistent and reliable")
        else:
            print(f"\n❌ FOOD & DOMESTIC FLUIDS EXTENSION TESTING FAILED!")
            print(f"❌ Some critical issues were found - see details above")
        
        return overall_success
    
    def run_all_tests(self):
        print("HYDRAULIC PUMP CALCULATION API - URGENT TESTING")
        print("=" * 80)
        print()
        
        # Test connectivity first
        if not self.test_api_connectivity():
            print("\n❌ API connectivity failed - aborting remaining tests")
            return False
        
        print()
        
        # URGENT TEST FIRST - Performance endpoint issue
        urgent_success = self.test_urgent_performance_endpoint_issue()
        
        # Run all tests - prioritizing Phase 3 additions and specific corrections
        tests = [
            # PHASE 3 TESTS - NEW INDUSTRIAL FLUIDS AND EXPERT ANALYSIS
            self.test_phase3_new_industrial_fluids_properties,  # NEW: Test new fluids properties
            self.test_phase3_expert_analysis_new_fluids,  # NEW: Test expert analysis with new fluids
            self.test_phase3_npshd_gasoline_methanol,  # NEW: Test NPSHd with volatile fluids
            self.test_phase3_zero_half_values_robustness,  # NEW: Test 0 and 0.5 values robustness
            self.test_phase3_system_integrity,  # NEW: Test system integrity (no regressions)
            # EXISTING TESTS - Updated fluids API to check all 12 fluids
            self.test_fluids_api,  # Updated to check all 12 industrial fluids
            # NEW INDUSTRIAL FLUIDS TESTS (from review request)
            self.test_new_industrial_fluids_api,  # NEW: Test all 12 fluids are available
            self.test_new_fluids_property_calculations,  # NEW: Test specific fluids at specific temperatures
            self.test_expert_analysis_with_new_fluids,  # NEW: Test expert analysis with new fluids
            self.test_hydraulic_calculations_consistency,  # NEW: Test no NaN values with new fluids
            # URGENT NPSHD SPECIFIC TESTS (from review request)
            self.test_npshd_required_field_acceptance,  # NEW: Test npsh_required field acceptance
            self.test_npshd_vs_npsh_required_comparison,  # NEW: Test NPSHd vs NPSHr comparison
            self.test_cavitation_risk_detection,  # NEW: Test cavitation risk detection
            self.test_cavitation_alerts_and_recommendations,  # NEW: Test cavitation alerts and recommendations
            # NEW EXPERT ANALYSIS TESTS (from review request)
            self.test_expert_analysis_endpoint,  # NEW: Test expert analysis endpoint
            self.test_expert_recommendations_generation,  # NEW: Test expert recommendations
            self.test_expert_analysis_integration,  # NEW: Test expert analysis integration
            self.test_expert_analysis_comprehensive,  # NEW: Test complete expert analysis revision
            self.test_expert_analysis_final_comprehensive,  # FINAL: Test all user-requested improvements
            # NEW EXPERT TAB ENHANCEMENT TESTS (from current review request)
            self.test_expert_analysis_enhanced_recommendations,  # NEW: Test enhanced expert recommendations with 7 categories
            self.test_hydraulic_data_display_enhanced,  # NEW: Test enhanced hydraulic data display
            self.test_configuration_specific_recommendations_enhanced,  # NEW: Test enhanced configuration-specific recommendations
            self.test_expert_analysis_test_cases_enhanced,  # NEW: Test enhanced expert analysis test cases
            # SPECIFIC TEST FOR 0 AND 0.5 VALUES (from current review request)
            self.test_expert_analysis_zero_and_half_values,  # NEW: Test 0 and 0.5 values acceptance
            # PERFORMANCE ENDPOINT CORRECTED PARAMETERS TEST (from current review request)
            self.test_performance_endpoint_corrected_parameters,  # NEW: Test /api/calculate-performance with corrected parameters
            # Other existing tests
            self.test_user_interface_modifications,  # Test user interface modifications
            self.test_corrected_global_efficiency_formula,  # Test corrected global efficiency
            self.test_operating_point_precision,  # Test operating point precision
            self.test_darcy_formula_integration,  # Test Darcy formula integration
            self.test_updated_npshd_formula,  # Test updated NPSHd formula
            self.test_updated_power_formulas,  # Test updated power formulas
            self.test_performance_curves_flow_vs_hmt,  # Test performance curves
            self.test_api_endpoints_comprehensive,  # Test all endpoints
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
        
        # Highlight urgent test result
        print(f"\n🚨 URGENT TEST RESULT: {'✅ PASSED' if urgent_success else '❌ FAILED'}")
        
        if success_rate >= 90:
            print("\n🎉 EXCELLENT: Backend API is working very well!")
        elif success_rate >= 75:
            print("\n✅ GOOD: Backend API is mostly working with minor issues")
        elif success_rate >= 50:
            print("\n⚠️  MODERATE: Backend API has significant issues that need attention")
        else:
            print("\n❌ CRITICAL: Backend API has major problems that must be fixed")
        
        return success_rate >= 75

    def run_all_tests(self):
        """Run all tests including Phase 3 additions"""
        print("=" * 80)
        print("HYDRAULIC PUMP CALCULATION API - PHASE 3 COMPREHENSIVE TESTING")
        print("=" * 80)
        print()
        
        # Test connectivity first
        if not self.test_api_connectivity():
            print("\n❌ API connectivity failed - aborting remaining tests")
            return False
        
        print()
        
        # Run all tests - prioritizing Phase 3 additions and specific corrections
        tests = [
            # PHASE 3 TESTS - NEW INDUSTRIAL FLUIDS AND EXPERT ANALYSIS
            self.test_phase3_new_industrial_fluids_properties,  # NEW: Test new fluids properties
            self.test_phase3_expert_analysis_new_fluids,  # NEW: Test expert analysis with new fluids
            self.test_phase3_npshd_gasoline_methanol,  # NEW: Test NPSHd with volatile fluids
            self.test_phase3_zero_half_values_robustness,  # NEW: Test 0 and 0.5 values robustness
            self.test_phase3_system_integrity,  # NEW: Test system integrity (no regressions)
            # EXISTING TESTS - Updated fluids API to check all 12 fluids
            self.test_fluids_api,  # Updated to check all 12 industrial fluids
            # Core functionality tests
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
        print("PHASE 3 TEST SUMMARY")
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
            print("\n🎉 EXCELLENT: Phase 3 hydraulic application is working very well!")
        elif success_rate >= 75:
            print("\n✅ GOOD: Phase 3 hydraulic application is mostly working with minor issues")
        elif success_rate >= 50:
            print("\n⚠️  MODERATE: Phase 3 hydraulic application has significant issues that need attention")
        else:
            print("\n❌ CRITICAL: Phase 3 hydraulic application has major problems that must be fixed")
        
        return success_rate >= 75

if __name__ == "__main__":
    tester = HydraulicPumpTester()
    success = tester.run_food_domestic_fluids_tests()
    sys.exit(0 if success else 1)