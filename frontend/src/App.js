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

// Component pour Tab Expert - Analyse Complète Professionnelle
const ExpertCalculator = ({ fluids, pipeMaterials, fittings }) => {
  const [inputData, setInputData] = useState({
    // Paramètres hydrauliques principaux
    flow_rate: 50,
    fluid_type: 'water',
    temperature: 20,
    
    // Géométrie installation
    suction_pipe_diameter: 100,
    discharge_pipe_diameter: 80,
    suction_height: 3.0,
    discharge_height: 25.0,
    suction_length: 10,
    discharge_length: 50,
    total_length: 60,
    
    // Matériaux et équipements
    suction_material: 'pvc',
    discharge_material: 'pvc',
    
    // Singularités détaillées
    suction_elbow_90: 2,
    suction_elbow_45: 1,
    suction_tee: 0,
    suction_reducer: 0,
    suction_valve: 0,
    suction_check_valve: 1,
    suction_strainer: 1,
    
    discharge_elbow_90: 3,
    discharge_elbow_45: 1,
    discharge_tee: 1,
    discharge_reducer: 1,
    discharge_valve: 2,
    discharge_check_valve: 1,
    
    // Paramètres électriques
    pump_efficiency: 80,
    motor_efficiency: 90,
    voltage: 400,
    power_factor: 0.8,
    starting_method: 'star_delta',
    cable_length: 50,
    cable_material: 'copper',
    cable_section: null,
    
    // Paramètres avancés
    npsh_required: 3.5,
    useful_pressure: 0,
    installation_type: 'surface',
    pump_type: 'centrifugal',
    operating_hours: 8760, // heures/an
    electricity_cost: 0.12, // €/kWh
    
    // Conditions environnementales
    altitude: 0,
    ambient_temperature: 25,
    humidity: 60
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [activeSection, setActiveSection] = useState('all');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

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
      const response = await axios.post(`${API}/expert-analysis`, {
        ...data,
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
            { fitting_type: 'elbow_90', quantity: data.suction_elbow_90 },
            { fitting_type: 'check_valve', quantity: data.suction_check_valve }
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
            { fitting_type: 'elbow_90', quantity: data.suction_elbow_90 },
            { fitting_type: 'check_valve', quantity: data.suction_check_valve }
          ].filter(f => f.quantity > 0),
          discharge_fittings: [
            { fitting_type: 'elbow_90', quantity: data.discharge_elbow_90 },
            { fitting_type: 'valve', quantity: data.discharge_valve }
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

      // Calculs avancés d'expert
      const hydraulicPower = ((data.flow_rate * hmtResponse.data.hmt) / (data.pump_efficiency * 367)) * 100;
      const electricalPower = hydraulicPower / (data.motor_efficiency / 100);
      const overallEfficiency = (data.pump_efficiency / 100) * (data.motor_efficiency / 100) * 100;
      const annualEnergyCost = (electricalPower * data.operating_hours * data.electricity_cost) / 1000;
      
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
    <div className="space-y-6">
      {/* Header Expert */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">🧠 ANALYSE HYDRAULIQUE EXPERTE</h2>
        <p className="text-purple-100 mb-4">
          Calculs avancés temps réel • Diagnostics automatiques • Recommandations professionnelles
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoCalculate}
                onChange={(e) => setAutoCalculate(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Calcul automatique</span>
            </label>
            {!autoCalculate && (
              <button
                onClick={() => calculateExpertAnalysis()}
                className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                disabled={loading}
              >
                {loading ? 'Calcul...' : 'Calculer'}
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
            {['all', 'hydraulic', 'electrical', 'analysis'].map(section => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section 
                    ? 'bg-white text-purple-600' 
                    : 'bg-purple-500 text-white hover:bg-purple-400'
                }`}
              >
                {section === 'all' ? 'Tout' : 
                 section === 'hydraulic' ? 'Hydraulique' : 
                 section === 'electrical' ? 'Électrique' : 'Analyse'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Panneau de saisie - Colonne 1 */}
        <div className="xl:col-span-1 space-y-6">
          {/* Paramètres hydrauliques */}
          {(activeSection === 'all' || activeSection === 'hydraulic') && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-600 flex items-center">
                💧 Paramètres Hydrauliques
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Débit (m³/h)
                    </label>
                    <input
                      type="number"
                      value={inputData.flow_rate}
                      onChange={(e) => handleInputChange('flow_rate', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hauteur Asp. (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={inputData.suction_height}
                      onChange={(e) => handleInputChange('suction_height', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {inputData.suction_height > 0 ? 'En charge' : 'Dépression'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hauteur Ref. (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={inputData.discharge_height}
                      onChange={(e) => handleInputChange('discharge_height', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ⌀ Aspiration (mm)
                    </label>
                    <input
                      type="number"
                      value={inputData.suction_pipe_diameter}
                      onChange={(e) => handleInputChange('suction_pipe_diameter', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ⌀ Refoulement (mm)
                    </label>
                    <input
                      type="number"
                      value={inputData.discharge_pipe_diameter}
                      onChange={(e) => handleInputChange('discharge_pipe_diameter', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Long. Asp. (m)
                    </label>
                    <input
                      type="number"
                      value={inputData.suction_length}
                      onChange={(e) => handleInputChange('suction_length', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Long. Ref. (m)
                    </label>
                    <input
                      type="number"
                      value={inputData.discharge_length}
                      onChange={(e) => handleInputChange('discharge_length', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        <option key={material.id} value={material.id}>{material.name}</option>
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
                        <option key={material.id} value={material.id}>{material.name}</option>
                      ))}
                    </select>
                  </div>
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
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Singularités */}
          {(activeSection === 'all' || activeSection === 'hydraulic') && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-orange-600 flex items-center">
                🔧 Singularités
              </h3>
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Aspiration</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Coudes 90°</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.suction_elbow_90}
                      onChange={(e) => handleInputChange('suction_elbow_90', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Coudes 45°</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.suction_elbow_45}
                      onChange={(e) => handleInputChange('suction_elbow_45', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Crépine</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.suction_strainer}
                      onChange={(e) => handleInputChange('suction_strainer', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="text-sm font-medium text-gray-700 mb-2">Refoulement</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Coudes 90°</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.discharge_elbow_90}
                      onChange={(e) => handleInputChange('discharge_elbow_90', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Vannes</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.discharge_valve}
                      onChange={(e) => handleInputChange('discharge_valve', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Clapets</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.discharge_check_valve}
                      onChange={(e) => handleInputChange('discharge_check_valve', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
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
                      Rendement Pompe (%)
                    </label>
                    <input
                      type="number"
                      min="40"
                      max="95"
                      value={inputData.pump_efficiency}
                      onChange={(e) => handleInputChange('pump_efficiency', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rendement Moteur (%)
                    </label>
                    <input
                      type="number"
                      min="70"
                      max="98"
                      value={inputData.motor_efficiency}
                      onChange={(e) => handleInputChange('motor_efficiency', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      value={inputData.cable_length}
                      onChange={(e) => handleInputChange('cable_length', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fonctionnement (h/an)
                    </label>
                    <input
                      type="number"
                      value={inputData.operating_hours}
                      onChange={(e) => handleInputChange('operating_hours', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coût kWh (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={inputData.electricity_cost}
                      onChange={(e) => handleInputChange('electricity_cost', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
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
              
              {/* Ligne de résultats additionnels */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-indigo-600">
                    {results.performance_analysis?.hydraulic_power?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">P2 (kW)</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {results.performance_analysis?.electrical_power?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">P1 (kW)</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {results.performance_analysis?.nominal_current?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Courant (A)</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {results.electrical_analysis?.annual_energy_cost?.toFixed(0) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Coût/an (€)</div>
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
            <ExpertInstallationSchema inputData={inputData} results={results} />
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