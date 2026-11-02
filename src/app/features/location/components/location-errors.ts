import { MutationError } from '@shared/domain/crud/crud.types';

export function locationErrorMessage(reason: MutationError): string {
  switch (reason) {
    case 'MAX_DEPTH_EXCEEDED': return 'LOCATIONS.ERRORS.MAX_DEPTH';
    case 'INVALID_PARENT':     return 'LOCATIONS.ERRORS.INVALID_PARENT';
    case 'NOT_FOUND':          return 'COMMON.ERRORS.NOT_FOUND';
  }
}
