import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { MetricsService } from "@shared/domain/monitoring/services/metrics";

@Injectable()
export class GuestMetricsService extends MetricsService {
  protected override readonly url = `${environment.apiUrl}guest`;
}
