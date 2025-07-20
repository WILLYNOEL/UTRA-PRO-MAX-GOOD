#!/usr/bin/env python3
"""
Test script specifically for the /api/solar-pumping endpoint
"""

import requests
import json

# Use localhost since external URL routing has issues
BACKEND_URL = "http://localhost:8001/api"

def test_solar_pumping_endpoint():
    """Test the /api/solar-pumping endpoint with default Expert Solaire data"""
    print("🌞 Testing Solar Pumping Endpoint...")
    
    # Test data from the user request - Expert Solaire default values
    test_data = {
        "project_name": "Test Système Pompage Solaire",
        "location_region": "france",
        "location_subregion": "centre",
        "daily_water_need": 10,  # m³/jour
        "operating_hours": 8,    # heures/jour
        "flow_rate": 1.25,       # m³/h (calculé: 10/8)
        "seasonal_variation": 1.2,
        "peak_months": [6, 7, 8],
        "dynamic_level": 15,     # m
        "tank_height": 5,        # m
        "static_head": 20,       # m (niveau + château)
        "dynamic_losses": 5,     # m
        "useful_pressure_head": 0, # m
        "total_head": 25,        # m
        "pipe_diameter": 100,    # mm
        "pipe_length": 50,       # m
        "panel_peak_power": 400, # Wc
        "autonomy_days": 2,
        "system_voltage": 24,    # V
        "installation_type": "submersible",
        "electricity_cost": 0.15,
        "project_lifetime": 25,
        "maintenance_cost_annual": 0.02,
        "grid_connection_available": False,
        "ambient_temperature_avg": 25,
        "dust_factor": 0.95,
        "shading_factor": 1.0
    }
    
    try:
        print("Sending request to /api/solar-pumping...")
        response = requests.post(f"{BACKEND_URL}/solar-pumping", json=test_data, timeout=15)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS: Solar pumping endpoint returned 200 OK")
            
            # Validate main structure
            required_keys = [
                "input_data", "dimensioning", "solar_irradiation", 
                "system_efficiency", "pump_operating_hours", 
                "monthly_performance", "system_curves", "warnings", "critical_alerts"
            ]
            
            missing_keys = [key for key in required_keys if key not in result]
            if missing_keys:
                print(f"❌ FAIL: Missing keys in response: {missing_keys}")
                return False
            
            print("✅ SUCCESS: All required top-level keys present")
            
            # Extract key results
            dimensioning = result.get("dimensioning", {})
            pump = dimensioning.get("recommended_pump", {})
            panels = dimensioning.get("solar_panels", {})
            batteries = dimensioning.get("batteries", {})
            mppt = dimensioning.get("mppt_controller", {})
            economic = dimensioning.get("economic_analysis", {})
            monthly_perf = result.get("monthly_performance", {})
            
            # Validate key components
            if not pump.get("model"):
                print("❌ FAIL: No pump model recommended")
                return False
            print(f"✅ Pump recommended: {pump.get('model')}")
            
            if panels.get("quantity", 0) <= 0:
                print("❌ FAIL: No solar panels recommended")
                return False
            print(f"✅ Solar panels: {panels.get('quantity')}x {panels.get('total_power')}W")
            
            if batteries.get("total_quantity", 0) <= 0:
                print("❌ FAIL: No batteries recommended")
                return False
            print(f"✅ Batteries: {batteries.get('configuration')} ({batteries.get('total_quantity')} units)")
            
            if not mppt.get("model"):
                print("❌ FAIL: No MPPT controller recommended")
                return False
            print(f"✅ MPPT Controller: {mppt.get('model')}")
            
            # Validate economic analysis
            total_cost = economic.get("total_system_cost", 0)
            payback_period = economic.get("payback_period", 0)
            roi = economic.get("roi_percentage", 0)
            
            if total_cost <= 0:
                print("❌ FAIL: Invalid total system cost")
                return False
            print(f"✅ Economic analysis: Cost={total_cost:.0f}€, Payback={payback_period:.1f}years, ROI={roi:.1f}%")
            
            # Validate monthly performance data
            if len(monthly_perf.get("months", [])) != 12:
                print("❌ FAIL: Monthly performance data incomplete")
                return False
            print("✅ Monthly performance data complete (12 months)")
            
            # Check that Results tab would have data
            results_data_available = all([
                pump.get("model"),
                panels.get("quantity", 0) > 0,
                batteries.get("total_quantity", 0) > 0,
                mppt.get("model"),
                total_cost > 0,
                len(monthly_perf.get("production", [])) == 12
            ])
            
            if results_data_available:
                print("✅ SUCCESS: Results tab should display complete data")
                print("\n📊 SUMMARY OF RESULTS:")
                print(f"   • Pump: {pump.get('model')} ({pump.get('power', 0):.0f}W)")
                print(f"   • Panels: {panels.get('quantity')}x {panels.get('total_power', 0)/panels.get('quantity', 1):.0f}W = {panels.get('total_power')}W total")
                print(f"   • Batteries: {batteries.get('configuration')} = {batteries.get('total_quantity')} units")
                print(f"   • MPPT: {mppt.get('model')}")
                print(f"   • Total Cost: {total_cost:.0f}€")
                print(f"   • Payback Period: {payback_period:.1f} years")
                print(f"   • ROI: {roi:.1f}%")
                print(f"   • System Efficiency: {result.get('system_efficiency', 0)*100:.1f}%")
                return True
            else:
                print("❌ FAIL: Results tab would be missing data")
                return False
                
        else:
            error_detail = ""
            try:
                error_data = response.json()
                error_detail = error_data.get("detail", "Unknown error")
            except:
                error_detail = response.text[:200] if response.text else "No error details"
            
            print(f"❌ FAIL: Status {response.status_code}, Error: {error_detail}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Exception occurred: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 80)
    print("SOLAR PUMPING ENDPOINT TEST")
    print("=" * 80)
    
    success = test_solar_pumping_endpoint()
    
    print("\n" + "=" * 80)
    if success:
        print("🎉 CONCLUSION: Solar pumping endpoint is working correctly!")
        print("   The Results tab should display complete solar system data.")
    else:
        print("❌ CONCLUSION: Solar pumping endpoint has issues.")
        print("   This explains why the Results tab might be empty.")
    print("=" * 80)