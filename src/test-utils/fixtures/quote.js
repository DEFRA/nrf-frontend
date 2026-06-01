export const fullQuote = {
  reference: 'NRF-123456',
  boundary: {
    userInputType: 'upload',
    filename: 'site-plan.geojson'
  },
  development: {
    types: ['housing', 'other-residential'],
    residentialBuildingCount: '42',
    peopleCount: '100'
  },
  wasteWaterTreatmentWorksId: 'unknown',
  wasteWaterTreatmentWorksName: null,
  email: {
    address: 'test@example.com'
  },
  levyGbp: '£1500 - £3500',
  edps: [
    {
      edpId: 'EDP-001',
      edpName: 'Norfolk Fens East',
      edpType: 'NUTRIENT',
      impact: {
        nitrogenTotal: {
          amount: 1.5,
          unit: 'mg/I TP',
          band: { min: 1, max: 2 }
        },
        phosphorusTotal: {
          amount: 0.8,
          unit: 'mg/I TP',
          band: { min: 1, max: 3 }
        }
      },
      levyGbp: { min: 1000, max: 2000 }
    },
    {
      edpId: 'EDP-002',
      edpName: 'Broadland Rivers',
      edpType: 'NUTRIENT',
      impact: {
        nitrogenTotal: {
          amount: 2.1,
          unit: 'mg/I TP',
          band: { min: 2, max: 3 }
        },
        phosphorusTotal: {
          amount: 1.2,
          unit: 'mg/I TP',
          band: { min: 1, max: 2 }
        }
      },
      levyGbp: { min: 500, max: 1500 }
    }
  ]
}
