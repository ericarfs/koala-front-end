import { Location } from "@shared/interfaces/location";

export const LOCATIONS_MOCK: Location[] = [
  // Raiz
  { id: 1, name: 'USP', parentId: null },

  // Campus São Carlos
  { id: 2, name: 'Campus São Carlos', parentId: 1 },
  { id: 3, name: 'ICMC', parentId: 2 },
  { id: 4, name: '1006',         description: 'Laboratorio 1006',      parentId: 3 },
  { id: 5, name: '1008',         description: 'Laboratorio 1008',      parentId: 3 },
  { id: 9,  name: 'EESC', parentId: 2 },
  { id: 10, name: 'IFSC', parentId: 2 },
  { id: 11, name: 'IQSC', parentId: 2 },
  { id: 12, name: 'IAU',  parentId: 2 },
  { id: 13, name: 'E1', description: 'E1 prédio.', parentId: 2 },

  // Campus Ribeirão Preto
  { id: 14, name: 'Campus Ribeirão Preto', parentId: 1 },

  // Campus Piracicaba
  { id: 21, name: 'Campus Piracicaba', parentId: 1 },

  // Campus Pirassununga
  { id: 24, name: 'Campus Pirassununga', parentId: 1 },

  // Campus Bauru
  { id: 27, name: 'Campus Bauru', parentId: 1 },

  // Campus Lorena
  { id: 30, name: 'Campus Lorena', parentId: 1 },

  // Cidade Universitária (São Paulo)
  { id: 32, name: 'Cidade Universitária (São Paulo)', parentId: 1 },

  // Externo (usado pelos devices 15, 16 e 17)
  { id: 7,  name: 'Externo', description: 'Dispositivos externos', parentId: null },

  // Fora da USP (raízes)
  { id: 38, name: 'Bath',    description: 'Sensores Inglaterra', parentId: null },
  { id: 39, name: 'UFSCAR',  description: 'Faculdade',           parentId: null },
  { id: 40, name: 'Unicamp', description: 'Faculdade',           parentId: null },
];
