import { base44 } from "@base44/sdk";

export async function onInspectionCreate(event) {
  const { data, id } = event;
  
  // Get all inspections to count for sequential numbering
  const allInspections = await base44.asServiceRole.entities.Inspection.list();
  const inspectionNumber = `INS-${String(allInspections.length).padStart(4, '0')}`;
  
  // Update the inspection with the generated number
  await base44.asServiceRole.entities.Inspection.update(id, {
    inspection_number: inspectionNumber
  });
}