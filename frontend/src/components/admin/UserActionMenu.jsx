import React from "react";
import { Eye as Visibility, Prohibit, Trash } from "@phosphor-icons/react";
import ActionMenu from "./ActionMenu";

const UserActionMenu = ({
  user,
  actionLoading,
  onView,
  onSuspend,
  onArchive,
}) => {
  const items = [
    {
      label: "View Details",
      icon: Visibility,
      onClick: onView,
    },
    {
      label: "Deactivate",
      icon: Prohibit,
      onClick: onSuspend,
      hidden: user?.role === "admin",
      disabled: actionLoading,
    },
    {
      type: "separator",
      hidden: user?.role === "admin",
    },
    {
      label: "Delete User",
      icon: Trash,
      onClick: onArchive,
      variant: "danger",
      hidden: user?.role === "admin",
      disabled: actionLoading,
    },
  ];

  return <ActionMenu loading={actionLoading} items={items} />;
};

export default UserActionMenu;
