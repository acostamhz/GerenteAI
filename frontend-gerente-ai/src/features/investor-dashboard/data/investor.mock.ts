export const investorOverview = {
  users: {
    total: 1284,
    monthlyGrowth: 18.7,
    active: 1097,
  },

  businesses: {
    total: 347,
    monthlyGrowth: 12.4,
    active: 291,
  },

  revenue: {
    monthly: 18450000,
    monthlyGrowth: 21.3,
    mrr: 18450000,
    arr: 221400000,
  },

  retention: {
    rate: 91.4,
    churn: 2.8,
  },

  activity: {
    messages: 184920,
    sales: 28431,
    reports: 3921,
    aiInteractions: 76340,
  },

  locations: {
    cities: 18,
    departments: 7,
  },
};

export const userGrowthData = [
  { month: "Mar", users: 421 },
  { month: "Abr", users: 563 },
  { month: "May", users: 714 },
  { month: "Jun", users: 892 },
  { month: "Jul", users: 1081 },
  { month: "Ago", users: 1284 },
];

export const revenueGrowthData = [
  { month: "Mar", revenue: 6200000 },
  { month: "Abr", revenue: 8100000 },
  { month: "May", revenue: 10400000 },
  { month: "Jun", revenue: 12700000 },
  { month: "Jul", revenue: 15200000 },
  { month: "Ago", revenue: 18450000 },
];

export const businessGrowthData = [
  { month: "Mar", businesses: 118 },
  { month: "Abr", businesses: 154 },
  { month: "May", businesses: 193 },
  { month: "Jun", businesses: 237 },
  { month: "Jul", businesses: 309 },
  { month: "Ago", businesses: 347 },
];

export const businessTypeData = [
  {
    name: "Tiendas",
    value: 128,
  },
  {
    name: "Restaurantes",
    value: 84,
  },
  {
    name: "Cafeterías",
    value: 63,
  },
  {
    name: "Minimercados",
    value: 42,
  },
  {
    name: "Otros",
    value: 30,
  },
];

export const recentActivity = [
  {
    id: 1,
    type: "business",
    title: "Nuevo negocio registrado",
    description: "Una nueva tienda se registró en Cali.",
    time: "Hace 3 minutos",
  },
  {
    id: 2,
    type: "user",
    title: "Nuevo usuario",
    description: "Un nuevo administrador creó su cuenta.",
    time: "Hace 8 minutos",
  },
  {
    id: 3,
    type: "subscription",
    title: "Nueva suscripción",
    description: "Un negocio activó un plan de pago.",
    time: "Hace 17 minutos",
  },
  {
    id: 4,
    type: "report",
    title: "Reporte generado",
    description: "Luka generó un reporte financiero.",
    time: "Hace 24 minutos",
  },
  {
    id: 5,
    type: "ai",
    title: "Actividad de IA",
    description: "Luka procesó una nueva interacción.",
    time: "Hace 31 minutos",
  },
];