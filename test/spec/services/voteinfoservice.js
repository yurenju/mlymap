'use strict';

describe('Service: voteInfoService', function () {

  // load the service's module
  beforeEach(module('mlymapApp'));

  // instantiate service
  var voteInfoService;
  beforeEach(inject(function (_Voteinfoservice_) {
    voteInfoService = _Voteinfoservice_;
  }));

  it('should do something', function () {
    expect(!!voteInfoService).toBe(true);
  });

});
