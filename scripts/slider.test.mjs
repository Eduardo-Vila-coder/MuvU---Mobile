import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sliderValueAtPosition as valueAt } from '../src/utils/slider.ts';

test('slider snaps touch positions to steps inside the range', () => {
  assert.equal(valueAt(0, 300, 1, 10, 1), 1);
  assert.equal(valueAt(300, 300, 1, 10, 1), 10);
  assert.equal(valueAt(150, 300, 1, 10, 1), 6);
  assert.equal(valueAt(33, 300, 1, 10, 1), 2);
  assert.equal(valueAt(100, 200, 0, 10, 0.5), 5);
  assert.equal(valueAt(120, 200, 0, 10, 0.5), 6);
});

test('slider clamps positions outside the track and survives a zero width', () => {
  assert.equal(valueAt(-40, 300, 1, 10, 1), 1);
  assert.equal(valueAt(900, 300, 1, 10, 1), 10);
  assert.equal(valueAt(150, 0, 1, 10, 1), 1);
  assert.equal(valueAt(150, 300, 5, 5, 1), 5);
});
