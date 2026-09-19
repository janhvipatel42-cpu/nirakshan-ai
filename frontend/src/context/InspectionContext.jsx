import React, { createContext, useCallback, useContext, useState } from "react";
import { api } from "../api/client.js";

const InspectionContext = createContext(null);

export function InspectionProvider({ children }) {
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadInspection = useCallback(async (id, { force = false } = {}) => {
    if (!force && inspection && String(inspection.id) === String(id)) return inspection;
    setLoading(true);
    try {
      const data = await api.getInspection(id);
      setInspection(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, [inspection]);

  return (
    <InspectionContext.Provider value={{ inspection, setInspection, loading, loadInspection }}>
      {children}
    </InspectionContext.Provider>
  );
}

export function useInspection() {
  return useContext(InspectionContext);
}
