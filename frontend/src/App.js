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
    suction_fittings: []
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
                />
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

// Component pour Tab 3 - Analyse de Performance
const PerformanceAnalysis = ({ fluids, pipeMaterials }) => {
  const [inputData, setInputData] = useState({
    flow_rate: 50,
    hmt: 25,
    pipe_diameter: 100,
    required_npsh: 3.5,
    calculated_npshd: 4.2,
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

  const handleInputChange = (field, value) => {
    setInputData(prev => ({ ...prev, [field]: value }));
  };

  const calculatePerformance = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/calculate-performance`, inputData);
      setResult(response.data);
      updateChart(response.data);
    } catch (error) {
      console.error('Erreur analyse performance:', error);
      alert('Erreur lors de l\'analyse de performance: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const updateChart = (data) => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const curves = data.performance_curves;
    
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: curves.flow,
        datasets: [
          {
            label: 'HMT (m)',
            data: curves.hmt,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4
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
              text: 'HMT (m)',
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
              }
            }
          },
          title: {
            display: true,
            text: 'Courbe de Performance: Débit en fonction de la HMT',
            font: {
              size: 16,
              weight: 'bold'
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
                  NPSH requis (m) - Données constructeur
                </label>
                <input
                  type="number"
                  value={inputData.required_npsh}
                  onChange={(e) => handleInputChange('required_npsh', parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NPSHd calculé (m) - Onglet NPSHd
                </label>
                <input
                  type="number"
                  value={inputData.calculated_npshd}
                  onChange={(e) => handleInputChange('calculated_npshd', parseFloat(e.target.value))}
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
                <h4 className="font-medium text-gray-700 border-b pb-2">Comparaison NPSH</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>NPSHd calculé:</span>
                    <span className="font-medium">{result.npsh_comparison?.npshd_calculated?.toFixed(2)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NPSH requis:</span>
                    <span className="font-medium">{result.npsh_comparison?.npsh_required?.toFixed(2)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Marge de sécurité:</span>
                    <span className={`font-medium ${result.cavitation_risk ? 'text-red-600' : 'text-green-600'}`}>
                      {result.npsh_comparison?.safety_margin?.toFixed(2)} m
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Risque cavitation:</span>
                    <span className={`font-bold ${result.cavitation_risk ? 'text-red-600' : 'text-green-600'}`}>
                      {result.cavitation_risk ? 'OUI' : 'NON'}
                    </span>
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
          
          {/* Graphique des courbes de performance */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Courbes de Performance</h3>
            <canvas ref={chartRef} className="w-full h-96"></canvas>
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