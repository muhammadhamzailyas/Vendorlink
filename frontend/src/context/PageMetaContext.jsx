import React, { createContext, useContext, useState } from "react";

const PageMetaContext = createContext();

export const PageMetaProvider = ({ children }) => {
  const [meta, setMeta] = useState({ title: "", subtitle: "" });

  return (
    <PageMetaContext.Provider value={{ meta, setMeta }}>
      {children}
    </PageMetaContext.Provider>
  );
};

export const usePageMetaContext = () => {
  const context = useContext(PageMetaContext);
  if (!context) {
    throw new Error("usePageMetaContext must be used within a PageMetaProvider");
  }
  return context;
};
