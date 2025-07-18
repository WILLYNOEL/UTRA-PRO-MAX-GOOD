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
# PIPE MATERIALS AND FITTINGS DATABASE
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
        "name": "Eau",
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
        "name": "Huile Hydraulique",
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
        "name": "Solution Acide",
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
        "name": "Éthylène Glycol",
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

class NPSHdCalculationInput(BaseModel):
    suction_type: str = "flooded"  # "flooded" or "suction_lift"
    hasp: float  # m (suction height - positive = flooded / negative = suction lift)
    flow_rate: float  # m³/h
    fluid_type: str
    temperature: float = 20  # °C
    pipe_diameter: float  # mm
    pipe_material: str
    pipe_length: float  # m (suction side)
    suction_fittings: List[FittingInput] = []

class HMTCalculationInput(BaseModel):
    installation_type: str = "surface"  # "surface" or "submersible"
    suction_type: str = "flooded"  # "flooded" or "suction_lift" (only for surface installation)
    hasp: float  # m (suction height - only for surface installation)
    discharge_height: float  # m
    useful_pressure: float = 0  # bar (required delivery pressure)
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
    calculated_npshd: float  # m (from Tab 1)
    fluid_type: str
    pipe_material: str
    pump_efficiency: float  # %
    motor_efficiency: float  # %
    absorbed_power: Optional[float] = None  # kW (P1)
    hydraulic_power: Optional[float] = None  # kW (P2)
    starting_method: str = "star_delta"  # or "direct_on_line"
    power_factor: float = 0.8  # cos φ
    cable_length: float  # m
    cable_material: str = "copper"  # or "aluminum"
    cable_section: Optional[float] = None  # mm²
    voltage: int = 400  # V

class NPSHdResult(BaseModel):
    input_data: NPSHdCalculationInput
    fluid_properties: FluidProperties
    atmospheric_pressure: float  # Pa (constant at sea level)
    velocity: float  # m/s
    reynolds_number: float
    friction_factor: float
    linear_head_loss: float  # m
    singular_head_loss: float  # m
    total_head_loss: float  # m
    npshd: float  # m
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
    useful_pressure_head: float  # m
    hmt: float  # m
    warnings: List[str]

class PerformanceAnalysisResult(BaseModel):
    input_data: PerformanceAnalysisInput
    npsh_comparison: Dict[str, float]  # npshd vs required_npsh
    cavitation_risk: bool
    pump_efficiency: float  # %
    motor_efficiency: float  # %
    overall_efficiency: float  # %
    nominal_current: float  # A
    starting_current: float  # A
    recommended_cable_section: float  # mm²
    power_calculations: Dict[str, float]
    electrical_data: Dict[str, Any]
    performance_curves: Dict[str, List[float]]  # Flow points and corresponding values
    recommendations: List[str]
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
# ENHANCED HYDRAULIC CALCULATION FUNCTIONS
# ============================================================================

def calculate_atmospheric_pressure(altitude: float) -> float:
    """Calculate atmospheric pressure based on altitude (m)"""
    # Barometric formula: P = P0 * (1 - 0.0065 * h / 288.15)^5.255
    P0 = 101325  # Pa at sea level
    return P0 * (1 - 0.0065 * altitude / 288.15) ** 5.255

def calculate_singular_head_loss(velocity: float, fittings: List[FittingInput]) -> float:
    """Calculate singular head losses from fittings"""
    total_k = 0
    for fitting in fittings:
        if fitting.fitting_type in FITTING_COEFFICIENTS:
            k_value = FITTING_COEFFICIENTS[fitting.fitting_type]["k"]
            total_k += k_value * fitting.quantity
    
    return total_k * (velocity**2) / (2 * 9.81)  # Head loss in meters

