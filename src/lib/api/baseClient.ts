import { AxiosInstance, AxiosResponse } from "axios";
import { axiosInstance } from "./axiosInstance";
import { ApiResponse } from "@shared/interfaces";

export class BaseApiClient {
  protected axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axiosInstance;
  }

  protected extractData<T>(response: AxiosResponse<ApiResponse<T>>): T {
    console.log("BaseClient received response:", response.data);
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    console.error("Invalid response structure:", response.data);
    throw new Error("Invalid API response structure");
  }
}
