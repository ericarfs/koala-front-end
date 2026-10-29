import { Injectable } from "@angular/core";
import { DeviceTypeService } from "@shared/domain/device-type/services/device-type";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { DeviceType } from "@shared/interfaces/device-type";

@Injectable()
export class GuestDeviceTypeService extends DeviceTypeService {
  override findAll(): Observable<DeviceType[]> {
    return this.http.get<DeviceType[]>(`${environment.apiUrl}guest/deviceTypes`);
  }
}