def calculate_linear_head_loss_enhanced(velocity: float, pipe_length: float, 
                                      pipe_diameter: float, pipe_material: str,
                                      reynolds_number: float) -> float:
    """Enhanced linear head loss calculation using pipe material roughness"""
    if pipe_material not in PIPE_MATERIALS:
        roughness = 0.045  # Default steel roughness
    else:
        roughness = PIPE_MATERIALS[pipe_material]["roughness"]
    
    diameter_m = pipe_diameter / 1000  # Convert mm to m
    relative_roughness = roughness / pipe_diameter  # Relative roughness
    
    # Calculate friction factor using Colebrook-White equation (Swamee-Jain approximation)
    if reynolds_number < 2300:
        # Laminar flow
        friction_factor = 64 / reynolds_number
    else:
        # Turbulent flow
        term1 = (relative_roughness / 3.7) ** 1.11
        term2 = 6.9 / reynolds_number
        friction_factor = 0.25 / (math.log10(term1 + term2) ** 2)
    
    # Darcy-Weisbach equation for head loss
    return friction_factor * (pipe_length / diameter_m) * (velocity**2) / (2 * 9.81)

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

def calculate_npshd_enhanced(input_data: NPSHdCalculationInput) -> NPSHdResult:
    """Enhanced NPSHd calculation with corrected formulas based on suction type"""
    warnings = []
    
    # Atmospheric pressure constant at sea level
    atmospheric_pressure = 101325  # Pa
    
    # Get fluid properties
    fluid_props = get_fluid_properties(input_data.fluid_type, input_data.temperature)
    
    # Calculate velocity
    pipe_area = math.pi * (input_data.pipe_diameter / 1000 / 2) ** 2
    velocity = (input_data.flow_rate / 3600) / pipe_area
    
    # Reynolds number
    reynolds_number = calculate_reynolds_number(
        velocity, input_data.pipe_diameter / 1000, 
        fluid_props.density, fluid_props.viscosity
    )
    
    # Calculate friction factor
    friction_factor = calculate_friction_factor(reynolds_number)
    
    # Linear head loss
    linear_head_loss = calculate_linear_head_loss_enhanced(
        velocity, input_data.pipe_length, input_data.pipe_diameter,
        input_data.pipe_material, reynolds_number
    )
    
    # Singular head loss
    singular_head_loss = calculate_singular_head_loss(velocity, input_data.suction_fittings)
    
    # Total head loss
    total_head_loss = linear_head_loss + singular_head_loss
    
    # Calculate NPSHd using the corrected formulas based on suction type
    # Convert atmospheric pressure to meters of fluid column
    patm_head = atmospheric_pressure / (fluid_props.density * 9.81)
    
    # Convert vapor pressure to meters of fluid column
    vapor_pressure_head = fluid_props.vapor_pressure / (fluid_props.density * 9.81)
    
    # Calculate NPSHd according to the corrected formulas
    if input_data.suction_type == "flooded":
        # En charge: NPSHd = Patm + ρ*g*H_aspiration - Pertes de charges totales - Pression de vapeur saturante
        npshd = patm_head + abs(input_data.hasp) - total_head_loss - vapor_pressure_head
    else:  # suction_lift
        # En aspiration: NPSHd = Patm - ρ*g*H_aspiration - Pertes de charges totales - Pression de vapeur saturante
        npshd = patm_head - abs(input_data.hasp) - total_head_loss - vapor_pressure_head
    
    # Enhanced warnings and alerts
    if velocity > 3.0:
        warnings.append(f"Vitesse élevée ({velocity:.2f} m/s) - RECOMMANDATION: Augmenter le diamètre de la tuyauterie")
    if velocity < 0.5:
        warnings.append(f"Vitesse faible ({velocity:.2f} m/s) - risque de sédimentation")
    if velocity > 2.5:
        warnings.append("ALERTE: Vitesse excessive - augmenter le diamètre de la tuyauterie pour réduire les pertes de charge")
    
    if npshd < 0:
        warnings.append("ATTENTION: NPSHd négatif - conditions d'aspiration impossibles")
        warnings.append("RECOMMANDATION: Réduire la hauteur d'aspiration et/ou la longueur de tuyauterie")
    if npshd < 2:
        warnings.append("ATTENTION: NPSHd très faible - risque de cavitation élevé")
        warnings.append("RECOMMANDATION: Vérifier le clapet anti-retour et réduire les pertes de charge")
    
    if total_head_loss > 3:
        warnings.append(f"Pertes de charge élevées ({total_head_loss:.2f} m) - RECOMMANDATION: Augmenter le diamètre ou réduire la longueur")
    
    if input_data.hasp > 6 and input_data.suction_type == "suction_lift":
        warnings.append("ALERTE: Hauteur d'aspiration excessive - réduire la hauteur d'aspiration")
    
    if input_data.pipe_length > 100:
        warnings.append("ALERTE: Longueur de tuyauterie excessive - réduire la longueur pour diminuer les pertes de charge")
    
    # Temperature and material alerts
    if input_data.temperature > 60:
        material_warnings = {
            "pvc": "ALERTE MATÉRIAU: PVC non recommandé au-dessus de 60°C - utiliser PEHD ou acier",
            "pehd": "ATTENTION: PEHD près de sa limite de température - vérifier la résistance",
            "steel": "Matériau acier adapté aux hautes températures",
            "steel_galvanized": "Matériau acier galvanisé adapté aux hautes températures",
            "cast_iron": "Matériau fonte adapté aux hautes températures",
            "concrete": "Matériau béton adapté aux hautes températures"
        }
        if input_data.pipe_material in material_warnings:
            warnings.append(material_warnings[input_data.pipe_material])
    
    if input_data.temperature > 80:
        warnings.append("ALERTE TEMPÉRATURE: Température très élevée - vérifier la compatibilité de tous les matériaux")
    
    # Check valve alerts
    has_check_valve = any(fitting.fitting_type == "check_valve" for fitting in input_data.suction_fittings)
    if input_data.suction_type == "suction_lift" and not has_check_valve:
        warnings.append("RECOMMANDATION: Ajouter un clapet anti-retour pour l'aspiration en dépression")
    
    # Fitting-specific alerts
    total_fittings = sum(fitting.quantity for fitting in input_data.suction_fittings)
    if total_fittings > 5:
        warnings.append("ALERTE: Nombre excessif de raccords - réduire les raccords pour diminuer les pertes de charge")
    
    return NPSHdResult(
        input_data=input_data,
        fluid_properties=fluid_props,
        atmospheric_pressure=atmospheric_pressure,
        velocity=velocity,
        reynolds_number=reynolds_number,
        friction_factor=friction_factor,
        linear_head_loss=linear_head_loss,
        singular_head_loss=singular_head_loss,
        total_head_loss=total_head_loss,
        npshd=npshd,
        warnings=warnings
    )

