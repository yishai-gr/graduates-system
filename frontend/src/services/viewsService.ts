import { ApiClient } from "./apiClient";

export interface HomeViewData {
  stats: {
    totalGraduates: number;
    newGraduatesLastMonth: number;
    totalUsers: number;
    adminsCount: number;
    coordinatorsCount: number;
    myGraduates: number;
  };
}

export const ViewsService = {
  getHomeView: () => ApiClient.get<HomeViewData>("/views/home"),
};
