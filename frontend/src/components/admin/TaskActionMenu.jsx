import React from "react";
import { Eye as Visibility } from "@phosphor-icons/react";
import ActionMenu from "./ActionMenu";

const TaskActionMenu = ({
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

export default TaskActionMenu;