def calculate_hmt_enhanced(input_data: HMTCalculationInput) -> HMTResult:
    """Enhanced HMT calculation for Tab 2"""
    warnings = []
    
    # Get fluid properties
    fluid_props = get_fluid_properties(input_data.fluid_type, input_data.temperature)
    
    # Calculate velocities
    suction_area = math.pi * (input_data.suction_pipe_diameter / 1000 / 2) ** 2
    discharge_area = math.pi * (input_data.discharge_pipe_diameter / 1000 / 2) ** 2
    
    suction_velocity = (input_data.flow_rate / 3600) / suction_area
    discharge_velocity = (input_data.flow_rate / 3600) / discharge_area
    
    # Calculate Reynolds numbers
    suction_reynolds = calculate_reynolds_number(
        suction_velocity, input_data.suction_pipe_diameter / 1000,
        fluid_props.density, fluid_props.viscosity
    )
    discharge_reynolds = calculate_reynolds_number(
        discharge_velocity, input_data.discharge_pipe_diameter / 1000,
        fluid_props.density, fluid_props.viscosity
    )
    
    # Calculate head losses
    if input_data.installation_type == "surface":
        suction_linear_loss = calculate_linear_head_loss_enhanced(
            suction_velocity, input_data.suction_pipe_length, 
            input_data.suction_pipe_diameter, input_data.suction_pipe_material,
            suction_reynolds
        )
        suction_singular_loss = calculate_singular_head_loss(suction_velocity, input_data.suction_fittings)
        suction_head_loss = suction_linear_loss + suction_singular_loss
    else:  # submersible
        suction_head_loss = 0
    
    discharge_linear_loss = calculate_linear_head_loss_enhanced(
        discharge_velocity, input_data.discharge_pipe_length,
        input_data.discharge_pipe_diameter, input_data.discharge_pipe_material,
        discharge_reynolds
    )
    discharge_singular_loss = calculate_singular_head_loss(discharge_velocity, input_data.discharge_fittings)
    discharge_head_loss = discharge_linear_loss + discharge_singular_loss
    
    # Total head losses
    total_head_loss = suction_head_loss + discharge_head_loss
    
    # Static head
    if input_data.installation_type == "surface":
        static_head = input_data.discharge_height - input_data.hasp
    else:  # submersible
        static_head = input_data.discharge_height
    
    # Useful pressure head
    useful_pressure_head = (input_data.useful_pressure * 100000) / (fluid_props.density * 9.81)  # bar to m
    
    # Total HMT
    hmt = static_head + total_head_loss + useful_pressure_head
    
    # Warnings
    if suction_velocity > 3.0:
        warnings.append(f"Vitesse d'aspiration élevée ({suction_velocity:.2f} m/s)")
    if discharge_velocity > 5.0:
        warnings.append(f"Vitesse de refoulement élevée ({discharge_velocity:.2f} m/s)")
    if hmt > 200:
        warnings.append(f"HMT très élevée ({hmt:.1f} m) - vérifier le dimensionnement")
    if input_data.useful_pressure > 10:
        warnings.append(f"Pression utile élevée ({input_data.useful_pressure} bar)")
    
    return HMTResult(
        input_data=input_data,
        fluid_properties=fluid_props,
        suction_velocity=suction_velocity,
        discharge_velocity=discharge_velocity,
        suction_head_loss=suction_head_loss,
        discharge_head_loss=discharge_head_loss,
        total_head_loss=total_head_loss,
        static_head=static_head,
        useful_pressure_head=useful_pressure_head,
        hmt=hmt,
        warnings=warnings
    )

