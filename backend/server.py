from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============================================================================
# FLUID PROPERTIES DATABASE
# ============================================================================

PIPE_MATERIALS = {
    "pvc": {
        "name": "PVC",
        "roughness": 0.0015,  # mm
        "description": "Polychlorure de vinyle"
    },
    "pehd": {
        "name": "PEHD",
        "roughness": 0.007,  # mm
        "description": "Polyéthylène haute densité"
    },
    "steel": {
        "name": "Acier",
        "roughness": 0.045,  # mm
        "description": "Acier commercial"
    },
    "steel_galvanized": {
        "name": "Acier galvanisé",
        "roughness": 0.15,  # mm
        "description": "Acier galvanisé"
    },
    "cast_iron": {
        "name": "Fonte",
        "roughness": 0.25,  # mm
        "description": "Fonte"
    },
    "concrete": {
        "name": "Béton",
        "roughness": 0.3,  # mm
        "description": "Béton lissé"
    }
}

FITTING_COEFFICIENTS = {
    "elbow_90": {"name": "Coude 90°", "k": 0.9},
    "elbow_45": {"name": "Coude 45°", "k": 0.4},
    "tee_through": {"name": "Té passage direct", "k": 0.6},
    "tee_branch": {"name": "Té dérivation", "k": 1.8},
    "gate_valve_open": {"name": "Vanne guillotine ouverte", "k": 0.15},
    "gate_valve_half": {"name": "Vanne guillotine mi-ouverte", "k": 5.6},
    "ball_valve": {"name": "Vanne à boule", "k": 0.05},
    "check_valve": {"name": "Clapet anti-retour", "k": 2.0},
    "reducer": {"name": "Réducteur", "k": 0.5},
    "enlarger": {"name": "Élargisseur", "k": 1.0},
    "entrance_sharp": {"name": "Entrée vive", "k": 0.5},
    "entrance_smooth": {"name": "Entrée arrondie", "k": 0.1},
    "exit": {"name": "Sortie", "k": 1.0}
}

FLUID_PROPERTIES = {
    "water": {
        "name": "Water",
        "density_20c": 1000,  # kg/m³
        "viscosity_20c": 0.001,  # Pa·s
        "vapor_pressure_20c": 2340,  # Pa
        "temp_coeffs": {
            "density": -0.2,  # kg/m³/°C
            "viscosity": -0.00005,  # Pa·s/°C
            "vapor_pressure": 100  # Pa/°C
        }
    },
    "oil": {
        "name": "Hydraulic Oil",
        "density_20c": 850,
        "viscosity_20c": 0.05,
        "vapor_pressure_20c": 100,
        "temp_coeffs": {
            "density": -0.7,
            "viscosity": -0.002,
            "vapor_pressure": 20
        }
    },
    "acid": {
        "name": "Acid Solution",
        "density_20c": 1200,
        "viscosity_20c": 0.002,
        "vapor_pressure_20c": 3000,
        "temp_coeffs": {
            "density": -0.3,
            "viscosity": -0.0001,
            "vapor_pressure": 150
        }
    },
    "glycol": {
        "name": "Ethylene Glycol",
        "density_20c": 1113,
        "viscosity_20c": 0.0161,
        "vapor_pressure_20c": 10,
        "temp_coeffs": {
            "density": -0.8,
            "viscosity": -0.0008,
            "vapor_pressure": 5
        }
    }
}

# ============================================================================
# ENHANCED PYDANTIC MODELS FOR THREE TABS
# ============================================================================

class FluidProperties(BaseModel):
    name: str
    density: float  # kg/m³
    viscosity: float  # Pa·s
    vapor_pressure: float  # Pa

class FittingInput(BaseModel):
    fitting_type: str
    quantity: int = 1

class NPSHrCalculationInput(BaseModel):
    patm: float = 101325  # Pa (atmospheric pressure)
    hasp: float  # m (suction height - positive = flooded / negative = suction lift)
    flow_rate: float  # m³/h
    fluid_type: str
    temperature: float = 20  # °C
    pipe_diameter: float  # mm
    pipe_material: str
    pipe_length: float  # m (suction side)
    suction_fittings: List[FittingInput] = []

class HMTCalculationInput(BaseModel):
    hasp: float  # m (suction height)
    discharge_height: float  # m
    suction_pipe_diameter: float  # mm
    discharge_pipe_diameter: float  # mm
    suction_pipe_length: float  # m
    discharge_pipe_length: float  # m
    suction_pipe_material: str
    discharge_pipe_material: str
    suction_fittings: List[FittingInput] = []
    discharge_fittings: List[FittingInput] = []
    fluid_type: str
    temperature: float = 20  # °C
    flow_rate: float  # m³/h

