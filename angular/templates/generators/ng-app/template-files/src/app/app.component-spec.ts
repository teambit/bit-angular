import { ComponentContext, ComponentFile } from '@teambit/generator';

export const appComponentSpecFile = (context: ComponentContext, standalone: boolean): ComponentFile => {
  const { name } = context;
  return {
    relativePath: `src/app/app.component.spec.ts`,
    content: `import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      ${standalone ? `imports: [AppComponent]` : `declarations: [AppComponent]`},
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(\`should have the '${name}' title\`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('${name}');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.content span')?.textContent).toContain('${name} app is running!');
  });
});
`,
  };
};