def generate_performance_curves(input_data: PerformanceAnalysisInput) -> Dict[str, List[float]]:
    """Generate comprehensive performance curves with best operating point"""
    flow_points = []
    hmt_points = []
    efficiency_points = []
    power_points = []
    head_loss_points = []
    
    base_flow = input_data.flow_rate
    base_hmt = input_data.hmt
    base_efficiency = input_data.pump_efficiency
    
    # Calculate base power using the formula
    base_hydraulic_power = (base_flow * base_hmt) / (base_efficiency * 367)
    
    # Find best operating point (usually around 80-90% of max flow)
    best_flow = base_flow * 0.85
    best_efficiency = base_efficiency * 1.05  # Slightly higher at best point
    
    # Generate curve points from 0% to 150% of nominal flow
    for i in range(0, 151, 10):  # 0% to 150% of nominal flow
        flow_ratio = i / 100
        flow = base_flow * flow_ratio
        
        # HMT curve (quadratic curve: HMT = H0 - a*Q - b*Q²)
        h0 = base_hmt * 1.2  # Shut-off head
        a = 0.2 * base_hmt / base_flow if base_flow > 0 else 0
        b = 0.5 * base_hmt / (base_flow**2) if base_flow > 0 else 0
        
        if flow == 0:
            hmt = h0
        else:
            hmt = h0 - a * flow - b * (flow**2)
        
        # Efficiency curve (parabolic with peak around best operating point)
        if flow == 0:
            efficiency = 0
        else:
            # Peak efficiency at best_flow
            efficiency_ratio = flow / best_flow if best_flow > 0 else 0
            efficiency = base_efficiency * (1 - 0.3 * (efficiency_ratio - 1)**2)
            efficiency = max(0, min(100, efficiency))
        
        # Power curve P = (Q * H) / (η * 367)
        if flow == 0:
            power = 0
        else:
            power = (flow * hmt) / (efficiency * 367) if efficiency > 0 else 0
        
        # Head loss curve (increases with flow²)
        head_loss = 0.5 * (flow_ratio**2) * base_hmt * 0.1  # Simplified head loss
        
        flow_points.append(flow)
        hmt_points.append(max(0, hmt))
        efficiency_points.append(max(0, efficiency))
        power_points.append(max(0, power))
        head_loss_points.append(max(0, head_loss))
    
    return {
        "flow": flow_points,
        "hmt": hmt_points,
        "efficiency": efficiency_points,
        "power": power_points,
        "head_loss": head_loss_points,
        "best_operating_point": [
            best_flow,
            h0 - a * best_flow - b * (best_flow**2),
            best_efficiency,
            (best_flow * (h0 - a * best_flow - b * (best_flow**2))) / (best_efficiency * 367)
        ]
    }

