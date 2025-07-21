#!/usr/bin/env python3
"""
ECO PUMP EXPERT Backend Testing
Tests the specific endpoints requested in the review
"""

import requests
import json
import sys

# Backend URL from environment
BACKEND_URL = "http://localhost:8001/api"

def test_eco_pump_expert():
    """Test ECO PUMP EXPERT specific endpoints"""
    print("🌱 ECO PUMP EXPERT BACKEND TESTING")
    print("=" * 50)
    
    results = []
    
    # Test 1: GET /api/fluids (should return 20 fluids)
    print("\n1. Testing GET /api/fluids...")
    try:
        response = requests.get(f"{BACKEND_URL}/fluids", timeout=10)
        if response.status_code == 200:
            data = response.json()
            fluids = data.get("fluids", [])
            print(f"   ✅ Status: {response.status_code}")
            print(f"   ✅ Found {len(fluids)} fluids")
            
            if len(fluids) == 20:
                print(f"   ✅ PASS: Expected 20 fluids, found {len(fluids)}")
                results.append(("GET /api/fluids", True, f"{len(fluids)} fluids"))
            else:
                print(f"   ❌ FAIL: Expected 20 fluids, found {len(fluids)}")
                results.append(("GET /api/fluids", False, f"Expected 20, found {len(fluids)}"))
            
            # Show first few fluids
            fluid_names = [f["id"] for f in fluids[:5]]
            print(f"   📋 Sample fluids: {', '.join(fluid_names)}...")
        else:
            print(f"   ❌ FAIL: Status {response.status_code}")
            results.append(("GET /api/fluids", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"   ❌ FAIL: Error {str(e)}")
        results.append(("GET /api/fluids", False, f"Error: {str(e)}"))
    
    # Test 2: GET /api/pipe-materials
    print("\n2. Testing GET /api/pipe-materials...")
    try:
        response = requests.get(f"{BACKEND_URL}/pipe-materials", timeout=10)
        if response.status_code == 200:
            data = response.json()
            materials = data.get("materials", [])
            print(f"   ✅ Status: {response.status_code}")
            print(f"   ✅ Found {len(materials)} pipe materials")
            
            if len(materials) > 0:
                print(f"   ✅ PASS: Found pipe materials")
                results.append(("GET /api/pipe-materials", True, f"{len(materials)} materials"))
                
                # Show materials
                material_names = [m["id"] for m in materials]
                print(f"   📋 Materials: {', '.join(material_names)}")
            else:
                print(f"   ❌ FAIL: No pipe materials found")
                results.append(("GET /api/pipe-materials", False, "No materials"))
        else:
            print(f"   ❌ FAIL: Status {response.status_code}")
            results.append(("GET /api/pipe-materials", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"   ❌ FAIL: Error {str(e)}")
        results.append(("GET /api/pipe-materials", False, f"Error: {str(e)}"))
    
    # Test 3: GET /api/solar-regions
    print("\n3. Testing GET /api/solar-regions...")
    try:
        response = requests.get(f"{BACKEND_URL}/solar-regions", timeout=10)
        if response.status_code == 200:
            data = response.json()
            regions = data.get("regions", [])
            print(f"   ✅ Status: {response.status_code}")
            print(f"   ✅ Found {len(regions)} solar regions")
            
            if len(regions) > 0:
                region_names = [r.get("id", "") for r in regions]
                if "dakar" in region_names:
                    print(f"   ✅ PASS: Found solar regions including Dakar")
                    results.append(("GET /api/solar-regions", True, f"{len(regions)} regions with Dakar"))
                else:
                    print(f"   ✅ PASS: Found solar regions (Dakar not found but others available)")
                    results.append(("GET /api/solar-regions", True, f"{len(regions)} regions"))
                
                # Show first few regions
                print(f"   📋 Regions: {', '.join(region_names[:5])}...")
            else:
                print(f"   ❌ FAIL: No solar regions found")
                results.append(("GET /api/solar-regions", False, "No regions"))
        else:
            print(f"   ❌ FAIL: Status {response.status_code}")
            results.append(("GET /api/solar-regions", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"   ❌ FAIL: Error {str(e)}")
        results.append(("GET /api/solar-regions", False, f"Error: {str(e)}"))
    
    # Test 4: POST /api/solar-pumping (Expert Solaire calculations)
    print("\n4. Testing POST /api/solar-pumping...")
    solar_test_data = {
        "daily_water_need": 800,
        "operating_hours": 8,
        "total_head": 25,
        "efficiency_pump": 75,
        "efficiency_motor": 90,
        "region": "dakar"
    }
    
    try:
        print(f"   📤 Sending data: {solar_test_data}")
        response = requests.post(f"{BACKEND_URL}/solar-pumping", json=solar_test_data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Status: {response.status_code}")
            
            # Check for required sections
            required_sections = ["results", "economy"]
            missing_sections = []
            
            for section in required_sections:
                if section not in result:
                    missing_sections.append(section)
            
            if missing_sections:
                print(f"   ❌ FAIL: Missing sections: {missing_sections}")
                results.append(("POST /api/solar-pumping", False, f"Missing: {missing_sections}"))
            else:
                # Check content of sections
                results_section = result.get("results", {})
                economy_section = result.get("economy", {})
                
                print(f"   ✅ Found 'results' section with {len(results_section)} fields")
                print(f"   ✅ Found 'economy' section with {len(economy_section)} fields")
                
                # Show some key fields
                if results_section:
                    print(f"   📋 Results keys: {', '.join(list(results_section.keys())[:5])}...")
                if economy_section:
                    print(f"   📋 Economy keys: {', '.join(list(economy_section.keys())[:5])}...")
                
                print(f"   ✅ PASS: Solar pumping calculations working")
                results.append(("POST /api/solar-pumping", True, "Results and Economy sections present"))
        else:
            print(f"   ❌ FAIL: Status {response.status_code}")
            print(f"   📄 Response: {response.text[:200]}...")
            results.append(("POST /api/solar-pumping", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"   ❌ FAIL: Error {str(e)}")
        results.append(("POST /api/solar-pumping", False, f"Error: {str(e)}"))
    
    # Summary
    print("\n" + "=" * 50)
    print("🎯 ECO PUMP EXPERT TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, success, _ in results if success)
    total = len(results)
    
    for test_name, success, details in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {details}")
    
    print(f"\n📊 Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 ALL ECO PUMP EXPERT ENDPOINTS WORKING!")
        print("✅ Frontend can now populate combos and display results in Expert Solaire")
        return True
    else:
        print("⚠️ Some endpoints need attention")
        return False

if __name__ == "__main__":
    success = test_eco_pump_expert()
    sys.exit(0 if success else 1)