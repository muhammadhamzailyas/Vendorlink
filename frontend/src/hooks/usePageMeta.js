import { useEffect } from "react";
import { usePageMetaContext } from "../context/PageMetaContext";

export const usePageMeta = (title, subtitle = "") => {
  const { setMeta } = usePageMetaContext();

  useEffect(() => {
    setMeta({ title, subtitle });
    document.title = `${title} — Vendorlink`;

    // Cleanup when component unmounts
    return () => setMeta({ title: "", subtitle: "" });
  }, [title, subtitle, setMeta]);
};