def calculate_performance_analysis(input_data: PerformanceAnalysisInput) -> PerformanceAnalysisResult:
    """Performance analysis calculation for Tab 3 with corrected power formulas"""
    warnings = []
    recommendations = []
    
    # NPSH comparison
    npsh_comparison = {
        "npshd_calculated": input_data.calculated_npshd,
        "npsh_required": input_data.required_npsh,
        "safety_margin": input_data.calculated_npshd - input_data.required_npsh
    }
    
    cavitation_risk = input_data.calculated_npshd <= input_data.required_npsh
    
    # Power calculations using the correct formulas
    if input_data.hydraulic_power:
        # Use provided hydraulic power
        hydraulic_power = input_data.hydraulic_power
    else:
        # Calculate hydraulic power using the correct formula:
        # P2 = (débit x HMT) / (rendement pompe x 367)
        hydraulic_power = (input_data.flow_rate * input_data.hmt) / (input_data.pump_efficiency * 367)
    
    if input_data.absorbed_power:
        # Use provided absorbed power
        absorbed_power = input_data.absorbed_power
        # Calculate actual motor efficiency
        actual_motor_efficiency = (hydraulic_power / absorbed_power) * 100
    else:
        # Calculate absorbed power using the correct formula:
        # P1 = P2 / rendement moteur
        absorbed_power = hydraulic_power / (input_data.motor_efficiency / 100)
        actual_motor_efficiency = input_data.motor_efficiency
    
    # Overall efficiency
    overall_efficiency = (hydraulic_power / absorbed_power) * 100
    
    # Electrical calculations adapted for starting method
    if input_data.voltage == 230:
        # Single phase
        nominal_current = (absorbed_power * 1000) / (input_data.voltage * input_data.power_factor)
        if input_data.starting_method == "direct_on_line":
            starting_current = nominal_current * 7.0
        else:  # star_delta
            starting_current = nominal_current * 2.0
    else:
        # Three phase
        nominal_current = (absorbed_power * 1000) / (input_data.voltage * 1.732 * input_data.power_factor)
        if input_data.starting_method == "direct_on_line":
            starting_current = nominal_current * 6.0
        else:  # star_delta
            starting_current = nominal_current * 2.0
    
    # Cable section calculation
    if input_data.cable_section:
        recommended_cable_section = input_data.cable_section
    else:
        # Basic cable sizing
        if input_data.voltage == 230:
            current_density = 6  # A/mm²
        else:
            current_density = 8  # A/mm²
        
        base_section = nominal_current / current_density
        length_factor = 1 + (input_data.cable_length / 100) * 0.2
        required_section = base_section * length_factor
        
        # Round to standard cable sections
        standard_sections = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300]
        recommended_cable_section = next((s for s in standard_sections if s >= required_section), 300)
    
    # Generate performance curves (débit en fonction de HMT)
    performance_curves = generate_performance_curves(input_data)
    
    # Warnings and recommendations
    if cavitation_risk:
        warnings.append("RISQUE DE CAVITATION: NPSHd calculé ≤ NPSH requis")
        recommendations.append("Réduire les pertes de charge à l'aspiration ou augmenter la hauteur d'aspiration")
    
    if overall_efficiency < 60:
        warnings.append(f"Rendement global faible ({overall_efficiency:.1f}%)")
        recommendations.append("Vérifier le dimensionnement de la pompe et du moteur")
    
    if input_data.pump_efficiency < 70:
        warnings.append(f"Rendement pompe faible ({input_data.pump_efficiency:.1f}%)")
        recommendations.append("Considérer une pompe plus efficace")
    
    if input_data.motor_efficiency < 85:
        warnings.append(f"Rendement moteur faible ({input_data.motor_efficiency:.1f}%)")
        recommendations.append("Considérer un moteur plus efficace")
    
    if starting_current > 150:
        warnings.append(f"Courant de démarrage élevé ({starting_current:.1f} A)")
        recommendations.append("Considérer un démarreur progressif ou étoile-triangle")
    
    if absorbed_power > 100:
        warnings.append(f"Puissance absorbée élevée ({absorbed_power:.1f} kW)")
        recommendations.append("Vérifier le dimensionnement du système")
    
    if npsh_comparison["safety_margin"] < 0.5:
        recommendations.append("Augmenter la marge de sécurité NPSH pour éviter la cavitation")
    
    # Power formula verification
    if hydraulic_power > absorbed_power:
        warnings.append("ERREUR: Puissance hydraulique > puissance absorbée - vérifier les valeurs")
    
    return PerformanceAnalysisResult(
        input_data=input_data,
        npsh_comparison=npsh_comparison,
        cavitation_risk=cavitation_risk,
        pump_efficiency=input_data.pump_efficiency,
        motor_efficiency=actual_motor_efficiency,
        overall_efficiency=overall_efficiency,
        nominal_current=nominal_current,
        starting_current=starting_current,
        recommended_cable_section=recommended_cable_section,
        power_calculations={
            "hydraulic_power": hydraulic_power,
            "absorbed_power": absorbed_power,
            "overall_efficiency": overall_efficiency
        },
        electrical_data={
            "voltage": input_data.voltage,
            "power_factor": input_data.power_factor,
            "starting_method": input_data.starting_method,
            "starting_current": starting_current,
            "cable_material": input_data.cable_material
        },
        performance_curves=performance_curves,
        recommendations=recommendations,
        warnings=warnings
    )

