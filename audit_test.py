#!/usr/bin/env python3
"""
Focused test for the comprehensive audit system
"""

import requests
import json
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://230eef6b-c579-496a-8a4c-b69f38c6e481.preview.emergentagent.com/api"

def test_comprehensive_audit_system():
    """Test new comprehensive audit system with intelligent field analysis"""
    print("🔍 Testing Comprehensive Audit System with Intelligent Field Analysis...")
    
    # Test case from review request - Problematic Installation
    audit_data = {
        "installation_age": 5,
        "installation_type": "surface",
        "fluid_type": "water",
        "fluid_temperature": 20.0,
        "suction_material": "pvc",
        "discharge_material": "pvc",
        "suction_pipe_diameter": 114.3,  # DN100
        "discharge_pipe_diameter": 88.9,  # DN80
        
        # PERFORMANCES HYDRAULIQUES - Comparaison ACTUEL vs REQUIS vs ORIGINAL
        "current_flow_rate": 45.0,      # Débit mesuré actuellement (m³/h)
        "required_flow_rate": 60.0,     # Débit requis process (m³/h) - 25% under-performing
        "original_design_flow": 65.0,   # Débit conception (m³/h)
        
        "current_hmt": 35.0,            # HMT mesurée actuellement (m)
        "required_hmt": 25.0,           # HMT requise process (m) - 40% over-pressurizing
        "original_design_hmt": 30.0,    # HMT conception (m)
        
        # Pressions mesures TERRAIN
        "suction_pressure": -0.2,       # Pression aspiration (bar)
        "discharge_pressure": 3.5,      # Pression refoulement (bar)
        
        # PERFORMANCES ÉLECTRIQUES - Comparaison MESURES vs PLAQUE
        "measured_current": 28.0,       # Intensité mesurée (A) - 27% motor overload
        "rated_current": 22.0,          # Intensité plaque (A)
        "measured_power": 15.5,         # Puissance mesurée (kW)
        "rated_power": 12.0,            # Puissance plaque (kW)
        "measured_voltage": 395.0,      # Tension mesurée (V)
        "rated_voltage": 400.0,         # Tension nominale (V)
        "measured_power_factor": 0.82,  # Cos φ mesuré
        
        # ÉTAT MÉCANIQUE - Observations terrain
        "vibration_level": 5.2,         # Vibrations (mm/s) - excessive, >4.5
        "noise_level": 85.0,            # Bruit (dB(A))
        "motor_temperature": 75.0,      # Température moteur (°C)
        "bearing_temperature": 65.0,    # Température paliers (°C)
        
        # États visuels
        "leakage_present": False,
        "corrosion_level": "moderate",  # moderate corrosion
        "alignment_status": "fair",
        "coupling_condition": "good",
        "foundation_status": "good",
        
        # EXPLOITATION
        "operating_hours_daily": 16.0,
        "operating_days_yearly": 300.0,
        "last_maintenance": "2023-06-15",
        "maintenance_frequency": "quarterly",
        
        # Problématiques
        "reported_issues": ["High energy consumption", "Reduced flow rate", "Excessive vibration"],
        "performance_degradation": True,
        "energy_consumption_increase": True,
        
        # CONTEXTE ÉNERGÉTIQUE
        "electricity_cost_per_kwh": 0.12,
        "load_factor": 0.75,
        "has_vfd": False,
        "has_soft_starter": False,
        "has_automation": False
    }
    
    try:
        print(f"📡 Sending request to {BACKEND_URL}/audit-analysis...")
        response = requests.post(f"{BACKEND_URL}/audit-analysis", json=audit_data, timeout=15)
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print("✅ SUCCESS: Audit analysis completed successfully!")
            print(f"📋 Audit ID: {result.get('audit_id', 'N/A')}")
            print(f"📅 Audit Date: {result.get('audit_date', 'N/A')}")
            
            # Test overall structure
            required_fields = [
                "audit_id", "audit_date", "overall_score", "hydraulic_score", 
                "electrical_score", "mechanical_score", "operational_score",
                "performance_comparisons", "diagnostics", "recommendations",
                "executive_summary", "economic_analysis", "action_plan"
            ]
            
            missing_fields = [field for field in required_fields if field not in result]
            if missing_fields:
                print(f"❌ STRUCTURE ERROR: Missing fields: {missing_fields}")
                return False
            
            # Test expected overall score (40-60 due to multiple issues)
            overall_score = result.get("overall_score", 0)
            print(f"🎯 Overall Score: {overall_score}/100")
            
            if not (40 <= overall_score <= 60):
                print(f"❌ SCORE ERROR: Expected score 40-60, got {overall_score}")
                return False
            
            # Test performance comparisons
            performance_comparisons = result.get("performance_comparisons", [])
            print(f"📊 Performance Comparisons: {len(performance_comparisons)}")
            
            if len(performance_comparisons) < 3:
                print(f"❌ COMPARISON ERROR: Expected at least 3 comparisons, got {len(performance_comparisons)}")
                return False
            
            # Verify flow rate analysis (25% under-performing)
            flow_comparison = next((comp for comp in performance_comparisons 
                                  if comp["parameter_name"] == "Débit"), None)
            if not flow_comparison:
                print("❌ FLOW ERROR: Missing flow rate comparison")
                return False
            
            flow_deviation = flow_comparison.get("deviation_from_required", 0)
            print(f"💧 Flow Deviation: {flow_deviation:.1f}% (expected ~-25%)")
            
            if not (-30 <= flow_deviation <= -20):  # Should be around -25%
                print(f"❌ FLOW DEVIATION ERROR: Expected ~-25% deviation, got {flow_deviation:.1f}%")
                return False
            
            # Verify HMT analysis (40% over-pressurizing)
            hmt_comparison = next((comp for comp in performance_comparisons 
                                 if comp["parameter_name"] == "HMT"), None)
            if not hmt_comparison:
                print("❌ HMT ERROR: Missing HMT comparison")
                return False
            
            hmt_deviation = hmt_comparison.get("deviation_from_required", 0)
            print(f"⬆️ HMT Deviation: {hmt_deviation:.1f}% (expected ~+40%)")
            
            if not (35 <= hmt_deviation <= 45):  # Should be around +40%
                print(f"❌ HMT DEVIATION ERROR: Expected ~+40% deviation, got {hmt_deviation:.1f}%")
                return False
            
            # Verify current analysis (27% motor overload)
            current_comparison = next((comp for comp in performance_comparisons 
                                     if comp["parameter_name"] == "Intensité"), None)
            if not current_comparison:
                print("❌ CURRENT ERROR: Missing current comparison")
                return False
            
            current_deviation = current_comparison.get("deviation_from_required", 0)
            print(f"⚡ Current Deviation: {current_deviation:.1f}% (expected ~+27%)")
            
            if not (22 <= current_deviation <= 32):  # Should be around +27%
                print(f"❌ CURRENT DEVIATION ERROR: Expected ~+27% deviation, got {current_deviation:.1f}%")
                return False
            
            # Test diagnostics (hydraulic, electrical, mechanical)
            diagnostics = result.get("diagnostics", [])
            print(f"🔍 Diagnostics: {len(diagnostics)}")
            
            if len(diagnostics) < 3:
                print(f"❌ DIAGNOSTIC ERROR: Expected at least 3 diagnostics, got {len(diagnostics)}")
                return False
            
            # Verify diagnostic categories
            diagnostic_categories = [diag["category"] for diag in diagnostics]
            expected_categories = ["hydraulic", "electrical", "mechanical"]
            missing_categories = [cat for cat in expected_categories if cat not in diagnostic_categories]
            if missing_categories:
                print(f"❌ DIAGNOSTIC CATEGORY ERROR: Missing categories: {missing_categories}")
                return False
            
            print(f"✅ Diagnostic Categories: {diagnostic_categories}")
            
            # Test recommendations (critical/high priority)
            recommendations = result.get("recommendations", [])
            print(f"💡 Recommendations: {len(recommendations)}")
            
            if len(recommendations) < 2:
                print(f"❌ RECOMMENDATION ERROR: Expected at least 2 recommendations, got {len(recommendations)}")
                return False
            
            # Verify critical/high priority recommendations
            priorities = [rec["priority"] for rec in recommendations]
            if not any(priority in ["critical", "high"] for priority in priorities):
                print("❌ PRIORITY ERROR: No critical or high priority recommendations found")
                return False
            
            print(f"✅ Recommendation Priorities: {priorities}")
            
            # Test economic analysis with payback
            economic_analysis = result.get("economic_analysis", {})
            if not economic_analysis:
                print("❌ ECONOMIC ERROR: Missing economic analysis")
                return False
            
            # Verify economic fields
            economic_fields = ["total_investment_cost", "annual_savings", "payback_months"]
            missing_economic = [field for field in economic_fields if field not in economic_analysis]
            if missing_economic:
                print(f"❌ ECONOMIC FIELD ERROR: Missing economic fields: {missing_economic}")
                return False
            
            payback_months = economic_analysis.get("payback_months", "N/A")
            print(f"💰 Economic Analysis: Payback {payback_months} months")
            
            # Test phased action plan
            action_plan = result.get("action_plan", {})
            if not action_plan:
                print("❌ ACTION PLAN ERROR: Missing action plan")
                return False
            
            # Verify action plan phases
            if "phases" not in action_plan:
                print("❌ PHASES ERROR: Missing phases in action plan")
                return False
            
            phases = action_plan["phases"]
            if len(phases) < 2:
                print(f"❌ PHASE COUNT ERROR: Expected at least 2 phases, got {len(phases)}")
                return False
            
            print(f"📋 Action Plan Phases: {len(phases)}")
            
            # Test executive summary
            executive_summary = result.get("executive_summary", {})
            if not executive_summary:
                print("❌ SUMMARY ERROR: Missing executive summary")
                return False
            
            # Verify executive summary fields
            summary_fields = ["key_findings", "critical_issues", "priority_actions"]
            missing_summary = [field for field in summary_fields if field not in executive_summary]
            if missing_summary:
                print(f"❌ SUMMARY FIELD ERROR: Missing summary fields: {missing_summary}")
                return False
            
            print("✅ Executive Summary: Complete")
            
            print(f"\n🎉 COMPREHENSIVE AUDIT SYSTEM TEST PASSED!")
            print(f"📊 Overall Score: {overall_score}/100")
            print(f"🔍 Diagnostics: {len(diagnostics)}")
            print(f"💡 Recommendations: {len(recommendations)}")
            print(f"💰 Payback: {payback_months} months")
            
            return True
        else:
            print(f"❌ API ERROR: Status {response.status_code}")
            if response.status_code >= 400:
                try:
                    error_detail = response.json()
                    print(f"❌ Error Detail: {error_detail}")
                except:
                    print(f"❌ Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"❌ EXCEPTION ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 80)
    print("COMPREHENSIVE AUDIT SYSTEM TEST")
    print("=" * 80)
    
    success = test_comprehensive_audit_system()
    
    print("\n" + "=" * 80)
    if success:
        print("✅ AUDIT SYSTEM TEST PASSED - All requirements met!")
    else:
        print("❌ AUDIT SYSTEM TEST FAILED - Issues found!")
    print("=" * 80)