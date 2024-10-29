import { AxiosInstance, AxiosResponse } from "axios";
import { axiosInstance } from "./axiosInstance";
import { ApiResponse } from "@shared/interfaces";

export class BaseApiClient {
  protected axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axiosInstance;
  }

  protected extractData<T>(response: AxiosResponse<ApiResponse<T>>): T {
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    throw new Error("Invalid API response structure");
  }
}
