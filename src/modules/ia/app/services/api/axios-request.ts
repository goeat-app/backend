import { AxiosInstance } from 'axios';

export class axiosRequest {
  private axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  async post(url: string, data: any) {
    try {
      const res = await this.axiosInstance.post(url, data, {
        headers: { 'Content-Type': 'application/json' },
      });
      return res.data;
    } catch (err) {
      console.log('Error sending payload to recommender', err);
      throw err;
    }
  }
}