import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [inputData, setInputData] = useState({
    flow_rate: 50,
    suction_height: 3,
    pipe_diameter: 100,
    pipe_length: 50,
    fluid_type: 'water',
    temperature: 20,
    npsh_available: null,
    pump_efficiency: 75,
    motor_efficiency: 90,
    voltage: 400,
    cable_length: 50
  });

  const [result, setResult] = useState(null);
  const [fluids, setFluids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [activeTab, setActiveTab] = useState('calculation');

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Load available fluids
  useEffect(() => {
    loadFluids();
    loadHistory();
  }, []);

  const loadFluids = async () => {
    try {
      const response = await axios.get(`${API}/fluids`);
      setFluids(response.data.fluids);
    } catch (error) {
      console.error('Error loading fluids:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await axios.get(`${API}/history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleInputChange = (field, value) => {
    const newInputData = { ...inputData, [field]: value };
    setInputData(newInputData);
    
    // Auto-calculate on input change
    if (result) {
      performCalculation(newInputData);
    }
  };

  const performCalculation = async (data = inputData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/calculate`, data);
      setResult(response.data);
      updateChart(response.data);
    } catch (error) {
      console.error('Calculation error:', error);
      alert('Error performing calculation: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const saveCalculation = async () => {
    if (!result || !projectName) {
      alert('Please enter a project name and perform calculation first');
      return;
    }

    try {
      await axios.post(`${API}/save-calculation`, {
        project_name: projectName,
        calculation_result: result
      });
      alert('Calculation saved successfully!');
      setProjectName('');
      loadHistory();
    } catch (error) {
      console.error('Error saving calculation:', error);
      alert('Error saving calculation');
    }
  };

  const loadFromHistory = (historyItem) => {
    setInputData(historyItem.calculation_result.input_data);
    setResult(historyItem.calculation_result);
    setProjectName(historyItem.project_name);
    setActiveTab('calculation');
    updateChart(historyItem.calculation_result);
  };

  const deleteHistoryItem = async (historyId) => {
    try {
      await axios.delete(`${API}/history/${historyId}`);
      loadHistory();
    } catch (error) {
      console.error('Error deleting history item:', error);
    }
  };

  const updateChart = (data) => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Generate sample data points for curves
    const flowPoints = [];
    const hmtPoints = [];
    const npshPoints = [];
    const efficiencyPoints = [];
    const powerPoints = [];

    for (let i = 0; i <= 100; i += 10) {
      const flow = i;
      const hmt = data.hmt_meters * (1 - (flow / 100) * 0.3); // Typical pump curve
      const npsh = data.npsh_required * (1 + (flow / 100) * 0.5);
      const efficiency = data.total_efficiency * (1 - Math.abs(flow - 50) / 100);
      const power = data.absorbed_power * (0.5 + (flow / 100) * 0.8);

      flowPoints.push(flow);
      hmtPoints.push(Math.max(0, hmt));
      npshPoints.push(Math.max(0, npsh));
      efficiencyPoints.push(Math.max(0, efficiency));
      powerPoints.push(Math.max(0, power));
    }

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: flowPoints,
        datasets: [
          {
            label: 'HMT (m)',
            data: hmtPoints,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            yAxisID: 'y'
          },
          {
            label: 'NPSH (m)',
            data: npshPoints,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            yAxisID: 'y'
          },
          {
            label: 'Efficiency (%)',
            data: efficiencyPoints,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            yAxisID: 'y1'
          },
          {
            label: 'Power (kW)',
            data: powerPoints,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            yAxisID: 'y2'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Flow Rate (m³/h)'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'HMT & NPSH (m)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Efficiency (%)'
            },
            grid: {
              drawOnChartArea: false,
            },
          },
          y2: {
            type: 'linear',
            display: false,
            position: 'right',
          }
        },
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Pump Performance Curves'
          }
        }
      }
    });
  };

  const formatNumber = (num, decimals = 2) => {
    return Number(num).toFixed(decimals);
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
                onClick={() => setActiveTab('calculation')}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === 'calculation'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800'
                }`}
              >
                Calculateur
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-md font-medium ${
                  activeTab === 'history'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800'
                }`}
              >
                Historique
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calculation' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Paramètres d'Entrée</h2>
                
                {/* Hydraulic Data */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Données Hydrauliques</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
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
                        Hauteur d'Aspiration (m)
                      </label>
                      <input
                        type="number"
                        value={inputData.suction_height}
                        onChange={(e) => handleInputChange('suction_height', parseFloat(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Diamètre de Tuyauterie (mm)
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
                        Longueur de Tuyauterie (m)
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

                {/* Fluid Selection */}
                <div className="mt-6 space-y-4">
                  <h3 className="font-medium text-gray-700">Propriétés du Fluide</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
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
                          <option key={fluid.id} value={fluid.id}>
                            {fluid.name}
                          </option>
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

                {/* Pump Parameters */}
                <div className="mt-6 space-y-4">
                  <h3 className="font-medium text-gray-700">Paramètres Pompe & Moteur</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rendement Pompe (%)
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
                        Rendement Moteur (%)
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
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longueur de Câble (m)
                      </label>
                      <input
                        type="number"
                        value={inputData.cable_length}
                        onChange={(e) => handleInputChange('cable_length', parseFloat(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => performCalculation()}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {loading ? 'Calcul en cours...' : 'Calculer'}
                  </button>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nom du projet"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={saveCalculation}
                      className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
                    >
                      Sauvegarder
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              {result && (
                <>
                  {/* Warnings */}
                  {result.warnings && result.warnings.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-medium text-red-800 mb-2">⚠️ Warnings</h3>
                      <ul className="text-sm text-red-700 space-y-1">
                        {result.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Results */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">Calculation Results</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Hydraulic Results */}
                      <div className="space-y-3">
                        <h3 className="font-medium text-gray-700 border-b pb-2">Hydraulic Results</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Flow Velocity:</span>
                            <span className="font-medium">{formatNumber(result.flow_velocity)} m/s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Reynolds Number:</span>
                            <span className="font-medium">{formatNumber(result.reynolds_number, 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>HMT:</span>
                            <span className="font-medium">{formatNumber(result.hmt_meters)} m</span>
                          </div>
                          <div className="flex justify-between">
                            <span>HMT (bar):</span>
                            <span className="font-medium">{formatNumber(result.hmt_bar)} bar</span>
                          </div>
                          <div className="flex justify-between">
                            <span>NPSH Required:</span>
                            <span className="font-medium">{formatNumber(result.npsh_required)} m</span>
                          </div>
                          <div className="flex justify-between">
                            <span>NPSH Available:</span>
                            <span className={`font-medium ${result.cavitation_risk ? 'text-red-600' : 'text-green-600'}`}>
                              {formatNumber(result.npsh_available_calc)} m
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Power Results */}
                      <div className="space-y-3">
                        <h3 className="font-medium text-gray-700 border-b pb-2">Power & Electrical</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Hydraulic Power:</span>
                            <span className="font-medium">{formatNumber(result.hydraulic_power)} kW</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Absorbed Power:</span>
                            <span className="font-medium">{formatNumber(result.absorbed_power)} kW</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Efficiency:</span>
                            <span className="font-medium">{formatNumber(result.total_efficiency)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Nominal Current:</span>
                            <span className="font-medium">{formatNumber(result.nominal_current)} A</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cable Section:</span>
                            <span className="font-medium">{formatNumber(result.cable_section, 1)} mm²</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Starting Method:</span>
                            <span className="font-medium">{result.starting_method}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fluid Properties */}
                    <div className="mt-6 pt-4 border-t">
                      <h3 className="font-medium text-gray-700 mb-3">Fluid Properties @ {inputData.temperature}°C</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{formatNumber(result.fluid_properties.density, 0)}</div>
                          <div className="text-gray-500">kg/m³</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{formatNumber(result.fluid_properties.viscosity, 4)}</div>
                          <div className="text-gray-500">Pa·s</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{formatNumber(result.fluid_properties.vapor_pressure, 0)}</div>
                          <div className="text-gray-500">Pa</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <canvas ref={chartRef} className="w-full h-96"></canvas>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Calculation History</h2>
            
            {history.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No saved calculations yet. Perform and save calculations to see them here.
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
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Flow:</span>
                            <span className="ml-1 font-medium">{item.calculation_result.input_data.flow_rate} m³/h</span>
                          </div>
                          <div>
                            <span className="text-gray-500">HMT:</span>
                            <span className="ml-1 font-medium">{formatNumber(item.calculation_result.hmt_meters)} m</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Power:</span>
                            <span className="ml-1 font-medium">{formatNumber(item.calculation_result.absorbed_power)} kW</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Fluid:</span>
                            <span className="ml-1 font-medium">{item.calculation_result.fluid_properties.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => loadFromHistory(item)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(item.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;