class PerformanceAnalysisInput(BaseModel):
    flow_rate: float  # m³/h
    hmt: float  # m
    pipe_diameter: float  # mm
    required_npsh: float  # m (from pump datasheet)
    calculated_npshr: float  # m (from Tab 1)
    fluid_type: str
    pipe_material: str
    pump_efficiency: float  # %
    absorbed_power: Optional[float] = None  # kW (P1)
    hydraulic_power: Optional[float] = None  # kW (P2)
    starting_method: str = "star_delta"  # or "direct_on_line"
    power_factor: float = 0.8  # cos φ
    cable_length: float  # m
    cable_material: str = "copper"  # or "aluminum"
    cable_section: Optional[float] = None  # mm²
    voltage: int = 400  # V

class NPSHrResult(BaseModel):
    input_data: NPSHrCalculationInput
    fluid_properties: FluidProperties
    velocity: float  # m/s
    reynolds_number: float
    friction_factor: float
    linear_head_loss: float  # m
    singular_head_loss: float  # m
    total_head_loss: float  # m
    npshr: float  # m
    warnings: List[str]

class HMTResult(BaseModel):
    input_data: HMTCalculationInput
    fluid_properties: FluidProperties
    suction_velocity: float  # m/s
    discharge_velocity: float  # m/s
    suction_head_loss: float  # m
    discharge_head_loss: float  # m
    total_head_loss: float  # m
    static_head: float  # m
    hmt: float  # m
    warnings: List[str]

class PerformanceAnalysisResult(BaseModel):
    input_data: PerformanceAnalysisInput
    npsh_comparison: Dict[str, float]  # npshr vs required_npsh
    cavitation_risk: bool
    overall_efficiency: float  # %
    nominal_current: float  # A
    recommended_cable_section: float  # mm²
    power_calculations: Dict[str, float]
    electrical_data: Dict[str, Any]
    warnings: List[str]

# Legacy models for backward compatibility
class CalculationInput(BaseModel):
    flow_rate: float  # m³/h
    suction_height: float  # m (positive for suction, negative for flooded)
    pipe_diameter: float  # mm
    pipe_length: float  # m
    fluid_type: str
    temperature: float = 20  # °C
    npsh_available: Optional[float] = None  # m
    pump_efficiency: float = 75  # %
    motor_efficiency: float = 90  # %
    voltage: int = 400  # V (230 or 400)
    cable_length: float = 50  # m

class CalculationResult(BaseModel):
    # Input parameters
    input_data: CalculationInput
    
    # Fluid properties
    fluid_properties: FluidProperties
    
    # Flow calculations
    flow_velocity: float  # m/s
    reynolds_number: float
    friction_factor: float
    
    # Pressure calculations
    linear_pressure_loss: float  # Pa
    total_pressure_loss: float  # Pa
    hmt_meters: float  # m
    hmt_bar: float  # bar
    
    # NPSH calculations
    npsh_required: float  # m
    npsh_available_calc: float  # m
    cavitation_risk: bool
    
    # Power calculations
    hydraulic_power: float  # kW
    absorbed_power: float  # kW
    total_efficiency: float  # %
    
    # Electrical calculations
    nominal_current: float  # A
    cable_section: float  # mm²
    starting_method: str
    
    # Warnings and alerts
    warnings: List[str]

class PumpHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_name: str
    calculation_result: CalculationResult
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PumpHistoryCreate(BaseModel):
    project_name: str
    calculation_result: CalculationResult

# ============================================================================
# HYDRAULIC CALCULATION FUNCTIONS
# ============================================================================

def get_fluid_properties(fluid_type: str, temperature: float) -> FluidProperties:
    """Calculate temperature-dependent fluid properties"""
    if fluid_type not in FLUID_PROPERTIES:
        raise ValueError(f"Unknown fluid type: {fluid_type}")
    
    base_props = FLUID_PROPERTIES[fluid_type]
    temp_diff = temperature - 20
    
    # Calculate temperature-adjusted properties
    density = base_props["density_20c"] + (base_props["temp_coeffs"]["density"] * temp_diff)
    viscosity = base_props["viscosity_20c"] + (base_props["temp_coeffs"]["viscosity"] * temp_diff)
    vapor_pressure = base_props["vapor_pressure_20c"] + (base_props["temp_coeffs"]["vapor_pressure"] * temp_diff)
    
    # Ensure minimum values
    density = max(density, 500)
    viscosity = max(viscosity, 0.0001)
    vapor_pressure = max(vapor_pressure, 0)
    
    return FluidProperties(
        name=base_props["name"],
        density=density,
        viscosity=viscosity,
        vapor_pressure=vapor_pressure
    )

