import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'any' })
export class BitTestService {
  get content() {
    return 'Content from service';
  }
}
