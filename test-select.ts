import { Component } from '@angular/core';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';

@Component({
  selector: 'test-select',
  standalone: true,
  imports: [BrnSelectImports, HlmSelectImports],
  template: `
    <hlm-select>
      <button hlmSelectTrigger>
        <hlm-select-value />
      </button>
      <hlm-select-content>
        <hlm-select-item value="1">1</hlm-select-item>
      </hlm-select-content>
    </hlm-select>
  `
})
export class TestSelect {}
