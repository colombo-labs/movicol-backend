import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

import { PaginationParams } from '../interfaces/pagination.interface';

@Injectable()
export class ParsePaginationPipe implements PipeTransform<any, PaginationParams> {
  transform(value: any, _metadata: ArgumentMetadata): PaginationParams {
    return {
      limit: Math.min(parseInt(value?.limit, 10) || 100, 500),
      offset: Math.max(parseInt(value?.offset, 10) || 0, 0),
    };
  }
}
