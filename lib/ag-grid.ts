import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

let isAgGridRegistered = false;

export const ensureAgGridModules = () => {
  if (isAgGridRegistered) return;
  ModuleRegistry.registerModules([AllCommunityModule]);
  isAgGridRegistered = true;
};