def calculate_reynolds_number(velocity: float, diameter: float, density: float, viscosity: float) -> float:
    """Calculate Reynolds number"""
    return (density * velocity * diameter) / viscosity

def calculate_friction_factor(reynolds_number: float, roughness: float = 0.000045) -> float:
    """Calculate friction factor using Colebrook-White equation (approximation)"""
    if reynolds_number < 2300:
        # Laminar flow
        return 64 / reynolds_number
    else:
        # Turbulent flow - Swamee-Jain approximation
        relative_roughness = roughness / 1000  # Assume 1m diameter for relative roughness
        term1 = (roughness / 3.7) ** 1.11
        term2 = 6.9 / reynolds_number
        return 0.25 / (math.log10(term1 + term2) ** 2)

def calculate_pressure_loss(velocity: float, pipe_length: float, pipe_diameter: float, 
                          friction_factor: float, density: float) -> float:
    """Calculate pressure loss using Darcy-Weisbach equation"""
    diameter_m = pipe_diameter / 1000  # Convert mm to m
    return friction_factor * (pipe_length / diameter_m) * (density * velocity**2 / 2)

def calculate_npsh_required(flow_rate: float, suction_height: float) -> float:
    """Calculate NPSH required (simplified model)"""
    # Simplified NPSH calculation based on flow rate and suction conditions
    flow_factor = (flow_rate / 100) ** 0.8  # Scaling factor
    base_npsh = 2.0 + flow_factor  # Base NPSH requirement
    
    # Add safety margin for suction conditions
    if suction_height > 0:
        base_npsh += suction_height * 0.1
    
    return base_npsh

def calculate_npsh_available(suction_height: float, atmospheric_pressure: float, 
                           vapor_pressure: float, suction_losses: float, density: float) -> float:
    """Calculate NPSH available"""
    # Convert pressures to meters of fluid column
    atm_pressure_m = atmospheric_pressure / (density * 9.81)
    vapor_pressure_m = vapor_pressure / (density * 9.81)
    suction_losses_m = suction_losses / (density * 9.81)
    
    return atm_pressure_m - vapor_pressure_m - abs(suction_height) - suction_losses_m

def calculate_cable_section(current: float, cable_length: float, voltage: int) -> float:
    """Calculate required cable section"""
    # Simplified cable sizing based on current density and voltage drop
    if voltage == 230:
        # Single phase - higher current density needed
        base_section = current / 6  # A/mm²
    else:  # 400V
        # Three phase - lower current density
        base_section = current / 8  # A/mm²
    
    # Add correction for cable length (voltage drop consideration)
    length_factor = 1 + (cable_length / 100) * 0.2
    required_section = base_section * length_factor
    
    # Round to standard cable sections
    standard_sections = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300]
    for section in standard_sections:
        if section >= required_section:
            return section
    
    return 300  # Maximum standard section

def determine_starting_method(power: float, voltage: int) -> str:
    """Determine motor starting method based on power"""
    if voltage == 230:
        return "Direct start" if power < 3 else "Soft starter"
    else:  # 400V
        if power < 5:
            return "Direct start"
        elif power < 15:
            return "Star-delta"
        else:
            return "Soft starter"

# ============================================================================
# MAIN CALCULATION FUNCTION
# ============================================================================