# Legacy functions for backward compatibility
def calculate_cable_section(current: float, cable_length: float, voltage: int) -> float:
    """Calculate required cable section"""
    if voltage == 230:
        base_section = current / 6  # A/mm²
    else:  # 400V
        base_section = current / 8  # A/mm²
    
    length_factor = 1 + (cable_length / 100) * 0.2
    required_section = base_section * length_factor
    
    standard_sections = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300]
    for section in standard_sections:
        if section >= required_section:
            return section
    
    return 300

def perform_hydraulic_calculation(input_data: CalculationInput) -> CalculationResult:
    """Legacy hydraulic calculation function"""
    warnings = []
    
    # Get fluid properties
    fluid_props = get_fluid_properties(input_data.fluid_type, input_data.temperature)
    
    # Convert units
    flow_rate_m3s = input_data.flow_rate / 3600
    pipe_diameter_m = input_data.pipe_diameter / 1000
    pipe_area = math.pi * (pipe_diameter_m / 2) ** 2
    
    # Calculate flow velocity
    flow_velocity = flow_rate_m3s / pipe_area
    
    # Calculate Reynolds number
    reynolds_number = calculate_reynolds_number(
        flow_velocity, pipe_diameter_m, fluid_props.density, fluid_props.viscosity
    )
    
    # Calculate friction factor
    friction_factor = calculate_friction_factor(reynolds_number)
    
    # Calculate pressure losses
    linear_pressure_loss = friction_factor * (input_data.pipe_length / pipe_diameter_m) * (fluid_props.density * flow_velocity**2 / 2)
    total_pressure_loss = linear_pressure_loss * 1.2
    
    # Calculate HMT
    static_head = input_data.suction_height if input_data.suction_height > 0 else 0
    pressure_head = total_pressure_loss / (fluid_props.density * 9.81)
    hmt_meters = static_head + pressure_head
    hmt_bar = hmt_meters * fluid_props.density * 9.81 / 100000
    
    # Calculate NPSH
    npsh_required = 2.0 + (input_data.flow_rate / 100) ** 0.8
    npsh_available_calc = 10.3 - abs(input_data.suction_height) - (total_pressure_loss / (fluid_props.density * 9.81))
    cavitation_risk = npsh_available_calc <= npsh_required
    
    # Calculate power
    hydraulic_power = (flow_rate_m3s * hmt_meters * fluid_props.density * 9.81) / 1000
    total_efficiency = (input_data.pump_efficiency * input_data.motor_efficiency) / 10000
    absorbed_power = hydraulic_power / total_efficiency
    
    # Calculate electrical parameters
    if input_data.voltage == 230:
        nominal_current = (absorbed_power * 1000) / (input_data.voltage * 0.8)
    else:
        nominal_current = (absorbed_power * 1000) / (input_data.voltage * 1.732 * 0.8)
    
    cable_section = calculate_cable_section(nominal_current, input_data.cable_length, input_data.voltage)
    starting_method = "Direct start" if absorbed_power < 3 else "Star-delta"
    
    if cavitation_risk:
        warnings.append("RISQUE DE CAVITATION: NPSHd ≤ NPSHr")
    
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
# ENHANCED API ENDPOINTS FOR THREE TABS
# ============================================================================

