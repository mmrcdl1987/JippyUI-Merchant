import {
  FaHome,
  FaStore,
  FaHamburger,
  FaShoppingBag,
  FaTags,
  FaCreditCard,
  FaClipboardList,
  FaUsers,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaChevronDown,
} from "react-icons/fa";

export const menuData = [
  {
    name: "Dashboard",
    icon: <FaHome />,
    path: "/dashboard",
  },
  {
    name: "Outlets",
    icon: <FaStore />,
    path: "/outlets",
  },
  {
    name: "Foods",
    icon: <FaHamburger />,
    path: "/foods",
  },
  {
    name: "Orders",
    icon: <FaShoppingBag />,
    children: [
      {
        name: "Orders",
        path: "/orders",
      },
      {
        name: "Placed Orders",
        path: "/orders/placed",
      },
      {
        name: "Accepted Orders",
        path: "/orders/accepted",
      },
      {
        name: "Rejected Orders",
        path: "/orders/rejected",
      },
    ],
  },
  {
    name: "Promotions",
    icon: <FaTags />,
    path: "/promotions",
  },
  {
    name: "Payments",
    icon: <FaCreditCard />,
    path: "/payments",
  },
  {
    name: "Subscription",
    icon: <FaClipboardList />,
    path: "/subscription",
  },
];