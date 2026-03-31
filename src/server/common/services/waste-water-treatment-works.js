// Faciendum: Replace mock data with a call to the backend endpoint
const mockWasteWaterTreatmentWorks = [
  { id: 'great-billing', name: 'Great Billing WRC (Mock)', distance: 3.2 },
  { id: 'letchworth', name: 'Letchworth WWTP (Mock)', distance: 7.5 }
]

export async function getWasteWaterTreatmentWorks() {
  return mockWasteWaterTreatmentWorks
}