@api_router.get("/")
async def root():
    return {"message": "API de Calcul Hydraulique pour Pompes Centrifuges"}

@api_router.get("/fluids")
async def get_available_fluids():
    """Obtenir la liste des fluides disponibles"""
    return {
        "fluids": [
            {"id": key, "name": value["name"]} 
            for key, value in FLUID_PROPERTIES.items()
        ]
    }

@api_router.get("/pipe-materials")
async def get_pipe_materials():
    """Obtenir la liste des matériaux de tuyauterie"""
    return {
        "materials": [
            {"id": key, "name": value["name"], "description": value["description"]}
            for key, value in PIPE_MATERIALS.items()
        ]
    }

@api_router.get("/fittings")
async def get_fittings():
    """Obtenir la liste des raccords disponibles"""
    return {
        "fittings": [
            {"id": key, "name": value["name"], "k_coefficient": value["k"]}
            for key, value in FITTING_COEFFICIENTS.items()
        ]
    }

@api_router.post("/calculate-npshd")
async def calculate_npshd_endpoint(input_data: NPSHdCalculationInput):
    """Calcul NPSHd - Onglet 1"""
    try:
        result = calculate_npshd_enhanced(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/calculate-hmt")
async def calculate_hmt_endpoint(input_data: HMTCalculationInput):
    """Calcul HMT - Onglet 2"""
    try:
        result = calculate_hmt_enhanced(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/calculate-performance")
async def calculate_performance_endpoint(input_data: PerformanceAnalysisInput):
    """Analyse de performance - Onglet 3"""
    try:
        result = calculate_performance_analysis(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Legacy endpoint for backward compatibility
@api_router.post("/calculate")
async def calculate_pump_performance(input_data: CalculationInput):
    """Calcul de performance de pompe (compatibilité ancienne version)"""
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