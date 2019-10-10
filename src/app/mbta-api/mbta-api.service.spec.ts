import { TestBed } from '@angular/core/testing';

import { MbtaApiService } from './mbta-api.service';

describe('MbtaApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MbtaApiService = TestBed.get(MbtaApiService);
    expect(service).toBeTruthy();
  });
});
