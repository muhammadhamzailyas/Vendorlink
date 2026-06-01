import React from "react";
import { Eye as Visibility, Download } from "@phosphor-icons/react";
import ActionMenu from "./ActionMenu";

const PaymentActionMenu = ({
  actionLoading,
  onView,
  onDownload,
  hasInvoice
}) => {
  const items = [
    {
      label: "View Details",
      icon: Visibility,
      onClick: onView,
    },
    {
      label: "Download PDF",
      icon: Download,
      onClick: onDownload,
      hidden: !hasInvoice,
    },
  ];

  return <ActionMenu loading={actionLoading} items={items} />;
};

export default PaymentActionMenu;
