import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import Chart from 'chart.js/auto';
import * as THREE from 'three';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ==============================
// COMPOSANTS UI PROFESSIONNELS
// ==============================

// Composant Label Professionnel avec étoile rouge pour champs obligatoires
const ProfessionalLabel = ({ children, required = false, className = "" }) => (
  <label className={`block text-sm font-semibold text-gray-800 mb-2 leading-tight ${className}`}>
    {children}
    {required && <span className="text-red-500 ml-1 font-bold">*</span>}
  </label>
);

// Composant Input Professionnel avec styles unifiés
const ProfessionalInput = ({ 
  type = "text", 
  value, 
  onChange, 
  placeholder = "", 
  required = false,
  className = "",
  ...props 
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    required={required}
    className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                transition-all duration-200 text-gray-800 font-medium
                placeholder-gray-400 shadow-sm hover:border-gray-300
                ${required ? 'border-red-200 focus:border-red-500 focus:ring-red-100' : ''}
                ${className}`}
    {...props}
  />
);

// Composant Select Professionnel
const ProfessionalSelect = ({ 
  value, 
  onChange, 
  children, 
  required = false,
  className = "",
  ...props 
}) => (
  <select
    value={value}
    onChange={onChange}
    required={required}
    className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                transition-all duration-200 text-gray-800 font-medium
                bg-white shadow-sm hover:border-gray-300 cursor-pointer
                ${required ? 'border-red-200 focus:border-red-500 focus:ring-red-100' : ''}
                ${className}`}
    {...props}
  >
    {children}
  </select>
);

// Composant Section Professionnelle avec titre
const ProfessionalSection = ({ title, icon = "", children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden ${className}`}>
    {title && (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          {icon && <span className="mr-3 text-xl">{icon}</span>}
          {title}
        </h3>
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

// Composant Grid Professionnel responsive
const ProfessionalGrid = ({ children, cols = 2, className = "" }) => (
  <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-6 ${className}`}>
    {children}
  </div>
);

// Styles CSS supplémentaires (à ajouter dans un style tag ou CSS file)
const professionalStyles = {
  fontFamily: "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
  letterSpacing: '-0.025em'
};

// Component pour Onglet AUDIT - Analyses Hydraulique et Énergétique Avancées
const AuditSystem = () => {
  const [activeAuditTab, setActiveAuditTab] = useState('hydraulic');
  
  // États pour les sections déroulantes
  const [expandedSections, setExpandedSections] = useState({
    planning_maintenance: false,
    actions_preventives: false,
    modifications_equipements: true, // Ouvert par défaut
    analysis_technique: true, // Ouvert par défaut
    diagnostic_mecanique: true, // Ouvert par défaut
    actions_immediates: true // Ouvert par défaut
  });

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const [auditData, setAuditData] = useState({
    // ========================================================================================================
    // SECTION 1: DONNÉES INSTALLATION EXISTANTE - TERRAIN
    // ========================================================================================================
    installation_age: '',
    installation_type: 'surface',
    fluid_type: 'water',
    fluid_temperature: '20',
    
    // Matériaux et diamètres (CRITIQUE pour audit)
    suction_material: 'pvc',
    discharge_material: 'pvc', 
    suction_pipe_diameter: '114.3',  // DN100 par défaut
    discharge_pipe_diameter: '88.9',  // DN80 par défaut
    
    // ========================================================================================================
    // SECTION 2: PERFORMANCES HYDRAULIQUES - COMPARAISON ACTUEL vs REQUIS
    // ========================================================================================================
    
    // Débit - CRITIQUE pour audit
    current_flow_rate: '',           // Débit mesuré actuellement (m³/h)
    required_flow_rate: '',          // Débit requis par le process (m³/h)
    original_design_flow: '',        // Débit de conception originale (m³/h)
    
    // HMT - CRITIQUE pour audit 
    current_hmt: '',                 // HMT mesurée actuellement (m)
    required_hmt: '',                // HMT requise par le process (m)
    original_design_hmt: '',         // HMT de conception originale (m)
    
    // Mesures pressions (TERRAIN)
    suction_pressure: '',            // Pression aspiration mesurée (bar)
    discharge_pressure: '',          // Pression refoulement mesurée (bar)
    
    // ========================================================================================================
    // SECTION 3: PERFORMANCES ÉLECTRIQUES - COMPARAISON ACTUEL vs PLAQUE
    // ========================================================================================================
    
    // Intensité - CRITIQUE pour diagnostic
    measured_current: '',            // Intensité mesurée (A)
    rated_current: '',               // Intensité plaque moteur (A)
    
    // Puissance - CRITIQUE pour rendement
    measured_power: '',              // Puissance absorbée mesurée (kW)
    rated_power: '',                 // Puissance plaque moteur (kW)
    
    // Tension et facteur de puissance
    measured_voltage: '',            // Tension mesurée (V)
    rated_voltage: '400',            // Tension nominale (V)
    measured_power_factor: '',       // Cos φ mesuré
    
    // ========================================================================================================
    // SECTION 4: ÉTAT MÉCANIQUE - OBSERVATIONS TERRAIN
    // ========================================================================================================
    
    // Vibrations et bruit (SEUILS NORMATIFS)
    vibration_level: '',             // Vibrations mesurées (mm/s)
    noise_level: '',                 // Bruit mesuré (dB(A))
    
    // Températures critiques
    motor_temperature: '',           // Température moteur (°C)
    bearing_temperature: '',         // Température paliers (°C)
    
    // État visuel (CRITIQUE sécurité)
    leakage_present: false,          // Fuites détectées
    corrosion_level: 'none',         // Niveau corrosion
    alignment_status: 'good',        // État alignement
    coupling_condition: 'good',      // État accouplement
    foundation_status: 'good',       // État fondation
    
    // ========================================================================================================
    // SECTION 5: EXPLOITATION ET MAINTENANCE - HISTORIQUE
    // ========================================================================================================
    
    // Utilisation réelle
    operating_hours_daily: '',       // Heures fonctionnement/jour
    operating_days_yearly: '',       // Jours fonctionnement/an
    
    // Maintenance (PRÉDICTIVE)
    last_maintenance: '',            // Date dernière maintenance
    maintenance_frequency: 'monthly', // Fréquence maintenance
    
    // Problématiques terrain (DIAGNOSTIC)
    reported_issues: [],             // Problèmes signalés
    performance_degradation: false,  // Dégradation performances
    energy_consumption_increase: false, // Augmentation consommation
    
    // ========================================================================================================
    // SECTION 6: CONTEXTE ÉNERGÉTIQUE - COÛTS RÉELS
    // ========================================================================================================
    
    // Tarifs électriques
    electricity_cost_per_kwh: '0.12', // Coût kWh (€)
    
    // Profil d'utilisation
    load_factor: '0.75',             // Facteur de charge
    
    // Équipements de contrôle existants
    has_vfd: false,                  // Variateur présent
    has_soft_starter: false,         // Démarreur progressif
    has_automation: false            // Automatisation présente
  });

  const [auditResults, setAuditResults] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Options pour les dropdowns
  const corrosionLevels = [
    { value: 'none', label: 'Aucune corrosion visible' },
    { value: 'light', label: 'Corrosion légère' },
    { value: 'moderate', label: 'Corrosion modérée' },
    { value: 'severe', label: 'Corrosion sévère' }
  ];

  const conditionStatuses = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Bon' },
    { value: 'fair', label: 'Acceptable' },
    { value: 'poor', label: 'Médiocre' },
    { value: 'critical', label: 'Critique' }
  ];

  const maintenanceFrequencies = [
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuelle' },
    { value: 'quarterly', label: 'Trimestrielle' },
    { value: 'biannual', label: 'Semestrielle' },
    { value: 'annual', label: 'Annuelle' }
  ];

  const controlSystems = [
    { value: 'basic', label: 'Démarrage direct' },
    { value: 'soft_starter', label: 'Démarreur progressif' },
    { value: 'vfd', label: 'Variateur de fréquence' },
    { value: 'pressure_control', label: 'Régulation de pression' },
    { value: 'flow_control', label: 'Régulation de débit' }
  ];

  // Fonction d'analyse experte des données d'audit
  const performExpertAuditAnalysis = async () => {
    setLoadingAnalysis(true);
    
    try {
      // Utiliser la nouvelle fonction d'audit intelligent
      await performIntelligentAudit();
    } catch (error) {
      console.error('Erreur analyse audit:', error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const generatePriorityActions = () => [
    'Remplacement immédiat des pièces critiques usées',
    'Correction de l\'alignement pompe-moteur', 
    'Installation d\'un système de surveillance vibratoire',
    'Optimisation du programme de maintenance préventive'
  ];

  const generateCostEstimates = () => ({
    immediate_repairs: 15000,
    preventive_maintenance: 8000,
    efficiency_upgrades: 25000,
    monitoring_systems: 12000
  });

  const generateImprovementMeasures = () => [
    {
      measure: 'Installation variateur de fréquence',
      savings_percentage: 25,
      cost: 35000,
      payback_months: 14
    },
    {
      measure: 'Optimisation régulation pression',
      savings_percentage: 15,
      cost: 18000,
      payback_months: 18
    },
    {
      measure: 'Amélioration facteur puissance',
      savings_percentage: 8,
      cost: 12000,
      payback_months: 24
    }
  ];

  const generatePaybackAnalysis = () => ({
    total_investment: 65000,
    annual_savings: 230400,
    simple_payback_months: 3.4,
    npv_5_years: 890000,
    irr_percentage: 42
  });

  const determineInvestmentPriority = () => {
    const hydraulicScore = calculateHydraulicScore();
    const energyScore = calculateEnergyScore();
    
    if (hydraulicScore < 60 && energyScore < 60) return 'Critique - Intervention immédiate';
    if (hydraulicScore < 75 || energyScore < 75) return 'Élevée - Planifier sous 6 mois';
    return 'Modérée - Optimisation continue';
  };

  const generateImplementationRoadmap = () => [
    { phase: 'Phase 1 (0-3 mois)', actions: ['Réparations critiques', 'Maintenance corrective'] },
    { phase: 'Phase 2 (3-6 mois)', actions: ['Installation variateur', 'Optimisation contrôle'] },
    { phase: 'Phase 3 (6-12 mois)', actions: ['Système monitoring', 'Formation équipes'] }
  ];

  const calculateHydraulicScore = () => {
    let score = 100;
    
    // Pénalités basées sur les conditions
    if (auditData.corrosion_level === 'moderate') score -= 15;
    if (auditData.corrosion_level === 'severe') score -= 30;
    if (auditData.alignment_status === 'poor') score -= 20;
    if (auditData.coupling_condition === 'poor') score -= 15;
    if (auditData.leakage_present) score -= 10;
    if (auditData.performance_degradation) score -= 25;
    
    // Bonus pour bonne maintenance
    if (auditData.maintenance_frequency === 'monthly') score += 5;
    if (auditData.maintenance_frequency === 'weekly') score += 10;
    
    return Math.max(20, Math.min(100, score));
  };

  const calculateEnergyScore = () => {
    let score = 100;
    
    // Pénalités énergétiques
    if (!auditData.has_vfd && activeAuditTab === 'energy') score -= 25;
    if (parseFloat(auditData.measured_power_factor) < 0.9) score -= 15;
    if (!auditData.has_automation) score -= 20;
    if (auditData.energy_consumption_increase) score -= 20;
    
    // Bonus pour équipements efficaces
    if (auditData.has_vfd) score += 15;
    if (auditData.has_automation) score += 10;
    
    return Math.max(30, Math.min(100, score));
  };

  const getPerformanceRating = (score) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 75) return { level: 'Bon', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 60) return { level: 'Acceptable', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (score >= 40) return { level: 'Médiocre', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { level: 'Critique', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  // ========================================================================================================
  // ANALYSE EN TEMPS RÉEL COMPLÈTE ET INTELLIGENTE - 3 SECTIONS PROFESSIONNELLES
  // ========================================================================================================
  
  const analyzeDataConsistency = (data) => {
    const analysis = {
      section1_technical_analysis: {
        fluid_analysis: [],
        diameter_analysis: [],
        electrical_analysis: [],
        power_calculations: {}
      },
      section2_mechanical_diagnosis: {
        bearing_analysis: [],
        seal_analysis: [],
        dry_run_analysis: [],
        noise_analysis: [],
        operational_analysis: []
      },
      section3_corrective_actions: {
        immediate_actions: [],
        preventive_actions: [],
        equipment_modifications: [],
        maintenance_schedule: []
      },
      overall_status: "OK",
      critical_count: 0,
      important_count: 0
    };

    // ========================================================================================================
    // SECTION 1 : ANALYSE TECHNIQUE DÉTAILLÉE
    // ========================================================================================================
    
    // 1.1 ANALYSE FLUIDE ET TEMPÉRATURE
    if (data.fluid_type) {
      const fluidProps = {
        water: { optimal_temp: [5, 80], viscosity_factor: 1.0, corrosion_risk: "faible" },
        oil: { optimal_temp: [20, 60], viscosity_factor: 4.5, corrosion_risk: "faible" },
        acid: { optimal_temp: [15, 45], viscosity_factor: 1.2, corrosion_risk: "critique" },
        glycol: { optimal_temp: [-10, 70], viscosity_factor: 2.8, corrosion_risk: "moyen" },
        seawater: { optimal_temp: [5, 35], viscosity_factor: 1.1, corrosion_risk: "élevé" },
        bleach: { optimal_temp: [10, 40], viscosity_factor: 1.0, corrosion_risk: "critique" }
      };

      const fluid = fluidProps[data.fluid_type] || fluidProps.water;
      const temp = data.fluid_temperature || 20;
      
      if (temp < fluid.optimal_temp[0] || temp > fluid.optimal_temp[1]) {
        analysis.section1_technical_analysis.fluid_analysis.push({
          type: `TEMPÉRATURE ${temp < fluid.optimal_temp[0] ? 'TROP BASSE' : 'EXCESSIVE'}`,
          severity: temp < fluid.optimal_temp[0] - 10 || temp > fluid.optimal_temp[1] + 15 ? "CRITIQUE" : "IMPORTANT",
          description: `Fluide ${data.fluid_type} à ${temp}°C - Plage optimale: ${fluid.optimal_temp[0]}°C à ${fluid.optimal_temp[1]}°C`,
          technical_impact: temp < fluid.optimal_temp[0] ? 
            `Viscosité élevée (x${(1 + (fluid.optimal_temp[0] - temp) * 0.05).toFixed(1)}), cavitation possible, démarrage difficile` :
            `Viscosité réduite, vaporisation possible, joints dégradés, rendement diminué`,
          equipment_affected: ["Pompe", "Joints", "Roulements", "Moteur"],
          corrective_action: temp < fluid.optimal_temp[0] ? 
            "Réchauffage fluide, isolation conduites, vérifier démarrage" :
            "Refroidissement, ventilation forcée, vérifier dilatations"
        });
        if (temp < fluid.optimal_temp[0] - 10 || temp > fluid.optimal_temp[1] + 15) {
          analysis.critical_count++;
          analysis.overall_status = "CRITIQUE";
        }
      }

      // Analyse compatibilité matériau-fluide
      if (data.suction_material || data.discharge_material) {
        const materials = [data.suction_material, data.discharge_material].filter(Boolean);
        materials.forEach((material, index) => {
          const location = index === 0 ? "aspiration" : "refoulement";
          
          if ((data.fluid_type === 'acid' || data.fluid_type === 'bleach') && 
              (material === 'cast_iron' || material === 'steel')) {
            analysis.section1_technical_analysis.fluid_analysis.push({
              type: "INCOMPATIBILITÉ MATÉRIAU-FLUIDE CRITIQUE",
              severity: "CRITIQUE",
              description: `${material} en contact avec ${data.fluid_type} sur conduite ${location}`,
              technical_impact: "Corrosion accélérée, perforation conduites, contamination fluide, fuite majeure",
              equipment_affected: ["Conduite " + location, "Raccords", "Vannes", "Pompe"],
              corrective_action: `Remplacement immédiat par INOX 316L ou PVC, inspection complète réseau ${location}`
            });
            analysis.critical_count++;
            analysis.overall_status = "CRITIQUE";
          }
        });
      }
    }

    // 1.2 ANALYSE DIAMÈTRES ET VITESSES (Logique Expert)
    if (data.current_flow_rate && data.suction_pipe_diameter) {
      const flow_m3s = data.current_flow_rate / 3600;
      const diameter_m = data.suction_pipe_diameter / 1000;
      const area = Math.PI * (diameter_m / 2) ** 2;
      const velocity = flow_m3s / area;
      
      // Calcul diamètre optimal selon standards
      const optimal_velocity_suction = 1.2; // m/s
      const optimal_diameter = Math.sqrt((4 * flow_m3s) / (Math.PI * optimal_velocity_suction)) * 1000;
      const closest_dn = [20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300, 350, 400].find(dn => dn >= optimal_diameter) || 400;
      
      if (velocity > 1.5) {
        analysis.section1_technical_analysis.diameter_analysis.push({
          type: "VITESSE ASPIRATION EXCESSIVE",
          severity: velocity > 2.5 ? "CRITIQUE" : "IMPORTANT",
          description: `DN${Math.round(data.suction_pipe_diameter)} - Vitesse: ${velocity.toFixed(2)} m/s (limite: 1.5 m/s)`,
          technical_impact: `NPSH disponible réduit de ${((velocity/1.5 - 1) * 0.5).toFixed(1)}m, cavitation, bruit, vibrations, usure roue`,
          diameter_recommendation: {
            current: `DN${Math.round(data.suction_pipe_diameter)}`,
            recommended: `DN${closest_dn}`,
            new_velocity: `${((flow_m3s / (Math.PI * (closest_dn/2000)**2))).toFixed(2)} m/s`,
            pressure_gain: `+${((velocity**2 - (flow_m3s / (Math.PI * (closest_dn/2000)**2))**2) * 1000 / (2*9.81)).toFixed(1)} mCE`
          },
          equipment_affected: ["Conduite aspiration", "Roue pompe", "Roulements"],
          corrective_action: `Remplacer conduite aspiration par DN${closest_dn}, réduire coudes, vérifier NPSH`
        });
        if (velocity > 2.5) {
          analysis.critical_count++;
          analysis.overall_status = "CRITIQUE";
        }
      }
    }

    // Analyse conduite refoulement
    if (data.current_flow_rate && data.discharge_pipe_diameter) {
      const flow_m3s = data.current_flow_rate / 3600;
      const diameter_m = data.discharge_pipe_diameter / 1000;
      const area = Math.PI * (diameter_m / 2) ** 2;
      const velocity = flow_m3s / area;
      
      if (velocity > 4.0) {
        const optimal_velocity_discharge = 3.5; // m/s
        const optimal_diameter = Math.sqrt((4 * flow_m3s) / (Math.PI * optimal_velocity_discharge)) * 1000;
        const closest_dn = [20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300].find(dn => dn >= optimal_diameter) || 300;
        
        analysis.section1_technical_analysis.diameter_analysis.push({
          type: "VITESSE REFOULEMENT EXCESSIVE",
          severity: "IMPORTANT",
          description: `DN${Math.round(data.discharge_pipe_diameter)} - Vitesse: ${velocity.toFixed(2)} m/s (limite: 4.0 m/s)`,
          technical_impact: `Pertes charge élevées: +${((velocity/3.5)**2 * 0.5).toFixed(1)} mCE, bruit, érosion, surconsommation`,
          diameter_recommendation: {
            current: `DN${Math.round(data.discharge_pipe_diameter)}`,
            recommended: `DN${closest_dn}`,
            energy_saving: `${(((velocity/3.5)**2 - 1) * 15).toFixed(0)}% économie énergie`
          },
          corrective_action: `Augmenter diamètre refoulement à DN${closest_dn}, optimiser tracé`
        });
        analysis.important_count++;
      }
    }

    // 1.3 ANALYSE ÉLECTRIQUE COMPLÈTE
    if (data.measured_voltage && data.rated_voltage) {
      const voltage_deviation = ((data.measured_voltage - data.rated_voltage) / data.rated_voltage) * 100;
      
      if (Math.abs(voltage_deviation) > 5) {
        analysis.section1_technical_analysis.electrical_analysis.push({
          type: `TENSION ${voltage_deviation > 0 ? 'EXCESSIVE' : 'INSUFFISANTE'}`,
          severity: Math.abs(voltage_deviation) > 10 ? "CRITIQUE" : "IMPORTANT",
          description: `Tension mesurée: ${data.measured_voltage}V (nominale: ${data.rated_voltage}V) - Écart: ${voltage_deviation.toFixed(1)}%`,
          technical_impact: voltage_deviation > 0 ? 
            `Surchauffe moteur, isolation dégradée, courant +${(voltage_deviation * 0.8).toFixed(1)}%` :
            `Couple réduit -${(Math.abs(voltage_deviation) * 1.8).toFixed(1)}%, démarrage difficile, rendement diminué`,
          equipment_affected: ["Moteur", "Bobinage", "Contacteur", "Protection thermique"],
          corrective_action: voltage_deviation > 0 ? 
            "Vérifier transformateur, régler prises, contrôler câblage" :
            "Augmenter section câbles, vérifier connexions, mesurer chute tension"
        });
        if (Math.abs(voltage_deviation) > 10) {
          analysis.critical_count++;
          analysis.overall_status = "CRITIQUE";
        }
      }
    }

    // Calcul puissance intelligent (mono/triphasé)
    if (data.measured_current && data.measured_voltage && data.measured_power_factor) {
      const is_three_phase = data.electrical_configuration === 'three_phase' || data.measured_voltage > 240;
      const calculated_power = is_three_phase ? 
        (Math.sqrt(3) * data.measured_voltage * data.measured_current * data.measured_power_factor) / 1000 :
        (data.measured_voltage * data.measured_current * data.measured_power_factor) / 1000;
      
      analysis.section1_technical_analysis.power_calculations = {
        configuration: is_three_phase ? "Triphasé" : "Monophasé",
        calculated_power: calculated_power.toFixed(2),
        measured_power: data.measured_power || "Non renseigné",
        current_per_phase: data.measured_current,
        power_factor: data.measured_power_factor,
        reactive_power: (calculated_power * Math.tan(Math.acos(data.measured_power_factor))).toFixed(2),
        apparent_power: (calculated_power / data.measured_power_factor).toFixed(2)
      };

      // Vérification cohérence puissance
      if (data.measured_power && Math.abs(calculated_power - data.measured_power) > 0.5) {
        analysis.section1_technical_analysis.electrical_analysis.push({
          type: "INCOHÉRENCE PUISSANCE MESURÉE",
          severity: "IMPORTANT",
          description: `Puissance calculée: ${calculated_power.toFixed(2)}kW vs mesurée: ${data.measured_power}kW`,
          technical_impact: "Erreur instrumentation ou déséquilibrage phases, mesures non fiables",
          equipment_affected: ["Instrumentation", "Câblage", "Protection"],
          corrective_action: "Vérifier pince ampèremétrique, équilibrage phases, calibrage instruments"
        });
      }

      // Analyse facteur de puissance
      if (data.measured_power_factor < 0.85) {
        analysis.section1_technical_analysis.electrical_analysis.push({
          type: "FACTEUR DE PUISSANCE FAIBLE",
          severity: data.measured_power_factor < 0.75 ? "CRITIQUE" : "IMPORTANT",
          description: `Cos φ = ${data.measured_power_factor} (minimum recommandé: 0.9)`,
          technical_impact: `Surconsommation réactive: ${(calculated_power * Math.tan(Math.acos(data.measured_power_factor))).toFixed(1)}kVAR, pénalités EDF possibles`,
          equipment_affected: ["Installation électrique", "Transformateur"],
          corrective_action: `Installation condensateurs: ${(calculated_power * (Math.tan(Math.acos(data.measured_power_factor)) - Math.tan(Math.acos(0.9)))).toFixed(1)}kVAR`
        });
        if (data.measured_power_factor < 0.75) analysis.critical_count++;
      }
    }

    // ========================================================================================================
    // SECTION 2 : DIAGNOSTIC MÉCANIQUE COMPLET
    // ========================================================================================================
    
    // 2.1 ANALYSE ROULEMENTS
    if (data.vibration_level) {
      const iso_limits = { excellent: 0.7, good: 1.8, acceptable: 4.5, unacceptable: 7.1 };
      let bearing_condition = "Excellent";
      let bearing_action = "RAS - Surveillance normale";
      
      if (data.vibration_level > iso_limits.unacceptable) {
        bearing_condition = "Destruction imminente";
        bearing_action = "ARRÊT IMMÉDIAT - Remplacement roulements d'urgence";
        analysis.critical_count++;
        analysis.overall_status = "CRITIQUE";
      } else if (data.vibration_level > iso_limits.acceptable) {
        bearing_condition = "Très dégradé";
        bearing_action = "Programmer remplacement dans 48h maximum";
      } else if (data.vibration_level > iso_limits.good) {
        bearing_condition = "Dégradé";
        bearing_action = "Surveillance renforcée, lubrification à vérifier";
      }

      analysis.section2_mechanical_diagnosis.bearing_analysis.push({
        type: "ÉTAT ROULEMENTS",
        severity: data.vibration_level > iso_limits.unacceptable ? "CRITIQUE" : 
                 data.vibration_level > iso_limits.acceptable ? "IMPORTANT" : "BON",
        current_level: `${data.vibration_level} mm/s`,
        condition: bearing_condition,
        iso_classification: data.vibration_level <= iso_limits.excellent ? "Zone A - Excellent" :
                           data.vibration_level <= iso_limits.good ? "Zone B - Bon" :
                           data.vibration_level <= iso_limits.acceptable ? "Zone C - Acceptable" :
                           data.vibration_level <= iso_limits.unacceptable ? "Zone D - Inacceptable" :
                           "Hors Zone - Destruction",
        remaining_life: data.vibration_level <= iso_limits.good ? "> 12 mois" :
                       data.vibration_level <= iso_limits.acceptable ? "3-6 mois" :
                       data.vibration_level <= iso_limits.unacceptable ? "< 1 mois" : "< 24h",
        technical_details: {
          frequency_analysis: "Surveiller harmoniques 1x, 2x, 3x vitesse rotation",
          lubrication_check: "Vérifier graissage, température roulements au toucher",
          alignment_check: "Contrôler alignement pompe-moteur (tolérance ± 0.1mm)"
        },
        corrective_action: bearing_action
      });
    }

    // 2.2 ANALYSE ÉTANCHÉITÉ
    if (data.leakage_present !== undefined) {
      if (data.leakage_present) {
        analysis.section2_mechanical_diagnosis.seal_analysis.push({
          type: "FUITE DÉTECTÉE",
          severity: "IMPORTANTE",
          description: "Présence de fuite signalée sur l'installation",
          technical_impact: "Perte de performance, contamination, usure accélérée garniture",
          seal_diagnosis: {
            possible_causes: [
              "Garniture mécanique usée (faces de frottement)",
              "Mauvais alignement pompe-moteur",
              "Vibrations excessives",
              "Fonctionnement à sec antérieur",
              "Surpression système"
            ],
            inspection_points: [
              "État faces carbone/céramique garniture",
              "Ressort garniture (cassure/corrosion)",
              "Siège garniture sur arbre",
              "O-ring statique garniture",
              "Arbre pompe (rayures/usure)"
            ]
          },
          corrective_action: "Démontage garniture, contrôle faces, remplacement si usure > 0.5mm"
        });
        analysis.important_count++;
      }
    }

    // 2.3 ANALYSE MARCHE À SEC
    if (data.current_flow_rate && data.current_flow_rate < (data.minimum_flow_rate || 5)) {
      analysis.section2_mechanical_diagnosis.dry_run_analysis.push({
        type: "RISQUE MARCHE À SEC",
        severity: "CRITIQUE",
        description: `Débit très faible: ${data.current_flow_rate} m³/h (minimum: ${data.minimum_flow_rate || 5} m³/h)`,
        technical_impact: "Échauffement, cavitation, destruction garniture et roue, grippage",
        protection_measures: {
          current: data.has_dry_run_protection ? "Protection existante" : "AUCUNE PROTECTION",
          recommended: [
            "Pressostat minimum aspiration (réglage -0.3 bar)",
            "Débitmètre avec seuil d'alarme",
            "Protection thermique moteur (réglage 80°C)",
            "Temporisation démarrage (éviter cycles courts)"
          ]
        },
        immediate_verification: [
          "Niveau réservoir/puits aspiration",
          "Amorçage pompe complet",
          "Vanne aspiration totalement ouverte",
          "Filtre aspiration non colmaté"
        ],
        corrective_action: "Vérifier aspiration, installer protection marche à sec d'urgence"
      });
      analysis.critical_count++;
      analysis.overall_status = "CRITIQUE";
    }

    // 2.4 ANALYSE BRUIT MOTEUR
    if (data.noise_level) {
      const noise_limits = { acceptable: 70, concerning: 80, critical: 90 };
      
      if (data.noise_level > noise_limits.acceptable) {
        analysis.section2_mechanical_diagnosis.noise_analysis.push({
          type: `BRUIT ${data.noise_level > noise_limits.critical ? 'CRITIQUE' : 'EXCESSIF'}`,
          severity: data.noise_level > noise_limits.critical ? "CRITIQUE" : "IMPORTANT",
          measured_level: `${data.noise_level} dB(A)`,
          limit: `${noise_limits.acceptable} dB(A) (limite industrielle)`,
          noise_source_analysis: {
            mechanical_sources: [
              `Roulements dégradés (bruit roulement à billes/cylindres)`,
              `Déséquilibrage rotor (fréquence = vitesse rotation)`,
              `Défaut alignement (bruit variable charge)`
            ],
            hydraulic_sources: [
              `Cavitation (bruit grésil/gravier)`,
              `Débit excessif (sifflements)`,
              `Turbulences conduites (bruits sourds)`
            ],
            electrical_sources: [
              `Bobinage défaillant (ronflement 50/100Hz)`,
              `Entrefer variable (magnétostrictive)`,
              `Mauvaises connexions (grésillements)`
            ]
          },
          diagnostic_method: {
            frequency_analysis: "Mesure spectrale 10Hz-10kHz pour identifier source",
            location_mapping: "Mesure directionnelle (moteur vs pompe)",
            load_correlation: "Mesure à différentes charges"
          },
          corrective_action: data.noise_level > noise_limits.critical ? 
            "ARRÊT - Diagnostic vibratoire complet, EPI obligatoires" :
            "Isolation acoustique, diagnostic préventif planifié"
        });
        
        if (data.noise_level > noise_limits.critical) {
          analysis.critical_count++;
          analysis.overall_status = "CRITIQUE";
        }
      }
    }

    // ========================================================================================================
    // SECTION 3 : ACTIONS CORRECTIVES DÉTAILLÉES POUR TECHNICIENS
    // ========================================================================================================

    // 3.1 ACTIONS IMMÉDIATES (0-24h)
    analysis.section3_corrective_actions.immediate_actions = [
      {
        priority: "URGENCE",
        condition: analysis.critical_count > 0,
        checklist: [
          "🔴 SÉCURITÉ : Port EPI obligatoire (casque, gants isolants, chaussures sécurité)",
          "🔴 ISOLEMENT : Consignation électrique selon NF C18-510 (LOTO)",
          "🔴 MESURES : Température moteur au contact (< 80°C sinon ARRÊT)",
          "🔴 VÉRIFICATIONS : Niveau huile, amorçage, vannes, filtres",
          "🔴 TESTS : Rotation libre à la main (pompe découplée)",
          "🔴 CONTRÔLES : Serrage connexions électriques, isolement phases",
          "🔴 DOCUMENTATION : Photos état, relevé mesures, rapport incident"
        ]
      }
    ];

    // 3.2 ACTIONS PRÉVENTIVES (1-7 jours)  
    analysis.section3_corrective_actions.preventive_actions = [
      {
        category: "MÉCANIQUE",
        tasks: [
          "Contrôle alignement pompe-moteur (jauge 0.1mm)",
          "Vérification équilibrage rotor (si vibrations > 2.8 mm/s)",
          "Graissage roulements selon planning (graisse lithium EP2)",
          "Contrôle garniture mécanique (jeu axial < 3mm)",
          "Inspection visuelle accouplements (usure, fissures)"
        ]
      },
      {
        category: "ÉLECTRIQUE", 
        tasks: [
          "Mesure isolement bobinage (> 1MΩ/phase)",
          "Contrôle équilibrage phases (écart < 5%)",
          "Vérification protection thermique (réglage/fonctionnement)",
          "Nettoyage bornier, resserrage connexions (couple spec.)",
          "Test disjoncteur/contacteur (usure contacts)"
        ]
      },
      {
        category: "HYDRAULIQUE",
        tasks: [
          "Contrôle NPSH disponible > NPSH requis + 1m",
          "Vérification aspiration (étanchéité, amorçage)",
          "Nettoyage filtres/crépines (perte charge < 0.5 bar)",
          "Test vannes (ouverture complète, étanchéité)",
          "Mesure pressions (aspiration/refoulement/différentielle)"
        ]
      }
    ];

    // 3.3 MODIFICATIONS ÉQUIPEMENTS
    if (analysis.critical_count > 0 || analysis.important_count > 2) {
      analysis.section3_corrective_actions.equipment_modifications = [
        {
          type: "SURVEILLANCE",
          equipment: "Système monitoring vibratoire",
          justification: "Détection précoce défaillances roulements",
          specification: "Capteurs accéléromètres 3 axes, seuils programmables",
          installation: "Paliers moteur + pompe, boîtier IP65",
          cost_estimate: "800-1500€"
        },
        {
          type: "PROTECTION",
          equipment: "Pressostat aspiration + débitmètre",
          justification: "Protection marche à sec automatique",
          specification: "Pressostat -1/+1 bar, débitmètre vortex DN selon conduite",
          installation: "Aspiration pompe + tableau électrique",
          cost_estimate: "400-800€"
        },
        {
          type: "AMÉLIORATION",
          equipment: "Variateur de fréquence",
          justification: "Régulation débit, protection moteur, économies",
          specification: "VFD avec protection IP54, filtres CEM",
          installation: "Armoire électrique ventilée",
          cost_estimate: "1200-3000€"
        }
      ];
    }

    // 3.4 PLANNING MAINTENANCE  
    analysis.section3_corrective_actions.maintenance_schedule = [
      {
        frequency: "QUOTIDIEN",
        tasks: ["Relevé température moteur", "Contrôle visuel fuites", "Écoute bruits anormaux"]
      },
      {
        frequency: "HEBDOMADAIRE", 
        tasks: ["Mesure vibrations points fixes", "Contrôle niveau huile", "Test protections"]
      },
      {
        frequency: "MENSUEL",
        tasks: ["Nettoyage général", "Contrôle alignement", "Mesures électriques complètes"]
      },
      {
        frequency: "TRIMESTRIEL",
        tasks: ["Démontage inspection garniture", "Graissage roulements", "Étalonnage instruments"]
      },
      {
        frequency: "ANNUEL",
        tasks: ["Révision générale pompe", "Test isolement complet", "Remplacement préventif"]
      }
    ];

    // Mise à jour statut global
    if (analysis.critical_count === 0 && analysis.important_count === 0) {
      analysis.overall_status = "EXCELLENT";
    } else if (analysis.critical_count === 0 && analysis.important_count <= 2) {
      analysis.overall_status = "BON";
    } else if (analysis.critical_count === 0) {
      analysis.overall_status = "ACCEPTABLE";
    } else if (analysis.critical_count <= 2) {
      analysis.overall_status = "DÉGRADÉ";
    } else {
      analysis.overall_status = "CRITIQUE";
    }

    return analysis;
  };

  // Fonction d'analyse en temps réel appelée à chaque modification
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(null);
  
  const updateRealTimeAnalysis = () => {
    const analysis = analyzeDataConsistency(auditData);
    setRealTimeAnalysis(analysis);
  };

  // Appeler l'analyse en temps réel à chaque modification des données
  useEffect(() => {
    if (Object.keys(auditData).length > 0) {
      updateRealTimeAnalysis();
    }
  }, [auditData]);

  // ========================================================================================================
  // FONCTION D'EXPORT PDF POUR RAPPORT AUDIT
  // ========================================================================================================
  
  const exportAuditReportToPDF = () => {
    // Créer le contenu HTML formaté pour le PDF
    const reportContent = generatePDFContent();
    
    // Configuration PDF
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Rapport_Audit_Pompage_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        allowTaint: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Créer un élément temporaire pour le PDF
    const element = document.createElement('div');
    element.innerHTML = reportContent;
    element.style.width = '210mm';
    element.style.minHeight = '297mm';
    element.style.padding = '10mm';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.fontSize = '12px';
    element.style.lineHeight = '1.4';
    element.style.color = '#333';
    
    // Ajouter temporairement à la page
    document.body.appendChild(element);
    
    // Générer le PDF
    html2pdf().from(element).set(opt).save().then(() => {
      // Nettoyer l'élément temporaire
      document.body.removeChild(element);
    });
  };

  const generatePDFContent = () => {
    const currentDate = new Date().toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let content = `
      <div style="font-family: Arial, sans-serif; max-width: 190mm; margin: 0 auto;">
        <!-- En-tête du rapport -->
        <div style="text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: bold;">
            📋 RAPPORT D'AUDIT TECHNIQUE PROFESSIONNEL
          </h1>
          <h2 style="color: #4b5563; margin: 10px 0; font-size: 18px;">
            INSTALLATION DE POMPAGE - ANALYSE EXPERTE COMPLÈTE
          </h2>
          <p style="margin: 10px 0; color: #6b7280; font-size: 14px;">
            Généré le ${currentDate}
          </p>
        </div>

        <!-- Synthèse Exécutive -->
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #1f2937; margin-top: 0; font-size: 16px; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">
            🎯 SYNTHÈSE EXÉCUTIVE
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
            <div>
              <strong>État Installation:</strong> ${realTimeAnalysis?.overall_status || 'Non évalué'}
            </div>
            <div>
              <strong>Problèmes Critiques:</strong> ${realTimeAnalysis?.critical_count || 0}
            </div>
            <div>
              <strong>Problèmes Importants:</strong> ${realTimeAnalysis?.important_count || 0}
            </div>
            <div>
              <strong>Date Inspection:</strong> ${currentDate}
            </div>
          </div>
        </div>`;

    // ========================================================================================================
    // SECTION 1 OBLIGATOIRE : ANALYSE TECHNIQUE DÉTAILLÉE
    // ========================================================================================================
    content += `
        <div style="page-break-inside: avoid; margin-bottom: 30px; border: 2px solid #2563eb; border-radius: 8px; padding: 20px;">
          <h3 style="color: #2563eb; font-size: 18px; border-bottom: 3px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; text-align: center;">
            📊 SECTION 1 : ANALYSE TECHNIQUE DÉTAILLÉE (OBLIGATOIRE)
          </h3>`;
      
    // Analyse Fluides - OBLIGATOIRE même si vide
    content += `
          <div style="margin-bottom: 20px; background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px;">
            <h4 style="color: #1f2937; font-size: 14px; margin-bottom: 10px; font-weight: bold;">🌡️ ANALYSE FLUIDE & TEMPÉRATURE</h4>`;
    
    if (realTimeAnalysis?.section1_technical_analysis?.fluid_analysis?.length > 0) {
        realTimeAnalysis.section1_technical_analysis.fluid_analysis.forEach(analysis => {
          const bgColor = analysis.severity === 'CRITIQUE' ? '#fef2f2' : 
                         analysis.severity === 'IMPORTANT' ? '#fff7ed' : '#fefce8';
          const borderColor = analysis.severity === 'CRITIQUE' ? '#ef4444' : 
                             analysis.severity === 'IMPORTANT' ? '#f97316' : '#eab308';
          
          content += `
            <div style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 12px; margin-bottom: 10px; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="font-size: 13px;">${analysis.type}</strong>
                <span style="background-color: ${borderColor}20; color: ${borderColor}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                  ${analysis.severity}
                </span>
              </div>
              <p style="font-size: 12px; margin: 5px 0; color: #4b5563;">${analysis.description}</p>
              <p style="font-size: 12px; margin: 5px 0; color: #dc2626;"><strong>Impact:</strong> ${analysis.technical_impact}</p>
              <p style="font-size: 12px; margin: 5px 0; color: #16a34a;"><strong>Action:</strong> ${analysis.corrective_action}</p>
            </div>`;
        });
    } else {
        content += `<p style="font-style: italic; color: #6b7280;">Aucune analyse fluide/température critique détectée. Installation conforme.</p>`;
    }
    content += `</div>`;

    // Analyse Diamètres - OBLIGATOIRE même si vide
    content += `
          <div style="margin-bottom: 20px; background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px;">
            <h4 style="color: #1f2937; font-size: 14px; margin-bottom: 10px; font-weight: bold;">📏 ANALYSE DIAMÈTRES & VITESSES</h4>`;
    
    if (realTimeAnalysis?.section1_technical_analysis?.diameter_analysis?.length > 0) {
        realTimeAnalysis.section1_technical_analysis.diameter_analysis.forEach(analysis => {
          const bgColor = analysis.severity === 'CRITIQUE' ? '#fef2f2' : '#fff7ed';
          const borderColor = analysis.severity === 'CRITIQUE' ? '#ef4444' : '#f97316';
          
          content += `
            <div style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 12px; margin-bottom: 10px; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="font-size: 13px;">${analysis.type}</strong>
                <span style="background-color: ${borderColor}20; color: ${borderColor}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                  ${analysis.severity}
                </span>
              </div>
              <p style="font-size: 12px; margin: 5px 0; color: #4b5563;">${analysis.description}</p>
              <p style="font-size: 12px; margin: 5px 0; color: #dc2626;"><strong>Impact:</strong> ${analysis.technical_impact}</p>`;
          
          if (analysis.diameter_recommendation) {
            content += `
              <div style="background-color: #ecfdf5; border: 1px solid #10b981; padding: 8px; border-radius: 4px; margin: 8px 0;">
                <p style="font-size: 12px; margin: 2px 0; color: #047857;"><strong>Recommandation:</strong> ${analysis.diameter_recommendation.current} → ${analysis.diameter_recommendation.recommended}</p>`;
            if (analysis.diameter_recommendation.new_velocity) {
              content += `<p style="font-size: 12px; margin: 2px 0; color: #047857;"><strong>Nouvelle vitesse:</strong> ${analysis.diameter_recommendation.new_velocity}</p>`;
            }
            if (analysis.diameter_recommendation.energy_saving) {
              content += `<p style="font-size: 12px; margin: 2px 0; color: #047857;"><strong>Économie:</strong> ${analysis.diameter_recommendation.energy_saving}</p>`;
            }
            content += `</div>`;
          }
          
          content += `
              <p style="font-size: 12px; margin: 5px 0; color: #16a34a;"><strong>Action:</strong> ${analysis.corrective_action}</p>
            </div>`;
        });
    } else {
        content += `<p style="font-style: italic; color: #6b7280;">Diamètres et vitesses dans les normes. Aucune optimisation requise.</p>`;
    }
    content += `</div>`;

    // Calculs de Puissance - OBLIGATOIRE même si vide
    content += `
          <div style="margin-bottom: 20px; background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px;">
            <h4 style="color: #1f2937; font-size: 14px; margin-bottom: 10px; font-weight: bold;">🔢 CALCULS PUISSANCE ÉLECTRIQUE</h4>`;
    
    if (realTimeAnalysis?.section1_technical_analysis?.power_calculations && 
          Object.keys(realTimeAnalysis.section1_technical_analysis.power_calculations).length > 0) {
        const power = realTimeAnalysis.section1_technical_analysis.power_calculations;
        content += `
            <div style="background-color: #faf5ff; border: 1px solid #a855f7; padding: 12px; border-radius: 4px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
                <div><strong>Configuration:</strong> ${power.configuration || 'N/A'}</div>
                <div><strong>P calculée:</strong> ${power.calculated_power || 'N/A'} kW</div>
                <div><strong>Courant/phase:</strong> ${power.current_per_phase || 'N/A'} A</div>
                <div><strong>Cos φ:</strong> ${power.power_factor || 'N/A'}</div>
                <div><strong>P réactive:</strong> ${power.reactive_power || 'N/A'} kVAR</div>
                <div><strong>P apparente:</strong> ${power.apparent_power || 'N/A'} kVA</div>
              </div>
            </div>`;
    } else {
        content += `<p style="font-style: italic; color: #6b7280;">Données électriques insuffisantes pour calculs de puissance détaillés.</p>`;
    }
    content += `</div>`;
      
    content += `</div>`; // Fin Section 1

    // ========================================================================================================
    // SECTION 2 OBLIGATOIRE : DIAGNOSTIC MÉCANIQUE COMPLET
    // ========================================================================================================
    content += `
        <div style="page-break-inside: avoid; margin-bottom: 30px; border: 2px solid #ea580c; border-radius: 8px; padding: 20px;">
          <h3 style="color: #ea580c; font-size: 18px; border-bottom: 3px solid #ea580c; padding-bottom: 10px; margin-bottom: 20px; text-align: center;">
            🔧 SECTION 2 : DIAGNOSTIC MÉCANIQUE COMPLET (OBLIGATOIRE)
          </h3>`;

    // Analyse Roulements - OBLIGATOIRE même si vide
    content += `
          <div style="margin-bottom: 20px; background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 15px;">
            <h4 style="color: #1f2937; font-size: 14px; margin-bottom: 10px; font-weight: bold;">⚙️ ANALYSE ROULEMENTS</h4>`;
    
    if (realTimeAnalysis?.section2_mechanical_diagnosis?.bearing_analysis?.length > 0) {
        realTimeAnalysis.section2_mechanical_diagnosis.bearing_analysis.forEach(analysis => {
          const bgColor = analysis.severity === 'CRITIQUE' ? '#fef2f2' : 
                         analysis.severity === 'IMPORTANT' ? '#fff7ed' : '#f0fdf4';
          const borderColor = analysis.severity === 'CRITIQUE' ? '#ef4444' : 
                             analysis.severity === 'IMPORTANT' ? '#f97316' : '#22c55e';
          
          content += `
            <div style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 12px; margin-bottom: 10px; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="font-size: 13px;">${analysis.type}</strong>
                <span style="background-color: ${borderColor}20; color: ${borderColor}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                  ${analysis.severity}
                </span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; font-size: 12px;">
                <div><strong>Niveau:</strong> ${analysis.current_level || 'N/A'}</div>
                <div><strong>État:</strong> ${analysis.condition || 'N/A'}</div>
                <div><strong>ISO:</strong> ${analysis.iso_classification || 'N/A'}</div>
                <div><strong>Vie restante:</strong> ${analysis.remaining_life || 'N/A'}</div>
              </div>
              <p style="font-size: 12px; margin: 5px 0; color: #16a34a;"><strong>Action:</strong> ${analysis.corrective_action}</p>
            </div>`;
        });
    } else {
        content += `<p style="font-style: italic; color: #6b7280;">Roulements en bon état. Surveillance normale recommandée.</p>`;
    }
    content += `</div>`;

    // Analyse Étanchéité - OBLIGATOIRE même si vide
    content += `
          <div style="margin-bottom: 20px; background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 15px;">
            <h4 style="color: #1f2937; font-size: 14px; margin-bottom: 10px; font-weight: bold;">💧 ANALYSE ÉTANCHÉITÉ</h4>`;
    
    if (realTimeAnalysis?.section2_mechanical_diagnosis?.seal_analysis?.length > 0) {
        realTimeAnalysis.section2_mechanical_diagnosis.seal_analysis.forEach(analysis => {
          content += `
            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px; margin-bottom: 10px; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="font-size: 13px;">${analysis.type}</strong>
                <span style="background-color: #3b82f620; color: #3b82f6; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${analysis.severity}</span>
              </div>
              <p style="font-size: 12px; margin: 5px 0; color: #4b5563;">${analysis.description}</p>
              <p style="font-size: 12px; margin: 5px 0; color: #16a34a;"><strong>Action:</strong> ${analysis.corrective_action}</p>
            </div>`;
        });
    } else {
        content += `<p style="font-style: italic; color: #6b7280;">Aucune fuite détectée. Étanchéité satisfaisante.</p>`;
    }
    content += `</div>`;

    // Analyse Bruit - OBLIGATOIRE même si vide
    content += `
          <div style="margin-bottom: 20px; background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 15px;">
            <h4 style="color: #1f2937; font-size: 14px; margin-bottom: 10px; font-weight: bold;">🔊 ANALYSE BRUIT MOTEUR</h4>`;
    
    if (realTimeAnalysis?.section2_mechanical_diagnosis?.noise_analysis?.length > 0) {
        realTimeAnalysis.section2_mechanical_diagnosis.noise_analysis.forEach(analysis => {
          const bgColor = analysis.severity === 'CRITIQUE' ? '#fef2f2' : '#fff7ed';
          const borderColor = analysis.severity === 'CRITIQUE' ? '#ef4444' : '#f97316';
          
          content += `
            <div style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 12px; margin-bottom: 10px; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="font-size: 13px;">${analysis.type}</strong>
                <span style="background-color: ${borderColor}20; color: ${borderColor}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                  ${analysis.severity}
                </span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; font-size: 12px;">
                <div><strong>Niveau mesuré:</strong> ${analysis.measured_level || 'N/A'}</div>
                <div><strong>Limite:</strong> ${analysis.limit || 'N/A'}</div>
              </div>
              <p style="font-size: 12px; margin: 5px 0; color: #16a34a;"><strong>Action:</strong> ${analysis.corrective_action}</p>
            </div>`;
        });
    } else {
        content += `<p style="font-style: italic; color: #6b7280;">Niveau sonore acceptable. Pas de nuisance détectée.</p>`;
    }
    content += `</div>`;
      
    content += `</div>`; // Fin Section 2

    // ========================================================================================================
    // SECTION 3 OBLIGATOIRE : ACTIONS IMMÉDIATES
    // ========================================================================================================
    content += `
        <div style="page-break-inside: avoid; margin-bottom: 30px; border: 2px solid #dc2626; border-radius: 8px; padding: 20px;">
          <h3 style="color: #dc2626; font-size: 18px; border-bottom: 3px solid #dc2626; padding-bottom: 10px; margin-bottom: 20px; text-align: center;">
            🚨 SECTION 3 : ACTIONS IMMÉDIATES (OBLIGATOIRE)
          </h3>`;

    // Actions Immédiates - OBLIGATOIRE même si vide
    content += `
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px;">
            <h4 style="color: #dc2626; font-size: 14px; margin-bottom: 10px; font-weight: bold;">⚠️ ACTIONS PRIORITAIRES (0-24h)</h4>`;
    
    if (realTimeAnalysis?.section3_corrective_actions?.immediate_actions?.length > 0) {
        realTimeAnalysis.section3_corrective_actions.immediate_actions.forEach(action => {
          if (action.condition) {
            content += `
              <div style="background-color: #fef2f2; border: 1px solid #ef4444; padding: 12px; border-radius: 4px; margin-bottom: 10px;">
                <h5 style="margin: 0 0 10px 0; font-size: 13px; color: #dc2626;">Priorité: ${action.priority}</h5>`;
            
            action.checklist?.forEach(item => {
              content += `<div style="font-size: 12px; margin: 5px 0; color: #7f1d1d;">□ ${item}</div>`;
            });
            
            content += `</div>`;
          }
        });
    } else {
        content += `
          <div style="background-color: #f0fdf4; border: 1px solid #22c55e; padding: 12px; border-radius: 4px;">
            <p style="color: #16a34a; font-weight: bold; margin: 0;">✅ AUCUNE ACTION IMMÉDIATE REQUISE</p>
            <p style="color: #16a34a; font-size: 12px; margin: 5px 0 0 0;">Installation en bon état - Surveillance normale recommandée</p>
          </div>`;
    }
    content += `</div>`;
      
    content += `</div>`; // Fin Section 3

    // Pied de page obligatoire
    content += `
        <div style="border-top: 3px solid #2563eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; background-color: #f8fafc; padding: 15px; border-radius: 8px;">
          <p style="margin: 5px 0; font-weight: bold; color: #2563eb;">📋 RAPPORT TECHNIQUE GÉNÉRÉ PAR ECO PUMP EXPERT</p>
          <p style="margin: 5px 0;">Date de génération : ${currentDate}</p>
          <p style="margin: 5px 0;">🔧 Sections obligatoires : Analyse Technique Détaillée + Diagnostic Mécanique + Actions Immédiates</p>
          <p style="margin: 5px 0; font-style: italic;">Document professionnel pour expertise installations de pompage</p>
        </div>
      </div>
    `;

    return content;
  };

  // ========================================================================================================
  // NOUVELLE FONCTION POUR AUDIT INTELLIGENT
  // ========================================================================================================
  const performIntelligentAudit = async () => {
    setLoadingAnalysis(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/audit-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(auditData)
      });

      if (response.ok) {
        const results = await response.json();
        setAuditResults(results);
      } else {
        console.error('Erreur lors de l\'audit:', response.statusText);
        // Fallback vers l'ancienne méthode si le backend n'est pas disponible
        const fallbackResults = generateFallbackAuditResults();
        setAuditResults(fallbackResults);
      }
    } catch (error) {
      console.error('Erreur lors de l\'audit:', error);
      // Fallback vers l'ancienne méthode
      const fallbackResults = generateFallbackAuditResults();
      setAuditResults(fallbackResults);
    }
    setLoadingAnalysis(false);
  };

  const generateFallbackAuditResults = () => {
    const hydraulicScore = calculateHydraulicScore();
    const energyScore = calculateEnergyScore();
    
    return {
      audit_id: 'LOCAL-' + Date.now().toString(36),
      audit_date: new Date().toLocaleString('fr-FR'),
      overall_score: Math.round((hydraulicScore + energyScore) / 2),
      hydraulic_score: hydraulicScore,
      electrical_score: energyScore,
      mechanical_score: calculateMechanicalScore(),
      operational_score: calculateOperationalScore(),
      performance_comparisons: generateSimpleComparisons(),
      diagnostics: generateSimpleDiagnostics(),
      recommendations: generateSimpleRecommendations(),
      executive_summary: generateSimpleExecutiveSummary(hydraulicScore, energyScore),
      economic_analysis: generateSimpleEconomicAnalysis(),
      action_plan: generateSimpleActionPlan()
    };
  };

  const calculateMechanicalScore = () => {
    let score = 100;
    if (auditData.vibration_level > 4.5) score -= 30;
    if (auditData.noise_level > 85) score -= 15;
    if (auditData.corrosion_level === 'severe') score -= 25;
    return Math.max(20, score);
  };

  const calculateOperationalScore = () => {
    let score = 100;
    if (auditData.performance_degradation) score -= 25;
    if (auditData.energy_consumption_increase) score -= 20;
    if (auditData.reported_issues.length > 2) score -= 15;
    return Math.max(30, score);
  };

  const generateSimpleComparisons = () => {
    const comparisons = [];
    
    if (auditData.current_flow_rate && auditData.required_flow_rate) {
      const deviation = ((auditData.current_flow_rate - auditData.required_flow_rate) / auditData.required_flow_rate) * 100;
      comparisons.push({
        parameter_name: "Débit",
        current_value: auditData.current_flow_rate,
        required_value: auditData.required_flow_rate,
        original_design_value: auditData.original_design_flow,
        deviation_from_required: deviation,
        status: Math.abs(deviation) <= 10 ? "optimal" : (Math.abs(deviation) <= 25 ? "acceptable" : "problematic"),
        interpretation: `Débit ${deviation > 0 ? 'supérieur' : 'inférieur'} de ${Math.abs(deviation).toFixed(1)}% vs requis`,
        impact: "Performance process, consommation énergétique"
      });
    }
    
    return comparisons;
  };

  const generateSimpleDiagnostics = () => {
    const diagnostics = [];
    
    if (auditData.performance_degradation) {
      diagnostics.push({
        category: "hydraulic",
        issue: "Dégradation des performances détectée",
        severity: "high",
        root_cause: "Usure ou encrassement des composants",
        symptoms: ["Débit réduit", "Pression insuffisante"],
        consequences: ["Productivité réduite", "Consommation excessive"],
        urgency: "short_term"
      });
    }
    
    return diagnostics;
  };

  const generateSimpleRecommendations = () => {
    const recommendations = [];
    
    if (auditData.performance_degradation) {
      recommendations.push({
        priority: "high",
        category: "maintenance",
        action: "Maintenance corrective immédiate",
        description: "Nettoyage et remplacement des pièces d'usure",
        technical_details: ["Inspection complète", "Nettoyage hydraulique", "Remplacement joints"],
        cost_estimate_min: 5000,
        cost_estimate_max: 15000,
        timeline: "1-2 semaines",
        expected_benefits: ["Restauration performances", "Réduction consommation"],
        roi_months: 12,
        risk_if_not_done: "Dégradation continue, pannes majeures"
      });
    }
    
    return recommendations;
  };

  const generateSimpleExecutiveSummary = (hydraulicScore, energyScore) => {
    const overallScore = Math.round((hydraulicScore + energyScore) / 2);
    return {
      overall_status: overallScore >= 75 ? "Bon" : (overallScore >= 60 ? "Acceptable" : "Problématique"),
      overall_score: overallScore,
      critical_issues_count: auditData.performance_degradation ? 1 : 0,
      high_issues_count: auditData.energy_consumption_increase ? 1 : 0,
      total_recommendations: 3,
      immediate_actions_required: auditData.performance_degradation || auditData.energy_consumption_increase,
      key_findings: ["Performance system", "État équipement", "Efficacité énergétique"]
    };
  };

  const generateSimpleEconomicAnalysis = () => {
    const annualHours = (auditData.operating_hours_daily || 8) * (auditData.operating_days_yearly || 300);
    const annualCost = (auditData.rated_power || 15) * annualHours * auditData.electricity_cost_per_kwh;
    
    return {
      current_annual_energy_cost: annualCost,
      total_investment_required: 25000,
      estimated_annual_savings: annualCost * 0.2,
      payback_period_years: 2.5,
      roi_5_years: 150,
      co2_reduction_tons_year: 5
    };
  };

  const generateSimpleActionPlan = () => {
    return {
      phase_1_immediate: {
        timeline: "0-3 mois",
        actions: ["Maintenance corrective", "Inspection complète"],
        investment: 10000
      },
      phase_2_short_term: {
        timeline: "3-12 mois", 
        actions: ["Optimisation énergétique", "Amélioration contrôle"],
        investment: 15000
      },
      total_program: {
        duration_months: 12,
        total_investment: 25000,
        expected_savings: 12000
      }
    };
  };

  // Handler pour mettre à jour les données d'audit
  const handleAuditInputChange = (field, value) => {
    setAuditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🔧 SYSTÈME D'AUDIT HYDRAULIQUE & ÉNERGÉTIQUE</h2>
        <p className="text-indigo-100">
          Analyses techniques approfondies pour optimisation performance et efficacité énergétique
        </p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>✅ Audit ISO 50001</div>
          <div>✅ Standards IEC 60034</div>
          <div>✅ Normes ASHRAE</div>
          <div>✅ Certification ENERGY STAR</div>
        </div>
      </div>

      {/* Navigation sous-onglets */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveAuditTab('hydraulic')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeAuditTab === 'hydraulic'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔧 Audit Hydraulique
            </button>
            <button
              onClick={() => setActiveAuditTab('energy')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeAuditTab === 'energy'
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ⚡ Audit Énergétique
            </button>
            <button
              onClick={() => setActiveAuditTab('results')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeAuditTab === 'results'
                  ? 'border-purple-500 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              disabled={!auditResults}
            >
              📊 Résultats & Recommandations
            </button>
          </nav>
        </div>

        {/* Contenu des sous-onglets */}
        <div className="p-6">
          {activeAuditTab === 'hydraulic' && (
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-gray-900">🏗️ Audit Terrain Professionnel</h3>
              
              {/* Rapport Journal Professionnel en Temps Réel - 3 SECTIONS */}
              {realTimeAnalysis && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-l-4 border-blue-500">
                  <h4 className="font-bold text-blue-900 mb-4">📋 RAPPORT JOURNAL TECHNIQUE PROFESSIONNEL - ANALYSE TEMPS RÉEL</h4>
                  
                  {/* Statut global */}
                  <div className={`mb-6 p-4 rounded-lg ${
                    realTimeAnalysis.overall_status === 'CRITIQUE' ? 'bg-red-100 border border-red-300' :
                    realTimeAnalysis.overall_status === 'DÉGRADÉ' ? 'bg-orange-100 border border-orange-300' :
                    realTimeAnalysis.overall_status === 'ACCEPTABLE' ? 'bg-yellow-100 border border-yellow-300' :
                    realTimeAnalysis.overall_status === 'BON' ? 'bg-blue-100 border border-blue-300' :
                    'bg-green-100 border border-green-300'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">État Installation: {realTimeAnalysis.overall_status}</span>
                      <div className="text-right text-sm">
                        {realTimeAnalysis.critical_count > 0 && <span className="bg-red-200 text-red-800 px-2 py-1 rounded mr-2">🚨 {realTimeAnalysis.critical_count} Critique(s)</span>}
                        {realTimeAnalysis.important_count > 0 && <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded">⚠️ {realTimeAnalysis.important_count} Important(s)</span>}
                      </div>
                    </div>
                  </div>

                  {/* ========================================================================================================
                      SECTION 1 : ANALYSE TECHNIQUE DÉTAILLÉE
                      ======================================================================================================== */}
                  <div className="mb-8 bg-white rounded-lg p-5 border border-blue-200">
                    <h5 className="font-bold text-blue-900 mb-4 text-lg">🔬 SECTION 1 : ANALYSE TECHNIQUE DÉTAILLÉE</h5>
                    
                    {/* Analyse Fluides et Température */}
                    {realTimeAnalysis.section1_technical_analysis.fluid_analysis.length > 0 && (
                      <div className="mb-4">
                        <h6 className="font-semibold text-blue-800 mb-3">🌡️ ANALYSE FLUIDE & TEMPÉRATURE</h6>
                        {realTimeAnalysis.section1_technical_analysis.fluid_analysis.map((analysis, idx) => (
                          <div key={idx} className={`mb-3 p-4 rounded-lg border-l-4 ${
                            analysis.severity === 'CRITIQUE' ? 'bg-red-50 border-red-400' :
                            analysis.severity === 'IMPORTANT' ? 'bg-orange-50 border-orange-400' :
                            'bg-yellow-50 border-yellow-400'
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-sm">{analysis.type}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                analysis.severity === 'CRITIQUE' ? 'bg-red-200 text-red-800' :
                                analysis.severity === 'IMPORTANT' ? 'bg-orange-200 text-orange-800' :
                                'bg-yellow-200 text-yellow-800'
                              }`}>
                                {analysis.severity}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 mb-2">{analysis.description}</p>
                            <p className="text-xs text-red-600 mb-2"><strong>Impact technique:</strong> {analysis.technical_impact}</p>
                            <p className="text-xs text-blue-600 mb-2"><strong>Équipements affectés:</strong> {analysis.equipment_affected?.join(', ')}</p>
                            <p className="text-xs text-green-600"><strong>Action corrective:</strong> {analysis.corrective_action}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Analyse Diamètres avec Logique Expert */}
                    {realTimeAnalysis.section1_technical_analysis.diameter_analysis.length > 0 && (
                      <div className="mb-4">
                        <h6 className="font-semibold text-blue-800 mb-3">📏 ANALYSE DIAMÈTRES & VITESSES (Logique Expert)</h6>
                        {realTimeAnalysis.section1_technical_analysis.diameter_analysis.map((analysis, idx) => (
                          <div key={idx} className={`mb-3 p-4 rounded-lg border-l-4 ${
                            analysis.severity === 'CRITIQUE' ? 'bg-red-50 border-red-400' :
                            analysis.severity === 'IMPORTANT' ? 'bg-orange-50 border-orange-400' :
                            'bg-yellow-50 border-yellow-400'
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-sm">{analysis.type}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                analysis.severity === 'CRITIQUE' ? 'bg-red-200 text-red-800' :
                                analysis.severity === 'IMPORTANT' ? 'bg-orange-200 text-orange-800' :
                                'bg-yellow-200 text-yellow-800'
                              }`}>
                                {analysis.severity}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 mb-2">{analysis.description}</p>
                            <p className="text-xs text-red-600 mb-2"><strong>Impact technique:</strong> {analysis.technical_impact}</p>
                            
                            {/* Recommandations diamètre */}
                            {analysis.diameter_recommendation && (
                              <div className="bg-cyan-50 p-3 rounded border border-cyan-200 mb-2">
                                <p className="text-xs font-semibold text-cyan-800 mb-1">Recommandation Diamètre:</p>
                                <p className="text-xs text-cyan-700">
                                  <strong>Actuel:</strong> {analysis.diameter_recommendation.current} → 
                                  <strong> Recommandé:</strong> {analysis.diameter_recommendation.recommended}
                                </p>
                                {analysis.diameter_recommendation.new_velocity && (
                                  <p className="text-xs text-cyan-700">
                                    <strong>Nouvelle vitesse:</strong> {analysis.diameter_recommendation.new_velocity}
                                  </p>
                                )}
                                {analysis.diameter_recommendation.pressure_gain && (
                                  <p className="text-xs text-green-600">
                                    <strong>Gain pression:</strong> {analysis.diameter_recommendation.pressure_gain}
                                  </p>
                                )}
                                {analysis.diameter_recommendation.energy_saving && (
                                  <p className="text-xs text-green-600">
                                    <strong>Économie:</strong> {analysis.diameter_recommendation.energy_saving}
                                  </p>
                                )}
                              </div>
                            )}
                            
                            <p className="text-xs text-green-600"><strong>Action corrective:</strong> {analysis.corrective_action}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Analyse Électrique Complète */}
                    {realTimeAnalysis.section1_technical_analysis.electrical_analysis.length > 0 && (
                      <div className="mb-4">
                        <h6 className="font-semibold text-blue-800 mb-3">⚡ ANALYSE ÉLECTRIQUE COMPLÈTE</h6>
                        {realTimeAnalysis.section1_technical_analysis.electrical_analysis.map((analysis, idx) => (
                          <div key={idx} className={`mb-3 p-4 rounded-lg border-l-4 ${
                            analysis.severity === 'CRITIQUE' ? 'bg-red-50 border-red-400' :
                            analysis.severity === 'IMPORTANT' ? 'bg-orange-50 border-orange-400' :
                            'bg-yellow-50 border-yellow-400'
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-sm">{analysis.type}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                analysis.severity === 'CRITIQUE' ? 'bg-red-200 text-red-800' :
                                analysis.severity === 'IMPORTANT' ? 'bg-orange-200 text-orange-800' :
                                'bg-yellow-200 text-yellow-800'
                              }`}>
                                {analysis.severity}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 mb-2">{analysis.description}</p>
                            <p className="text-xs text-red-600 mb-2"><strong>Impact technique:</strong> {analysis.technical_impact}</p>
                            <p className="text-xs text-blue-600 mb-2"><strong>Équipements affectés:</strong> {analysis.equipment_affected?.join(', ')}</p>
                            <p className="text-xs text-green-600"><strong>Action corrective:</strong> {analysis.corrective_action}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Calculs de Puissance Intelligents */}
                    {realTimeAnalysis.section1_technical_analysis.power_calculations && Object.keys(realTimeAnalysis.section1_technical_analysis.power_calculations).length > 0 && (
                      <div className="mb-4">
                        <h6 className="font-semibold text-blue-800 mb-3">🔢 CALCULS PUISSANCE (Mono/Triphasé)</h6>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div><strong>Configuration:</strong> {realTimeAnalysis.section1_technical_analysis.power_calculations.configuration}</div>
                            <div><strong>P calculée:</strong> {realTimeAnalysis.section1_technical_analysis.power_calculations.calculated_power} kW</div>
                            <div><strong>Courant/phase:</strong> {realTimeAnalysis.section1_technical_analysis.power_calculations.current_per_phase} A</div>
                            <div><strong>Cos φ:</strong> {realTimeAnalysis.section1_technical_analysis.power_calculations.power_factor}</div>
                            <div><strong>P réactive:</strong> {realTimeAnalysis.section1_technical_analysis.power_calculations.reactive_power} kVAR</div>
                            <div><strong>P apparente:</strong> {realTimeAnalysis.section1_technical_analysis.power_calculations.apparent_power} kVA</div>
                            <div className="col-span-2"><strong>P mesurée:</strong> {realTimeAnalysis.section1_technical_analysis.power_calculations.measured_power} kW</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ========================================================================================================
                      SECTION 2 : DIAGNOSTIC MÉCANIQUE COMPLET
                      ======================================================================================================== */}
                  <div className="mb-8 bg-white rounded-lg p-5 border border-orange-200">
                    <h5 className="font-bold text-orange-900 mb-4 text-lg">🔧 SECTION 2 : DIAGNOSTIC MÉCANIQUE COMPLET</h5>
                    
                    {/* Analyse Roulements */}
                    {realTimeAnalysis.section2_mechanical_diagnosis.bearing_analysis.length > 0 && (
                      <div className="mb-4">
                        <h6 className="font-semibold text-orange-800 mb-3">⚙️ ANALYSE ROULEMENTS</h6>
                        {realTimeAnalysis.section2_mechanical_diagnosis.bearing_analysis.map((analysis, idx) => (
                          <div key={idx} className={`mb-3 p-4 rounded-lg border-l-4 ${
                            analysis.severity === 'CRITIQUE' ? 'bg-red-50 border-red-400' :
                            analysis.severity === 'IMPORTANT' ? 'bg-orange-50 border-orange-400' :
                            'bg-green-50 border-green-400'
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-sm">{analysis.type}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                analysis.severity === 'CRITIQUE' ? 'bg-red-200 text-red-800' :
                                analysis.severity === 'IMPORTANT' ? 'bg-orange-200 text-orange-800' :
                                'bg-green-200 text-green-800'
                              }`}>
                                {analysis.severity}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div><strong>Niveau actuel:</strong> {analysis.current_level}</div>
                              <div><strong>État:</strong> {analysis.condition}</div>
                              <div><strong>Classification ISO:</strong> {analysis.iso_classification}</div>
                              <div><strong>Vie restante:</strong> {analysis.remaining_life}</div>
                            </div>
                            
                            {/* Détails techniques roulements */}
                            {analysis.technical_details && (
                              <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-2">
                                <p className="text-xs font-semibold text-gray-800 mb-1">Contrôles techniques:</p>
                                <p className="text-xs text-gray-700 mb-1">• {analysis.technical_details.frequency_analysis}</p>
                                <p className="text-xs text-gray-700 mb-1">• {analysis.technical_details.lubrication_check}</p>
                                <p className="text-xs text-gray-700">• {analysis.technical_details.alignment_check}</p>
                              </div>
                            )}
                            
                            <p className="text-xs text-green-600"><strong>Action corrective:</strong> {analysis.corrective_action}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Analyse Étanchéité */}
                    {realTimeAnalysis.section2_mechanical_diagnosis.seal_analysis.length > 0 && (
                      <div className="mb-4">
                        <h6 className="font-semibold text-orange-800 mb-3">💧 ANALYSE ÉTANCHÉITÉ & GARNITURES</h6>
                        {realTimeAnalysis.section2_mechanical_diagnosis.seal_analysis.map((analysis, idx) => (
                          <div key={idx} className="mb-3 p-4 rounded-lg border-l-4 bg-blue-50 border-blue-400">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-sm">{analysis.type}</span>
                              <span className="px-2 py-1 rounded text-xs bg-blue-200 text-blue-800">{analysis.severity}</span>
                            </div>
                            <p className="text-xs text-gray-700 mb-2">{analysis.description}</p>
                            <p className="text-xs text-red-600 mb-2"><strong>Impact technique:</strong> {analysis.technical_impact}</p>
                            
                            {/* Diagnostic garniture détaillé */}
                            {analysis.seal_diagnosis && (
                              <div className="bg-white p-3 rounded border border-blue-200 mb-2">
                                <p className="text-xs font-semibold text-blue-800 mb-1">Causes possibles:</p>
                                <ul className="text-xs text-blue-700 mb-2">
                                  {analysis.seal_diagnosis.possible_causes?.map((cause, idx) => (
                                    <li key={idx}>• {cause}</li>
                                  ))}
                                </ul>
                                <p className="text-xs font-semibold text-blue-800 mb-1">Points d'inspection:</p>
                                <ul className="text-xs text-blue-700">
                                  {analysis.seal_diagnosis.inspection_points?.map((point, idx) => (
                                    <li key={idx}>• {point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <p className="text-xs text-green-600"><strong>Action corrective:</strong> {analysis.corrective_action}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Analyse Marche à Sec */}
                    {realTimeAnalysis.section2_mechanical_diagnosis.dry_run_analysis.length > 0 && (
                      <div className="mb-4">
                        <h6 className="font-semibold text-orange-800 mb-3">🔥 ANALYSE MARCHE À SEC</h6>
                        {realTimeAnalysis.section2_mechanical_diagnosis.dry_run_analysis.map((analysis, idx) => (
                          <div key={idx} className="mb-3 p-4 rounded-lg border-l-4 bg-red-50 border-red-400">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-sm">{analysis.type}</span>
                              <span className="px-2 py-1 rounded text-xs bg-red-200 text-red-800">{analysis.severity}</span>
                            </div>
                            <p className="text-xs text-gray-700 mb-2">{analysis.description}</p>
                            <p className="text-xs text-red-600 mb-2"><strong>Impact technique:</strong> {analysis.technical_impact}</p>
                            
                            {/* Mesures de protection */}
                            {analysis.protection_measures && (
                              <div className="bg-white p-3 rounded border border-red-200 mb-2">
                                <p className="text-xs font-semibold text-red-800 mb-1">Protection actuelle: {analysis.protection_measures.current}</p>
                                <p className="text-xs font-semibold text-red-800 mb-1">Protections recommandées:</p>
                                <ul className="text-xs text-red-700">
                                  {analysis.protection_measures.recommended?.map((protection, idx) => (
                                    <li key={idx}>• {protection}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Vérifications immédiates */}
                            {analysis.immediate_verification && (
                              <div className="bg-yellow-50 p-3 rounded border border-yellow-200 mb-2">
                                <p className="text-xs font-semibold text-yellow-800 mb-1">Vérifications immédiates:</p>
                                <ul className="text-xs text-yellow-700">
                                  {analysis.immediate_verification.map((check, idx) => (
                                    <li key={idx}>• {check}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <p className="text-xs text-green-600"><strong>Action corrective:</strong> {analysis.corrective_action}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Analyse Bruit Moteur */}
                    {realTimeAnalysis.section2_mechanical_diagnosis.noise_analysis.length > 0 && (
                      <div className="mb-4">
                        <h6 className="font-semibold text-orange-800 mb-3">🔊 ANALYSE BRUIT MOTEUR</h6>
                        {realTimeAnalysis.section2_mechanical_diagnosis.noise_analysis.map((analysis, idx) => (
                          <div key={idx} className={`mb-3 p-4 rounded-lg border-l-4 ${
                            analysis.severity === 'CRITIQUE' ? 'bg-red-50 border-red-400' :
                            'bg-orange-50 border-orange-400'
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-sm">{analysis.type}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                analysis.severity === 'CRITIQUE' ? 'bg-red-200 text-red-800' :
                                'bg-orange-200 text-orange-800'
                              }`}>
                                {analysis.severity}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div><strong>Niveau mesuré:</strong> {analysis.measured_level}</div>
                              <div><strong>Limite:</strong> {analysis.limit}</div>
                            </div>
                            
                            {/* Sources de bruit */}
                            {analysis.noise_source_analysis && (
                              <div className="bg-white p-3 rounded border border-orange-200 mb-2">
                                <p className="text-xs font-semibold text-orange-800 mb-1">Sources mécaniques:</p>
                                <ul className="text-xs text-orange-700 mb-2">
                                  {analysis.noise_source_analysis.mechanical_sources?.map((source, idx) => (
                                    <li key={idx}>• {source}</li>
                                  ))}
                                </ul>
                                <p className="text-xs font-semibold text-orange-800 mb-1">Sources hydrauliques:</p>
                                <ul className="text-xs text-orange-700 mb-2">
                                  {analysis.noise_source_analysis.hydraulic_sources?.map((source, idx) => (
                                    <li key={idx}>• {source}</li>
                                  ))}
                                </ul>
                                <p className="text-xs font-semibold text-orange-800 mb-1">Sources électriques:</p>
                                <ul className="text-xs text-orange-700">
                                  {analysis.noise_source_analysis.electrical_sources?.map((source, idx) => (
                                    <li key={idx}>• {source}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Méthodes de diagnostic */}
                            {analysis.diagnostic_method && (
                              <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-2">
                                <p className="text-xs font-semibold text-gray-800 mb-1">Méthodes diagnostic:</p>
                                <p className="text-xs text-gray-700 mb-1">• {analysis.diagnostic_method.frequency_analysis}</p>
                                <p className="text-xs text-gray-700 mb-1">• {analysis.diagnostic_method.location_mapping}</p>
                                <p className="text-xs text-gray-700">• {analysis.diagnostic_method.load_correlation}</p>
                              </div>
                            )}
                            
                            <p className="text-xs text-green-600"><strong>Action corrective:</strong> {analysis.corrective_action}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ========================================================================================================
                      SECTION 3 : ACTIONS CORRECTIVES DÉTAILLÉES POUR TECHNICIENS
                      ======================================================================================================== */}
                  <div className="mb-8 bg-white rounded-lg p-5 border border-green-200">
                    <h5 className="font-bold text-green-900 mb-4 text-lg">👷 SECTION 3 : ACTIONS CORRECTIVES DÉTAILLÉES TECHNICIENS</h5>
                    
                    {/* Actions Immédiates */}
                    {realTimeAnalysis.section3_corrective_actions.immediate_actions.length > 0 && (
                      <div className="mb-6">
                        <h6 className="font-semibold text-red-800 mb-3">🚨 ACTIONS IMMÉDIATES (0-24h)</h6>
                        {realTimeAnalysis.section3_corrective_actions.immediate_actions.map((action, idx) => (
                          action.condition && (
                            <div key={idx} className="bg-red-50 p-4 rounded-lg border border-red-200 mb-3">
                              <h7 className="font-semibold text-red-800 mb-2 block">Priorité: {action.priority}</h7>
                              <div className="space-y-1">
                                {action.checklist?.map((item, checkIdx) => (
                                  <div key={checkIdx} className="flex items-start">
                                    <span className="text-xs text-red-700 mr-2">□</span>
                                    <span className="text-xs text-red-700">{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    )}

                    {/* Actions Préventives avec section déroulante */}
                    {realTimeAnalysis.section3_corrective_actions.preventive_actions.length > 0 && (
                      <div className="mb-6">
                        <div 
                          className="flex items-center justify-between cursor-pointer bg-orange-100 hover:bg-orange-200 p-3 rounded-lg border border-orange-300 transition-colors"
                          onClick={() => toggleSection('actions_preventives')}
                        >
                          <h6 className="font-semibold text-orange-800 flex items-center">
                            <span className="mr-2">🔧</span>
                            ACTIONS PRÉVENTIVES (1-7 jours)
                          </h6>
                          <svg 
                            className={`w-5 h-5 text-orange-800 transform transition-transform ${expandedSections.actions_preventives ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        
                        {expandedSections.actions_preventives && (
                          <div className="mt-3 space-y-3">
                            {realTimeAnalysis.section3_corrective_actions.preventive_actions.map((category, idx) => (
                              <div key={idx} className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <h7 className="font-semibold text-orange-800 mb-2 block">{category.category}</h7>
                                <div className="space-y-1">
                                  {category.tasks?.map((task, taskIdx) => (
                                    <div key={taskIdx} className="flex items-start">
                                      <span className="text-xs text-orange-700 mr-2">□</span>
                                      <span className="text-xs text-orange-700">{task}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Modifications Équipements */}
                    {realTimeAnalysis.section3_corrective_actions.equipment_modifications.length > 0 && (
                      <div className="mb-6">
                        <h6 className="font-semibold text-blue-800 mb-3">🔄 MODIFICATIONS ÉQUIPEMENTS</h6>
                        {realTimeAnalysis.section3_corrective_actions.equipment_modifications.map((mod, idx) => (
                          <div key={idx} className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-3">
                            <div className="flex justify-between items-start mb-2">
                              <h7 className="font-semibold text-blue-800">{mod.equipment}</h7>
                              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">{mod.type}</span>
                            </div>
                            <p className="text-xs text-blue-700 mb-2"><strong>Justification:</strong> {mod.justification}</p>
                            <p className="text-xs text-blue-700 mb-2"><strong>Spécification:</strong> {mod.specification}</p>
                            <p className="text-xs text-blue-700 mb-2"><strong>Installation:</strong> {mod.installation}</p>
                            <p className="text-xs text-green-600"><strong>Coût estimé:</strong> {mod.cost_estimate}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Planning Maintenance avec section déroulante */}
                    {realTimeAnalysis.section3_corrective_actions.maintenance_schedule.length > 0 && (
                      <div className="mb-6">
                        <div 
                          className="flex items-center justify-between cursor-pointer bg-green-100 hover:bg-green-200 p-3 rounded-lg border border-green-300 transition-colors"
                          onClick={() => toggleSection('planning_maintenance')}
                        >
                          <h6 className="font-semibold text-green-800 flex items-center">
                            <span className="mr-2">📅</span>
                            PLANNING MAINTENANCE
                          </h6>
                          <svg 
                            className={`w-5 h-5 text-green-800 transform transition-transform ${expandedSections.planning_maintenance ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        
                        {expandedSections.planning_maintenance && (
                          <div className="mt-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {realTimeAnalysis.section3_corrective_actions.maintenance_schedule.map((schedule, idx) => (
                                <div key={idx} className="bg-green-50 p-3 rounded-lg border border-green-200">
                                  <h8 className="font-semibold text-green-800 text-sm mb-2 block">{schedule.frequency}</h8>
                                  <div className="space-y-1">
                                    {schedule.tasks?.map((task, taskIdx) => (
                                      <div key={taskIdx} className="text-xs text-green-700">• {task}</div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message si installation excellente */}
                  {realTimeAnalysis.overall_status === 'EXCELLENT' && (
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
                      <span className="text-green-700 font-medium text-lg">✅ Installation en excellent état - Surveillance normale recommandée</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Section 1: Données Installation - Contexte */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">🏭 Installation et Contexte</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Âge installation (années)</label>
                    <input
                      type="number"
                      value={auditData.installation_age}
                      onChange={(e) => handleAuditInputChange('installation_age', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type installation</label>
                    <select
                      value={auditData.installation_type}
                      onChange={(e) => handleAuditInputChange('installation_type', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="surface">Pompe de surface</option>
                      <option value="submersible">Pompe immergée</option>
                      <option value="inline">Pompe en ligne</option>
                      <option value="booster">Station de reprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de fluide</label>
                    <select
                      value={auditData.fluid_type}
                      onChange={(e) => handleAuditInputChange('fluid_type', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="water">Eau claire</option>
                      <option value="seawater">Eau de mer</option>
                      <option value="wastewater">Eaux usées</option>
                      <option value="acid">Acide</option>
                      <option value="base">Base</option>
                      <option value="milk">Lait</option>
                      <option value="wine">Vin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Température fluide (°C)</label>
                    <input
                      type="number"
                      value={auditData.fluid_temperature}
                      onChange={(e) => handleAuditInputChange('fluid_temperature', parseFloat(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="20"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Performances Hydrauliques - COMPARAISON CRITIQUE */}
              <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
                <h4 className="font-semibold text-red-800 mb-4">📊 PERFORMANCES HYDRAULIQUES - Comparaison Critique</h4>
                <div className="text-sm text-red-600 mb-4 font-medium">
                  ⚠️ Renseigner les valeurs ACTUELLES vs REQUISES vs CONCEPTION pour diagnostic précis
                </div>
                
                {/* Comparaison Débit */}
                <div className="mb-6">
                  <h5 className="font-medium text-gray-900 mb-3">💧 DÉBIT (m³/h)</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded border">
                      <label className="block text-sm font-medium text-green-700 mb-1">Débit ACTUEL mesuré</label>
                      <input
                        type="number"
                        value={auditData.current_flow_rate}
                        onChange={(e) => handleAuditInputChange('current_flow_rate', parseFloat(e.target.value))}
                        className="w-full p-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500"
                        placeholder="Ex: 45"
                      />
                      <div className="text-xs text-green-600 mt-1">Mesure terrain réelle</div>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <label className="block text-sm font-medium text-blue-700 mb-1">Débit REQUIS process</label>
                      <input
                        type="number"
                        value={auditData.required_flow_rate}
                        onChange={(e) => handleAuditInputChange('required_flow_rate', parseFloat(e.target.value))}
                        className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 60"
                      />
                      <div className="text-xs text-blue-600 mt-1">Besoin process réel</div>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <label className="block text-sm font-medium text-purple-700 mb-1">Débit CONCEPTION origine</label>
                      <input
                        type="number"
                        value={auditData.original_design_flow}
                        onChange={(e) => handleAuditInputChange('original_design_flow', parseFloat(e.target.value))}
                        className="w-full p-2 border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: 65"
                      />
                      <div className="text-xs text-purple-600 mt-1">Spécifications initiales</div>
                    </div>
                  </div>
                </div>

                {/* Comparaison HMT */}
                <div className="mb-6">
                  <h5 className="font-medium text-gray-900 mb-3">⬆️ HMT (m)</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded border">
                      <label className="block text-sm font-medium text-green-700 mb-1">HMT ACTUELLE mesurée</label>
                      <input
                        type="number"
                        value={auditData.current_hmt}
                        onChange={(e) => handleAuditInputChange('current_hmt', parseFloat(e.target.value))}
                        className="w-full p-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500"
                        placeholder="Ex: 35"
                      />
                      <div className="text-xs text-green-600 mt-1">Pression mesurée terrain</div>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <label className="block text-sm font-medium text-blue-700 mb-1">HMT REQUISE process</label>
                      <input
                        type="number"
                        value={auditData.required_hmt}
                        onChange={(e) => handleAuditInputChange('required_hmt', parseFloat(e.target.value))}
                        className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 25"
                      />
                      <div className="text-xs text-blue-600 mt-1">Besoin pression process</div>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <label className="block text-sm font-medium text-purple-700 mb-1">HMT CONCEPTION origine</label>
                      <input
                        type="number"
                        value={auditData.original_design_hmt}
                        onChange={(e) => handleAuditInputChange('original_design_hmt', parseFloat(e.target.value))}
                        className="w-full p-2 border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: 30"
                      />
                      <div className="text-xs text-purple-600 mt-1">Spécifications initiales</div>
                    </div>
                  </div>
                </div>

                {/* Pressions mesurées terrain */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">🌡️ PRESSIONS MESURÉES TERRAIN</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded border">
                      <label className="block text-sm font-medium text-blue-700 mb-1">Pression aspiration (bar)</label>
                      <input
                        type="number"
                        value={auditData.suction_pressure}
                        onChange={(e) => handleAuditInputChange('suction_pressure', parseFloat(e.target.value))}
                        className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: -0.2"
                        step="0.1"
                      />
                      <div className="text-xs text-blue-600 mt-1">Manomètre aspiration</div>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <label className="block text-sm font-medium text-red-700 mb-1">Pression refoulement (bar)</label>
                      <input
                        type="number"
                        value={auditData.discharge_pressure}
                        onChange={(e) => handleAuditInputChange('discharge_pressure', parseFloat(e.target.value))}
                        className="w-full p-2 border border-red-300 rounded-md focus:ring-2 focus:ring-red-500"
                        placeholder="Ex: 3.5"
                        step="0.1"
                      />
                      <div className="text-xs text-red-600 mt-1">Manomètre refoulement</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Performances Électriques - COMPARAISON MESURES vs PLAQUE */}
              <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-4">⚡ PERFORMANCES ÉLECTRIQUES - Mesures vs Plaque Moteur</h4>
                
                {/* Comparaison Intensité */}
                <div className="mb-6">
                  <h5 className="font-medium text-gray-900 mb-3">🔌 INTENSITÉ (A)</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded border">
                      <label className="block text-sm font-medium text-green-700 mb-1">Intensité MESURÉE</label>
                      <input
                        type="number"
                        value={auditData.measured_current}
                        onChange={(e) => handleAuditInputChange('measured_current', parseFloat(e.target.value))}
                        className="w-full p-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500"
                        placeholder="Ex: 28"
                        step="0.1"
                      />
                      <div className="text-xs text-green-600 mt-1">Ampèremètre terrain</div>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <label className="block text-sm font-medium text-blue-700 mb-1">Intensité PLAQUE moteur</label>
                      <input
                        type="number"
                        value={auditData.rated_current}
                        onChange={(e) => handleAuditInputChange('rated_current', parseFloat(e.target.value))}
                        className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 22"
                        step="0.1"
                      />
                      <div className="text-xs text-blue-600 mt-1">Valeur nominale constructeur</div>
                    </div>
                  </div>
                </div>

                {/* Comparaison Puissance */}
                <div className="mb-6">
                  <h5 className="font-medium text-gray-900 mb-3">🔋 PUISSANCE (kW)</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded border">
                      <label className="block text-sm font-medium text-green-700 mb-1">Puissance ABSORBÉE mesurée</label>
                      <input
                        type="number"
                        value={auditData.measured_power}
                        onChange={(e) => handleAuditInputChange('measured_power', parseFloat(e.target.value))}
                        className="w-full p-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500"
                        placeholder="Ex: 18"
                        step="0.1"
                      />
                      <div className="text-xs text-green-600 mt-1">Wattmètre terrain</div>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <label className="block text-sm font-medium text-blue-700 mb-1">Puissance PLAQUE moteur</label>
                      <input
                        type="number"
                        value={auditData.rated_power}
                        onChange={(e) => handleAuditInputChange('rated_power', parseFloat(e.target.value))}
                        className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 15"
                        step="0.1"
                      />
                      <div className="text-xs text-blue-600 mt-1">Puissance nominale constructeur</div>
                    </div>
                  </div>
                </div>

                {/* Autres mesures électriques */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">📏 AUTRES MESURES ÉLECTRIQUES</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded border">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tension mesurée (V)</label>
                      <input
                        type="number"
                        value={auditData.measured_voltage}
                        onChange={(e) => handleAuditInputChange('measured_voltage', parseFloat(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500"
                        placeholder="Ex: 395"
                      />
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cos φ mesuré</label>
                      <input
                        type="number"
                        value={auditData.measured_power_factor}
                        onChange={(e) => handleAuditInputChange('measured_power_factor', parseFloat(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500"
                        placeholder="Ex: 0.82"
                        step="0.01"
                        min="0"
                        max="1"
                      />
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tension nominale (V)</label>
                      <input
                        type="number"
                        value={auditData.rated_voltage}
                        onChange={(e) => handleAuditInputChange('rated_voltage', parseFloat(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500"
                        placeholder="400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: État Mécanique - Observations Terrain */}
              <div className="bg-orange-50 rounded-lg p-6">
                <h4 className="font-semibold text-orange-800 mb-4">🔧 ÉTAT MÉCANIQUE - Observations Terrain</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vibrations mesurées (mm/s)</label>
                    <input
                      type="number"
                      value={auditData.vibration_level}
                      onChange={(e) => handleAuditInputChange('vibration_level', parseFloat(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                      placeholder="Ex: 2.8"
                      step="0.1"
                    />
                    <div className="text-xs text-gray-500 mt-1">Norme: &lt;2.8 mm/s</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bruit mesuré (dB(A))</label>
                    <input
                      type="number"
                      value={auditData.noise_level}
                      onChange={(e) => handleAuditInputChange('noise_level', parseFloat(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                      placeholder="Ex: 75"
                    />
                    <div className="text-xs text-gray-500 mt-1">Limite: 85 dB(A)</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temp. moteur (°C)</label>
                    <input
                      type="number"
                      value={auditData.motor_temperature}
                      onChange={(e) => handleAuditInputChange('motor_temperature', parseFloat(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                      placeholder="Ex: 65"
                    />
                    <div className="text-xs text-gray-500 mt-1">Max: 80°C</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temp. paliers (°C)</label>
                    <input
                      type="number"
                      value={auditData.bearing_temperature}
                      onChange={(e) => handleAuditInputChange('bearing_temperature', parseFloat(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                      placeholder="Ex: 55"
                    />
                    <div className="text-xs text-gray-500 mt-1">Max: 70°C</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Niveau de corrosion</label>
                    <select
                      value={auditData.corrosion_level}
                      onChange={(e) => handleAuditInputChange('corrosion_level', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="none">Aucune corrosion visible</option>
                      <option value="light">Corrosion légère</option>
                      <option value="moderate">Corrosion modérée</option>
                      <option value="severe">Corrosion sévère</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">État alignement</label>
                    <select
                      value={auditData.alignment_status}
                      onChange={(e) => handleAuditInputChange('alignment_status', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Bon</option>
                      <option value="fair">Acceptable</option>
                      <option value="poor">Mauvais</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition accouplement</label>
                    <select
                      value={auditData.coupling_condition}
                      onChange={(e) => handleAuditInputChange('coupling_condition', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Bon</option>
                      <option value="fair">Acceptable</option>
                      <option value="poor">Mauvais</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={auditData.leakage_present}
                      onChange={(e) => handleAuditInputChange('leakage_present', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Fuites détectées</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={auditData.performance_degradation}
                      onChange={(e) => handleAuditInputChange('performance_degradation', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Dégradation des performances</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={auditData.energy_consumption_increase}
                      onChange={(e) => handleAuditInputChange('energy_consumption_increase', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Augmentation consommation</span>
                  </label>
                </div>
              </div>

              {/* Section 5: Contexte Exploitation */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h4 className="font-semibold text-purple-800 mb-4">📊 CONTEXTE EXPLOITATION & MAINTENANCE</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heures/jour</label>
                    <input
                      type="number"
                      value={auditData.operating_hours_daily}
                      onChange={(e) => handleAuditInputChange('operating_hours_daily', parseFloat(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: 16"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jours/an</label>
                    <input
                      type="number"
                      value={auditData.operating_days_yearly}
                      onChange={(e) => handleAuditInputChange('operating_days_yearly', parseFloat(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: 300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coût kWh (€)</label>
                    <input
                      type="number"
                      value={auditData.electricity_cost_per_kwh}
                      onChange={(e) => handleAuditInputChange('electricity_cost_per_kwh', parseFloat(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                      placeholder="0.12"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance</label>
                    <select
                      value={auditData.maintenance_frequency}
                      onChange={(e) => handleAuditInputChange('maintenance_frequency', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="weekly">Hebdomadaire</option>
                      <option value="monthly">Mensuelle</option>
                      <option value="quarterly">Trimestrielle</option>
                      <option value="annual">Annuelle</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bouton Analyse */}
              <div className="text-center">
                <button
                  onClick={performExpertAuditAnalysis}
                  disabled={loadingAnalysis}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50"
                >
                  {loadingAnalysis ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⚙️</span>
                      Analyse experte en cours...
                    </>
                  ) : (
                    <>
                      🎯 Lancer l'Audit Expert Terrain
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeAuditTab === 'energy' && (
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-gray-900">⚡ Audit Énergétique Approfondi</h3>
              
              {/* Section 1: Tarification électrique */}
              <div className="bg-green-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">💰 Structure Tarifaire Électrique</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarif moyen (FCFA/kWh)</label>
                    <input
                      type="number"
                      value={auditData.electricity_tariff}
                      onChange={(e) => handleAuditInputChange('electricity_tariff', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="96"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heures pleines (FCFA/kWh)</label>
                    <input
                      type="number"
                      value={auditData.peak_hours_tariff}
                      onChange={(e) => handleAuditInputChange('peak_hours_tariff', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="150"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heures creuses (FCFA/kWh)</label>
                    <input
                      type="number"
                      value={auditData.off_peak_tariff}
                      onChange={(e) => handleAuditInputChange('off_peak_tariff', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="75"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prime puissance (FCFA/kW/mois)</label>
                    <input
                      type="number"
                      value={auditData.demand_charge}
                      onChange={(e) => handleAuditInputChange('demand_charge', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="8000"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Mesures énergétiques */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">📊 Mesures Énergétiques Actuelles</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consommation mesurée (kW)</label>
                    <input
                      type="number"
                      value={auditData.power_consumption_measured}
                      onChange={(e) => handleAuditInputChange('power_consumption_measured', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: 8.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facteur de puissance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={auditData.power_factor_measured}
                      onChange={(e) => handleAuditInputChange('power_factor_measured', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: 0.85"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consommation mensuelle (kWh)</label>
                    <input
                      type="number"
                      value={auditData.energy_monthly_kwh}
                      onChange={(e) => handleAuditInputChange('energy_monthly_kwh', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: 1200"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Équipements de contrôle */}
              <div className="bg-indigo-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">🎛️ Équipements de Contrôle et Automation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Système de contrôle</label>
                    <select
                      value={auditData.control_system}
                      onChange={(e) => handleAuditInputChange('control_system', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    >
                      {controlSystems.map(system => (
                        <option key={system.value} value={system.value}>{system.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Niveau automation</label>
                    <select
                      value={auditData.automation_level}
                      onChange={(e) => handleAuditInputChange('automation_level', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="manual">Manuel</option>
                      <option value="basic">Basique (ON/OFF)</option>
                      <option value="intermediate">Intermédiaire (Seuils)</option>
                      <option value="advanced">Avancé (PID, IoT)</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={auditData.variable_frequency_drive}
                      onChange={(e) => handleAuditInputChange('variable_frequency_drive', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Variateur fréquence</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={auditData.soft_starter}
                      onChange={(e) => handleAuditInputChange('soft_starter', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Démarreur progressif</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={auditData.pressure_tank}
                      onChange={(e) => handleAuditInputChange('pressure_tank', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Ballon surpresseur</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeAuditTab === 'results' && auditResults && (
            <div className="space-y-8">
              {/* Bouton Export PDF et En-tête */}
              <div className="flex justify-between items-center bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">📊 Résultats d'Audit Expert et Recommandations</h3>
                  <p className="text-sm text-gray-600 mt-1">Rapport d'audit complet et actions correctives</p>
                </div>
                <button
                  onClick={exportAuditReportToPDF}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 flex items-center space-x-2"
                  title="Exporter le rapport d'audit en PDF"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Exporter PDF</span>
                </button>
              </div>
              
              {/* En-tête du rapport */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-2xl font-bold mb-2">Rapport d'Audit #{auditResults.audit_id}</h4>
                    <p className="text-blue-100">{auditResults.audit_date}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{auditResults.overall_score}/100</div>
                    <div className="text-lg">{auditResults.executive_summary?.overall_status || 'Score Global'}</div>
                  </div>
                </div>
              </div>

              {/* Scores détaillés par catégorie */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border-2 border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{auditResults.hydraulic_score}/100</div>
                  <div className="text-sm font-medium text-gray-900">Hydraulique</div>
                  <div className="text-xs text-gray-600 mt-1">Débit, HMT, Pertes</div>
                </div>
                <div className="bg-white border-2 border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">{auditResults.electrical_score}/100</div>
                  <div className="text-sm font-medium text-gray-900">Électrique</div>
                  <div className="text-xs text-gray-600 mt-1">Intensité, Puissance</div>
                </div>
                <div className="bg-white border-2 border-orange-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">{auditResults.mechanical_score}/100</div>
                  <div className="text-sm font-medium text-gray-900">Mécanique</div>
                  <div className="text-xs text-gray-600 mt-1">Vibrations, Température</div>
                </div>
                <div className="bg-white border-2 border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">{auditResults.operational_score}/100</div>
                  <div className="text-sm font-medium text-gray-900">Exploitation</div>
                  <div className="text-xs text-gray-600 mt-1">Maintenance, Fiabilité</div>
                </div>
              </div>

              {/* Synthèse Executive */}
              {auditResults.executive_summary && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-bold text-gray-900 mb-4">📋 Synthèse Executive</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded border">
                      <div className="font-semibold text-red-600">Issues Critiques</div>
                      <div className="text-2xl font-bold text-red-800">{auditResults.executive_summary.critical_issues_count}</div>
                      <div className="text-xs text-gray-600">Actions immédiates requises</div>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <div className="font-semibold text-orange-600">Issues Importantes</div>
                      <div className="text-2xl font-bold text-orange-800">{auditResults.executive_summary.high_issues_count}</div>
                      <div className="text-xs text-gray-600">À traiter court terme</div>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <div className="font-semibold text-blue-600">Recommandations</div>
                      <div className="text-2xl font-bold text-blue-800">{auditResults.executive_summary.total_recommendations}</div>
                      <div className="text-xs text-gray-600">Actions d'amélioration</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comparaisons Performance */}
              {auditResults.performance_comparisons && auditResults.performance_comparisons.length > 0 && (
                <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                  <h4 className="font-bold text-red-800 mb-4">⚡ Analyse Comparative des Performances</h4>
                  <div className="space-y-4">
                    {auditResults.performance_comparisons.map((comparison, index) => (
                      <div key={index} className={`bg-white p-4 rounded border-l-4 ${
                        comparison.status === 'optimal' ? 'border-green-400' :
                        comparison.status === 'acceptable' ? 'border-yellow-400' : 'border-red-400'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-gray-900">{comparison.parameter_name}</div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            comparison.status === 'optimal' ? 'bg-green-100 text-green-800' :
                            comparison.status === 'acceptable' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {comparison.status.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 mb-2">{comparison.interpretation}</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                          {comparison.current_value && (
                            <div className="text-green-600">Actuel: {comparison.current_value}</div>
                          )}
                          {comparison.required_value && (
                            <div className="text-blue-600">Requis: {comparison.required_value}</div>
                          )}
                          {comparison.deviation_from_required && (
                            <div className="text-red-600">Écart: {comparison.deviation_from_required.toFixed(1)}%</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnostics */}
              {auditResults.diagnostics && auditResults.diagnostics.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                  <h4 className="font-bold text-orange-800 mb-4">🔍 Diagnostics Experts</h4>
                  <div className="space-y-4">
                    {auditResults.diagnostics.map((diagnostic, index) => (
                      <div key={index} className={`bg-white p-4 rounded border-l-4 ${
                        diagnostic.severity === 'critical' ? 'border-red-500' :
                        diagnostic.severity === 'high' ? 'border-orange-500' :
                        diagnostic.severity === 'medium' ? 'border-yellow-500' : 'border-blue-500'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-gray-900">{diagnostic.issue}</div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            diagnostic.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            diagnostic.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            diagnostic.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {diagnostic.severity.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 mb-2">
                          <strong>Cause racine:</strong> {diagnostic.root_cause}
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Urgence:</strong> {diagnostic.urgency}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommandations Priorisées */}
              {auditResults.recommendations && auditResults.recommendations.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-4">💡 Recommandations Priorisées</h4>
                  <div className="space-y-4">
                    {auditResults.recommendations.map((recommendation, index) => (
                      <div key={index} className={`bg-white p-4 rounded border-l-4 ${
                        recommendation.priority === 'critical' ? 'border-red-500' :
                        recommendation.priority === 'high' ? 'border-orange-500' :
                        recommendation.priority === 'medium' ? 'border-yellow-500' : 'border-green-500'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-gray-900">{recommendation.action}</div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            recommendation.priority === 'critical' ? 'bg-red-100 text-red-800' :
                            recommendation.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {recommendation.priority.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 mb-3">{recommendation.description}</div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div>
                            <div className="font-medium text-gray-700">Coût estimé</div>
                            <div className="text-green-600">{recommendation.cost_estimate_min.toLocaleString()}€ - {recommendation.cost_estimate_max.toLocaleString()}€</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">Délai</div>
                            <div className="text-blue-600">{recommendation.timeline}</div>
                          </div>
                          {recommendation.roi_months && (
                            <div>
                              <div className="font-medium text-gray-700">ROI</div>
                              <div className="text-purple-600">{recommendation.roi_months} mois</div>
                            </div>
                          )}
                        </div>

                        {recommendation.expected_benefits && recommendation.expected_benefits.length > 0 && (
                          <div className="mt-3">
                            <div className="font-medium text-gray-700 text-xs mb-1">Bénéfices attendus:</div>
                            <div className="text-xs text-gray-600">
                              {recommendation.expected_benefits.join(' • ')}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analyse Économique */}
              {auditResults.economic_analysis && (
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h4 className="font-bold text-green-800 mb-4">💰 Analyse Économique</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded border">
                      <div className="font-semibold text-green-700">Coût Énergétique Actuel</div>
                      <div className="text-xl font-bold text-green-800">
                        {auditResults.economic_analysis.current_annual_energy_cost.toLocaleString()}€/an
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <div className="font-semibold text-blue-700">Investissement Total</div>
                      <div className="text-xl font-bold text-blue-800">
                        {auditResults.economic_analysis.total_investment_required.toLocaleString()}€
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <div className="font-semibold text-purple-700">Retour Investissement</div>
                      <div className="text-xl font-bold text-purple-800">
                        {auditResults.economic_analysis.payback_period_years.toFixed(1)} ans
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-white p-4 rounded border">
                    <div className="font-semibold text-gray-700 mb-2">Économies Potentielles</div>
                    <div className="text-lg text-green-600 font-bold">
                      {auditResults.economic_analysis.estimated_annual_savings.toLocaleString()}€/an
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      ROI 5 ans: {auditResults.economic_analysis.roi_5_years?.toFixed(0)}%
                    </div>
                  </div>
                </div>
              )}

              {/* Rapport d'Expertise Exhaustif */}
              {auditResults.expert_installation_report && (
                <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                  <h4 className="font-bold text-red-800 mb-4">🔧 RAPPORT D'EXPERTISE TECHNIQUE COMPLET</h4>
                  
                  {/* État global de l'installation */}
                  <div className={`mb-6 p-4 rounded-lg border-2 ${
                    auditResults.expert_installation_report.installation_analysis?.overall_condition === 'CRITIQUE' 
                      ? 'bg-red-100 border-red-400' 
                      : auditResults.expert_installation_report.installation_analysis?.overall_condition === 'DÉGRADÉE'
                      ? 'bg-orange-100 border-orange-400'
                      : 'bg-green-100 border-green-400'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-bold text-lg">État de l'Installation: {auditResults.expert_installation_report.installation_analysis?.overall_condition}</h5>
                        <p className="text-sm mt-1">
                          {auditResults.expert_installation_report.installation_analysis?.critical_problems_count > 0 && 
                            `⚠️ ${auditResults.expert_installation_report.installation_analysis.critical_problems_count} problème(s) critique(s) détecté(s)`
                          }
                          {auditResults.expert_installation_report.installation_analysis?.issues_count > 0 && 
                            ` • ${auditResults.expert_installation_report.installation_analysis.issues_count} problème(s) important(s)`
                          }
                        </p>
                      </div>
                      {auditResults.expert_installation_report.installation_analysis?.power_analysis && (
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            Rendement: {auditResults.expert_installation_report.installation_analysis.power_analysis.actual_global_efficiency?.toFixed(1)}%
                          </div>
                          <div className="text-sm">
                            (Standard: {auditResults.expert_installation_report.installation_analysis.power_analysis.expected_efficiency}%)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Problèmes détectés */}
                  {auditResults.expert_installation_report.detailed_problems && auditResults.expert_installation_report.detailed_problems.length > 0 && (
                    <div className="mb-6">
                      <h5 className="font-bold text-gray-900 mb-3">🚨 Problèmes Détectés</h5>
                      <div className="space-y-3">
                        {auditResults.expert_installation_report.detailed_problems.map((problem, index) => (
                          <div key={index} className={`p-4 rounded-lg border-l-4 ${
                            problem.severity === 'URGENT' ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <h6 className="font-semibold text-gray-900">{problem.type}</h6>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                problem.severity === 'URGENT' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'
                              }`}>
                                {problem.severity}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{problem.description}</p>
                            
                            {problem.causes_probables && (
                              <div className="mb-2">
                                <strong className="text-sm">Causes probables:</strong>
                                <ul className="text-sm text-gray-600 mt-1 ml-4">
                                  {problem.causes_probables.map((cause, idx) => (
                                    <li key={idx} className="list-disc">{cause}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {problem.consequences && (
                              <div>
                                <strong className="text-sm">Conséquences:</strong>
                                <ul className="text-sm text-red-600 mt-1 ml-4">
                                  {problem.consequences.map((consequence, idx) => (
                                    <li key={idx} className="list-disc">{consequence}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions immédiates */}
                  {auditResults.expert_installation_report.immediate_actions && auditResults.expert_installation_report.immediate_actions.length > 0 && (
                    <div className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h5 className="font-bold text-yellow-800 mb-3">⚡ Actions Immédiates Requises</h5>
                      <ul className="space-y-1">
                        {auditResults.expert_installation_report.immediate_actions.map((action, index) => (
                          <li key={index} className="text-sm text-yellow-700">
                            • {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Équipements à remplacer */}
                  {auditResults.expert_installation_report.equipment_replacement_list && auditResults.expert_installation_report.equipment_replacement_list.length > 0 && (
                    <div className="mb-6">
                      <h5 className="font-bold text-gray-900 mb-3">🔧 Équipements à Remplacer</h5>
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <ul className="space-y-1">
                          {auditResults.expert_installation_report.equipment_replacement_list.map((equipment, index) => (
                            <li key={index} className="text-sm text-red-700">
                              • {equipment}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Équipements à ajouter */}
                  {auditResults.expert_installation_report.equipment_addition_list && auditResults.expert_installation_report.equipment_addition_list.length > 0 && (
                    <div className="mb-6">
                      <h5 className="font-bold text-gray-900 mb-3">➕ Équipements à Ajouter</h5>
                      <div className="space-y-3">
                        {auditResults.expert_installation_report.equipment_addition_list.map((item, index) => (
                          <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex justify-between items-start mb-2">
                              <h6 className="font-semibold text-blue-900">{item.equipment}</h6>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.priority === 'HIGH' ? 'bg-red-200 text-red-800' : 
                                item.priority === 'MEDIUM' ? 'bg-orange-200 text-orange-800' : 
                                'bg-green-200 text-green-800'
                              }`}>
                                {item.priority}
                              </span>
                            </div>
                            <p className="text-sm text-blue-700 mb-2">{item.justification}</p>
                            <div className="flex justify-between text-xs text-blue-600">
                              <span><strong>Économies:</strong> {item.expected_savings}</span>
                              <span><strong>Coût:</strong> {item.cost_estimate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Améliorations hydrauliques */}
                  {auditResults.expert_installation_report.hydraulic_improvements && auditResults.expert_installation_report.hydraulic_improvements.length > 0 && (
                    <div className="mb-6">
                      <h5 className="font-bold text-gray-900 mb-3">🌊 Améliorations Hydrauliques</h5>
                      <div className="space-y-3">
                        {auditResults.expert_installation_report.hydraulic_improvements.map((improvement, index) => (
                          <div key={index} className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                            <h6 className="font-semibold text-cyan-900">{improvement.type}</h6>
                            <div className="text-sm text-cyan-700 mt-2">
                              <p><strong>Actuel:</strong> {improvement.current_diameter} (vitesse: {improvement.current_velocity})</p>
                              <p><strong>Recommandé:</strong> {improvement.recommended_diameter}</p>
                              <p><strong>Justification:</strong> {improvement.justification}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Plan d'action phasé */}
                  {auditResults.expert_installation_report.action_plan && (
                    <div className="mb-6">
                      <h5 className="font-bold text-gray-900 mb-3">📋 Plan d'Action Phasé</h5>
                      <div className="space-y-4">
                        
                        {auditResults.expert_installation_report.action_plan.phase_immediate && (
                          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <h6 className="font-semibold text-red-800 mb-2">
                              Phase Immédiate ({auditResults.expert_installation_report.action_plan.phase_immediate.timeline})
                            </h6>
                            <ul className="text-sm text-red-700 space-y-1">
                              {auditResults.expert_installation_report.action_plan.phase_immediate.actions?.map((action, idx) => (
                                <li key={idx}>• {action}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {auditResults.expert_installation_report.action_plan.phase_urgente && (
                          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                            <h6 className="font-semibold text-orange-800 mb-2">
                              Phase Urgente ({auditResults.expert_installation_report.action_plan.phase_urgente.timeline})
                            </h6>
                            <ul className="text-sm text-orange-700 space-y-1">
                              {auditResults.expert_installation_report.action_plan.phase_urgente.actions?.map((action, idx) => (
                                <li key={idx}>• {action}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {auditResults.expert_installation_report.action_plan.phase_amelioration && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h6 className="font-semibold text-green-800 mb-2">
                              Phase Amélioration ({auditResults.expert_installation_report.action_plan.phase_amelioration.timeline})
                            </h6>
                            <ul className="text-sm text-green-700 space-y-1">
                              {auditResults.expert_installation_report.action_plan.phase_amelioration.actions?.map((action, idx) => (
                                <li key={idx}>• {action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Analyse énergétique */}
                  {auditResults.expert_installation_report.energy_waste_analysis && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h5 className="font-bold text-yellow-800 mb-3">💡 Analyse Gaspillage Énergétique</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Rendement actuel:</strong> {auditResults.expert_installation_report.energy_waste_analysis.current_efficiency?.toFixed(1)}%
                        </div>
                        <div>
                          <strong>Potentiel d'économie:</strong> {auditResults.expert_installation_report.energy_waste_analysis.potential_savings_percent?.toFixed(1)}%
                        </div>
                        <div className="md:col-span-2">
                          <strong>Impact financier:</strong> {auditResults.expert_installation_report.energy_waste_analysis.financial_impact}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Plan d'Action */}
              {auditResults.action_plan && (
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <h4 className="font-bold text-purple-800 mb-4">🗓️ Plan d'Action Prioritaire</h4>
                  
                  <div className="space-y-4">
                    {auditResults.action_plan.phase_1_immediate && (
                      <div className="bg-white p-4 rounded border-l-4 border-red-400">
                        <div className="font-semibold text-red-700 mb-2">Phase 1 - Actions Immédiates</div>
                        <div className="text-sm text-gray-700 mb-2">
                          <strong>Timeline:</strong> {auditResults.action_plan.phase_1_immediate.timeline}
                        </div>
                        <div className="text-sm text-gray-700 mb-2">
                          <strong>Investissement:</strong> {auditResults.action_plan.phase_1_immediate.investment?.toLocaleString()}€
                        </div>
                        <div className="text-sm text-gray-600">
                          {auditResults.action_plan.phase_1_immediate.actions?.join(' • ')}
                        </div>
                      </div>
                    )}

                    {auditResults.action_plan.phase_2_short_term && (
                      <div className="bg-white p-4 rounded border-l-4 border-orange-400">
                        <div className="font-semibold text-orange-700 mb-2">Phase 2 - Court Terme</div>
                        <div className="text-sm text-gray-700 mb-2">
                          <strong>Timeline:</strong> {auditResults.action_plan.phase_2_short_term.timeline}
                        </div>
                        <div className="text-sm text-gray-700 mb-2">
                          <strong>Investissement:</strong> {auditResults.action_plan.phase_2_short_term.investment?.toLocaleString()}€
                        </div>
                        <div className="text-sm text-gray-600">
                          {auditResults.action_plan.phase_2_short_term.actions?.join(' • ')}
                        </div>
                      </div>
                    )}

                    {auditResults.action_plan.total_program && (
                      <div className="bg-white p-4 rounded border">
                        <div className="font-semibold text-gray-700 mb-2">📊 Récapitulatif Programme</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <strong>Durée totale:</strong> {auditResults.action_plan.total_program.duration_months} mois
                          </div>
                          <div>
                            <strong>Investissement:</strong> {auditResults.action_plan.total_program.total_investment?.toLocaleString()}€
                          </div>
                          <div>
                            <strong>Économies:</strong> {auditResults.action_plan.total_program.expected_savings?.toLocaleString()}€/an
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeAuditTab === 'energy' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">⚡ Configuration Énergétique</h3>
              <div className="bg-green-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">💰 Coûts et Paramètres Énergétiques</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coût électricité (€/kWh)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={auditData.electricity_cost_per_kwh}
                      onChange={(e) => handleAuditInputChange('electricity_cost_per_kwh', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="0.12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facteur de charge</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={auditData.load_factor}
                      onChange={(e) => handleAuditInputChange('load_factor', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="0.75"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <h5 className="font-semibold text-gray-800 mb-3">Équipements de Contrôle</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={auditData.has_vfd}
                        onChange={(e) => handleAuditInputChange('has_vfd', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Variateur fréquence</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={auditData.has_soft_starter}
                        onChange={(e) => handleAuditInputChange('has_soft_starter', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Démarreur progressif</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={auditData.has_automation}
                        onChange={(e) => handleAuditInputChange('has_automation', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Automatisation</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bouton d'analyse experte */}
      {(activeAuditTab === 'hydraulic' || activeAuditTab === 'energy') && (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <button
            onClick={performExpertAuditAnalysis}
            disabled={loadingAnalysis}
            className={`px-8 py-4 rounded-lg font-bold text-lg ${
              loadingAnalysis
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
            } transition-all duration-300`}
          >
            {loadingAnalysis ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Analyse en cours...</span>
              </div>
            ) : (
              '🧠 LANCER ANALYSE EXPERTE'
            )}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Génération automatique de recommandations techniques et d'optimisations énergétiques
          </p>
        </div>
      )}
    </div>
  );
};

// Component pour Onglet EXPERT SOLAIRE - Dimensionnement Pompage Solaire
const SolarExpertSystem = () => {
  // Fonction pour charger les données depuis localStorage
  const loadSolarDataFromStorage = () => {
    try {
      const saved = localStorage.getItem('ecoExpertSolarData');
      if (saved) {
        const parsedData = JSON.parse(saved);
        // Fusionner avec les valeurs par défaut pour s'assurer que tous les champs existent
        return {
          // Valeurs par défaut
          project_name: 'Système de Pompage Solaire',
          location_region: 'afrique',
          location_subregion: 'cote_ivoire',
          
          // Besoins en eau et hydrauliques
          daily_water_need: 10,
          operating_hours: 8,
          flow_rate: 1.25,
          seasonal_variation: 1.2,
          peak_months: [6, 7, 8],
          
          // Paramètres hydrauliques pour calcul HMT restructuré
          dynamic_level: 15,
          tank_height: 5,
          static_head: 20,
          dynamic_losses: 5,
          useful_pressure_bar: 0,
          useful_pressure_head: 0,
          total_head: 25,
          pipe_diameter: 114.3,
          pipe_length: 50,
          
          // Paramètres solaires
          panel_peak_power: 270,
          
          // Contraintes du système
          autonomy_days: 2,
          system_voltage: 24,
          installation_type: 'submersible',
          
          // Paramètres économiques
          electricity_cost: 0.15,
          project_lifetime: 25,
          maintenance_cost_annual: 0.02,
          
          // Contraintes d'installation
          available_surface: 100,
          max_budget: 15000,
          grid_connection_available: false,
          
          // Paramètres environnementaux
          ambient_temperature_avg: 25,
          dust_factor: 0.95,
          shading_factor: 1.0,
          
          // Écraser avec les données sauvegardées
          ...parsedData
        };
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des données solaires:', error);
    }
    
    // Retourner les valeurs par défaut si pas de données sauvegardées
    return {
      // Informations du projet
      project_name: 'Système de Pompage Solaire',
      location_region: 'afrique',
      location_subregion: 'cote_ivoire',
      
      // Besoins en eau et hydrauliques
      daily_water_need: 10,
      operating_hours: 8, // Nouvelles heures de fonctionnement
      flow_rate: 1.25, // m³/h - calculé automatiquement (10/8)
      seasonal_variation: 1.2,
      peak_months: [6, 7, 8],
      
      // Paramètres hydrauliques pour calcul HMT restructuré
      dynamic_level: 15, // Niveau dynamique (profondeur pompage)
      tank_height: 5, // Hauteur du château d'eau
      static_head: 20, // Hauteur géométrique (calculée auto: niveau + château)
      dynamic_losses: 5, // Pertes de charge dynamiques
      useful_pressure_bar: 0, // Pression utile en Bar (input utilisateur)
      useful_pressure_head: 0, // Pression utile convertie en hauteur (calculée automatiquement)
      total_head: 25, // HMT totale calculée automatiquement
      pipe_diameter: 114.3, // DN calculé automatiquement basé sur débit
      pipe_length: 50, // Longueur estimée automatiquement basée sur géométrie
      
      // Paramètres solaires
      panel_peak_power: 270, // Wc - puissance crête panneau par défaut 270W
      
      // Contraintes du système
      autonomy_days: 2,
      system_voltage: 24,
      installation_type: 'submersible',
      
      // Paramètres économiques
      electricity_cost: 0.15,
      project_lifetime: 25,
      maintenance_cost_annual: 0.02,
      
      // Contraintes d'installation
      available_surface: 100,
      max_budget: 15000,
      grid_connection_available: false,
      
      // Paramètres environnementaux
      ambient_temperature_avg: 25,
      dust_factor: 0.95,
      shading_factor: 1.0
    };
  };

  // États pour les données d'entrée avec chargement localStorage
  const [solarData, setSolarData] = useState(loadSolarDataFromStorage);
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableRegions, setAvailableRegions] = useState([]);
  const [activeSection, setActiveSection] = useState('project');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const monthlyChartRef = useRef(null);
  const monthlyChartInstance = useRef(null);

  // États pour l'onglet Dessin
  const [drawingData, setDrawingData] = useState({
    installation_type: 'bache_enterree',
    pumps: [
      {
        id: 1,
        type: 'centrifuge',
        power: 1.5,
        flow: 10,
        head: 30,
        position: { x: 0, y: 0 }
      }
    ],
    tanks: [
      {
        id: 1,
        type: 'bache_enterree',
        capacity: 500,
        dimensions: { length: 10, width: 5, height: 3 },
        position: { x: 0, y: 0 }
      }
    ],
    suppressors: [],
    pipes: [],
    valves: [],
    drawing_mode: '2d',
    view_type: 'plan',
    show_dimensions: true,
    show_labels: true
  });

  const [drawingCanvas, setDrawingCanvas] = useState(null);
  const canvasRef = useRef(null);

  // Charger les régions disponibles
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await axios.get(`${API}/solar-regions`);
        setAvailableRegions(response.data.regions);
      } catch (error) {
        console.error('Erreur lors du chargement des régions:', error);
      }
    };
    
    fetchRegions();
  }, []);

  // Sauvegarde automatique dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ecoExpertSolarData', JSON.stringify(solarData));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde des données solaires:', error);
    }
  }, [solarData]);

  // Calcul automatique en temps réel
  useEffect(() => {
    const calculateSolarSystem = async () => {
      if (solarData.daily_water_need > 0 && solarData.total_head > 0) {
        setLoading(true);
        setResults(null); // Force la réinitialisation des résultats avant nouveau calcul
        try {
          const response = await axios.post(`${API}/solar-pumping`, solarData);
          setResults(response.data);
        } catch (error) {
          console.error('Erreur calcul solaire:', error);
          setResults(null); // Réinitialiser aussi en cas d'erreur
        } finally {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(calculateSolarSystem, 500);
    return () => clearTimeout(timer);
  }, [solarData]);

  // Mise à jour du graphique
  useEffect(() => {
    if (results && chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 
                         'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: monthNames,
          datasets: [{
            label: 'Production Solaire (kWh/j)',
            data: results.monthly_performance.production,
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 3,
            fill: true
          }, {
            label: 'Consommation Pompe (kWh/j)',
            data: results.monthly_performance.consumption,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true
          }, {
            label: 'Irradiation Solaire (kWh/m²/j)',
            data: results.monthly_performance.irradiation,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            yAxisID: 'y1'
          }]
        },
        options: {
          responsive: true,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            title: {
              display: true,
              text: 'Performance Mensuelle du Système Solaire'
            },
            legend: {
              position: 'top',
            }
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Énergie (kWh/jour)'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Irradiation (kWh/m²/jour)'
              },
              grid: {
                drawOnChartArea: false,
              },
            }
          }
        }
      });
    }
  }, [results]);

  // Mise à jour du graphique de capacité mensuelle
  useEffect(() => {
    // Fonction pour créer le graphique avec un délai si nécessaire
    const createChart = (attempt = 1) => {
      if (results && results.monthly_performance && results.monthly_performance.water_production && monthlyChartRef.current) {
        const ctx = monthlyChartRef.current.getContext('2d');
        
        if (monthlyChartInstance.current) {
          monthlyChartInstance.current.destroy();
        }

        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 
                           'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

        try {
          monthlyChartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: monthNames,
              datasets: [{
                label: 'Volume d\'eau (m³/jour)',
                data: results.monthly_performance.water_production,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: '#3B82F6',
                borderWidth: 2,
                yAxisID: 'y'
              }, {
                label: 'Heures de pompage (h/jour)',
                data: results.monthly_performance.pump_hours,
                backgroundColor: 'rgba(34, 197, 94, 0.7)',
                borderColor: '#22C55E',
                borderWidth: 2,
                yAxisID: 'y1'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: 'Évolution mensuelle de la capacité de pompage',
                  font: {
                    size: 16
                  }
                },
                legend: {
                  display: true,
                  position: 'top'
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      let label = context.dataset.label || '';
                      if (label) {
                        label += ': ';
                      }
                      if (context.datasetIndex === 0) {
                        label += context.formattedValue + ' m³/j';
                      } else {
                        label += context.formattedValue + ' h/j';
                      }
                      return label;
                    }
                  }
                }
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Mois'
                  }
                },
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  title: {
                    display: true,
                    text: 'Volume (m³/jour)'
                  }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: {
                    display: true,
                    text: 'Heures (h/jour)'
                  },
                  grid: {
                    drawOnChartArea: false,
                  },
                }
              }
            }
          });
          
          return true;
        } catch (error) {
          console.error("Error creating monthly chart:", error);
          return false;
        }
      }
      return false;
    };
    
    if (results && results.monthly_performance && results.monthly_performance.water_production) {
      // Essayer de créer le graphique immédiatement
      if (!createChart(1)) {
        // Si ça échoue, essayer après des délais de plus en plus longs
        setTimeout(() => {
          if (!createChart(2)) {
            setTimeout(() => {
              createChart(3);
            }, 500);
          }
        }, 200);
      }
    }
  }, [results, activeSection]);

  const handleInputChange = (field, value) => {
    setSolarData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Calcul automatique du débit basé sur les heures de fonctionnement
      if (field === 'daily_water_need' || field === 'operating_hours') {
        const volume = field === 'daily_water_need' ? value : prev.daily_water_need;
        const hours = field === 'operating_hours' ? value : prev.operating_hours;
        if (hours > 0) {
          updated.flow_rate = parseFloat((volume / hours).toFixed(2));
          
          // Calcul automatique du DN basé sur débit et vitesse recommandée 2 m/s
          const flowM3s = (updated.flow_rate / 3600); // m³/s
          const velocity = 2.0; // m/s vitesse recommandée
          const diameterM = Math.sqrt((4 * flowM3s) / (Math.PI * velocity)); // diamètre en mètres
          const diameterMM = diameterM * 1000; // en millimètres
          
          // Normalisation vers DN standard
          const standardDNs = [20, 25, 32, 40, 50, 63, 80, 100, 125, 150, 200, 250, 300];
          const recommendedDN = standardDNs.find(dn => dn >= diameterMM) || 300;
          updated.pipe_diameter = recommendedDN;
          
          // Estimation automatique longueur basée sur géométrie (hauteur × 1.5 pour trajets)
          updated.pipe_length = Math.max(30, prev.static_head * 1.5);
        }
      }
      
      // Calcul automatique du DN quand le débit change directement
      if (field === 'flow_rate') {
        const flowM3s = (value / 3600); // m³/s
        const velocity = 2.0; // m/s vitesse recommandée
        const diameterM = Math.sqrt((4 * flowM3s) / (Math.PI * velocity));
        const diameterMM = diameterM * 1000;
        
        const standardDNs = [20, 25, 32, 40, 50, 63, 80, 100, 125, 150, 200, 250, 300];
        const recommendedDN = standardDNs.find(dn => dn >= diameterMM) || 300;
        updated.pipe_diameter = recommendedDN;
      }
      
      // Conversion Bar vers mètres pour la pression utile
      if (field === 'useful_pressure_bar') {
        // 1 Bar = 10.2 mètres de hauteur d'eau approximativement
        // Gérer les valeurs vides ou NaN comme 0
        let pressureBarValue = value;
        if (value === "" || isNaN(value)) {
          pressureBarValue = 0;
        }
        updated.useful_pressure_head = pressureBarValue * 10.2;
        
        // Recalcul automatique HMT avec la nouvelle pression convertie
        updated.total_head = prev.static_head + prev.dynamic_losses + updated.useful_pressure_head;
      }
      
      // Calcul automatique de la hauteur géométrique
      if (field === 'dynamic_level' || field === 'tank_height') {
        const dynamicLevel = field === 'dynamic_level' ? value : prev.dynamic_level;
        const tankHeight = field === 'tank_height' ? value : prev.tank_height;
        updated.static_head = dynamicLevel + tankHeight;
        
        // Recalcul automatique HMT
        updated.total_head = updated.static_head + prev.dynamic_losses + prev.useful_pressure_head;
        
        // Recalcul automatique longueur conduite
        updated.pipe_length = Math.max(30, updated.static_head * 1.5);
      }
      
      // Recalcul automatique HMT pour autres champs (sauf useful_pressure_head qui est calculé automatiquement)
      if (field === 'dynamic_losses') {
        const losses = field === 'dynamic_losses' ? value : prev.dynamic_losses;
        updated.total_head = prev.static_head + losses + prev.useful_pressure_head;
      }
      
      return updated;
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(value);
  };

  const getSolarRadiationColor = (irradiation) => {
    if (irradiation >= 6) return 'text-red-600 font-bold';
    if (irradiation >= 4.5) return 'text-orange-600 font-semibold';
    if (irradiation >= 3.5) return 'text-yellow-600';
    return 'text-blue-600';
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec gradient solaire */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              ☀️ EXPERT SOLAIRE - DIMENSIONNEMENT POMPAGE
            </h2>
            <p className="text-yellow-100 mt-2">
              Calculs automatisés • Dimensionnement optimisé • Analyse économique complète
            </p>
          </div>
          <div className="flex space-x-2">
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
              ✅ Temps réel
            </div>
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
              🔄 Auto-calcul
            </div>
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
              💡 IA Optimisée
            </div>
          </div>
        </div>
      </div>

      {/* Navigation des sections */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'project', label: '📋 Projet', color: 'blue' },
          { id: 'hydraulic', label: '💧 Hydraulique', color: 'cyan' },
          { id: 'energy', label: '⚡ Énergie', color: 'yellow' },
          { id: 'results', label: '📊 Résultats', color: 'green' },
          { id: 'economics', label: '💰 Économie', color: 'purple' }
        ].map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeSection === section.id
                ? `bg-${section.color}-500 text-white shadow-lg`
                : `bg-${section.color}-100 text-${section.color}-700 hover:bg-${section.color}-200`
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Section Informations du Projet */}
      {activeSection === 'project' && (
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-4">📋 Informations du Projet</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">Nom du projet</label>
              <input
                type="text"
                value={solarData.project_name}
                onChange={(e) => handleInputChange('project_name', e.target.value)}
                className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">Région géographique</label>
              <select
                value={`${solarData.location_region}.${solarData.location_subregion}`}
                onChange={(e) => {
                  const [region, subregion] = e.target.value.split('.');
                  handleInputChange('location_region', region);
                  handleInputChange('location_subregion', subregion);
                }}
                className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                {availableRegions.map(region => (
                  <option key={`${region.region}.${region.subregion}`} value={`${region.region}.${region.subregion}`}>
                    {region.name} ({region.irradiation_annual} kWh/m²/j)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">Type d'installation</label>
              <select
                value={solarData.installation_type}
                onChange={(e) => handleInputChange('installation_type', e.target.value)}
                className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="submersible">🔽 Pompe Submersible</option>
                <option value="surface">🔼 Pompe de Surface</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">Tension système (V)</label>
              <select
                value={solarData.system_voltage}
                onChange={(e) => handleInputChange('system_voltage', parseInt(e.target.value))}
                className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value={12}>12V DC</option>
                <option value={24}>24V DC</option>
                <option value={48}>48V DC</option>
                <option value={96}>96V DC</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">Autonomie souhaitée (jours)</label>
              <input
                type="number"
                value={solarData.autonomy_days}
                onChange={(e) => handleInputChange('autonomy_days', parseInt(e.target.value))}
                className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                min="1" max="7"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">Budget maximum (€)</label>
              <input
                type="number"
                value={solarData.max_budget || ''}
                onChange={(e) => handleInputChange('max_budget', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Optionnel"
              />
            </div>
          </div>
        </div>
      )}

      {/* Section Paramètres Hydrauliques */}
      {activeSection === 'hydraulic' && (
        <div className="bg-cyan-50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-cyan-900 mb-4">💧 Paramètres Hydrauliques</h3>
          
          {/* Paramètres d'eau et débit */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-cyan-800 mb-3">💧 Besoins en Eau & Fonctionnement</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border-l-4 border-cyan-500">
                <label className="block text-sm font-medium text-cyan-700 mb-2">Volume quotidien (m³/jour)</label>
                <input
                  type="number"
                  step="0.1"
                  value={solarData.daily_water_need}
                  onChange={(e) => handleInputChange('daily_water_need', parseFloat(e.target.value))}
                  className="w-full p-3 border-2 border-cyan-200 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 text-lg font-semibold"
                />
                <p className="text-xs text-cyan-600 mt-1">Volume d'eau nécessaire par jour</p>
              </div>

              <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                <label className="block text-sm font-medium text-blue-700 mb-2">Heures fonctionnement/jour</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="12"
                  value={solarData.operating_hours}
                  onChange={(e) => handleInputChange('operating_hours', parseFloat(e.target.value))}
                  className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg font-semibold"
                />
                <p className="text-xs text-blue-600 mt-1">Heures de pompage par jour</p>
              </div>

              <div className="bg-gradient-to-r from-green-100 to-green-200 p-4 rounded-lg border-l-4 border-green-600">
                <label className="block text-sm font-medium text-green-800 mb-2">Débit calculé (m³/h)</label>
                <input
                  type="number"
                  step="0.1"
                  value={solarData.flow_rate}
                  readOnly
                  className="w-full p-3 border-2 border-green-300 rounded-lg bg-green-50 text-lg font-bold text-green-800 cursor-not-allowed"
                />
                <p className="text-xs text-green-700 mt-1">Calculé automatiquement</p>
              </div>

              <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                <label className="block text-sm font-medium text-orange-700 mb-2">Variation saisonnière</label>
                <input
                  type="number"
                  step="0.1"
                  value={solarData.seasonal_variation}
                  onChange={(e) => handleInputChange('seasonal_variation', parseFloat(e.target.value))}
                  className="w-full p-3 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  min="1.0" max="2.0"
                />
                <p className="text-xs text-orange-600 mt-1">Coeff. été (1.0 = constant)</p>
              </div>
            </div>
          </div>

          {/* Calcul HMT restructuré */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-blue-800 mb-3">📏 Calcul HMT (Hauteur Manométrique Totale)</h4>
            
            {/* Première ligne : Composants de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                <label className="block text-sm font-medium text-blue-700 mb-2">Niveau dynamique (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={solarData.dynamic_level}
                  onChange={(e) => handleInputChange('dynamic_level', parseFloat(e.target.value))}
                  className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg font-semibold"
                />
                <p className="text-xs text-blue-600 mt-1">Profondeur niveau d'eau</p>
              </div>

              <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                <label className="block text-sm font-medium text-blue-700 mb-2">Hauteur château (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={solarData.tank_height}
                  onChange={(e) => handleInputChange('tank_height', parseFloat(e.target.value))}
                  className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg font-semibold"
                />
                <p className="text-xs text-blue-600 mt-1">Hauteur du réservoir/château</p>
              </div>

              <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-4 rounded-lg border-l-4 border-purple-600">
                <label className="block text-sm font-medium text-purple-800 mb-2">Hauteur géométrique (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={solarData.static_head}
                  readOnly
                  className="w-full p-3 border-2 border-purple-300 rounded-lg bg-purple-50 text-lg font-bold text-purple-800 cursor-not-allowed"
                />
                <p className="text-xs text-purple-700 mt-1">Niveau + Château (auto)</p>
              </div>

              <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
                <label className="block text-sm font-medium text-red-700 mb-2">Pertes de charge (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={solarData.dynamic_losses}
                  onChange={(e) => handleInputChange('dynamic_losses', parseFloat(e.target.value))}
                  className="w-full p-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 text-lg font-semibold"
                />
                <p className="text-xs text-red-600 mt-1">Pertes dans tuyauteries</p>
              </div>
            </div>

            {/* Deuxième ligne : Calcul final */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border-l-4 border-yellow-500">
                <label className="block text-sm font-medium text-yellow-700 mb-2">Pression utile (Bar)</label>
                <input
                  type="number"
                  step="0.1"
                  value={solarData.useful_pressure_bar}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permettre les valeurs vides temporairement
                    if (value === "") {
                      handleInputChange('useful_pressure_bar', "");
                    } else {
                      const parsedValue = parseFloat(value);
                      handleInputChange('useful_pressure_bar', isNaN(parsedValue) ? 0 : parsedValue);
                    }
                  }}
                  onBlur={(e) => {
                    // Au blur, s'assurer qu'on a une valeur numérique
                    const value = e.target.value;
                    if (value === "" || isNaN(parseFloat(value))) {
                      handleInputChange('useful_pressure_bar', 0);
                    }
                  }}
                  className="w-full p-3 border-2 border-yellow-200 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-lg font-semibold"
                />
                <p className="text-xs text-yellow-600 mt-1">Pression résiduelle requise en sortie (convertie automatiquement en mètres)</p>
              </div>

              <div className="bg-gradient-to-r from-green-200 to-green-300 p-4 rounded-lg border-l-4 border-green-700 shadow-lg">
                <label className="block text-sm font-medium text-green-900 mb-2">🎯 HMT TOTALE (m)</label>
                <input
                  type="text"
                  value={isNaN(solarData.total_head) ? '0.00' : solarData.total_head.toFixed(2)}
                  readOnly
                  className="w-full p-3 border-2 border-green-400 rounded-lg bg-green-100 text-2xl font-bold text-green-900 cursor-not-allowed text-center"
                />
                <p className="text-xs text-green-800 mt-1 text-center">Calculé automatiquement</p>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg border-l-4 border-gray-500">
                <h5 className="text-sm font-medium text-gray-700 mb-2">📊 Répartition HMT</h5>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Géométrique:</span>
                    <span className="font-semibold">{solarData.static_head.toFixed(1)}m ({((solarData.static_head / solarData.total_head) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pertes charge:</span>
                    <span className="font-semibold">{solarData.dynamic_losses.toFixed(1)}m ({((solarData.dynamic_losses / solarData.total_head) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pression utile:</span>
                    <span className="font-semibold">
                      {solarData.useful_pressure_head.toFixed(1)}m 
                      ({(solarData.useful_pressure_bar === "" || isNaN(solarData.useful_pressure_bar) ? 0 : parseFloat(solarData.useful_pressure_bar)).toFixed(1)} Bar)
                      ({((solarData.useful_pressure_head / solarData.total_head) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Paramètres solaires et DN automatique */}
          <div>
            <h4 className="text-lg font-semibold text-yellow-800 mb-3">☀️ Paramètres Solaires & DN Conduite</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-lg border-l-4 border-yellow-500">
                <label className="block text-sm font-medium text-yellow-800 mb-2">Puissance crête panneau (Wc)</label>
                <select
                  value={solarData.panel_peak_power}
                  onChange={(e) => handleInputChange('panel_peak_power', parseInt(e.target.value))}
                  className="w-full p-3 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-lg font-semibold"
                >
                  <option value={100}>100 Wc - Petit panneau</option>
                  <option value={200}>200 Wc - Panneau compact</option>
                  <option value={270}>270 Wc - Polycristallin standard</option>
                  <option value={320}>320 Wc - Polycristallin amélioré</option>
                  <option value={400}>400 Wc - Monocristallin standard</option>
                  <option value={550}>550 Wc - Monocristallin haute performance</option>
                  <option value={600}>600 Wc - Panneau haute puissance</option>
                </select>
                <p className="text-xs text-yellow-700 mt-1">Puissance unitaire des panneaux</p>
              </div>

              <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 rounded-lg border-l-4 border-blue-600">
                <label className="block text-sm font-medium text-blue-800 mb-2">DN Conduite (calculé temps réel)</label>
                <input
                  type="text"
                  value={`DN ${(() => {
                    // CALCUL DN VRAIMENT DYNAMIQUE basé sur débit actuel
                    const flowM3h = solarData.flow_rate || 1;
                    const flowM3s = flowM3h / 3600; // conversion en m³/s
                    const velocity = 2.0; // vitesse optimale 2 m/s
                    const diameterM = Math.sqrt((4 * flowM3s) / (Math.PI * velocity)); // diamètre en mètres
                    const diameterMM = diameterM * 1000; // conversion en mm
                    
                    // Normalisation vers DN standard
                    const standardDNs = [20, 25, 32, 40, 50, 63, 80, 100, 125, 150, 200, 250, 300];
                    const calculatedDN = standardDNs.find(dn => dn >= diameterMM) || standardDNs[standardDNs.length - 1];
                    
                    return calculatedDN;
                  })()}`}
                  readOnly
                  className="w-full p-3 border-2 border-blue-300 rounded-lg bg-blue-50 text-lg font-bold text-blue-800 cursor-not-allowed text-center"
                />
                <p className="text-xs text-blue-700 mt-1">
                  Basé sur débit {solarData.flow_rate.toFixed(2)} m³/h (v=2m/s)
                </p>
              </div>
            </div>

            {/* Informations techniques sur la conduite */}
            <div className="mt-4 bg-gray-50 p-4 rounded-lg border">
              <h5 className="text-sm font-semibold text-gray-700 mb-2">📋 Spécifications Techniques Conduite</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {(() => {
                  const flowM3h = solarData.flow_rate || 1;
                  const flowM3s = flowM3h / 3600;
                  const velocity = 2.0;
                  const diameterM = Math.sqrt((4 * flowM3s) / (Math.PI * velocity));
                  const diameterMM = diameterM * 1000;
                  const standardDNs = [20, 25, 32, 40, 50, 63, 80, 100, 125, 150, 200, 250, 300];
                  const calculatedDN = standardDNs.find(dn => dn >= diameterMM) || standardDNs[standardDNs.length - 1];
                  const actualVelocity = flowM3s / (Math.PI * Math.pow(calculatedDN/2000, 2));
                  
                  return (
                    <>
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">Vitesse réelle</div>
                        <div>{actualVelocity.toFixed(2)} m/s</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">Matériau</div>
                        <div>{calculatedDN <= 63 ? 'PEHD' : 'PVC-U'}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-orange-600">Pression</div>
                        <div>PN {calculatedDN <= 100 ? '16' : '10'} bar</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-purple-600">Norme</div>
                        <div>ISO 4427</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Paramètres Énergétiques */}
      {activeSection === 'energy' && (
        <div className="bg-yellow-50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-yellow-900 mb-4">⚡ Paramètres Énergétiques & Environnementaux</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Paramètres économiques */}
            <div className="bg-white p-4 rounded-lg border-t-4 border-green-500">
              <h4 className="font-semibold text-green-700 mb-3">💰 Économique</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coût électricité (€/kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={solarData.electricity_cost}
                    onChange={(e) => handleInputChange('electricity_cost', parseFloat(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée projet (années)</label>
                  <input
                    type="number"
                    value={solarData.project_lifetime}
                    onChange={(e) => handleInputChange('project_lifetime', parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-200"
                    min="10" max="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance annuelle (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={solarData.maintenance_cost_annual * 100}
                    onChange={(e) => handleInputChange('maintenance_cost_annual', parseFloat(e.target.value) / 100)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-200"
                  />
                </div>
              </div>
            </div>

            {/* Paramètres environnementaux */}
            <div className="bg-white p-4 rounded-lg border-t-4 border-orange-500">
              <h4 className="font-semibold text-orange-700 mb-3">🌤️ Environnemental</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Température ambiante (°C)</label>
                  <input
                    type="number"
                    value={solarData.ambient_temperature_avg}
                    onChange={(e) => handleInputChange('ambient_temperature_avg', parseFloat(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facteur poussière (0.9-1.0)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.8" max="1.0"
                    value={solarData.dust_factor}
                    onChange={(e) => handleInputChange('dust_factor', parseFloat(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facteur ombrage (0.8-1.0)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.8" max="1.0"
                    value={solarData.shading_factor}
                    onChange={(e) => handleInputChange('shading_factor', parseFloat(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
                  />
                </div>
              </div>
            </div>

            {/* Irradiation en temps réel */}
            <div className="bg-white p-4 rounded-lg border-t-4 border-red-500">
              <h4 className="font-semibold text-red-700 mb-3">☀️ Irradiation Locale</h4>
              {results && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Annuelle:</span>
                    <span className={`font-bold ${getSolarRadiationColor(results.solar_irradiation.annual)}`}>
                      {results.solar_irradiation.annual.toFixed(1)} kWh/m²/j
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Été (max):</span>
                    <span className={`font-bold ${getSolarRadiationColor(results.solar_irradiation.peak_month)}`}>
                      {results.solar_irradiation.peak_month.toFixed(1)} kWh/m²/j
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Hiver (min):</span>
                    <span className={`font-bold ${getSolarRadiationColor(results.solar_irradiation.min_month)}`}>
                      {results.solar_irradiation.min_month.toFixed(1)} kWh/m²/j
                    </span>
                  </div>
                  <div className="mt-3 p-2 bg-yellow-100 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Efficacité système:</span>
                      <span className="font-bold text-yellow-700">
                        {(results.system_efficiency * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section Résultats */}
      {activeSection === 'results' && results && (
        <div className="space-y-6">
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-green-900 mb-4">📊 Installation Optimale - Résultats Automatiques</h3>
            
            {/* Alerte de chargement */}
            {loading && (
              <div className="bg-blue-100 border border-blue-300 text-blue-700 px-4 py-3 rounded-lg mb-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                  Calcul en cours... Optimisation du système
                </div>
              </div>
            )}

            {/* Alertes critiques */}
            {results.critical_alerts && results.critical_alerts.length > 0 && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
                <h4 className="font-bold">🚨 Alertes Critiques:</h4>
                <ul className="list-disc ml-5">
                  {results.critical_alerts.map((alert, idx) => (
                    <li key={idx}>{alert}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Configuration du champ photovoltaïque */}
            <div className="mb-6 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-6 border-l-4 border-yellow-500">
              <h4 className="text-xl font-bold text-yellow-800 mb-4">☀️ Configuration Champ Photovoltaïque Optimal</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Puissance requise - CALCULS DYNAMIQUES RÉELS */}
                <div className="bg-white p-4 rounded-lg shadow-md border-t-2 border-red-500">
                  <h5 className="font-semibold text-red-700 mb-2">⚡ Puissance Requise</h5>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      // CALCULS DYNAMIQUES RÉELS basés sur les données saisies
                      const hydraulicPowerKW = (solarData.flow_rate * solarData.total_head * 1000 * 9.81) / 3600 / 1000; // kW
                      const pumpEfficiency = 0.75; // 75% rendement pompe
                      const electricalPowerKW = hydraulicPowerKW / pumpEfficiency; // kW
                      const systemLosses = 0.8; // 80% efficacité système
                      const peakPowerKW = electricalPowerKW / systemLosses; // kWc nécessaire
                      
                      return (
                        <>
                          <div className="flex justify-between">
                            <span>P. hydraulique:</span>
                            <span className="font-bold text-blue-600">
                              {hydraulicPowerKW.toFixed(2)} kW
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rendement pompe:</span>
                            <span className="font-bold">{(pumpEfficiency * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>P. électrique:</span>
                            <span className="font-bold text-red-600">
                              {electricalPowerKW.toFixed(2)} kW
                            </span>
                          </div>
                          <div className="bg-red-50 p-2 rounded mt-2">
                            <div className="text-xs text-red-700 text-center">
                              P. crête nécessaire: {peakPowerKW.toFixed(2)} kWc
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Dimensionnement automatique - CALCULS DYNAMIQUES RÉELS */}
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h5 className="font-semibold text-yellow-700 mb-2">📐 Dimensionnement Auto</h5>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const hydraulicPowerKW = (solarData.flow_rate * solarData.total_head * 1000 * 9.81) / 3600 / 1000;
                      const electricalPowerKW = hydraulicPowerKW / 0.75;
                      const peakPowerW = (electricalPowerKW / 0.8) * 1000; // Watts
                      const nbPanels = Math.ceil(peakPowerW / solarData.panel_peak_power);
                      const totalPowerW = nbPanels * solarData.panel_peak_power;
                      
                      return (
                        <>
                          <div className="flex justify-between">
                            <span>Puissance requise:</span>
                            <span className="font-bold text-red-600">{peakPowerW.toFixed(0)}W</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Nombre panneaux:</span>
                            <span className="font-bold text-yellow-800">{nbPanels}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Puissance unitaire:</span>
                            <span className="font-bold">{solarData.panel_peak_power} Wc</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Puissance totale:</span>
                            <span className="font-bold text-green-600">{totalPowerW} Wc</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Surface requise:</span>
                            <span className="font-bold">{(nbPanels * 2).toFixed(1)} m²</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Configuration série/parallèle - CALCULS VRAIMENT DYNAMIQUES */}
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h5 className="font-semibold text-blue-700 mb-2">🔗 Config. Série/Parallèle</h5>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      // CALCULS VRAIMENT DYNAMIQUES ET CORRECTS
                      const hydraulicPowerKW = (solarData.flow_rate * solarData.total_head * 1000 * 9.81) / 3600 / 1000;
                      const electricalPowerKW = hydraulicPowerKW / 0.75;
                      const peakPowerW = (electricalPowerKW / 0.8) * 1000;
                      const totalPanels = Math.ceil(peakPowerW / solarData.panel_peak_power);
                      
                      // CORRECTION LOGIQUE SÉRIE/PARALLÈLE
                      const systemVoltage = solarData.system_voltage; // 12V, 24V, 48V ou 96V
                      
                      // Tension panneau selon puissance (logique réelle)
                      let panelVoltage;
                      if (solarData.panel_peak_power <= 200) panelVoltage = 12;
                      else if (solarData.panel_peak_power <= 400) panelVoltage = 24; 
                      else panelVoltage = 48;
                      
                      // CALCUL CORRECT panneaux en série
                      const panelsInSeries = Math.max(1, Math.ceil(systemVoltage / panelVoltage));
                      
                      // CALCUL CORRECT strings en parallèle  
                      const strings = Math.max(1, Math.ceil(totalPanels / panelsInSeries));
                      
                      const stringVoltage = panelsInSeries * panelVoltage;
                      
                      return (
                        <>
                          <div className="flex justify-between">
                            <span>Panneaux total:</span>
                            <span className="font-bold text-gray-600">{totalPanels}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tension panneau:</span>
                            <span className="font-bold text-green-600">{panelVoltage}V</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Panneaux/série:</span>
                            <span className="font-bold text-blue-600">{panelsInSeries}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Strings parallèle:</span>
                            <span className="font-bold text-blue-600">{strings}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Configuration:</span>
                            <span className="font-bold text-purple-600">{panelsInSeries}S{strings}P</span>
                          </div>
                          <div className="bg-blue-50 p-2 rounded mt-2">
                            <div className="text-xs text-blue-700 text-center">
                              Tension string: {stringVoltage}V → Système {systemVoltage}V
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Estimation coût - CALCULS DYNAMIQUES RÉELS */}
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h5 className="font-semibold text-green-700 mb-2">💰 Estimation Coût</h5>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const hydraulicPowerKW = (solarData.flow_rate * solarData.total_head * 1000 * 9.81) / 3600 / 1000;
                      const electricalPowerKW = hydraulicPowerKW / 0.75;
                      const peakPowerW = (electricalPowerKW / 0.8) * 1000;
                      const nbPanels = Math.ceil(peakPowerW / solarData.panel_peak_power);
                      const pricePerWatt = solarData.panel_peak_power >= 400 ? 0.7 : 0.6; // €/Wc
                      const unitPrice = solarData.panel_peak_power * pricePerWatt;
                      const totalCost = nbPanels * unitPrice;
                      
                      return (
                        <>
                          <div className="flex justify-between">
                            <span>Prix unitaire:</span>
                            <span className="font-bold">{formatCurrency(unitPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Quantité:</span>
                            <span className="font-bold">{nbPanels} panneaux</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Coût total:</span>
                            <span className="font-bold text-green-600">{formatCurrency(totalCost)}</span>
                          </div>
                          <div className="bg-green-50 p-2 rounded mt-2">
                            <div className="text-xs text-green-700 text-center">
                              {(totalCost / (nbPanels * solarData.panel_peak_power) * 1000).toFixed(2)} €/kWc
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Équipements du système - VALEURS ENTIÈREMENT DYNAMIQUES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pompe solaire - SPÉCIFICATIONS VRAIMENT DYNAMIQUES */}
              <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-md">
                <h4 className="font-semibold text-blue-700 mb-2 flex items-center">
                  💧 Pompe Solaire Recommandée
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-lg text-blue-800">
                    Pompe {solarData.installation_type === 'submersible' ? 'Submersible' : 'de Surface'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      // CALCULS VRAIMENT DYNAMIQUES pour la pompe
                      const hydraulicPowerKW = (solarData.flow_rate * solarData.total_head * 1000 * 9.81) / 3600 / 1000;
                      const pumpEfficiencyEstimated = solarData.flow_rate < 2 ? 0.65 : 
                                                     solarData.flow_rate < 5 ? 0.75 :
                                                     solarData.flow_rate < 10 ? 0.80 : 0.82;
                      const electricalPowerKW = hydraulicPowerKW / pumpEfficiencyEstimated;
                      const nominalPowerW = electricalPowerKW * 1000 * 1.15; // marge sécurité 15%
                      
                      return (
                        <>
                          <div>
                            <span className="text-gray-600">Puissance nominale:</span>
                            <span className="font-semibold ml-1 text-red-600">{nominalPowerW.toFixed(0)}W</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Efficacité estimée:</span>
                            <span className="font-semibold ml-1 text-red-600">{(pumpEfficiencyEstimated * 100).toFixed(0)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Type installation:</span>
                            <span className="font-semibold ml-1">{solarData.installation_type === 'submersible' ? 'Immergée' : 'Surface'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Débit nominal:</span>
                            <span className="font-semibold ml-1 text-red-600">{solarData.flow_rate.toFixed(1)} m³/h</span>
                          </div>
                          <div>
                            <span className="text-gray-600">HMT requise:</span>
                            <span className="font-semibold ml-1 text-red-600">{solarData.total_head.toFixed(0)} m</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Tension d'alim.:</span>
                            <span className="font-semibold ml-1">{solarData.system_voltage}V DC</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="bg-blue-50 p-2 rounded mt-2">
                    <div className="text-xs text-blue-700">
                      <strong>Recommandation:</strong> Pompe DC avec contrôleur MPPT intégré ou externe
                    </div>
                  </div>
                </div>
              </div>

              {/* Système de stockage - DYNAMIQUE */}
              <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow-md">
                <h4 className="font-semibold text-purple-700 mb-2">🔋 Système de Stockage</h4>
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-lg text-purple-800">
                    Batteries {solarData.autonomy_days >= 3 ? 'Lithium LiFePO4' : 'Gel/AGM'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      const hydraulicPowerKW = (solarData.flow_rate * solarData.total_head * 1000 * 9.81) / 3600 / 1000;
                      const electricalPowerKW = hydraulicPowerKW / 0.75;
                      const dailyEnergyNeed = electricalPowerKW * solarData.operating_hours; // kWh/jour
                      const autonomyEnergyKWh = dailyEnergyNeed * solarData.autonomy_days;
                      const systemVoltage = solarData.system_voltage;
                      const batteryCapacityAh = (autonomyEnergyKWh * 1000) / systemVoltage / 0.8; // DOD 80%
                      const nbBatteries = Math.ceil(batteryCapacityAh / 100); // batteries 100Ah standard
                      
                      const seriesBatteries = Math.ceil(systemVoltage / 12); // batteries 12V standard
                      const parallelBatteries = Math.ceil(nbBatteries / seriesBatteries);
                      const totalBatteries = seriesBatteries * parallelBatteries;
                      
                      return (
                        <>
                          <div>
                            <span className="text-gray-600">Configuration:</span>
                            <span className="font-semibold ml-1">{seriesBatteries}S{parallelBatteries}P</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Nombre batteries:</span>
                            <span className="font-semibold ml-1">{totalBatteries}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Capacité totale:</span>
                            <span className="font-semibold ml-1">{(totalBatteries * 100).toFixed(0)}Ah @ {systemVoltage}V</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Énergie stockée:</span>
                            <span className="font-semibold ml-1">{(totalBatteries * 100 * systemVoltage / 1000).toFixed(1)} kWh</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Autonomie:</span>
                            <span className="font-semibold ml-1">{solarData.autonomy_days} jour{solarData.autonomy_days > 1 ? 's' : ''}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Cycles de vie:</span>
                            <span className="font-semibold ml-1">{solarData.autonomy_days >= 3 ? '6000' : '1500'}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="bg-purple-50 p-2 rounded mt-2">
                    <div className="text-xs text-purple-700">
                      <strong>Recommandation:</strong> {solarData.autonomy_days >= 3 ? 
                      'Batteries Lithium pour autonomie élevée et performance optimales' : 
                      'Batteries Gel pour rapport qualité/prix avec maintenance réduite'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Régulateur MPPT - DYNAMIQUE */}
              <div className="bg-white p-4 rounded-lg border-l-4 border-green-500 shadow-md">
                <h4 className="font-semibold text-green-700 mb-2">⚡ Régulateur MPPT</h4>
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-lg text-green-800">Contrôleur MPPT High Efficiency</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      const hydraulicPowerKW = (solarData.flow_rate * solarData.total_head * 1000 * 9.81) / 3600 / 1000;
                      const electricalPowerKW = hydraulicPowerKW / 0.75;
                      const peakPowerW = (electricalPowerKW / 0.8) * 1000;
                      const totalPanels = Math.ceil(peakPowerW / solarData.panel_peak_power);
                      
                      let panelVoltage;
                      if (solarData.panel_peak_power <= 200) panelVoltage = 12;
                      else if (solarData.panel_peak_power <= 400) panelVoltage = 24; 
                      else panelVoltage = 48;
                      
                      const panelsInSeries = Math.max(1, Math.ceil(solarData.system_voltage / panelVoltage));
                      const strings = Math.max(1, Math.ceil(totalPanels / panelsInSeries));
                      
                      const currentPerPanel = solarData.panel_peak_power / panelVoltage;
                      const totalCurrent = strings * currentPerPanel * 1.25; // marge sécurité 25%
                      const maxPvVoltage = panelsInSeries * panelVoltage * 1.3; // marge froid
                      
                      return (
                        <>
                          <div>
                            <span className="text-gray-600">Courant max:</span>
                            <span className="font-semibold ml-1">{totalCurrent.toFixed(0)}A</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Tension PV max:</span>
                            <span className="font-semibold ml-1">{maxPvVoltage.toFixed(0)}V</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Efficacité:</span>
                            <span className="font-semibold ml-1">98%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Tension batterie:</span>
                            <span className="font-semibold ml-1">{solarData.system_voltage}V nominal</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Protection:</span>
                            <span className="font-semibold ml-1">IP65 minimum</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Monitoring:</span>
                            <span className="font-semibold ml-1">{totalCurrent >= 30 ? 'Bluetooth/WiFi' : 'LCD/LED'}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="bg-green-50 p-2 rounded mt-2">
                    <div className="text-xs text-green-700">
                      <strong>Recommandation:</strong> MPPT avec tracking intelligent et protection contre surtensions
                    </div>
                  </div>
                </div>
              </div>

              {/* Résumé système - ENTIÈREMENT DYNAMIQUE */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 rounded-lg border-l-4 border-gray-600 shadow-md">
                <h4 className="font-semibold text-gray-700 mb-2">📋 Spécifications Système</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Architecture:</span>
                    <span className="font-semibold">{solarData.system_voltage}V DC - {solarData.installation_type === 'submersible' ? 'Immergée' : 'Surface'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Production quotidienne:</span>
                    <span className="font-semibold">{solarData.daily_water_need} m³/jour</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heures fonctionnement:</span>
                    <span className="font-semibold">{solarData.operating_hours}h/jour</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Efficacité globale:</span>
                    <span className="font-semibold">60-80%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protection requise:</span>
                    <span className="font-semibold">IP65, Parafoudre</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Certification:</span>
                    <span className="font-semibold">CE, IEC 61215</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded mt-2">
                    {(() => {
                      const hydraulicPowerKW = (solarData.flow_rate * solarData.total_head * 1000 * 9.81) / 3600 / 1000;
                      const electricalPowerKW = hydraulicPowerKW / 0.75;
                      const peakPowerW = (electricalPowerKW / 0.8) * 1000;
                      const nbPanels = Math.ceil(peakPowerW / solarData.panel_peak_power);
                      const pricePerWatt = solarData.panel_peak_power >= 400 ? 0.7 : 0.6;
                      const panelsCost = nbPanels * solarData.panel_peak_power * pricePerWatt;
                      const pumpCost = Math.max(800, electricalPowerKW * 1200); // €/kW pompe
                      const batteryCapacityKWh = solarData.autonomy_days * electricalPowerKW * solarData.operating_hours;
                      const batteryCost = batteryCapacityKWh * 600; // €/kWh batteries
                      const mpptCost = Math.max(150, peakPowerW * 0.15); // €/W MPPT
                      const totalCost = panelsCost + pumpCost + batteryCost + mpptCost + 1500; // installation
                      
                      return (
                        <div className="font-bold text-blue-600 text-center">
                          INVESTISSEMENT ESTIMÉ: {formatCurrency(totalCost)}
                          <div className="text-xs text-gray-600 font-normal mt-1">
                            Installation et mise en service comprises
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Graphique de performance */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
              <h4 className="font-semibold text-gray-800 mb-3">📊 Performance Mensuelle du Système</h4>
              <canvas ref={chartRef} style={{maxHeight: '400px'}}></canvas>
            </div>

            {/* Section Recommandations d'Équipements */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-md border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-4 text-lg">🛠️ Recommandations d'Équipements - Configuration Expert</h4>
              {(() => {
                const hydraulicPowerKW = (solarData.flow_rate * solarData.total_head * 1000 * 9.81) / 3600 / 1000;
                const electricalPowerKW = hydraulicPowerKW / 0.75;
                const peakPowerW = (electricalPowerKW / 0.8) * 1000;
                const nbPanels = Math.ceil(peakPowerW / solarData.panel_peak_power);
                const batteryCapacityKWh = solarData.autonomy_days * electricalPowerKW * solarData.operating_hours;
                const nbBatteries = Math.ceil(batteryCapacityKWh / 2.5); // Batteries 2.5kWh standard

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pompe Recommandée */}
                    <div className="bg-white p-5 rounded-lg border-l-4 border-blue-500">
                      <h5 className="font-semibold text-blue-700 mb-3">💧 Pompe Solaire Submersible</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">Pompe centrifuge submersible</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Puissance nominale:</span>
                          <span className="font-medium">{electricalPowerKW.toFixed(1)} kW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Débit max:</span>
                          <span className="font-medium">{(solarData.flow_rate * 1.2).toFixed(1)} m³/h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">HMT max:</span>
                          <span className="font-medium">{Math.round(solarData.total_head * 1.3)} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Matériau:</span>
                          <span className="font-medium">Inox haute qualité</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Protection:</span>
                          <span className="font-medium">IP68, Résistant sable</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Certification:</span>
                          <span className="font-medium">CE, ISO 9001</span>
                        </div>
                      </div>
                    </div>

                    {/* Convertisseur */}
                    <div className="bg-white p-5 rounded-lg border-l-4 border-green-500">
                      <h5 className="font-semibold text-green-700 mb-3">⚡ Convertisseur de Fréquence Solaire</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">Variateur solaire MPPT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Puissance moteur:</span>
                          <span className="font-medium">{electricalPowerKW.toFixed(1)} kW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Entrée PV:</span>
                          <span className="font-medium">{Math.round(peakPowerW)} Wp</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tension DC:</span>
                          <span className="font-medium">240-800 VDC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Efficacité:</span>
                          <span className="font-medium">&ge; 95%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Protection:</span>
                          <span className="font-medium">IP65, MPPT intégré</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fonctions:</span>
                          <span className="font-medium">Démarrage progressif</span>
                        </div>
                      </div>
                    </div>

                    {/* Panneaux Solaires */}
                    <div className="bg-white p-5 rounded-lg border-l-4 border-yellow-500">
                      <h5 className="font-semibold text-yellow-700 mb-3">☀️ Panneaux Solaires - Configuration</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantité recommandée:</span>
                          <span className="font-medium text-lg text-blue-600">{nbPanels} panneaux</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Puissance unitaire:</span>
                          <span className="font-medium">{solarData.panel_peak_power} Wc</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Puissance totale:</span>
                          <span className="font-medium">{nbPanels * solarData.panel_peak_power} Wc</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Technologie:</span>
                          <span className="font-medium">Monocristallin PERC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tension Voc:</span>
                          <span className="font-medium">46.8 V</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Configuration:</span>
                          <span className="font-medium">{Math.ceil(nbPanels/2)}S{Math.min(2, nbPanels)}P optimal</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Garantie:</span>
                          <span className="font-medium">25 ans puissance</span>
                        </div>
                      </div>
                    </div>

                    {/* Batteries de Stockage */}
                    <div className="bg-white p-5 rounded-lg border-l-4 border-purple-500">
                      <h5 className="font-semibold text-purple-700 mb-3">🔋 Batteries Lithium-Ion</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantité recommandée:</span>
                          <span className="font-medium text-lg text-blue-600">{nbBatteries} batteries</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Capacité unitaire:</span>
                          <span className="font-medium">2.5 kWh / 100 Ah</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Capacité totale:</span>
                          <span className="font-medium">{batteryCapacityKWh.toFixed(1)} kWh</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tension nominale:</span>
                          <span className="font-medium">24V DC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Technologie:</span>
                          <span className="font-medium">LiFePO4</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cycles de vie:</span>
                          <span className="font-medium">&gt;6000 cycles</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Autonomie:</span>
                          <span className="font-medium">{solarData.autonomy_days} jours</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* Note Expert */}
              <div className="mt-4 bg-blue-100 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-blue-800">
                  <strong>💡 Note de l'Expert:</strong> Cette configuration a été optimisée pour votre usage spécifique. 
                  Les équipements recommandés sont sélectionnés pour leur fiabilité en milieu tropical et leur facilité de maintenance. 
                  L'installation doit être réalisée par un technicien certifié avec respect des normes locales.
                </p>
              </div>
            </div>

            {/* Graphique de pompage mensuelle */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
              <h4 className="font-semibold text-gray-800 mb-3">💧 Capacité de Pompage Mensuelle</h4>
              <canvas 
                ref={monthlyChartRef} 
                style={{maxHeight: '400px'}}
                className="w-full"
              ></canvas>
            </div>
          </div>
        </div>
      )}

      {/* Section Analyse Économique */}
      {activeSection === 'economics' && results && (
        <div className="bg-purple-50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-purple-900 mb-4">💰 Analyse Économique Complète</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Coûts du système */}
            <div className="bg-white p-6 rounded-lg border-t-4 border-red-500">
              <h4 className="font-semibold text-red-700 mb-3">💸 Coûts d'Investissement</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Pompe:</span>
                  <span className="font-medium">{formatCurrency(results.dimensioning.recommended_pump.cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Panneaux:</span>
                  <span className="font-medium">{formatCurrency(results.dimensioning.solar_panels.cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Batteries:</span>
                  <span className="font-medium">{formatCurrency(results.dimensioning.batteries.cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Régulateur:</span>
                  <span className="font-medium">{formatCurrency(results.dimensioning.mppt_controller.cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Installation:</span>
                  <span className="font-medium">{formatCurrency(1500)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold text-red-700">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(results.dimensioning.economic_analysis.total_system_cost)}</span>
                </div>
              </div>
            </div>

            {/* Économies annuelles */}
            <div className="bg-white p-6 rounded-lg border-t-4 border-green-500">
              <h4 className="font-semibold text-green-700 mb-3">💰 Économies Annuelles</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Économies brutes:</span>
                  <span className="font-medium text-green-600">{formatCurrency(results.dimensioning.economic_analysis.annual_savings)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Maintenance:</span>
                  <span className="font-medium text-red-600">-{formatCurrency(results.dimensioning.economic_analysis.annual_maintenance)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold text-green-700">
                  <span>Économies nettes:</span>
                  <span>{formatCurrency(results.dimensioning.economic_analysis.net_annual_savings)}</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-green-100 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800">
                    {results.dimensioning.economic_analysis.payback_period.toFixed(1)} ans
                  </div>
                  <div className="text-sm text-green-600">Période de retour</div>
                </div>
              </div>
            </div>

            {/* ROI et rentabilité */}
            <div className="bg-white p-6 rounded-lg border-t-4 border-blue-500">
              <h4 className="font-semibold text-blue-700 mb-3">📈 Rentabilité</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Durée projet:</span>
                  <span className="font-medium">{results.dimensioning.economic_analysis.project_lifetime} ans</span>
                </div>
                <div className="flex justify-between">
                  <span>Économies totales:</span>
                  <span className="font-medium text-blue-600">{formatCurrency(results.dimensioning.economic_analysis.total_lifetime_savings)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ROI:</span>
                  <span className="font-medium text-blue-600">{results.dimensioning.economic_analysis.roi_percentage.toFixed(1)}%</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-800">
                      {formatCurrency(results.dimensioning.economic_analysis.total_lifetime_savings - results.dimensioning.economic_analysis.total_system_cost)}
                    </div>
                    <div className="text-sm text-blue-600">Bénéfice net sur {results.dimensioning.economic_analysis.project_lifetime} ans</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommandations économiques */}
          {results.dimensioning.optimization_suggestions && results.dimensioning.optimization_suggestions.length > 0 && (
            <div className="mt-6 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg">
              <h4 className="font-bold">💡 Suggestions d'Optimisation:</h4>
              <ul className="list-disc ml-5 mt-2">
                {results.dimensioning.optimization_suggestions.map((suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommandations techniques */}
          {results.dimensioning.technical_recommendations && results.dimensioning.technical_recommendations.length > 0 && (
            <div className="mt-4 bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded-lg">
              <h4 className="font-bold">🔧 Recommandations Techniques:</h4>
              <ul className="list-disc ml-5 mt-2">
                {results.dimensioning.technical_recommendations.map((recommendation, idx) => (
                  <li key={idx}>{recommendation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Avertissements */}
      {results && results.warnings && results.warnings.length > 0 && (
        <div className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg">
          <h4 className="font-bold">⚠️ Avertissements:</h4>
          <ul className="list-disc ml-5">
            {results.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Component pour Onglet COMPATIBILITÉ CHIMIQUE - Interface Liste Déroulante
const ChemicalCompatibility = () => {
  const [selectedFluid, setSelectedFluid] = useState('');

  // Base de données exhaustive de compatibilité chimique industrielle
  const chemicalCompatibilityDatabase = {
    // FLUIDES AVEC COMPATIBILITÉS MATÉRIAUX
    "water": {
      name: "Eau",
      ph_range: "6.5-8.5",
      corrosiveness: "Faible",
      temperature_limits: "-10°C à +100°C",
      icon: "💧",
      compatibility: {
        "excellent": {
          materials: ["316L Stainless Steel", "PVC", "PEHD", "PP", "PTFE", "EPDM", "Viton", "Bronze Naval"],
          reasons: ["Résistance à la corrosion", "Inertie chimique", "Usage eau potable"]
        },
        "good": {
          materials: ["304 Stainless Steel", "Acier Carbone (avec revêtement)", "Fonte Ductile", "Laiton"],
          reasons: ["Résistance acceptable", "Nécessite traitement anticorrosion"]
        },
        "poor": {
          materials: ["Acier Carbone Nu", "Zinc", "Aluminium (eau de mer)"],
          reasons: ["Corrosion rapide", "Formation d'oxydes", "Durée de vie limitée"]
        },
        "incompatible": {
          materials: ["Magnésium", "Acier Galvanisé (long terme)"],
          reasons: ["Corrosion galvanique", "Dégradation rapide"]
        }
      }
    },
    
    "seawater": {
      name: "Eau de Mer",
      ph_range: "7.8-8.3",
      corrosiveness: "Très Élevée",
      temperature_limits: "-2°C à +40°C",
      salinity: "35 g/L",
      icon: "🌊",
      compatibility: {
        "excellent": {
          materials: ["Super Duplex 2507", "Inconel 625", "Hastelloy C-276", "Titane Grade 2", "Bronze Naval"],
          reasons: ["Résistance chlorures", "Pas de corrosion par piqûres", "Usage marin certifié"]
        },
        "good": {
          materials: ["316L Stainless Steel", "Duplex 2205", "Cupronickel 90/10"],
          reasons: ["Résistance acceptable", "Maintenance préventive requise"]
        },
        "poor": {
          materials: ["304 Stainless Steel", "Fonte", "Laiton Ordinaire"],
          reasons: ["Corrosion par piqûres", "Attaque chlorures", "Durée de vie réduite"]
        },
        "incompatible": {
          materials: ["Acier Carbone", "Zinc", "Aluminium", "PVC (>40°C)"],
          reasons: ["Corrosion massive", "Défaillance rapide", "Non adapté milieu marin"]
        }
      }
    },

    "palm_oil": {
      name: "Huile de Palme",
      ph_range: "Neutre",
      corrosiveness: "Faible",
      temperature_limits: "5°C à +60°C",
      saponification: "199 mg KOH/g",
      icon: "🌴",
      compatibility: {
        "excellent": {
          materials: ["316L Stainless Steel", "304 Stainless Steel", "PVC", "PP", "PTFE", "Viton", "EPDM"],
          reasons: ["Inertie aux huiles végétales", "Résistance température", "Usage alimentaire"]
        },
        "good": {
          materials: ["Acier Carbone Inoxydable", "Bronze", "Laiton Étamé"],
          reasons: ["Compatible huiles végétales", "Revêtement protecteur requis"]
        },
        "poor": {
          materials: ["Caoutchouc Naturel", "Zinc", "Cuivre Nu"],
          reasons: ["Gonflement", "Catalyse oxydation", "Saponification"]
        },
        "incompatible": {
          materials: ["Acier Galvanisé", "PVC Plastifié", "NBR (>50°C)"],
          reasons: ["Réaction chimique", "Migration plastifiants", "Dégradation température"]
        }
      }
    },

    "gasoline": {
      name: "Essence (Octane 95)",
      ph_range: "N/A",
      corrosiveness: "Modérée",
      temperature_limits: "-40°C à +50°C",
      volatility: "Très Élevée",
      icon: "⛽",
      compatibility: {
        "excellent": {
          materials: ["316L Stainless Steel", "Aluminum 5052", "PTFE", "Viton FKM", "Terne Plated Steel"],
          reasons: ["Résistance hydrocarbures", "Pas de gonflement", "Usage carburant certifié"]
        },
        "good": {
          materials: ["304 Stainless Steel", "Acier Carbone (revêtu)", "EPDM (spécial essence)"],
          reasons: ["Résistance acceptable", "Revêtement anti-corrosion nécessaire"]
        },
        "poor": {
          materials: ["PVC", "Polyéthylène Standard", "Caoutchouc Naturel"],
          reasons: ["Gonflement", "Perméabilité vapeurs", "Dégradation mécanique"]
        },
        "incompatible": {
          materials: ["Zinc", "Cuivre", "NBR Standard", "Plomb"],
          reasons: ["Formation de gommes", "Catalyse oxydation", "Pollution carburant"]
        }
      }
    },

    "diesel": {
      name: "Gazole (Diesel)",
      ph_range: "N/A", 
      corrosiveness: "Faible à Modérée",
      temperature_limits: "-20°C à +70°C",
      sulfur_content: "≤10 mg/kg (EN 590)",
      icon: "🚛",
      compatibility: {
        "excellent": {
          materials: ["Acier Carbone", "316L Stainless Steel", "Aluminum", "Viton FKM", "PTFE"],
          reasons: ["Usage standard diesel", "Résistance corrosion", "Étanchéité hydrocarbures"]
        },
        "good": {
          materials: ["304 Stainless Steel", "Fonte Ductile", "EPDM Diesel", "NBR Haute Performance"],
          reasons: ["Compatible diesel standard", "Résistance acceptable"]
        },
        "poor": {
          materials: ["PVC Standard", "Caoutchouc Naturel", "Polyéthylène"],
          reasons: ["Gonflement modéré", "Perméabilité", "Vieillissement accéléré"]
        },
        "incompatible": {
          materials: ["Zinc (contact direct)", "Cuivre (catalyseur)"],
          reasons: ["Formation de dépôts", "Catalyse d'oxydation", "Dégradation qualité"]
        }
      }
    },

    "hydraulic_oil": {
      name: "Huile Hydraulique ISO VG 46",
      ph_range: "N/A",
      corrosiveness: "Très Faible",
      temperature_limits: "-30°C à +80°C",
      additive_package: "Anti-usure, Anti-oxydant",
      icon: "🛢️",
      compatibility: {
        "excellent": {
          materials: ["Acier Carbone", "316L Stainless Steel", "Fonte", "NBR 90 Shore A", "Viton", "Polyuréthane"],
          reasons: ["Usage hydraulique standard", "Résistance pression", "Étanchéité parfaite"]
        },
        "good": {
          materials: ["304 Stainless Steel", "Bronze", "EPDM Hydraulique", "PTFE"],
          reasons: ["Compatible systèmes hydrauliques", "Durabilité prouvée"]
        },
        "poor": {
          materials: ["PVC Souple", "Caoutchouc Naturel", "SBR"],
          reasons: ["Gonflement", "Dégradation additifs", "Perte propriétés mécaniques"]
        },
        "incompatible": {
          materials: ["Zinc Direct", "PVC Plastifié"],
          reasons: ["Attaque additifs anti-usure", "Migration plastifiants"]
        }
      }
    },

    "ethanol": {
      name: "Éthanol (95%)",
      ph_range: "6.5-7.5",
      corrosiveness: "Modérée",
      temperature_limits: "-100°C à +60°C",
      concentration: "95% vol",
      icon: "🍾",
      compatibility: {
        "excellent": {
          materials: ["316L Stainless Steel", "PTFE", "EPDM Alcool", "Viton A", "PP"],
          reasons: ["Résistance alcools", "Inertie chimique", "Usage pharmaceutique"]
        },
        "good": {
          materials: ["304 Stainless Steel", "Acier Carbone Revêtu", "PVC (concentrations < 50%)"],
          reasons: ["Résistance acceptable", "Limitation concentration"]
        },
        "poor": {
          materials: ["Aluminum", "Zinc", "NBR Standard"],
          reasons: ["Corrosion intergranulaire", "Formation d'alcoolates", "Gonflement"]
        },
        "incompatible": {
          materials: ["Caoutchouc Naturel", "PVC Plastifié", "Acétals"],
          reasons: ["Dissolution", "Extraction plastifiants", "Fissuration contrainte"]
        }
      }
    },

    "methanol": {
      name: "Méthanol (99.5%)",
      ph_range: "6.0-7.0",
      corrosiveness: "Élevée",
      temperature_limits: "-100°C à +50°C",
      toxicity: "Très Toxique",
      icon: "🧪",
      compatibility: {
        "excellent": {
          materials: ["316L Stainless Steel", "Hastelloy C-276", "PTFE", "Viton A", "EPDM Spécial"],
          reasons: ["Résistance méthanol", "Pas de corrosion", "Étanchéité parfaite"]
        },
        "good": {
          materials: ["304 Stainless Steel", "Monel 400"],
          reasons: ["Résistance acceptable", "Inspection régulière requise"]
        },
        "poor": {
          materials: ["Aluminum", "PVC", "NBR"],
          reasons: ["Corrosion", "Gonflement", "Dégradation rapide"]
        },
        "incompatible": {
          materials: ["Caoutchouc Naturel", "Zinc", "Magnésium", "Plomb"],
          reasons: ["Dissolution complète", "Corrosion massive", "Toxicité renforcée"]
        }
      }
    },

    "glycerol": {
      name: "Glycérine (99%)",
      ph_range: "7.0",
      corrosiveness: "Très Faible",
      temperature_limits: "-10°C à +150°C",
      viscosity: "Très Élevée",
      icon: "🧴",
      compatibility: {
        "excellent": {
          materials: ["316L Stainless Steel", "304 Stainless Steel", "PVC", "PP", "PTFE", "EPDM", "Viton"],
          reasons: ["Inertie chimique", "Usage pharmaceutique", "Non corrosif"]
        },
        "good": {
          materials: ["Acier Carbone", "Fonte", "Bronze", "Laiton"],
          reasons: ["Compatible glycérine", "Pas d'attaque chimique"]
        },
        "poor": {
          materials: ["Caoutchouc Naturel (>100°C)", "NBR (température élevée)"],
          reasons: ["Ramollissement température", "Perte élasticité"]
        },
        "incompatible": {
          materials: [],
          reasons: ["Glycérine généralement compatible avec tous matériaux courants"]
        }
      }
    },

    "acid": {
      name: "Solution Acide (HCl 10%)",
      ph_range: "1.0-2.0",
      corrosiveness: "Très Élevée",
      temperature_limits: "0°C à +60°C",
      concentration: "10% HCl",
      icon: "⚠️",
      compatibility: {
        "excellent": {
          materials: ["Hastelloy C-276", "Inconel 625", "PTFE", "PVC-C", "PVDF", "EPDM Acide"],
          reasons: ["Résistance acides forts", "Pas d'attaque chimique", "Usage chimique certifié"]
        },
        "good": {
          materials: ["316L Stainless Steel (dilué)", "CPVC"],
          reasons: ["Résistance acides dilués", "Limitation concentration"]
        },
        "poor": {
          materials: ["304 Stainless Steel", "Aluminum", "Zinc"],
          reasons: ["Corrosion rapide", "Formation d'hydrogène", "Attaque intergranulaire"]
        },
        "incompatible": {
          materials: ["Acier Carbone", "Fonte", "Cuivre", "Laiton", "Caoutchouc Naturel"],
          reasons: ["Dissolution rapide", "Corrosion massive", "Réaction violente"]
        }
      }
    },

    // NOUVEAUX FLUIDES ALIMENTAIRES ET DOMESTIQUES
    "milk": {
      name: "Lait (3.5% MG)",
      ph_range: "6.6-6.8",
      corrosiveness: "Très Faible",
      temperature_limits: "2°C à +80°C",
      fat_content: "3.5% MG",
      icon: "🥛",
      compatibility: {
        "excellent": {
          materials: ["316L Stainless Steel", "PTFE", "EPDM Food Grade", "Silicone Alimentaire", "Verre Borosilicaté"],
          reasons: ["Usage alimentaire certifié", "Résistance nettoyage", "Inertie chimique totale"]
        },
        "good": {
          materials: ["304 Stainless Steel", "PP Food Grade", "PVC Alimentaire"],
          reasons: ["Compatible produits laitiers", "Nettoyage facile"]
        },
        "poor": {
          materials: ["Aluminum Non Traité", "PVC Standard"],
          reasons: ["Interaction avec acidité", "Absorption d'odeurs"]
        },
        "incompatible": {
          materials: ["Cuivre", "Laiton", "Caoutchouc Naturel", "Acier Galvanisé"],
          reasons: ["Contamination métallique", "Développement bactérien", "Altération goût"]
        }
      }
    },

    "honey": {
      name: "Miel (Naturel)",
      ph_range: "3.4-6.1",
      corrosiveness: "Faible (Acide)",
      temperature_limits: "10°C à +60°C",
      sugar_content: "82% sucres",
      icon: "🍯",
      compatibility: {
        "excellent": {
          materials: ["316L Stainless Steel", "Verre", "PTFE", "Silicone Food Grade", "Céramique Alimentaire"],
          reasons: ["Résistance sucres acides", "Pas d'interaction", "Facilité nettoyage"]
        },
        "good": {
          materials: ["304 Stainless Steel", "HDPE Food Grade", "PP"],
          reasons: ["Compatible alimentaire", "Résistance acceptable aux acides"]
        },
        "poor": {
          materials: ["Aluminum", "Étain", "PVC Standard"],
          reasons: ["Interaction acide", "Coloration possible", "Absorption"]
        },
        "incompatible": {
          materials: ["Fer", "Cuivre", "Plomb", "Caoutchouc Naturel"],
          reasons: ["Catalyse fermentation", "Contamination métallique", "Altération qualité"]
        }
      }
    },

    "wine": {
      name: "Vin Rouge (12° alcool)",
      ph_range: "3.3-3.7",
      corrosiveness: "Modérée (Acide + Alcool)",
      temperature_limits: "8°C à +25°C",
      alcohol_content: "12% vol",
      icon: "🍷",
      compatibility: {
        "excellent": {
          materials: ["316L Stainless Steel", "Verre", "PTFE", "EPDM Œnologique", "Chêne Traité"],
          reasons: ["Usage œnologique certifié", "Pas d'altération goût", "Résistance acides organiques"]
        },
        "good": {
          materials: ["304 Stainless Steel", "Polyéthylène Dense", "Résines Alimentaires"],
          reasons: ["Compatible vin", "Résistance alcool-acide"]
        },
        "poor": {
          materials: ["Aluminum Anodisé", "PVC Food", "Caoutchouc Spécial"],
          reasons: ["Interaction légère", "Nécessite surveillance", "Vieillissement accéléré"]
        },
        "incompatible": {
          materials: ["Fer", "Cuivre Nu", "Plomb", "PVC Standard", "Caoutchouc Naturel"],
          reasons: ["Casse métallique", "Goûts indésirables", "Contamination", "Altération aromatique"]
        }
      }
    },

    "bleach": {
      name: "Eau de Javel (5% NaClO)",
      ph_range: "11.5-13.0",
      corrosiveness: "Très Élevée",
      temperature_limits: "5°C à +25°C",
      active_chlorine: "5% NaClO",
      icon: "🧽",
      compatibility: {
        "excellent": {
          materials: ["PVC", "CPVC", "PTFE", "Viton Résistant Chlore", "PVDF"],
          reasons: ["Résistance chlore excellente", "Pas de dégradation", "Usage désinfection certifié"]
        },
        "good": {
          materials: ["PEHD", "PP (court terme)", "Céramique Émaillée"],
          reasons: ["Résistance acceptable", "Usage limité dans le temps"]
        },
        "poor": {
          materials: ["304 Stainless Steel", "Caoutchouc EPDM", "Silicone Standard"],
          reasons: ["Corrosion par piqûres", "Dégradation progressive", "Durée de vie limitée"]
        },
        "incompatible": {
          materials: ["Acier Carbone", "Aluminum", "Cuivre", "Laiton", "316L Stainless (prolongé)", "NBR"],
          reasons: ["Corrosion rapide", "Réaction violente", "Dégagement gazeux", "Défaillance immédiate"]
        }
      }
    },

    "yogurt": {
      name: "Yaourt Nature",
      ph_range: "4.0-4.4",
      corrosiveness: "Faible (Acide Lactique)",
      temperature_limits: "2°C à +45°C",
      lactic_acid: "0.8% acide lactique",
      icon: "🥛",
      compatibility: {
        "excellent": {
          materials: ["316L Stainless Steel", "Verre", "PTFE", "Silicone Alimentaire", "EPDM Food Grade"],
          reasons: ["Résistance acide lactique", "Usage laitier certifié", "Facilité stérilisation"]
        },
        "good": {
          materials: ["304 Stainless Steel", "PP Food Grade", "HDPE Alimentaire"],
          reasons: ["Compatible produits fermentés", "Nettoyage efficace"]
        },
        "poor": {
          materials: ["Aluminum Anodisé", "PVC Alimentaire", "Étain"],
          reasons: ["Interaction acide faible", "Coloration possible", "Surveillance requise"]
        },
        "incompatible": {
          materials: ["Fer", "Cuivre", "Zinc", "Caoutchouc Naturel", "Acier Galvanisé"],
          reasons: ["Contamination métallique", "Altération bactérienne", "Goûts métalliques"]
        }
      }
    },

    "tomato_sauce": {
      name: "Sauce Tomate Concentrée",
      ph_range: "4.0-4.6",
      corrosiveness: "Modérée (Acide + Sel)",
      temperature_limits: "5°C à +95°C",
      salt_content: "2.5% NaCl",
      icon: "🍅",
      compatibility: {
        "excellent": {
          materials: ["316L Stainless Steel", "Verre", "PTFE", "Céramique Émaillée", "Émail Vitrifié"],
          reasons: ["Résistance acides organiques", "Pas d'interaction sel", "Usage conserverie certifié"]
        },
        "good": {
          materials: ["304 Stainless Steel", "Résines Époxy", "HDPE Food Grade"],
          reasons: ["Compatible tomate", "Résistance température-acidité"]
        },
        "poor": {
          materials: ["Aluminum Traité", "PVC Rigide", "Polyester"],
          reasons: ["Interaction acide-sel", "Coloration progressive", "Durée limitée"]
        },
        "incompatible": {
          materials: ["Fer", "Étain Non Protégé", "Cuivre", "Zinc", "Caoutchouc Standard"],
          reasons: ["Corrosion acide", "Contamination métallique", "Altération couleur/goût"]
        }
      }
    },

    "soap_solution": {
      name: "Solution Savonneuse (2%)",
      ph_range: "9.0-11.0",
      corrosiveness: "Faible (Basique)",
      temperature_limits: "15°C à +60°C",
      surfactant_content: "2% agents actifs",
      icon: "🧼",
      compatibility: {
        "excellent": {
          materials: ["Stainless Steel", "PVC", "PP", "PTFE", "Polyuréthane", "EPDM"],
          reasons: ["Résistance détergents", "Usage nettoyage standard", "Pas de dégradation"]
        },
        "good": {
          materials: ["Aluminum Anodisé", "HDPE", "ABS", "Polycarbonate"],
          reasons: ["Compatible détergents", "Résistance alcaline acceptable"]
        },
        "poor": {
          materials: ["Aluminum Nu", "Magnésium", "Caoutchouc Naturel"],
          reasons: ["Attaque alcaline légère", "Gonflement", "Dégradation lente"]
        },
        "incompatible": {
          materials: ["Zinc", "Étain", "Plomb", "Matériaux Poreux"],
          reasons: ["Corrosion alcaline", "Dissolution", "Absorption détergents"]
        }
      }
    },

    "fruit_juice": {
      name: "Jus de Fruits (Orange)",
      ph_range: "3.3-4.2",
      corrosiveness: "Modérée (Acide Citrique)",
      temperature_limits: "2°C à +85°C",
      vitamin_c: "50 mg/100ml",
      icon: "🧃",
      compatibility: {
        "excellent": {
          materials: ["316L Stainless Steel", "Verre", "PTFE", "Silicone Food Grade", "Émail Porcelaine"],
          reasons: ["Résistance acides de fruits", "Préservation vitamines", "Usage alimentaire certifié"]
        },
        "good": {
          materials: ["304 Stainless Steel", "PP Food Grade", "HDPE Alimentaire", "Céramique"],
          reasons: ["Compatible jus de fruits", "Résistance acide citrique"]
        },
        "poor": {
          materials: ["Aluminum Anodisé", "PVC Food", "Résines Standard"],
          reasons: ["Interaction acide faible", "Possible migration", "Altération légère"]
        },
        "incompatible": {
          materials: ["Fer", "Cuivre", "Étain Nu", "Caoutchouc Naturel", "Plomb"],
          reasons: ["Destruction vitamine C", "Contamination métallique", "Oxydation", "Goûts métalliques"]
        }
      }
    }
  };

  // Fonction pour obtenir la couleur de compatibilité
  const getCompatibilityColor = (level) => {
    switch(level) {
      case 'excellent': return 'bg-green-100 border-green-400 text-green-800';
      case 'good': return 'bg-blue-100 border-blue-400 text-blue-800';
      case 'poor': return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case 'incompatible': return 'bg-red-100 border-red-400 text-red-800';
      default: return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  const getCompatibilityIcon = (level) => {
    switch(level) {
      case 'excellent': return '✅';
      case 'good': return '👍';
      case 'poor': return '⚠️';
      case 'incompatible': return '❌';
      default: return '❓';
    }
  };

  const getCompatibilityTitle = (level) => {
    switch(level) {
      case 'excellent': return 'EXCELLENT';
      case 'good': return 'BON';
      case 'poor': return 'MÉDIOCRE';
      case 'incompatible': return 'INCOMPATIBLE';
      default: return 'INCONNU';
    }
  };

  const selectedFluidData = selectedFluid ? chemicalCompatibilityDatabase[selectedFluid] : null;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🧪 COMPATIBILITÉ CHIMIQUE FLUIDES-MATÉRIAUX</h2>
        <p className="text-purple-100">
          Sélectionnez un fluide pour visualiser sa compatibilité avec les matériaux d'installation
        </p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>✅ Standards ASTM</div>
          <div>✅ Normes ISO 23936</div>
          <div>✅ Codes ASME</div>
          <div>✅ Certifications FDA</div>
        </div>
      </div>

      {/* Sélection du fluide */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔍 Sélectionnez un fluide à analyser
          </label>
          <select
            value={selectedFluid}
            onChange={(e) => setSelectedFluid(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
          >
            <option value="">-- Choisir un fluide --</option>
            {Object.entries(chemicalCompatibilityDatabase).map(([key, fluid]) => (
              <option key={key} value={key}>
                {fluid.icon} {fluid.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Légende */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Légende des Niveaux de Compatibilité</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-3 rounded-lg border-2 ${getCompatibilityColor('excellent')}`}>
            <div className="font-bold">✅ EXCELLENT</div>
            <div className="text-sm">Compatibilité parfaite - Usage long terme</div>
          </div>
          <div className={`p-3 rounded-lg border-2 ${getCompatibilityColor('good')}`}>
            <div className="font-bold">👍 BON</div>
            <div className="text-sm">Compatible - Surveillance recommandée</div>
          </div>
          <div className={`p-3 rounded-lg border-2 ${getCompatibilityColor('poor')}`}>
            <div className="font-bold">⚠️ MÉDIOCRE</div>
            <div className="text-sm">Usage limité - Maintenance fréquente</div>
          </div>
          <div className={`p-3 rounded-lg border-2 ${getCompatibilityColor('incompatible')}`}>
            <div className="font-bold">❌ INCOMPATIBLE</div>
            <div className="text-sm">À éviter - Risque de défaillance</div>
          </div>
        </div>
      </div>

      {/* Affichage des compatibilités du fluide sélectionné */}
      {selectedFluidData && (
        <div className="bg-white rounded-lg shadow-lg border-l-4 border-purple-400 overflow-hidden">
          <div className="p-6">
            {/* En-tête fluide sélectionné */}
            <div className="flex items-center space-x-3 mb-6">
              <span className="text-3xl">{selectedFluidData.icon}</span>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedFluidData.name}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                  <span className="bg-gray-100 px-2 py-1 rounded"><strong>pH:</strong> {selectedFluidData.ph_range}</span>
                  <span className="bg-gray-100 px-2 py-1 rounded"><strong>Corrosion:</strong> {selectedFluidData.corrosiveness}</span>
                  <span className="bg-gray-100 px-2 py-1 rounded"><strong>Température:</strong> {selectedFluidData.temperature_limits}</span>
                  {selectedFluidData.salinity && (
                    <span className="bg-gray-100 px-2 py-1 rounded"><strong>Salinité:</strong> {selectedFluidData.salinity}</span>
                  )}
                  {selectedFluidData.volatility && (
                    <span className="bg-gray-100 px-2 py-1 rounded"><strong>Volatilité:</strong> {selectedFluidData.volatility}</span>
                  )}
                  {selectedFluidData.toxicity && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded"><strong>⚠️ Toxicité:</strong> {selectedFluidData.toxicity}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Matrice de compatibilité */}
            <div className="space-y-4">
              <h4 className="text-xl font-semibold text-gray-900 mb-4">🔍 Compatibilité avec les Matériaux</h4>
              
              {Object.entries(selectedFluidData.compatibility).map(([compatLevel, compatData]) => (
                compatData.materials.length > 0 && (
                  <div key={compatLevel} className={`p-4 rounded-lg border-2 ${getCompatibilityColor(compatLevel)}`}>
                    <div className="flex items-center mb-3">
                      <span className="text-lg mr-2">{getCompatibilityIcon(compatLevel)}</span>
                      <h5 className="text-lg font-bold">{getCompatibilityTitle(compatLevel)}</h5>
                      <span className="ml-2 px-2 py-1 text-xs bg-white rounded-full">
                        {compatData.materials.length} matériaux
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <h6 className="font-medium text-sm mb-2">📦 Matériaux recommandés :</h6>
                      <div className="flex flex-wrap gap-2">
                        {compatData.materials.map((material, index) => (
                          <span key={index} className="px-3 py-1 bg-white rounded-md text-sm font-medium shadow-sm border">
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h6 className="font-medium text-sm mb-2">💡 Justifications techniques :</h6>
                      <ul className="text-sm space-y-1">
                        {compatData.reasons.map((reason, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Avertissement pour fluides dangereux */}
            {(selectedFluid === 'acid' || selectedFluid === 'methanol' || selectedFluid === 'gasoline') && (
              <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="flex items-start">
                  <span className="text-red-600 text-xl mr-3">⚠️</span>
                  <div>
                    <h6 className="font-bold text-red-800 mb-2">AVERTISSEMENT SÉCURITÉ</h6>
                    <p className="text-red-700 text-sm">
                      Ce fluide présente des risques particuliers. Consulter les fiches de données de sécurité (FDS) 
                      et respecter les réglementations en vigueur pour la manipulation, le stockage et l'installation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message si aucun fluide sélectionné */}
      {!selectedFluid && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🧪</div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">Sélectionnez un fluide</h3>
          <p className="text-gray-500">
            Choisissez un fluide dans la liste déroulante ci-dessus pour voir sa compatibilité avec les matériaux d'installation
          </p>
        </div>
      )}
    </div>
  );
};
const FormulaDatabase = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFormula, setSelectedFormula] = useState(null);

  // Base de données complète des formules hydrauliques et électriques utilisées
  const formulaDatabase = {
    // 1. FORMULES NPSHD
    npshd: {
      name: "Calculs NPSH Disponible",
      color: "bg-blue-50 border-blue-200",
      icon: "🟦",
      formulas: [
        {
          id: "npshd_flooded",
          name: "NPSHd - Installation en Charge",
          formula: "NPSHd = (Patm / (ρ × g)) + hasp - (Pv / (ρ × g)) - ΔHasp",
          variables: {
            "NPSHd": "Net Positive Suction Head disponible (m)",
            "Patm": "Pression atmosphérique (Pa) = 101 325 Pa",
            "ρ": "Masse volumique du fluide (kg/m³)",
            "g": "Accélération de la pesanteur = 9.81 m/s²",
            "hasp": "Hauteur d'aspiration en charge (m, positif)",
            "Pv": "Pression de vapeur saturante du fluide (Pa)",
            "ΔHasp": "Pertes de charge totales côté aspiration (m)"
          },
          application: "Pour pompes installées sous le niveau du réservoir (aspiration positive)",
          references: "NF EN ISO 17769-1, API 610"
        },
        {
          id: "npshd_suction_lift",
          name: "NPSHd - Installation en Dépression",
          formula: "NPSHd = (Patm / (ρ × g)) - hasp - (Pv / (ρ × g)) - ΔHasp",
          variables: {
            "NPSHd": "Net Positive Suction Head disponible (m)",
            "Patm": "Pression atmosphérique (Pa) = 101 325 Pa",
            "ρ": "Masse volumique du fluide (kg/m³)",
            "g": "Accélération de la pesanteur = 9.81 m/s²",
            "hasp": "Hauteur d'aspiration en dépression (m, positif)",
            "Pv": "Pression de vapeur saturante du fluide (Pa)",
            "ΔHasp": "Pertes de charge totales côté aspiration (m)"
          },
          application: "Pour pompes installées au-dessus du niveau du réservoir",
          references: "NF EN ISO 17769-1, Hydraulic Institute Standards"
        }
      ]
    },

    // 2. FORMULES PERTES DE CHARGE
    head_loss: {
      name: "Pertes de Charge Hydrauliques",
      color: "bg-red-50 border-red-200",
      icon: "📉",
      formulas: [
        {
          id: "darcy_weisbach",
          name: "Formule de Darcy-Weisbach",
          formula: "ΔH = f × (L / D) × (V² / (2 × g))",
          variables: {
            "ΔH": "Perte de charge linéaire (m)",
            "f": "Coefficient de friction (sans dimension)",
            "L": "Longueur de la conduite (m)",
            "D": "Diamètre intérieur de la conduite (m)",
            "V": "Vitesse moyenne du fluide (m/s)",
            "g": "Accélération de la pesanteur = 9.81 m/s²"
          },
          application: "Calcul des pertes de charge en conduite cylindrique",
          references: "ISO 4006, Moody Diagram"
        },
        {
          id: "reynolds_number",
          name: "Nombre de Reynolds",
          formula: "Re = (ρ × V × D) / μ",
          variables: {
            "Re": "Nombre de Reynolds (sans dimension)",
            "ρ": "Masse volumique du fluide (kg/m³)",
            "V": "Vitesse moyenne du fluide (m/s)",
            "D": "Diamètre intérieur de la conduite (m)",
            "μ": "Viscosité dynamique du fluide (Pa·s)"
          },
          application: "Détermination du régime d'écoulement (laminaire Re < 2300, turbulent Re > 4000)",
          references: "Mécanique des fluides, Reynolds (1883)"
        },
        {
          id: "colebrook_white",
          name: "Équation de Colebrook-White",
          formula: "1/√f = -2 × log₁₀((ε/D)/3.7 + 2.51/(Re×√f))",
          variables: {
            "f": "Coefficient de friction (sans dimension)",
            "ε": "Rugosité absolue de la conduite (m)",
            "D": "Diamètre intérieur de la conduite (m)",
            "Re": "Nombre de Reynolds (sans dimension)"
          },
          application: "Calcul du coefficient de friction pour écoulement turbulent",
          references: "Colebrook & White (1937), ISO 4006"
        }
      ]
    },

    // 3. FORMULES HMT
    hmt: {
      name: "Hauteur Manométrique Totale",
      color: "bg-green-50 border-green-200", 
      icon: "🟩",
      formulas: [
        {
          id: "hmt_total",
          name: "HMT - Formule Générale",
          formula: "HMT = Hgéo + ΔHtotal + ΔPutile/(ρ×g)",
          variables: {
            "HMT": "Hauteur Manométrique Totale (m)",
            "Hgéo": "Hauteur géométrique = hrefoulement + haspiration (m)",
            "ΔHtotal": "Pertes de charge totales = ΔHasp + ΔHref (m)",
            "ΔPutile": "Pression utile requise (Pa)",
            "ρ": "Masse volumique du fluide (kg/m³)",
            "g": "Accélération de la pesanteur = 9.81 m/s²"
          },
          application: "Calcul de la hauteur totale que doit fournir la pompe",
          references: "NF EN 809, ISO 17769"
        },
        {
          id: "static_head",
          name: "Hauteur Statique",
          formula: "Hstatique = hrefoulement - haspiration",
          variables: {
            "Hstatique": "Hauteur statique (m)",
            "hrefoulement": "Niveau de refoulement (m)",
            "haspiration": "Niveau d'aspiration (m, négatif si en dépression)"
          },
          application: "Calcul de la différence d'altitude entre aspiration et refoulement",
          references: "Principes de base hydraulique"
        }
      ]
    },

    // 4. FORMULES PUISSANCE ET ÉLECTRICITÉ
    power: {
      name: "Calculs de Puissance et Électriques",
      color: "bg-yellow-50 border-yellow-200",
      icon: "⚡",
      formulas: [
        {
          id: "hydraulic_power",
          name: "Puissance Hydraulique",
          formula: "Ph = (ρ × g × Q × HMT) / 1000",
          variables: {
            "Ph": "Puissance hydraulique (kW)",
            "ρ": "Masse volumique du fluide (kg/m³)",
            "g": "Accélération de la pesanteur = 9.81 m/s²",
            "Q": "Débit volumique (m³/s)",
            "HMT": "Hauteur Manométrique Totale (m)"
          },
          application: "Puissance théorique nécessaire pour élever le fluide",
          references: "Principes thermodynamiques"
        },
        {
          id: "absorbed_power",
          name: "Puissance Absorbée P2",
          formula: "P2 = (Q × HMT) / (ηpompe × 367)",
          variables: {
            "P2": "Puissance absorbée par la pompe (kW)",
            "Q": "Débit volumique (m³/h)",
            "HMT": "Hauteur Manométrique Totale (m)",
            "ηpompe": "Rendement de la pompe (%)",
            "367": "Constante de conversion (m⁴/h·kW pour l'eau)"
          },
          application: "Puissance mécanique requise à l'arbre de la pompe",
          references: "Calculs normalised pompes centrifuges"
        },
        {
          id: "motor_power",
          name: "Puissance Électrique P1",
          formula: "P1 = P2 / (ηmoteur / 100)",
          variables: {
            "P1": "Puissance électrique absorbée (kW)",
            "P2": "Puissance mécanique absorbée (kW)",
            "ηmoteur": "Rendement du moteur électrique (%)"
          },
          application: "Puissance électrique consommée par le moteur",
          references: "CEI 60034, NEMA MG1"
        },
        {
          id: "nominal_current",
          name: "Courant Nominal",
          formula: "I = P1 / (U × √3 × cos(φ))",
          variables: {
            "I": "Courant nominal (A)",
            "P1": "Puissance électrique (kW)",
            "U": "Tension entre phases (V)",
            "cos(φ)": "Facteur de puissance"
          },
          application: "Calcul du courant de fonctionnement nominal",
          references: "Électrotechnique industrielle"
        }
      ]
    },

    // 5. FORMULES RENDEMENT
    efficiency: {
      name: "Calculs de Rendement",
      color: "bg-purple-50 border-purple-200",
      icon: "📊",
      formulas: [
        {
          id: "overall_efficiency",
          name: "Rendement Global",
          formula: "ηglobal = ηpompe × ηmoteur",
          variables: {
            "ηglobal": "Rendement global du groupe motopompe (%)",
            "ηpompe": "Rendement hydraulique de la pompe (%)", 
            "ηmoteur": "Rendement électrique du moteur (%)"
          },
          application: "Efficacité énergétique globale de l'installation",
          references: "Directive ErP 2009/125/CE, ISO 12723"
        },
        {
          id: "pump_efficiency",
          name: "Rendement Hydraulique Pompe", 
          formula: "ηpompe = Ph / P2 × 100",
          variables: {
            "ηpompe": "Rendement hydraulique de la pompe (%)",
            "Ph": "Puissance hydraulique utile (kW)",
            "P2": "Puissance mécanique absorbée (kW)"
          },
          application: "Efficacité de conversion d'énergie mécanique en énergie hydraulique",
          references: "ISO 9906, Hydraulic Institute"
        }
      ]
    },

    // 6. FORMULES VITESSE ET DÉBIT
    flow: {
      name: "Écoulement et Vitesse",
      color: "bg-cyan-50 border-cyan-200",
      icon: "🌊",
      formulas: [
        {
          id: "flow_velocity",
          name: "Vitesse d'Écoulement",
          formula: "V = Q / A = 4Q / (π × D²)",
          variables: {
            "V": "Vitesse moyenne du fluide (m/s)",
            "Q": "Débit volumique (m³/s)",
            "A": "Section transversale de la conduite (m²)",
            "D": "Diamètre intérieur de la conduite (m)"
          },
          application: "Calcul de la vitesse du fluide dans les conduites",
          references: "Équation de continuité"
        },
        {
          id: "flow_rate_conversion",
          name: "Conversion de Débit",
          formula: "Q(m³/h) = Q(m³/s) × 3600",
          variables: {
            "Q(m³/h)": "Débit en mètres cubes par heure",
            "Q(m³/s)": "Débit en mètres cubes par seconde"
          },
          application: "Conversion entre unités de débit usuelles",
          references: "Système international d'unités"
        }
      ]
    },

    // 7. FORMULES ÉLECTRIQUES - CÂBLES
    electrical_cables: {
      name: "Calculs Électriques - Câbles et Alimentation",
      color: "bg-orange-50 border-orange-200",
      icon: "⚡",
      formulas: [
        {
          id: "cable_section",
          name: "Section de Câble - Chute de Tension",
          formula: "S = (ρ × L × I) / (ΔU × √3)",
          variables: {
            "S": "Section du conducteur (mm²)",
            "ρ": "Résistivité du cuivre (0.017 Ω.mm²/m à 20°C)",
            "L": "Longueur du câble (m)",
            "I": "Courant nominal (A)",
            "ΔU": "Chute de tension admissible (V)",
            "√3": "Facteur pour triphasé (1 pour monophasé)"
          },
          application: "Dimensionnement section câble pour limiter chute tension (≤3% en éclairage, ≤5% en force)",
          references: "NFC 15-100, CEI 60364"
        },
        {
          id: "cable_current_capacity",
          name: "Courant Admissible - Échauffement",
          formula: "Iz = In × K1 × K2 × K3",
          variables: {
            "Iz": "Courant admissible en service (A)",
            "In": "Courant nominal du câble (A)",
            "K1": "Facteur température ambiante",
            "K2": "Facteur groupement des circuits",
            "K3": "Facteur mode de pose"
          },
          application: "Vérification échauffement câble selon conditions d'installation",
          references: "NFC 15-100, tableau 52C à 52K"
        },
        {
          id: "short_circuit_current",
          name: "Courant de Court-Circuit",
          formula: "Icc = U / √(R² + X²)",
          variables: {
            "Icc": "Courant de court-circuit efficace (A)",
            "U": "Tension entre phases (V)",
            "R": "Résistance totale du circuit (Ω)",
            "X": "Réactance totale du circuit (Ω)"
          },
          application: "Calcul pouvoir de coupure disjoncteurs et fusibles",
          references: "CEI 60909, NFC 13-200"
        }
      ]
    },

    // 8. FORMULES ÉLECTRIQUES - MOTEURS
    electrical_motors: {
      name: "Calculs Électriques - Moteurs",
      color: "bg-indigo-50 border-indigo-200",
      icon: "🔌",
      formulas: [
        {
          id: "motor_power_selection",
          name: "Puissance Moteur - Dimensionnement",
          formula: "Pmoteur = (Ph × Fs) / (ηpompe × ηmoteur)",
          variables: {
            "Pmoteur": "Puissance moteur nécessaire (kW)",
            "Ph": "Puissance hydraulique requise (kW)",
            "Fs": "Facteur de service (1.15 à 1.25)",
            "ηpompe": "Rendement pompe (%)",
            "ηmoteur": "Rendement moteur (%)"
          },
          application: "Choix puissance moteur avec marge sécurité",
          references: "CEI 60034, NEMA MG1"
        },
        {
          id: "starting_current",
          name: "Courant de Démarrage",
          formula: "Id = Ka × In",
          variables: {
            "Id": "Courant de démarrage (A)",
            "Ka": "Rapport intensité démarrage/nominale (5-8)",
            "In": "Courant nominal moteur (A)"
          },
          application: "Dimensionnement protection démarrage moteur",
          references: "CEI 60947-4-1"
        },
        {
          id: "motor_slip",
          name: "Glissement Moteur Asynchrone",
          formula: "g = (ns - nr) / ns × 100",
          variables: {
            "g": "Glissement (%)",
            "ns": "Vitesse synchrone (tr/min)",
            "nr": "Vitesse rotor en charge (tr/min)"
          },
          application: "Calcul glissement pour dimensionnement variateur",
          references: "Théorie machines électriques"
        }
      ]
    },

    // 9. FORMULES DIMENSIONNEMENT SYSTÈMES
    system_sizing: {
      name: "Dimensionnement et Sélection Systèmes",
      color: "bg-pink-50 border-pink-200",
      icon: "⚙️",
      formulas: [
        {
          id: "pipe_diameter_selection",
          name: "Diamètre Conduite Optimal",
          formula: "D = √((4 × Q) / (π × V))",
          variables: {
            "D": "Diamètre intérieur optimal (m)",
            "Q": "Débit volumique (m³/s)",
            "V": "Vitesse recommandée (1.5-3 m/s)",
            "π": "Pi (3.14159)"
          },
          application: "Choix diamètre pour vitesse économique (aspiration: 1-1.5 m/s, refoulement: 2-3 m/s)",
          references: "Guides techniques pompage"
        },
        {
          id: "reservoir_sizing",
          name: "Volume Réservoir - Anti-bélier",
          formula: "V = Q × t / (4 × n)",
          variables: {
            "V": "Volume réservoir minimal (m³)",
            "Q": "Débit pompe (m³/h)",
            "t": "Temps cycle min recommandé (15 min)",
            "n": "Nombre démarrages/heure max (4)"
          },
          application: "Éviter démarrages répétitifs et coups de bélier",
          references: "Standards pompage industriel"
        },
        {
          id: "thermal_protection",
          name: "Protection Thermique Moteur",
          formula: "Irth = In × (1 + 0.25 × Fs)",
          variables: {
            "Irth": "Seuil protection thermique (A)",
            "In": "Courant nominal moteur (A)",
            "Fs": "Facteur service (sans unité)"
          },
          application: "Réglage relais thermique protection moteur",
          references: "NFC 15-100, CEI 60947-4-1"
        }
      ]
    },

    // 10. FORMULES MAINTENANCE ET DIAGNOSTIC
    maintenance: {
      name: "Maintenance et Diagnostic",
      color: "bg-gray-50 border-gray-200",
      icon: "🔧",
      formulas: [
        {
          id: "bearing_life",
          name: "Durée de Vie Roulements",
          formula: "L10 = (C / P)³ × 10⁶",
          variables: {
            "L10": "Durée vie nominale (tours)",
            "C": "Charge dynamique base (N)",
            "P": "Charge équivalente (N)"
          },
          application: "Planification maintenance préventive roulements",
          references: "ISO 281, SKF General Catalogue"
        },
        {
          id: "vibration_analysis",
          name: "Analyse Vibratoire - RMS",
          formula: "Vrms = √(Σ(Vi²) / n)",
          variables: {
            "Vrms": "Valeur efficace vibration (mm/s)",
            "Vi": "Valeurs instantanées",
            "n": "Nombre mesures"
          },
          application: "Diagnostic état machine (bon: <2.8, acceptable: 2.8-7.1, mauvais: >7.1 mm/s)",
          references: "ISO 10816, NF E90-300"
        },
        {
          id: "efficiency_degradation",
          name: "Dégradation Rendement",
          formula: "Δη = (η0 - ηt) / η0 × 100",
          variables: {
            "Δη": "Dégradation rendement (%)",
            "η0": "Rendement initial (%)",
            "ηt": "Rendement actuel (%)"
          },
          application: "Indicateur usure pompe (>10% = maintenance requise)",
          references: "Hydraulic Institute, ANSI/API 610"
        }
      ]
    }
  };

  // Fonction de recherche dans les formules
  const getFilteredFormulas = () => {
    let filtered = [];
    
    Object.entries(formulaDatabase).forEach(([categoryKey, category]) => {
      if (selectedCategory === 'all' || selectedCategory === categoryKey) {
        category.formulas.forEach(formula => {
          const searchMatch = searchTerm === '' || 
            formula.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            formula.formula.toLowerCase().includes(searchTerm.toLowerCase()) ||
            Object.values(formula.variables).some(variable => 
              variable.toLowerCase().includes(searchTerm.toLowerCase())
            );
          
          if (searchMatch) {
            filtered.push({
              ...formula,
              category: categoryKey,
              categoryName: category.name,
              categoryColor: category.color,
              categoryIcon: category.icon
            });
          }
        });
      }
    });
    
    return filtered;
  };

  const filteredFormulas = getFilteredFormulas();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">📚 BASE DE DONNÉES DES FORMULES TECHNIQUES</h2>
        <p className="text-blue-100">
          Référentiel complet des équations hydrauliques, électriques et de dimensionnement
        </p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>✅ Conformité ISO 17769</div>
          <div>✅ Standards API 610</div>
          <div>✅ Normes CEI & NFC</div>
        </div>
      </div>

      {/* Sélection de catégorie */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🗂️ Sélectionner une Catégorie de Formules</h3>
          
          {/* Grille des catégories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(formulaDatabase).map(([key, category]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedCategory(key);
                  setSelectedFormula(null); // Reset sélection formule
                }}
                className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:scale-105 ${
                  selectedCategory === key
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-25'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <div className="font-semibold text-gray-800">{category.name}</div>
                    <div className="text-sm text-gray-600">{category.formulas.length} formule{category.formulas.length > 1 ? 's' : ''}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{Object.values(formulaDatabase).reduce((acc, cat) => acc + cat.formulas.length, 0)}</div>
            <div className="text-sm text-blue-800">Total Formules</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{Object.keys(formulaDatabase).length}</div>
            <div className="text-sm text-green-800">Catégories</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">ISO</div>
            <div className="text-sm text-purple-800">Conformité</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">API</div>
            <div className="text-sm text-yellow-800">Standards</div>
          </div>
        </div>
      </div>

      {/* Sélection de formule dans la catégorie */}
      {selectedCategory && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {formulaDatabase[selectedCategory].icon} {formulaDatabase[selectedCategory].name}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {formulaDatabase[selectedCategory].formulas.map((formula) => (
              <button
                key={formula.id}
                onClick={() => setSelectedFormula(formula)}
                className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                  selectedFormula?.id === formula.id
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-25'
                }`}
              >
                <div className="font-medium text-gray-800">{formula.name}</div>
                <div className="text-sm text-gray-600 mt-1 font-mono">{formula.formula}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Affichage détaillé de la formule sélectionnée */}
      {selectedFormula && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="border-l-4 border-blue-500 bg-blue-50 p-6 rounded-r-lg">
            <h3 className="text-xl font-bold text-blue-900 mb-4">
              📐 {selectedFormula.name}
            </h3>
            
            {/* Formule principale */}
            <div className="bg-white rounded-lg p-4 mb-6 shadow-inner">
              <h4 className="font-semibold text-gray-700 mb-2">Formule :</h4>
              <div className="text-lg font-mono bg-gray-100 p-3 rounded border">
                {selectedFormula.formula}
              </div>
            </div>

            {/* Variables */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Variables :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(selectedFormula.variables).map(([variable, description]) => (
                  <div key={variable} className="bg-white p-3 rounded border">
                    <span className="font-mono font-bold text-blue-600">{variable}</span>
                    <span className="text-gray-600 ml-2">: {description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Application */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Application :</h4>
              <div className="bg-green-50 border border-green-200 rounded p-3 text-green-800">
                {selectedFormula.application}
              </div>
            </div>

            {/* Références */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Références normatives :</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-800 text-sm">
                {selectedFormula.references}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message d'instruction */}
      {!selectedCategory && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-gray-500 text-lg mb-2">
            👆 Sélectionnez une catégorie ci-dessus pour voir les formules disponibles
          </div>
          <p className="text-gray-400">
            Nouvelle interface : une seule formule affichée à la fois pour plus de clarté
          </p>
        </div>
      )}

      {selectedCategory && !selectedFormula && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-gray-500 text-lg mb-2">
            👆 Choisissez une formule dans la catégorie "{formulaDatabase[selectedCategory].name}"
          </div>
          <p className="text-gray-400">
            {formulaDatabase[selectedCategory].formulas.length} formule{formulaDatabase[selectedCategory].formulas.length > 1 ? 's' : ''} disponible{formulaDatabase[selectedCategory].formulas.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

// Component pour Calcul des Réservoirs à Vessie
const ReservoirCalculator = () => {
  // État pour gérer les sous-onglets
  const [activeReservoirTab, setActiveReservoirTab] = useState('sizing'); // 'sizing' ou 'analysis'
  
  const [reservoirData, setReservoirData] = useState({
    // Type de réservoir
    reservoir_type: 'MPC-E', // MPC-E/F ou MPC-S
    
    // Paramètres de calcul
    flow_rate: 5.0, // Q - Débit moyen (m³/h)
    set_pressure: 4.0, // pset - Pression de consigne (bar)
    max_starts_per_hour: 15, // N - Nombre max de démarrages/heure (valeur recommandée pour MPC-E)
    
    // Ratios techniques - VALEURS FIXES selon type réservoir
    kQ_ratio: 0.1, // kQ - 10% pour MPC-E/F uniquement
    kH_ratio: 0.2, // kH - 20% pour MPC-E/F, 25% pour MPC-S  
    kr_ratio: 0.7, // kr - 0.7 pour MPC-E/F, 0.9 pour MPC-S
  });

  // État pour l'analyse d'installation existante
  const [analysisData, setAnalysisData] = useState({
    existing_volume: 50, // Volume réservoir existant (L)
    desired_flow: 3.0, // Débit souhaité (m³/h)
    installation_type: 'residential', // Type d'installation
    working_pressure: 4.0, // Pression de travail (bar)
    pump_type: 'MPC-E', // Type de pompe
    daily_usage_hours: 8, // Heures d'utilisation par jour
    priority: 'efficiency' // 'efficiency', 'durability', 'economy'
  });

  const [calculationResults, setCalculationResults] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);

  // Valeurs recommandées intelligentes selon le type
  const getRecommendedStarts = (type) => {
    return type === 'MPC-E' ? 15 : 10; // MPC-E: 15 démarrages, MPC-S: 10 démarrages
  };

  // Fonction d'analyse d'installation existante avec recommandations intelligentes
  const analyzeExistingInstallation = (data) => {
    const { existing_volume, desired_flow, installation_type, working_pressure, pump_type, daily_usage_hours, priority } = data;
    
    // Conversion en nombres pour éviter les erreurs
    const volume = parseFloat(existing_volume) || 0;
    const flow = parseFloat(desired_flow) || 0;
    const pressure = parseFloat(working_pressure) || 0;
    const usage = parseFloat(daily_usage_hours) || 0;
    
    // S'assurer que les variables utilisées plus tard sont aussi numériques
    const existing_volume_num = volume;
    const working_pressure_num = pressure;
    
    // Calcul performances avec volume existant
    const kr = pump_type === 'MPC-E' ? 0.7 : 0.9;
    const kH = pump_type === 'MPC-E' ? 0.2 : 0.25;
    const kQ = pump_type === 'MPC-E' ? 0.1 : 0;
    
    // Calcul nombre de démarrages possibles avec volume existant
    let max_possible_starts = 0;
    if (pump_type === 'MPC-E') {
      // Inversion formule MPC-E pour trouver N
      const numerator = kQ * flow * Math.pow(pressure + 1, 2);
      const denominator = volume * 3.6 * (kr * pressure + 1) * kH * pressure;
      if (denominator > 0) {
        const cycle_time = numerator / denominator + 10/3600;
        max_possible_starts = cycle_time > 0 ? Math.floor(3600 / (cycle_time * 3600)) : 0;
      }
    } else {
      // Inversion formule MPC-S pour trouver N  
      const numerator = 1000 * flow * (pressure + 1) * (kH * pressure + pressure + 1);
      const denominator = volume * 4 * (kr * pressure + 1) * kH * pressure;
      max_possible_starts = denominator > 0 ? Math.floor(numerator / denominator) : 0;
    }

    // S'assurer que le nombre de démarrages est positif
    max_possible_starts = Math.max(0, max_possible_starts);

    // Analyse de dimensionnement
    const optimal_volume = calculateReservoir({
      flow_rate: flow,
      set_pressure: pressure,
      max_starts_per_hour: getRecommendedStarts(pump_type),
      reservoir_type: pump_type,
      kQ_ratio: kQ,
      kH_ratio: kH,
      kr_ratio: kr
    }).calculated_volume;

    const sizing_ratio = optimal_volume > 0 ? volume / optimal_volume : 0;
    let sizing_status = '';
    let sizing_color = '';
    
    if (sizing_ratio < 0.7) {
      sizing_status = 'SOUS-DIMENSIONNÉ';
      sizing_color = 'red';
    } else if (sizing_ratio > 1.5) {
      sizing_status = 'SURDIMENSIONNÉ';  
      sizing_color = 'orange';
    } else {
      sizing_status = 'CORRECT';
      sizing_color = 'green';
    }

    // Analyse du type d'installation
    const installation_specs = {
      residential: {
        name: 'Résidentiel',
        typical_flow: [1, 5],
        typical_pressure: [2, 6],
        usage_pattern: 'Intermittent',
        priority: 'Économie'
      },
      small_commercial: {
        name: 'Petit Commerce',
        typical_flow: [3, 10],
        typical_pressure: [3, 8],
        usage_pattern: 'Régulier',
        priority: 'Fiabilité'
      },
      industrial: {
        name: 'Industriel',
        typical_flow: [8, 50],
        typical_pressure: [5, 12],
        usage_pattern: 'Continu',
        priority: 'Performance'
      },
      agricultural: {
        name: 'Agricole',
        typical_flow: [5, 30],
        typical_pressure: [2, 8],
        usage_pattern: 'Saisonnier',
        priority: 'Durabilité'
      }
    };

    const current_spec = installation_specs[installation_type] || installation_specs.residential;

    // Recommandations intelligentes selon priorité
    const recommendations = [];

    // Recommandations de dimensionnement
    if (sizing_status === 'SOUS-DIMENSIONNÉ') {
      recommendations.push({
        type: 'CRITICAL',
        category: 'Dimensionnement',
        title: 'Réservoir sous-dimensionné',
        description: `Volume actuel ${existing_volume_num}L insuffisant (optimal: ${parseFloat(optimal_volume || 0).toFixed(0)}L)`,
        actions: [
          `Installer réservoir additionnel de ${Math.ceil(parseFloat(optimal_volume || 0) - existing_volume_num)}L`,
          'Ou remplacer par réservoir plus grand',
          'Réduire nombre de démarrages à moins de 8/h en attendant'
        ],
        impact: 'Usure prématurée pompe, surconsommation électrique',
        priority: 'HAUTE'
      });
    } else if (sizing_status === 'SURDIMENSIONNÉ') {
      recommendations.push({
        type: 'INFO',
        category: 'Optimisation',
        title: 'Réservoir surdimensionné',
        description: `Volume ${existing_volume_num}L supérieur à l'optimal (${parseFloat(optimal_volume || 0).toFixed(0)}L)`,
        actions: [
          'Augmenter pression de pré-charge pour optimiser',
          'Possibilité de réduire taille lors du remplacement',
          'Avantage: cycles plus longs, moins de démarrages'
        ],
        impact: 'Coût initial majoré, mais durée de vie prolongée',
        priority: 'BASSE'
      });
    }

    // Recommandations selon type d'installation
    if (installation_type === 'industrial' && max_possible_starts < 15) {
      recommendations.push({
        type: 'WARNING',
        category: 'Performance',
        title: 'Performance insuffisante pour usage industriel',
        description: `Maximum ${max_possible_starts} démarrages/h (recommandé: >15)`,
        actions: [
          'Augmenter volume réservoir',
          'Ajouter réservoir en parallèle',
          'Installer système de régulation avancée'
        ],
        impact: 'Risque arrêt production, maintenance fréquente',
        priority: 'HAUTE'
      });
    }

    // Recommandations selon priorité utilisateur
    if (priority === 'efficiency' && pump_type === 'MPC-S') {
      recommendations.push({
        type: 'INFO',
        category: 'Efficacité Énergétique',
        title: 'Optimisation énergétique possible',
        description: 'Pompe vitesse fixe avec priorité efficacité',
        actions: [
          'Considérer upgrade vers pompe vitesse variable (MPC-E)',
          'Installer régulateur de pression',
          'Optimiser pression de pré-charge'
        ],
        impact: '15-30% économies énergie possibles',
        priority: 'MOYENNE'
      });
    }

    // Calcul coût d'exploitation annuel
    const daily_starts = Math.min(max_possible_starts, daily_usage_hours * 2); // 2 cycles/heure en moyenne
    const annual_starts = daily_starts * 365;
    const motor_life_reduction = annual_starts > 5000 ? (annual_starts - 5000) / 1000 : 0;

    return {
      sizing_analysis: {
        status: sizing_status,
        status_color: sizing_color,
        current_volume: existing_volume_num,
        optimal_volume: parseFloat(optimal_volume || 0).toFixed(0),
        sizing_ratio: parseFloat(sizing_ratio || 0).toFixed(2),
        max_possible_starts: max_possible_starts
      },
      installation_analysis: {
        type: current_spec.name,
        flow_adequacy: desired_flow >= current_spec.typical_flow[0] && desired_flow <= current_spec.typical_flow[1] ? 'ADÉQUAT' : 'HORS NORME',
        pressure_adequacy: working_pressure >= current_spec.typical_pressure[0] && working_pressure <= current_spec.typical_pressure[1] ? 'ADÉQUAT' : 'HORS NORME',
        usage_pattern: current_spec.usage_pattern,
        recommended_priority: current_spec.priority
      },
      performance_metrics: {
        daily_cycles: daily_starts,
        annual_cycles: annual_starts,
        motor_life_impact: motor_life_reduction.toFixed(1) + ' années de réduction si >5000 cycles/an',
        efficiency_rating: max_possible_starts > 15 ? 'EXCELLENT' : max_possible_starts > 10 ? 'BON' : 'LIMITE'
      },
      recommendations: recommendations,
      optimization_opportunities: [
        {
          title: 'Pression de pré-charge',
          current: `${(kr * working_pressure_num).toFixed(1)} bar`,
          optimal: `${(kr * working_pressure_num * 1.05).toFixed(1)} bar`,
          benefit: '5-10% cycles supplémentaires'
        },
        {
          title: 'Type de pompe',
          current: pump_type,
          optimal: installation_type === 'industrial' ? 'MPC-E avec VFD' : pump_type,
          benefit: pump_type !== 'MPC-E' && installation_type === 'industrial' ? '20-25% économies énergie' : 'Déjà optimal'
        }
      ]
    };
  };
  const calculateReservoir = (data) => {
    const { flow_rate, set_pressure, max_starts_per_hour, kQ_ratio, kH_ratio, kr_ratio, reservoir_type } = data;
    
    // Conversion en nombres pour éviter les erreurs
    const Q = parseFloat(flow_rate) || 0;
    const pset = parseFloat(set_pressure) || 0;
    const N = parseFloat(max_starts_per_hour) || 0;
    const kQ = parseFloat(kQ_ratio) || 0;
    const kH = parseFloat(kH_ratio) || 0;
    const kr = parseFloat(kr_ratio) || 0;
    
    let tank_volume = 0;
    let formula_used = '';
    
    // Calculs selon les formules du document technique avec valeurs fixes
    if (reservoir_type === 'MPC-E' || reservoir_type === 'MPC-F') {
      // Formule Hydro MPC-E et -F avec kQ = 10%, kH = 20%, kr = 0.7
      const numerator = kQ * Q * Math.pow(pset + 1, 2) * ((3600 / N) - 10);
      const denominator = 3.6 * (kr * pset + 1) * kH * pset;
      tank_volume = denominator > 0 ? numerator / denominator : 0;
      formula_used = `Hydro MPC-E/F: V₀ = (0.1 × ${Q} × (${pset} + 1)² × (${parseFloat(3600 / N || 0).toFixed(0)} - 10)) / (3.6 × (0.7 × ${pset} + 1) × 0.2 × ${pset})`;
    } else if (reservoir_type === 'MPC-S') {
      // Formule Hydro MPC-S avec kH = 25%, kr = 0.9 (pas de kQ)
      const numerator = 1000 * Q * (pset + 1) * (kH * pset + pset + 1);
      const denominator = 4 * N * (kr * pset + 1) * kH * pset;
      tank_volume = denominator > 0 ? numerator / denominator : 0;
      formula_used = `Hydro MPC-S: V₀ = (1000 × ${Q} × (${pset} + 1) × (0.25 × ${pset} + ${pset} + 1)) / (4 × ${N} × (0.9 × ${pset} + 1) × 0.25 × ${pset})`;
    }

    // S'assurer que le volume est positif
    tank_volume = Math.max(0, tank_volume);

    // Calcul pression maximum de service recommandée (selon standards)
    const max_service_pressure = pset * 1.5; // 150% de la pression de consigne
    
    // Calcul diamètre nominal basé sur volume et standards
    let nominal_diameter = '';
    let selected_tank_size = 0;
    
    // Sélection intelligente du réservoir standard selon volume calculé
    const standard_sizes = [
      { volume: 2, diameter: 'DN25', description: '2L - Très petit débit' },
      { volume: 5, diameter: 'DN32', description: '5L - Petit débit résidentiel' },
      { volume: 8, diameter: 'DN40', description: '8L - Résidentiel standard' },
      { volume: 12, diameter: 'DN40', description: '12L - Résidentiel renforcé' },
      { volume: 18, diameter: 'DN50', description: '18L - Petit collectif' },
      { volume: 24, diameter: 'DN50', description: '24L - Collectif standard' },
      { volume: 35, diameter: 'DN65', description: '35L - Moyen collectif' },
      { volume: 50, diameter: 'DN65', description: '50L - Grand collectif' },
      { volume: 80, diameter: 'DN80', description: '80L - Petit industriel' },
      { volume: 100, diameter: 'DN80', description: '100L - Industriel standard' },
      { volume: 150, diameter: 'DN100', description: '150L - Industriel renforcé' },
      { volume: 200, diameter: 'DN100', description: '200L - Grand industriel' },
      { volume: 300, diameter: 'DN125', description: '300L - Très grand industriel' },
      { volume: 500, diameter: 'DN150', description: '500L - Industriel lourd' }
    ];
    
    // Sélection du réservoir avec marge de sécurité 10%
    const required_volume_with_margin = tank_volume * 1.1;
    const selected_reservoir = standard_sizes.find(size => size.volume >= required_volume_with_margin);
    
    if (selected_reservoir) {
      selected_tank_size = selected_reservoir.volume;
      nominal_diameter = selected_reservoir.diameter;
    } else {
      // Volume trop important, réservoir sur mesure
      selected_tank_size = Math.ceil(required_volume_with_margin / 50) * 50; // Arrondi aux 50L
      nominal_diameter = 'Sur mesure (>DN150)';
    }

    // Calcul de la pression de pré-charge optimale
    const precharge_pressure = kr_ratio * set_pressure;
    
    // Analyse de performance
    const cycles_per_hour = max_starts_per_hour;
    const volume_per_cycle = selected_tank_size / cycles_per_hour;
    
    // Recommandations techniques
    const recommendations = [];
    
    if (tank_volume < 2) {
      recommendations.push({
        type: 'INFO',
        message: 'Volume très faible - Vérifier si un réservoir est nécessaire',
        icon: 'ℹ️'
      });
    }
    
    if (max_starts_per_hour > 30) {
      recommendations.push({
        type: 'WARNING',
        message: 'Nombre de démarrages élevé - Risque usure prématurée pompe',
        icon: '⚠️'
      });
    }
    
    if (set_pressure > 8) {
      recommendations.push({
        type: 'CRITICAL',
        message: 'Pression élevée - Vérifier compatibilité matériaux',
        icon: '🔴'
      });
    }
    
    if (selected_tank_size > 200) {
      recommendations.push({
        type: 'INFO',
        message: 'Gros volume - Considérer réservoir horizontal ou sur mesure',
        icon: '📏'
      });
    }

    return {
      calculated_volume: tank_volume,
      selected_tank_size: selected_tank_size,
      nominal_diameter: nominal_diameter,
      max_service_pressure: max_service_pressure,
      precharge_pressure: precharge_pressure,
      formula_used: formula_used,
      volume_per_cycle: volume_per_cycle,
      recommendations: recommendations,
      technical_data: {
        working_pressure_range: `${precharge_pressure.toFixed(1)} - ${set_pressure.toFixed(1)} bar`,
        membrane_material: reservoir_type === 'MPC-S' ? 'EPDM renforcé' : 'EPDM standard',
        connection_type: nominal_diameter,
        application: flow_rate < 2 ? 'Résidentiel' : flow_rate < 10 ? 'Collectif' : 'Industriel'
      }
    };
  };

  // Mise à jour temps réel des calculs de dimensionnement
  useEffect(() => {
    const results = calculateReservoir(reservoirData);
    setCalculationResults(results);
  }, [reservoirData]);

  // Mise à jour temps réel des analyses d'installation existante
  useEffect(() => {
    const results = analyzeExistingInstallation(analysisData);
    setAnalysisResults(results);
  }, [analysisData]);

  const handleInputChange = (field, value) => {
    setReservoirData(prev => ({
      ...prev,
      [field]: value === '' ? 0 : parseFloat(value) || 0
    }));
  };

  const handleTypeChange = (type) => {
    // Valeurs fixes selon le type de réservoir
    const typeConfigs = {
      'MPC-E': {
        kQ_ratio: 0.1,  // 10% pour MPC-E/F
        kH_ratio: 0.2,  // 20% pour MPC-E/F
        kr_ratio: 0.7,   // 0.7 pour MPC-E/F
        recommended_starts: 15 // Recommandé pour vitesse variable
      },
      'MPC-S': {
        kQ_ratio: 0,    // Pas de kQ pour MPC-S
        kH_ratio: 0.25, // 25% pour MPC-S
        kr_ratio: 0.9,   // 0.9 pour MPC-S
        recommended_starts: 10 // Recommandé pour vitesse fixe
      }
    };

    const config = typeConfigs[type] || typeConfigs['MPC-E'];
    
    setReservoirData(prev => ({
      ...prev,
      reservoir_type: type,
      kQ_ratio: config.kQ_ratio,
      kH_ratio: config.kH_ratio,
      kr_ratio: config.kr_ratio,
      max_starts_per_hour: config.recommended_starts // Met à jour avec la valeur recommandée
    }));
  };

  const handleAnalysisInputChange = (field, value) => {
    setAnalysisData(prev => ({
      ...prev,
      [field]: typeof value === 'string' && !['installation_type', 'pump_type', 'priority'].includes(field) 
        ? (value === '' ? 0 : parseFloat(value) || 0)
        : value
    }));
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">🏗️ Calcul Réservoirs à Vessie</h2>
        <p className="text-indigo-100">Dimensionnement intelligent et analyse d'installations existantes</p>
      </div>

      {/* Navigation sous-onglets */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveReservoirTab('sizing')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              activeReservoirTab === 'sizing'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>📐</span>
            <span>Dimensionnement</span>
          </button>
          <button
            onClick={() => setActiveReservoirTab('analysis')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              activeReservoirTab === 'analysis'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>🔍</span>
            <span>Analyse Existant</span>
          </button>
        </div>

        {/* Contenu du sous-onglet Dimensionnement */}
        {activeReservoirTab === 'sizing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Panneau de saisie Dimensionnement */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">📊 Paramètres de Calcul</h3>
              
              {/* Type de réservoir */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Type de Réservoir</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleTypeChange('MPC-E')}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      reservoirData.reservoir_type === 'MPC-E'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold">MPC-E/F</div>
                    <div className="text-xs mt-1">Vitesse Variable</div>
                  </button>
                  <button
                    onClick={() => handleTypeChange('MPC-S')}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      reservoirData.reservoir_type === 'MPC-S'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold">MPC-S</div>
                    <div className="text-xs mt-1">Vitesse Fixe</div>
                  </button>
                </div>
              </div>

              {/* Paramètres principaux */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Débit Moyen (m³/h)
                  </label>
                  <input
                    type="number"
                    value={reservoirData.flow_rate}
                    onChange={(e) => handleInputChange('flow_rate', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    step="0.1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pression de Consigne (bar)
                  </label>
                  <input
                    type="number"
                    value={reservoirData.set_pressure}
                    onChange={(e) => handleInputChange('set_pressure', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    step="0.1"
                    min="0"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Démarrages Max/h
                    </label>
                    <button
                      onClick={() => setReservoirData(prev => ({...prev, max_starts_per_hour: getRecommendedStarts(prev.reservoir_type)}))}
                      className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                    >
                      Valeur recommandée: {getRecommendedStarts(reservoirData.reservoir_type)}
                    </button>
                  </div>
                  <input
                    type="number"
                    value={reservoirData.max_starts_per_hour}
                    onChange={(e) => handleInputChange('max_starts_per_hour', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    min="1"
                    max="60"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    💡 MPC-E/F: 15 recommandé • MPC-S: 10 recommandé (protection moteur)
                  </div>
                </div>
              </div>

              {/* Paramètres techniques (valeurs fixes selon type) */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">⚙️ Paramètres Techniques (Valeurs Fixes)</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  
                  {/* Affichage kQ seulement pour MPC-E/F */}
                  {reservoirData.reservoir_type === 'MPC-E' && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Ratio kQ (Débit nominal/arrêt)</span>
                      <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {(reservoirData.kQ_ratio * 100).toFixed(0)}% (0.1)
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Ratio kH (P arrêt/P démarrage)</span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {(reservoirData.kH_ratio * 100).toFixed(0)}% ({reservoirData.kH_ratio})
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Ratio kr (P pré-charge/P consigne)</span>
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {(reservoirData.kr_ratio * 100).toFixed(0)}% ({reservoirData.kr_ratio})
                    </span>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    {reservoirData.reservoir_type === 'MPC-E' 
                      ? '⚙️ Valeurs optimisées pour pompes à vitesse variable (MPC-E/F)'
                      : '⚙️ Valeurs optimisées pour pompes à vitesse fixe (MPC-S)'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Panneau de résultats Dimensionnement */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">📋 Résultats de Calcul</h3>
              
              {calculationResults && (
                <div className="space-y-6">
                  {/* Résultats principaux */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                      <div className="text-2xl font-bold text-indigo-600">
                        {calculationResults.selected_tank_size}L
                      </div>
                      <div className="text-sm text-gray-600">Volume Réservoir</div>
                      <div className="text-xs text-indigo-500 mt-1">
                        Calculé: {calculationResults.calculated_volume.toFixed(1)}L
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">
                        {calculationResults.nominal_diameter}
                      </div>
                      <div className="text-sm text-gray-600">Diamètre Nominal</div>
                      <div className="text-xs text-green-500 mt-1">
                        Raccordement standard
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="text-2xl font-bold text-orange-600">
                        {calculationResults.max_service_pressure.toFixed(1)} bar
                      </div>
                      <div className="text-sm text-gray-600">Pression Max Service</div>
                      <div className="text-xs text-orange-500 mt-1">
                        150% pression consigne
                      </div>
                    </div>
                    <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                      <div className="text-2xl font-bold text-cyan-600">
                        {calculationResults.precharge_pressure.toFixed(1)} bar
                      </div>
                      <div className="text-sm text-gray-600">Pré-charge</div>
                      <div className="text-xs text-cyan-500 mt-1">
                        {(reservoirData.kr_ratio * 100).toFixed(0)}% pression consigne
                      </div>
                    </div>
                  </div>

                  {/* Données techniques */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">🔧 Données Techniques</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div><strong>Plage de travail:</strong> {calculationResults.technical_data.working_pressure_range}</div>
                      <div><strong>Matériau membrane:</strong> {calculationResults.technical_data.membrane_material}</div>
                      <div><strong>Type raccordement:</strong> {calculationResults.technical_data.connection_type}</div>
                      <div><strong>Application:</strong> {calculationResults.technical_data.application}</div>
                    </div>
                  </div>

                  {/* Recommandations */}
                  {calculationResults.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">💡 Recommandations</h4>
                      {calculationResults.recommendations.map((rec, index) => (
                        <div key={index} className={`p-3 rounded-lg border-l-4 ${
                          rec.type === 'CRITICAL' ? 'bg-red-50 border-red-400 text-red-700' :
                          rec.type === 'WARNING' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' :
                          'bg-blue-50 border-blue-400 text-blue-700'
                        }`}>
                          <div className="flex items-start space-x-2">
                            <span>{rec.icon}</span>
                            <span className="text-sm">{rec.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formule utilisée */}
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">📐 Formule Appliquée</h4>
                    <div className="text-xs text-blue-700 font-mono">
                      {calculationResults.formula_used}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contenu du sous-onglet Analyse Existant */}
        {activeReservoirTab === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Panneau de saisie Analyse */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">🔍 Analyse Installation Existante</h3>
              
              {/* Paramètres installation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Volume Réservoir Existant (L)
                  </label>
                  <input
                    type="number"
                    value={analysisData.existing_volume}
                    onChange={(e) => handleAnalysisInputChange('existing_volume', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Débit Souhaité (m³/h)
                  </label>
                  <input
                    type="number"
                    value={analysisData.desired_flow}
                    onChange={(e) => handleAnalysisInputChange('desired_flow', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                    step="0.1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pression de Travail (bar)
                  </label>
                  <input
                    type="number"
                    value={analysisData.working_pressure}
                    onChange={(e) => handleAnalysisInputChange('working_pressure', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                    step="0.1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Utilisation (h/jour)
                  </label>
                  <input
                    type="number"
                    value={analysisData.daily_usage_hours}
                    onChange={(e) => handleAnalysisInputChange('daily_usage_hours', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                    min="1"
                    max="24"
                  />
                </div>
              </div>

              {/* Type d'installation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Type d'Installation</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAnalysisInputChange('installation_type', 'residential')}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      analysisData.installation_type === 'residential'
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold">🏠 Résidentiel</div>
                    <div className="text-xs mt-1">1-5 m³/h</div>
                  </button>
                  <button
                    onClick={() => handleAnalysisInputChange('installation_type', 'small_commercial')}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      analysisData.installation_type === 'small_commercial'
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold">🏪 Commerce</div>
                    <div className="text-xs mt-1">3-10 m³/h</div>
                  </button>
                  <button
                    onClick={() => handleAnalysisInputChange('installation_type', 'industrial')}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      analysisData.installation_type === 'industrial'
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold">🏭 Industriel</div>
                    <div className="text-xs mt-1">8-50 m³/h</div>
                  </button>
                  <button
                    onClick={() => handleAnalysisInputChange('installation_type', 'agricultural')}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      analysisData.installation_type === 'agricultural'
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold">🚜 Agricole</div>
                    <div className="text-xs mt-1">5-30 m³/h</div>
                  </button>
                </div>
              </div>

              {/* Type de pompe et priorité */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de Pompe</label>
                  <select
                    value={analysisData.pump_type}
                    onChange={(e) => handleAnalysisInputChange('pump_type', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="MPC-E">MPC-E/F (Vitesse Variable)</option>
                    <option value="MPC-S">MPC-S (Vitesse Fixe)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                  <select
                    value={analysisData.priority}
                    onChange={(e) => handleAnalysisInputChange('priority', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="efficiency">Efficacité Énergétique</option>
                    <option value="durability">Durabilité</option>
                    <option value="economy">Économie</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Panneau de résultats Analyse */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">📊 Analyse et Préconisations</h3>
              
              {analysisResults && (
                <div className="space-y-6">
                  {/* Statut dimensionnement */}
                  <div className={`p-4 rounded-lg border-2 ${
                    analysisResults.sizing_analysis.status_color === 'red' 
                      ? 'bg-red-50 border-red-300' 
                      : analysisResults.sizing_analysis.status_color === 'orange'
                      ? 'bg-orange-50 border-orange-300'
                      : 'bg-green-50 border-green-300'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-lg">Dimensionnement: {analysisResults.sizing_analysis.status}</h4>
                      <span className="text-sm">Max démarrages: {analysisResults.sizing_analysis.max_possible_starts}/h</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Volume actuel:</strong> {analysisResults.sizing_analysis.current_volume}L</div>
                      <div><strong>Volume optimal:</strong> {analysisResults.sizing_analysis.optimal_volume}L</div>
                      <div><strong>Ratio:</strong> {analysisResults.sizing_analysis.sizing_ratio}</div>
                      <div><strong>Performance:</strong> {analysisResults.performance_metrics.efficiency_rating}</div>
                    </div>
                  </div>

                  {/* Analyse installation */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3">🏗️ Analyse Installation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div><strong>Type:</strong> {analysisResults.installation_analysis.type}</div>
                      <div><strong>Usage:</strong> {analysisResults.installation_analysis.usage_pattern}</div>
                      <div><strong>Débit:</strong> {analysisResults.installation_analysis.flow_adequacy}</div>
                      <div><strong>Pression:</strong> {analysisResults.installation_analysis.pressure_adequacy}</div>
                    </div>
                  </div>

                  {/* Métriques performance */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">📈 Métriques Performance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div><strong>Cycles/jour:</strong> {analysisResults.performance_metrics.daily_cycles}</div>
                      <div><strong>Cycles/an:</strong> {analysisResults.performance_metrics.annual_cycles}</div>
                      <div className="md:col-span-2"><strong>Impact vie moteur:</strong> {analysisResults.performance_metrics.motor_life_impact}</div>
                    </div>
                  </div>

                  {/* Opportunités d'optimisation */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-3">🚀 Opportunités d'Optimisation</h4>
                    {analysisResults.optimization_opportunities.map((opp, index) => (
                      <div key={index} className="mb-3 last:mb-0">
                        <div className="flex justify-between items-center text-sm">
                          <span><strong>{opp.title}:</strong></span>
                          <span className="text-purple-600">{opp.benefit}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {opp.current} → {opp.optimal}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommandations intelligentes */}
                  {analysisResults.recommendations.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">💡 Recommandations Intelligentes</h4>
                      {analysisResults.recommendations.map((rec, index) => (
                        <div key={index} className={`p-4 rounded-lg border-l-4 ${
                          rec.type === 'CRITICAL' ? 'bg-red-50 border-red-400' :
                          rec.type === 'WARNING' ? 'bg-yellow-50 border-yellow-400' :
                          'bg-blue-50 border-blue-400'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-semibold text-sm">{rec.title}</h5>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              rec.priority === 'HAUTE' ? 'bg-red-200 text-red-800' :
                              rec.priority === 'MOYENNE' ? 'bg-orange-200 text-orange-800' :
                              'bg-blue-200 text-blue-800'
                            }`}>
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                          <div className="text-xs text-gray-600 mb-2"><strong>Impact:</strong> {rec.impact}</div>
                          <div className="text-xs">
                            <strong>Actions:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {rec.actions.map((action, idx) => (
                                <li key={idx}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const NPSHdCalculator = ({ fluids, pipeMaterials, fittings }) => {
  // Options DN normalisées (diamètres extérieurs réels selon standards)
  const dnOptions = [
    { value: '', label: "Sélectionnez un diamètre" },
    { value: 26.9, label: "DN20 (26.9mm)" },
    { value: 33.7, label: "DN25 (33.7mm)" },
    { value: 42.4, label: "DN32 (42.4mm)" },
    { value: 48.3, label: "DN40 (48.3mm)" },
    { value: 60.3, label: "DN50 (60.3mm)" },
    { value: 76.1, label: "DN65 (76.1mm)" },
    { value: 88.9, label: "DN80 (88.9mm)" },
    { value: 114.3, label: "DN100 (114.3mm)" },
    { value: 139.7, label: "DN125 (139.7mm)" },
    { value: 168.3, label: "DN150 (168.3mm)" },
    { value: 219.1, label: "DN200 (219.1mm)" },
    { value: 273.1, label: "DN250 (273.1mm)" },
    { value: 323.9, label: "DN300 (323.9mm)" },
    { value: 355.6, label: "DN350 (355.6mm)" },
    { value: 406.4, label: "DN400 (406.4mm)" },
    { value: 457.2, label: "DN450 (457.2mm)" },
    { value: 508, label: "DN500 (508mm)" }
  ];

  const [inputData, setInputData] = useState({
    suction_type: 'flooded',
    hasp: 3.0,
    flow_rate: 50,
    fluid_type: 'water',
    temperature: 20,
    pipe_diameter: 114.3,
    pipe_material: 'pvc',
    pipe_length: 50,
    suction_fittings: [],
    npsh_required: 3.5  // Nouveau champ pour NPSH requis
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setInputData(prev => ({ ...prev, [field]: value }));
  };

  const addFitting = () => {
    setInputData(prev => ({
      ...prev,
      suction_fittings: [...prev.suction_fittings, { fitting_type: 'elbow_90', quantity: 1 }]
    }));
  };

  const removeFitting = (index) => {
    setInputData(prev => ({
      ...prev,
      suction_fittings: prev.suction_fittings.filter((_, i) => i !== index)
    }));
  };

  const updateFitting = (index, field, value) => {
    setInputData(prev => ({
      ...prev,
      suction_fittings: prev.suction_fittings.map((fitting, i) => 
        i === index ? { ...fitting, [field]: value } : fitting
      )
    }));
  };

  const calculateNPSHd = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/calculate-npshd`, inputData);
      setResult(response.data);
    } catch (error) {
      console.error('Erreur calcul NPSHd:', error);
      alert('Erreur lors du calcul NPSHd: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-inter" style={professionalStyles}>
      {/* En-tête professionnel */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 tracking-tight">
              🔷 Calcul NPSHd Professionnel
            </h2>
            <p className="text-blue-100 text-lg font-medium">
              Net Positive Suction Head Available - Analyse de cavitation critique
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <div className="text-2xl font-bold">NPSHd</div>
              <div className="text-sm opacity-90">Conformité ISO 17769</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Parameters Principaux */}
      <ProfessionalSection 
        title="Paramètres Principaux" 
        icon="⚙️"
        className="shadow-xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <ProfessionalLabel required>Type d'Aspiration</ProfessionalLabel>
              <ProfessionalSelect
                value={inputData.suction_type}
                onChange={(e) => handleInputChange('suction_type', e.target.value)}
                required
              >
                <option value="flooded">🔵 Aspiration en charge</option>
                <option value="suction_lift">🔴 Aspiration en dépression</option>
              </ProfessionalSelect>
            </div>
            
            <div>
              <ProfessionalLabel required>Hauteur d'Aspiration Hasp (m)</ProfessionalLabel>
              <ProfessionalInput
                type="number"
                value={inputData.hasp}
                onChange={(e) => handleInputChange('hasp', parseFloat(e.target.value))}
                required
                style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
              />
              <style jsx>{`
                input[type="number"]::-webkit-outer-spin-button,
                input[type="number"]::-webkit-inner-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
                input[type="number"] {
                  -moz-appearance: textfield;
                }
              `}</style>
              <p className="text-xs text-gray-500 mt-1">
                {inputData.suction_type === 'flooded' ? 'Hauteur de fluide au-dessus de la pompe' : 'Hauteur de dénivelé à aspirer'}
              </p>
            </div>
              
              <div>
                <ProfessionalLabel required>Débit (m³/h)</ProfessionalLabel>
                <ProfessionalInput
                  type="number"
                  value={inputData.flow_rate}
                  onChange={(e) => handleInputChange('flow_rate', parseFloat(e.target.value))}
                  required
                  placeholder="Ex: 50"
                />
              </div>
              
              <div>
                <ProfessionalLabel required>Type de Fluide</ProfessionalLabel>
                <ProfessionalSelect
                  value={inputData.fluid_type}
                  onChange={(e) => handleInputChange('fluid_type', e.target.value)}
                  required
                >
                  <option value="">-- Choisir un fluide --</option>
                  {fluids.map(fluid => (
                    <option key={fluid.id} value={fluid.id}>
                      {fluid.name}
                    </option>
                  ))}
                </ProfessionalSelect>
              </div>
              
              <div>
                <ProfessionalLabel required>Température (°C)</ProfessionalLabel>
                <ProfessionalInput
                  type="number"
                  value={inputData.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                  required
                  placeholder="Ex: 20"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <ProfessionalLabel required>Diamètre de tuyauterie</ProfessionalLabel>
              <ProfessionalSelect
                value={inputData.pipe_diameter}
                onChange={(e) => handleInputChange('pipe_diameter', parseFloat(e.target.value))}
                required
              >
                {dnOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </ProfessionalSelect>
            </div>
            
            <div>
              <ProfessionalLabel>Matériau de Tuyauterie</ProfessionalLabel>
              <ProfessionalSelect
                value={inputData.pipe_material}
                onChange={(e) => handleInputChange('pipe_material', e.target.value)}
              >
                <option value="">-- Choisir un matériau --</option>
                {pipeMaterials.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.name} (ε = {material.roughness} mm)
                  </option>
                ))}
              </ProfessionalSelect>
            </div>
            
            <div>
              <ProfessionalLabel>Longueur Tuyauterie (m)</ProfessionalLabel>
              <ProfessionalInput
                type="number"
                value={inputData.pipe_length}
                onChange={(e) => handleInputChange('pipe_length', parseFloat(e.target.value))}
                placeholder="Ex: 50"
              />
            </div>
            
            <div>
              <ProfessionalLabel required>NPSH Requis (m)</ProfessionalLabel>
              <ProfessionalInput
                type="number"
                value={inputData.npsh_required}
                onChange={(e) => handleInputChange('npsh_required', parseFloat(e.target.value))}
                required
                placeholder="Ex: 3.5"
              />
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                <p className="text-xs text-yellow-800">
                  <span className="font-semibold">💡 Info :</span> Valeur fournie par constructeur pompe
                </p>
              </div>
            </div>
          </div>
        
        {/* Bouton de Calcul Professionnel */}
        <div className="flex justify-center mt-8">
          <button
            onClick={calculateNPSHd}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                       disabled:opacity-50 text-white font-bold py-4 px-12 rounded-xl shadow-lg 
                       transform transition-all duration-200 hover:scale-105 hover:shadow-xl
                       disabled:hover:scale-100 disabled:hover:shadow-lg
                       text-lg tracking-wide min-w-[200px]"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Calcul en cours...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="mr-3">🔷</span>
                Calculer NPSHd
              </div>
            )}
          </button>
        </div>
      </ProfessionalSection>

      {/* Raccords */}
      <ProfessionalSection title="Raccords d'Aspiration" icon="🔧">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={addFitting}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            + Ajouter Raccord
          </button>
        </div>
          
          <div className="space-y-2">
            {inputData.suction_fittings.map((fitting, index) => (
              <div key={index} className="flex items-center space-x-2">
                <select
                  value={fitting.fitting_type}
                  onChange={(e) => updateFitting(index, 'fitting_type', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {fittings.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={fitting.quantity}
                  onChange={(e) => updateFitting(index, 'quantity', parseInt(e.target.value))}
                  min="1"
                  className="w-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => removeFitting(index)}
                  className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
      </ProfessionalSection>
      
      {/* Résultats */}
      {result && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Résultats NPSHd</h3>
          
          {result.warnings && result.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Avertissements</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {result.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 border-b pb-2">Paramètres Calculés</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Pression atmosphérique:</span>
                  <span className="font-medium">{(result.atmospheric_pressure / 1000).toFixed(1)} kPa</span>
                </div>
                <div className="flex justify-between">
                  <span>Vitesse:</span>
                  <span className="font-medium">{result.velocity?.toFixed(2)} m/s</span>
                </div>
                <div className="flex justify-between">
                  <span>Nombre de Reynolds:</span>
                  <span className="font-medium">{result.reynolds_number?.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Facteur de friction:</span>
                  <span className="font-medium">{result.friction_factor?.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pression vapeur:</span>
                  <span className="font-medium">{(result.fluid_properties.vapor_pressure / 1000).toFixed(1)} kPa</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 border-b pb-2">Pertes de Charge</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Pertes linéaires:</span>
                  <span className="font-medium">{result.linear_head_loss?.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between">
                  <span>Pertes singulières:</span>
                  <span className="font-medium">{result.singular_head_loss?.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between">
                  <span>Pertes totales:</span>
                  <span className="font-medium">{result.total_head_loss?.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">NPSHd:</span>
                  <span className="font-bold text-blue-600">{result.npshd?.toFixed(2)} m</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Section Comparaison NPSH et Analyse de Cavitation */}
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Analyse de Cavitation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 border-b pb-2">Comparaison NPSH</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>NPSH Requis (constructeur):</span>
                    <span className="font-medium">{result.npsh_required?.toFixed(2)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NPSHd Calculé:</span>
                    <span className="font-medium">{result.npshd?.toFixed(2)} m</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Marge de sécurité:</span>
                    <span className={`font-bold ${result.npsh_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.npsh_margin?.toFixed(2)} m
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 border-b pb-2">Statut de Cavitation</h4>
                <div className="text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    result.cavitation_risk ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {result.cavitation_risk ? '🚨 RISQUE DE CAVITATION' : '✅ AUCUN RISQUE'}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {result.cavitation_risk ? 
                      'Des corrections sont nécessaires' : 
                      'Installation sécurisée'
                    }
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recommandations de correction */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-3">💡 Recommandations de Correction</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {result.recommendations.map((recommendation, index) => (
                    <li key={index} className="leading-relaxed">
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Schéma d'Installation Dynamique */}
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Schéma d'Installation Dynamique</h3>
            
            <div className="flex justify-center">
              <svg width="600" height="400" viewBox="0 0 600 400" className="border border-gray-200 rounded-lg">
                {/* Fond */}
                <rect width="600" height="400" fill="#f8fafc" />
                
                {/* Configuration dynamique selon le type d'aspiration */}
                {(() => {
                  const isFlooded = inputData.suction_type === 'flooded';
                  const reservoirY = isFlooded ? 150 : 250;
                  const reservoirHeight = isFlooded ? 100 : 80;
                  const pumpY = isFlooded ? 280 : 180;
                  const waterLevel = reservoirY + 20;
                  
                  // Calcul de la hauteur dynamique
                  const heightScale = Math.min(Math.max(inputData.hasp * 15, 30), 120);
                  const actualPumpY = isFlooded ? waterLevel + heightScale : waterLevel - heightScale;
                  
                  return (
                    <>
                      {/* Réservoir */}
                      <rect 
                        x="50" 
                        y={reservoirY} 
                        width="180" 
                        height={reservoirHeight} 
                        fill="#e5e7eb" 
                        stroke="#6b7280" 
                        strokeWidth="2"
                      />
                      
                      {/* Niveau d'eau */}
                      <rect 
                        x="55" 
                        y={waterLevel} 
                        width="170" 
                        height={reservoirHeight - 25} 
                        fill="#3b82f6" 
                        opacity="0.6"
                      />
                      
                      {/* Étiquette du réservoir */}
                      <text x="140" y={reservoirY - 10} textAnchor="middle" className="text-sm font-medium" fill="#1f2937">
                        Réservoir
                      </text>
                      
                      {/* Ligne d'eau */}
                      <line x1="50" y1={waterLevel} x2="230" y2={waterLevel} stroke="#1d4ed8" strokeWidth="2" strokeDasharray="5,5" />
                      <text x="240" y={waterLevel + 5} className="text-xs font-medium" fill="#1d4ed8">
                        Niveau d'eau
                      </text>
                      
                      {/* Tuyauterie d'aspiration */}
                      <line 
                        x1="230" 
                        y1={waterLevel} 
                        x2="350" 
                        y2={actualPumpY + 25} 
                        stroke="#4b5563" 
                        strokeWidth="6"
                      />
                      <circle cx="230" cy={waterLevel} r="3" fill="#4b5563" />
                      
                      {/* Pompe - Position dynamique */}
                      <rect 
                        x="350" 
                        y={actualPumpY} 
                        width="70" 
                        height="50" 
                        fill="#10b981" 
                        stroke="#059669" 
                        strokeWidth="2"
                        rx="5"
                      />
                      <text x="385" y={actualPumpY + 30} textAnchor="middle" className="text-xs font-bold" fill="white">
                        POMPE
                      </text>
                      
                      {/* Tuyauterie de refoulement */}
                      <line 
                        x1="420" 
                        y1={actualPumpY + 25} 
                        x2="500" 
                        y2={actualPumpY + 25} 
                        stroke="#4b5563" 
                        strokeWidth="6"
                      />
                      <line 
                        x1="500" 
                        y1={actualPumpY + 25} 
                        x2="500" 
                        y2="120" 
                        stroke="#4b5563" 
                        strokeWidth="6"
                      />
                      
                      {/* Sortie */}
                      <rect x="495" y="115" width="10" height="10" fill="#10b981" />
                      <text x="510" y="125" className="text-xs font-medium" fill="#10b981">
                        Sortie
                      </text>
                      
                      {/* Cotes dynamiques - Hauteur d'aspiration */}
                      <defs>
                        <marker id="arrowRed" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                          <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
                        </marker>
                        <marker id="arrowGreen" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                          <polygon points="0 0, 8 3, 0 6" fill="#059669" />
                        </marker>
                      </defs>
                      
                      {/* Cote hauteur */}
                      <line 
                        x1="30" 
                        y1={waterLevel} 
                        x2="30" 
                        y2={actualPumpY + 25} 
                        stroke="#ef4444" 
                        strokeWidth="1"
                        markerEnd="url(#arrowRed)"
                      />
                      <line 
                        x1="30" 
                        y1={actualPumpY + 25} 
                        x2="30" 
                        y2={waterLevel} 
                        stroke="#ef4444" 
                        strokeWidth="1"
                        markerEnd="url(#arrowRed)"
                      />
                      
                      <text 
                        x="15" 
                        y={(waterLevel + actualPumpY + 25) / 2} 
                        textAnchor="middle" 
                        className="text-xs font-bold" 
                        fill="#ef4444"
                      >
                        {inputData.hasp.toFixed(1)}m
                      </text>
                      
                      <text 
                        x="15" 
                        y={(waterLevel + actualPumpY + 25) / 2 + 15} 
                        textAnchor="middle" 
                        className="text-xs" 
                        fill="#ef4444"
                      >
                        {isFlooded ? '(en charge)' : '(dépression)'}
                      </text>
                      
                      {/* Flèche de débit */}
                      <line 
                        x1="280" 
                        y1={waterLevel + 10} 
                        x2="320" 
                        y2={actualPumpY + 15} 
                        stroke="#059669" 
                        strokeWidth="3"
                        markerEnd="url(#arrowGreen)"
                      />
                      <text 
                        x="300" 
                        y={(waterLevel + actualPumpY) / 2} 
                        textAnchor="middle" 
                        className="text-xs font-bold" 
                        fill="#059669"
                      >
                        {inputData.flow_rate} m³/h
                      </text>
                      
                      {/* Informations techniques */}
                      <rect x="450" y="30" width="140" height="100" fill="white" stroke="#d1d5db" strokeWidth="1" rx="5" />
                      <text x="460" y="45" className="text-xs font-bold" fill="#1f2937">Paramètres:</text>
                      <text x="460" y="60" className="text-xs" fill="#4b5563">⌀ {inputData.pipe_diameter}mm</text>
                      <text x="460" y="75" className="text-xs" fill="#4b5563">L: {inputData.pipe_length}m</text>
                      <text x="460" y="90" className="text-xs" fill="#4b5563">T: {inputData.temperature}°C</text>
                      <text x="460" y="105" className="text-xs" fill="#4b5563">
                        NPSH req: {inputData.npsh_required}m
                      </text>
                      {result && (
                        <text x="460" y="120" className="text-xs font-bold" fill="#10b981">
                          V: {result.velocity?.toFixed(2)}m/s
                        </text>
                      )}
                      
                      {/* Indicateur de risque */}
                      {result && (
                        <circle 
                          cx="570" 
                          cy="50" 
                          r="8" 
                          fill={result.cavitation_risk ? "#ef4444" : "#10b981"}
                        />
                      )}
                      {result && (
                        <text 
                          x="570" 
                          y="55" 
                          textAnchor="middle" 
                          className="text-xs font-bold" 
                          fill="white"
                        >
                          {result.cavitation_risk ? "!" : "✓"}
                        </text>
                      )}
                    </>
                  );
                })()}
              </svg>
            </div>
            
            <div className="mt-4 text-sm text-gray-600 text-center">
              <p className="font-medium">
                Schéma dynamique - Position de la pompe ajustée selon le type d'aspiration et la hauteur
              </p>
              <p className="text-xs mt-1">
                {inputData.suction_type === 'flooded' ? 
                  '🔵 Configuration "en charge" : Pompe sous le niveau d\'eau' : 
                  '🔴 Configuration "dépression" : Pompe au-dessus du niveau d\'eau'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component pour Tab 2 - Calcul HMT
const HMTCalculator = ({ fluids, pipeMaterials, fittings }) => {
  // Options DN normalisées (diamètres extérieurs réels selon standards)
  const dnOptions = [
    { value: '', label: "Sélectionnez un diamètre" },
    { value: 26.9, label: "DN20 (26.9mm)" },
    { value: 33.7, label: "DN25 (33.7mm)" },
    { value: 42.4, label: "DN32 (42.4mm)" },
    { value: 48.3, label: "DN40 (48.3mm)" },
    { value: 60.3, label: "DN50 (60.3mm)" },
    { value: 76.1, label: "DN65 (76.1mm)" },
    { value: 88.9, label: "DN80 (88.9mm)" },
    { value: 114.3, label: "DN100 (114.3mm)" },
    { value: 139.7, label: "DN125 (139.7mm)" },
    { value: 168.3, label: "DN150 (168.3mm)" },
    { value: 219.1, label: "DN200 (219.1mm)" },
    { value: 273.1, label: "DN250 (273.1mm)" },
    { value: 323.9, label: "DN300 (323.9mm)" },
    { value: 355.6, label: "DN350 (355.6mm)" },
    { value: 406.4, label: "DN400 (406.4mm)" },
    { value: 457.2, label: "DN450 (457.2mm)" },
    { value: 508, label: "DN500 (508mm)" }
  ];

  const [inputData, setInputData] = useState({
    installation_type: 'surface',
    suction_type: 'flooded',
    hasp: 3.0,
    discharge_height: 25.0,
    useful_pressure: 0,
    suction_pipe_diameter: 114.3,
    discharge_pipe_diameter: 88.9,
    suction_pipe_length: 10,
    discharge_pipe_length: 50,
    suction_pipe_material: 'pvc',
    discharge_pipe_material: 'pvc',
    suction_fittings: [],
    discharge_fittings: [],
    fluid_type: 'water',
    temperature: 20,
    flow_rate: 50
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setInputData(prev => ({ ...prev, [field]: value }));
  };

  const addFitting = (type) => {
    setInputData(prev => ({
      ...prev,
      [`${type}_fittings`]: [...prev[`${type}_fittings`], { fitting_type: 'elbow_90', quantity: 1 }]
    }));
  };

  const removeFitting = (type, index) => {
    setInputData(prev => ({
      ...prev,
      [`${type}_fittings`]: prev[`${type}_fittings`].filter((_, i) => i !== index)
    }));
  };

  const updateFitting = (type, index, field, value) => {
    setInputData(prev => ({
      ...prev,
      [`${type}_fittings`]: prev[`${type}_fittings`].map((fitting, i) => 
        i === index ? { ...fitting, [field]: value } : fitting
      )
    }));
  };

  const calculateHMT = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/calculate-hmt`, inputData);
      setResult(response.data);
    } catch (error) {
      console.error('Erreur calcul HMT:', error);
      alert('Erreur lors du calcul HMT: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-inter" style={professionalStyles}>
      {/* En-tête professionnel HMT */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-700 to-teal-700 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 tracking-tight">
              🟢 Calcul HMT Professionnel
            </h2>
            <p className="text-emerald-100 text-lg font-medium">
              Hauteur Manométrique Totale - Dimensionnement hydraulique expert
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <div className="text-2xl font-bold">HMT</div>
              <div className="text-sm opacity-90">Conformité API 610</div>
            </div>
          </div>
        </div>
        
        {/* Indicateurs de conformité */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <div className="font-bold text-lg">API</div>
            <div className="text-xs opacity-90">610</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <div className="font-bold text-lg">ISO</div>
            <div className="text-xs opacity-90">5199</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <div className="font-bold text-lg">HMT</div>
            <div className="text-xs opacity-90">Expert</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <div className="font-bold text-lg">Analysis</div>
            <div className="text-xs opacity-90">Pro</div>
          </div>
        </div>
      </div>

      {/* Configuration Installation */}
      <ProfessionalSection 
        title="Configuration Installation" 
        icon="⚙️"
        className="shadow-xl"
      >
        <ProfessionalGrid cols={2}>
          <div>
            <ProfessionalLabel required>Type d'Installation</ProfessionalLabel>
            <ProfessionalSelect
              value={inputData.installation_type}
              onChange={(e) => handleInputChange('installation_type', e.target.value)}
              required
            >
              <option value="surface">🏠 Installation en surface</option>
              <option value="submersible">🌊 Installation submersible</option>
            </ProfessionalSelect>
            <p className="text-xs text-gray-500 mt-2 italic">
              {inputData.installation_type === 'surface' ? 
                '✓ Pompe en surface - Configuration standard' : 
                '⚠️ Pompe immergée - Configuration spécialisée'
              }
            </p>
          </div>

          {inputData.installation_type === 'surface' && (
            <div>
              <ProfessionalLabel required>Type d'Aspiration</ProfessionalLabel>
              <ProfessionalSelect
                value={inputData.suction_type}
                onChange={(e) => handleInputChange('suction_type', e.target.value)}
                required
              >
                <option value="flooded">🔵 Aspiration en charge</option>
                <option value="suction_lift">🔴 Aspiration en dépression</option>
              </ProfessionalSelect>
              <p className="text-xs text-gray-500 mt-2 italic">
                {inputData.suction_type === 'flooded' ? 
                  '✓ Pompe sous niveau - NPSHd optimal' : 
                  '⚠️ Pompe au-dessus - Vérification NPSHd critique'
                }
              </p>
            </div>
          )}
        </ProfessionalGrid>
      </ProfessionalSection>

      {/* Paramètres Hydrauliques */}
      <ProfessionalSection 
        title="Paramètres Hydrauliques" 
        icon="💧"
        className="shadow-xl"
      >
        <ProfessionalGrid cols={3}>
          {inputData.installation_type === 'surface' && (
            <div>
              <ProfessionalLabel required>Hauteur d'Aspiration (m)</ProfessionalLabel>
              <ProfessionalInput
                type="number"
                value={inputData.hasp}
                onChange={(e) => handleInputChange('hasp', parseFloat(e.target.value))}
                required
                placeholder="Ex: 3.0"
              />
              <div className="text-xs text-blue-600 mt-1 font-medium">
                {inputData.suction_type === 'flooded' ? 'Hauteur charge fluide' : 'Hauteur aspiration'}
              </div>
            </div>
          )}

          <div>
            <ProfessionalLabel required>Hauteur de Refoulement (m)</ProfessionalLabel>
            <ProfessionalInput
              type="number"
              value={inputData.discharge_height}
              onChange={(e) => handleInputChange('discharge_height', parseFloat(e.target.value))}
              required
              placeholder="Ex: 25"
            />
            <div className="text-xs text-green-600 mt-1 font-medium">
              Hauteur géométrique totale
            </div>
          </div>

          <div>
            <ProfessionalLabel required>Débit (m³/h)</ProfessionalLabel>
            <ProfessionalInput
              type="number"
              value={inputData.flow_rate}
              onChange={(e) => handleInputChange('flow_rate', parseFloat(e.target.value))}
              required
              placeholder="Ex: 50"
            />
            <div className="text-xs text-blue-600 mt-1 font-medium">
              Débit nominal pompe
            </div>
          </div>

          <div>
            <ProfessionalLabel>Pression Utile (bar)</ProfessionalLabel>
            <ProfessionalInput
              type="number"
              value={inputData.useful_pressure}
              onChange={(e) => handleInputChange('useful_pressure', parseFloat(e.target.value))}
              placeholder="Ex: 0"
              step="0.1"
            />
            <div className="text-xs text-purple-600 mt-1 font-medium">
              Pression supplémentaire requise
            </div>
          </div>

          <div>
            <ProfessionalLabel required>Type de Fluide</ProfessionalLabel>
            <ProfessionalSelect
              value={inputData.fluid_type}
              onChange={(e) => handleInputChange('fluid_type', e.target.value)}
              required
            >
              {fluids.map(fluid => (
                <option key={fluid.id} value={fluid.id}>
                  {fluid.name}
                </option>
              ))}
            </ProfessionalSelect>
          </div>

          <div>
            <ProfessionalLabel required>Température (°C)</ProfessionalLabel>
            <ProfessionalInput
              type="number"
              value={inputData.temperature}
              onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
              required
              placeholder="Ex: 20"
            />
            <div className="text-xs text-orange-600 mt-1 font-medium">
              Influence propriétés fluide
            </div>
          </div>
        </ProfessionalGrid>
      </ProfessionalSection>

      {/* Tuyauteries */}
      <ProfessionalSection title="Tuyauteries" icon="🔧">
        <div className="space-y-3">
          {inputData.installation_type === 'surface' && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Aspiration</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-blue-700 mb-1">Diamètre</label>
                  <select
                    value={inputData.suction_pipe_diameter > 0 ? inputData.suction_pipe_diameter : ''}
                    onChange={(e) => handleInputChange('suction_pipe_diameter', parseFloat(e.target.value))}
                    className="w-full p-1 border border-blue-300 rounded text-sm"
                  >
                    {dnOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-blue-700 mb-1">Longueur (m)</label>
                  <input
                    type="number"
                    value={inputData.suction_pipe_length}
                    onChange={(e) => handleInputChange('suction_pipe_length', parseFloat(e.target.value))}
                    className="w-full p-1 border border-blue-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-blue-700 mb-1">Matériau</label>
                  <select
                    value={inputData.suction_pipe_material}
                    onChange={(e) => handleInputChange('suction_pipe_material', e.target.value)}
                    className="w-full p-1 border border-blue-300 rounded text-sm"
                  >
                    {pipeMaterials.map(material => (
                      <option key={material.id} value={material.id}>{material.name} (ε = {material.roughness} mm)</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
              
          <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Refoulement</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-green-700 mb-1">Diamètre</label>
                    <select
                      value={inputData.discharge_pipe_diameter > 0 ? inputData.discharge_pipe_diameter : ''}
                      onChange={(e) => handleInputChange('discharge_pipe_diameter', parseFloat(e.target.value))}
                      className="w-full p-1 border border-green-300 rounded text-sm"
                    >
                      {dnOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-green-700 mb-1">Longueur (m)</label>
                    <input
                      type="number"
                      value={inputData.discharge_pipe_length}
                      onChange={(e) => handleInputChange('discharge_pipe_length', parseFloat(e.target.value))}
                      className="w-full p-1 border border-green-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-green-700 mb-1">Matériau</label>
                    <select
                      value={inputData.discharge_pipe_material}
                      onChange={(e) => handleInputChange('discharge_pipe_material', e.target.value)}
                      className="w-full p-1 border border-green-300 rounded text-sm"
                    >
                      {pipeMaterials.map(material => (
                        <option key={material.id} value={material.id}>{material.name} (ε = {material.roughness} mm)</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
        </div>
      </ProfessionalSection>
        
      {/* Raccords */}
      <ProfessionalSection title="Raccords" icon="🔧">
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Raccords aspiration */}
          {inputData.installation_type === 'surface' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-700">Raccords Aspiration</h4>
                <button
                  onClick={() => addFitting('suction')}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  + Ajouter
                </button>
              </div>
              
              <div className="space-y-2">
                {inputData.suction_fittings.map((fitting, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <select
                      value={fitting.fitting_type}
                      onChange={(e) => updateFitting('suction', index, 'fitting_type', e.target.value)}
                      className="flex-1 p-1 border border-gray-300 rounded text-sm"
                    >
                      {fittings.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={fitting.quantity}
                      onChange={(e) => updateFitting('suction', index, 'quantity', parseInt(e.target.value))}
                      min="1"
                      className="w-16 p-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => removeFitting('suction', index)}
                      className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Raccords refoulement */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-gray-700">Raccords Refoulement</h4>
              <button
                onClick={() => addFitting('discharge')}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                + Ajouter
              </button>
            </div>
            
            <div className="space-y-2">
              {inputData.discharge_fittings.map((fitting, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <select
                    value={fitting.fitting_type}
                    onChange={(e) => updateFitting('discharge', index, 'fitting_type', e.target.value)}
                    className="flex-1 p-1 border border-gray-300 rounded text-sm"
                  >
                    {fittings.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={fitting.quantity}
                    onChange={(e) => updateFitting('discharge', index, 'quantity', parseInt(e.target.value))}
                    min="1"
                    className="w-16 p-1 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={() => removeFitting('discharge', index)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ProfessionalSection>
        
      <ProfessionalSection title="Calcul" icon="🚀" className="shadow-xl">
        <div className="mt-6">
          <button
            onClick={calculateHMT}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Calcul en cours...' : 'Calculer HMT'}
          </button>
        </div>
      </ProfessionalSection>
      
      {/* Résultats */}
      {result && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Résultats HMT</h3>
          
          {result.warnings && result.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Avertissements</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {result.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 border-b pb-2">Vitesses</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Aspiration:</span>
                  <span className="font-medium">{result.suction_velocity?.toFixed(2)} m/s</span>
                </div>
                <div className="flex justify-between">
                  <span>Refoulement:</span>
                  <span className="font-medium">{result.discharge_velocity?.toFixed(2)} m/s</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 border-b pb-2">Pertes de Charge</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Aspiration:</span>
                  <span className="font-medium">{result.suction_head_loss?.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between">
                  <span>Refoulement:</span>
                  <span className="font-medium">{result.discharge_head_loss?.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-medium">{result.total_head_loss?.toFixed(2)} m</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 border-b pb-2">Hauteurs</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Hauteur statique:</span>
                  <span className="font-medium">{result.static_head?.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between">
                  <span>Pression utile:</span>
                  <span className="font-medium">{result.useful_pressure_head?.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">HMT:</span>
                  <span className="font-bold text-green-600">{result.hmt?.toFixed(2)} m</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component pour Tab Expert - Analyse Complète Professionnelle
const ExpertCalculator = ({ fluids, pipeMaterials, fittings }) => {
  // Fonction universelle pour calculer les propriétés des fluides
  const calculateFluidProperties = (fluidType, temperature) => {
    // Base de données des propriétés des fluides (à synchroniser avec le backend)
    const fluidProperties = {
      water: { density_20c: 1000, viscosity_20c: 0.001, vapor_pressure_20c: 2340, temp_coeffs: { density: -0.2, viscosity: -0.00005, vapor_pressure: 100 } },
      oil: { density_20c: 850, viscosity_20c: 0.05, vapor_pressure_20c: 100, temp_coeffs: { density: -0.7, viscosity: -0.002, vapor_pressure: 20 } },
      acid: { density_20c: 1200, viscosity_20c: 0.002, vapor_pressure_20c: 3000, temp_coeffs: { density: -0.3, viscosity: -0.0001, vapor_pressure: 150 } },
      glycol: { density_20c: 1113, viscosity_20c: 0.0161, vapor_pressure_20c: 10, temp_coeffs: { density: -0.8, viscosity: -0.0008, vapor_pressure: 5 } },
      // Nouveaux fluides industriels
      palm_oil: { density_20c: 915, viscosity_20c: 0.045, vapor_pressure_20c: 0.001, temp_coeffs: { density: -0.65, viscosity: -0.0018, vapor_pressure: 0.0001 } },
      gasoline: { density_20c: 740, viscosity_20c: 0.00055, vapor_pressure_20c: 13000, temp_coeffs: { density: -0.9, viscosity: -0.000015, vapor_pressure: 850 } },
      diesel: { density_20c: 840, viscosity_20c: 0.0035, vapor_pressure_20c: 300, temp_coeffs: { density: -0.75, viscosity: -0.00012, vapor_pressure: 25 } },
      hydraulic_oil: { density_20c: 875, viscosity_20c: 0.046, vapor_pressure_20c: 0.1, temp_coeffs: { density: -0.65, viscosity: -0.0019, vapor_pressure: 0.02 } },
      ethanol: { density_20c: 810, viscosity_20c: 0.0012, vapor_pressure_20c: 5870, temp_coeffs: { density: -1.05, viscosity: -0.00004, vapor_pressure: 420 } },
      seawater: { density_20c: 1025, viscosity_20c: 0.00107, vapor_pressure_20c: 2280, temp_coeffs: { density: -0.25, viscosity: -0.000052, vapor_pressure: 95 } },
      methanol: { density_20c: 792, viscosity_20c: 0.00059, vapor_pressure_20c: 12800, temp_coeffs: { density: -1.2, viscosity: -0.000025, vapor_pressure: 780 } },
      glycerol: { density_20c: 1260, viscosity_20c: 1.48, vapor_pressure_20c: 0.001, temp_coeffs: { density: -0.65, viscosity: -0.058, vapor_pressure: 0.0002 } },
      // Nouveaux fluides alimentaires et domestiques
      milk: { density_20c: 1030, viscosity_20c: 0.0015, vapor_pressure_20c: 2200, temp_coeffs: { density: -0.3, viscosity: -0.00006, vapor_pressure: 95 } },
      honey: { density_20c: 1400, viscosity_20c: 8.5, vapor_pressure_20c: 0.1, temp_coeffs: { density: -0.8, viscosity: -0.25, vapor_pressure: 0.02 } },
      wine: { density_20c: 990, viscosity_20c: 0.0012, vapor_pressure_20c: 2800, temp_coeffs: { density: -0.9, viscosity: -0.00004, vapor_pressure: 120 } },
      bleach: { density_20c: 1050, viscosity_20c: 0.0011, vapor_pressure_20c: 2100, temp_coeffs: { density: -0.25, viscosity: -0.000045, vapor_pressure: 90 } },
      yogurt: { density_20c: 1050, viscosity_20c: 0.15, vapor_pressure_20c: 2150, temp_coeffs: { density: -0.35, viscosity: -0.008, vapor_pressure: 92 } },
      tomato_sauce: { density_20c: 1100, viscosity_20c: 2.5, vapor_pressure_20c: 1800, temp_coeffs: { density: -0.4, viscosity: -0.12, vapor_pressure: 75 } },
      soap_solution: { density_20c: 1010, viscosity_20c: 0.0013, vapor_pressure_20c: 2250, temp_coeffs: { density: -0.28, viscosity: -0.00005, vapor_pressure: 95 } },
      fruit_juice: { density_20c: 1045, viscosity_20c: 0.0018, vapor_pressure_20c: 2100, temp_coeffs: { density: -0.35, viscosity: -0.00007, vapor_pressure: 88 } }
    };

    const fluid = fluidProperties[fluidType];
    if (!fluid) return { density: 1000, viscosity: 0.001, vapor_pressure: 2340 };

    const tempDiff = temperature - 20;
    
    return {
      density: Math.max(fluid.density_20c + fluid.temp_coeffs.density * tempDiff, 500),
      viscosity: Math.max(fluid.viscosity_20c + fluid.temp_coeffs.viscosity * tempDiff, 0.0001),
      vapor_pressure: Math.max(fluid.vapor_pressure_20c + fluid.temp_coeffs.vapor_pressure * tempDiff, 1)
    };
  };

  const [inputData, setInputData] = useState({
    // Informations projet
    engineer_name: '',
    engineer_firstname: '',
    company_name: '',
    engineer_phone: '',
    engineer_email: '',
    
    // Paramètres hydrauliques principaux
    flow_rate: 0,
    fluid_type: 'water',
    temperature: 20, // Valeur de référence
    
    // Géométrie installation
    suction_type: 'flooded',
    suction_pipe_diameter: 0,
    discharge_pipe_diameter: 0,
    suction_height: 0,
    discharge_height: 0,
    suction_length: 0,
    discharge_length: 0,
    total_length: 0,
    
    // Pression utile
    useful_pressure: 0,
    
    // Matériaux et équipements
    suction_material: 'pvc',
    discharge_material: 'pvc',
    
    // Singularités ASPIRATION (quantités usuelles)
    suction_elbow_90: 1, // Au moins 1 coude usuel
    suction_elbow_45: 0,
    suction_elbow_30: 0,
    suction_tee_flow: 0,
    suction_tee_branch: 0,
    suction_reducer_gradual: 0,
    suction_reducer_sudden: 0,
    suction_enlarger_gradual: 0,
    suction_enlarger_sudden: 0,
    suction_gate_valve: 0,
    suction_globe_valve: 0,
    suction_ball_valve: 0,
    suction_butterfly_valve: 0,
    suction_check_valve: 0,
    suction_strainer: 1, // Crépine usuelle
    suction_foot_valve: 0,
    
    // Singularités REFOULEMENT (quantités usuelles)
    discharge_elbow_90: 2, // Coudes usuels
    discharge_elbow_45: 0,
    discharge_elbow_30: 0,
    discharge_tee_flow: 0,
    discharge_tee_branch: 0,
    discharge_reducer_gradual: 0,
    discharge_reducer_sudden: 0,
    discharge_enlarger_gradual: 0,
    discharge_enlarger_sudden: 0,
    discharge_gate_valve: 1, // Vanne d'arrêt usuelle
    discharge_globe_valve: 0,
    discharge_ball_valve: 0,
    discharge_butterfly_valve: 0,
    discharge_check_valve: 1, // Clapet anti-retour usuel
    discharge_strainer: 0,
    discharge_flow_meter: 0,
    discharge_pressure_gauge: 1, // Manomètre usuel
    
    // Paramètres électriques
    pump_efficiency: 75, // Valeur par défaut réaliste
    motor_efficiency: 85, // Valeur par défaut réaliste
    voltage: 400,
    power_factor: 0.8, // Valeur de référence
    starting_method: 'star_delta',
    cable_length: 0,
    cable_material: 'copper',
    cable_section: null,
    voltage_drop: 0, // Nouvelle valeur pour chute de tension
    
    // Paramètres avancés
    npsh_required: 0,
    installation_type: 'surface',
    pump_type: 'centrifugal',
    operating_hours: 4000, // Valeur de référence (h/an)
    electricity_cost: 96, // Prix de référence en FCFA
    
    // Conditions environnementales
    altitude: 0,
    ambient_temperature: 25, // Valeur de référence
    humidity: 60 // Valeur de référence
  });

  // Table de correspondance DN/mm (diamètres intérieurs réels)
  const dnSizes = [
    { dn: 'DN20', mm: 26.9, label: 'DN20 (26.9mm)' },
    { dn: 'DN25', mm: 33.7, label: 'DN25 (33.7mm)' },
    { dn: 'DN32', mm: 42.4, label: 'DN32 (42.4mm)' },
    { dn: 'DN40', mm: 48.3, label: 'DN40 (48.3mm)' },
    { dn: 'DN50', mm: 60.3, label: 'DN50 (60.3mm)' },
    { dn: 'DN65', mm: 76.1, label: 'DN65 (76.1mm)' },
    { dn: 'DN80', mm: 88.9, label: 'DN80 (88.9mm)' },
    { dn: 'DN100', mm: 114.3, label: 'DN100 (114.3mm)' },
    { dn: 'DN125', mm: 139.7, label: 'DN125 (139.7mm)' },
    { dn: 'DN150', mm: 168.3, label: 'DN150 (168.3mm)' },
    { dn: 'DN200', mm: 219.1, label: 'DN200 (219.1mm)' },
    { dn: 'DN250', mm: 273.1, label: 'DN250 (273.1mm)' },
    { dn: 'DN300', mm: 323.9, label: 'DN300 (323.9mm)' },
    { dn: 'DN350', mm: 355.6, label: 'DN350 (355.6mm)' },
    { dn: 'DN400', mm: 406.4, label: 'DN400 (406.4mm)' },
    { dn: 'DN450', mm: 457.2, label: 'DN450 (457.2mm)' },
    { dn: 'DN500', mm: 508, label: 'DN500 (508mm)' }
  ];

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [activeSection, setActiveSection] = useState('all');
  const [showSingularities, setShowSingularities] = useState(false); // État pour les singularités collapsibles
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const handleInputChange = (field, value) => {
    // Permettre les valeurs 0, 0.5, les chaînes vides, et toutes les autres valeurs numériques valides
    let processedValue = value;
    
    // Pour les champs numériques, conserver les chaînes vides comme telles pour l'affichage
    if (typeof value === 'string' && value === '') {
      processedValue = ''; // Garder vide pour l'affichage
    } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
      processedValue = parseFloat(value);
    } else if (typeof value === 'number') {
      processedValue = value;
    }
    
    const newData = { ...inputData, [field]: processedValue };
    setInputData(newData);
    
    // Calcul automatique si activé
    if (autoCalculate) {
      calculateExpertAnalysis(newData);
    }
  };

  const resetAllFields = () => {
    setInputData({
      // Informations projet
      engineer_name: '',
      engineer_firstname: '',
      company_name: '',
      engineer_phone: '',
      engineer_email: '',
      
      // Paramètres hydrauliques principaux
      flow_rate: 0,
      fluid_type: 'water',
      temperature: 20, // Valeur de référence
      
      // Géométrie installation
      suction_type: 'flooded',
      suction_pipe_diameter: 114.3, // DN100 par défaut
      discharge_pipe_diameter: 88.9, // DN80 par défaut  
      suction_dn: 100,  // DN sélectionné pour aspiration
      discharge_dn: 80,  // DN sélectionné pour refoulement
      suction_height: 0,
      discharge_height: 0,
      suction_length: 0,
      discharge_length: 0,
      total_length: 0,
      
      // Pression utile
      useful_pressure: 0,
      
      // Matériaux et équipements
      suction_material: 'pvc',
      discharge_material: 'pvc',
      
      // Singularités ASPIRATION (quantités usuelles)
      suction_elbow_90: 1, // Au moins 1 coude usuel
      suction_elbow_45: 0,
      suction_elbow_30: 0,
      suction_tee_flow: 0,
      suction_tee_branch: 0,
      suction_reducer_gradual: 0,
      suction_reducer_sudden: 0,
      suction_enlarger_gradual: 0,
      suction_enlarger_sudden: 0,
      suction_gate_valve: 0,
      suction_globe_valve: 0,
      suction_ball_valve: 0,
      suction_butterfly_valve: 0,
      suction_check_valve: 0,
      suction_strainer: 1, // Crépine usuelle
      suction_foot_valve: 0,
      
      // Singularités REFOULEMENT (quantités usuelles)
      discharge_elbow_90: 2, // Coudes usuels
      discharge_elbow_45: 0,
      discharge_elbow_30: 0,
      discharge_tee_flow: 0,
      discharge_tee_branch: 0,
      discharge_reducer_gradual: 0,
      discharge_reducer_sudden: 0,
      discharge_enlarger_gradual: 0,
      discharge_enlarger_sudden: 0,
      discharge_gate_valve: 1, // Vanne d'arrêt usuelle
      discharge_globe_valve: 0,
      discharge_ball_valve: 0,
      discharge_butterfly_valve: 0,
      discharge_check_valve: 1, // Clapet anti-retour usuel
      discharge_strainer: 0,
      discharge_flow_meter: 0,
      discharge_pressure_gauge: 1, // Manomètre usuel
      
      // Paramètres électriques
      pump_efficiency: 75, // Valeur par défaut réaliste
      motor_efficiency: 85, // Valeur par défaut réaliste
      voltage: 400,
      power_factor: 0.8, // Valeur de référence
      starting_method: 'star_delta',
      cable_length: 0,
      cable_material: 'copper',
      cable_section: null,
      voltage_drop: 0, // Nouvelle valeur pour chute de tension
      
      // Paramètres avancés
      npsh_required: 0,
      installation_type: 'surface',
      pump_type: 'centrifugal',
      operating_hours: 4000, // Valeur de référence (h/an)
      electricity_cost: 96, // Prix de référence en FCFA
      
      // Conditions environnementales
      altitude: 0,
      ambient_temperature: 25, // Valeur de référence
      humidity: 60 // Valeur de référence
    });
    
    // Réinitialiser les résultats
    setResults(null);
    
    // Détruire les graphiques existants
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }
  };

  // Fonction d'export PDF avec logo ECO PUMP AFRIK
  const exportToPDF = () => {
    if (!results) {
      alert('Aucun résultat à exporter. Veuillez d\'abord effectuer un calcul.');
      return;
    }

    // Créer le contenu HTML pour le PDF avec logo et en-tête professionnel
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rapport d'Analyse Expert - ECO PUMP AFRIK</title>
          <meta charset="UTF-8">
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 10mm;
              line-height: 1.4;
              color: #333;
            }
            .header { 
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 4px solid #0ea5e9; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              padding: 25px;
              border-radius: 12px;
            }
            .logo-section {
              display: flex;
              align-items: center;
              gap: 20px;
            }
            .logo-container {
              width: 120px;
              height: 120px;
              background: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              border: 3px solid #0ea5e9;
            }
            .logo-svg {
              width: 80px;
              height: 80px;
            }
            .company-info {
              text-align: left;
            }
            .company-name {
              font-size: 28px;
              font-weight: bold;
              color: #0ea5e9;
              margin: 0;
              line-height: 1;
            }
            .company-subtitle {
              font-size: 14px;
              color: #0369a1;
              margin: 5px 0;
            }
            .report-title {
              text-align: center;
              margin: 15px 0;
            }
            .report-title h1 {
              color: #1e40af;
              margin: 0;
              font-size: 24px;
              font-weight: bold;
            }
            .header-details {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 2px solid #0ea5e9;
            }
            .engineer-info {
              text-align: left;
              font-size: 14px;
              flex: 1;
            }
            .date-info {
              text-align: center;
              font-size: 12px;
              color: #64748b;
              flex: 1;
            }
            .client-info {
              text-align: right;
              font-size: 14px;
              flex: 1;
            }
            .contact-info {
              background: #f8fafc;
              padding: 10px;
              border-radius: 8px;
              margin-top: 10px;
              font-size: 12px;
            }
            .section { 
              margin-bottom: 25px; 
              page-break-inside: avoid;
            }
            .section h2 { 
              color: #1e40af; 
              border-bottom: 2px solid #0ea5e9; 
              padding-bottom: 8px; 
              margin-bottom: 15px;
              font-size: 18px;
            }
            .parameter-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 15px;
            }
            .parameter { 
              display: flex; 
              justify-content: space-between; 
              margin: 8px 0;
              padding: 8px 12px;
              background: #f8fafc;
              border-radius: 6px;
              border-left: 4px solid #e2e8f0;
            }
            .parameter strong { 
              color: #1e40af; 
              font-weight: 600;
            }
            .warning { 
              background-color: #fef3c7; 
              border: 1px solid #f59e0b; 
              padding: 15px; 
              margin: 15px 0; 
              border-radius: 8px;
              border-left: 4px solid #f59e0b;
            }
            .critical { 
              background-color: #fef2f2; 
              border: 1px solid #ef4444; 
              padding: 15px; 
              margin: 15px 0; 
              border-radius: 8px;
              border-left: 4px solid #ef4444;
            }
            .success { 
              background-color: #f0fdf4; 
              border: 1px solid #22c55e; 
              padding: 15px; 
              margin: 15px 0; 
              border-radius: 8px;
              border-left: 4px solid #22c55e;
            }
            .key-results {
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              padding: 20px;
              border-radius: 12px;
              margin: 20px 0;
              border: 2px solid #0ea5e9;
            }
            .result-highlight {
              display: inline-block;
              background: #0ea5e9;
              color: white;
              padding: 6px 14px;
              border-radius: 20px;
              font-weight: bold;
              margin: 5px;
              font-size: 14px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 3px solid #0ea5e9;
              text-align: center;
              font-size: 12px;
              color: #64748b;
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              padding: 20px;
              border-radius: 8px;
            }
            .footer-logo {
              display: inline-block;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              <div class="logo-container">
                <svg class="logo-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <!-- Logo ECO PUMP AFRIK stylisé -->
                  <defs>
                    <linearGradient id="dropGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#0369a1;stop-opacity:1" />
                    </linearGradient>
                  </defs>
                  
                  <!-- Goutte principale -->
                  <path d="M100 30 C130 50, 150 80, 150 110 C150 140, 125 160, 100 160 C75 160, 50 140, 50 110 C50 80, 70 50, 100 30 Z" 
                        fill="url(#dropGradient)" stroke="white" stroke-width="2"/>
                  
                  <!-- Goutte intérieure -->
                  <ellipse cx="100" cy="110" rx="25" ry="30" fill="white" opacity="0.9"/>
                  
                  <!-- Effet de mouvement -->
                  <path d="M75 170 Q100 180, 125 170 Q140 175, 155 180" 
                        stroke="#0ea5e9" stroke-width="3" fill="none" opacity="0.7"/>
                  
                  <!-- Texte stylisé -->
                  <text x="100" y="195" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0ea5e9">
                    ECO PUMP
                  </text>
                </svg>
              </div>
              
              <div class="company-info">
                <h1 class="company-name">ECO PUMP AFRIK</h1>
                <p class="company-subtitle">Solutions de Pompage Durable</p>
                <p class="company-subtitle">Expertise Hydraulique • Conseil Technique</p>
              </div>
            </div>
            
            <div class="report-title">
              <h1>📊 RAPPORT D'ANALYSE EXPERT</h1>
              <p style="color: #0369a1; margin: 5px 0;">Système de Pompage Centrifuge</p>
            </div>
          </div>
          
          <div class="header-details">
            <div class="engineer-info">
              <strong style="color: #0ea5e9;">👤 INGÉNIEUR RESPONSABLE</strong><br>
              <strong>${inputData.engineer_firstname} ${inputData.engineer_name}</strong><br>
              <em>Spécialiste Hydraulique</em>
              <div class="contact-info">
                <div style="margin: 3px 0;">📞 ${inputData.engineer_phone || 'Non renseigné'}</div>
                <div style="margin: 3px 0;">📧 ${inputData.engineer_email || 'Non renseigné'}</div>
              </div>
            </div>
            
            <div class="date-info">
              <strong style="color: #0ea5e9;">📅 DATE D'ANALYSE</strong><br>
              <strong>${new Date().toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</strong><br>
              ${new Date().toLocaleTimeString('fr-FR')}<br>
              <em style="margin-top: 5px; display: block;">Rapport N°: ${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}</em>
            </div>
            
            <div class="client-info">
              <strong style="color: #0ea5e9;">🏢 SOCIÉTÉ CLIENTE</strong><br>
              <strong>${inputData.company_name || 'Non renseigné'}</strong><br>
              <em>Étude de Faisabilité Technique</em>
              <div class="contact-info">
                <div style="margin: 3px 0;">📋 Analyse Hydraulique</div>
                <div style="margin: 3px 0;">⚡ Dimensionnement Électrique</div>
              </div>
            </div>
          </div>
          
          <div class="key-results">
            <h2 style="margin-top: 0; color: #0ea5e9;">🎯 RÉSULTATS CLÉS DE L'ANALYSE</h2>
            <span class="result-highlight">NPSHd: ${results.npshd_analysis?.npshd?.toFixed(2)} m</span>
            <span class="result-highlight">HMT: ${results.hmt_analysis?.hmt?.toFixed(2)} m</span>
            <span class="result-highlight">Rendement: ${results.overall_efficiency?.toFixed(1)}%</span>
            <span class="result-highlight">P. Électrique: ${results.performance_analysis?.electrical_power?.toFixed(1)} kW</span>
            <span class="result-highlight">Coût annuel: ${(results.performance_analysis?.electrical_power * 4000 * 96 / 1000).toFixed(0)} FCFA</span>
          </div>
          
          <div class="section">
            <h2>📋 PARAMÈTRES D'ENTRÉE</h2>
            <div class="parameter-grid">
              <div class="parameter"><span>Débit:</span><strong>${inputData.flow_rate} m³/h</strong></div>
              <div class="parameter"><span>Fluide:</span><strong>${fluids.find(f => f.id === inputData.fluid_type)?.name || inputData.fluid_type}</strong></div>
              <div class="parameter"><span>Température:</span><strong>${inputData.temperature}°C</strong></div>
              <div class="parameter"><span>Type d'aspiration:</span><strong>${inputData.suction_type === 'flooded' ? 'En charge' : 'Dépression'}</strong></div>
              <div class="parameter"><span>Diamètre aspiration:</span><strong>DN${dnSizes.find(d => d.mm == inputData.suction_pipe_diameter)?.dn.replace('DN', '') || inputData.suction_pipe_diameter} (${inputData.suction_pipe_diameter} mm)</strong></div>
              <div class="parameter"><span>Diamètre refoulement:</span><strong>DN${dnSizes.find(d => d.mm == inputData.discharge_pipe_diameter)?.dn.replace('DN', '') || inputData.discharge_pipe_diameter} (${inputData.discharge_pipe_diameter} mm)</strong></div>
              <div class="parameter"><span>Hauteur aspiration:</span><strong>${inputData.suction_height} m</strong></div>
              <div class="parameter"><span>Hauteur refoulement:</span><strong>${inputData.discharge_height} m</strong></div>
            </div>
          </div>

          <div class="section">
            <h2>💧 ANALYSE NPSHd</h2>
            ${results.npshd_analysis ? `
              <div class="parameter-grid">
                <div class="parameter"><span>NPSHd calculé:</span><strong>${results.npshd_analysis.npshd?.toFixed(2)} m</strong></div>
                <div class="parameter"><span>NPSH requis:</span><strong>${results.npshd_analysis.npsh_required?.toFixed(2)} m</strong></div>
                <div class="parameter"><span>Marge de sécurité:</span><strong>${results.npshd_analysis.npsh_margin?.toFixed(2)} m</strong></div>
                <div class="parameter"><span>Vitesse aspiration:</span><strong>${results.npshd_analysis.velocity?.toFixed(2)} m/s</strong></div>
                <div class="parameter"><span>Reynolds:</span><strong>${results.npshd_analysis.reynolds_number?.toFixed(0)}</strong></div>
                <div class="parameter"><span>Régime:</span><strong>${results.npshd_analysis.reynolds_number > 4000 ? 'Turbulent' : 
                          results.npshd_analysis.reynolds_number > 2300 ? 'Transitoire' : 'Laminaire'}</strong></div>
              </div>
              ${results.npshd_analysis.cavitation_risk ? 
                '<div class="critical"><strong>🚨 RISQUE DE CAVITATION DÉTECTÉ</strong><br>Action immédiate requise pour éviter la destruction de la pompe.</div>' : 
                '<div class="success"><strong>✅ AUCUN RISQUE DE CAVITATION</strong><br>La pompe fonctionnera en sécurité avec les paramètres actuels.</div>'
              }
            ` : '<p>Données NPSHd non disponibles</p>'}
          </div>

          <div class="section">
            <h2>⚡ ANALYSE HMT</h2>
            ${results.hmt_analysis ? `
              <div class="parameter-grid">
                <div class="parameter"><span>HMT totale:</span><strong>${results.hmt_analysis.hmt?.toFixed(2)} m</strong></div>
                <div class="parameter"><span>Hauteur statique:</span><strong>${results.hmt_analysis.static_head?.toFixed(2)} m</strong></div>
                <div class="parameter"><span>Pertes aspiration:</span><strong>${results.npshd_analysis?.total_head_loss?.toFixed(2)} m</strong></div>
                <div class="parameter"><span>Pertes refoulement:</span><strong>${results.hmt_analysis.total_head_loss?.toFixed(2)} m</strong></div>
                <div class="parameter"><span>Pertes totales:</span><strong>${results.total_head_loss?.toFixed(2)} m</strong></div>
                <div class="parameter"><span>Pression utile:</span><strong>${inputData.useful_pressure} bar</strong></div>
              </div>
            ` : '<p>Données HMT non disponibles</p>'}
          </div>

          <div class="section">
            <h2>🔌 PERFORMANCE ÉNERGÉTIQUE</h2>
            ${results.performance_analysis ? `
              <div class="parameter-grid">
                <div class="parameter"><span>Rendement pompe:</span><strong>${inputData.pump_efficiency}%</strong></div>
                <div class="parameter"><span>Rendement moteur:</span><strong>${inputData.motor_efficiency}%</strong></div>
                <div class="parameter"><span>Rendement global:</span><strong>${results.overall_efficiency?.toFixed(1)}%</strong></div>
                <div class="parameter"><span>Puissance hydraulique:</span><strong>${results.performance_analysis.hydraulic_power?.toFixed(2)} kW</strong></div>
                <div class="parameter"><span>Puissance électrique:</span><strong>${results.performance_analysis.electrical_power?.toFixed(2)} kW</strong></div>
                <div class="parameter"><span>Coût annuel (4000h):</span><strong>${(results.performance_analysis.electrical_power * 4000 * 96 / 1000).toFixed(0)} FCFA</strong></div>
              </div>
            ` : '<p>Données de performance non disponibles</p>'}
          </div>

          ${results.expert_recommendations && results.expert_recommendations.length > 0 ? `
            <div class="section">
              <h2>💡 RECOMMANDATIONS D'EXPERT</h2>
              ${results.expert_recommendations.slice(0, 3).map(rec => `
                <div class="${rec.type === 'critical' ? 'critical' : 'warning'}">
                  <h3 style="margin-top: 0;">${rec.title}</h3>
                  <p><strong>Description:</strong> ${rec.description}</p>
                  <p><strong>Impact:</strong> ${rec.impact}</p>
                  ${rec.solutions ? `
                    <p><strong>Solutions recommandées:</strong></p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                      ${rec.solutions.slice(0, 3).map(sol => `<li>${sol}</li>`).join('')}
                    </ul>
                  ` : ''}
                  <p><strong>Urgence:</strong> ${rec.urgency || 'Moyenne'} • <strong>Impact coût:</strong> ${rec.cost_impact || 'À évaluer'}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="footer">
            <div class="footer-logo">
              <strong style="color: #0ea5e9; font-size: 16px;">ECO PUMP AFRIK</strong>
            </div>
            <p><strong>📋 Rapport généré par:</strong> ${inputData.engineer_firstname} ${inputData.engineer_name}</p>
            <p><strong>📞 Contact:</strong> ${inputData.engineer_phone || 'Non renseigné'} • 
               <strong>📧 Email:</strong> ${inputData.engineer_email || 'Non renseigné'}</p>
            <p><strong>🏢 Client:</strong> ${inputData.company_name || 'Non renseigné'} • 
               <strong>📅 Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            <p style="margin-top: 15px; font-style: italic; color: #0369a1;">
              <strong>ECO PUMP AFRIK - Solutions de Pompage Durable</strong><br>
              Expertise Hydraulique • Conseil Technique • Dimensionnement Électrique<br>
              Ce rapport a été généré automatiquement par notre système d'analyse hydraulique expert.
            </p>
          </div>
        </body>
      </html>
    `;

    // Créer un blob et télécharger le PDF
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ECO-PUMP-AFRIK-Rapport-${inputData.company_name?.replace(/\s+/g, '-') || 'Client'}-${new Date().toISOString().split('T')[0]}.html`;
    
    // Ouvrir dans un nouvel onglet pour impression PDF
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = function() {
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      };
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fonction d'export Excel
  const exportToExcel = () => {
    if (!results) {
      alert('Aucun résultat à exporter. Veuillez d\'abord effectuer un calcul.');
      return;
    }

    // Créer les données CSV
    const csvData = [];
    
    // En-tête
    csvData.push(['Rapport d\'Analyse Expert - Système de Pompage']);
    csvData.push(['Généré le', new Date().toLocaleDateString('fr-FR')]);
    csvData.push([]);
    
    // Paramètres d'entrée
    csvData.push(['PARAMÈTRES D\'ENTRÉE']);
    csvData.push(['Débit (m³/h)', inputData.flow_rate]);
    csvData.push(['Fluide', inputData.fluid_type]);
    csvData.push(['Température (°C)', inputData.temperature]);
    csvData.push(['Diamètre aspiration (mm)', inputData.suction_pipe_diameter]);
    csvData.push(['Diamètre refoulement (mm)', inputData.discharge_pipe_diameter]);
    csvData.push([]);
    
    // Résultats NPSHd
    if (results.npshd_analysis) {
      csvData.push(['RÉSULTATS NPSHd']);
      csvData.push(['NPSHd calculé (m)', results.npshd_analysis.npshd?.toFixed(2)]);
      csvData.push(['NPSH requis (m)', results.npshd_analysis.npsh_required?.toFixed(2)]);
      csvData.push(['Marge de sécurité (m)', results.npshd_analysis.npsh_margin?.toFixed(2)]);
      csvData.push(['Risque de cavitation', results.npshd_analysis.cavitation_risk ? 'OUI' : 'NON']);
      csvData.push([]);
    }
    
    // Résultats HMT
    if (results.hmt_analysis) {
      csvData.push(['RÉSULTATS HMT']);
      csvData.push(['HMT calculée (m)', results.hmt_analysis.hmt?.toFixed(2)]);
      csvData.push(['Hauteur statique (m)', results.hmt_analysis.static_head?.toFixed(2)]);
      csvData.push(['Pertes de charge totales (m)', results.hmt_analysis.total_head_loss?.toFixed(2)]);
      csvData.push([]);
    }
    
    // Performance énergétique
    if (results.performance_analysis) {
      csvData.push(['PERFORMANCE ÉNERGÉTIQUE']);
      csvData.push(['Rendement global (%)', results.performance_analysis.overall_efficiency?.toFixed(1)]);
      csvData.push(['Puissance hydraulique (kW)', results.performance_analysis.hydraulic_power?.toFixed(2)]);
      csvData.push(['Puissance électrique (kW)', results.performance_analysis.electrical_power?.toFixed(2)]);
      csvData.push([]);
    }
    
    // Recommandations
    if (results.expert_recommendations && results.expert_recommendations.length > 0) {
      csvData.push(['RECOMMANDATIONS']);
      results.expert_recommendations.forEach((rec, index) => {
        csvData.push([`${index + 1}. ${rec.title}`]);
        csvData.push(['Description', rec.description]);
        csvData.push(['Impact', rec.impact]);
        csvData.push([]);
      });
    }
    
    // Convertir en CSV
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    // Télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `donnees-pompage-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const calculateExpertAnalysis = async (data = inputData) => {
    if (!autoCalculate && data === inputData) return;
    
    setLoading(true);
    try {
      // Convertir les valeurs vides en 0 pour les calculs (sans affecter l'affichage)
      const cleanedData = {
        ...data,
        suction_height: data.suction_height === '' ? 0 : data.suction_height,
        discharge_height: data.discharge_height === '' ? 0 : data.discharge_height,
        suction_length: data.suction_length === '' ? 0 : data.suction_length,
        discharge_length: data.discharge_length === '' ? 0 : data.discharge_length,
        npsh_required: data.npsh_required === '' ? 0 : data.npsh_required
      };
      
      const response = await axios.post(`${API}/expert-analysis`, {
        ...cleanedData,
        // Formatage des raccords
        suction_fittings: [
          { fitting_type: 'elbow_90', quantity: data.suction_elbow_90 },
          { fitting_type: 'elbow_45', quantity: data.suction_elbow_45 },
          { fitting_type: 'tee', quantity: data.suction_tee },
          { fitting_type: 'reducer', quantity: data.suction_reducer },
          { fitting_type: 'valve', quantity: data.suction_valve },
          { fitting_type: 'check_valve', quantity: data.suction_check_valve },
          { fitting_type: 'strainer', quantity: data.suction_strainer }
        ].filter(f => f.quantity > 0),
        discharge_fittings: [
          { fitting_type: 'elbow_90', quantity: data.discharge_elbow_90 },
          { fitting_type: 'elbow_45', quantity: data.discharge_elbow_45 },
          { fitting_type: 'tee', quantity: data.discharge_tee },
          { fitting_type: 'reducer', quantity: data.discharge_reducer },
          { fitting_type: 'valve', quantity: data.discharge_valve },
          { fitting_type: 'check_valve', quantity: data.discharge_check_valve }
        ].filter(f => f.quantity > 0),
        elbow_90_qty: data.suction_elbow_90 + data.discharge_elbow_90,
        elbow_45_qty: data.suction_elbow_45 + data.discharge_elbow_45,
        valve_qty: data.suction_valve + data.discharge_valve,
        check_valve_qty: data.suction_check_valve + data.discharge_check_valve
      });
      
      setResults(response.data);
      updateExpertCharts(response.data);
    } catch (error) {
      console.error('Erreur analyse expert:', error);
      // Fallback avec calculs séparés
      await calculateFallbackAnalysis(data);
    } finally {
      setLoading(false);
    }
  };

  const calculateFallbackAnalysis = async (data) => {
    try {
      // Convertir les valeurs vides en 0 pour les calculs
      const cleanedData = {
        ...data,
        suction_height: data.suction_height === '' ? 0 : data.suction_height,
        discharge_height: data.discharge_height === '' ? 0 : data.discharge_height,
        suction_length: data.suction_length === '' ? 0 : data.suction_length,
        discharge_length: data.discharge_length === '' ? 0 : data.discharge_length,
        npsh_required: data.npsh_required === '' ? 0 : data.npsh_required
      };
      
      // Calculs parallèles pour toutes les données
      const [npshResponse, hmtResponse, perfResponse] = await Promise.all([
        axios.post(`${API}/calculate-npshd`, {
          suction_type: cleanedData.suction_height > 0 ? 'flooded' : 'suction_lift',
          hasp: Math.abs(cleanedData.suction_height),
          flow_rate: cleanedData.flow_rate,
          fluid_type: cleanedData.fluid_type,
          temperature: cleanedData.temperature,
          pipe_diameter: cleanedData.suction_pipe_diameter,
          pipe_material: cleanedData.suction_material,
          pipe_length: cleanedData.suction_length,
          suction_fittings: [
            { fitting_type: 'elbow_90', quantity: cleanedData.suction_elbow_90 },
            { fitting_type: 'check_valve', quantity: cleanedData.suction_check_valve }
          ].filter(f => f.quantity > 0),
          npsh_required: cleanedData.npsh_required
        }),
        axios.post(`${API}/calculate-hmt`, {
          installation_type: cleanedData.installation_type,
          suction_type: cleanedData.suction_height > 0 ? 'flooded' : 'suction_lift',
          hasp: Math.abs(cleanedData.suction_height),
          discharge_height: cleanedData.discharge_height,
          useful_pressure: cleanedData.useful_pressure,
          suction_pipe_diameter: cleanedData.suction_pipe_diameter,
          discharge_pipe_diameter: cleanedData.discharge_pipe_diameter,
          suction_pipe_length: cleanedData.suction_length,
          discharge_pipe_length: cleanedData.discharge_length,
          suction_pipe_material: cleanedData.suction_material,
          discharge_pipe_material: cleanedData.discharge_material,
          suction_fittings: [
            { fitting_type: 'elbow_90', quantity: cleanedData.suction_elbow_90 },
            { fitting_type: 'check_valve', quantity: cleanedData.suction_check_valve }
          ].filter(f => f.quantity > 0),
          discharge_fittings: [
            { fitting_type: 'elbow_90', quantity: cleanedData.discharge_elbow_90 },
            { fitting_type: 'valve', quantity: cleanedData.discharge_valve }
          ].filter(f => f.quantity > 0),
          fluid_type: cleanedData.fluid_type,
          temperature: cleanedData.temperature,
          flow_rate: cleanedData.flow_rate
        }),
        axios.post(`${API}/calculate-performance`, {
          flow_rate: cleanedData.flow_rate,
          hmt: 30, // Estimation temporaire
          pipe_diameter: cleanedData.suction_pipe_diameter,
          fluid_type: cleanedData.fluid_type,
          pipe_material: cleanedData.suction_material,
          pump_efficiency: cleanedData.pump_efficiency,
          motor_efficiency: cleanedData.motor_efficiency,
          starting_method: cleanedData.starting_method,
          power_factor: cleanedData.power_factor,
          cable_length: cleanedData.cable_length,
          cable_material: cleanedData.cable_material,
          voltage: cleanedData.voltage
        })
      ]);

      // Calculs avancés d'expert
      const hydraulicPower = ((cleanedData.flow_rate * hmtResponse.data.hmt) / (cleanedData.pump_efficiency * 367)) * 100;
      const electricalPower = hydraulicPower / (cleanedData.motor_efficiency / 100);
      const overallEfficiency = (cleanedData.pump_efficiency / 100) * (cleanedData.motor_efficiency / 100) * 100;
      const annualEnergyCost = (electricalPower * cleanedData.operating_hours * cleanedData.electricity_cost) / 1000;
      
      // Combinaison des résultats
      const combinedResults = {
        npshd_analysis: {
          npshd: npshResponse.data.npshd,
          npsh_required: npshResponse.data.npsh_required,
          npsh_margin: npshResponse.data.npsh_margin,
          cavitation_risk: npshResponse.data.cavitation_risk,
          velocity: npshResponse.data.velocity,
          reynolds_number: npshResponse.data.reynolds_number,
          total_head_loss: npshResponse.data.total_head_loss,
          warnings: npshResponse.data.warnings,
          recommendations: npshResponse.data.recommendations
        },
        hmt_analysis: {
          hmt: hmtResponse.data.hmt,
          static_head: hmtResponse.data.static_head,
          total_head_loss: hmtResponse.data.total_head_loss,
          suction_velocity: hmtResponse.data.suction_velocity,
          discharge_velocity: hmtResponse.data.discharge_velocity,
          useful_pressure_head: hmtResponse.data.useful_pressure_head,
          warnings: hmtResponse.data.warnings
        },
        performance_analysis: {
          overall_efficiency: overallEfficiency,
          pump_efficiency: data.pump_efficiency,
          motor_efficiency: data.motor_efficiency,
          hydraulic_power: hydraulicPower,
          electrical_power: electricalPower,
          nominal_current: perfResponse.data.nominal_current,
          starting_current: perfResponse.data.starting_current,
          power_calculations: perfResponse.data.power_calculations,
          warnings: perfResponse.data.warnings,
          alerts: perfResponse.data.alerts
        },
        electrical_analysis: {
          voltage: data.voltage,
          power_factor: data.power_factor,
          starting_method: data.starting_method,
          cable_length: data.cable_length,
          cable_section: perfResponse.data.recommended_cable_section,
          annual_energy_cost: annualEnergyCost,
          daily_energy_cost: annualEnergyCost / 365,
          energy_consumption_per_m3: electricalPower / data.flow_rate
        },
        overall_efficiency: overallEfficiency,
        total_head_loss: (npshResponse.data.total_head_loss || 0) + (hmtResponse.data.total_head_loss || 0),
        system_stability: !npshResponse.data.cavitation_risk && overallEfficiency > 60,
        energy_consumption: electricalPower / data.flow_rate,
        expert_recommendations: generateExpertRecommendations(data, npshResponse.data, hmtResponse.data, perfResponse.data),
        optimization_potential: {
          energy_savings: Math.max(0, 80 - overallEfficiency),
          npsh_margin: npshResponse.data.npsh_margin,
          velocity_optimization: Math.max(0, npshResponse.data.velocity - 2.0),
          head_loss_reduction: Math.max(0, (npshResponse.data.total_head_loss + hmtResponse.data.total_head_loss) * 0.3)
        },
        performance_curves: perfResponse.data.performance_curves || {},
        system_curves: {
          flow_points: Array.from({length: 20}, (_, i) => i * 5),
          system_curve: Array.from({length: 20}, (_, i) => (i * 5)**2 * 0.01),
          operating_point: {
            flow: data.flow_rate,
            head: hmtResponse.data.hmt,
            efficiency: overallEfficiency,
            power: electricalPower
          }
        }
      };

      setResults(combinedResults);
      updateExpertCharts(combinedResults);
    } catch (error) {
      console.error('Erreur calculs fallback:', error);
    }
  };

  const generateExpertRecommendations = (input, npshd, hmt, perf) => {
    const recommendations = [];
    
    // Analyse critique de cavitation
    if (npshd.cavitation_risk) {
      recommendations.push({
        type: 'critical',
        priority: 1,
        title: '🚨 CAVITATION CRITIQUE',
        description: `NPSHd (${npshd.npshd.toFixed(2)}m) ≤ NPSH requis (${input.npsh_required.toFixed(2)}m)`,
        impact: 'DESTRUCTION DE LA POMPE - Arrêt immédiat requis',
        solutions: [
          `Réduire hauteur d'aspiration de ${Math.abs(input.suction_height).toFixed(1)}m à ${Math.max(0, Math.abs(input.suction_height) - Math.abs(npshd.npsh_margin) - 0.5).toFixed(1)}m`,
          `Augmenter diamètre aspiration de ${input.suction_pipe_diameter}mm à ${Math.ceil(input.suction_pipe_diameter * 1.3)}mm`,
          `Réduire longueur aspiration de ${input.suction_length}m à ${Math.max(5, input.suction_length * 0.7).toFixed(1)}m`,
          'Supprimer raccords non essentiels sur aspiration',
          'Installer pompe en charge si possible'
        ],
        urgency: 'IMMÉDIATE',
        cost_impact: 'ÉLEVÉ'
      });
    }
    
    // Analyse de performance énergétique
    const efficiency = (input.pump_efficiency / 100) * (input.motor_efficiency / 100) * 100;
    if (efficiency < 65) {
      const potential_savings = (75 - efficiency) * 0.01 * input.operating_hours * input.electricity_cost;
      recommendations.push({
        type: 'energy',
        priority: 2,
        title: '⚡ EFFICACITÉ ÉNERGÉTIQUE FAIBLE',
        description: `Rendement global ${efficiency.toFixed(1)}% - Potentiel d'économie de ${potential_savings.toFixed(0)}€/an`,
        impact: `Surconsommation: ${(potential_savings * 10).toFixed(0)}€ sur 10 ans`,
        solutions: [
          'Pompe haute efficacité (gain 5-10%)',
          'Moteur haut rendement Premium (gain 2-5%)',
          'Variateur de vitesse (gain 10-30%)',
          'Optimisation point de fonctionnement',
          'Maintenance préventive régulière'
        ],
        urgency: 'MOYENNE',
        cost_impact: 'RENTABLE'
      });
    }
    
    // Analyse hydraulique avancée
    if (npshd.velocity > 3.0) {
      recommendations.push({
        type: 'hydraulic',
        priority: 3,
        title: '🌊 VITESSE EXCESSIVE',
        description: `Vitesse ${npshd.velocity.toFixed(2)}m/s > 3m/s - Risque d'érosion et cavitation`,
        impact: 'Usure prématurée, bruit, vibrations, perte de performance',
        solutions: [
          `Diamètre aspiration: ${input.suction_pipe_diameter}mm → ${Math.ceil(input.suction_pipe_diameter * Math.sqrt(npshd.velocity / 2.5))}mm`,
          `Diamètre refoulement: ${input.discharge_pipe_diameter}mm → ${Math.ceil(input.discharge_pipe_diameter * Math.sqrt(npshd.velocity / 3.0))}mm`,
          'Matériaux anti-érosion (inox, fonte)',
          'Supports anti-vibratoires',
          'Réduction débit si possible'
        ],
        urgency: 'MOYENNE',
        cost_impact: 'MODÉRÉ'
      });
    }
    
    // Analyse électrique
    if (perf.starting_current > 150) {
      recommendations.push({
        type: 'electrical',
        priority: 4,
        title: '🔌 COURANT DE DÉMARRAGE ÉLEVÉ',
        description: `Courant démarrage ${perf.starting_current.toFixed(1)}A - Impact réseau`,
        impact: 'Chutes de tension, perturbations réseau, contraintes transformateur',
        solutions: [
          'Démarreur progressif (réduction 50-70%)',
          'Variateur de vitesse (réduction 80%)',
          'Démarrage étoile-triangle (réduction 33%)',
          'Renforcement alimentation électrique',
          'Compensation d\'énergie réactive'
        ],
        urgency: 'FAIBLE',
        cost_impact: 'VARIABLE'
      });
    }
    
    // Analyse de fiabilité
    const total_singularities = Object.keys(input).filter(k => k.includes('_elbow_') || k.includes('_valve') || k.includes('_tee')).reduce((sum, key) => sum + (input[key] || 0), 0);
    if (total_singularities > 8) {
      recommendations.push({
        type: 'reliability',
        priority: 5,
        title: '🔧 COMPLEXITÉ EXCESSIVE',
        description: `${total_singularities} singularités - Risque de pannes multiples`,
        impact: 'Maintenance accrue, points de défaillance multiples, pertes de charge',
        solutions: [
          'Simplification du circuit hydraulique',
          'Réduction nombre de raccords',
          'Tuyauterie rectiligne privilégiée',
          'Raccords haute qualité',
          'Plan de maintenance préventive'
        ],
        urgency: 'FAIBLE',
        cost_impact: 'LONG TERME'
      });
    }
    
    return recommendations;
  };

  const updateExpertCharts = (data) => {
    if (!chartRef.current || !data.performance_curves) return;

    const ctx = chartRef.current.getContext('2d');
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const curves = data.performance_curves;
    const systemCurve = data.system_curves;
    
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: curves.flow || systemCurve.flow_points,
        datasets: [
          {
            label: 'Courbe HMT Pompe',
            data: curves.hmt || [],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 8,
            tension: 0.4,
            fill: false,
            yAxisID: 'y'
          },
          {
            label: 'Courbe Système',
            data: systemCurve.system_curve || [],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 8,
            tension: 0.4,
            fill: false,
            yAxisID: 'y'
          },
          {
            label: 'Rendement Pompe',
            data: curves.efficiency || [],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 8,
            tension: 0.4,
            fill: false,
            yAxisID: 'y1'
          },
          {
            label: 'Puissance Absorbée',
            data: curves.power || [],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 8,
            tension: 0.4,
            fill: false,
            yAxisID: 'y2'
          },
          {
            label: 'Point de Fonctionnement',
            data: [{
              x: systemCurve.operating_point?.flow || inputData.flow_rate,
              y: systemCurve.operating_point?.head || 0
            }],
            borderColor: '#000000',
            backgroundColor: '#000000',
            borderWidth: 4,
            pointRadius: 12,
            pointHoverRadius: 16,
            showLine: false,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Débit (m³/h)',
              font: { size: 14, weight: 'bold' }
            },
            grid: { color: 'rgba(0, 0, 0, 0.1)' }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'HMT (m)',
              font: { size: 14, weight: 'bold' }
            },
            grid: { color: 'rgba(0, 0, 0, 0.1)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Rendement (%)',
              font: { size: 14, weight: 'bold' }
            },
            min: 0,
            max: 100,
            grid: { drawOnChartArea: false }
          },
          y2: {
            type: 'linear',
            display: false,
            position: 'right',
            title: {
              display: true,
              text: 'Puissance (kW)',
              font: { size: 14, weight: 'bold' }
            },
            grid: { drawOnChartArea: false }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { size: 12, weight: 'bold' },
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'Analyse Experte - Courbes de Performance et Système',
            font: { size: 16, weight: 'bold' }
          }
        }
      }
    });
  };

  // Calcul initial
  React.useEffect(() => {
    if (autoCalculate) {
      calculateExpertAnalysis();
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Header Expert - Plus compact */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-1">🧠 ANALYSE HYDRAULIQUE EXPERTE</h2>
        <p className="text-purple-100 text-sm mb-3">
          Calculs avancés temps réel • Diagnostics automatiques • Recommandations professionnelles
        </p>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoCalculate}
                onChange={(e) => setAutoCalculate(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Auto</span>
            </label>
            {!autoCalculate && (
              <button
                onClick={() => calculateExpertAnalysis()}
                className="bg-white text-purple-600 px-3 py-1 rounded-md font-medium hover:bg-purple-50 transition-colors text-sm"
                disabled={loading}
              >
                {loading ? 'Calcul...' : 'Calculer'}
              </button>
            )}
            
            <button
              onClick={resetAllFields}
              className="bg-red-500 text-white px-3 py-1 rounded-md font-medium hover:bg-red-600 transition-colors text-sm"
              title="Remettre à zéro"
            >
              🔄 RAZ
            </button>
            
            <button
              onClick={() => exportToPDF()}
              className="bg-blue-500 text-white px-3 py-1 rounded-md font-medium hover:bg-blue-600 transition-colors text-sm"
              disabled={!results}
            >
              📄 PDF
            </button>
            
            <button
              onClick={() => exportToExcel()}
              className="bg-green-500 text-white px-3 py-1 rounded-md font-medium hover:bg-green-600 transition-colors text-sm"
              disabled={!results}
            >
              📊 Excel
            </button>
          </div>
          
          <div className="flex space-x-1">
            {['all', 'hydraulic', 'electrical', 'analysis'].map(section => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeSection === section 
                    ? 'bg-white text-purple-600' 
                    : 'bg-purple-500 text-white hover:bg-purple-400'
                }`}
              >
                {section === 'all' ? 'Tout' : 
                 section === 'hydraulic' ? 'Hydr.' : 
                 section === 'electrical' ? 'Élec.' : 'Analyse'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Panneau de saisie - Colonne 1 - Plus compact */}
        <div className="xl:col-span-1 space-y-4">
          {/* Informations du projet - Plus compact */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-md font-semibold mb-3 text-indigo-600 flex items-center">
              👤 Informations Projet
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={inputData.engineer_name || ''}
                    onChange={(e) => handleInputChange('engineer_name', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nom de l'ingénieur"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={inputData.engineer_firstname || ''}
                    onChange={(e) => handleInputChange('engineer_firstname', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Prénom de l'ingénieur"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Société cliente
                </label>
                <input
                  type="text"
                  value={inputData.company_name || ''}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nom de la société cliente"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📞 Téléphone
                  </label>
                  <input
                    type="tel"
                    value={inputData.engineer_phone || ''}
                    onChange={(e) => handleInputChange('engineer_phone', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="+226 XX XX XX XX"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📧 Email
                  </label>
                  <input
                    type="email"
                    value={inputData.engineer_email || ''}
                    onChange={(e) => handleInputChange('engineer_email', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ingenieur@ecopump.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Paramètres hydrauliques - Plus compact */}
          {(activeSection === 'all' || activeSection === 'hydraulic') && (
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-md font-semibold mb-3 text-blue-600 flex items-center">
                💧 Paramètres Hydrauliques
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      ⭐ Débit (m³/h)
                    </label>
                    <input
                      type="number"
                      value={inputData.flow_rate || ''}
                      onChange={(e) => handleInputChange('flow_rate', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border-2 border-yellow-400 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50 text-sm"
                      placeholder="Débit"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      ⭐ Température (°C)
                    </label>
                    <input
                      type="number"
                      value={inputData.temperature || ''}
                      onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border-2 border-yellow-400 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50 text-sm"
                      placeholder="Temp."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Fluide
                  </label>
                  <select
                    value={inputData.fluid_type}
                    onChange={(e) => handleInputChange('fluid_type', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {fluids.map(fluid => (
                      <option key={fluid.id} value={fluid.id}>{fluid.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Propriétés du fluide - Version compacte */}
                <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-xs font-semibold text-blue-800 mb-2">
                    🧪 Propriétés à {inputData.temperature}°C
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white p-2 rounded border text-center">
                      <div className="font-medium text-gray-700">Densité</div>
                      <div className="text-sm font-bold text-blue-600">
                        {(() => {
                          const fluidProps = calculateFluidProperties(inputData.fluid_type, inputData.temperature);
                          return fluidProps.density.toFixed(0);
                        })()}
                      </div>
                      <div className="text-xs text-gray-500">kg/m³</div>
                    </div>
                    
                    <div className="bg-white p-2 rounded border text-center">
                      <div className="font-medium text-gray-700">Viscosité</div>
                      <div className="text-sm font-bold text-green-600">
                        {(() => {
                          const fluidProps = calculateFluidProperties(inputData.fluid_type, inputData.temperature);
                          return fluidProps.viscosity.toFixed(4);
                        })()}
                      </div>
                      <div className="text-xs text-gray-500">Pa·s</div>
                    </div>
                    
                    <div className="bg-white p-2 rounded border text-center">
                      <div className="font-medium text-gray-700">P. Vapeur</div>
                      <div className="text-sm font-bold text-red-600">
                        {(() => {
                          const fluidProps = calculateFluidProperties(inputData.fluid_type, inputData.temperature);
                          return (fluidProps.vapor_pressure/1000).toFixed(1);
                        })()}
                      </div>
                      <div className="text-xs text-gray-500">kPa</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Type d'Aspiration
                    </label>
                    <select
                      value={inputData.suction_type}
                      onChange={(e) => handleInputChange('suction_type', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="flooded">En charge</option>
                      <option value="suction_lift">En dépression</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      ⭐ Hauteur Asp. (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={inputData.suction_height !== undefined && inputData.suction_height !== null ? inputData.suction_height : ''}
                      onChange={(e) => handleInputChange('suction_height', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full p-2 border-2 border-yellow-400 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50 text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      ⭐ Hauteur Ref. (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={inputData.discharge_height !== undefined && inputData.discharge_height !== null ? inputData.discharge_height : ''}
                      onChange={(e) => handleInputChange('discharge_height', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full p-2 border-2 border-yellow-400 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50 text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Pression Utile (bar)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={inputData.useful_pressure || ''}
                      onChange={(e) => handleInputChange('useful_pressure', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Pression supplémentaire"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ⭐ ⌀ Aspiration (DN)
                    </label>
                    <select
                      value={inputData.suction_pipe_diameter > 0 ? inputData.suction_pipe_diameter : ''}
                      onChange={(e) => handleInputChange('suction_pipe_diameter', parseFloat(e.target.value))}
                      className="w-full p-2 border-2 border-yellow-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50"
                    >
                      {dnSizes.map(size => (
                        <option key={size.mm} value={size.mm}>{size.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ⭐ ⌀ Refoulement (DN)
                    </label>
                    <select
                      value={inputData.discharge_pipe_diameter > 0 ? inputData.discharge_pipe_diameter : ''}
                      onChange={(e) => handleInputChange('discharge_pipe_diameter', parseFloat(e.target.value))}
                      className="w-full p-2 border-2 border-yellow-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50"
                    >
                      {dnSizes.map(size => (
                        <option key={size.mm} value={size.mm}>{size.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Long. Asp. (m)
                    </label>
                    <input
                      type="number"
                      value={inputData.suction_length !== undefined && inputData.suction_length !== null ? inputData.suction_length : ''}
                      onChange={(e) => handleInputChange('suction_length', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Longueur aspiration"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Long. Ref. (m)
                    </label>
                    <input
                      type="number"
                      value={inputData.discharge_length !== undefined && inputData.discharge_length !== null ? inputData.discharge_length : ''}
                      onChange={(e) => handleInputChange('discharge_length', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Longueur refoulement"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matériau Asp.
                    </label>
                    <select
                      value={inputData.suction_material}
                      onChange={(e) => handleInputChange('suction_material', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {pipeMaterials.map(material => (
                        <option key={material.id} value={material.id}>{material.name} (ε = {material.roughness} mm)</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matériau Ref.
                    </label>
                    <select
                      value={inputData.discharge_material}
                      onChange={(e) => handleInputChange('discharge_material', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {pipeMaterials.map(material => (
                        <option key={material.id} value={material.id}>{material.name} (ε = {material.roughness} mm)</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ⭐ NPSH Requis (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputData.npsh_required !== undefined && inputData.npsh_required !== null ? inputData.npsh_required : ''}
                    onChange={(e) => handleInputChange('npsh_required', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full p-2 border-2 border-yellow-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50"
                    placeholder="NPSH requis de la pompe"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Singularités Complètes - Version Compacte */}
          {(activeSection === 'all' || activeSection === 'hydraulic') && (
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-orange-600 flex items-center">
                  🔧 Singularités Complètes
                </h3>
                <button
                  onClick={() => setShowSingularities(!showSingularities)}
                  className="px-3 py-1 bg-orange-100 text-orange-700 rounded-md text-sm hover:bg-orange-200 transition-colors"
                >
                  {showSingularities ? '📁 Replier' : '📂 Développer'}
                </button>
              </div>
              
              {showSingularities && (
                <div className="space-y-4">
                  {/* ASPIRATION - Format Tableau Compact */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">💧 ASPIRATION (Impact critique NPSHd)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-blue-100">
                            <th className="border p-1 text-left">Type</th>
                            <th className="border p-1 w-12">90°</th>
                            <th className="border p-1 w-12">45°</th>
                            <th className="border p-1 w-12">30°</th>
                            <th className="border p-1 w-12">Té P</th>
                            <th className="border p-1 w-12">Té D</th>
                            <th className="border p-1 w-12">V. Op</th>
                            <th className="border p-1 w-12">V. Boi</th>
                            <th className="border p-1 w-12">Clap</th>
                            <th className="border p-1 w-12">C.Pied</th>
                            <th className="border p-1 w-12">Crép</th>
                            <th className="border p-1 w-12">R.Grd</th>
                            <th className="border p-1 w-12">R.Bru</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border p-1 font-medium">Coudes/Vannes/Raccords</td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.suction_elbow_90} 
                                onChange={(e) => handleInputChange('suction_elbow_90', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.suction_elbow_45}
                                onChange={(e) => handleInputChange('suction_elbow_45', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.suction_elbow_30}
                                onChange={(e) => handleInputChange('suction_elbow_30', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.suction_tee_flow}
                                onChange={(e) => handleInputChange('suction_tee_flow', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.suction_tee_branch}
                                onChange={(e) => handleInputChange('suction_tee_branch', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.suction_gate_valve}
                                onChange={(e) => handleInputChange('suction_gate_valve', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.suction_ball_valve}
                                onChange={(e) => handleInputChange('suction_ball_valve', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.suction_check_valve}
                                onChange={(e) => handleInputChange('suction_check_valve', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.suction_foot_valve}
                                onChange={(e) => handleInputChange('suction_foot_valve', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.suction_strainer}
                                onChange={(e) => handleInputChange('suction_strainer', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.suction_reducer_gradual}
                                onChange={(e) => handleInputChange('suction_reducer_gradual', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.suction_reducer_sudden}
                                onChange={(e) => handleInputChange('suction_reducer_sudden', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* REFOULEMENT - Format Tableau Compact */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">🔄 REFOULEMENT (Impact HMT total)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-green-100">
                            <th className="border p-1 text-left">Type</th>
                            <th className="border p-1 w-12">90°</th>
                            <th className="border p-1 w-12">45°</th>
                            <th className="border p-1 w-12">30°</th>
                            <th className="border p-1 w-12">Té P</th>
                            <th className="border p-1 w-12">V. Op</th>
                            <th className="border p-1 w-12">V. Boi</th>
                            <th className="border p-1 w-12">V. Pap</th>
                            <th className="border p-1 w-12">Clap</th>
                            <th className="border p-1 w-12">R.Grd</th>
                            <th className="border p-1 w-12">Débit</th>
                            <th className="border p-1 w-12">Mano</th>
                            <th className="border p-1 w-12">Filtr</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border p-1 font-medium">Coudes/Vannes/Acc.</td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.discharge_elbow_90}
                                onChange={(e) => handleInputChange('discharge_elbow_90', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.discharge_elbow_45}
                                onChange={(e) => handleInputChange('discharge_elbow_45', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.discharge_elbow_30}
                                onChange={(e) => handleInputChange('discharge_elbow_30', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.discharge_tee_flow}
                                onChange={(e) => handleInputChange('discharge_tee_flow', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.discharge_gate_valve}
                                onChange={(e) => handleInputChange('discharge_gate_valve', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.discharge_ball_valve}
                                onChange={(e) => handleInputChange('discharge_ball_valve', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.discharge_butterfly_valve}
                                onChange={(e) => handleInputChange('discharge_butterfly_valve', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.discharge_check_valve}
                                onChange={(e) => handleInputChange('discharge_check_valve', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.discharge_reducer_gradual}
                                onChange={(e) => handleInputChange('discharge_reducer_gradual', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.discharge_flow_meter}
                                onChange={(e) => handleInputChange('discharge_flow_meter', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.discharge_pressure_gauge}
                                onChange={(e) => handleInputChange('discharge_pressure_gauge', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                            <td className="border p-0">
                              <input type="number" min="0" value={inputData.discharge_strainer}
                                onChange={(e) => handleInputChange('discharge_strainer', parseInt(e.target.value) || 0)}
                                className="w-full p-1 border-0 text-center bg-transparent" />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Conseil Expert - Plus compact */}
                  <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-800">
                      <strong>💡 Conseil :</strong> Limitez les singularités sur l'aspiration pour préserver le NPSHd. 
                      Abréviations: Té P=passage, Té D=dérivation, V.Op=opercule, V.Boi=boisseau, V.Pap=papillon, 
                      Clap=clapet A.R., C.Pied=clapet pied, R.Grd/Bru=réduction graduelle/brusque.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paramètres électriques */}
          {(activeSection === 'all' || activeSection === 'electrical') && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-yellow-600 flex items-center">
                ⚡ Paramètres Électriques
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ⭐ Rendement Pompe (%)
                    </label>
                    <input
                      type="number"
                      min="40"
                      max="95"
                      value={inputData.pump_efficiency || ''}
                      onChange={(e) => handleInputChange('pump_efficiency', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border-2 border-yellow-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50"
                      placeholder="75"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ⭐ Rendement Moteur (%)
                    </label>
                    <input
                      type="number"
                      min="70"
                      max="98"
                      value={inputData.motor_efficiency || ''}
                      onChange={(e) => handleInputChange('motor_efficiency', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border-2 border-yellow-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50"
                      placeholder="85"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tension (V)
                    </label>
                    <select
                      value={inputData.voltage}
                      onChange={(e) => handleInputChange('voltage', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={230}>230V (Monophasé)</option>
                      <option value={400}>400V (Triphasé)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cos φ
                    </label>
                    <input
                      type="number"
                      min="0.6"
                      max="1"
                      step="0.01"
                      value={inputData.power_factor}
                      onChange={(e) => handleInputChange('power_factor', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Démarrage
                  </label>
                  <select
                    value={inputData.starting_method}
                    onChange={(e) => handleInputChange('starting_method', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="star_delta">Étoile-Triangle</option>
                    <option value="direct_on_line">Direct</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longueur Câble (m)
                    </label>
                    <input
                      type="number"
                      value={inputData.cable_length || ''}
                      onChange={(e) => handleInputChange('cable_length', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Longueur du câble"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matériau Câble
                    </label>
                    <select
                      value={inputData.cable_material}
                      onChange={(e) => handleInputChange('cable_material', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="copper">Cuivre</option>
                      <option value="aluminum">Aluminium</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chute de Tension (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={inputData.voltage_drop || ''}
                    onChange={(e) => handleInputChange('voltage_drop', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="3"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Chute de tension admissible en % (généralement 3% max pour moteurs)
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fonctionnement (h/an)
                    </label>
                    <input
                      type="number"
                      value={inputData.operating_hours || ''}
                      onChange={(e) => handleInputChange('operating_hours', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Heures de fonctionnement annuel"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix kWh (FCFA)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={inputData.electricity_cost || ''}
                      onChange={(e) => handleInputChange('electricity_cost', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Prix du kWh en FCFA"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Prix unitaire de l'électricité (tarif industriel/domestique)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panneau de résultats et graphiques - Colonnes 2 et 3 */}
        <div className="xl:col-span-2 space-y-6">
          {loading && (
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-4 font-medium">Analyse en cours...</p>
            </div>
          )}
          
          {/* Résultats instantanés */}
          {results && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-green-600 flex items-center">
                📊 Résultats Temps Réel
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {results.npshd_analysis?.npshd?.toFixed(2) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">NPSHd (m)</div>
                  <div className={`text-xs mt-1 ${results.npshd_analysis?.cavitation_risk ? 'text-red-600' : 'text-green-600'}`}>
                    {results.npshd_analysis?.cavitation_risk ? '⚠️ Risque' : '✅ Sûr'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {results.hmt_analysis?.hmt?.toFixed(2) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">HMT (m)</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Statique: {results.hmt_analysis?.static_head?.toFixed(1) || 'N/A'}m
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {results.overall_efficiency?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Rendement (%)</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Global: {results.performance_analysis?.pump_efficiency?.toFixed(0) || 'N/A'} × {results.performance_analysis?.motor_efficiency?.toFixed(0) || 'N/A'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {results.npshd_analysis?.velocity?.toFixed(2) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Vitesse (m/s)</div>
                  <div className={`text-xs mt-1 ${(results.npshd_analysis?.velocity || 0) > 3 ? 'text-red-600' : 'text-green-600'}`}>
                    {(results.npshd_analysis?.velocity || 0) > 3 ? '⚠️ Élevée' : '✅ Normale'}
                  </div>
                </div>
              </div>
              
              {/* Section Données Hydrauliques Principales avec valeurs mises en évidence */}
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                  💧 Résultats Hydrauliques Principaux
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* DÉBIT - Valeur mise en évidence */}
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg border-4 border-blue-500 shadow-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {inputData.flow_rate?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="text-sm font-medium text-blue-800">DÉBIT</div>
                      <div className="text-xs text-gray-600">m³/h</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {((inputData.flow_rate || 0) / 3.6).toFixed(3)} m³/s
                      </div>
                    </div>
                  </div>
                  
                  {/* HMT - Valeur mise en évidence */}
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg border-4 border-green-500 shadow-lg">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {results.hmt_analysis?.hmt?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="text-sm font-medium text-green-800">HMT</div>
                      <div className="text-xs text-gray-600">m</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Hauteur Manométrique
                      </div>
                    </div>
                  </div>
                  
                  {/* P2 - Valeur mise en évidence */}
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg border-4 border-orange-500 shadow-lg">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {results.performance_analysis?.hydraulic_power?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="text-sm font-medium text-orange-800">P2</div>
                      <div className="text-xs text-gray-600">kW</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Puissance Hydraulique
                      </div>
                    </div>
                  </div>
                  
                  {/* COURANT NOMINAL - Valeur mise en évidence */}
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg border-4 border-purple-500 shadow-lg">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {results.performance_analysis?.nominal_current?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="text-sm font-medium text-purple-800">COURANT</div>
                      <div className="text-xs text-gray-600">A</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Courant Nominal
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Ligne supplémentaire pour autres résultats importants */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-blue-200">
                  <div className="text-center">
                    <div className="bg-white p-3 rounded-lg border-2 border-red-300 shadow">
                      <div className="text-lg font-bold text-red-600">
                        {results.total_head_loss?.toFixed(2) || 'N/A'}
                      </div>
                      <div className="text-sm text-red-800">Pertes Totales</div>
                      <div className="text-xs text-gray-500">m</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-white p-3 rounded-lg border-2 border-indigo-300 shadow">
                      <div className="text-lg font-bold text-indigo-600">
                        {results.npshd_analysis?.reynolds_number ? (
                          results.npshd_analysis.reynolds_number > 4000 ? 'Turbulent' : 
                          results.npshd_analysis.reynolds_number > 2300 ? 'Transitoire' : 'Laminaire'
                        ) : 'N/A'}
                      </div>
                      <div className="text-sm text-indigo-800">Régime</div>
                      <div className="text-xs text-gray-500">
                        Re: {results.npshd_analysis?.reynolds_number?.toFixed(0) || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-white p-3 rounded-lg border-2 border-cyan-300 shadow">
                      <div className="text-lg font-bold text-cyan-600">
                        {inputData.useful_pressure?.toFixed(1) || '0.0'}
                      </div>
                      <div className="text-sm text-cyan-800">Pression Utile</div>
                      <div className="text-xs text-gray-500">bar</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-white p-3 rounded-lg border-2 border-teal-300 shadow">
                      <div className="text-lg font-bold text-teal-600">
                        {results.overall_efficiency?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="text-sm text-teal-800">Rendement Global</div>
                      <div className="text-xs text-gray-500">%</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Ligne de résultats électriques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-indigo-600">
                    {results.performance_analysis?.hydraulic_power?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">P2 (kW)</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Hydraulique
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {results.performance_analysis?.electrical_power?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">P1 (kW)</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Électrique
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {results.performance_analysis?.nominal_current?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Courant (A)</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Nominal
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {results.electrical_analysis?.annual_energy_cost?.toFixed(0) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Coût/an (€)</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {inputData.electricity_cost?.toFixed(3) || 'N/A'} €/kWh
                  </div>
                </div>
              </div>
              
              {/* Indicateurs de performance */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className={`text-lg font-bold ${results.system_stability ? 'text-green-600' : 'text-red-600'}`}>
                    {results.system_stability ? '✅ STABLE' : '⚠️ INSTABLE'}
                  </div>
                  <div className="text-sm text-gray-600">Stabilité Système</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {results.energy_consumption?.toFixed(3) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Conso. (kWh/m³)</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {results.optimization_potential?.energy_savings?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Potentiel (%)</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Économie possible
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Graphiques de performance */}
          {results && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                📈 Courbes de Performance Expert
              </h3>
              <canvas ref={chartRef} className="w-full h-96"></canvas>
            </div>
          )}
        </div>
      </div>

      {/* Schéma d'installation expert */}
      {results && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">🏗️ Schéma d'Installation Expert</h3>
          <div className="flex justify-center">
            <ExpertInstallationSchema inputData={inputData} results={results} pipeMaterials={pipeMaterials} fluids={fluids} />
          </div>
        </div>
      )}

      {/* Recommandations d'expert */}
      {results && results.expert_recommendations && results.expert_recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">🎯 Recommandations d'Expert</h3>
          <div className="space-y-4">
            {results.expert_recommendations.map((rec, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                rec.type === 'critical' ? 'border-red-500 bg-red-50' :
                rec.type === 'energy' ? 'border-green-500 bg-green-50' :
                rec.type === 'hydraulic' ? 'border-blue-500 bg-blue-50' :
                rec.type === 'electrical' ? 'border-yellow-500 bg-yellow-50' :
                'border-gray-500 bg-gray-50'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className={`font-bold text-sm ${
                    rec.type === 'critical' ? 'text-red-800' :
                    rec.type === 'energy' ? 'text-green-800' :
                    rec.type === 'hydraulic' ? 'text-blue-800' :
                    rec.type === 'electrical' ? 'text-yellow-800' :
                    'text-gray-800'
                  }`}>
                    {rec.title}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    rec.urgency === 'IMMÉDIATE' ? 'bg-red-100 text-red-800' :
                    rec.urgency === 'HAUTE' ? 'bg-orange-100 text-orange-800' :
                    rec.urgency === 'MOYENNE' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {rec.urgency}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                <p className="text-xs text-gray-600 mb-3 font-medium">Impact: {rec.impact}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {rec.solutions.map((solution, i) => (
                    <div key={i} className="flex items-start text-sm">
                      <span className="text-green-600 mr-2 mt-1">•</span>
                      <span>{solution}</span>
                    </div>
                  ))}
                </div>
                {rec.cost_impact && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <span className="text-xs font-medium text-gray-600">
                      Impact économique: {rec.cost_impact}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Composant pour le schéma d'installation expert
const ExpertInstallationSchema = ({ inputData, results, pipeMaterials, fluids }) => {
  const isFlooded = inputData.suction_type === 'flooded';
  
  // Configuration dynamique plus prononcée selon le type d'aspiration
  const config = {
    flooded: {
      reservoirY: 120,
      reservoirHeight: 150,
      pumpY: 320,
      statusColor: '#10b981',
      statusIcon: '⬇️',
      statusText: 'EN CHARGE',
      description: 'Pompe en contrebas - Aspiration gravitaire'
    },
    suction_lift: {
      reservoirY: 320,
      reservoirHeight: 120,
      pumpY: 200,
      statusColor: '#ef4444',
      statusIcon: '⬆️',
      statusText: 'EN DÉPRESSION',
      description: 'Pompe en surélévation - Aspiration par dépression'
    }
  };
  
  const currentConfig = isFlooded ? config.flooded : config.suction_lift;
  const waterLevel = currentConfig.reservoirY + 25;
  
  // Calcul dynamique de la position de la pompe selon la hauteur
  const heightScale = Math.min(Math.max(Math.abs(inputData.suction_height) * 12, 20), 100);
  const actualPumpY = isFlooded 
    ? waterLevel + heightScale + 20  // Pompe encore plus bas en charge
    : waterLevel - heightScale - 60; // Pompe encore plus haut en dépression
  
  // Configuration des couleurs selon le type d'installation
  const aspirationColor = currentConfig.statusColor;
  const statusIcon = currentConfig.statusIcon;
  const statusText = currentConfig.statusText;
  
  return (
    <svg width="1200" height="800" viewBox="0 0 1200 800" className="border border-gray-200 rounded-lg">
      <defs>
        <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{stopColor:'#3b82f6', stopOpacity:0.8}} />
          <stop offset="100%" style={{stopColor:'#1e40af', stopOpacity:0.9}} />
        </linearGradient>
        <linearGradient id="pumpGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{stopColor:'#10b981', stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:'#059669', stopOpacity:1}} />
        </linearGradient>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{stopColor:'#f8fafc', stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:'#e2e8f0', stopOpacity:1}} />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="3" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.3)"/>
        </filter>
        <marker id="arrowRed" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
        </marker>
        <marker id="arrowBlue" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
        </marker>
        <marker id="arrowGreen" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
        </marker>
      </defs>
      
      <rect width="1200" height="800" fill="url(#bgGradient)" />
      
      {/* Grille de fond */}
      <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
        <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.3"/>
      </pattern>
      <rect width="1200" height="800" fill="url(#grid)" />
      
      {/* Sol/Base avec référence */}
      <rect x="0" y="750" width="1200" height="50" fill="#8b5cf6" opacity="0.3" />
      <text x="600" y="775" textAnchor="middle" className="text-sm font-medium" fill="#6b7280">
        🌍 NIVEAU SOL - RÉFÉRENCE ALTIMÉTRIQUE
      </text>
      
      {/* Titre dynamique avec configuration amélioré */}
      <rect x="20" y="20" width="600" height="100" fill="white" stroke={aspirationColor} strokeWidth="3" rx="12" filter="url(#shadow)"/>
      <text x="320" y="45" textAnchor="middle" className="text-lg font-bold" fill={aspirationColor}>
        {statusIcon} CONFIGURATION {statusText}
      </text>
      <text x="320" y="65" textAnchor="middle" className="text-sm" fill="#6b7280">
        {currentConfig.description}
      </text>
      <text x="320" y="85" textAnchor="middle" className="text-sm font-medium" fill="#4b5563">
        Q={inputData.flow_rate} m³/h • H={Math.abs(inputData.suction_height)}m • T={inputData.temperature}°C
      </text>
      <text x="320" y="105" textAnchor="middle" className="text-xs" fill="#6b7280">
        {inputData.engineer_firstname} {inputData.engineer_name} - {inputData.company_name}
      </text>
      
      {/* Réservoir avec détails selon la configuration */}
      <rect 
        x="50" 
        y={currentConfig.reservoirY} 
        width="220" 
        height={currentConfig.reservoirHeight} 
        fill="#d1d5db" 
        stroke="#6b7280" 
        strokeWidth="4"
        rx="10"
        filter="url(#shadow)"
      />
      
      {/* Niveau d'eau dynamique */}
      <rect 
        x="58" 
        y={waterLevel} 
        width="204" 
        height={currentConfig.reservoirHeight - 35} 
        fill="url(#waterGradient)"
        rx="6"
      />
      
      {/* Vagues animées sur le niveau d'eau */}
      <path 
        d={`M 58 ${waterLevel} Q 78 ${waterLevel-4} 98 ${waterLevel} T 138 ${waterLevel} T 178 ${waterLevel} T 218 ${waterLevel} T 262 ${waterLevel}`}
        stroke="#1d4ed8" 
        strokeWidth="4" 
        fill="none"
        opacity="0.8"
      />
      
      {/* Étiquettes du réservoir améliorées */}
      <text x="160" y={currentConfig.reservoirY - 15} textAnchor="middle" className="text-sm font-bold" fill="#1f2937">
        🏛️ RÉSERVOIR
      </text>
      <text x="160" y={currentConfig.reservoirY - 2} textAnchor="middle" className="text-xs" fill="#6b7280">
        {fluids.find(f => f.id === inputData.fluid_type)?.name || 'Fluide'} - {inputData.temperature}°C
      </text>
      
      {/* Indication du niveau d'eau */}
      <text x="280" y={waterLevel + 5} className="text-xs font-bold" fill="#1d4ed8">
        💧 Niveau
      </text>
      <text x="280" y={waterLevel + 16} className="text-xs" fill="#6b7280">
        Référence
      </text>
      
      {/* Tuyauterie d'aspiration avec épaisseur proportionnelle */}
      <line 
        x1="270" 
        y1={waterLevel} 
        x2="450" 
        y2={actualPumpY + 40} 
        stroke={aspirationColor} 
        strokeWidth={Math.max(10, inputData.suction_pipe_diameter / 10)}
        strokeLinecap="round"
        filter="url(#shadow)"
        opacity="0.9"
      />
      
      {/* Crépine d'aspiration détaillée */}
      <g transform={`translate(270, ${waterLevel})`}>
        <circle cx="0" cy="0" r="12" fill="#6b7280" stroke="#374151" strokeWidth="3" />
        <circle cx="0" cy="0" r="8" fill="none" stroke="#ffffff" strokeWidth="2" />
        <path d="M -6 -6 L 6 6 M -6 6 L 6 -6" stroke="#ffffff" strokeWidth="1" />
      </g>
      <text x="270" y={waterLevel + 23} textAnchor="middle" className="text-xs font-medium" fill="#6b7280">
        🔧 Crépine
      </text>
      
      {/* Pompe - Position et design selon configuration */}
      <g transform={`translate(450, ${actualPumpY})`}>
        <rect 
          x="0" 
          y="0" 
          width="100" 
          height="80" 
          fill="url(#pumpGradient)"
          stroke="#047857" 
          strokeWidth="5"
          rx="15"
          filter="url(#shadow)"
        />
        
        {/* Détails internes de la pompe */}
        <circle cx="50" cy="40" r="25" fill="none" stroke="white" strokeWidth="4" />
        <path d="M 35 40 Q 50 25 65 40 Q 50 55 35 40" fill="white" opacity="0.9" />
        
        {/* Roue et flèches de rotation */}
        <circle cx="50" cy="40" r="15" fill="none" stroke="white" strokeWidth="2" />
        <path d="M 45 35 Q 55 35 55 45 Q 45 45 45 35" fill="white" opacity="0.7" />
        
        {/* Étiquettes pompe */}
        <text x="50" y="15" textAnchor="middle" className="text-xs font-bold" fill="white">
          🔄 POMPE
        </text>
        <text x="50" y="70" textAnchor="middle" className="text-xs font-medium" fill="white">
          η={inputData.pump_efficiency}%
        </text>
        
        {/* Indicateur de direction */}
        <path 
          d={`M 10 40 Q 25 ${isFlooded ? 30 : 50} 40 40 Q 25 ${isFlooded ? 50 : 30} 10 40`}
          fill={aspirationColor} 
          opacity="0.6"
        />
      </g>
      
      {/* Étiquette de pompe avec spécifications */}
      <text x="500" y={actualPumpY + 100} textAnchor="middle" className="text-xs font-bold" fill="#047857">
        {inputData.pump_type || 'CENTRIFUGE'} • {inputData.installation_type?.toUpperCase() || 'SURFACE'}
      </text>
      
      {/* Tuyauterie de refoulement */}
      <line 
        x1="550" 
        y1={actualPumpY + 40} 
        x2="650" 
        y2={actualPumpY + 40} 
        stroke="#4b5563" 
        strokeWidth={Math.max(10, inputData.discharge_pipe_diameter / 10)}
        strokeLinecap="round"
        filter="url(#shadow)"
      />
      
      {/* Coude de refoulement avec raccordement vertical */}
      <path 
        d={`M 650 ${actualPumpY + 40} Q 680 ${actualPumpY + 40} 680 ${actualPumpY + 10} L 680 140`}
        stroke="#4b5563" 
        strokeWidth={Math.max(10, inputData.discharge_pipe_diameter / 10)}
        fill="none"
        strokeLinecap="round"
        filter="url(#shadow)"
      />
      
      {/* Sortie finale avec détails */}
      <g transform="translate(680, 120)">
        <rect x="-10" y="0" width="20" height="25" fill="#10b981" rx="8" filter="url(#shadow)" />
        <circle cx="0" cy="12" r="6" fill="#ffffff" />
        <text x="0" y="17" textAnchor="middle" className="text-xs font-bold" fill="#10b981">
          💧
        </text>
      </g>
      <text x="720" y="120" className="text-xs font-bold" fill="#10b981">
        🎯 SORTIE
      </text>
      <text x="720" y="132" className="text-xs" fill="#6b7280">
        H={inputData.discharge_height}m
      </text>
      
      {/* Cotes dynamiques renforcées */}
      
      {/* Hauteur d'aspiration avec double flèche */}
      <line 
        x1="20" 
        y1={waterLevel} 
        x2="20" 
        y2={actualPumpY + 40} 
        stroke="#ef4444" 
        strokeWidth="2"
        markerEnd="url(#arrowRed)"
      />
      <line 
        x1="20" 
        y1={actualPumpY + 40} 
        x2="20" 
        y2={waterLevel} 
        stroke="#ef4444" 
        strokeWidth="2"
        markerEnd="url(#arrowRed)"
      />
      
      {/* Encadré de cote avec couleur d'aspiration */}
      <rect 
        x="0" 
        y={(waterLevel + actualPumpY + 40) / 2 - 35} 
        width="60" 
        height="70" 
        fill="white" 
        stroke={aspirationColor} 
        strokeWidth="3" 
        rx="8"
        filter="url(#shadow)"
      />
      <text 
        x="30" 
        y={(waterLevel + actualPumpY + 40) / 2 - 15} 
        textAnchor="middle" 
        className="text-lg font-bold" 
        fill={aspirationColor}
      >
        {Math.abs(inputData.suction_height).toFixed(1)}m
      </text>
      <text 
        x="30" 
        y={(waterLevel + actualPumpY + 40) / 2 + 5} 
        textAnchor="middle" 
        className="text-xs font-medium" 
        fill={aspirationColor}
      >
        {statusText}
      </text>
      <text 
        x="30" 
        y={(waterLevel + actualPumpY + 40) / 2 + 20} 
        textAnchor="middle" 
        className="text-xs" 
        fill="#6b7280"
      >
        {isFlooded ? 'Gravitaire' : 'Aspiration'}
      </text>
      
      {/* Hauteur de refoulement */}
      <line 
        x1="720" 
        y1={actualPumpY + 40} 
        x2="720" 
        y2="140" 
        stroke="#10b981" 
        strokeWidth="2"
        markerEnd="url(#arrowGreen)"
      />
      <line 
        x1="720" 
        y1="140" 
        x2="720" 
        y2={actualPumpY + 40} 
        stroke="#10b981" 
        strokeWidth="2"
        markerEnd="url(#arrowGreen)"
      />
      
      <rect 
        x="730" 
        y={(actualPumpY + 40 + 140) / 2 - 20} 
        width="80" 
        height="40" 
        fill="white" 
        stroke="#10b981" 
        strokeWidth="3" 
        rx="8"
        filter="url(#shadow)"
      />
      <text 
        x="770" 
        y={(actualPumpY + 40 + 140) / 2 - 5} 
        textAnchor="middle" 
        className="text-sm font-bold" 
        fill="#10b981"
      >
        {inputData.discharge_height.toFixed(1)}m
      </text>
      <text 
        x="770" 
        y={(actualPumpY + 40 + 140) / 2 + 10} 
        textAnchor="middle" 
        className="text-xs" 
        fill="#6b7280"
      >
        REFOULEMENT
      </text>
      
      {/* Flèches de débit avec dimensions optimisées */}
      <line 
        x1="320" 
        y1={waterLevel + 20} 
        x2="420" 
        y2={actualPumpY + 20} 
        stroke="#3b82f6" 
        strokeWidth="4"
        markerEnd="url(#arrowBlue)"
        opacity="0.9"
      />
      <text 
        x="370" 
        y={(waterLevel + actualPumpY + 40) / 2 - 20} 
        textAnchor="middle" 
        className="text-sm font-bold" 
        fill="#3b82f6"
      >
        Q = {inputData.flow_rate} m³/h
      </text>
      <text 
        x="370" 
        y={(waterLevel + actualPumpY + 40) / 2 - 5} 
        textAnchor="middle" 
        className="text-xs" 
        fill="#3b82f6"
      >
        V = {results.npshd_analysis?.velocity?.toFixed(2) || 'N/A'} m/s
      </text>
      <text 
        x="370" 
        y={(waterLevel + actualPumpY + 40) / 2 + 10} 
        textAnchor="middle" 
        className="text-xs" 
        fill="#6b7280"
      >
        ⌀{inputData.suction_pipe_diameter}mm
      </text>
      
      {/* Flèche de refoulement */}
      <line 
        x1="570" 
        y1={actualPumpY + 40} 
        x2="630" 
        y2={actualPumpY + 40} 
        stroke="#3b82f6" 
        strokeWidth="4"
        markerEnd="url(#arrowBlue)"
        opacity="0.9"
      />
      <text 
        x="600" 
        y={actualPumpY + 65} 
        textAnchor="middle" 
        className="text-xs font-bold" 
        fill="#3b82f6"
      >
        {results.hmt_analysis?.discharge_velocity?.toFixed(2) || 'N/A'} m/s
      </text>
      <text 
        x="600" 
        y={actualPumpY + 80} 
        textAnchor="middle" 
        className="text-xs" 
        fill="#6b7280"
      >
        ⌀{inputData.discharge_pipe_diameter}mm
      </text>
      
      {/* Panel d'informations techniques expert étendu */}
      <rect x="840" y="80" width="340" height="660" fill="white" stroke="#d1d5db" strokeWidth="4" rx="20" filter="url(#shadow)" />
      <rect x="840" y="80" width="340" height="70" fill={aspirationColor} rx="20" />
      <text x="1010" y="125" textAnchor="middle" className="text-xl font-bold" fill="white">
        📊 EXPERT HYDRAULIQUE
      </text>
      
      {/* Section Propriétés du Fluide avec calculs automatiques */}
      <rect x="850" y="160" width="320" height="150" fill="#f0f9ff" stroke="#0284c7" strokeWidth="2" rx="10" />
      <text x="860" y="180" className="text-sm font-bold" fill="#0c4a6e">💧 PROPRIÉTÉS DU FLUIDE</text>
      
      <text x="860" y="200" className="text-xs" fill="#1f2937">
        Type: {fluids.find(f => f.id === inputData.fluid_type)?.name || 'N/A'}
      </text>
      <text x="860" y="215" className="text-xs" fill="#1f2937">
        Température: {inputData.temperature}°C
      </text>
      <text x="860" y="230" className="text-xs" fill="#1f2937">
        Masse volumique: {(() => {
          // Calcul direct des propriétés pour le SVG
          let density = 1000; // valeur par défaut eau
          
          if (inputData.fluid_type === 'water') {
            density = 1000 - 0.2 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'oil') {
            density = 850 - 0.7 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'acid') {
            density = 1200 - 0.3 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'glycol') {
            density = 1113 - 0.8 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'palm_oil') {
            density = 915 - 0.65 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'gasoline') {
            density = 740 - 0.9 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'diesel') {
            density = 840 - 0.75 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'hydraulic_oil') {
            density = 875 - 0.65 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'ethanol') {
            density = 810 - 1.05 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'seawater') {
            density = 1025 - 0.25 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'methanol') {
            density = 792 - 1.2 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'glycerol') {
            density = 1260 - 0.65 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'milk') {
            density = 1030 - 0.3 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'honey') {
            density = 1400 - 0.8 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'wine') {
            density = 990 - 0.9 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'bleach') {
            density = 1050 - 0.25 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'yogurt') {
            density = 1050 - 0.35 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'tomato_sauce') {
            density = 1100 - 0.4 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'soap_solution') {
            density = 1010 - 0.28 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'fruit_juice') {
            density = 1045 - 0.35 * (inputData.temperature - 20);
          }
          
          return Math.max(density, 500).toFixed(1);
        })()} kg/m³
      </text>
      <text x="860" y="245" className="text-xs" fill="#1f2937">
        Viscosité: {(() => {
          // Calcul direct de la viscosité pour tous les fluides
          let viscosity = 0.001; // valeur par défaut eau
          
          if (inputData.fluid_type === 'water') {
            viscosity = 0.001 - 0.00005 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'oil') {
            viscosity = 0.05 - 0.002 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'acid') {
            viscosity = 0.002 - 0.0001 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'glycol') {
            viscosity = 0.0161 - 0.0008 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'palm_oil') {
            viscosity = 0.045 - 0.0018 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'gasoline') {
            viscosity = 0.00055 - 0.000015 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'diesel') {
            viscosity = 0.0035 - 0.00012 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'hydraulic_oil') {
            viscosity = 0.046 - 0.0019 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'ethanol') {
            viscosity = 0.0012 - 0.00004 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'seawater') {
            viscosity = 0.00107 - 0.000052 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'methanol') {
            viscosity = 0.00059 - 0.000025 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'glycerol') {
            viscosity = 1.48 - 0.058 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'milk') {
            viscosity = 0.0015 - 0.00006 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'honey') {
            viscosity = 8.5 - 0.25 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'wine') {
            viscosity = 0.0012 - 0.00004 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'bleach') {
            viscosity = 0.0011 - 0.000045 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'yogurt') {
            viscosity = 0.15 - 0.008 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'tomato_sauce') {
            viscosity = 2.5 - 0.12 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'soap_solution') {
            viscosity = 0.0013 - 0.00005 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'fruit_juice') {
            viscosity = 0.0018 - 0.00007 * (inputData.temperature - 20);
          }
          
          return Math.max(viscosity, 0.0001).toFixed(4);
        })()} Pa·s
      </text>
      <text x="860" y="260" className="text-xs" fill="#1f2937">
        P. vapeur: {(() => {
          // Calcul direct de la pression de vapeur pour tous les fluides
          let vaporPressure = 2340; // valeur par défaut eau
          
          if (inputData.fluid_type === 'water') {
            vaporPressure = 2340 + 100 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'oil') {
            vaporPressure = 100 + 20 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'acid') {
            vaporPressure = 3000 + 150 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'glycol') {
            vaporPressure = 10 + 5 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'palm_oil') {
            vaporPressure = 0.001 + 0.0001 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'gasoline') {
            vaporPressure = 13000 + 850 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'diesel') {
            vaporPressure = 300 + 25 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'hydraulic_oil') {
            vaporPressure = 0.1 + 0.02 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'ethanol') {
            vaporPressure = 5870 + 420 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'seawater') {
            vaporPressure = 2280 + 95 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'methanol') {
            vaporPressure = 12800 + 780 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'glycerol') {
            vaporPressure = 0.001 + 0.0002 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'milk') {
            vaporPressure = 2200 + 95 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'honey') {
            vaporPressure = 0.1 + 0.02 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'wine') {
            vaporPressure = 2800 + 120 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'bleach') {
            vaporPressure = 2100 + 90 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'yogurt') {
            vaporPressure = 2150 + 92 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'tomato_sauce') {
            vaporPressure = 1800 + 75 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'soap_solution') {
            vaporPressure = 2250 + 95 * (inputData.temperature - 20);
          } else if (inputData.fluid_type === 'fruit_juice') {
            vaporPressure = 2100 + 88 * (inputData.temperature - 20);
          }
          
          return (Math.max(vaporPressure, 1) / 1000).toFixed(1);
        })()} kPa
      </text>
      <text x="860" y="275" className="text-xs" fill="#1f2937">
        P. atmosphérique: {results.npshd_analysis?.atmospheric_pressure ? 
          (results.npshd_analysis.atmospheric_pressure / 1000).toFixed(1) : '101.3'} kPa
      </text>
      <text x="860" y="290" className="text-xs" fill="#1f2937">
        Altitude: {inputData.altitude || 0}m
      </text>
      <text x="860" y="305" className="text-xs" fill="#1f2937">
        Temp. ambiante: {inputData.ambient_temperature || 25}°C
      </text>
      
      {/* Section Configuration */}
      <rect x="850" y="320" width="320" height="100" fill={isFlooded ? "#e0f2fe" : "#fef2f2"} stroke={aspirationColor} strokeWidth="2" rx="10" />
      <text x="860" y="340" className="text-sm font-bold" fill={aspirationColor}>
        {statusIcon} CONFIGURATION {statusText}
      </text>
      
      <text x="860" y="360" className="text-xs" fill="#1f2937">
        Installation: {inputData.installation_type === 'surface' ? 'Surface' : 'Immergée'}
      </text>
      <text x="860" y="375" className="text-xs" fill="#1f2937">
        Type aspiration: {isFlooded ? 'Gravitaire (charge)' : 'Dépression (lift)'}
      </text>
      <text x="860" y="390" className="text-xs" fill="#1f2937">
        Hauteur: {Math.abs(inputData.suction_height).toFixed(1)}m {isFlooded ? '(sous pompe)' : '(à aspirer)'}
      </text>
      <text x="860" y="405" className="text-xs" fill="#1f2937">
        Avantages: {isFlooded ? 'Amorçage auto, fiabilité' : 'Pompe protégée, maintenance'}
      </text>
      
      {/* Section Hydraulique */}
      <rect x="850" y="430" width="320" height="140" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" rx="10" />
      <text x="860" y="450" className="text-sm font-bold" fill="#1e40af">⚡ HYDRAULIQUE</text>
      
      <text x="860" y="470" className="text-xs" fill="#1f2937">
        Débit nominal: {inputData.flow_rate} m³/h ({((inputData.flow_rate || 0) / 3.6).toFixed(3)} m³/s)
      </text>
      <text x="860" y="485" className="text-xs" fill="#1f2937">
        NPSHd calculé: {results.npshd_analysis?.npshd?.toFixed(2) || 'N/A'} m
      </text>
      <text x="860" y="500" className="text-xs" fill="#1f2937">
        NPSH requis: {inputData.npsh_required} m
      </text>
      <text x="860" y="515" className="text-xs" fill="#1f2937">
        Marge sécurité: {results.npshd_analysis?.npsh_margin?.toFixed(2) || 'N/A'} m
      </text>
      <text x="860" y="530" className="text-xs" fill="#1f2937">
        HMT total: {results.hmt_analysis?.hmt?.toFixed(2) || 'N/A'} m
      </text>
      <text x="860" y="545" className="text-xs" fill="#1f2937">
        Vitesse aspiration: {results.npshd_analysis?.velocity?.toFixed(2) || 'N/A'} m/s
      </text>
      <text x="860" y="560" className="text-xs" fill="#1f2937">
        Régime écoulement: {results.npshd_analysis?.reynolds_number > 4000 ? 'Turbulent' : 
                  results.npshd_analysis?.reynolds_number > 2300 ? 'Transitoire' : 'Laminaire'} 
        (Re={results.npshd_analysis?.reynolds_number?.toFixed(0) || 'N/A'})
      </text>
      
      {/* Section Pertes de charge */}
      <rect x="850" y="580" width="320" height="100" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" rx="10" />
      <text x="860" y="600" className="text-sm font-bold" fill="#92400e">📉 PERTES DE CHARGE</text>
      
      <text x="860" y="620" className="text-xs" fill="#1f2937">
        Pertes aspiration: {results.npshd_analysis?.total_head_loss?.toFixed(2) || 'N/A'} m
      </text>
      <text x="860" y="635" className="text-xs" fill="#1f2937">
        Pertes refoulement: {results.hmt_analysis?.total_head_loss?.toFixed(2) || 'N/A'} m
      </text>
      <text x="860" y="650" className="text-xs" fill="#1f2937">
        Pertes totales: {results.total_head_loss?.toFixed(2) || 'N/A'} m
      </text>
      <text x="860" y="665" className="text-xs" fill="#1f2937">
        Coefficient K total: {((results.total_head_loss || 0) / ((results.npshd_analysis?.velocity || 1)**2 / (2 * 9.81))).toFixed(1)}
      </text>
      
      {/* Section Performance */}
      <rect x="850" y="690" width="320" height="60" fill="#f0fdf4" stroke="#10b981" strokeWidth="2" rx="10" />
      <text x="860" y="710" className="text-sm font-bold" fill="#166534">📈 PERFORMANCE</text>
      
      <text x="860" y="730" className="text-xs" fill="#1f2937">
        Rendement global: {results.overall_efficiency?.toFixed(1) || 'N/A'}% 
        (Pompe: {inputData.pump_efficiency}% × Moteur: {inputData.motor_efficiency}%)
      </text>
      <text x="860" y="745" className="text-xs" fill="#1f2937">
        Puissance: {results.performance_analysis?.hydraulic_power?.toFixed(1) || 'N/A'} kW hydraulique
      </text>
      
      {/* Indicateurs de statut dynamiques */}
      <g transform="translate(1010, 745)">
        <circle 
          cx="0" 
          cy="0" 
          r="18" 
          fill={results.npshd_analysis?.cavitation_risk ? "#ef4444" : "#10b981"}
          stroke="white"
          strokeWidth="4"
          filter="url(#shadow)"
        />
        <text 
          x="0" 
          y="7" 
          textAnchor="middle" 
          className="text-lg font-bold" 
          fill="white"
        >
          {results.npshd_analysis?.cavitation_risk ? "!" : "✓"}
        </text>
        <text 
          x="0" 
          y="40" 
          textAnchor="middle" 
          className="text-sm font-bold" 
          fill={results.npshd_analysis?.cavitation_risk ? "#ef4444" : "#10b981"}
        >
          {results.npshd_analysis?.cavitation_risk ? "CAVITATION" : "SÉCURISÉ"}
        </text>
      </g>
      
      {/* Légende enrichie dynamique */}
      <rect x="20" y="720" width="800" height="60" fill="white" stroke="#d1d5db" strokeWidth="3" rx="10" filter="url(#shadow)" />
      <text x="30" y="740" className="text-sm font-bold" fill="#1f2937">
        LÉGENDE TECHNIQUE - CONFIGURATION {statusText}:
      </text>
      
      <line x1="30" y1="755" x2="50" y2="755" stroke={aspirationColor} strokeWidth="2" markerEnd="url(#arrowRed)" />
      <text x="55" y="760" className="text-xs font-medium" fill={aspirationColor}>
        {isFlooded ? 'Charge gravitaire' : 'Aspiration dépression'}
      </text>
      
      <line x1="200" y1="755" x2="220" y2="755" stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrowBlue)" />
      <text x="225" y="760" className="text-xs font-medium" fill="#3b82f6">
        Sens d'écoulement
      </text>
      
      <rect x="350" y="750" width="18" height="10" fill="url(#waterGradient)" />
      <text x="375" y="760" className="text-xs font-medium" fill="#3b82f6">
        {fluids.find(f => f.id === inputData.fluid_type)?.name || 'Fluide'}
      </text>
      
      <rect x="450" y="750" width="18" height="10" fill="url(#pumpGradient)" />
      <text x="475" y="760" className="text-xs font-medium" fill="#10b981">
        Pompe centrifuge
      </text>
      
      <circle cx="570" cy="755" r="8" fill={results.npshd_analysis?.cavitation_risk ? "#ef4444" : "#10b981"} />
      <text x="585" y="760" className="text-xs font-medium" fill="#6b7280">
        Statut hydraulique
      </text>
      
      <text x="700" y="760" className="text-xs font-medium" fill="#6b7280">
        {currentConfig.description}
      </text>
      
      <text x="30" y="775" className="text-xs" fill="#6b7280">
        ⚙️ {statusText}: {isFlooded ? 'Pompe alimentée par gravité - Fiabilité optimale' : 'Pompe aspire le fluide - Attention NPSHd'}
      </text>
    </svg>
  );
};


// Component pour Tab 3 - Analyse de Performance
const PerformanceAnalysis = ({ fluids, pipeMaterials }) => {
  // Options DN normalisées (diamètres extérieurs réels selon standards)
  const dnOptions = [
    { value: '', label: "Sélectionnez un diamètre" },
    { value: 26.9, label: "DN20 (26.9mm)" },
    { value: 33.7, label: "DN25 (33.7mm)" },
    { value: 42.4, label: "DN32 (42.4mm)" },
    { value: 48.3, label: "DN40 (48.3mm)" },
    { value: 60.3, label: "DN50 (60.3mm)" },
    { value: 76.1, label: "DN65 (76.1mm)" },
    { value: 88.9, label: "DN80 (88.9mm)" },
    { value: 114.3, label: "DN100 (114.3mm)" },
    { value: 139.7, label: "DN125 (139.7mm)" },
    { value: 168.3, label: "DN150 (168.3mm)" },
    { value: 219.1, label: "DN200 (219.1mm)" },
    { value: 273.1, label: "DN250 (273.1mm)" },
    { value: 323.9, label: "DN300 (323.9mm)" },
    { value: 355.6, label: "DN350 (355.6mm)" },
    { value: 406.4, label: "DN400 (406.4mm)" },
    { value: 457.2, label: "DN450 (457.2mm)" },
    { value: 508, label: "DN500 (508mm)" }
  ];

  const [inputData, setInputData] = useState({
    flow_rate: 50,
    hmt: 25,
    pipe_diameter: 114.3,
    fluid_type: 'water',
    pipe_material: 'pvc',
    pump_efficiency: 75,
    motor_efficiency: 90,
    absorbed_power: null,
    hydraulic_power: null,
    starting_method: 'star_delta',
    power_factor: 0.8,
    cable_length: 50,
    cable_material: 'copper',
    cable_section: null,
    voltage: 400
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const powerChartRef = useRef(null);
  const powerChartInstance = useRef(null);

  const handleInputChange = (field, value) => {
    setInputData(prev => ({ ...prev, [field]: value }));
  };

  const calculatePerformance = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/calculate-performance`, inputData);
      setResult(response.data);
      updateChart(response.data);
      updatePowerChart(response.data);
    } catch (error) {
      console.error('Erreur analyse performance:', error);
      alert('Erreur lors de l\'analyse de performance: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const updatePowerChart = (data) => {
    if (!powerChartRef.current) return;

    const ctx = powerChartRef.current.getContext('2d');
    
    if (powerChartInstance.current) {
      powerChartInstance.current.destroy();
    }

    const curves = data.performance_curves;
    const bestPoint = curves.best_operating_point;
    
    powerChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: curves.flow,
        datasets: [
          {
            label: 'Puissance Absorbée (kW)',
            data: curves.power,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 8,
            tension: 0.4,
            fill: false
          },
          {
            label: 'Point de Fonctionnement',
            data: curves.flow.map((f, index) => {
              if (Math.abs(f - bestPoint.flow) < 0.1) {
                return curves.power[index];
              }
              return null;
            }),
            borderColor: '#000000',
            backgroundColor: '#000000',
            borderWidth: 4,
            pointRadius: 8,
            pointHoverRadius: 12,
            showLine: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Débit (m³/h)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Puissance Absorbée (kW)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 12,
                weight: 'bold'
              },
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'Courbe de Puissance Absorbée',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const datasetLabel = context.dataset.label;
                
                if (datasetLabel.includes('Puissance')) {
                  return `Puissance au point de fonctionnement: ${bestPoint.power?.toFixed(2)} kW`;
                } else if (datasetLabel.includes('Point')) {
                  return `Point de fonctionnement saisi: Q=${bestPoint.flow}m³/h, P=${bestPoint.power?.toFixed(2)}kW`;
                }
                return '';
              }
            }
          }
        }
      }
    });
  };

  const updateChart = (data) => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const curves = data.performance_curves;
    const bestPoint = curves.best_operating_point;
    
    // Trouver l'index du point de fonctionnement dans les courbes
    const operatingPointIndex = curves.flow.findIndex(f => Math.abs(f - bestPoint.flow) < 0.1);
    
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: curves.flow,
        datasets: [
          {
            label: 'HMT Pompe (m)',
            data: curves.hmt,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 8,
            tension: 0.4,
            fill: false,
            yAxisID: 'y'
          },
          {
            label: 'Pertes de Charge Réseau (m)',
            data: curves.head_loss,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 8,
            tension: 0.4,
            fill: false,
            yAxisID: 'y'
          },
          {
            label: 'Rendement (%)',
            data: curves.efficiency,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 8,
            tension: 0.4,
            fill: false,
            yAxisID: 'y1'
          },
          {
            label: 'Point de Fonctionnement',
            data: curves.flow.map((f, index) => {
              if (Math.abs(f - bestPoint.flow) < 0.1) {
                return curves.hmt[index];
              }
              return null;
            }),
            borderColor: '#000000',
            backgroundColor: '#000000',
            borderWidth: 4,
            pointRadius: 8,
            pointHoverRadius: 12,
            showLine: false,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Débit (m³/h)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'HMT (m)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Rendement (%)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            min: 0,
            max: 100,
            grid: {
              drawOnChartArea: false,
            },
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 12,
                weight: 'bold'
              },
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'Courbes de Performance Hydraulique Q/H',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const flowValue = curves.flow[context.dataIndex];
                const datasetLabel = context.dataset.label;
                
                if (datasetLabel.includes('HMT')) {
                  return `Point de croisement: Q=${bestPoint.flow}m³/h, H=${bestPoint.hmt}m`;
                } else if (datasetLabel.includes('Pertes')) {
                  return `Point de croisement: Q=${bestPoint.flow}m³/h, H=${bestPoint.hmt}m`;
                } else if (datasetLabel.includes('Rendement')) {
                  return `Rendement au point de fonctionnement: ${bestPoint.efficiency?.toFixed(1)}%`;
                } else if (datasetLabel.includes('Point')) {
                  return `Point de fonctionnement saisi: Q=${bestPoint.flow}m³/h, H=${bestPoint.hmt}m`;
                }
                return '';
              }
            }
          }
        }
      }
    });
  };

  return (
    <div className="space-y-8 font-inter" style={professionalStyles}>
      {/* En-tête professionnel Performance */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 tracking-tight">
              🟨 Analyse Performance Professionelle
            </h2>
            <p className="text-amber-100 text-lg font-medium">
              Courbes de Performance & Calculs Électriques - Optimisation expert
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <div className="text-2xl font-bold">Q/H</div>
              <div className="text-sm opacity-90">Conformité ISO 9906</div>
            </div>
          </div>
        </div>
        
        {/* Indicateurs de conformité Performance */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <div className="font-bold text-lg">ISO</div>
            <div className="text-xs opacity-90">9906</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <div className="font-bold text-lg">API</div>
            <div className="text-xs opacity-90">610</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <div className="font-bold text-lg">Q/H</div>
            <div className="text-xs opacity-90">Curves</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <div className="font-bold text-lg">Analysis</div>
            <div className="text-xs opacity-90">Expert</div>
          </div>
        </div>
      </div>

      {/* Paramètres Hydrauliques */}
      <ProfessionalSection 
        title="Paramètres de Performance Hydraulique" 
        icon="💧"
        className="shadow-xl"
      >
        <ProfessionalGrid cols={3}>
          <div>
            <ProfessionalLabel required>Débit (m³/h)</ProfessionalLabel>
            <ProfessionalInput
              type="number"
              value={inputData.flow_rate}
              onChange={(e) => handleInputChange('flow_rate', parseFloat(e.target.value))}
              required
              placeholder="Ex: 50"
            />
            <div className="text-xs text-blue-600 mt-1 font-medium">
              Point de fonctionnement nominal
            </div>
          </div>

          <div>
            <ProfessionalLabel required>HMT (m)</ProfessionalLabel>
            <ProfessionalInput
              type="number"
              value={inputData.hmt}
              onChange={(e) => handleInputChange('hmt', parseFloat(e.target.value))}
              required
              placeholder="Ex: 25"
            />
            <div className="text-xs text-green-600 mt-1 font-medium">
              Hauteur manométrique totale
            </div>
          </div>

          <div>
            <ProfessionalLabel required>Diamètre de tuyauterie</ProfessionalLabel>
            <ProfessionalSelect
              value={inputData.pipe_diameter}
              onChange={(e) => handleInputChange('pipe_diameter', parseFloat(e.target.value))}
              required
            >
              {dnOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </ProfessionalSelect>
            <div className="text-xs text-purple-600 mt-1 font-medium">
              Diamètre nominal standard
            </div>
          </div>

          <div>
            <ProfessionalLabel required>Type de fluide</ProfessionalLabel>
            <ProfessionalSelect
              value={inputData.fluid_type}
              onChange={(e) => handleInputChange('fluid_type', e.target.value)}
              required
            >
              {fluids.map(fluid => (
                <option key={fluid.id} value={fluid.id}>
                  {fluid.name}
                </option>
              ))}
            </ProfessionalSelect>
            <div className="text-xs text-cyan-600 mt-1 font-medium">
              Propriétés physiques du fluide
            </div>
          </div>

          <div>
            <ProfessionalLabel required>Matériau de tuyauterie</ProfessionalLabel>
            <ProfessionalSelect
              value={inputData.pipe_material}
              onChange={(e) => handleInputChange('pipe_material', e.target.value)}
              required
            >
              {pipeMaterials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.name} (ε = {material.roughness} mm)
                </option>
              ))}
            </ProfessionalSelect>
            <div className="text-xs text-orange-600 mt-1 font-medium">
              Rugosité pour calculs de pertes
            </div>
          </div>
        </ProfessionalGrid>
      </ProfessionalSection>

      {/* Paramètres de Rendement */}
      <ProfessionalSection 
        title="Rendements et Performance" 
        icon="⚙️"
        className="shadow-xl"
      >
        <ProfessionalGrid cols={2}>
          <div>
            <ProfessionalLabel required>Rendement Pompe (%)</ProfessionalLabel>
            <ProfessionalInput
              type="number"
              value={inputData.pump_efficiency}
              onChange={(e) => handleInputChange('pump_efficiency', parseFloat(e.target.value))}
              required
              placeholder="Ex: 75"
              min="40"
              max="95"
            />
            <div className="text-xs text-green-600 mt-1 font-medium">
              Rendement hydraulique de la pompe
            </div>
          </div>

          <div>
            <ProfessionalLabel required>Rendement Moteur (%)</ProfessionalLabel>
            <ProfessionalInput
              type="number"
              value={inputData.motor_efficiency}
              onChange={(e) => handleInputChange('motor_efficiency', parseFloat(e.target.value))}
              required
              placeholder="Ex: 90"
              min="70"
              max="98"
            />
            <div className="text-xs text-blue-600 mt-1 font-medium">
              Rendement électrique du moteur
            </div>
          </div>
        </ProfessionalGrid>
      </ProfessionalSection>

      {/* Paramètres Électriques */}
      <ProfessionalSection 
        title="Configuration Électrique" 
        icon="⚡"
        className="shadow-xl"
      >
        <ProfessionalGrid cols={3}>
          <div>
            <ProfessionalLabel required>Tension (V)</ProfessionalLabel>
            <ProfessionalSelect
              value={inputData.voltage}
              onChange={(e) => handleInputChange('voltage', parseInt(e.target.value))}
              required
            >
              <option value={230}>230V (Monophasé)</option>
              <option value={400}>400V (Triphasé)</option>
              <option value={690}>690V (Industriel)</option>
            </ProfessionalSelect>
            <div className="text-xs text-red-600 mt-1 font-medium">
              Tension d'alimentation
            </div>
          </div>

          <div>
            <ProfessionalLabel required>Facteur de Puissance</ProfessionalLabel>
            <ProfessionalSelect
              value={inputData.power_factor}
              onChange={(e) => handleInputChange('power_factor', parseFloat(e.target.value))}
              required
            >
              <option value={0.7}>0.7 (Faible)</option>
              <option value={0.8}>0.8 (Standard)</option>
              <option value={0.85}>0.85 (Bon)</option>
              <option value={0.9}>0.9 (Excellent)</option>
              <option value={0.95}>0.95 (Optimal)</option>
            </ProfessionalSelect>
            <div className="text-xs text-yellow-600 mt-1 font-medium">
              Cos φ du système
            </div>
          </div>

          <div>
            <ProfessionalLabel required>Méthode de Démarrage</ProfessionalLabel>
            <ProfessionalSelect
              value={inputData.starting_method}
              onChange={(e) => handleInputChange('starting_method', e.target.value)}
              required
            >
              <option value="direct">Démarrage Direct</option>
              <option value="star_delta">Étoile-Triangle</option>
              <option value="soft_start">Démarreur Progressif</option>
              <option value="vfd">Variateur de Fréquence</option>
            </ProfessionalSelect>
            <div className="text-xs text-purple-600 mt-1 font-medium">
              Type de démarreur électrique
            </div>
          </div>

          <div>
            <ProfessionalLabel required>Longueur de Câble (m)</ProfessionalLabel>
            <ProfessionalInput
              type="number"
              value={inputData.cable_length}
              onChange={(e) => handleInputChange('cable_length', parseFloat(e.target.value))}
              required
              placeholder="Ex: 50"
              min="1"
            />
            <div className="text-xs text-indigo-600 mt-1 font-medium">
              Distance entre tableau et moteur
            </div>
          </div>

          <div>
            <ProfessionalLabel required>Matériau de Câble</ProfessionalLabel>
            <ProfessionalSelect
              value={inputData.cable_material}
              onChange={(e) => handleInputChange('cable_material', e.target.value)}
              required
            >
              <option value="copper">Cuivre (Cu)</option>
              <option value="aluminum">Aluminium (Al)</option>
            </ProfessionalSelect>
            <div className="text-xs text-gray-600 mt-1 font-medium">
              Conducteur électrique
            </div>
          </div>
        </ProfessionalGrid>
      </ProfessionalSection>

      {/* Bouton de Calcul */}
      <div className="flex justify-center">
        <button
          onClick={calculatePerformance}
          disabled={loading}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 
                     disabled:opacity-50 text-white font-bold py-4 px-12 rounded-xl shadow-lg 
                     transform transition-all duration-200 hover:scale-105 hover:shadow-xl
                     disabled:hover:scale-100 disabled:hover:shadow-lg
                     text-lg tracking-wide min-w-[200px]"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Analyse en cours...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span className="mr-3">🟨</span>
              Analyser Performance
            </div>
          )}
        </button>
      </div>
      
      {/* Résultats */}
      {result && (
        <>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Résultats Analyse de Performance</h3>
            
            {result.warnings && result.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Avertissements</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {result.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2">💡 Recommandations</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {result.recommendations.map((recommendation, index) => (
                    <li key={index}>• {recommendation}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 border-b pb-2">Données Hydrauliques</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Vitesse:</span>
                    <span className="font-medium">{result.velocity?.toFixed(2)} m/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nombre de Reynolds:</span>
                    <span className="font-medium">{result.reynolds_number?.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Régime d'écoulement:</span>
                    <span className="font-medium">{result.reynolds_number > 4000 ? 'Turbulent' : result.reynolds_number > 2300 ? 'Transitoire' : 'Laminaire'}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 border-b pb-2">Rendements</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Rendement pompe:</span>
                    <span className="font-medium">{result.pump_efficiency?.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rendement moteur:</span>
                    <span className="font-medium">{result.motor_efficiency?.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Rendement global:</span>
                    <span className="font-bold">{result.overall_efficiency?.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Affichage des alertes */}
            {result.alerts && result.alerts.length > 0 && (
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-800 mb-2">🔔 Alertes Techniques</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  {result.alerts.map((alert, index) => (
                    <li key={index}>• {alert}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 border-b pb-2">Calculs Électriques</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Courant nominal:</span>
                    <span className="font-medium">{result.nominal_current?.toFixed(1)} A</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Courant démarrage:</span>
                    <span className="font-medium">{result.starting_current?.toFixed(1)} A</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Section de câble:</span>
                    <span className="font-medium">{result.recommended_cable_section?.toFixed(1)} mm²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Méthode démarrage:</span>
                    <span className="font-medium">{result.electrical_data?.starting_method === 'star_delta' ? 'Étoile-Triangle' : 'Direct'}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 border-b pb-2">Puissances</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Puissance hydraulique:</span>
                    <span className="font-medium">{result.power_calculations?.hydraulic_power?.toFixed(2)} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Puissance absorbée:</span>
                    <span className="font-medium">{result.power_calculations?.absorbed_power?.toFixed(2)} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tension:</span>
                    <span className="font-medium">{result.electrical_data?.voltage} V</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Facteur de puissance:</span>
                    <span className="font-medium">{result.electrical_data?.power_factor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Meilleur point de fonctionnement */}
          {result.performance_curves && result.performance_curves.best_operating_point && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium text-gray-700 mb-3">🎯 Point de Fonctionnement (Valeurs Saisies)</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-blue-800">{inputData.flow_rate}</div>
                    <div className="text-blue-600">Débit (m³/h)</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-800">{inputData.hmt}</div>
                    <div className="text-blue-600">HMT (m)</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-800">{inputData.pump_efficiency}</div>
                    <div className="text-blue-600">Rendement (%)</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-800">{result.performance_curves.best_operating_point.power?.toFixed(2)}</div>
                    <div className="text-blue-600">Puissance (kW)</div>
                  </div>
                </div>
                <div className="mt-3 text-center text-xs text-blue-600">
                  Calculé avec formule P2 = ((Q × HMT) / (η × 367)) × 100 et pertes Darcy-Weisbach
                </div>
              </div>
            </div>
          )}
          
          {/* Graphiques des courbes de performance */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Courbes de Performance Hydraulique</h3>
            <canvas ref={chartRef} className="w-full h-96"></canvas>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Courbe de Puissance Absorbée</h3>
            <canvas ref={powerChartRef} className="w-full h-64"></canvas>
          </div>
        </>
      )}
    </div>
  );
};

// Composant principal
function App() {
  const [activeTab, setActiveTab] = useState('npshd');
  const [fluids, setFluids] = useState([]);
  const [pipeMaterials, setPipeMaterials] = useState([]);
  const [fittings, setFittings] = useState([]);
  const [history, setHistory] = useState([]);

  // États pour l'onglet Dessin ULTRA-INTELLIGENT
  const [drawingData, setDrawingData] = useState({
    installation_type: 'surface_aspiration',
    pump_count: 1,
    pumps_in_service: 1,
    pump_configuration: 'parallel',
    pump_power: 7.5,
    flow_rate: 50,
    total_head: 30,
    suction_diameter: 100,
    discharge_diameter: 80,
    
    // Paramètres avancés auto-calculés
    suction_height: 3,
    discharge_height: 25,
    pipe_material: 'steel',
    fluid_type: 'water',
    temperature: 20,
    operating_pressure: 6,
    
    // Affichage conditionnel INTELLIGENT
    show_suction_fields: true,
    show_discharge_fields: true,
    
    // Distances techniques
    dimensions: {
      suction_length: 20,
      discharge_length: 50,
      pump_spacing: 1.5,
      valve_spacing: 2.0,
      manifold_length: 3.0,
      control_panel_distance: 5.0
    },
    
    // CHAMPS SPÉCIFIQUES FORAGE
    forage_specific: {
      reservoir_height: 30,      // Hauteur du réservoir/château d'eau (m)
      dynamic_level: 15,         // Niveau dynamique (m)
      discharge_length: 100,     // Longueur refoulement (m)
      residual_pressure: 2       // Pression résiduelle (bar)
    },
    
    // Accessoires sélectionnables individuellement
    accessories: {
      // Obligatoires selon normes
      pressure_gauge_suction: true,
      pressure_gauge_discharge: true,
      isolation_valve_suction: true,
      isolation_valve_discharge: true,
      check_valve: true,
      
      // Optionnels mais recommandés
      flow_meter: false,
      strainer: true,
      flexible_coupling: true,
      expansion_joint: false,
      pressure_sensor: false,
      level_sensor: false,
      
      // Equipements électriques
      control_panel: true,
      motor_protection: true,
      frequency_converter: false,
      
      // Spécialisés
      manifold: false,
      air_release_valve: false,
      drain_valve: true,
      pressure_reducing_valve: false,
      safety_valve: false
    },
    
    // Paramètres 3D et affichage
    view_mode: '2d',
    show_dimensions: true,
    show_labels: true,
    show_flow_arrows: true,
    show_elevations: true,
    
    // Spécifications techniques
    specifications: {
      voltage: 400,
      frequency: 50,
      protection_class: 'IP65',
      insulation_class: 'F',
      bearing_type: 'ball',
      coupling_type: 'flexible',
      base_type: 'concrete'
    }
  });

  const canvasRef = useRef(null);

  // Fonctions de gestion des événements ULTRA-INTELLIGENTES
  const handleDrawingInputChange = (name, value) => {
    setDrawingData(prev => {
      let newData = { ...prev, [name]: value };
      
      // LOGIQUE ULTRA-INTELLIGENTE : Communication automatique entre champs
      if (name === 'installation_type') {
        newData = applyInstallationTypeLogic(newData, value);
        
        // AJUSTE le nombre de pompes selon les nouvelles possibilités
        switch(value) {
          case 'forage':
            // Forage: toujours 1 pompe uniquement
            newData.pump_count = 1;
            newData.pumps_in_service = 1;
            break;
          case 'incendie':
            // Incendie: 1 à 3 pompes, gardons le choix existant si valide
            newData.pump_count = Math.min(Math.max(prev.pump_count, 1), 3);
            newData.pumps_in_service = Math.min(prev.pumps_in_service, newData.pump_count);
            break;
          case 'surpresseur':
            // Surpresseur: 1 à 4 pompes, gardons le choix existant si valide
            newData.pump_count = Math.min(Math.max(prev.pump_count, 1), 4);
            newData.pumps_in_service = Math.min(prev.pumps_in_service, newData.pump_count);
            break;
          case 'submersible':
            // Pompe de relevage: 1 à 3 pompes
            newData.pump_count = Math.min(Math.max(prev.pump_count, 1), 3);
            newData.pumps_in_service = Math.min(prev.pumps_in_service, newData.pump_count);
            break;
          default:
            // Surface aspiration - garder le choix existant mais max 4
            newData.pump_count = Math.min(prev.pump_count, 4);
            newData.pumps_in_service = Math.min(prev.pumps_in_service, newData.pump_count);
        }
      }
      
      if (name === 'pump_count') {
        newData = applyPumpCountLogic(newData, value);
      }
      
      if (name === 'pump_configuration') {
        newData = applyPumpConfigurationLogic(newData, value);
      }
      
      if (name === 'flow_rate' || name === 'total_head') {
        newData = applyHydraulicLogic(newData);
      }
      
      // Auto-calcul des accessoires selon configuration
      newData.accessories = calculateRequiredAccessories(newData);
      
      return newData;
    });
  };

  // LOGIQUE D'EXPERT : Type d'installation CORRIGÉE AVEC CONTRAINTES
  const applyInstallationTypeLogic = (data, installationType) => {
    let newData = { ...data, installation_type: installationType };
    
    switch(installationType) {
      case 'surface_aspiration':
        // Installation standard avec aspiration 
        newData.suction_height = 3;
        newData.discharge_height = 25;
        newData.operating_pressure = 6;
        newData.show_suction_fields = true;
        newData.show_discharge_fields = true;
        newData.pump_count = Math.min(data.pump_count, 4); // Max 4 pompes
        newData.pumps_in_service = Math.min(data.pumps_in_service, newData.pump_count);
        newData.accessories = { ...newData.accessories, manifold: false, strainer: true };
        break;
        
      case 'surface_charge':
        // Installation en charge (réservoir surélevé)
        newData.suction_height = -5; // En charge
        newData.discharge_height = 25;
        newData.operating_pressure = 8;
        newData.show_suction_fields = true;
        newData.show_discharge_fields = true;
        newData.pump_count = Math.min(data.pump_count, 3); // Max 3 pompes
        newData.pumps_in_service = Math.min(data.pumps_in_service, newData.pump_count);
        newData.accessories = { ...newData.accessories, manifold: false, strainer: false };
        break;
        
      case 'submersible':
        // Pompe de relevage dans bâche/fosse
        newData.suction_height = -15;
        newData.discharge_height = 50;
        newData.operating_pressure = 10;
        newData.show_suction_fields = false; // MASQUER aspiration (pompe dans bâche)
        newData.show_discharge_fields = true;
        newData.pump_count = Math.min(Math.max(data.pump_count, 1), 3); // 1-3 pompes
        newData.pumps_in_service = Math.min(data.pumps_in_service, newData.pump_count);
        newData.pump_configuration = 'parallel'; // Toujours en parallèle
        newData.accessories = { ...newData.accessories, manifold: true, strainer: false };
        break;
        
      case 'forage':
        // Pompe de forage - UNE SEULE POMPE (contrainte technique)
        newData.suction_height = -30;
        newData.discharge_height = 60;
        newData.operating_pressure = 12;
        newData.show_suction_fields = false; // MASQUER aspiration (pompe dans forage)
        newData.show_discharge_fields = true;
        newData.pump_count = 1; // CONTRAINTE: Une seule pompe de forage
        newData.pumps_in_service = 1;
        newData.pump_configuration = 'single'; // Configuration unique
        newData.accessories = { ...newData.accessories, manifold: false, flow_meter: true };
        break;
        
      case 'surpresseur':
        // Groupe surpresseur - 4 POMPES (standard professionnel)
        newData.suction_height = 2;
        newData.discharge_height = 15;
        newData.operating_pressure = 8;
        newData.show_suction_fields = true;
        newData.show_discharge_fields = true;
        newData.pump_count = 4; // CONTRAINTE: 4 pompes standard
        newData.pumps_in_service = 3; // 3 en service, 1 en secours
        newData.pump_configuration = 'parallel';
        newData.accessories = { ...newData.accessories, pressure_sensor: true, expansion_joint: true };
        break;
        
      case 'incendie':
        // Pompage incendie - 3 POMPES minimum (réglementation)
        newData.suction_height = 0;
        newData.discharge_height = 40;
        newData.operating_pressure = 16;
        newData.show_suction_fields = true;
        newData.show_discharge_fields = true;
        newData.pump_count = 3; // CONTRAINTE: 3 pompes réglementaires
        newData.pumps_in_service = 2; // 2 en service, 1 en secours
        newData.pump_configuration = 'parallel'; // Toujours en parallèle
        newData.accessories = { ...newData.accessories, pressure_sensor: true, flow_meter: true };
        break;
    }
    
    return newData;
  };

  // LOGIQUE D'EXPERT : Nombre de pompes
  const applyPumpCountLogic = (data, pumpCount) => {
    let newData = { ...data, pump_count: pumpCount };
    
    // CORRECTION CRITIQUE : Ajuster automatiquement les pompes en service
    // Si le nombre de pompes diminue, ajuster pumps_in_service
    if (pumpCount < data.pumps_in_service) {
      newData.pumps_in_service = pumpCount;
    }
    // Si c'est une pompe unique, pompes en service = 1
    if (pumpCount === 1) {
      newData.pumps_in_service = 1;
    }
    
    // Ajuster les dimensions selon nombre de pompes
    newData.dimensions = {
      ...newData.dimensions,
      pump_spacing: pumpCount > 2 ? 2.0 : 1.5,
      manifold_length: Math.max(3.0, pumpCount * 1.0)
    };
    
    // Ajuster diamètres selon nombre de pompes
    if (pumpCount >= 4) {
      newData.suction_diameter = Math.max(newData.suction_diameter, 150);
      newData.discharge_diameter = Math.max(newData.discharge_diameter, 100);
    }
    
    // Force configuration intelligente
    if (pumpCount > 4) {
      newData.pump_configuration = 'parallel'; // Obligatoire au-dessus de 4 pompes
    }
    
    return newData;
  };

  // LOGIQUE D'EXPERT : Configuration des pompes
  const applyPumpConfigurationLogic = (data, configuration) => {
    let newData = { ...data, pump_configuration: configuration };
    
    switch(configuration) {
      case 'parallel':
        // Débit total réparti, HMT identique
        newData.accessories = {
          ...newData.accessories,
          manifold: data.pump_count > 2,
          isolation_valve: true
        };
        break;
        
      case 'series':
        // HMT additionné, débit identique
        newData.total_head = data.total_head * data.pump_count;
        newData.accessories = {
          ...newData.accessories,
          check_valve: true,
          pressure_gauge: true
        };
        break;
        
      case 'standby':
        // Une seule active, autres en secours
        newData.accessories = {
          ...newData.accessories,
          pressure_sensor: true,
          control_panel: true
        };
        break;
    }
    
    return newData;
  };

  // LOGIQUE D'EXPERT : Paramètres hydrauliques
  const applyHydraulicLogic = (data) => {
    let newData = { ...data };
    
    // Calcul automatique puissance pompe
    const hydraulicPower = (data.flow_rate * data.total_head * 1000 * 9.81) / 3600 / 1000;
    newData.pump_power = hydraulicPower / 0.75; // Rendement estimé 75%
    
    // Calcul diamètres optimaux
    const velocity = 2.0; // m/s cible
    const optimalDiameter = Math.sqrt((data.flow_rate / 3600) / (Math.PI/4 * velocity)) * 1000;
    
    // Suggestion diamètres standards
    const standardDiameters = [32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300];
    newData.suction_diameter = findNearestDiameter(optimalDiameter * 1.2, standardDiameters);
    newData.discharge_diameter = findNearestDiameter(optimalDiameter, standardDiameters);
    
    return newData;
  };

  // Calcul intelligent des accessoires obligatoires
  const calculateRequiredAccessories = (data) => {
    const accessories = { ...data.accessories };
    
    // Accessoires OBLIGATOIRES selon normes
    accessories.pressure_gauge = true; // Toujours obligatoire
    accessories.isolation_valve = data.pump_count > 1; // Multi-pompes
    accessories.check_valve = data.pump_configuration === 'parallel';
    accessories.control_panel = data.pump_count > 1 || data.installation_type === 'surpresseur';
    accessories.manifold = data.pump_count > 2 || data.installation_type === 'forage';
    
    // Accessoires selon puissance
    if (data.pump_power > 15) {
      accessories.expansion_joint = true;
      accessories.pressure_reducing_valve = true;
    }
    
    // Accessoires selon installation
    if (data.installation_type === 'incendie') {
      accessories.flow_meter = true;
      accessories.pressure_sensor = true;
    }
    
    if (data.suction_height > 0) {
      accessories.strainer = true; // Aspiration
      accessories.air_release_valve = true;
    }
    
    return accessories;
  };

  // Fonction utilitaire : Trouver diamètre standard le plus proche
  const findNearestDiameter = (targetDiameter, standards) => {
    return standards.reduce((prev, curr) => 
      Math.abs(curr - targetDiameter) < Math.abs(prev - targetDiameter) ? curr : prev
    );
  };

  // FONCTIONS D'EXPORT PROFESSIONNELLES
  const exportToPDF = async () => {
    if (!canvasRef.current) return;
    
    try {
      const canvas = canvasRef.current;
      
      // Importer html2pdf
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Créer un conteneur pour l'export
      const exportContainer = document.createElement('div');
      exportContainer.style.width = '210mm';
      exportContainer.style.padding = '20mm';
      exportContainer.style.background = 'white';
      
      // Ajouter en-tête professionnel
      const header = document.createElement('div');
      header.innerHTML = `
        <h1 style="text-align: center; color: #1f2937; margin-bottom: 10px;">SCHÉMA HYDRAULIQUE TECHNIQUE</h1>
        <div style="text-align: center; color: #6b7280; margin-bottom: 20px;">
          ECO-PUMP AFRIK - Expert Hydraulicien IA v3.0<br/>
          ${new Date().toLocaleDateString('fr-FR')} - ${drawingData.installation_type.replace('_', ' ').toUpperCase()}
        </div>
        <hr style="border: 1px solid #e5e7eb; margin-bottom: 20px;">
      `;
      exportContainer.appendChild(header);
      
      // Ajouter le canvas
      const canvasImg = document.createElement('img');
      canvasImg.src = canvas.toDataURL();
      canvasImg.style.width = '100%';
      canvasImg.style.marginBottom = '20px';
      exportContainer.appendChild(canvasImg);
      
      // Ajouter spécifications techniques
      const specs = document.createElement('div');
      specs.innerHTML = `
        <h3 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">SPÉCIFICATIONS TECHNIQUES</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
          <div>
            <strong>Installation:</strong> ${drawingData.installation_type.replace('_', ' ')}<br/>
            <strong>Pompes:</strong> ${drawingData.pump_count} x ${drawingData.pump_configuration}<br/>
            <strong>Puissance:</strong> ${drawingData.pump_power.toFixed(1)} kW<br/>
            <strong>Débit:</strong> ${drawingData.flow_rate} m³/h<br/>
            <strong>HMT:</strong> ${drawingData.total_head} m<br/>
          </div>
          <div>
            <strong>DN Aspiration:</strong> ${drawingData.suction_diameter}mm<br/>
            <strong>DN Refoulement:</strong> ${drawingData.discharge_diameter}mm<br/>
            <strong>Pression service:</strong> ${drawingData.operating_pressure} bar<br/>
            <strong>Matériau:</strong> ${drawingData.pipe_material}<br/>
            <strong>Température:</strong> ${drawingData.temperature}°C<br/>
          </div>
        </div>
        <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-left: 4px solid #3b82f6;">
          <strong>Conformité:</strong> ISO 14692, NF EN 806, DTU 60.11 | 
          <strong>Protection:</strong> ${drawingData.specifications.protection_class} | 
          <strong>Tension:</strong> ${drawingData.specifications.voltage}V
        </div>
      `;
      exportContainer.appendChild(specs);
      
      // Générer le PDF
      const opt = {
        margin: 10,
        filename: `schema_hydraulique_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      
      await html2pdf().set(opt).from(exportContainer).save();
      
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
    }
  };

  const exportToDWG = async () => {
    try {
      // Simuler export DWG (format CAD)
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Conversion en SVG pour compatibilité CAD
      const svgData = convertCanvasToSVG(canvas);
      
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `schema_hydraulique_${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erreur export DWG:', error);
      alert('Export DWG disponible prochainement. SVG téléchargé en substitution.');
    }
  };

  // Conversion Canvas vers SVG pour export CAD
  const convertCanvasToSVG = (canvas) => {
    const { width, height } = canvas;
    const imgData = canvas.toDataURL();
    
    return `
      <?xml version="1.0" encoding="UTF-8"?>
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .technical-text { font-family: Arial, sans-serif; font-size: 12px; fill: #1f2937; }
            .dimension-line { stroke: #6b7280; stroke-width: 1; stroke-dasharray: 3,3; }
            .pipe { stroke: #1f2937; stroke-width: 3; fill: none; }
          </style>
        </defs>
        <image x="0" y="0" width="${width}" height="${height}" href="${imgData}"/>
        <text x="20" y="30" class="technical-text">ECO-PUMP AFRIK - Schéma Technique</text>
        <text x="20" y="50" class="technical-text">Généré le: ${new Date().toLocaleDateString('fr-FR')}</text>
      </svg>
    `;
  };

  // NOUVELLE FONCTION DE GÉNÉRATION DE SCHÉMAS PROFESSIONNELS
  const generateProfessionalDrawing = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configuration ultra-professionnelle
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.textBaseline = 'middle';
    
    // Générer le schéma selon le type
    switch(drawingData.installation_type) {
      case 'surface_aspiration':
        drawProfessionalSurfaceAspiration(ctx, canvas);
        break;
      case 'surface_charge':
        drawProfessionalSurfaceCharge(ctx, canvas);
        break;
      case 'submersible':
        drawProfessionalSubmersible(ctx, canvas);
        break;
      case 'forage':
        drawProfessionalForage(ctx, canvas);
        break;
      case 'surpresseur':
        drawProfessionalSurpresseur(ctx, canvas);
        break;
      case 'incendie':
        drawProfessionalIncendie(ctx, canvas);
        break;
    }
    
    // Ajouter cartouche technique
    drawTechnicalCartouche(ctx, canvas);
  };

  // SCHÉMA SURFACE ASPIRATION EN PARALLÈLE - COLLECTEUR 90° PID TECHNIQUE
  const drawProfessionalSurfaceAspiration = (ctx, canvas) => {
    // Nettoyage complet
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // 1. BÂCHE D'ASPIRATION (gauche)
    const tankX = 100;
    const tankY = centerY - 60;
    const tankW = 120;
    const tankH = 120;
    
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#E3F2FD';
    ctx.fillRect(tankX, tankY, tankW, tankH);
    ctx.strokeRect(tankX, tankY, tankW, tankH);
    
    // Niveau d'eau
    ctx.fillStyle = '#1976D2';
    ctx.fillRect(tankX + 5, tankY + tankH * 0.3, tankW - 10, tankH * 0.6);
    
    // Label bâche
    ctx.fillStyle = '#1976D2';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BÂCHE', tankX + tankW/2, tankY - 10);
    ctx.fillText('ASPIRATION', tankX + tankW/2, tankY - 25);
    
    // 2. COLLECTEUR D'ASPIRATION VERTICAL (À 90°)
    const collecteurAspirationX = centerX - 150;
    const collecteurStartY = centerY - 80;
    const collecteurEndY = centerY + 80;
    
    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(collecteurAspirationX, collecteurStartY);
    ctx.lineTo(collecteurAspirationX, collecteurEndY);
    ctx.stroke();
    
    // Label collecteur aspiration
    ctx.fillStyle = '#E65100';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(collecteurAspirationX - 20, centerY);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('COLLECTEUR ASPIRATION', 0, 0);
    ctx.restore();
    
    // Tuyauterie de la bâche vers collecteur
    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(tankX + tankW, centerY);
    ctx.lineTo(collecteurAspirationX, centerY);
    ctx.stroke();
    
    // 3. POMPES EN PARALLÈLE avec piquages individuels sur collecteur
    const pumpCount = drawingData.pump_count;
    const pumpSpacing = 80;
    const startY = collecteurStartY + 20;
    
    for (let i = 0; i < pumpCount; i++) {
      const pumpX = centerX - 50;
      const pumpY = startY + (i * pumpSpacing);
      const isStandby = i >= drawingData.pumps_in_service;
      
      // PIQUAGE INDIVIDUEL depuis collecteur vers pompe (90°)
      const piquageY = collecteurStartY + 30 + (i * (collecteurEndY - collecteurStartY - 60) / (pumpCount - 1 || 1));
      
      ctx.strokeStyle = '#FF9800';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(collecteurAspirationX, piquageY);
      ctx.lineTo(pumpX - 25, piquageY);
      ctx.stroke();
      
      // VANNE ISOLEMENT ASPIRATION sur chaque piquage
      if (drawingData.accessories.isolation_valve_suction) {
        const valveX = collecteurAspirationX + 30;
        // Losange PID
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(valveX, piquageY - 6);
        ctx.lineTo(valveX + 6, piquageY);
        ctx.lineTo(valveX, piquageY + 6);
        ctx.lineTo(valveX - 6, piquageY);
        ctx.closePath();
        ctx.fillStyle = '#ECF0F1';
        ctx.fill();
        ctx.stroke();
        
        // Tag
        ctx.fillStyle = '#2C3E50';
        ctx.font = '7px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`VA${i+1}`, valveX, piquageY + 18);
      }
      
      // CRÉPINE/FILTRE sur aspiration si sélectionné
      if (drawingData.accessories.strainer) {
        const strainerX = collecteurAspirationX + 60;
        ctx.strokeStyle = '#37474F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(strainerX - 8, piquageY - 6, 16, 12);
        ctx.stroke();
        
        // Barreaux
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.moveTo(strainerX - 6 + j * 4, piquageY - 6);
          ctx.lineTo(strainerX - 6 + j * 4, piquageY + 6);
          ctx.stroke();
        }
        
        ctx.fillStyle = '#37474F';
        ctx.font = '6px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('FIL', strainerX, piquageY + 18);
      }
      
      // POMPE (symbole PID)
      ctx.fillStyle = isStandby ? '#FFE0B2' : '#E3F2FD';
      ctx.strokeStyle = isStandby ? '#FF9800' : '#1976D2';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pumpX, piquageY, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Roue pompe
      ctx.strokeStyle = '#424242';
      ctx.lineWidth = 2;
      for (let j = 0; j < 6; j++) {
        const angle = (j * Math.PI * 2) / 6;
        ctx.beginPath();
        ctx.moveTo(pumpX, piquageY);
        ctx.lineTo(pumpX + Math.cos(angle) * 15, piquageY + Math.sin(angle) * 15);
        ctx.stroke();
      }
      
      // Label pompe
      ctx.fillStyle = isStandby ? '#F57C00' : '#1565C0';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`P${i+1}`, pumpX - 50, piquageY);
      ctx.font = '8px Arial';
      ctx.fillText(isStandby ? 'SECOURS' : 'SERVICE', pumpX - 50, piquageY + 12);
      
      // CLAPET ANTI-RETOUR REFOULEMENT (symbole PID)
      if (drawingData.accessories.check_valve) {
        const valveX = pumpX + 35;
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(valveX - 8, piquageY - 5);
        ctx.lineTo(valveX + 8, piquageY);
        ctx.lineTo(valveX - 8, piquageY + 5);
        ctx.closePath();
        ctx.fillStyle = '#C8E6C9';
        ctx.fill();
        ctx.stroke();
        
        // Tag
        ctx.fillStyle = '#2E7D32';
        ctx.font = '7px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`NR${i+1}`, valveX, piquageY + 18);
      }
      
      // VANNE ISOLEMENT REFOULEMENT
      if (drawingData.accessories.isolation_valve_discharge) {
        const valveX = pumpX + 60;
        // Losange PID
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(valveX, piquageY - 8);
        ctx.lineTo(valveX + 8, piquageY);
        ctx.lineTo(valveX, piquageY + 8);
        ctx.lineTo(valveX - 8, piquageY);
        ctx.closePath();
        ctx.fillStyle = '#ECF0F1';
        ctx.fill();
        ctx.stroke();
        
        // Tag
        ctx.fillStyle = '#2C3E50';
        ctx.font = '7px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`VR${i+1}`, valveX, piquageY + 20);
      }
      
      // TUYAU REFOULEMENT INDIVIDUEL vers collecteur
      const refoulementX = pumpX + 80;
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pumpX + 25, piquageY);
      ctx.lineTo(refoulementX, piquageY);
      ctx.stroke();
    }
    
    // 4. COLLECTEUR DE REFOULEMENT VERTICAL (parallèle)
    const collecteurRefoulementX = centerX + 50;
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(collecteurRefoulementX, collecteurStartY);
    ctx.lineTo(collecteurRefoulementX, collecteurEndY);
    ctx.stroke();
    
    // Connexions des pompes au collecteur refoulement
    for (let i = 0; i < pumpCount; i++) {
      const piquageY = collecteurStartY + 30 + (i * (collecteurEndY - collecteurStartY - 60) / (pumpCount - 1 || 1));
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(centerX - 50 + 80, piquageY);
      ctx.lineTo(collecteurRefoulementX, piquageY);
      ctx.stroke();
    }
    
    // Label collecteur refoulement
    ctx.fillStyle = '#2E7D32';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(collecteurRefoulementX + 20, centerY);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('COLLECTEUR REFOULEMENT', 0, 0);
    ctx.restore();
    ctx.font = '8px Arial';
    ctx.fillText(`DN${drawingData.discharge_diameter}`, collecteurRefoulementX + 30, centerY);
    
    // 5. TUYAUTERIE VERS STOCKAGE
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(collecteurRefoulementX, centerY);
    ctx.lineTo(centerX + 200, centerY);
    ctx.stroke();
    
    // Flèche débit total
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX + 150, centerY - 5);
    ctx.lineTo(centerX + 165, centerY);
    ctx.lineTo(centerX + 150, centerY + 5);
    ctx.stroke();
    
    // Débit total affiché
    ctx.fillStyle = '#2E7D32';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    const totalFlow = drawingData.flow_rate * drawingData.pumps_in_service;
    ctx.fillText(`${totalFlow}m³/h`, centerX + 130, centerY - 10);
    
    // 6. RÉSERVOIR DE STOCKAGE
    const storageX = centerX + 220;
    const storageY = centerY - 60;
    const storageW = 100;
    const storageH = 120;
    
    ctx.strokeStyle = '#9C27B0';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#F3E5F5';
    ctx.fillRect(storageX, storageY, storageW, storageH);
    ctx.strokeRect(storageX, storageY, storageW, storageH);
    
    // Niveau stockage
    ctx.fillStyle = '#8E24AA';
    ctx.fillRect(storageX + 5, storageY + storageH * 0.2, storageW - 10, storageH * 0.7);
    
    // Raccordement
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(centerX + 200, centerY);
    ctx.lineTo(storageX, centerY);
    ctx.lineTo(storageX, storageY + storageH - 20);
    ctx.stroke();
    
    // Label stockage
    ctx.fillStyle = '#7B1FA2';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('STOCKAGE', storageX + storageW/2, storageY - 10);
    
    // 7. INSTRUMENTATIONS
    if (drawingData.accessories.pressure_gauge_discharge) {
      const gaugeX = centerX + 100;
      const gaugeY = centerY - 30;
      
      // Manomètre PID
      ctx.beginPath();
      ctx.arc(gaugeX, gaugeY, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#2C3E50';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Aiguille
      ctx.strokeStyle = '#E74C3C';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gaugeX, gaugeY);
      ctx.lineTo(gaugeX + 6, gaugeY - 6);
      ctx.stroke();
      
      // Raccordement
      ctx.strokeStyle = '#7F8C8D';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gaugeX, gaugeY + 12);
      ctx.lineTo(gaugeX, centerY);
      ctx.stroke();
      
      // Tag avec pression
      ctx.fillStyle = '#2C3E50';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PI-001', gaugeX, gaugeY + 25);
      ctx.fillText(`${drawingData.operating_pressure}bar`, gaugeX, gaugeY + 35);
    }
    
    // 8. CARTOUCHE TECHNIQUE
    drawDynamicTechnicalCartouche(ctx, canvas, 'SURFACE PARALLÈLE');
  };

  // FONCTIONS DE DESSIN D'ÉQUIPEMENTS PROFESSIONNELS
  
  // Pompe professionnelle avec statut
  const drawProfessionalPump = (ctx, x, y, label, status = 'service') => {
    // Corps de pompe
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, 2 * Math.PI);
    ctx.fillStyle = status === 'standby' ? '#fff3e0' : '#e3f2fd';
    ctx.fill();
    ctx.strokeStyle = status === 'standby' ? '#ff9800' : '#1976d2';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Volute
    ctx.beginPath();
    ctx.arc(x + 15, y, 15, Math.PI, 0);
    ctx.stroke();
    
    // Flèche de rotation
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 10);
    ctx.arc(x, y, 15, Math.PI * 1.25, Math.PI * 1.75);
    ctx.moveTo(x - 15, y - 5);
    ctx.lineTo(x - 20, y - 10);
    ctx.lineTo(x - 15, y - 15);
    ctx.stroke();
    
    // Label avec statut
    ctx.fillStyle = status === 'standby' ? '#f57f17' : '#1565c0';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - 45);
    ctx.font = '10px Arial';
    ctx.fillText(status.toUpperCase(), x, y - 32);
    
    // Connexions
    drawPumpConnection(ctx, x - 30, y, 'suction');
    drawPumpConnection(ctx, x + 30, y, 'discharge');
  };

  // Réservoir professionnel
  const drawProfessionalTank = (ctx, x, y, width, height, label, fillColor = '#e3f2fd') => {
    // Corps du réservoir
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    
    // Niveau de liquide
    ctx.fillStyle = fillColor;
    ctx.fillRect(x + 5, y + height * 0.25, width - 10, height * 0.65);
    
    // Jauges de niveau
    for (let i = 1; i <= 4; i++) {
      const gaugeY = y + (height * i / 5);
      ctx.strokeStyle = '#757575';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 10, gaugeY);
      ctx.lineTo(x + 10, gaugeY);
      ctx.stroke();
    }
    
    // Label professionnel
    ctx.fillStyle = '#1565c0';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + width/2, y - 20);
    
    // Capacité (exemple)
    ctx.font = '10px Arial';
    ctx.fillStyle = '#757575';
    ctx.fillText(`${Math.round(width * height / 100)}L`, x + width/2, y - 5);
  };

  // Tuyauterie professionnelle avec indication de fluide
  const drawProfessionalPipe = (ctx, x1, y1, x2, y2, diameter, type = 'general') => {
    const colors = {
      aspiration: '#4caf50',
      refoulement: '#2196f3',
      general: '#424242'
    };
    
    ctx.strokeStyle = colors[type] || colors.general;
    ctx.lineWidth = Math.max(3, diameter / 25);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Flèche de direction pour le refoulement
    if (type === 'refoulement' && drawingData.show_flow_arrows) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      
      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(angle);
      
      ctx.fillStyle = colors[type];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-10, -5);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
    
    // Indication diamètre
    if (drawingData.show_dimensions && diameter) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
  
  // Système submersible 3D
  const create3DSubmersibleSystem = (scene) => {
    // Forage vertical
    const wellGeometry = new THREE.CylinderGeometry(0.5, 0.5, 20, 16);
    const wellMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x8d6e63,
      transparent: true,
      opacity: 0.3
    });
    const well = new THREE.Mesh(wellGeometry, wellMaterial);
    well.position.set(0, -10, 0);
    scene.add(well);
    
    // Pompe submersible
    const pumpGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 12);
    const pumpMaterial = new THREE.MeshPhongMaterial({ color: 0x1976d2 });
    const pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
    pump.position.set(0, -8, 0);
    scene.add(pump);
    
    // Tuyau de refoulement vertical
    const riserGeometry = new THREE.CylinderGeometry(0.1, 0.1, 15, 12);
    const riserMaterial = new THREE.MeshPhongMaterial({ color: 0x4caf50 });
    const riser = new THREE.Mesh(riserGeometry, riserMaterial);
    riser.position.set(0, -2.5, 0);
    scene.add(riser);
    
    // Château d'eau
    const towerGeometry = new THREE.CylinderGeometry(3, 3, 4, 16);
    const towerMaterial = new THREE.MeshPhongMaterial({ color: 0x9c27b0 });
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(0, 8, 0);
    scene.add(tower);
  };
  
  // Système forage 3D
  const create3DForageSystem = (scene) => {
    // Utiliser la même logique que submersible pour l'instant
    create3DSubmersibleSystem(scene);
  };
      
      ctx.fillStyle = colors[type];
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`DN${diameter}`, midX, midY - 15);
    }
  };

  // Vanne professionnelle
  const drawProfessionalValve = (ctx, x, y, type = 'isolement') => {
    // Corps de vanne
    ctx.fillStyle = '#ffc107';
    ctx.fillRect(x - 12, y - 12, 24, 24);
    ctx.strokeStyle = '#f57f17';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 12, y - 12, 24, 24);
    
    // Volant ou actionneur
    ctx.beginPath();
    ctx.arc(x, y - 20, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#ff9800';
    ctx.fill();
    ctx.stroke();
    
    // Tige de manoeuvre
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x, y - 20);
    ctx.stroke();
    
    // Label
    ctx.fillStyle = '#f57f17';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(type === 'isolement' ? 'V.I.' : 'V', x, y + 25);
  };

  // Manomètre professionnel
  const drawProfessionalPressureGauge = (ctx, x, y, location) => {
    // Cadran
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Graduation
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI / 4) - Math.PI/2;
      const x1 = x + Math.cos(angle) * 14;
      const y1 = y + Math.sin(angle) * 14;
      const x2 = x + Math.cos(angle) * 16;
      const y2 = y + Math.sin(angle) * 16;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Aiguille
    const needleAngle = Math.PI / 3; // Position exemple
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(needleAngle - Math.PI/2) * 12, y + Math.sin(needleAngle - Math.PI/2) * 12);
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Label
    ctx.fillStyle = '#424242';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(location.toUpperCase(), x, y + 30);
  };

  // Connexion de pompe
  const drawPumpConnection = (ctx, x, y, type) => {
    ctx.fillStyle = type === 'suction' ? '#4caf50' : '#2196f3';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // AUTRES TYPES D'INSTALLATIONS (versions simplifiées pour l'instant)
  const drawProfessionalSurfaceCharge = (ctx, canvas) => {
    // Version simplifiée - utilise la logique de surface aspiration
    drawProfessionalSurfaceAspiration(ctx, canvas);
    
    // Ajouter indication "EN CHARGE"
    ctx.fillStyle = '#2e7d32';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('INSTALLATION EN CHARGE', 50, 50);
  };

  // SCHÉMA POMPE DE RELEVAGE - POMPES DANS BÂCHE/FOSSE
  const drawProfessionalSubmersible = (ctx, canvas) => {
    // Nettoyage complet
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // 1. BÂCHE/FOSSE DE RELEVAGE
    const pitX = centerX - 150;
    const pitY = centerY - 100;
    const pitW = 200;
    const pitH = 200;
    
    // Parois bâche
    ctx.strokeStyle = '#37474F';
    ctx.lineWidth = 4;
    ctx.fillStyle = '#ECEFF1';
    ctx.fillRect(pitX, pitY, pitW, pitH);
    ctx.strokeRect(pitX, pitY, pitW, pitH);
    
    // Niveau liquide dans la bâche
    const liquidLevel = 0.6; // 60% rempli
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(pitX + 5, pitY + pitH * (1 - liquidLevel), pitW - 10, pitH * liquidLevel);
    
    // Ligne de niveau
    ctx.strokeStyle = '#1976D2';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(pitX, pitY + pitH * (1 - liquidLevel));
    ctx.lineTo(pitX + pitW, pitY + pitH * (1 - liquidLevel));
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Label bâche
    ctx.fillStyle = '#37474F';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BÂCHE DE RELEVAGE', pitX + pitW/2, pitY - 10);
    
    // 2. POMPES SUBMERSIBLES DANS LA BÂCHE (en parallèle)
    const pumpCount = drawingData.pump_count;
    const pumpSpacing = pitW / (pumpCount + 1);
    
    for (let i = 0; i < pumpCount; i++) {
      const pumpX = pitX + pumpSpacing * (i + 1);
      const pumpY = pitY + pitH - 40; // Au fond de la bâche
      const isStandby = i >= drawingData.pumps_in_service;
      
      // POMPE SUBMERSIBLE (dans l'eau)
      ctx.fillStyle = isStandby ? '#FFE0B2' : '#1976D2';
      ctx.strokeStyle = isStandby ? '#FF9800' : '#0D47A1';
      ctx.lineWidth = 3;
      ctx.fillRect(pumpX - 12, pumpY - 15, 24, 30);
      ctx.strokeRect(pumpX - 12, pumpY - 15, 24, 30);
      
      // Roue pompe
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pumpX, pumpY, 6, 0, Math.PI * 2);
      ctx.stroke();
      
      // Flèche rotation
      ctx.beginPath();
      ctx.moveTo(pumpX - 2, pumpY - 3);
      ctx.lineTo(pumpX + 3, pumpY - 1);
      ctx.lineTo(pumpX + 1, pumpY + 3);
      ctx.stroke();
      
      // Label pompe
      ctx.fillStyle = isStandby ? '#F57C00' : '#0D47A1';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`PS${i+1}`, pumpX, pumpY - 25);
      ctx.font = '7px Arial';
      ctx.fillText(isStandby ? 'SECOURS' : 'SERVICE', pumpX, pumpY - 35);
      
      // TUYAU REFOULEMENT vertical sortant de la bâche
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pumpX, pumpY - 15);
      ctx.lineTo(pumpX, pitY - 20);
      ctx.stroke();
      
      // CLAPET ANTI-RETOUR sur chaque refoulement
      if (drawingData.accessories.check_valve) {
        const valveY = pitY - 10;
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pumpX - 6, valveY - 4);
        ctx.lineTo(pumpX + 6, valveY);
        ctx.lineTo(pumpX - 6, valveY + 4);
        ctx.closePath();
        ctx.fillStyle = '#C8E6C9';
        ctx.fill();
        ctx.stroke();
        
        // Tag
        ctx.fillStyle = '#2E7D32';
        ctx.font = '6px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('NR', pumpX, valveY + 12);
      }
      
      // Câble électrique flottant
      ctx.strokeStyle = '#FF9800';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(pumpX + 12, pumpY);
      ctx.quadraticCurveTo(pumpX + 30, pumpY - 30, pumpX + 40, pitY - 40);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // 3. COLLECTEUR DE REFOULEMENT AU-DESSUS DE LA BÂCHE
    const collecteurY = pitY - 20;
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(pitX + pumpSpacing - 20, collecteurY);
    ctx.lineTo(pitX + pumpSpacing * pumpCount + 20, collecteurY);
    ctx.stroke();
    
    // Label collecteur
    ctx.fillStyle = '#2E7D32';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('COLLECTEUR PARALLÈLE', pitX + pitW/2, collecteurY - 8);
    ctx.font = '7px Arial';
    ctx.fillText(`DN${drawingData.discharge_diameter}`, pitX + pitW/2, collecteurY + 15);
    
    // 4. TUYAUTERIE VERS STOCKAGE
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(pitX + pumpSpacing * pumpCount + 20, collecteurY);
    ctx.lineTo(centerX + 200, collecteurY);
    ctx.stroke();
    
    // Flèche débit total
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX + 150, collecteurY - 4);
    ctx.lineTo(centerX + 165, collecteurY);
    ctx.lineTo(centerX + 150, collecteurY + 4);
    ctx.stroke();
    
    // Débit total
    ctx.fillStyle = '#2E7D32';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    const totalFlow = drawingData.flow_rate * drawingData.pumps_in_service;
    ctx.fillText(`${totalFlow}m³/h`, centerX + 120, collecteurY - 8);
    
    // 5. RÉSERVOIR DE STOCKAGE
    const storageX = centerX + 220;
    const storageY = centerY - 60;
    const storageW = 100;
    const storageH = 120;
    
    ctx.strokeStyle = '#9C27B0';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#F3E5F5';
    ctx.fillRect(storageX, storageY, storageW, storageH);
    ctx.strokeRect(storageX, storageY, storageW, storageH);
    
    // Niveau stockage
    ctx.fillStyle = '#8E24AA';
    ctx.fillRect(storageX + 5, storageY + storageH * 0.2, storageW - 10, storageH * 0.7);
    
    // Raccordement
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(centerX + 200, collecteurY);
    ctx.lineTo(storageX, collecteurY);
    ctx.lineTo(storageX, storageY + storageH - 20);
    ctx.stroke();
    
    // Label stockage
    ctx.fillStyle = '#7B1FA2';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('STOCKAGE', storageX + storageW/2, storageY - 10);
    
    // 6. COFFRET ÉLECTRIQUE
    if (drawingData.accessories.control_panel) {
      const panelX = pitX - 80;
      const panelY = centerY - 80;
      
      ctx.fillStyle = '#37474F';
      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 2;
      ctx.fillRect(panelX, panelY, 60, 80);
      ctx.strokeRect(panelX, panelY, 60, 80);
      
      // Façade
      ctx.fillStyle = '#B0BEC5';
      ctx.fillRect(panelX + 5, panelY + 5, 50, 70);
      
      // LEDs pour chaque pompe
      for (let i = 0; i < pumpCount; i++) {
        const ledX = panelX + 15 + (i * 12);
        const ledY = panelY + 20;
        const isActive = i < drawingData.pumps_in_service;
        
        ctx.beginPath();
        ctx.arc(ledX, ledY, 3, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#4CAF50' : '#FF9800';
        ctx.fill();
        
        // Label pompe
        ctx.fillStyle = '#263238';
        ctx.font = '7px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`P${i+1}`, ledX, ledY + 12);
      }
      
      // Écran
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(panelX + 10, panelY + 40, 40, 20);
      ctx.fillStyle = '#4CAF50';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AUTO', panelX + 30, panelY + 47);
      ctx.fillText(`${totalFlow}m³/h`, panelX + 30, panelY + 55);
      
      // Tag coffret
      ctx.fillStyle = '#263238';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('E-001', panelX + 30, panelY - 10);
    }
    
    // 7. DONNÉES TECHNIQUES
    const dataX = 50;
    const dataY = centerY + 120;
    
    ctx.fillStyle = '#2C3E50';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    
    const techData = [
      `DÉBIT TOTAL: ${totalFlow} m³/h`,
      `HMT: ${drawingData.total_head} m`,
      `POMPES: ${drawingData.pump_count} × ${drawingData.pumps_in_service} service`,
      `DN REFOULEMENT: ${drawingData.discharge_diameter} mm`,
      `CONFIGURATION: PARALLÈLE`
    ];
    
    techData.forEach((text, i) => {
      ctx.fillText(text, dataX, dataY + (i * 12));
    });
    
    // Cartouche technique
    drawDynamicTechnicalCartouche(ctx, canvas, 'RELEVAGE PARALLÈLE');
  };

  // SCHÉMA FORAGE DYNAMIQUE - ÉCHELLE ADAPTATIVE
  const drawProfessionalForage = (ctx, canvas) => {
    // Nettoyage complet
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // CALCUL ÉCHELLE ADAPTATIVE selon les valeurs saisies
    const maxDepth = Math.max(
      drawingData.forage_specific.dynamic_level,
      drawingData.forage_specific.reservoir_height,
      50 // minimum
    );
    const scale = Math.min(300 / maxDepth, 3); // Échelle adaptative
    
    // Paramètres du schéma technique avec échelle
    const centerX = canvas.width / 2;
    const groundLevel = canvas.height / 2 - 50;
    
    // 1. NIVEAU SOL (ligne technique)
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, groundLevel);
    ctx.lineTo(canvas.width - 50, groundLevel);
    ctx.stroke();
    
    // Label niveau sol
    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('NIVEAU SOL', 60, groundLevel - 10);
    
    // 2. FORAGE VERTICAL SIMPLE - PROFONDEUR SELON NIVEAU DYNAMIQUE
    const wellX = centerX - 100;
    const wellWidth = 40;
    const wellDepth = drawingData.forage_specific.dynamic_level * scale; // Profondeur réelle
    
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 4;
    ctx.fillStyle = '#E8F4FD';
    ctx.fillRect(wellX - wellWidth/2, groundLevel, wellWidth, wellDepth);
    ctx.strokeRect(wellX - wellWidth/2, groundLevel, wellWidth, wellDepth);
    
    // Annotation profondeur RÉELLE
    ctx.fillStyle = '#2C3E50';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${drawingData.forage_specific.dynamic_level}m`, wellX + wellWidth/2 + 20, groundLevel + wellDepth/2);
    
    // Label forage
    ctx.fillStyle = '#E74C3C';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FORAGE', wellX, groundLevel - 25);
    
    // 3. NIVEAU D'EAU STATIQUE (ligne simple) - POSITION RÉELLE
    const waterLevel = groundLevel + (wellDepth * 0.3); // 30% de la profondeur
    ctx.strokeStyle = '#3498DB';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(wellX - wellWidth/2, waterLevel);
    ctx.lineTo(wellX + wellWidth/2, waterLevel);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#3498DB';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Niveau statique`, wellX + wellWidth/2 + 10, waterLevel);
    
    // 4. POMPE SUBMERSIBLE DANS LE FORAGE - POSITION ADAPTÉE
    const pumpY = groundLevel + wellDepth * 0.8; // 80% de la profondeur réelle
    
    // Corps pompe (rectangle simple)
    ctx.fillStyle = '#1976D2';
    ctx.strokeStyle = '#0D47A1';
    ctx.lineWidth = 2;
    ctx.fillRect(wellX - 15, pumpY - 20, 30, 40);
    ctx.strokeRect(wellX - 15, pumpY - 20, 30, 40);
    
    // Symbole rotation (cercle avec flèche)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wellX, pumpY, 8, 0, Math.PI * 2);
    ctx.stroke();
    
    // Flèche rotation
    ctx.beginPath();
    ctx.moveTo(wellX - 3, pumpY - 5);
    ctx.lineTo(wellX + 5, pumpY - 2);
    ctx.lineTo(wellX + 2, pumpY + 5);
    ctx.stroke();
    
    // Tag pompe avec débit DYNAMIQUE
    ctx.fillStyle = '#0D47A1';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PS-001', wellX, pumpY + 35);
    ctx.font = '8px Arial';
    ctx.fillText(`${drawingData.flow_rate}m³/h`, wellX, pumpY + 47);
    ctx.fillText(`${drawingData.total_head}m HMT`, wellX, pumpY + 57);
    
    // 5. COLONNE MONTANTE - DIAMÈTRE DYNAMIQUE
    const riserX = wellX + wellWidth/4;
    const pipeWidth = Math.max(4, drawingData.discharge_diameter / 20);
    
    ctx.strokeStyle = '#27AE60';
    ctx.lineWidth = pipeWidth;
    ctx.beginPath();
    ctx.moveTo(riserX, pumpY - 20);
    ctx.lineTo(riserX, groundLevel + 20);
    ctx.stroke();
    
    // Flèches débit avec nombre adaptatif
    const arrowCount = Math.min(4, Math.max(2, Math.round(wellDepth / 100)));
    for (let i = 1; i <= arrowCount; i++) {
      const arrowY = pumpY - 40 - (i * (wellDepth - 80) / arrowCount);
      if (arrowY > groundLevel + 30) { // Ne pas sortir du sol
        ctx.strokeStyle = '#27AE60';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(riserX - 5, arrowY + 8);
        ctx.lineTo(riserX, arrowY);
        ctx.lineTo(riserX + 5, arrowY + 8);
        ctx.stroke();
      }
    }
    
    // Annotation DN DYNAMIQUE
    ctx.fillStyle = '#27AE60';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`DN${drawingData.discharge_diameter}`, riserX + 10, groundLevel - 20);
    ctx.fillText(`${drawingData.flow_rate}m³/h`, riserX + 10, groundLevel - 8);
    
    // 6. TÊTE DE FORAGE (bride simple)
    ctx.fillStyle = '#95A5A6';
    ctx.strokeStyle = '#7F8C8D';
    ctx.lineWidth = 2;
    ctx.fillRect(wellX - 25, groundLevel + 10, 50, 20);
    ctx.strokeRect(wellX - 25, groundLevel + 10, 50, 20);
    
    // Boulons (points simples)
    ctx.fillStyle = '#34495E';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(wellX - 15 + i * 10, groundLevel + 20, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 7. TUYAUTERIE HORIZONTALE - DIAMÈTRE PROPORTIONNEL
    const pipeY = groundLevel + 20;
    ctx.strokeStyle = '#27AE60';
    ctx.lineWidth = pipeWidth;
    ctx.beginPath();
    ctx.moveTo(wellX + 25, pipeY);
    ctx.lineTo(centerX + 150, pipeY);
    ctx.stroke();
    
    // Flèche débit horizontal avec débit
    ctx.strokeStyle = '#27AE60';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX + 120, pipeY - 5);
    ctx.lineTo(centerX + 135, pipeY);
    ctx.lineTo(centerX + 120, pipeY + 5);
    ctx.stroke();
    
    // Débit sur la tuyauterie
    ctx.fillStyle = '#27AE60';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${drawingData.flow_rate}m³/h`, centerX + 90, pipeY - 8);
    
    // 8. ACCESSOIRES DYNAMIQUES selon sélection
    let accessoryX = centerX + 50;
    
    // MANOMÈTRE si sélectionné
    if (drawingData.accessories.pressure_gauge_discharge) {
      const gaugeX = accessoryX;
      const gaugeY = pipeY - 30;
      
      // Cercle simple
      ctx.beginPath();
      ctx.arc(gaugeX, gaugeY, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#2C3E50';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Aiguille simple
      ctx.strokeStyle = '#E74C3C';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gaugeX, gaugeY);
      ctx.lineTo(gaugeX + 6, gaugeY - 6);
      ctx.stroke();
      
      // Raccordement
      ctx.strokeStyle = '#7F8C8D';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gaugeX, gaugeY + 12);
      ctx.lineTo(gaugeX, pipeY);
      ctx.stroke();
      
      // Tag avec pression dynamique
      ctx.fillStyle = '#2C3E50';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PI-001', gaugeX, gaugeY + 25);
      ctx.fillText(`${drawingData.operating_pressure}bar`, gaugeX, gaugeY + 35);
      
      accessoryX += 50;
    }
    
    // DÉBITMÈTRE si sélectionné
    if (drawingData.accessories.flow_meter) {
      const flowX = accessoryX;
      
      // Corps débitmètre
      ctx.fillStyle = '#F8F9FA';
      ctx.strokeStyle = '#2C3E50';
      ctx.lineWidth = 2;
      ctx.fillRect(flowX - 15, pipeY - 10, 30, 20);
      ctx.strokeRect(flowX - 15, pipeY - 10, 30, 20);
      
      // Roue
      ctx.strokeStyle = '#3498DB';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(flowX, pipeY);
        ctx.lineTo(flowX + Math.cos(angle) * 6, pipeY + Math.sin(angle) * 6);
        ctx.stroke();
      }
      
      // Tag avec débit
      ctx.fillStyle = '#2C3E50';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('FI-001', flowX, pipeY + 25);
      ctx.fillText(`${drawingData.flow_rate}m³/h`, flowX, pipeY + 35);
      
      accessoryX += 50;
    }
    
    // 9. VANNE si sélectionnée
    if (drawingData.accessories.isolation_valve_discharge) {
      const valveX = accessoryX;
      
      // Losange
      ctx.strokeStyle = '#2C3E50';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(valveX, pipeY - 10);
      ctx.lineTo(valveX + 10, pipeY);
      ctx.lineTo(valveX, pipeY + 10);
      ctx.lineTo(valveX - 10, pipeY);
      ctx.closePath();
      ctx.fillStyle = '#ECF0F1';
      ctx.fill();
      ctx.stroke();
      
      // Obturateur
      ctx.strokeStyle = '#34495E';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(valveX - 7, pipeY - 7);
      ctx.lineTo(valveX + 7, pipeY + 7);
      ctx.stroke();
      
      // Tag
      ctx.fillStyle = '#2C3E50';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('XV-001', valveX, pipeY + 25);
      
      accessoryX += 30;
    }
    
    // 10. CHÂTEAU D'EAU SURÉLEVÉ - MESURE DEPUIS SOL JUSQU'AU BOUCHON
    const towerX = centerX + 200;
    const towerHeight = drawingData.forage_specific.reservoir_height * scale; // Hauteur totale depuis le sol
    const towerBaseY = groundLevel - towerHeight; // Position du bas du château
    const towerW = Math.max(80, Math.min(120, drawingData.flow_rate * 1.5));
    const reservoirH = Math.max(30, towerHeight / 3); // Hauteur du réservoir (1/3 de la hauteur totale)
    const reservoirY = towerBaseY; // Le réservoir est en haut
    
    // Support du château d'eau (2/3 de la hauteur totale)
    const supportHeight = towerHeight - reservoirH;
    ctx.strokeStyle = '#7F8C8D';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(towerX + towerW/2 - 15, groundLevel);
    ctx.lineTo(towerX + towerW/2 - 15, groundLevel - supportHeight);
    ctx.moveTo(towerX + towerW/2 + 15, groundLevel);
    ctx.lineTo(towerX + towerW/2 + 15, groundLevel - supportHeight);
    ctx.stroke();
    
    // Entretoises
    ctx.strokeStyle = '#95A5A6';
    ctx.lineWidth = 2;
    const braceCount = Math.min(5, Math.max(2, Math.round(supportHeight / 30)));
    for (let i = 1; i < braceCount; i++) {
      const supportY = groundLevel - (i * supportHeight / braceCount);
      ctx.beginPath();
      ctx.moveTo(towerX + towerW/2 - 15, supportY);
      ctx.lineTo(towerX + towerW/2 + 15, supportY);
      ctx.stroke();
    }
    
    // Réservoir surélevé (en haut)
    ctx.strokeStyle = '#8E44AD';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#F4ECF7';
    ctx.fillRect(towerX, reservoirY, towerW, reservoirH);
    ctx.strokeRect(towerX, reservoirY, towerW, reservoirH);
    
    // Niveau liquide
    const liquidLevel = 0.7;
    ctx.fillStyle = '#9B59B6';
    ctx.fillRect(towerX + 5, reservoirY + reservoirH * (1 - liquidLevel), towerW - 10, reservoirH * liquidLevel);
    
    // Ligne niveau
    ctx.strokeStyle = '#8E44AD';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(towerX, reservoirY + reservoirH * (1 - liquidLevel));
    ctx.lineTo(towerX + towerW, reservoirY + reservoirH * (1 - liquidLevel));
    ctx.stroke();
    ctx.setLineDash([]);
    
    // MESURE HAUTEUR CHÂTEAU D'EAU - DEPUIS SOL JUSQU'AU BOUCHON (HAUT DU RÉSERVOIR)
    ctx.strokeStyle = '#E91E63';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(towerX + towerW + 10, groundLevel);
    ctx.lineTo(towerX + towerW + 30, groundLevel);
    ctx.lineTo(towerX + towerW + 30, reservoirY); // Jusqu'au haut du réservoir (bouchon)
    ctx.lineTo(towerX + towerW + 10, reservoirY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Flèches de cote
    ctx.strokeStyle = '#E91E63';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(towerX + towerW + 25, groundLevel);
    ctx.lineTo(towerX + towerW + 25, groundLevel - 5);
    ctx.moveTo(towerX + towerW + 25, reservoirY);
    ctx.lineTo(towerX + towerW + 25, reservoirY + 5);
    ctx.stroke();
    
    // Annotation hauteur château d'eau (DEPUIS SOL JUSQU'AU BOUCHON)
    ctx.fillStyle = '#E91E63';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`H=${drawingData.forage_specific.reservoir_height}m`, towerX + towerW + 35, groundLevel - towerHeight/2);
    ctx.font = '8px Arial';
    ctx.fillText('(sol→bouchon)', towerX + towerW + 35, groundLevel - towerHeight/2 + 12);
    
    // Raccordement tuyauterie
    const connectionY = groundLevel - 10; // Raccordement près du sol
    ctx.strokeStyle = '#27AE60';
    ctx.lineWidth = pipeWidth;
    ctx.beginPath();
    ctx.moveTo(accessoryX, pipeY);
    ctx.lineTo(towerX - 20, pipeY);
    ctx.lineTo(towerX - 20, connectionY);
    ctx.lineTo(towerX, connectionY);
    ctx.stroke();
    
    // LONGUEUR DE REFOULEMENT AFFICHÉE
    ctx.strokeStyle = '#FF5722';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(wellX + 50, pipeY + 15);
    ctx.lineTo(towerX - 20, pipeY + 15);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Annotation longueur refoulement (valeur saisie)
    ctx.fillStyle = '#FF5722';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`L=${drawingData.forage_specific.discharge_length}m`, (wellX + 50 + towerX - 20) / 2, pipeY + 30);
    
    // NIVEAU DYNAMIQUE AFFICHÉ VISUELLEMENT
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(wellX - 40, groundLevel);
    ctx.lineTo(wellX - 60, groundLevel);
    ctx.lineTo(wellX - 60, groundLevel + wellDepth);
    ctx.lineTo(wellX - 40, groundLevel + wellDepth);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Flèches de cote niveau dynamique
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wellX - 55, groundLevel);
    ctx.lineTo(wellX - 55, groundLevel + 5);
    ctx.moveTo(wellX - 55, groundLevel + wellDepth);
    ctx.lineTo(wellX - 55, groundLevel + wellDepth - 5);
    ctx.stroke();
    
    // Annotation niveau dynamique (valeur saisie)
    ctx.fillStyle = '#2196F3';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Niv.Dyn=${drawingData.forage_specific.dynamic_level}m`, wellX - 65, groundLevel + wellDepth / 2);
    
    // Tag château d'eau avec volume estimé
    ctx.fillStyle = '#8E44AD';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CHÂTEAU D\'EAU', towerX + towerW/2, reservoirY - 10);
    ctx.font = '8px Arial';
    ctx.fillText(`V=${Math.round(towerW * reservoirH * 0.1)}m³`, towerX + towerW/2, reservoirY - 25);
    
    // 11. COFFRET ÉLECTRIQUE DYNAMIQUE si sélectionné
    if (drawingData.accessories.control_panel) {
      const panelX = wellX - 80;
      const panelY = groundLevel - 80;
      
      ctx.fillStyle = '#34495E';
      ctx.strokeStyle = '#2C3E50';
      ctx.lineWidth = 2;
      ctx.fillRect(panelX, panelY, 60, 70);
      ctx.strokeRect(panelX, panelY, 60, 70);
      
      // Façade
      ctx.fillStyle = '#BDC3C7';
      ctx.fillRect(panelX + 5, panelY + 5, 50, 60);
      
      // LED pompe (verte si en service)
      ctx.beginPath();
      ctx.arc(panelX + 30, panelY + 20, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#27AE60';
      ctx.fill();
      
      // Écran avec données dynamiques
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(panelX + 10, panelY + 35, 40, 20);
      ctx.fillStyle = '#27AE60';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AUTO', panelX + 30, panelY + 42);
      ctx.fillText(`${drawingData.flow_rate}m³/h`, panelX + 30, panelY + 50);
      
      // Câble vers pompe (ligne pointillée)
      ctx.strokeStyle = '#F39C12';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(panelX + 60, panelY + 35);
      ctx.lineTo(wellX - 15, pumpY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Tag coffret
      ctx.fillStyle = '#2C3E50';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('E-001', panelX + 30, panelY - 10);
      ctx.font = '8px Arial';
      ctx.fillText(`${drawingData.operating_pressure}bar`, panelX + 30, panelY + 75);
    }
    
    // 12. DONNÉES TECHNIQUES DYNAMIQUES (tableau simple)
    const dataX = 50;
    const dataY = groundLevel + wellDepth + 30;
    
    ctx.fillStyle = '#2C3E50';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    
    const techData = [
      `DÉBIT: ${drawingData.flow_rate} m³/h`,
      `HMT: ${drawingData.total_head} m`,
      `PROFONDEUR: ${drawingData.forage_specific.dynamic_level} m`,
      `DN REFOULEMENT: ${drawingData.discharge_diameter} mm`,
      `PRESSION SERVICE: ${drawingData.operating_pressure} bar`,
      `POMPE: ${drawingData.pump_count} × ${drawingData.pumps_in_service} service`
    ];
    
    techData.forEach((text, i) => {
      ctx.fillText(text, dataX, dataY + (i * 15));
    });
    
    // Ajout cartouche technique dynamique
    drawDynamicTechnicalCartouche(ctx, canvas, 'FORAGE');
  };
  
  // Cartouche technique dynamique
  const drawDynamicTechnicalCartouche = (ctx, canvas, type) => {
    const cartX = canvas.width - 300;
    const cartY = 30;
    const cartW = 270;
    const cartH = 140;
    
    // Cadre simple
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 2;
    ctx.strokeRect(cartX, cartY, cartW, cartH);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cartX, cartY, cartW, cartH);
    
    // Titre
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`STATION DE POMPAGE ${type}`, cartX + 10, cartY + 20);
    
    // Données techniques DYNAMIQUES
    ctx.font = '10px Arial';
    let y = cartY + 40;
    
    const specs = [
      `Installation: ${drawingData.installation_type.toUpperCase()}`,
      `Pompes: ${drawingData.pump_count} × ${drawingData.pumps_in_service} service`,
      `Débit nominal: ${drawingData.flow_rate} m³/h`,
      `HMT nominale: ${drawingData.total_head} m`,
      `DN refoulement: ${drawingData.discharge_diameter} mm`,
      `Pression service: ${drawingData.operating_pressure} bar`,
      `Température: ${drawingData.temperature}°C`,
      `Matériau: ${drawingData.material}`,
      `Accessoires: ${Object.values(drawingData.accessories).filter(Boolean).length}/21`
    ];
    
    specs.forEach(spec => {
      ctx.fillText(spec, cartX + 10, y);
      y += 12;
    });
    
    // Logo technique
    ctx.strokeStyle = '#3498DB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(cartX + cartW - 40, cartY + 10, 30, 30);
    ctx.stroke();
    ctx.fillStyle = '#3498DB';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PID', cartX + cartW - 25, cartY + 30);
  };
  
  // Cartouche technique simplifié PID
  const drawSimpleTechnicalCartouche = (ctx, canvas, type) => {
    const cartX = canvas.width - 280;
    const cartY = 30;
    const cartW = 250;
    const cartH = 120;
    
    // Cadre simple
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 2;
    ctx.strokeRect(cartX, cartY, cartW, cartH);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cartX, cartY, cartW, cartH);
    
    // Titre
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`STATION DE POMPAGE ${type}`, cartX + 10, cartY + 20);
    
    // Données techniques
    ctx.font = '10px Arial';
    let y = cartY + 40;
    
    const specs = [
      `Installation: ${drawingData.installation_type.toUpperCase()}`,
      `Pompes: ${drawingData.pump_count} × ${drawingData.pumps_in_service} service`,
      `Débit: ${drawingData.flow_rate} m³/h`,
      `HMT: ${drawingData.total_head} m`,
      `DN Ref: ${drawingData.discharge_diameter} mm`,
      `Pression: ${drawingData.operating_pressure} bar`
    ];
    
    specs.forEach(spec => {
      ctx.fillText(spec, cartX + 10, y);
      y += 12;
    });
  };
  
  // FONCTIONS PID/ISO PROFESSIONNELLES
  
  // Forage vertical (symbole PID)
  const drawPIDWell = (ctx, x, y, width, height) => {
    // Forage principal
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.rect(x - width/2, y, width, height);
    ctx.stroke();
    
    // Tubage
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x - width/2 + 5, y + 10, width - 10, height - 20);
    ctx.stroke();
    
    // Niveau statique
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x - width/2, y + height/3);
    ctx.lineTo(x + width/2, y + height/3);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Annotation profondeur
    ctx.fillStyle = '#2c3e50';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(height/10)}m`, x + width/2 + 20, y + height/2);
    
    // Label technique
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FORAGE', x, y - 10);
  };
  
  // Pompe submersible PID
  const drawPIDSubmersiblePump = (ctx, x, y, tag) => {
    // Corps de pompe (symbole PID)
    ctx.strokeStyle = '#2980b9';
    ctx.fillStyle = '#3498db';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.rect(x - 15, y - 25, 30, 50);
    ctx.fill();
    ctx.stroke();
    
    // Symbole de rotation (PID)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
    
    // Flèche de rotation
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 5);
    ctx.lineTo(x + 5, y - 5);
    ctx.lineTo(x, y - 10);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    // Tag technique
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(tag, x, y + 40);
    
    // Câble électrique
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x + 15, y);
    ctx.lineTo(x + 40, y - 50);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  
  // Tuyau vertical PID
  const drawPIDVerticalPipe = (ctx, x, startY, endY, diameter) => {
    const lineWidth = Math.max(2, diameter / 50);
    
    // Tuyau principal
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
    
    // Flèches de débit (PID)
    const arrowCount = 3;
    for (let i = 1; i <= arrowCount; i++) {
      const arrowY = startY + (endY - startY) * i / (arrowCount + 1);
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 5, arrowY + 10);
      ctx.lineTo(x, arrowY);
      ctx.lineTo(x + 5, arrowY + 10);
      ctx.stroke();
    }
    
    // Annotation DN
    ctx.fillStyle = '#27ae60';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`DN${diameter}`, x + 10, startY + (endY - startY) / 2);
  };
  
  // Tête de forage PID
  const drawPIDWellHead = (ctx, x, y) => {
    // Bride de tête
    ctx.fillStyle = '#95a5a6';
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(x - 30, y - 10, 60, 20);
    ctx.fill();
    ctx.stroke();
    
    // Boulonnage
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(x - 20 + i * 13, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#34495e';
      ctx.fill();
    }
    
    // Label
    ctx.fillStyle = '#2c3e50';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TÊTE FORAGE', x, y - 20);
  };
  
  // Tuyau horizontal PID
  const drawPIDHorizontalPipe = (ctx, startX, y, endX, diameter) => {
    const lineWidth = Math.max(2, diameter / 50);
    
    // Tuyau principal
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
    
    // Flèches de débit
    const arrowCount = 2;
    for (let i = 1; i <= arrowCount; i++) {
      const arrowX = startX + (endX - startX) * i / (arrowCount + 1);
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(arrowX - 10, y - 5);
      ctx.lineTo(arrowX, y);
      ctx.lineTo(arrowX - 10, y + 5);
      ctx.stroke();
    }
  };
  
  // Indicateur de pression PID
  const drawPIDPressureIndicator = (ctx, x, y, tag) => {
    // Cadran (cercle PID)
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Aiguille
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 8, y - 8);
    ctx.stroke();
    
    // Graduation
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * 12, y + Math.sin(angle) * 12);
      ctx.lineTo(x + Math.cos(angle) * 15, y + Math.sin(angle) * 15);
      ctx.stroke();
    }
    
    // Tag
    ctx.fillStyle = '#2c3e50';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(tag, x, y + 30);
    
    // Raccordement
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 15);
    ctx.lineTo(x, y + 25);
    ctx.stroke();
  };
  
  // Indicateur de débit PID
  const drawPIDFlowIndicator = (ctx, x, y, tag) => {
    // Corps du débitmètre (rectangulaire PID)
    ctx.fillStyle = '#f8f9fa';
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x - 20, y - 15, 40, 30);
    ctx.fill();
    ctx.stroke();
    
    // Symbole de débit (roue à aubes)
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8);
      ctx.stroke();
    }
    
    // Tag
    ctx.fillStyle = '#2c3e50';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(tag, x, y + 25);
  };
  
  // Vanne PID
  const drawPIDGateValve = (ctx, x, y, tag) => {
    // Corps de vanne (losange PID)
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - 15);
    ctx.lineTo(x + 15, y);
    ctx.lineTo(x, y + 15);
    ctx.lineTo(x - 15, y);
    ctx.closePath();
    ctx.fillStyle = '#ecf0f1';
    ctx.fill();
    ctx.stroke();
    
    // Obturateur
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 10);
    ctx.lineTo(x + 10, y + 10);
    ctx.stroke();
    
    // Volant de manœuvre
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - 15);
    ctx.lineTo(x, y - 25);
    ctx.moveTo(x - 8, y - 25);
    ctx.lineTo(x + 8, y - 25);
    ctx.stroke();
    
    // Tag
    ctx.fillStyle = '#2c3e50';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(tag, x, y + 30);
  };
  
  // Réservoir de stockage PID
  const drawPIDStorageTank = (ctx, x, y, width, height, tag) => {
    // Corps du réservoir
    ctx.strokeStyle = '#8e44ad';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(x - width/2, y, width, height);
    ctx.fillStyle = '#e8d5f0';
    ctx.fill();
    ctx.stroke();
    
    // Niveau liquide
    ctx.fillStyle = '#9b59b6';
    ctx.fillRect(x - width/2 + 5, y + height * 0.3, width - 10, height * 0.6);
    
    // Ligne de niveau
    ctx.strokeStyle = '#8e44ad';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x - width/2, y + height * 0.3);
    ctx.lineTo(x + width/2, y + height * 0.3);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Instruments de niveau
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(x + width/2 - 30, y + height * 0.4, 25, 15);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#2c3e50';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LI', x + width/2 - 17, y + height * 0.4 + 10);
    
    // Tag principal
    ctx.fillStyle = '#8e44ad';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(tag, x, y - 10);
  };
  
  // Coffret électrique PID
  const drawPIDControlPanel = (ctx, x, y, tag, pumpCount) => {
    // Boîtier principal
    ctx.fillStyle = '#34495e';
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x, y, 80, 100);
    ctx.fill();
    ctx.stroke();
    
    // Façade
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(x + 5, y + 5, 70, 90);
    
    // Voyants et contrôles
    for (let i = 0; i < pumpCount; i++) {
      // LED de statut
      ctx.beginPath();
      ctx.arc(x + 20 + i * 15, y + 20, 3, 0, Math.PI * 2);
      ctx.fillStyle = i < drawingData.pumps_in_service ? '#27ae60' : '#e74c3c';
      ctx.fill();
      
      // Label pompe
      ctx.fillStyle = '#2c3e50';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`P${i+1}`, x + 20 + i * 15, y + 35);
    }
    
    // Écran de contrôle
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + 10, y + 45, 60, 25);
    ctx.fillStyle = '#27ae60';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AUTO', x + 40, y + 55);
    ctx.fillText(`${drawingData.flow_rate}m³/h`, x + 40, y + 65);
    
    // Boutons de commande
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x + 15, y + 75, 15, 10);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(x + 35, y + 75, 15, 10);
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(x + 55, y + 75, 15, 10);
    
    // Tag
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(tag, x + 40, y - 10);
  };
  
  // Annotations techniques PID
  const drawPIDAnnotations = (ctx, canvas, type) => {
    ctx.fillStyle = '#2c3e50';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    
    // Données techniques selon le type
    const annotations = [];
    if (type === 'forage') {
      annotations.push(`Débit nominal: ${drawingData.flow_rate} m³/h`);
      annotations.push(`HMT: ${drawingData.total_head} m`);
      annotations.push(`DN refoulement: ${drawingData.discharge_diameter} mm`);
      annotations.push(`Profondeur: ${Math.round(drawingData.dimensions.suction_length)} m`);
      annotations.push(`Pression service: ${drawingData.operating_pressure} bar`);
    }
    
    let y = 50;
    annotations.forEach(text => {
      ctx.fillText(text, 50, y);
      y += 15;
    });
  };
  
  // Légende PID
  const drawPIDLegend = (ctx, canvas, title) => {
    const legendX = canvas.width - 300;
    const legendY = 50;
    
    // Cadre de légende
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(legendX, legendY, 280, 120);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
    
    // Titre
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(title, legendX + 10, legendY + 20);
    
    // Symboles et explications
    const symbols = [
      { color: '#3498db', text: 'Pompe submersible' },
      { color: '#27ae60', text: 'Tuyauterie refoulement' },
      { color: '#8e44ad', text: 'Réservoir stockage' },
      { color: '#34495e', text: 'Coffret électrique' }
    ];
    
    let symbolY = legendY + 40;
    symbols.forEach(symbol => {
      // Carré de couleur
      ctx.fillStyle = symbol.color;
      ctx.fillRect(legendX + 15, symbolY - 8, 12, 12);
      
      // Texte
      ctx.fillStyle = '#2c3e50';
      ctx.font = '11px Arial';
      ctx.fillText(symbol.text, legendX + 35, symbolY);
      symbolY += 20;
    });
  };

  const drawProfessionalSurpresseur = (ctx, canvas) => {
    drawProfessionalSurfaceAspiration(ctx, canvas);
    
    ctx.fillStyle = '#7b1fa2';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('SURPRESSEUR', 50, 50);
  };

  const drawProfessionalIncendie = (ctx, canvas) => {
    drawProfessionalSurfaceAspiration(ctx, canvas);
    
    ctx.fillStyle = '#d32f2f';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('PROTECTION INCENDIE', 50, 50);
  };

  // ACCESSOIRES SPÉCIALISÉS
  
  // Crépine/Filtre
  const drawStrainer = (ctx, x, y) => {
    // Corps
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(x - 15, y - 10, 30, 20);
    ctx.strokeStyle = '#616161';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 15, y - 10, 30, 20);
    
    // Grille
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 10 + (i * 7), y - 8);
      ctx.lineTo(x - 10 + (i * 7), y + 8);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    ctx.fillStyle = '#616161';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CRÉPINE', x, y + 25);
  };

  // Débitmètre
  const drawFlowMeter = (ctx, x, y) => {
    // Corps principal
    ctx.fillStyle = '#fff9c4';
    ctx.fillRect(x - 20, y - 15, 40, 30);
    ctx.strokeStyle = '#f57f17';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 20, y - 15, 40, 30);
    
    // Afficheur
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(x - 15, y - 10, 30, 10);
    
    // Roue à aubes (indicatif)
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.strokeStyle = '#f57f17';
    ctx.stroke();
    
    ctx.fillStyle = '#f57f17';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DÉBIT', x, y + 25);
  };

  // Clapet anti-retour
  const drawCheckValve = (ctx, x, y) => {
    // Triangle du clapet
    ctx.fillStyle = '#424242';
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 8);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x - 8, y + 8);
    ctx.closePath();
    ctx.fill();
    
    // Siège
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 10);
    ctx.lineTo(x + 8, y + 10);
    ctx.stroke();
    
    ctx.fillStyle = '#424242';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CAR', x, y + 25);
  };

  // Coffret de commande professionnel
  const drawControlPanel = (ctx, x, y, totalPumps, pumpsInService) => {
    // Corps du coffret
    const width = 80;
    const height = 100;
    
    ctx.fillStyle = '#eceff1';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    
    // Voyants pour chaque pompe
    for (let i = 0; i < totalPumps; i++) {
      const ledX = x + 15 + (i * 15);
      const ledY = y + 20;
      const isActive = i < pumpsInService;
      
      ctx.beginPath();
      ctx.arc(ledX, ledY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = isActive ? '#4caf50' : '#ffeb3b';
      ctx.fill();
      ctx.strokeStyle = '#424242';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Label pompe
      ctx.fillStyle = '#424242';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`P${i+1}`, ledX, ledY + 15);
    }
    
    // Boutons et commutateurs
    ctx.fillStyle = '#f44336';
    ctx.fillRect(x + 15, y + 45, 20, 12);
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(x + 45, y + 45, 20, 12);
    
    // Écran de contrôle
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + 10, y + 65, 60, 25);
    ctx.fillStyle = '#4caf50';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RUNNING', x + 40, y + 75);
    ctx.fillText(`${pumpsInService}/${totalPumps}`, x + 40, y + 85);
    
    // Label
    ctx.fillStyle = '#455a64';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('COFFRET', x + width/2, y - 10);
    ctx.fillText('COMMANDE', x + width/2, y + height + 15);
  };

  // Cartouche technique professionnel
  const drawTechnicalCartouche = (ctx, canvas) => {
    const cartX = canvas.width - 350;
    const cartY = canvas.height - 150;
    const cartWidth = 330;
    const cartHeight = 130;
    
    // Fond du cartouche
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(cartX, cartY, cartWidth, cartHeight);
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 2;
    ctx.strokeRect(cartX, cartY, cartWidth, cartHeight);
    
    // En-tête
    ctx.fillStyle = '#1565c0';
    ctx.fillRect(cartX, cartY, cartWidth, 25);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SCHÉMA HYDRAULIQUE TECHNIQUE - ECO-PUMP AFRIK', cartX + cartWidth/2, cartY + 17);
    
    // Informations techniques en colonnes
    const col1X = cartX + 10;
    const col2X = cartX + 120;
    const col3X = cartX + 230;
    const startY = cartY + 40;
    
    ctx.fillStyle = '#424242';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    
    // Colonne 1 - Installation
    ctx.font = 'bold 10px Arial';
    ctx.fillText('INSTALLATION:', col1X, startY);
    ctx.font = '10px Arial';
    ctx.fillText(drawingData.installation_type.replace('_', ' ').toUpperCase(), col1X, startY + 12);
    ctx.fillText(`${drawingData.pump_count} pompe(s)`, col1X, startY + 24);
    ctx.fillText(`${drawingData.pumps_in_service} en service`, col1X, startY + 36);
    if ((drawingData.pump_count - drawingData.pumps_in_service) > 0) {
      ctx.fillText(`${drawingData.pump_count - drawingData.pumps_in_service} secours`, col1X, startY + 48);
    }
    
    // Colonne 2 - Hydraulique
    ctx.font = 'bold 10px Arial';
    ctx.fillText('HYDRAULIQUE:', col2X, startY);
    ctx.font = '10px Arial';
    ctx.fillText(`Débit: ${drawingData.flow_rate} m³/h`, col2X, startY + 12);
    ctx.fillText(`HMT: ${drawingData.total_head} m`, col2X, startY + 24);
    ctx.fillText(`Puissance: ${drawingData.pump_power.toFixed(1)} kW`, col2X, startY + 36);
    ctx.fillText(`Pression: ${drawingData.operating_pressure} bar`, col2X, startY + 48);
    
    // Colonne 3 - Tuyauteries
    ctx.font = 'bold 10px Arial';
    ctx.fillText('TUYAUTERIES:', col3X, startY);
    ctx.font = '10px Arial';
    ctx.fillText(`DN Asp: ${drawingData.suction_diameter}mm`, col3X, startY + 12);
    ctx.fillText(`DN Ref: ${drawingData.discharge_diameter}mm`, col3X, startY + 24);
    ctx.fillText(`Matériau: ${drawingData.pipe_material.toUpperCase()}`, col3X, startY + 36);
    ctx.fillText(`Temp: ${drawingData.temperature}°C`, col3X, startY + 48);
    
    // Ligne de conformité
    ctx.fillStyle = '#757575';
    ctx.font = '8px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Conformité: ISO 14692, NF EN 806, DTU 60.11 | Protection: ${drawingData.specifications.protection_class} | Date: ${new Date().toLocaleDateString('fr-FR')}`, cartX + 10, cartY + cartHeight - 8);
  };
  // ========================================================================
  // FONCTIONS DE DESSIN ISO PROFESSIONNELLES - CONFORMITÉ EN-ISO 14692
  // ========================================================================
  
  // Niveau d'eau dans réservoir
  const drawWaterLevel = (ctx, x, y, width, height) => {
    // Niveau d'eau (60% du réservoir)
    ctx.fillStyle = '#2196f3';
    ctx.fillRect(x, y + height * 0.4, width, height * 0.6);
    
    // Ligne de niveau
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y + height * 0.4);
    ctx.lineTo(x + width, y + height * 0.4);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Label niveau
    ctx.fillStyle = '#1976d2';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Niveau', x + width + 5, y + height * 0.4);
  };
  
  // Crépine avancée conforme ISO
  const drawAdvancedStrainer = (ctx, x, y) => {
    // Corps de crépine
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 2;
    
    // Grille
    ctx.beginPath();
    ctx.rect(x - 15, y - 10, 30, 20);
    ctx.stroke();
    
    // Barreaux de grille
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 10 + i * 5, y - 10);
      ctx.lineTo(x - 10 + i * 5, y + 10);
      ctx.stroke();
    }
    
    // Flèche d'entrée
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 25, y);
    ctx.lineTo(x - 15, y);
    ctx.moveTo(x - 20, y - 5);
    ctx.lineTo(x - 15, y);
    ctx.lineTo(x - 20, y + 5);
    ctx.stroke();
    
    // Label
    ctx.fillStyle = '#37474f';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CRÉPINE', x, y + 25);
  };
  
  // Annotations de tuyauterie
  const drawPipeAnnotation = (ctx, x, y, text, type = 'aspiration') => {
    const color = type === 'aspiration' ? '#ff9800' : '#4caf50';
    
    // Fond annotation
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 20, y - 10, 40, 15);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 20, y - 10, 40, 15);
    
    // Texte
    ctx.fillStyle = color;
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y - 2);
  };
  
  // Flèche de débit ISO
  const drawFlowArrow = (ctx, x, y, direction = 'right') => {
    ctx.strokeStyle = '#1976d2';
    ctx.fillStyle = '#1976d2';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    switch (direction) {
      case 'right':
        ctx.moveTo(x - 10, y);
        ctx.lineTo(x + 10, y);
        ctx.moveTo(x + 5, y - 5);
        ctx.lineTo(x + 10, y);
        ctx.lineTo(x + 5, y + 5);
        break;
      case 'up':
        ctx.moveTo(x, y + 10);
        ctx.lineTo(x, y - 10);
        ctx.moveTo(x - 5, y - 5);
        ctx.lineTo(x, y - 10);
        ctx.lineTo(x + 5, y - 5);
        break;
      case 'down':
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x, y + 10);
        ctx.moveTo(x - 5, y + 5);
        ctx.lineTo(x, y + 10);
        ctx.lineTo(x + 5, y + 5);
        break;
    }
    ctx.stroke();
  };
  
  // Manomètre ISO
  const drawISOPressureGauge = (ctx, x, y, type = 'asp') => {
    // Cadran
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Aiguille
    ctx.strokeStyle = '#f44336';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 8, y - 8);
    ctx.stroke();
    
    // Label
    ctx.fillStyle = '#424242';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(type.toUpperCase(), x, y + 25);
    
    // Raccordement
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 15);
    ctx.lineTo(x, y + 20);
    ctx.stroke();
  };
  
  // Pompe ISO avec statut
  const drawISOPump = (ctx, x, y, label, status = 'service') => {
    // Corps de pompe - cercle principal
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, 2 * Math.PI);
    ctx.fillStyle = status === 'standby' ? '#fff3e0' : '#e3f2fd';
    ctx.fill();
    ctx.strokeStyle = status === 'standby' ? '#ff9800' : '#1976d2';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Volute (spirale de pompe centrifuge)
    ctx.beginPath();
    ctx.strokeStyle = status === 'standby' ? '#ff9800' : '#1976d2';
    ctx.lineWidth = 2;
    ctx.arc(x, y, 20, 0, Math.PI * 1.5);
    ctx.stroke();
    
    // Roue (impeller)
    ctx.beginPath();
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * 15, y + Math.sin(angle) * 15);
    }
    ctx.stroke();
    
    // Flèche de rotation
    ctx.strokeStyle = status === 'standby' ? '#ff9800' : '#1976d2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 22, Math.PI * 0.2, Math.PI * 0.8);
    ctx.moveTo(x + 15, y - 15);
    ctx.lineTo(x + 10, y - 20);
    ctx.lineTo(x + 20, y - 10);
    ctx.stroke();
    
    // Label avec statut
    ctx.fillStyle = status === 'standby' ? '#f57f17' : '#1565c0';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - 45);
    ctx.font = '10px Arial';
    ctx.fillText(status.toUpperCase(), x, y - 32);
    
    // Symbole électrique
    ctx.fillStyle = '#424242';
    ctx.font = '8px Arial';
    ctx.fillText('M', x, y + 5);
    
    // Connexions hydrauliques
    drawPumpConnection(ctx, x - 30, y, 'suction');
    drawPumpConnection(ctx, x + 30, y, 'discharge');
  };
  
  // Clapet anti-retour ISO
  const drawISOCheckValve = (ctx, x, y) => {
    // Corps du clapet
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 15, y - 10);
    ctx.lineTo(x + 15, y - 10);
    ctx.lineTo(x + 15, y + 10);
    ctx.lineTo(x - 15, y + 10);
    ctx.closePath();
    ctx.stroke();
    
    // Clapet (triangle)
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 8);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x - 8, y + 8);
    ctx.closePath();
    ctx.fill();
    
    // Flèche de sens
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x + 5, y);
    ctx.moveTo(x + 2, y - 3);
    ctx.lineTo(x + 5, y);
    ctx.lineTo(x + 2, y + 3);
    ctx.stroke();
    
    // Label
    ctx.fillStyle = '#424242';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NR', x, y + 25);
  };
  
  // Vanne ISO
  const drawISOValve = (ctx, x, y, type = 'isolement') => {
    // Corps de vanne
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 12);
    ctx.lineTo(x + 12, y + 12);
    ctx.moveTo(x + 12, y - 12);
    ctx.lineTo(x - 12, y + 12);
    ctx.stroke();
    
    // Cercle
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Volant de manœuvre
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - 15);
    ctx.lineTo(x, y - 25);
    ctx.moveTo(x - 5, y - 25);
    ctx.lineTo(x + 5, y - 25);
    ctx.stroke();
    
    // Label
    ctx.fillStyle = '#424242';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(type.substring(0, 3).toUpperCase(), x, y + 30);
  };
  
  // Débitmètre ISO
  const drawISOFlowMeter = (ctx, x, y) => {
    // Corps du débitmètre
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x - 20, y - 10, 40, 20);
    ctx.stroke();
    
    // Afficheur
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(x - 15, y - 5, 30, 10);
    
    // Roue à aubes (indicatif)
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8);
    }
    ctx.stroke();
    
    // Flèche de débit
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 25, y);
    ctx.lineTo(x + 35, y);
    ctx.moveTo(x + 32, y - 3);
    ctx.lineTo(x + 35, y);
    ctx.lineTo(x + 32, y + 3);
    ctx.stroke();
    
    // Label
    ctx.fillStyle = '#424242';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DÉBIT', x, y + 25);
  };
  
  // Coffret électrique ISO
  const drawISOControlPanel = (ctx, x, y, totalPumps, pumpsInService) => {
    const width = 80;
    const height = 100;
    
    // Boîtier principal
    ctx.fillStyle = '#eceff1';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Porte avec charnières
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    ctx.lineTo(x + 5, y + 10);
    ctx.moveTo(x, y + height - 10);
    ctx.lineTo(x + 5, y + height - 10);
    ctx.stroke();
    
    // Symbole électrique principal
    ctx.fillStyle = '#1976d2';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚡', x + width/2, y + 20);
    
    // Voyants LED pour chaque pompe
    for (let i = 0; i < totalPumps; i++) {
      const ledX = x + 15 + (i * 20);
      const ledY = y + 30;
      const isActive = i < pumpsInService;
      
      ctx.beginPath();
      ctx.arc(ledX, ledY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = isActive ? '#4caf50' : '#ffeb3b';
      ctx.fill();
      ctx.strokeStyle = '#424242';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Label pompe
      ctx.fillStyle = '#424242';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`P${i+1}`, ledX, ledY + 15);
    }
    
    // Boutons de commande
    ctx.fillStyle = '#f44336';
    ctx.fillRect(x + 10, y + 50, 15, 10);
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(x + 30, y + 50, 15, 10);
    ctx.fillStyle = '#2196f3';
    ctx.fillRect(x + 50, y + 50, 15, 10);
    
    // Écran de contrôle
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + 10, y + 65, 60, 20);
    ctx.fillStyle = '#4caf50';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AUTOMATIQUE', x + 40, y + 72);
    ctx.fillText(`${pumpsInService}/${totalPumps} ACT`, x + 40, y + 82);
    
    // Indice de protection
    ctx.fillStyle = '#666';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('IP65', x + width/2, y + height - 5);
    
    // Label
    ctx.fillStyle = '#455a64';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('COFFRET', x + width/2, y - 10);
    ctx.fillText('COMMANDE', x + width/2, y + height + 15);
  };
  
  // Dimensions et cotation
  const drawDimensions = (ctx, x1, y1, x2, y2) => {
    ctx.strokeStyle = '#9e9e9e';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // Ligne de cote horizontale
    ctx.beginPath();
    ctx.moveTo(x1, y1 + 50);
    ctx.lineTo(x2, y1 + 50);
    ctx.stroke();
    
    // Flèches de cote
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x1, y1 + 50);
    ctx.lineTo(x1 + 5, y1 + 45);
    ctx.lineTo(x1 + 5, y1 + 55);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x2, y1 + 50);
    ctx.lineTo(x2 - 5, y1 + 45);
    ctx.lineTo(x2 - 5, y1 + 55);
    ctx.closePath();
    ctx.fill();
    
    // Cote
    ctx.fillStyle = '#424242';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round((x2 - x1) / 10)} m`, (x1 + x2) / 2, y1 + 45);
  };

  // Schéma Surface Aspiration
  const drawSurfaceAspirationScheme = (ctx, canvas) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Dessiner bâche d'aspiration
    drawTank(ctx, 100, centerY + 100, 200, 120, 'BÂCHE ASPIRATION');
    
    // Dessiner tuyauterie d'aspiration
    drawPipe(ctx, 300, centerY + 160, centerX - 100, centerY + 160, drawingData.suction_diameter);
    drawPipe(ctx, centerX - 100, centerY + 160, centerX - 100, centerY + 20);
    
    // Dessiner pompes selon configuration
    if (drawingData.pump_configuration === 'parallel') {
      for (let i = 0; i < drawingData.pump_count; i++) {
        const pumpY = centerY - 40 + (i * 80);
        drawPump(ctx, centerX - 100, pumpY, `P${i+1}`);
        
        // Tuyauterie refoulement pour chaque pompe
        drawPipe(ctx, centerX - 70, pumpY, centerX + 50, pumpY);
        if (i === 0) {
          drawPipe(ctx, centerX + 50, pumpY, centerX + 50, centerY - 40);
        }
        if (i > 0) {
          drawPipe(ctx, centerX + 50, pumpY, centerX + 50, centerY - 40);
        }
      }
      // Collecteur principal
      drawPipe(ctx, centerX + 50, centerY - 40, centerX + 200, centerY - 40);
    } else if (drawingData.pump_configuration === 'series') {
      for (let i = 0; i < drawingData.pump_count; i++) {
        const pumpX = centerX - 100 + (i * 120);
        drawPump(ctx, pumpX, centerY - 20, `P${i+1}`);
        if (i > 0) {
          drawPipe(ctx, pumpX - 50, centerY - 20, pumpX - 30, centerY - 20);
        }
      }
      // Refoulement final
      const lastPumpX = centerX - 100 + ((drawingData.pump_count - 1) * 120);
      drawPipe(ctx, lastPumpX + 30, centerY - 20, centerX + 200, centerY - 20);
    }
    
    // Dessiner réservoir de refoulement
    drawTank(ctx, centerX + 300, centerY - 100, 150, 200, 'RÉSERVOIR');
  };

  // Schéma Surface Charge
  const drawSurfaceChargeScheme = (ctx, canvas) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Réservoir surélevé d'aspiration
    drawTank(ctx, 100, centerY - 150, 180, 100, 'RÉSERVOIR AMONT');
    
    // Tuyauterie gravitaire
    drawPipe(ctx, 280, centerY - 100, centerX - 100, centerY - 100);
    drawPipe(ctx, centerX - 100, centerY - 100, centerX - 100, centerY - 20);
    
    // Pompes en charge
    for (let i = 0; i < drawingData.pump_count; i++) {
      const pumpY = centerY - 40 + (i * 80);
      drawPump(ctx, centerX - 100, pumpY, `P${i+1}`);
      drawPipe(ctx, centerX - 70, pumpY, centerX + 50, pumpY);
    }
    
    // Collecteur et refoulement
    drawPipe(ctx, centerX + 50, centerY - 40, centerX + 200, centerY - 40);
    drawTank(ctx, centerX + 300, centerY - 120, 150, 240, 'STOCKAGE');
  };

  // Schéma Submersible
  const drawSubmersibleScheme = (ctx, canvas) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Forage
    drawWell(ctx, centerX - 150, centerY - 100, 60, 300);
    
    // Pompe submersible dans le forage
    drawSubmersiblePump(ctx, centerX - 150, centerY + 120, 'PS1');
    
    // Tuyauterie de refoulement
    drawPipe(ctx, centerX - 120, centerY + 120, centerX - 120, centerY - 100);
    drawPipe(ctx, centerX - 120, centerY - 100, centerX + 100, centerY - 100);
    
    // Réservoir de stockage
    drawTank(ctx, centerX + 200, centerY - 180, 200, 160, 'CHÂTEAU D\'EAU');
  };

  // Fonction pour dessiner une pompe
  const drawPump = (ctx, x, y, label) => {
    // Corps de pompe (cercle)
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Flèche directionnelle
    ctx.beginPath();
    ctx.moveTo(x - 15, y);
    ctx.lineTo(x + 15, y);
    ctx.moveTo(x + 10, y - 5);
    ctx.lineTo(x + 15, y);
    ctx.lineTo(x + 10, y + 5);
    ctx.stroke();
    
    // Label
    ctx.fillStyle = '#1f2937';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - 35);
  };

  // Fonction pour dessiner un réservoir
  const drawTank = (ctx, x, y, width, height, label) => {
    // Rectangle du réservoir
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Niveau de liquide
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(x + 5, y + height * 0.3, width - 10, height * 0.6);
    
    // Label
    ctx.fillStyle = '#1f2937';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + width/2, y - 10);
  };

  // Fonction pour dessiner un forage
  const drawWell = (ctx, x, y, width, height) => {
    // Corps du forage
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    
    // Niveau d'eau
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(x + 5, y + height * 0.6, width - 10, height * 0.4);
    
    // Label
    ctx.fillStyle = '#1f2937';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FORAGE', x + width/2, y - 15);
  };

  // Fonction pour dessiner pompe submersible
  const drawSubmersiblePump = (ctx, x, y, label) => {
    // Corps cylindrique
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x - 15, y - 30, 30, 60);
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 15, y - 30, 30, 60);
    
    // Moteur (partie haute)
    ctx.fillStyle = '#374151';
    ctx.fillRect(x - 12, y - 30, 24, 20);
    
    // Label
    ctx.fillStyle = '#1f2937';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + 25, y);
  };

  // Fonction pour dessiner tuyauterie
  const drawPipe = (ctx, x1, y1, x2, y2, diameter) => {
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = diameter ? Math.max(2, diameter / 20) : 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Indication de diamètre
    if (diameter && drawingData.show_dimensions) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      ctx.fillStyle = '#1f2937';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`DN${diameter}`, midX, midY - 8);
    }
  };

  // Ajouter accessoires selon configuration
  const addAccessories = (ctx, canvas) => {
    if (drawingData.accessories.pressure_gauge) {
      addPressureGauge(ctx, canvas.width/2 + 120, canvas.height/2 - 60);
    }
    
    if (drawingData.accessories.check_valve) {
      addCheckValve(ctx, canvas.width/2, canvas.height/2 - 40);
    }
    
    if (drawingData.accessories.isolation_valve) {
      addIsolationValve(ctx, canvas.width/2 + 80, canvas.height/2 - 40);
    }
    
    if (drawingData.accessories.control_panel) {
      addControlPanel(ctx, canvas.width/2 + 300, canvas.height/2 - 200);
    }
  };

  // Manomètre
  const addPressureGauge = (ctx, x, y) => {
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#1f2937';
    ctx.stroke();
    
    // Aiguille
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 8, y - 8);
    ctx.stroke();
    
    ctx.fillStyle = '#1f2937';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MAN', x, y + 25);
  };

  // Clapet anti-retour
  const addCheckValve = (ctx, x, y) => {
    // Triangle clapet
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 10);
    ctx.lineTo(x + 10, y);
    ctx.lineTo(x - 10, y + 10);
    ctx.closePath();
    ctx.fillStyle = '#374151';
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#1f2937';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CAR', x, y + 20);
  };

  // Vanne d'isolement
  const addIsolationValve = (ctx, x, y) => {
    // Rectangle vanne
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(x - 8, y - 8, 16, 16);
    ctx.strokeStyle = '#1f2937';
    ctx.strokeRect(x - 8, y - 8, 16, 16);
    
    // Volant
    ctx.beginPath();
    ctx.arc(x, y - 15, 6, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.fillStyle = '#1f2937';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('V.I.', x, y + 20);
  };

  // Coffret de commande
  const addControlPanel = (ctx, x, y) => {
    // Coffret
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(x, y, 60, 80);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 60, 80);
    
    // Éléments internes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 10, y + 10, 15, 8);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x + 35, y + 10, 15, 8);
    
    ctx.fillStyle = '#1f2937';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('COFFRET', x + 30, y - 10);
    ctx.fillText('COMMANDE', x + 30, y + 95);
  };

  // Dimensions professionnelles
  const addDimensionsProfessional = (ctx, canvas) => {
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    // Lignes de cotes principales
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Cote longueur aspiration
    ctx.beginPath();
    ctx.moveTo(100, centerY + 200);
    ctx.lineTo(centerX - 100, centerY + 200);
    ctx.stroke();
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`L.asp = ${drawingData.dimensions.suction_length}m`, centerX/2, centerY + 215);
    
    // Cote longueur refoulement
    ctx.beginPath();
    ctx.moveTo(centerX + 50, centerY + 200);
    ctx.lineTo(centerX + 200, centerY + 200);
    ctx.stroke();
    
    ctx.fillText(`L.ref = ${drawingData.dimensions.discharge_length}m`, centerX + 125, centerY + 215);
    
    ctx.setLineDash([]);
  };

  // Labels professionnels
  const addLabelsProfessional = (ctx, canvas) => {
    ctx.fillStyle = '#1f2937';
    ctx.font = '12px Arial';
    
    // Étiquettes techniques selon type d'installation
    const labels = getInstallationLabels();
    labels.forEach(label => {
      ctx.textAlign = 'left';
      ctx.fillText(label.text, label.x, label.y);
    });
  };

  // Obtenir les étiquettes selon l'installation
  const getInstallationLabels = () => {
    const labels = [];
    
    labels.push({
      text: `Débit: ${drawingData.flow_rate} m³/h`,
      x: 50,
      y: 50
    });
    
    labels.push({
      text: `HMT: ${drawingData.total_head} m`,
      x: 50,
      y: 70
    });
    
    labels.push({
      text: `Configuration: ${drawingData.pump_count} pompe(s) en ${drawingData.pump_configuration}`,
      x: 50,
      y: 90
    });
    
    return labels;
  };

  // Cartouche technique
  const addTechnicalCartouche = (ctx, canvas) => {
    const cartX = canvas.width - 300;
    const cartY = canvas.height - 120;
    
    // Cadre cartouche
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(cartX, cartY, 280, 100);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    ctx.strokeRect(cartX, cartY, 280, 100);
    
    // Titre
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('SCHÉMA HYDRAULIQUE - ECO-PUMP AFRIK', cartX + 10, cartY + 20);
    
    // Informations techniques
    ctx.font = '10px Arial';
    ctx.fillText(`Installation: ${drawingData.installation_type.replace('_', ' ').toUpperCase()}`, cartX + 10, cartY + 40);
    ctx.fillText(`Pompes: ${drawingData.pump_count} x ${drawingData.pump_configuration}`, cartX + 10, cartY + 55);
    ctx.fillText(`DN Aspiration: ${drawingData.suction_diameter}mm`, cartX + 10, cartY + 70);
    ctx.fillText(`DN Refoulement: ${drawingData.discharge_diameter}mm`, cartX + 10, cartY + 85);
    
    // Date et version
    const today = new Date().toLocaleDateString('fr-FR');
    ctx.fillText(`Date: ${today}`, cartX + 180, cartY + 85);
    ctx.fillText('Version: 3.0 PRO', cartX + 180, cartY + 70);
  };

  // Schémas supplémentaires pour autres installations
  const drawForageScheme = (ctx, canvas) => {
    drawSubmersibleScheme(ctx, canvas); // Utilise le schéma submersible comme base
    
    // Ajouter manifold spécifique au forage
    if (drawingData.accessories.manifold) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      addManifold(ctx, centerX - 50, centerY - 150);
    }
  };

  const drawSurpresseurScheme = (ctx, canvas) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Réservoir à membrane
    drawPressureTank(ctx, centerX - 200, centerY - 100, 100, 200, 'RÉSERVOIR\nÀ MEMBRANE');
    
    // Groupe surpresseur
    for (let i = 0; i < drawingData.pump_count; i++) {
      const pumpY = centerY - 40 + (i * 60);
      drawPump(ctx, centerX, pumpY, `SP${i+1}`);
    }
    
    // Collecteur
    drawPipe(ctx, centerX + 30, centerY - 40, centerX + 150, centerY - 40);
    drawTank(ctx, centerX + 200, centerY - 120, 150, 240, 'RÉSEAU');
  };

  const drawIncendieScheme = (ctx, canvas) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Réserve d'eau
    drawTank(ctx, 100, centerY - 100, 200, 200, 'RÉSERVE\nINCENDIE');
    
    // Pompes principales et de secours
    drawPump(ctx, centerX - 100, centerY - 50, 'PRINC.');
    drawPump(ctx, centerX - 100, centerY + 30, 'SECOURS');
    drawPump(ctx, centerX - 100, centerY + 110, 'JOCKEY');
    
    // Collecteur incendie
    drawPipe(ctx, centerX - 70, centerY, centerX + 100, centerY);
    
    // Réseau sprinklers
    drawIncendieNetwork(ctx, centerX + 150, centerY - 100);
  };

  // Réservoir sous pression
  const drawPressureTank = (ctx, x, y, width, height, label) => {
    // Corps cylindrique
    ctx.beginPath();
    ctx.ellipse(x + width/2, y, width/2, 20, 0, 0, 2 * Math.PI);
    ctx.fillStyle = '#e5e7eb';
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
    
    // Base
    ctx.beginPath();
    ctx.ellipse(x + width/2, y + height, width/2, 20, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Membrane (ligne ondulée)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + height/2);
    for (let i = 0; i < width - 20; i += 20) {
      ctx.quadraticCurveTo(x + 10 + i + 10, y + height/2 - 15, x + 10 + i + 20, y + height/2);
    }
    ctx.stroke();
    
    // Label
    ctx.fillStyle = '#1f2937';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    const lines = label.split('\n');
    lines.forEach((line, index) => {
      ctx.fillText(line, x + width/2, y - 20 + (index * 12));
    });
  };

  // Manifold de forage
  const addManifold = (ctx, x, y) => {
    // Corps du manifold
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(x, y, 80, 40);
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 80, 40);
    
    // Connexions multiples
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(x + 20 + (i * 20), y - 5, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#6b7280';
      ctx.fill();
      ctx.stroke();
    }
    
    ctx.fillStyle = '#1f2937';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MANIFOLD', x + 40, y + 55);
  };

  // Réseau incendie
  const drawIncendieNetwork = (ctx, x, y) => {
    // Tuyauterie principale
    drawPipe(ctx, x, y, x + 200, y);
    drawPipe(ctx, x + 100, y, x + 100, y + 100);
    drawPipe(ctx, x + 50, y + 100, x + 150, y + 100);
    
    // Sprinklers
    for (let i = 0; i < 4; i++) {
      const sprinklerX = x + 50 + (i * 33);
      drawSprinkler(ctx, sprinklerX, y + 100);
    }
    
    ctx.fillStyle = '#1f2937';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('RÉSEAU SPRINKLERS', x + 100, y - 15);
  };

  // Sprinkler
  const drawSprinkler = (ctx, x, y) => {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#1f2937';
    ctx.stroke();
    
    // Diffuseur
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 10);
    ctx.lineTo(x + 8, y + 10);
    ctx.stroke();
  };

  // Fonctions de dessin spécialisées
  const drawBacheEnterree = (ctx, canvas) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Dessiner la bâche enterrée
    ctx.fillStyle = '#bfdbfe';
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 3;
    
    const bacheWidth = 200;
    const bacheHeight = 150;
    const bacheX = centerX - bacheWidth / 2;
    const bacheY = centerY - bacheHeight / 2;
    
    ctx.fillRect(bacheX, bacheY, bacheWidth, bacheHeight);
    ctx.strokeRect(bacheX, bacheY, bacheWidth, bacheHeight);
    
    // Ajouter le niveau d'eau
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(bacheX + 5, bacheY + 30, bacheWidth - 10, bacheHeight - 35);
    
    // Dessiner la pompe
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(centerX, bacheY + 100, 20, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  };

  const drawForage = (ctx, canvas) => {
    const centerX = canvas.width / 2;
    
    // Dessiner le forage (tuyau vertical)
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(centerX, 50);
    ctx.lineTo(centerX, canvas.height - 50);
    ctx.stroke();
    
    // Pompe immergée
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(centerX - 15, canvas.height - 200, 30, 80);
    ctx.strokeRect(centerX - 15, canvas.height - 200, 30, 80);
  };

  const drawChateauEau = (ctx, canvas) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Dessiner le château d'eau
    ctx.fillStyle = '#d1d5db';
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    
    // Support
    ctx.beginPath();
    ctx.moveTo(centerX - 50, centerY + 100);
    ctx.lineTo(centerX, centerY - 50);
    ctx.lineTo(centerX + 50, centerY + 100);
    ctx.stroke();
    
    // Réservoir
    ctx.beginPath();
    ctx.arc(centerX, centerY - 50, 80, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  };

  const drawEquipments = (ctx) => {
    // Dessiner les pompes
    drawingData.pumps.forEach(pump => {
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(pump.position.x || 100, pump.position.y || 100, 15, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });
    
    // Dessiner les suppresseurs
    drawingData.suppressors.forEach(suppressor => {
      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(suppressor.position.x - 20, suppressor.position.y - 15, 40, 30);
    });
  };

  const addLabels = (ctx, canvas) => {
    ctx.fillStyle = '#1f2937';
    ctx.font = '12px Arial';
    
    // Étiquette pour la bâche
    if (drawingData.installation_type === 'bache_enterree') {
      ctx.fillText('Bâche enterrée', canvas.width / 2 - 40, canvas.height / 2 + 100);
    }
    
    // Étiquettes pour les équipements
    drawingData.pumps.forEach((pump, index) => {
      ctx.fillText(`Pompe ${index + 1}`, pump.position.x || 70, pump.position.y || 90);
    });
  };

  const addDimensions = (ctx, canvas) => {
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Lignes de cote pour la bâche
    if (drawingData.installation_type === 'bache_enterree') {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Ligne horizontale
      ctx.beginPath();
      ctx.moveTo(centerX - 120, centerY + 120);
      ctx.lineTo(centerX + 120, centerY + 120);
      ctx.stroke();
      
      // Cotes
      ctx.font = '10px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('10m', centerX - 10, centerY + 135);
    }
    
    ctx.setLineDash([]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('🔄 Chargement des données...', { BACKEND_URL, API });
    try {
      const [fluidsRes, materialsRes, fittingsRes, historyRes] = await Promise.all([
        axios.get(`${API}/fluids`),
        axios.get(`${API}/pipe-materials`),
        axios.get(`${API}/fittings`),
        axios.get(`${API}/history`)
      ]);
      
      console.log('✅ Données reçues:', {
        fluids: fluidsRes.data.fluids?.length || 0,
        materials: materialsRes.data.materials?.length || 0,
        fittings: fittingsRes.data.fittings?.length || 0,
        history: historyRes.data?.length || 0
      });
      
      setFluids(fluidsRes.data.fluids || []);
      setPipeMaterials(materialsRes.data.materials || []);
      setFittings(fittingsRes.data.fittings || []);
      setHistory(historyRes.data || []);
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      console.error('❌ Détails erreur:', error.response?.status, error.response?.data);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'npshd':
        return <NPSHdCalculator fluids={fluids} pipeMaterials={pipeMaterials} fittings={fittings} />;
      case 'hmt':
        return <HMTCalculator fluids={fluids} pipeMaterials={pipeMaterials} fittings={fittings} />;
      case 'performance':
        return <PerformanceAnalysis fluids={fluids} pipeMaterials={pipeMaterials} />;
      case 'formulas':
        return <FormulaDatabase />;
      case 'chemical_compatibility':
        return <ChemicalCompatibility />;
      case 'audit':
        return <AuditSystem />;
      case 'expert':
        return <ExpertCalculator fluids={fluids} pipeMaterials={pipeMaterials} fittings={fittings} />;
      case 'reservoir':
        return <ReservoirCalculator />;
      case 'solar':
        return <SolarExpertSystem />;
      case 'drawing':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="container mx-auto p-6">
              {/* En-tête Expert Ultra */}
              <div className="bg-gradient-to-r from-slate-800 to-blue-900 rounded-xl p-6 mb-6 text-white">
                <h1 className="text-4xl font-bold mb-2">
                  <span className="mr-3">⚙️</span>
                  GÉNÉRATEUR HYDRAULIQUE EXPERT IA
                </h1>
                <p className="text-blue-100 text-lg">
                  Interface Ultra-Intelligente | Auto-Calculs | Export CAD/PDF | Conformité ISO-EN-DTU
                </p>
                <div className="mt-3 flex items-center space-x-4 text-sm">
                  <span className="bg-green-500 px-2 py-1 rounded">🟢 IA ACTIVE</span>
                  <span className="bg-blue-500 px-2 py-1 rounded">📐 CAD EXPERT</span>
                  <span className="bg-purple-500 px-2 py-1 rounded">🔬 NORMES ISO</span>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Panel Configuration ULTRA-INTELLIGENT */}
                <div className="xl:col-span-1 space-y-4">
                  
                  {/* Configuration Principale Intelligente */}
                  <div className="bg-white rounded-xl shadow-xl p-5 border-l-4 border-blue-600">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <span className="text-blue-600 mr-2">🏗️</span>
                      CONFIGURATION SYSTÈME
                      <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded">AUTO</span>
                    </h3>
                    
                    {/* Type d'installation avec preview */}
                    <div className="mb-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        TYPE D'INSTALLATION *
                      </label>
                      <select
                        value={drawingData.installation_type}
                        onChange={(e) => handleDrawingInputChange('installation_type', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-sm font-medium"
                      >
                        <option value="surface_aspiration">🏗️ Surface Aspiration (Bâche)</option>
                        <option value="surface_charge">🏗️ Surface Charge (Gravitaire)</option>
                        <option value="submersible">🕳️ Pompe de Relevage</option>
                        <option value="forage">⚡ Station Forage</option>
                        <option value="surpresseur">🔧 Surpresseur (Pression)</option>
                        <option value="incendie">🚒 Incendie (Sécurité)</option>
                      </select>
                      
                      {/* Indicateurs intelligents */}
                      <div className="mt-2 flex space-x-2 text-xs">
                        <span className={`px-2 py-1 rounded ${drawingData.suction_height > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {drawingData.suction_height > 0 ? '⚠️ ASPIRATION' : '✅ EN CHARGE'}
                        </span>
                        <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">
                          P.Max: {drawingData.operating_pressure}bar
                        </span>
                      </div>
                    </div>

                    {/* Configuration pompes VRAIMENT intelligente */}
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        CONFIGURATION POMPES
                      </label>
                      
                      {/* Nombre de pompes avec logique INTELLIGENTE */}
                      <div className="grid grid-cols-1 gap-2 mb-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">NOMBRE TOTAL DE POMPES</label>
                          <select
                            value={drawingData.pump_count}
                            onChange={(e) => handleDrawingInputChange('pump_count', parseInt(e.target.value))}
                            className="w-full p-2 border border-slate-300 rounded text-sm focus:border-blue-500"
                          >
                            {(() => {
                              // LOGIQUE INTELLIGENTE selon type d'installation
                              switch(drawingData.installation_type) {
                                case 'forage':
                                  return [1].map(n => (
                                    <option key={n} value={n}>{n} pompe submersible</option>
                                  ));
                                case 'incendie':
                                  return [1,2,3].map(n => (
                                    <option key={n} value={n}>{n} pompe{n>1?'s':''} incendie</option>
                                  ));
                                case 'surpresseur':
                                  return [1,2,3,4].map(n => (
                                    <option key={n} value={n}>{n} pompe{n>1?'s':''} surpresseur</option>
                                  ));
                                case 'submersible':
                                  return [1,2,3].map(n => (
                                    <option key={n} value={n}>{n} pompe{n>1?'s':''} de relevage</option>
                                  ));
                                default:
                                  // Surface aspiration - choix libre jusqu'à 4
                                  return [1,2,3,4].map(n => (
                                    <option key={n} value={n}>{n} pompe{n>1?'s':''}</option>
                                  ));
                              }
                            })()}
                          </select>
                          {/* Indication contrainte */}
                          {drawingData.installation_type === 'forage' && (
                            <p className="text-xs text-orange-600 mt-1">⚠️ Forage: 1 pompe submersible uniquement</p>
                          )}
                          {drawingData.installation_type === 'incendie' && (
                            <p className="text-xs text-red-600 mt-1">🔥 Incendie: 3 pompes réglementaires (2+1 secours)</p>
                          )}
                          {drawingData.installation_type === 'surpresseur' && (
                            <p className="text-xs text-blue-600 mt-1">⚡ Surpresseur: 4 pompes standard (3+1 secours)</p>
                          )}
                        </div>
                      </div>

                      {/* Configuration série/parallèle SEULEMENT si >= 2 pompes */}
                      {drawingData.pump_count >= 2 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">POMPES EN SERVICE</label>
                            <input
                              type="number"
                              min="1"
                              max={drawingData.pump_count}
                              value={drawingData.pumps_in_service || Math.max(1, drawingData.pump_count - 1)}
                              onChange={(e) => handleDrawingInputChange('pumps_in_service', parseInt(e.target.value) || 1)}
                              className="w-full p-2 border border-slate-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">POMPES DE SECOURS</label>
                            <input
                              type="number"
                              min="0"
                              max={drawingData.pump_count - 1}
                              value={drawingData.pump_count - (drawingData.pumps_in_service || Math.max(1, drawingData.pump_count - 1))}
                              onChange={(e) => {
                                const standby = parseInt(e.target.value) || 0;
                                handleDrawingInputChange('pumps_in_service', drawingData.pump_count - standby);
                              }}
                              className="w-full p-2 border border-slate-300 rounded text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {/* Configuration série/parallèle SEULEMENT pour les pompes en service */}
                      {(drawingData.pumps_in_service || 1) >= 2 && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">CONFIGURATION POMPES EN SERVICE</label>
                          <select
                            value={drawingData.pump_configuration}
                            onChange={(e) => handleDrawingInputChange('pump_configuration', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded text-sm focus:border-blue-500"
                          >
                            <option value="parallel">🔀 Parallèle (Débit additionné)</option>
                            <option value="series">🔗 Série (HMT additionné)</option>
                          </select>
                        </div>
                      )}

                      {/* Résumé intelligent de la configuration */}
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs text-blue-700 mb-1">CONFIGURATION RÉSULTANTE</div>
                        <div className="text-sm font-bold text-blue-800">
                          {drawingData.pumps_in_service} pompe{drawingData.pumps_in_service > 1 ? 's' : ''} en service
                          {drawingData.pumps_in_service >= 2 && ` (${drawingData.pump_configuration})`}
                          {(drawingData.pump_count - drawingData.pumps_in_service) > 0 && 
                            ` + ${drawingData.pump_count - drawingData.pumps_in_service} secours`}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {drawingData.pump_configuration === 'parallel' && drawingData.pumps_in_service >= 2 && 
                            `Débit unitaire: ${drawingData.flow_rate}m³/h × ${drawingData.pumps_in_service} = ${(drawingData.pumps_in_service * drawingData.flow_rate).toFixed(0)}m³/h total`}
                          {drawingData.pump_configuration === 'series' && drawingData.pumps_in_service >= 2 && 
                            `HMT unitaire: ${drawingData.total_head}m × ${drawingData.pumps_in_service} = ${(drawingData.pumps_in_service * drawingData.total_head).toFixed(0)}m total`}
                          {drawingData.pumps_in_service === 1 && 
                            `Pompe unique: ${drawingData.flow_rate}m³/h - ${drawingData.total_head}m`}
                        </div>
                      </div>
                    </div>

                    {/* Paramètres hydrauliques avec calculs auto */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">DÉBIT (m³/h)</label>
                        <input
                          type="number"
                          value={drawingData.flow_rate}
                          onChange={(e) => handleDrawingInputChange('flow_rate', parseFloat(e.target.value) || 0)}
                          className="w-full p-2 border border-slate-300 rounded text-sm focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">HMT (m)</label>
                        <input
                          type="number"
                          value={drawingData.total_head}
                          onChange={(e) => handleDrawingInputChange('total_head', parseFloat(e.target.value) || 0)}
                          className={`w-full p-2 border rounded text-sm focus:border-blue-500 ${
                            drawingData.installation_type === 'forage' 
                              ? 'border-green-300 bg-green-50 text-green-700 cursor-not-allowed' 
                              : 'border-slate-300'
                          }`}
                          readOnly={drawingData.installation_type === 'forage'}
                          placeholder={drawingData.installation_type === 'forage' ? 'Auto-calculé' : ''}
                        />
                        {drawingData.installation_type === 'forage' && (
                          <div className="text-xs text-green-600 mt-1">🔒 Auto-calculé via PARAMÈTRES FORAGE</div>
                        )}
                      </div>
                    </div>

                    {/* Puissance auto-calculée */}
                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                      <div className="text-xs text-blue-700 mb-1">PUISSANCE AUTO-CALCULÉE</div>
                      <div className="text-lg font-bold text-blue-800">{drawingData.pump_power.toFixed(1)} kW</div>
                      <div className="text-xs text-blue-600">Rendement global estimé: 75%</div>
                    </div>
                  </div>

                  {/* Tuyauteries Intelligentes CONDITIONNELLES */}
                  <div className="bg-white rounded-xl shadow-xl p-5 border-l-4 border-green-600">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <span className="text-green-600 mr-2">🔧</span>
                      TUYAUTERIES & DIMENSIONS
                      <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded">INTELLIGENT</span>
                    </h3>
                    
                    {/* Diamètres - CONDITIONNELS selon installation */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* DN ASPIRATION seulement si nécessaire */}
                      {drawingData.show_suction_fields && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">DN ASPIRATION</label>
                          <input
                            type="number"
                            value={drawingData.suction_diameter}
                            onChange={(e) => handleDrawingInputChange('suction_diameter', parseInt(e.target.value) || 100)}
                            className="w-full p-2 border border-slate-300 rounded text-sm font-medium"
                          />
                          <div className="text-xs text-green-600 mt-1">V ≈ {(drawingData.flow_rate / 3600 / (Math.PI * (drawingData.suction_diameter/2000)**2)).toFixed(1)} m/s</div>
                        </div>
                      )}
                      
                      {/* DN REFOULEMENT - Sauf pour forage (déjà dans PARAMÈTRES FORAGE) */}
                      {drawingData.installation_type !== 'forage' && (
                        <div className={drawingData.show_suction_fields ? '' : 'col-span-2'}>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">DN REFOULEMENT</label>
                          <input
                            type="number"
                            value={drawingData.discharge_diameter}
                            onChange={(e) => handleDrawingInputChange('discharge_diameter', parseInt(e.target.value) || 80)}
                            className="w-full p-2 border border-slate-300 rounded text-sm font-medium"
                          />
                          <div className="text-xs text-green-600 mt-1">V ≈ {(drawingData.flow_rate / 3600 / (Math.PI * (drawingData.discharge_diameter/2000)**2)).toFixed(1)} m/s</div>
                        </div>
                      )}
                    </div>

                    {/* Longueurs - CONDITIONNELLES */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* Longueur aspiration SEULEMENT si surface */}
                      {drawingData.show_suction_fields && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">L.ASPIRATION (m)</label>
                          <input
                            type="number"
                            value={drawingData.dimensions.suction_length}
                            onChange={(e) => handleDrawingInputChange('dimensions', {
                              ...drawingData.dimensions,
                              suction_length: parseFloat(e.target.value) || 20
                            })}
                            className="w-full p-2 border border-slate-300 rounded text-sm"
                          />
                        </div>
                      )}
                      
                      {/* Longueur refoulement SEULEMENT si pas forage */}
                      {drawingData.installation_type !== 'forage' && (
                        <div className={drawingData.show_suction_fields ? '' : 'col-span-2'}>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            {drawingData.installation_type.includes('submersible') 
                              ? 'PROFONDEUR BÂCHE (m)' 
                              : 'L.REFOULEMENT (m)'}
                          </label>
                          <input
                            type="number"
                            value={drawingData.dimensions.discharge_length}
                            onChange={(e) => handleDrawingInputChange('dimensions', {
                              ...drawingData.dimensions,
                              discharge_length: parseFloat(e.target.value) || 50
                            })}
                            className="w-full p-2 border border-slate-300 rounded text-sm"
                          />
                        </div>
                      )}
                    </div>
                    {/* CHAMPS SPÉCIFIQUES FORAGE */}
                    {drawingData.installation_type === 'forage' && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                        <h4 className="text-sm font-bold text-orange-700 mb-2">⚡ PARAMÈTRES FORAGE</h4>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">HAUTEUR CHÂTEAU D'EAU (m)</label>
                            <input
                              type="number"
                              value={drawingData.forage_specific.reservoir_height}
                              onChange={(e) => handleDrawingInputChange('forage_specific', {
                                ...drawingData.forage_specific,
                                reservoir_height: parseFloat(e.target.value) || 30
                              })}
                              className="w-full p-2 border border-orange-300 rounded text-sm focus:border-orange-500"
                              placeholder="30"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">NIVEAU DYNAMIQUE (m)</label>
                            <input
                              type="number"
                              value={drawingData.forage_specific.dynamic_level}
                              onChange={(e) => handleDrawingInputChange('forage_specific', {
                                ...drawingData.forage_specific,
                                dynamic_level: parseFloat(e.target.value) || 15
                              })}
                              className="w-full p-2 border border-orange-300 rounded text-sm focus:border-orange-500"
                              placeholder="15"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">L. REFOULEMENT (m)</label>
                            <input
                              type="number"
                              value={drawingData.forage_specific.discharge_length}
                              onChange={(e) => handleDrawingInputChange('forage_specific', {
                                ...drawingData.forage_specific,
                                discharge_length: parseFloat(e.target.value) || 100
                              })}
                              className="w-full p-2 border border-orange-300 rounded text-sm focus:border-orange-500"
                              placeholder="100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">PRESSION RÉSIDUELLE (bar)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={drawingData.forage_specific.residual_pressure}
                              onChange={(e) => handleDrawingInputChange('forage_specific', {
                                ...drawingData.forage_specific,
                                residual_pressure: parseFloat(e.target.value) || 2
                              })}
                              className="w-full p-2 border border-orange-300 rounded text-sm focus:border-orange-500"
                              placeholder="2"
                            />
                          </div>
                        </div>
                        
                        {/* DN REFOULEMENT et MATÉRIAU pour FORAGE */}
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">DN REFOULEMENT (mm)</label>
                            <input
                              type="number"
                              value={drawingData.discharge_diameter}
                              onChange={(e) => handleDrawingInputChange('discharge_diameter', parseInt(e.target.value) || 80)}
                              className="w-full p-2 border border-orange-300 rounded text-sm focus:border-orange-500"
                              placeholder="80"
                            />
                            <div className="text-xs text-green-600 mt-1">V ≈ {(drawingData.flow_rate / 3600 / (Math.PI * (drawingData.discharge_diameter/2000)**2)).toFixed(1)} m/s</div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">MATÉRIAU</label>
                            <select
                              value={drawingData.pipe_material}
                              onChange={(e) => handleDrawingInputChange('pipe_material', e.target.value)}
                              className="w-full p-2 border border-orange-300 rounded text-sm focus:border-orange-500"
                            >
                              <option value="steel">Acier</option>
                              <option value="stainless">Inox 316L</option>
                              <option value="pvc">PVC-U</option>
                              <option value="hdpe">PEHD</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* CALCUL AUTOMATIQUE HMT */}
                        <div className="bg-green-100 border border-green-300 rounded p-2">
                          <h5 className="text-xs font-bold text-green-700 mb-1">📊 CALCUL AUTOMATIQUE HMT</h5>
                          <div className="text-xs text-green-600">
                            <div>• Niveau dynamique: {drawingData.forage_specific.dynamic_level}m</div>
                            <div>• Hauteur château d'eau: {drawingData.forage_specific.reservoir_height}m</div>
                            <div>• Pertes charge (~10% long.): {Math.round(drawingData.forage_specific.discharge_length * 0.1)}m</div>
                            <div>• Pression résiduelle: {Math.round(drawingData.forage_specific.residual_pressure * 10)}m</div>
                            <div className="font-bold text-green-700 border-t pt-1 mt-1">
                              HMT CALCULÉE = {Math.round(
                                drawingData.forage_specific.dynamic_level + 
                                drawingData.forage_specific.reservoir_height + 
                                (drawingData.forage_specific.discharge_length * 0.1) + 
                                (drawingData.forage_specific.residual_pressure * 10)
                              )}m
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const calculatedHMT = Math.round(
                                drawingData.forage_specific.dynamic_level + 
                                drawingData.forage_specific.reservoir_height + 
                                (drawingData.forage_specific.discharge_length * 0.1) + 
                                (drawingData.forage_specific.residual_pressure * 10)
                              );
                              handleDrawingInputChange('total_head', calculatedHMT);
                            }}
                            className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            ⚡ APPLIQUER HMT CALCULÉE
                          </button>
                        </div>
                        
                        <p className="text-xs text-orange-600 mt-2">
                          💡 Ces valeurs seront dynamiquement appliquées sur le schéma technique
                        </p>
                      </div>
                    )}

                    {/* Matériau et fluide - Matériau masqué pour forage (déjà dans PARAMÈTRES FORAGE) */}
                    <div className={`grid gap-2 ${drawingData.installation_type === 'forage' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {drawingData.installation_type !== 'forage' && (
                        <select
                          value={drawingData.pipe_material}
                          onChange={(e) => handleDrawingInputChange('pipe_material', e.target.value)}
                          className="p-2 border border-slate-300 rounded text-sm"
                        >
                          <option value="steel">Acier</option>
                          <option value="stainless">Inox 316L</option>
                          <option value="pvc">PVC-U</option>
                          <option value="hdpe">PEHD</option>
                        </select>
                      )}
                      <input
                        type="number"
                        placeholder="Temp. °C"
                        value={drawingData.temperature}
                        onChange={(e) => handleDrawingInputChange('temperature', parseFloat(e.target.value) || 20)}
                        className="p-2 border border-slate-300 rounded text-sm"
                      />
                    </div>

                    {/* Indicateur de type d'installation */}
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                      <div className="text-xs text-blue-700">
                        <span className="font-semibold">TYPE DÉTECTÉ:</span>
                        <span className="ml-2">
                          {drawingData.installation_type.includes('forage') || drawingData.installation_type.includes('submersible')
                            ? '🕳️ Pompe immergée - Pas d\'aspiration'
                            : '🏗️ Installation de surface - Avec aspiration'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accessoires Sélectionnables Individuellement */}
                  <div className="bg-white rounded-xl shadow-xl p-5 border-l-4 border-purple-600">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <span className="text-purple-600 mr-2">🔩</span>
                      ACCESSOIRES & ÉQUIPEMENTS
                      <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">SÉLECTIONNABLES</span>
                    </h3>
                    
                    {/* Instrumentation */}
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center">
                        <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                        INSTRUMENTATION
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className={`flex items-center p-2 rounded cursor-pointer ${
                          drawingData.accessories.pressure_gauge_suction ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.pressure_gauge_suction}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              pressure_gauge_suction: e.target.checked
                            })}
                            className="rounded border-slate-300 text-blue-600 mr-2"
                          />
                          <span className="font-medium">Manomètre Aspiration</span>
                          {drawingData.accessories.pressure_gauge_suction && <span className="ml-auto text-blue-500">✓</span>}
                        </label>
                        
                        <label className={`flex items-center p-2 rounded cursor-pointer ${
                          drawingData.accessories.pressure_gauge_discharge ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.pressure_gauge_discharge}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              pressure_gauge_discharge: e.target.checked
                            })}
                            className="rounded border-slate-300 text-blue-600 mr-2"
                          />
                          <span className="font-medium">Manomètre Refoulement</span>
                          {drawingData.accessories.pressure_gauge_discharge && <span className="ml-auto text-blue-500">✓</span>}
                        </label>
                        
                        <label className={`flex items-center p-2 rounded cursor-pointer ${
                          drawingData.accessories.flow_meter ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.flow_meter}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              flow_meter: e.target.checked
                            })}
                            className="rounded border-slate-300 text-blue-600 mr-2"
                          />
                          <span className="font-medium">Débitmètre</span>
                          {drawingData.accessories.flow_meter && <span className="ml-auto text-blue-500">✓</span>}
                        </label>
                        
                        <label className={`flex items-center p-2 rounded cursor-pointer ${
                          drawingData.accessories.pressure_sensor ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.pressure_sensor}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              pressure_sensor: e.target.checked
                            })}
                            className="rounded border-slate-300 text-blue-600 mr-2"
                          />
                          <span className="font-medium">Capteur Pression</span>
                          {drawingData.accessories.pressure_sensor && <span className="ml-auto text-blue-500">✓</span>}
                        </label>
                      </div>
                    </div>

                    {/* Vannes et Robinetterie */}
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        VANNES & ROBINETTERIE
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className={`flex items-center p-2 rounded cursor-pointer ${
                          drawingData.accessories.isolation_valve_suction ? 'bg-green-50 border border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.isolation_valve_suction}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              isolation_valve_suction: e.target.checked
                            })}
                            className="rounded border-slate-300 text-green-600 mr-2"
                          />
                          <span className="font-medium">Vanne Isolement Asp.</span>
                          {drawingData.accessories.isolation_valve_suction && <span className="ml-auto text-green-500">✓</span>}
                        </label>
                        
                        <label className={`flex items-center p-2 rounded cursor-pointer ${
                          drawingData.accessories.isolation_valve_discharge ? 'bg-green-50 border border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.isolation_valve_discharge}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              isolation_valve_discharge: e.target.checked
                            })}
                            className="rounded border-slate-300 text-green-600 mr-2"
                          />
                          <span className="font-medium">Vanne Isolement Ref.</span>
                          {drawingData.accessories.isolation_valve_discharge && <span className="ml-auto text-green-500">✓</span>}
                        </label>
                        
                        <label className={`flex items-center p-2 rounded cursor-pointer ${
                          drawingData.accessories.check_valve ? 'bg-green-50 border border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.check_valve}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              check_valve: e.target.checked
                            })}
                            className="rounded border-slate-300 text-green-600 mr-2"
                          />
                          <span className="font-medium">Clapet Anti-Retour</span>
                          {drawingData.accessories.check_valve && <span className="ml-auto text-green-500">✓</span>}
                        </label>
                        
                        <label className={`flex items-center p-2 rounded cursor-pointer ${
                          drawingData.accessories.safety_valve ? 'bg-green-50 border border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.safety_valve}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              safety_valve: e.target.checked
                            })}
                            className="rounded border-slate-300 text-green-600 mr-2"
                          />
                          <span className="font-medium">Soupape Sécurité</span>
                          {drawingData.accessories.safety_valve && <span className="ml-auto text-green-500">✓</span>}
                        </label>
                      </div>
                    </div>

                    {/* Équipements Mécaniques */}
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center">
                        <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                        ÉQUIPEMENTS MÉCANIQUES
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className={`flex items-center p-2 rounded cursor-pointer ${
                          drawingData.accessories.strainer ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.strainer}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              strainer: e.target.checked
                            })}
                            className="rounded border-slate-300 text-orange-600 mr-2"
                          />
                          <span className="font-medium">Crépine/Filtre</span>
                          {drawingData.accessories.strainer && <span className="ml-auto text-orange-500">✓</span>}
                        </label>
                        
                        <label className={`flex items-center p-2 rounded cursor-pointer ${
                          drawingData.accessories.flexible_coupling ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.flexible_coupling}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              flexible_coupling: e.target.checked
                            })}
                            className="rounded border-slate-300 text-orange-600 mr-2"
                          />
                          <span className="font-medium">Raccord Flexible</span>
                          {drawingData.accessories.flexible_coupling && <span className="ml-auto text-orange-500">✓</span>}
                        </label>
                        
                        <label className={`flex items-center p-2 rounded cursor-pointer ${
                          drawingData.accessories.expansion_joint ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.expansion_joint}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              expansion_joint: e.target.checked
                            })}
                            className="rounded border-slate-300 text-orange-600 mr-2"
                          />
                          <span className="font-medium">Joint Dilatation</span>
                          {drawingData.accessories.expansion_joint && <span className="ml-auto text-orange-500">✓</span>}
                        </label>
                        
                        <label className={`flex items-center p-2 rounded cursor-pointer ${
                          drawingData.accessories.manifold ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.manifold}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              manifold: e.target.checked
                            })}
                            className="rounded border-slate-300 text-orange-600 mr-2"
                          />
                          <span className="font-medium">Manifold/Collecteur</span>
                          {drawingData.accessories.manifold && <span className="ml-auto text-orange-500">✓</span>}
                        </label>
                      </div>
                    </div>

                    {/* Équipements Électriques */}
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                        ÉQUIPEMENTS ÉLECTRIQUES
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className={`flex items-center p-2 rounded cursor-pointer ${
                          drawingData.accessories.control_panel ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.control_panel}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              control_panel: e.target.checked
                            })}
                            className="rounded border-slate-300 text-yellow-600 mr-2"
                          />
                          <span className="font-medium">Coffret Commande</span>
                          {drawingData.accessories.control_panel && <span className="ml-auto text-yellow-500">✓</span>}
                        </label>
                        
                        <label className={`flex items-center p-2 rounded cursor-pointer ${
                          drawingData.accessories.frequency_converter ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.frequency_converter}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              frequency_converter: e.target.checked
                            })}
                            className="rounded border-slate-300 text-yellow-600 mr-2"
                          />
                          <span className="font-medium">Variateur Fréquence</span>
                          {drawingData.accessories.frequency_converter && <span className="ml-auto text-yellow-500">✓</span>}
                        </label>
                      </div>
                    </div>

                    {/* Compteur d'accessoires sélectionnés */}
                    <div className="pt-3 border-t border-slate-200">
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold">Accessoires sélectionnés:</span> 
                        <span className="ml-1 text-blue-600 font-bold">
                          {Object.values(drawingData.accessories).filter(Boolean).length}
                        </span>
                        <span className="text-slate-500"> / {Object.keys(drawingData.accessories).length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'Action */}
                  <div className="space-y-3">
                    <button
                      onClick={generateProfessionalDrawing}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 px-6 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg transform hover:scale-105"
                    >
                      <span className="mr-2">⚡</span>
                      GÉNÉRER SCHÉMA EXPERT
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDrawingInputChange('view_mode', drawingData.view_mode === '2d' ? '3d' : '2d')}
                        className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                          drawingData.view_mode === '3d' 
                            ? 'bg-purple-600 text-white shadow-lg' 
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        {drawingData.view_mode === '3d' ? '🎯 MODE 3D' : '📐 MODE 2D'}
                      </button>
                      
                      <button
                        onClick={() => setDrawingData(prev => ({
                          ...prev,
                          show_dimensions: !prev.show_dimensions,
                          show_labels: !prev.show_labels
                        }))}
                        className="py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                      >
                        📏 COTES
                      </button>
                    </div>
                  </div>
                </div>

                {/* Zone de Dessin Ultra-Professionnelle */}
                <div className="xl:col-span-2">
                  <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <span className="text-blue-600 mr-2">📐</span>
                        SCHÉMA TECHNIQUE {drawingData.view_mode.toUpperCase()}
                        <span className="ml-3 text-sm bg-green-100 text-green-700 px-2 py-1 rounded">CONFORME ISO</span>
                      </h3>
                      <div className="flex space-x-2">
                        <button 
                          onClick={exportToPDF}
                          className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-all"
                        >
                          📄 PDF PRO
                        </button>
                        <button 
                          onClick={exportToDWG}
                          className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium transition-all"
                        >
                          📁 CAD/SVG
                        </button>
                      </div>
                    </div>
                    
                    {/* Canvas Ultra-HD avec grille */}
                    <div className="relative bg-white">
                      <canvas
                        ref={canvasRef}
                        width={1200}
                        height={800}
                        className="w-full border-b border-slate-100"
                        style={{maxHeight: '800px', background: '#ffffff'}}
                      />
                      
                      {/* Grille technique en overlay */}
                      <div 
                        className="absolute inset-0 pointer-events-none opacity-5" 
                        style={{
                          backgroundImage: 'repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 25px), repeating-linear-gradient(90deg, #000, #000 1px, transparent 1px, transparent 25px)',
                          backgroundSize: '25px 25px'
                        }}
                      />
                    </div>
                    
                    {/* Cartouche Technique Ultra-Complet */}
                    <div className="p-6 bg-slate-50 border-t">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-800 text-xs">INSTALLATION</div>
                          <div className="text-slate-700">{drawingData.installation_type.replace('_', ' ').toUpperCase()}</div>
                          <div className="text-blue-600 font-medium">{drawingData.pump_count} × {drawingData.pump_configuration}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-slate-800 text-xs">HYDRAULIQUE</div>
                          <div className="text-slate-700">Q: {drawingData.flow_rate} m³/h</div>
                          <div className="text-slate-700">HMT: {drawingData.total_head} m</div>
                          <div className="text-green-600 font-bold">P: {drawingData.pump_power.toFixed(1)} kW</div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-slate-800 text-xs">TUYAUTERIES</div>
                          <div className="text-slate-700">DN Asp: {drawingData.suction_diameter}mm</div>
                          <div className="text-slate-700">DN Ref: {drawingData.discharge_diameter}mm</div>
                          <div className="text-slate-700">{drawingData.pipe_material.toUpperCase()}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-slate-800 text-xs">SPÉCIFICATIONS</div>
                          <div className="text-slate-700">{drawingData.specifications.voltage}V - {drawingData.specifications.frequency}Hz</div>
                          <div className="text-slate-700">{drawingData.specifications.protection_class}</div>
                          <div className="text-slate-700">Isolement: {drawingData.specifications.insulation_class}</div>
                        </div>
                      </div>
                      
                      {/* Ligne de conformité */}
                      <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                        <div>
                          <span className="font-semibold">📋 Conformité:</span> ISO 14692, NF EN 806, DTU 60.11 | 
                          <span className="font-semibold"> Protection:</span> {drawingData.specifications.protection_class} | 
                          <span className="font-semibold"> Température:</span> {drawingData.temperature}°C
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-700">ECO-PUMP AFRIK</div>
                          <div>Expert Hydraulique IA v3.0 • {new Date().toLocaleDateString('fr-FR')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="container mx-auto p-6">
              {/* En-tête Expert */}
              <div className="bg-gradient-to-r from-slate-800 to-blue-900 rounded-xl p-6 mb-6 text-white">
                <h1 className="text-3xl font-bold mb-2">
                  <span className="mr-3">⚙️</span>
                  GÉNÉRATEUR DE SCHÉMAS HYDRAULIQUES PROFESSIONNELS
                </h1>
                <p className="text-blue-100">
                  Conception automatique de schémas techniques conformes aux normes ISO - Expert Hydraulicien IA
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Panel de Configuration Expert */}
                <div className="xl:col-span-1 space-y-6">
                  
                  {/* Configuration Principale */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-600">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <span className="text-blue-600 mr-2">🏗️</span>
                      CONFIGURATION INSTALLATION
                    </h3>
                    
                    {/* Type d'installation */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Type d'Installation *
                      </label>
                      <select
                        value={drawingData.installation_type}
                        onChange={(e) => handleDrawingInputChange('installation_type', e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-slate-700"
                      >
                        <option value="surface_aspiration">🏗️ Pompage Surface - Aspiration</option>
                        <option value="surface_charge">🏗️ Pompage Surface - En Charge</option>
                        <option value="submersible">🕳️ Pompage Submersible</option>
                        <option value="forage">⚡ Station de Forage</option>
                        <option value="surpresseur">🔧 Surpresseur</option>
                        <option value="incendie">🚒 Protection Incendie</option>
                      </select>
                    </div>

                    {/* Configuration Pompes */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Configuration Pompes *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Nb pompes"
                          min="1"
                          max="6"
                          value={drawingData.pump_count}
                          onChange={(e) => handleDrawingInputChange('pump_count', parseInt(e.target.value) || 1)}
                          className="p-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        />
                        <select
                          value={drawingData.pump_configuration}
                          onChange={(e) => handleDrawingInputChange('pump_configuration', e.target.value)}
                          className="p-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        >
                          <option value="parallel">Parallèle</option>
                          <option value="series">Série</option>
                          <option value="standby">Standby</option>
                        </select>
                      </div>
                    </div>

                    {/* Caractéristiques Hydrauliques */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Débit (m³/h)</label>
                        <input
                          type="number"
                          placeholder="50"
                          value={drawingData.flow_rate}
                          onChange={(e) => handleDrawingInputChange('flow_rate', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded text-sm focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">HMT (m)</label>
                        <input
                          type="number"
                          placeholder="30"
                          value={drawingData.total_head}
                          onChange={(e) => handleDrawingInputChange('total_head', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded text-sm focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Accessoires et Équipements */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-600">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <span className="text-green-600 mr-2">🔧</span>
                      ACCESSOIRES TECHNIQUES
                    </h3>
                    
                    {/* Tuyauteries */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Tuyauteries</label>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <input
                          type="number"
                          placeholder="DN Aspiration"
                          value={drawingData.suction_diameter}
                          onChange={(e) => handleDrawingInputChange('suction_diameter', e.target.value)}
                          className="p-2 border border-slate-300 rounded"
                        />
                        <input
                          type="number"
                          placeholder="DN Refoulement"
                          value={drawingData.discharge_diameter}
                          onChange={(e) => handleDrawingInputChange('discharge_diameter', e.target.value)}
                          className="p-2 border border-slate-300 rounded"
                        />
                      </div>
                    </div>

                    {/* Équipements Obligatoires */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Équipements (Auto-calculés)</label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.pressure_gauge}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              pressure_gauge: e.target.checked
                            })}
                            className="rounded border-slate-300 text-blue-600 mr-1"
                          />
                          Manomètres
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.check_valve}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              check_valve: e.target.checked
                            })}
                            className="rounded border-slate-300 text-blue-600 mr-1"
                          />
                          Clapets AR
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.isolation_valve}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              isolation_valve: e.target.checked
                            })}
                            className="rounded border-slate-300 text-blue-600 mr-1"
                          />
                          Vannes Isolement
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.pressure_sensor}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              pressure_sensor: e.target.checked
                            })}
                            className="rounded border-slate-300 text-blue-600 mr-1"
                          />
                          Capteurs P
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.control_panel}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              control_panel: e.target.checked
                            })}
                            className="rounded border-slate-300 text-blue-600 mr-1"
                          />
                          Coffret Commande
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={drawingData.accessories.manifold}
                            onChange={(e) => handleDrawingInputChange('accessories', {
                              ...drawingData.accessories,
                              manifold: e.target.checked
                            })}
                            className="rounded border-slate-300 text-blue-600 mr-1"
                          />
                          Manifold
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Distances et Cotes */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-600">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                      <span className="text-purple-600 mr-2">📐</span>
                      DIMENSIONS
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-600 mb-1">Long. Aspiration (m)</label>
                        <input
                          type="number"
                          value={drawingData.dimensions.suction_length}
                          onChange={(e) => handleDrawingInputChange('dimensions', {
                            ...drawingData.dimensions,
                            suction_length: e.target.value
                          })}
                          className="w-full p-2 border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">Long. Refoulement (m)</label>
                        <input
                          type="number"
                          value={drawingData.dimensions.discharge_length}
                          onChange={(e) => handleDrawingInputChange('dimensions', {
                            ...drawingData.dimensions,
                            discharge_length: e.target.value
                          })}
                          className="w-full p-2 border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bouton Génération Expert */}
                  <button
                    onClick={generateProfessionalDrawing}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 px-6 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg transform hover:scale-105"
                  >
                    <span className="mr-2">⚡</span>
                    GÉNÉRER SCHÉMA TECHNIQUE
                  </button>
                </div>

                {/* Zone de Dessin Professionnel */}
                <div className="xl:col-span-2">
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <span className="text-blue-600 mr-2">📐</span>
                        SCHÉMA HYDRAULIQUE TECHNIQUE
                      </h3>
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium">
                          📁 Exporter DWG
                        </button>
                        <button className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium">
                          📄 Exporter PDF
                        </button>
                      </div>
                    </div>
                    
                    {/* Canvas Professionnel */}
                    <div className="border-2 border-slate-300 rounded-lg bg-white relative">
                      <canvas
                        ref={canvasRef}
                        width={1000}
                        height={700}
                        className="w-full"
                        style={{maxHeight: '700px', background: '#ffffff'}}
                      />
                      
                      {/* Grille d'ingénieur en overlay */}
                      <div className="absolute inset-0 pointer-events-none opacity-10" 
                           style={{
                             backgroundImage: 'repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #000, #000 1px, transparent 1px, transparent 20px)',
                             backgroundSize: '20px 20px'
                           }}>
                      </div>
                    </div>
                    
                    {/* Cartouche Technique */}
                    <div className="mt-4 bg-slate-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-semibold text-slate-600">Installation</div>
                          <div className="text-slate-800">{drawingData.installation_type.replace('_', ' ').toUpperCase()}</div>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-600">Configuration</div>
                          <div className="text-slate-800">{drawingData.pump_count} pompe(s) en {drawingData.pump_configuration}</div>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-600">Débit</div>
                          <div className="text-slate-800">{drawingData.flow_rate || 'N/A'} m³/h</div>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-600">HMT</div>
                          <div className="text-slate-800">{drawingData.total_head || 'N/A'} m</div>
                        </div>
                      </div>
                      
                      {/* Normes et Références */}
                      <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                        <div className="flex justify-between">
                          <span>📋 Conforme : ISO 14692, NF EN 806, DTU 60.11</span>
                          <span>🏛️ ECO-PUMP AFRIK - Générateur IA Expert v3.0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Historique des Calculs</h2>
            {history.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Aucun calcul sauvegardé pour le moment.
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.project_name}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Professionnel */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 shadow-2xl border-b border-blue-700">
        <div className="max-w-7xl mx-auto">
          {/* Ligne du titre et branding */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-blue-700/30">
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 p-2 rounded-full">
                <svg className="w-8 h-8 text-blue-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V19A2 2 0 0 0 5 21H19A2 2 0 0 0 21 19V9Z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  ECO-PUMP AFRIK
                </h1>
                <p className="text-blue-200 text-sm font-medium">
                  Calculateur Hydraulique Professionnel
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-green-500/20 px-3 py-1 rounded-full">
                <span className="text-green-200 text-xs font-medium">● ACTIF</span>
              </div>
              <div className="text-blue-200 text-sm">
                v3.0 PRO
              </div>
            </div>
          </div>

          {/* Navigation principale */}
          <nav className="px-6 py-2">
            <div className="flex flex-wrap items-center gap-1 justify-center">
              <button
                onClick={() => setActiveTab('npshd')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm ${
                  activeTab === 'npshd'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-blue-200 hover:bg-blue-700/50 hover:text-white'
                }`}
              >
                <span className="text-base">🔷</span>
                <span>NPSHd</span>
              </button>
              <button
                onClick={() => setActiveTab('hmt')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm ${
                  activeTab === 'hmt'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-blue-200 hover:bg-blue-700/50 hover:text-white'
                }`}
              >
                <span className="text-base">🔶</span>
                <span>HMT</span>
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm ${
                  activeTab === 'performance'
                    ? 'bg-yellow-600 text-white shadow-lg'
                    : 'text-blue-200 hover:bg-blue-700/50 hover:text-white'
                }`}
              >
                <span className="text-base">📊</span>
                <span>Performance</span>
              </button>
              <button
                onClick={() => setActiveTab('formulas')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm ${
                  activeTab === 'formulas'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-blue-200 hover:bg-blue-700/50 hover:text-white'
                }`}
              >
                <span className="text-base">📚</span>
                <span>Formules</span>
              </button>
              <button
                onClick={() => setActiveTab('chemical_compatibility')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm ${
                  activeTab === 'chemical_compatibility'
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'text-blue-200 hover:bg-blue-700/50 hover:text-white'
                }`}
              >
                <span className="text-base">🧪</span>
                <span>Compatibilité</span>
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm ${
                  activeTab === 'audit'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-blue-200 hover:bg-blue-700/50 hover:text-white'
                }`}
              >
                <span className="text-base">🔧</span>
                <span>Audit</span>
              </button>
              <button
                onClick={() => setActiveTab('expert')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm ${
                  activeTab === 'expert'
                    ? 'bg-violet-600 text-white shadow-lg'
                    : 'text-blue-200 hover:bg-blue-700/50 hover:text-white'
                }`}
              >
                <span className="text-base">🎯</span>
                <span>Expert</span>
              </button>
              <button
                onClick={() => setActiveTab('reservoir')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm ${
                  activeTab === 'reservoir'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-blue-200 hover:bg-blue-700/50 hover:text-white'
                }`}
              >
                <span className="text-base">🏗️</span>
                <span>Réservoir</span>
              </button>
              <button
                onClick={() => setActiveTab('solar')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm ${
                  activeTab === 'solar'
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                    : 'text-blue-200 hover:bg-gradient-to-r hover:from-orange-600 hover:to-yellow-600 hover:text-white'
                }`}
              >
                <span className="text-base">☀️</span>
                <span>Expert Solaire</span>
              </button>
              <button
                onClick={() => setActiveTab('drawing')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm ${
                  activeTab === 'drawing'
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'text-blue-200 hover:bg-blue-700/50 hover:text-white'
                }`}
              >
                <span className="text-base">🎨</span>
                <span>Dessin</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm ${
                  activeTab === 'history'
                    ? 'bg-slate-600 text-white shadow-lg'
                    : 'text-blue-200 hover:bg-blue-700/50 hover:text-white'
                }`}
              >
                <span className="text-base">📋</span>
                <span>Historique</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default App;