def perform_hydraulic_calculation(input_data: CalculationInput) -> CalculationResult:
    """Main hydraulic calculation function"""
    warnings = []
    
    # Get fluid properties
    fluid_props = get_fluid_properties(input_data.fluid_type, input_data.temperature)
    
    # Convert units
    flow_rate_m3s = input_data.flow_rate / 3600  # m³/h to m³/s
    pipe_diameter_m = input_data.pipe_diameter / 1000  # mm to m
    pipe_area = math.pi * (pipe_diameter_m / 2) ** 2  # m²
    
    # Calculate flow velocity
    flow_velocity = flow_rate_m3s / pipe_area  # m/s
    
    # Check velocity limits
    if flow_velocity > 3.0:
        warnings.append(f"High velocity ({flow_velocity:.2f} m/s) may cause excessive wear")
    elif flow_velocity < 0.5:
        warnings.append(f"Low velocity ({flow_velocity:.2f} m/s) may cause settling")
    
    # Calculate Reynolds number
    reynolds_number = calculate_reynolds_number(
        flow_velocity, pipe_diameter_m, fluid_props.density, fluid_props.viscosity
    )
    
    # Calculate friction factor
    friction_factor = calculate_friction_factor(reynolds_number)
    
    # Calculate pressure losses
    linear_pressure_loss = calculate_pressure_loss(
        flow_velocity, input_data.pipe_length, input_data.pipe_diameter,
        friction_factor, fluid_props.density
    )
    
    # Add fitting losses (estimate 20% of linear losses)
    total_pressure_loss = linear_pressure_loss * 1.2
    
    # Calculate HMT (Total Manometric Head)
    static_head = input_data.suction_height if input_data.suction_height > 0 else 0
    pressure_head = total_pressure_loss / (fluid_props.density * 9.81)
    hmt_meters = static_head + pressure_head
    hmt_bar = hmt_meters * fluid_props.density * 9.81 / 100000
    
    # Calculate NPSH
    npsh_required = calculate_npsh_required(input_data.flow_rate, input_data.suction_height)
    
    if input_data.npsh_available:
        npsh_available_calc = input_data.npsh_available
    else:
        npsh_available_calc = calculate_npsh_available(
            input_data.suction_height, 101325, fluid_props.vapor_pressure,
            total_pressure_loss * 0.1, fluid_props.density
        )
    
    cavitation_risk = npsh_available_calc <= npsh_required
    if cavitation_risk:
        warnings.append("CAVITATION RISK: NPSHd ≤ NPSHr - Check suction conditions!")
    
    # Calculate power
    hydraulic_power = (flow_rate_m3s * hmt_meters * fluid_props.density * 9.81) / 1000  # kW
    total_efficiency = (input_data.pump_efficiency * input_data.motor_efficiency) / 10000
    absorbed_power = hydraulic_power / total_efficiency
    
    # Calculate electrical parameters
    if input_data.voltage == 230:
        nominal_current = (absorbed_power * 1000) / (input_data.voltage * 0.8)  # Single phase
    else:  # 400V
        nominal_current = (absorbed_power * 1000) / (input_data.voltage * 1.732 * 0.8)  # Three phase
    
    cable_section = calculate_cable_section(nominal_current, input_data.cable_length, input_data.voltage)
    starting_method = determine_starting_method(absorbed_power, input_data.voltage)
    
    # Power warnings
    if absorbed_power > 100:
        warnings.append(f"High power consumption ({absorbed_power:.1f} kW) - verify motor sizing")
    
    return CalculationResult(
        input_data=input_data,
        fluid_properties=fluid_props,
        flow_velocity=flow_velocity,
        reynolds_number=reynolds_number,
        friction_factor=friction_factor,
        linear_pressure_loss=linear_pressure_loss,
        total_pressure_loss=total_pressure_loss,
        hmt_meters=hmt_meters,
        hmt_bar=hmt_bar,
        npsh_required=npsh_required,
        npsh_available_calc=npsh_available_calc,
        cavitation_risk=cavitation_risk,
        hydraulic_power=hydraulic_power,
        absorbed_power=absorbed_power,
        total_efficiency=total_efficiency * 100,
        nominal_current=nominal_current,
        cable_section=cable_section,
        starting_method=starting_method,
        warnings=warnings
    )

# ============================================================================
# API ENDPOINTS
# ============================================================================

@api_router.get("/")
async def root():
    return {"message": "Hydraulic Pump Calculation API"}

@api_router.get("/fluids")
async def get_available_fluids():
    """Get list of available fluids"""
    return {
        "fluids": [
            {"id": key, "name": value["name"]} 
            for key, value in FLUID_PROPERTIES.items()
        ]
    }

@api_router.post("/calculate")
async def calculate_pump_performance(input_data: CalculationInput):
    """Perform hydraulic calculations"""
    try:
        result = perform_hydraulic_calculation(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/save-calculation", response_model=PumpHistory)
async def save_calculation(input_data: PumpHistoryCreate):
    """Save calculation to history"""
    history_obj = PumpHistory(**input_data.dict())
    await db.pump_history.insert_one(history_obj.dict())
    return history_obj

@api_router.get("/history", response_model=List[PumpHistory])
async def get_calculation_history():
    """Get calculation history"""
    history = await db.pump_history.find().sort("timestamp", -1).to_list(100)
    return [PumpHistory(**item) for item in history]

@api_router.delete("/history/{history_id}")
async def delete_calculation(history_id: str):
    """Delete calculation from history"""
    result = await db.pump_history.delete_one({"id": history_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Calculation not found")
    return {"message": "Calculation deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()