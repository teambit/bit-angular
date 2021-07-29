import { Injectable } from '@angular/core';

@Injectable()
export class BitTestService {
  get content() {
    return 'Content from service';
  }
}
