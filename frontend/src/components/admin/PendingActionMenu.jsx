import React from "react";
import { Eye as Visibility } from "@phosphor-icons/react";
import ActionMenu from "./ActionMenu";

const PendingActionMenu = ({
  actionLoading,
  onView,
}) => {
  const items = [
    {
      label: "Show Details",
      icon: Visibility,
      onClick: onView,
    },
  ];

  return <ActionMenu loading={actionLoading} items={items} />;
};

export default PendingActionMenu;
