import { Injectable } from "@angular/core";
import { LocationService } from "@shared/domain/location/services/location";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { Location } from "@shared/interfaces/location";

@Injectable()
export class GuestLocationService extends LocationService {
  override findAll(): Observable<Location[]> {
    return this.http.get<Location[]>(`${environment.apiUrl}guest/environment`);
  }
}
