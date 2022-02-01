import { ComponentContext, ComponentFile } from '@teambit/generator';

export const componentSpecFile = (context: ComponentContext): ComponentFile => {
  const { name, namePascalCase: Name } = context;

  return {
    relativePath: `src/${name}.spec.ts`,
    content: `import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ${Name}Component } from './${name}.component';
import { ${Name}Module } from './${name}.module';

describe('${Name}Component', () => {
  let component: ${Name}Component;
  let fixture: ComponentFixture<${Name}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ${Name}Module ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(${Name}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
`,
  };
};
