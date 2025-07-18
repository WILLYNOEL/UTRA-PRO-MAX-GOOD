import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Component pour Tab 1 - Calcul NPSHd
const NPSHdCalculator = ({ fluids, pipeMaterials, fittings }) => {
  const [inputData, setInputData] = useState({
    suction_type: 'flooded',
    hasp: 3.0,
    flow_rate: 50,
    fluid_type: 'water',
    temperature: 20,
    pipe_diameter: 100,
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">🟦 Calcul NPSHd (Net Positive Suction Head Available)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Paramètres principaux */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Paramètres Principaux</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type d'Aspiration
                </label>
                <select
                  value={inputData.suction_type}
                  onChange={(e) => handleInputChange('suction_type', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="flooded">Aspiration en charge</option>
                  <option value="suction_lift">Aspiration en dépression</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hauteur d'Aspiration Hasp (m)
                </label>
                <input
                  type="number"
                  value={inputData.hasp}
                  onChange={(e) => handleInputChange('hasp', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Débit (m³/h)
                </label>
                <input
                  type="number"
                  value={inputData.flow_rate}
                  onChange={(e) => handleInputChange('flow_rate', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de Fluide
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Température (°C)
                </label>
                <input
                  type="number"
                  value={inputData.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NPSH Requis (m) - Données Constructeur
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={inputData.npsh_required}
                  onChange={(e) => handleInputChange('npsh_required', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 3.5"
                />
              </div>
            </div>
          </div>
          
          {/* Tuyauterie */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Tuyauterie d'Aspiration</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diamètre (mm)
                </label>
                <input
                  type="number"
                  value={inputData.pipe_diameter}
                  onChange={(e) => handleInputChange('pipe_diameter', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matériau
                </label>
                <select
                  value={inputData.pipe_material}
                  onChange={(e) => handleInputChange('pipe_material', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {pipeMaterials.map(material => (
                    <option key={material.id} value={material.id}>{material.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longueur (m)
                </label>
                <input
                  type="number"
                  value={inputData.pipe_length}
                  onChange={(e) => handleInputChange('pipe_length', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Raccords */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-700">Raccords d'Aspiration</h3>
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
        </div>
        
        <div className="mt-6">
          <button
            onClick={calculateNPSHd}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Calcul en cours...' : 'Calculer NPSHd'}
          </button>
        </div>
      </div>
      
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
  const [inputData, setInputData] = useState({
    installation_type: 'surface',
    suction_type: 'flooded',
    hasp: 3.0,
    discharge_height: 25.0,
    useful_pressure: 0,
    suction_pipe_diameter: 100,
    discharge_pipe_diameter: 80,
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">🟩 Calcul HMT (Hauteur Manométrique Totale)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Paramètres généraux */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Paramètres Généraux</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type d'Installation
                </label>
                <select
                  value={inputData.installation_type}
                  onChange={(e) => handleInputChange('installation_type', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="surface">Installation en surface</option>
                  <option value="submersible">Installation submersible</option>
                </select>
              </div>
              
              {inputData.installation_type === 'surface' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type d'Aspiration
                    </label>
                    <select
                      value={inputData.suction_type}
                      onChange={(e) => handleInputChange('suction_type', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="flooded">Aspiration en charge</option>
                      <option value="suction_lift">Aspiration en dépression</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hauteur d'Aspiration (m)
                    </label>
                    <input
                      type="number"
                      value={inputData.hasp}
                      onChange={(e) => handleInputChange('hasp', parseFloat(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hauteur de Refoulement (m)
                </label>
                <input
                  type="number"
                  value={inputData.discharge_height}
                  onChange={(e) => handleInputChange('discharge_height', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pression Utile (bar)
                </label>
                <input
                  type="number"
                  value={inputData.useful_pressure}
                  onChange={(e) => handleInputChange('useful_pressure', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Pression de refoulement requise</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Débit (m³/h)
                </label>
                <input
                  type="number"
                  value={inputData.flow_rate}
                  onChange={(e) => handleInputChange('flow_rate', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de Fluide
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Température (°C)
                </label>
                <input
                  type="number"
                  value={inputData.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Tuyauteries */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Tuyauteries</h3>
            
            <div className="space-y-3">
              {inputData.installation_type === 'surface' && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Aspiration</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-blue-700 mb-1">Diamètre (mm)</label>
                      <input
                        type="number"
                        value={inputData.suction_pipe_diameter}
                        onChange={(e) => handleInputChange('suction_pipe_diameter', parseFloat(e.target.value))}
                        className="w-full p-1 border border-blue-300 rounded text-sm"
                      />
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
                          <option key={material.id} value={material.id}>{material.name}</option>
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
                    <label className="block text-xs text-green-700 mb-1">Diamètre (mm)</label>
                    <input
                      type="number"
                      value={inputData.discharge_pipe_diameter}
                      onChange={(e) => handleInputChange('discharge_pipe_diameter', parseFloat(e.target.value))}
                      className="w-full p-1 border border-green-300 rounded text-sm"
                    />
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
                        <option key={material.id} value={material.id}>{material.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Raccords */}
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
        
        <div className="mt-6">
          <button
            onClick={calculateHMT}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Calcul en cours...' : 'Calculer HMT'}
          </button>
        </div>
      </div>
      
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

// Component pour Tab Expert - Analyse Complète
const ExpertCalculator = ({ fluids, pipeMaterials, fittings }) => {
  const [inputData, setInputData] = useState({
    // Paramètres hydrauliques
    flow_rate: 50,
    fluid_type: 'water',
    temperature: 20,
    
    // Géométrie
    suction_pipe_diameter: 100,
    discharge_pipe_diameter: 80,
    suction_height: 3.0,
    discharge_height: 25.0,
    suction_length: 10,
    discharge_length: 50,
    total_length: 60,
    
    // Matériaux
    suction_material: 'pvc',
    discharge_material: 'pvc',
    
    // Singularités
    elbow_90_qty: 2,
    elbow_45_qty: 1,
    tee_qty: 0,
    valve_qty: 1,
    check_valve_qty: 1,
    
    // Électrique
    pump_efficiency: 80,
    motor_efficiency: 90,
    voltage: 400,
    power_factor: 0.8,
    starting_method: 'star_delta',
    cable_length: 50,
    cable_material: 'copper',
    
    // Expert
    npsh_required: 3.5,
    useful_pressure: 0,
    installation_type: 'surface'
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(true);

  const handleInputChange = (field, value) => {
    const newData = { ...inputData, [field]: value };
    setInputData(newData);
    
    // Calcul automatique si activé
    if (autoCalculate) {
      calculateExpertAnalysis(newData);
    }
  };

  const calculateExpertAnalysis = async (data = inputData) => {
    if (!autoCalculate && data === inputData) return;
    
    setLoading(true);
    try {
      // Appel à une API expert qui combine tous les calculs
      const response = await axios.post(`${API}/expert-analysis`, {
        ...data,
        // Formatage des raccords
        suction_fittings: [
          { fitting_type: 'elbow_90', quantity: data.elbow_90_qty },
          { fitting_type: 'elbow_45', quantity: data.elbow_45_qty },
          { fitting_type: 'tee', quantity: data.tee_qty },
          { fitting_type: 'valve', quantity: data.valve_qty },
          { fitting_type: 'check_valve', quantity: data.check_valve_qty }
        ].filter(f => f.quantity > 0),
        discharge_fittings: [
          { fitting_type: 'elbow_90', quantity: Math.floor(data.elbow_90_qty / 2) },
          { fitting_type: 'valve', quantity: 1 }
        ].filter(f => f.quantity > 0)
      });
      
      setResults(response.data);
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
      // Calculs parallèles pour toutes les données
      const [npshResponse, hmtResponse, perfResponse] = await Promise.all([
        axios.post(`${API}/calculate-npshd`, {
          suction_type: data.suction_height > 0 ? 'flooded' : 'suction_lift',
          hasp: Math.abs(data.suction_height),
          flow_rate: data.flow_rate,
          fluid_type: data.fluid_type,
          temperature: data.temperature,
          pipe_diameter: data.suction_pipe_diameter,
          pipe_material: data.suction_material,
          pipe_length: data.suction_length,
          suction_fittings: [
            { fitting_type: 'elbow_90', quantity: data.elbow_90_qty },
            { fitting_type: 'check_valve', quantity: data.check_valve_qty }
          ].filter(f => f.quantity > 0),
          npsh_required: data.npsh_required
        }),
        axios.post(`${API}/calculate-hmt`, {
          installation_type: data.installation_type,
          suction_type: data.suction_height > 0 ? 'flooded' : 'suction_lift',
          hasp: Math.abs(data.suction_height),
          discharge_height: data.discharge_height,
          useful_pressure: data.useful_pressure,
          suction_pipe_diameter: data.suction_pipe_diameter,
          discharge_pipe_diameter: data.discharge_pipe_diameter,
          suction_pipe_length: data.suction_length,
          discharge_pipe_length: data.discharge_length,
          suction_pipe_material: data.suction_material,
          discharge_pipe_material: data.discharge_material,
          suction_fittings: [
            { fitting_type: 'elbow_90', quantity: data.elbow_90_qty },
            { fitting_type: 'check_valve', quantity: data.check_valve_qty }
          ].filter(f => f.quantity > 0),
          discharge_fittings: [
            { fitting_type: 'elbow_90', quantity: Math.floor(data.elbow_90_qty / 2) },
            { fitting_type: 'valve', quantity: 1 }
          ].filter(f => f.quantity > 0),
          fluid_type: data.fluid_type,
          temperature: data.temperature,
          flow_rate: data.flow_rate
        }),
        axios.post(`${API}/calculate-performance`, {
          flow_rate: data.flow_rate,
          hmt: 30, // Estimation temporaire
          pipe_diameter: data.suction_pipe_diameter,
          fluid_type: data.fluid_type,
          pipe_material: data.suction_material,
          pump_efficiency: data.pump_efficiency,
          motor_efficiency: data.motor_efficiency,
          starting_method: data.starting_method,
          power_factor: data.power_factor,
          cable_length: data.cable_length,
          cable_material: data.cable_material,
          voltage: data.voltage
        })
      ]);

      // Combinaison des résultats
      const combinedResults = {
        npshd: npshResponse.data,
        hmt: hmtResponse.data,
        performance: perfResponse.data,
        expert_analysis: {
          overall_efficiency: (data.pump_efficiency / 100) * (data.motor_efficiency / 100) * 100,
          total_head_loss: (npshResponse.data.total_head_loss || 0) + (hmtResponse.data.total_head_loss || 0),
          system_flow_rate: data.flow_rate,
          expert_recommendations: generateExpertRecommendations(data, npshResponse.data, hmtResponse.data, perfResponse.data)
        }
      };

      setResults(combinedResults);
    } catch (error) {
      console.error('Erreur calculs fallback:', error);
    }
  };

  const generateExpertRecommendations = (input, npshd, hmt, perf) => {
    const recommendations = [];
    
    // Analyse hydraulique
    if (npshd.cavitation_risk) {
      recommendations.push({
        type: 'critical',
        title: 'CAVITATION DÉTECTÉE',
        message: 'Risque de cavitation imminent - Action immédiate requise',
        solutions: [
          'Réduire la hauteur d\'aspiration',
          'Augmenter le diamètre de la tuyauterie d\'aspiration',
          'Minimiser les singularités sur l\'aspiration'
        ]
      });
    }
    
    // Analyse de vitesse
    const velocity = npshd.velocity || 0;
    if (velocity > 3) {
      recommendations.push({
        type: 'warning',
        title: 'VITESSE EXCESSIVE',
        message: `Vitesse de ${velocity.toFixed(2)} m/s - risque d'érosion et de bruit`,
        solutions: [
          'Augmenter le diamètre pour réduire la vitesse',
          'Utiliser des matériaux résistants à l\'érosion',
          'Prévoir des dispositifs anti-vibration'
        ]
      });
    }
    
    // Analyse énergétique
    const efficiency = (input.pump_efficiency / 100) * (input.motor_efficiency / 100) * 100;
    if (efficiency < 65) {
      recommendations.push({
        type: 'optimization',
        title: 'RENDEMENT FAIBLE',
        message: `Rendement global de ${efficiency.toFixed(1)}% - potentiel d'économie d'énergie`,
        solutions: [
          'Choisir une pompe plus efficace',
          'Optimiser le point de fonctionnement',
          'Utiliser un variateur de vitesse'
        ]
      });
    }
    
    return recommendations;
  };

  // Calcul initial
  React.useEffect(() => {
    if (autoCalculate) {
      calculateExpertAnalysis();
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">🧠 Analyse Expert Hydraulique</h2>
        <p className="text-purple-100">
          Calculs avancés en temps réel avec recommandations d'expert
        </p>
        <div className="mt-4 flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoCalculate}
              onChange={(e) => setAutoCalculate(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Calcul automatique</span>
          </label>
          {!autoCalculate && (
            <button
              onClick={() => calculateExpertAnalysis()}
              className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50"
            >
              Calculer
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panneau de saisie */}
        <div className="space-y-6">
          {/* Paramètres hydrauliques */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-600">💧 Paramètres Hydrauliques</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Débit (m³/h)
                </label>
                <input
                  type="number"
                  value={inputData.flow_rate}
                  onChange={(e) => handleInputChange('flow_rate', parseFloat(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Température (°C)
                </label>
                <input
                  type="number"
                  value={inputData.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || 20)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fluide
                </label>
                <select
                  value={inputData.fluid_type}
                  onChange={(e) => handleInputChange('fluid_type', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {fluids.map(fluid => (
                    <option key={fluid.id} value={fluid.id}>{fluid.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NPSH Requis (m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={inputData.npsh_required}
                  onChange={(e) => handleInputChange('npsh_required', parseFloat(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panneau de résultats */}
        <div className="space-y-6">
          {loading && (
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Calcul en cours...</p>
            </div>
          )}
          
          {results && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-green-600">📊 Résultats Instantanés</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">NPSHd Calculé:</span>
                  <span className="font-bold text-lg text-blue-600">
                    {results.npshd?.npshd?.toFixed(2) || 'N/A'} m
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">HMT Total:</span>
                  <span className="font-bold text-lg text-green-600">
                    {results.hmt?.hmt?.toFixed(2) || 'N/A'} m
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rendement Global:</span>
                  <span className="font-bold text-lg text-purple-600">
                    {results.expert_analysis?.overall_efficiency?.toFixed(1) || 'N/A'}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vitesse:</span>
                  <span className="font-bold text-lg text-orange-600">
                    {results.npshd?.velocity?.toFixed(2) || 'N/A'} m/s
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schéma d'installation expert */}
      {results && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">🏗️ Schéma d'Installation Expert</h3>
          <div className="flex justify-center">
            <ExpertInstallationSchema inputData={inputData} results={results} />
          </div>
        </div>
      )}

      {/* Recommandations d'expert */}
      {results && results.expert_analysis?.expert_recommendations && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">🎯 Recommandations d'Expert</h3>
          <div className="space-y-4">
            {results.expert_analysis.expert_recommendations.map((rec, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                rec.type === 'critical' ? 'border-red-500 bg-red-50' :
                rec.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <h4 className={`font-bold ${
                  rec.type === 'critical' ? 'text-red-800' :
                  rec.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {rec.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{rec.message}</p>
                <ul className="mt-2 text-sm space-y-1">
                  {rec.solutions.map((solution, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span>{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Composant pour le schéma d'installation expert
const ExpertInstallationSchema = ({ inputData, results }) => {
  return (
    <svg width="800" height="500" viewBox="0 0 800 500" className="border border-gray-200 rounded-lg">
      <rect width="800" height="500" fill="#f8fafc" />
      
      {/* Réservoir */}
      <rect x="50" y="200" width="200" height="150" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
      <rect x="55" y="220" width="190" height="125" fill="#3b82f6" opacity="0.6" />
      
      {/* Pompe */}
      <rect x="350" y="275" width="80" height="60" fill="#10b981" stroke="#059669" strokeWidth="3" rx="10" />
      <text x="390" y="310" textAnchor="middle" className="text-sm font-bold" fill="white">
        POMPE
      </text>
      
      {/* Tuyauteries */}
      <line x1="250" y1="305" x2="350" y2="305" stroke="#4b5563" strokeWidth="8" />
      <line x1="430" y1="305" x2="550" y2="305" stroke="#4b5563" strokeWidth="8" />
      <line x1="550" y1="305" x2="550" y2="150" stroke="#4b5563" strokeWidth="8" />
      
      {/* Données temps réel */}
      <rect x="600" y="50" width="180" height="200" fill="white" stroke="#d1d5db" strokeWidth="2" rx="10" />
      <text x="690" y="75" textAnchor="middle" className="text-sm font-bold" fill="#1f2937">
        DONNÉES TEMPS RÉEL
      </text>
      
      {/* Affichage des résultats */}
      <text x="610" y="100" className="text-xs" fill="#4b5563">
        NPSHd: {results.npshd?.npshd?.toFixed(2) || 'N/A'} m
      </text>
      <text x="610" y="120" className="text-xs" fill="#4b5563">
        HMT: {results.hmt?.hmt?.toFixed(2) || 'N/A'} m
      </text>
      <text x="610" y="140" className="text-xs" fill="#4b5563">
        Vitesse: {results.npshd?.velocity?.toFixed(2) || 'N/A'} m/s
      </text>
      <text x="610" y="160" className="text-xs" fill="#4b5563">
        Rendement: {results.expert_analysis?.overall_efficiency?.toFixed(1) || 'N/A'}%
      </text>
      
      {/* Indicateurs visuels */}
      <circle 
        cx="750" 
        cy="100" 
        r="10" 
        fill={results.npshd?.cavitation_risk ? "#ef4444" : "#10b981"}
      />
      <text 
        x="750" 
        y="105" 
        textAnchor="middle" 
        className="text-xs font-bold" 
        fill="white"
      >
        {results.npshd?.cavitation_risk ? "!" : "✓"}
      </text>
      
      <text x="610" y="220" className="text-xs font-bold" fill="#4b5563">
        Débit: {inputData.flow_rate} m³/h
      </text>
      <text x="610" y="240" className="text-xs font-bold" fill="#4b5563">
        Température: {inputData.temperature}°C
      </text>
    </svg>
  );
};

// Component pour Tab 3 - Analyse de Performance
const PerformanceAnalysis = ({ fluids, pipeMaterials }) => {
  const [inputData, setInputData] = useState({
    flow_rate: 50,
    hmt: 25,
    pipe_diameter: 100,
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">🟨 Analyse de Performance & Calculs Électriques</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Paramètres hydrauliques */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Paramètres Hydrauliques</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Débit (m³/h)
                </label>
                <input
                  type="number"
                  value={inputData.flow_rate}
                  onChange={(e) => handleInputChange('flow_rate', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HMT (m)
                </label>
                <input
                  type="number"
                  value={inputData.hmt}
                  onChange={(e) => handleInputChange('hmt', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diamètre de tuyauterie (mm)
                </label>
                <input
                  type="number"
                  value={inputData.pipe_diameter}
                  onChange={(e) => handleInputChange('pipe_diameter', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de fluide
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matériau de tuyauterie
                </label>
                <select
                  value={inputData.pipe_material}
                  onChange={(e) => handleInputChange('pipe_material', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {pipeMaterials.map(material => (
                    <option key={material.id} value={material.id}>{material.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Paramètres électriques */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Paramètres Électriques</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rendement pompe (%)
                </label>
                <input
                  type="number"
                  value={inputData.pump_efficiency}
                  onChange={(e) => handleInputChange('pump_efficiency', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rendement moteur (%)
                </label>
                <input
                  type="number"
                  value={inputData.motor_efficiency}
                  onChange={(e) => handleInputChange('motor_efficiency', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puissance absorbée P1 (kW) - Optionnel
                </label>
                <input
                  type="number"
                  value={inputData.absorbed_power || ''}
                  onChange={(e) => handleInputChange('absorbed_power', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puissance hydraulique P2 (kW) - Optionnel
                </label>
                <input
                  type="number"
                  value={inputData.hydraulic_power || ''}
                  onChange={(e) => handleInputChange('hydraulic_power', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Méthode de démarrage
                </label>
                <select
                  value={inputData.starting_method}
                  onChange={(e) => handleInputChange('starting_method', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="star_delta">Étoile-Triangle</option>
                  <option value="direct_on_line">Démarrage direct</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facteur de puissance (cos φ)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="1"
                  value={inputData.power_factor}
                  onChange={(e) => handleInputChange('power_factor', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longueur de câble (m)
                </label>
                <input
                  type="number"
                  value={inputData.cable_length}
                  onChange={(e) => handleInputChange('cable_length', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matériau de câble
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tension (V)
                </label>
                <select
                  value={inputData.voltage}
                  onChange={(e) => handleInputChange('voltage', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={230}>230V</option>
                  <option value={400}>400V</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={calculatePerformance}
            disabled={loading}
            className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Analyse en cours...' : 'Analyser Performance'}
          </button>
        </div>
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [fluidsRes, materialsRes, fittingsRes, historyRes] = await Promise.all([
        axios.get(`${API}/fluids`),
        axios.get(`${API}/pipe-materials`),
        axios.get(`${API}/fittings`),
        axios.get(`${API}/history`)
      ]);
      
      setFluids(fluidsRes.data.fluids);
      setPipeMaterials(materialsRes.data.materials);
      setFittings(fittingsRes.data.fittings);
      setHistory(historyRes.data);
    } catch (error) {
      console.error('Erreur chargement données:', error);
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
      case 'expert':
        return <ExpertCalculator fluids={fluids} pipeMaterials={pipeMaterials} fittings={fittings} />;
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
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold">Calculateur de Pompe Hydraulique</h1>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('npshd')}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === 'npshd'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800'
                }`}
              >
                🟦 NPSHd
              </button>
              <button
                onClick={() => setActiveTab('hmt')}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === 'hmt'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800'
                }`}
              >
                🟩 HMT
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === 'performance'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800'
                }`}
              >
                🟨 Performance
              </button>
              <button
                onClick={() => setActiveTab('expert')}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === 'expert'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800'
                }`}
              >
                🟣 Expert
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === 'history'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800'
                }`}
              >
                📋 Historique
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default App;