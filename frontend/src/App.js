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
    flow_rate: 0,
    fluid_type: 'water',
    temperature: 0,
    
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
    
    // Singularités ASPIRATION
    suction_elbow_90: 0,
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
    suction_strainer: 0,
    suction_foot_valve: 0,
    
    // Singularités REFOULEMENT
    discharge_elbow_90: 0,
    discharge_elbow_45: 0,
    discharge_elbow_30: 0,
    discharge_tee_flow: 0,
    discharge_tee_branch: 0,
    discharge_reducer_gradual: 0,
    discharge_reducer_sudden: 0,
    discharge_enlarger_gradual: 0,
    discharge_enlarger_sudden: 0,
    discharge_gate_valve: 0,
    discharge_globe_valve: 0,
    discharge_ball_valve: 0,
    discharge_butterfly_valve: 0,
    discharge_check_valve: 0,
    discharge_strainer: 0,
    discharge_flow_meter: 0,
    discharge_pressure_gauge: 0,
    
    // Paramètres électriques
    pump_efficiency: 0,
    motor_efficiency: 0,
    voltage: 400,
    power_factor: 0,
    starting_method: 'star_delta',
    cable_length: 0,
    cable_material: 'copper',
    cable_section: null,
    
    // Paramètres avancés
    npsh_required: 0,
    installation_type: 'surface',
    pump_type: 'centrifugal',
    operating_hours: 0,
    electricity_cost: 0,
    
    // Conditions environnementales
    altitude: 0,
    ambient_temperature: 0,
    humidity: 0
  });

  // Table de correspondance DN/mm
  const dnSizes = [
    { dn: 'DN3/4', mm: 20, label: 'DN3/4 (20mm)' },
    { dn: 'DN1', mm: 25, label: 'DN1 (25mm)' },
    { dn: 'DN1.1/4', mm: 32, label: 'DN1.1/4 (32mm)' },
    { dn: 'DN1.1/2', mm: 40, label: 'DN1.1/2 (40mm)' },
    { dn: 'DN2', mm: 50, label: 'DN2 (50mm)' },
    { dn: 'DN2.1/2', mm: 65, label: 'DN2.1/2 (65mm)' },
    { dn: 'DN3', mm: 80, label: 'DN3 (80mm)' },
    { dn: 'DN4', mm: 100, label: 'DN4 (100mm)' },
    { dn: 'DN5', mm: 125, label: 'DN5 (125mm)' },
    { dn: 'DN6', mm: 150, label: 'DN6 (150mm)' },
    { dn: 'DN8', mm: 200, label: 'DN8 (200mm)' },
    { dn: 'DN10', mm: 250, label: 'DN10 (250mm)' },
    { dn: 'DN12', mm: 300, label: 'DN12 (300mm)' },
    { dn: 'DN14', mm: 350, label: 'DN14 (350mm)' },
    { dn: 'DN16', mm: 400, label: 'DN16 (400mm)' },
    { dn: 'DN18', mm: 450, label: 'DN18 (450mm)' },
    { dn: 'DN20', mm: 500, label: 'DN20 (500mm)' }
  ];

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

  const resetAllFields = () => {
    setInputData({
      // Paramètres hydrauliques principaux
      flow_rate: 0,
      fluid_type: 'water',
      temperature: 0,
      
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
      
      // Singularités ASPIRATION (tous à zéro)
      suction_elbow_90: 0,
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
      suction_strainer: 0,
      suction_foot_valve: 0,
      
      // Singularités REFOULEMENT (tous à zéro)
      discharge_elbow_90: 0,
      discharge_elbow_45: 0,
      discharge_elbow_30: 0,
      discharge_tee_flow: 0,
      discharge_tee_branch: 0,
      discharge_reducer_gradual: 0,
      discharge_reducer_sudden: 0,
      discharge_enlarger_gradual: 0,
      discharge_enlarger_sudden: 0,
      discharge_gate_valve: 0,
      discharge_globe_valve: 0,
      discharge_ball_valve: 0,
      discharge_butterfly_valve: 0,
      discharge_check_valve: 0,
      discharge_strainer: 0,
      discharge_flow_meter: 0,
      discharge_pressure_gauge: 0,
      
      // Paramètres électriques
      pump_efficiency: 0,
      motor_efficiency: 0,
      voltage: 400,
      power_factor: 0,
      starting_method: 'star_delta',
      cable_length: 0,
      cable_material: 'copper',
      cable_section: null,
      
      // Paramètres avancés
      npsh_required: 0,
      installation_type: 'surface',
      pump_type: 'centrifugal',
      operating_hours: 0,
      electricity_cost: 0,
      
      // Conditions environnementales
      altitude: 0,
      ambient_temperature: 0,
      humidity: 0
    });
    
    // Réinitialiser les résultats
    setResults(null);
    
    // Détruire les graphiques existants
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }
  };

  // Fonction d'export PDF
  const exportToPDF = () => {
    if (!results) {
      alert('Aucun résultat à exporter. Veuillez d\'abord effectuer un calcul.');
      return;
    }

    // Créer le contenu HTML pour le PDF
    const htmlContent = `
      <html>
        <head>
          <title>Rapport d'Analyse Expert - Pompage</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .parameter { display: flex; justify-content: space-between; margin: 5px 0; }
            .parameter strong { color: #555; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; border-radius: 5px; }
            .critical { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; margin: 10px 0; border-radius: 5px; }
            .success { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 10px; margin: 10px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Rapport d'Analyse Expert - Système de Pompage</h1>
            <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          </div>
          
          <div class="section">
            <h2>Paramètres d'Entrée</h2>
            <div class="parameter"><span>Débit:</span><strong>${inputData.flow_rate} m³/h</strong></div>
            <div class="parameter"><span>Fluide:</span><strong>${inputData.fluid_type}</strong></div>
            <div class="parameter"><span>Température:</span><strong>${inputData.temperature}°C</strong></div>
            <div class="parameter"><span>Diamètre aspiration:</span><strong>${inputData.suction_pipe_diameter} mm</strong></div>
            <div class="parameter"><span>Diamètre refoulement:</span><strong>${inputData.discharge_pipe_diameter} mm</strong></div>
          </div>

          <div class="section">
            <h2>Résultats NPSHd</h2>
            ${results.npshd_analysis ? `
              <div class="parameter"><span>NPSHd calculé:</span><strong>${results.npshd_analysis.npshd?.toFixed(2)} m</strong></div>
              <div class="parameter"><span>NPSH requis:</span><strong>${results.npshd_analysis.npsh_required?.toFixed(2)} m</strong></div>
              <div class="parameter"><span>Marge de sécurité:</span><strong>${results.npshd_analysis.npsh_margin?.toFixed(2)} m</strong></div>
              ${results.npshd_analysis.cavitation_risk ? 
                '<div class="critical"><strong>⚠️ RISQUE DE CAVITATION DÉTECTÉ</strong></div>' : 
                '<div class="success"><strong>✅ Aucun risque de cavitation</strong></div>'
              }
            ` : '<p>Données NPSHd non disponibles</p>'}
          </div>

          <div class="section">
            <h2>Résultats HMT</h2>
            ${results.hmt_analysis ? `
              <div class="parameter"><span>HMT calculée:</span><strong>${results.hmt_analysis.hmt?.toFixed(2)} m</strong></div>
              <div class="parameter"><span>Hauteur statique:</span><strong>${results.hmt_analysis.static_head?.toFixed(2)} m</strong></div>
              <div class="parameter"><span>Pertes de charge totales:</span><strong>${results.hmt_analysis.total_head_loss?.toFixed(2)} m</strong></div>
            ` : '<p>Données HMT non disponibles</p>'}
          </div>

          <div class="section">
            <h2>Performance Énergétique</h2>
            ${results.performance_analysis ? `
              <div class="parameter"><span>Rendement global:</span><strong>${results.performance_analysis.overall_efficiency?.toFixed(1)}%</strong></div>
              <div class="parameter"><span>Puissance hydraulique:</span><strong>${results.performance_analysis.hydraulic_power?.toFixed(2)} kW</strong></div>
              <div class="parameter"><span>Puissance électrique:</span><strong>${results.performance_analysis.electrical_power?.toFixed(2)} kW</strong></div>
            ` : '<p>Données de performance non disponibles</p>'}
          </div>

          ${results.expert_recommendations && results.expert_recommendations.length > 0 ? `
            <div class="section">
              <h2>Recommandations</h2>
              ${results.expert_recommendations.map(rec => `
                <div class="${rec.type === 'critical' ? 'critical' : 'warning'}">
                  <h3>${rec.title}</h3>
                  <p><strong>Description:</strong> ${rec.description}</p>
                  <p><strong>Impact:</strong> ${rec.impact}</p>
                  ${rec.solutions ? `
                    <p><strong>Solutions:</strong></p>
                    <ul>
                      ${rec.solutions.map(sol => `<li>${sol}</li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </body>
      </html>
    `;

    // Créer un blob et télécharger
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-pompage-${new Date().toISOString().split('T')[0]}.html`;
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
            
            {/* Bouton de remise à zéro */}
            <button
              onClick={resetAllFields}
              className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center space-x-2"
              title="Remettre à zéro tous les champs"
            >
              <span>🔄</span>
              <span>Réinitialiser</span>
            </button>
            
            {/* Bouton Export PDF */}
            <button
              onClick={() => exportToPDF()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center space-x-2"
              title="Exporter en PDF"
              disabled={!results}
            >
              <span>📄</span>
              <span>PDF</span>
            </button>
            
            {/* Bouton Export Excel */}
            <button
              onClick={() => exportToExcel()}
              className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center space-x-2"
              title="Exporter en Excel"
              disabled={!results}
            >
              <span>📊</span>
              <span>Excel</span>
            </button>
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
                      ⭐ Débit (m³/h)
                    </label>
                    <input
                      type="number"
                      value={inputData.flow_rate || ''}
                      onChange={(e) => handleInputChange('flow_rate', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border-2 border-yellow-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50"
                      placeholder="Saisissez le débit"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ⭐ Température (°C)
                    </label>
                    <input
                      type="number"
                      value={inputData.temperature || ''}
                      onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border-2 border-yellow-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50"
                      placeholder="Température du fluide"
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
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ⭐ Hauteur Asp. (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={inputData.suction_height || ''}
                      onChange={(e) => handleInputChange('suction_height', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border-2 border-yellow-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50"
                      placeholder="Hauteur d'aspiration"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {inputData.suction_type === 'flooded' ? 'En charge (positif)' : 'Dépression (hauteur)'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ⭐ Hauteur Ref. (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={inputData.discharge_height || ''}
                      onChange={(e) => handleInputChange('discharge_height', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border-2 border-yellow-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50"
                      placeholder="Hauteur de refoulement"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pression Utile (bar)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputData.useful_pressure || ''}
                    onChange={(e) => handleInputChange('useful_pressure', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Pression supplémentaire"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Pression supplémentaire requise (processus, pression résiduelle)
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ⭐ ⌀ Aspiration (DN)
                    </label>
                    <select
                      value={inputData.suction_pipe_diameter || ''}
                      onChange={(e) => handleInputChange('suction_pipe_diameter', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border-2 border-yellow-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50"
                    >
                      <option value="">Sélectionnez un diamètre</option>
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
                      value={inputData.discharge_pipe_diameter || ''}
                      onChange={(e) => handleInputChange('discharge_pipe_diameter', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border-2 border-yellow-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50"
                    >
                      <option value="">Sélectionnez un diamètre</option>
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
                      value={inputData.suction_length || ''}
                      onChange={(e) => handleInputChange('suction_length', parseFloat(e.target.value) || 0)}
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
                      value={inputData.discharge_length || ''}
                      onChange={(e) => handleInputChange('discharge_length', parseFloat(e.target.value) || 0)}
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
                    ⭐ NPSH Requis (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputData.npsh_required || ''}
                    onChange={(e) => handleInputChange('npsh_required', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border-2 border-yellow-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-yellow-50"
                    placeholder="NPSH requis de la pompe"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Singularités Complètes */}
          {(activeSection === 'all' || activeSection === 'hydraulic') && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-orange-600 flex items-center">
                🔧 Singularités Complètes
              </h3>
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-700 mb-3 bg-blue-50 p-3 rounded-lg">
                  💧 ASPIRATION (Attention : impact critique sur NPSHd)
                </div>
                
                {/* Coudes aspiration */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Coudes 90°</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.suction_elbow_90}
                      onChange={(e) => handleInputChange('suction_elbow_90', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Coudes 45°</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.suction_elbow_45}
                      onChange={(e) => handleInputChange('suction_elbow_45', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Coudes 30°</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.suction_elbow_30}
                      onChange={(e) => handleInputChange('suction_elbow_30', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Crépine</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.suction_strainer}
                      onChange={(e) => handleInputChange('suction_strainer', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Tés et raccords aspiration */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Té (passage)</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.suction_tee_flow}
                      onChange={(e) => handleInputChange('suction_tee_flow', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Té (dérivation)</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.suction_tee_branch}
                      onChange={(e) => handleInputChange('suction_tee_branch', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Réduction grad.</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.suction_reducer_gradual}
                      onChange={(e) => handleInputChange('suction_reducer_gradual', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Réduction brusque</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.suction_reducer_sudden}
                      onChange={(e) => handleInputChange('suction_reducer_sudden', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Vannes aspiration */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">V. à opercule</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.suction_gate_valve}
                      onChange={(e) => handleInputChange('suction_gate_valve', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">V. à boisseau</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.suction_ball_valve}
                      onChange={(e) => handleInputChange('suction_ball_valve', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Clapet A.R.</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.suction_check_valve}
                      onChange={(e) => handleInputChange('suction_check_valve', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Clapet de pied</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.suction_foot_valve}
                      onChange={(e) => handleInputChange('suction_foot_valve', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="text-sm font-medium text-gray-700 mb-3 bg-green-50 p-3 rounded-lg">
                  🔄 REFOULEMENT (Impact sur HMT total)
                </div>
                
                {/* Coudes refoulement */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Coudes 90°</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.discharge_elbow_90}
                      onChange={(e) => handleInputChange('discharge_elbow_90', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Coudes 45°</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.discharge_elbow_45}
                      onChange={(e) => handleInputChange('discharge_elbow_45', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Coudes 30°</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.discharge_elbow_30}
                      onChange={(e) => handleInputChange('discharge_elbow_30', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Té (passage)</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.discharge_tee_flow}
                      onChange={(e) => handleInputChange('discharge_tee_flow', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Vannes refoulement */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">V. à opercule</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.discharge_gate_valve}
                      onChange={(e) => handleInputChange('discharge_gate_valve', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">V. à boisseau</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.discharge_ball_valve}
                      onChange={(e) => handleInputChange('discharge_ball_valve', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">V. papillon</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.discharge_butterfly_valve}
                      onChange={(e) => handleInputChange('discharge_butterfly_valve', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Clapet A.R.</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.discharge_check_valve}
                      onChange={(e) => handleInputChange('discharge_check_valve', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Accessoires refoulement */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Réduction grad.</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.discharge_reducer_gradual}
                      onChange={(e) => handleInputChange('discharge_reducer_gradual', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Débitmètre</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.discharge_flow_meter}
                      onChange={(e) => handleInputChange('discharge_flow_meter', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Manomètre</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.discharge_pressure_gauge}
                      onChange={(e) => handleInputChange('discharge_pressure_gauge', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Filtre</label>
                    <input
                      type="number"
                      min="0"
                      value={inputData.discharge_strainer}
                      onChange={(e) => handleInputChange('discharge_strainer', parseInt(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Indicateur de pertes de charge */}
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-800">
                    <strong>💡 Conseil Expert :</strong> Chaque singularité augmente les pertes de charge. 
                    Limitez les raccords sur l'aspiration pour préserver le NPSHd.
                  </p>
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
                      Prix kWh (€)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={inputData.electricity_cost}
                      onChange={(e) => handleInputChange('electricity_cost', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              
              {/* Section Données Hydrauliques Principales */}
              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                  💧 Données Hydrauliques Principales
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {inputData.flow_rate?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Débit (m³/h)</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {((inputData.flow_rate || 0) / 3.6).toFixed(3)} m³/s
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {results.total_head_loss?.toFixed(2) || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Pertes Totales (m)</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Asp: {results.npshd_analysis?.total_head_loss?.toFixed(2) || 'N/A'}m
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-indigo-600">
                      {results.npshd_analysis?.reynolds_number ? (
                        results.npshd_analysis.reynolds_number > 4000 ? 'Turbulent' : 
                        results.npshd_analysis.reynolds_number > 2300 ? 'Transitoire' : 'Laminaire'
                      ) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Régime d'Écoulement</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Re: {results.npshd_analysis?.reynolds_number?.toFixed(0) || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-cyan-600">
                      {inputData.useful_pressure?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-sm text-gray-600">Pression Utile (bar)</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {(inputData.useful_pressure * 10.2)?.toFixed(1) || '0.0'}m CE
                    </div>
                  </div>
                </div>
                
                {/* Ligne supplémentaire pour vitesses */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-blue-200">
                  <div className="text-center">
                    <div className="text-lg font-bold text-teal-600">
                      {results.npshd_analysis?.velocity?.toFixed(2) || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Vitesse Aspiration (m/s)</div>
                    <div className={`text-xs mt-1 ${(results.npshd_analysis?.velocity || 0) > 3 ? 'text-red-600' : 'text-green-600'}`}>
                      {(results.npshd_analysis?.velocity || 0) > 3 ? '⚠️ Élevée' : '✅ Normale'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-teal-600">
                      {results.hmt_analysis?.discharge_velocity?.toFixed(2) || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Vitesse Refoulement (m/s)</div>
                    <div className={`text-xs mt-1 ${(results.hmt_analysis?.discharge_velocity || 0) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                      {(results.hmt_analysis?.discharge_velocity || 0) > 5 ? '⚠️ Élevée' : '✅ Normale'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {inputData.temperature?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Température (°C)</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {inputData.fluid_type === 'water' ? 'Eau' : 
                       inputData.fluid_type === 'oil' ? 'Huile' : 
                       inputData.fluid_type === 'acid' ? 'Acide' : 'Glycol'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {inputData.suction_type === 'flooded' ? 'EN CHARGE' : 'DÉPRESSION'}
                    </div>
                    <div className="text-sm text-gray-600">Type d'Aspiration</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.abs(inputData.suction_height || 0).toFixed(1)}m
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
      
      {/* Titre dynamique avec configuration */}
      <rect x="20" y="20" width="600" height="80" fill="white" stroke={aspirationColor} strokeWidth="4" rx="15" filter="url(#shadow)"/>
      <text x="320" y="50" textAnchor="middle" className="text-xl font-bold" fill={aspirationColor}>
        {statusIcon} CONFIGURATION {statusText}
      </text>
      <text x="320" y="70" textAnchor="middle" className="text-sm" fill="#6b7280">
        {currentConfig.description}
      </text>
      <text x="320" y="90" textAnchor="middle" className="text-sm font-medium" fill="#4b5563">
        Q={inputData.flow_rate} m³/h • H={Math.abs(inputData.suction_height)}m • T={inputData.temperature}°C
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
      
      {/* Étiquettes du réservoir */}
      <text x="160" y={currentConfig.reservoirY - 20} textAnchor="middle" className="text-lg font-bold" fill="#1f2937">
        🏛️ RÉSERVOIR
      </text>
      <text x="160" y={currentConfig.reservoirY - 5} textAnchor="middle" className="text-sm" fill="#6b7280">
        {fluids.find(f => f.id === inputData.fluid_type)?.name || 'Fluide'} - {inputData.temperature}°C
      </text>
      
      {/* Indication du niveau d'eau */}
      <text x="280" y={waterLevel + 5} className="text-sm font-bold" fill="#1d4ed8">
        💧 Niveau d'eau
      </text>
      <text x="280" y={waterLevel + 20} className="text-xs" fill="#6b7280">
        Référence aspiration
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
      <text x="270" y={waterLevel + 35} textAnchor="middle" className="text-sm font-medium" fill="#6b7280">
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
        <text x="50" y="20" textAnchor="middle" className="text-sm font-bold" fill="white">
          🔄 POMPE
        </text>
        <text x="50" y="65" textAnchor="middle" className="text-xs font-medium" fill="white">
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
      <text x="500" y={actualPumpY + 100} textAnchor="middle" className="text-sm font-bold" fill="#047857">
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
      <text x="720" y="135" className="text-sm font-bold" fill="#10b981">
        🎯 SORTIE REFOULEMENT
      </text>
      <text x="720" y="150" className="text-xs" fill="#6b7280">
        H={inputData.discharge_height}m • P={inputData.useful_pressure}bar
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
      
      {/* Section Propriétés du Fluide */}
      <rect x="850" y="160" width="320" height="130" fill="#f0f9ff" stroke="#0284c7" strokeWidth="2" rx="10" />
      <text x="860" y="180" className="text-sm font-bold" fill="#0c4a6e">💧 PROPRIÉTÉS DU FLUIDE</text>
      
      <text x="860" y="200" className="text-xs" fill="#1f2937">
        Type: {fluids.find(f => f.id === inputData.fluid_type)?.name || 'N/A'}
      </text>
      <text x="860" y="215" className="text-xs" fill="#1f2937">
        Température: {inputData.temperature}°C
      </text>
      <text x="860" y="230" className="text-xs" fill="#1f2937">
        Masse volumique: {results.npshd_analysis?.fluid_properties?.density || 'N/A'} kg/m³
      </text>
      <text x="860" y="245" className="text-xs" fill="#1f2937">
        Viscosité: {results.npshd_analysis?.fluid_properties?.viscosity || 'N/A'} Pa·s
      </text>
      <text x="860" y="260" className="text-xs" fill="#1f2937">
        P. vapeur: {results.npshd_analysis?.fluid_properties?.vapor_pressure ? 
          (results.npshd_analysis.fluid_properties.vapor_pressure / 1000).toFixed(2) : 'N/A'} kPa
      </text>
      <text x="860" y="275" className="text-xs" fill="#1f2937">
        P. atmosphérique: {results.npshd_analysis?.atmospheric_pressure ? 
          (results.npshd_analysis.atmospheric_pressure / 1000).toFixed(1) : '101.3'} kPa
      </text>
      
      {/* Section Configuration */}
      <rect x="850" y="300" width="320" height="100" fill={isFlooded ? "#e0f2fe" : "#fef2f2"} stroke={aspirationColor} strokeWidth="2" rx="10" />
      <text x="860" y="320" className="text-sm font-bold" fill={aspirationColor}>
        {statusIcon} CONFIGURATION {statusText}
      </text>
      
      <text x="860" y="340" className="text-xs" fill="#1f2937">
        Installation: {inputData.installation_type === 'surface' ? 'Surface' : 'Immergée'}
      </text>
      <text x="860" y="355" className="text-xs" fill="#1f2937">
        Type aspiration: {isFlooded ? 'Gravitaire (charge)' : 'Dépression (lift)'}
      </text>
      <text x="860" y="370" className="text-xs" fill="#1f2937">
        Hauteur: {Math.abs(inputData.suction_height).toFixed(1)}m {isFlooded ? '(sous pompe)' : '(à aspirer)'}
      </text>
      <text x="860" y="385" className="text-xs" fill="#1f2937">
        Avantages: {isFlooded ? 'Amorçage auto, fiabilité' : 'Pompe protégée, maintenance'}
      </text>
      
      {/* Section Hydraulique */}
      <rect x="850" y="410" width="320" height="140" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" rx="10" />
      <text x="860" y="430" className="text-sm font-bold" fill="#1e40af">⚡ HYDRAULIQUE</text>
      
      <text x="860" y="450" className="text-xs" fill="#1f2937">
        Débit nominal: {inputData.flow_rate} m³/h ({((inputData.flow_rate || 0) / 3.6).toFixed(3)} m³/s)
      </text>
      <text x="860" y="465" className="text-xs" fill="#1f2937">
        NPSHd calculé: {results.npshd_analysis?.npshd?.toFixed(2) || 'N/A'} m
      </text>
      <text x="860" y="480" className="text-xs" fill="#1f2937">
        NPSH requis: {inputData.npsh_required} m
      </text>
      <text x="860" y="495" className="text-xs" fill="#1f2937">
        Marge sécurité: {results.npshd_analysis?.npsh_margin?.toFixed(2) || 'N/A'} m
      </text>
      <text x="860" y="510" className="text-xs" fill="#1f2937">
        HMT total: {results.hmt_analysis?.hmt?.toFixed(2) || 'N/A'} m
      </text>
      <text x="860" y="525" className="text-xs" fill="#1f2937">
        Vitesse aspiration: {results.npshd_analysis?.velocity?.toFixed(2) || 'N/A'} m/s
      </text>
      <text x="860" y="540" className="text-xs" fill="#1f2937">
        Régime écoulement: {results.npshd_analysis?.reynolds_number > 4000 ? 'Turbulent' : 
                  results.npshd_analysis?.reynolds_number > 2300 ? 'Transitoire' : 'Laminaire'} 
        (Re={results.npshd_analysis?.reynolds_number?.toFixed(0) || 'N/A'})
      </text>
      
      {/* Section Pertes de charge */}
      <rect x="850" y="560" width="320" height="100" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" rx="10" />
      <text x="860" y="580" className="text-sm font-bold" fill="#92400e">📉 PERTES DE CHARGE</text>
      
      <text x="860" y="600" className="text-xs" fill="#1f2937">
        Pertes aspiration: {results.npshd_analysis?.total_head_loss?.toFixed(2) || 'N/A'} m
      </text>
      <text x="860" y="615" className="text-xs" fill="#1f2937">
        Pertes refoulement: {results.hmt_analysis?.total_head_loss?.toFixed(2) || 'N/A'} m
      </text>
      <text x="860" y="630" className="text-xs" fill="#1f2937">
        Pertes totales: {results.total_head_loss?.toFixed(2) || 'N/A'} m
      </text>
      <text x="860" y="645" className="text-xs" fill="#1f2937">
        Coefficient K total: {((results.total_head_loss || 0) / ((results.npshd_analysis?.velocity || 1)**2 / (2 * 9.81))).toFixed(1)}
      </text>
      
      {/* Section Performance */}
      <rect x="850" y="670" width="320" height="60" fill="#f0fdf4" stroke="#10b981" strokeWidth="2" rx="10" />
      <text x="860" y="690" className="text-sm font-bold" fill="#166534">📈 PERFORMANCE</text>
      
      <text x="860" y="710" className="text-xs" fill="#1f2937">
        Rendement global: {results.overall_efficiency?.toFixed(1) || 'N/A'}% 
        (Pompe: {inputData.pump_efficiency}% × Moteur: {inputData.motor_efficiency}%)
      </text>
      <text x="860" y="725" className="text-xs" fill="#1f2937">
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